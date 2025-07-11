 
import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [date, setDate] = React.useState(value);
  const [time, setTime] = React.useState("10:30:00");

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const [hours, minutes, seconds] = time.split(":");
      selectedDate.setHours(parseInt(hours, 10));
      selectedDate.setMinutes(parseInt(minutes, 10));
      selectedDate.setSeconds(parseInt(seconds, 10));
    }
    setDate(selectedDate);
    onChange?.(selectedDate);
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTime(event.target.value);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className="data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal"
        >
          <CalendarIcon />
          {date ? format(date, "dd/MM/yyyy hh:mm a") : <span>Pick a date and time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={date} onSelect={handleSelect} />
        <div className="p-2">
          <Input
            type="time"
            id="time-picker"
            step="1"
            value={time}
            onChange={handleTimeChange}
            className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

type TimescapeReturn = ReturnType<typeof useTimescape>;
type InputPlaceholders = Record<DateFormat | TimeFormat, string>;
const INPUT_PLACEHOLDERS: InputPlaceholders = {
  months: "MM",
  days: "DD",
  years: "YYYY",
  hours: "HH",
  minutes: "MM",
  seconds: "SS",
  "am/pm": "AM/PM",
};

/**
 * Date time picker Docs: {@link: https://shadcn-extension.vercel.app/docs/otp-input}
 */

const DatetimeGrid = React.forwardRef<
  HTMLDivElement,
  {
    format: DateTimeFormatDefaults;
    className?: string;
    timescape: Pick<TimescapeReturn, "getRootProps" | "getInputProps">;
    placeholders: InputPlaceholders;
  }
>(
  (
    {
      format,
      className,
      timescape,
      placeholders,
    }: {
      format: DateTimeFormatDefaults;
      className?: string;
      timescape: Pick<TimescapeReturn, "getRootProps" | "getInputProps">;
      placeholders: InputPlaceholders;
    },
    ref,
  ) => {
    return (
      <div
        className={cn(
          "flex items-center w-fit p-1 border-2",
          className,
          "border-input rounded-md gap-1 selection:bg-transparent selection:text-foreground",
        )}
        {...timescape.getRootProps()}
        ref={ref}
      >
        {!!format?.length
          ? format.map((group, i) => (
              <React.Fragment key={i === 0 ? "dates" : "times"}>
                {!!group?.length
                  ? group.map((unit, j) => (
                      <React.Fragment key={unit}>
                        <Input
                          className={cn(timePickerInputBase, "min-w-8", {
                            "min-w-12": unit === "years",
                            "bg-foreground/15": unit === "am/pm",
                          })}
                          {...timescape.getInputProps(unit)}
                          placeholder={placeholders[unit]}
                        />
                        {i === 0 && j < group.length - 1 ? (
                          // date separator
                          <span className={timePickerSeparatorBase}>/</span>
                        ) : (
                          j < group.length - 2 && (
                            // time separator
                            <span className={timePickerSeparatorBase}>:</span>
                          )
                        )}
                      </React.Fragment>
                    ))
                  : null}
                {format[1]?.length && !i ? (
                  // date-time separator - only if both date and time are present
                  <span
                    className={cn(
                      timePickerSeparatorBase,
                      "opacity-30 text-xl",
                    )}
                  >
                    |
                  </span>
                ) : null}
              </React.Fragment>
            ))
          : null}
      </div>
    );
  },
);

DatetimeGrid.displayName = "DatetimeGrid";

interface DateTimeInput {
  value?: Date;
  format: DateTimeFormatDefaults;
  placeholders?: InputPlaceholders;
  onChange?: Options["onChangeDate"];
  dtOptions?: Options;
  className?: string;
}

const DEFAULT_TS_OPTIONS = {
  date: new Date(),
  hour12: true,
};
export const DatetimePicker = React.forwardRef<HTMLDivElement, DateTimeInput>(
  (
    {
      value,
      format = DEFAULTS,
      placeholders,
      dtOptions = DEFAULT_TS_OPTIONS,
      onChange,
      className,
    },
    ref,
  ) => {
    const handleDateChange = useCallback(
      (nextDate: Date | undefined) => {
        onChange ? onChange(nextDate) : console.log(nextDate);
      },
      [onChange],
    );
    const timescape = useTimescape({
      ...dtOptions,
      ...(value && { date: value }),
      onChangeDate: handleDateChange,
    });
    return (
      <DatetimeGrid
        format={format}
        className={className}
        timescape={timescape}
        placeholders={placeholders ?? INPUT_PLACEHOLDERS}
        ref={ref}
      />
    );
  },
);

DatetimePicker.displayName = "DatetimePicker";
