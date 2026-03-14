export interface IFillInTheBlank {
  id: number;
  question: string;
  options: string[];
  answer: number;
}
export interface ITrueFalse {
  id: number;
  question: string;
  answer: boolean;
}

export interface IQuiz {
  id: number;
  question: string;
  options: string[];
  answer: number;
}


