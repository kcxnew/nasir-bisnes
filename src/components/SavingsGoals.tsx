import React, { useState } from 'react';
import { SavingsGoal } from '../types';
import { Plus, Target, Trash2, Edit2, PencilLine } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SavingsGoalsProps {
  savingsGoals: SavingsGoal[];
  onAdd: (goal: Omit<SavingsGoal, 'id'>) => void;
  onEdit: (id: string, goal: Partial<SavingsGoal>) => void;
  onDelete: (id: string) => void;
}

export function SavingsGoals({ savingsGoals, onAdd, onEdit, onDelete }: SavingsGoalsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ name: '', targetAmount: '', currentAmount: '', color: '#3b82f6' });

  const handleSave = () => {
    if (!formData.name || !formData.targetAmount) return;
    
    const goalData = {
      name: formData.name,
      targetAmount: Number(formData.targetAmount),
      currentAmount: Number(formData.currentAmount) || 0,
      color: formData.color
    };

    if (editingId) {
      onEdit(editingId, goalData);
    } else {
      onAdd(goalData);
    }
    
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', targetAmount: '', currentAmount: '', color: '#3b82f6' });
  };

  const handleEdit = (goal: SavingsGoal) => {
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      color: goal.color || '#3b82f6'
    });
    setEditingId(goal.id);
    setIsAdding(true);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col mt-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Matlamat Simpanan</h4>
            <p className="text-xs text-slate-400">Jejak progress tabung simpanan</p>
          </div>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Tambah Tabung
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Tabung</label>
              <input 
                type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Cth: Tabung Kecemasan"
                className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Warna</label>
              <div className="flex gap-2">
                {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map(c => (
                  <button 
                    key={c} onClick={() => setFormData({...formData, color: c})}
                    className={`w-8 h-8 rounded-full border-2 ${formData.color === c ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sasaran (RM)</label>
              <input 
                type="number" value={formData.targetAmount} onChange={e => setFormData({...formData, targetAmount: e.target.value})}
                placeholder="10000"
                className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Simpanan Semasa (RM)</label>
              <input 
                type="number" value={formData.currentAmount} onChange={e => setFormData({...formData, currentAmount: e.target.value})}
                placeholder="2000"
                className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => { setIsAdding(false); setEditingId(null); setFormData({name:'', targetAmount:'', currentAmount:'', color:'#3b82f6'}); }} className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5">Batal</button>
            <button onClick={handleSave} className="text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md">Simpan</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savingsGoals.length > 0 ? savingsGoals.map(goal => {
          const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const bgData = [
             { name: 'Saved', value: pct },
             { name: 'Remaining', value: 100 - pct }
          ];
          return (
            <div key={goal.id} className="relative bg-slate-950 rounded-xl p-5 border border-slate-800 flex flex-col items-center group">
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(goal)} className="p-1.5 text-slate-400 hover:text-white bg-slate-900 rounded-md"><PencilLine className="w-3 h-3" /></button>
                <button onClick={() => { if(window.confirm('Buang tabung ini?')) onDelete(goal.id); }} className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-900 rounded-md"><Trash2 className="w-3 h-3" /></button>
              </div>
              <h5 className="font-bold text-slate-200 mb-1">{goal.name}</h5>
              <p className="text-xs text-slate-500 mb-4 font-mono font-medium">
                RM {goal.currentAmount.toLocaleString()} / RM {goal.targetAmount.toLocaleString()}
              </p>
              
              <div className="h-32 w-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={bgData} innerRadius={45} outerRadius={55} dataKey="value" startAngle={90} endAngle={-270} stroke="none">
                      <Cell fill={goal.color || '#3b82f6'} />
                      <Cell fill="#1e293b" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-lg font-bold text-white">{pct.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          )
        }) : (
          <div className="col-span-full py-8 text-center text-slate-500 text-sm">Tiada matlamat simpanan.</div>
        )}
      </div>
    </div>
  );
}
