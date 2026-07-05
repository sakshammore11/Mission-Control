import { useState } from 'react';
import { Target, Clock, CheckCircle2, XCircle, Plus, StopCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

export default function Sidebar() {
  const { 
    tasks, addTask, toggleTask, 
    timeLeft, timerActive, setTimerActive, setTimeLeft,
    addMessage, punishScore
  } = useStore();

  const [taskInput, setTaskInput] = useState('');

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    if (timeLeft > 0) {
      setTimerActive(true);
    } else {
      addMessage({ role: 'bot', content: 'You have no time set! Tell me what task you are doing, and I will assign you a timer.' });
    }
  };

  const handleGiveUpTimer = () => {
    setTimerActive(false);
    setTimeLeft(0);
    punishScore();
    addMessage({ role: 'bot', content: 'YOU GAVE UP? Weakness is a choice. You better have a good excuse. I have deducted 25 points from your Discipline Score.' });
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    addTask(taskInput.trim());
    setTaskInput('');
  };

  return (
    <motion.div 
      className="sidebar"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="panel timer-panel">
        <h2><Clock size={20} /> GRIND TIMER</h2>
        <motion.div 
          className="timer-display"
          animate={{ scale: timerActive ? [1, 1.05, 1] : 1 }}
          transition={{ repeat: timerActive ? Infinity : 0, duration: 2 }}
        >
          {formatTime(timeLeft)}
        </motion.div>
        
        {!timerActive ? (
          <button className="btn btn-start" onClick={handleStartTimer} disabled={timeLeft === 0 && !timerActive}>
            {timeLeft === 0 ? "Awaiting Orders..." : "Start Grind"}
          </button>
        ) : (
          <button className="btn btn-give-up" onClick={handleGiveUpTimer}>
            <StopCircle size={18} /> I Give Up
          </button>
        )}
      </div>

      <div className="panel tasks-panel">
        <h2><Target size={20} /> DAILY MISSIONS</h2>
        <form onSubmit={handleAddTask} className="task-form">
          <input 
            type="text" 
            placeholder="New mission..." 
            value={taskInput} 
            onChange={e => setTaskInput(e.target.value)} 
          />
          <button type="submit" disabled={!taskInput.trim()}><Plus size={20}/></button>
        </form>
        <ul className="task-list">
          {tasks.length === 0 ? <li className="empty">No missions set. Are you slacking?</li> : null}
          {tasks.map(t => (
            <motion.li 
              key={t.id} 
              className={t.done ? 'done' : ''} 
              onClick={() => toggleTask(t.id)}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
               {t.done ? <CheckCircle2 size={18} className="icon-done"/> : <XCircle size={18} className="icon-pending"/>}
               <span>{t.text}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
