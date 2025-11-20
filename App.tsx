import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PieChart, 
  History as HistoryIcon, 
  Plus, 
  Sun, 
  Moon, 
  Key, 
  Trash2,
  CreditCard,
  TrendingUp,
  Calendar,
  Wallet
} from 'lucide-react';

import { User, Subscription, CURRENCY_SYMBOLS, CATEGORY_COLORS } from './types';
import { storageService } from './services/storageService';

import Analytics from './components/Analytics';
import HistoryView from './components/HistoryView';
import SubscriptionForm from './components/SubscriptionForm';
import VaultModal from './components/VaultModal';
import CredentialsModal from './components/CredentialsModal';
import Modal from './components/Modal';
import Button from './components/Button';

function App() {
  // Initialize directly with a default user, bypassing auth
  const [user, setUser] = useState<User | null>(() => {
    const userId = 'default_user';
    // Check if pin exists for this default user in local storage to set initial state correctly
    const hasPin = !!localStorage.getItem(`subtrack_vault_pin_${userId}`);
    return {
      id: userId,
      email: 'demo@subtrack.ai',
      name: 'Demo User',
      hasVaultPin: hasPin
    };
  });

  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [view, setView] = useState<'dashboard' | 'analytics' | 'history'>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Vault Logic State
  const [vaultTarget, setVaultTarget] = useState<Subscription | null>(null);
  const [isVaultPromptOpen, setIsVaultPromptOpen] = useState(false);
  const [unlockedSubscription, setUnlockedSubscription] = useState<Subscription | null>(null);

  // --- Initialization ---
  useEffect(() => {
    if (user) {
      loadUserData(user.id);
    }

    // Check system theme preference
    const darkModePreference = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(darkModePreference);
    
    setIsLoading(false);
  }, []);

  // --- Theme Effect ---
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const loadUserData = (userId: string) => {
    const subs = storageService.getSubscriptions(userId);
    setSubscriptions(subs);
  };

  const handleAddSubscription = (data: Omit<Subscription, 'id'>) => {
    if (!user) return;

    const newSub: Subscription = {
      ...data,
      id: crypto.randomUUID(),
    };
    
    const updatedSubs = [...subscriptions, newSub];
    setSubscriptions(updatedSubs);
    storageService.saveSubscriptions(user.id, updatedSubs);
    setIsAddModalOpen(false);
  };

  const handleDeleteSubscription = (id: string) => {
    if (!user) return;
    
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      const updatedSubs = subscriptions.filter(s => s.id !== id);
      setSubscriptions(updatedSubs);
      storageService.saveSubscriptions(user.id, updatedSubs);
    }
  };

  // Vault Handlers
  const handleOpenVault = (sub: Subscription) => {
    setVaultTarget(sub);
    setIsVaultPromptOpen(true);
  };

  const handleVaultSuccess = () => {
    setIsVaultPromptOpen(false);
    setUnlockedSubscription(vaultTarget);
    setVaultTarget(null);
    
    if (user && !user.hasVaultPin) {
      const updatedUser = { ...user, hasVaultPin: true };
      setUser(updatedUser);
      // Note: We don't strictly need to save the session for auth persistence anymore
    }
  };

  // Metrics Calculation
  const metrics = React.useMemo(() => {
    const monthly = subscriptions.reduce((acc, sub) => {
      let price = sub.price;
      if (sub.cycle === 'Yearly') price = sub.price / 12;
      if (sub.cycle === 'Weekly') price = sub.price * 4;
      return acc + price;
    }, 0);

    const yearly = monthly * 12;
    const active = subscriptions.length;
    
    return { monthly, yearly, active };
  }, [subscriptions]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300 pb-24 sm:pb-0 selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-gray-200 dark:border-slate-800 transition-colors duration-300 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 p-2 rounded-xl shadow-indigo-500/20 shadow-lg">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">SubTrack<span className="text-indigo-500">.</span></span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400 rounded-full transition-all duration-200"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Desktop Tabs */}
        <div className="hidden sm:flex items-center justify-between mb-8">
          <div className="flex space-x-1 p-1 bg-gray-100/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-slate-800">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'analytics', label: 'Analytics', icon: PieChart },
              { id: 'history', label: 'History', icon: HistoryIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  view === tab.id
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-gray-200 dark:ring-slate-700'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-200/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
          
          {view === 'dashboard' && (
            <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="shadow-lg shadow-indigo-500/20">
              <Plus className="w-4 h-4 mr-2" />
              Add Subscription
            </Button>
          )}
        </div>

        {view === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Main Metric */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-indigo-500/20">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 text-indigo-100 mb-1">
                    <Wallet className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Monthly Spend</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight">${metrics.monthly.toFixed(2)}</span>
                  </div>
                  <div className="mt-4 text-xs font-medium text-indigo-100 bg-white/10 w-fit px-2 py-1 rounded-md">
                     Your primary cost
                  </div>
                </div>
              </div>

              {/* Secondary Metrics */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
                 <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Yearly Est.</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    ${metrics.yearly.toFixed(2)}
                  </div>
                  <div className="mt-auto pt-4 text-xs text-gray-400 dark:text-slate-500">
                    Based on current active plans
                  </div>
              </div>

              <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
                 <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 mb-1">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Active Subs</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {metrics.active}
                  </div>
                  <div className="mt-auto pt-4 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <TrendingUp className="w-3 h-3" />
                    <span>Tracking active</span>
                  </div>
              </div>
            </div>

            {/* Subscription List */}
            {subscriptions.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {subscriptions.map((sub) => (
                  <div 
                    key={sub.id} 
                    className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-indigo-900/5 border border-gray-100 dark:border-slate-800 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 dark:bg-slate-800 flex-shrink-0 border border-gray-100 dark:border-slate-700 shadow-inner">
                          <img src={sub.logoUrl} alt={sub.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {sub.name}
                          </h3>
                          <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 mt-1 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: CATEGORY_COLORS[sub.category] }}></span>
                            {sub.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-end">
                      <div className="flex items-baseline gap-1 text-gray-900 dark:text-white">
                         <span className="text-2xl font-bold">{CURRENCY_SYMBOLS[sub.currency]}{sub.price}</span>
                         <span className="text-xs text-gray-500 dark:text-slate-500 font-medium uppercase">/ {sub.cycle}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800 mt-4">
                       <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-slate-500">Next Payment</span>
                          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{new Date(sub.nextPaymentDate).toLocaleDateString()}</span>
                       </div>
                       
                       <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleOpenVault(sub)}
                            className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                            title="View Credentials"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteSubscription(sub.id)}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                  </div>
                ))}
                
                {/* Add Button as last card */}
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="group flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl text-gray-400 dark:text-slate-500 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all duration-300 h-full min-h-[200px]"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Plus className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium">Add new subscription</span>
                </button>
              </div>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                  <CreditCard className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No subscriptions yet</h3>
                <p className="text-gray-500 dark:text-slate-400 max-w-xs mb-8">
                  Start tracking your recurring payments to get insights and control your spending.
                </p>
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Subscription
                </Button>
              </div>
            )}
          </div>
        )}

        {view === 'analytics' && <Analytics subscriptions={subscriptions} />}
        
        {view === 'history' && <HistoryView subscriptions={subscriptions} />}

      </main>

      {/* Mobile Tab Bar - Glassmorphism */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-slate-800 pb-safe z-50 supports-[backdrop-filter]:bg-white/60">
        <div className="grid grid-cols-3 h-16">
          {[
            { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
            { id: 'analytics', label: 'Analytics', icon: PieChart },
            { id: 'history', label: 'History', icon: HistoryIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id as any)}
              className={`relative flex flex-col items-center justify-center space-y-1 transition-colors ${
                view === tab.id 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
              }`}
            >
              {view === tab.id && (
                <div className="absolute top-0 w-12 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
              )}
              <tab.icon className={`w-6 h-6 ${view === tab.id ? 'animate-pulse-once' : ''}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Modals */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Subscription"
      >
        <SubscriptionForm 
          onSubmit={handleAddSubscription}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isVaultPromptOpen}
        onClose={() => setIsVaultPromptOpen(false)}
        title="Security Vault"
      >
        {user && (
          <VaultModal 
            user={user}
            onSuccess={handleVaultSuccess}
            onCancel={() => setIsVaultPromptOpen(false)}
          />
        )}
      </Modal>

      <Modal
        isOpen={!!unlockedSubscription}
        onClose={() => setUnlockedSubscription(null)}
        title="Stored Credentials"
      >
        {unlockedSubscription && (
          <CredentialsModal 
            subscription={unlockedSubscription}
            onClose={() => setUnlockedSubscription(null)}
          />
        )}
      </Modal>

    </div>
  );
}

export default App;