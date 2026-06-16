import { DailyEntry, Expense, EMI, RiderProfile } from './types';

export const INITIAL_PROFILE: RiderProfile = {
  name: "Arsad Sagir",
  bikeModel: "Hero Splendor",
  dailyTarget: 1200,
  hourlyGoal: 150,
  monthlyTarget: 30000,
  themePreference: "dark",
  notificationPreference: true,
  futureBackupActive: false
};

export const INITIAL_EMIS: EMI[] = [];
export const INITIAL_ENTRIES: DailyEntry[] = [];
export const INITIAL_EXPENSES: Expense[] = [];
