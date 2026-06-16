import { relations } from "drizzle-orm";
import { pgTable, serial, text, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";

// 1. Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  bikeModel: text("bike_model").notNull().default("Hero Splendor"),
  dailyTarget: integer("daily_target").notNull().default(1200),
  hourlyGoal: integer("hourly_goal").notNull().default(150),
  monthlyTarget: integer("monthly_target").notNull().default(30000),
  themePreference: text("theme_preference").notNull().default("dark"),
  notificationPreference: boolean("notification_preference").notNull().default(true),
  futureBackupActive: boolean("future_backup_active").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Work Calendar Table
export const workCalendar = pgTable("work_calendar", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  status: text("status").notNull(), // e.g., "Worked", "Rest Day", "Leave", "Sick"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Daily Entries Table
export const dailyEntries = pgTable("daily_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  startTime: text("start_time"), // Format: HH:MM
  endTime: text("end_time"), // Format: HH:MM
  onlineHours: doublePrecision("online_hours").notNull().default(0),
  rides: integer("rides").notNull().default(0), // Maps to tripsCount
  earnings: integer("earnings").notNull().default(0),
  fuelExpense: integer("fuel_expense").notNull().default(0),
  foodTeaExpense: integer("food_tea_expense").notNull().default(0),
  otherExpense: integer("other_expense").notNull().default(0),
  cashPayment: integer("cash_payment").notNull().default(0),
  onlinePayment: integer("online_payment").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Expenses Table
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  category: text("category").notNull(), // e.g., "Fuel", "Maintenance", "Food & Tea", "Toll / Permit", "Mobile Recharge", "Challan", "Other"
  amount: integer("amount").notNull().default(0),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Financial Commitments Table
export const financialCommitments = pgTable("financial_commitments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(), // e.g., "TVS Apache Bike Loan"
  totalAmount: integer("total_amount").notNull().default(0),
  emiAmount: integer("emi_amount").notNull().default(0),
  interestRate: doublePrecision("interest_rate").notNull().default(0),
  totalMonths: integer("total_months").notNull().default(12),
  paidMonths: integer("paid_months").notNull().default(0),
  dueDate: integer("due_date").notNull().default(5), // Day of Month: 1-31
  active: boolean("active").notNull().default(true),
  category: text("category").notNull().default("EMI Loan"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Monthly Targets Table
export const monthlyTargets = pgTable("monthly_targets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(), // e.g., 2026
  targetAmount: integer("target_amount").notNull().default(30000),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  workCalendar: many(workCalendar),
  dailyEntries: many(dailyEntries),
  expenses: many(expenses),
  financialCommitments: many(financialCommitments),
  monthlyTargets: many(monthlyTargets),
}));

export const workCalendarRelations = relations(workCalendar, ({ one }) => ({
  user: one(users, {
    fields: [workCalendar.userId],
    references: [users.id],
  }),
}));

export const dailyEntriesRelations = relations(dailyEntries, ({ one }) => ({
  user: one(users, {
    fields: [dailyEntries.userId],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
}));

export const financialCommitmentsRelations = relations(financialCommitments, ({ one }) => ({
  user: one(users, {
    fields: [financialCommitments.userId],
    references: [users.id],
  }),
}));

export const monthlyTargetsRelations = relations(monthlyTargets, ({ one }) => ({
  user: one(users, {
    fields: [monthlyTargets.userId],
    references: [users.id],
  }),
}));
