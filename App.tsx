import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, CreditCard, Calendar, LayoutDashboard, PieChart as ChartIcon, LogOut, Bell, Moon, Sun } from 'lucide-react';
import { Subscription, CATEGORY_COLORS, BillingCycle, User, Currency, CURRENCY_SYMBOLS } from './types';
import Modal from './components/Modal';
import SubscriptionForm from './components/SubscriptionForm';
import Analytics from './components/Analytics';
import Button from './components/Button';
import Auth from './components/Auth';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => storageService.getCurrentUser());

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('subtrack_theme') === 'dark' || 
             (!localStorage.getItem('subtrack_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [upcomingSubs, setUpcomingSubs] = useState<Subscription[]>([]);

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

  // Effect to load data when user changes
  useEffect(() => {
    if (user) {
      const loadedSubs = storageService.getSubscriptions(user.id);
      setSubscriptions(loadedSubs);

      // Check for upcoming payments (due within 3 days)
      const today = new Date();
      const upcoming = loadedSubs.filter(sub => {
        const due = new Date(sub.nextPaymentDate);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 3;
      });

      if (upcoming.length > 0) {
        setUpcomingSubs(upcoming);
        setIsReminderOpen(true);
      }
    } else {
      setSubscriptions([]);
    }
  }, [user]);

  // Persist to storageService whenever subscriptions change
  useEffect(() => {
    if (user) {
      storageService.saveSubscriptions(user.id, subscriptions);
    }
  }, [subscriptions, user]);

  const handleLogout = () => {
    storageService.setCurrentUser(null);
    setUser(null);
    setSubscriptions([]);
  };

  const handleAddSubscription = (data: Omit<Subscription, 'id'>) => {
    const newSub: Subscription = {
      ...data,
      id: crypto.randomUUID(),
    };
    setSubscriptions([...subscriptions, newSub]);
    setIsModalOpen(false);
  };

  const handleEditSubscription = (data: Omit<Subscription, 'id'>) => {
    if (!editingSub) return;
    const updatedSubs = subscriptions.map(s => s.id === editingSub.id ? { ...data, id: editingSub.id } : s);
    setSubscriptions(updatedSubs);
    setEditingSub(null);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this subscription?')) {
      setSubscriptions(subscriptions.filter(s => s.id !== id));
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

  const getDaysUntilDue = (dateStr: string) => {
    const today = new Date();
    const due = new Date(dateStr);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

  if (!user) {
    return <Auth onLogin={setUser} toggleTheme={() => setDarkMode(!darkMode)} isDarkMode={darkMode} />;
  }

  const renderDashboard = () => {
    const totalUSD = calculateTotalMonthly(Currency.USD);
    const totalEUR = calculateTotalMonthly(Currency.EUR);
    const totalTRY = calculateTotalMonthly(Currency.TRY);

    return (
      <div className="space-y-6 pb-24">
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
          <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Your Subscriptions</h3>
            <Button size="sm" onClick={openAddModal} className="sm:hidden h-10 w-10 rounded-full p-0 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          <ul role="list" className="divide-y divide-gray-200 dark:divide-slate-700">
            {subscriptions.length === 0 && (
              <li className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                No subscriptions yet. Add one to get started!
              </li>
            )}
            {subscriptions.map((sub) => {
              const daysLeft = getDaysUntilDue(sub.nextPaymentDate);
              const categoryColor = CATEGORY_COLORS[sub.category] || '#9ca3af';
              const symbol = CURRENCY_SYMBOLS[sub.currency];
              
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200 font-sans pb-safe">
      {/* Navbar */}
      <nav className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-30 transition-colors pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-md shadow-indigo-500/30">
                <CreditCard className="w-6 h-6" />
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">SubTrack</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
               <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full focus:outline-none transition-colors touch-manipulation"
                aria-label="Toggle Dark Mode"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-200">{user.name}</span>
                <span className="text-xs text-gray-400 dark:text-slate-500">{user.email}</span>
              </div>
              <Button onClick={openAddModal} className="hidden sm:flex">
                <Plus className="w-4 h-4 mr-2" />
                <span>Add</span>
              </Button>
              <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 p-2 transition-colors touch-manipulation">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
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
          </nav>
        </div>

        {/* Content */}
        <div className="animate-fade-in">
          {activeTab === 'dashboard' ? renderDashboard() : <Analytics subscriptions={subscriptions} />}
        </div>
      </main>

      {/* Floating Action Button for Mobile */}
      {activeTab === 'dashboard' && (
        <div className="fixed bottom-6 right-6 z-40 sm:hidden pb-safe pr-safe">
          <Button 
            onClick={openAddModal} 
            className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center p-0 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-8 h-8" />
          </Button>
        </div>
      )}

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
                 <span className="font-bold text-gray-900 dark:text-white">{CURRENCY_SYMBOLS[sub.currency]}{sub.price}</span>
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