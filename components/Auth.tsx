import React, { useState } from 'react';
import { User } from '../types';
import Button from './Button';
import { storageService } from '../services/storageService';
import { Lock, Mail, User as UserIcon, LogIn, Sun, Moon } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const Auth: React.FC<AuthProps> = ({ onLogin, toggleTheme, isDarkMode }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Artificial delay for better UX
    setTimeout(() => {
      const emailLower = email.toLowerCase().trim();

      if (!emailLower || !password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      if (isLogin) {
        // Login Logic via Service
        const user = storageService.validateUser(emailLower, password);
        if (user) {
          storageService.setCurrentUser(user);
          onLogin(user);
        } else {
          setError('Invalid email or password');
        }
      } else {
        // Register Logic
        if (!name) {
          setError('Please enter your name');
          setLoading(false);
          return;
        }
        
        const newUser = { id: emailLower, email: emailLower, name, password };
        const success = storageService.saveUser(newUser);
        
        if (success) {
          // Auto login after register
          const safeUser = { id: emailLower, email: emailLower, name };
          storageService.setCurrentUser(safeUser);
          onLogin(safeUser);
        } else {
          setError('User with this email already exists');
        }
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors pt-safe pb-safe">
      <div className="absolute top-4 right-4 pt-safe pr-safe">
        <button
          onClick={toggleTheme}
          className="p-3 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-full transition-colors touch-manipulation"
        >
          {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
      </div>
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 transition-colors">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
             <LogIn className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            {isLogin ? 'Sign in' : 'Create account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
            {isLogin ? "Welcome back! Let's check your subscriptions." : "Start tracking your recurring payments today."}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {!isLogin && (
               <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <UserIcon className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-slate-600 placeholder-gray-500 dark:placeholder-slate-400 text-gray-900 dark:text-white dark:bg-slate-700 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 text-base transition-colors"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Mail className="h-5 w-5 text-gray-400 dark:text-slate-500" />
               </div>
              <input
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                className={`appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-slate-600 placeholder-gray-500 dark:placeholder-slate-400 text-gray-900 dark:text-white dark:bg-slate-700 ${isLogin ? 'rounded-t-md' : ''} focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 text-base transition-colors`}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Lock className="h-5 w-5 text-gray-400 dark:text-slate-500" />
               </div>
              <input
                type="password"
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-slate-600 placeholder-gray-500 dark:placeholder-slate-400 text-gray-900 dark:text-white dark:bg-slate-700 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 text-base transition-colors"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-900/30 animate-pulse">
              {error}
            </div>
          )}

          <div>
            <Button className="w-full h-12" type="submit" loading={loading}>
              {isLogin ? 'Sign in' : 'Create account'}
            </Button>
          </div>
        </form>
        
        <div className="text-center">
          <button 
            type="button"
            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium p-2"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setEmail('');
              setPassword('');
              setName('');
            }}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;