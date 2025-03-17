import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem, CommandList, CommandInput, CommandEmpty } from "@/components/ui/command";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type MultiSelectProps = {
  options: { label: string; value: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
};

export function MultiSelect({ options, value, onChange, placeholder = "Select items..." }: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (newValue: string) => {
    onChange([...value, newValue]);
  };

  const handleUnselect = (newValue: string) => {
    onChange(value.filter((item) => item !== newValue));
  };

  const selectables = options.filter((option) => !value.includes(option.value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-[200px] justify-between", value.length > 0 && "pl-2")}>
          {value.length > 0 ? (
            value.map((item) => {
              const option = options.find((o) => o.value === item);
              return (
                <Badge key={item} variant="secondary" className="rounded-sm">
                  {option?.label || item}
                  <button
                    className="ml-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnselect(item);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })
          ) : (
            placeholder
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No items found</CommandEmpty>
            <CommandGroup>
              {selectables.map((option) => (
                <CommandItem key={option.value} onSelect={() => handleSelect(option.value)}>
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
