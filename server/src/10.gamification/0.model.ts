export interface IGamification {
  Id?: number;
  studentId: number;
  xp?: number;
  level?: number;
  badges?: string[];
  streakDays?: number;
  lastActive?: string | Date;
  tenantId?: number;
}
