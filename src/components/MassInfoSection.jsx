import { useEffect, useState } from 'react';
import { formatDateKey, getFollowingSunday, getNearestUpcomingSaturday } from '../utils/dateUtils';

// 화면에 표시할 항목과 API 응답 키 매핑
const FIELDS = [
  { key: 'todayLiturgy', label: '오늘 전례' },
  { key: 'firstReading', label: '제1독서' },
  { key: 'responsorialPsalm', label: '화답송' },
  { key: 'secondReading', label: '제2독서' },
  { key: 'gospelAcclamation', label: '복음환호송' },
  { key: 'gospel', label: '복음' },
  { key: 'universalPrayer', label: '보편지향기도' },
];

function MassInfoSection() {
  // mode: 'today' | 'saturday'
  const [mode, setMode] = useState('today');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const today = new Date();
  const saturday = getNearestUpcomingSaturday(today);
  // 토요일 저녁 미사는 "주일 전례(先 봉헌)"를 사용하므로 다음날(주일) 날짜로 조회한다.
  const targetDate = mode === 'today' ? today : getFollowingSunday(saturday);
  const dateKey = formatDateKey(targetDate).replaceAll('-', '');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/missa?date=${dateKey}`)
      .then((res) => {
        if (!res.ok) throw new Error(`요청 실패 (${res.status})`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dateKey]);

  return (
    <section className="card mass-info-section">
      <div className="section-header">
        <h2>오늘의 미사 정보</h2>
        <div className="mass-mode-toggle">
          <button
            className={`btn btn-tab ${mode === 'today' ? 'btn-tab-active' : ''}`}
            onClick={() => setMode('today')}
          >
            오늘 미사
          </button>
          <button
            className={`btn btn-tab ${mode === 'saturday' ? 'btn-tab-active' : ''}`}
            onClick={() => setMode('saturday')}
          >
            이번 주일 미사
          </button>
        </div>
      </div>

      {mode === 'saturday' && (
        <p className="mass-info-note">
          * 토요일 저녁 미사는 주일 전례를 미리 봉헌하므로, 다음날(주일 {targetDate.getMonth() + 1}월{' '}
          {targetDate.getDate()}일) 독서 기준으로 표시됩니다.
        </p>
      )}

      {loading && <p className="mass-info-status">불러오는 중...</p>}
      {error && (
        <p className="mass-info-status mass-info-error">
          정보를 가져오지 못했습니다: {error}
        </p>
      )}

      {!loading && !error && data && (
        <div className="mass-info-body">
          <h3 className="missa-title">{data.missaTitle}</h3>
          {FIELDS.map(({ key, label }) => (
            <div className="mass-field" key={key}>
              <div className="mass-field-label">{label}</div>
              <div className="mass-field-value">{data[key] || '-'}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default MassInfoSection;
