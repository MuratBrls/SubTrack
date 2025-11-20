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
  accountEmail?: string;
  accountPassword?: string;
}

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.ENTERTAINMENT]: '#8b5cf6',
  [Category.UTILITIES]: '#f59e0b',
  [Category.SOFTWARE]: '#3b82f6',
  [Category.FITNESS]: '#10b981',
  [Category.FOOD]: '#ef4444',
  [Category.OTHER]: '#64748b',
};