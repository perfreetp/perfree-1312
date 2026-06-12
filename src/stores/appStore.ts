import { create } from 'zustand';
import type { WorkOrder, FollowUp, Rectification, WorkOrderStatus, Urgency, Channel, Attachment } from '@/types';
import { initialWorkOrders, initialFollowUps, initialRectifications } from '@/data/mockData';
import { departments } from '@/data/mockBase';

const STORAGE_KEY = 'railway-qms-store-v1';

interface PersistedState {
  workOrders: WorkOrder[];
  followUps: FollowUp[];
  rectifications: Rectification[];
}

function loadFromStorage(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

function saveToStorage(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

const persisted = loadFromStorage();

interface AppState extends PersistedState {
  addWorkOrder: (order: Omit<WorkOrder, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'logs' | 'attachments'> & Partial<WorkOrder>) => void;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  assignWorkOrder: (id: string, departmentId: string, assignee: string) => void;
  processWorkOrder: (id: string, reply: string) => void;
  closeWorkOrder: (id: string) => void;
  addAttachment: (workOrderId: string, attachment: Attachment) => void;
  removeAttachment: (workOrderId: string, attachmentId: string) => void;

  updateFollowUp: (id: string, updates: Partial<FollowUp>) => void;
  completeFollowUp: (id: string, satisfaction: number, comment: string, triggerRectification: boolean, departmentId?: string) => void;

  addRectification: (r: Omit<Rectification, 'id' | 'timeline'>) => void;
  updateRectification: (id: string, updates: Partial<Rectification>) => void;
  completeRectification: (id: string) => void;
  reviewRectification: (id: string, passed: boolean) => void;
}

const generateId = (prefix: string) => `${prefix}${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;

export const useAppStore = create<AppState>((set, get) => ({
  workOrders: persisted?.workOrders ?? initialWorkOrders,
  followUps: persisted?.followUps ?? initialFollowUps,
  rectifications: persisted?.rectifications ?? initialRectifications,

  addWorkOrder: (order) => set((state) => {
    const newOrder: WorkOrder = {
      ...order,
      id: generateId('WO'),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: [],
      logs: [{
        id: generateId('L'),
        action: '工单创建',
        operator: '客服',
        detail: `${order.channel === 'hotline' ? '通过12306热线' : order.channel === 'web' ? '通过官网' : order.channel === 'app' ? '通过APP' : '通过车站'}受理`,
        createdAt: new Date().toISOString(),
      }],
    } as WorkOrder;
    const next = { ...state, workOrders: [newOrder, ...state.workOrders] };
    saveToStorage(next);
    return next;
  }),

  updateWorkOrder: (id, updates) => set((state) => {
    const next = {
      ...state,
      workOrders: state.workOrders.map((w) =>
        w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
      ),
    };
    saveToStorage(next);
    return next;
  }),

  assignWorkOrder: (id, departmentId, assignee) => set((state) => {
    const next = {
      ...state,
      workOrders: state.workOrders.map((w) => {
        if (w.id !== id) return w;
        const dept = departments.find(d => d.id === departmentId);
        return {
          ...w,
          departmentId,
          departmentName: dept?.name,
          assignee,
          status: 'processing',
          updatedAt: new Date().toISOString(),
          logs: [...w.logs, {
            id: generateId('L'),
            action: '受理分派',
            operator: '客服主管',
            detail: `分派至${dept?.name} - ${assignee}处理`,
            createdAt: new Date().toISOString(),
          }],
        } as WorkOrder;
      }),
    };
    saveToStorage(next);
    return next;
  }),

  processWorkOrder: (id, reply) => set((state) => {
    const order = state.workOrders.find(w => w.id === id);
    const newFollowUp: FollowUp = {
      id: generateId('FU'),
      workOrderId: id,
      isRepeatComplaint: false,
      relatedOrderIds: [],
      status: 'pending',
    };
    const hasFollowUp = state.followUps.some(f => f.workOrderId === id);
    const next = {
      workOrders: state.workOrders.map((w) => {
        if (w.id !== id) return w;
        return {
          ...w,
          reply,
          status: 'followup',
          updatedAt: new Date().toISOString(),
          logs: [...w.logs, {
            id: generateId('L'),
            action: '处理完成',
            operator: w.assignee || '处理人',
            detail: `答复内容：${reply.slice(0, 60)}${reply.length > 60 ? '...' : ''}`,
            createdAt: new Date().toISOString(),
          }],
        } as WorkOrder;
      }),
      followUps: hasFollowUp ? state.followUps : [...state.followUps, newFollowUp],
      rectifications: state.rectifications,
    };
    saveToStorage(next);
    return next;
  }),

  closeWorkOrder: (id) => set((state) => {
    const next = {
      ...state,
      workOrders: state.workOrders.map((w) => {
        if (w.id !== id) return w;
        return {
          ...w,
          status: 'closed',
          closedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          logs: [...w.logs, {
            id: generateId('L'),
            action: '工单关闭',
            operator: '系统',
            detail: '工单已完成回访并关闭',
            createdAt: new Date().toISOString(),
          }],
        } as WorkOrder;
      }),
    };
    saveToStorage(next);
    return next;
  }),

  addAttachment: (workOrderId, attachment) => set((state) => {
    const next = {
      ...state,
      workOrders: state.workOrders.map((w) => {
        if (w.id !== workOrderId) return w;
        return {
          ...w,
          attachments: [...w.attachments, attachment],
          updatedAt: new Date().toISOString(),
          logs: [...w.logs, {
            id: generateId('L'),
            action: '附件上传',
            operator: '处理人',
            detail: `上传附件：${attachment.fileName}`,
            createdAt: new Date().toISOString(),
          }],
        } as WorkOrder;
      }),
    };
    saveToStorage(next);
    return next;
  }),

  removeAttachment: (workOrderId, attachmentId) => set((state) => {
    const next = {
      ...state,
      workOrders: state.workOrders.map((w) => {
        if (w.id !== workOrderId) return w;
        return {
          ...w,
          attachments: w.attachments.filter(a => a.id !== attachmentId),
          updatedAt: new Date().toISOString(),
        } as WorkOrder;
      }),
    };
    saveToStorage(next);
    return next;
  }),

  updateFollowUp: (id, updates) => set((state) => {
    const next = { ...state, followUps: state.followUps.map(f => f.id === id ? { ...f, ...updates } : f) };
    saveToStorage(next);
    return next;
  }),

  completeFollowUp: (id, satisfaction, comment, triggerRectification, departmentId) => set((state) => {
    const followUp = state.followUps.find(f => f.id === id);
    if (!followUp) return state;

    const order = state.workOrders.find(w => w.id === followUp.workOrderId);
    let newRectifications = state.rectifications;

    if (triggerRectification && order) {
      const resolvedDeptId = departmentId || order.departmentId || departments[0].id;
      const dept = departments.find(d => d.id === resolvedDeptId) || departments[0];
      newRectifications = [{
        id: generateId('RT'),
        workOrderId: order.id,
        title: `工单${order.id}整改任务 - ${order.title.slice(0, 24)}`,
        measure: '根据旅客投诉问题制定具体整改措施，请责任部门于期限内完成。',
        responsiblePerson: dept.name + '负责人',
        departmentId: dept.id,
        departmentName: dept.name,
        status: 'rectifying' as const,
        deadline: new Date(Date.now() + 5 * 86400 * 1000).toISOString(),
        timeline: [
          { time: new Date().toISOString(), event: `整改任务创建（旅客回访不满意触发，责任部门：${dept.name}）` },
        ],
      }, ...state.rectifications];
    }

    const closeOrder = !triggerRectification;
    const next = {
      workOrders: state.workOrders.map(w => {
        if (w.id !== followUp.workOrderId) return w;
        return closeOrder ? {
          ...w,
          status: 'closed',
          closedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as WorkOrder : w;
      }),
      followUps: state.followUps.map(f =>
        f.id === id ? {
          ...f,
          satisfaction,
          comment,
          responsibleDepartmentId: triggerRectification ? (departmentId || order?.departmentId) : f.responsibleDepartmentId,
          status: 'done' as const,
          followUpAt: new Date().toISOString(),
        } as FollowUp : f
      ),
      rectifications: newRectifications,
    };
    saveToStorage(next);
    return next;
  }),

  addRectification: (r) => set((state) => {
    const next = {
      ...state,
      rectifications: [{
        ...r,
        id: generateId('RT'),
        timeline: [{ time: new Date().toISOString(), event: '整改任务创建' }],
      } as Rectification, ...state.rectifications],
    };
    saveToStorage(next);
    return next;
  }),

  updateRectification: (id, updates) => set((state) => {
    const next = { ...state, rectifications: state.rectifications.map(r => r.id === id ? { ...r, ...updates } as Rectification : r) };
    saveToStorage(next);
    return next;
  }),

  completeRectification: (id) => set((state) => {
    const next = {
      ...state,
      rectifications: state.rectifications.map(r => {
        if (r.id !== id) return r;
        return {
          ...r,
          status: 'reviewing' as const,
          completedAt: new Date().toISOString(),
          timeline: [...r.timeline, { time: new Date().toISOString(), event: '整改完成，申请复核' }],
        } as Rectification;
      }),
    };
    saveToStorage(next);
    return next;
  }),

  reviewRectification: (id, passed) => set((state) => {
    const rect = state.rectifications.find(r => r.id === id);
    if (!rect) return state;

    if (passed) {
      const next = {
        rectifications: state.rectifications.map(r => {
          if (r.id !== id) return r;
          return {
            ...r,
            status: 'closed' as const,
            closedAt: new Date().toISOString(),
            timeline: [...r.timeline, { time: new Date().toISOString(), event: '复核通过，整改关闭' }],
          } as Rectification;
        }),
        workOrders: state.workOrders.map(w => {
          if (w.id !== rect.workOrderId) return w;
          return {
            ...w,
            status: 'closed' as const,
            closedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as WorkOrder;
        }),
        followUps: state.followUps,
      };
      saveToStorage(next);
      return next;
    }
    const next = {
      ...state,
      rectifications: state.rectifications.map(r => {
        if (r.id !== id) return r;
        return {
          ...r,
          status: 'rectifying' as const,
          timeline: [...r.timeline, { time: new Date().toISOString(), event: '复核未通过，重新整改' }],
        } as Rectification;
      }),
    };
    saveToStorage(next);
    return next;
  }),
}));

export const useWorkOrderStats = () => {
  const workOrders = useAppStore(s => s.workOrders);
  const rectifications = useAppStore(s => s.rectifications);
  const now = Date.now();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  const todayNew = workOrders.filter(w => new Date(w.createdAt).getTime() >= todayMs).length;
  const pending = workOrders.filter(w => w.status === 'pending' || w.status === 'processing').length;
  const overdue = workOrders.filter(w =>
    (w.status === 'pending' || w.status === 'processing') &&
    new Date(w.deadline).getTime() < now
  ).length;
  const closed = workOrders.filter(w => w.status === 'closed').length;

  const hotlineCount = workOrders.filter(w => w.channel === 'hotline').length;
  const webCount = workOrders.filter(w => w.channel === 'web').length;
  const appCount = workOrders.filter(w => w.channel === 'app').length;
  const stationCount = workOrders.filter(w => w.channel === 'station').length;

  const pendingReview = rectifications.filter(r => r.status === 'reviewing').length;

  return {
    todayNew, pending, overdue, closed,
    hotlineCount, webCount, appCount, stationCount,
    pendingReview,
  };
};
