import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./src/db/schema.js";
import { eq, and } from "drizzle-orm";

export const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Drizzle ORM client safely
const getDb = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("⚠️ DATABASE_URL is not configured.");
  }
  const client = neon(databaseUrl);
  return drizzle(client, { schema });
};

// Target user email context from metadata
const USER_EMAIL = "arsadsagir@gmail.com";
const DEFAULT_NAME = "Arsad Sagir";

// Helper to guarantee user context exists and query details
async function getOrCreateUser(db: any) {
  const userRows = await db.select().from(schema.users).where(eq(schema.users.email, USER_EMAIL));
  if (userRows.length > 0) {
    return userRows[0];
  }
  // Create default clean profile
  const [newUser] = await db.insert(schema.users).values({
    email: USER_EMAIL,
    name: DEFAULT_NAME,
    bikeModel: "Hero Splendor",
    dailyTarget: 1200,
    hourlyGoal: 150,
  }).returning();
  return newUser;
}

// ----------------------------------------------------
// 1. SERVICES & BACKWARD-COMPATIBILITY DATA PIPELINE
// ----------------------------------------------------

// API: Get all user stats, ledger lists, profiles
app.get("/api/data", async (req, res) => {
  try {
    const db = getDb();
    const user = await getOrCreateUser(db);

    const userEntries = await db.select().from(schema.dailyEntries).where(eq(schema.dailyEntries.userId, user.id));
    const userExpenses = await db.select().from(schema.expenses).where(eq(schema.expenses.userId, user.id));
    const userCommitments = await db.select().from(schema.financialCommitments).where(eq(schema.financialCommitments.userId, user.id));
    const userCalendar = await db.select().from(schema.workCalendar).where(eq(schema.workCalendar.userId, user.id));
    const userTargets = await db.select().from(schema.monthlyTargets).where(eq(schema.monthlyTargets.userId, user.id));

    // Map serial database integers to string ids so the React frontend is happy
    const entries = userEntries.map((e: any) => ({
      ...e,
      id: String(e.id),
      earnings: Number(e.earnings),
      tripsCount: Number(e.rides), // Map 'rides' DB field to 'tripsCount' UI state
      onlineHours: Number(e.onlineHours),
      fuelExpense: Number(e.fuelExpense),
      foodTeaExpense: Number(e.foodTeaExpense),
      otherExpense: Number(e.otherExpense),
      cashPayment: Number(e.cashPayment),
      onlinePayment: Number(e.onlinePayment),
    }));

    const expenses = userExpenses.map((e: any) => ({
      ...e,
      id: String(e.id),
      amount: Number(e.amount),
    }));

    // Map financialCommitments DB fields to emi tracker structures so no frontend breaks
    const emis = userCommitments.map((e: any) => ({
      ...e,
      id: String(e.id),
      totalAmount: Number(e.totalAmount),
      emiAmount: Number(e.emiAmount),
      interestRate: Number(e.interestRate),
      totalMonths: Number(e.totalMonths),
      paidMonths: Number(e.paidMonths),
      dueDate: Number(e.dueDate),
      active: Boolean(e.active)
    }));

    const workCalendar = userCalendar.map((c: any) => ({
      ...c,
      id: String(c.id),
    }));

    const monthlyTargets = userTargets.map((t: any) => ({
      ...t,
      id: String(t.id),
      targetAmount: Number(t.targetAmount),
      month: Number(t.month),
      year: Number(t.year),
    }));

    res.json({
      profile: {
        name: user.name,
        bikeModel: user.bikeModel,
        dailyTarget: Number(user.dailyTarget),
        hourlyGoal: Number(user.hourlyGoal),
        monthlyTarget: Number(user.monthlyTarget || 30000),
        themePreference: user.themePreference || 'dark',
        notificationPreference: user.notificationPreference !== undefined ? user.notificationPreference : true,
        futureBackupActive: user.futureBackupActive !== undefined ? user.futureBackupActive : false,
      },
      entries,
      expenses,
      emis,
      workCalendar,
      monthlyTargets
    });
  } catch (error: any) {
    console.error("Fetch stats error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch user dataset" });
  }
});


// ----------------------------------------------------
// 2. USERS TABLE ACTIONS (Add, Edit, Delete, List)
// ----------------------------------------------------

// List/Get Users
app.get("/api/users", async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.select().from(schema.users);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add User
app.post("/api/users", async (req, res) => {
  try {
    const db = getDb();
    const { name, email, bikeModel, dailyTarget, hourlyGoal } = req.body;
    const [newUser] = await db.insert(schema.users).values({
      name,
      email,
      bikeModel: bikeModel || "Hero Splendor",
      dailyTarget: Number(dailyTarget || 1200),
      hourlyGoal: Number(hourlyGoal || 150)
    }).returning();
    res.json(newUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Edit User Profile (Both for general endpoint and setup profile compatibility)
app.post("/api/profile", async (req, res) => {
  try {
    const { name, bikeModel, dailyTarget, hourlyGoal, monthlyTarget, themePreference, notificationPreference, futureBackupActive } = req.body;
    const db = getDb();
    const user = await getOrCreateUser(db);

    const [updatedUser] = await db.update(schema.users)
      .set({
        name: name || user.name,
        bikeModel: bikeModel || user.bikeModel,
        dailyTarget: dailyTarget !== undefined ? Number(dailyTarget) : user.dailyTarget,
        hourlyGoal: hourlyGoal !== undefined ? Number(hourlyGoal) : user.hourlyGoal,
        monthlyTarget: monthlyTarget !== undefined ? Number(monthlyTarget) : user.monthlyTarget,
        themePreference: themePreference !== undefined ? themePreference : user.themePreference,
        notificationPreference: notificationPreference !== undefined ? Boolean(notificationPreference) : user.notificationPreference,
        futureBackupActive: futureBackupActive !== undefined ? Boolean(futureBackupActive) : user.futureBackupActive,
      })
      .where(eq(schema.users.id, user.id))
      .returning();

    res.json({
      name: updatedUser.name,
      bikeModel: updatedUser.bikeModel,
      dailyTarget: Number(updatedUser.dailyTarget),
      hourlyGoal: Number(updatedUser.hourlyGoal),
      monthlyTarget: Number(updatedUser.monthlyTarget),
      themePreference: updatedUser.themePreference,
      notificationPreference: updatedUser.notificationPreference,
      futureBackupActive: updatedUser.futureBackupActive,
    });
  } catch (error: any) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { name, email, bikeModel, dailyTarget, hourlyGoal } = req.body;
    const [updatedUser] = await db.update(schema.users)
      .set({ name, email, bikeModel, dailyTarget: Number(dailyTarget), hourlyGoal: Number(hourlyGoal) })
      .where(eq(schema.users.id, id))
      .returning();
    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete User
app.delete("/api/users/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    await db.delete(schema.users).where(eq(schema.users.id, id));
    res.json({ success: true, message: "User profile deleted representation" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ----------------------------------------------------
// 3. DAILY ENTRIES TABLE ACTIONS (Add, Edit, Delete, List)
// ----------------------------------------------------

// List entries
app.get("/api/daily_entries", async (req, res) => {
  try {
    const db = getDb();
    const user = await getOrCreateUser(db);
    const rows = await db.select().from(schema.dailyEntries).where(eq(schema.dailyEntries.userId, user.id));
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add entry
app.post("/api/entries", async (req, res) => {
  try {
    const db = getDb();
    const user = await getOrCreateUser(db);
    const {
      date,
      earnings,
      tripsCount, // Named tripsCount client side -> maps to rides DB field
      onlineHours,
      fuelExpense,
      foodTeaExpense,
      otherExpense,
      onlinePayment,
      cashPayment,
      notes,
      startTime,
      endTime
    } = req.body;

    const [newEntryRow] = await db.insert(schema.dailyEntries).values({
      userId: user.id,
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      onlineHours: Number(onlineHours || 0),
      rides: Number(tripsCount || req.body.rides || 0), // handle both field forms
      earnings: Number(earnings || 0),
      fuelExpense: Number(fuelExpense || 0),
      foodTeaExpense: Number(foodTeaExpense || 0),
      otherExpense: Number(otherExpense || 0),
      onlinePayment: Number(onlinePayment || 0),
      cashPayment: Number(cashPayment || 0),
      notes: notes || null
    }).returning();

    res.json({
      ...newEntryRow,
      id: String(newEntryRow.id),
      earnings: Number(newEntryRow.earnings),
      tripsCount: Number(newEntryRow.rides), // Map 'rides' back to 'tripsCount'
      onlineHours: Number(newEntryRow.onlineHours),
      fuelExpense: Number(newEntryRow.fuelExpense),
      foodTeaExpense: Number(newEntryRow.foodTeaExpense),
      otherExpense: Number(newEntryRow.otherExpense),
      cashPayment: Number(newEntryRow.cashPayment),
      onlinePayment: Number(newEntryRow.onlinePayment),
    });
  } catch (error: any) {
    console.error("Create entry error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Edit entry
app.put("/api/daily_entries/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { date, startTime, endTime, onlineHours, rides, earnings, fuelExpense, foodTeaExpense, otherExpense, notes } = req.body;
    const [updated] = await db.update(schema.dailyEntries)
      .set({
        date,
        startTime,
        endTime,
        onlineHours: onlineHours !== undefined ? Number(onlineHours) : undefined,
        rides: rides !== undefined ? Number(rides) : undefined,
        earnings: earnings !== undefined ? Number(earnings) : undefined,
        fuelExpense: fuelExpense !== undefined ? Number(fuelExpense) : undefined,
        foodTeaExpense: foodTeaExpense !== undefined ? Number(foodTeaExpense) : undefined,
        otherExpense: otherExpense !== undefined ? Number(otherExpense) : undefined,
        notes
      })
      .where(eq(schema.dailyEntries.id, id))
      .returning();
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete entry
app.delete("/api/daily_entries/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    await db.delete(schema.dailyEntries).where(eq(schema.dailyEntries.id, id));
    res.json({ success: true, message: "Daily entry successfully erased" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ----------------------------------------------------
// 4. EXPENSES TABLE ACTIONS (Add, Edit, Delete, List)
// ----------------------------------------------------

// List expenses
app.get("/api/expenses", async (req, res) => {
  try {
    const db = getDb();
    const user = await getOrCreateUser(db);
    const rows = await db.select().from(schema.expenses).where(eq(schema.expenses.userId, user.id));
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add expense
app.post("/api/expenses", async (req, res) => {
  try {
    const db = getDb();
    const user = await getOrCreateUser(db);
    const { category, amount, date, description } = req.body;

    const [newExpenseRow] = await db.insert(schema.expenses).values({
      userId: user.id,
      category,
      amount: Number(amount),
      date,
      description: description || null
    }).returning();

    res.json({
      ...newExpenseRow,
      id: String(newExpenseRow.id),
      amount: Number(newExpenseRow.amount),
    });
  } catch (error: any) {
    console.error("Create expense error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Edit expense
app.put("/api/expenses/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { category, amount, date, description } = req.body;
    const [updated] = await db.update(schema.expenses)
      .set({
        category,
        amount: amount !== undefined ? Number(amount) : undefined,
        date,
        description
      })
      .where(eq(schema.expenses.id, id))
      .returning();
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete expense
app.delete("/api/expenses/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    await db.delete(schema.expenses).where(eq(schema.expenses.id, id));
    res.json({ success: true, message: "Expense deleted" });
  } catch (error: any) {
    console.error("Delete expense error:", error);
    res.status(500).json({ error: error.message });
  }
});


// ----------------------------------------------------
// 5. FINANCIAL COMMITMENTS ACTIONS (Add, Edit, Delete, List)
// ----------------------------------------------------

// List commitments
app.get("/api/financial_commitments", async (req, res) => {
  try {
    const db = getDb();
    const user = await getOrCreateUser(db);
    const rows = await db.select().from(schema.financialCommitments).where(eq(schema.financialCommitments.userId, user.id));
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add commitment (Under old '/api/emi' path or new '/api/financial_commitments')
app.post("/api/emi", async (req, res) => {
  try {
    const db = getDb();
    const user = await getOrCreateUser(db);
    const { name, totalAmount, emiAmount, interestRate, totalMonths, paidMonths, dueDate, category } = req.body;

    const [newEmiRow] = await db.insert(schema.financialCommitments).values({
      userId: user.id,
      name,
      totalAmount: Number(totalAmount),
      emiAmount: Number(emiAmount),
      interestRate: Number(interestRate || 0),
      totalMonths: Number(totalMonths || 12),
      paidMonths: Number(paidMonths || 0),
      dueDate: Number(dueDate || 5),
      active: true,
      category: category || "EMI Loan"
    }).returning();

    res.json({
      ...newEmiRow,
      id: String(newEmiRow.id),
      totalAmount: Number(newEmiRow.totalAmount),
      emiAmount: Number(newEmiRow.emiAmount),
      interestRate: Number(newEmiRow.interestRate),
      totalMonths: Number(newEmiRow.totalMonths),
      paidMonths: Number(newEmiRow.paidMonths),
      dueDate: Number(newEmiRow.dueDate),
      active: Boolean(newEmiRow.active),
      category: newEmiRow.category
    });
  } catch (error: any) {
    console.error("Create EMI error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Edit commitment
app.put("/api/financial_commitments/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { name, totalAmount, emiAmount, interestRate, totalMonths, paidMonths, dueDate, active, category } = req.body;
    const [updated] = await db.update(schema.financialCommitments)
      .set({
        name,
        totalAmount: totalAmount !== undefined ? Number(totalAmount) : undefined,
        emiAmount: emiAmount !== undefined ? Number(emiAmount) : undefined,
        interestRate: interestRate !== undefined ? Number(interestRate) : undefined,
        totalMonths: totalMonths !== undefined ? Number(totalMonths) : undefined,
        paidMonths: paidMonths !== undefined ? Number(paidMonths) : undefined,
        dueDate: dueDate !== undefined ? Number(dueDate) : undefined,
        active,
        category: category !== undefined ? category : undefined
      })
      .where(eq(schema.financialCommitments.id, id))
      .returning();
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete commitment (Backward compatibility route or new)
app.delete("/api/emi/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    await db.delete(schema.financialCommitments).where(eq(schema.financialCommitments.id, id));
    res.json({ success: true, message: "EMI / Financial commitment deleted" });
  } catch (error: any) {
    console.error("Delete commitment error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Multi actions togglers for EMI lists
app.post("/api/emi/:id/toggle", async (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const [emiRow] = await db.select().from(schema.financialCommitments).where(eq(schema.financialCommitments.id, id));
    if (!emiRow) return res.status(404).json({ error: "Item not found" });

    const [updatedEmi] = await db.update(schema.financialCommitments)
      .set({ active: !emiRow.active })
      .where(eq(schema.financialCommitments.id, id))
      .returning();

    res.json({
      ...updatedEmi,
      id: String(updatedEmi.id),
      totalAmount: Number(updatedEmi.totalAmount),
      emiAmount: Number(updatedEmi.emiAmount),
      interestRate: Number(updatedEmi.interestRate),
      totalMonths: Number(updatedEmi.totalMonths),
      paidMonths: Number(updatedEmi.paidMonths),
      dueDate: Number(updatedEmi.dueDate),
      active: Boolean(updatedEmi.active)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/emi/:id/pay", async (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const [emiRow] = await db.select().from(schema.financialCommitments).where(eq(schema.financialCommitments.id, id));
    if (!emiRow) return res.status(404).json({ error: "Item not found" });

    const nextPaidMonths = Math.min(Number(emiRow.paidMonths || 0) + 1, Number(emiRow.totalMonths));
    const [updatedEmi] = await db.update(schema.financialCommitments)
      .set({ paidMonths: nextPaidMonths })
      .where(eq(schema.financialCommitments.id, id))
      .returning();

    res.json({
      ...updatedEmi,
      id: String(updatedEmi.id),
      totalAmount: Number(updatedEmi.totalAmount),
      emiAmount: Number(updatedEmi.emiAmount),
      interestRate: Number(updatedEmi.interestRate),
      totalMonths: Number(updatedEmi.totalMonths),
      paidMonths: Number(updatedEmi.paidMonths),
      dueDate: Number(updatedEmi.dueDate),
      active: Boolean(updatedEmi.active)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ----------------------------------------------------
// 6. WORK CALENDAR ACTIONS (Add, Edit, Delete, List)
// ----------------------------------------------------

// List calendar
app.get("/api/work_calendar", async (req, res) => {
  try {
    const db = getDb();
    const user = await getOrCreateUser(db);
    const rows = await db.select().from(schema.workCalendar).where(eq(schema.workCalendar.userId, user.id));
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add calendar status
app.post("/api/work_calendar", async (req, res) => {
  try {
    const db = getDb();
    const user = await getOrCreateUser(db);
    const { date, status, notes } = req.body;
    const [newRow] = await db.insert(schema.workCalendar).values({
      userId: user.id,
      date,
      status, // "Worked", "Rest Day", etc.
      notes: notes || null
    }).returning();
    res.json(newRow);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Edit calendar status
app.put("/api/work_calendar/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { date, status, notes } = req.body;
    const [updated] = await db.update(schema.workCalendar)
      .set({ date, status, notes })
      .where(eq(schema.workCalendar.id, id))
      .returning();
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete calendar status
app.delete("/api/work_calendar/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    await db.delete(schema.workCalendar).where(eq(schema.workCalendar.id, id));
    res.json({ success: true, message: "Calendar slot removed" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ----------------------------------------------------
// 7. MONTHLY TARGETS ACTIONS (Add, Edit, Delete, List)
// ----------------------------------------------------

// List targets
app.get("/api/monthly_targets", async (req, res) => {
  try {
    const db = getDb();
    const user = await getOrCreateUser(db);
    const rows = await db.select().from(schema.monthlyTargets).where(eq(schema.monthlyTargets.userId, user.id));
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add target
app.post("/api/monthly_targets", async (req, res) => {
  try {
    const db = getDb();
    const user = await getOrCreateUser(db);
    const { month, year, targetAmount } = req.body;
    const [newTarget] = await db.insert(schema.monthlyTargets).values({
      userId: user.id,
      month: Number(month),
      year: Number(year),
      targetAmount: Number(targetAmount)
    }).returning();
    res.json(newTarget);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Edit target
app.put("/api/monthly_targets/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { month, year, targetAmount } = req.body;
    const [updated] = await db.update(schema.monthlyTargets)
      .set({
        month: month !== undefined ? Number(month) : undefined,
        year: year !== undefined ? Number(year) : undefined,
        targetAmount: targetAmount !== undefined ? Number(targetAmount) : undefined
      })
      .where(eq(schema.monthlyTargets.id, id))
      .returning();
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete target
app.delete("/api/monthly_targets/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    await db.delete(schema.monthlyTargets).where(eq(schema.monthlyTargets.id, id));
    res.json({ success: true, message: "Target deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ----------------------------------------------------
// 7.5 CALENDAR INTEGRATED STATE SYNCHRONIZER
// ----------------------------------------------------

// API: Bulk-sync / save states for calendar & daily entries simultaneously on tapped dates
app.post("/api/calendar/save", async (req, res) => {
  try {
    const db = getDb();
    const user = await getOrCreateUser(db);
    const { date, didWork, onlineHours, tripsCount, earnings, notes, status } = req.body;

    // 1. Process Daily Entry
    if (didWork) {
      const existingEntries = await db.select().from(schema.dailyEntries).where(
        and(eq(schema.dailyEntries.userId, user.id), eq(schema.dailyEntries.date, date))
      );

      if (existingEntries.length > 0) {
        await db.update(schema.dailyEntries)
          .set({
            onlineHours: Number(onlineHours || 0),
            rides: Number(tripsCount || 0),
            earnings: Number(earnings || 0),
            notes: notes || null
          })
          .where(and(eq(schema.dailyEntries.userId, user.id), eq(schema.dailyEntries.date, date)));
      } else {
        await db.insert(schema.dailyEntries).values({
          userId: user.id,
          date,
          onlineHours: Number(onlineHours || 0),
          rides: Number(tripsCount || 0),
          earnings: Number(earnings || 0),
          notes: notes || null
        });
      }
    } else {
      // Clear out daily log on absent day
      await db.delete(schema.dailyEntries).where(
        and(eq(schema.dailyEntries.userId, user.id), eq(schema.dailyEntries.date, date))
      );
    }

    // 2. Process Calendar Custom Entry
    const resolvedStatus = didWork ? (status || "Worked") : (status || "Didn't Work");
    const existingCal = await db.select().from(schema.workCalendar).where(
      and(eq(schema.workCalendar.userId, user.id), eq(schema.workCalendar.date, date))
    );

    if (existingCal.length > 0) {
      await db.update(schema.workCalendar)
        .set({
          status: resolvedStatus,
          notes: notes || null
        })
        .where(and(eq(schema.workCalendar.userId, user.id), eq(schema.workCalendar.date, date)));
    } else {
      await db.insert(schema.workCalendar).values({
        userId: user.id,
        date,
        status: resolvedStatus,
        notes: notes || null
      });
    }

    res.json({ success: true, message: "Calendar state applied safely" });
  } catch (error: any) {
    console.error("Save calendar state error:", error);
    res.status(500).json({ error: error.message });
  }
});


// ----------------------------------------------------
// 8. SYSTEM RESET DATA & BOOTING STATEMENTS
// ----------------------------------------------------

// API: Factory reset - cleans out transaction logs
app.post("/api/reset", async (req, res) => {
  try {
    const db = getDb();
    const user = await getOrCreateUser(db);

    await db.delete(schema.dailyEntries).where(eq(schema.dailyEntries.userId, user.id));
    await db.delete(schema.expenses).where(eq(schema.expenses.userId, user.id));
    await db.delete(schema.financialCommitments).where(eq(schema.financialCommitments.userId, user.id));
    await db.delete(schema.workCalendar).where(eq(schema.workCalendar.userId, user.id));
    await db.delete(schema.monthlyTargets).where(eq(schema.monthlyTargets.userId, user.id));

    // Reset profile defaults
    const [resetUser] = await db.update(schema.users)
      .set({
        name: DEFAULT_NAME,
        bikeModel: "Hero Splendor",
        dailyTarget: 1200,
        hourlyGoal: 150,
        monthlyTarget: 30000,
        themePreference: "dark",
        notificationPreference: true,
        futureBackupActive: false,
      })
      .where(eq(schema.users.id, user.id))
      .returning();

    res.json({
      profile: {
        name: resetUser.name,
        bikeModel: resetUser.bikeModel,
        dailyTarget: Number(resetUser.dailyTarget),
        hourlyGoal: Number(resetUser.hourlyGoal),
        monthlyTarget: Number(resetUser.monthlyTarget),
        themePreference: resetUser.themePreference,
        notificationPreference: resetUser.notificationPreference,
        futureBackupActive: resetUser.futureBackupActive,
      },
      entries: [],
      expenses: [],
      emis: []
    });
  } catch (error: any) {
    console.error("Reset data error:", error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  // Vite middleware configuration for development vs production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Production server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error("Critical server startup crash:", err);
  });
}

export default app;
