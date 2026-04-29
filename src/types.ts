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

export const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investments', 'Gift', 'Bisnes', 'Other'],
  expense: ['Food & Dining', 'Transportation', 'Housing', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Education', 'Bisnes', 'Hutang', 'Other']
};
