import { X, User, MessageSquare, Clock, FileText, Paperclip, AlertCircle, ListChecks, ArrowRight, ChevronRight, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { categories, departments, stations } from '@/data/mockBase';
import { StatusBadge, UrgencyBadge, ChannelBadge, RectStatusBadge } from '@/components/common/Badges';
import CountdownTimer from '@/components/common/CountdownTimer';
import AttachmentList from '@/components/common/AttachmentList';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  workOrderId: string;
  onClose: () => void;
  filterContext?: string;
}

export default function WorkOrderDetailDrawer({ workOrderId, onClose, filterContext }: Props) {
  const navigate = useNavigate();
  const workOrders = useAppStore(s => s.workOrders);
  const followUps = useAppStore(s => s.followUps);
  const rectifications = useAppStore(s => s.rectifications);

  const order = workOrders.find(w => w.id === workOrderId);
  const orderFollowUps = followUps.filter(f => f.workOrderId === workOrderId);
  const orderRectifications = rectifications.filter(r => r.workOrderId === workOrderId);

  if (!order) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="fixed right-0 top-0 h-full w-[520px] max-w-[90vw] bg-white shadow-2xl z-50 flex flex-col"
      >
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-gradient-to-r from-[#1B3A5C] to-[#2A5580] flex-shrink-0">
          <div>
            {filterContext && (
              <div className="text-xs text-[#E8A838] flex items-center gap-1">
                <ChevronRight className="w-3 h-3" />来源：{filterContext}
              </div>
            )}
            <div className="font-mono text-xs text-white/70 mt-0.5">{order.id}</div>
            <div className="text-white font-semibold mt-0.5">{order.title}</div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={order.status} />
              <UrgencyBadge urgency={order.urgency} />
              <ChannelBadge channel={order.channel} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-[#F7FAFC] rounded-lg">
                <div className="text-xs text-[#64748B] flex items-center gap-1"><User className="w-3.5 h-3.5" />旅客姓名</div>
                <div className="mt-1 font-medium text-[#1F2937]">{order.passengerName}</div>
              </div>
              <div className="p-3 bg-[#F7FAFC] rounded-lg">
                <div className="text-xs text-[#64748B] flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />联系电话</div>
                <div className="mt-1 font-medium text-[#1F2937]">{order.passengerPhone}</div>
              </div>
              <div className="p-3 bg-[#F7FAFC] rounded-lg">
                <div className="text-xs text-[#64748B]">问题分类</div>
                <div className="mt-1 font-medium text-[#1F2937]">{order.categoryName}</div>
              </div>
              <div className="p-3 bg-[#F7FAFC] rounded-lg">
                <div className="text-xs text-[#64748B] flex items-center gap-1"><Clock className="w-3.5 h-3.5" />处理时限</div>
                <div className="mt-1"><CountdownTimer deadline={order.deadline} /></div>
              </div>
            </div>

            {(order.trainNumber || order.stationId) && (
              <div className="p-3 bg-[#F0F9FF] rounded-lg border border-[#BAE6FD]">
                <div className="text-xs text-[#0369A1] mb-1">关联行程信息</div>
                <div className="text-sm font-medium text-[#0C4A6E]">
                  {order.trainNumber && `车次: ${order.trainNumber}`}
                  {order.stationId && ` · 站点: ${stations.find(s => s.id === order.stationId)?.name}`}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs text-[#64748B] mb-2 flex items-center gap-1"><FileText className="w-3.5 h-3.5" />问题描述</div>
              <div className="p-3 bg-[#F7FAFC] rounded-lg text-sm text-[#1F2937] leading-relaxed whitespace-pre-wrap">{order.description}</div>
            </div>

            {order.reply && (
              <div>
                <div className="text-xs text-[#64748B] mb-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />处理答复</div>
                <div className="p-3 bg-[#FEF3C7] rounded-lg text-sm text-[#92400E] border border-[#FDE68A] whitespace-pre-wrap">{order.reply}</div>
              </div>
            )}

            <div>
              <div className="text-xs text-[#64748B] mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1"><Paperclip className="w-3.5 h-3.5" />工单附件</span>
                <span className="text-[#94A3B8]">{order.attachments?.length || 0} 个文件</span>
              </div>
              <AttachmentList attachments={order.attachments || []} />
            </div>

            {orderFollowUps.length > 0 && (
              <div>
                <div className="text-xs text-[#64748B] mb-2 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />回访记录 ({orderFollowUps.length} 条)
                </div>
                <div className="space-y-2">
                  {orderFollowUps.map(fu => (
                    <div key={fu.id} className="p-3 rounded-lg border border-[#E2E8F0] bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ background: fu.satisfaction && fu.satisfaction >= 4 ? '#D1FAE5' : fu.satisfaction && fu.satisfaction >= 3 ? '#FEF3C7' : '#FEE2E2', color: fu.satisfaction && fu.satisfaction >= 4 ? '#065F46' : fu.satisfaction && fu.satisfaction >= 3 ? '#92400E' : '#991B1B' }}>
                            {fu.satisfaction} 星
                          </span>
                          {fu.isRepeatComplaint && (
                            <span className="px-1.5 py-0.5 rounded bg-[#FEE2E2] text-[#991B1B] text-xs font-medium">重复投诉</span>
                          )}
                        </div>
                        <span className="text-xs text-[#94A3B8]">{fu.followUpAt ? new Date(fu.followUpAt).toLocaleString('zh-CN') : '未回访'}</span>
                      </div>
                      {fu.comment && (
                        <div className="mt-1.5 text-sm text-[#64748B]">{fu.comment}</div>
                      )}
                      {fu.responsibleDepartmentId && (
                        <div className="mt-1 text-xs text-[#64748B] flex items-center gap-1">
                          <Building2 className="w-3 h-3" />责任部门：{departments.find(d => d.id === fu.responsibleDepartmentId)?.name || fu.responsibleDepartmentId}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {orderRectifications.length > 0 && (
              <div>
                <div className="text-xs text-[#64748B] mb-2 flex items-center gap-1">
                  <ListChecks className="w-3.5 h-3.5" />整改任务 ({orderRectifications.length} 条)
                </div>
                <div className="space-y-2">
                  {orderRectifications.map(r => (
                    <div key={r.id} className="p-3 rounded-lg border border-[#E2E8F0] bg-white">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-[#1F2937]">{r.title}</div>
                        <RectStatusBadge status={r.status} />
                      </div>
                      <div className="mt-1 text-xs text-[#64748B] flex items-center gap-2">
                        <span><Building2 className="w-3 h-3 inline mr-0.5" />{r.departmentName}</span>
                        <span>· 截止: {new Date(r.deadline).toLocaleDateString('zh-CN')}</span>
                      </div>
                      <div className="mt-1.5 text-xs text-[#475569] line-clamp-2">{r.measure}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-[#94A3B8]">最新进展：{r.timeline[r.timeline.length - 1]?.event || '处理中'}</span>
                        <button
                          onClick={() => { onClose(); navigate(`/rectification?open=${r.id}`); }}
                          className="text-xs text-[#1B3A5C] hover:underline flex items-center gap-1"
                        >
                          查看整改 <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs text-[#64748B] mb-2">处理日志</div>
              <div className="space-y-3">
                {order.logs.map(log => (
                  <div key={log.id} className="flex gap-3">
                    <div className="relative flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-[#1B3A5C] mt-1.5" />
                      <div className="w-px bg-[#E2E8F0] flex-1" />
                    </div>
                    <div className="pb-2 flex-1">
                      <div className="text-sm font-medium text-[#1F2937]">{log.action} <span className="text-xs font-normal text-[#64748B] ml-1">· {log.operator}</span></div>
                      <div className="text-xs text-[#64748B] mt-0.5">{log.detail}</div>
                      <div className="text-xs text-[#94A3B8] mt-0.5">{new Date(log.createdAt).toLocaleString('zh-CN')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[#E2E8F0] bg-white flex-shrink-0 flex items-center justify-between">
          <div className="text-xs text-[#64748B]">创建于 {new Date(order.createdAt).toLocaleString('zh-CN')}</div>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm py-1.5" onClick={onClose}>关闭</button>
            <button
              className="btn-primary text-sm py-1.5 flex items-center gap-1"
              onClick={() => { onClose(); navigate(`/processing?open=${order.id}`); }}
            >
              跳转处理 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
