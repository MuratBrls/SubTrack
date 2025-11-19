export enum BillingCycle {
  MONTHLY = 'Monthly',
  YEARLY = 'Yearly',
  WEEKLY = 'Weekly'
}

export enum Category {
  ENTERTAINMENT = 'Entertainment',
  UTILITIES = 'Utilities',
  SOFTWARE = 'Software',
  FITNESS = 'Fitness',
  FOOD = 'Food',
  OTHER = 'Other'
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  TRY = 'TRY'
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.USD]: '$',
  [Currency.EUR]: '€',
  [Currency.TRY]: '₺'
};

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  currency: Currency;
  subscriptionName: string;
  category: Category;
}

export interface Subscription {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  cycle: BillingCycle;
  nextPaymentDate: string;
  category: Category;
  description?: string;
  logoUrl?: string;
  // New fields for credentials
  accountEmail?: string;
  accountPassword?: string;
  // History
  paymentHistory?: PaymentRecord[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  hasVaultPin?: boolean; // To check if user set up a PIN
}

export interface AnalysisResult {
  totalMonthly: number;
  totalYearly: number;
  insight: string;
  savingsTips: string[];
}

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.ENTERTAINMENT]: '#8b5cf6', // Violet
  [Category.UTILITIES]: '#f59e0b', // Amber
  [Category.SOFTWARE]: '#3b82f6', // Blue
  [Category.FITNESS]: '#10b981', // Emerald
  [Category.FOOD]: '#ef4444', // Red
  [Category.OTHER]: '#64748b', // Slate
};