import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User, Building2, FileText, Paperclip, Send, X, ChevronDown,
  MessageSquare, Clock, AlertCircle, UserCheck, Upload
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { categories, departments, replyTemplates, stations } from '@/data/mockBase';
import { StatusBadge, UrgencyBadge, ChannelBadge } from '@/components/common/Badges';
import CountdownTimer from '@/components/common/CountdownTimer';
import AttachmentList from '@/components/common/AttachmentList';
import type { Attachment } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function Processing() {
  const workOrders = useAppStore(s => s.workOrders);
  const assignWorkOrder = useAppStore(s => s.assignWorkOrder);
  const processWorkOrder = useAppStore(s => s.processWorkOrder);
  const addAttachment = useAppStore(s => s.addAttachment);
  const removeAttachment = useAppStore(s => s.removeAttachment);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('open'));
  const [tab, setTab] = useState<'pending' | 'processing'>('pending');

  useEffect(() => {
    const openId = searchParams.get('open');
    if (openId) {
      setSelectedId(openId);
      const order = workOrders.find(w => w.id === openId);
      if (order) {
        setTab(order.status === 'pending' ? 'pending' : 'processing');
      }
    }
  }, [searchParams, workOrders]);

  const [deptId, setDeptId] = useState('');
  const [assignee, setAssignee] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const filtered = useMemo(() => {
    if (tab === 'pending') return workOrders.filter(w => w.status === 'pending');
    return workOrders.filter(w => w.status === 'processing');
  }, [workOrders, tab]);

  const selected = workOrders.find(w => w.id === selectedId) || null;

  function handleAssign() {
    if (!selectedId || !deptId || !assignee) { alert('请选择责任部门和受理人'); return; }
    assignWorkOrder(selectedId, deptId, assignee);
    setShowAssign(false);
    setDeptId('');
    setAssignee('');
  }

  function handleProcess() {
    if (!selectedId || !replyContent.trim()) { alert('请填写答复内容'); return; }
    processWorkOrder(selectedId, replyContent);
    setReplyContent('');
    setSelectedId(null);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selectedId) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const att: Attachment = {
          id: `att${Date.now()}${Math.floor(Math.random() * 1000)}`,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          dataUrl: reader.result as string,
          uploadedAt: new Date().toISOString(),
        };
        addAttachment(selectedId, att);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function useTemplate(tpl: string) {
    setReplyContent(tpl);
    setShowTemplates(false);
  }

  return (
    <div className="flex gap-5 h-[calc(100vh-140px)]">
      <div className="flex-1 card flex flex-col min-w-0">
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-1 p-1 bg-[#F0F4F8] rounded-lg">
            {(['pending', 'processing'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setSelectedId(null); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === t ? 'bg-white text-[#1B3A5C] shadow-sm' : 'text-[#64748B] hover:text-[#1F2937]'
                }`}
              >
                {t === 'pending' ? `待受理（${workOrders.filter(w => w.status === 'pending').length}）` : `处理中（${workOrders.filter(w => w.status === 'processing').length}）`}
              </button>
            ))}
          </div>
          <div className="text-xs text-[#64748B]">共 {filtered.length} 条</div>
        </div>
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead className="sticky top-0 bg-white z-10">
              <tr>
                <th className="table-header">工单号</th>
                <th className="table-header">标题</th>
                <th className="table-header">渠道/旅客</th>
                <th className="table-header">分类</th>
                <th className="table-header">紧急度</th>
                <th className="table-header">处理时限</th>
                <th className="table-header">责任部门</th>
                <th className="table-header">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr
                  key={o.id}
                  className={`cursor-pointer transition-colors ${selectedId === o.id ? 'bg-[#DBEAFE]/40' : 'hover:bg-[#F7FAFC]'}`}
                  onClick={() => setSelectedId(o.id)}
                >
                  <td className="table-cell font-mono text-xs text-[#64748B]">{o.id}</td>
                  <td className="table-cell max-w-[200px] truncate font-medium">{o.title}</td>
                  <td className="table-cell">
                    <div className="flex flex-col gap-1">
                      <ChannelBadge channel={o.channel} />
                      <span className="text-xs text-[#64748B]">{o.passengerName} · {o.passengerPhone}</span>
                    </div>
                  </td>
                  <td className="table-cell text-xs text-[#475569]">{o.categoryName}</td>
                  <td className="table-cell"><UrgencyBadge urgency={o.urgency} /></td>
                  <td className="table-cell"><CountdownTimer deadline={o.deadline} /></td>
                  <td className="table-cell text-xs text-[#475569]">{o.departmentName || <span className="text-[#94A3B8]">未分派</span>}</td>
                  <td className="table-cell">
                    {tab === 'pending' ? (
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedId(o.id); setShowAssign(true); }}
                        className="text-xs px-3 py-1 rounded-md bg-[#1B3A5C] text-white hover:bg-[#152E48]"
                      >分派</button>
                    ) : (
                      <span className="text-xs text-[#64748B]">{o.assignee}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="w-96 card flex flex-col flex-shrink-0 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-gradient-to-r from-[#1B3A5C] to-[#2A5580]">
              <div>
                <div className="font-mono text-xs text-white/70">{selected.id}</div>
                <div className="text-white font-semibold">{selected.title}</div>
              </div>
              <button onClick={() => setSelectedId(null)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <StatusBadge status={selected.status} />
                  <UrgencyBadge urgency={selected.urgency} />
                  <ChannelBadge channel={selected.channel} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-[#F7FAFC] rounded-lg">
                    <div className="text-xs text-[#64748B] flex items-center gap-1"><User className="w-3.5 h-3.5" />旅客姓名</div>
                    <div className="mt-1 font-medium text-[#1F2937]">{selected.passengerName}</div>
                  </div>
                  <div className="p-3 bg-[#F7FAFC] rounded-lg">
                    <div className="text-xs text-[#64748B] flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />联系电话</div>
                    <div className="mt-1 font-medium text-[#1F2937]">{selected.passengerPhone}</div>
                  </div>
                  <div className="p-3 bg-[#F7FAFC] rounded-lg">
                    <div className="text-xs text-[#64748B]">问题分类</div>
                    <div className="mt-1 font-medium text-[#1F2937]">{selected.categoryName}</div>
                  </div>
                  <div className="p-3 bg-[#F7FAFC] rounded-lg">
                    <div className="text-xs text-[#64748B] flex items-center gap-1"><Clock className="w-3.5 h-3.5" />处理时限</div>
                    <div className="mt-1"><CountdownTimer deadline={selected.deadline} /></div>
                  </div>
                </div>
                {(selected.trainNumber || selected.stationId) && (
                  <div className="p-3 bg-[#F0F9FF] rounded-lg border border-[#BAE6FD]">
                    <div className="text-xs text-[#0369A1] mb-1">关联行程信息</div>
                    <div className="text-sm font-medium text-[#0C4A6E]">
                      {selected.trainNumber && `车次: ${selected.trainNumber}`}
                      {selected.stationId && ` · 站点: ${stations.find(s => s.id === selected.stationId)?.name}`}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-[#64748B] mb-2 flex items-center gap-1"><FileText className="w-3.5 h-3.5" />问题描述</div>
                  <div className="p-3 bg-[#F7FAFC] rounded-lg text-sm text-[#1F2937] leading-relaxed whitespace-pre-wrap">{selected.description}</div>
                </div>
                {selected.reply && (
                  <div>
                    <div className="text-xs text-[#64748B] mb-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />当前处理进展</div>
                    <div className="p-3 bg-[#FEF3C7] rounded-lg text-sm text-[#92400E] border border-[#FDE68A]">{selected.reply}</div>
                  </div>
                )}

                <div>
                  <div className="text-xs text-[#64748B] mb-2">处理日志</div>
                  <div className="space-y-3">
                    {selected.logs.map(log => (
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

                <div>
                  <div className="text-xs text-[#64748B] mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1"><Paperclip className="w-3.5 h-3.5" />工单附件</span>
                    {selected.status === 'processing' && (
                      <>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1 text-[#1B3A5C] hover:underline"
                        >
                          <Upload className="w-3.5 h-3.5" /> 上传附件
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </>
                    )}
                  </div>
                  <AttachmentList
                    attachments={selected.attachments}
                    onRemove={selected.status === 'processing' ? (id) => removeAttachment(selected.id, id) : undefined}
                  />
                </div>

                {selected.status === 'processing' && (
                  <div className="pt-3 border-t border-[#E2E8F0]">
                    <div className="text-xs text-[#64748B] mb-2 flex items-center justify-between">
                      <span>答复内容</span>
                      <button onClick={() => setShowTemplates(v => !v)} className="flex items-center gap-1 text-[#1B3A5C] hover:underline">
                        答复模板 <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    {showTemplates && (
                      <div className="mb-2 p-2 bg-[#F7FAFC] rounded-lg border border-[#E2E8F0] space-y-1">
                        {replyTemplates.map(t => (
                          <button
                            key={t.id}
                            onClick={() => useTemplate(t.content)}
                            className="w-full text-left px-3 py-2 rounded-md text-xs hover:bg-white hover:shadow-sm transition-all"
                          >
                            <div className="font-medium text-[#1F2937]">{t.title}</div>
                            <div className="text-[#64748B] mt-0.5 line-clamp-1">{t.content}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    <textarea
                      className="input-field h-28 resize-none text-sm"
                      value={replyContent}
                      onChange={e => setReplyContent(e.target.value)}
                      placeholder="请输入答复旅客的内容..."
                    />
                    <div className="flex items-center justify-end mt-3">
                      <button className="btn-primary text-sm py-1.5" onClick={handleProcess}>
                        <Send className="w-4 h-4" /> 提交处理并进入回访
                      </button>
                    </div>
                  </div>
                )}

                {selected.status === 'pending' && (
                  <div className="pt-3 border-t border-[#E2E8F0]">
                    <button className="btn-primary w-full" onClick={() => setShowAssign(true)}>
                      <UserCheck className="w-4 h-4" /> 受理并分派
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showAssign && selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-6"
          onClick={() => setShowAssign(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="card p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "'Noto Serif SC', serif" }}>受理分派工单</h3>
            <div className="space-y-4">
              <div>
                <label className="label-field flex items-center gap-1"><Building2 className="w-4 h-4" />责任部门</label>
                <select className="input-field" value={deptId} onChange={e => setDeptId(e.target.value)}>
                  <option value="">请选择部门</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-field flex items-center gap-1"><User className="w-4 h-4" />受理人</label>
                <input className="input-field" value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="请输入受理人姓名" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button className="btn-secondary" onClick={() => setShowAssign(false)}>取消</button>
                <button className="btn-primary" onClick={handleAssign}>确认分派</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
