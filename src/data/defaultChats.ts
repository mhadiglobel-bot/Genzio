import { ChatSession, LibraryFile } from '../types';

export const DEFAULT_CHATS: ChatSession[] = [
  {
    id: 'chat-ts-arch',
    title: 'TypeScript Event Architecture',
    pinned: true,
    createdAt: Date.now() - 3600 * 1000 * 3,
    updatedAt: Date.now() - 3600 * 1000 * 3,
    modelPreset: 'Genzio Pro',
    messages: [
      {
        id: 'msg-1-u',
        role: 'user',
        content: 'How should I structure type-safe event emitters and payload registries in a modern TypeScript application?',
        timestamp: '10:30 AM',
      },
      {
        id: 'msg-1-a',
        role: 'assistant',
        content: `To build a strictly type-safe event emitter in TypeScript, define an **event map interface** that maps event keys to their payload types, then construct generic handler utilities.

### 1. Define the Event Map Interface
\`\`\`typescript
export interface AppEventMap {
  'user:login': { userId: string; timestamp: number; ipAddress?: string };
  'file:uploaded': { fileId: string; sizeBytes: number; mimeType: string };
  'query:executed': { queryId: string; durationMs: number; cached: boolean };
}
\`\`\`

### 2. Type-Safe Event Bus Implementation
\`\`\`typescript
export type EventKey = keyof AppEventMap;
export type EventListener<K extends EventKey> = (payload: AppEventMap[K]) => void | Promise<void>;

export class TypedEventEmitter {
  private listeners: { [K in EventKey]?: Set<EventListener<K>> } = {};

  on<K extends EventKey>(event: K, listener: EventListener<K>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set() as any;
    }
    this.listeners[event]!.add(listener);
    
    // Return unsubscribe callback
    return () => this.off(event, listener);
  }

  off<K extends EventKey>(event: K, listener: EventListener<K>): void {
    this.listeners[event]?.delete(listener);
  }

  emit<K extends EventKey>(event: K, payload: AppEventMap[K]): void {
    const handlers = this.listeners[event];
    if (handlers) {
      handlers.forEach((handler) => handler(payload));
    }
  }
}
\`\`\`

### Key Benefits
- **Zero Runtime Reflection**: Full compile-time verification without bundle bloat.
- **Strict Payload Autocomplete**: IDE autocomplete triggers automatically when entering event names.
- **Unsubscribe Cleanup**: Returned cleanup closure prevents memory leaks in React \`useEffect\` hooks.`,
        timestamp: '10:31 AM',
        model: 'Genzio Pro',
      },
    ],
  },
  {
    id: 'chat-react-perf',
    title: 'React 19 Memoization & Server Hooks',
    pinned: false,
    createdAt: Date.now() - 3600 * 1000 * 24,
    updatedAt: Date.now() - 3600 * 1000 * 24,
    modelPreset: 'Genzio Fast',
    messages: [
      {
        id: 'msg-2-u',
        role: 'user',
        content: 'What are the main best practices for state management and avoiding unnecessary re-renders in complex React apps?',
        timestamp: 'Yesterday',
      },
      {
        id: 'msg-2-a',
        role: 'assistant',
        content: `When scaling complex React frontends, optimize state locality rather than over-relying on blanket memoization:

1. **State Colocation**: Keep state as close as possible to the component tree where it is consumed.
2. **Context Partitioning**: Split frequently updated state from static configuration contexts to avoid cascading subscriber re-renders.
3. **Derived Values**: Calculate derived values inline during render rather than synchronizing with extra \`useEffect\` calls.`,
        timestamp: 'Yesterday',
        model: 'Genzio Fast',
      },
    ],
  },
];

export const DEFAULT_LIBRARY_ITEMS: LibraryFile[] = [
  {
    id: 'lib-1',
    name: 'TypeScript Architectural Review Prompt',
    type: 'prompt',
    size: '1.2 KB',
    uploadedAt: 'Today',
    description: 'System template for in-depth code reviews with strict type checking principles.',
    content: 'Review the following TypeScript implementation for type safety, edge case handling, and modular decoupling: \n\n[Paste code here]',
    category: 'Engineering',
  },
  {
    id: 'lib-2',
    name: 'Clean API Error Handler Snippet',
    type: 'snippet',
    size: '0.8 KB',
    uploadedAt: 'Yesterday',
    description: 'Standardized RFC-7807 error schema response helper.',
    content: `export interface ApiErrorResponse {\n  type: string;\n  title: string;\n  status: number;\n  detail: string;\n  instance: string;\n}`,
    category: 'Backend',
  },
  {
    id: 'lib-3',
    name: 'Technical Specification RFC Template',
    type: 'document',
    size: '2.1 KB',
    uploadedAt: '3 days ago',
    description: 'Structured outline for documenting new services and database migrations.',
    content: `# RFC: [Title]\n\n## Summary\nBrief 2-3 sentence overview.\n\n## Motivation\nWhy are we building this now?\n\n## Architectural Design\nSystem topology and schema changes.`,
    category: 'Architecture',
  },
];

export const STARTER_SUGGESTIONS = [
  {
    title: 'Refactor a TypeScript Hook',
    description: 'Optimize state logic and prevent memory leaks in custom hooks',
    prompt: 'Help me refactor a custom React hook in TypeScript to handle async state with abort controllers and type-safe error boundaries.',
    category: 'Code',
  },
  {
    title: 'Design API Schema',
    description: 'Draft a clean REST / GraphQL contract with pagination',
    prompt: 'Design a clean RESTful API schema with cursor-based pagination, rate limiting headers, and RFC-7807 error responses.',
    category: 'Architecture',
  },
  {
    title: 'Explain Distributed Caching',
    description: 'Compare Redis write-through vs cache-aside strategies',
    prompt: 'Explain the tradeoffs between cache-aside, write-through, and write-behind caching patterns for high-throughput microservices.',
    category: 'Systems',
  },
  {
    title: 'Draft Technical RFC',
    description: 'Outline a system design proposal for a new feature',
    prompt: 'Draft a comprehensive technical RFC structure for migrating a legacy monolith to an event-driven microservices architecture.',
    category: 'Design',
  },
];
