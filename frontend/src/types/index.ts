export type QuestionType =
  | 'multiple_choice'
  | 'fill_blank'
  | 'true_false'
  | 'solve'
  | 'word_problem'
  | 'chart';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ChartData {
  type: 'bar' | 'pie' | 'line' | 'table' | 'geometry';
  title: string;
  labels?: string[];
  datasets?: { label: string; data: number[]; color?: string }[];
  tableHeaders?: string[];
  tableRows?: string[][];
  description?: string; // fallback text description for geometry
}

export interface Question {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  question: string; // may contain $LaTeX$ inline
  chart?: ChartData | null;
  options?: string[] | null; // ['A. ...', 'B. ...', 'C. ...', 'D. ...']
  answer: string;
  explanation: string;
  knowledgePoint: string;
}

export interface HomeworkSet {
  id: string;
  createdAt: string;
  subject: string;
  subjectId: string;
  grade: string;
  knowledgePoints: string[];
  questions: Question[];
  // stats
  easy: Question[];
  medium: Question[];
  hard: Question[];
}

export interface GenerateRequest {
  subjectId: string;
  grade: string;
  knowledgePointIds: string[];
  questionTypes: QuestionType[];
  counts: { easy: number; medium: number; hard: number };
}

export interface AIRoleConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface AppConfig {
  primary: AIRoleConfig;
  fallback: AIRoleConfig;
  multimodal: AIRoleConfig;
  province: string;
  city: string;
}

export interface HistoryItem {
  id: string;
  created_at: string;
  subject: string;
  grade: string;
  summary: string;
}
