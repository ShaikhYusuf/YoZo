export interface ILessonSection {
  Id?: number;
  name: string;
  explanation: string;
  quiz: string;
  fillblanks: string;
  truefalse: string;
  subject?: number;
  lesson?: number;
}
