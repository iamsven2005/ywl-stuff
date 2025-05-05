"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Info,
  Plus,
  Search,
  Bell,
  X,
  Calendar,
  User,
  Tag,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react"
import {
  format,
  addMonths,
  subMonths,
  isSameDay,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  getMonth,
  getDate,
  setYear,
  parse,
  isValid,
  parseISO,
} from "date-fns"
import { HolidayForm } from "./holiday-form"
import { ReminderForm } from "./reminder-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { deleteReminder } from "@/app/leave/reminder-actions"
import { deleteHoliday } from "@/app/leave/holiday-actions"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "../hooks/use-toast"

type Leave = {
  id: number
  userId: number
  userName: string
  startDate: Date
  endDate: Date
  leaveType: string
  status: string
}

type Holiday = {
  id: number
  name: string
  date: Date
  description: string
  isRecurring: boolean
}

type Reminder = {
  id: number
  title: string
  date: Date
  description: string
  color: string
}

interface LeaveCalendarClientProps {
  leaves: Leave[]
  holidays: Holiday[]
  reminders: Reminder[]
  currentUserId?: number
}

type SearchType = "date" | "person" | "holiday" | "activity"

export function LeaveCalendarClient({ leaves, holidays, reminders, currentUserId }: LeaveCalendarClientProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false)
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false)
  const [editHolidayDialogOpen, setEditHolidayDialogOpen] = useState(false)
  const [editReminderDialogOpen, setEditReminderDialogOpen] = useState(false)
  const [deleteHolidayDialogOpen, setDeleteHolidayDialogOpen] = useState(false)
  const [deleteReminderDialogOpen, setDeleteReminderDialogOpen] = useState(false)
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null)
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState<SearchType>("date")
  const [searchResults, setSearchResults] = useState<{
    dates: Date[]
    leaves: number[]
    holidays: number[]
    reminders: number[]
  }>({ dates: [], leaves: [], holidays: [], reminders: [] })
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingHoliday, setIsLoadingHoliday] = useState(false)
  const [isLoadingReminder, setIsLoadingReminder] = useState(false)

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1))
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    setSelectedDate(today)
  }

  // Handle reminder deletion
  const handleDeleteReminder = async (id: number) => {
    try {
      const result = await deleteReminder(id)
      if (result.success) {
        toast({
          title: "Reminder deleted",
          description: "Your reminder has been deleted successfully.",
        })
        setDeleteReminderDialogOpen(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete reminder.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete reminder. Please try again.",
      })
    }
  }

  // Handle holiday deletion
  const handleDeleteHoliday = async (id: number) => {
    try {
      await deleteHoliday(id)
      toast({
        title: "Holiday deleted",
        description: "The holiday has been deleted successfully.",
      })
      setDeleteHolidayDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete holiday. Please try again.",
      })
    }
  }

  // Handle edit reminder
  const handleEditReminder = async (reminder: Reminder) => {
    setSelectedReminder(reminder)
    setEditReminderDialogOpen(true)
  }

  // Handle edit holiday
  const handleEditHoliday = async (holiday: Holiday) => {
    setSelectedHoliday(holiday)
    setEditHolidayDialogOpen(true)
  }

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ dates: [], leaves: [], holidays: [], reminders: [] })
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const results = {
      dates: [] as Date[],
      leaves: [] as number[],
      holidays: [] as number[],
      reminders: [] as number[],
    }

    // Search by date
    if (searchType === "date") {
      // Try to parse the date from the search query
      const possibleFormats = ["yyyy-MM-dd", "MM/dd/yyyy", "dd/MM/yyyy", "MMMM d, yyyy", "MMMM d"]

      let parsedDate: Date | null = null

      // Try ISO format first
      try {
        const isoDate = parseISO(searchQuery)
        if (isValid(isoDate)) {
          parsedDate = isoDate
        }
      } catch (e) {
        // Not an ISO date, continue with other formats
      }

      // Try other formats
      if (!parsedDate) {
        for (const dateFormat of possibleFormats) {
          try {
            const date = parse(searchQuery, dateFormat, new Date())
            if (isValid(date)) {
              parsedDate = date
              break
            }
          } catch (e) {
            // Continue to next format
          }
        }
      }

      // If we found a valid date, search for events on that date
      if (parsedDate) {
        results.dates.push(parsedDate)

        // Find leaves on this date
        leaves.forEach((leave) => {
          const startDate = new Date(leave.startDate)
          const endDate = new Date(leave.endDate)

          if (
            isSameDay(parsedDate!, startDate) ||
            isSameDay(parsedDate!, endDate) ||
            (parsedDate! >= startDate && parsedDate! <= endDate)
          ) {
            results.leaves.push(leave.id)
          }
        })

        // Find holidays on this date
        holidays.forEach((holiday) => {
          const holidayDate = new Date(holiday.date)

          if (holiday.isRecurring) {
            // For recurring holidays, match month and day
            if (getMonth(holidayDate) === getMonth(parsedDate!) && getDate(holidayDate) === getDate(parsedDate!)) {
              results.holidays.push(holiday.id)
            }
          } else if (isSameDay(holidayDate, parsedDate!)) {
            results.holidays.push(holiday.id)
          }
        })

        // Find reminders on this date
        reminders.forEach((reminder) => {
          const reminderDate = new Date(reminder.date)

          if (isSameDay(reminderDate, parsedDate!)) {
            results.reminders.push(reminder.id)
          }
        })
      }
    }

    // Search by person
    else if (searchType === "person") {
      const query = searchQuery.toLowerCase()

      leaves.forEach((leave) => {
        if (leave.userName.toLowerCase().includes(query)) {
          results.leaves.push(leave.id)

          // Add the dates of these leaves
          const startDate = new Date(leave.startDate)
          const endDate = new Date(leave.endDate)

          // Add start and end dates
          if (!results.dates.some((d) => isSameDay(d, startDate))) {
            results.dates.push(startDate)
          }

          if (!results.dates.some((d) => isSameDay(d, endDate))) {
            results.dates.push(endDate)
          }
        }
      })
    }

    // Search by holiday
    else if (searchType === "holiday") {
      const query = searchQuery.toLowerCase()

      holidays.forEach((holiday) => {
        if (
          holiday.name.toLowerCase().includes(query) ||
          (holiday.description && holiday.description.toLowerCase().includes(query))
        ) {
          results.holidays.push(holiday.id)

          // Add the date of this holiday
          const holidayDate = new Date(holiday.date)

          if (!results.dates.some((d) => isSameDay(d, holidayDate))) {
            results.dates.push(holidayDate)
          }
        }
      })
    }

    // Search by activity (leave type or reminder)
    else if (searchType === "activity") {
      const query = searchQuery.toLowerCase()

      // Search leave types
      leaves.forEach((leave) => {
        const leaveTypeDisplay =
          leave.leaveType === "FULL_DAY" ? "full day" : leave.leaveType === "AM" ? "morning" : "afternoon"

        if (leaveTypeDisplay.includes(query)) {
          results.leaves.push(leave.id)

          // Add the dates of these leaves
          const startDate = new Date(leave.startDate)
          const endDate = new Date(leave.endDate)

          // Add start and end dates
          if (!results.dates.some((d) => isSameDay(d, startDate))) {
            results.dates.push(startDate)
          }

          if (!results.dates.some((d) => isSameDay(d, endDate))) {
            results.dates.push(endDate)
          }
        }
      })

      // Search reminders
      reminders.forEach((reminder) => {
        if (
          reminder.title.toLowerCase().includes(query) ||
          (reminder.description && reminder.description.toLowerCase().includes(query))
        ) {
          results.reminders.push(reminder.id)

          // Add the date of this reminder
          const reminderDate = new Date(reminder.date)

          if (!results.dates.some((d) => isSameDay(d, reminderDate))) {
            results.dates.push(reminderDate)
          }
        }
      })
    }

    setSearchResults(results)
  }, [searchQuery, searchType, leaves, holidays, reminders])

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

  // Get holidays for a specific date
  const getHolidaysForDate = (date: Date) => {
    return holidays.filter((holiday) => {
      if (holiday.isRecurring) {
        // For recurring holidays, match month and day regardless of year
        const holidayDate = new Date(holiday.date)
        return getMonth(holidayDate) === getMonth(date) && getDate(holidayDate) === getDate(date)
      } else {
        // For non-recurring holidays, match the exact date
        return isSameDay(new Date(holiday.date), date)
      }
    })
  }

  // Get reminders for a specific date
  const getRemindersForDate = (date: Date) => {
    return reminders.filter((reminder) => {
      return isSameDay(new Date(reminder.date), date)
    })
  }

  // Get leaves for a specific date
  const getLeavesForDate = (date: Date) => {
    return leaves.filter(
      (leave) =>
        isSameDay(date, new Date(leave.startDate)) ||
        isSameDay(date, new Date(leave.endDate)) ||
        (date >= new Date(leave.startDate) && date <= new Date(leave.endDate)),
    )
  }

  // Custom day rendering to show leave indicators, holidays, and reminders
  const renderDay = (day: Date) => {
    const leavesOnDay = getLeavesForDate(day)
    const holidaysOnDay = getHolidaysForDate(day)
    const remindersOnDay = getRemindersForDate(day)

    const hasFullDayLeave = leavesOnDay.some((leave) => leave.leaveType === "FULL_DAY")
    const hasAMLeave = leavesOnDay.some((leave) => leave.leaveType === "AM")
    const hasPMLeave = leavesOnDay.some((leave) => leave.leaveType === "PM")
    const hasHoliday = holidaysOnDay.length > 0
    const hasReminder = remindersOnDay.length > 0

    // Check if this date is in search results
    const isSearchResult = isSearching && searchResults.dates.some((d) => isSameDay(d, day))

    return (
      <div
        className={`relative w-full h-full ${isSearchResult ? "bg-yellow-100 dark:bg-yellow-900/30 rounded-md" : ""}`}
      >
        <div className="absolute top-0 left-0 right-0 flex justify-center">
          {day.getDate()}
          {hasHoliday && <span className="ml-1 text-red-500">*</span>}
          {hasReminder && <span className="ml-1 text-indigo-500">•</span>}
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-0.5">
          {hasHoliday && <div className="w-2 h-2 rounded-full bg-red-500" />}
          {hasFullDayLeave && <div className="w-2 h-2 rounded-full bg-blue-500" />}
          {hasAMLeave && <div className="w-2 h-2 rounded-full bg-amber-500" />}
          {hasPMLeave && <div className="w-2 h-2 rounded-full bg-purple-500" />}
          {hasReminder && (
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: remindersOnDay.length > 0 ? remindersOnDay[0].color : "#6366f1",
              }}
            />
          )}
        </div>
      </div>
    )
  }

  // Get current month holidays for the sidebar
  const currentMonthHolidays = holidays.filter((holiday) => {
    const holidayDate = new Date(holiday.date)
    if (holiday.isRecurring) {
      // For recurring holidays, check if month matches current month
      return getMonth(holidayDate) === getMonth(currentMonth)
    } else {
      // For non-recurring holidays, check if it falls within current month
      return isWithinInterval(holidayDate, {
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
      })
    }
  })

  // Get current month reminders for the sidebar
  const currentMonthReminders = reminders.filter((reminder) => {
    const reminderDate = new Date(reminder.date)
    return isWithinInterval(reminderDate, {
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    })
  })

  // Clear search
  const clearSearch = () => {
    setSearchQuery("")
    setIsSearching(false)
    setSearchResults({ dates: [], leaves: [], holidays: [], reminders: [] })
  }

  // Navigate to a specific date in the calendar
  const navigateToDate = (date: Date) => {
    // Set the current month to the month containing the date
    setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    // Select the date
    setSelectedDate(date)

    // Scroll to the calendar (optional)
    const calendarElement = document.querySelector(".rounded-md.border")
    if (calendarElement) {
      calendarElement.scrollIntoView({ behavior: "smooth", block: "center" })
    }

    // Highlight the date by adding a temporary class
    setTimeout(() => {
      const dateButton = document.querySelector(`[data-date="${format(date, "yyyy-MM-dd")}"]`)
      if (dateButton) {
        dateButton.classList.add("ring-2", "ring-primary", "ring-offset-2")
        setTimeout(() => {
          dateButton.classList.remove("ring-2", "ring-primary", "ring-offset-2")
        }, 2000)
      }
    }, 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select value={searchType} onValueChange={(value) => setSearchType(value as SearchType)}>
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="Search by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Date</span>
                  </div>
                </SelectItem>
                <SelectItem value="person">
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Person</span>
                  </div>
                </SelectItem>
                <SelectItem value="holiday">
                  <div className="flex items-center">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    <span>Holiday</span>
                  </div>
                </SelectItem>
                <SelectItem value="activity">
                  <div className="flex items-center">
                    <Tag className="mr-2 h-4 w-4" />
                    <span>Activity</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Input
                placeholder={`Search by ${searchType}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Dialog open={holidayDialogOpen} onOpenChange={setHolidayDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Holiday
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Holiday</DialogTitle>
                  <DialogDescription>Add a holiday or important day to the calendar.</DialogDescription>
                </DialogHeader>
                <HolidayForm onSuccess={() => setHolidayDialogOpen(false)} />
              </DialogContent>
            </Dialog>
            <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4 mr-1" />
                  Add Reminder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Personal Reminder</DialogTitle>
                  <DialogDescription>Add a personal reminder that only you can see.</DialogDescription>
                </DialogHeader>
                <ReminderForm onSuccess={() => setReminderDialogOpen(false)} defaultDate={selectedDate} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm">Holiday</span>
        </div>
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
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-indigo-500" />
          <span className="text-sm">Reminder</span>
        </div>
      </div>

      {isSearching && searchResults.dates.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium">Found {searchResults.dates.length} date(s) matching your search</p>
            <Button variant="ghost" size="sm" onClick={clearSearch}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
          <ScrollArea className="max-h-[120px]">
            <div className="flex flex-wrap gap-2">
              {searchResults.dates.map((date, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => navigateToDate(date)}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {format(date, "MMM d, yyyy")}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

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
                          className={`h-9 w-9 p-0 font-normal ${
                            getLeavesForDate(date).length > 0 ||
                            getHolidaysForDate(date).length > 0 ||
                            getRemindersForDate(date).length > 0
                              ? "relative"
                              : ""
                          }`}
                          data-date={format(date, "yyyy-MM-dd")}
                          {...props}
                        >
                          {renderDay(date)}
                        </Button>
                      </PopoverTrigger>
                      {(getLeavesForDate(date).length > 0 ||
                        getHolidaysForDate(date).length > 0 ||
                        getRemindersForDate(date).length > 0) && (
                        <PopoverContent className="w-80 p-0" align="center">
                          <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-medium">Events on {format(date, "MMMM d, yyyy")}</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReminderDialogOpen(true)
                                setSelectedDate(date)
                              }}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Add
                            </Button>
                          </div>
                          <ScrollArea className="max-h-[300px]">
                            <div className="p-4 space-y-4">
                              {getRemindersForDate(date).length > 0 && (
                                <div>
                                  <h4 className="font-medium text-sm mb-2">Your Reminders</h4>
                                  <div className="space-y-2">
                                    {getRemindersForDate(date).map((reminder) => (
                                      <div key={reminder.id} className="flex justify-between items-center">
                                        <div className="flex items-start gap-2">
                                          <div
                                            className="w-3 h-3 rounded-full mt-1.5"
                                            style={{ backgroundColor: reminder.color }}
                                          />
                                          <div>
                                            <p className="font-medium">{reminder.title}</p>
                                            {reminder.description && (
                                              <p className="text-sm text-muted-foreground">{reminder.description}</p>
                                            )}
                                          </div>
                                        </div>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                              <span className="sr-only">Open menu</span>
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEditReminder(reminder)}>
                                              <Pencil className="h-4 w-4 mr-2" />
                                              Edit reminder
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => {
                                                setSelectedReminder(reminder)
                                                setDeleteReminderDialogOpen(true)
                                              }}
                                              className="text-red-500 focus:text-red-500"
                                            >
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Delete reminder
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {getHolidaysForDate(date).length > 0 && (
                                <div>
                                  <h4 className="font-medium text-sm mb-2">Holidays</h4>
                                  <div className="space-y-2">
                                    {getHolidaysForDate(date).map((holiday) => (
                                      <div key={holiday.id} className="flex justify-between items-center">
                                        <div>
                                          <p className="font-medium">{holiday.name}</p>
                                          {holiday.description && (
                                            <p className="text-sm text-muted-foreground">{holiday.description}</p>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Badge className="bg-red-500">
                                            {holiday.isRecurring ? "Annual" : "Holiday"}
                                          </Badge>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              <DropdownMenuItem onClick={() => handleEditHoliday(holiday)}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit holiday
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() => {
                                                  setSelectedHoliday(holiday)
                                                  setDeleteHolidayDialogOpen(true)
                                                }}
                                                className="text-red-500 focus:text-red-500"
                                              >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete holiday
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {getLeavesForDate(date).length > 0 && (
                                <div>
                                  <h4 className="font-medium text-sm mb-2">Leaves</h4>
                                  <div className="space-y-2">
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
                                </div>
                              )}
                            </div>
                          </ScrollArea>
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
          <div className="space-y-6">
            <Tabs defaultValue="reminders">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="reminders">Reminders</TabsTrigger>
                <TabsTrigger value="holidays">Holidays</TabsTrigger>
              </TabsList>

              <TabsContent value="reminders" className="mt-4">
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle>Your Reminders</CardTitle>
                    <CardDescription>{format(currentMonth, "MMMM yyyy")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {currentMonthReminders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <Bell className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No reminders this month</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => setReminderDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Reminder
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {currentMonthReminders.map((reminder) => (
                          <div key={reminder.id} className="border-b pb-3 last:border-0">
                            <div className="flex justify-between items-start mb-1">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: reminder.color }} />
                                <p className="font-medium">{reminder.title}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditReminder(reminder)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit reminder
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedReminder(reminder)
                                      setDeleteReminderDialogOpen(true)
                                    }}
                                    className="text-red-500 focus:text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete reminder
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <p className="text-sm text-muted-foreground">{format(new Date(reminder.date), "MMMM d")}</p>
                            {reminder.description && (
                              <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="holidays" className="mt-4">
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle>Holidays</CardTitle>
                    <CardDescription>{format(currentMonth, "MMMM yyyy")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {currentMonthHolidays.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <CalendarDays className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No holidays this month</p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={() => setHolidayDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Holiday
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {currentMonthHolidays.map((holiday) => {
                          // For recurring holidays in the current view, set the year to current year
                          const displayDate = holiday.isRecurring
                            ? setYear(new Date(holiday.date), currentMonth.getFullYear())
                            : new Date(holiday.date)

                          return (
                            <div key={holiday.id} className="border-b pb-3 last:border-0">
                              <div className="flex justify-between items-start mb-1">
                                <p className="font-medium">{holiday.name}</p>
                                <div className="flex items-center gap-1">
                                  <Badge className="bg-red-500">{holiday.isRecurring ? "Annual" : "Holiday"}</Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditHoliday(holiday)}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit holiday
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedHoliday(holiday)
                                          setDeleteHolidayDialogOpen(true)
                                        }}
                                        className="text-red-500 focus:text-red-500"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete holiday
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">{format(displayDate, "MMMM d")}</p>
                              {holiday.description && (
                                <p className="text-sm text-muted-foreground mt-1">{holiday.description}</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

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

      {/* Edit Holiday Dialog */}
      <Dialog open={editHolidayDialogOpen} onOpenChange={setEditHolidayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Holiday</DialogTitle>
            <DialogDescription>Update the holiday details.</DialogDescription>
          </DialogHeader>
          {selectedHoliday && (
            <HolidayForm
              mode="edit"
              holidayId={selectedHoliday.id}
              defaultValues={{
                name: selectedHoliday.name,
                date: new Date(selectedHoliday.date),
                description: selectedHoliday.description,
                isRecurring: selectedHoliday.isRecurring,
              }}
              onSuccess={() => setEditHolidayDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Reminder Dialog */}
      <Dialog open={editReminderDialogOpen} onOpenChange={setEditReminderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reminder</DialogTitle>
            <DialogDescription>Update your personal reminder.</DialogDescription>
          </DialogHeader>
          {selectedReminder && (
            <ReminderForm
              mode="edit"
              reminderId={selectedReminder.id}
              defaultValues={{
                title: selectedReminder.title,
                date: new Date(selectedReminder.date),
                description: selectedReminder.description,
                color: selectedReminder.color,
              }}
              onSuccess={() => setEditReminderDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Holiday Confirmation */}
      <AlertDialog open={deleteHolidayDialogOpen} onOpenChange={setDeleteHolidayDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this holiday? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedHoliday && handleDeleteHoliday(selectedHoliday.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Reminder Confirmation */}
      <AlertDialog open={deleteReminderDialogOpen} onOpenChange={setDeleteReminderDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reminder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reminder? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedReminder && handleDeleteReminder(selectedReminder.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
