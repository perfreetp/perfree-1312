import { useNavigate } from 'react-router-dom';
import {
  FilePlus, Clock, AlertTriangle, CheckCircle,
  Phone, Globe, Smartphone, Building2, ClipboardCheck,
  TrendingUp, TrendingDown, ArrowRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Area } from 'recharts';
import { useAppStore, useWorkOrderStats } from '@/stores/appStore';
import { StatusBadge, UrgencyBadge, ChannelBadge } from '@/components/common/Badges';
import CountdownTimer from '@/components/common/CountdownTimer';
import { motion } from 'framer-motion';

const PIE_COLORS = ['#E8A838', '#1B3A5C', '#6366F1', '#22C55E'];

export default function Overview() {
  const navigate = useNavigate();
  const stats = useWorkOrderStats();
  const workOrders = useAppStore(s => s.workOrders);
  const now = Date.now();

  const statusDist = [
    { name: '待受理', value: workOrders.filter(w => w.status === 'pending').length },
    { name: '处理中', value: workOrders.filter(w => w.status === 'processing').length },
    { name: '待回访', value: workOrders.filter(w => w.status === 'followup').length },
    { name: '已关闭', value: workOrders.filter(w => w.status === 'closed').length },
  ];

  const trendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    const start = new Date(d); start.setHours(0, 0, 0, 0);
    const end = new Date(d); end.setHours(23, 59, 59, 999);
    return {
      date: label,
      新增: workOrders.filter(w => {
        const t = new Date(w.createdAt).getTime();
        return t >= start.getTime() && t <= end.getTime();
      }).length,
      完成: workOrders.filter(w => {
        const t = w.closedAt ? new Date(w.closedAt).getTime() : 0;
        return t >= start.getTime() && t <= end.getTime();
      }).length,
    };
  });

  const urgentOrders = workOrders
    .filter(w => w.status !== 'closed' && (w.urgency === 'urgent' || w.urgency === 'high' || new Date(w.deadline).getTime() < now))
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5);

  const recentOrders = workOrders.slice(0, 6);

  const statCards = [
    { label: '今日新增工单', value: stats.todayNew, icon: FilePlus, color: 'from-[#1B3A5C] to-[#2A5580]', trend: '+12%', trendUp: true, path: '/channel' },
    { label: '待处理投诉', value: stats.pending, icon: Clock, color: 'from-[#E8A838] to-[#F2B84B]', trend: '-5%', trendUp: false, path: '/processing' },
    { label: '即将超时工单', value: stats.overdue, icon: AlertTriangle, color: 'from-[#DC2626] to-[#EF4444]', trend: '+2', trendUp: true, path: '/processing' },
    { label: '整改待复核', value: stats.pendingReview, icon: ClipboardCheck, color: 'from-[#6366F1] to-[#818CF8]', trend: '待处理', trendUp: true, path: '/rectification' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="relative overflow-hidden rounded-xl p-5 text-white cursor-pointer group"
              style={{ background: `linear-gradient(135deg, ${card.color.includes('from-') ? '' : card.color})` }}
              onClick={() => navigate(card.path)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-100`} />
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm/5 text-white/80">{card.label}</div>
                    <div className="mt-2 text-3xl font-bold tracking-tight">{card.value}</div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-white/80">
                  {card.trendUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{card.trend}</span>
                  <span className="ml-auto flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    查看 <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#1F2937]" style={{ fontFamily: "'Noto Serif SC', serif" }}>工单状态分布</h3>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusDist} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusDist.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {statusDist.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                <span className="text-[#64748B]">{s.name}</span>
                <span className="ml-auto font-semibold text-[#1F2937]">{s.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-5 col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#1F2937]" style={{ fontFamily: "'Noto Serif SC', serif" }}>近7日工单趋势</h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#1B3A5C]" />新增</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#22C55E]" />完成</span>
            </div>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B3A5C" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1B3A5C" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="新增" stroke="#1B3A5C" strokeWidth={2.5} fill="url(#g1)" dot={{ r: 3, fill: '#1B3A5C' }} />
                <Area type="monotone" dataKey="完成" stroke="#22C55E" strokeWidth={2.5} fill="url(#g2)" dot={{ r: 3, fill: '#22C55E' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card p-5"
        >
          <h3 className="text-base font-semibold text-[#1F2937] mb-4" style={{ fontFamily: "'Noto Serif SC', serif" }}>渠道分布</h3>
          <div className="space-y-3">
            {[
              { label: '12306热线', value: stats.hotlineCount, icon: Phone, color: '#1B3A5C' },
              { label: '官方网站', value: stats.webCount, icon: Globe, color: '#0891B2' },
              { label: '手机APP', value: stats.appCount, icon: Smartphone, color: '#7C3AED' },
              { label: '车站现场', value: stats.stationCount, icon: Building2, color: '#DB2777' },
            ].map(item => {
              const Icon = item.icon;
              const total = stats.hotlineCount + stats.webCount + stats.appCount + stats.stationCount || 1;
              const pct = Math.round(item.value / total * 100);
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="flex items-center gap-2 text-[#475569]">
                      <Icon className="w-4 h-4" style={{ color: item.color }} />
                      {item.label}
                    </span>
                    <span className="font-semibold text-[#1F2937]">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: item.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#1F2937] flex items-center gap-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
              紧急工单预警
            </h3>
            <button onClick={() => navigate('/processing')} className="text-xs text-[#1B3A5C] hover:underline">
              查看全部
            </button>
          </div>
          <div className="divide-y divide-[#F1F5F9]">
            {urgentOrders.length === 0 && (
              <div className="py-10 text-center text-sm text-[#94A3B8]">暂无紧急工单</div>
            )}
            {urgentOrders.map(order => {
              const isOverdue = new Date(order.deadline).getTime() < now;
              return (
                <div
                  key={order.id}
                  className={`px-5 py-3.5 flex items-start gap-3 hover:bg-[#F7FAFC] transition-colors cursor-pointer ${isOverdue ? 'border-l-4 border-[#DC2626] bg-[#FEF2F2]/50' : 'border-l-4 border-[#E8A838] bg-[#FFFBEB]/30'}`}
                  onClick={() => navigate('/processing')}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#1F2937] text-sm truncate">{order.title}</span>
                      <UrgencyBadge urgency={order.urgency} />
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[#64748B]">
                      <span>{order.id}</span>
                      <ChannelBadge channel={order.channel} />
                      <span>{order.passengerName}</span>
                    </div>
                  </div>
                  <CountdownTimer deadline={order.deadline} />
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="card"
        >
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#1F2937]" style={{ fontFamily: "'Noto Serif SC', serif" }}>近期工单</h3>
            <button onClick={() => navigate('/processing')} className="text-xs text-[#1B3A5C] hover:underline">
              查看全部
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">工单号</th>
                  <th className="table-header">标题</th>
                  <th className="table-header">紧急度</th>
                  <th className="table-header">状态</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id} className="hover:bg-[#F7FAFC] cursor-pointer" onClick={() => navigate('/processing')}>
                    <td className="table-cell font-mono text-xs text-[#64748B]">{o.id}</td>
                    <td className="table-cell max-w-[240px] truncate">{o.title}</td>
                    <td className="table-cell"><UrgencyBadge urgency={o.urgency} /></td>
                    <td className="table-cell"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
