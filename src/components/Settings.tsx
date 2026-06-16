import React, { useState, useEffect } from 'react';
import { RiderProfile } from '../types';
import { 
  User, 
  Bike, 
  Target, 
  Clock, 
  Trash2, 
  Download, 
  Upload, 
  Smartphone, 
  RefreshCw, 
  Info,
  Check,
  Moon,
  Sun,
  Bell,
  CloudLightning,
  CloudRain,
  Database
} from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsProps {
  profile: RiderProfile;
  onUpdateProfile: (profile: RiderProfile) => void;
  onResetData: () => void;
  onImportData: (jsonStr: string) => boolean;
  onExportData: () => string;
}

export default function Settings({ 
  profile, 
  onUpdateProfile, 
  onResetData,
  onImportData, 
  onExportData 
}: SettingsProps) {
  const [name, setName] = useState<string>(profile.name);
  const [bikeModel, setBikeModel] = useState<string>(profile.bikeModel);
  const [dailyTarget, setDailyTarget] = useState<number>(profile.dailyTarget);
  const [hourlyGoal, setHourlyGoal] = useState<number>(profile.hourlyGoal);
  
  // New State variables requested
  const [monthlyTarget, setMonthlyTarget] = useState<number>(profile.monthlyTarget || 30000);
  const [themePreference, setThemePreference] = useState<'dark' | 'light'>(profile.themePreference || 'dark');
  const [notificationPreference, setNotificationPreference] = useState<boolean>(
    profile.notificationPreference !== undefined ? profile.notificationPreference : true
  );
  const [futureBackupActive, setFutureBackupActive] = useState<boolean>(
    profile.futureBackupActive !== undefined ? profile.futureBackupActive : false
  );

  const [importStr, setImportStr] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isResetDone, setIsResetDone] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load and apply theme on mounting or setting change
  useEffect(() => {
    if (themePreference === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [themePreference]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: name.trim(),
      bikeModel: bikeModel.trim(),
      dailyTarget,
      hourlyGoal,
      monthlyTarget,
      themePreference,
      notificationPreference,
      futureBackupActive
    });
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleResetClick = () => {
    if (window.confirm("Are you sure you want to clean all personal ledger transactions? This cannot be undone.")) {
      onResetData();
      setIsResetDone(true);
      setTimeout(() => setIsResetDone(false), 2000);
    }
  };

  const handleExportClick = () => {
    try {
      const dataStr = onExportData();
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ride_finance_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Error generating download backup file.");
    }
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importStr.trim()) return;

    const worked = onImportData(importStr);
    if (worked) {
      setImportStatus('success');
      setImportStr('');
      setTimeout(() => setImportStatus('idle'), 3000);
    } else {
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  return (
    <div className="w-full h-full pb-32">
      {/* Header */}
      <div className="mb-6 pt-4">
        <span className="text-zinc-500 text-xs tracking-wider uppercase font-mono">APP SETTINGS</span>
        <h1 className="text-2xl font-bold font-display text-white mt-0.5 font-sans">Settings & Control</h1>
        <p className="text-zinc-400 text-xs mt-1">Configure your bike metadata targets, theme styling, and backup ledgers.</p>
      </div>

      <form onSubmit={handleProfileSubmit} className="space-y-6">
        {/* Profile & Bike Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-cred-neon" />
            <h3 className="text-base font-bold font-display text-white">Rider Details</h3>
          </div>

          <div className="space-y-4">
            {/* Driver Name */}
            <div>
              <label className="block text-xs font-mono text-zinc-500 uppercase mb-1.5">DRIVER LEGAL NAME</label>
              <input
                type="text"
                required
                id="rider-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 text-white rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-neon text-sm"
                placeholder="e.g. Arjun Kumar"
              />
            </div>

            {/* Bike Model */}
            <div>
              <label className="block text-xs font-mono text-zinc-500 uppercase mb-1.5 flex items-center gap-1">
                <Bike className="w-3.5 h-3.5" /> MOTOR VEHICLE SPECIFICATION
              </label>
              <input
                type="text"
                required
                id="rider-bike-input"
                value={bikeModel}
                onChange={(e) => setBikeModel(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 text-white rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-neon text-sm"
                placeholder="e.g. Honda Splendor Pro"
              />
            </div>
          </div>
        </div>

        {/* Financial Targets Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-cred-gold" />
            <h3 className="text-base font-bold font-display text-white font-sans">Financial Milestones</h3>
          </div>

          <div className="space-y-4">
            {/* Monthly Target Amount */}
            <div>
              <label className="block text-xs font-mono text-zinc-500 uppercase mb-1.5 flex items-center gap-1">
                <Target className="w-3.5 h-3.5" /> MONTHLY GROSS TARGET (₹)
              </label>
              <input
                type="number"
                required
                min={1000}
                id="rider-monthly-target-input"
                value={monthlyTarget}
                onChange={(e) => setMonthlyTarget(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-850 text-white rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-neon text-sm font-mono font-semibold text-cred-gold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Daily Target */}
              <div>
                <label className="block text-xs font-mono text-zinc-500 uppercase mb-1.5 flex items-center gap-1">
                  DAILY GOAL (₹)
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  id="rider-target-input"
                  value={dailyTarget}
                  onChange={(e) => setDailyTarget(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-850 text-white rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-neon text-sm font-mono"
                />
              </div>

              {/* Hourly Target */}
              <div>
                <label className="block text-xs font-mono text-zinc-500 uppercase mb-1.5 flex items-center gap-1">
                  HOURLY GOAL (₹)
                </label>
                <input
                  type="number"
                  required
                  min={10}
                  id="rider-hourly-input"
                  value={hourlyGoal}
                  onChange={(e) => setHourlyGoal(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-850 text-white rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-neon text-sm font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Styling, Theme & Notifications Preferences */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cred-neon" />
            <h3 className="text-base font-bold font-display text-white">Theme & Notifications</h3>
          </div>

          {/* Theme Toggle Button selectors */}
          <div>
            <label className="block text-xs font-mono text-zinc-500 uppercase mb-2">INTERFACE THEMING PROFILE</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="theme-toggle-dark"
                onClick={() => setThemePreference('dark')}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-bold transition ${
                  themePreference === 'dark' 
                    ? 'bg-zinc-800 border-zinc-700 text-white shadow-md' 
                    : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-white'
                }`}
              >
                <Moon className="w-4 h-4 text-zinc-100" /> Pure Dark (Theme first)
              </button>
              <button
                type="button"
                id="theme-toggle-light"
                onClick={() => setThemePreference('light')}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-bold transition ${
                  themePreference === 'light' 
                    ? 'bg-white border-zinc-100 text-black shadow-md' 
                    : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" /> Soft Light (Day mode)
              </button>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-zinc-400" />
              <div>
                <span className="text-xs font-semibold text-white block">Interactive Sound Alerts</span>
                <span className="text-[10px] text-zinc-500 block">Synthesize on-road feedback sound updates</span>
              </div>
            </div>
            <button
              type="button"
              id="toggle-notifications-btn"
              onClick={() => setNotificationPreference(!notificationPreference)}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${
                notificationPreference ? 'bg-cred-neon' : 'bg-zinc-800'
              }`}
            >
              <div
                className={`bg-black w-4 h-4 rounded-full shadow-md transform duration-200 ${
                  notificationPreference ? 'translate-x-6 bg-black' : 'translate-x-0 bg-zinc-400'
                }`}
              />
            </button>
          </div>

          {/* Future Backup Settings */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-cred-gold" />
              <div>
                <span className="text-xs font-semibold text-white block">Auto Database Sync / Backup</span>
                <span className="text-[10px] text-zinc-500 block">Automatic future cloud secure logs saving</span>
              </div>
            </div>
            <button
              type="button"
              id="toggle-backups-btn"
              onClick={() => setFutureBackupActive(!futureBackupActive)}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${
                futureBackupActive ? 'bg-cred-gold' : 'bg-zinc-800'
              }`}
            >
              <div
                className={`bg-black w-4 h-4 rounded-full shadow-md transform duration-200 ${
                  futureBackupActive ? 'translate-x-6' : 'translate-x-0 bg-zinc-400'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Global configuration submission trigger */}
        <button
          type="submit"
          id="btn-settings-save"
          className="w-full bg-cred-neon text-black font-display font-bold py-3.5 rounded-full hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1.5 shadow-lg"
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4" /> System Saved!
            </>
          ) : (
            'Save Preferences & Target values'
          )}
        </button>
      </form>

      {/* Backups Export/Import */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mt-6 space-y-4">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-white" />
          <h3 className="text-sm font-bold font-display text-white">Manual Data Migration</h3>
        </div>

        <p className="text-xs text-zinc-400">
          Your data is safely integrated with Neon PostgreSQL database. You can also download local backups in JSON style as portable logs:
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleExportClick}
            id="export-backup-btn"
            className="flex-1 py-3 px-4 bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-zinc-300 font-semibold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Download className="w-4 h-4" /> Export Backup File
          </button>
        </div>

        {/* Import Backup form */}
        <form onSubmit={handleImportSubmit} className="pt-3 border-t border-zinc-800/60 space-y-2">
          <label className="block text-xs font-mono text-zinc-500 uppercase">IMPORT JSON BACKUP PAYLOAD</label>
          <input
            type="text"
            id="import-payload-input"
            value={importStr}
            onChange={(e) => setImportStr(e.target.value)}
            placeholder='Paste JSON backup code here...'
            className="w-full bg-zinc-950 border border-zinc-850 text-zinc-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cred-neon font-mono"
          />
          <button
            type="submit"
            id="import-backup-btn"
            className="w-full py-2.5 bg-white text-black font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            <Upload className="w-4 h-4" /> Load Backup Ledger
          </button>

          {importStatus === 'success' && (
            <p className="text-xs text-cred-neon text-center font-mono">Backup import successful! Refreshing ledger...</p>
          )}
          {importStatus === 'error' && (
            <p className="text-xs text-red-400 text-center font-mono">Failed process: invalid backup file format.</p>
          )}
        </form>
      </div>

      {/* System resets */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white font-display">System Factory Clean</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Destructive action: removes all personal reports.</p>
          </div>
          <button
            onClick={handleResetClick}
            id="factory-reset-btn"
            disabled={isResetDone}
            className="px-4 py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 hover:border-red-500/40 text-red-400 hover:text-red-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Reset Factory
          </button>
        </div>
        {isResetDone && (
          <p className="text-xs text-zinc-400 font-mono mt-1 text-center">Memory cleaned successfully.</p>
        )}
      </div>

      <div className="text-center text-[10px] text-zinc-650 font-mono space-y-1 mt-6">
        <p>RideOS • Developed for Rapido Commuters</p>
        <p className="flex items-center justify-center gap-1">
          <Info className="w-3.5 h-3.5" /> High Secure Cloud Safe Instance • Port 3000
        </p>
      </div>
    </div>
  );
}
