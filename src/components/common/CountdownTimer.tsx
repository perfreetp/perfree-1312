import { useState, useEffect } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

interface Props {
  deadline: string;
}

export default function CountdownTimer({ deadline }: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const deadlineMs = new Date(deadline).getTime();
  const diff = deadlineMs - now;

  if (diff <= 0) {
    const overMs = Math.abs(diff);
    const hours = Math.floor(overMs / 3600000);
    const minutes = Math.floor((overMs % 3600000) / 60000);
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#FEE2E2] text-[#991B1B] text-xs font-medium pulse-danger">
        <AlertTriangle className="w-3 h-3" />
        已超时 {hours > 0 ? `${hours}小时` : ''}{minutes}分
      </span>
    );
  }

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  const isWarning = diff < 4 * 3600000;
  const isUrgent = diff < 1 * 3600000;

  const className = isUrgent
    ? 'bg-[#FEE2E2] text-[#991B1B]'
    : isWarning
    ? 'bg-[#FEF3C7] text-[#92400E]'
    : 'bg-[#E0F2FE] text-[#0369A1]';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${className}`}>
      <Clock className="w-3 h-3" />
      {hours > 0 ? `${hours}小时` : ''}{minutes}分{seconds < 60 && hours === 0 ? `${seconds}秒` : ''}
    </span>
  );
}
