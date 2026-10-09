import { useMemo } from 'react';
import SlotInput from './SlotInput';
import { LITURGY_PARTS } from '../data/members';
import {
  getSaturdaysOfMonth,
  getMonthLabel,
  getNearestUpcomingSaturday,
  formatDateKey,
} from '../utils/dateUtils';

const MAX_MONTH_OFFSET = 1; // 오늘이 속한 달 기준 앞뒤로 한 달씩만 볼 수 있다
const NOTE_KEY = '비고';
const NOTE_MAX_LENGTH = 100;

function ScheduleSection({
  monthOffset,
  setMonthOffset,
  year,
  month,
  monthKey,
  isAdmin,
  schedule,
  onChangeSlot,
  onSave,
  isLoading,
  isSaving,
  loadError,
  saveStatus,
  members,
}) {
  const monthLabel = getMonthLabel(year, month);
  const saturdays = useMemo(() => getSaturdaysOfMonth(year, month), [year, month]);
  const nearestWeekKey = useMemo(() => formatDateKey(getNearestUpcomingSaturday(new Date())), []);

  const monthData = schedule[monthKey] || {};

  return (
    <section className="card schedule-section">
      <div className="section-header">
        <h2>주차별 전례 봉사자 배정</h2>
      </div>

      <div className="month-nav">
        <button
          className="btn btn-secondary"
          onClick={() => setMonthOffset((v) => Math.max(v - 1, -MAX_MONTH_OFFSET))}
          disabled={monthOffset <= -MAX_MONTH_OFFSET}
        >
          ← 지난 달 보기
        </button>
        <span className="month-label">{monthLabel}</span>
        <button
          className="btn btn-secondary"
          onClick={() => setMonthOffset((v) => Math.min(v + 1, MAX_MONTH_OFFSET))}
          disabled={monthOffset >= MAX_MONTH_OFFSET}
        >
          다음 달 보기 →
        </button>
      </div>

      {isLoading && <p className="mass-info-status">불러오는 중...</p>}
      {loadError && <p className="mass-info-status mass-info-error">{loadError}</p>}

      <div className="table-scroll">
        <table className="schedule-table">
          <colgroup>
            <col className="col-week" />
            {LITURGY_PARTS.map((part) => (
              <col key={part} />
            ))}
            <col className="col-note" />
          </colgroup>
          <thead>
            <tr>
              <th>주차</th>
              {LITURGY_PARTS.map((part) => (
                <th key={part}>{part}</th>
              ))}
              <th>비고</th>
            </tr>
          </thead>
          <tbody>
            {saturdays.map((week) => {
              const weekData = monthData[week.label] || {};
              const isNearestWeek = week.dateKey === nearestWeekKey;
              return (
                <tr key={week.label} className={isNearestWeek ? 'week-highlight' : undefined}>
                  <td className="week-cell">
                    <div>{week.label}</div>
                    <div className="week-date">
                      {week.date.getMonth() + 1}/{week.date.getDate()} (토)
                    </div>
                  </td>
                  {LITURGY_PARTS.map((part) => (
                    <td key={part}>
                      <SlotInput
                        label={null}
                        editable={isAdmin}
                        value={weekData[part]}
                        members={members}
                        onChange={(next) => onChangeSlot(monthKey, week.label, part, next)}
                      />
                    </td>
                  ))}
                  <td>
                    {isAdmin ? (
                      <input
                        type="text"
                        className="note-input"
                        maxLength={NOTE_MAX_LENGTH}
                        value={weekData[NOTE_KEY] || ''}
                        onChange={(e) => onChangeSlot(monthKey, week.label, NOTE_KEY, e.target.value)}
                        placeholder="비고"
                      />
                    ) : (
                      <div className="slot-value">{weekData[NOTE_KEY] || '-'}</div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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

export default ScheduleSection;
