import { useState, useEffect } from 'react';
import { Transaction, SavingsGoal, RecurringTransaction } from '../types';

export function useFinanceData() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initial fetch
    Promise.all([
      fetch("/api/transactions").then(res => res.json()),
      fetch("/api/budgets").then(res => res.json()),
      fetch("/api/savings_goals").then(res => res.json()),
      fetch("/api/recurring_transactions").then(res => res.json())
    ])
    .then(([transactionsData, budgetsData, savingsData, recurringData]) => {
      setTransactions(transactionsData);
      setBudgets(budgetsData);
      setSavingsGoals(savingsData);
      setRecurringTransactions(recurringData);
      setIsLoaded(true);
    })
    .catch(err => {
      console.error("Failed to fetch data", err);
      setIsLoaded(true);
    });

    // Listen for SSE updates (from webhooks or other tabs)
    const eventSource = new EventSource("/api/events");
    eventSource.onmessage = (event) => {
       try {
         const message = JSON.parse(event.data);
         if (message.type === 'update') {
            setTransactions(message.data);
         } else if (message.type === 'budgets_update') {
            setBudgets(message.data);
         } else if (message.type === 'savings_update') {
            setSavingsGoals(message.data);
         } else if (message.type === 'recurring_update') {
            setRecurringTransactions(message.data);
         }
       } catch(e) {
         console.error("Failed to parse SSE", e);
       }
    };
    return () => {
      eventSource.close();
    };
  }, []);

  const addTransaction = async (newTransaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    await fetch("/api/transactions", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(newTransaction)
    });
  };

  const editTransaction = async (id: string, updatedTransaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    await fetch(`/api/transactions/${id}`, {
       method: "PUT",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(updatedTransaction)
    });
  };

  const deleteTransaction = async (id: string) => {
    await fetch(`/api/transactions/${id}`, {
       method: "DELETE"
    });
  };

  const updateBudgets = async (newBudgets: Record<string, number>) => {
    await fetch("/api/budgets", {
       method: "PUT",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(newBudgets)
    });
    setBudgets(newBudgets); // Optimistic updates
  };

  const addSavingsGoal = async (goal: Omit<SavingsGoal, 'id'>) => {
    await fetch("/api/savings_goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(goal) });
  };

  const editSavingsGoal = async (id: string, goal: Partial<SavingsGoal>) => {
    await fetch(`/api/savings_goals/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(goal) });
  };

  const deleteSavingsGoal = async (id: string) => {
    await fetch(`/api/savings_goals/${id}`, { method: "DELETE" });
  };

  const addRecurringTransaction = async (recurring: Omit<RecurringTransaction, 'id'>) => {
    await fetch("/api/recurring_transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(recurring) });
  };

  const editRecurringTransaction = async (id: string, recurring: Partial<RecurringTransaction>) => {
    await fetch(`/api/recurring_transactions/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(recurring) });
  };

  const deleteRecurringTransaction = async (id: string) => {
    await fetch(`/api/recurring_transactions/${id}`, { method: "DELETE" });
  };

  const clearData = () => {
    if (window.confirm("Clearing data is not implemented in the API. Do you want to try?")) {
      // Not implemented on server
    }
  };

  // Derived state
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return {
    transactions,
    budgets,
    savingsGoals,
    recurringTransactions,
    addTransaction,
    editTransaction,
    deleteTransaction,
    updateBudgets,
    addSavingsGoal,
    editSavingsGoal,
    deleteSavingsGoal,
    addRecurringTransaction,
    editRecurringTransaction,
    deleteRecurringTransaction,
    clearData,
    totalIncome,
    totalExpense,
    balance,
    isLoaded
  };
}
