import React, { useState } from 'react';
import { DailyEntry as DailyRideEntry } from '../types';
import { 
  Check, 
  IndianRupee, 
  Bike, 
  Clock, 
  Fuel, 
  Coffee, 
  MessageSquare, 
  Percent, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';

interface DailyEntryProps {
  onSaveEntry: (entry: Omit<DailyRideEntry, 'id'>) => void;
  onNavigateToDashboard: () => void;
  profileDailyTarget: number;
}

export default function DailyEntry({ onSaveEntry, onNavigateToDashboard, profileDailyTarget }: DailyEntryProps) {
  // Preselected date defaults to today
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [earnings, setEarnings] = useState<number>(1000);
  const [tripsCount, setTripsCount] = useState<number>(18);
  const [onlineHours, setOnlineHours] = useState<number>(8);
  const [fuelExpense, setFuelExpense] = useState<number>(300);
  const [foodTeaExpense, setFoodTeaExpense] = useState<number>(60);
  const [otherExpense, setOtherExpense] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('16:00');
  
  // Payment split configuration (automatic recalculation of online vs cash)
  const [onlinePercent, setOnlinePercent] = useState<number>(70); // 70% online UPI by default
  const [success, setSuccess] = useState<boolean>(false);

  // Computed values
  const onlinePayment = Math.round((earnings * onlinePercent) / 100);
  const cashPayment = earnings - onlinePayment;
  const totalSpend = fuelExpense + foodTeaExpense + otherExpense;
  const netEarnings = earnings - totalSpend;

  // Presets helper
  const earningsPresets = [600, 800, 1000, 1200, 1500, 1800];
  const fuelPresets = [150, 200, 300, 400];
  const foodPresets = [40, 60, 100, 150];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSaveEntry({
      date,
      earnings,
      tripsCount,
      onlineHours,
      fuelExpense,
      foodTeaExpense,
      otherExpense,
      onlinePayment,
      cashPayment,
      notes: notes.trim() || undefined,
      startTime,
      endTime
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onNavigateToDashboard();
    }, 1500);
  };

  return (
    <div className="w-full h-full pb-32">
      <div className="mb-6 pt-4">
        <span className="text-zinc-500 text-xs tracking-wider uppercase font-mono">FINANCIAL LOGGER</span>
        <h1 className="text-2xl font-bold font-display text-white mt-0.5">Log Ride Revenue</h1>
        <p className="text-zinc-400 text-xs mt-1">Easily trace your day on roads with quick preset buttons.</p>
      </div>

      {success ? (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[350px] shadow-2xl"
        >
          <div className="w-16 h-16 bg-cred-neon/10 border border-cred-neon/30 text-cred-neon rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>
          <h2 className="text-xl font-bold font-display text-white">Daily Log Recorded!</h2>
          <p className="text-zinc-400 text-xs mt-2 max-w-[250px] mx-auto">
            Your earnings and expenses have been updated in your dashboard ledger.
          </p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Date and Working Hours Duration */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">DATE OF SERVICE</label>
              <input 
                type="date"
                required
                id="entry-date-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-neon tracking-wide text-sm"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">START TIME</label>
                <input 
                  type="time"
                  required
                  id="entry-start-time-input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-neon text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">END TIME</label>
                <input 
                  type="time"
                  required
                  id="entry-end-time-input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-neon text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section: Revenue Earnings with preset chips */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">TOTAL INCOME RECEIVED (₹)</label>
              <span className="text-xs text-cred-neon font-sans font-medium">Goal: ₹{profileDailyTarget}</span>
            </div>
            
            <div className="relative mt-2 flex items-center">
              <span className="absolute left-4 text-zinc-400 font-display text-2xl">₹</span>
              <input 
                type="number"
                required
                id="entry-earnings-input"
                min={0}
                value={earnings}
                onChange={(e) => setEarnings(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl pl-10 pr-4 py-4 focus:outline-none focus:border-cred-neon font-display font-bold text-2xl tracking-wide"
              />
            </div>

            {/* Quick chips presets */}
            <div className="flex flex-wrap gap-2 mt-4">
              {earningsPresets.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  id={`preset-earnings-${preset}`}
                  onClick={() => setEarnings(preset)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold font-display transition-all duration-150 border ${
                    earnings === preset 
                      ? 'bg-cred-neon text-black border-cred-neon shadow-[0_0_12px_rgba(0,255,102,0.3)]' 
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  ₹{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Online vs Cash Splitting Layout */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
            <span className="block text-xs font-mono text-zinc-500 tracking-wider uppercase mb-3">PAYMENT SETTLEMENT SPLIT</span>
            <div className="flex justify-between items-center text-xs text-zinc-400 mb-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cred-neon"></span> Online UPI (₹{onlinePayment})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cred-gold"></span> Cash In Hand (₹{cashPayment})
              </span>
            </div>
            
            <input 
              type="range"
              min="0"
              max="100"
              id="entry-split-slider"
              value={onlinePercent}
              onChange={(e) => setOnlinePercent(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cred-neon"
            />
            <div className="flex justify-between items-center mt-3 pt-2 text-xs border-t border-zinc-800/60">
              <button 
                type="button" 
                id="split-all-online"
                onClick={() => setOnlinePercent(100)}
                className="text-cred-neon font-mono text-[11px] hover:underline"
              >
                100% ONLINE
              </button>
              <span className="text-[11px] text-zinc-500 font-mono italic">{onlinePercent}% Online / {100 - onlinePercent}% Cash</span>
              <button 
                type="button" 
                id="split-all-cash"
                onClick={() => setOnlinePercent(0)}
                className="text-cred-gold font-mono text-[11px] hover:underline"
              >
                100% CASH
              </button>
            </div>
          </div>

          {/* Section: Trips & Online Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1 mb-2">
                <Bike className="w-3.5 h-3.5" /> TRIPS
              </label>
              <input 
                type="number"
                required
                id="entry-trips-input"
                min={1}
                value={tripsCount}
                onChange={(e) => setTripsCount(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-neon font-display font-bold text-lg"
              />
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1 mb-2">
                <Clock className="w-3.5 h-3.5" /> HOURS
              </label>
              <input 
                type="number"
                required
                id="entry-hours-input"
                step="0.5"
                min={0.5}
                value={onlineHours}
                onChange={(e) => setOnlineHours(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-neon font-display font-bold text-lg"
              />
            </div>
          </div>

          {/* Section: Expenses (Fuel, Chai & snacks) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4">
            <span className="block text-xs font-mono text-zinc-500 tracking-wider uppercase">DAY EXPENDITURE LOGS (₹)</span>

            {/* Petrol expense block */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1 text-zinc-400">
                  <Fuel className="w-3.5 h-3.5 text-amber-500" /> Petrol Charges
                </span>
                <span className="text-zinc-500">₹{fuelExpense}</span>
              </div>
              <div className="relative flex items-center">
                <input 
                  type="number"
                  min={0}
                  id="entry-fuel-input"
                  value={fuelExpense}
                  onChange={(e) => setFuelExpense(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-4 py-2.5 focus:outline-none focus:border-cred-neon font-mono"
                />
              </div>
              <div className="flex gap-1.5">
                {fuelPresets.map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    id={`preset-fuel-${preset}`}
                    onClick={() => setFuelExpense(preset)}
                    className="px-2.5 py-1 text-[10px] rounded-lg border border-zinc-800 bg-zinc-950/80 text-zinc-400 hover:border-zinc-700 transition"
                  >
                    +₹{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Food Tea expense block */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/60">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1 text-zinc-400">
                  <Coffee className="w-3.5 h-3.5 text-orange-400" /> Snacks & Chai/Coffee
                </span>
                <span className="text-zinc-500">₹{foodTeaExpense}</span>
              </div>
              <input 
                type="number"
                min={0}
                id="entry-food-input"
                value={foodTeaExpense}
                onChange={(e) => setFoodTeaExpense(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-4 py-2.5 focus:outline-none focus:border-cred-neon font-mono"
              />
              <div className="flex gap-1.5">
                {foodPresets.map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    id={`preset-food-${preset}`}
                    onClick={() => setFoodTeaExpense(preset)}
                    className="px-2.5 py-1 text-[10px] rounded-lg border border-zinc-800 bg-zinc-950/80 text-zinc-400 hover:border-zinc-700 transition"
                  >
                    +₹{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Miscellaneous */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/60">
              <label className="block text-xs text-zinc-400">Other Instant Expenses (e.g., bike puncher, parking, challenger)</label>
              <input 
                type="number"
                min={0}
                id="entry-other-expense-input"
                value={otherExpense}
                onChange={(e) => setOtherExpense(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-4 py-2.5 focus:outline-none focus:border-cred-neon font-mono"
              />
            </div>
          </div>

          {/* Section: Notes */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1 mb-2">
              <MessageSquare className="w-3.5 h-3.5" /> NOTES / REMARK / CHALLENGE
            </label>
            <textarea 
              rows={3}
              value={notes}
              id="entry-notes-input"
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Heavy traffic on silk board road, got bonus incentives from Rapido..."
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-neon text-sm resize-none"
            />
          </div>

          {/* Financial summary snapshot of raw day */}
          <div className="bg-gradient-to-r from-zinc-950 to-emerald-950/20 border border-zinc-800 rounded-3xl p-5">
            <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">PROJECTED DAY END REPORT</span>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Gross Day Revenue</span>
                <span className="text-white font-semibold">₹{earnings}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Integrated Day Expenses</span>
                <span className="text-zinc-300">-₹{totalSpend}</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-500 pt-1">
                <span>Estimated Petrol Consumption</span>
                <span>~{Math.round(fuelExpense / 1.05)} KM equivalent</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-3 border-t border-zinc-800/50 mt-2">
                <span className="text-cred-neon">Calculated Net Payout</span>
                <span className={netEarnings >= 0 ? 'text-cred-neon' : 'text-red-500'}>
                  ₹{netEarnings.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            id="save-entry-btn"
            className="w-full bg-cred-neon text-black font-display font-bold py-4 rounded-full shadow-[0_4px_16px_rgba(0,255,102,0.3)] transition-all hover:scale-[1.01] active:scale-95"
          >
            Authorize & Save Today's Ledger
          </button>
        </form>
      )}
    </div>
  );
}
