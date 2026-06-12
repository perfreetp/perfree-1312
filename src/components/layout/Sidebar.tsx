import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Share2, FileText, Users, BookText, ClipboardCheck, BarChart3, Train
} from 'lucide-react';

const menuItems = [
  { path: '/', label: '工单总览', icon: LayoutDashboard },
  { path: '/channel', label: '渠道接入', icon: Share2 },
  { path: '/processing', label: '工单处理', icon: FileText },
  { path: '/follow-up', label: '旅客回访', icon: Users },
  { path: '/standards', label: '服务标准', icon: BookText },
  { path: '/rectification', label: '整改跟踪', icon: ClipboardCheck },
  { path: '/analysis', label: '质量分析', icon: BarChart3 },
];

export default function Sidebar() {
  return (
    <aside className="w-60 bg-[#1B3A5C] min-h-screen flex flex-col text-white flex-shrink-0">
      <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#E8A838] flex items-center justify-center">
          <Train className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="font-bold text-[15px] tracking-wide">铁路旅客服务</div>
          <div className="text-xs text-white/60">质量管理系统</div>
        </div>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-[#E8A838] text-white shadow-md'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="w-[18px] h-[18px]" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-white/10">
        <div className="text-xs text-white/50">客服中心 · 服务管理</div>
        <div className="text-xs text-white/30 mt-1">v1.0.0</div>
      </div>
    </aside>
  );
}
