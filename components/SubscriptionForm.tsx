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
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
        {/* Logo Uploader */}
        <div className="flex-shrink-0">
            <div className="relative group h-24 w-24">
                <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 shadow-sm">
                    <img src={displayLogo} alt="Logo Preview" className="h-full w-full object-cover" />
                </div>
                
                {/* Overlay for upload */}
                <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-2xl cursor-pointer transition-all duration-200 hover:backdrop-blur-sm">
                    <Camera className="w-6 h-6 text-white mb-1" />
                    <span className="text-[0.6rem] text-white font-medium uppercase tracking-wide">Edit</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                
                {/* Remove button if custom */}
                {customLogo && (
                    <button 
                    type="button"
                    onClick={() => setCustomLogo(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors z-10 ring-2 ring-white dark:ring-slate-900"
                    title="Remove custom logo"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>
        </div>

        {/* Name Input */}
        <div className="flex-1 w-full">
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Service Name</label>
            <div className="flex gap-2">
                <input
                type="text"
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-xl border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2.5 text-base"
                placeholder="e.g. Netflix"
                />
                <button
                type="button"
                onClick={handleAutoCategorize}
                disabled={!name || isAutoCategorizing}
                className="flex-shrink-0 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-xl text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                title="Auto-categorize with AI"
                >
                {isAutoCategorizing ? <span className="animate-spin">⏳</span> : <Sparkles className="w-5 h-5" />}
                </button>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                Tip: Enter a name and click the sparkle icon to auto-set the category.
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="price" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Price</label>
          <div className="relative rounded-xl shadow-sm flex">
            <div className="absolute inset-y-0 left-0 flex items-center">
               <select
                id="currency"
                name="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="h-full rounded-l-xl border-transparent bg-gray-50 dark:bg-slate-800 py-0 pl-3 pr-7 text-gray-600 dark:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-medium"
              >
                {Object.values(Currency).map((c) => (
                  <option key={c} value={c}>{c}</option>
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
              className="block w-full rounded-xl border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white pl-24 focus:border-indigo-500 focus:ring-indigo-500 border p-2.5 text-base"
              placeholder="0.00"
              inputMode="decimal"
            />
          </div>
        </div>
        <div>
          <label htmlFor="cycle" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Billing Cycle</label>
          <select
            id="cycle"
            value={cycle}
            onChange={(e) => setCycle(e.target.value as BillingCycle)}
            className="block w-full rounded-xl border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2.5 text-base"
          >
            {Object.values(BillingCycle).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
         <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="date" className="block text-sm font-semibold text-gray-700 dark:text-slate-300">Next Payment Date</label>
            <button 
              type="button" 
              onClick={() => setDateMode(dateMode === 'picker' ? 'manual' : 'picker')}
              className="text-xs flex items-center font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
            >
              {dateMode === 'picker' ? <List className="w-3 h-3 mr-1"/> : <CalendarIcon className="w-3 h-3 mr-1"/>}
              {dateMode === 'picker' ? 'Switch to Manual' : 'Switch to Calendar'}
            </button>
         </div>

         {dateMode === 'picker' ? (
            <input
              type="date"
              id="date"
              required
              value={nextPaymentDate}
              onChange={handlePickerChange}
              className="block w-full rounded-xl border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2.5 text-base"
            />
         ) : (
           <div className="grid grid-cols-3 gap-2">
              <select
                value={manualDay}
                onChange={(e) => handleManualDateChange(Number(e.target.value), manualMonth, manualYear)}
                className="block w-full rounded-xl border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2.5 text-sm"
              >
                {days.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={manualMonth}
                onChange={(e) => handleManualDateChange(manualDay, Number(e.target.value), manualYear)}
                className="block w-full rounded-xl border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2.5 text-sm"
              >
                {months.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <select
                value={manualYear}
                onChange={(e) => handleManualDateChange(manualDay, manualMonth, Number(e.target.value))}
                className="block w-full rounded-xl border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2.5 text-sm"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
           </div>
         )}
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Category</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="block w-full rounded-xl border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2.5 text-base"
        >
          {Object.values(Category).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      
      {/* Secure Vault Section */}
      <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700/50">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">Credential Vault</h4>
          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">Encrypted</span>
        </div>
        
        <div className="space-y-4">
          <div>
             <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-1">Account Email / Username</label>
             <input
                type="text"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                className="block w-full rounded-lg border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2.5 text-sm"
                placeholder="user@example.com"
              />
          </div>
          <div>
             <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-1">Password</label>
             <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2.5 text-sm pr-10"
                  placeholder="••••••••"
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

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel} className="px-6">Cancel</Button>
        <Button type="submit" className="px-6">Save Subscription</Button>
      </div>
    </form>
  );
};

export default SubscriptionForm;