import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, LayoutDashboard, MessageSquare } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import Dashboard from './components/Dashboard';
import { useStore } from './store/useStore';
import { playStrictAlarm } from './utils/audio';

function App() {
  const [view, setView] = useState('chat'); // 'chat' or 'dashboard'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { timerActive, timeLeft, setTimerActive, incrementGrindSessions } = useStore();

  // Handle global timer logic & audio
  useEffect(() => {
    if (timerActive && timeLeft === 0) {
      playStrictAlarm();
      setTimerActive(false);
      incrementGrindSessions();
    }
  }, [timeLeft, timerActive, setTimerActive, incrementGrindSessions]);

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <div>
            <h1>MISSION CONTROL</h1>
            <p>No Excuses. Only Results.</p>
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
        {/* Mobile menu wrapper for Sidebar */}
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

export default App;
