import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Option {
  id: string;
  label: string;
}

interface OnboardingOptionChipsProps {
  options: Option[];
  multiSelect?: boolean;
  onSelect: (selected: string[]) => void;
}

export function OnboardingOptionChips({ options, multiSelect = false, onSelect }: OnboardingOptionChipsProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleOption = (id: string) => {
    if (isSubmitted) return;
    
    if (multiSelect) {
      setSelected(prev => 
        prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
      );
    } else {
      // Single select - submit immediately
      setIsSubmitted(true);
      // Pass the id, not the label, so handlers can use the raw value
      onSelect([id]);
    }
  };

  const handleConfirm = () => {
    if (selected.length === 0) return;
    setIsSubmitted(true);
    // Pass the ids, not the labels, so handlers can use the raw values
    onSelect(selected);
  };

  if (isSubmitted) return null;

  return (
    <div className="ml-12 mt-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              className={cn(
                'px-4 py-2.5 rounded-full text-sm font-medium transition-all',
                'border',
                isSelected
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'bg-card text-foreground border-border hover:border-accent/50'
              )}
            >
              {multiSelect && isSelected && (
                <Check className="h-3.5 w-3.5 inline mr-1.5" />
              )}
              {option.label}
            </button>
          );
        })}
      </div>

      {multiSelect && selected.length > 0 && (
        <Button onClick={handleConfirm} size="sm">
          Continue
        </Button>
      )}
    </div>
  );
}
