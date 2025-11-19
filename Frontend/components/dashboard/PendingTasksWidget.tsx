
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Card from '../ui/Card';
import { ArrowRight } from 'lucide-react';

export interface Task {
  description: string;
  count: number;
  link: string;
  icon: React.ReactNode;
}

interface PendingTasksWidgetProps {
  tasks: Task[];
  title?: string;
}

const PendingTasksWidget: React.FC<PendingTasksWidgetProps> = ({ tasks, title = "Your Action Items" }) => {
  const activeTasks = tasks.filter(task => task.count > 0);

  if (activeTasks.length === 0) {
    return (
        <Card>
             <div className="text-center py-4">
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-slate-500">You have no pending tasks. Great job!</p>
            </div>
        </Card>
    );
  }

  return (
    <Card>
      <h3 className="font-bold text-lg mb-4">{title}</h3>
      <div className="space-y-2">
        {activeTasks.map((task, index) => (
          <ReactRouterDOM.Link to={task.link} key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-light-gray transition-colors duration-200 -mx-3">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-primary-red/10 text-primary-red rounded-full mr-4">
                {task.icon}
              </div>
              <div>
                <p className="font-semibold text-primary-navy">{task.description}</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="font-bold text-lg text-primary-red mr-4">{task.count}</span>
              <ArrowRight className="h-5 w-5 text-slate-400" />
            </div>
          </ReactRouterDOM.Link>
        ))}
      </div>
    </Card>
  );
};

export default PendingTasksWidget;