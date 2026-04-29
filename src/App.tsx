/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { useFinanceData } from "./hooks/useFinanceData";
import { SummaryCards } from "./components/SummaryCards";
import { DashboardCharts } from "./components/DashboardCharts";
import { TransactionForm } from "./components/TransactionForm";
import { TransactionList } from "./components/TransactionList";
import { BudgetTracker } from "./components/BudgetTracker";
import { SavingsGoals } from "./components/SavingsGoals";
import { RecurringTransactions } from "./components/RecurringTransactions";
import { MonthlyReportGenerator } from "./components/MonthlyReportGenerator";
import { Wallet, Settings, LayoutDashboard, Menu, X } from "lucide-react";
import { Transaction } from "./types";

export default function App() {
  const { 
    transactions, 
    budgets, 
    savingsGoals,
    recurringTransactions,
    updateBudgets, 
    addTransaction, 
    editTransaction, 
    deleteTransaction, 
    addSavingsGoal,
    editSavingsGoal,
    deleteSavingsGoal,
    addRecurringTransaction,
    deleteRecurringTransaction,
    totalIncome, 
    totalExpense, 
    balance, 
    isLoaded 
  } = useFinanceData();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleFormSubmit = (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (editingTransaction) {
      editTransaction(editingTransaction.id, data);
      setEditingTransaction(null);
    } else {
      addTransaction(data);
    }
  };

  if (!isLoaded) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-8 border-b border-slate-800">
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded-sm"></div>
              Nasir.Finance
            </h1>
            <button className="absolute top-8 right-6 lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          
          <nav className="flex-1 px-6 py-4 space-y-2">
            <a href="#" className="bg-blue-500/10 text-blue-400 px-4 py-3 rounded-md font-medium text-sm flex items-center gap-3">
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </a>
            <a href="#" className="text-slate-400 hover:bg-slate-800 hover:text-slate-200 px-4 py-3 rounded-md font-medium text-sm flex items-center gap-3 transition-colors">
              <Wallet className="w-5 h-5" />
              Transactions
            </a>
          </nav>
          
          <div className="p-6 border-t border-slate-800 mt-auto">
            <a href="#" className="text-slate-400 hover:bg-slate-800 hover:text-slate-200 px-4 py-3 rounded-md font-medium text-sm flex items-center gap-3 transition-colors mb-4">
              <Settings className="w-5 h-5" />
              Settings
            </a>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Admin User</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Lead Architect</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto w-full">
        {/* Header (Mobile Only for the menu toggle) */}
        <header className="lg:hidden h-16 flex items-center px-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
          <button className="p-2 -ml-2 text-slate-400 hover:text-slate-200" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 p-4 lg:p-8 w-full max-w-6xl mx-auto space-y-6 lg:space-y-8">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4 lg:mb-8 pt-2">
            <div>
              <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
              <p className="text-slate-400 text-sm">Monitoring your personal cash flow</p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-3 w-full sm:w-auto">
              <MonthlyReportGenerator 
                transactions={transactions} 
                budgets={budgets} 
                savingsGoals={savingsGoals} 
              />
              <div className="flex gap-2 text-xs font-medium w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                <span className="px-3 py-1 bg-slate-900 border border-slate-800 hover:text-slate-200 transition-colors cursor-pointer rounded-full text-slate-400 whitespace-nowrap">Weekly</span>
                <span className="px-3 py-1 bg-blue-600 text-white rounded-full whitespace-nowrap">Monthly</span>
                <span className="px-3 py-1 bg-slate-900 border border-slate-800 hover:text-slate-200 transition-colors cursor-pointer rounded-full text-slate-400 whitespace-nowrap">Yearly</span>
              </div>
            </div>
          </header>

          <SummaryCards income={totalIncome} expense={totalExpense} balance={balance} />
          
          <DashboardCharts transactions={transactions} />

          <BudgetTracker 
            transactions={transactions} 
            budgets={budgets} 
            onUpdateBudgets={updateBudgets} 
          />

          <SavingsGoals 
            savingsGoals={savingsGoals}
            onAdd={addSavingsGoal}
            onEdit={editSavingsGoal}
            onDelete={deleteSavingsGoal}
          />
          
          <RecurringTransactions 
            recurringTransactions={recurringTransactions}
            onAdd={addRecurringTransaction}
            onDelete={deleteRecurringTransaction}
          />

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-6 mt-8">
            <div className="xl:col-span-8 order-2 xl:order-1 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 px-2">Recent Transactions</h4>
              <TransactionList 
                transactions={transactions} 
                onDelete={deleteTransaction} 
                onEdit={(t) => setEditingTransaction(t)} 
              />
            </div>
            
            <div className="xl:col-span-4 order-1 xl:order-2">
              <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-6 shadow-sm sticky top-6">
                <h4 className="text-sm font-bold mb-4 uppercase tracking-wider">
                  {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                </h4>
                <TransactionForm 
                  onSubmit={handleFormSubmit} 
                  initialData={editingTransaction} 
                  onCancelEdit={() => setEditingTransaction(null)} 
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
