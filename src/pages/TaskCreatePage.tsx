import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Save,
  Play,
  Sparkles,
  Mountain,
  Settings2,
  Sliders,
  Layers,
  Gauge,
  AlertCircle,
  CheckCircle2,
  Info,
  FileText,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useStore from "@/store";

const faultOptions = [
  { code: "SAF", name: "圣安德烈斯断层", segments: 24, default: true },
  { code: "HY", name: "海原断裂带", segments: 18 },
  { code: "LMS", name: "龙门山断裂带", segments: 15 },
  { code: "XSH", name: "鲜水河断裂带", segments: 12 },
  { code: "TL", name: "郯庐断裂带", segments: 32 },
  { code: "HH", name: "红河断裂带", segments: 22 },
  { code: "QLS", name: "祁连山北缘断裂", segments: 14 },
  { code: "XJ", name: "小江断裂带", segments: 18 },
  { code: "ANH", name: "安宁河断裂带", segments: 11 },
  { code: "CD", name: "则木河断裂带", segments: 8 },
];

const modelTemplates = [
  {
    id: "standard",
    name: "标准粘滑模型",
    desc: "适用于大多数走滑断层场景的默认模型",
    recommended: true,
    friction: 0.58,
    porePressure: 0.32,
    steps: 8400,
    resolution: 500,
  },
  {
    id: "high_precision",
    name: "高精度模型",
    desc: "网格加密+小时间步长，适合关键区域精细模拟",
    recommended: false,
    friction: 0.6,
    porePressure: 0.34,
    steps: 16800,
    resolution: 250,
  },
  {
    id: "coupled",
    name: "多场耦合模型",
    desc: "热-流-固三场耦合，适合深源地震研究",
    recommended: false,
    friction: 0.56,
    porePressure: 0.36,
    steps: 12000,
    resolution: 400,
  },
];

const priorityOptions = [
  { value: "high", label: "高优先级", desc: "插队优先执行，适合紧急任务", color: "text-rose-600 bg-rose-50 border-rose-200" },
  { value: "normal", label: "中优先级", desc: "按队列顺序执行，默认选项", color: "text-sky-600 bg-sky-50 border-sky-200" },
  { value: "low", label: "低优先级", desc: "空闲时执行，适合扫描类任务", color: "text-slate-600 bg-slate-50 border-slate-200" },
];

export default function TaskCreatePage() {
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);
  const user = currentUser ? { ...currentUser, displayName: currentUser.name } : null;
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    faultCode: "SAF",
    templateId: "standard",
    priority: "normal",
    steps: 8400,
    resolution: 500,
    friction: 0.58,
    porePressure: 0.32,
    depthMin: 0,
    depthMax: 40,
    autoPause: true,
    deviationThreshold: 20,
    description: "",
  });

  const selectedFault = faultOptions.find((f) => f.code === form.faultCode)!;
  const selectedTemplate = modelTemplates.find((t) => t.id === form.templateId)!;

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const applyTemplate = (templateId: string) => {
    const t = modelTemplates.find((m) => m.id === templateId);
    if (!t) return;
    setForm((prev) => ({
      ...prev,
      templateId,
      steps: t.steps,
      resolution: t.resolution,
      friction: t.friction,
      porePressure: t.porePressure,
    }));
  };

  const estimatedHours = (form.steps / 8400) * (500 / form.resolution) * 6.5;
  const estimatedGpu = Math.ceil((form.steps * form.resolution) / 500000);

  const canNext = step === 1 ? form.name.trim().length >= 4 : true;

  const handleSubmit = async (startNow: boolean) => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    navigate("/tasks", {
      state: {
        toast: {
          type: "success",
          message: startNow ? "任务已提交并开始执行" : "任务已保存至队列",
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-5 lg:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            to="/tasks"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            返回任务列表
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-violet-50 to-sky-50">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">创建数值模拟任务</h1>
                  <p className="text-sm text-slate-500 mt-1">
                    配置断层参数、计算模型与物理本构，提交后将按优先级调度执行
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">创建人</div>
                <div className="text-sm font-medium text-slate-800 mt-0.5">
                  {user?.name || "当前用户"}
                </div>
                <div className="text-[11px] text-slate-500">{user?.role}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6">
              {[
                { n: 1, label: "基础信息" },
                { n: 2, label: "参数配置" },
                { n: 3, label: "确认提交" },
              ].map((s) => (
                <div key={s.n} className="flex-1 flex items-center gap-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all",
                      step >= s.n
                        ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md"
                        : "bg-white border border-slate-200 text-slate-400"
                    )}
                  >
                    {step > s.n ? <CheckCircle2 className="w-5 h-5" /> : s.n}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      step >= s.n ? "text-slate-800" : "text-slate-400"
                    )}
                  >
                    {s.label}
                  </span>
                  {s.n < 3 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 rounded-full mx-2",
                        step > s.n ? "bg-indigo-400" : "bg-slate-200"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-8">
            {step === 1 && (
              <div className="space-y-8">
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    <h2 className="font-semibold text-slate-800">基本信息</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        任务名称 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        placeholder="例如：龙门山断裂带南段 2026Q2 大震情景模拟"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      />
                      <div className="flex justify-between mt-1.5 text-[11px]">
                        <span className="text-slate-500">建议包含：断层名 + 时间/目的</span>
                        <span className={form.name.length >= 4 ? "text-emerald-500" : "text-slate-400"}>
                          {form.name.length} 字
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        优先级
                      </label>
                      <div className="space-y-2">
                        {priorityOptions.map((p) => (
                          <label
                            key={p.value}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                              form.priority === p.value
                                ? cn(p.color, "border-2")
                                : "border-slate-200 hover:bg-slate-50"
                            )}
                          >
                            <input
                              type="radio"
                              checked={form.priority === p.value}
                              onChange={() => update("priority", p.value as any)}
                              className="mt-0.5 accent-indigo-600"
                            />
                            <div>
                              <div className="text-sm font-medium text-slate-800">{p.label}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{p.desc}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        任务描述（可选）
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(e) => update("description", e.target.value)}
                        rows={6}
                        placeholder="说明研究目的、特殊边界条件、预期成果等..."
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Mountain className="w-5 h-5 text-emerald-500" />
                    <h2 className="font-semibold text-slate-800">选择目标断层</h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {faultOptions.map((f) => (
                      <button
                        key={f.code}
                        onClick={() => update("faultCode", f.code)}
                        className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all hover:-translate-y-0.5",
                          form.faultCode === f.code
                            ? "border-indigo-500 bg-indigo-50/60 shadow-md"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold",
                              form.faultCode === f.code
                                ? "bg-indigo-500 text-white"
                                : "bg-slate-100 text-slate-600"
                            )}
                          >
                            {f.code}
                          </span>
                          {f.default && (
                            <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              常用
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-slate-800 mb-1">{f.name}</div>
                        <div className="text-[11px] text-slate-500">{f.segments} 个分段</div>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings2 className="w-5 h-5 text-violet-500" />
                      <h2 className="font-semibold text-slate-800">模型模板</h2>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 text-violet-600 text-xs border border-violet-200">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI 已根据断层特征推荐
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {modelTemplates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => applyTemplate(t.id)}
                        className={cn(
                          "p-5 rounded-2xl border-2 text-left transition-all hover:-translate-y-0.5 relative",
                          form.templateId === t.id
                            ? "border-violet-500 bg-violet-50/40 shadow-lg shadow-violet-500/10"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        )}
                      >
                        {t.recommended && (
                          <span className="absolute -top-2.5 right-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow">
                            <Sparkles className="w-3 h-3" /> 推荐
                          </span>
                        )}
                        <div className="font-bold text-slate-800 mb-1">{t.name}</div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">{t.desc}</p>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 rounded-lg bg-slate-50">
                            <div className="text-slate-400">时间步</div>
                            <div className="font-mono font-semibold text-slate-700">{t.steps.toLocaleString()}</div>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50">
                            <div className="text-slate-400">分辨率</div>
                            <div className="font-mono font-semibold text-slate-700">{t.resolution}m</div>
                          </div>
                        </div>
                        {form.templateId === t.id && (
                          <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-sky-500" />
                    <h2 className="font-semibold text-slate-800">物理参数微调</h2>
                    <span className="text-xs text-slate-400">基于模板默认值调整</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-slate-700">摩擦系数 μ</label>
                          <span className="text-sm font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {form.friction.toFixed(3)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.4"
                          max="0.8"
                          step="0.005"
                          value={form.friction}
                          onChange={(e) => update("friction", parseFloat(e.target.value))}
                          className="w-full accent-indigo-500"
                        />
                        <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                          <span>0.400</span>
                          <span>0.600</span>
                          <span>0.800</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-slate-700">孔隙压力系数 λ</label>
                          <span className="text-sm font-mono font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">
                            {form.porePressure.toFixed(3)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="0.5"
                          step="0.005"
                          value={form.porePressure}
                          onChange={(e) => update("porePressure", parseFloat(e.target.value))}
                          className="w-full accent-cyan-500"
                        />
                        <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                          <span>0.200</span>
                          <span>0.350</span>
                          <span>0.500</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">模拟步数</label>
                          <input
                            type="number"
                            value={form.steps}
                            onChange={(e) => update("steps", parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">网格分辨率 (m)</label>
                          <input
                            type="number"
                            value={form.resolution}
                            onChange={(e) => update("resolution", parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">起始深度 (km)</label>
                          <input
                            type="number"
                            value={form.depthMin}
                            onChange={(e) => update("depthMin", parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">终止深度 (km)</label>
                          <input
                            type="number"
                            value={form.depthMax}
                            onChange={(e) => update("depthMax", parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-amber-500" />
                    <h2 className="font-semibold text-slate-800">运行保护机制</h2>
                  </div>
                  <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-4">
                    <label className="flex items-start justify-between cursor-pointer group">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={form.autoPause}
                          onChange={(e) => update("autoPause", e.target.checked)}
                          className="mt-0.5 w-5 h-5 rounded accent-amber-500"
                        />
                        <div>
                          <div className="text-sm font-medium text-slate-800">偏差自动暂停</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            当模拟结果与观测值偏差超过阈值时，自动暂停任务并触发预警，避免无效计算
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded">
                        推荐开启
                      </span>
                    </label>

                    {form.autoPause && (
                      <div className="pl-8 space-y-3 pt-1">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700">暂停阈值</label>
                            <span className="text-sm font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                              {form.deviationThreshold}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="50"
                            value={form.deviationThreshold}
                            onChange={(e) => update("deviationThreshold", parseInt(e.target.value))}
                            className="w-full accent-rose-500"
                          />
                          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                            <span>严格 5%</span>
                            <span>默认 20%</span>
                            <span>宽松 50%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 via-sky-50 to-indigo-50 border border-emerald-200/60">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <h2 className="text-lg font-bold text-slate-800">配置信息已就绪</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {[
                      { label: "任务名称", value: form.name || "（未填写）", warn: !form.name },
                      { label: "目标断层", value: `${selectedFault.name} (${selectedFault.code})` },
                      { label: "优先级", value: priorityOptions.find((p) => p.value === form.priority)?.label || "-" },
                      { label: "计算模型", value: selectedTemplate.name },
                      { label: "模拟步数", value: `${form.steps.toLocaleString()} 步`, unit: "" },
                      { label: "网格分辨率", value: `${form.resolution} m` },
                      { label: "摩擦系数 μ", value: form.friction.toFixed(3) },
                      { label: "孔隙压力 λ", value: form.porePressure.toFixed(3) },
                      { label: "深度范围", value: `${form.depthMin} ~ ${form.depthMax} km` },
                      { label: "偏差保护", value: form.autoPause ? `开启 (${form.deviationThreshold}%)` : "关闭" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start justify-between py-2 border-b border-white/60 last:border-0">
                        <span className="text-sm text-slate-500">{item.label}</span>
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            item.warn ? "text-rose-600" : "text-slate-800"
                          )}
                        >
                          {item.value}
                          {item.warn && <AlertCircle className="w-3.5 h-3.5 inline ml-1" />}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      预计计算时长
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {estimatedHours.toFixed(1)}<span className="text-sm text-slate-500 ml-1">机时</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">约 {(estimatedHours / 8).toFixed(1)} 个工作日</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      GPU 资源预估
                    </div>
                    <div className="text-2xl font-bold text-indigo-600">
                      {estimatedGpu}<span className="text-sm text-slate-500 ml-1">卡</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">队列位置: 第 {form.priority === "high" ? "1~3" : form.priority === "normal" ? "4~10" : "10+"} 位</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                    <div className="text-xs text-white/70 mb-1 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" />
                      完成后通知
                    </div>
                    <div className="text-base font-semibold leading-tight mt-2">
                      站内消息 + 邮件 + 短信
                    </div>
                    <div className="text-[11px] text-white/60 mt-1">可在系统设置中修改通知渠道</div>
                  </div>
                </div>

                {form.description && (
                  <div className="p-5 rounded-2xl bg-white border border-slate-200">
                    <div className="text-sm font-medium text-slate-700 mb-2">任务描述</div>
                    <p className="text-sm text-slate-600 leading-relaxed">{form.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
                step === 1
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-600 hover:bg-white hover:border-slate-200 border border-transparent"
              )}
            >
              ← 上一步
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep((s) => Math.min(3, s + 1))}
                disabled={!canNext}
                className={cn(
                  "px-8 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  canNext
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}
              >
                下一步 →
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting || !form.name}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
                    !form.name || submitting
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                  )}
                >
                  <Save className="w-4 h-4" />
                  {submitting ? "保存中..." : "保存至队列"}
                </button>
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={submitting || !form.name}
                  className={cn(
                    "px-8 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-md",
                    !form.name || submitting
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg hover:-translate-y-0.5"
                  )}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      提交并立即执行
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
