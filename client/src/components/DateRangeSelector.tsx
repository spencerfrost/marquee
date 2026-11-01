import React from 'react';
import { Input } from './ui/input';

interface DateRangeSelectorProps {
  from: string | null; // 'YYYY-MM-DD'
  to: string | null;
  onChange: (from: string | null, to: string | null) => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ from, to, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        aria-label="Release date from"
        value={from ?? ''}
        onChange={(e) => onChange(e.target.value || null, to)}
        className="w-36 border-slate-700 bg-slate-800/80 font-mono text-sm text-slate-100"
      />
      <span className="text-slate-500">–</span>
      <Input
        type="date"
        aria-label="Release date to"
        value={to ?? ''}
        onChange={(e) => onChange(from, e.target.value || null)}
        className="w-36 border-slate-700 bg-slate-800/80 font-mono text-sm text-slate-100"
      />
    </div>
  );
};
