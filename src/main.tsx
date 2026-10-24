import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ArcPictureInPictureWindow } from './components/ArcPictureInPictureWindow';

const isPiP = typeof window !== 'undefined' && window.location.search.includes('pip=1');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {isPiP ? <ArcPictureInPictureWindow /> : <App />}
  </React.StrictMode>
);
