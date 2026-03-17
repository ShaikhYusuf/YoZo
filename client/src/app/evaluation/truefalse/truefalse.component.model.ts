import { ITrueFalse } from '../evaluation.service.model';

export interface ITrueFalseComponent extends ITrueFalse {
  selectedAnswer: boolean | null;
  answered: boolean;
}
