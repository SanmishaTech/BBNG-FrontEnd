"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function formatDate(date: Date | undefined) {
  if (!date) {
    return ""
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }
  return !isNaN(date.getTime())
}

interface DatePickerWithInputProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  id?: string
}

export function DatePickerWithInput({
  value: propValue,
  onChange,
  placeholder = "Select date",
  id = "date-picker"
}: DatePickerWithInputProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(propValue)
  const [month, setMonth] = React.useState<Date | undefined>(propValue || new Date())
  const [value, setValue] = React.useState(formatDate(propValue))

  React.useEffect(() => {
    if (propValue) {
      setDate(propValue)
      setMonth(propValue)
      setValue(formatDate(propValue))
    }
  }, [propValue])

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate)
    setValue(formatDate(newDate))
    onChange?.(newDate)
  }

  return (
    <div className="relative flex gap-2">
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        className="bg-background pr-10"
        onChange={(e) => {
          const date = new Date(e.target.value)
          setValue(e.target.value)
          if (isValidDate(date)) {
            handleDateChange(date)
            setMonth(date)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setOpen(true)
          }
        }}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={`${id}-button`}
            variant="ghost"
            className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
          >
            <CalendarIcon className="size-3.5" />
            <span className="sr-only">Select date</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto overflow-hidden p-0 z-[9999]"
          align="end"
          alignOffset={-8}
          sideOffset={10}
        >
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            month={month}
            onMonthChange={setMonth}
            onSelect={(date) => {
              handleDateChange(date)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
