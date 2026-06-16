import React, { useState, useEffect } from 'react';
import { DailyEntry, Expense, EMI, RiderProfile, WorkCalendarEntry } from './types';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import DailyEntryForm from './components/DailyEntry';
import Expenses from './components/Expenses';
import EMITracker from './components/EMITracker';
import Calendar from './components/Calendar';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Navigation, Wallet, CreditCard, Receipt, Bike, Loader, RefreshCw, CircleAlert } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  
  // Real database-connected states
  const [profile, setProfile] = useState<RiderProfile>({
    name: "Arsad Sagir",
    bikeModel: "Hero Splendor",
    dailyTarget: 1200,
    hourlyGoal: 150
  });
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [emis, setEmis] = useState<EMI[]>([]);
  const [workCalendar, setWorkCalendar] = useState<WorkCalendarEntry[]>([]);

  // Page loading & synchronization statuses
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Sync / Load everything from PostgreSQL on mount
  const syncServerDataset = async () => {
    setIsLoading(true);
    setDbError(null);
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new Error(`HTTP Error Status: ${response.status}`);
      }
      const data = await response.json();
      if (data.profile) setProfile(data.profile);
      if (data.entries) setEntries(data.entries);
      if (data.expenses) setExpenses(data.expenses);
      if (data.emis) setEmis(data.emis);
      if (data.workCalendar) setWorkCalendar(data.workCalendar);
    } catch (err: any) {
      console.error("Failed database connectivity lookup:", err);
      setDbError(err.message || "Could not synchronize with database. Check your DATABASE_URL connectivity.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncServerDataset();
  }, []);

  // Core Mutation Handlers connected to Express API proxying PostgreSQL

  const handleSaveEntry = async (newEntry: Omit<DailyEntry, 'id'>) => {
    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to store entry in PostgreSQL");
      }
      const savedRow = await response.json();
      setEntries((prev) => [savedRow, ...prev]);
    } catch (err: any) {
      alert(`Database Error: ${err.message}`);
    }
  };

  const handleAddExpense = async (newExpense: Omit<Expense, 'id'>) => {
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense)
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to write spend to database");
      }
      const savedRow = await response.json();
      setExpenses((prev) => [savedRow, ...prev]);
    } catch (err: any) {
      alert(`Database Error: ${err.message}`);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to remove item");
      }
      setExpenses((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(`Database Error: ${err.message}`);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const response = await fetch(`/api/daily_entries/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to remove entry");
      }
      setEntries((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(`Database Error: ${err.message}`);
    }
  };

  const handleUpdateEntry = async (id: string, updatedEntry: Partial<DailyEntry>) => {
    try {
      const response = await fetch(`/api/daily_entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEntry)
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to edit entry");
      }
      const savedRow = await response.json();
      setEntries((prev) => prev.map((item) => item.id === id ? { ...item, ...savedRow, id: String(savedRow.id) } : item));
    } catch (err: any) {
      alert(`Database Error: ${err.message}`);
    }
  };

  const handleUpdateExpense = async (id: string, updatedExpense: Partial<Expense>) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedExpense)
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to edit expense");
      }
      const savedRow = await response.json();
      setExpenses((prev) => prev.map((item) => item.id === id ? { ...item, ...savedRow, id: String(savedRow.id) } : item));
    } catch (err: any) {
      alert(`Database Error: ${err.message}`);
    }
  };

  const handleAddEMI = async (newEMI: Omit<EMI, 'id' | 'active'>) => {
    try {
      const response = await fetch('/api/emi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEMI)
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save loan info");
      }
      const savedRow = await response.json();
      setEmis((prev) => [...prev, savedRow]);
    } catch (err: any) {
      alert(`Database Error: ${err.message}`);
    }
  };

  const handleDeleteEMI = async (id: string) => {
    try {
      const response = await fetch(`/api/emi/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to remove loan installment tracker");
      }
      setEmis((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(`Database Error: ${err.message}`);
    }
  };

  const handleToggleEMI = async (id: string) => {
    try {
      const response = await fetch(`/api/emi/${id}/toggle`, {
        method: 'POST'
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to toggle status");
      }
      const updatedRow = await response.json();
      setEmis((prev) => prev.map((item) => item.id === id ? updatedRow : item));
    } catch (err: any) {
      alert(`Database Error: ${err.message}`);
    }
  };

  const handleIncrementPaidMonths = async (id: string) => {
    try {
      const response = await fetch(`/api/emi/${id}/pay`, {
        method: 'POST'
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update tenure cleared");
      }
      const updatedRow = await response.json();
      setEmis((prev) => prev.map((item) => item.id === id ? updatedRow : item));
    } catch (err: any) {
      alert(`Database Error: ${err.message}`);
    }
  };

  const handleUpdateEMI = async (id: string, updatedEMI: Partial<EMI>) => {
    try {
      const response = await fetch(`/api/financial_commitments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEMI)
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to edit loan info");
      }
      const savedRow = await response.json();
      setEmis((prev) => prev.map((item) => item.id === id ? { ...item, ...savedRow, id: String(savedRow.id) } : item));
    } catch (err: any) {
      alert(`Database Error: ${err.message}`);
    }
  };

  const handleUpdateProfile = async (updatedProfile: RiderProfile) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile)
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update config");
      }
      const updatedUser = await response.json();
      setProfile(updatedUser);
    } catch (err: any) {
      alert(`Database Error: ${err.message}`);
    }
  };

  const handleResetData = async () => {
    try {
      const response = await fetch('/api/reset', {
        method: 'POST'
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to clean datasets");
      }
      const clearedStates = await response.json();
      setProfile(clearedStates.profile);
      setEntries(clearedStates.entries);
      setExpenses(clearedStates.expenses);
      setEmis(clearedStates.emis);
      setCurrentTab('dashboard');
    } catch (err: any) {
      alert(`Database Error: ${err.message}`);
    }
  };

  // Nav helper for DailyEntry success redirect
  const handleNavigateToDashboard = () => {
    setCurrentTab('dashboard');
  };

  const handleImportData = (jsonStr: string): boolean => {
    // Legacy support for import fallback
    return false;
  };

  const handleExportData = (): string => {
    // Legacy support for backup export
    const backupObj = { profile, entries, expenses, emis };
    return JSON.stringify(backupObj, null, 2);
  };

  // Tab router
  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-400 font-sans">
          <Loader className="w-8 h-8 animate-spin text-cred-neon mb-3" />
          <p className="text-sm font-semibold tracking-wide text-white">Connecting Neon PostgreSQL...</p>
          <p className="text-xs text-zinc-500 mt-1">Fetching financial ledger sheets securely</p>
        </div>
      );
    }

    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard 
            entries={entries} 
            expenses={expenses} 
            emis={emis} 
            profile={profile} 
            onDeleteEntry={handleDeleteEntry}
            onUpdateEntry={handleUpdateEntry}
          />
        );
      case 'calendar':
        return (
          <Calendar 
            entries={entries} 
            workCalendar={workCalendar} 
            profile={profile} 
            onRefresh={syncServerDataset}
          />
        );
      case 'daily-entry':
        return (
          <DailyEntryForm 
            onSaveEntry={handleSaveEntry} 
            onNavigateToDashboard={handleNavigateToDashboard} 
            profileDailyTarget={profile.dailyTarget}
          />
        );
      case 'expenses':
        return (
          <Expenses 
            expenses={expenses} 
            onAddExpense={handleAddExpense} 
            onDeleteExpense={handleDeleteExpense} 
            onUpdateExpense={handleUpdateExpense}
          />
        );
      case 'emi':
        return (
          <EMITracker 
            emis={emis} 
            onAddEMI={handleAddEMI} 
            onDeleteEMI={handleDeleteEMI} 
            onToggleEMI={handleToggleEMI}
            onIncrementPaidMonths={handleIncrementPaidMonths}
            onUpdateEMI={handleUpdateEMI}
          />
        );
      case 'analytics':
        return (
          <Analytics 
            entries={entries} 
            expenses={expenses} 
            emis={emis} 
            profile={profile} 
          />
        );
      case 'settings':
        return (
          <Settings 
            profile={profile} 
            onUpdateProfile={handleUpdateProfile} 
            onResetData={handleResetData}
            onImportData={handleImportData}
            onExportData={handleExportData}
          />
        );
      default:
        return (
          <Dashboard 
            entries={entries} 
            expenses={expenses} 
            emis={emis} 
            profile={profile} 
            onDeleteEntry={handleDeleteEntry}
            onUpdateEntry={handleUpdateEntry}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-start items-center p-0 md:py-8 lg:py-12 select-none">
      {/* Absolute Backdrop ambient lights */}
      <div className="fixed top-0 left-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-cred-gold/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Desktop side companion widget */}
      <div className="hidden lg:flex fixed left-12 top-1/2 -translate-y-1/2 w-[320px] flex-col gap-6 select-text">
        <div className="flex items-center gap-2 text-cred-neon">
          <Bike className="w-8 h-8 stroke-[2]" />
          <span className="font-display font-extrabold text-xl tracking-tight text-white">RIDE FINANCE</span>
        </div>
        
        <div>
          <h2 className="text-3xl font-display font-bold text-white leading-tight">Elevating Rapido Riders Financial Discipline.</h2>
          <p className="text-zinc-500 text-sm mt-3 leading-relaxed">
            The premium full-stack ledger engineered specifically for delivery and bike commuters. Keep precise track of daily incomes, fuel costs, snacks, and monthly EMI milestones.
          </p>
        </div>

        <div className="space-y-4 pt-4 border-t border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cred-neon text-xs font-mono">1</div>
            <div>
              <p className="text-xs font-bold text-zinc-300">Fast Daily Logging</p>
              <p className="text-[11px] text-zinc-500">Record wages & petrol costs under 10 seconds.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cred-neon text-xs font-mono">2</div>
            <div>
              <p className="text-xs font-bold text-zinc-300">Commitments Monitor</p>
              <p className="text-[11px] text-zinc-500">Auto calculate daily share to support EMI obligations safely.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cred-neon text-xs font-mono">3</div>
            <div>
              <p className="text-xs font-bold text-zinc-300">Neon SQL Storage</p>
              <p className="text-[11px] text-zinc-500">All indicators synchronize safely to a dedicated PostgreSQL schema.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Core View Area with Phone Chassis Mockup */}
      <div className="w-full max-w-md md:border md:border-zinc-850 md:rounded-[40px] bg-zinc-950 min-h-screen md:min-h-[812px] md:shadow-[0_24px_50px_rgba(0,0,0,0.9)] flex flex-col justify-start relative overflow-hidden">
        {/* Notch / Speaker Simulator on Desktop */}
        <div className="hidden md:flex justify-center items-center w-full pt-3 pb-1 bg-zinc-950 border-b border-zinc-900/60 font-mono text-[10px] text-zinc-500 justify-between px-6">
          <span>9:41 AM</span>
          <div className="w-20 h-4 bg-zinc-900 rounded-full border border-zinc-850 flex items-center justify-center">
            <div className="w-10 h-1 bg-black rounded-full" />
          </div>
          <div className="flex items-center gap-1">
            <span>5G</span>
            <div className="w-5 h-2.5 bg-cred-neon rounded-xs" />
          </div>
        </div>

        {/* Database connectivity warnings if configured incorrectly */}
        {dbError && (
          <div className="bg-red-500/10 border-b border-red-500/20 text-red-500 text-xs px-5 py-3 flex items-start gap-2 select-text">
            <CircleAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Database Connection Warning</p>
              <p className="text-[10px] text-red-400 mt-0.5">{dbError}</p>
            </div>
          </div>
        )}

        {/* Dynamic active page viewport container */}
        <div className="flex-1 px-5 pt-4 overflow-y-auto select-none" style={{ WebkitOverflowScrolling: 'touch' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating Bottom Navigation */}
        <BottomNav currentTab={currentTab} onChangeTab={setCurrentTab} />
      </div>

      {/* Decorative desktop metadata */}
      <div className="hidden lg:flex fixed right-12 top-1/2 -translate-y-1/2 w-[325px] flex-col gap-6">
        <div className="bg-zinc-950 p-5 rounded-3xl border border-zinc-900">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-mono text-zinc-500 tracking-wider">DATABASE TELEMETRY</span>
            <button 
              onClick={syncServerDataset}
              className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-900 transition-colors"
              title="Refresh dataset from Neon SQL"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3 mt-4 text-xs">
            <div className="flex justify-between border-b border-zinc-900 pb-2">
              <span className="text-zinc-500">PostgreSQL Engine</span>
              <span className="text-cred-neon hover:underline cursor-pointer font-mono" onClick={() => window.open('https://neon.tech')}>Neon Serverless</span>
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-2">
              <span className="text-zinc-500">ORM Schema Tool</span>
              <span className="text-white font-mono">Drizzle ORM</span>
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-2">
              <span className="text-zinc-500">Commuters Loaded</span>
              <span className="text-white font-mono">arsadsagir@gmail.com</span>
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-2">
              <span className="text-zinc-500">Database Stat</span>
              <span className={`${dbError ? "text-red-500" : "text-cred-neon"} font-mono`}>{dbError ? "Offline fallback" : "Connected (OK)"}</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-950/60 p-5 rounded-3xl border border-zinc-900 text-center">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">PREMIUM COMMUTER SYSTEM</span>
          <p className="text-[11px] text-zinc-500 mt-2">
            No hardcoded financial assets or seed data loaded. Fully clean on-road ledger ready to track your kilometers.
          </p>
        </div>
      </div>
    </div>
  );
}
