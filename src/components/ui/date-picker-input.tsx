import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format, isValid, parse } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerWithInputProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
}

export function DatePickerWithInput({ value, onChange, placeholder }: DatePickerWithInputProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value ? format(value, "dd/MM/yyyy") : "");

  React.useEffect(() => {
    if (value) {
      if (isValid(new Date(value))) {
        setInputValue(format(new Date(value), "dd/MM/yyyy"));
      }
    } else {
      setInputValue("");
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);
    const date = parse(newInputValue, "dd/MM/yyyy", new Date());
    if (isValid(date)) {
      onChange(date);
    } else {
      onChange(undefined);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    onChange(date);
    if (date) {
      setInputValue(format(date, "dd/MM/yyyy"));
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <Input
        value={inputValue}
        placeholder={placeholder || "dd/MM/yyyy"}
        className="bg-background pr-10"
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date-picker"
            variant="ghost"
            className="absolute top-1/2 right-2 size-6 -translate-y-1/2 p-0"
          >
            <CalendarIcon className="size-4" />
            <span className="sr-only">Select date</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto overflow-hidden p-0"
          align="end"
          alignOffset={-8}
          sideOffset={10}
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            captionLayout="dropdown"
            fromYear={new Date().getFullYear() - 80}
            toYear={new Date().getFullYear() + 10}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
