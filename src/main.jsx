import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import App from './App.jsx';
import './index.css';

/* ============================================================
   QUERY CLIENT — sensible defaults for CRM app
   ============================================================ */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed queries twice (login/network flake)
      retry: 2,
      // Data considered fresh for 30s — avoids refetch on every nav
      staleTime: 30 * 1000,
      // Don't refetch on window focus (CRM has realtime socket updates)
      refetchOnWindowFocus: false,
      // Refetch on mount only if stale (default behavior, explicit here)
      refetchOnMount: true,
      // Keep unused query data cached for 5 minutes
      gcTime: 5 * 60 * 1000,
    },
    mutations: {
      // Only retry once for mutations (payments, deletes should not double-fire)
      retry: 1,
    },
  },
});

/* ============================================================
   ERROR BOUNDARY — catches render errors
   Prevents full app white screen on any component crash
   ============================================================ */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('App Error Boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
              <svg
                className="w-7 h-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Something went wrong
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-4">
              An unexpected error occurred. Please try reloading the page.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 font-semibold rounded-lg bg-indigo-600 text-white px-4 py-2.5 text-sm shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ============================================================
   ROOT RENDER
   ============================================================ */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <SocketProvider>
              <App />
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);