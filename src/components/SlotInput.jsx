import { MEMBER_CATEGORIES, CUSTOM_INPUT_VALUE } from '../data/members';

/**
 * 한 파트(슬롯)의 봉사자 입력 UI.
 * - 편집 불가(조회 모드): 텍스트만 표시
 * - 편집 가능(관리자 모드): 단원 명단 드롭다운(구분별 그룹) + "직접 입력" 선택 시 텍스트 인풋 노출
 *
 * value 형태: { mode: 'select' | 'custom', name: string }
 */
function SlotInput({ label, value, editable, members, onChange }) {
  const current = value || { mode: 'select', name: '' };

  if (!editable) {
    return (
      <div className="slot">
        <div className="slot-label">{label}</div>
        <div className="slot-value">{current.name || '-'}</div>
      </div>
    );
  }

  const selectValue = current.mode === 'custom' ? CUSTOM_INPUT_VALUE : current.name;

  const handleSelectChange = (e) => {
    const next = e.target.value;
    if (next === CUSTOM_INPUT_VALUE) {
      onChange({ mode: 'custom', name: '' });
    } else {
      onChange({ mode: 'select', name: next });
    }
  };

  const handleTextChange = (e) => {
    onChange({ mode: 'custom', name: e.target.value });
  };

  return (
    <div className="slot slot-editable">
      <div className="slot-label">{label}</div>
      <select className="slot-select" value={selectValue} onChange={handleSelectChange}>
        <option value="">선택 안 함</option>
        {MEMBER_CATEGORIES.map((category) => {
          const inCategory = members.filter((m) => m.category === category);
          if (inCategory.length === 0) return null;
          return (
            <optgroup key={category} label={category}>
              {inCategory.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </optgroup>
          );
        })}
        <option value={CUSTOM_INPUT_VALUE}>직접 입력 (명단에 없는 이름)</option>
      </select>
      {current.mode === 'custom' && (
        <input
          className="slot-text-input"
          type="text"
          placeholder="이름 입력"
          value={current.name}
          onChange={handleTextChange}
        />
      )}
    </div>
  );
}

export default SlotInput;
