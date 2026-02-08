import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  value: string;
  label: string;
}

interface SortControlsProps {
  options: SortOption[];
  selectedField: string;
  direction: SortDirection;
  onFieldChange: (field: string) => void;
  onDirectionChange: (direction: SortDirection) => void;
}

export default function SortControls({
  options,
  selectedField,
  direction,
  onFieldChange,
  onDirectionChange,
}: SortControlsProps) {
  const toggleDirection = () => {
    onDirectionChange(direction === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Sort by:</span>
      <Select value={selectedField} onValueChange={onFieldChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        onClick={toggleDirection}
        title={direction === 'asc' ? 'Ascending' : 'Descending'}
      >
        {direction === 'asc' ? (
          <ArrowUp className="w-4 h-4" />
        ) : (
          <ArrowDown className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
