export interface KnowledgePoint {
  id: string;
  name: string;
  hasChart?: boolean;
}

export interface GradeLevel {
  grade: string;
  label: string;
  points: KnowledgePoint[];
}

export interface Subject {
  id: string;
  name: string;
  grades: GradeLevel[];
}
