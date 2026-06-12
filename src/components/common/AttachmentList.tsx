import { FileText, Image, X, Download } from 'lucide-react';
import type { Attachment } from '@/types';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

function isImage(type: string) {
  return type.startsWith('image/');
}

interface Props {
  attachments: Attachment[];
  onRemove?: (id: string) => void;
  compact?: boolean;
}

export default function AttachmentList({ attachments, onRemove, compact = false }: Props) {
  if (!attachments || attachments.length === 0) {
    if (compact) return <span className="text-xs text-[#94A3B8]">无附件</span>;
    return <div className="text-xs text-[#94A3B8] italic">暂无附件</div>;
  }

  return (
    <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
      {attachments.map(att => (
        <div
          key={att.id}
          className={`group relative flex items-center gap-2 p-2 rounded-lg bg-[#F7FAFC] border border-[#E2E8F0] hover:border-[#1B3A5C]/30 transition-colors ${compact ? 'py-1.5' : ''}`}
          title={att.fileName}
        >
          {isImage(att.fileType) && att.dataUrl ? (
            <img src={att.dataUrl} alt={att.fileName} className="w-9 h-9 object-cover rounded-md flex-shrink-0" />
          ) : (
            <div className={`${compact ? 'w-7 h-7' : 'w-9 h-9'} rounded-md bg-[#DBEAFE] flex items-center justify-center flex-shrink-0`}>
              <FileText className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-[#1E40AF]`} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className={`text-[#1F2937] truncate ${compact ? 'text-xs' : 'text-sm'}`}>{att.fileName}</div>
            <div className="text-[11px] text-[#94A3B8]">{formatSize(att.fileSize)}</div>
          </div>
          {onRemove && (
            <button
              onClick={() => onRemove(att.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#FEE2E2] transition-opacity"
              title="删除附件"
            >
              <X className="w-3.5 h-3.5 text-[#DC2626]" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
