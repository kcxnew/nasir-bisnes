import { Transaction, TransactionType, CATEGORIES } from "@/src/types";
import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";

interface TransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  initialData?: Transaction | null;
  onCancelEdit?: () => void;
}

export function TransactionForm({ onSubmit, initialData, onCancelEdit }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES['expense'][0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setCategory(initialData.category);
      setDate(initialData.date);
      setNote(initialData.note || '');
      setError('');
    } else {
      resetForm();
    }
  }, [initialData]);

  const resetForm = () => {
    setType('expense');
    setAmount('');
    setCategory(CATEGORIES['expense'][0]);
    setDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setError('');
  };

  // Update category if type changes
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(CATEGORIES[newType][0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    
    // Validation
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!category) {
      setError('Please select a category.');
      return;
    }
    if (!date) {
      setError('Please select a date.');
      return;
    }

    onSubmit({
      type,
      amount: parsedAmount,
      category,
      date,
      note: note.trim()
    });

    if (!initialData) {
      resetForm();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type Toggle */}
      <div className="flex p-1 bg-slate-950 rounded-md">
        <button
          type="button"
          onClick={() => handleTypeChange('expense')}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${
            type === 'expense' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('income')}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${
            type === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Income
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] text-slate-400 block mb-1 uppercase tracking-widest font-bold">Amount (MYR)</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-medium text-sm">RM</span>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-950 border-none rounded-md pl-10 pr-3 py-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-slate-600 text-white transition-all"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1 uppercase tracking-widest font-bold">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border-none rounded-md px-3 py-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-white transition-all appearance-none"
            >
              {CATEGORIES[type].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] text-slate-400 block uppercase tracking-widest font-bold">Date</label>
              <div className="flex gap-1">
                <button 
                  type="button" 
                  onClick={() => setDate(new Date().toISOString().split('T')[0])} 
                  className="text-[9px] bg-slate-950 text-slate-400 hover:text-white px-1.5 py-0.5 rounded transition-colors uppercase tracking-wider font-bold"
                >
                  Today
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 7);
                    setDate(d.toISOString().split('T')[0]);
                  }} 
                  className="text-[9px] bg-slate-950 text-slate-400 hover:text-white px-1.5 py-0.5 rounded transition-colors uppercase tracking-wider font-bold"
                >
                  Last 7 Days
                </button>
              </div>
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950 border-none rounded-md px-3 py-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-200 transition-all"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-slate-400 block mb-1 uppercase tracking-widest font-bold">Note (Optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-slate-950 border-none rounded-md px-3 py-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-slate-600 text-white transition-all"
            placeholder="e.g. Lunch with client"
            maxLength={50}
          />
        </div>
        
        {error && <p className="text-[10px] text-orange-400 uppercase tracking-wider font-bold mb-2">{error}</p>}
      </div>

      <div className="flex gap-2 mt-2">
        <Button type="submit" className="flex-1">
          {initialData ? 'Update Record' : 'Save Record'}
        </Button>
        {initialData && (
          <Button type="button" variant="outline" onClick={onCancelEdit} className="px-4 text-white hover:text-white hover:bg-slate-700 bg-transparent border-slate-700">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
