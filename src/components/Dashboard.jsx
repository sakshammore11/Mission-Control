import { motion } from 'framer-motion';
import { Target, Flame, Activity, Trophy, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const stats = useStore(state => state.stats);

  const rank = stats.disciplineScore > 500 
    ? 'Elite Commander' 
    : stats.disciplineScore > 200 
      ? 'Focused Warrior' 
      : stats.disciplineScore > 50 
        ? 'Recruit' 
        : 'Slacker';

  // Dummy chart data for visual feedback (since we don't have historical arrays yet)
  // In a V12, this would map over an array of daily scores.
  const chartData = [
    { day: 'Mon', score: Math.max(0, stats.disciplineScore - 40) },
    { day: 'Tue', score: Math.max(0, stats.disciplineScore - 30) },
    { day: 'Wed', score: Math.max(0, stats.disciplineScore - 20) },
    { day: 'Thu', score: Math.max(0, stats.disciplineScore - 10) },
    { day: 'Today', score: stats.disciplineScore },
  ];

  return (
    <motion.div 
      className="dashboard-container"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="dashboard-grid mb-2">
        <div className="stat-card">
          <Trophy className="stat-icon text-gold" size={24} />
          <h3>Discipline Score</h3>
          <p className="stat-value">{stats.disciplineScore}</p>
          <span className="stat-rank">{rank}</span>
        </div>
        
        <div className="stat-card">
          <Zap className="stat-icon text-orange" size={24} />
          <h3>Current Streak</h3>
          <p className="stat-value">{stats.currentStreak} Days</p>
        </div>

        <div className="stat-card">
          <Target className="stat-icon text-accent" size={24} />
          <h3>Missions Done</h3>
          <p className="stat-value">{stats.tasksDone}</p>
        </div>

        <div className="stat-card">
          <Flame className="stat-icon text-orange" size={24} />
          <h3>Grind Sessions</h3>
          <p className="stat-value">{stats.grindSessions}</p>
        </div>
      </div>

      <div className="panel chart-panel">
        <h2><Activity size={20} /> Score Trajectory (Simulated)</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <XAxis dataKey="day" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                itemStyle={{ color: '#ff4500' }}
              />
              <Line type="monotone" dataKey="score" stroke="#ff4500" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
