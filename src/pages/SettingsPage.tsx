import { useState } from "react";
import {
  Settings as SettingsIcon, Users, Shield, Bell, Cpu, Plus, MoreVertical, Check, X,
  UserPlus, Trash2, Edit3, Search, Save, AlertTriangle, AlertOctagon, AlertCircle, Database, Clock, Cloud, Activity } from "lucide-react";

type TabKey = "users" | "thresholds" | "system";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "首席地震学家" | "研究员" | "分析师" | "工程师" | "管理员";
  enabled: boolean;
  lastLogin: string;
  createdAt: string;
  tasks: number;
};

const initialUsers: UserRow[] = [
  { id: "U-001", name: "张明远", email: "zhang.chief@seismo.cn", role: "首席地震学家", enabled: true, lastLogin: "2026-06-09 08:32", createdAt: "2023-01-15", tasks: 156 },
  { id: "U-002", name: "李思琪", email: "li.research@seismo.cn", role: "研究员", enabled: true, lastLogin: "2026-06-08 17:10", createdAt: "2023-03-20", tasks: 98 },
  { id: "U-003", name: "王晓峰", email: "wang.analyst@seismo.cn", role: "分析师", enabled: true, lastLogin: "2026-06-09 09:45", createdAt: "2024-02-11", tasks: 210 },
  { id: "U-004", name: "赵志强", email: "zhao.engineer@seismo.cn", role: "工程师", enabled: true, lastLogin: "2026-06-07 14:22", createdAt: "2024-05-08", tasks: 342 },
  { id: "U-005", name: "陈雨桐", email: "chen.analyst@seismo.cn", role: "分析师", enabled: true, lastLogin: "2026-06-06 11:05", createdAt: "2024-07-22", tasks: 87 },
  { id: "U-006", name: "刘建国", email: "liu.admin@seismo.cn", role: "管理员", enabled: true, lastLogin: "2026-06-05 16:38", createdAt: "2023-01-10", tasks: 76 },
  { id: "U-007", name: "周雅雯", email: "zhou.research@seismo.cn", role: "研究员", enabled: false, lastLogin: "2026-04-12 10:18", createdAt: "2023-09-14", tasks: 45 },
];

const roleStyle: Record<UserRow["role"], string> = {
  "首席地震学家": "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-200",
  "研究员": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "分析师": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "工程师": "bg-sky-50 text-sky-700 border-sky-200",
  "管理员": "bg-violet-50 text-violet-700 border-violet-200",
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("users");
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [userSearch, setUserSearch] = useState("");

  const [thresholds, setThresholds] = useState({
    level1: { name: "一级预警（红）", prob: 80, mag: 7.0, deviation: 25, timeWindow: 72, sms: true, email: true, popup: true, sound: true },
    level2: { name: "二级预警（橙）", prob: 60, mag: 6.5, deviation: 20, timeWindow: 168, sms: true, email: true, popup: true, sound: false },
    level3: { name: "三级预警（黄）", prob: 40, mag: 6.0, deviation: 15, timeWindow: 720, sms: false, email: true, popup: true, sound: false },
  });

  const [sysParams, setSysParams] = useState({
    simulationConcurrency: 8,
    taskTimeout: 3600,
    autoPauseDeviation: 20,
    dataRetention: 365,
    backupInterval: 24,
    cacheTTL: 7200,
    defaultStressResolution: 500,
    maxGridCells: 500000,
    echartTheme: "light",
    enableAutoRec: true,
    enableDeviationCheck: true,
    enableCache: true,
  });

  const tabs = [
    { key: "users" as TabKey, label: "用户管理", icon: Users },
    { key: "thresholds" as TabKey, label: "预警阈值配置", icon: Bell },
    { key: "system" as TabKey, label: "系统参数", icon: Cpu },
  ];

  const filteredUsers = users.filter(u =>
    u.name.includes(userSearch) || u.email.includes(userSearch) || u.role.includes(userSearch)
  );

  function toggleUser(id: string) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, enabled: !u.enabled } : u));
  }

  function renderUsers() {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
              placeholder="搜索用户名、邮箱、角色..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium rounded-lg shadow hover:shadow-lg transition-all">
            <UserPlus className="w-4 h-4" />添加用户
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">用户</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">角色</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">状态</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">任务数</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">最近登录</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">创建时间</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                        user.role === "首席地震学家" ? "bg-gradient-to-br from-amber-400 to-orange-500" :
                        user.role === "研究员" ? "bg-gradient-to-br from-indigo-400 to-blue-500" :
                        user.role === "分析师" ? "bg-gradient-to-br from-emerald-400 to-teal-500" :
                        user.role === "工程师" ? "bg-gradient-to-br from-sky-400 to-cyan-500" :
                        "bg-gradient-to-br from-violet-400 to-purple-500"
                      }`}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{user.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border ${roleStyle[user.role]}`}>
                      <Shield className="w-3 h-3" />{user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleUser(user.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                        user.enabled ? "bg-emerald-500" : "bg-slate-300"
                      }`}>
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform ${
                        user.enabled ? "translate-x-5" : "translate-x-0.5"
                      }`} />
                    </button>
                    <span className={`ml-2 text-xs font-medium ${user.enabled ? "text-emerald-600" : "text-slate-400"}`}>
                      {user.enabled ? "启用" : "禁用"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-800">{user.tasks}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.lastLogin}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{user.createdAt}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
          <span>共 {filteredUsers.length} 位用户，{filteredUsers.filter(u => u.enabled).length} 位已启用</span>
          <span className="inline-flex items-center gap-1">
            <Shield className="w-3 h-3" />仅管理员可修改用户权限
          </span>
        </div>
      </div>
    );
  }

  function levelIcon(level: number) {
    if (level === 1) return <AlertOctagon className="w-5 h-5" />;
    if (level === 2) return <AlertTriangle className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  }

  function levelCardStyle(level: number) {
    if (level === 1) return "from-red-500 to-rose-600 border-red-300";
    if (level === 2) return "from-orange-500 to-amber-600 border-orange-300";
    return "from-yellow-500 to-amber-500 border-yellow-300";
  }

  function renderThresholds() {
    return (
      <div className="space-y-5">
        {(Object.entries(thresholds) as [keyof typeof thresholds, typeof thresholds.level1][]).map(([key, cfg], idx) => {
          const levelNum = idx + 1;
          return (
            <div key={key} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className={`px-6 py-4 bg-gradient-to-r ${levelCardStyle(levelNum)} flex items-center justify-between`}>
                <div className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    {levelIcon(levelNum)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{cfg.name}</h3>
                    <p className="text-xs text-white/80">阈值越高触发越严格，通知渠道更全面</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-white/20 backdrop-blur text-white text-xs font-bold rounded-full border border-white/30">
                  LEVEL {levelNum}
                </span>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">破裂概率阈值 (%)</label>
                  <input type="number" min="0" max="100" value={cfg.prob}
                    onChange={e => setThresholds(prev => ({
                      ...prev, [key]: { ...cfg, prob: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  <div className="text-xs text-slate-500 mt-1">模拟破裂概率 ≥ 此值触发</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">震级下限 (M)</label>
                  <input type="number" step="0.1" min="3" max="10" value={cfg.mag}
                    onChange={e => setThresholds(prev => ({
                      ...prev, [key]: { ...cfg, mag: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  <div className="text-xs text-slate-500 mt-1">预估震级 ≥ 此值触发</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">偏差阈值 (%)</label>
                  <input type="number" min="0" max="100" value={cfg.deviation}
                    onChange={e => setThresholds(prev => ({
                      ...prev, [key]: { ...cfg, deviation: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  <div className="text-xs text-slate-500 mt-1">观测偏差 ≥ 此值触发</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">预警时间窗 (小时)</label>
                  <input type="number" min="1" value={cfg.timeWindow}
                    onChange={e => setThresholds(prev => ({
                      ...prev, [key]: { ...cfg, timeWindow: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  <div className="text-xs text-slate-500 mt-1">统计窗口长度</div>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                <div className="text-sm font-semibold text-slate-700 mb-3">通知渠道</div>
                <div className="flex flex-wrap gap-5">
                  {[
                    { k: "sms", label: "短信通知", desc: "发送至注册手机" },
                    { k: "email", label: "邮件通知", desc: "发送至注册邮箱" },
                    { k: "popup", label: "弹窗提示", desc: "前端实时推送" },
                    { k: "sound", label: "声音警报", desc: "系统蜂鸣提示" },
                  ].map(item => (
                    <label key={item.k} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition min-w-[180px]">
                      <input type="checkbox"
                        checked={(cfg as Record<string, unknown>)[item.k] as boolean}
                        onChange={e => setThresholds(prev => ({
                          ...prev, [key]: { ...cfg, [item.k]: e.target.checked }
                        }))}
                        className="mt-0.5 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                      <div>
                        <div className="text-sm font-medium text-slate-800">{item.label}</div>
                        <div className="text-xs text-slate-500">{item.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        <div className="flex justify-end">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium rounded-xl shadow hover:shadow-lg transition-all">
            <Save className="w-4 h-4" />保存阈值配置
          </button>
        </div>
      </div>
    );
  }

  function renderSystem() {
    const sysGroups = [
      {
        title: "模拟计算配置", icon: Activity, color: "from-indigo-500 to-blue-600",
        items: [
          { k: "simulationConcurrency", label: "最大并发任务数", unit: "个", type: "number" },
          { k: "taskTimeout", label: "单任务超时", unit: "秒", type: "number" },
          { k: "autoPauseDeviation", label: "自动暂停偏差阈值", unit: "%", type: "number" },
          { k: "defaultStressResolution", label: "应力场默认分辨率", unit: "m", type: "number" },
          { k: "maxGridCells", label: "最大网格单元数", unit: "", type: "number" },
        ] as const
      },
      {
        title: "数据与存储配置", icon: Database, color: "from-emerald-500 to-teal-600",
        items: [
          { k: "dataRetention", label: "数据保留周期", unit: "天", type: "number" },
          { k: "backupInterval", label: "自动备份间隔", unit: "小时", type: "number" },
          { k: "cacheTTL", label: "缓存过期时间", unit: "秒", type: "number" },
          { k: "echartTheme", label: "图表默认主题", unit: "", type: "select", options: ["light", "dark", "auto"] },
        ] as const
      },
      {
        title: "系统功能开关", icon: Cloud, color: "from-amber-500 to-orange-600",
        items: [
          { k: "enableAutoRec", label: "启用智能推荐引擎", desc: "自动生成参数方案" },
          { k: "enableDeviationCheck", label: "启用偏差实时检测", desc: "触发自动暂停保护" },
          { k: "enableCache", label: "启用结果缓存", desc: "加速重复计算任务" },
        ] as const
      },
    ];

    return (
      <div className="space-y-5">
        {sysGroups.map(group => (
          <div key={group.title} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className={`px-6 py-4 bg-gradient-to-r ${group.color} flex items-center gap-3 text-white`}>
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <group.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">{group.title}</h3>
                <p className="text-xs text-white/80">调整后立即生效，建议谨慎修改</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {group.items.map((item: any) => (
                <div key={item.k}>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{item.label}</label>
                  {item.type === "number" && (
                    <div className="relative">
                      <input type="number" value={(sysParams as Record<string, unknown>)[item.k] as number}
                        onChange={e => setSysParams(prev => ({
                          ...prev, [item.k]: parseInt(e.target.value) || 0
                        }))}
                        className="w-full px-3 py-2 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      {item.unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{item.unit}</span>}
                    </div>
                  )}
                  {item.type === "select" && (
                    <select value={(sysParams as Record<string, unknown>)[item.k] as string}
                      onChange={e => setSysParams(prev => ({ ...prev, [item.k]: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                      {item.options?.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                  {!item.type && (
                    <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                      <div>
                        <div className="text-sm font-medium text-slate-800">{item.label}</div>
                        {item.desc && <div className="text-xs text-slate-500">{item.desc}</div>}
                      </div>
                      <button type="button" onClick={() => setSysParams(prev => ({
                        ...prev, [item.k]: !(prev as Record<string, unknown>)[item.k] as boolean
                      }))}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                          (sysParams as Record<string, unknown>)[item.k] ? "bg-emerald-500" : "bg-slate-300"
                        }`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                          (sysParams as Record<string, unknown>)[item.k] ? "translate-x-5" : "translate-x-0.5"
                        }`} />
                      </button>
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex justify-end gap-3">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition">
            恢复默认
          </button>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium rounded-xl shadow hover:shadow-lg transition-all">
            <Save className="w-4 h-4" />保存系统参数
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl shadow-lg">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">系统设置</h1>
            <p className="text-sm text-slate-500">配置用户权限、预警策略和系统运行参数</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "users" && renderUsers()}
        {activeTab === "thresholds" && renderThresholds()}
        {activeTab === "system" && renderSystem()}
      </div>
    </div>
  );
}
