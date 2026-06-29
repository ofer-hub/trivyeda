import './AnswerButton.css';

const ANSWER_COLORS = [
  { bg: '#e0f2fe', border: '#0284c7', text: '#0c4a6e', icon: '▲' },
  { bg: '#fef3c7', border: '#d97706', text: '#78350f', icon: '◆' },
  { bg: '#dcfce7', border: '#16a34a', text: '#14532d', icon: '●' },
  { bg: '#fce7f3', border: '#db2777', text: '#831843', icon: '■' },
];

interface AnswerButtonProps {
  index: number;
  text: string;
  onClick: () => void;
  disabled?: boolean;
  state?: 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed';
}

export function AnswerButton({ index, text, onClick, disabled, state = 'idle' }: AnswerButtonProps) {
  const color = ANSWER_COLORS[index % ANSWER_COLORS.length];

  return (
    <button
      className={`answer-btn answer-btn--${state}`}
      onClick={onClick}
      disabled={disabled || state === 'selected' || state === 'correct' || state === 'wrong' || state === 'dimmed'}
      style={{
        '--btn-bg': color.bg,
        '--btn-border': color.border,
        '--btn-text': color.text,
      } as React.CSSProperties}
    >
      <span className="answer-btn__icon">{color.icon}</span>
      <span className="answer-btn__text">{text}</span>
      {state === 'correct' && <span className="answer-btn__badge">✓</span>}
      {state === 'wrong' && <span className="answer-btn__badge">✗</span>}
    </button>
  );
}
