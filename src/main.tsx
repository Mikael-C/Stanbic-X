import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { Web3Provider } from './context/Web3Context';
import { ToastProvider } from './components/Common/Toast';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <Web3Provider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </Web3Provider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
