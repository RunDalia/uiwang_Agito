import { useEffect, useState } from 'react';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import MonthNav from './MonthNav';

// 복사 배정표는 이미지로 전달받으므로, 별도 파일 저장소 없이 이미지를 줄여서
// Firestore 문서(schedules/altar-{monthKey})에 data URL 문자열로 저장한다.
// Firestore 문서 하나는 1MB를 넘을 수 없어서 그보다 작게 줄인다.
const MAX_DATA_URL_LENGTH = 900_000;
const MAX_IMAGE_SIDE = 1600;

const altarDoc = (monthKey) => doc(db, 'schedules', `altar-${monthKey}`);

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 읽을 수 없습니다.'));
    };
    img.src = url;
  });
}

// 긴 변을 MAX_IMAGE_SIDE 이하로 줄인 JPEG data URL을 만든다. 그래도 크면 더 줄여 본다.
async function toCompressedDataUrl(file) {
  const img = await loadImage(file);
  let side = MAX_IMAGE_SIDE;
  let quality = 0.85;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const scale = Math.min(1, side / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    // 투명 배경(PNG)은 JPEG에서 검게 나오므로 흰색을 먼저 깐다.
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrl.length <= MAX_DATA_URL_LENGTH) return dataUrl;
    side = Math.round(side * 0.8);
    quality = Math.max(0.6, quality - 0.05);
  }
  throw new Error('이미지가 너무 큽니다. 더 작은 이미지로 올려 주세요.');
}

function AltarServerSection({ monthOffset, setMonthOffset, year, month, monthKey, isAdmin }) {
  const [image, setImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setImage('');
    setStatus('');
    getDoc(altarDoc(monthKey))
      .then((snap) => {
        if (!cancelled) setImage(snap.exists() ? snap.data().image || '' : '');
      })
      .catch((err) => {
        if (!cancelled) setStatus(`불러오지 못했습니다: ${err.message}`);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [monthKey]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일을 다시 골라도 change 이벤트가 나도록 비운다
    if (!file) return;
    setIsBusy(true);
    setStatus('올리는 중...');
    try {
      const dataUrl = await toCompressedDataUrl(file);
      await setDoc(altarDoc(monthKey), { image: dataUrl, updatedAt: serverTimestamp() });
      setImage(dataUrl);
      setStatus('이미지를 올렸습니다.');
    } catch (err) {
      setStatus(`올리지 못했습니다: ${err.message}`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`${month + 1}월 복사 배정표 이미지를 삭제할까요?`)) return;
    setIsBusy(true);
    setStatus('');
    try {
      await deleteDoc(altarDoc(monthKey));
      setImage('');
      setStatus('이미지를 삭제했습니다.');
    } catch (err) {
      setStatus(`삭제하지 못했습니다: ${err.message}`);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section className="card altar-section">
      <div className="section-header">
        <h2>{month + 1}월 복사 배정표</h2>
      </div>

      <MonthNav year={year} month={month} monthOffset={monthOffset} setMonthOffset={setMonthOffset} />

      {isLoading && <p className="mass-info-status">불러오는 중...</p>}
      {!isLoading && !image && <p className="hymn-empty">아직 등록된 복사 배정표가 없습니다.</p>}
      {image && (
        <img
          className="altar-image"
          src={image}
          alt={`${month + 1}월 복사 배정표`}
          onClick={() => setIsZoomed(true)}
        />
      )}

      {isAdmin && (
        <div className="save-bar">
          <label className={`btn btn-primary ${isBusy ? 'btn-disabled' : ''}`}>
            {image ? '이미지 바꾸기' : '이미지 올리기'}
            <input type="file" accept="image/*" hidden disabled={isBusy} onChange={handleFileChange} />
          </label>
          {image && (
            <button className="btn btn-secondary" onClick={handleDelete} disabled={isBusy}>
              삭제
            </button>
          )}
          {status && <span className="save-status">{status}</span>}
        </div>
      )}
      {!isAdmin && status && <p className="mass-info-status mass-info-error">{status}</p>}

      {isZoomed && (
        <div className="image-viewer" onClick={() => setIsZoomed(false)}>
          <img src={image} alt={`${month + 1}월 복사 배정표`} />
        </div>
      )}
    </section>
  );
}

export default AltarServerSection;
