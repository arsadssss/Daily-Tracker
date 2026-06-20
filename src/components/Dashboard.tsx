import React, { useState } from 'react';
import { DailyEntry, Expense, EMI, RiderProfile } from '../types';
import { 
  TrendingUp, 
  Bike, 
  Fuel, 
  Coffee, 
  Wallet, 
  Target, 
  Clock, 
  Milestone, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown,
  CalendarCheck,
  ChevronRight,
  CreditCard,
  Percent,
  Sparkles,
  Award,
  CircleAlert,
  Edit2,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const getBlockProgressString = (percent: number) => {
  const totalBlocks = 10;
  const filledBlocks = Math.max(0, Math.min(totalBlocks, Math.round((percent / 100) * totalBlocks)));
  const emptyBlocks = totalBlocks - filledBlocks;
  return "█".repeat(filledBlocks) + "░".repeat(emptyBlocks);
};

interface DashboardProps {
  entries: DailyEntry[];
  expenses: Expense[];
  emis: EMI[];
  profile: RiderProfile;
  onDeleteEntry: (id: string) => Promise<void>;
  onUpdateEntry: (id: string, entry: Partial<DailyEntry>) => Promise<void>;
}

export default function Dashboard({ 
  entries, 
  expenses, 
  emis, 
  profile,
  onDeleteEntry,
  onUpdateEntry
}: DashboardProps) {
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);
  
  // Edit Form State for selectedEntry
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editDate, setEditDate] = useState<string>('');
  const [editEarnings, setEditEarnings] = useState<number>(1000);
  const [editTrips, setEditTrips] = useState<number>(18);
  const [editHours, setEditHours] = useState<number>(8);
  const [editFuel, setEditFuel] = useState<number>(300);
  const [editFood, setEditFood] = useState<number>(60);
  const [editOther, setEditOther] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editStartTime, setEditStartTime] = useState<string>('08:00');
  const [editEndTime, setEditEndTime] = useState<string>('16:00');
  const [editOnlinePercent, setEditOnlinePercent] = useState<number>(70);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  const startEdit = (entry: DailyEntry) => {
    setEditDate(entry.date);
    setEditEarnings(entry.earnings);
    setEditTrips(entry.tripsCount);
    setEditHours(entry.onlineHours);
    setEditFuel(entry.fuelExpense);
    setEditFood(entry.foodTeaExpense);
    setEditOther(entry.otherExpense);
    setEditNotes(entry.notes || '');
    setEditStartTime(entry.startTime || '08:00');
    setEditEndTime(entry.endTime || '16:00');
    
    const pct = entry.earnings > 0 ? Math.round((entry.onlinePayment / entry.earnings) * 100) : 70;
    setEditOnlinePercent(pct);
    setIsEditing(true);
    setConfirmDelete(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry) return;

    const computedOnline = Math.round((editEarnings * editOnlinePercent) / 100);
    const computedCash = editEarnings - computedOnline;

    await onUpdateEntry(selectedEntry.id, {
      date: editDate,
      earnings: editEarnings,
      tripsCount: editTrips,
      onlineHours: editHours,
      fuelExpense: editFuel,
      foodTeaExpense: editFood,
      otherExpense: editOther,
      notes: editNotes.trim() || undefined,
      startTime: editStartTime,
      endTime: editEndTime,
      onlinePayment: computedOnline,
      cashPayment: computedCash
    });

    setIsEditing(false);
    setSelectedEntry(null);
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;
    await onDeleteEntry(selectedEntry.id);
    setSelectedEntry(null);
    setConfirmDelete(false);
  };
  
  // Segment selector for active date metrics: 'current' (16-Jun-2026/today) vs 'latest' (latest day with logs)
  const [activeDateMode, setActiveDateMode] = useState<'today' | 'latest'>('latest');

  // Math aggregates for month overall
  const totalEarnings = entries.reduce((sum, item) => sum + item.earnings, 0);
  const totalFuelFromLogs = entries.reduce((sum, item) => sum + item.fuelExpense, 0);
  const totalFoodFromLogs = entries.reduce((sum, item) => sum + item.foodTeaExpense, 0);
  const totalOtherFromLogs = entries.reduce((sum, item) => sum + item.otherExpense, 0);
  
  // Custom manual other expenses
  const totalManualExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  
  const totalExpenses = totalFuelFromLogs + totalFoodFromLogs + totalOtherFromLogs + totalManualExpenses;
  const netEarnings = totalEarnings - totalExpenses;

  const totalTrips = entries.reduce((sum, item) => sum + item.tripsCount, 0);
  const totalHours = entries.reduce((sum, item) => sum + item.onlineHours, 0);
  
  const avgEarningsPerTrip = totalTrips > 0 ? Math.round(totalEarnings / totalTrips) : 0;
  const avgEarningsPerHour = totalHours > 0 ? Math.round(totalEarnings / totalHours) : 0;

  // Monthly Obligations (EMIs)
  const activeEMIs = emis.filter(e => e.active);
  const totalEMIObligation = activeEMIs.reduce((sum, e) => sum + e.emiAmount, 0);

  // EMI, commitments, borrowed money paid and outstanding metrics
  const totalEmiCommitmentsPaid = emis.reduce((sum, e) => sum + (e.emiAmount * e.paidMonths), 0);
  const totalEmiRemainingToPay = emis.reduce((sum, e) => sum + Math.max(0, e.totalAmount - (e.emiAmount * e.paidMonths)), 0);
  const netSavings = totalEarnings - totalExpenses - totalEmiCommitmentsPaid;

  // Focus Date Resolution (Today 16-Jun-2026 vs Latest Logged)
  const todayStr = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const latestLoggedDateStr = sortedEntries.length > 0 ? sortedEntries[0].date : todayStr;

  const resolvedFocusModeDate = activeDateMode === 'today' ? todayStr : latestLoggedDateStr;

  // Let's resolve stats for the focal date
  const focalLog = entries.find(e => e.date === resolvedFocusModeDate);
  
  // 1. Today's Earnings
  const focalEarnings = focalLog ? focalLog.earnings : 0;

  // 2. Today's Expenses
  const focalLogExpenses = focalLog ? (focalLog.fuelExpense + focalLog.foodTeaExpense + focalLog.otherExpense) : 0;
  const focalStandaloneExpenses = expenses.filter(exp => exp.date === resolvedFocusModeDate).reduce((sum, exp) => sum + exp.amount, 0);
  const focalExpenses = focalLogExpenses + focalStandaloneExpenses;

  // 3. Today's Profit
  const focalProfit = focalEarnings - focalExpenses;

  // 4. Today's Remaining Target
  const focalRemainingTarget = Math.max(profile.dailyTarget - focalEarnings, 0);
  const focalTargetPercent = Math.min(Math.round((focalEarnings / profile.dailyTarget) * 100), 100);

  // 5. Monthly Progress
  // Filter for active month (e.g. 2026-06)
  const targetMonthStr = resolvedFocusModeDate.substring(0, 7); // "2026-06"
  const currentMonthName = new Date(resolvedFocusModeDate + "T00:00:00").toLocaleDateString('en-IN', { month: 'long' });
  const monthEntries = entries.filter(e => e.date.startsWith(targetMonthStr));
  const monthEarningsTotal = monthEntries.reduce((sum, e) => sum + e.earnings, 0);
  const monthlyGoalTarget = (profile as any).monthlyTarget || (profile.dailyTarget * 25); // ₹30,005 baseline
  const monthlyProgressPercent = Math.min(Math.round((monthEarningsTotal / monthlyGoalTarget) * 100), 100);

  // 6. Upcoming EMI
  // Resolve nearest EMI due based on current date day
  const currentDayNum = new Date(resolvedFocusModeDate).getDate();
  const activeUnpaidEMIs = activeEMIs.filter(e => e.paidMonths < e.totalMonths);
  const sortedUpcomingEMIs = [...activeUnpaidEMIs].sort((a, b) => {
    const aDiff = a.dueDate >= currentDayNum ? a.dueDate - currentDayNum : a.dueDate + 30 - currentDayNum;
    const bDiff = b.dueDate >= currentDayNum ? b.dueDate - currentDayNum : b.dueDate + 30 - currentDayNum;
    return aDiff - bDiff;
  });
  const upcomingEMI = sortedUpcomingEMIs[0];

  // 7. Total Debt Remaining
  const totalDebtRemaining = activeEMIs.reduce((sum, e) => {
    return sum + Math.max(e.totalAmount - (e.emiAmount * e.paidMonths), 0);
  }, 0);

  const fuelPercentage = totalEarnings > 0 ? Math.round((totalFuelFromLogs / totalEarnings) * 100) : 0;

  return (
    <div className="w-full h-full pb-32">
      {/* Top Profile / Header */}
      <div className="flex justify-between items-center mb-5 pt-4">
        <div>
          <span className="text-zinc-500 text-xs tracking-wider uppercase font-mono">Premium Commuter Console</span>
          <h1 className="text-2xl font-bold font-display text-white mt-0.5">{profile.name}</h1>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-cred-neon animate-pulse"></span>
            <span>Online • {profile.bikeModel}</span>
          </div>
        </div>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cred-neon to-cred-gold rounded-full blur opacity-30 group-hover:opacity-70 transition duration-1000"></div>
          <div className="relative w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-display font-bold text-cred-neon text-lg">
            {profile.name.charAt(0)}
          </div>
        </div>
      </div>

      {/* TODAY'S GOAL DYNAMIC LEDGER HUD */}
      <div className="mb-6 p-5 rounded-3xl bg-zinc-905 border border-zinc-805/85 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cred-neon/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="grid grid-cols-3 gap-2">
          {/* Today's Goal */}
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">Today's Goal</span>
            <span className="text-2xl font-extrabold font-display text-white mt-1">
              ₹{profile.dailyTarget.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Earned */}
          <div className="flex flex-col border-l border-zinc-900 pl-3">
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">Earned</span>
            <span className="text-2xl font-extrabold font-display text-emerald-400 mt-1">
              ₹{focalEarnings.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Remaining */}
          <div className="flex flex-col border-l border-zinc-900 pl-3">
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">Remaining</span>
            <span className={`text-2xl font-extrabold font-display mt-1 ${focalRemainingTarget > 0 ? "text-cred-gold" : "text-emerald-400"}`}>
              ₹{focalRemainingTarget.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Character Progress Tracker Indicator */}
        <div className="mt-4 pt-3.5 border-t border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-cred-neon tracking-wider">
              {getBlockProgressString(focalTargetPercent)}
            </span>
            <span className="text-xs font-mono font-bold text-zinc-300">
              {focalTargetPercent}%
            </span>
          </div>
          <span className="text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-2 py-0.5 rounded-md">
            {focalRemainingTarget === 0 ? "Goal Met" : "Active Session"}
          </span>
        </div>
      </div>

      {/* Mode Selector for focal view date */}
      <div className="flex bg-zinc-900/60 p-1 rounded-2xl border border-zinc-800/80 mb-6 font-display">
        <button
          onClick={() => setActiveDateMode('latest')}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
            activeDateMode === 'latest' 
              ? 'bg-zinc-800 text-white shadow-[0_2px_8px_rgba(0,0,0,0.4)]' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          📅 Latest Logged ({new Date(latestLoggedDateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
        </button>
        <button
          onClick={() => setActiveDateMode('today')}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
            activeDateMode === 'today' 
              ? 'bg-zinc-800 text-white shadow-[0_2px_8px_rgba(0,0,0,0.4)] shadow-cred-neon/10' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          ⚡ Today ({new Date(todayStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
        </button>
      </div>

      {/* MASTER FINANCIAL ROADCOCKPIT (7 KEY METRICS) */}
      <div className="mb-4">
        <h3 className="text-xs font-mono tracking-widest text-zinc-500 uppercase mb-3">FINANCIAL COCKPIT SUMMARY</h3>
        
        {/* Core Daily Highlight Box */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-neutral-900 to-black p-5 border border-zinc-850 shadow-xl mb-4">
          <div className="absolute top-0 right-0 w-44 h-44 bg-cred-neon/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
              {activeDateMode === 'today' ? "TODAY'S LEDGER SUMMARY" : "LATEST LOGGED REVENUE SUMMARY"}
            </span>
            <span className="px-2.5 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-cred-neon">
              {activeDateMode === 'today' ? "🔴 LIVE WINDOW" : "✅ LOGGED DATA"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-zinc-800/80">
            {/* Metric 1: Today's Earnings */}
            <div>
              <span className="text-[10px] text-zinc-500 font-mono block uppercase">TODAY'S EARNINGS</span>
              <p className="text-3xl font-extrabold font-display text-white mt-1">
                ₹{focalEarnings.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-zinc-500">
                {activeDateMode === 'today' && focalEarnings === 0 ? "No earnings saved today yet" : "Gross daily reward"}
              </span>
            </div>

            {/* Metric 2: Today's Expenses */}
            <div>
              <span className="text-[10px] text-zinc-500 font-mono block uppercase">TODAY'S EXPENSES</span>
              <p className="text-3xl font-extrabold font-display text-cred-accent mt-1">
                ₹{focalExpenses.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-zinc-500">
                {focalLogExpenses > 0 ? "Fuel & food logged" : "Zero instant costs"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 mb-2">
            {/* Metric 3: Today's Profit */}
            <div>
              <span className="text-[10px] text-zinc-500 font-mono block uppercase">TODAY'S PROFIT</span>
              <p className={`text-xl font-bold font-display mt-0.5 ${focalProfit >= 0 ? "text-emerald-400" : "text-cred-alert"}`}>
                ₹{focalProfit.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-zinc-500">
                Net remaining payload
              </span>
            </div>

            {/* Metric 4: Today's Remaining Target */}
            <div>
              <span className="text-[10px] text-zinc-500 font-mono block uppercase">TODAY'S REMAINING TARGET</span>
              <p className="text-xl font-bold font-display text-cred-gold mt-0.5">
                ₹{focalRemainingTarget.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-zinc-500">
                Goal: ₹{profile.dailyTarget}
              </span>
            </div>
          </div>

          {/* Mini progress line for remaining target */}
          <div className="mt-3">
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-cred-neon h-full rounded-full transition-all duration-500"
                style={{ width: `${focalTargetPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1.5">
              <span>{focalTargetPercent}% Target Completed</span>
              <span>{focalRemainingTarget === 0 ? "🎉 Daily Goal Met!" : `₹${focalRemainingTarget} to go`}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Warning Alert for empty Today's stats if user toggled Current Day */}
        {activeDateMode === 'today' && !focalLog && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 mb-4 text-center">
            <div className="flex items-center gap-1.5 justify-center text-amber-500 text-xs font-semibold mb-1">
              <CircleAlert className="w-4 h-4" />
              <span>Today's Ledger is Empty</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal mb-2">
              You haven't added an entry for June 16, 2026 yet.
            </p>
            <span className="text-[10px] text-zinc-500 italic block">
              💡 Tip: Navigate using the Bottom Tab bar to logs and enter today's miles!
            </span>
          </div>
        )}

        {/* Obligation, Target & Debt Cards (Metrics 5, 6, 7) */}
        <div className="grid grid-cols-1 gap-3">
          
          {/* Card 5: Monthly Progress */}
          <div className="cred-glass p-4 rounded-2xl border border-zinc-800/80">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">MONTHLY PROGRESS</span>
                <h4 className="text-lg font-bold font-display text-white mt-0.5">
                  ₹{monthEarningsTotal.toLocaleString('en-IN')}
                  <span className="text-zinc-500 text-xs font-normal"> of ₹{monthlyGoalTarget.toLocaleString('en-IN')} Target</span>
                </h4>
              </div>
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cred-neon">
                <Award className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cred-neon to-yellow-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${monthlyProgressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1.5">
                <span>{currentMonthName} Month-To-Date Progress</span>
                <span className="font-semibold text-white">{monthlyProgressPercent}% completed</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Card 6: Upcoming EMI */}
            <div className="cred-glass p-4 rounded-2xl border border-zinc-800/80 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">UPCOMING EMI</span>
                  <CreditCard className="w-3.5 h-3.5 text-cred-gold" />
                </div>
                {upcomingEMI ? (
                  <>
                    <h5 className="text-base font-extrabold font-display text-white mt-1.5">
                      ₹{upcomingEMI.emiAmount.toLocaleString('en-IN')}
                    </h5>
                    <p className="text-[10px] text-zinc-400 mt-1 truncate">
                      {upcomingEMI.name}
                    </p>
                  </>
                ) : (
                  <>
                    <h5 className="text-base font-extrabold font-display text-emerald-400 mt-1.5">
                      ₹0
                    </h5>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      No unpaid loans found
                    </p>
                  </>
                )}
              </div>
              {upcomingEMI && (
                <div className="pt-2 border-t border-zinc-900 mt-3 flex justify-between items-center text-[10px] text-zinc-500">
                  <span>Due Date:</span>
                  <span className="text-cred-gold font-semibold font-mono bg-cred-gold/5 px-1 py-0.5 rounded border border-cred-gold/10">
                    Day {upcomingEMI.dueDate}
                  </span>
                </div>
              )}
            </div>

            {/* Card 7: Total Debt Remaining */}
            <div className="cred-glass p-4 rounded-2xl border border-zinc-800/80 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">TOTAL DEBT REMAINING</span>
                  <TrendingDown className="w-3.5 h-3.5 text-cred-alert" />
                </div>
                <h5 className="text-base font-extrabold font-display text-white mt-1.5">
                  ₹{totalDebtRemaining.toLocaleString('en-IN')}
                </h5>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Across active loan pipelines
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-900 mt-3 flex justify-between items-center text-[10px]">
                <span className="text-zinc-500">Active EMIs:</span>
                <span className="text-white font-mono">{activeEMIs.length} channels</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* LEDGER & SAVINGS DEEP-DIVE STATEMENTS */}
      <div className="mb-6 space-y-4">
        <h3 className="text-xs font-mono tracking-widest text-zinc-500 uppercase">LEDGER & SAVINGS COCKPIT</h3>
        
        {/* Savings Balance Display Box */}
        <div id="savings-balance-summary-card" className="bg-zinc-950/80 border border-zinc-800 rounded-3xl p-5 shadow-[0_12px_40px_rgba(0,0,0,0.8)] relative overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase block">CURRENT NET SAVINGS BALANCE</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-3xl font-black font-display tracking-tight ${netSavings >= 0 ? 'text-cred-neon' : 'text-red-500'}`}>
                ₹{netSavings.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-zinc-400">Net Investible Surplus</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
              Calculated as Gross Rider Earnings (₹{totalEarnings.toLocaleString('en-IN')}) minus fuel & other expenses (₹{totalExpenses.toLocaleString('en-IN')}) and total EMI, commitments, and borrowed money paid so far (₹{totalEmiCommitmentsPaid.toLocaleString('en-IN')}).
            </p>
          </div>

          {/* Table Breakdown of Savings */}
          <div className="border-t border-zinc-900 pt-3.5 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 flex items-center gap-1.5 font-mono text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                (+) GROSS EARNINGS
              </span>
              <span className="font-mono text-white font-bold">₹{totalEarnings.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 flex items-center gap-1.5 font-mono text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-450" />
                (-) TOTAL EXPENSES (PETROL & LEDGER)
              </span>
              <span className="font-mono text-zinc-300">₹{totalExpenses.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 flex items-center gap-1.5 font-mono text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                (-) OBLIGATIONS & BORROWED MONEY PAID
              </span>
              <span className="font-mono text-zinc-300">₹{totalEmiCommitmentsPaid.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Savings progress indication */}
          {totalEarnings > 0 && (
            <div className="pt-2 border-t border-zinc-900/60">
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-cred-neon h-full rounded-full"
                  style={{ width: `${Math.max(0, Math.min(100, Math.round((netSavings / totalEarnings) * 100)))}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-zinc-550 mt-1.5">
                <span>Savings Retention Ratio</span>
                <span className="text-zinc-400">{Math.round((netSavings / totalEarnings) * 100)}% of total earnings</span>
              </div>
            </div>
          )}
        </div>

        {/* Total Remaining EMIs / Commitments Card */}
        <div id="emi-debt-remaining-card" className="bg-zinc-950/40 border border-zinc-850 rounded-3xl p-5 relative overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase block">TOTAL REMAINING EMI & CHANNELS OUTSTANDING</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-display tracking-tight text-white">
                ₹{totalEmiRemainingToPay.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-zinc-400">Left to fully close</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
              Sum of the outstanding balance across all your registered EMIs, credit card borrowings, and commitments (Total Principal minus Paid installments).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-900/60 text-xs">
            <div>
              <span className="text-zinc-500 text-[9px] block font-mono">EMI LOANS MET SO FAR</span>
              <span className="font-mono font-bold text-emerald-400">₹{totalEmiCommitmentsPaid.toLocaleString('en-IN')} Paid</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[9px] block font-mono">TOTAL EMI PIPELINES</span>
              <span className="font-mono font-semibold text-zinc-300">{emis.length} Accounts Listed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auxiliary Statistics Metrics */}
      <h3 className="text-xs font-mono tracking-widest text-zinc-500 uppercase mt-6 mb-3">HISTORIC INSIGHT SNAPSHOTS</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Card A: Fuel Ratio */}
        <div className="bg-gradient-to-tr from-zinc-950 to-zinc-900 border border-zinc-800/80 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute top-2 right-2 flex text-amber-500 opacity-15">
            <Fuel className="w-12 h-12" />
          </div>
          <span className="text-zinc-500 text-[10px] font-mono block uppercase">FUEL COST RATIO</span>
          <h4 className="text-2xl font-bold font-display text-white mt-1">{fuelPercentage}%</h4>
          <p className="text-[10px] text-zinc-400 mt-1">cumulative fuel share to earnings</p>
        </div>

        {/* Card B: Hours Logged */}
        <div className="bg-gradient-to-tr from-zinc-950 to-zinc-900 border border-zinc-800/80 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute top-2 right-2 flex text-cred-blue opacity-15">
            <Clock className="w-12 h-12" />
          </div>
          <span className="text-zinc-500 text-[10px] font-mono block uppercase">ONLINE TIME LOGGED</span>
          <h4 className="text-2xl font-bold font-display text-white mt-1">{totalHours} Hrs</h4>
          <p className="text-[10px] text-zinc-400 mt-1">All logged active service hours</p>
        </div>

        {/* Card C: Average Per Trip & Hourly */}
        <div className="bg-gradient-to-tr from-zinc-950 to-zinc-900 border border-zinc-800/80 rounded-2xl p-4 col-span-2">
          <span className="text-zinc-500 text-[10px] font-mono block uppercase">COMMUNITY RIDER METRICS</span>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-white/5 rounded-xl p-2.5">
              <span className="text-zinc-500 text-[10px] block">Average Earning per Ride</span>
              <p className="text-sm font-bold font-display text-white mt-0.5">₹{avgEarningsPerTrip}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5">
              <span className="text-zinc-500 text-[10px] block">Average Hourly Yield</span>
              <p className="text-sm font-bold font-display text-white mt-0.5">₹{avgEarningsPerHour} / hr</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trips Log */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-mono tracking-widest text-zinc-500 uppercase">REVENUE JOURNALS</h3>
        <span className="text-[10px] text-zinc-500 font-mono">Past {sortedEntries.length} entries</span>
      </div>

      <div className="space-y-2.5">
        {sortedEntries.length === 0 ? (
          <div className="cred-glass p-8 rounded-3xl border border-dashed border-zinc-800 text-center">
            <p className="text-zinc-400 text-sm font-medium">No work days recorded yet.</p>
            <p className="text-zinc-500 text-xs mt-1">Tap the plus button below to input your first day's ride revenue.</p>
          </div>
        ) : (
          sortedEntries.map((entry) => {
            const netDay = entry.earnings - (entry.fuelExpense + entry.foodTeaExpense + entry.otherExpense);
            
            return (
              <div 
                key={entry.id}
                id={`entry-${entry.id}`}
                onClick={() => setSelectedEntry(entry)}
                className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700/80 transition-all duration-200 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-11 h-11 rounded-xl bg-zinc-950 border border-zinc-850 flex flex-col items-center justify-center text-zinc-300">
                    <span className="text-[9px] font-mono tracking-tighter text-zinc-500 uppercase">
                      {new Date(entry.date).toLocaleString('en-IN', { month: 'short' })}
                    </span>
                    <span className="text-sm font-bold font-display text-white -mt-0.5">
                      {new Date(entry.date).getDate()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-display group-hover:text-cred-neon transition-colors duration-200">
                      ₹{entry.earnings.toLocaleString('en-IN')} Earning
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-0.5 text-emerald-500 font-mono">
                        <ArrowUpRight className="w-3 h-3" />
                        {entry.tripsCount} trips
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="flex items-center gap-1 text-amber-500 font-mono">
                        <Fuel className="w-3 h-3" />
                        ₹{entry.fuelExpense} Petrol
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-mono text-zinc-500">Net Profit</p>
                  <p className={`text-xs font-bold font-display mt-0.5 ${netDay >= 0 ? "text-emerald-400" : "text-cred-alert"}`}>
                    ₹{netDay.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal - Daily Entry Detail/Edit View */}
      <AnimatePresence>
        {selectedEntry && (
          <div className="fixed inset-0 z-50 flex items-end justify-center px-4 bg-black/85 backdrop-blur-sm">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-zinc-950 w-full max-w-md rounded-t-[32px] border-t border-x border-zinc-805 p-5 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto"
            >
              {isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                    <div>
                      <span className="text-[10px] font-mono tracking-wider text-cred-neon uppercase font-bold">REVENUE JOURNAL EDITOR</span>
                      <h3 className="text-sm font-bold font-display text-white mt-0.5">
                        {editDate ? new Date(editDate).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Edit Entry'}
                      </h3>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setIsEditing(false)}
                      className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-bold hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Date Input */}
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">DATE OF SERVICE</label>
                    <input 
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cred-neon font-mono"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* Times Input */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">START TIME</label>
                      <input 
                        type="time"
                        required
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cred-neon"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">END TIME</label>
                      <input 
                        type="time"
                        required
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cred-neon"
                      />
                    </div>
                  </div>

                  {/* Gross Income Input */}
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">GROSS REVENUE RECEIVED (₹)</label>
                    <input 
                      type="number"
                      required
                      min={0}
                      value={editEarnings}
                      onChange={(e) => setEditEarnings(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white font-display font-bold text-xl rounded-xl px-3 py-2.5 focus:outline-none focus:border-cred-neon"
                    />
                  </div>

                  {/* Online Split Slider */}
                  <div className="bg-zinc-900/50 border border-zinc-850 p-3 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 tracking-wider">
                      <span>UPI SHARE: {editOnlinePercent}%</span>
                      <span>CASH SHARE: {100 - editOnlinePercent}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={editOnlinePercent}
                      onChange={(e) => setEditOnlinePercent(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-cred-neon"
                    />
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-zinc-400">Online UPI: <strong className="text-white">₹{Math.round((editEarnings * editOnlinePercent) / 100)}</strong></span>
                      <span className="text-zinc-400">Cash: <strong className="text-white">₹{editEarnings - Math.round((editEarnings * editOnlinePercent) / 100)}</strong></span>
                    </div>
                  </div>

                  {/* Rides and Hours */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">TRIPS COUNT</label>
                      <input 
                        type="number"
                        required
                        min={1}
                        value={editTrips}
                        onChange={(e) => setEditTrips(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-3 py-2 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">ONLINE HOURS</label>
                      <input 
                        type="number"
                        required
                        step="0.5"
                        min={0.5}
                        value={editHours}
                        onChange={(e) => setEditHours(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-3 py-2 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Expenses Inputs */}
                  <div className="bg-zinc-900/40 p-3.5 rounded-2xl border border-zinc-850 space-y-3">
                    <span className="block text-[10px] font-mono text-zinc-500 tracking-wider uppercase font-semibold">INTEGRATED DAY EXPENDITURES (₹)</span>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <span className="block text-[9px] text-zinc-500 font-mono mb-1 text-center">Petrol</span>
                        <input 
                          type="number"
                          min={0}
                          value={editFuel}
                          onChange={(e) => setEditFuel(Number(e.target.value))}
                          className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-2 py-1.5 text-xs text-center font-mono"
                        />
                      </div>
                      <div>
                        <span className="block text-[9px] text-zinc-500 font-mono mb-1 text-center font-sans">Tea/Snacks</span>
                        <input 
                          type="number"
                          min={0}
                          value={editFood}
                          onChange={(e) => setEditFood(Number(e.target.value))}
                          className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-2 py-1.5 text-xs text-center font-mono"
                        />
                      </div>
                      <div>
                        <span className="block text-[9px] text-zinc-500 font-mono mb-1 text-center">Other</span>
                        <input 
                          type="number"
                          min={0}
                          value={editOther}
                          onChange={(e) => setEditOther(Number(e.target.value))}
                          className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-2 py-1.5 text-xs text-center font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes Remarks */}
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">NOTES / MEMORANDUMS</label>
                    <input 
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Remarks about weather, traffic or bonuses..."
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>

                  {/* Actions footer */}
                  <div className="flex gap-2.5 pt-2">
                    <button 
                      type="submit"
                      className="flex-1 bg-cred-neon text-black font-bold font-display py-3 rounded-full hover:bg-emerald-400 transition shadow-[0_4px_14px_rgba(0,255,102,0.25)] text-xs uppercase"
                    >
                      Save Journal Entry
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsEditing(false)}
                      className="px-5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 font-semibold rounded-full transition text-xs"
                    >
                      Back
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-wider">LOG DETAIL SPECIFICATION</span>
                      <h3 className="text-lg font-bold font-display text-white mt-0.5">
                        {new Date(selectedEntry.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </h3>
                    </div>
                    <button 
                      onClick={() => setSelectedEntry(null)}
                      className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-bold hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Earnings Split */}
                  <div className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800 mb-4">
                    <span className="text-zinc-500 font-mono text-[9px] tracking-wider uppercase">EARNINGS CONFIGURATION</span>
                    <p className="text-2xl font-extrabold font-display text-cred-neon mt-1">₹{selectedEntry.earnings}</p>
                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-zinc-800/80">
                      <div>
                        <span className="text-zinc-500 text-xs">Online Paid (GPay/Paytm)</span>
                        <p className="text-white font-bold font-display mt-0.5">₹{selectedEntry.onlinePayment}</p>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-xs">Cash Paid</span>
                        <p className="text-white font-bold font-display mt-0.5">₹{selectedEntry.cashPayment}</p>
                      </div>
                    </div>
                  </div>

                  {/* Expenses Split */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-3 text-center">
                      <Fuel className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                      <span className="text-zinc-500 text-[9px] uppercase font-mono">Petrol</span>
                      <p className="text-white font-semibold font-display mt-0.5 font-mono font-bold">₹{selectedEntry.fuelExpense}</p>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-3 text-center">
                      <Coffee className="w-4 h-4 mx-auto text-orange-400 mb-1" />
                      <span className="text-zinc-500 text-[9px] uppercase font-mono">Tea/Food</span>
                      <p className="text-white font-semibold font-display mt-0.5 font-mono font-bold">₹{selectedEntry.foodTeaExpense}</p>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-3 text-center">
                      <Wallet className="w-4 h-4 mx-auto text-zinc-400 mb-1" />
                      <span className="text-zinc-500 text-[9px] uppercase font-mono">Other</span>
                      <p className="text-white font-semibold font-display mt-0.5 font-mono font-bold">₹{selectedEntry.otherExpense}</p>
                    </div>
                  </div>

                  {/* Ride Efficiency Metrics */}
                  <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5 space-y-2 mb-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">Total Rides Done</span>
                      <span className="text-white font-semibold font-mono">{selectedEntry.tripsCount} trips</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">Active Online Hours</span>
                      <span className="text-white font-semibold font-mono">{selectedEntry.onlineHours} hours</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">Average Rate / Hour</span>
                      <span className="text-white font-semibold font-mono">₹{selectedEntry.onlineHours > 0 ? Math.round(selectedEntry.earnings / selectedEntry.onlineHours) : 0} / hr</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-zinc-800/50">
                      <span className="text-zinc-400">Net Profit</span>
                      <span className="text-emerald-400 font-semibold font-mono">
                        ₹{selectedEntry.earnings - (selectedEntry.fuelExpense + selectedEntry.foodTeaExpense + selectedEntry.otherExpense)}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedEntry.notes && (
                    <div className="mb-4">
                      <span className="text-zinc-500 font-mono text-[9px] tracking-wider uppercase">RIDER MEMO / NOTES</span>
                      <p className="text-xs text-zinc-300 bg-zinc-900/40 p-3 border border-zinc-850 rounded-xl mt-1 select-text">
                        "{selectedEntry.notes}"
                      </p>
                    </div>
                  )}

                  {/* Modify or Delete Actions (Added as requested) */}
                  <div className="grid grid-cols-2 gap-3 mb-4 mt-2">
                    <button 
                      type="button"
                      onClick={() => startEdit(selectedEntry)}
                      className="flex items-center justify-center gap-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-750 text-white font-semibold py-2.5 rounded-xl transition text-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-cred-neon" />
                      Edit Log
                    </button>

                    {confirmDelete ? (
                      <div className="flex gap-1.5">
                        <button 
                          type="button"
                          onClick={handleDelete}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition text-[11px]"
                        >
                          Confirm
                        </button>
                        <button 
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="px-3 bg-zinc-900 border border-zinc-850 text-zinc-400 rounded-xl text-xs"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="flex items-center justify-center gap-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-750 text-red-500 font-semibold py-2.5 rounded-xl transition text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Log
                      </button>
                    )}
                  </div>

                  <button 
                    onClick={() => setSelectedEntry(null)}
                    className="w-full bg-white text-black font-semibold font-display py-3 rounded-full hover:bg-zinc-200 transition-colors text-sm"
                  >
                    Close Summary
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
