import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Target, Clock, CheckCircle2, XCircle, Send, Plus, StopCircle } from 'lucide-react';

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

function App() {
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'NO EXCUSES. What do you need to get done today? Tell me your tasks and I will give you a deadline.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState('');

  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      setMessages(prev => [...prev, { role: 'bot', content: 'TIME IS UP! Drop everything. Did you finish the task? Mark it done and ask for the next one.' }]);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

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
      setMessages(prev => [...prev, { role: 'bot', content: 'You have no time set! Tell me what task you are doing, and I will assign you a timer.' }]);
    }
  };

  const handleGiveUpTimer = () => {
    setTimerActive(false);
    setTimeLeft(0);
    setMessages(prev => [...prev, { role: 'bot', content: 'YOU GAVE UP? Weakness is a choice. You better have a good excuse. Ask for another task when you are ready to be serious.' }]);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: taskInput.trim(), done: false }]);
    setTaskInput('');
  };

  const handleToggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const activeTasks = tasks.filter(t => !t.done).map(t => t.text).join(', ');
      
      let systemPrompt = `You are a strict, no-nonsense disciplinarian coach. 
Your goals:
1. Answer ANY question the user asks you (be helpful, but keep the strict tone).
2. Make the user disciplined, focused, and hardworking. Give tough love.
3. When the user discusses tasks or work, you MUST assign them a strict deadline or time limit.
4. To automatically set a timer for the user, include the exact text [TIMER: X] anywhere in your response, where X is the number of minutes (e.g., [TIMER: 30], [TIMER: 15], [TIMER: 120]).
Always use markdown formatting like bold text for emphasis.`;
      
      if (activeTasks) {
        systemPrompt += `\nThe user currently has these active tasks: ${activeTasks}. Remind them to finish them.`;
      }
      if (timerActive) {
        systemPrompt += `\nThe user is currently in a Grind Session with ${Math.ceil(timeLeft/60)} minutes left. Tell them to stay focused on the timer!`;
      }

      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
          role: m.role === 'bot' ? 'assistant' : 'user',
          content: m.content
        })),
        { role: 'user', content: userMsg }
      ];

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'poolside/laguna-xs-2.1:free',
          messages: apiMessages
        })
      });

      const data = await response.json();
      
      if (data && data.choices && data.choices.length > 0) {
        let botResponse = data.choices[0].message.content;
        
        // Parse for [TIMER: X]
        const timerMatch = botResponse.match(/\[TIMER:\s*(\d+)\]/i);
        if (timerMatch && timerMatch[1]) {
          const minutes = parseInt(timerMatch[1], 10);
          if (!isNaN(minutes)) {
            setTimeLeft(minutes * 60);
            setTimerActive(true); // Auto-start the timer!
            // Clean up the text
            botResponse = botResponse.replace(/\[TIMER:\s*\d+\]/gi, `*(Timer set for ${minutes} minutes)*`);
          }
        }

        setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', content: 'STOP WASTING TIME AND GET BACK TO WORK! (Error parsing response)' }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'bot', content: 'NO EXCUSES! (Network Error)' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>MISSION CONTROL</h1>
        <p>No Excuses. Only Results.</p>
      </div>

      <div className="main-layout">
        
        <div className="sidebar">
          <div className="panel timer-panel">
            <h2><Clock size={20} /> GRIND TIMER</h2>
            <div className="timer-display">{formatTime(timeLeft)}</div>
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
                <li key={t.id} className={t.done ? 'done' : ''} onClick={() => handleToggleTask(t.id)}>
                   {t.done ? <CheckCircle2 size={18} className="icon-done"/> : <XCircle size={18} className="icon-pending"/>}
                   <span>{t.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="chat-section">
          <div className="chat-container" ref={chatRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                {msg.role === 'bot' ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            ))}
            {loading && (
              <div className="message bot">
                <div className="loading-dots">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            )}
          </div>

          <div className="input-area">
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ask me anything..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
              autoFocus
            />
            <button 
              className="send-btn" 
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              <Send size={18} /> Send
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
