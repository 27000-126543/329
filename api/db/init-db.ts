import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './store.js';
import { runSeed } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');

let initialized = false;

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('[DB] Created data directory:', DATA_DIR);
  }
}

export function initDatabase(force = false): { seeded: boolean } {
  ensureDataDir();

  if (initialized && !force) {
    return { seeded: false };
  }

  console.log('[DB] Initializing database...');
  const loaded = db.loadFromDisk();

  if (!loaded || force) {
    console.log('[DB] Starting seed initialization...');
    const result = runSeed();
    console.log(
      `[DB] Seed completed: ${result.users.length} users, ${result.faults.length} faults, ` +
        `${result.tasks.length} tasks, ${result.alerts.length} alerts, ` +
        `${result.approvals.length} approvals, ${result.stats.length} stats, ` +
        `${result.recommendations.length} recommendations, ${result.deviations.length} deviations`,
    );
    initialized = true;
    return { seeded: true };
  }

  const users = db.getAll('users');
  const tasks = db.getAll('tasks');
  if (users.length === 0 || tasks.length === 0) {
    console.log('[DB] Database empty, running seed...');
    const result = runSeed();
    console.log(
      `[DB] Seed completed (empty db): ${result.users.length} users, ${result.tasks.length} tasks`,
    );
    initialized = true;
    return { seeded: true };
  }

  console.log(
    `[DB] Loaded from disk: ${users.length} users, ${tasks.length} tasks, ` +
      `${db.getAll('alerts').length} alerts`,
  );
  initialized = true;
  return { seeded: false };
}

export function resetDatabase(): void {
  console.log('[DB] Resetting database...');
  db.getTable('users').clear();
  db.getTable('tasks').clear();
  db.getTable('alerts').clear();
  db.getTable('approvals').clear();
  db.getTable('faults').clear();
  db.getTable('deviations').clear();
  db.getTable('recommendations').clear();
  db.getTable('dailyStats').clear();
  db.getTable('monitorPoints').clear();
  db.getTable('reports').clear();
  const result = initDatabase(true);
  console.log('[DB] Reset complete, seeded:', result.seeded);
}

export default initDatabase;
