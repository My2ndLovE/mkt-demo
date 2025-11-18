import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { GameType } from '../types';

interface NumberInputProps {
  gameType: GameType;
  numbers: string[];
  onNumbersChange: (numbers: string[]) => void;
  maxNumbers?: number;
}

export function NumberInput({
  gameType,
  numbers,
  onNumbersChange,
  maxNumbers = 10,
}: NumberInputProps) {
  const [currentInput, setCurrentInput] = useState('');
  const [error, setError] = useState('');

  const digitLength = parseInt(gameType[0]);

  const handleAdd = () => {
    setError('');

    // Validate length
    if (currentInput.length !== digitLength) {
      setError(`Number must be exactly ${digitLength} digits`);
      return;
    }

    // Validate it's a number
    if (!/^\d+$/.test(currentInput)) {
      setError('Number must contain only digits');
      return;
    }

    // Check for duplicates
    if (numbers.includes(currentInput)) {
      setError('This number has already been added');
      return;
    }

    // Check max numbers
    if (numbers.length >= maxNumbers) {
      setError(`Maximum ${maxNumbers} numbers allowed`);
      return;
    }

    onNumbersChange([...numbers, currentInput]);
    setCurrentInput('');
  };

  const handleRemove = (index: number) => {
    onNumbersChange(numbers.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="number-input">
          Enter {gameType} Number ({digitLength} digits)
        </Label>
        <div className="flex gap-2">
          <Input
            id="number-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={digitLength}
            value={currentInput}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              setCurrentInput(value);
              setError('');
            }}
            onKeyPress={handleKeyPress}
            placeholder={`e.g., ${'0'.repeat(digitLength)}`}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleAdd}
            disabled={currentInput.length !== digitLength}
            className="min-w-[100px]"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {numbers.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Numbers ({numbers.length})</Label>
          <div className="flex flex-wrap gap-2">
            {numbers.map((number, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2"
              >
                <span className="font-mono text-lg font-bold">{number}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="rounded-full p-1 hover:bg-destructive/10 transition-colors"
                >
                  <X className="h-4 w-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        You can add up to {maxNumbers} numbers. Press Enter or click Add button to add a number.
      </p>
    </div>
  );
}
