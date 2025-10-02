import { Calendar } from 'lucide-react';

interface MonthlyTasksProps {
  generateMonthlyTasks: () => any[];
}

export function MonthlyTasks({ generateMonthlyTasks }: MonthlyTasksProps) {
  const monthlyTasks = generateMonthlyTasks();

  return (
    <div className="modern-card p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center space-x-2">
        <Calendar className="w-5 h-5" />
        <span>Årsplan - Månadsvisa aktiviteter</span>
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {monthlyTasks.map((task) => (
          <div key={task.month} className="border rounded-lg p-4" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              {task.month}
            </h3>
            <ul className="space-y-1">
              {task.tasks.map((taskItem: string, index: number) => (
                <li key={index} className="text-sm flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" 
                        style={{ backgroundColor: task.priority === 'high' ? '#ef4444' : 
                                                  task.priority === 'medium' ? '#f59e0b' : '#10b981' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{taskItem}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}


