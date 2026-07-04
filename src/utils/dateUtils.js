// 매주 토요일 미사 기준으로 "O월 N주차" 라벨과 실제 날짜를 계산하는 유틸리티

const MONTH_NAMES = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
];

/**
 * 기준 월(0-indexed offset, 0=이번 달)의 연/월을 반환
 */
export function getTargetYearMonth(baseDate, monthOffset) {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset, 1);
  return { year: d.getFullYear(), month: d.getMonth() }; // month: 0-indexed
}

/**
 * 해당 연/월에 속하는 모든 토요일 날짜를 구해서
 * "N월 N주차" 라벨과 실제 Date를 함께 반환한다.
 * ex) [{ weekIndex: 1, label: '7월 1주차', date: Date }, ...]
 */
export function getSaturdaysOfMonth(year, month) {
  const result = [];
  const lastDay = new Date(year, month + 1, 0).getDate();
  let weekIndex = 0;

  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month, day);
    if (date.getDay() === 6) {
      weekIndex += 1;
      result.push({
        weekIndex,
        label: `${MONTH_NAMES[month]} ${weekIndex}주차`,
        date,
        dateKey: formatDateKey(date),
      });
    }
  }
  return result;
}

export function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getMonthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function getMonthLabel(year, month) {
  return `${year}년 ${MONTH_NAMES[month]}`;
}

/**
 * 토요일 미사가 있는 날의 "다음날(주일)" 날짜 - 매일미사 사이트에서
 * 주일 전례(제2독서/보편지향기도 포함)를 가져올 때 사용
 */
export function getFollowingSunday(saturdayDate) {
  const d = new Date(saturdayDate);
  d.setDate(d.getDate() + 1);
  return d;
}

/**
 * 기준일 이후(당일 포함) 가장 가까운 토요일을 반환한다.
 * 이미 지난 토요일은 제외하고 다음 토요일로 넘어간다.
 */
export function getNearestUpcomingSaturday(baseDate) {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const diff = (6 - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}
