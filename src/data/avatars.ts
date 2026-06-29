export interface Avatar {
  id: string;
  emoji: string;
  label: string;
}

export const AVATARS: Avatar[] = [
  { id: 'lion', emoji: '🦁', label: 'אריה' },
  { id: 'panda', emoji: '🐼', label: 'פנדה' },
  { id: 'fox', emoji: '🦊', label: 'שועל' },
  { id: 'frog', emoji: '🐸', label: 'צפרדע' },
  { id: 'monkey', emoji: '🐵', label: 'קוף' },
  { id: 'tiger', emoji: '🐯', label: 'נמר' },
  { id: 'dog', emoji: '🐶', label: 'כלב' },
  { id: 'cat', emoji: '🐱', label: 'חתול' },
  { id: 'owl', emoji: '🦉', label: 'ינשוף' },
  { id: 'rabbit', emoji: '🐰', label: 'ארנב' },
  { id: 'penguin', emoji: '🐧', label: 'פינגווין' },
  { id: 'bear', emoji: '🐻', label: 'דוב' },
];
