import React from 'react';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import type { SortDirection, SortField } from '@/utils/types';

const SORT_FIELDS: { value: SortField; label: string }[] = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'rating', label: 'Rating' },
  { value: 'date', label: 'Release Date' },
  { value: 'title', label: 'Title' },
];

interface SortSelectorProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onFieldChange: (field: SortField) => void;
  onDirectionChange: (direction: SortDirection) => void;
}

export const SortSelector: React.FC<SortSelectorProps> = ({
  sortField,
  sortDirection,
  onFieldChange,
  onDirectionChange,
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Sort
      </span>
      <Select
        items={SORT_FIELDS}
        value={sortField}
        onValueChange={(value) => onFieldChange(value as SortField)}
      >
        <SelectTrigger className="border-slate-700 bg-slate-800/80 text-slate-100 hover:bg-slate-800">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-slate-700 bg-slate-900 text-slate-300 shadow-xl">
          {SORT_FIELDS.map((field) => (
            <SelectItem
              key={field.value}
              value={field.value}
              className="cursor-pointer focus:bg-slate-800 focus:text-slate-100"
            >
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="icon"
        aria-label={sortDirection === 'desc' ? 'Sorted descending' : 'Sorted ascending'}
        title={sortDirection === 'desc' ? 'Descending — click for ascending' : 'Ascending — click for descending'}
        onClick={() => onDirectionChange(sortDirection === 'desc' ? 'asc' : 'desc')}
        className="text-slate-400 hover:bg-slate-800 hover:text-slate-100"
      >
        {sortDirection === 'desc' ? (
          <ArrowDownIcon className="size-4" />
        ) : (
          <ArrowUpIcon className="size-4" />
        )}
      </Button>
    </div>
  );
};
