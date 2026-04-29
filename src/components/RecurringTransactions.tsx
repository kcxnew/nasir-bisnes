import React, { useState } from 'react';
import { RecurringTransaction, TransactionType, CATEGORIES } from '../types';
import { Plus, Repeat, Trash2, CalendarDays } from 'lucide-react';

interface RecurringTransactionsProps {
  recurringTransactions: RecurringTransaction[];
  onAdd: (rt: Omit<RecurringTransaction, 'id'>) => void;
  onDelete: (id: string) => void;
}

export function RecurringTransactions({ recurringTransactions, onAdd, onDelete }: RecurringTransactionsProps) {
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({ 
    description: '', 
    amount: '', 
    type: 'expense' as TransactionType, 
    category: CATEGORIES.expense[0],
    dayOfMonth: '1'
  });

  const handleSave = () => {
    if (!formData.description || !formData.amount || !formData.dayOfMonth) return;
    
    onAdd({
      description: formData.description,
      amount: Number(formData.amount),
      type: formData.type,
      category: formData.category,
      dayOfMonth: Number(formData.dayOfMonth)
    });
    
    setIsAdding(false);
    setFormData({ description: '', amount: '', type: 'expense', category: CATEGORIES.expense[0], dayOfMonth: '1' });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col mt-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Transaksi Berulang</h4>
            <p className="text-xs text-slate-400">Automatik rekod bil & komitmen bulanan</p>
          </div>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Tambah Transaksi
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex flex-col gap-1.5 lg:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Keterangan</label>
              <input 
                type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Cth: Sewa Rumah"
                className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jumlah (RM)</label>
              <input 
                type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                placeholder="0.00"
                className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jenis</label>
              <select 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value as TransactionType, category: CATEGORIES[e.target.value as TransactionType][0]})}
                className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="expense">Perbelanjaan (Keluar)</option>
                <option value="income">Pendapatan (Masuk)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kategori</label>
              <select 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {CATEGORIES[formData.type].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 lg:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hari Kebulanan (1-31)</label>
              <div className="relative">
                <CalendarDays className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="number" min="1" max="31" value={formData.dayOfMonth} onChange={e => setFormData({...formData, dayOfMonth: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-md pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setIsAdding(false)} className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5">Batal</button>
            <button onClick={handleSave} className="text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-md">Simpan</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {recurringTransactions.length > 0 ? recurringTransactions.map(rt => (
          <div key={rt.id} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-lg group">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-center justify-center w-12 h-12 bg-slate-900 rounded-md border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Hari</span>
                <span className="text-lg font-bold text-white leading-none">{rt.dayOfMonth}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  {rt.description}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase ${rt.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {rt.type}
                  </span>
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1">
                  <span>{rt.category}</span>
                  <span>•</span>
                  <span>Setiap {rt.dayOfMonth}hb</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-4 min-w-[120px]">
              <span className={`font-mono font-bold ${rt.type === 'income' ? 'text-emerald-400' : 'text-slate-300'}`}>
                {rt.type === 'income' ? '+' : ''}RM {rt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <button 
                onClick={() => { if(window.confirm('Buang transaksi berulang ini?')) onDelete(rt.id); }} 
                className="p-2 text-slate-500 hover:text-red-400 bg-slate-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )) : (
          <div className="py-8 text-center text-slate-500 text-sm">Tiada transaksi berulang.</div>
        )}
      </div>
    </div>
  );
}
