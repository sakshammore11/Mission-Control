import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export default function Chat() {
  const { 
    messages, addMessage, 
    tasks, 
    timerActive, timeLeft, setTimeLeft, setTimerActive
  } = useStore();
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    addMessage({ role: 'user', content: userMsg });
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
            setTimerActive(true);
            botResponse = botResponse.replace(/\[TIMER:\s*\d+\]/gi, `*(Timer set for ${minutes} minutes)*`);
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
