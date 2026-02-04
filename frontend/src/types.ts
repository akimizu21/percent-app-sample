export interface Team {
  id: number;
  name: string;
  points: number;
  color: string;
}

export interface Question {
  id: number;
  question_text: string;
  correct_answer: number;
  order_num: number;
  is_answered: boolean;
}

export interface Game {
  id: number;
  name: string;
  teams: Team[];
  questions: Question[];
}

export interface GameSummary {
  id: number;
  name: string;
  created_at: string;
  team_count: number;
  question_count: number;
}

export interface TeamAnswer {
  team_id: number;
  answer: number;
}

export interface SubmitResult {
  team_id: number;
  team_name: string;
  answer: number;
  correct_answer: number;
  difference: number;
  new_points: number;
}

export interface SubmitResponse {
  question_id: number;
  correct_answer: number;
  results: SubmitResult[];
}
