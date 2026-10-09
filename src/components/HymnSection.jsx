import { useMemo, useState } from 'react';
import MonthNav from './MonthNav';
import { SONGS } from '../data/songs';
import { getSaturdaysOfMonth, getNearestUpcomingSaturday, formatDateKey } from '../utils/dateUtils';

// 미사 순서대로. 특송은 가끔만 하므로 조회 화면에서는 입력된 주에만 보인다.
const HYMN_PARTS = [
  { key: '입당', label: '입당 성가' },
  { key: '봉헌', label: '봉헌 성가' },
  { key: '성체', label: '성체 성가' },
  { key: '특송', label: '특송' },
  { key: '파견', label: '파견 성가' },
];

const EMPTY_HYMN = { number: '', title: '' };

function HymnSection({
  monthOffset,
  setMonthOffset,
  year,
  month,
  monthKey,
  isAdmin,
  hymns,
  onChangeHymn,
  onSave,
  isSaving,
  saveStatus,
}) {
  const [showAll, setShowAll] = useState(false);

  const saturdays = useMemo(() => getSaturdaysOfMonth(year, month), [year, month]);
  const nearestWeekKey = useMemo(() => formatDateKey(getNearestUpcomingSaturday(new Date())), []);
  const thisWeek = saturdays.find((week) => week.dateKey === nearestWeekKey);

  const monthData = hymns[monthKey] || {};

  // 조회 모드에서는 이번 주말 미사만 기본으로 보여준다. 보고 있는 달에 이번 주말이
  // 없으면(지난 달/다음 달 등) 그 달 전체를 보여준다.
  const canToggle = !isAdmin && Boolean(thisWeek);
  const visibleWeeks = canToggle && !showAll ? [thisWeek] : saturdays;

  // 번호를 바꾸면 목록에 있는 제목으로 채운다. 목록에 없는 번호면 직접 입력한 제목은
  // 그대로 두고, 이전 번호로 자동 입력됐던 제목만 지운다.
  const handleNumberChange = (weekLabel, part, current, rawNumber) => {
    const number = rawNumber.replace(/\D/g, '');
    const wasAutoFilled = current.title === (SONGS[current.number] || '');
    const title = SONGS[number] || (wasAutoFilled ? '' : current.title);
    onChangeHymn(monthKey, weekLabel, part, { number, title });
  };

  return (
    <section className="card hymn-section">
      <div className="section-header">
        <h2>{month + 1}월 성가표</h2>
        {canToggle && (
          <button className="btn btn-secondary" onClick={() => setShowAll((v) => !v)}>
            {showAll ? '이번 주만 보기' : '전체 보기'}
          </button>
        )}
      </div>

      <MonthNav year={year} month={month} monthOffset={monthOffset} setMonthOffset={setMonthOffset} />

      {visibleWeeks.map((week) => {
        const weekData = monthData[week.label] || {};
        const isNearestWeek = week.dateKey === nearestWeekKey;
        const filledParts = HYMN_PARTS.filter(({ key }) => weekData[key]?.number || weekData[key]?.title);
        return (
          <div className={`hymn-week ${isNearestWeek ? 'hymn-week-highlight' : ''}`} key={week.label}>
            <div className="hymn-week-title">
              <span>{week.label}</span>
              <span className="hymn-week-date">
                {week.date.getMonth() + 1}/{week.date.getDate()} (토)
              </span>
            </div>

            {isAdmin &&
              HYMN_PARTS.map(({ key, label }) => {
                const current = weekData[key] || EMPTY_HYMN;
                return (
                  <div className="hymn-row" key={key}>
                    <div className="hymn-part">{label}</div>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="note-input"
                      value={current.number}
                      onChange={(e) => handleNumberChange(week.label, key, current, e.target.value)}
                      placeholder="번호"
                      aria-label={`${week.label} ${label} 번호`}
                    />
                    <input
                      type="text"
                      className="note-input"
                      value={current.title}
                      onChange={(e) =>
                        onChangeHymn(monthKey, week.label, key, { ...current, title: e.target.value })
                      }
                      placeholder="제목"
                      aria-label={`${week.label} ${label} 제목`}
                    />
                  </div>
                );
              })}

            {!isAdmin &&
              filledParts.map(({ key, label }) => (
                <div className="hymn-row" key={key}>
                  <div className="hymn-part">{label}</div>
                  <div className="hymn-number">{weekData[key].number || '-'}</div>
                  <div>{weekData[key].title || '-'}</div>
                </div>
              ))}
            {!isAdmin && filledParts.length === 0 && (
              <p className="hymn-empty">아직 등록된 성가가 없습니다.</p>
            )}
          </div>
        );
      })}

      {isAdmin && (
        <div className="save-bar">
          <button className="btn btn-primary" onClick={() => onSave(monthKey)} disabled={isSaving}>
            {isSaving ? '저장 중...' : '저장하기'}
          </button>
          {saveStatus && <span className="save-status">{saveStatus}</span>}
        </div>
      )}
    </section>
  );
}

export default HymnSection;
