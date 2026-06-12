import type { WorkOrderStatus, Urgency, Channel, RectificationStatus } from '@/types';

const statusConfig: Record<WorkOrderStatus, { label: string; className: string }> = {
  pending: { label: '待受理', className: 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]' },
  processing: { label: '处理中', className: 'bg-[#DBEAFE] text-[#1E40AF] border border-[#93C5FD]' },
  followup: { label: '待回访', className: 'bg-[#E0E7FF] text-[#3730A3] border border-[#A5B4FC]' },
  closed: { label: '已关闭', className: 'bg-[#D1FAE5] text-[#065F46] border border-[#6EE7B7]' },
};

export function StatusBadge({ status }: { status: WorkOrderStatus }) {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

const urgencyConfig: Record<Urgency, { label: string; className: string; dot: string }> = {
  urgent: { label: '紧急', className: 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]', dot: 'bg-[#DC2626]' },
  high: { label: '高', className: 'bg-[#FFEDD5] text-[#9A3412] border border-[#FED7AA]', dot: 'bg-[#F97316]' },
  medium: { label: '中', className: 'bg-[#FEF9C3] text-[#854D0E] border border-[#FDE68A]', dot: 'bg-[#EAB308]' },
  low: { label: '低', className: 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]', dot: 'bg-[#22C55E]' },
};

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const cfg = urgencyConfig[urgency];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${urgency === 'urgent' ? 'animate-pulse' : ''}`}></span>
      {cfg.label}
    </span>
  );
}

const channelConfig: Record<Channel, { label: string; className: string }> = {
  hotline: { label: '12306热线', className: 'bg-[#EEF2FF] text-[#3730A3] border border-[#C7D2FE]' },
  web: { label: '官方网站', className: 'bg-[#ECFEFF] text-[#155E75] border border-[#A5F3FC]' },
  app: { label: '手机APP', className: 'bg-[#F5F3FF] text-[#5B21B6] border border-[#DDD6FE]' },
  station: { label: '车站现场', className: 'bg-[#FAF5FF] text-[#701A75] border border-[#E9D5FF]' },
};

export function ChannelBadge({ channel }: { channel: Channel }) {
  const cfg = channelConfig[channel];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

const rectStatusConfig: Record<RectificationStatus, { label: string; className: string }> = {
  rectifying: { label: '整改中', className: 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]' },
  reviewing: { label: '待复核', className: 'bg-[#DBEAFE] text-[#1E40AF] border border-[#93C5FD]' },
  closed: { label: '已关闭', className: 'bg-[#D1FAE5] text-[#065F46] border border-[#6EE7B7]' },
};

export function RectStatusBadge({ status }: { status: RectificationStatus }) {
  const cfg = rectStatusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
