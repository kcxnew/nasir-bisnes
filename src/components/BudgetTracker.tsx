import React, { useState } from 'react';
import { Transaction, CATEGORIES } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

interface BudgetTrackerProps {
  transactions: Transaction[];
  budgets: Record<string, number>;
  onUpdateBudgets: (newBudgets: Record<string, number>) => void;
}

export function BudgetTracker({ transactions, budgets, onUpdateBudgets }: BudgetTrackerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localBudgets, setLocalBudgets] = useState<Record<string, number>>(budgets);

  // Calculate this month's spending per expense category
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthExpenses = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const spendingByCategory = CATEGORIES.expense.reduce((acc, cat) => {
    acc[cat] = 0;
    return acc;
  }, {} as Record<string, number>);

  thisMonthExpenses.forEach(t => {
    if (spendingByCategory[t.category] !== undefined) {
      spendingByCategory[t.category] += t.amount;
    }
  });

  const chartData = CATEGORIES.expense
    .map(category => {
      const spent = spendingByCategory[category];
      const budget = budgets[category] || 0;
      const isOverBudget = budget > 0 && spent > budget;
      const pct = budget > 0 ? (spent / budget) * 100 : 0;
      return {
        category,
        spent,
        budget,
        isOverBudget,
        pct: pct.toFixed(1)
      };
    })
    .filter(item => item.budget > 0 || item.spent > 0) // Only show categories with activity or budget
    .sort((a, b) => b.budget - a.budget || b.spent - a.spent); // prioritize higher budgets or higher spenders

  const handleSave = () => {
    onUpdateBudgets(localBudgets);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalBudgets(budgets);
    setIsEditing(false);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-md shadow-lg min-w-[200px]">
          <p className="font-bold text-white text-sm mb-3">{label}</p>
          <div className="flex items-center justify-between gap-4 text-xs font-medium mb-2">
            <span className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Spent</span>
            <span className={`font-bold border-l border-slate-700 pl-3 ${data.isOverBudget ? 'text-red-400' : 'text-white'}`}>
              {new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(data.spent)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-xs font-medium mb-2">
            <span className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Budget</span>
            <span className="font-bold text-slate-300 border-l border-slate-700 pl-3">
              {new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(data.budget)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-xs font-medium">
            <span className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Status</span>
            <span className="font-bold text-slate-300 border-l border-slate-700 pl-3">
              {data.budget > 0 ? `${data.pct}%` : 'No Budget'}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col mt-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-sm font-bold text-white">Monthly Budgets</h4>
          <p className="text-xs text-slate-400">Track spending limits vs actual</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => { setLocalBudgets(budgets); setIsEditing(true); }}
            className="text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Edit Budgets
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.expense.map(cat => (
              <div key={cat} className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{cat}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">RM</span>
                  <input 
                    type="number"
                    value={localBudgets[cat] || ''}
                    onChange={(e) => setLocalBudgets({ ...localBudgets, [cat]: Number(e.target.value) })}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button 
              onClick={handleCancel}
              className="text-sm font-medium text-slate-400 hover:text-white px-4 py-2"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Save Budgets
            </button>
          </div>
        </div>
      ) : (
        chartData.length > 0 ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dx={5} />
                <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#cbd5e1', fontWeight: 500 }} width={120} />
                <Tooltip cursor={{ fill: '#1e293b' }} content={<CustomTooltip />} />
                
                <Bar dataKey="budget" fill="#1e293b" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="spent" radius={[0, 4, 4, 0]} barSize={12} fill="#ef4444">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isOverBudget ? '#ef4444' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-start gap-6 mt-4 pl-[140px]">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400"><span className="w-3 h-3 rounded-sm bg-[#1e293b]"></span> Budget</div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400"><span className="w-3 h-3 rounded-sm bg-blue-500"></span> Spent (Under)</div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400"><span className="w-3 h-3 rounded-sm bg-red-500"></span> Spent (Over)</div>
            </div>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
              <span className="text-xl">💰</span>
            </div>
            <p className="text-sm font-medium text-white mb-1">No budgets set</p>
            <p className="text-xs text-slate-400 max-w-[250px]">Set monthly limits for your expenses to track your spending goals.</p>
          </div>
        )
      )}
    </div>
  );
}
