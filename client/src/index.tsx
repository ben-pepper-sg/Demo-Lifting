import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
// Error monitoring removed

// Global error handlers for better error reporting
window.addEventListener('error', (event) => {
  console.error('Global error caught:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', {
    reason: event.reason,
    promise: event.promise
  });
  
  // Prevent generic "Async operation failed" by providing more specific error
  if (event.reason && typeof event.reason === 'object') {
    if (event.reason.message === 'Async operation failed' || !event.reason.message) {
      event.reason.message = event.reason.message || 'Promise rejected without specific error message';
    }
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
// Create a custom error boundary that doesn't depend on Sentry
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Application error:', error, errorInfo);
    // Error logging removed
  }

  render() {
    if (this.state.hasError) {
      return <p>An error has occurred. Please refresh the page.</p>;
    }
    return this.props.children;
  }
}

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();