import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Phone, Globe, Smartphone, Building2, Search, Train } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts';
import { useAppStore, useWorkOrderStats } from '@/stores/appStore';
import { categories, stations } from '@/data/mockBase';
import { UrgencyBadge, ChannelBadge, StatusBadge } from '@/components/common/Badges';
import type { Channel, Urgency } from '@/types';
import { motion } from 'framer-motion';

export default function Channel() {
  const workOrders = useAppStore(s => s.workOrders);
  const addWorkOrder = useAppStore(s => s.addWorkOrder);
  const stats = useWorkOrderStats();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ c1: true, c2: true, c3: true, c4: true, c5: true });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [stationKeyword, setStationKeyword] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    channel: 'hotline' as Channel,
    urgency: 'medium' as Urgency,
    passengerName: '',
    passengerPhone: '',
    trainNumber: '',
    stationId: '',
    categoryId: '',
    categoryName: '',
  });
  const [showForm, setShowForm] = useState(false);

  const topCats = categories.filter(c => c.level === 1).map(parent => {
    const children = categories.filter(c => c.parentId === parent.id);
    const count = workOrders.filter(w => children.some(c => c.id === w.categoryId)).length;
    return { name: parent.name, value: count, id: parent.id };
  }).filter(c => c.value > 0);

  const filteredOrders = selectedCategory
    ? workOrders.filter(w => {
        const cat = categories.find(c => c.id === w.categoryId);
        return cat && (cat.id === selectedCategory || cat.parentId === selectedCategory);
      })
    : workOrders;

  const urgencyHours: Record<Urgency, number> = { urgent: 2, high: 8, medium: 24, low: 72 };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.description || !form.passengerName || !form.passengerPhone || !form.categoryId) {
      alert('请填写完整信息');
      return;
    }
    const cat = categories.find(c => c.id === form.categoryId);
    addWorkOrder({
      ...form,
      categoryName: cat?.name || '',
      stationId: form.stationId || undefined,
      trainNumber: form.trainNumber || undefined,
      deadline: new Date(Date.now() + urgencyHours[form.urgency] * 3600 * 1000).toISOString(),
    });
    alert('工单创建成功！');
    setForm({ title: '', description: '', channel: 'hotline', urgency: 'medium', passengerName: '', passengerPhone: '', trainNumber: '', stationId: '', categoryId: '', categoryName: '' });
    setShowForm(false);
  }

  function renderTree() {
    return categories.filter(c => c.level === 1).map(parent => {
      const children = categories.filter(c => c.parentId === parent.id);
      const isOpen = expanded[parent.id];
      return (
        <div key={parent.id}>
          <div
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${selectedCategory === parent.id ? 'bg-[#1B3A5C] text-white' : 'text-[#374151] hover:bg-[#F0F4F8]'}`}
            onClick={() => { setExpanded({ ...expanded, [parent.id]: !isOpen }); setSelectedCategory(parent.id); }}
          >
            {children.length > 0 && (
              isOpen ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="flex-1 truncate">{parent.name}</span>
          </div>
          {isOpen && children.map(child => (
            <div
              key={child.id}
              className={`flex items-center gap-1.5 pl-8 pr-3 py-1.5 rounded-lg cursor-pointer text-sm transition-colors ${selectedCategory === child.id ? 'bg-[#E8A838]/20 text-[#92400E] font-medium' : 'text-[#64748B] hover:bg-[#F0F4F8]'}`}
              onClick={() => { setSelectedCategory(child.id); setForm({ ...form, categoryId: child.id, categoryName: child.name }); }}
            >
              {child.name}
            </div>
          ))}
        </div>
      );
    });
  }

  const matchedStations = stationKeyword
    ? stations.filter(s => s.name.includes(stationKeyword))
    : [];

  return (
    <div className="flex gap-5 h-[calc(100vh-140px)]">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-56 card p-4 flex flex-col flex-shrink-0"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#1F2937]">问题分类</h3>
          {selectedCategory && (
            <button onClick={() => setSelectedCategory(null)} className="text-xs text-[#64748B] hover:underline">清除</button>
          )}
        </div>
        <div className="flex-1 overflow-auto space-y-0.5 pr-1">
          {renderTree()}
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col gap-5 min-w-0 overflow-auto">
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: '热线工单', value: stats.hotlineCount, icon: Phone, color: '#1B3A5C' },
            { label: '网页工单', value: stats.webCount, icon: Globe, color: '#0891B2' },
            { label: 'APP工单', value: stats.appCount, icon: Smartphone, color: '#7C3AED' },
            { label: '车站工单', value: stats.stationCount, icon: Building2, color: '#DB2777' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${item.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div>
                  <div className="text-xs text-[#64748B]">{item.label}</div>
                  <div className="text-xl font-bold text-[#1F2937]">{item.value}</div>
                </div>
              </div>
            );
          })}
          <button onClick={() => setShowForm(true)} className="btn-primary h-auto py-4">
            <Plus className="w-5 h-5" />
            新建工单
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-5"
        >
          <h3 className="text-base font-semibold text-[#1F2937] mb-4" style={{ fontFamily: "'Noto Serif SC', serif" }}>各渠道工单分布</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: '热线', value: stats.hotlineCount, fill: '#1B3A5C' },
                { name: '网页', value: stats.webCount, fill: '#0891B2' },
                { name: 'APP', value: stats.appCount, fill: '#7C3AED' },
                { name: '车站', value: stats.stationCount, fill: '#DB2777' },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={44}>
                  {topCats.map((_, i) => <Cell key={i} fill={['#1B3A5C', '#0891B2', '#7C3AED', '#DB2777'][i % 4]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card flex-1 flex flex-col min-h-0"
        >
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#1F2937]" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              工单列表 {selectedCategory && <span className="text-xs font-normal text-[#64748B] ml-2">（已筛选分类）</span>}
            </h3>
            <div className="relative">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索车次或站点..."
                value={stationKeyword}
                onChange={e => setStationKeyword(e.target.value)}
                className="pl-9 pr-4 py-2 w-56 rounded-lg bg-[#F0F4F8] border-0 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20"
              />
              {matchedStations.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg border border-[#E2E8F0] shadow-lg z-10 max-h-48 overflow-auto">
                  {matchedStations.map(s => (
                    <div key={s.id} className="px-3 py-2 text-sm hover:bg-[#F0F4F8] cursor-pointer" onClick={() => { setStationKeyword(s.name); setForm({ ...form, stationId: s.id }); }}>
                      {s.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr>
                  <th className="table-header">工单号</th>
                  <th className="table-header">标题</th>
                  <th className="table-header">渠道</th>
                  <th className="table-header">分类</th>
                  <th className="table-header">车次/站点</th>
                  <th className="table-header">紧急度</th>
                  <th className="table-header">旅客</th>
                  <th className="table-header">状态</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.slice(0, 20).map(o => (
                  <tr key={o.id} className="hover:bg-[#F7FAFC]">
                    <td className="table-cell font-mono text-xs text-[#64748B]">{o.id}</td>
                    <td className="table-cell max-w-[200px] truncate">{o.title}</td>
                    <td className="table-cell"><ChannelBadge channel={o.channel} /></td>
                    <td className="table-cell text-xs text-[#475569]">{o.categoryName}</td>
                    <td className="table-cell text-xs text-[#475569]">
                      <div className="flex items-center gap-1">
                        <Train className="w-3 h-3 text-[#1B3A5C]" />
                        {o.trainNumber || '-'} {o.stationId && `· ${stations.find(s => s.id === o.stationId)?.name || ''}`}
                      </div>
                    </td>
                    <td className="table-cell"><UrgencyBadge urgency={o.urgency} /></td>
                    <td className="table-cell text-xs">{o.passengerName}</td>
                    <td className="table-cell"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-6"
          onClick={() => setShowForm(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#1F2937]" style={{ fontFamily: "'Noto Serif SC', serif" }}>新建工单</h2>
              <button onClick={() => setShowForm(false)} className="text-[#64748B] hover:text-[#1F2937] text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">旅客姓名 <span className="text-[#DC2626]">*</span></label>
                  <input className="input-field" value={form.passengerName} onChange={e => setForm({ ...form, passengerName: e.target.value })} />
                </div>
                <div>
                  <label className="label-field">联系电话 <span className="text-[#DC2626]">*</span></label>
                  <input className="input-field" value={form.passengerPhone} onChange={e => setForm({ ...form, passengerPhone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label-field">工单标题 <span className="text-[#DC2626]">*</span></label>
                <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="请简要描述问题" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">来源渠道 <span className="text-[#DC2626]">*</span></label>
                  <select className="input-field" value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value as Channel })}>
                    <option value="hotline">12306热线</option>
                    <option value="web">官方网站</option>
                    <option value="app">手机APP</option>
                    <option value="station">车站现场</option>
                  </select>
                </div>
                <div>
                  <label className="label-field">紧急程度 <span className="text-[#DC2626]">*</span></label>
                  <select className="input-field" value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value as Urgency })}>
                    <option value="urgent">紧急（2小时内处理）</option>
                    <option value="high">高（8小时内处理）</option>
                    <option value="medium">中（24小时内处理）</option>
                    <option value="low">低（72小时内处理）</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">车次号</label>
                  <input className="input-field" value={form.trainNumber} onChange={e => setForm({ ...form, trainNumber: e.target.value.toUpperCase() })} placeholder="如：G101" />
                </div>
                <div>
                  <label className="label-field">关联站点</label>
                  <select className="input-field" value={form.stationId} onChange={e => setForm({ ...form, stationId: e.target.value })}>
                    <option value="">请选择</option>
                    {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label-field">问题分类 <span className="text-[#DC2626]">*</span></label>
                <select className="input-field" value={form.categoryId} onChange={e => {
                  const cat = categories.find(c => c.id === e.target.value);
                  setForm({ ...form, categoryId: e.target.value, categoryName: cat?.name || '' });
                }}>
                  <option value="">请选择分类</option>
                  {categories.filter(c => c.level === 2).map(c => {
                    const parent = categories.find(p => p.id === c.parentId);
                    return <option key={c.id} value={c.id}>{parent?.name} - {c.name}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="label-field">详细描述 <span className="text-[#DC2626]">*</span></label>
                <textarea
                  className="input-field h-28 resize-none"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="请详细描述旅客问题..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>取消</button>
                <button type="submit" className="btn-primary">提交工单</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
