export interface User {
  id: number;
  username: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  phone?: string;
  email?: string;
}

export interface Student {
  id: number;
  user_id: number;
  name: string;
  gender?: 'male' | 'female';
  birth_date?: string;
  school?: string;
  grade?: number;
  math_score?: string;
  ai_base?: string;
  programming_base?: string;
  awards?: string;
  username?: string;
  status?: string;
}

export interface Question {
  id: number;
  course_type: 'aigc' | 'scratch' | 'python' | 'cpp' | 'math';
  grade_range: string;
  question_type: 'single' | 'multiple' | 'judge';
  content: string;
  options: string;
  answer: string;
  explanation?: string;
  knowledge_point?: string;
  score: number;
  difficulty: number;
  status: 'pending' | 'approved' | 'rejected';
  ai_generated: boolean;
}

export interface Exam {
  id: number;
  name: string;
  course_type: string;
  grade: number;
  question_count: number;
  total_score: number;
  time_limit: number;
  config?: string;
}

export interface ExamRecord {
  id: number;
  student_id: number;
  exam_id: number;
  score: number;
  level: 'A' | 'B' | 'C' | 'D';
  answers?: string;
  duration?: number;
  created_at: string;
  exam_name?: string;
  course_type?: string;
  student_name?: string;
}

export interface ClassItem {
  id: number;
  name: string;
  teacher_id?: number;
  grade?: number;
  teacher_name?: string;
}

export interface Notice {
  id: number;
  template_id?: number;
  student_id: number;
  content: string;
  status: string;
  sent_at: string;
  student_name?: string;
  template_name?: string;
}

export interface NoticeTemplate {
  id: number;
  name: string;
  type: string;
  content: string;
  variables?: string;
}
