import './PlayerAvatar.css';

interface PlayerAvatarProps {
  avatar?: string;       // kept in type for backward compat — not displayed as emoji
  avatarDataUrl?: string;
  nickname?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

function getInitials(nickname: string): string {
  const cleaned = nickname.trim();
  if (!cleaned) return '?';
  const words = cleaned.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

const PALETTE = [
  '#7b2ff7', '#1a73e8', '#00b894', '#e17055',
  '#fd79a8', '#6c5ce7', '#00cec9', '#0984e3',
];

function nickColor(nickname: string): string {
  let h = 0;
  for (let i = 0; i < nickname.length; i++) h = ((h * 31) + nickname.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function PlayerAvatar({ avatarDataUrl, nickname = '', size = 'md', className = '' }: PlayerAvatarProps) {
  const base = `player-avatar player-avatar--${size}${className ? ' ' + className : ''}`;

  if (avatarDataUrl) {
    return <img className={`${base} player-avatar--photo`} src={avatarDataUrl} alt={nickname} />;
  }

  return (
    <span
      className={`${base} player-avatar--initials`}
      style={{ background: nickColor(nickname) }}
      aria-label={nickname}
    >
      {getInitials(nickname)}
    </span>
  );
}
