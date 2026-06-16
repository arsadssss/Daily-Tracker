import React, { useState } from 'react';
import { EMI } from '../types';
import { 
  CreditCard, 
  Calendar, 
  Plus, 
  Percent, 
  Clock, 
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  TrendingDown,
  Trash2,
  CheckCircle,
  X,
  Search,
  Filter,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EMITrackerProps {
  emis: EMI[];
  onAddEMI: (emi: Omit<EMI, 'id' | 'active'>) => void;
  onDeleteEMI: (id: string) => void;
  onToggleEMI: (id: string) => void;
  onIncrementPaidMonths: (id: string) => void;
  onUpdateEMI: (id: string, emi: Partial<EMI>) => void;
}

const CATEGORIES = [
  'EMI Loan',
  'EMI Purchase',
  'Credit Card',
  'Borrowed Money',
  'Monthly Commitment'
] as const;

export default function EMITracker({ 
  emis, 
  onAddEMI, 
  onDeleteEMI, 
  onToggleEMI,
  onIncrementPaidMonths,
  onUpdateEMI
}: EMITrackerProps) {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingEMI, setEditingEMI] = useState<EMI | null>(null);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilterCategory, setActiveFilterCategory] = useState<string>('All');

  // Form Field States (Shared by Add and Edit models)
  const [name, setName] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<number>(50000);
  const [emiAmount, setEmiAmount] = useState<number>(2500);
  const [interestRate, setInterestRate] = useState<number>(11);
  const [totalMonths, setTotalMonths] = useState<number>(24);
  const [paidMonths, setPaidMonths] = useState<number>(0);
  const [dueDate, setDueDate] = useState<number>(5);
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('EMI Loan');

  // Trigger form setup on clicking Edit Icon
  const handleOpenEdit = (emi: EMI) => {
    setEditingEMI(emi);
    setName(emi.name);
    setTotalAmount(emi.totalAmount);
    setEmiAmount(emi.emiAmount);
    setInterestRate(emi.interestRate);
    setTotalMonths(emi.totalMonths);
    setPaidMonths(emi.paidMonths);
    setDueDate(emi.dueDate);
    setCategory((emi as any).category || 'EMI Loan');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEMI) return;
    if (!name.trim() || emiAmount <= 0 || totalMonths <= 0) return;

    onUpdateEMI(editingEMI.id, {
      name: name.trim(),
      totalAmount,
      emiAmount,
      interestRate,
      totalMonths,
      paidMonths: Math.min(paidMonths, totalMonths),
      dueDate,
      category
    });

    setEditingEMI(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || emiAmount <= 0 || totalMonths <= 0) return;

    onAddEMI({
      name: name.trim(),
      totalAmount,
      emiAmount,
      interestRate,
      totalMonths,
      paidMonths: Math.min(paidMonths, totalMonths),
      dueDate,
      category
    });

    // Reset Form
    setName('');
    setTotalAmount(50000);
    setEmiAmount(2500);
    setInterestRate(11);
    setTotalMonths(24);
    setPaidMonths(0);
    setDueDate(5);
    setCategory('EMI Loan');
    setShowAddForm(false);
  };

  // Math aggregates of commitments list
  const activeEMIs = emis.filter(e => e.active);
  const totalMonthlyPayout = activeEMIs.reduce((sum, e) => sum + e.emiAmount, 0);

  // Apply real-time Filter & Search Query criteria
  const filteredEMIs = emis.filter((emi) => {
    const matchesSearch = emi.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchedCategory = (emi as any).category || 'EMI Loan';
    const matchesFilter = activeFilterCategory === 'All' || matchedCategory === activeFilterCategory;
    return matchesSearch && matchesFilter;
  });

  // Sort by upcoming days
  const sortedEMIs = [...filteredEMIs].sort((a, b) => a.dueDate - b.dueDate);

  // Helper values for category color styling
  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'EMI Loan':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'EMI Purchase':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Credit Card':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Borrowed Money':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'Monthly Commitment':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700/50';
    }
  };

  return (
    <div className="w-full h-full pb-32">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pt-4">
        <div>
          <span className="text-zinc-500 text-xs tracking-wider uppercase font-mono">FINANCIAL OBLIGATIONS</span>
          <h1 className="text-2xl font-bold font-display text-white mt-0.5">Money Console</h1>
          <p className="text-zinc-400 text-xs mt-1">Manage bike loans, mobile installments, and monthly obligations.</p>
        </div>
        <button
          onClick={() => {
            // Reset to default empty form prior to showing
            setName('');
            setTotalAmount(50000);
            setEmiAmount(2500);
            setInterestRate(11);
            setTotalMonths(24);
            setPaidMonths(0);
            setDueDate(5);
            setCategory('EMI Loan');
            setShowAddForm(true);
          }}
          id="open-add-emi-modal-btn"
          className="w-12 h-12 bg-cred-neon text-black rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Aggregate card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-zinc-850 rounded-3xl p-6 mb-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cred-gold/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
        
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase">COMBINED MONTHLY OBLIGATION</span>
            <h2 className="text-3xl font-extrabold font-display text-cred-gold mt-1">₹{totalMonthlyPayout.toLocaleString('en-IN')}<span className="text-sm font-normal text-zinc-500">/month</span></h2>
          </div>
          <div className="px-3 py-1 bg-cred-gold/10 border border-cred-gold/20 rounded-full text-[10px] font-mono text-cred-gold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {activeEMIs.length} Active Records
          </div>
        </div>

        <p className="text-xs text-zinc-400">
          This requires earning about <span className="text-white font-semibold font-mono font-sans mt-1">₹{Math.round(totalMonthlyPayout / 26)}/day</span> (across 26 working days) just to fund your obligations.
        </p>
      </div>

      {/* Search and Filters Strip */}
      <div className="space-y-4 mb-6">
        {/* Search */}
        <div className="relative flex items-center">
          <input
            type="text"
            id="emi-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by obligation name..."
            className="w-full bg-zinc-900/40 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-500 pl-10 pr-4 py-3 rounded-2xl focus:outline-none focus:border-cred-neon transition"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 text-xs text-zinc-500 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Category horizontal chips list */}
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin mr-[-16px] pr-4">
          <button
            type="button"
            id="filter-chip-all"
            onClick={() => setActiveFilterCategory('All')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border shrink-0 transition ${
              activeFilterCategory === 'All'
                ? 'bg-cred-neon text-black border-cred-neon'
                : 'bg-zinc-900/50 text-zinc-400 border-zinc-800/80 hover:text-white'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat}
              id={`filter-chip-${cat.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => setActiveFilterCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border shrink-0 transition ${
                activeFilterCategory === cat
                  ? 'bg-cred-neon text-black border-cred-neon'
                  : 'bg-zinc-900/50 text-zinc-400 border-zinc-800/80 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Active EMIs overview */}
      <h3 className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mb-4">ACTIVE COMMITMENTS ({sortedEMIs.length})</h3>
      <div className="space-y-4">
        {sortedEMIs.length === 0 ? (
          <div className="cred-glass p-12 rounded-3xl border border-dashed border-zinc-850 text-center">
            <CreditCard className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-medium font-sans">No commitments found</p>
            <p className="text-zinc-500 text-xs mt-1">Refine your search parameters or register an obligation above.</p>
          </div>
        ) : (
          sortedEMIs.map((emi) => {
            const monthsLeft = emi.totalMonths - emi.paidMonths;
            const progressPercent = Math.min(Math.round((emi.paidMonths / emi.totalMonths) * 100), 100);
            const remainingPrincipal = Math.max(emi.totalAmount - (emi.emiAmount * emi.paidMonths), 0);
            const finalCategory = (emi as any).category || 'EMI Loan';

            return (
              <div
                key={emi.id}
                id={`emi-${emi.id}`}
                className={`bg-zinc-900/40 border transition-all duration-200 rounded-3xl p-5 ${
                  emi.active ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-900/50 opacity-60'
                }`}
              >
                {/* Header info */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-base font-bold font-display text-white">{emi.name}</h4>
                    <div className="flex flex-wrap gap-2 items-center mt-1.5">
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border font-mono tracking-wide ${getCategoryBadgeClass(finalCategory)}`}>
                        {finalCategory}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        ₹{emi.totalAmount.toLocaleString('en-IN')} Principal
                      </span>
                      {emi.interestRate > 0 && (
                        <span className="text-cred-gold text-[10px] flex items-center font-mono gap-0.5">
                          <Percent className="w-3 h-3" /> {emi.interestRate}% Int.
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-extrabold font-sans text-white">₹{emi.emiAmount.toLocaleString('en-IN')}</p>
                    <span className="text-[10px] text-zinc-500 uppercase font-mono">due on {emi.dueDate}th</span>
                  </div>
                </div>

                {/* Progress Visualizer */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Tenure Cleared</span>
                    <span className="text-zinc-350 font-semibold font-mono">{emi.paidMonths}/{emi.totalMonths} mos</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-cred-gold h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-500">
                    <span>{progressPercent}% completed</span>
                    <span>Remaining Principle: ~₹{remainingPrincipal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Quick actions for rider */}
                <div className="flex justify-between items-center pt-3 border-t border-zinc-800/60 text-xs">
                  <div className="flex gap-2">
                    {emi.active && monthsLeft > 0 && (
                      <button
                        onClick={() => onIncrementPaidMonths(emi.id)}
                        id={`pay-emi-${emi.id}`}
                        className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg font-medium transition flex items-center gap-1.5 border border-zinc-800"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-cred-neon" /> Mark Paid
                      </button>
                    )}
                    {monthsLeft <= 0 && (
                      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-cred-neon rounded-lg font-mono text-[10px]">
                        Fully Settled! 🏁
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Toggle Active Switcher */}
                    <button
                      onClick={() => onToggleEMI(emi.id)}
                      id={`toggle-status-emi-${emi.id}`}
                      className="text-zinc-500 hover:text-zinc-350 transition flex items-center mr-1"
                    >
                      {emi.active ? (
                        <span className="text-[9px] font-mono font-bold text-cred-neon flex items-center gap-1">
                          ACTIVE <ToggleRight className="w-6 h-6 text-cred-neon" />
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-bold text-zinc-500 flex items-center gap-1">
                          PAUSED <ToggleLeft className="w-6 h-6 text-zinc-500" />
                        </span>
                      )}
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => handleOpenEdit(emi)}
                      id={`edit-emi-${emi.id}`}
                      className="w-8 h-8 rounded-lg bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                      title="Edit ledger details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => onDeleteEMI(emi.id)}
                      id={`delete-emi-${emi.id}`}
                      className="w-8 h-8 rounded-lg bg-zinc-950/60 hover:bg-red-950/20 border border-zinc-800 hover:border-red-900/40 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-colors"
                      title="Delete obligation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Popovers: Record commitment registry OR Edit commitment registry */}
      <AnimatePresence>
        {/* ADD MODEL FORM */}
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
                  <span className="text-zinc-500 font-mono text-xs uppercase tracking-wider">COMMITMENT REGISTRY</span>
                  <h3 className="text-xl font-bold font-display text-white mt-0.5 font-sans">Register Obligation</h3>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  id="close-add-emi-modal-btn"
                  className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-bold hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                {/* Category Selector */}
                <div>
                  <label className="block text-xs font-mono text-zinc-500 uppercase mb-1.5">COMMITMENT CATEGORY</label>
                  <select
                    id="emi-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-neon text-left"
                  >
                    {CATEGORIES.map((catOption) => (
                      <option key={catOption} value={catOption}>{catOption}</option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-mono text-zinc-500 uppercase mb-1.5">OBLIGATION NAME / NAME OF CREDITOR</label>
                  <input
                    type="text"
                    required
                    id="emi-name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Splendor Bike EMI, HDFC Card dues"
                    className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-neon"
                  />
                </div>

                {/* Principal amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-500 uppercase mb-1.5">TOTAL OBLIGATION (₹)</label>
                    <input
                      type="number"
                      required
                      min={100}
                      id="emi-total-input"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-2xl px-4 py-3 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-zinc-500 uppercase mb-1.5 font-semibold text-cred-gold">MONTHLY PMT (₹)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      id="emi-installment-input"
                      value={emiAmount}
                      onChange={(e) => setEmiAmount(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-gold"
                    />
                  </div>
                </div>

                {/* Interest Rate & Due Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-500 uppercase mb-1.5">INTEREST % (YEARLY)</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      min={0}
                      id="emi-interest-input"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-2xl px-4 py-3 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-zinc-500 uppercase mb-1.5">DUE DATE (DAY OF MONTH)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={31}
                      id="emi-due-input"
                      value={dueDate}
                      onChange={(e) => setDueDate(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-neon"
                    />
                  </div>
                </div>

                {/* Tenure configuration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-500 uppercase mb-1.5">DURATION (MONTHS)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      id="emi-tenure-input"
                      value={totalMonths}
                      onChange={(e) => setTotalMonths(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-2xl px-4 py-3 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-zinc-500 uppercase mb-1.5">PAID CLEARANCE (MONTHS)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      id="emi-completed-input"
                      value={paidMonths}
                      onChange={(e) => setPaidMonths(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-neon"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="save-emi-btn"
                  className="w-full bg-cred-gold text-black font-display font-bold py-3.5 rounded-full hover:bg-amber-400 transition-colors mt-4"
                >
                  Create Commitment Record
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* EDIT MODEL FORM */}
        {editingEMI && (
          <div className="fixed inset-0 z-50 flex items-end justify-center px-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="bg-zinc-950 w-full max-w-md rounded-t-[32px] border-t border-x border-zinc-800 p-6 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-zinc-500 font-mono text-xs uppercase tracking-wider">EDIT DETAILS</span>
                  <h3 className="text-xl font-bold font-display text-white mt-0.5 font-sans">Modify Commitment</h3>
                </div>
                <button
                  onClick={() => setEditingEMI(null)}
                  id="close-edit-emi-modal-btn"
                  className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-bold hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                {/* Category Selector */}
                <div>
                  <label className="block text-xs font-mono text-zinc-500 uppercase mb-1.5">COMMITMENT CATEGORY</label>
                  <select
                    id="edit-emi-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-neon text-left"
                  >
                    {CATEGORIES.map((catOption) => (
                      <option key={catOption} value={catOption}>{catOption}</option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-mono text-zinc-500 uppercase mb-1.5">OBLIGATION NAME / NAME OF CREDITOR</label>
                  <input
                    type="text"
                    required
                    id="edit-emi-name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-neon"
                  />
                </div>

                {/* Principal amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-500 uppercase mb-1.5">TOTAL OBLIGATION (₹)</label>
                    <input
                      type="number"
                      required
                      min={100}
                      id="edit-emi-total-input"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-2xl px-4 py-3 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-zinc-500 uppercase mb-1.5 font-semibold text-cred-gold">MONTHLY PMT (₹)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      id="edit-emi-installment-input"
                      value={emiAmount}
                      onChange={(e) => setEmiAmount(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-gold"
                    />
                  </div>
                </div>

                {/* Interest Rate & Due Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-500 uppercase mb-1.5">INTEREST % (YEARLY)</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      min={0}
                      id="edit-emi-interest-input"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-2xl px-4 py-3 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-zinc-500 uppercase mb-1.5">DUE DATE (DAY OF MONTH)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={31}
                      id="edit-emi-due-input"
                      value={dueDate}
                      onChange={(e) => setDueDate(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-neon"
                    />
                  </div>
                </div>

                {/* Tenure configuration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-500 uppercase mb-1.5">DURATION (MONTHS)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      id="edit-emi-tenure-input"
                      value={totalMonths}
                      onChange={(e) => setTotalMonths(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-2xl px-4 py-3 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-zinc-500 uppercase mb-1.5 font-semibold text-cred-neon">PAID DEBT (MONTHS)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      id="edit-emi-completed-input"
                      value={paidMonths}
                      onChange={(e) => setPaidMonths(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-2xl px-4 py-3 focus:outline-none focus:border-cred-neon"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingEMI(null)}
                    id="cancel-edit-emi-btn"
                    className="flex-1 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 font-semibold font-display rounded-full hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="save-edit-emi-btn"
                    className="flex-1 bg-cred-neon text-black font-display font-bold py-3.5 rounded-full hover:bg-emerald-400 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
