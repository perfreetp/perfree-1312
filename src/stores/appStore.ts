import { create } from 'zustand';
import type { WorkOrder, FollowUp, Rectification, WorkOrderStatus, Urgency, Channel } from '@/types';
import { initialWorkOrders, initialFollowUps, initialRectifications } from '@/data/mockData';
import { categories, departments } from '@/data/mockBase';

interface AppState {
  workOrders: WorkOrder[];
  followUps: FollowUp[];
  rectifications: Rectification[];

  addWorkOrder: (order: Omit<WorkOrder, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'logs'> & Partial<WorkOrder>) => void;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  assignWorkOrder: (id: string, departmentId: string, assignee: string) => void;
  processWorkOrder: (id: string, reply: string) => void;
  closeWorkOrder: (id: string) => void;

  updateFollowUp: (id: string, updates: Partial<FollowUp>) => void;
  completeFollowUp: (id: string, satisfaction: number, comment: string, triggerRectification: boolean) => void;

  addRectification: (r: Omit<Rectification, 'id' | 'timeline'>) => void;
  updateRectification: (id: string, updates: Partial<Rectification>) => void;
  completeRectification: (id: string) => void;
  reviewRectification: (id: string, passed: boolean) => void;
}

const generateId = (prefix: string) => `${prefix}${Date.now().toString().slice(-6)}`;

export const useAppStore = create<AppState>((set, get) => ({
  workOrders: initialWorkOrders,
  followUps: initialFollowUps,
  rectifications: initialRectifications,

  addWorkOrder: (order) => set((state) => {
    const newOrder: WorkOrder = {
      ...order,
      id: generateId('WO'),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logs: [{
        id: generateId('L'),
        action: '工单创建',
        operator: '客服',
        detail: `${order.channel === 'hotline' ? '通过12306热线' : order.channel === 'web' ? '通过官网' : order.channel === 'app' ? '通过APP' : '通过车站'}受理`,
        createdAt: new Date().toISOString(),
      }],
    } as WorkOrder;
    return { workOrders: [newOrder, ...state.workOrders] };
  }),

  updateWorkOrder: (id, updates) => set((state) => ({
    workOrders: state.workOrders.map((w) =>
      w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
    ),
  })),

  assignWorkOrder: (id, departmentId, assignee) => set((state) => ({
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
      };
    }),
  })),

  processWorkOrder: (id, reply) => set((state) => {
    const order = state.workOrders.find(w => w.id === id);
    const newFollowUp: FollowUp = {
      id: generateId('FU'),
      workOrderId: id,
      isRepeatComplaint: false,
      relatedOrderIds: [],
      status: 'pending',
    };
    return {
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
            detail: `答复内容：${reply.slice(0, 50)}...`,
            createdAt: new Date().toISOString(),
          }],
        };
      }),
      followUps: order && !state.followUps.some(f => f.workOrderId === id)
        ? [...state.followUps, newFollowUp]
        : state.followUps,
    };
  }),

  closeWorkOrder: (id) => set((state) => ({
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
      };
    }),
  })),

  updateFollowUp: (id, updates) => set((state) => ({
    followUps: state.followUps.map(f => f.id === id ? { ...f, ...updates } : f),
  })),

  completeFollowUp: (id, satisfaction, comment, triggerRectification) => set((state) => {
    const followUp = state.followUps.find(f => f.id === id);
    if (!followUp) return state;

    const order = state.workOrders.find(w => w.id === followUp.workOrderId);
    let newRectifications = state.rectifications;

    if (triggerRectification && order) {
      const dept = departments.find(d => d.id === order.departmentId) || departments[0];
      newRectifications = [{
        id: generateId('RT'),
        workOrderId: order.id,
        title: `工单${order.id}整改任务 - ${order.title}`,
        measure: '根据旅客投诉问题制定具体整改措施',
        responsiblePerson: dept.name + '负责人',
        departmentId: dept.id,
        departmentName: dept.name,
        status: 'rectifying',
        deadline: new Date(Date.now() + 5 * 86400 * 1000).toISOString(),
        timeline: [
          { time: new Date().toISOString(), event: '整改任务创建（旅客回访不满意触发）' },
        ],
      }, ...state.rectifications];
    }

    return {
      followUps: state.followUps.map(f =>
        f.id === id ? { ...f, satisfaction, comment, status: 'done', followUpAt: new Date().toISOString() } : f
      ),
      workOrders: state.workOrders.map(w => {
        if (w.id !== followUp.workOrderId) return w;
        if (!triggerRectification) {
          return {
            ...w,
            status: 'closed',
            closedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
        return w;
      }),
      rectifications: newRectifications,
    };
  }),

  addRectification: (r) => set((state) => ({
    rectifications: [{
      ...r,
      id: generateId('RT'),
      timeline: [{ time: new Date().toISOString(), event: '整改任务创建' }],
    }, ...state.rectifications],
  })),

  updateRectification: (id, updates) => set((state) => ({
    rectifications: state.rectifications.map(r => r.id === id ? { ...r, ...updates } : r),
  })),

  completeRectification: (id) => set((state) => ({
    rectifications: state.rectifications.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        status: 'reviewing',
        completedAt: new Date().toISOString(),
        timeline: [...r.timeline, { time: new Date().toISOString(), event: '整改完成，申请复核' }],
      };
    }),
  })),

  reviewRectification: (id, passed) => set((state) => {
    const rect = state.rectifications.find(r => r.id === id);
    if (!rect) return state;

    if (passed) {
      return {
        rectifications: state.rectifications.map(r => {
          if (r.id !== id) return r;
          return {
            ...r,
            status: 'closed',
            closedAt: new Date().toISOString(),
            timeline: [...r.timeline, { time: new Date().toISOString(), event: '复核通过，整改关闭' }],
          };
        }),
        workOrders: state.workOrders.map(w => {
          if (w.id !== rect.workOrderId) return w;
          return {
            ...w,
            status: 'closed',
            closedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    }
    return {
      rectifications: state.rectifications.map(r => {
        if (r.id !== id) return r;
        return {
          ...r,
          status: 'rectifying',
          timeline: [...r.timeline, { time: new Date().toISOString(), event: '复核未通过，重新整改' }],
        };
      }),
    };
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
