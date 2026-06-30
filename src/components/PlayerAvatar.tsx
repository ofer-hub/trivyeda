import './PlayerAvatar.css';

interface PlayerAvatarProps {
  avatar: string;
  avatarDataUrl?: string;
  nickname?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PlayerAvatar({ avatar, avatarDataUrl, nickname, size = 'md', className = '' }: PlayerAvatarProps) {
  if (avatarDataUrl) {
    return (
      <img
        className={`player-avatar player-avatar--${size}${className ? ' ' + className : ''}`}
        src={avatarDataUrl}
        alt={nickname ?? avatar}
      />
    );
  }
  return (
    <span
      className={`player-avatar-emoji player-avatar-emoji--${size}${className ? ' ' + className : ''}`}
      role="img"
      aria-label={nickname ?? avatar}
    >
      {avatar}
    </span>
  );
}
