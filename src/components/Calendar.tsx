import React, { useState } from 'react';
import { DailyEntry, WorkCalendarEntry, RiderProfile } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarRange, 
  Check, 
  X, 
  Info, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  CircleDot,
  CheckCircle,
  XCircle,
  MinusCircle,
  Clock,
  Navigation,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CalendarProps {
  entries: DailyEntry[];
  workCalendar: WorkCalendarEntry[];
  profile: RiderProfile;
  onRefresh: () => void;
}

export default function Calendar({ entries, workCalendar, profile, onRefresh }: CalendarProps) {
  // Current active viewport month state (Pre-set to June 2026 as per user context)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(5); // 0-indexed: 5 is June
  
  // Selected single date state for click popups
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Popup form states
  const [didWork, setDidWork] = useState<boolean>(true);
  const [status, setStatus] = useState<'Worked' | 'Partial Day' | "Didn't Work">('Worked');
  const [hoursWorked, setHoursWorked] = useState<string>('');
  const [totalRides, setTotalRides] = useState<string>('');
  const [dayEarnings, setDayEarnings] = useState<string>('');
  const [dayNotes, setDayNotes] = useState<string>('');
  
  // API loading indicators
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Constants
  const TODAY_STR = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Helper date utilities
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayIndex = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const totalDays = getDaysInMonth(currentYear, currentMonth);
  const firstDayIdx = getFirstDayIndex(currentYear, currentMonth);

  // Generate 2D grid structure for the month calendar
  const calendarCells: { dateStr: string; dayNum: number; isPadding: boolean }[] = [];
  
  // Padding cells from previous month
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
  const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonthIdx);
  for (let i = firstDayIdx - 1; i >= 0; i--) {
    const dVal = daysInPrevMonth - i;
    const mStr = String(prevMonthIdx + 1).padStart(2, '0');
    calendarCells.push({
      dateStr: `${prevMonthYear}-${mStr}-${String(dVal).padStart(2, '0')}`,
      dayNum: dVal,
      isPadding: true
    });
  }

  // Active current month cells
  for (let d = 1; d <= totalDays; d++) {
    const mStr = String(currentMonth + 1).padStart(2, '0');
    calendarCells.push({
      dateStr: `${currentYear}-${mStr}-${String(d).padStart(2, '0')}`,
      dayNum: d,
      isPadding: false
    });
  }

  // Padding cells for next month to finish grid nicely
  const gridRem = 42 - calendarCells.length;
  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
  for (let i = 1; i <= gridRem; i++) {
    const mStr = String(nextMonthIdx + 1).padStart(2, '0');
    calendarCells.push({
      dateStr: `${nextMonthYear}-${mStr}-${String(i).padStart(2, '0')}`,
      dayNum: i,
      isPadding: true
    });
  }

  // Shift viewport month back and forth
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Get status class/color and classification for a given date
  const getDateStatusClassification = (dateStr: string) => {
    if (dateStr > TODAY_STR) {
      return 'Future Day';
    }

    // Look up explicitly recorded work calendar status first
    const calEntry = workCalendar.find(c => c.date === dateStr);
    if (calEntry) {
      if (calEntry.status === 'Worked') return 'Worked';
      if (calEntry.status === "Didn't Work") return "Didn't Work";
      if (calEntry.status === 'Partial Day') return 'Partial Day';
      return 'Worked';
    }

    // fallback to daily entries earnings/onlineHours
    const entry = entries.find(e => e.date === dateStr);
    if (entry) {
      if (entry.earnings > 0 && entry.onlineHours >= 4) {
        return 'Worked';
      } else if (entry.earnings > 0) {
        return 'Partial Day';
      }
    }

    // if no log exists but it is a past elapsed day, default representation as "Didn't Work" (🔴) as per requested states
    return "Didn't Work";
  };

  // Trigger click modal popup on tapping a date cell
  const handleTapDate = (cell: { dateStr: string; isPadding: boolean }) => {
    if (cell.dateStr > TODAY_STR) return; // Future status is read-only / unclickable

    setSelectedDateStr(cell.dateStr);
    setErrorText(null);

    // Seed form with existing database records if present
    const existingCal = workCalendar.find(c => c.date === cell.dateStr);
    const existingEntry = entries.find(e => e.date === cell.dateStr);

    if (existingEntry) {
      setDidWork(true);
      setHoursWorked(String(existingEntry.onlineHours || ''));
      setTotalRides(String(existingEntry.tripsCount || ''));
      setDayEarnings(String(existingEntry.earnings || ''));
      setDayNotes(existingEntry.notes || '');
      
      // Resolve status selection state
      if (existingCal) {
        setStatus(existingCal.status as any || 'Worked');
      } else {
        setStatus(existingEntry.onlineHours >= 4 ? 'Worked' : 'Partial Day');
      }
    } else if (existingCal) {
      const isAbsent = existingCal.status === "Didn't Work";
      setDidWork(!isAbsent);
      setStatus(existingCal.status as any || 'Worked');
      setHoursWorked('');
      setTotalRides('');
      setDayEarnings('');
      setDayNotes(existingCal.notes || '');
    } else {
      // Default blank state seeds
      setDidWork(true);
      setStatus('Worked');
      setHoursWorked('');
      setTotalRides('');
      setDayEarnings('');
      setDayNotes('');
    }
  };

  // Submit/Save popup details through API channel
  const handleSaveState = async () => {
    if (!selectedDateStr) return;
    setIsSaving(true);
    setErrorText(null);

    const payload = {
      date: selectedDateStr,
      didWork: didWork,
      status: didWork ? status : "Didn't Work",
      onlineHours: didWork ? Number(hoursWorked || 0) : 0,
      tripsCount: didWork ? Number(totalRides || 0) : 0,
      earnings: didWork ? Number(dayEarnings || 0) : 0,
      notes: dayNotes.trim()
    };

    try {
      const response = await fetch('/api/calendar/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to write calendar entry back to PostgreSQL");
      }
      
      // Trigger a soft parent dataset refresh
      onRefresh();
      setSelectedDateStr(null);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Network exception saving spreadsheet status");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter lists specifically for the viewport month
  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  
  // Calculate active month statistical aggregates in pure real-time matching requested specs
  const daysInSelectedMonthArr = Array.from({ length: totalDays }, (_, idx) => {
    const dayNumVal = idx + 1;
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNumVal).padStart(2, '0')}`;
  });

  let workedDaysCount = 0;
  let absentDaysCount = 0;
  let totalEarningsSum = 0;

  daysInSelectedMonthArr.forEach(dateStr => {
    // We only process stats up to TODAY_STR
    if (dateStr <= TODAY_STR) {
      const classification = getDateStatusClassification(dateStr);
      if (classification === 'Worked' || classification === 'Partial Day') {
        workedDaysCount++;
        // Sum earnings
        const matchingEntry = entries.find(e => e.date === dateStr);
        if (matchingEntry) {
          totalEarningsSum += matchingEntry.earnings;
        }
      } else if (classification === "Didn't Work") {
        absentDaysCount++;
      }
    }
  });

  const totalEvaluatedDays = workedDaysCount + absentDaysCount;
  const attendanceRate = totalEvaluatedDays > 0 ? Math.round((workedDaysCount / totalEvaluatedDays) * 100) : 0;
  const avgEarningsPerWorkedDay = workedDaysCount > 0 ? Math.round(totalEarningsSum / workedDaysCount) : 0;

  return (
    <div className="w-full h-full pb-32">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-5 pt-3">
        <div>
          <span className="text-zinc-500 text-xs tracking-wider uppercase font-mono">Attendance Ledger Dashboard</span>
          <h1 className="text-2xl font-bold font-display text-white mt-0.5">Rider Calendar</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cred-neon">
          <CalendarRange className="w-5 h-5" />
        </div>
      </div>

      {/* Monthly Statistics Overview Plate */}
      <div className="mb-6 p-4 rounded-3xl cred-glass border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cred-neon/5 rounded-full blur-xl pointer-events-none" />
        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">
          📊 STATISTICS SUMMARY • {MONTH_NAMES[currentMonth].toUpperCase()}
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/50">
            <span className="text-[10px] uppercase font-semibold text-zinc-500 font-mono">Worked Days</span>
            <div className="text-2xl font-bold font-display text-emerald-400 mt-1 flex items-baseline gap-1.5">
              <span>{workedDaysCount}</span>
              <span className="text-xs font-medium text-emerald-500/80">Days</span>
            </div>
          </div>
          
          <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/50">
            <span className="text-[10px] uppercase font-semibold text-zinc-500 font-mono">Absent Days</span>
            <div className="text-2xl font-bold font-display text-rose-400 mt-1 flex items-baseline gap-1.5">
              <span>{absentDaysCount}</span>
              <span className="text-xs font-medium text-rose-500/80">Days</span>
            </div>
          </div>

          <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/50">
            <span className="text-[10px] uppercase font-semibold text-zinc-500 font-mono">Attendance Rate</span>
            <div className="text-2xl font-bold font-display text-cred-neon mt-1">
              {attendanceRate}%
            </div>
            <div className="w-full bg-zinc-850 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-cred-neon h-full transition-all duration-500" 
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/50">
            <span className="text-[10px] uppercase font-semibold text-zinc-500 font-mono">Avg Earnings</span>
            <div className="text-2xl font-bold font-display text-white mt-1">
              ₹{avgEarningsPerWorkedDay.toLocaleString('en-IN')}
            </div>
            <span className="text-[9px] text-zinc-500 italic mt-1 block">per active work day</span>
          </div>
        </div>

        <div className="mt-3 bg-zinc-900/50 border border-zinc-800/60 p-3 rounded-2xl flex justify-between items-center">
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">MONTHLY TOTAL INCOME</span>
            <span className="text-lg font-bold font-display text-emerald-400 block mt-0.5">₹{totalEarningsSum.toLocaleString('en-IN')}</span>
          </div>
          <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/10">
            {workedDaysCount} Active Logs
          </div>
        </div>
      </div>

      {/* Main Interactive Grid Shell */}
      <div className="p-4 rounded-3xl bg-zinc-900/50 border border-zinc-800/80">
        {/* Calendar Nav Strip */}
        <div className="flex justify-between items-center mb-4">
          <button 
            id="btn-prev-month"
            onClick={handlePrevMonth}
            className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-all active:scale-95 border border-zinc-700/30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <h2 id="calendar-header-title" className="text-base font-bold font-display text-white tracking-wide">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mt-0.5 block">Attendance Tracker Grid</span>
          </div>

          <button 
            id="btn-next-month"
            onClick={handleNextMonth}
            className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-all active:scale-95 border border-zinc-700/30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Legend Indicator Tags */}
        <div className="grid grid-cols-4 gap-1.5 py-2.5 px-2 bg-black/40 rounded-2xl border border-zinc-850 mb-4 text-[10px] font-medium text-zinc-400">
          <div className="flex items-center gap-1 justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>🟢 Worked</span>
          </div>
          <div className="flex items-center gap-1 justify-center">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>🔴 Didn't Work</span>
          </div>
          <div className="flex items-center gap-1 justify-center">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>🟡 Partial</span>
          </div>
          <div className="flex items-center gap-1 justify-center">
            <span className="w-2 h-2 rounded-full bg-zinc-600" />
            <span>⚪ Future</span>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-zinc-500 uppercase font-mono mb-2">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="py-1">{day}</div>
          ))}
        </div>

        {/* Days Box Matrix */}
        <div className="grid grid-cols-7 gap-1.5" id="calendar-grid-cells">
          {calendarCells.map((cell, idx) => {
            const statusType = getDateStatusClassification(cell.dateStr);
            const isToday = cell.dateStr === TODAY_STR;
            const isFuture = cell.dateStr > TODAY_STR;
            
            // Map statuses to customized Tailwind classes for perfect styling
            let ringColor = "";
            let dotColor = "bg-zinc-650";
            let bgStyle = "bg-zinc-950 hover:bg-zinc-850/80 border-transparent text-zinc-300";

            if (cell.isPadding) {
              bgStyle = "bg-transparent text-zinc-600 pointer-events-none";
            }

            if (!cell.isPadding) {
              if (isFuture) {
                dotColor = "bg-zinc-700/80";
                bgStyle = "bg-zinc-900/30 text-zinc-600 opacity-60 border-zinc-850/30 cursor-not-allowed";
              } else {
                if (statusType === 'Worked') {
                  dotColor = "bg-emerald-400";
                  bgStyle = "bg-emerald-950/20 text-emerald-200 border-emerald-500/20 shadow-[inset_0_0_12px_rgba(16,185,129,0.05)] hover:bg-emerald-950/40";
                } else if (statusType === 'Partial Day') {
                  dotColor = "bg-amber-400";
                  bgStyle = "bg-amber-950/20 text-amber-200 border-amber-500/20 shadow-[inset_0_0_12px_rgba(245,158,11,0.05)] hover:bg-amber-950/40";
                } else if (statusType === "Didn't Work") {
                  dotColor = "bg-rose-400";
                  bgStyle = "bg-rose-950/20 text-rose-200 border-rose-500/20 shadow-[inset_0_0_12px_rgba(244,63,94,0.05)] hover:bg-rose-950/40";
                }
              }
            }

            if (isToday) {
              ringColor = "ring-2 ring-cred-neon ring-offset-2 ring-offset-zinc-950 z-10";
            }

            return (
              <button
                key={`${cell.dateStr}-${idx}`}
                id={`cell-${cell.dateStr}`}
                disabled={isFuture || cell.isPadding}
                onClick={() => handleTapDate(cell)}
                className={`aspect-square relative flex flex-col items-center justify-between p-1.5 rounded-2xl border text-sm font-semibold transition-all duration-200 active:scale-95 ${bgStyle} ${ringColor}`}
              >
                {/* Day num */}
                <span>{cell.dayNum}</span>
                
                {/* State dot indicator */}
                {!cell.isPadding && (
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor} mb-0.5`} />
                )}

                {/* Today flag */}
                {isToday && (
                  <span className="absolute -top-1 -right-1 bg-cred-neon text-black text-[7px] font-extrabold uppercase px-1 rounded-sm tracking-tight scale-90">
                    Map
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Clicking Detail / Logging modal popup */}
      <AnimatePresence>
        {selectedDateStr && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[30px] p-5 shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedDateStr(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 flex items-center justify-center hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-cred-neon/10 text-cred-neon rounded-lg">
                  <CalendarRange className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-bold font-display text-lg">
                    {new Date(selectedDateStr + "T00:00:00").toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                  <span className="text-[10px] text-zinc-400 font-mono">ADJUST LEDGER PARAMETERS</span>
                </div>
              </div>

              {/* Error display if present */}
              {errorText && (
                <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3 flex gap-2 text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorText}</span>
                </div>
              )}

              {/* Checkbox Question: Did you work today? */}
              <div className="mb-4 bg-black/40 p-3.5 rounded-2xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block mb-2">Primary Work Query</span>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    id="chk-did-work"
                    checked={didWork}
                    onChange={(e) => {
                      setDidWork(e.target.checked);
                      if (e.target.checked) {
                        setStatus('Worked');
                      } else {
                        setStatus("Didn't Work");
                      }
                    }}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    didWork 
                      ? 'bg-cred-neon border-cred-neon text-black' 
                      : 'border-zinc-700 bg-zinc-800/50 group-hover:border-zinc-500'
                  }`}>
                    {didWork && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                  <span className="text-sm font-semibold text-white">
                    Did you work today?
                  </span>
                </label>
              </div>

              {/* Conditionally reveal Logging Fields */}
              {didWork ? (
                <div className="space-y-3.5 mb-5 max-h-[220px] overflow-y-auto pr-1">
                  {/* Attendance Sub-classification (Worked Full vs Worked Partial) */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 font-mono tracking-wider block mb-1.5">
                      Work Classification Status
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        id="btn-status-worked"
                        onClick={() => setStatus('Worked')}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                          status === 'Worked'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                            : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Work Day</span>
                      </button>
                      <button
                        type="button"
                        id="btn-status-partial"
                        onClick={() => setStatus('Partial Day')}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                          status === 'Partial Day'
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                            : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>Partial Day</span>
                      </button>
                    </div>
                  </div>

                  {/* Hours online worked */}
                  <div>
                    <label className="text-[10px] uppercase font-semibold text-zinc-500 font-mono tracking-wide block mb-1">
                      Hours Worked
                    </label>
                    <div className="relative">
                      <input 
                        type="number" 
                        id="input-hours-worked"
                        step="0.5"
                        min="0"
                        max="24"
                        placeholder="e.g. 8.5"
                        value={hoursWorked}
                        onChange={(e) => setHoursWorked(e.target.value)}
                        className="w-full bg-black/60 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cred-neon placeholder-zinc-600"
                      />
                      <Clock className="w-4 h-4 text-zinc-500 absolute right-3.5 top-3" />
                    </div>
                  </div>

                  {/* Total Rides */}
                  <div>
                    <label className="text-[10px] uppercase font-semibold text-zinc-500 font-mono tracking-wide block mb-1">
                      Total Rides Count
                    </label>
                    <div className="relative">
                      <input 
                        type="number" 
                        id="input-total-rides"
                        placeholder="e.g. 15"
                        min="0"
                        value={totalRides}
                        onChange={(e) => setTotalRides(e.target.value)}
                        className="w-full bg-black/60 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cred-neon placeholder-zinc-600"
                      />
                      <Navigation className="w-4 h-4 text-zinc-500 absolute right-3.5 top-3" />
                    </div>
                  </div>

                  {/* Earnings */}
                  <div>
                    <label className="text-[10px] uppercase font-semibold text-zinc-500 font-mono tracking-wide block mb-1">
                      Today's Earnings (₹)
                    </label>
                    <div className="relative">
                      <input 
                        type="number" 
                        id="input-day-earnings"
                        placeholder="e.g. 1200"
                        min="0"
                        value={dayEarnings}
                        onChange={(e) => setDayEarnings(e.target.value)}
                        className="w-full bg-black/60 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cred-neon placeholder-zinc-600 font-semibold"
                      />
                      <Wallet className="w-4 h-4 text-zinc-500 absolute right-3.5 top-3" />
                    </div>
                  </div>

                  {/* Day Notes */}
                  <div>
                    <label className="text-[10px] uppercase font-semibold text-zinc-500 font-mono tracking-wide block mb-1">
                      Notes
                    </label>
                    <textarea 
                      id="input-day-notes"
                      placeholder="Special weather conditions, low rides count details..."
                      rows={2}
                      value={dayNotes}
                      onChange={(e) => setDayNotes(e.target.value)}
                      className="w-full bg-black/60 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cred-neon placeholder-zinc-600 resize-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5 mb-5">
                  <div className="p-3 bg-rose-500/5 rounded-2xl border border-rose-500/10 text-xs text-rose-300 flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>This date will be cataloged as <strong>Absent / Rest Day</strong>. Any active daily earnings/trips log will be cleared out.</span>
                  </div>

                  {/* Day Notes */}
                  <div>
                    <label className="text-[10px] uppercase font-semibold text-zinc-500 font-mono tracking-wide block mb-1">
                      Notes / Reasons
                    </label>
                    <textarea 
                      id="input-day-absent-notes"
                      placeholder="Rest day, weather, sick leave, vehicle issue, etc..."
                      rows={2}
                      value={dayNotes}
                      onChange={(e) => setDayNotes(e.target.value)}
                      className="w-full bg-black/60 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cred-neon placeholder-zinc-600 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Action Operations */}
              <div className="flex gap-2">
                <button
                  type="button"
                  id="btn-calendar-cancel"
                  onClick={() => setSelectedDateStr(null)}
                  className="flex-1 py-3 text-xs font-semibold rounded-2xl bg-zinc-850 hover:bg-zinc-800 text-zinc-300 transition-colors"
                >
                  Discard
                </button>
                <button
                  type="button"
                  id="btn-calendar-submit"
                  disabled={isSaving}
                  onClick={handleSaveState}
                  className="flex-1 py-3 text-xs font-semibold rounded-2xl bg-cred-neon text-black hover:bg-cred-neon/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Log</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
