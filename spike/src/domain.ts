export type Role = 'CAPTAIN' | 'PARTICIPANT' | 'SPECTATOR';

export type TaskStatus =
  | 'LOCKED'
  | 'READY'
  | 'CLAIMED'
  | 'ACTIVE'
  | 'WAITING'
  | 'BLOCKED'
  | 'FAILED'
  | 'COMPLETED'
  | 'SKIPPED';

export interface AuthContext {
  participantId: string;
  recoveryToken: string;
}

export interface TaskSeed {
  key: string;
  title: string;
  status?: TaskStatus;
  exclusive?: boolean;
}

export interface SessionSnapshot {
  revision: number;
  session: {
    id: string;
    name: string;
    status: 'LOBBY' | 'LIVE' | 'ENDED';
    createdAt: string;
    startedAt: string | null;
    captainParticipantId: string;
  };
  timer: {
    serverNow: string;
    durationMs: number;
    adjustmentMs: number;
    remainingMs: number;
    status: 'IDLE' | 'RUNNING' | 'EXPIRED';
  };
  participants: Array<{
    id: string;
    displayName: string;
    role: Role;
    joinedAt: string;
  }>;
  tasks: Array<{
    id: string;
    key: string;
    title: string;
    status: TaskStatus;
    exclusive: boolean;
    ownerParticipantId: string | null;
    progress: number;
    resultData: unknown;
    revision: number;
    updatedAt: string;
  }>;
}

const TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  LOCKED: ['READY'],
  READY: ['CLAIMED', 'ACTIVE', 'SKIPPED'],
  CLAIMED: ['ACTIVE', 'READY'],
  ACTIVE: ['WAITING', 'BLOCKED', 'FAILED', 'COMPLETED'],
  WAITING: ['ACTIVE', 'FAILED'],
  BLOCKED: ['ACTIVE', 'FAILED'],
  FAILED: ['READY'],
  COMPLETED: ['ACTIVE'],
  SKIPPED: ['READY']
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function canMutate(role: Role): boolean {
  return role === 'CAPTAIN' || role === 'PARTICIPANT';
}
