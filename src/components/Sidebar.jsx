import { useState } from 'react';
import { Target, Clock, CheckCircle2, XCircle, Plus, StopCircle, GripVertical, Trash2, Edit2, Download, Upload } from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import { useStore } from '../store/useStore';

export default function Sidebar() {
  const { 
    tasks, addTask, toggleTask, deleteTask, editTask, reorderTasks,
    timeLeft, timerActive, setTimerActive, setTimeLeft,
    addMessage, punishScore
  } = useStore();

  const [taskInput, setTaskInput] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editInput, setEditInput] = useState('');
  
  const [manualTime, setManualTime] = useState('');

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

  const handleManualTimer = (e) => {
    e.preventDefault();
    const mins = parseInt(manualTime, 10);
    if (!isNaN(mins) && mins > 0) {
      setTimeLeft(mins * 60);
      setManualTime('');
    }
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
          <div className="timer-controls">
            <button className="btn btn-start mb-2" onClick={handleStartTimer} disabled={timeLeft === 0}>
              {timeLeft === 0 ? "Awaiting Orders..." : "Start Grind"}
            </button>
            <form onSubmit={handleManualTimer} className="manual-timer-form">
              <input 
                type="number" 
                placeholder="Mins" 
                value={manualTime} 
                onChange={e => setManualTime(e.target.value)} 
                min="1"
                className="input-small"
              />
              <button type="submit" className="btn-small">Set</button>
            </form>
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
          />
          <button type="submit" disabled={!taskInput.trim()}><Plus size={20}/></button>
        </form>
        
        {tasks.length === 0 ? (
          <div className="empty">No missions set. Are you slacking?</div>
        ) : (
          <Reorder.Group axis="y" values={tasks} onReorder={reorderTasks} className="task-list">
            {tasks.map(t => (
              <Reorder.Item key={t.id} value={t} className={`task-item ${t.done ? 'done' : ''}`}>
                <div className="drag-handle"><GripVertical size={16} /></div>
                <div className="task-content" onClick={() => toggleTask(t.id)}>
                  {t.done ? <CheckCircle2 size={18} className="icon-done"/> : <XCircle size={18} className="icon-pending"/>}
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
                    />
                  ) : (
                    <span>{t.text}</span>
                  )}
                </div>
                <div className="task-actions">
                  <button onClick={() => { setEditingId(t.id); setEditInput(t.text); }}><Edit2 size={14}/></button>
                  <button onClick={() => deleteTask(t.id)} className="text-red"><Trash2 size={14}/></button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>

      <div className="panel settings-panel">
        <h2>DATA SYNC</h2>
        <div className="sync-controls">
          <button className="btn btn-small btn-outline" onClick={exportData}>
            <Download size={14} /> Backup
          </button>
          <label className="btn btn-small btn-outline">
            <Upload size={14} /> Restore
            <input type="file" accept=".json" onChange={importData} style={{display:'none'}} />
          </label>
        </div>
      </div>
    </motion.div>
  );
}
