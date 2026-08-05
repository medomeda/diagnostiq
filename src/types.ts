export interface User {
  id: number;
  email: string;
  plan: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_pass?: string;
  smtp_from?: string;
  smtp_secure?: string;
}

export interface Quiz {
  id: number;
  user_id: number;
  title: string;
  description: string;
  slug: string;
  primary_color?: string;
  accent_color?: string;
  font?: string;
  border_radius?: string;
  custom_css?: string;
  logo_url?: string;
  background_cover_url?: string;
  background_color?: string;
  text_color?: string;
  animation_style?: 'slide' | 'fade' | 'pop' | 'bounce';
  button_style?: 'solid' | 'gradient' | 'outline' | 'pill' | 'shadow3d';
  card_style?: 'elevated' | 'glassmorphism' | 'flat' | 'bordered';
  progress_bar_style?: 'bar' | 'dots' | 'percentage' | 'none';
  sound_effects?: number | boolean;
  created_at: string;
  questions?: Question[];
  profiles?: Profile[];
}

export interface Question {
  id?: number;
  question_text: string;
  type: 'single' | 'multiple';
  answers: Answer[];
}

export interface Answer {
  id?: number;
  label: string;
  score: number;
  category: string;
}

export interface Profile {
  id?: number;
  name: string;
  description: string;
  recommendation: string;
  cta_text: string;
  cta_url: string;
  category: string;
  emails_json?: string;
}

export interface Email {
  subject: string;
  body: string;
}

export interface Lead {
  id: number;
  user_email: string;
  profile_name: string;
  scores_json: string;
  created_at: string;
}
