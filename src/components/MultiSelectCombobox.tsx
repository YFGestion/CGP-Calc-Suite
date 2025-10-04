"use client";

import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MultiSelectComboboxProps {
  options: { value: string; label: string }[];
  selected: string[];
  onSelect: (selectedValues: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const MultiSelectCombobox: React.FC<MultiSelectComboboxProps> = ({
  options,
  selected,
  onSelect,
  placeholder,
  className,
  disabled,
}) => {
  const { t } = useTranslation('common');
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleSelect = (value: string) => {
    const isSelected = selected.includes(value);
    let newSelected;
    if (isSelected) {
      newSelected = selected.filter((s) => s !== value);
    } else {
      newSelected = [...selected, value];
    }
    onSelect(newSelected);
    setInputValue(""); // Clear input after selection
  };

  const handleRemove = (value: string) => {
    const newSelected = selected.filter((s) => s !== value);
    onSelect(newSelected);
  };

  const filteredOptions = options.filter(
    (option) =>
      !selected.includes(option.value) &&
      option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const allOptionsValues = options.map(opt => opt.value);
  const isNewTag = inputValue && !allOptionsValues.includes(inputValue.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto min-h-10", className)}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1">
            {selected.length > 0 ? (
              selected.map((value) => {
                const option = options.find((o) => o.value === value);
                return (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent popover from closing
                      handleRemove(value);
                    }}
                  >
                    {option ? option.label : value}
                    <X className="h-3 w-3 cursor-pointer" />
                  </Badge>
                );
              })
            ) : (
              <span className="text-muted-foreground">{placeholder || t('selectTags')}</span>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput
            placeholder={t('searchOrAddTags')}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>{t('noTagFound')}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
              {isNewTag && (
                <CommandItem
                  key={inputValue}
                  value={inputValue}
                  onSelect={() => handleSelect(inputValue.toLowerCase())}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(inputValue.toLowerCase()) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {t('addTag', { tag: inputValue })}
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};