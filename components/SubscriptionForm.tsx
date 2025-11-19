import React, { useState } from 'react';
import { Subscription, BillingCycle, Category, Currency, CURRENCY_SYMBOLS } from '../types';
import Button from './Button';
import { suggestCategory } from '../services/geminiService';
import { Sparkles } from 'lucide-react';

interface SubscriptionFormProps {
  initialData?: Subscription | null;
  onSubmit: (data: Omit<Subscription, 'id'>) => void;
  onCancel: () => void;
}

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [currency, setCurrency] = useState<Currency>(initialData?.currency || Currency.TRY);
  const [cycle, setCycle] = useState<BillingCycle>(initialData?.cycle || BillingCycle.MONTHLY);
  const [category, setCategory] = useState<Category>(initialData?.category || Category.OTHER);
  const [nextPaymentDate, setNextPaymentDate] = useState(initialData?.nextPaymentDate || new Date().toISOString().split('T')[0]);
  
  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      price: parseFloat(price),
      currency,
      cycle,
      category,
      nextPaymentDate,
      logoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`
    });
  };

  // AI Category Suggestion
  const handleAutoCategorize = async () => {
    if (!name) return;
    setIsAutoCategorizing(true);
    const suggested = await suggestCategory(name);
    setCategory(suggested);
    setIsAutoCategorizing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Service Name</label>
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-base sm:text-sm"
            placeholder="e.g. Netflix"
          />
          <button
            type="button"
            onClick={handleAutoCategorize}
            disabled={!name || isAutoCategorizing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-slate-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            title="Auto-categorize with AI"
          >
            {isAutoCategorizing ? <span className="animate-spin">⏳</span> : <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Price</label>
          <div className="relative mt-1 rounded-md shadow-sm flex">
            <div className="absolute inset-y-0 left-0 flex items-center">
               <select
                id="currency"
                name="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="h-full rounded-md border-transparent bg-transparent py-0 pl-2 pr-7 text-gray-500 dark:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500 text-base sm:text-sm"
              >
                {Object.values(Currency).map((c) => (
                  <option key={c} value={c} className="dark:bg-slate-800">{c}</option>
                ))}
              </select>
            </div>
            <input
              type="number"
              id="price"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white pl-20 focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-base sm:text-sm"
              placeholder="0.00"
              inputMode="decimal"
            />
          </div>
        </div>
        <div>
          <label htmlFor="cycle" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Billing Cycle</label>
          <select
            id="cycle"
            value={cycle}
            onChange={(e) => setCycle(e.target.value as BillingCycle)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-base sm:text-sm"
          >
            {Object.values(BillingCycle).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-base sm:text-sm"
          >
            {Object.values(Category).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Next Payment</label>
          <input
            type="date"
            id="date"
            required
            value={nextPaymentDate}
            onChange={(e) => setNextPaymentDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-base sm:text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
};

export default SubscriptionForm;