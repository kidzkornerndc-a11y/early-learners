export enum AppScreen {
  WELCOME = 'WELCOME',
  DASHBOARD = 'DASHBOARD',
  TRACING = 'TRACING',
  REPORTS = 'REPORTS'
}

export enum Category {
  ALPHABET = 'ALPHABET',
  NUMBERS = 'NUMBERS',
  SIGHT_WORDS = 'SIGHT_WORDS'
}

export const STORAGE_KEYS = {
  USERS_LIST: 'early_learners_users',
  APP_LOGO: 'early_learners_logo',
  PROGRESS_PREFIX: 'early_learners_progress_'
};

export interface TraceItem {
  id: string;
  label: string; // What to display (A, 1, The)
  speechPrompt: string; // "The letter A" or "The number 1"
  category: Category;
  requiredTraces: number; // 2
}

export interface UserProgress {
  name: string;
  // Map of Item ID -> Number of successful traces
  progress: Record<string, number>;
  // Map of Item ID -> Number of failed attempts
  mistakes?: Record<string, number>;
}

export const ALPHABET_ITEMS: TraceItem[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').map(char => ({
  id: `char_${char}`,
  label: char,
  speechPrompt: `The letter ${char}`,
  category: Category.ALPHABET,
  requiredTraces: 2
}));

export const NUMBER_ITEMS: TraceItem[] = Array.from({ length: 50 }, (_, i) => i + 1).map(num => ({
  id: `num_${num}`,
  label: num.toString(),
  speechPrompt: `The number ${num}`,
  category: Category.NUMBERS,
  requiredTraces: 2
}));

// Basic sight words for 0-4
export const SIGHT_WORDS: TraceItem[] = [
  "I", "A", "THE", "AND", "TO", "IN", "IS", "YOU", "THAT", "IT",
  "ME", "MY", "GO", "SEE", "LOOK", "PLAY", "RUN", "CAN", "COME",
  "HELP", "ON", "AT", "FOR", "UP", "DOWN", "BIG", "LITTLE",
  "RED", "BLUE", "YELLOW", "FUNNY"
].map(word => ({
  id: `word_${word}`,
  label: word,
  speechPrompt: `The word ${word}`,
  category: Category.SIGHT_WORDS,
  requiredTraces: 2
}));