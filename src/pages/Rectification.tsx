import { useState } from 'react';
import {
  Plus, ClipboardList, CheckCheck, CircleCheck, User, Calendar, Clock,
  AlertTriangle, X, ChevronRight, AlertCircle, ListChecks, Paperclip
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { RectStatusBadge } from '@/components/common/Badges';
import AttachmentList from '@/components/common/AttachmentList';
import { departments, stations } from '@/data/mockBase';
import { motion, AnimatePresence } from 'framer-motion';
import type { RectificationStatus } from '@/types';

export default function Rectification() {
  const rectifications = useAppStore(s => s.rectifications);
  const workOrders = useAppStore(s => s.workOrders);
  const addRectification = useAppStore(s => s.addRectification);
  const completeRectification = useAppStore(s => s.completeRectification);
  const reviewRectification = useAppStore(s => s.reviewRectification);

  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    workOrderId: '',
    title: '',
    measure: '',
    responsiblePerson: '',
    departmentId: '',
    deadline: '',
  });

  const statuses: { key: RectificationStatus; label: string; icon: any; color: string }[] = [
    { key: 'rectifying', label: '整改中', icon: ClipboardList, color: '#E8A838' },
    { key: 'reviewing', label: '待复核', icon: CheckCheck, color: '#6366F1' },
    { key: 'closed', label: '已关闭', icon: CircleCheck, color: '#22C55E' },
  ];

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.measure || !form.responsiblePerson || !form.departmentId || !form.deadline) {
      alert('请填写完整整改信息');
      return;
    }
    const dept = departments.find(d => d.id === form.departmentId)!;
    addRectification({
      workOrderId: form.workOrderId || 'MANUAL',
      title: form.title,
      measure: form.measure,
      responsiblePerson: form.responsiblePerson,
      departmentId: form.departmentId,
      departmentName: dept.name,
      status: 'rectifying',
      deadline: new Date(form.deadline).toISOString(),
    });
    alert('整改任务创建成功！');
    setForm({ workOrderId: '', title: '', measure: '', responsiblePerson: '', departmentId: '', deadline: '' });
    setShowCreate(false);
  }

  const selected = rectifications.find(r => r.id === selectedId);
  const selectedOrder = selected ? workOrders.find(w => w.id === selected.workOrderId) : null;

  return (
    <div className="space-y-5 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          {statuses.map(s => {
            const Icon = s.icon;
            const count = rectifications.filter(r => r.status === s.key).length;
            return (
              <div key={s.key} className="card px-5 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div>
                  <div className="text-xs text-[#64748B]">{s.label}</div>
                  <div className="text-lg font-bold text-[#1F2937]">{count}</div>
                </div>
              </div>
            );
          })}
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> 创建整改任务
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5 flex-1 min-h-0">
        {statuses.map(col => {
          const Icon = col.icon;
          const list = rectifications.filter(r => r.status === col.key);
          return (
            <motion.div
              key={col.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-[#F7FAFC] border border-[#E2E8F0] flex flex-col min-h-0 overflow-hidden"
            >
              <div className="px-4 py-3 flex items-center justify-between border-b border-[#E2E8F0]" style={{ background: `${col.color}08` }}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: col.color }} />
                  <span className="text-sm font-semibold text-[#1F2937]">{col.label}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-white text-[#64748B] shadow-sm">{list.length}</span>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-3 space-y-3">
                {list.length === 0 && (
                  <div className="py-10 text-center text-xs text-[#94A3B8]">暂无任务</div>
                )}
                {list.map(r => {
                  const isOverdue = !r.closedAt && new Date(r.deadline).getTime() < Date.now();
                  return (
                    <motion.div
                      key={r.id}
                      layout
                      onClick={() => setSelectedId(r.id)}
                      className={`p-4 rounded-xl bg-white border cursor-pointer hover:shadow-md transition-all group ${
                        selectedId === r.id ? 'border-[#1B3A5C] ring-2 ring-[#1B3A5C]/10 shadow-md' : 'border-[#E2E8F0]'
                      } ${isOverdue && r.status !== 'closed' ? 'border-l-4 border-l-[#DC2626]' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="text-sm font-semibold text-[#1F2937] line-clamp-2 group-hover:text-[#1B3A5C]">{r.title}</div>
                        <ChevronRight className={`w-4 h-4 text-[#94A3B8] flex-shrink-0 transition-transform ${selectedId === r.id ? 'translate-x-1' : ''}`} />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                          <User className="w-3 h-3" />
                          {r.responsiblePerson} · {r.departmentName}
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs ${isOverdue && r.status !== 'closed' ? 'text-[#DC2626] font-medium' : 'text-[#64748B]'}`}>
                          <Calendar className="w-3 h-3" />
                          截止：{new Date(r.deadline).toLocaleDateString('zh-CN')}
                          {isOverdue && r.status !== 'closed' && <span className="text-[#DC2626]">（已超期）</span>}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <RectStatusBadge status={r.status} />
                        {r.status === 'rectifying' && (
                          <button
                            onClick={e => { e.stopPropagation(); completeRectification(r.id); }}
                            className="text-xs px-2.5 py-1 rounded-md bg-[#1B3A5C] text-white hover:bg-[#152E48] flex items-center gap-1"
                          >
                            <ListChecks className="w-3 h-3" />申请复核
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="card w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-gradient-to-r from-[#1B3A5C] to-[#2A5580]">
                <div>
                  <div className="text-xs text-white/70">整改任务</div>
                  <div className="text-white font-semibold">{selected.title}</div>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-white/70 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <RectStatusBadge status={selected.status} />
                  {new Date(selected.deadline).getTime() < Date.now() && selected.status !== 'closed' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FEE2E2] text-[#991B1B] text-xs font-medium">
                      <AlertTriangle className="w-3 h-3" />已超期
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-[#F7FAFC] rounded-lg">
                    <div className="text-xs text-[#64748B] flex items-center gap-1"><User className="w-3.5 h-3.5" />责任人</div>
                    <div className="mt-1 font-medium">{selected.responsiblePerson}</div>
                  </div>
                  <div className="p-3 bg-[#F7FAFC] rounded-lg">
                    <div className="text-xs text-[#64748B] flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />责任部门</div>
                    <div className="mt-1 font-medium">{selected.departmentName}</div>
                  </div>
                  <div className="p-3 bg-[#F7FAFC] rounded-lg">
                    <div className="text-xs text-[#64748B] flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />截止日期</div>
                    <div className="mt-1 font-medium">{new Date(selected.deadline).toLocaleDateString('zh-CN')}</div>
                  </div>
                  <div className="p-3 bg-[#F7FAFC] rounded-lg">
                    <div className="text-xs text-[#64748B]">关联工单</div>
                    <div className="mt-1 font-medium text-[#1B3A5C]">{selectedOrder ? selectedOrder.id : '手动创建'}</div>
                  </div>
                </div>

                {selectedOrder && (
                  <div className="p-4 rounded-xl bg-[#FEF3C7] border border-[#FDE68A]">
                    <div className="text-xs text-[#92400E] mb-1">关联工单详情</div>
                    <div className="text-sm font-medium text-[#78350F]">{selectedOrder.title}</div>
                    <div className="text-xs text-[#92400E] mt-1">{selectedOrder.passengerName} · {selectedOrder.categoryName}</div>
                    <div className="mt-3">
                      <div className="text-xs text-[#92400E] mb-1.5 flex items-center gap-1"><Paperclip className="w-3.5 h-3.5" />工单附件</div>
                      <AttachmentList attachments={selectedOrder.attachments} />
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm font-semibold text-[#1F2937] mb-2 flex items-center gap-1">
                    <ListChecks className="w-4 h-4 text-[#1B3A5C]" />整改措施
                  </div>
                  <div className="p-4 bg-[#F7FAFC] rounded-xl text-sm text-[#1F2937] whitespace-pre-wrap leading-7">
                    {selected.measure}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-[#1F2937] mb-3 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-[#1B3A5C]" />进度追踪
                  </div>
                  <div className="space-y-0 relative pl-5">
                    <div className="absolute left-[7px] top-1 bottom-1 w-px bg-[#E2E8F0]" />
                    {selected.timeline.map((t, i) => (
                      <div key={i} className="relative pb-5 last:pb-0">
                        <div className={`absolute -left-5 top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          i === selected.timeline.length - 1 ? 'bg-[#1B3A5C]' : 'bg-[#CBD5E1]'
                        }`} />
                        <div className="text-xs text-[#64748B]">{new Date(t.time).toLocaleString('zh-CN')}</div>
                        <div className="text-sm font-medium text-[#1F2937] mt-0.5">{t.event}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {selected.status === 'reviewing' && (
                  <div className="pt-4 border-t border-[#E2E8F0] flex justify-end gap-3">
                    <button className="btn-danger" onClick={() => { reviewRectification(selected.id, false); }}>
                      复核不通过
                    </button>
                    <button className="btn-primary" onClick={() => { reviewRectification(selected.id, true); }}>
                      <CircleCheck className="w-4 h-4" /> 复核通过并关闭
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showCreate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-6"
          onClick={() => setShowCreate(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="card p-6 w-full max-w-xl max-h-[90vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "'Noto Serif SC', serif" }}>创建整改任务</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label-field">关联工单（可选）</label>
                <select className="input-field" value={form.workOrderId} onChange={e => {
                  setForm({ ...form, workOrderId: e.target.value });
                  const order = workOrders.find(w => w.id === e.target.value);
                  if (order) setForm(f => ({ ...f, title: `工单${order.id}整改 - ${order.title.slice(0, 20)}` }));
                }}>
                  <option value="">不关联工单</option>
                  {workOrders.filter(w => w.status !== 'closed').map(w => (
                    <option key={w.id} value={w.id}>{w.id} - {w.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">整改标题 <span className="text-[#DC2626]">*</span></label>
                <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="label-field">整改措施 <span className="text-[#DC2626]">*</span></label>
                <textarea className="input-field h-28 resize-none text-sm" value={form.measure} onChange={e => setForm({ ...form, measure: e.target.value })} placeholder="请详细描述整改措施和步骤..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">责任部门 <span className="text-[#DC2626]">*</span></label>
                  <select className="input-field" value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
                    <option value="">请选择</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">责任人 <span className="text-[#DC2626]">*</span></label>
                  <input className="input-field" value={form.responsiblePerson} onChange={e => setForm({ ...form, responsiblePerson: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label-field">完成期限 <span className="text-[#DC2626]">*</span></label>
                <input type="date" className="input-field" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
                <button type="submit" className="btn-primary">创建任务</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
