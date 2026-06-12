import { useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  value?: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: number;
}

export default function StarRating({ value = 0, onChange, readonly = false, size = 20 }: Props) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(n => {
        const filled = n <= display;
        return (
          <motion.button
            key={n}
            type="button"
            disabled={readonly}
            onMouseEnter={() => !readonly && setHover(n)}
            onMouseLeave={() => !readonly && setHover(0)}
            onClick={() => !readonly && onChange?.(n)}
            whileHover={!readonly ? { scale: 1.25 } : {}}
            whileTap={!readonly ? { scale: 0.9 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            className="p-0.5 focus:outline-none"
          >
            <Star
              size={size}
              className={`transition-colors ${filled ? 'fill-[#E8A838] text-[#E8A838] drop-shadow-sm' : 'text-[#CBD5E1]'}`}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
