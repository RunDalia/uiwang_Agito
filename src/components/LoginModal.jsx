import { useState } from 'react';

// 관리자 비밀번호 입력창. window.prompt는 입력값이 그대로 보이므로
// type="password" 입력칸을 쓰는 별도 창으로 대체한다.
function LoginModal({ onSubmit, onClose }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!onSubmit(password)) {
      setError('비밀번호가 올바르지 않습니다.');
      setPassword('');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <h2 id="login-modal-title">관리자 로그인</h2>
        <input
          type="password"
          className="modal-input"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          placeholder="비밀번호"
          autoComplete="current-password"
          autoFocus
        />
        {error && <p className="modal-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="btn btn-primary" disabled={!password}>
            로그인
          </button>
        </div>
      </form>
    </div>
  );
}

export default LoginModal;
