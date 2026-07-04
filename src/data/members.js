// 단원 명단 초기값 (Firestore에 아직 저장된 명단이 없을 때 사용하는 기본값).
// 관리자가 "단원 추가"로 저장하면 이후에는 Firestore의 명단이 우선 적용된다.
export const DEFAULT_MEMBERS = [
  { name: '이영단', category: '청년' },
  { name: '정도진', category: '청년' },
  { name: '육태준', category: '청년' },
  { name: '이진주', category: '청년' },
  { name: '이도경', category: '청년' },
  { name: '유경주', category: '청년' },
  { name: '김태희', category: '청년' },
  { name: '서정철', category: '청년' },
];

// 단원 구분값
export const MEMBER_CATEGORIES = ['청년', '중고등부'];

// 배정이 필요한 5개 파트
export const LITURGY_PARTS = [
  '해설(마이크)',
  '해설(PPT)',
  '독서1',
  '독서2',
  '보편지향기도',
];

// 드롭다운에서 "직접 입력"을 선택했을 때 사용하는 특수 값
export const CUSTOM_INPUT_VALUE = '__CUSTOM__';
