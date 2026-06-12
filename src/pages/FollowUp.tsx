import { useState, useMemo } from 'react';
import { AlertCircle, Phone, CheckCircle2, Users, AlertTriangle, ChevronDown, ChevronRight, FileText, Building2, Paperclip } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { departments, stations } from '@/data/mockBase';
import { UrgencyBadge, ChannelBadge, StatusBadge } from '@/components/common/Badges';
import StarRating from '@/components/common/StarRating';
import AttachmentList from '@/components/common/AttachmentList';
import { motion, AnimatePresence } from 'framer-motion';

export default function FollowUp() {
  const workOrders = useAppStore(s => s.workOrders);
  const followUps = useAppStore(s => s.followUps);
  const completeFollowUp = useAppStore(s => s.completeFollowUp);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'done'>('pending');

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [deptId, setDeptId] = useState('');
  const [expandedRepeat, setExpandedRepeat] = useState<string | null>(null);

  const list = useMemo(() => {
    const fuList = tab === 'pending'
      ? followUps.filter(f => f.status === 'pending')
      : followUps.filter(f => f.status === 'done');
    return fuList.map(f => {
      const order = workOrders.find(w => w.id === f.workOrderId);
      return { fu: f, order };
    }).filter(x => x.order);
  }, [followUps, workOrders, tab]);

  const selected = followUps.find(f => f.id === selectedId);
  const selectedOrder = selected ? workOrders.find(w => w.id === selected.workOrderId) : null;

  function handleSubmit() {
    if (!selectedId || !rating) { alert('请选择满意度评分'); return; }
    const trigger = rating < 3;
    if (trigger && !deptId) { alert('不满意请确认责任部门以触发整改'); return; }
    completeFollowUp(selectedId, rating, comment, trigger, trigger ? deptId : undefined);
    setRating(0);
    setComment('');
    setDeptId('');
    setSelectedId(null);
  }

  return (
    <div className="flex gap-5 h-[calc(100vh-140px)]">
      <div className="flex-1 card flex flex-col min-w-0">
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-1 p-1 bg-[#F0F4F8] rounded-lg">
            {(['pending', 'done'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setSelectedId(null); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === t ? 'bg-white text-[#1B3A5C] shadow-sm' : 'text-[#64748B]'
                }`}
              >
                {t === 'pending' ? '待回访' : '已完成'}
                <span className="ml-2 text-xs opacity-60">({followUps.filter(f => f.status === t).length})</span>
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead className="sticky top-0 bg-white z-10">
              <tr>
                <th className="table-header">工单信息</th>
                <th className="table-header">旅客</th>
                <th className="table-header">渠道/紧急度</th>
                <th className="table-header">处理结果</th>
                <th className="table-header">状态</th>
                <th className="table-header">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map(({ fu, order }) => (
                <tr key={fu.id} className={`${selectedId === fu.id ? 'bg-[#FEF3C7]/40' : 'hover:bg-[#F7FAFC]'} cursor-pointer`} onClick={() => setSelectedId(fu.id)}>
                  <td className="table-cell">
                    <div className="font-mono text-xs text-[#64748B]">{order?.id}</div>
                    <div className="text-sm font-medium mt-0.5 max-w-[220px] truncate">{order?.title}</div>
                    {fu.isRepeatComplaint && (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-[#FEE2E2] text-[#991B1B] text-xs font-medium">
                        <AlertTriangle className="w-3 h-3" /> 重复投诉
                      </span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="text-sm">{order?.passengerName}</div>
                    <div className="text-xs text-[#64748B]">{order?.passengerPhone}</div>
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-col gap-1">
                      <ChannelBadge channel={order!.channel} />
                      <UrgencyBadge urgency={order!.urgency} />
                    </div>
                  </td>
                  <td className="table-cell text-xs text-[#475569] max-w-[200px] truncate">
                    {order?.reply || '未提交处理结果'}
                  </td>
                  <td className="table-cell">
                    {fu.status === 'pending' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E0E7FF] text-[#3730A3] border border-[#A5B4FC]">待回访</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <StarRating value={fu.satisfaction} readonly size={14} />
                      </div>
                    )}
                  </td>
                  <td className="table-cell">
                    {fu.status === 'pending' ? (
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedId(fu.id); }}
                        className="text-xs px-3 py-1 rounded-md bg-[#1B3A5C] text-white hover:bg-[#152E48] flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> 回访
                      </button>
                    ) : (
                      <span className="text-xs text-[#64748B]">{fu.followUpAt ? new Date(fu.followUpAt).toLocaleDateString() : ''}</span>
                    )}
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={6} className="py-16 text-center text-[#94A3B8] text-sm">暂无回访任务</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selected && selectedOrder && (
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 30, opacity: 0 }}
            className="w-[420px] card flex flex-col flex-shrink-0 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-[#E2E8F0] bg-gradient-to-r from-[#E8A838] to-[#F2B84B]">
              <div className="flex items-center gap-2 text-white/90 text-xs mb-1">
                <Users className="w-4 h-4" /> 旅客回访
              </div>
              <div className="text-white font-semibold truncate">{selectedOrder.title}</div>
              <div className="text-white/80 text-xs font-mono mt-0.5">{selectedOrder.id}</div>
            </div>
            <div className="flex-1 overflow-auto p-5 space-y-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedOrder.status} />
                <UrgencyBadge urgency={selectedOrder.urgency} />
                {selected.isRepeatComplaint && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FEE2E2] text-[#991B1B] text-xs font-medium">
                    <AlertTriangle className="w-3 h-3" />重复投诉
                  </span>
                )}
              </div>

              <div className="p-4 bg-gradient-to-br from-[#F7FAFC] to-[#EDF2F7] rounded-xl border border-[#E2E8F0]">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-[#64748B]">旅客姓名</div>
                    <div className="font-medium mt-0.5">{selectedOrder.passengerName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#64748B]">联系电话</div>
                    <div className="font-medium mt-0.5">{selectedOrder.passengerPhone}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#64748B]">问题分类</div>
                    <div className="font-medium mt-0.5">{selectedOrder.categoryName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#64748B]">责任部门</div>
                    <div className="font-medium mt-0.5">{selectedOrder.departmentName || '-'}</div>
                  </div>
                </div>
              </div>

              {selected.isRepeatComplaint && (
                <div>
                  <button
                    className="flex items-center gap-1 text-sm font-medium text-[#991B1B]"
                    onClick={() => setExpandedRepeat(expandedRepeat === selected.id ? null : selected.id)}
                  >
                    {expandedRepeat === selected.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    查看历史重复投诉 ({selected.relatedOrderIds.length} 条)
                  </button>
                  {expandedRepeat === selected.id && (
                    <div className="mt-2 p-3 bg-[#FEF2F2] rounded-lg border border-[#FECACA] text-xs text-[#991B1B] space-y-1">
                      {selected.relatedOrderIds.map(id => (
                        <div key={id}>· 关联工单：{id}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="text-xs text-[#64748B] mb-1.5 flex items-center gap-1"><FileText className="w-3.5 h-3.5" />处理结果</div>
                <div className="p-3 bg-[#FEF3C7] rounded-lg text-sm text-[#92400E] border border-[#FDE68A] whitespace-pre-wrap">
                  {selectedOrder.reply || '暂无'}
                </div>
              </div>

              <div>
                <div className="text-xs text-[#64748B] mb-1.5 flex items-center gap-1"><Paperclip className="w-3.5 h-3.5" />工单附件</div>
                <AttachmentList attachments={selectedOrder.attachments} />
              </div>

              {selected.status === 'pending' ? (
                <div className="space-y-4 pt-2 border-t border-[#E2E8F0]">
                  <div>
                    <label className="label-field">旅客满意度 <span className="text-[#DC2626]">*</span></label>
                    <div className="flex items-center gap-3 mt-1">
                      <StarRating value={rating} onChange={setRating} size={28} />
                      {rating > 0 && <span className="text-sm font-medium text-[#E8A838]">{rating} 星</span>}
                    </div>
                    <div className="mt-1.5 flex gap-2 text-xs">
                      {['非常不满意', '不满意', '一般', '满意', '非常满意'].map((t, i) => (
                        <span key={t} className={`px-2 py-0.5 rounded ${rating === i + 1 ? 'bg-[#1B3A5C] text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label-field">旅客反馈意见</label>
                    <textarea
                      className="input-field h-20 resize-none text-sm"
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="请记录旅客反馈的意见或建议..."
                    />
                  </div>
                  {rating > 0 && rating < 3 && (
                    <div className="p-3 bg-[#FEE2E2] rounded-lg border border-[#FECACA]">
                      <div className="flex items-start gap-2 text-sm text-[#991B1B]">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium">旅客满意度较低，系统将自动触发整改流程</div>
                          <div className="mt-2">
                            <label className="label-field flex items-center gap-1 text-[#991B1B]"><Building2 className="w-3.5 h-3.5" />确认责任部门</label>
                            <select className="input-field text-sm" value={deptId} onChange={e => setDeptId(e.target.value)}>
                              <option value="">请选择责任部门</option>
                              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-3">
                    <button className="btn-secondary" onClick={() => setSelectedId(null)}>取消</button>
                    <button className="btn-primary" onClick={handleSubmit}>
                      <CheckCircle2 className="w-4 h-4" /> 完成回访
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-3 border-t border-[#E2E8F0]">
                  <div>
                    <div className="text-xs text-[#64748B] mb-1">满意度评分</div>
                    <div className="flex items-center gap-2">
                      <StarRating value={selected.satisfaction} readonly size={22} />
                      <span className="font-semibold text-[#1B3A5C]">{selected.satisfaction} 星</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#64748B] mb-1">旅客评价</div>
                    <div className="p-3 bg-[#F7FAFC] rounded-lg text-sm text-[#1F2937]">
                      {selected.comment || '旅客未发表评价'}
                    </div>
                  </div>
                  <div className="text-xs text-[#64748B]">
                    回访时间：{selected.followUpAt ? new Date(selected.followUpAt).toLocaleString('zh-CN') : '-'}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
