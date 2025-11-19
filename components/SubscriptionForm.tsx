import React, { useState, useEffect } from 'react';
import { Subscription, BillingCycle, Category, Currency, CURRENCY_SYMBOLS } from '../types';
import Button from './Button';
import { suggestCategory } from '../services/geminiService';
import { Sparkles, Shield, Eye, EyeOff, Calendar as CalendarIcon, List, Camera, X } from 'lucide-react';

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
  
  // Date Selection Mode State
  const [dateMode, setDateMode] = useState<'picker' | 'manual'>('picker');
  const [manualDay, setManualDay] = useState(new Date().getDate());
  const [manualMonth, setManualMonth] = useState(new Date().getMonth()); // 0-11
  const [manualYear, setManualYear] = useState(new Date().getFullYear());

  const [accountEmail, setAccountEmail] = useState(initialData?.accountEmail || '');
  const [accountPassword, setAccountPassword] = useState(initialData?.accountPassword || '');
  const [showPassword, setShowPassword] = useState(false);

  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);

  // Custom Logo State: Initialize with existing if it's not a generated one
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    if (initialData?.logoUrl && !initialData.logoUrl.includes('ui-avatars.com')) {
        return initialData.logoUrl;
    }
    return null;
  });

  // Helper arrays for manual date selection
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);

  // Sync manual state when date changes externally or on init
  useEffect(() => {
    const d = new Date(nextPaymentDate);
    if (!isNaN(d.getTime())) {
      setManualDay(d.getDate());
      setManualMonth(d.getMonth());
      setManualYear(d.getFullYear());
    }
  }, []);

  const handleManualDateChange = (d: number, m: number, y: number) => {
    setManualDay(d);
    setManualMonth(m);
    setManualYear(y);
    
    // Construct YYYY-MM-DD string
    const newDate = new Date(y, m, d);
    const yearStr = newDate.getFullYear();
    const monthStr = String(newDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(newDate.getDate()).padStart(2, '0');
    setNextPaymentDate(`${yearStr}-${monthStr}-${dayStr}`);
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNextPaymentDate(val);
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      setManualDay(d.getUTCDate());
      setManualMonth(d.getUTCMonth());
      setManualYear(d.getUTCFullYear());
    }
  };

  // Logo Upload Handler with Resize
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        alert("File too large. Please select an image under 2MB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Resize logic (Max 256px for storage efficiency)
        const maxSize = 256;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        setCustomLogo(canvas.toDataURL('image/png'));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalLogoUrl = customLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Sub')}&background=random&color=fff&size=128`;

    onSubmit({
      name,
      price: parseFloat(price),
      currency,
      cycle,
      category,
      nextPaymentDate,
      accountEmail,
      accountPassword,
      logoUrl: finalLogoUrl
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

  const displayLogo = customLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'S')}&background=random&color=fff&size=128`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {/* Logo Uploader */}
        <div className="flex-shrink-0 mx-auto sm:mx-0">
            <div className="relative group h-20 w-20">
                <div className="h-20 w-20 rounded-full overflow-hidden border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 shadow-sm">
                    <img src={displayLogo} alt="Logo Preview" className="h-full w-full object-cover" />
                </div>
                
                {/* Overlay for upload */}
                <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity duration-200">
                    <Camera className="w-6 h-6 text-white mb-1" />
                    <span className="text-[0.6rem] text-white font-medium uppercase">Edit</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                
                {/* Remove button if custom */}
                {customLogo && (
                    <button 
                    type="button"
                    onClick={() => setCustomLogo(null)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors z-10"
                    title="Remove custom logo"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>
        </div>

        {/* Name Input */}
        <div className="flex-1 w-full">
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
            <p className="mt-1.5 text-xs text-gray-500 dark:text-slate-400">
                Click the icon to upload a custom logo.
            </p>
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

      <div>
         <div className="flex justify-between items-center mb-1">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Next Payment</label>
            <button 
              type="button" 
              onClick={() => setDateMode(dateMode === 'picker' ? 'manual' : 'picker')}
              className="text-xs flex items-center text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {dateMode === 'picker' ? <List className="w-3 h-3 mr-1"/> : <CalendarIcon className="w-3 h-3 mr-1"/>}
              {dateMode === 'picker' ? 'Switch to Manual Selection' : 'Switch to Calendar'}
            </button>
         </div>

         {dateMode === 'picker' ? (
            <input
              type="date"
              id="date"
              required
              value={nextPaymentDate}
              onChange={handlePickerChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-base sm:text-sm"
            />
         ) : (
           <div className="grid grid-cols-3 gap-2 mt-1">
              <select
                value={manualDay}
                onChange={(e) => handleManualDateChange(Number(e.target.value), manualMonth, manualYear)}
                className="block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-sm"
              >
                {days.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={manualMonth}
                onChange={(e) => handleManualDateChange(manualDay, Number(e.target.value), manualYear)}
                className="block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-sm"
              >
                {months.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <select
                value={manualYear}
                onChange={(e) => handleManualDateChange(manualDay, manualMonth, Number(e.target.value))}
                className="block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-sm"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
           </div>
         )}
      </div>

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
      
      <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-2">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Credentials (Stored Securely)</h4>
        </div>
        <div className="space-y-3">
          <div>
             <label className="block text-xs font-medium text-gray-500 dark:text-slate-400">Account Email/Username</label>
             <input
                type="text"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-sm"
                placeholder="Optional"
              />
          </div>
          <div>
             <label className="block text-xs font-medium text-gray-500 dark:text-slate-400">Account Password</label>
             <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  className="block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-sm pr-10"
                  placeholder="Optional"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
             </div>
          </div>
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