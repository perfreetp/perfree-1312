import { useState, useMemo } from 'react';
import { Search, BookText, FileText, ChevronRight, ChevronDown, Tag } from 'lucide-react';
import { standards, standardCategories } from '@/data/mockBase';
import { motion } from 'framer-motion';

export default function Standards() {
  const [keyword, setKeyword] = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedStd, setSelectedStd] = useState<string | null>(standards[0]?.id || null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    return standards.filter(s => {
      const matchCat = !selectedCat || s.categoryId === selectedCat;
      const matchKw = !keyword || s.title.includes(keyword) || s.content.includes(keyword) || s.clauseNo.includes(keyword);
      return matchCat && matchKw;
    });
  }, [keyword, selectedCat]);

  const current = standards.find(s => s.id === selectedStd);

  return (
    <div className="flex gap-5 h-[calc(100vh-140px)]">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-60 card flex flex-col flex-shrink-0 overflow-hidden"
      >
        <div className="p-4 border-b border-[#E2E8F0]">
          <h3 className="text-sm font-semibold text-[#1F2937] flex items-center gap-2">
            <BookText className="w-4 h-4 text-[#1B3A5C]" />
            标准分类
          </h3>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <div
            className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between ${!selectedCat ? 'text-[#1B3A5C] bg-[#1B3A5C]/5 font-medium' : 'text-[#475569] hover:bg-[#F7FAFC]'}`}
            onClick={() => setSelectedCat(null)}
          >
            <span>全部标准</span>
            <span className="text-xs text-[#94A3B8]">{standards.length}</span>
          </div>
          {standardCategories.map(cat => {
            const count = standards.filter(s => s.categoryId === cat.id).length;
            return (
              <div
                key={cat.id}
                className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between ${selectedCat === cat.id ? 'text-[#1B3A5C] bg-[#1B3A5C]/10 font-medium border-l-2 border-[#1B3A5C]' : 'text-[#475569] hover:bg-[#F7FAFC]'}`}
                onClick={() => { setSelectedCat(cat.id); }}
              >
                <span>{cat.name}</span>
                <span className="text-xs text-[#94A3B8]">{count}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-80 card flex flex-col flex-shrink-0 overflow-hidden"
      >
        <div className="p-4 border-b border-[#E2E8F0]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="搜索标准名称、条款..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#F0F4F8] border-0 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20"
            />
          </div>
          <div className="mt-3 text-xs text-[#64748B]">共找到 {filtered.length} 条标准</div>
        </div>
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 && (
            <div className="py-20 text-center text-sm text-[#94A3B8]">暂无匹配标准</div>
          )}
          {filtered.map(s => (
            <div
              key={s.id}
              className={`px-4 py-3 cursor-pointer border-b border-[#F1F5F9] transition-colors ${selectedStd === s.id ? 'bg-[#FEF3C7]/50 border-l-4 border-l-[#E8A838]' : 'hover:bg-[#F7FAFC]'}`}
              onClick={() => setSelectedStd(s.id)}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1B3A5C] text-white">{s.clauseNo}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EEF2FF] text-[#3730A3]">{s.categoryName}</span>
              </div>
              <div className="text-sm font-medium text-[#1F2937] truncate">{s.title}</div>
              <div className="text-xs text-[#64748B] mt-1 line-clamp-2">{s.content}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 card flex flex-col min-w-0 overflow-hidden"
      >
        {current ? (
          <>
            <div className="px-6 py-5 border-b border-[#E2E8F0] bg-gradient-to-r from-[#1B3A5C]/5 to-transparent">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#1B3A5C] text-white">{current.clauseNo}</span>
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-[#EEF2FF] text-[#3730A3]">
                  <Tag className="w-3 h-3" />{current.categoryName}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#1B3A5C]" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                {current.title}
              </h2>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="p-4 rounded-xl bg-[#F7FAFC] border border-[#E2E8F0]">
                  <div className="text-xs text-[#64748B] mb-1.5 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />适用范围
                  </div>
                  <div className="text-sm text-[#1F2937] font-medium">{current.applicableScope}</div>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-[#1B3A5C] mb-3 flex items-center gap-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                    <span className="w-1 h-5 rounded-full bg-[#E8A838]"></span>
                    标准正文
                  </h3>
                  <div className="space-y-3">
                    {current.content.split('\n').map((line, i) => (
                      <div key={i} className="flex gap-3 pl-2">
                        <span className="text-[#E8A838] font-mono text-sm font-bold flex-shrink-0 w-5">{i + 1}.</span>
                        <p className="text-[#1F2937] text-sm leading-7">{line.replace(/^\d+\.\s*/, '')}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0]">
                  <div className="text-xs text-[#64748B]">
                    本标准由铁路旅客服务质量管理中心制定与解释，自发布之日起执行。
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#94A3B8] text-sm">
            请从左侧选择一条服务标准
          </div>
        )}
      </motion.div>
    </div>
  );
}
