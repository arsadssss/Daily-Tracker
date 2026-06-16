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
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnalyticsProps {
  entries: DailyEntry[];
  expenses: Expense[];
  emis: EMI[];
  profile: RiderProfile;
}

export default function Analytics({ entries, expenses, emis, profile }: AnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'trends' | 'breakdowns' | 'debt_attendance'>('trends');

  // Basic checks
  const hasData = entries.length > 0;

  // Real data calculations
  const totalEarnings = entries.reduce((sum, item) => sum + item.earnings, 0);
  const totalFuel = entries.reduce((sum, item) => sum + item.fuelExpense, 0);
  const totalFood = entries.reduce((sum, item) => sum + item.foodTeaExpense, 0);
  const totalOther = entries.reduce((sum, item) => sum + item.otherExpense, 0);
  const totalManualExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = totalFuel + totalFood + totalOther + totalManualExpenses;

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
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-2xl border border-zinc-850 mb-5 text-[10px] uppercase font-bold text-center">
        <button
          onClick={() => setActiveTab('trends')}
          id="btn-analytics-tab-trends"
          className={`py-2 rounded-xl transition ${
            activeTab === 'trends' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          📈 Income Trends
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
          onClick={() => setActiveTab('debt_attendance')}
          id="btn-analytics-tab-debt"
          className={`py-2 rounded-xl transition ${
            activeTab === 'debt_attendance' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          🎯 Goals & Debt
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
