# Aplikacja-sportowa.
Aplikacja sportowa dla trenerów i zawodników


// ==========================================
// 1. TRYB SZYBKIEJ OCENY TRENERA (Mobile)
// ==========================================

export type EvaluationScore = '-' | '0' | '+';
export type AbsenceReason = 'unexcused' | 'excused' | 'sick' | 'injury';

export interface PlayerToEvaluate {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  jerseyNumber?: number;
}

export interface QuickEvaluationProps {
  trainingId: string;
  teamName: string;
  date: string;
  currentIndex: number;
  totalPlayers: number;
  currentPlayer: PlayerToEvaluate;
  currentValue?: {
    type: 'score' | 'absence';
    score?: EvaluationScore;
    reason?: AbsenceReason;
  };
  canGoBack: boolean;
  onRate: (score: EvaluationScore) => void;
  onMarkAbsent: (reason: AbsenceReason) => void;
  onPrevious: () => void;
  onFinish: () => void;
}

// ==========================================
// 2. PUBLICZNA ANKIETA ZAWODNIKA / RODZICA
// ==========================================

export interface SurveyScreenProps {
  clubName: string;
  teamName: string;
  trainingDate: string;
  playerName: string;
  isExpired?: boolean;
  isSubmitted?: boolean;
  onSubmit: (data: { fatigue: number; satisfaction: number }) => void; // wartości 1-5
}

// ==========================================
// 3. PROFIL ANALITYCZNY ZAWODNIKA
// ==========================================

export interface PlayerStatSummary {
  trainingsCount: number;
  attendanceRate: number; // np. 85 (%)
  absencesCount: number;
  scoreDistribution: {
    minus: { count: number; percentage: number };
    zero: { count: number; percentage: number };
    plus: { count: number; percentage: number };
  };
  avgFatigue?: number; // 1-5
  avgSatisfaction?: number; // 1-5
}

export interface PlayerHistoryEntry {
  trainingId: string;
  date: string;
  status: 'attended' | 'absent';
  score?: EvaluationScore;
  absenceReason?: AbsenceReason;
  fatigue?: number;
  satisfaction?: number;
}

export interface PlayerProfileProps {
  player: PlayerToEvaluate;
  stats: PlayerStatSummary;
  history: PlayerHistoryEntry[];
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

// ==========================================
// 4. DASHBOARD ZESPOŁU / KOORDYNATORA
// ==========================================

export interface AttentionSignal {
  playerId: string;
  playerName: string;
  avatarUrl?: string;
  reason: 'negative_streak' | 'high_fatigue' | 'low_satisfaction' | 'attendance_drop';
  description: string;
}

export interface TeamDashboardProps {
  teamName: string;
  periodLabel: string;
  stats: {
    totalTrainings: number;
    evaluationCompleteness: number; // np. 94 (%)
    attendanceRate: number; // np. 88 (%)
    scoreDistribution: {
      minus: number;
      zero: number;
      plus: number;
    };
  };
  attentionList: AttentionSignal[];
  playersOverview: Array<PlayerToEvaluate & { attendanceRate: number; dominantScore: EvaluationScore }>;
}

// ==========================================
// 5. AUTENTYKACJA I SESJA UŻYTKOWNIKA
// ==========================================

export type UserRole = 'coach' | 'coordinator' | 'club_admin' | 'master_admin';

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  clubId: string;
  clubName: string;
  avatarUrl?: string;
  assignedTeamIds?: string[]; // ID zespołów, do których trener ma dostęp
}

export interface LoginFormProps {
  onSubmit: (credentials: { email: string; pass: string }) => void;
  isLoading: boolean;
  errorMessage?: string;
}

// ==========================================
// 6. ZARZĄDZANIE TRENINGAMI (Widok Trenera)
// ==========================================

export type TrainingStatus = 'scheduled' | 'completed' | 'cancelled';
export type EvaluationStatus = 'unrated' | 'partial' | 'completed';

export interface TrainingListItem {
  id: string;
  teamId: string;
  teamName: string;
  date: string;          // np. "2026-03-30"
  startTime: string;     // np. "17:30"
  endTime?: string;
  status: TrainingStatus;
  evaluationStatus: EvaluationStatus;
  surveySent: boolean;
  playersCount: number;
}

export interface CoachTrainingsViewProps {
  currentUser: CurrentUser;
  trainings: TrainingListItem[];
  availableTeams: Array<{ id: string; name: string }>;
  onCreateTraining: (data: { teamId: string; date: string; startTime: string; topic?: string }) => void;
  onStartEvaluation: (trainingId: string) => void;
  onSendSurvey: (trainingId: string) => void;
  onCancelTraining: (trainingId: string) => void;
}

// ==========================================
// 7. PANEL ADMINISTRATORA KLUBU (CRUD)
// ==========================================

export interface TeamEntity {
  id: string;
  name: string;          // np. "U14"
  season: string;        // np. "2025/2026"
  playersCount: number;
  assignedCoachNames: string[];
}

export interface PlayerEntity {
  id: string;
  firstName: string;
  lastName: string;
  birthYear: number;
  teamId: string;
  teamName: string;
  contactEmail?: string; // e-mail do ankiety/rodzica
  contactPhone?: string;
  avatarUrl?: string;
}

export interface CoachEntity {
  id: string;
  fullName: string;
  email: string;
  assignedTeamIds: string[];
}

export interface ClubAdminPanelProps {
  teams: TeamEntity[];
  players: PlayerEntity[];
  coaches: CoachEntity[];
  // Zdarzenia do podpięcia logiki przez backend
  onCreateTeam: (name: string, season: string) => void;
  onAddPlayer: (player: Omit<PlayerEntity, 'id' | 'teamName'>) => void;
  onAssignPlayerToTeam: (playerId: string, newTeamId: string) => void;
  onInviteCoach: (email: string, fullName: string, teamIds: string[]) => void;
}

// ==========================================
// 8. WIDOK MASTER ADMINA (SaaS / Wiele Klubów)
// ==========================================

export interface ClubItem {
  id: string;
  name: string;
  createdAt: string;
  adminEmail: string;
  teamsCount: number;
  playersCount: number;
  isActive: boolean;
}

export interface MasterAdminProps {
  clubs: ClubItem[];
  onCreateClub: (clubName: string, initialAdminEmail: string) => void;
  onToggleClubStatus: (clubId: string, isActive: boolean) => void;
}
