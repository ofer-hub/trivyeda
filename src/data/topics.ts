export interface TopicCategory {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export const TOPIC_CATEGORIES: TopicCategory[] = [
  { id: 'tanach', label: 'תנ״ך', emoji: '📖', color: '#7C3AED' },
  { id: 'parasha', label: 'פרשת שבוע', emoji: '✡️', color: '#2563EB' },
  { id: 'eretz-israel', label: 'ארץ ישראל', emoji: '🗺️', color: '#059669' },
  { id: 'sport', label: 'ספורט', emoji: '⚽', color: '#DC2626' },
  { id: 'human-body', label: 'גוף האדם', emoji: '🫀', color: '#DB2777' },
  { id: 'holidays', label: 'חגים', emoji: '🕯️', color: '#D97706' },
  { id: 'general', label: 'ידע כללי', emoji: '🧠', color: '#0891B2' },
  { id: 'songs', label: 'שירי ארץ ישראל', emoji: '🎵', color: '#7C3AED' },
];
