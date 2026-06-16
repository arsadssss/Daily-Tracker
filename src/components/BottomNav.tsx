import React from 'react';
import { LayoutDashboard, Plus, Receipt, CreditCard, Settings2, Calendar, BarChart2 } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
}

export default function BottomNav({ currentTab, onChangeTab }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'daily-entry', label: 'Log', icon: Plus, isFab: true },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'emi', label: 'EMIs', icon: CreditCard },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md">
      <div className="cred-glass rounded-full px-4 py-2 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex justify-between items-center gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          if (tab.isFab) {
            return (
              <button
                key={tab.id}
                id={`nav-${tab.id}`}
                onClick={() => onChangeTab(tab.id)}
                className="relative -top-5 flex flex-col items-center justify-center"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 ${
                  isActive 
                    ? 'bg-cred-neon text-black scale-105 shadow-[0_0_20px_rgba(249,115,22,0.6)]' 
                    : 'bg-white text-black hover:scale-105'
                }`}>
                  <Plus className="w-7 h-7 stroke-[2.5]" />
                </div>
                <span className={`text-[10px] font-medium mt-1 transition-colors duration-200 ${isActive ? 'text-cred-neon font-semibold' : 'text-zinc-500'}`}>
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              id={`nav-${tab.id}`}
              onClick={() => onChangeTab(tab.id)}
              className="relative flex flex-col items-center justify-center w-14 py-1.5 rounded-2xl transition-all duration-200 active:scale-95"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-white/5 rounded-2xl -z-10 border border-white/5"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              
              <Icon className={`w-5 h-5 mb-1 transition-all duration-200 ${isActive ? 'text-cred-neon scale-110' : 'text-zinc-400'}`} />
              <span className={`text-[10px] font-medium tracking-tight transition-colors duration-200 ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
