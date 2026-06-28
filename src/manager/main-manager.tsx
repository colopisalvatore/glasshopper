import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { connect } from '@/lib/haConnection';
import { ManagerApp } from './ManagerApp';
import './manager.css';

void connect();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ManagerApp />
  </StrictMode>,
);
