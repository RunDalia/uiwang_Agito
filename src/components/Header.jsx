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
        {isAdmin ? '로그아웃' : '로그인'}
      </button>
    </header>
  );
}

export default Header;
