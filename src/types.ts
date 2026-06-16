export interface DailyEntry {
  id: string;
  date: string; // YYYY-MM-DD
  earnings: number;
  tripsCount: number;
  onlineHours: number;
  fuelExpense: number;
  foodTeaExpense: number;
  otherExpense: number;
  cashPayment: number;
  onlinePayment: number;
  notes?: string;
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
}

export interface Expense {
  id: string;
  category: 'Fuel' | 'Maintenance' | 'Toll / Permit' | 'Food & Tea' | 'Mobile Recharge' | 'Challan' | 'Other';
  amount: number;
  date: string; // YYYY-MM-DD
  description?: string;
}

export interface EMI {
  id: string;
  name: string; // e.g., "Honda Shine Bike Loan", "Redmi Note Pro Loan"
  totalAmount: number;
  emiAmount: number;
  interestRate: number; // yearly percentage e.g., 9.5
  totalMonths: number;
  paidMonths: number;
  dueDate: number; // Day of month (1-31)
  active: boolean;
  category: 'EMI Loan' | 'EMI Purchase' | 'Credit Card' | 'Borrowed Money' | 'Monthly Commitment';
}

export interface RiderProfile {
  name: string;
  bikeModel: string;
  dailyTarget: number;
  hourlyGoal: number; // Target per hour
  monthlyTarget: number;
  themePreference: 'dark' | 'light';
  notificationPreference: boolean;
  futureBackupActive: boolean;
}

export interface WorkCalendarEntry {
  id: string;
  date: string; // YYYY-MM-DD
  status: 'Worked' | "Didn't Work" | 'Partial Day' | 'Future Day';
  notes?: string;
}

export interface MonthlyTarget {
  id: string;
  month: number; // 1-12
  year: number;
  targetAmount: number;
}
