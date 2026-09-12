import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { NextKidApp } from './NextKidApp';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NextKidApp scenario="game-running" />
  </StrictMode>,
);
