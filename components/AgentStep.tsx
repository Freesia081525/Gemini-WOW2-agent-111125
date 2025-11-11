import React, { useState } from 'react';
import { Agent, AgentStatus } from '../types';
import { RunningIcon, SuccessIcon, ErrorIcon, PendingWowIcon, TrashIcon } from './icons';

interface AgentStepProps {
  agent: Agent;
  index: number;
  onPromptChange: (id: string, prompt: string) => void;
  onDelete: (id: string) => void;
}

const statusIndicatorMap: { [key in AgentStatus]: React.ReactNode } = {
  [AgentStatus.Pending]: <PendingWowIcon className="w-6 h-6 text-gray-400" />,
  [AgentStatus.Running]: <RunningIcon className="w-6 h-6 text-blue-500" />,
  [AgentStatus.Success]: <SuccessIcon className="w-6 h-6 text-green-500" />,
  [AgentStatus.Error]: <ErrorIcon className="w-6 h-6 text-red-500" />,
};

const statusBorderMap: { [key in AgentStatus]: string } = {
    [AgentStatus.Pending]: 'border-gray-300 dark:border-gray-600',
    [AgentStatus.Running]: 'border-blue-500 ring-4 ring-blue-500/20',
    [AgentStatus.Success]: 'border-green-500',
    [AgentStatus.Error]: 'border-red-500',
};

const AgentStep: React.FC<AgentStepProps> = ({ agent, index, onPromptChange, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-white dark:bg-gray-800/50 p-4 rounded-lg border-l-4 transition-all duration-300 ${statusBorderMap[agent.status]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">{statusIndicatorMap[agent.status]}</div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              <span className="text-blue-500 dark:text-blue-400">Agent {index + 1}:</span> {agent.name}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
            {(agent.output || agent.error) && (
                 <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    {isExpanded ? 'Hide' : 'Show'} Details
                </button>
            )}
            <button onClick={() => onDelete(agent.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                <TrashIcon className="w-4 h-4"/>
            </button>
        </div>
      </div>

      <div className="mt-3">
        <textarea
          value={agent.prompt}
          onChange={(e) => onPromptChange(agent.id, e.target.value)}
          className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          rows={2}
          placeholder="Enter agent prompt..."
        />
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {agent.status === AgentStatus.Success && agent.output && (
            <div className="prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
              <h4 className="font-semibold text-gray-600 dark:text-gray-400">Output:</h4>
              <pre className="whitespace-pre-wrap break-words font-sans">{agent.output}</pre>
            </div>
          )}
          {agent.status === AgentStatus.Error && agent.error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-md text-sm">
              <h4 className="font-semibold">Error:</h4>
              <p>{agent.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentStep;
