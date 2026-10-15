import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import App from './App.jsx';
import { DataProvider } from './context/DataContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import SetupRequired from './components/layout/SetupRequired.jsx';
import { isSupabaseConfigured } from './lib/supabase.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isSupabaseConfigured ? (
      <BrowserRouter>
        {/* reducedMotion="user" disables transform animations for users who prefer reduced motion */}
        <MotionConfig reducedMotion="user">
          <ToastProvider>
            <DataProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </DataProvider>
          </ToastProvider>
        </MotionConfig>
      </BrowserRouter>
    ) : (
      <SetupRequired />
    )}
  </React.StrictMode>
);
