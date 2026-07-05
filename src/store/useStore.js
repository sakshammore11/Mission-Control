import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      // Chat State
      messages: [
        { role: 'bot', content: 'NO EXCUSES. What do you need to get done today? Tell me your tasks and I will give you a deadline.' }
      ],
      addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
      clearMessages: () => set({ messages: [
        { role: 'bot', content: 'History wiped. A fresh start. What are we destroying today?' }
      ]}),

      // Tasks State
      tasks: [],
      addTask: (text) => set((state) => ({
        tasks: [...state.tasks, { id: Date.now(), text, done: false }]
      })),
      toggleTask: (id) => set((state) => {
        const newTasks = state.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
        // Analytics bump if marked done
        const task = state.tasks.find(t => t.id === id);
        if (task && !task.done) {
          get().incrementTasksDone();
        }
        return { tasks: newTasks };
      }),
      clearCompletedTasks: () => set((state) => ({
        tasks: state.tasks.filter(t => !t.done)
      })),

      // Timer State
      timeLeft: 0,
      timerActive: false,
      setTimeLeft: (time) => set({ timeLeft: time }),
      setTimerActive: (isActive) => set({ timerActive: isActive }),
      decrementTimer: () => set((state) => ({ timeLeft: Math.max(0, state.timeLeft - 1) })),

      // Analytics State
      stats: {
        tasksDone: 0,
        grindSessions: 0,
        disciplineScore: 0,
      },
      incrementTasksDone: () => set((state) => ({
        stats: { 
          ...state.stats, 
          tasksDone: state.stats.tasksDone + 1,
          disciplineScore: state.stats.disciplineScore + 10
        }
      })),
      incrementGrindSessions: () => set((state) => ({
        stats: {
          ...state.stats,
          grindSessions: state.stats.grindSessions + 1,
          disciplineScore: state.stats.disciplineScore + 50
        }
      })),
      punishScore: () => set((state) => ({
        stats: {
          ...state.stats,
          disciplineScore: Math.max(0, state.stats.disciplineScore - 25)
        }
      }))
    }),
    {
      name: 'mission-control-storage',
      partialize: (state) => ({ 
        messages: state.messages, 
        tasks: state.tasks, 
        stats: state.stats 
      }), // Don't persist active timer across reloads to avoid bugs, but keep history
    }
  )
);
