import { Router, type Request, type Response } from 'express';
import { db } from '../db/store.js';
import type { ApiResponse, SimulationReport, SimulationTask } from '../../shared/types.js';
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
