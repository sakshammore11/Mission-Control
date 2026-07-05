import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

export default function Chat() {
  const messages = useStore(state => state.messages);
  const addMessage = useStore(state => state.addMessage);
  const tasks = useStore(state => state.tasks);
  const timerActive = useStore(state => state.timerActive);
  const timeLeft = useStore(state => state.timeLeft);
  const setTimeLeft = useStore(state => state.setTimeLeft);
  const setTimerActive = useStore(state => state.setTimerActive);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleMicClick = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setListening(true);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(input + transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    
    recognition.start();
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    addMessage({ role: 'user', content: userMsg });
    setLoading(true);

    try {
      const activeTasks = tasks.filter(t => !t.done).map(t => t.text).join(', ');
      
      const apiMessages = messages.map(m => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [...apiMessages, { role: 'user', content: userMsg }],
          activeTasks,
          timerActive,
          timeLeft
        })
      });

      const data = await response.json();
      
      if (data.reply) {
        let botResponse = data.reply;
        
        // Parse for JSON block at the end (e.g. {"action": "set_timer", "minutes": 30})
        const jsonMatch = botResponse.match(/\{"action":\s*"set_timer",\s*"minutes":\s*\d+\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.action === 'set_timer' && parsed.minutes) {
              setTimeLeft(parsed.minutes * 60);
              setTimerActive(true);
              botResponse = botResponse.replace(jsonMatch[0], `\n\n*(Timer set for ${parsed.minutes} minutes)*`);
            }
          } catch (e) {
            console.error('Failed to parse intent JSON');
          }
        }
        
        // Fallback to old regex if AI missed the JSON format
        const timerMatch = botResponse.match(/\[TIMER:\s*(\d+)\]/i);
        if (timerMatch && timerMatch[1]) {
          const minutes = parseInt(timerMatch[1], 10);
          if (!isNaN(minutes)) {
            setTimeLeft(minutes * 60);
            setTimerActive(true);
            botResponse = botResponse.replace(/\[TIMER:\s*\d+\]/gi, `\n\n*(Timer set for ${minutes} minutes)*`);
          }
        }

        addMessage({ role: 'bot', content: botResponse });
      } else {
        addMessage({ role: 'bot', content: 'STOP WASTING TIME AND GET BACK TO WORK! (Error parsing response)' });
      }
    } catch (error) {
      console.error(error);
      addMessage({ role: 'bot', content: 'NO EXCUSES! (Network Error)' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="chat-section"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="chat-container" ref={chatRef}>
        {messages.map((msg, idx) => (
          <motion.div 
            key={idx} 
            className={`message ${msg.role}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {msg.role === 'bot' ? (
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            ) : (
              msg.content
            )}
          </motion.div>
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
        <button 
          className={`mic-btn ${listening ? 'listening' : ''}`}
          onClick={handleMicClick}
          title="Dictate message"
        >
          <Mic size={18} />
        </button>
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
    </motion.div>
  );
}
