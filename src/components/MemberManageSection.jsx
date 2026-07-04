import { useState } from 'react';
import { MEMBER_CATEGORIES } from '../data/members';

function MemberManageSection({ members, isAdmin, onAddMember, isSaving, saveStatus }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(MEMBER_CATEGORIES[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (members.some((m) => m.name === trimmed)) {
      alert('이미 명단에 있는 이름입니다.');
      return;
    }
    await onAddMember(trimmed, category);
    setName('');
    setCategory(MEMBER_CATEGORIES[0]);
    setIsFormOpen(false);
  };

  return (
    <section className="card member-section">
      <div className="section-header">
        <h2>단원 명단</h2>
        {isAdmin && !isFormOpen && (
          <button className="btn btn-secondary" onClick={() => setIsFormOpen(true)}>
            + 단원 추가
          </button>
        )}
      </div>

      {MEMBER_CATEGORIES.map((cat) => {
        const inCategory = members.filter((m) => m.category === cat);
        return (
          <div className="member-group" key={cat}>
            <div className="member-group-label">
              {cat} ({inCategory.length})
            </div>
            <div className="member-chip-list">
              {inCategory.length === 0 ? (
                <span className="member-empty">-</span>
              ) : (
                inCategory.map((m) => (
                  <span className="member-chip" key={m.name}>
                    {m.name}
                  </span>
                ))
              )}
            </div>
          </div>
        );
      })}

      {isAdmin && isFormOpen && (
        <form className="member-add-form" onSubmit={handleSubmit}>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {MEMBER_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="이름 입력"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? '추가 중...' : '추가'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setIsFormOpen(false);
              setName('');
            }}
          >
            취소
          </button>
        </form>
      )}

      {saveStatus && <p className="save-status">{saveStatus}</p>}
    </section>
  );
}

export default MemberManageSection;
