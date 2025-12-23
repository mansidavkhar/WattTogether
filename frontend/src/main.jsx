import './polyfills.js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { Provider } from 'react-redux';
import { store } from './store';
import PrivyAuthProvider from './context/PrivyAuthProvider.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <PrivyAuthProvider>
        <App />
      </PrivyAuthProvider>
    </Provider>
  </StrictMode>
);
