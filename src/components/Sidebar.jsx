import { useState } from 'react';
import { Target, Clock, CheckCircle2, Circle, XCircle, Plus, StopCircle, GripVertical, Trash2, Edit2, Download, Upload } from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import { useStore } from '../store/useStore';

export default function Sidebar({ hideSettings = false, isMobileView = false }) {
  const { 
    tasks, addTask, toggleTask, deleteTask, editTask, reorderTasks,
    timeLeft, timerActive, setTimerActive, setTimeLeft,
    addMessage, punishScore
  } = useStore();

  const [taskInput, setTaskInput] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editInput, setEditInput] = useState('');

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

  const setPresetTimer = (mins) => {
    setTimeLeft(mins * 60);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    addTask(taskInput.trim());
    setTaskInput('');
  };

  const submitEdit = (id) => {
    if (editInput.trim()) {
      editTask(id, editInput.trim());
    }
    setEditingId(null);
  };

  const exportData = () => {
    const dataStr = localStorage.getItem('mission-control-storage');
    if (!dataStr) return;
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mission-control-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (json.state) {
          localStorage.setItem('mission-control-storage', JSON.stringify(json));
          window.location.reload();
        }
      } catch (err) {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  // Timer SVG Logic
  // Assuming a max standard session of 60 mins for calculation, or just a dynamic total
  // Since we don't store totalTime, we'll pulse the ring.
  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  return (
    <motion.div 
      className="sidebar"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="panel timer-panel">
        <h2><Clock size={20} /> GRIND TIMER</h2>
        
        <div className="timer-ring-container">
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle 
              cx="90" cy="90" r={radius} 
              fill="none" 
              stroke="rgba(255,255,255,0.05)" 
              strokeWidth="6" 
            />
            {timerActive && (
              <motion.circle 
                cx="90" cy="90" r={radius} 
                fill="none" 
                stroke="var(--accent)" 
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset="0"
                strokeLinecap="round"
                transform="rotate(-90 90 90)"
                animate={{ strokeDashoffset: [0, circumference] }}
                transition={{ duration: timeLeft > 0 ? timeLeft : 0, ease: "linear" }}
              />
            )}
          </svg>
          <div className="timer-text-overlay">
            {formatTime(timeLeft)}
          </div>
        </div>
        
        {!timerActive ? (
          <div style={{ width: '100%' }}>
            <div className="preset-timers">
              <button className="preset-btn" onClick={() => setPresetTimer(15)}>15m</button>
              <button className="preset-btn" onClick={() => setPresetTimer(30)}>30m</button>
              <button className="preset-btn" onClick={() => setPresetTimer(60)}>60m</button>
            </div>
            <button className="btn btn-start" onClick={handleStartTimer} disabled={timeLeft === 0}>
              {timeLeft === 0 ? "Awaiting Orders..." : "Start Grind"}
            </button>
          </div>
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
            aria-label="New mission"
          />
          <button type="submit" disabled={!taskInput.trim()} aria-label="Add mission">
            <Plus size={20}/>
          </button>
        </form>
        
        {tasks.length === 0 ? (
          <div className="empty-state">
            <Target size={48} />
            <p>No missions set. Get to work.</p>
          </div>
        ) : (
          <Reorder.Group axis="y" values={tasks} onReorder={reorderTasks} className="task-list">
            {tasks.map(t => (
              <Reorder.Item key={t.id} value={t} className={`task-item ${t.done ? 'done' : ''}`}>
                <div className="drag-handle" aria-label="Drag to reorder"><GripVertical size={16} /></div>
                <div className="task-content" onClick={() => toggleTask(t.id)}>
                  {t.done ? <CheckCircle2 size={18} className="icon-done"/> : <Circle size={18} className="icon-pending"/>}
                  {editingId === t.id ? (
                    <input 
                      type="text" 
                      value={editInput}
                      onChange={e => setEditInput(e.target.value)}
                      onBlur={() => submitEdit(t.id)}
                      onKeyDown={e => e.key === 'Enter' && submitEdit(t.id)}
                      autoFocus
                      className="edit-input"
                      onClick={e => e.stopPropagation()}
                      aria-label="Edit mission"
                    />
                  ) : (
                    <span>{t.text}</span>
                  )}
                </div>
                <div className="task-actions">
                  <button onClick={() => { setEditingId(t.id); setEditInput(t.text); }} aria-label="Edit"><Edit2 size={14}/></button>
                  <button onClick={() => deleteTask(t.id)} className="text-red" aria-label="Delete"><Trash2 size={14}/></button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>

      {!hideSettings && (
        <div className="panel settings-panel">
          <h2>DATA SYNC</h2>
          <div className="sync-controls">
            <button className="btn btn-small btn-outline" style={{flex:1}} onClick={exportData} aria-label="Backup Data">
              <Download size={14} /> Backup
            </button>
            <label className="btn btn-small btn-outline" style={{flex:1, display: 'flex', justifyContent: 'center', cursor: 'pointer'}} aria-label="Restore Data">
              <Upload size={14} /> Restore
              <input type="file" accept=".json" onChange={importData} style={{display:'none'}} />
            </label>
          </div>
        </div>
      )}
    </motion.div>
  );
}
