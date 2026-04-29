import { useState, useEffect } from 'react';
import { Transaction } from '../types';

export function useFinanceData() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initial fetch
    fetch("/api/transactions")
      .then(res => res.json())
      .then(data => {
        setTransactions(data);
        setIsLoaded(true);
      })
      .catch(err => {
        console.error("Failed to fetch transactions", err);
        setIsLoaded(true);
      });

    // Listen for SSE updates (from webhooks or other tabs)
    const eventSource = new EventSource("/api/events");
    eventSource.onmessage = (event) => {
       try {
         const message = JSON.parse(event.data);
         if (message.type === 'update') {
            setTransactions(message.data);
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
    // Optimistic UI updates could go here, but since SSE responds fast, we just wait for API / SSE
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
    addTransaction,
    editTransaction,
    deleteTransaction,
    clearData,
    totalIncome,
    totalExpense,
    balance,
    isLoaded
  };
}
