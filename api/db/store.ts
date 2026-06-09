import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  User,
  SimulationTask,
  Alert,
  ApprovalRecord,
  Fault,
  DeviationRecord,
  ParamRecommendation,
  DailyStats,
  MonitorDataPoint,
  SimulationReport,
} from '../../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface DatabaseSchema {
  users: Map<string, User>;
  tasks: Map<string, SimulationTask>;
  alerts: Map<string, Alert>;
  approvals: Map<string, ApprovalRecord>;
  faults: Map<string, Fault>;
  deviations: Map<string, DeviationRecord>;
  recommendations: Map<string, ParamRecommendation>;
  dailyStats: Map<string, DailyStats>;
  monitorPoints: Map<string, MonitorDataPoint[]>;
  reports: Map<string, SimulationReport>;
}

export type TableName = keyof DatabaseSchema;

class DataStore {
  private data: DatabaseSchema;
  private persistTimer: NodeJS.Timeout | null = null;
  private dirty = false;

  constructor() {
    this.data = {
      users: new Map(),
      tasks: new Map(),
      alerts: new Map(),
      approvals: new Map(),
      faults: new Map(),
      deviations: new Map(),
      recommendations: new Map(),
      dailyStats: new Map(),
      monitorPoints: new Map(),
      reports: new Map(),
    };
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private serialize(): Record<string, unknown> {
    return {
      users: Array.from(this.data.users.entries()),
      tasks: Array.from(this.data.tasks.entries()),
      alerts: Array.from(this.data.alerts.entries()),
      approvals: Array.from(this.data.approvals.entries()),
      faults: Array.from(this.data.faults.entries()),
      deviations: Array.from(this.data.deviations.entries()),
      recommendations: Array.from(this.data.recommendations.entries()),
      dailyStats: Array.from(this.data.dailyStats.entries()),
      monitorPoints: Array.from(this.data.monitorPoints.entries()),
      reports: Array.from(this.data.reports.entries()),
    };
  }

  private deserialize(raw: Record<string, unknown>): void {
    const loadMap = <K, V>(arr: [K, V][] | undefined): Map<K, V> => {
      const m = new Map<K, V>();
      if (Array.isArray(arr)) {
        for (const [k, v] of arr) {
          m.set(k, v);
        }
      }
      return m;
    };

    this.data.users = loadMap(raw.users as [string, User][]);
    this.data.tasks = loadMap(raw.tasks as [string, SimulationTask][]);
    this.data.alerts = loadMap(raw.alerts as [string, Alert][]);
    this.data.approvals = loadMap(raw.approvals as [string, ApprovalRecord][]);
    this.data.faults = loadMap(raw.faults as [string, Fault][]);
    this.data.deviations = loadMap(raw.deviations as [string, DeviationRecord][]);
    this.data.recommendations = loadMap(raw.recommendations as [string, ParamRecommendation][]);
    this.data.dailyStats = loadMap(raw.dailyStats as [string, DailyStats][]);
    this.data.monitorPoints = loadMap(raw.monitorPoints as [string, MonitorDataPoint[]][]);
    this.data.reports = loadMap(raw.reports as [string, SimulationReport][]);
  }

  loadFromDisk(): boolean {
    this.ensureDataDir();
    if (!fs.existsSync(DB_FILE)) {
      return false;
    }
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const raw = JSON.parse(content) as Record<string, unknown>;
      this.deserialize(raw);
      return true;
    } catch (err) {
      console.error('[DataStore] Failed to load DB:', err);
      return false;
    }
  }

  saveToDisk(): void {
    this.ensureDataDir();
    try {
      const content = JSON.stringify(this.serialize(), null, 2);
      fs.writeFileSync(DB_FILE, content, 'utf-8');
      this.dirty = false;
    } catch (err) {
      console.error('[DataStore] Failed to save DB:', err);
    }
  }

  private markDirty(): void {
    this.dirty = true;
    if (!this.persistTimer) {
      this.persistTimer = setTimeout(() => {
        this.persistTimer = null;
        if (this.dirty) {
          this.saveToDisk();
        }
      }, 500);
    }
  }

  getTable<K extends TableName>(name: K): DatabaseSchema[K] {
    return this.data[name];
  }

  getAll<K extends TableName>(name: K): Array<DatabaseSchema[K] extends Map<string, infer V> ? V : never> {
    const map = this.data[name] as Map<string, unknown>;
    return Array.from(map.values()) as Array<
      DatabaseSchema[K] extends Map<string, infer V> ? V : never
    >;
  }

  getById<K extends TableName>(
    name: K,
    id: string,
  ): DatabaseSchema[K] extends Map<string, infer V> ? V | undefined : never {
    const map = this.data[name] as Map<string, unknown>;
    return map.get(id) as DatabaseSchema[K] extends Map<string, infer V> ? V | undefined : never;
  }

  insert<K extends TableName>(
    name: K,
    id: string,
    value: DatabaseSchema[K] extends Map<string, infer V> ? V : never,
  ): void {
    const map = this.data[name] as Map<string, unknown>;
    map.set(id, value);
    this.markDirty();
  }

  update<K extends TableName>(
    name: K,
    id: string,
    updater: (
      prev: DatabaseSchema[K] extends Map<string, infer V> ? V : never,
    ) => DatabaseSchema[K] extends Map<string, infer V> ? V : never,
  ): boolean {
    const map = this.data[name] as Map<string, unknown>;
    const prev = map.get(id);
    if (!prev) return false;
    map.set(id, updater(prev as DatabaseSchema[K] extends Map<string, infer V> ? V : never));
    this.markDirty();
    return true;
  }

  remove<K extends TableName>(name: K, id: string): boolean {
    const map = this.data[name] as Map<string, unknown>;
    const existed = map.delete(id);
    if (existed) this.markDirty();
    return existed;
  }

  find<K extends TableName>(
    name: K,
    predicate: (
      item: DatabaseSchema[K] extends Map<string, infer V> ? V : never,
      id: string,
    ) => boolean,
  ): Array<DatabaseSchema[K] extends Map<string, infer V> ? V : never> {
    const map = this.data[name] as Map<string, unknown>;
    const results: unknown[] = [];
    map.forEach((value, key) => {
      if (
        predicate(
          value as DatabaseSchema[K] extends Map<string, infer V> ? V : never,
          key,
        )
      ) {
        results.push(value);
      }
    });
    return results as Array<DatabaseSchema[K] extends Map<string, infer V> ? V : never>;
  }

  findOne<K extends TableName>(
    name: K,
    predicate: (
      item: DatabaseSchema[K] extends Map<string, infer V> ? V : never,
      id: string,
    ) => boolean,
  ): (DatabaseSchema[K] extends Map<string, infer V> ? V : never) | undefined {
    const map = this.data[name] as Map<string, unknown>;
    for (const [key, value] of map.entries()) {
      if (
        predicate(
          value as DatabaseSchema[K] extends Map<string, infer V> ? V : never,
          key,
        )
      ) {
        return value as DatabaseSchema[K] extends Map<string, infer V> ? V : never;
      }
    }
    return undefined;
  }

  count<K extends TableName>(
    name: K,
    predicate?: (
      item: DatabaseSchema[K] extends Map<string, infer V> ? V : never,
      id: string,
    ) => boolean,
  ): number {
    const map = this.data[name] as Map<string, unknown>;
    if (!predicate) return map.size;
    let n = 0;
    map.forEach((value, key) => {
      if (
        predicate(
          value as DatabaseSchema[K] extends Map<string, infer V> ? V : never,
          key,
        )
      ) {
        n++;
      }
    });
    return n;
  }

  appendMonitorPoints(taskId: string, points: MonitorDataPoint[]): void {
    const existing = this.data.monitorPoints.get(taskId) ?? [];
    this.data.monitorPoints.set(taskId, [...existing, ...points]);
    this.markDirty();
  }

  getMonitorPoints(taskId: string): MonitorDataPoint[] {
    return this.data.monitorPoints.get(taskId) ?? [];
  }

  forceSave(): void {
    this.saveToDisk();
  }
}

export const db = new DataStore();
export default db;
