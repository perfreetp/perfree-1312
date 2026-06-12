import { useLocation } from 'react-router-dom';
import { Bell, Search, User } from 'lucide-react';

const titleMap: Record<string, string> = {
  '/': '工单总览',
  '/channel': '渠道接入',
  '/processing': '工单处理',
  '/follow-up': '旅客回访',
  '/standards': '服务标准',
  '/rectification': '整改跟踪',
  '/analysis': '质量分析',
};

export default function Header() {
  const location = useLocation();
  const title = titleMap[location.pathname] || '铁路旅客服务质量管理系统';

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="text-sm text-[#64748B]">首页</div>
        <span className="text-[#94A3B8]">/</span>
        <div className="text-sm font-medium text-[#1B3A5C]">{title}</div>
        <h1 className="text-xl font-bold text-[#1B3A5C] ml-4" style={{ fontFamily: "'Noto Serif SC', serif" }}>
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索工单、标准..."
            className="pl-9 pr-4 py-2 w-64 rounded-lg bg-[#F0F4F8] border-0 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20"
          />
        </div>
        <button className="p-2 rounded-lg hover:bg-[#F0F4F8] relative">
          <Bell className="w-5 h-5 text-[#64748B]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#DC2626] rounded-full"></span>
        </button>
        <div className="flex items-center gap-2 pl-4 border-l border-[#E2E8F0]">
          <div className="w-9 h-9 rounded-full bg-[#1B3A5C] flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="text-sm">
            <div className="font-medium text-[#1F2937]">管理员</div>
            <div className="text-xs text-[#64748B]">客服中心</div>
          </div>
        </div>
      </div>
    </header>
  );
}
