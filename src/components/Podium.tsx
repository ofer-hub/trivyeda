import { PlayerAvatar } from './PlayerAvatar';
import type { LeaderboardEntry } from '../types/game';
import './Podium.css';

interface PodiumProps {
  entries: LeaderboardEntry[];
}

export function Podium({ entries }: PodiumProps) {
  const first = entries[0];
  const second = entries[1];
  const third = entries[2];

  return (
    <div className="podium">
      {second && (
        <div className="podium__place podium__place--2">
          <div className="podium__avatar">
            <PlayerAvatar avatar={second.avatar} avatarDataUrl={second.avatarDataUrl} nickname={second.nickname} size="md" />
          </div>
          <div className="podium__name">{second.nickname}</div>
          <div className="podium__score">{second.score.toLocaleString()}</div>
          <div className="podium__bar podium__bar--2">
            <span className="podium__medal">🥈</span>
          </div>
        </div>
      )}
      {first && (
        <div className="podium__place podium__place--1">
          <div className="podium__crown">👑</div>
          <div className="podium__avatar">
            <PlayerAvatar avatar={first.avatar} avatarDataUrl={first.avatarDataUrl} nickname={first.nickname} size="md" />
          </div>
          <div className="podium__name">{first.nickname}</div>
          <div className="podium__score">{first.score.toLocaleString()}</div>
          <div className="podium__bar podium__bar--1">
            <span className="podium__medal">🥇</span>
          </div>
        </div>
      )}
      {third && (
        <div className="podium__place podium__place--3">
          <div className="podium__avatar">
            <PlayerAvatar avatar={third.avatar} avatarDataUrl={third.avatarDataUrl} nickname={third.nickname} size="md" />
          </div>
          <div className="podium__name">{third.nickname}</div>
          <div className="podium__score">{third.score.toLocaleString()}</div>
          <div className="podium__bar podium__bar--3">
            <span className="podium__medal">🥉</span>
          </div>
        </div>
      )}
    </div>
  );
}
