import { motion } from 'framer-motion';
import { Target, Flame, Activity, Trophy } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Dashboard() {
  const { stats } = useStore();

  const rank = stats.disciplineScore > 500 
    ? 'Elite Commander' 
    : stats.disciplineScore > 200 
      ? 'Focused Warrior' 
      : stats.disciplineScore > 50 
        ? 'Recruit' 
        : 'Slacker';

  return (
    <motion.div 
      className="dashboard-container"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="dashboard-grid">
        <div className="stat-card">
          <Trophy className="stat-icon text-gold" size={24} />
          <h3>Discipline Score</h3>
          <p className="stat-value">{stats.disciplineScore}</p>
          <span className="stat-rank">{rank}</span>
        </div>
        
        <div className="stat-card">
          <Target className="stat-icon text-accent" size={24} />
          <h3>Missions Completed</h3>
          <p className="stat-value">{stats.tasksDone}</p>
        </div>

        <div className="stat-card">
          <Flame className="stat-icon text-orange" size={24} />
          <h3>Grind Sessions</h3>
          <p className="stat-value">{stats.grindSessions}</p>
        </div>

        <div className="stat-card">
          <Activity className="stat-icon text-blue" size={24} />
          <h3>Current Status</h3>
          <p className="stat-value text-small">
            {stats.disciplineScore === 0 ? 'AWAITING DISCIPLINE' : 'ACTIVE'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
