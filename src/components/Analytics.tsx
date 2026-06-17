import React, { useState } from 'react';
import { DailyEntry, Expense, EMI, RiderProfile } from '../types';
import { 
  TrendingUp, 
  Fuel, 
  Clock, 
  Percent, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  CheckCircle,
  HelpCircle,
  Milestone,
  PieChart,
  BarChart,
  LineChart,
  DollarSign,
  AlertCircle,
  Wallet,
  CreditCard,
  ArrowRight,
  Calculator,
  Calendar,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell,
  CartesianGrid
} from 'recharts';

interface AnalyticsProps {
  entries: DailyEntry[];
  expenses: Expense[];
  emis: EMI[];
  profile: RiderProfile;
}

export default function Analytics({ entries, expenses, emis, profile }: AnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'trends' | 'breakdowns' | 'cash_flow' | 'debt_attendance'>('trends');

  // Interactive Cash Flow Simulator States
  // Setup defaults matching user example: Last payment of 20,000 on June 14, earned 2,200 & 1,800 on June 15 & 16, next due 3,000 on June 20.
  const [lastPaymentDate, setLastPaymentDate] = useState<string>('2026-06-14');
  const [lastPaymentAmount, setLastPaymentAmount] = useState<number>(20000);
  const [nextPaymentDate, setNextPaymentDate] = useState<string>('2026-06-20');
  const [nextPaymentAmount, setNextPaymentAmount] = useState<number>(3000);

  // Basic checks
  const hasData = entries.length > 0;

  // Real data calculations
  const totalEarnings = entries.reduce((sum, item) => sum + item.earnings, 0);
  const totalOnlineEarnings = entries.reduce((sum, item) => sum + (item.onlinePayment || 0), 0);
  const totalCashEarnings = entries.reduce((sum, item) => sum + (item.cashPayment || 0), 0);

  const totalFuel = entries.reduce((sum, item) => sum + item.fuelExpense, 0);
  const totalFood = entries.reduce((sum, item) => sum + item.foodTeaExpense, 0);
  const totalOther = entries.reduce((sum, item) => sum + item.otherExpense, 0);
  const totalManualExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = totalFuel + totalFood + totalOther + totalManualExpenses;

  // Recharts Spending Distribution Calculation
  const fuelExpensesFromLogs = entries.reduce((sum, item) => sum + item.fuelExpense, 0);
  const fuelExpensesManual = expenses.filter(e => e.category === 'Fuel').reduce((sum, e) => sum + e.amount, 0);
  const totalFuelSpending = fuelExpensesFromLogs + fuelExpensesManual;

  const foodExpensesFromLogs = entries.reduce((sum, item) => sum + item.foodTeaExpense, 0);
  const foodExpensesManual = expenses.filter(e => e.category === 'Food & Tea').reduce((sum, e) => sum + e.amount, 0);
  const totalFoodSpending = foodExpensesFromLogs + foodExpensesManual;

  const totalMaintenanceSpending = expenses.filter(e => e.category === 'Maintenance').reduce((sum, e) => sum + e.amount, 0);

  const tollSpending = expenses.filter(e => e.category === 'Toll / Permit').reduce((sum, e) => sum + e.amount, 0);
  const mobileSpending = expenses.filter(e => e.category === 'Mobile Recharge').reduce((sum, e) => sum + e.amount, 0);
  const challanSpending = expenses.filter(e => e.category === 'Challan').reduce((sum, e) => sum + e.amount, 0);
  const otherExpensesFromLogs = entries.reduce((sum, item) => sum + item.otherExpense, 0);
  const otherExpensesManual = expenses.filter(e => e.category === 'Other').reduce((sum, e) => sum + e.amount, 0);
  const totalOtherSpending = tollSpending + mobileSpending + challanSpending + otherExpensesFromLogs + otherExpensesManual;

  const rechartsSpendingData = [
    { category: 'Fuel', amount: totalFuelSpending, color: '#f59e0b' },
    { category: 'Food', amount: totalFoodSpending, color: '#f97316' },
    { category: 'Maintenance', amount: totalMaintenanceSpending, color: '#3b82f6' },
    { category: 'Other', amount: totalOtherSpending, color: '#a855f7' }
  ];

  // Average Daily Income & Expenses
  const numDays = entries.length;
  const avgDailyIncome = numDays > 0 ? Math.round(totalEarnings / numDays) : 0;
  const avgDailyExpenses = numDays > 0 ? Math.round((totalFuel + totalFood + totalOther) / numDays) : 0;

  // Debt Calculations
  const totalDebtPaid = emis.reduce((sum, emi) => sum + (emi.paidMonths * emi.emiAmount), 0);
  const totalDebtRemaining = emis.reduce((sum, emi) => {
    const monthsLeft = emi.totalMonths - emi.paidMonths;
    return sum + (monthsLeft * emi.emiAmount);
  }, 0);
  const grandTotalDebt = totalDebtPaid + totalDebtRemaining;
  const debtReductionProgress = grandTotalDebt > 0 ? Math.round((totalDebtPaid / grandTotalDebt) * 100) : 0;

  // Attendance Aggregates
  const workedDays = entries.filter(e => e.earnings > 0 || e.onlineHours >= 4).length;
  const totalEvaluated = entries.length;
  const attendanceRate = totalEvaluated > 0 ? Math.round((workedDays / totalEvaluated) * 100) : 0;

  // Group by date for Daily Trend (sorted)
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const dailyEarningsMax = sortedEntries.length > 0 ? Math.max(...sortedEntries.map(e => e.earnings), 100) : 100;

  // Group by Monthly for Monthly Earnings Trend
  const monthlyDataMap: { [month: string]: number } = {};
  entries.forEach(e => {
    // e.date comes in YYYY-MM-DD -> grab YYYY-MM
    const monthKey = e.date.substring(0, 7);
    monthlyDataMap[monthKey] = (monthlyDataMap[monthKey] || 0) + e.earnings;
  });
  const monthlyKeysSorted = Object.keys(monthlyDataMap).sort();
  const maxMonthlyEarnings = monthlyKeysSorted.length > 0 ? Math.max(...Object.values(monthlyDataMap)) : 100;

  // Expense breakdown segments
  const totalBreakdownSpent = Math.max(totalExpenses, 1);
  const fuelShareP = Math.round((totalFuel / totalBreakdownSpent) * 100);
  const foodShareP = Math.round((totalFood / totalBreakdownSpent) * 100);
  const otherShareP = Math.round((totalOther / totalBreakdownSpent) * 100);
  const manualShareP = Math.round((totalManualExpenses / totalBreakdownSpent) * 100);

  // SVG Line Path Helper: Daily Trendline
  const getDailyPathData = (width: number, height: number, padding: number) => {
    if (sortedEntries.length < 2) return "";
    const points = sortedEntries.map((e, index) => {
      const x = padding + (index / (sortedEntries.length - 1)) * (width - padding * 2);
      const y = height - padding - (e.earnings / dailyEarningsMax) * (height - padding * 2);
      return `${x},${y}`;
    });
    return `M ${points.join(" L ")}`;
  };

  return (
    <div className="w-full h-full pb-32">
      {/* Header */}
      <div className="flex justify-between items-center mb-5 pt-3">
        <div>
          <span className="text-zinc-500 text-xs tracking-wider uppercase font-mono">FINANCE LABS COCKPIT</span>
          <h1 className="text-2xl font-bold font-display text-white mt-0.5 font-sans">Performance Analytics</h1>
          <p className="text-zinc-400 text-xs mt-1">Mathematical projections derived squarely from live database ledgers.</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cred-neon">
          <Activity className="w-5 h-5 animate-pulse" />
        </div>
      </div>

      {/* Averages Banner Indicators */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-4 rounded-3xl bg-zinc-900/40 border border-zinc-850 relative overflow-hidden">
          <span className="text-zinc-500 text-[10px] font-mono block uppercase">AVERAGE DAILY INCOME</span>
          <div className="text-2xl font-bold font-sans text-emerald-400 mt-2">
            ₹{avgDailyIncome.toLocaleString('en-IN')}
          </div>
          <span className="text-[9px] text-zinc-500 block mt-1">per on-road logging day</span>
        </div>

        <div className="p-4 rounded-3xl bg-zinc-900/40 border border-zinc-850 relative overflow-hidden">
          <span className="text-zinc-500 text-[10px] font-mono block uppercase">AVERAGE DAILY EXPENSES</span>
          <div className="text-2xl font-bold font-sans text-rose-400 mt-2">
            ₹{avgDailyExpenses.toLocaleString('en-IN')}
          </div>
          <span className="text-[9px] text-zinc-500 block mt-1">fuel, food & miscellaneous combo</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-black/40 rounded-2xl border border-zinc-850 mb-5 text-[9px] uppercase font-bold text-center">
        <button
          onClick={() => setActiveTab('trends')}
          id="btn-analytics-tab-trends"
          className={`py-2 rounded-xl transition ${
            activeTab === 'trends' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          📈 Trends
        </button>
        <button
          onClick={() => setActiveTab('breakdowns')}
          id="btn-analytics-tab-breakdowns"
          className={`py-2 rounded-xl transition ${
            activeTab === 'breakdowns' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          🍰 Expenses
        </button>
        <button
          onClick={() => setActiveTab('cash_flow')}
          id="btn-analytics-tab-cash-flow"
          className={`py-2 rounded-xl transition ${
            activeTab === 'cash_flow' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          💵 Cash Flow
        </button>
        <button
          onClick={() => setActiveTab('debt_attendance')}
          id="btn-analytics-tab-debt"
          className={`py-2 rounded-xl transition ${
            activeTab === 'debt_attendance' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          🎯 Goals
        </button>
      </div>

      {/* Dynamic Tab Contents */}
      {!hasData ? (
        <div className="cred-glass p-12 rounded-[32px] border border-dashed border-zinc-850 text-center">
          <AlertCircle className="w-10 h-10 text-zinc-650 mx-auto mb-3" />
          <h2 className="text-zinc-350 font-bold font-sans">Insufficient Database Logs</h2>
          <p className="text-zinc-500 text-xs mt-1.5 max-w-[280px] mx-auto">
            Analytics models can only form visual insights once you register at least one Daily Entry log in RideOS.
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'trends' && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Daily Earnings Trend */}
              <div className="cred-glass p-5 rounded-3xl border border-white/5">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white font-sans flex items-center gap-1.5">
                      <LineChart className="w-4 h-4 text-cred-neon" /> Daily Earnings Trend
                    </h3>
                    <span className="text-[10px] text-zinc-500 font-mono">PROMPT SENSITIVE TIMELINE VALUE</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/10">
                    Max: ₹{dailyEarningsMax.toLocaleString('en-IN')}
                  </span>
                </div>

                {sortedEntries.length < 2 ? (
                  <div className="text-zinc-500 text-xs py-10 text-center font-mono bg-black/20 rounded-2xl border border-zinc-850">
                    Logged entries: {sortedEntries.length}/2. Add more entries to form trendlines.
                  </div>
                ) : (
                  <div className="h-44 bg-black/40 border border-zinc-850 p-2.5 rounded-2xl items-center justify-center relative">
                    <svg viewBox="0 0 360 150" className="w-full h-full">
                      <defs>
                        <linearGradient id="trendsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00ff66" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#00ff66" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <line x1="15" y1="15" x2="345" y2="15" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="15" y1="75" x2="345" y2="75" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="15" y1="135" x2="345" y2="135" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="3 3" />

                      <path
                        d={`${getDailyPathData(360, 150, 15)} L 345,135 L 15,135 Z`}
                        fill="url(#trendsGrad)"
                      />
                      <path
                        d={getDailyPathData(360, 150, 15)}
                        fill="none"
                        stroke="#00ff66"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {sortedEntries.map((e, idx) => {
                        const x = 15 + (idx / (sortedEntries.length - 1)) * (360 - 30);
                        const y = 150 - 15 - (e.earnings / dailyEarningsMax) * (150 - 30);
                        return (
                          <circle
                            key={idx}
                            cx={x}
                            cy={y}
                            r="3"
                            fill="#000000"
                            stroke="#00ff66"
                            strokeWidth="2"
                          />
                        );
                      })}
                    </svg>
                    <div className="flex justify-between items-center text-[8px] font-mono text-zinc-500 mt-2 px-1">
                      <span>{sortedEntries[0].date}</span>
                      <span>Chronological Logging Grid</span>
                      <span>{sortedEntries[sortedEntries.length - 1].date}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Monthly Earnings Trend */}
              <div className="cred-glass p-5 rounded-3xl border border-white/5">
                <div>
                  <h3 className="text-sm font-bold text-white font-sans flex items-center gap-1.5 mb-1.5">
                    <BarChart className="w-4 h-4 text-cred-gold" /> Monthly Earnings Trend
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-mono block mb-4">BAR CHARTED GROSS MONTHLY MULTIPLIERS</span>
                </div>

                {monthlyKeysSorted.length === 0 ? (
                  <div className="text-zinc-500 text-xs py-8 text-center font-mono">No monthly grouped datasets</div>
                ) : (
                  <div className="space-y-3.5">
                    {monthlyKeysSorted.map((mKey) => {
                      const earningsMonth = monthlyDataMap[mKey];
                      const pctOfMax = Math.max(Math.round((earningsMonth / maxMonthlyEarnings) * 100), 5);
                      // Convert 'YYYY-MM' to readable name
                      const [year, monthNum] = mKey.split('-');
                      const dateObj = new Date(Number(year), Number(monthNum) - 1, 1);
                      const monthNameClean = dateObj.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

                      return (
                        <div key={mKey} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-zinc-400">{monthNameClean}</span>
                            <span className="text-cred-gold">₹{earningsMonth.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="w-full bg-zinc-900 h-3.5 rounded-lg overflow-hidden border border-zinc-850">
                            <div 
                              className="bg-cred-gold h-full rounded-r-lg transition-all duration-500 ease-out"
                              style={{ width: `${pctOfMax}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'breakdowns' && (
            <motion.div
              key="breakdowns"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Expense breakdown chart */}
              <div className="cred-glass p-5 rounded-3xl border border-white/5">
                <h3 className="text-sm font-bold text-white font-sans flex items-center gap-1.5 mb-1.5">
                  <PieChart className="w-4 h-4 text-rose-400" /> Expense Allocation Breakdown
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono block mb-4">PERCENT VALUE ALLOCATION SHARE</span>

                {totalExpenses === 0 ? (
                  <div className="text-zinc-500 text-xs py-10 text-center font-mono">
                    No recorded on-road petrol or chai expenses yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Fuel */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" /> Petrol / Fuel Cost
                        </span>
                        <span>₹{totalFuel.toLocaleString('en-IN')} ({fuelShareP}%)</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full transition-all" style={{ width: `${fuelShareP}%` }} />
                      </div>
                    </div>

                    {/* Food */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <span className="w-2.5 h-2.5 bg-orange-400 rounded-full" /> Food, Chai & Tea
                        </span>
                        <span>₹{totalFood.toLocaleString('en-IN')} ({foodShareP}%)</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                        <div className="bg-orange-400 h-full transition-all" style={{ width: `${foodShareP}%` }} />
                      </div>
                    </div>

                    {/* Other from logs */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <span className="w-2.5 h-2.5 bg-purple-500 rounded-full" /> Other Eventual Costs
                        </span>
                        <span>₹{totalOther.toLocaleString('en-IN')} ({otherShareP}%)</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full transition-all" style={{ width: `${otherShareP}%` }} />
                      </div>
                    </div>

                    {/* Manual registered expense */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <span className="w-2.5 h-2.5 bg-rose-450 rounded-full" /> Standalone Registered Costs
                        </span>
                        <span>₹{totalManualExpenses.toLocaleString('en-IN')} ({manualShareP}%)</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-450 h-full transition-all" style={{ width: `${manualShareP}%` }} />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-800/60 flex justify-between items-center text-xs font-bold text-zinc-400">
                      <span>COMBINED REVENUE EATEN</span>
                      <span className="text-rose-400">₹{totalExpenses.toLocaleString('en-IN')} Spent</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Recharts Spending Category Bar Chart */}
              <div className="cred-glass p-5 rounded-3xl border border-white/5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white font-sans flex items-center gap-1.5 mb-1">
                    <BarChart className="w-4 h-4 text-emerald-400" /> Recharts Category Distribution
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-mono block">
                    BAR CHART RENDERED SPENDING CHANNELS IN REAL-TIME
                  </span>
                </div>

                {totalExpenses === 0 ? (
                  <div className="text-zinc-500 text-xs py-10 text-center font-mono">
                    Add log entries or standalone ledger expenses to view category chart.
                  </div>
                ) : (
                  <>
                    <div className="h-56 mt-2 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          data={rechartsSpendingData}
                          margin={{ top: 15, right: 10, left: -25, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                          <XAxis 
                            dataKey="category" 
                            stroke="#52525b" 
                            fontSize={10} 
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="#52525b" 
                            fontSize={10} 
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => `₹${val}`}
                          />
                          <RechartsTooltip
                            cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                            contentStyle={{
                              backgroundColor: '#09090b',
                              border: '1px solid #27272a',
                              borderRadius: '12px',
                              fontSize: '11px',
                              color: '#fff',
                              fontFamily: 'monospace'
                            }}
                            formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, 'Spent']}
                          />
                          <Bar 
                            dataKey="amount" 
                            radius={[6, 6, 0, 0]}
                            maxBarSize={32}
                          >
                            {rechartsSpendingData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      {rechartsSpendingData.map((item, index) => (
                        <div 
                          key={index} 
                          className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-850/80 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-zinc-400 font-sans text-[11px]">{item.category}</span>
                          </div>
                          <span className="font-mono text-white font-bold text-[11px]">₹{item.amount.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'cash_flow' && (
            <motion.div
              key="cash_flow"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Online vs Cash Liquidity split card */}
              <div className="cred-glass p-5 rounded-3xl border border-white/5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white font-sans flex items-center gap-1.5 mb-1">
                    <Wallet className="w-4 h-4 text-emerald-400" /> Total Liquid Earnings Split
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-mono block">
                    CUMULATIVE EARNED POOL SEGREGATED BY INCOMING CHANNELS
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-2xl relative overflow-hidden">
                    <span className="text-[9px] font-mono text-zinc-500 block">ONLINE GPAY/UPI PAYMENTS</span>
                    <span className="text-2xl font-black font-display text-emerald-400 block mt-1">
                      ₹{totalOnlineEarnings.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[9px] text-zinc-550 block mt-1.5 font-mono">
                      {totalEarnings > 0 ? Math.round((totalOnlineEarnings / totalEarnings) * 100) : 0}% of gross ledger
                    </span>
                  </div>

                  <div className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-2xl relative overflow-hidden">
                    <span className="text-[9px] font-mono text-zinc-500 block">PHYSICAL CASH PAYMENTS</span>
                    <span className="text-2xl font-black font-display text-amber-500 block mt-1">
                      ₹{totalCashEarnings.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[9px] text-zinc-550 block mt-1.5 font-mono">
                      {totalEarnings > 0 ? Math.round((totalCashEarnings / totalEarnings) * 100) : 0}% of gross ledger
                    </span>
                  </div>
                </div>

                {/* Progress bar split */}
                {totalEarnings > 0 && (
                  <div className="space-y-1">
                    <div className="w-full bg-amber-500 h-2.5 rounded-full flex overflow-hidden">
                      <div 
                        className="bg-emerald-400 h-full transition-all" 
                        style={{ width: `${(totalOnlineEarnings / totalEarnings) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-zinc-550 px-0.5">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"/> Online</span>
                      <span className="flex items-center gap-1">Cash <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"/></span>
                    </div>
                  </div>
                )}
              </div>

              {/* POST-PAYMENT RUNWAY SIMULATOR */}
              <div className="cred-glass p-5 rounded-3xl border border-white/5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white font-sans flex items-center gap-1.5 mb-1">
                      <Calculator className="w-4 h-4 text-cred-gold" /> Post-Payment Surplus Runway
                    </h3>
                    <span className="text-[10px] text-zinc-500 font-mono block">
                      DYNAMIC ACCUMULATION SINCE LAST MAJOR SETTLEMENT
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-cred-neon bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/15">
                    Live Simulator
                  </span>
                </div>

                {/* Simulation inputs split */}
                <div className="grid grid-cols-2 gap-3 bg-zinc-950/50 p-3.5 rounded-2xl border border-zinc-900 text-xs text-white">
                  <div>
                    <label className="block text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Last Pay Date</label>
                    <input 
                      type="date"
                      value={lastPaymentDate}
                      onChange={(e) => setLastPaymentDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cred-gold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Paid Already (₹)</label>
                    <input 
                      type="number"
                      value={lastPaymentAmount}
                      onChange={(e) => setLastPaymentAmount(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cred-gold font-mono"
                    />
                  </div>

                  <div className="mt-1">
                    <label className="block text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Next Due Date</label>
                    <input 
                      type="date"
                      value={nextPaymentDate}
                      onChange={(e) => setNextPaymentDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cred-gold font-mono"
                    />
                  </div>
                  <div className="mt-1">
                    <label className="block text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Upcoming EMI (₹)</label>
                    <input 
                      type="number"
                      value={nextPaymentAmount}
                      onChange={(e) => setNextPaymentAmount(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cred-gold font-mono"
                    />
                  </div>
                </div>

                {/* Calculation math outputs */}
                {(() => {
                  // Filter daily entries logged strictly after lastPaymentDate
                  const postPaymentEntries = entries.filter(e => e.date > lastPaymentDate);
                  const accumulatedEarnings = postPaymentEntries.reduce((sum, item) => sum + item.earnings, 0);
                  const accumulatedOnline = postPaymentEntries.reduce((sum, item) => sum + (item.onlinePayment || 0), 0);
                  const accumulatedCash = postPaymentEntries.reduce((sum, item) => sum + (item.cashPayment || 0), 0);
                  const accumulatedExpenses = postPaymentEntries.reduce((sum, item) => sum + item.fuelExpense + item.foodTeaExpense + item.otherExpense, 0);
                  
                  const activeSurplusInHand = accumulatedEarnings - accumulatedExpenses;
                  const projectedBalanceAfterEmi = activeSurplusInHand - nextPaymentAmount;

                  return (
                    <div className="space-y-4">
                      {/* Interactive breakdown panel */}
                      <div className="bg-zinc-900/40 border border-zinc-850/80 rounded-2xl p-4 space-y-3.5">
                        <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-900">
                          <span className="text-zinc-400 font-medium">Accumulation Period:</span>
                          <span className="font-mono text-zinc-300 font-semibold">
                            {lastPaymentDate} <ArrowRight className="w-3.5 h-3.5 text-zinc-500 inline mx-1 align-middle" /> Present
                          </span>
                        </div>

                        {/* List of post-payment logs */}
                        <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                          {postPaymentEntries.length === 0 ? (
                            <p className="text-[10px] text-zinc-550 font-mono text-center py-2">
                              No driver earnings logged since {lastPaymentDate}. Add entries to simulate!
                            </p>
                          ) : (
                            postPaymentEntries.map((item, index) => (
                              <div key={index} className="flex justify-between items-center text-[11px] font-mono hover:bg-zinc-900/60 p-1.5 rounded-lg">
                                <span className="text-zinc-500 font-sans flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-zinc-640" />
                                  {new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                </span>
                                <div className="text-right space-y-0.5">
                                  <span className="text-white font-bold">₹{item.earnings.toLocaleString('en-IN')}</span>
                                  <span className="text-[9px] text-zinc-550 block">UPI: ₹{item.onlinePayment} | Cash: ₹{item.cashPayment}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Formula summary */}
                        <div className="space-y-2.5 pt-2 border-t border-zinc-900">
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-500 font-mono text-[10px]">TOTAL EARNED POST-PAYMENT:</span>
                            <span className="font-mono text-white font-bold">₹{accumulatedEarnings.toLocaleString('en-IN')}</span>
                          </div>

                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-500 font-mono text-[10px]">(-) ROAD EXPENSES INCURRED:</span>
                            <span className="font-mono text-zinc-400">₹{accumulatedExpenses.toLocaleString('en-IN')}</span>
                          </div>

                          <div className="flex justify-between text-xs pt-1.5 border-t border-zinc-900/50">
                            <span className="text-zinc-400 font-mono text-[10px] font-bold">NET ACCUMULATED SURPLUS (IN HAND):</span>
                            <span className="font-mono text-emerald-400 font-extrabold">₹{activeSurplusInHand.toLocaleString('en-IN')}</span>
                          </div>

                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-500 font-mono text-[10px]">UPCOMING EMI DUE ({new Date(nextPaymentDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}):</span>
                            <span className="font-mono text-rose-400 font-bold">₹{nextPaymentAmount.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Final remaining projection banner */}
                      <div className={`p-4 rounded-2xl border ${
                        projectedBalanceAfterEmi >= 0 
                          ? 'bg-emerald-950/25 border-emerald-900/50 text-emerald-400 font-semibold' 
                          : 'bg-rose-950/25 border-rose-900/50 text-rose-400 font-semibold'
                      } flex items-center justify-between`}>
                        <div>
                          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">PROJECTED IN-HAND BAL ON {new Date(nextPaymentDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                          <span className="text-[11px] text-zinc-450 font-sans mt-0.5 block leading-tight font-normal">
                            {projectedBalanceAfterEmi >= 0 
                              ? 'Remaining surplus balance in hand' 
                              : 'Projected net cash deficit for upcoming commitment'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black font-display tracking-tight block">
                            ₹{projectedBalanceAfterEmi.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-500">Post-Commitment Liquidity</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Informative Help Guide Card */}
                <div className="bg-zinc-900/25 p-3 rounded-2xl border border-zinc-850 text-[11px] text-zinc-500 space-y-1.5">
                  <div className="flex items-center gap-1 font-bold text-zinc-400">
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-500" /> Understanding Runway Calculations
                  </div>
                  <p className="leading-relaxed">
                    This simulator runs live ledger calculations. If you paid off your primary obligations (e.g., ₹20,000) and then earned new money (e.g., ₹2,200 and ₹1,800 on subsequent days), the net accumulation represents your in-hand liquidity. Subtracting the upcoming EMI (e.g. ₹3,000 due on 20 June) yields your final remaining cash-in-hand buffer!
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'debt_attendance' && (
            <motion.div
              key="debt"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Attendance Trend */}
              <div className="cred-glass p-5 rounded-3xl border border-white/5">
                <h3 className="text-sm font-bold text-white font-sans flex items-center gap-1.5 mb-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Attendance Multiplier
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono block mb-4">ON-ROAD ENGAGEMENT PERFORMANCE COEF</span>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-zinc-400 font-mono">Worked Days:</span>
                    <span className="text-lg font-bold font-display text-emerald-400 block mt-0.5">{workedDays} Days</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 font-mono">Total Evaluations:</span>
                    <span className="text-lg font-bold font-display text-zinc-300 block mt-0.5">{totalEvaluated} Days</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-400 font-mono font-bold text-cred-neon flex items-center gap-0.5 justify-end">
                      Ratio
                    </span>
                    <span className="text-2xl font-bold font-display text-cred-neon block">{attendanceRate}%</span>
                  </div>
                </div>

                <div className="w-full bg-zinc-900 h-2.5 rounded-full mt-4 overflow-hidden">
                  <div className="bg-cred-neon h-full transition-all duration-500" style={{ width: `${attendanceRate}%` }} />
                </div>
              </div>

              {/* Debt Reduction Progress */}
              <div className="cred-glass p-5 rounded-3xl border border-white/5">
                <h3 className="text-sm font-bold text-white font-sans flex items-center gap-1.5 mb-1.5">
                  <Milestone className="w-4 h-4 text-cred-gold" /> Debt Reduction Progress
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono block mb-4">PAID VS OUTSTANDING ACTIVE PORTFOLIO</span>

                {grandTotalDebt === 0 ? (
                  <div className="text-zinc-500 text-xs py-8 text-center font-mono">
                    No active loan repayments registered yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-zinc-950/40 p-3 rounded-2xl border border-zinc-850">
                        <span className="text-zinc-500 font-mono">Debt Cleared (Paid):</span>
                        <span className="text-base font-extrabold font-sans text-emerald-400 block mt-1">₹{totalDebtPaid.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="bg-zinc-950/40 p-3 rounded-2xl border border-zinc-850">
                        <span className="text-zinc-500 font-mono">Debt Remaining:</span>
                        <span className="text-base font-extrabold font-sans text-rose-400 block mt-1">₹{totalDebtRemaining.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-zinc-400">Cumulative Recovery Percentage</span>
                        <span className="text-cred-gold font-bold">{debtReductionProgress}% Saved</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-3 rounded-lg overflow-hidden border border-zinc-850">
                        <div 
                          className="bg-cred-gold h-full rounded-r-lg transition-all duration-500 ease-out"
                          style={{ width: `${debtReductionProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
