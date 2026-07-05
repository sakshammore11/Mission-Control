import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      messages: [
        { role: 'bot', content: 'NO EXCUSES. What do you need to get done today? Tell me your tasks and I will give you a deadline.' }
      ],
      addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
      clearMessages: () => set({ messages: [
        { role: 'bot', content: 'History wiped. A fresh start. What are we destroying today?' }
      ]}),

      tasks: [],
      addTask: (text) => set((state) => ({
        tasks: [...state.tasks, { id: Date.now().toString(), text, done: false }]
      })),
      editTask: (id, newText) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, text: newText } : t)
      })),
      reorderTasks: (newTasks) => set({ tasks: newTasks }),
      toggleTask: (id) => set((state) => {
        const newTasks = state.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
        const task = state.tasks.find(t => t.id === id);
        if (task && !task.done) {
          get().incrementTasksDone();
          if ('vibrate' in navigator) navigator.vibrate(50); // Haptic feedback on complete
        }
        return { tasks: newTasks };
      }),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
      })),
      clearCompletedTasks: () => set((state) => ({
        tasks: state.tasks.filter(t => !t.done)
      })),

      timeLeft: 0,
      timerActive: false,
      setTimeLeft: (time) => set({ timeLeft: time }),
      setTimerActive: (isActive) => set({ timerActive: isActive }),
      decrementTimer: () => set((state) => ({ timeLeft: Math.max(0, state.timeLeft - 1) })),

      punishmentTriggered: false,
      triggerPunishment: () => {
        set({ punishmentTriggered: true });
        setTimeout(() => set({ punishmentTriggered: false }), 2000);
      },

      stats: {
        tasksDone: 0,
        grindSessions: 0,
        disciplineScore: 0,
        currentStreak: 0,
        lastActiveDate: null
      },
      checkStreak: () => {
        const now = new Date();
        const today = now.toDateString();
        const lastActive = get().stats.lastActiveDate;
        
        if (lastActive !== today) {
          let newStreak = get().stats.currentStreak;
          let newScore = get().stats.disciplineScore;
          
          if (lastActive) {
            const lastDate = new Date(lastActive);
            const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
              newStreak += 1;
            } else if (diffDays > 1) {
              newStreak = 0;
              newScore = Math.max(0, newScore - (diffDays * 10));
            }
          } else {
            newStreak = 1;
          }
          
          set((state) => ({
            stats: {
              ...state.stats,
              currentStreak: newStreak,
              lastActiveDate: today,
              disciplineScore: newScore
            }
          }));
        }
      },
      incrementTasksDone: () => {
        get().checkStreak();
        set((state) => ({
          stats: { 
            ...state.stats, 
            tasksDone: state.stats.tasksDone + 1,
            disciplineScore: state.stats.disciplineScore + 10
          }
        }));
      },
      incrementGrindSessions: () => {
        get().checkStreak();
        set((state) => ({
          stats: {
            ...state.stats,
            grindSessions: state.stats.grindSessions + 1,
            disciplineScore: state.stats.disciplineScore + 50
          }
        }));
      },
      punishScore: () => {
        get().triggerPunishment();
        set((state) => ({
          stats: {
            ...state.stats,
            disciplineScore: Math.max(0, state.stats.disciplineScore - 25)
          }
        }));
      }
    }),
    {
      name: 'mission-control-storage',
      partialize: (state) => ({ 
        messages: state.messages, 
        tasks: state.tasks, 
        stats: state.stats 
      }),
    }
  )
);
