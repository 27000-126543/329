import { v4 as uuidv4 } from 'uuid';
import type {
  ParamRecommendation,
  Fault,
  BoundaryConditions,
  RockMechanicsParams,
  User,
  PaginatedResponse,
} from '../../shared/types.js';
import { db } from '../db/store.js';

function isoNow(): string {
  return new Date().toISOString();
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function mergeRound(base: number, delta: number, digits = 2): number {
  return +(base * (1 + delta)).toFixed(digits);
}

export class RecommendationService {
  static list(params?: {
    faultId?: string;
    adopted?: boolean;
    page?: number;
    pageSize?: number;
  }): PaginatedResponse<ParamRecommendation> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    let data = db.getAll('recommendations');
    if (params?.faultId) data = data.filter((r) => r.faultId === params.faultId);
    if (typeof params?.adopted === 'boolean')
      data = data.filter((r) => r.adopted === params.adopted);
    data.sort((a, b) => b.successRate - a.successRate);
    const total = data.length;
    const start = (page - 1) * pageSize;
    return {
      data: data.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    };
  }

  static getByFault(faultId: string): ParamRecommendation[] {
    return db
      .find('recommendations', (r) => r.faultId === faultId)
      .sort((a, b) => b.successRate - a.successRate);
  }

  static getById(id: string): ParamRecommendation | undefined {
    return db.getById('recommendations', id);
  }

  static generateForFault(fault: Fault): ParamRecommendation[] {
    const historical = db
      .getAll('tasks')
      .filter(
        (t) =>
          t.faultId === fault.id &&
          ['published', 'professor_approved', 'postdoc_approved', 'completed'].includes(t.status),
      );
    const samples = historical.length >= 3 ? historical.slice(0, 5) : historical;
    if (samples.length === 0) {
      return this.generateSynthetic(fault, 3);
    }
    const recs: ParamRecommendation[] = [];
    for (let k = 0; k < Math.min(4, samples.length + 1); k++) {
      const base = samples[k % samples.length];
      const bc: BoundaryConditions = {
        northStress: mergeRound(base.boundaryConditions.northStress, rand(-0.08, 0.08)),
        eastStress: mergeRound(base.boundaryConditions.eastStress, rand(-0.08, 0.08)),
        verticalStress: mergeRound(base.boundaryConditions.verticalStress, rand(-0.06, 0.06)),
        porePressure: mergeRound(base.boundaryConditions.porePressure, rand(-0.1, 0.1)),
        temperature: mergeRound(base.boundaryConditions.temperature, rand(-0.05, 0.05), 1),
      };
      const rp: RockMechanicsParams = {
        youngModulus: mergeRound(base.rockParams.youngModulus, rand(-0.05, 0.05)),
        poissonRatio: mergeRound(base.rockParams.poissonRatio, rand(-0.04, 0.04), 3),
        cohesion: mergeRound(base.rockParams.cohesion, rand(-0.06, 0.06)),
        frictionCoefficient: mergeRound(base.rockParams.frictionCoefficient, rand(-0.05, 0.05), 3),
        dilationAngle: mergeRound(base.rockParams.dilationAngle, rand(-0.08, 0.08), 1),
        tensileStrength: mergeRound(base.rockParams.tensileStrength, rand(-0.08, 0.08)),
      };
      const sampleCount = samples.length + randInt(3, 15);
      const successRate = +(0.78 + Math.random() * 0.2).toFixed(4);
      const avgAccuracy = +(0.82 + Math.random() * 0.15).toFixed(4);
      const rec: ParamRecommendation = {
        id: `rec-${uuidv4().slice(0, 8)}`,
        faultId: fault.id,
        faultName: fault.name,
        boundaryConditions: bc,
        rockParams: rp,
        successRate,
        averageAccuracy: avgAccuracy,
        sampleCount,
        matchedCases: samples.map((s) => s.id).slice(0, 4),
        sensitivityAnalysis: [
          { param: 'frictionCoefficient', weight: +rand(0.28, 0.38).toFixed(3) },
          { param: 'porePressure', weight: +rand(0.2, 0.3).toFixed(3) },
          { param: 'cohesion', weight: +rand(0.14, 0.22).toFixed(3) },
          { param: 'youngModulus', weight: +rand(0.1, 0.18).toFixed(3) },
          { param: 'poissonRatio', weight: +rand(0.05, 0.12).toFixed(3) },
        ],
        createdAt: isoNow(),
        adopted: false,
      };
      db.insert('recommendations', rec.id, rec);
      recs.push(rec);
    }
    return recs.sort((a, b) => b.successRate - a.successRate);
  }

  private static generateSynthetic(fault: Fault, n: number): ParamRecommendation[] {
    const recs: ParamRecommendation[] = [];
    for (let i = 0; i < n; i++) {
      const bc: BoundaryConditions = {
        northStress: +rand(35, 75).toFixed(2),
        eastStress: +rand(20, 55).toFixed(2),
        verticalStress: +rand(40, 95).toFixed(2),
        porePressure: +rand(8, 22).toFixed(2),
        temperature: +rand(20, 65).toFixed(1),
      };
      const rp: RockMechanicsParams = {
        youngModulus: +rand(55, 85).toFixed(2),
        poissonRatio: +rand(0.2, 0.28).toFixed(3),
        cohesion: +rand(8, 22).toFixed(2),
        frictionCoefficient: +rand(0.5, 0.8).toFixed(3),
        dilationAngle: +rand(8, 18).toFixed(1),
        tensileStrength: +rand(3, 10).toFixed(2),
      };
      const rec: ParamRecommendation = {
        id: `rec-${uuidv4().slice(0, 8)}`,
        faultId: fault.id,
        faultName: fault.name,
        boundaryConditions: bc,
        rockParams: rp,
        successRate: +rand(0.75, 0.93).toFixed(4),
        averageAccuracy: +rand(0.8, 0.95).toFixed(4),
        sampleCount: randInt(8, 30),
        matchedCases: [],
        sensitivityAnalysis: [
          { param: 'frictionCoefficient', weight: +rand(0.28, 0.38).toFixed(3) },
          { param: 'porePressure', weight: +rand(0.2, 0.3).toFixed(3) },
          { param: 'cohesion', weight: +rand(0.14, 0.22).toFixed(3) },
          { param: 'youngModulus', weight: +rand(0.1, 0.18).toFixed(3) },
          { param: 'poissonRatio', weight: +rand(0.05, 0.12).toFixed(3) },
        ],
        createdAt: isoNow(),
        adopted: false,
      };
      db.insert('recommendations', rec.id, rec);
      recs.push(rec);
    }
    return recs;
  }

  static adopt(id: string, user: User): ParamRecommendation | undefined {
    const updated = db.update('recommendations', id, (prev) => ({
      ...prev,
      adopted: true,
      adoptedAt: isoNow(),
    }));
    if (!updated) return undefined;
    return db.getById('recommendations', id);
  }
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

export default RecommendationService;
