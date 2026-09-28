import React from 'react';
import { ExecutionProgressView } from './ExecutionProgressView';

export interface ThinkingStatusProps {
  toolStatus?: string;
  className?: string;
  isStreaming?: boolean;
}

export const ThinkingStatus: React.FC<ThinkingStatusProps> = ({
  toolStatus,
  className = '',
  isStreaming = true,
}) => {
  return (
    <ExecutionProgressView
      toolStatus={toolStatus}
      isStreaming={isStreaming}
      className={className}
    />
  );
};

export default ThinkingStatus;
