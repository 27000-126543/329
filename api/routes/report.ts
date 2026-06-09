import { Router, type Request, type Response } from 'express';
import { db } from '../db/store.js';
import type { ApiResponse, SimulationReport, SimulationTask, StressFieldPoint } from '../../shared/types.js';
import PDFDocument from 'pdfkit';

const router = Router();

router.get('/:taskId', async (req: Request, res: Response): Promise<void> => {
  const task = db.getById('tasks', req.params.taskId);
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' });
    return;
  }
  let report = db.getById('reports', req.params.taskId) as SimulationReport | undefined;
  if (!report) {
    if (
      ['completed', 'postdoc_approved', 'professor_approved', 'published'].includes(task.status)
    ) {
      report = generateReportData(task);
      db.insert('reports', task.id, report);
    } else {
      res.status(400).json({ success: false, error: '任务尚未完成，报告暂不可用' });
      return;
    }
  }
  const body: ApiResponse<{ report: SimulationReport; task: typeof task }> = {
    success: true,
    data: { report, task },
  };
  res.status(200).json(body);
});

interface ExportRequest {
  format?: 'json' | 'csv';
  segmentIds?: string[];
  stressSource?: 'principal' | 'shear' | 'coulomb';
  timeWindow?: { startStep: number; endStep: number };
}

type FilteredStressFieldPoint = Pick<StressFieldPoint, 'x' | 'y' | 'z'> &
  Partial<Pick<StressFieldPoint, 's1' | 's2' | 's3' | 'shear' | 'coulomb'>>;

router.post('/:taskId/export', async (req: Request, res: Response): Promise<void> => {
  const { format, segmentIds, stressSource, timeWindow }: ExportRequest = req.body;
  const finalFormat = (format ?? req.query.format ?? 'json') as 'json' | 'csv';
  const report = db.getById('reports', req.params.taskId) as SimulationReport | undefined;
  if (!report) {
    res.status(404).json({ success: false, error: '报告不存在' });
    return;
  }

  const filteredSlip = segmentIds && segmentIds.length > 0
    ? report.slipDistribution.filter((p) => segmentIds.includes(p.segmentId))
    : report.slipDistribution;

  const filteredMoments = timeWindow
    ? report.seismicMomentCurve.filter(
        (p) => p.timeStep >= timeWindow.startStep && p.timeStep <= timeWindow.endStep,
      )
    : report.seismicMomentCurve;

  const stressFieldKeys: (keyof Pick<StressFieldPoint, 's1' | 's2' | 's3' | 'shear' | 'coulomb'>)[] =
    stressSource === 'principal'
      ? ['s1', 's2', 's3']
      : stressSource === 'shear'
        ? ['shear']
        : stressSource === 'coulomb'
          ? ['coulomb']
          : ['s1', 's2', 's3', 'shear', 'coulomb'];

  const filteredStressField: FilteredStressFieldPoint[] = report.stressFieldData.map((p) => {
    const result: FilteredStressFieldPoint = { x: p.x, y: p.y, z: p.z };
    for (const k of stressFieldKeys) {
      (result as any)[k] = p[k];
    }
    return result;
  });

  const exportParams = {
    segmentIds: segmentIds ?? null,
    stressSource: stressSource ?? null,
    timeWindow: timeWindow ?? null,
  };

  if (finalFormat === 'csv') {
    const lines: string[] = [];

    lines.push('=== Stress Tensor Field ===');
    const stressHeader = ['x', 'y', 'z', ...stressFieldKeys].join(',');
    lines.push(stressHeader);
    for (const p of report.stressFieldData) {
      const row = [String(p.x), String(p.y), String(p.z), ...stressFieldKeys.map((k) => String(p[k]))];
      lines.push(row.join(','));
    }

    lines.push('');
    lines.push('=== Fault Slip Distribution ===');
    lines.push('distanceAlongFault,slipAmount,slipPotential,segmentId');
    for (const p of filteredSlip) {
      lines.push(`${p.distanceAlongFault},${p.slipAmount},${p.slipPotential},${p.segmentId}`);
    }

    if (timeWindow) {
      lines.push('');
      lines.push('=== Seismic Moment (filtered) ===');
      lines.push('timeStep,momentRate,cumulativeMoment');
      for (const p of filteredMoments) {
        lines.push(`${p.timeStep},${p.momentRate},${p.cumulativeMoment}`);
      }
    }

    const csv = lines.join('\n');
    const filenameParts = [`report-task-${req.params.taskId}`];
    if (segmentIds && segmentIds.length > 0) {
      const segShort = segmentIds.map((s) => s.replace(/^seg-/, '')).join('-');
      filenameParts.push(`seg${segShort}`);
    }
    if (stressSource) {
      filenameParts.push(stressSource);
    }
    if (timeWindow) {
      filenameParts.push(`t${timeWindow.startStep}-${timeWindow.endStep}`);
    }
    const filename = filenameParts.join('-') + '.csv';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
    return;
  }

  const exportData = {
    taskId: req.params.taskId,
    exportParams,
    stressField: filteredStressField,
    slipDistribution: filteredSlip,
    seismicMomentCurve: timeWindow ? filteredMoments : report.seismicMomentCurve,
  };
  const body: ApiResponse<typeof exportData> = { success: true, data: exportData };
  res.status(200).json(body);
});

router.get('/:taskId/pdf', async (req: Request, res: Response): Promise<void> => {
  const taskId = req.params.taskId;
  const task = db.getById('tasks', taskId) as SimulationTask | undefined;
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' });
    return;
  }
  let report = db.getById('reports', taskId) as SimulationReport | undefined;
  if (!report) {
    if (
      ['completed', 'postdoc_approved', 'professor_approved', 'published'].includes(task.status)
    ) {
      report = generateReportData(task);
      db.insert('reports', task.id, report);
    } else {
      res.status(400).json({ success: false, error: '任务尚未完成，报告暂不可用' });
      return;
    }
  }
  try {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report-${taskId}.pdf"`,
    );
    const doc = createPdfReport(task, report);
    doc.pipe(res);
  } catch (err) {
    console.error('PDF生成失败:', err);
    res.status(500).json({ success: false, error: 'PDF生成失败' });
  }
});

const FONT_DIR = 'C:\\Windows\\Fonts';
const FONT_REGULAR = `${FONT_DIR}\\msyh.ttc`;
const FONT_BOLD = `${FONT_DIR}\\msyhbd.ttc`;

function registerFonts(doc: PDFKit.PDFDocument): void {
  try {
    doc.registerFont('msyh', FONT_REGULAR);
    doc.registerFont('msyh-bold', FONT_BOLD);
  } catch {
    try {
      doc.registerFont('msyh', `${FONT_DIR}\\simsun.ttc`);
      doc.registerFont('msyh-bold', `${FONT_DIR}\\simsunb.ttf`);
    } catch {
      doc.registerFont('msyh', 'Helvetica');
      doc.registerFont('msyh-bold', 'Helvetica-Bold');
    }
  }
}

function statusText(status: string): string {
  const map: Record<string, string> = {
    pending_verify: '待审核',
    mesh_generating: '网格生成中',
    initializing: '初始化中',
    stress_computing: '应力计算中',
    slip_evaluating: '滑动评估中',
    completed: '已完成',
    rollback: '已回滚',
    postdoc_approved: '博士后已审批',
    professor_approved: '教授已审批',
    published: '已发布',
  };
  return map[status] ?? status;
}

function newPageIfNeeded(doc: PDFKit.PDFDocument, needed: number): void {
  if (doc.y + needed > doc.page.height - 60) {
    doc.addPage();
  }
}

function drawTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: (string | number)[][],
  colWidths: number[],
  startX: number,
): void {
  const rowHeight = 22;
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);

  doc.font('msyh-bold').fontSize(10);
  let x = startX;
  const headerY = doc.y;
  doc.rect(startX, headerY, tableWidth, rowHeight).fill('#e8edf3').stroke('#c5d0e0');
  for (let i = 0; i < headers.length; i++) {
    doc.fillColor('#1e293b').text(String(headers[i]), x + 6, headerY + 6, {
      width: colWidths[i] - 12,
      align: 'center',
    });
    x += colWidths[i];
  }
  doc.y = headerY + rowHeight;

  doc.font('msyh').fontSize(9);
  rows.forEach((row, idx) => {
    newPageIfNeeded(doc, rowHeight + 10);
    const y = doc.y;
    const bg = idx % 2 === 0 ? '#ffffff' : '#f6f8fb';
    x = startX;
    doc.rect(startX, y, tableWidth, rowHeight).fill(bg).stroke('#c5d0e0');
    for (let i = 0; i < row.length; i++) {
      doc.fillColor('#334155').text(String(row[i]), x + 6, y + 6, {
        width: colWidths[i] - 12,
        align: i === 0 ? 'left' : 'center',
      });
      x += colWidths[i];
    }
    doc.y = y + rowHeight;
  });
  doc.y += 6;
}

function buildCoverPage(doc: PDFKit.PDFDocument, task: SimulationTask): void {
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const cx = pageW / 2;

  doc.rect(0, 0, pageW, pageH * 0.42).fill('#1e3a5f');
  doc.rect(0, pageH * 0.42, pageW, 6).fill('#f59e0b');

  doc.fillColor('#ffffff');
  doc.font('msyh-bold').fontSize(34);
  doc.text('断层应力模拟分析平台', 60, pageH * 0.14, {
    width: pageW - 120,
    align: 'center',
  });

  doc.font('msyh').fontSize(15);
  doc.text('Fault Stress Simulation & Analysis Platform', 60, doc.y + 18, {
    width: pageW - 120,
    align: 'center',
  });

  doc.fillColor('#0f172a');
  doc.font('msyh-bold').fontSize(26);
  const taskY = pageH * 0.52;
  doc.text(task.name, 60, taskY, {
    width: pageW - 120,
    align: 'center',
  });

  doc.font('msyh').fontSize(13);
  doc.fillColor('#475569');
  doc.text(`断层：${task.faultName}`, 60, doc.y + 30, {
    width: pageW - 120,
    align: 'center',
  });
  doc.text(`任务编号：${task.id}`, 60, doc.y + 22, {
    width: pageW - 120,
    align: 'center',
  });
  doc.text(`创建人：${task.creatorName}`, 60, doc.y + 22, {
    width: pageW - 120,
    align: 'center',
  });

  const dateStr = new Date(task.createdAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.font('msyh-bold').fontSize(14);
  doc.fillColor('#1e3a5f');
  doc.text(`报告生成日期：${dateStr}`, 60, pageH - 110, {
    width: pageW - 120,
    align: 'center',
  });

  doc.font('msyh').fontSize(10);
  doc.fillColor('#94a3b8');
  doc.text('本报告由断层应力模拟分析平台自动生成', 60, pageH - 60, {
    width: pageW - 120,
    align: 'center',
  });
}

function buildSection1(doc: PDFKit.PDFDocument, task: SimulationTask): void {
  doc.addPage();
  const startX = 50;

  doc.font('msyh-bold').fontSize(18).fillColor('#1e3a5f');
  doc.text('一、任务概览', startX, doc.y);
  doc.moveTo(startX, doc.y + 4).lineTo(startX + 80, doc.y + 4).strokeColor('#f59e0b').lineWidth(2).stroke();
  doc.y += 16;

  doc.font('msyh-bold').fontSize(11).fillColor('#334155');
  const labels = [
    ['任务ID', task.id],
    ['断层名称', task.faultName],
    ['断层编号', task.faultId],
    ['创建人', task.creatorName],
    ['任务状态', statusText(task.status)],
    ['创建时间', new Date(task.createdAt).toLocaleString('zh-CN')],
  ];
  labels.forEach(([k, v]) => {
    newPageIfNeeded(doc, 28);
    doc.fillColor('#64748b').text(`${k}：`, startX, doc.y, { continued: true });
    doc.fillColor('#0f172a').font('msyh').text(v);
    doc.font('msyh-bold');
    doc.y += 4;
  });
  doc.y += 8;

  doc.font('msyh-bold').fontSize(13).fillColor('#1e3a5f');
  doc.text('边界条件（Boundary Conditions）', startX, doc.y);
  doc.y += 6;
  const bcHeaders = ['北向应力(MPa)', '东向应力(MPa)', '垂向应力(MPa)', '孔隙压力(MPa)', '温度(℃)'];
  const bcRows = [[
    task.boundaryConditions.northStress,
    task.boundaryConditions.eastStress,
    task.boundaryConditions.verticalStress,
    task.boundaryConditions.porePressure,
    task.boundaryConditions.temperature,
  ]];
  const bcWidths = [92, 92, 92, 92, 92];
  drawTable(doc, bcHeaders, bcRows, bcWidths, startX);
  doc.y += 8;

  doc.font('msyh-bold').fontSize(13).fillColor('#1e3a5f');
  doc.text('岩石力学参数（Rock Mechanics Parameters）', startX, doc.y);
  doc.y += 6;
  const rpHeaders = ['参数', '数值', '单位'];
  const rpRows: (string | number)[][] = [
    ['杨氏模量 (Young Modulus)', task.rockParams.youngModulus, 'GPa'],
    ['泊松比 (Poisson Ratio)', task.rockParams.poissonRatio, '-'],
    ['内聚力 (Cohesion)', task.rockParams.cohesion, 'MPa'],
    ['摩擦系数 (Friction Coef.)', task.rockParams.frictionCoefficient, '-'],
    ['剪胀角 (Dilation Angle)', task.rockParams.dilationAngle, '°'],
    ['抗拉强度 (Tensile Strength)', task.rockParams.tensileStrength, 'MPa'],
  ];
  const rpWidths = [200, 150, 100];
  drawTable(doc, rpHeaders, rpRows, rpWidths, startX);
}

function computeStats(arr: number[]): { min: number; max: number; mean: number } {
  if (arr.length === 0) return { min: 0, max: 0, mean: 0 };
  let min = arr[0];
  let max = arr[0];
  let sum = 0;
  for (const v of arr) {
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  return { min, max, mean: sum / arr.length };
}

function buildSection2(doc: PDFKit.PDFDocument, report: SimulationReport): void {
  doc.addPage();
  const startX = 50;

  doc.font('msyh-bold').fontSize(18).fillColor('#1e3a5f');
  doc.text('二、应力场数据摘要', startX, doc.y);
  doc.moveTo(startX, doc.y + 4).lineTo(startX + 80, doc.y + 4).strokeColor('#f59e0b').lineWidth(2).stroke();
  doc.y += 16;

  const s1Arr = report.stressFieldData.map((p) => p.s1);
  const s2Arr = report.stressFieldData.map((p) => p.s2);
  const s3Arr = report.stressFieldData.map((p) => p.s3);
  const shearArr = report.stressFieldData.map((p) => p.shear);
  const coulombArr = report.stressFieldData.map((p) => p.coulomb);

  const statData = [
    ['s1 (最大主应力, MPa)', computeStats(s1Arr)],
    ['s2 (中间主应力, MPa)', computeStats(s2Arr)],
    ['s3 (最小主应力, MPa)', computeStats(s3Arr)],
    ['shear (剪应力, MPa)', computeStats(shearArr)],
    ['coulomb (库仑应力, MPa)', computeStats(coulombArr)],
  ] as const;

  doc.font('msyh').fontSize(10).fillColor('#475569');
  doc.text(`基于 ${report.stressFieldData.length} 个空间采样点的应力场统计分析如下：`, startX, doc.y);
  doc.y += 10;

  const headers = ['应力分量', '最小值 (Min)', '最大值 (Max)', '平均值 (Mean)'];
  const rows: (string | number)[][] = statData.map(([name, s]) => [
    name,
    s.min.toFixed(2),
    s.max.toFixed(2),
    s.mean.toFixed(2),
  ]);
  const widths = [180, 100, 100, 100];
  drawTable(doc, headers, rows, widths, startX);

  doc.y += 10;
  doc.font('msyh-bold').fontSize(11).fillColor('#1e3a5f');
  doc.text('说明：', startX, doc.y);
  doc.font('msyh').fontSize(10).fillColor('#475569');
  const desc = [
    '• s1/s2/s3：三个主应力分量，反映地壳内部三维应力状态的基本特征；',
    '• shear：剪应力 = (s1 - s3) / 2，衡量断层发生剪切破裂的驱动力大小；',
    '• coulomb：库仑破裂应力 = shear - μ×(σn - P)，正值越高表示越接近破裂临界。',
  ];
  desc.forEach((d) => {
    newPageIfNeeded(doc, 20);
    doc.text(d, startX, doc.y);
    doc.y += 2;
  });
}

function buildSection3(doc: PDFKit.PDFDocument, report: SimulationReport): void {
  doc.addPage();
  const startX = 50;

  doc.font('msyh-bold').fontSize(18).fillColor('#1e3a5f');
  doc.text('三、断层滑动势分布', startX, doc.y);
  doc.moveTo(startX, doc.y + 4).lineTo(startX + 80, doc.y + 4).strokeColor('#f59e0b').lineWidth(2).stroke();
  doc.y += 16;

  const sorted = [...report.slipDistribution].sort((a, b) => b.slipPotential - a.slipPotential);
  const top10 = sorted.slice(0, 10);
  const maxSP = top10[0]?.slipPotential ?? 1;

  doc.font('msyh-bold').fontSize(13).fillColor('#1e3a5f');
  doc.text('3.1  Top 10 高风险段条形图（文字版）', startX, doc.y);
  doc.y += 8;

  doc.font('msyh').fontSize(9).fillColor('#334155');
  top10.forEach((seg, idx) => {
    newPageIfNeeded(doc, 24);
    const rank = String(idx + 1).padStart(2, '0');
    const barLen = Math.round((seg.slipPotential / maxSP) * 40);
    const bar = '█'.repeat(barLen) + '░'.repeat(40 - barLen);
    const level =
      seg.slipPotential >= 0.85 ? '极高' : seg.slipPotential >= 0.7 ? '高' : seg.slipPotential >= 0.5 ? '中' : '低';
    doc.text(
      `#${rank} ${seg.segmentId}  距起点${seg.distanceAlongFault.toFixed(1)}km  SP=${seg.slipPotential.toFixed(3)}  [${bar}]  风险：${level}`,
      startX,
      doc.y,
    );
    doc.y += 3;
  });
  doc.y += 10;

  doc.font('msyh-bold').fontSize(13).fillColor('#1e3a5f');
  doc.text('3.2  全段 20 段滑动势数值表', startX, doc.y);
  doc.y += 6;

  const headers = ['段编号', '沿断层距离(km)', '滑动量(m)', '滑动势 SP', '风险等级'];
  const rows: (string | number)[][] = report.slipDistribution.map((seg) => {
    const lv =
      seg.slipPotential >= 0.85 ? '极高' : seg.slipPotential >= 0.7 ? '高' : seg.slipPotential >= 0.5 ? '中' : '低';
    return [seg.segmentId, seg.distanceAlongFault.toFixed(1), seg.slipAmount.toFixed(3), seg.slipPotential.toFixed(3), lv];
  });
  const widths = [80, 110, 90, 90, 80];
  drawTable(doc, headers, rows, widths, startX);

  doc.y += 8;
  doc.font('msyh').fontSize(10).fillColor('#475569');
  doc.text(`高风险段（SP≥0.7）合计：${report.slipDistribution.filter((s) => s.slipPotential >= 0.7).length} 段，占比 ${(report.slipDistribution.filter((s) => s.slipPotential >= 0.7).length / report.slipDistribution.length * 100).toFixed(1)}%。`, startX, doc.y);
}

function buildSection4(doc: PDFKit.PDFDocument, report: SimulationReport): void {
  doc.addPage();
  const startX = 50;

  doc.font('msyh-bold').fontSize(18).fillColor('#1e3a5f');
  doc.text('四、地震矩释放与矩震级估算', startX, doc.y);
  doc.moveTo(startX, doc.y + 4).lineTo(startX + 80, doc.y + 4).strokeColor('#f59e0b').lineWidth(2).stroke();
  doc.y += 16;

  doc.font('msyh').fontSize(10).fillColor('#475569');
  doc.text('下表列出 M0 到 M30 共 31 个时间步的累积地震矩释放情况：', startX, doc.y);
  doc.y += 8;

  const headers = ['时间步', '矩释放率 (N·m/s)', '累积矩 M0 (N·m)'];
  const rows: (string | number)[][] = report.seismicMomentCurve.map((m) => [
    `M${m.timeStep}`,
    m.momentRate.toExponential(3),
    m.cumulativeMoment.toExponential(3),
  ]);
  const widths = [90, 170, 170];
  drawTable(doc, headers, rows, widths, startX);

  doc.y += 10;
  doc.font('msyh-bold').fontSize(12).fillColor('#1e3a5f');
  doc.text('矩震级 MW 估算', startX, doc.y);
  doc.y += 4;

  const totalM0 = report.summary.totalSeismicMoment;
  const mw = (2 / 3) * (Math.log10(totalM0) - 9.1);
  const mwFormatted = mw.toFixed(2);

  doc.font('msyh').fontSize(10).fillColor('#334155');
  doc.text('根据 Hanks & Kanamori (1979) 矩震级公式：', startX, doc.y);
  doc.y += 4;
  doc.font('msyh-bold').fillColor('#0f172a');
  doc.text('      MW  =  (2/3) × (log₁₀ M₀  −  9.1)       其中 M₀ 单位为 N·m', startX, doc.y);
  doc.y += 8;
  doc.font('msyh').fillColor('#334155');
  doc.text(`代入本模拟总累积地震矩 M₀ = ${totalM0.toExponential(3)} N·m，计算得：`, startX, doc.y);
  doc.y += 4;
  doc.font('msyh-bold').fontSize(14).fillColor('#b91c1c');
  doc.text(`      MW  ≈  ${mwFormatted}`, startX, doc.y);
  doc.y += 10;
  doc.font('msyh').fontSize(10).fillColor('#475569');

  let levelText = '';
  if (mw < 4) levelText = '微震（Micro）：仪器可记录，一般无感';
  else if (mw < 5) levelText = '小震（Minor/Light）：少数人有感，无破坏';
  else if (mw < 6) levelText = '中震（Moderate）：多数人有感，轻微破坏';
  else if (mw < 7) levelText = '强震（Strong）：普遍有感，中等破坏';
  else if (mw < 8) levelText = '大震（Major）：严重破坏，人员伤亡';
  else levelText = '特大地震（Great）：毁灭性破坏，大范围影响';

  doc.text(`震级等级判定：${levelText}。`, startX, doc.y);
  doc.y += 4;
  doc.text('注：本估算基于模拟计算的理论地震矩，实际地震还需考虑断层几何、破裂速度、刚度等诸多因素。', startX, doc.y);
}

function buildSection5(doc: PDFKit.PDFDocument, report: SimulationReport): void {
  doc.addPage();
  const startX = 50;

  doc.font('msyh-bold').fontSize(18).fillColor('#1e3a5f');
  doc.text('五、库仑应力演化特征', startX, doc.y);
  doc.moveTo(startX, doc.y + 4).lineTo(startX + 80, doc.y + 4).strokeColor('#f59e0b').lineWidth(2).stroke();
  doc.y += 16;

  doc.font('msyh').fontSize(10).fillColor('#475569');
  doc.text('下表列出 F0 到 F9 共 10 个时间步下，全场库仑应力变化 ΔCFS 的统计特征：', startX, doc.y);
  doc.y += 8;

  const frameStats = report.coulombEvolution.map((frame) => {
    const flat = frame.stressChangeData.flat();
    return computeStats(flat);
  });

  const headers = ['时间步', '均值 ΔCFS (MPa)', '最小值 (MPa)', '最大值 (MPa)', '极值范围'];
  const rows: (string | number)[][] = report.coulombEvolution.map((frame, idx) => {
    const s = frameStats[idx];
    const range = `[${s.min.toFixed(2)}, ${s.max.toFixed(2)}]`;
    return [`F${idx} (T=${frame.timeStep})`, s.mean.toFixed(3), s.min.toFixed(2), s.max.toFixed(2), range];
  });
  const widths = [110, 110, 100, 100, 130];
  drawTable(doc, headers, rows, widths, startX);

  doc.y += 12;
  doc.font('msyh-bold').fontSize(12).fillColor('#1e3a5f');
  doc.text('物理意义说明', startX, doc.y);
  doc.y += 4;

  doc.font('msyh').fontSize(10).fillColor('#334155');
  const notes = [
    '（1）库仑应力变化 ΔCFS 定义为：Δτ − μ′ × Δσn，其中 Δτ 为剪应力变化，Δσn 为正应力变化，μ′ 为有效摩擦系数。',
    '（2）ΔCFS > 0 表示该区域断层被"加载"，即接近破裂临界，地震危险性升高；ΔCFS < 0 表示被"卸载"，相对稳定。',
    '（3）从时间演化角度：若均值随时间步持续增大并转正，表明应力在断层上持续积累，进入临界破裂阶段的概率升高；',
    '      若均值振荡在 0 附近，说明应力场处于相对稳定调整状态。',
    '（4）极值范围反映应力异质性：极值跨度越大，说明断层上应力集中越不均匀，容易发生局部化失稳破裂；',
    '      结合空间分布可识别具体的危险成核区。',
    '（5）综合本报告第二、三、四章结论，建议重点关注滑动势 Top 3 区段对应的库仑应力演化序列，',
    '      若同时出现 ΔCFS 持续为正且滑动量递增，应视为重点预警区段。',
  ];
  notes.forEach((n) => {
    newPageIfNeeded(doc, 22);
    doc.text(n, startX, doc.y);
    doc.y += 3;
  });

  doc.y += 18;
  doc.moveTo(startX, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
  doc.y += 10;
  doc.font('msyh').fontSize(9).fillColor('#94a3b8');
  doc.text('—— 报告结束 ——', startX, doc.y, {
    width: doc.page.width - 100,
    align: 'center',
  });
}

function createPdfReport(task: SimulationTask, report: SimulationReport): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `模拟报告-${task.name}`, Author: '断层应力模拟分析平台' } });
  registerFonts(doc);

  buildCoverPage(doc, task);
  buildSection1(doc, task);
  buildSection2(doc, report);
  buildSection3(doc, report);
  buildSection4(doc, report);
  buildSection5(doc, report);

  doc.end();
  return doc;
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateReportData(task: { id: string; faultId: string; lengthKm?: number }): SimulationReport {
  const stressField: SimulationReport['stressFieldData'] = [];
  for (let i = 0; i < 50; i++) {
    stressField.push({
      x: +rand(-50, 50).toFixed(2),
      y: +rand(-30, 30).toFixed(2),
      z: +rand(-40, 0).toFixed(2),
      s1: +rand(60, 180).toFixed(2),
      s2: +rand(40, 120).toFixed(2),
      s3: +rand(20, 80).toFixed(2),
      shear: +rand(20, 80).toFixed(2),
      coulomb: +rand(-10, 15).toFixed(2),
    });
  }
  const slipDist: SimulationReport['slipDistribution'] = [];
  const nSeg = 20;
  for (let i = 0; i < nSeg; i++) {
    slipDist.push({
      distanceAlongFault: +((i / (nSeg - 1)) * (task.lengthKm ?? 100)).toFixed(1),
      slipAmount: +rand(0.1, 2.5).toFixed(3),
      slipPotential: +rand(0.2, 0.95).toFixed(3),
      segmentId: `seg-${String(i + 1).padStart(2, '0')}`,
    });
  }
  const moments: SimulationReport['seismicMomentCurve'] = [];
  for (let i = 0; i < 30; i++) {
    moments.push({
      timeStep: i,
      momentRate: +(1e15 + rand(0, 1e16)).toExponential(3),
      cumulativeMoment: +(1e17 + i * 3e15).toExponential(3),
    });
  }
  const coulombFrames: SimulationReport['coulombEvolution'] = [];
  for (let f = 0; f < 10; f++) {
    const frame: number[][] = [];
    for (let r = 0; r < 12; r++) {
      frame.push(Array.from({ length: 16 }, () => +rand(-8, 12).toFixed(2)));
    }
    coulombFrames.push({ timeStep: f * 3, stressChangeData: frame });
  }
  return {
    taskId: task.id,
    summary: {
      maxPrincipalStress: +rand(120, 250).toFixed(2),
      maxShearStress: +rand(55, 95).toFixed(2),
      totalSeismicMoment: +rand(1e17, 5e18).toExponential(3),
      maxSlipPotential: +rand(0.7, 0.98).toFixed(3),
      highRiskSegments: ['seg-05', 'seg-11', 'seg-17'].slice(0, Math.floor(rand(2, 4))),
    },
    stressFieldData: stressField,
    slipDistribution: slipDist,
    seismicMomentCurve: moments,
    coulombEvolution: coulombFrames,
  };
}

export default router;
