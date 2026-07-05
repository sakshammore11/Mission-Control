import { useState, useEffect, useRef } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, MessageSquare, ListTodo, Volume2, VolumeX } from 'lucide-react';
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
  const [view, setView] = useState('chat'); // 'chat', 'dashboard', 'tasks'
  const [isMuted, setIsMuted] = useState(false);
  
  const timerActive = useStore(state => state.timerActive);
  const timeLeft = useStore(state => state.timeLeft);
  const setTimerActive = useStore(state => state.setTimerActive);
  const decrementTimer = useStore(state => state.decrementTimer);
  const incrementGrindSessions = useStore(state => state.incrementGrindSessions);
  const checkStreak = useStore(state => state.checkStreak);
  const punishmentTriggered = useStore(state => state.punishmentTriggered);
  
  const workerRef = useRef(null);
  const wakeLockRef = useRef(null);

  useEffect(() => {
    checkStreak();
  }, [checkStreak]);

  // Command Palette Shortcut (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setView('chat');
        setTimeout(() => {
          const input = document.querySelector('.input-field');
          if (input) input.focus();
        }, 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Web Worker Timer Logic & Wake Lock
  useEffect(() => {
    if (timerActive) {
      if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen')
          .then(lock => { wakeLockRef.current = lock; })
          .catch(err => console.error("Wake Lock error:", err));
      }

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
      if (!isMuted) playStrictAlarm();
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 500]); // Haptic
      setTimerActive(false);
      incrementGrindSessions();
    }
    
    if (timerActive && timeLeft > 0) {
      const m = Math.floor(timeLeft / 60);
      const s = timeLeft % 60;
      document.title = `[${m}:${s.toString().padStart(2, '0')}] Grind Active`;
    } else {
      document.title = 'Mission Control';
    }
  }, [timeLeft, timerActive, setTimerActive, incrementGrindSessions, isMuted]);

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>MISSION CONTROL</h1>
            <p>No Excuses. Only Results. <span className="hide-mobile">(Cmd+K)</span></p>
          </div>
          
          <div className="header-controls" style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="icon-btn" 
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? "Unmute Alarm" : "Mute Alarm"}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div className="nav-controls">
              <button 
                className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
                onClick={() => setView('dashboard')}
                aria-label="Dashboard"
              >
                <LayoutDashboard size={18} /> Analytics
              </button>
              <button 
                className={`nav-btn ${view === 'chat' ? 'active' : ''}`}
                onClick={() => setView('chat')}
                aria-label="Chat"
              >
                <MessageSquare size={18} /> Enforcer
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="main-layout">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>

        <div className="content-area">
          <AnimatePresence mode="wait">
            {view === 'dashboard' && <Dashboard key="dashboard" />}
            {view === 'chat' && <Chat key="chat" />}
            {view === 'tasks' && (
              <div className="dashboard-container" key="tasks">
                <Sidebar hideSettings={true} isMobileView={true} />
              </div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {punishmentTriggered && (
            <motion.div
              className="floating-punishment"
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1.2 }}
              exit={{ opacity: 0, y: -50, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              -25
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="bottom-tab-bar">
        <button 
          className={`tab-item ${view === 'dashboard' ? 'active' : ''}`} 
          onClick={() => setView('dashboard')}
          aria-label="Dashboard"
        >
          <LayoutDashboard size={22} />
          <span>Analytics</span>
        </button>
        <button 
          className={`tab-item ${view === 'chat' ? 'active' : ''}`} 
          onClick={() => setView('chat')}
          aria-label="Chat"
        >
          <MessageSquare size={22} />
          <span>Enforcer</span>
        </button>
        <button 
          className={`tab-item ${view === 'tasks' ? 'active' : ''}`} 
          onClick={() => setView('tasks')}
          aria-label="Tasks"
        >
          <ListTodo size={22} />
          <span>Missions</span>
        </button>
      </nav>
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
