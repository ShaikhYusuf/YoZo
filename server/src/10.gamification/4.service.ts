import { injectable, inject } from "inversify";
import TYPES from "../ioc/types";
import { IRepoGamification } from "./5.repo.model";
import { IGamification } from "./0.model";
import { IServiceGamification } from "./3.service.model";
import { ILogger } from "../common/service/logger.service";

@injectable()
export class ServiceGamificationImpl implements IServiceGamification {
  private repoGamification: IRepoGamification;
  private logger: ILogger;

  constructor(
    @inject(TYPES.RepoGamification) repoGamification: IRepoGamification,
    @inject(TYPES.LoggerService) logger: ILogger
  ) {
    this.repoGamification = repoGamification;
    this.logger = logger;
  }

  async get(id: number): Promise<IGamification> {
    return this.repoGamification.get(id);
  }

  async getByStudent(studentId: number): Promise<IGamification> {
    try {
      return await this.repoGamification.getByStudent(studentId);
    } catch (e) {
      this.logger.info(`Creating new gamification profile for student ${studentId}`);
      return await this.repoGamification.create(studentId);
    }
  }

  async addXp(studentId: number, xpToAdd: number): Promise<IGamification> {
    const profile = await this.getByStudent(studentId);
    const newXp = (profile.xp || 0) + xpToAdd;
    // Simple level calculation: Level = Math.floor(xp / 100) + 1
    const newLevel = Math.floor(newXp / 100) + 1;
    
    return this.repoGamification.update(profile.Id!, {
      xp: newXp,
      level: newLevel,
      lastActive: new Date()
    });
  }

  async awardBadge(studentId: number, badge: string): Promise<IGamification> {
    const profile = await this.getByStudent(studentId);
    const currentBadges = profile.badges || [];
    if (!currentBadges.includes(badge)) {
      currentBadges.push(badge);
      return this.repoGamification.update(profile.Id!, {
        badges: currentBadges,
        lastActive: new Date()
      });
    }
    return profile;
  }

  async updateStreak(studentId: number): Promise<IGamification> {
    const profile = await this.getByStudent(studentId);
    const lastActive = profile.lastActive ? new Date(profile.lastActive) : null;
    const now = new Date();
    
    let newStreak = profile.streakDays || 0;
    
    if (lastActive) {
      const diffTime = Math.abs(now.getTime() - lastActive.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak += 1; // Consecutive day
      } else if (diffDays > 1) {
        newStreak = 1; // Streak broken
      }
      // if diffDays === 0, same day, streak doesn't change
    } else {
      newStreak = 1; // First time
    }

    return this.repoGamification.update(profile.Id!, {
      streakDays: newStreak,
      lastActive: now
    });
  }
}
