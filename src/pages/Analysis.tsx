import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Award, AlertTriangle, BarChart2,
  Calendar, Filter, Target, ClipboardCheck, Zap, X,
  ChevronLeft, ChevronRight, ListChecks, ArrowRight, FileText,
  Building2, Clock, User, Search, ChevronDown, AlertCircle,
  ListOrdered, RefreshCcw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, PieChart, Pie, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import { useAppStore } from '@/stores/appStore';
import { categories, departments, stations } from '@/data/mockBase';
import { RectStatusBadge, StatusBadge, UrgencyBadge } from '@/components/common/Badges';
import WorkOrderDetailDrawer from '@/components/common/WorkOrderDetailDrawer';
import { motion, AnimatePresence } from 'framer-motion';

const BAR_COLORS = ['#1B3A5C', '#2A5580', '#3B6FA4', '#E8A838', '#F2B84B', '#F8CC6D', '#6366F1', '#818CF8'];
const PIE_COLORS = ['#22C55E', '#86EFAC', '#EAB308', '#F97316', '#DC2626'];
const PAGE_SIZE = 10;

export default function Analysis() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const workOrders = useAppStore(s => s.workOrders);
  const followUps = useAppStore(s => s.followUps);
  const rectifications = useAppStore(s => s.rectifications);
  const addRectification = useAppStore(s => s.addRectification);

  const [dimension, setDimension] = useState<'category' | 'station' | 'department'>('category');

  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const [filterMonth, setFilterMonth] = useState(searchParams.get('month') || defaultMonth);
  const [filterChannel, setFilterChannel] = useState(searchParams.get('channel') || '');
  const [filterStation, setFilterStation] = useState(searchParams.get('station') || '');
  const [filterDept, setFilterDept] = useState(searchParams.get('dept') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [showRectModal, setShowRectModal] = useState(false);
  const [rectSource, setRectSource] = useState<{ workOrderId: string; title: string; deptId: string; deptName: string; measure: string } | null>(null);
  const [drillOrders, setDrillOrders] = useState<{ orders: string[]; title: string } | null>(null);
  const [drawerOrderId, setDrawerOrderId] = useState<string | null>(null);
  const [drawerContext, setDrawerContext] = useState('');

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filterMonth && filterMonth !== defaultMonth) params.month = filterMonth;
    if (filterChannel) params.channel = filterChannel;
    if (filterStation) params.station = filterStation;
    if (filterDept) params.dept = filterDept;
    setSearchParams(params, { replace: true });
  }, [filterMonth, filterChannel, filterStation, filterDept]);

  useEffect(() => {
    const openId = searchParams.get('open');
    if (openId && (openId.startsWith('WO') || openId.startsWith('RE'))) {
      if (openId.startsWith('RE')) {
        const rect = rectifications.find(r => r.id === openId);
        if (rect) {
          setDrawerOrderId(rect.workOrderId);
          setDrawerContext('从整改详情返回');
        }
      } else {
        setDrawerOrderId(openId);
        setDrawerContext('从外部跳转');
      }
    }
  }, [searchParams, rectifications]);

  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    workOrders.forEach(w => {
      const d = new Date(w.createdAt);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    followUps.forEach(f => {
      if (f.followUpAt) {
        const d = new Date(f.followUpAt);
        set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    });
    if (!set.has(filterMonth)) set.add(filterMonth);
    return Array.from(set).sort().reverse();
  }, [workOrders, followUps, filterMonth]);

  const filteredOrders = useMemo(() => {
    const [fy, fm] = filterMonth.split('-').map(Number);
    const start = new Date(fy, fm - 1, 1).getTime();
    const end = new Date(fy, fm, 0, 23, 59, 59, 999).getTime();

    return workOrders.filter(w => {
      const t = new Date(w.createdAt).getTime();
      if (t < start || t > end) return false;
      if (filterChannel && w.channel !== filterChannel) return false;
      if (filterStation && w.stationId !== filterStation) return false;
      if (filterDept && w.departmentId !== filterDept) return false;
      return true;
    });
  }, [workOrders, filterMonth, filterChannel, filterStation, filterDept]);

  const filteredFollowUps = useMemo(() => {
    const [fy, fm] = filterMonth.split('-').map(Number);
    const start = new Date(fy, fm - 1, 1).getTime();
    const end = new Date(fy, fm, 0, 23, 59, 59, 999).getTime();

    return followUps.filter(f => {
      if (!f.followUpAt) return false;
      const t = new Date(f.followUpAt).getTime();
      if (t < start || t > end) return false;
      const order = workOrders.find(w => w.id === f.workOrderId);
      if (!order) return false;
      if (filterChannel && order.channel !== filterChannel) return false;
      if (filterStation && order.stationId !== filterStation) return false;
      if (filterDept && order.departmentId !== filterDept) return false;
      return true;
    });
  }, [followUps, workOrders, filterMonth, filterChannel, filterStation, filterDept]);

  const filteredRects = useMemo(() => {
    const orderIds = new Set(filteredOrders.map(o => o.id));
    return rectifications.filter(r => orderIds.has(r.workOrderId));
  }, [rectifications, filteredOrders]);

  const metrics = useMemo(() => {
    const orderCount = filteredOrders.length;
    const closedCount = filteredOrders.filter(w => w.status === 'closed').length;

    const doneFU = filteredFollowUps.filter(f => f.status === 'done');
    const totalSat = doneFU.reduce((s, f) => s + (f.satisfaction || 0), 0);
    const satisfaction = doneFU.length > 0 ? Math.round((totalSat / (doneFU.length * 5)) * 100) : 0;

    const closedRects = filteredRects.filter(r => r.status === 'closed').length;
    const allRects = filteredRects.length;
    const rectRate = allRects > 0 ? Math.round((closedRects / allRects) * 100) : 0;

    const lowScoreFU = doneFU.filter(f => (f.satisfaction || 0) <= 2);
    const repeatComplaints = filteredFollowUps.filter(f => f.isRepeatComplaint).length;
    const repeatRate = filteredFollowUps.length > 0 ? Math.round((repeatComplaints / filteredFollowUps.length) * 1000) / 10 : 0;

    return { orderCount, closedCount, satisfaction, rectRate, lowScoreCount: lowScoreFU.length, repeatRate, allRects, closedRects };
  }, [filteredOrders, filteredFollowUps, filteredRects]);

  const hotTopics = useMemo(() => {
    const map = new Map<string, { count: number; deptIds: Set<string>; orderIds: string[] }>();
    filteredOrders.forEach(w => {
      const cat = categories.find(c => c.id === w.categoryId);
      const parent = cat?.parentId ? categories.find(c => c.id === cat.parentId) : cat;
      const name = parent?.name || w.categoryName || '其他';
      const existing = map.get(name);
      if (existing) {
        existing.count++;
        if (w.departmentId) existing.deptIds.add(w.departmentId);
        existing.orderIds.push(w.id);
      } else {
        map.set(name, { count: 1, deptIds: new Set(w.departmentId ? [w.departmentId] : []), orderIds: [w.id] });
      }
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, value: data.count, deptIds: Array.from(data.deptIds), orderIds: data.orderIds }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredOrders]);

  const lowScoreFollowUps = useMemo(() => {
    return filteredFollowUps
      .filter(f => f.status === 'done' && (f.satisfaction || 0) <= 2)
      .map(f => {
        const order = workOrders.find(w => w.id === f.workOrderId);
        const rects = rectifications.filter(r => r.workOrderId === f.workOrderId);
        return { ...f, order, rects };
      });
  }, [filteredFollowUps, workOrders, rectifications]);

  const dimensionData = useMemo(() => {
    if (dimension === 'category') {
      return categories.filter(c => c.level === 1).map(parent => {
        const matched = filteredOrders.filter(w => {
          const cat = categories.find(c => c.id === w.categoryId);
          if (!cat) return false;
          return cat.parentId === parent.id || cat.id === parent.id;
        });
        return {
          name: parent.name,
          id: parent.id,
          type: 'category' as const,
          咨询: matched.filter(w => w.urgency === 'low').length,
          投诉: matched.filter(w => w.urgency === 'urgent' || w.urgency === 'high').length,
          建议: matched.filter(w => w.urgency === 'medium').length,
          orderIds: matched.map(w => w.id),
        };
      }).filter(d => (d.咨询 + d.投诉 + d.建议) > 0);
    }
    if (dimension === 'station') {
      return stations.map(s => {
        const matched = filteredOrders.filter(w => w.stationId === s.id);
        return {
          name: s.name.slice(0, 5),
          id: s.id,
          type: 'station' as const,
          咨询: matched.filter(w => w.urgency === 'low').length,
          投诉: matched.filter(w => (w.urgency === 'urgent' || w.urgency === 'high')).length,
          建议: matched.filter(w => w.urgency === 'medium').length,
          orderIds: matched.map(w => w.id),
        };
      }).filter(d => (d.咨询 + d.投诉 + d.建议) > 0);
    }
    return departments.map(d => {
      const matched = filteredOrders.filter(w => w.departmentId === d.id);
      return {
        name: d.name,
        id: d.id,
        type: 'department' as const,
        咨询: matched.filter(w => w.urgency === 'low').length,
        投诉: matched.filter(w => (w.urgency === 'urgent' || w.urgency === 'high')).length,
        建议: matched.filter(w => w.urgency === 'medium').length,
        orderIds: matched.map(w => w.id),
      };
    }).filter(d => (d.咨询 + d.投诉 + d.建议) > 0);
  }, [dimension, filteredOrders]);

  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const year = d.getFullYear();
      const month = d.getMonth();
      const startOfMonth = new Date(year, month, 1).getTime();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
      const label = `${month + 1}月`;
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

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

      const doneFU = monthFollowUps.filter(f => f.status === 'done');
      const totalSat = doneFU.reduce((s, f) => s + (f.satisfaction || 0), 0);
      const satisfaction = doneFU.length > 0 ? Math.round((totalSat / (doneFU.length * 5)) * 100) : 0;
      const closedRects = monthRects.filter(r => r.status === 'closed').length;
      const rectRate = monthRects.length > 0 ? Math.round((closedRects / monthRects.length) * 100) : 0;

      return {
        month: label,
        monthKey,
        工单量: monthOrders.length,
        满意度: satisfaction,
        整改完成率: rectRate,
        orderIds: monthOrders.map(w => w.id),
      };
    });
  }, [workOrders, followUps, rectifications]);

  const radarData = useMemo(() => {
    return departments.map(d => {
      const dOrders = filteredOrders.filter(w => w.departmentId === d.id);
      const dRects = filteredRects.filter(r => r.departmentId === d.id);
      const dFU = filteredFollowUps.filter(f => {
        const o = workOrders.find(w => w.id === f.workOrderId);
        return o?.departmentId === d.id;
      });

      const doneFU = dFU.filter(f => f.status === 'done');
      const avgSat = doneFU.length > 0
        ? Math.round((doneFU.reduce((s, f) => s + (f.satisfaction || 0), 0) / (doneFU.length * 5)) * 100)
        : 0;

      const closedRect = dRects.filter(r => r.status === 'closed').length;
      const rectRate = dRects.length > 0 ? Math.round((closedRect / dRects.length) * 100) : 0;

      const responseRate = dOrders.length > 0
        ? Math.min(100, Math.round((dOrders.filter(w => w.status !== 'pending').length / dOrders.length) * 100))
        : 0;

      const standardRate = dRects.length > 0
        ? Math.min(100, Math.round((dRects.filter(r => r.status === 'closed').length / dRects.length) * 100))
        : 0;

      return {
        subject: d.name,
        响应时效: responseRate,
        满意度: avgSat,
        整改完成: rectRate,
        服务规范: standardRate,
      };
    });
  }, [filteredOrders, filteredRects, filteredFollowUps, workOrders]);

  const pieData = useMemo(() => {
    const ratings = [0, 0, 0, 0, 0];
    filteredFollowUps.filter(f => f.status === 'done').forEach(f => {
      if (f.satisfaction && f.satisfaction >= 1 && f.satisfaction <= 5) {
        ratings[f.satisfaction - 1] += 1;
      }
    });
    return [
      { name: '非常满意', value: ratings[4] },
      { name: '满意', value: ratings[3] },
      { name: '一般', value: ratings[2] },
      { name: '不满意', value: ratings[1] },
      { name: '非常不满意', value: ratings[0] },
    ].filter(d => d.value > 0);
  }, [filteredFollowUps]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pagedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterMonth, filterChannel, filterStation, filterDept]);

  const openRectPlan = useCallback((source: { workOrderId: string; title: string; deptId: string; deptName: string; measure: string }) => {
    setRectSource(source);
    setShowRectModal(true);
  }, []);

  const handleCreateRect = () => {
    if (!rectSource) return;
    addRectification({
      workOrderId: rectSource.workOrderId,
      title: `整改计划 - ${rectSource.title.slice(0, 30)}`,
      measure: rectSource.measure,
      responsiblePerson: rectSource.deptName + '负责人',
      departmentId: rectSource.deptId,
      departmentName: rectSource.deptName,
      status: 'rectifying',
      deadline: new Date(Date.now() + 5 * 86400 * 1000).toISOString(),
    });
    setShowRectModal(false);
    setRectSource(null);
  };

  const handleHotTopicClick = (topic: { name: string; orderIds: string[] }) => {
    setDrillOrders({ orders: topic.orderIds, title: `热点问题：${topic.name}（共 ${topic.orderIds.length} 条）` });
  };

  const handleDimensionClick = (item: { name: string; type: string; orderIds: string[] }) => {
    const typeLabel = item.type === 'category' ? '问题分类' : item.type === 'station' ? '车站' : '责任部门';
    setDrillOrders({ orders: item.orderIds, title: `${typeLabel}：${item.name}（共 ${item.orderIds.length} 条）` });
  };

  const handleMonthClick = (data: { month: string; monthKey: string; orderIds: string[] }) => {
    setFilterMonth(data.monthKey);
    setDrawerContext(`月度趋势：${data.month}`);
  };

  const getRectForOrder = (orderId: string) => rectifications.filter(r => r.workOrderId === orderId);

  const clearFilters = () => {
    setFilterChannel('');
    setFilterStation('');
    setFilterDept('');
    setFilterMonth(defaultMonth);
  };

  const channelLabel = (c: string) => c === 'hotline' ? '12306热线' : c === 'web' ? '官方网站' : c === 'app' ? '手机APP' : '车站现场';

  const goToRectDetail = (rectId: string) => {
    navigate(`/rectification?open=${rectId}&returnTo=analysis&month=${filterMonth}&channel=${filterChannel}&station=${filterStation}&dept=${filterDept}`);
  };

  const drillOrderList = drillOrders
    ? drillOrders.orders.map(id => workOrders.find(w => w.id === id)).filter(Boolean)
    : [];

  return (
    <div className="space-y-5">
      {searchParams.get('returnTo') === 'analysis' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card p-3 flex items-center gap-3">
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.delete('returnTo');
              params.delete('open');
              setSearchParams(params, { replace: true });
            }}
            className="text-xs text-[#1B3A5C] hover:underline flex items-center gap-1"
          >
            <RefreshCcw className="w-3.5 h-3.5" /> 已从整改详情返回，点击清除返回标记
          </button>
        </motion.div>
      )}

      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1F2937]">
            <Filter className="w-4 h-4 text-[#1B3A5C]" />月度报告筛选
          </div>
          <select className="input-field w-40 text-sm" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="input-field w-32 text-sm" value={filterChannel} onChange={e => setFilterChannel(e.target.value)}>
            <option value="">全部渠道</option>
            <option value="hotline">12306热线</option>
            <option value="web">官方网站</option>
            <option value="app">手机APP</option>
            <option value="station">车站现场</option>
          </select>
          <select className="input-field w-32 text-sm" value={filterStation} onChange={e => setFilterStation(e.target.value)}>
            <option value="">全部车站</option>
            {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="input-field w-32 text-sm" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">全部部门</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {(filterChannel || filterStation || filterDept || filterMonth !== defaultMonth) && (
            <button onClick={clearFilters} className="text-xs text-[#DC2626] hover:underline flex items-center gap-1">
              <X className="w-3 h-3" />清除筛选
            </button>
          )}
          <div className="ml-auto text-xs text-[#94A3B8]">
            筛选结果：<span className="font-semibold text-[#1F2937]">{filteredOrders.length}</span> 条工单 / <span className="font-semibold text-[#1F2937]">{filteredFollowUps.filter(f => f.status === 'done').length}</span> 条回访 / <span className="font-semibold text-[#1F2937]">{filteredRects.length}</span> 条整改
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {[
          { label: '工单总量', value: metrics.orderCount, sub: `已关闭 ${metrics.closedCount}`, icon: BarChart2, color: '#1B3A5C' },
          { label: '回访满意度', value: metrics.satisfaction > 0 ? `${metrics.satisfaction}%` : '-', sub: `${metrics.lowScoreCount} 条低分`, icon: Award, color: '#E8A838' },
          { label: '整改完成率', value: metrics.allRects > 0 ? `${metrics.rectRate}%` : '-', sub: `${metrics.closedRects}/${metrics.allRects} 已完成`, icon: ClipboardCheck, color: '#22C55E' },
          { label: '重复投诉率', value: `${metrics.repeatRate}%`, sub: `${filteredFollowUps.filter(f => f.isRepeatComplaint).length} 条重复`, icon: AlertTriangle, color: '#DC2626' },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-[#64748B]">{m.label}</div>
                  <div className="mt-2 text-2xl font-bold text-[#1F2937]" style={{ fontFamily: "'Noto Serif SC', serif" }}>{m.value}</div>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${m.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: m.color }} />
                </div>
              </div>
              <div className="mt-3 text-xs text-[#94A3B8]">{m.sub}</div>
            </motion.div>
          );
        })}
      </div>

      {filteredRects.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#1F2937] flex items-center gap-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              <ListOrdered className="w-4 h-4" />整改进展追踪 ({filteredRects.length})
            </h3>
            <span className="text-xs text-[#64748B] flex items-center gap-1"><RefreshCcw className="w-3 h-3" />实时同步</span>
          </div>
          <div className="divide-y divide-[#F1F5F9] max-h-[320px] overflow-auto">
            {filteredRects.map(r => {
              const order = workOrders.find(w => w.id === r.workOrderId);
              return (
                <div key={r.id} className="px-5 py-3 hover:bg-[#F7FAFC] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <RectStatusBadge status={r.status} />
                        <span className="text-sm font-medium text-[#1F2937] truncate">{r.title}</span>
                      </div>
                      <div className="mt-1.5 grid grid-cols-4 gap-2 text-xs">
                        <div className="flex items-center gap-1 text-[#64748B]">
                          <Building2 className="w-3 h-3" />{r.departmentName}
                        </div>
                        <div className="flex items-center gap-1 text-[#64748B]">
                          <User className="w-3 h-3" />{r.responsiblePerson}
                        </div>
                        <div className="flex items-center gap-1 text-[#64748B]">
                          <Clock className="w-3 h-3" />{new Date(r.deadline).toLocaleDateString('zh-CN')}
                        </div>
                        <div className="flex items-center gap-1 text-[#64748B]">
                          <FileText className="w-3 h-3" />{order?.id || '手动创建'}
                        </div>
                      </div>
                      <div className="mt-1.5 flex items-start gap-2">
                        <span className="text-[11px] text-[#1B3A5C] flex-shrink-0 mt-0.5">措施：</span>
                        <p className="text-xs text-[#64748B] line-clamp-1">{r.measure}</p>
                      </div>
                      <div className="mt-1 text-[11px] text-[#94A3B8] flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" />最新进展：{r.timeline[r.timeline.length - 1]?.event || '处理中'}
                      </div>
                    </div>
                    <button
                      onClick={() => goToRectDetail(r.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#1B3A5C] text-white text-xs hover:bg-[#152E48] flex items-center gap-1 flex-shrink-0"
                    >
                      查看 <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#1F2937]" style={{ fontFamily: "'Noto Serif SC', serif" }}>热点问题排行</h3>
            <span className="text-xs text-[#64748B] flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{filterMonth}</span>
          </div>
          {hotTopics.length === 0 ? (
            <div className="h-[320px] flex items-center justify-center text-sm text-[#94A3B8]">当前筛选无数据</div>
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hotTopics} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 12 }} width={80} style={{ cursor: 'pointer' }} />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    radius={[0, 6, 6, 0]}
                    barSize={20}
                    cursor="pointer"
                    onClick={(data) => handleHotTopicClick(data.payload)}
                  >
                    {hotTopics.map((_, i) => (
                      <Cell key={i} fill={i < 3 ? '#E8A838' : BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-3">
            {hotTopics.slice(0, 3).map((topic, n) => (
              <div key={topic.name} className="flex items-center gap-2 text-xs">
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#E8A838] to-[#F2B84B] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">{n + 1}</span>
                <button onClick={() => handleHotTopicClick(topic)} className="text-[#64748B] hover:text-[#1B3A5C] hover:underline">
                  {topic.name}
                </button>
                <span className="font-semibold text-[#1F2937]">{topic.value}条</span>
                {topic.deptIds.length > 0 && (
                  <button
                    onClick={() => {
                      const deptId = topic.deptIds[0];
                      const dept = departments.find(d => d.id === deptId);
                      openRectPlan({
                        workOrderId: topic.orderIds[0],
                        title: topic.name,
                        deptId,
                        deptName: dept?.name || '',
                        measure: `针对"${topic.name}"高频问题制定整改措施：\n1. 分析问题根因并制定改进方案\n2. 组织相关部门专项排查\n3. 建立长效预防机制`,
                      });
                    }}
                    className="px-2 py-0.5 rounded bg-[#1B3A5C] text-white hover:bg-[#152E48] flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3" />一键整改
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-5">
          <h3 className="text-base font-semibold text-[#1F2937] mb-4" style={{ fontFamily: "'Noto Serif SC', serif" }}>满意度分布</h3>
          {pieData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-[#94A3B8]">暂无回访数据</div>
          ) : (
            <>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[PIE_COLORS.length - 1 - i] || PIE_COLORS[0]} stroke="white" strokeWidth={2} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {pieData.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[PIE_COLORS.length - 1 - i] || PIE_COLORS[0] }} />
                    <span className="text-[#64748B] w-16">{p.name}</span>
                    <div className="flex-1 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(p.value / Math.max(1, ...pieData.map(d => d.value)) * 100, 5)}%`, background: PIE_COLORS[PIE_COLORS.length - 1 - i] || PIE_COLORS[0] }} />
                    </div>
                    <span className="font-semibold text-[#1F2937] w-6 text-right">{p.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {lowScoreFollowUps.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#DC2626] flex items-center gap-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              <AlertTriangle className="w-4 h-4" />低分回访待整改 ({lowScoreFollowUps.length})
            </h3>
          </div>
          <div className="divide-y divide-[#F1F5F9]">
            {lowScoreFollowUps.map(fu => {
              const order = fu.order;
              const rects = fu.rects;
              const hasRect = rects.length > 0;
              return (
                <div key={fu.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-[#FEF2F2]/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setDrawerOrderId(fu.workOrderId); setDrawerContext('低分回访详情'); }}
                        className="font-medium text-[#1F2937] text-sm truncate hover:text-[#1B3A5C] hover:underline"
                      >
                        {order?.title || fu.workOrderId}
                      </button>
                      <span className="px-1.5 py-0.5 rounded bg-[#FEE2E2] text-[#991B1B] text-xs font-medium">{fu.satisfaction}星</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[#64748B]">
                      <span>{fu.workOrderId}</span>
                      {order && <span>{order.categoryName}</span>}
                      {order?.departmentName && <span>{order.departmentName}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasRect ? (
                      <div className="flex items-center gap-2">
                        {rects.map(r => (
                          <button key={r.id} onClick={() => goToRectDetail(r.id)} className="flex items-center gap-1 text-xs hover:underline">
                            <RectStatusBadge status={r.status} />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          const deptId = fu.responsibleDepartmentId || order?.departmentId || departments[0].id;
                          const dept = departments.find(d => d.id === deptId);
                          openRectPlan({
                            workOrderId: fu.workOrderId,
                            title: order?.title || fu.workOrderId,
                            deptId,
                            deptName: dept?.name || '',
                            measure: `针对旅客低分回访（${fu.satisfaction}星）制定整改措施：\n1. 分析旅客不满原因\n2. 制定针对性改进方案\n3. 跟踪落实并再次回访确认`,
                          });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#DC2626] text-white text-xs hover:bg-[#B91C1C] flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" />一键整改
                      </button>
                    )}
                    <button
                      onClick={() => { setDrawerOrderId(fu.workOrderId); setDrawerContext('低分回访详情'); }}
                      className="text-xs text-[#1B3A5C] hover:underline flex items-center gap-1"
                    >
                      查看工单 <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="card p-5">
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
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} domain={[0, 100]} />
              <Tooltip />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="工单量"
                stroke="#1B3A5C"
                strokeWidth={2.5}
                fill="url(#mg1)"
                dot={{ r: 4, fill: '#1B3A5C', cursor: 'pointer' }}
                activeDot={{ r: 6 }}
                onClick={(data: any) => handleMonthClick(data.payload)}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="满意度"
                stroke="#E8A838"
                strokeWidth={3}
                dot={{ r: 4, fill: '#E8A838', cursor: 'pointer' }}
                activeDot={{ r: 6 }}
                onClick={(data: any) => handleMonthClick(data.payload)}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="整改完成率"
                stroke="#22C55E"
                strokeWidth={3}
                dot={{ r: 4, fill: '#22C55E', cursor: 'pointer' }}
                activeDot={{ r: 6 }}
                strokeDasharray="5 5"
                onClick={(data: any) => handleMonthClick(data.payload)}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-center text-xs text-[#94A3B8]">点击数据点可切换月份查看明细</div>
      </motion.div>

      <div className="grid grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card p-5 col-span-2">
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
          {dimensionData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-[#94A3B8]">当前筛选无数据</div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dimensionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="咨询"
                    fill="#1B3A5C"
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(data) => handleDimensionClick(data.payload)}
                  />
                  <Bar
                    dataKey="投诉"
                    fill="#DC2626"
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(data) => handleDimensionClick(data.payload)}
                  />
                  <Bar
                    dataKey="建议"
                    fill="#E8A838"
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(data) => handleDimensionClick(data.payload)}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-2 text-center text-xs text-[#94A3B8]">点击柱子可查看对应维度的工单明细</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="card p-5">
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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card">
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#1F2937]" style={{ fontFamily: "'Noto Serif SC', serif" }}>
            <FileText className="w-4 h-4 inline mr-2" />月度报告明细
          </h3>
          <div className="text-xs text-[#94A3B8] flex items-center gap-3">
            <span>{filterMonth} · 共 <span className="font-semibold text-[#1F2937]">{filteredOrders.length}</span> 条</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-1 rounded border border-[#E2E8F0] text-[#64748B] hover:bg-[#F7FAFC] disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-[#64748B]">第 {currentPage}/{totalPages} 页</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-1 rounded border border-[#E2E8F0] text-[#64748B] hover:bg-[#F7FAFC] disabled:opacity-40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">工单号</th>
                <th className="table-header">标题</th>
                <th className="table-header">渠道</th>
                <th className="table-header">紧急度</th>
                <th className="table-header">状态</th>
                <th className="table-header">责任部门</th>
                <th className="table-header">回访评分</th>
                <th className="table-header">整改进展</th>
                <th className="table-header">操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.length === 0 && (
                <tr><td colSpan={9} className="py-10 text-center text-sm text-[#94A3B8]">当前筛选无数据</td></tr>
              )}
              {pagedOrders.map(o => {
                const fu = followUps.find(f => f.workOrderId === o.id && f.status === 'done');
                const rects = getRectForOrder(o.id);
                return (
                  <tr key={o.id} className="hover:bg-[#F7FAFC] transition-colors">
                    <td className="table-cell font-mono text-xs text-[#64748B]">{o.id}</td>
                    <td className="table-cell max-w-[200px] truncate">{o.title}</td>
                    <td className="table-cell text-xs">{channelLabel(o.channel)}</td>
                    <td className="table-cell"><UrgencyBadge urgency={o.urgency} /></td>
                    <td className="table-cell"><StatusBadge status={o.status} /></td>
                    <td className="table-cell text-xs">{o.departmentName || '-'}</td>
                    <td className="table-cell text-xs">{fu ? `${fu.satisfaction}星` : '-'}</td>
                    <td className="table-cell">
                      {rects.length === 0 ? (
                        <span className="text-xs text-[#94A3B8]">-</span>
                      ) : rects.map(r => (
                        <span key={r.id} className="mr-1"><RectStatusBadge status={r.status} /></span>
                      ))}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => { setDrawerOrderId(o.id); setDrawerContext('月度报告明细'); }}
                        className="text-xs text-[#1B3A5C] hover:underline flex items-center gap-1"
                      >
                        查看 <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
            <span className="text-[#64748B]">显示 {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filteredOrders.length)} 条，共 {filteredOrders.length} 条</span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="px-2 py-1 rounded text-[#64748B] hover:bg-[#F7FAFC] disabled:opacity-40"
              >
                首页
              </button>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2 py-1 rounded text-[#64748B] hover:bg-[#F7FAFC] disabled:opacity-40"
              >
                上一页
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded text-xs ${currentPage === pageNum ? 'bg-[#1B3A5C] text-white' : 'text-[#64748B] hover:bg-[#F7FAFC]'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2 py-1 rounded text-[#64748B] hover:bg-[#F7FAFC] disabled:opacity-40"
              >
                下一页
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="px-2 py-1 rounded text-[#64748B] hover:bg-[#F7FAFC] disabled:opacity-40"
              >
                末页
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {drillOrders && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-6"
            onClick={() => setDrillOrders(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card w-full max-w-2xl max-h-[75vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between flex-shrink-0">
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                  <Search className="w-4 h-4 text-[#1B3A5C]" />钻取明细 · {drillOrders.title}
                </h3>
                <button onClick={() => setDrillOrders(null)} className="text-[#64748B] hover:text-[#1F2937]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                <div className="divide-y divide-[#F1F5F9]">
                  {drillOrderList.length === 0 && (
                    <div className="py-16 text-center text-sm text-[#94A3B8]">无相关工单</div>
                  )}
                  {drillOrderList.map(o => {
                    if (!o) return null;
                    const fu = followUps.find(f => f.workOrderId === o.id && f.status === 'done');
                    return (
                      <div key={o.id} className="px-5 py-3 hover:bg-[#F7FAFC] transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-[#64748B]">{o.id}</span>
                              <StatusBadge status={o.status} />
                              <UrgencyBadge urgency={o.urgency} />
                            </div>
                            <div className="mt-1 font-medium text-[#1F2937] text-sm">{o.title}</div>
                            <div className="mt-0.5 text-xs text-[#64748B]">{o.passengerName} · {o.categoryName} · {o.departmentName || '未分派'}</div>
                            {fu && (
                              <div className="mt-0.5 text-xs text-[#E8A838]">回访评分：{fu.satisfaction}星</div>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setDrillOrders(null);
                              setDrawerOrderId(o.id);
                              setDrawerContext(drillOrders.title);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#1B3A5C] text-white text-xs hover:bg-[#152E48] flex items-center gap-1"
                          >
                            查看详情 <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="px-5 py-3 border-t border-[#E2E8F0] bg-[#F7FAFC] flex items-center justify-between flex-shrink-0">
                <span className="text-xs text-[#64748B]">共 {drillOrders.orders.length} 条匹配工单</span>
                <button className="btn-secondary text-sm py-1.5" onClick={() => setDrillOrders(null)}>关闭</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRectModal && rectSource && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-6"
            onClick={() => { setShowRectModal(false); setRectSource(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="card p-6 w-full max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                <Zap className="w-5 h-5 text-[#E8A838]" />一键生成整改计划
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-[#64748B]">来源工单</div>
                  <div className="font-medium text-[#1F2937]">{rectSource.workOrderId} - {rectSource.title}</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748B]">责任部门</div>
                  <div className="font-medium text-[#1F2937]">{rectSource.deptName}</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748B]">完成期限</div>
                  <div className="font-medium text-[#1F2937]">{new Date(Date.now() + 5 * 86400 * 1000).toLocaleDateString('zh-CN')}（默认5天）</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748B] mb-1">整改措施</div>
                  <div className="p-3 bg-[#F7FAFC] rounded-lg text-sm text-[#1F2937] whitespace-pre-wrap border border-[#E2E8F0]">{rectSource.measure}</div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <button className="btn-secondary" onClick={() => { setShowRectModal(false); setRectSource(null); }}>取消</button>
                <button className="btn-primary flex items-center gap-1" onClick={handleCreateRect}>
                  <ListChecks className="w-4 h-4" />确认创建
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawerOrderId && (
          <WorkOrderDetailDrawer
            workOrderId={drawerOrderId}
            filterContext={drawerContext}
            onClose={() => {
              setDrawerOrderId(null);
              setDrawerContext('');
              const params = new URLSearchParams(searchParams);
              params.delete('open');
              params.delete('returnTo');
              setSearchParams(params, { replace: true });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
