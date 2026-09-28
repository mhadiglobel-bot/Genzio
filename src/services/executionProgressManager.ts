import { ExecutionProgressData, ExecutionActivityItem, ExecutionPhase, ChatAttachment, WebSearchCitation } from '../types';

export function createInitialExecutionData(
  prompt: string,
  attachments: ChatAttachment[] = [],
  options?: { webSearch?: boolean; research?: boolean; reasoningLevel?: string }
): ExecutionProgressData {
  const startTime = Date.now();
  const activities: ExecutionActivityItem[] = [
    {
      id: `act_${startTime}_prep`,
      type: 'preparing',
      label: 'Prepared request',
      timestamp: startTime,
      status: 'completed',
    },
  ];

  let currentLabel = 'Thinking';
  let phase: ExecutionPhase = 'preparing';

  if (attachments.length > 0) {
    const hasImg = attachments.some((a) => a.fileCategory === 'image' || a.type.startsWith('image/'));
    const hasPdf = attachments.some((a) => a.fileCategory === 'pdf' || a.type === 'application/pdf');

    if (hasImg) {
      phase = 'analyzing_image';
      currentLabel = 'Reading image';
      activities.push({
        id: `act_${startTime}_img`,
        type: 'analyzing_image',
        label: 'Reading image',
        timestamp: startTime,
        status: 'active',
      });
    } else if (hasPdf) {
      phase = 'reading_document';
      currentLabel = 'Reading document';
      activities.push({
        id: `act_${startTime}_doc`,
        type: 'reading_document',
        label: 'Reading document',
        timestamp: startTime,
        status: 'active',
      });
    } else {
      phase = 'processing_attachment';
      currentLabel = 'Processing attachment';
      activities.push({
        id: `act_${startTime}_att`,
        type: 'processing_attachment',
        label: 'Processing attachment',
        timestamp: startTime,
        status: 'active',
      });
    }
  } else if (options?.webSearch || options?.research) {
    phase = 'searching_web';
    currentLabel = 'Searching the web';
    activities.push({
      id: `act_${startTime}_search`,
      type: 'searching_web',
      label: 'Searching the web',
      timestamp: startTime,
      status: 'active',
    });
  } else {
    phase = 'reasoning';
    currentLabel = 'Thinking';
    activities.push({
      id: `act_${startTime}_think`,
      type: 'reasoning',
      label: 'Analyzing request',
      timestamp: startTime,
      status: 'active',
    });
  }

  return {
    phase,
    startTime,
    currentLabel,
    activities,
  };
}

export function updateExecutionOnToolStatus(
  prev?: ExecutionProgressData,
  rawStatus?: string
): ExecutionProgressData {
  const now = Date.now();
  const startTime = prev?.startTime || now;
  const currentActivities = prev?.activities ? [...prev.activities] : [];

  if (!rawStatus || !rawStatus.trim()) {
    return {
      phase: prev?.phase || 'preparing_answer',
      startTime,
      currentLabel: prev?.currentLabel || 'Preparing response',
      activities: currentActivities,
      sourceCount: prev?.sourceCount,
    };
  }

  const s = rawStatus.toLowerCase();
  let phase: ExecutionPhase = 'reasoning';
  let label = rawStatus;

  if (s.includes('search') || s.includes('web') || s.includes('google')) {
    phase = 'searching_web';
    label = 'Searching the web';
  } else if (s.includes('review') || s.includes('source') || s.includes('finding') || s.includes('cross-check')) {
    phase = 'reviewing_sources';
    label = prev?.sourceCount ? `Reviewing ${prev.sourceCount} sources` : 'Reviewing sources';
  } else if (s.includes('pdf') || s.includes('document')) {
    phase = 'reading_document';
    label = 'Reading document';
  } else if (s.includes('image') || s.includes('inspect')) {
    phase = 'analyzing_image';
    label = 'Reading image';
  } else if (s.includes('calculat') || s.includes('math') || s.includes('tool')) {
    phase = 'using_tool';
    label = 'Running tool';
  } else if (s.includes('generat') || s.includes('creat')) {
    phase = 'generating_image';
    label = 'Creating image';
  } else if (s.includes('prepar') || s.includes('build')) {
    phase = 'preparing_answer';
    label = 'Preparing response';
  } else {
    phase = 'reasoning';
    label = 'Thinking';
  }

  // Mark prior active item as completed
  const updatedActivities = currentActivities.map((act) =>
    act.status === 'active' ? { ...act, status: 'completed' as const } : act
  );

  // If this label already exists, don't duplicate
  const existingIdx = updatedActivities.findIndex((a) => a.label === label);
  if (existingIdx !== -1) {
    updatedActivities[existingIdx] = {
      ...updatedActivities[existingIdx],
      status: 'active',
      timestamp: now,
    };
  } else {
    updatedActivities.push({
      id: `act_${now}_${Math.random().toString(36).slice(2, 6)}`,
      type: phase,
      label,
      timestamp: now,
      status: 'active',
    });
  }

  return {
    phase,
    startTime,
    currentLabel: label,
    activities: updatedActivities,
    sourceCount: prev?.sourceCount,
  };
}

export function updateExecutionOnCitations(
  prev?: ExecutionProgressData,
  citations: WebSearchCitation[] = []
): ExecutionProgressData {
  const now = Date.now();
  const startTime = prev?.startTime || now;
  const currentActivities = prev?.activities ? [...prev.activities] : [];
  const count = citations.length;

  if (count === 0) {
    return prev || createInitialExecutionData('', [], { webSearch: true });
  }

  const updatedActivities = currentActivities.map((act) => {
    if (act.type === 'searching_web') {
      return { ...act, status: 'completed' as const, label: 'Searched the web' };
    }
    if (act.status === 'active') {
      return { ...act, status: 'completed' as const };
    }
    return act;
  });

  const reviewLabel = `Reviewed ${count} sources`;
  const existingReview = updatedActivities.findIndex((a) => a.type === 'reviewing_sources');
  if (existingReview !== -1) {
    updatedActivities[existingReview] = {
      ...updatedActivities[existingReview],
      label: reviewLabel,
      sourceCount: count,
      status: 'completed',
    };
  } else {
    updatedActivities.push({
      id: `act_${now}_sources`,
      type: 'reviewing_sources',
      label: reviewLabel,
      sourceCount: count,
      timestamp: now,
      status: 'completed',
    });
  }

  return {
    phase: 'preparing_answer',
    startTime,
    currentLabel: 'Preparing response',
    activities: updatedActivities,
    sourceCount: count,
  };
}

export function updateExecutionOnChunk(
  prev?: ExecutionProgressData
): ExecutionProgressData {
  const now = Date.now();
  const startTime = prev?.startTime || now;
  const currentActivities = prev?.activities ? [...prev.activities] : [];

  // Mark all active activities as completed
  const completedActivities = currentActivities.map((act) =>
    act.status === 'active' ? { ...act, status: 'completed' as const } : act
  );

  // Ensure 'Prepared response' exists
  if (!completedActivities.some((a) => a.type === 'preparing_answer')) {
    completedActivities.push({
      id: `act_${now}_prep_ans`,
      type: 'preparing_answer',
      label: 'Prepared response',
      timestamp: now,
      status: 'completed',
    });
  }

  return {
    phase: 'streaming',
    startTime,
    currentLabel: 'Streaming response',
    activities: completedActivities,
    sourceCount: prev?.sourceCount,
  };
}

export function updateExecutionOnComplete(
  prev?: ExecutionProgressData
): ExecutionProgressData {
  const now = Date.now();
  const startTime = prev?.startTime || now;
  const elapsedSeconds = Math.max(1, Math.round((now - startTime) / 1000));
  const currentActivities = prev?.activities ? [...prev.activities] : [];

  const finalizedActivities = currentActivities.map((act) => ({
    ...act,
    status: 'completed' as const,
  }));

  if (!finalizedActivities.some((a) => a.type === 'preparing_answer')) {
    finalizedActivities.push({
      id: `act_${now}_done`,
      type: 'preparing_answer',
      label: 'Prepared response',
      timestamp: now,
      status: 'completed',
    });
  }

  return {
    phase: 'complete',
    startTime,
    endTime: now,
    elapsedSeconds,
    currentLabel: 'Prepared response',
    activities: finalizedActivities,
    sourceCount: prev?.sourceCount,
    isComplete: true,
  };
}

export function updateExecutionOnStop(
  prev?: ExecutionProgressData
): ExecutionProgressData {
  const now = Date.now();
  const startTime = prev?.startTime || now;
  const elapsedSeconds = Math.max(1, Math.round((now - startTime) / 1000));
  const currentActivities = prev?.activities ? [...prev.activities] : [];

  const finalizedActivities = currentActivities.map((act, idx) =>
    idx === currentActivities.length - 1 && act.status === 'active'
      ? { ...act, status: 'failed' as const }
      : act
  );

  return {
    phase: 'stopped',
    startTime,
    endTime: now,
    elapsedSeconds,
    currentLabel: 'Stopped',
    activities: finalizedActivities,
    sourceCount: prev?.sourceCount,
    isComplete: true,
    isStopped: true,
  };
}

export function updateExecutionOnError(
  prev?: ExecutionProgressData
): ExecutionProgressData {
  const now = Date.now();
  const startTime = prev?.startTime || now;
  const elapsedSeconds = Math.max(1, Math.round((now - startTime) / 1000));
  const currentActivities = prev?.activities ? [...prev.activities] : [];

  const finalizedActivities = currentActivities.map((act) =>
    act.status === 'active' ? { ...act, status: 'failed' as const } : act
  );

  return {
    phase: 'error',
    startTime,
    endTime: now,
    elapsedSeconds,
    currentLabel: 'Failed',
    activities: finalizedActivities,
    sourceCount: prev?.sourceCount,
    isComplete: true,
    isError: true,
  };
}
