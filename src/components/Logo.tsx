import './Logo.css';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSlogan?: boolean;
}

export function Logo({ size = 'md', showSlogan = false }: LogoProps) {
  return (
    <div className={`logo logo--${size}`}>
      <div className="logo__icon">🧠</div>
      <div className="logo__text">
        <span className="logo__name">טריווידע</span>
        {showSlogan && (
          <span className="logo__slogan">הטריוויה שממציאה את עצמה</span>
        )}
      </div>
    </div>
  );
}
