import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';

// Initialize Sentry
console.log('Initializing Sentry with DSN:', process.env.REACT_APP_SENTRY_DSN ? 'SET' : 'NOT SET');

const dsn = process.env.REACT_APP_SENTRY_DSN;
if (!dsn) {
  console.error('❌ REACT_APP_SENTRY_DSN is not set!');
} else {
  console.log('✅ REACT_APP_SENTRY_DSN is configured');
  
  // Show first/last 10 chars for debugging without exposing full DSN
  console.log('DSN preview:', `${dsn.substring(0, 10)}...${dsn.substring(dsn.length - 10)}`);
  
  // Validate DSN format
  if (dsn.startsWith('https://') && dsn.includes('@') && dsn.includes('.ingest.sentry.io')) {
    console.log('✅ DSN format looks correct');
    
    // Test network connectivity to Sentry
    const sentryDomain = dsn.split('@')[1].split('/')[0];
    console.log('🌐 Testing connectivity to:', sentryDomain);
    
    fetch(`https://${sentryDomain}/api/0/health/`, { method: 'HEAD' })
      .then(() => console.log('✅ Network connectivity to Sentry OK'))
      .catch(err => console.error('❌ Network connectivity failed:', err));
      
  } else {
    console.error('❌ DSN format invalid. Expected: https://[key]@[org].ingest.sentry.io/[project]');
    console.error('❌ Got:', dsn);
  }
}

// Try minimal Sentry init first
try {
  Sentry.init({
    dsn: dsn,
    environment: 'production',
    debug: true,
    enabled: true,
    beforeSend(event) {
      console.log('🚀 Sentry beforeSend called:', event);
      console.log('🔍 DSN debug info:');
      console.log('   - DSN exists:', !!dsn);
      console.log('   - DSN length:', dsn?.length);
      console.log('   - Contains @:', dsn?.includes('@'));
      console.log('   - Contains ingest:', dsn?.includes('ingest'));
      console.log('   - Full DSN:', dsn); // Show full DSN for debugging
      
      if (dsn && dsn.includes('@')) {
        const parts = dsn.split('@');
        console.log('   - Parts after @:', parts[1]);
        const domain = parts[1]?.split('/')[0];
        console.log('   - Extracted domain:', domain);
      }
      
      return event;
    },
  });
  console.log('✅ Sentry.init completed without errors');
} catch (error) {
  console.error('❌ Sentry.init failed:', error);
}

console.log('Sentry initialization complete');

// Check if Sentry is properly configured
try {
  console.log('✅ Sentry client initialized');
} catch (error) {
  console.error('❌ Sentry client error:', error);
}

// Test Sentry immediately
setTimeout(() => {
  console.log('🧪 Testing Sentry connection...');
  Sentry.captureMessage('Sentry initialization test', 'info');
}, 1000);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<p>An error has occurred</p>}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();