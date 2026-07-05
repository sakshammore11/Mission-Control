import { useState, useEffect, useRef } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, LayoutDashboard, MessageSquare } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import Dashboard from './components/Dashboard';
import { useStore } from './store/useStore';
import { playStrictAlarm } from './utils/audio';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="error-screen">
      <h2>MISSION FAILED: SYSTEM CRASH</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary} className="btn btn-start">Reboot System</button>
    </div>
  );
}

function MainApp() {
  const [view, setView] = useState('chat');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const timerActive = useStore(state => state.timerActive);
  const timeLeft = useStore(state => state.timeLeft);
  const setTimerActive = useStore(state => state.setTimerActive);
  const decrementTimer = useStore(state => state.decrementTimer);
  const incrementGrindSessions = useStore(state => state.incrementGrindSessions);
  const checkStreak = useStore(state => state.checkStreak);
  
  const workerRef = useRef(null);
  const wakeLockRef = useRef(null);

  // Initialize analytics streak
  useEffect(() => {
    checkStreak();
  }, [checkStreak]);

  // Command Palette Shortcut (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector('.input-field');
        if (input) input.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Web Worker Timer Logic & Wake Lock
  useEffect(() => {
    if (timerActive) {
      // Request Wake Lock
      if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen')
          .then(lock => { wakeLockRef.current = lock; })
          .catch(err => console.error("Wake Lock error:", err));
      }

      // Start Web Worker Timer
      workerRef.current = new Worker('/timerWorker.js');
      workerRef.current.postMessage({ command: 'start' });
      workerRef.current.onmessage = (e) => {
        if (e.data === 'tick') {
          decrementTimer();
        }
      };
    } else {
      if (workerRef.current) {
        workerRef.current.postMessage({ command: 'stop' });
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(console.error);
        wakeLockRef.current = null;
      }
    }

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, [timerActive, decrementTimer]);

  // Timer Completion Logic
  useEffect(() => {
    if (timerActive && timeLeft === 0) {
      playStrictAlarm();
      setTimerActive(false);
      incrementGrindSessions();
    }
    
    // Update Document Title
    if (timerActive && timeLeft > 0) {
      const m = Math.floor(timeLeft / 60);
      const s = timeLeft % 60;
      document.title = `[${m}:${s.toString().padStart(2, '0')}] Grind Active`;
    } else {
      document.title = 'Mission Control';
    }
  }, [timeLeft, timerActive, setTimerActive, incrementGrindSessions]);

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <div>
            <h1>MISSION CONTROL</h1>
            <p>No Excuses. Only Results. (Cmd+K to focus)</p>
          </div>
          
          <div className="nav-controls">
            <button 
              className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
              onClick={() => setView('dashboard')}
            >
              <LayoutDashboard size={20} />
              <span className="hide-mobile">Analytics</span>
            </button>
            <button 
              className={`nav-btn ${view === 'chat' ? 'active' : ''}`}
              onClick={() => setView('chat')}
            >
              <MessageSquare size={20} />
              <span className="hide-mobile">Enforcer</span>
            </button>
            <button 
              className="mobile-menu-btn hide-desktop"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      <main className="main-layout">
        <div className={`sidebar-wrapper ${mobileMenuOpen ? 'open' : ''}`}>
          <Sidebar />
        </div>

        <div className="content-area">
          <AnimatePresence mode="wait">
            {view === 'dashboard' ? (
              <Dashboard key="dashboard" />
            ) : (
              <Chat key="chat" />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <MainApp />
    </ErrorBoundary>
  );
}
