import './Timer.css';

interface TimerProps {
  timeLeft: number;
  totalTime: number;
  size?: 'sm' | 'md' | 'lg';
}

export function Timer({ timeLeft, totalTime, size = 'md' }: TimerProps) {
  const progress = timeLeft / totalTime;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference * (1 - progress);

  const colorClass =
    progress > 0.5 ? 'timer--green' : progress > 0.25 ? 'timer--yellow' : 'timer--red';

  return (
    <div className={`timer timer--${size} ${colorClass}`}>
      <svg viewBox="0 0 100 100" className="timer__svg">
        <circle cx="50" cy="50" r="40" className="timer__track" />
        <circle
          cx="50"
          cy="50"
          r="40"
          className="timer__progress"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.2s linear' }}
        />
      </svg>
      <span className="timer__number">{timeLeft}</span>
    </div>
  );
}
