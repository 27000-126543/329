import { v4 as uuidv4 } from 'uuid';
import type {
  ApprovalRecord,
  PaginatedResponse,
  User,
  TaskStatus,
} from '../../shared/types.js';
import { db } from '../db/store.js';
import { TaskService } from './TaskService.js';

function isoNow(): string {
  return new Date().toISOString();
}

export class ApprovalService {
  static list(params?: {
    taskId?: string;
    approverRole?: 'postdoc' | 'professor';
    approved?: boolean;
    page?: number;
    pageSize?: number;
  }): PaginatedResponse<ApprovalRecord> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    let data = db.getAll('approvals');
    if (params?.taskId) data = data.filter((a) => a.taskId === params.taskId);
    if (params?.approverRole) data = data.filter((a) => a.approverRole === params.approverRole);
    if (typeof params?.approved === 'boolean')
      data = data.filter((a) => a.approved === params.approved);
    data.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    const total = data.length;
    const start = (page - 1) * pageSize;
    return {
      data: data.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    };
  }

  static getPendingForRole(role: 'postdoc' | 'professor') {
    const tasks = db.getAll('tasks');
    if (role === 'postdoc') {
      return tasks.filter((t) => t.status === 'completed');
    }
    return tasks.filter((t) => t.status === 'postdoc_approved');
  }

  static submitPostdocApproval(
    approver: User,
    taskId: string,
    params: {
      approved: boolean;
      comments: string;
      numericalStability: ApprovalRecord['numericalStability'];
    },
  ): { approval: ApprovalRecord; nextStatus?: TaskStatus } | null {
    const task = db.getById('tasks', taskId);
    if (!task || task.status !== 'completed') return null;
    const approval: ApprovalRecord = {
      id: `approval-postdoc-${uuidv4().slice(0, 8)}`,
      taskId,
      approverId: approver.id,
      approverName: approver.name,
      approverRole: 'postdoc',
      approved: params.approved,
      comments: params.comments,
      numericalStability: params.numericalStability,
      createdAt: isoNow(),
    };
    db.insert('approvals', approval.id, approval);
    let nextStatus: TaskStatus | undefined;
    if (params.approved) {
      nextStatus = 'postdoc_approved';
      TaskService.updateStatus(taskId, nextStatus, approver.id, '博士后数值稳定性验证通过');
    } else {
      nextStatus = 'rollback';
      TaskService.updateStatus(taskId, nextStatus, approver.id, '数值稳定性验证未通过');
    }
    return { approval, nextStatus };
  }

  static submitProfessorApproval(
    approver: User,
    taskId: string,
    params: {
      approved: boolean;
      comments: string;
      physicalReasonability: ApprovalRecord['physicalReasonability'];
    },
  ): { approval: ApprovalRecord; nextStatus?: TaskStatus } | null {
    const task = db.getById('tasks', taskId);
    if (!task || task.status !== 'postdoc_approved') return null;
    const approval: ApprovalRecord = {
      id: `approval-prof-${uuidv4().slice(0, 8)}`,
      taskId,
      approverId: approver.id,
      approverName: approver.name,
      approverRole: 'professor',
      approved: params.approved,
      comments: params.comments,
      physicalReasonability: params.physicalReasonability,
      createdAt: isoNow(),
    };
    db.insert('approvals', approval.id, approval);
    let nextStatus: TaskStatus | undefined;
    if (params.approved) {
      nextStatus = 'professor_approved';
      TaskService.updateStatus(taskId, nextStatus, approver.id, '教授物理合理性确认通过');
      setTimeout(() => {
        TaskService.updateStatus(taskId, 'published', 'SYSTEM', '自动推送至评估组');
      }, 500);
    } else {
      nextStatus = 'rollback';
      TaskService.updateStatus(taskId, nextStatus, approver.id, '物理合理性确认未通过');
    }
    return { approval, nextStatus };
  }

  static getByTask(taskId: string): ApprovalRecord[] {
    return db.find('approvals', (a) => a.taskId === taskId).sort(
      (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
    );
  }

  static countPending() {
    const tasks = db.getAll('tasks');
    return {
      postdoc: tasks.filter((t) => t.status === 'completed').length,
      professor: tasks.filter((t) => t.status === 'postdoc_approved').length,
      total: tasks.filter((t) => ['completed', 'postdoc_approved'].includes(t.status)).length,
    };
  }
}

export default ApprovalService;
