export type UserRole = 'admin' | 'player';

export type PriorityTier = 'Prioridad 1' | 'Prioridad 2' | 'Prioridad 3';

export interface UserStats {
  played: number;
  late: number;
  noShows: number;
  debts: number;
  onTime?: number;
  paidOnTime?: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  photoURL?: string;
  role: UserRole;
  score: number; // default 100
  tier: PriorityTier;
  stats: UserStats;
  createdAt?: string;
  updatedAt?: string;
}

export type MatchCapacity = 10 | 12 | 14 | 18;

export function getFormatName(capacity: number): string {
  switch (capacity) {
    case 10:
      return 'Fútbol 5';
    case 12:
      return 'Fútbol 6';
    case 14:
      return 'Fútbol 7';
    case 18:
      return 'Fútbol 9';
    default:
      return `Fútbol ${capacity / 2}`;
  }
}

export type MatchStatus = 
  | 'phase_1_priority' 
  | 'phase_2_open' 
  | 'closed' 
  | 'completed' 
  | 'cancelled';

export interface Match {
  id: string;
  dateTime: string; // ISO string e.g. "2026-08-28T20:00:00"
  location: string;
  capacity: MatchCapacity; // 10 (Fútbol 5) or 14 (Fútbol 7)
  costPerPlayer: number;
  status: MatchStatus;
  createdAt: string;
  title?: string;
  notes?: string;
}

export type RegistrationStatus = 'starter' | 'substitute' | 'cancelled';

export interface Registration {
  id: string;
  matchId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhoto?: string;
  userScore: number;
  userTier: PriorityTier;
  registeredAt: string; // ISO string
  status: RegistrationStatus;
  cancellationTime?: string | null;
  paid?: boolean;
}

export type PenaltyType = 'none' | 'late' | 'late_cancellation' | 'no_show' | 'debt';

export interface Evaluation {
  id: string;
  matchId: string;
  userId: string;
  userName?: string;
  attended: boolean;
  onTime: boolean;
  paid: boolean;
  penaltyType: PenaltyType;
  deltaScore: number;
  evaluatedAt?: string;
  evaluatedBy?: string;
}

// Scoring rules constants
export const SCORING_RULES = {
  ATTENDED_ON_TIME: 2,
  PAID_ON_TIME: 1,
  EARLY_CANCELLATION: 0,
  LATE: -3,
  LATE_CANCELLATION: -10,
  NO_SHOW: -25,
  DEBT: -5,
} as const;

export function calculateTier(score: number): PriorityTier {
  if (score >= 100) return 'Prioridad 1';
  if (score >= 80) return 'Prioridad 2';
  return 'Prioridad 3';
}

export function calculateDeltaScore(
  attended: boolean,
  onTime: boolean,
  paid: boolean,
  penaltyType: PenaltyType
): number {
  let delta = 0;

  if (penaltyType === 'no_show') {
    return SCORING_RULES.NO_SHOW; // -25
  }

  if (penaltyType === 'late_cancellation') {
    return SCORING_RULES.LATE_CANCELLATION; // -10
  }

  if (attended) {
    if (onTime) {
      delta += SCORING_RULES.ATTENDED_ON_TIME; // +2
    } else {
      delta += SCORING_RULES.LATE; // -3
    }
  }

  if (paid) {
    delta += SCORING_RULES.PAID_ON_TIME; // +1
  } else {
    delta += SCORING_RULES.DEBT; // -5
  }

  return delta;
}
