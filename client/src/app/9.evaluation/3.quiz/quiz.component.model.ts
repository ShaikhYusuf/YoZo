import { IQuiz } from '../evaluation.service.model';

export interface IQuizComponent extends IQuiz {
  selectedAnswer: number | null;
  answered: boolean;
}
