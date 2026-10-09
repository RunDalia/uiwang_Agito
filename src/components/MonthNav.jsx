import { getMonthLabel } from '../utils/dateUtils';

const MAX_MONTH_OFFSET = 1; // 오늘이 속한 달 기준 앞뒤로 한 달씩만 볼 수 있다

// 지난 달 / 다음 달 이동 버튼. 배정표와 성가표가 같은 달을 함께 본다.
function MonthNav({ year, month, monthOffset, setMonthOffset }) {
  return (
    <div className="month-nav">
      <button
        className="btn btn-secondary"
        onClick={() => setMonthOffset((v) => Math.max(v - 1, -MAX_MONTH_OFFSET))}
        disabled={monthOffset <= -MAX_MONTH_OFFSET}
      >
        ← 지난 달 보기
      </button>
      <span className="month-label">{getMonthLabel(year, month)}</span>
      <button
        className="btn btn-secondary"
        onClick={() => setMonthOffset((v) => Math.min(v + 1, MAX_MONTH_OFFSET))}
        disabled={monthOffset >= MAX_MONTH_OFFSET}
      >
        다음 달 보기 →
      </button>
    </div>
  );
}

export default MonthNav;
