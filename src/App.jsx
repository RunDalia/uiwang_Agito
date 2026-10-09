import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import Header from './components/Header';
import LoginModal from './components/LoginModal';
import ScheduleSection from './components/ScheduleSection';
import MassInfoSection from './components/MassInfoSection';
import { getTargetYearMonth, getMonthKey } from './utils/dateUtils';
import { DEFAULT_MEMBERS } from './data/members';
import './App.css';

// TODO: 실서비스에서는 하드코딩 비밀번호 대신 Firebase Auth 등 실제 인증으로 교체하세요.
// 지금 이 값은 화면(UI)만 잠그는 것이지, Firestore 쓰기 자체를 막지는 않습니다.
// Firestore 보안 규칙에서 관리자만 쓰기 가능하도록 별도로 제한해야 진짜로 안전합니다.
const ADMIN_PASSWORD = 'agito2026';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);

  // schedule: { [monthKey]: { [weekLabel]: { [part]: {mode, name} } } } 형태의 로컬 캐시.
  // Firestore에서 monthKey별 문서를 불러와 이 캐시에 채워 넣는다.
  const [schedule, setSchedule] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  // 단원 명단: Firestore(config/members)에 저장된 값이 있으면 그것을, 없으면
  // data/members.js의 기본값을 사용한다.
  const [members, setMembers] = useState(DEFAULT_MEMBERS);

  const today = useMemo(() => new Date(), []);
  const { year, month } = useMemo(
    () => getTargetYearMonth(today, monthOffset),
    [today, monthOffset]
  );
  const monthKey = useMemo(() => getMonthKey(year, month), [year, month]);

  // 조회 중인 달이 바뀔 때마다 Firestore의 schedules/{monthKey} 문서를 읽어온다.
  // 다른 사람이 저장한 최신 데이터를 항상 반영하기 위해 매번 새로 조회한다.
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError('');

    getDoc(doc(db, 'schedules', monthKey))
      .then((snap) => {
        if (cancelled) return;
        const weeks = snap.exists() ? snap.data().weeks || {} : {};
        setSchedule((prev) => ({ ...prev, [monthKey]: weeks }));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(`데이터를 불러오지 못했습니다: ${err.message}`);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [monthKey]);

  // 단원 명단은 달과 무관하게 한 번만 불러온다.
  useEffect(() => {
    let cancelled = false;
    getDoc(doc(db, 'config', 'members'))
      .then((snap) => {
        if (cancelled) return;
        if (snap.exists() && Array.isArray(snap.data().list)) {
          setMembers(snap.data().list);
        }
      })
      .catch(() => {
        // 명단 조회 실패 시에는 조용히 기본값(DEFAULT_MEMBERS)을 그대로 사용한다.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleAdmin = () => {
    if (isAdmin) {
      setIsAdmin(false);
      return;
    }
    setIsLoginOpen(true);
  };

  // 비밀번호가 맞으면 관리자 모드로 전환하고 true를, 틀리면 false를 반환한다.
  const handleLogin = (password) => {
    if (password !== ADMIN_PASSWORD) return false;
    setIsAdmin(true);
    setIsLoginOpen(false);
    return true;
  };

  const handleChangeSlot = (targetMonthKey, weekLabel, part, value) => {
    setSchedule((prev) => {
      const monthData = prev[targetMonthKey] || {};
      const weekData = monthData[weekLabel] || {};
      return {
        ...prev,
        [targetMonthKey]: {
          ...monthData,
          [weekLabel]: {
            ...weekData,
            [part]: value,
          },
        },
      };
    });
    setSaveStatus('');
  };

  const handleSave = async (targetMonthKey) => {
    setIsSaving(true);
    setSaveStatus('');
    try {
      await setDoc(
        doc(db, 'schedules', targetMonthKey),
        {
          weeks: schedule[targetMonthKey] || {},
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setSaveStatus(`저장되었습니다 (${targetMonthKey})`);
    } catch (err) {
      setSaveStatus(`저장 실패: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="app-shell">
      <Header isAdmin={isAdmin} onToggleAdmin={handleToggleAdmin} />
      <main className="app-main">
        <ScheduleSection
          monthOffset={monthOffset}
          setMonthOffset={setMonthOffset}
          year={year}
          month={month}
          monthKey={monthKey}
          isAdmin={isAdmin}
          schedule={schedule}
          onChangeSlot={handleChangeSlot}
          onSave={handleSave}
          isLoading={isLoading}
          isSaving={isSaving}
          loadError={loadError}
          saveStatus={saveStatus}
          members={members}
        />
        <MassInfoSection />
      </main>
      {isLoginOpen && <LoginModal onSubmit={handleLogin} onClose={() => setIsLoginOpen(false)} />}
    </div>
  );
}

export default App;
