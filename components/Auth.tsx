import React, { useState } from 'react';
import { User } from '../types';
import Button from './Button';
import { storageService } from '../services/storageService';
import { Lock, Mail, User as UserIcon, LogIn, Sun, Moon, AlertTriangle } from 'lucide-react';
import { auth, googleProvider, appleProvider, signInWithPopup, isConfigured } from '../services/firebase';
import { UserCredential } from 'firebase/auth';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Email/Password still uses local storage for simplicity in this demo, 
    // but could be switched to auth.createUserWithEmailAndPassword
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
        
        const newUser = { id: emailLower, email: emailLower, name, password, authType: 'email' as const };
        const success = storageService.saveUser(newUser);
        
        if (success) {
          // Auto login after register
          const safeUser = { id: emailLower, email: emailLower, name, hasVaultPin: false };
          storageService.setCurrentUser(safeUser);
          onLogin(safeUser);
        } else {
          setError('User with this email already exists');
        }
      }
      setLoading(false);
    }, 600);
  };

  const handleSocialLogin = async (providerName: 'google' | 'apple') => {
    if (!isConfigured || !auth) {
      setError("Real authentication is not configured. Please add your Firebase API keys in services/firebase.ts.");
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const provider = providerName === 'google' ? googleProvider : appleProvider;
      if (!provider) throw new Error("Provider not initialized");

      const result: UserCredential = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      
      // Transform Firebase user to App user
      const appUser: User = {
        id: fbUser.email || fbUser.uid,
        email: fbUser.email || `user_${fbUser.uid}@anon.com`,
        name: fbUser.displayName || 'User',
        hasVaultPin: false // Will be checked/updated by storageService logic if exists
      };

      // Check if this user already has data in local storage, or init them
      // We mix Real Auth with Local Data Storage for this architecture
      const existingUsers = storageService.getUsers();
      
      // Note: We don't store social passwords locally, just the user reference
      if (!existingUsers[appUser.email]) {
        storageService.saveUser({
           ...appUser,
           authType: providerName
        });
      }

      // Set session
      storageService.setCurrentUser(appUser);
      onLogin(appUser);

    } catch (err: any) {
      console.error("Auth Error:", err);
      // Friendly error messages
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled.');
      } else if (err.code === 'auth/configuration-not-found') {
        setError('Authentication not enabled in Firebase Console.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized in Firebase Console.');
      } else {
        setError(err.message || 'Failed to login with provider.');
      }
    } finally {
      setLoading(false);
    }
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
        
        {!isConfigured && (
           <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-4 mb-4 rounded-r-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-amber-700 dark:text-amber-200">
                  To enable real Google/Apple login, please update <code>services/firebase.ts</code> with your API keys.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSocialLogin('google')}
              type="button"
              disabled={loading}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm bg-white dark:bg-slate-700 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>

            <button
              onClick={() => handleSocialLogin('apple')}
              type="button"
              disabled={loading}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm bg-white dark:bg-slate-700 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5 mr-2 dark:fill-white fill-black" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.62 4.75-1.44.98.09 2.8.49 3.79 2.05-.03.01-2.42 1.46-2.37 4.35.05 3.41 3.05 4.63 3.07 4.64-.02.07-.47 1.66-1.32 2.63zM13 3.5c.52-2.17 3.12-2.84 3.12-2.84s.23 2.25-1.69 4.32c-1.6 1.72-3.28 1.46-3.28 1.46s-.18-2.2 1.85-2.94z" />
              </svg>
              Apple
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400">Or continue with email</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
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
              <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-900/30">
                {error}
              </div>
            )}

            <div>
              <Button className="w-full h-12" type="submit" loading={loading}>
                {isLogin ? 'Sign in' : 'Create account'}
              </Button>
            </div>
          </form>
        </div>
        
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