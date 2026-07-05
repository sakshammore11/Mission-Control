import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Send, Mic, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [showScrollFAB, setShowScrollFAB] = useState(false);
  const chatRef = useRef(null);

  const scrollToBottom = () => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    if (!chatRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollFAB(!isNearBottom);
  };

  useEffect(() => {
    if (chatRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      if (isNearBottom || messages[messages.length - 1]?.role === 'user') {
        scrollToBottom();
      }
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
      <div className="chat-container" ref={chatRef} onScroll={handleScroll}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-wrapper ${msg.role}`}>
            <motion.div 
              className={`message ${msg.role}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {msg.role === 'bot' ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <SyntaxHighlighter
                          children={String(children).replace(/\n$/, '')}
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        />
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </motion.div>
          </div>
        ))}
        {loading && (
          <div className="message-wrapper bot">
            <motion.div 
              className="message bot"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="skeleton">
                <div className="skeleton-line"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line"></div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showScrollFAB && (
          <motion.button 
            className="fab-scroll"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
          >
            <ArrowDown size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="input-area">
        <div className="input-field-wrapper">
          <button 
            className={`mic-btn ${listening ? 'listening' : ''}`}
            onClick={handleMicClick}
            aria-label="Dictate message"
            title="Dictate message"
          >
            <Mic size={20} />
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
        </div>
        <button 
          className="send-btn" 
          onClick={handleSend}
          disabled={loading || !input.trim()}
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </motion.div>
  );
}
