/**
 * @license
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 Efe Arabacı
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import { reportWebVitals } from '@/utils/reportWebVitals';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals((metric) => {
  console.log(metric);

  if (import.meta.env.PROD) {
    // analytics integration can be added here
  }
});
