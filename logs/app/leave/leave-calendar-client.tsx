"use client"

import { useState } from "react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Info } from "lucide-react"
import { format, addMonths, subMonths, isSameDay, isWithinInterval, startOfMonth, endOfMonth } from "date-fns"

type Leave = {
  id: number
  userId: number
  userName: string
  startDate: Date
  endDate: Date
  leaveType: string
  status: string
}

interface LeaveCalendarClientProps {
  leaves: Leave[]
}

export function LeaveCalendarClient({ leaves }: LeaveCalendarClientProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1))
  }

  // Filter leaves for the current month view
  const currentMonthLeaves = leaves.filter(
    (leave) =>
      isWithinInterval(new Date(leave.startDate), {
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
      }) ||
      isWithinInterval(new Date(leave.endDate), {
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
      }),
  )

  // Get leaves for a specific date
  const getLeavesForDate = (date: Date) => {
    return leaves.filter(
      (leave) =>
        isSameDay(date, new Date(leave.startDate)) ||
        isSameDay(date, new Date(leave.endDate)) ||
        (date >= new Date(leave.startDate) && date <= new Date(leave.endDate)),
    )
  }

  // Custom day rendering to show leave indicators
  const renderDay = (day: Date) => {
    const leavesOnDay = getLeavesForDate(day)
    const hasFullDayLeave = leavesOnDay.some((leave) => leave.leaveType === "FULL_DAY")
    const hasAMLeave = leavesOnDay.some((leave) => leave.leaveType === "AM")
    const hasPMLeave = leavesOnDay.some((leave) => leave.leaveType === "PM")

    return (
      <div className="relative w-full h-full">
        <div className="absolute top-0 left-0 right-0 flex justify-center">{day.getDate()}</div>
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-0.5">
          {hasFullDayLeave && <div className="w-2 h-2 rounded-full bg-blue-500" />}
          {hasAMLeave && <div className="w-2 h-2 rounded-full bg-amber-500" />}
          {hasPMLeave && <div className="w-2 h-2 rounded-full bg-purple-500" />}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm">Full Day</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-sm">Morning (AM)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-sm">Afternoon (PM)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
        <div className="md:col-span-5">
          <Card>
            <CardContent className="p-0">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                className="rounded-md border"
                components={{
                  Day: ({ date, ...props }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          className={`h-9 w-9 p-0 font-normal ${getLeavesForDate(date).length > 0 ? "relative" : ""}`}
                          {...props}
                        >
                          {renderDay(date)}
                        </Button>
                      </PopoverTrigger>
                      {getLeavesForDate(date).length > 0 && (
                        <PopoverContent className="w-80 p-0" align="center">
                          <div className="p-4 border-b">
                            <h3 className="font-medium">Leaves on {format(date, "MMMM d, yyyy")}</h3>
                          </div>
                          <div className="p-4 space-y-2 max-h-[300px] overflow-auto">
                            {getLeavesForDate(date).map((leave) => (
                              <div key={leave.id} className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{leave.userName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(leave.startDate), "MMM d")} -{" "}
                                    {format(new Date(leave.endDate), "MMM d")}
                                  </p>
                                </div>
                                <Badge
                                  className={`
                                  ${
                                    leave.leaveType === "FULL_DAY"
                                      ? "bg-blue-500"
                                      : leave.leaveType === "AM"
                                        ? "bg-amber-500"
                                        : "bg-purple-500"
                                  }
                                `}
                                >
                                  {leave.leaveType === "FULL_DAY"
                                    ? "Full Day"
                                    : leave.leaveType === "AM"
                                      ? "Morning"
                                      : "Afternoon"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      )}
                    </Popover>
                  ),
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Leave Summary</CardTitle>
              <CardDescription>{format(currentMonth, "MMMM yyyy")}</CardDescription>
            </CardHeader>
            <CardContent>
              {currentMonthLeaves.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Info className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No leaves scheduled for this month</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentMonthLeaves.map((leave) => (
                    <div key={leave.id} className="border-b pb-3 last:border-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium">{leave.userName}</p>
                        <Badge
                          className={`
                          ${
                            leave.leaveType === "FULL_DAY"
                              ? "bg-blue-500"
                              : leave.leaveType === "AM"
                                ? "bg-amber-500"
                                : "bg-purple-500"
                          }
                        `}
                        >
                          {leave.leaveType === "FULL_DAY"
                            ? "Full Day"
                            : leave.leaveType === "AM"
                              ? "Morning"
                              : "Afternoon"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(leave.startDate), "MMM d")}
                        {!isSameDay(new Date(leave.startDate), new Date(leave.endDate)) &&
                          ` - ${format(new Date(leave.endDate), "MMM d")}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
