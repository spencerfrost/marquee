import React from 'react';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from(
  { length: CURRENT_YEAR - 1900 + 1 },
  (_, i) => (CURRENT_YEAR - i).toString()
);

interface YearSelectorProps {
  year: number | null;
  onChange: (year: number | null) => void;
}

export const YearSelector: React.FC<YearSelectorProps> = ({ year, onChange }) => {
  return (
    <Combobox
      items={YEARS}
      value={year !== null ? year.toString() : null}
      onValueChange={(value: string | null) =>
        onChange(value ? parseInt(value, 10) : null)
      }
    >
      <ComboboxInput
        id="year"
        placeholder="Any year"
        showClear
        className="w-32 border-slate-700 bg-slate-800/80 font-mono text-sm text-slate-100"
      />
      <ComboboxContent className="border-slate-700 bg-slate-900 shadow-xl">
        <ComboboxEmpty className="text-slate-400">No matching year.</ComboboxEmpty>
        <ComboboxList>
          {(y) => (
            <ComboboxItem
              key={y}
              value={y}
              className="text-slate-300 hover:bg-slate-800 hover:text-slate-100 cursor-pointer font-mono"
            >
              {y}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};
