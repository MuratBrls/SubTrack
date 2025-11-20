
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, CreditCard, Calendar, LayoutDashboard, PieChart as ChartIcon, Bell, Moon, Sun, Download, Key, Zap, Search, CheckCircle, History as HistoryIcon } from 'lucide-react';
import { Subscription, CATEGORY_COLORS, BillingCycle, User, Currency, CURRENCY_SYMBOLS, PaymentRecord } from './types';
import Modal from './components/Modal';
import SubscriptionForm from './components/SubscriptionForm';
import Analytics from './components/Analytics';
import HistoryView from './components/HistoryView';
import Button from './components/Button';
import CredentialsModal from './components/CredentialsModal';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const LOCAL_USER_ID = 'default_local_user';

  // Initialize user state with a default local user
  const [user, setUser] = useState<User>({
    id: LOCAL_USER_ID,
    email: 'local@app',
    name: 'My Subscriptions',
    hasVaultPin: false // PIN logic removed
  });

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('subtrack_theme') === 'dark' || 
             (!localStorage.getItem('subtrack_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Initialize subscriptions from local storage using the default ID
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    if (typeof window === 'undefined') return [];
    return storageService.getSubscriptions(LOCAL_USER_ID);
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'history'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [upcomingSubs, setUpcomingSubs] = useState<Subscription[]>([]);
  
  // Vault States
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [vaultTargetSub, setVaultTargetSub] = useState<Subscription | null>(null);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Check for API Key
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    if (process.env.API_KEY) {
      setHasApiKey(true);
      console.log("Gemini API Key detected and ready.");
    }
  }, []);

  // Apply Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('subtrack_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('subtrack_theme', 'light');
    }
  }, [darkMode]);

  // PWA Install Event Listener
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Robust helper for date calculation (handles local time properly)
  const getDaysUntilDue = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse YYYY-MM-DD strictly as local parts to avoid UTC conversion quirks
    const [year, month, day] = dateStr.split('-').map(Number);
    // Note: month is 0-indexed in JS Date
    const due = new Date(year, month - 1, day);
    
    const diffTime = due.getTime() - today.getTime();
    // Math.round handles DST shifts (23h/25h days) better than ceil/floor for day diffs
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  // Effect to load data and check for reminders
  useEffect(() => {
      const loadedSubs = storageService.getSubscriptions(user.id);
      setSubscriptions(loadedSubs);

      // Check for upcoming payments (due within 3 days, including today)
      const upcoming = loadedSubs.filter(sub => {
        const days = getDaysUntilDue(sub.nextPaymentDate);
        return days >= 0 && days <= 3;
      });

      if (upcoming.length > 0) {
        setUpcomingSubs(upcoming);
        setIsReminderOpen(true);
      }
  }, [user.id]);

  // Persist subscriptions to storageService whenever they change
  useEffect(() => {
      storageService.saveSubscriptions(user.id, subscriptions);
  }, [subscriptions, user.id]);

  const handleAddSubscription = (data: Omit<Subscription, 'id'>) => {
    const newSub: Subscription = {
      ...data,
      id: crypto.randomUUID(),
      paymentHistory: []
    };
    setSubscriptions([...subscriptions, newSub]);
    setIsModalOpen(false);
  };

  const handleEditSubscription = (data: Omit<Subscription, 'id'>) => {
    if (!editingSub) return;
    const updatedSubs = subscriptions.map(s => s.id === editingSub.id ? { ...data, id: editingSub.id, paymentHistory: s.paymentHistory || [] } : s);
    setSubscriptions(updatedSubs);
    setEditingSub(null);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this subscription?')) {
      setSubscriptions(subscriptions.filter(s => s.id !== id));
    }
  };

  // MARK AS PAID LOGIC
  const handleMarkAsPaid = (sub: Subscription) => {
    if (!confirm(`Mark ${sub.name} as paid for ${sub.nextPaymentDate}? This will move it to History and update the next due date.`)) {
      return;
    }

    // 1. Create History Record
    const newRecord: PaymentRecord = {
      id: crypto.randomUUID(),
      date: sub.nextPaymentDate,
      amount: sub.price,
      currency: sub.currency,
      subscriptionName: sub.name,
      category: sub.category
    };

    // 2. Calculate Next Date
    const [year, month, day] = sub.nextPaymentDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    
    if (sub.cycle === BillingCycle.MONTHLY) {
      dateObj.setMonth(dateObj.getMonth() + 1);
    } else if (sub.cycle === BillingCycle.YEARLY) {
      dateObj.setFullYear(dateObj.getFullYear() + 1);
    } else if (sub.cycle === BillingCycle.WEEKLY) {
      dateObj.setDate(dateObj.getDate() + 7);
    }

    // Format back to YYYY-MM-DD
    const nextYear = dateObj.getFullYear();
    const nextMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nextDay = String(dateObj.getDate()).padStart(2, '0');
    const newDateStr = `${nextYear}-${nextMonth}-${nextDay}`;

    // 3. Update State
    const updatedSubs = subscriptions.map(s => {
      if (s.id === sub.id) {
        return {
          ...s,
          nextPaymentDate: newDateStr,
          paymentHistory: [...(s.paymentHistory || []), newRecord]
        };
      }
      return s;
    });

    setSubscriptions(updatedSubs);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const openEditModal = (sub: Subscription) => {
    setEditingSub(sub);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingSub(null);
    setIsModalOpen(true);
  };

  // Vault Logic - DIRECT ACCESS (No PIN)
  const openVault = (sub: Subscription) => {
    setVaultTargetSub(sub);
    setIsCredentialsModalOpen(true);
  };

  const calculateTotalMonthly = (currencyCode: Currency) => {
    return subscriptions
      .filter(s => s.currency === currencyCode)
      .reduce((acc, s) => {
        let cost = s.price;
        if (s.cycle === BillingCycle.YEARLY) cost = s.price / 12;
        if (s.cycle === BillingCycle.WEEKLY) cost = s.price * 4;
        return acc + cost;
      }, 0);
  };

  const renderDashboard = () => {
    const totalUSD = calculateTotalMonthly(Currency.USD);
    const totalEUR = calculateTotalMonthly(Currency.EUR);
    const totalTRY = calculateTotalMonthly(Currency.TRY);

    const filteredSubscriptions = subscriptions.filter(sub => 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6 pb-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white dark:bg-slate-800 overflow-hidden shadow-sm rounded-xl border border-gray-200 dark:border-slate-700 transition-colors">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-50 dark:bg-indigo-900/30 rounded-md p-3">
                  <CreditCard className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-slate-400 truncate">Total Monthly</dt>
                  <dd className="flex flex-col items-baseline">
                    {totalTRY > 0 && <div className="text-lg font-semibold text-gray-900 dark:text-white">₺{totalTRY.toFixed(2)}</div>}
                    {totalUSD > 0 && <div className="text-lg font-semibold text-gray-900 dark:text-white">${totalUSD.toFixed(2)}</div>}
                    {totalEUR > 0 && <div className="text-lg font-semibold text-gray-900 dark:text-white">€{totalEUR.toFixed(2)}</div>}
                    {totalTRY === 0 && totalUSD === 0 && totalEUR === 0 && <div className="text-lg text-gray-400 dark:text-slate-500">--</div>}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 overflow-hidden shadow-sm rounded-xl border border-gray-200 dark:border-slate-700 transition-colors">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-50 dark:bg-green-900/30 rounded-md p-3">
                  <LayoutDashboard className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-slate-400 truncate">Active Subs</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">{subscriptions.length}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 overflow-hidden shadow-sm rounded-xl border border-gray-200 dark:border-slate-700 transition-colors">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-orange-50 dark:bg-orange-900/30 rounded-md p-3">
                  <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-slate-400 truncate">Next Payment</dt>
                    <dd className="flex items-baseline">
                      <div className="text-sm text-gray-900 dark:text-white truncate">
                         {subscriptions.sort((a,b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime())[0]?.name || "None"}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription List */}
        <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Your Subscriptions</h3>
            </div>
            
            <div className="relative w-full sm:max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg leading-5 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                    placeholder="Search subscriptions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>
          <ul role="list" className="divide-y divide-gray-200 dark:divide-slate-700">
            {filteredSubscriptions.length === 0 && (
              <li className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                {subscriptions.length === 0 
                    ? 'No subscriptions yet. Add one to get started!' 
                    : 'No subscriptions found matching your search.'}
              </li>
            )}
            {filteredSubscriptions.map((sub) => {
              const daysLeft = getDaysUntilDue(sub.nextPaymentDate);
              const categoryColor = CATEGORY_COLORS[sub.category] || '#9ca3af';
              const symbol = CURRENCY_SYMBOLS[sub.currency];
              const hasCredentials = sub.accountEmail || sub.accountPassword;
              
              return (
                <li key={sub.id} className="px-4 sm:px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-200 dark:bg-slate-600 overflow-hidden border border-gray-200 dark:border-slate-600">
                        {sub.logoUrl ? <img src={sub.logoUrl} alt={sub.name} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-indigo-100" />}
                      </div>
                      <div className="ml-4 min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">{sub.name}</h4>
                          <span 
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-opacity-15"
                            style={{ backgroundColor: `${categoryColor}20`, color: darkMode ? '#e2e8f0' : categoryColor, border: `1px solid ${categoryColor}40` }}
                          >
                            {sub.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400 truncate">
                           <span className="font-medium text-gray-900 dark:text-slate-200 mr-1 sm:hidden">{symbol}{sub.price}</span>
                           • {new Date(sub.nextPaymentDate).toLocaleDateString()} 
                          {daysLeft >= 0 ? <span className="text-orange-600 dark:text-orange-400 ml-1 text-xs whitespace-nowrap">({daysLeft} days)</span> : <span className="text-gray-400 ml-1 text-xs">(Passed)</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 pl-2">
                      <div className="text-right hidden sm:block mr-4">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{symbol}{sub.price.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{sub.currency}</p>
                      </div>
                      <div className="flex space-x-1">
                         {/* Mark Paid Button */}
                         <button
                          onClick={() => handleMarkAsPaid(sub)}
                          className="text-gray-300 hover:text-green-600 dark:text-slate-600 dark:hover:text-green-400 transition-colors p-2 rounded-full hover:bg-green-50 dark:hover:bg-slate-700"
                          title="Mark as Paid"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>

                         {/* Credential Vault Button */}
                         <button 
                          onClick={() => openVault(sub)}
                          className={`transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 ${hasCredentials ? 'text-amber-500 hover:text-amber-600' : 'text-gray-300 hover:text-gray-400 dark:text-slate-600 dark:hover:text-slate-500'}`}
                          title="View Credentials"
                        >
                          <Key className="w-5 h-5" />
                        </button>

                        <button onClick={() => openEditModal(sub)} className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(sub.id)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (activeTab === 'dashboard') return renderDashboard();
    if (activeTab === 'analytics') return <Analytics subscriptions={subscriptions} />;
    if (activeTab === 'history') return <HistoryView subscriptions={subscriptions} />;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200 font-sans">
      {/* Navbar */}
      <nav className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-30 transition-colors pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-md shadow-indigo-500/30">
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white leading-none">SubTrack</span>
                {hasApiKey && <span className="text-[0.6rem] text-indigo-600 dark:text-indigo-400 font-medium uppercase tracking-wider flex items-center gap-0.5"><Zap className="w-2 h-2" fill="currentColor"/> AI Enabled</span>}
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Install App Button (Desktop) */}
              {deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="hidden sm:flex items-center px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Install App
                </button>
              )}

              {/* Install Icon (Mobile) */}
              {deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="sm:hidden p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors"
                  title="Install App"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}

              {/* Add Button (Mobile) - Moved to top navbar to replace FAB */}
              <button 
                 onClick={openAddModal}
                 className="sm:hidden p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors"
               >
                 <Plus className="w-6 h-6" />
              </button>

               <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full focus:outline-none transition-colors touch-manipulation"
                aria-label="Toggle Dark Mode"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <Button onClick={openAddModal} className="hidden sm:flex">
                <Plus className="w-4 h-4 mr-2" />
                <span>Add</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 pb-24 sm:pb-6">
        {/* Tabs - Desktop Only */}
        <div className="hidden sm:block mb-8 border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
          <nav className="-mb-px flex space-x-8 min-w-full">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`${
                activeTab === 'dashboard'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors touch-manipulation`}
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`${
                activeTab === 'analytics'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors touch-manipulation`}
            >
              <ChartIcon className="w-4 h-4 mr-2" />
              Analytics & AI
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors touch-manipulation`}
            >
              <HistoryIcon className="w-4 h-4 mr-2" />
              Payment History
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Bottom Tab Bar (Apple Style) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-t border-gray-200 dark:border-slate-800 pb-safe transition-all duration-300">
        <div className="flex justify-around items-center h-16 px-2">
           <button 
             onClick={() => setActiveTab('dashboard')} 
             className="flex-1 flex flex-col items-center justify-center py-1 group active:scale-95 transition-transform"
           >
              <div className={`p-1 rounded-xl transition-colors`}>
                  <LayoutDashboard className={`w-6 h-6 ${activeTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400 fill-indigo-100/20 dark:fill-indigo-900/20' : 'text-gray-400 dark:text-slate-500'}`} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-medium mt-0.5 ${activeTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'}`}>
                  Dashboard
              </span>
           </button>
           
           <button 
             onClick={() => setActiveTab('analytics')} 
             className="flex-1 flex flex-col items-center justify-center py-1 group active:scale-95 transition-transform"
           >
              <div className={`p-1 rounded-xl transition-colors`}>
                  <ChartIcon className={`w-6 h-6 ${activeTab === 'analytics' ? 'text-indigo-600 dark:text-indigo-400 fill-indigo-100/20 dark:fill-indigo-900/20' : 'text-gray-400 dark:text-slate-500'}`} strokeWidth={activeTab === 'analytics' ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-medium mt-0.5 ${activeTab === 'analytics' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'}`}>
                  Analytics
              </span>
           </button>

           <button 
             onClick={() => setActiveTab('history')} 
             className="flex-1 flex flex-col items-center justify-center py-1 group active:scale-95 transition-transform"
           >
              <div className={`p-1 rounded-xl transition-colors`}>
                  <HistoryIcon className={`w-6 h-6 ${activeTab === 'history' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'}`} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-medium mt-0.5 ${activeTab === 'history' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'}`}>
                  History
              </span>
           </button>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSub ? "Edit Subscription" : "New Subscription"}
      >
        <SubscriptionForm
          initialData={editingSub}
          onSubmit={editingSub ? handleEditSubscription : handleAddSubscription}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Credentials Display Modal */}
      <Modal
        isOpen={isCredentialsModalOpen}
        onClose={() => setIsCredentialsModalOpen(false)}
        title=""
      >
        {vaultTargetSub && (
          <CredentialsModal 
            subscription={vaultTargetSub} 
            onClose={() => setIsCredentialsModalOpen(false)} 
          />
        )}
      </Modal>

      {/* Payment Reminder Modal */}
      <Modal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        title="Upcoming Payments"
      >
        <div className="space-y-4">
           <div className="flex items-center space-x-3 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800/30">
             <Bell className="text-amber-600 dark:text-amber-400 w-6 h-6" />
             <p className="text-sm text-amber-800 dark:text-amber-200">You have payments due within the next 3 days.</p>
           </div>
           <ul className="divide-y divide-gray-100 dark:divide-slate-700 max-h-60 overflow-y-auto">
             {upcomingSubs.map(sub => (
               <li key={sub.id} className="py-3 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-gray-100 dark:bg-slate-600 rounded-full overflow-hidden">
                     {sub.logoUrl && <img src={sub.logoUrl} alt="" className="w-full h-full" />}
                   </div>
                   <div>
                     <p className="font-medium text-gray-900 dark:text-white">{sub.name}</p>
                     <p className="text-xs text-gray-500 dark:text-slate-400">Due: {new Date(sub.nextPaymentDate).toLocaleDateString()}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-white mr-2">{CURRENCY_SYMBOLS[sub.currency]}{sub.price}</span>
                    <button
                          onClick={() => {
                            handleMarkAsPaid(sub);
                          }}
                          className="text-gray-300 hover:text-green-600 dark:text-slate-600 dark:hover:text-green-400 transition-colors p-1 rounded-full"
                          title="Mark as Paid"
                        >
                          <CheckCircle className="w-5 h-5" />
                    </button>
                 </div>
               </li>
             ))}
           </ul>
           <div className="mt-4 flex justify-end">
             <Button onClick={() => setIsReminderOpen(false)}>Got it</Button>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;
