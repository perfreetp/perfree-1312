export type Urgency = 'urgent' | 'high' | 'medium' | 'low';
export type WorkOrderStatus = 'pending' | 'processing' | 'followup' | 'closed';
export type Channel = 'hotline' | 'web' | 'app' | 'station';
export type RectificationStatus = 'rectifying' | 'reviewing' | 'closed';

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  level: 1 | 2;
}

export interface Department {
  id: string;
  name: string;
}

export interface Station {
  id: string;
  name: string;
}

export interface ProcessLog {
  id: string;
  action: string;
  operator: string;
  detail: string;
  createdAt: string;
}

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  channel: Channel;
  urgency: Urgency;
  status: WorkOrderStatus;
  passengerName: string;
  passengerPhone: string;
  trainNumber?: string;
  stationId?: string;
  categoryId: string;
  categoryName: string;
  departmentId?: string;
  departmentName?: string;
  assignee?: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  reply?: string;
  logs: ProcessLog[];
}

export interface FollowUp {
  id: string;
  workOrderId: string;
  satisfaction?: number;
  comment?: string;
  isRepeatComplaint: boolean;
  relatedOrderIds: string[];
  responsibleDepartmentId?: string;
  followUpAt?: string;
  status: 'pending' | 'done';
}

export interface Rectification {
  id: string;
  workOrderId: string;
  title: string;
  measure: string;
  responsiblePerson: string;
  departmentId: string;
  departmentName: string;
  status: RectificationStatus;
  deadline: string;
  completedAt?: string;
  closedAt?: string;
  timeline: { time: string; event: string; }[];
}

export interface Standard {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  categoryName: string;
  applicableScope: string;
  clauseNo: string;
}

export interface ReplyTemplate {
  id: string;
  title: string;
  content: string;
  categoryId: string;
}
