export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // ISO string
  note: string;
  createdAt: number; // timestamp
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color?: string;
}

export interface RecurringTransaction {
  id: string;
  amount: number;
  category: string;
  type: TransactionType;
  description: string;
  dayOfMonth: number; // 1-31
  lastProcessedDate?: string;
}

export const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investments', 'Gift', 'Bisnes', 'Other'],
  expense: ['Food & Dining', 'Transportation', 'Housing', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Education', 'Bisnes', 'Hutang', 'Other']
};
