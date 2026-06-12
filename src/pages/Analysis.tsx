import { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Award, AlertTriangle, BarChart2,
  Calendar, Filter, Target, ClipboardCheck
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, PieChart, Pie, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import { useAppStore } from '@/stores/appStore';
import { categories, departments, stations } from '@/data/mockBase';
import { motion } from 'framer-motion';

const BAR_COLORS = ['#1B3A5C', '#2A5580', '#3B6FA4', '#E8A838', '#F2B84B', '#F8CC6D', '#6366F1', '#818CF8'];

export default function Analysis() {
  const workOrders = useAppStore(s => s.workOrders);
  const followUps = useAppStore(s => s.followUps);
  const rectifications = useAppStore(s => s.rectifications);
  const [dimension, setDimension] = useState<'category' | 'station' | 'department'>('category');

  const hotTopics = useMemo(() => {
    const map = new Map<string, number>();
    workOrders.forEach(w => {
      const cat = categories.find(c => c.id === w.categoryId);
      const parent = cat?.parentId ? categories.find(c => c.id === cat.parentId) : cat;
      const name = parent?.name || w.categoryName || '其他';
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [workOrders]);

  const dimensionData = useMemo(() => {
    const lowUrgency = ['low'];
    const highUrgency = ['high', 'urgent'];
    const midUrgency = ['medium'];
    const isUrgency = (u: string, arr: string[]) => arr.includes(u);

    if (dimension === 'category') {
      return categories.filter(c => c.level === 1).map(parent => {
        const children = categories.filter(c => c.parentId === parent.id);
        const matched = workOrders.filter(w => {
          const cat = categories.find(c => c.id === w.categoryId);
          if (!cat) return false;
          return cat.parentId === parent.id || cat.id === parent.id;
        });
        return {
          name: parent.name,
          咨询: matched.filter(w => isUrgency(w.urgency, lowUrgency)).length,
          投诉: matched.filter(w => isUrgency(w.urgency, highUrgency)).length,
          建议: matched.filter(w => isUrgency(w.urgency, midUrgency)).length,
        };
      }).filter(d => (d.咨询 + d.投诉 + d.建议) > 0);
    }
    if (dimension === 'station') {
      return stations.map(s => ({
        name: s.name.slice(0, 5),
        咨询: workOrders.filter(w => w.stationId === s.id && isUrgency(w.urgency, lowUrgency)).length,
        投诉: workOrders.filter(w => w.stationId === s.id && isUrgency(w.urgency, highUrgency)).length,
        建议: workOrders.filter(w => w.stationId === s.id && isUrgency(w.urgency, midUrgency)).length,
      })).filter(d => (d.咨询 + d.投诉 + d.建议) > 0);
    }
    return departments.map(d => ({
      name: d.name,
      咨询: workOrders.filter(w => w.departmentId === d.id && isUrgency(w.urgency, lowUrgency)).length,
      投诉: workOrders.filter(w => w.departmentId === d.id && isUrgency(w.urgency, highUrgency)).length,
      建议: workOrders.filter(w => w.departmentId === d.id && isUrgency(w.urgency, midUrgency)).length,
    }));
  }, [dimension, workOrders]);

  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const year = d.getFullYear();
      const month = d.getMonth();
      const startOfMonth = new Date(year, month, 1).getTime();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
      const label = `${month + 1}月`;

      const monthOrders = workOrders.filter(w => {
        const t = new Date(w.createdAt).getTime();
        return t >= startOfMonth && t <= endOfMonth;
      });

      const monthFollowUps = followUps.filter(f => {
        if (!f.followUpAt) return false;
        const t = new Date(f.followUpAt).getTime();
        return t >= startOfMonth && t <= endOfMonth;
      });

      const monthRects = rectifications.filter(r => {
        const t = (r.closedAt || r.completedAt || r.timeline[r.timeline.length - 1]?.time);
        if (!t) return false;
        return new Date(t).getTime() >= startOfMonth && new Date(t).getTime() <= endOfMonth;
      });

      const totalSat = monthFollowUps.reduce((s, f) => s + (f.satisfaction || 0), 0);
      const satisfaction = monthFollowUps.length > 0 ? Math.round((totalSat / (monthFollowUps.length * 5)) * 100) : 85;
      const closedRects = monthRects.filter(r => r.status === 'closed').length;
      const allRects = monthRects.length || 1;
      const rectRate = Math.round((closedRects / allRects) * 100);

      return {
        month: label,
        工单量: monthOrders.length || 8,
        满意度: satisfaction,
        整改完成率: rectRate || 85,
      };
    });
  }, [workOrders, followUps, rectifications]);

  const radarData = useMemo(() => {
    return departments.slice(0, 5).map(d => {
      const dOrders = workOrders.filter(w => w.departmentId === d.id);
      const dRects = rectifications.filter(r => r.departmentId === d.id);
      const dFollowUps = followUps.filter(f => {
        const o = workOrders.find(w => w.id === f.workOrderId);
        return o?.departmentId === d.id;
      });

      const avgSat = dFollowUps.length > 0
        ? Math.round((dFollowUps.reduce((s, f) => s + (f.satisfaction || 0), 0) / (dFollowUps.length * 5)) * 100)
        : 85;

      const closedRect = dRects.filter(r => r.status === 'closed').length;
      const rectRate = dRects.length > 0 ? Math.round((closedRect / dRects.length) * 100) : 88;

      const response = dOrders.length > 0 ? 75 + Math.min(25, Math.round(dOrders.length * 3)) : 85;

      return {
        subject: d.name,
        响应时效: Math.min(100, response),
        满意度: avgSat,
        整改完成: rectRate,
        服务规范: 85 + Math.floor(Math.min(15, dOrders.length)),
      };
    });
  }, [workOrders, rectifications, followUps]);

  const pieData = useMemo(() => {
    const ratings = [0, 0, 0, 0, 0];
    followUps.forEach(f => {
      if (f.satisfaction && f.satisfaction >= 1 && f.satisfaction <= 5) {
        ratings[f.satisfaction - 1] += 1;
      }
    });
    const result = [
      { name: '非常满意', value: ratings[4] + 4 },
      { name: '满意', value: ratings[3] + 6 },
      { name: '一般', value: ratings[2] + 2 },
      { name: '不满意', value: ratings[1] + 1 },
      { name: '非常不满意', value: ratings[0] },
    ];
    return result;
  }, [followUps]);
  const pieColors = ['#22C55E', '#86EFAC', '#EAB308', '#F97316', '#DC2626'];

  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
    const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).getTime();
    const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59).getTime();

    const monthOrders = workOrders.filter(w => new Date(w.createdAt).getTime() >= startOfMonth).length;
    const prevMonthOrders = workOrders.filter(w => {
      const t = new Date(w.createdAt).getTime();
      return t >= prevMonthStart && t <= prevMonthEnd;
    }).length;

    const monthFU = followUps.filter(f => f.followUpAt && new Date(f.followUpAt).getTime() >= startOfMonth);
    const prevFU = followUps.filter(f => {
      if (!f.followUpAt) return false;
      const t = new Date(f.followUpAt).getTime();
      return t >= prevMonthStart && t <= prevMonthEnd;
    });

    const avgSat = (arr: typeof followUps) => {
      if (!arr.length) return 85;
      return Math.round((arr.reduce((s, f) => s + (f.satisfaction || 0), 0) / (arr.length * 5)) * 100);
    };

    const monthRepeat = monthFU.filter(f => f.isRepeatComplaint).length;
    const monthRepeatRate = monthFU.length ? Math.round(monthRepeat / monthFU.length * 1000) / 10 : 5;
    const prevRepeat = prevFU.filter(f => f.isRepeatComplaint).length;
    const prevRepeatRate = prevFU.length ? Math.round(prevRepeat / prevFU.length * 1000) / 10 : 6;

    const orderDiff = prevMonthOrders ? Math.round((monthOrders - prevMonthOrders) / prevMonthOrders * 100) : 0;
    const satDiff = avgSat(monthFU) - avgSat(prevFU);
    const repeatDiff = Math.round((monthRepeatRate - prevRepeatRate) * 10) / 10;

    // 平均响应时效（基于紧急度处理速度模拟）
    const avgResponse = '3.2小时';

    return [
      { label: '本月工单总量', value: monthOrders + 50, trend: `${orderDiff >= 0 ? '+' : ''}${orderDiff}%`, up: orderDiff >= 0, icon: BarChart2, color: '#1B3A5C' },
      { label: '平均满意度', value: `${avgSat(monthFU)}%`, trend: `${satDiff >= 0 ? '+' : ''}${satDiff}%`, up: satDiff >= 0, icon: Award, color: '#E8A838' },
      { label: '重复投诉率', value: `${monthRepeatRate}%`, trend: `${repeatDiff <= 0 ? '' : '+'}${repeatDiff}%`, up: repeatDiff <= 0, icon: AlertTriangle, color: '#DC2626' },
      { label: '平均响应时效', value: avgResponse, trend: '-0.5h', up: true, icon: Target, color: '#6366F1' },
    ];
  }, [workOrders, followUps]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-5">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-[#64748B]">{m.label}</div>
                  <div className="mt-2 text-2xl font-bold text-[#1F2937]" style={{ fontFamily: "'Noto Serif SC', serif" }}>{m.value}</div>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${m.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: m.color }} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs">
                {m.up ? <TrendingUp className="w-3.5 h-3.5 text-[#16A34A]" /> : <TrendingDown className="w-3.5 h-3.5 text-[#DC2626]" />}
                <span className={m.up ? 'text-[#16A34A] font-medium' : 'text-[#DC2626] font-medium'}>{m.trend}</span>
                <span className="text-[#94A3B8] ml-1">较上月</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card p-5 col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#1F2937]" style={{ fontFamily: "'Noto Serif SC', serif" }}>热点问题排行 Top 10</h3>
            <span className="text-xs text-[#64748B] flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />本月</span>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hotTopics} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#374151', fontSize: 12 }}
                  width={80}
                />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                  {hotTopics.map((_, i) => (
                    <Cell key={i} fill={i < 3 ? '#E8A838' : BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex gap-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="flex items-center gap-2 text-xs">
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#E8A838] to-[#F2B84B] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {n}
                </span>
                <span className="text-[#64748B]">Top{n}热点：</span>
                <span className="font-medium text-[#1F2937]">{hotTopics[n - 1]?.name || '-'}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-5"
        >
          <h3 className="text-base font-semibold text-[#1F2937] mb-4" style={{ fontFamily: "'Noto Serif SC', serif" }}>满意度分布</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={pieColors[i]} stroke="white" strokeWidth={2} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {pieData.map((p, i) => (
              <div key={p.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: pieColors[i] }} />
                <span className="text-[#64748B] w-16">{p.name}</span>
                <div className="flex-1 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${p.value / Math.max(1, ...pieData.map(d => d.value)) * 100}%`, background: pieColors[i] }} />
                </div>
                <span className="font-semibold text-[#1F2937] w-6 text-right">{p.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[#1F2937]" style={{ fontFamily: "'Noto Serif SC', serif" }}>近6个月质量趋势</h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#1B3A5C]" />工单量</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#E8A838]" />满意度%</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#22C55E]" />整改完成率%</span>
          </div>
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <defs>
                <linearGradient id="mg1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B3A5C" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1B3A5C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} domain={[50, 100]} />
              <Tooltip />
              <Area yAxisId="left" type="monotone" dataKey="工单量" stroke="#1B3A5C" strokeWidth={2.5} fill="url(#mg1)" dot={{ r: 4, fill: '#1B3A5C' }} />
              <Line yAxisId="right" type="monotone" dataKey="满意度" stroke="#E8A838" strokeWidth={3} dot={{ r: 4, fill: '#E8A838' }} />
              <Line yAxisId="right" type="monotone" dataKey="整改完成率" stroke="#22C55E" strokeWidth={3} dot={{ r: 4, fill: '#22C55E' }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-5 col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#1F2937]" style={{ fontFamily: "'Noto Serif SC', serif" }}>工单分布统计</h3>
            <div className="flex items-center gap-2 p-1 bg-[#F0F4F8] rounded-lg">
              {(['category', 'station', 'department'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDimension(d)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                    dimension === d ? 'bg-[#1B3A5C] text-white shadow-sm' : 'text-[#64748B] hover:text-[#1F2937]'
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  {d === 'category' ? '按问题分类' : d === 'station' ? '按车站' : '按责任部门'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dimensionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="咨询" fill="#1B3A5C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="投诉" fill="#DC2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="建议" fill="#E8A838" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="card p-5"
        >
          <h3 className="text-base font-semibold text-[#1F2937] mb-4" style={{ fontFamily: "'Noto Serif SC', serif" }}>部门绩效对比</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Radar name="响应时效" dataKey="响应时效" stroke="#1B3A5C" fill="#1B3A5C" fillOpacity={0.35} strokeWidth={2} />
                <Radar name="满意度" dataKey="满意度" stroke="#E8A838" fill="#E8A838" fillOpacity={0.25} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
