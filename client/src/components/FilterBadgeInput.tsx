import React, { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Badge } from './ui/badge';

interface Props {
  label: string;
  placeholder: string;
  values: number[];
  onChange: (values: number[]) => void;
}

export const FilterBadgeInput: React.FC<Props> = ({ label, placeholder, values, onChange }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue) {
      const num = parseInt(inputValue, 10);
      if (!isNaN(num) && !values.includes(num)) {
        onChange([...values, num]);
      }
      setInputValue('');
    }
  };

  const removeValue = (valToRemove: number) => {
    onChange(values.filter((v) => v !== valToRemove));
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</label>
      <div className="flex flex-wrap gap-2 items-center bg-slate-800/80 p-2 rounded-md border border-slate-700 focus-within:border-amber-500/60">
        {values.map((val) => (
          <Badge key={val} variant="secondary" className="bg-slate-700 text-slate-200 hover:bg-slate-600">
            {val}
            <button onClick={() => removeValue(val)} className="ml-1 hover:text-red-400">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          className="bg-transparent text-sm text-slate-100 outline-none flex-grow min-w-[80px]"
          placeholder={values.length === 0 ? placeholder : ''}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
};