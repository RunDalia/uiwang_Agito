function Header({ isAdmin, onToggleAdmin }) {
  return (
    <header className="app-header">
      <div className="app-header-title">
        <span className="app-header-sub">의왕성당</span>
        <h1>아키토 Agito</h1>
      </div>
      <button
        className={`admin-toggle ${isAdmin ? 'admin-toggle-active' : ''}`}
        onClick={onToggleAdmin}
      >
        {isAdmin ? '관리자 모드 (ON)' : '조회 모드'}
      </button>
    </header>
  );
}

export default Header;
