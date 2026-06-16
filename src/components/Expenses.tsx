import React, { useState } from 'react';
import { Expense } from '../types';
import { 
  Receipt, 
  Plus, 
  Trash2, 
  Filter, 
  Fuel, 
  Wrench, 
  Milestone, 
  Coffee, 
  PhoneCall, 
  AlertOctagon, 
  LayoutGrid,
  TrendingDown,
  X,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExpensesProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  onUpdateExpense: (id: string, expense: Partial<Expense>) => void;
}

export default function Expenses({ expenses, onAddExpense, onDeleteExpense, onUpdateExpense }: ExpensesProps) {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  
  // Form input states
  const [category, setCategory] = useState<Expense['category']>('Fuel');
  const [amount, setAmount] = useState<number>(300);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');

  const categories: { name: Expense['category']; icon: any; color: string; bg: string }[] = [
    { name: 'Fuel', icon: Fuel, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
    { name: 'Maintenance', icon: Wrench, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
    { name: 'Toll / Permit', icon: Milestone, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
    { name: 'Food & Tea', icon: Coffee, color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
    { name: 'Mobile Recharge', icon: PhoneCall, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
    { name: 'Challan', icon: AlertOctagon, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
    { name: 'Other', icon: LayoutGrid, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' },
  ];

  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setCategory(exp.category);
    setAmount(exp.amount);
    setDate(exp.date);
    setDescription(exp.description || '');
    setShowAddForm(true);
  };

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setCategory('Fuel');
    setAmount(300);
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setShowAddForm(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    if (editingExpense) {
      onUpdateExpense(editingExpense.id, {
        category,
        amount,
        date,
        description: description.trim() || undefined
      });
      setEditingExpense(null);
    } else {
      onAddExpense({
        category,
        amount,
        date,
        description: description.trim() || undefined
      });
    }

    // Reset Form
    setDescription('');
    setAmount(200);
    setShowAddForm(false);
  };

  // Filter logic
  const filteredExpenses = filterCategory === 'All' 
    ? expenses 
    : expenses.filter(e => e.category === filterCategory);

  const sortedExpenses = [...filteredExpenses].sort((a, b) => b.date.localeCompare(a.date));

  // Category aggregates for graph rendering
  const totalExpenseSum = expenses.reduce((sum, item) => sum + item.amount, 0);

  const categoryTotals = categories.map(cat => {
    const total = expenses
      .filter(e => e.category === cat.name)
      .reduce((sum, item) => sum + item.amount, 0);
    const percent = totalExpenseSum > 0 ? Math.round((total / totalExpenseSum) * 100) : 0;
    return { ...cat, total, percent };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="w-full h-full pb-32">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pt-4">
        <div>
          <span className="text-zinc-500 text-xs tracking-wider uppercase font-mono">FINANCES LEDGER</span>
          <h1 className="text-2xl font-bold font-display text-white mt-0.5">Other Expenses</h1>
          <p className="text-zinc-400 text-xs mt-1">Record off-road expenditures like servicing, mobile, and fines.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          id="open-add-expense-modal-btn"
          className="w-12 h-12 bg-cred-neon text-black rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Expense Aggregate Visual Breakdown */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-6 relative overflow-hidden">
        <span className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase">AGGREGATED OFF-ROAD SPENDS</span>
        <h2 className="text-3xl font-extrabold font-display text-white mt-1">₹{totalExpenseSum.toLocaleString('en-IN')}</h2>
        
        {/* Simple lightweight visually robust CSS stacked horizontal donut bar indicator */}
        <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden flex mt-4 mb-4">
          {categoryTotals.filter(c => c.total > 0).map((cat, idx) => (
            <div 
              key={cat.name}
              className="h-full border-r border-zinc-900"
              style={{ 
                width: `${cat.percent}%`,
                backgroundColor: cat.color 
              }}
              title={`${cat.name}: ₹${cat.total} (${cat.percent}%)`}
            />
          ))}
          {totalExpenseSum === 0 && (
            <div className="w-full h-full bg-zinc-800 rounded-full" />
          )}
        </div>

        {/* Categories indicator list legend */}
        <div className="grid grid-cols-2 gap-3">
          {categoryTotals.slice(0, 4).map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.name} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-zinc-400 font-medium">{cat.name}:</span>
                <span className="text-white font-semibold font-mono">₹{cat.total}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters pill selector scrollable */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4">
        <button
          onClick={() => setFilterCategory('All')}
          id="filter-cat-all"
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 border ${
            filterCategory === 'All'
              ? 'bg-white text-black border-white'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          All Spends
        </button>
        {categories.map((cat) => (
          <button
            key={cat.name}
            id={`filter-cat-${cat.name}`}
            onClick={() => setFilterCategory(cat.name)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-150 border ${
              filterCategory === cat.name
                ? 'bg-white text-black border-white'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <cat.icon className="w-3.5 h-3.5" style={{ color: filterCategory === cat.name ? 'black' : cat.color }} />
            {cat.name}
          </button>
        ))}
      </div>

      {/* Expenses list */}
      <div className="space-y-3">
        {sortedExpenses.length === 0 ? (
          <div className="cred-glass p-12 rounded-3xl border border-dashed border-zinc-800 text-center">
            <Receipt className="w-10 h-10 text-zinc-650 mx-auto mb-3" />
            <p className="text-zinc-400 font-medium">No expenses added yet</p>
            <p className="text-zinc-500 text-xs mt-1">Select '+' above to record a bike maintenance, challan or fuel expense.</p>
          </div>
        ) : (
          sortedExpenses.map((exp) => {
            const spec = categories.find(c => c.name === exp.category) || categories[categories.length - 1];
            const Icon = spec.icon;

            return (
              <div
                key={exp.id}
                id={`expense-${exp.id}`}
                className="bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/85 rounded-2xl p-4 flex items-center justify-between transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: spec.bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color: spec.color }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-display">
                      {exp.description || exp.category}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                      {exp.category} • {new Date(exp.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-base font-bold font-display text-white mr-2">
                    ₹{exp.amount.toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => handleOpenEdit(exp)}
                    id={`edit-expense-${exp.id}`}
                    aria-label="Edit log"
                    className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-900/60 flex items-center justify-center text-zinc-500 hover:text-cred-neon hover:border-emerald-950 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteExpense(exp.id)}
                    id={`delete-expense-${exp.id}`}
                    aria-label="Delete log"
                    className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-900/60 flex items-center justify-center text-zinc-500 hover:text-red-400 hover:border-red-950 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Sheet - Add Custom Expense form */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-end justify-center px-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="bg-zinc-950 w-full max-w-md rounded-t-[32px] border-t border-x border-zinc-800 p-6 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-zinc-500 font-mono text-xs uppercase tracking-wider">OFF-ROAD LEDGER LOG</span>
                  <h3 className="text-xl font-bold font-display text-white mt-0.5">
                    {editingExpense ? 'Modify Expense Detail' : 'Record Custom Expense'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  id="close-add-expense-modal-btn"
                  className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-bold hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                {/* Category block */}
                <div>
                  <label className="block text-xs font-mono text-zinc-500 uppercase mb-2">CATEGORY TYPE</label>
                  <div className="grid grid-cols-4 gap-2">
                    {categories.map((cat) => (
                      <button
                        type="button"
                        key={cat.name}
                        id={`form-cat-${cat.name}`}
                        onClick={() => setCategory(cat.name)}
                        className={`py-2 px-1 rounded-xl border text-[11px] font-semibold text-center flex flex-col items-center justify-center gap-1 transition ${
                          category === cat.name
                            ? 'bg-white text-black border-white'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-850 hover:border-zinc-700'
                        }`}
                      >
                        <cat.icon className="w-4 h-4" style={{ color: category === cat.name ? 'black' : cat.color }} />
                        <span className="truncate w-full">{cat.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-mono text-zinc-500 uppercase mb-2">AMOUNT IN RUPEES (₹)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-zinc-500 text-xl font-semibold">₹</span>
                    <input
                      type="number"
                      required
                      min={1}
                      id="expense-amount-input"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white font-display font-bold text-xl rounded-2xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-cred-neon"
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-mono text-zinc-500 uppercase mb-2">DATE OF REPAIR / SERVICE</label>
                  <input
                    type="date"
                    required
                    id="expense-date-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-neon"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-mono text-zinc-500 uppercase mb-2">NOTES / BILL SPECS</label>
                  <input
                    type="text"
                    id="expense-desc-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Engine chain spray lubricant, back tyre vulcanize..."
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-neon"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  id="save-expense-btn"
                  className="w-full bg-white text-black font-display font-bold py-3.5 rounded-full hover:bg-zinc-200 transition-colors mt-4"
                >
                  {editingExpense ? 'Save Modified Expense' : 'Record to Ledger'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
