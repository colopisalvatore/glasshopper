import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { connect } from '@/lib/haConnection';
import { App } from './App';
import { DemoBanner } from './DemoBanner';
import './index.css';

// The host bootstraps the HA connection once; hooks read from it.
void connect();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DemoBanner probe={['sensor.temperature', 'sensor.humidity', 'sensor.co2', 'sensor.power']} />
    <App />
  </StrictMode>,
);
