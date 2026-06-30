import './AnswerButton.css';

const ANSWER_COLORS = [
  { bg: 'rgba(14,165,233,0.14)',  border: '#0ea5e9', text: '#fff', icon: '▲' },
  { bg: 'rgba(234,179,8,0.14)',   border: '#fbbf24', text: '#fff', icon: '◆' },
  { bg: 'rgba(34,197,94,0.14)',   border: '#4ade80', text: '#fff', icon: '●' },
  { bg: 'rgba(236,72,153,0.14)',  border: '#f472b6', text: '#fff', icon: '■' },
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
      {state === 'wrong'   && <span className="answer-btn__badge">✗</span>}
    </button>
  );
}
