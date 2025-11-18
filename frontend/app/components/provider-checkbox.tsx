import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import type { Provider, ProviderCode } from '../types';

interface ProviderCheckboxProps {
  provider: Provider;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

const providerColors: Record<ProviderCode, string> = {
  M: 'bg-blue-500',
  P: 'bg-green-500',
  T: 'bg-purple-500',
  S: 'bg-orange-500',
};

export function ProviderCheckbox({
  provider,
  checked,
  onCheckedChange,
  disabled = false,
}: ProviderCheckboxProps) {
  const colorClass = providerColors[provider.code];

  return (
    <div className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent">
      <Checkbox
        id={`provider-${provider.code}`}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled || !provider.isActive}
      />
      <div className="flex-1">
        <Label
          htmlFor={`provider-${provider.code}`}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className={`h-6 w-6 rounded-full ${colorClass} flex items-center justify-center text-white text-xs font-bold`}>
            {provider.code}
          </div>
          <div>
            <p className="font-medium">{provider.name}</p>
            <p className="text-xs text-muted-foreground">
              Draw days: {formatDrawDays(provider.drawDays)}
            </p>
          </div>
        </Label>
      </div>
    </div>
  );
}

function formatDrawDays(drawDays: number[]): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return drawDays.map((day) => dayNames[day]).join(', ');
}
