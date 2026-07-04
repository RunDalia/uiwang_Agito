// Vercel Serverless Function: /api/missa?date=YYYYMMDD
//
// 브라우저에서 https://missa.cbck.or.kr 로 직접 fetch하면 CORS 정책 때문에 막힌다.
// 이 함수는 서버(Vercel Edge/Node 런타임)에서 대신 그 페이지를 가져온 뒤,
// 필요한 필드만 파싱해서 JSON으로 프런트엔드에 내려준다.
//
// 주의: missa.cbck.or.kr은 공식 오픈 API가 아니라 HTML 페이지이므로,
// 사이트 마크업이 바뀌면 아래 파싱 로직도 함께 손봐야 한다.
// 아래 파서는 특정 class/id에 의존하지 않고 "라벨 텍스트(제1독서, 화답송 등)"를
// 기준으로 다음 라벨이 나오기 전까지의 텍스트를 모으는 방식이라 마크업 변경에 비교적 강하다.

import * as cheerio from 'cheerio';

const SOURCE_BASE = 'https://missa.cbck.or.kr/DailyMissa';

// 표시 순서 그대로 유지해야 "다음 라벨 전까지" 파싱이 정확히 동작한다.
const SECTION_LABELS = [
  { key: 'todayLiturgy', label: '오늘 전례' },
  { key: 'firstReading', label: '제1독서' },
  { key: 'responsorialPsalm', label: '화답송' },
  { key: 'secondReading', label: '제2독서' },
  { key: 'gospelAcclamation', label: '복음 환호송' },
  { key: 'gospel', label: '복음' },
  { key: 'universalPrayer', label: '보편 지향 기도' },
];

function isValidDate(dateStr) {
  return /^\d{8}$/.test(dateStr);
}

// 화답송/복음환호송: 시편 인용구(citation) 안에 ◎가 섞여 나올 수 있어서
// "마지막 ) 다음에 나오는 첫 ◎"부터 시작한다. 괄호 인용이 없으면 그냥 첫 ◎부터.
function trimFromRefrain(text) {
  const lastParen = text.lastIndexOf(')');
  const searchFrom = lastParen === -1 ? 0 : lastParen + 1;
  const idx = text.indexOf('◎', searchFrom);
  return idx === -1 ? text : text.slice(idx).trim();
}

// 제1독서/제2독서/복음: "<인용구> ▥(또는 ✠) 본문..." 형태이므로
// 인용구를 닫는 '>' 다음에 나오는 기호 앞에서 줄바꿈한다.
function breakBeforeSymbol(text, symbol) {
  const gtIdx = text.indexOf('>');
  if (gtIdx === -1) return text;
  const symIdx = text.indexOf(symbol, gtIdx);
  if (symIdx === -1) return text;
  return `${text.slice(0, symIdx).trimEnd()}\n${text.slice(symIdx)}`;
}

// 제1독서/제2독서/복음 본문: "...말씀입니다.24,18-22" / "...복음입니다.10,17-22"처럼
// 장,절 표시가 끝나는 지점에서 줄바꿈하고, 맨 끝의 "◎ ..." 응답 문구를 마지막 줄로 뺀다.
function formatReadingBody(text) {
  let result = text.replace(/(입니다\.\d[\d,.\-]*)\s+/, '$1\n');
  const lastCircle = result.lastIndexOf('◎');
  if (lastCircle > 0) {
    result = `${result.slice(0, lastCircle).trimEnd()}\n${result.slice(lastCircle)}`;
  }
  return result;
}

// 화답송: 첫 후렴(◎ ...) 문장이 끝나는 지점을 포함해, '○'로 시작하는 절 앞에서는
// 항상 줄바꿈한다(후렴 반복 표시 '◎'는 앞줄 끝에 그대로 붙어 있는다).
function formatResponsorialPsalm(text) {
  return trimFromRefrain(text).replace(/\s*○/g, '\n○');
}

// 복음환호송: 맨 처음 기호를 제외한 모든 ◎/○ 기호 앞에서 줄바꿈한다.
function formatGospelAcclamation(text) {
  return trimFromRefrain(text)
    .replace(/\s*([◎○])/g, '\n$1')
    .trim();
}

// 보편지향기도: 맨 앞 "<...>" 안내문구를 제거하고, "~기도합시다." 다음(기도문 시작 지점)과
// "1." "2." 같은 항목 번호 앞에서 줄바꿈한다.
function formatUniversalPrayer(text) {
  const withoutNote = text.replace(/^\s*<[^>]*>\s*/, '');
  return withoutNote
    .replace(/(기도합시다\.)\s*/g, '$1\n')
    .replace(/(\d{1,2}\.)(?=\s?[가-힣])/g, '\n$1')
    .trim();
}

// el(자신 포함) 안에 몇 개의 "섹션 라벨 제목"이 들어있는지 센다.
// 페이지 전체를 감싸는 최상위 컨테이너처럼 여러 섹션을 통째로 포함하는
// 요소를 걸러내기 위한 용도 - 진짜 섹션 블록은 자기 자신의 라벨 1개만 가진다.
function countLabelHeadings($, el) {
  const headings = $(el).find('h1, h2, h3, h4, h5, h6').addBack('h1, h2, h3, h4, h5, h6');
  let count = 0;
  headings.each((_, h) => {
    const t = $(h).text().replace(/\s+/g, ' ').trim();
    if (SECTION_LABELS.some(({ label }) => t.startsWith(label))) count += 1;
  });
  return count;
}

export function parseMissaHtml(html) {
  const $ = cheerio.load(html);

  // 헤더/본문 영역에서 텍스트 노드를 순서대로 모은다.
  // h1~h6, strong, b, p, div, span 정도를 "섹션 후보 블록"으로 취급하되,
  // 섹션 라벨을 2개 이상 포함하는 요소(=여러 섹션을 통째로 감싸는 상위 컨테이너)는
  // 애초에 후보에서 제외한다. 그래도 남는 조상/자손 중복(예: 섹션 div와 그 안의
  // 제목 줄)은 인접 블록끼리 포함 관계를 비교해 더 긴 쪽으로 합친다.
  const blocks = [];
  $('body')
    .find('h1, h2, h3, h4, h5, h6, strong, b, p, div, span')
    .each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (!text) return;
      if (countLabelHeadings($, el) > 1) return;

      const prev = blocks[blocks.length - 1];
      if (prev === undefined) {
        blocks.push(text);
      } else if (prev === text || prev.includes(text)) {
        // 자손 요소가 조상과 같은(혹은 부분집합인) 텍스트를 반복하는 경우 -> 무시
      } else if (text.includes(prev)) {
        // 조상 요소가 앞서 담긴 자손 텍스트를 포함해 더 길게 반복하는 경우 -> 교체
        blocks[blocks.length - 1] = text;
      } else {
        blocks.push(text);
      }
    });

  // 미사 제목은 본문 파싱 대신 <meta name="title"> / og:title에서 가져온다.
  // "2026.07.05 [홍] ..." 형태이므로 앞의 날짜를 떼어낸다.
  const metaTitle =
    $('meta[name="title"]').attr('content') || $('meta[property="og:title"]').attr('content') || '';
  const missaTitle = metaTitle.replace(/^\d{4}\.\d{2}\.\d{2}\s*/, '').trim();

  const result = {
    missaTitle,
    todayLiturgy: '',
    firstReading: '',
    responsorialPsalm: '',
    secondReading: '',
    gospelAcclamation: '',
    gospel: '',
    universalPrayer: '',
  };

  // 긴 라벨(예: "복음 환호송")부터 매칭해야 짧은 라벨("복음")이 그 블록을 가로채지 않는다.
  const byLongestLabel = [...SECTION_LABELS].sort((a, b) => b.label.length - a.label.length);
  const usedIndexes = new Set();
  for (const { key, label } of byLongestLabel) {
    const idx = blocks.findIndex((t, i) => !usedIndexes.has(i) && t.startsWith(label));
    if (idx === -1) continue;
    usedIndexes.add(idx);
    result[key] = blocks[idx].slice(label.length).trim();
  }

  result.responsorialPsalm = formatResponsorialPsalm(result.responsorialPsalm);
  result.gospelAcclamation = formatGospelAcclamation(result.gospelAcclamation);
  result.firstReading = formatReadingBody(breakBeforeSymbol(result.firstReading, '▥'));
  result.secondReading = formatReadingBody(breakBeforeSymbol(result.secondReading, '▥'));
  result.gospel = formatReadingBody(breakBeforeSymbol(result.gospel, '✠'));
  result.universalPrayer = formatUniversalPrayer(result.universalPrayer);

  return result;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  const date = (req.query.date || '').toString();
  if (!isValidDate(date)) {
    res.status(400).json({ error: 'date 쿼리 파라미터는 YYYYMMDD 형식이어야 합니다.' });
    return;
  }

  try {
    const response = await fetch(`${SOURCE_BASE}/${date}`, {
      headers: {
        // 일부 서버는 브라우저형 User-Agent가 없으면 접근을 막는 경우가 있어 지정한다.
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: `원본 페이지 요청 실패 (${response.status})` });
      return;
    }

    const html = await response.text();
    const data = parseMissaHtml(html);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || '알 수 없는 오류가 발생했습니다.' });
  }
}
