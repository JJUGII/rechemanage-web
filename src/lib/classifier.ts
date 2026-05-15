import type { SupportStatus } from "./types";

export interface ClassificationResult {
  category: string;
  supportStatus: SupportStatus;
  reason: string;
}

function compact(s: string): string {
  return s.replace(/\s+/g, "").toLowerCase();
}

function contains(haystack: string, keyword: string): boolean {
  const k = keyword.trim();
  if (!k) return false;
  const hl = haystack.toLowerCase();
  const hc = compact(haystack);
  const kl = k.toLowerCase();
  const kc = compact(k);
  if (kc && hc.includes(kc)) return true;
  if (kl.length <= 3 && /^[a-z]+$/i.test(kl)) {
    const re = new RegExp(`(?<![a-z0-9])${kl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z0-9])`, "i");
    return re.test(hl);
  }
  return hl.includes(kl);
}

function matchAny(text: string, keywords: readonly string[]): boolean {
  return keywords.some((k) => contains(text, k));
}

/** '한강버스잠' 등 — 버스 단독은 경계 매칭 */
function busOk(text: string): boolean {
  const hc = compact(text);
  if (hc.includes("버스잠")) return false;
  const hl = text.toLowerCase();
  if (/(고속버스|시내버스|마을버스|광역버스|시외버스)/i.test(text)) return true;
  return /(?<![가-힣a-z0-9])버스(?![가-힣a-z])/i.test(hl);
}

function matchTransport(text: string): boolean {
  const keys = [
    "택시",
    "카카오택시",
    "지하철",
    "고속버스",
    "기차",
    "KTX",
    "SRT",
    "교통카드",
  ];
  for (const k of keys) {
    if (contains(text, k)) return true;
  }
  if (contains(text, "버스")) return busOk(text);
  return false;
}

const DEPOSIT_EXCLUDE = [
  "동호회비",
  "캐시백",
  "체크카드 캐시백",
  "지원금",
  "페이백",
  "이자",
  "맵퍼스",
] as const;

const MEAL_DENIED = [
  "저녁식사",
  "점심식사",
  "아침식사",
  "식사",
  "식대",
  "회식",
  "배달",
  "배달의민족",
  "우아한형제들",
  "요기요",
  "쿠팡이츠",
  "피자",
  "치킨",
  "BBQ",
  "비비큐",
  "음식점",
  "식당",
  "고기",
  "족발",
  "보쌈",
  "분식",
  "김밥",
  "햄버거",
  "맥도날드",
  "버거킹",
  "롯데리아",
] as const;

const PARKING = [
  "주차",
  "주차비",
  "주차장",
  "파킹",
  "케이엠파크",
  "KM파크",
  "하이파킹",
  "아이파킹",
] as const;

const SNACK = [
  "CU",
  "씨유",
  "GS25",
  "지에스25",
  "세븐일레븐",
  "이마트24",
  "편의점",
  "마트",
  "다이소",
  "카페",
  "스타벅스",
  "투썸",
  "메가커피",
  "빽다방",
  "베이커리",
  "파리바게뜨",
  "뚜레쥬르",
  "간식",
  "과자",
  "음료",
  "라면",
  "생수",
] as const;

const VENUE = [
  "장소대관",
  "대관",
  "공간대여",
  "공간",
  "회의실",
  "체육관",
  "코트",
  "시설예약",
  "예약",
] as const;

const ACTIVITY = [
  "가죽공예",
  "공예",
  "원데이클래스",
  "클래스",
  "공방",
  "재료",
  "용품",
  "장비",
  "문구",
] as const;

function joinText(description: string, merchant?: string): string {
  return [description, merchant ?? ""].filter(Boolean).join(" ").trim();
}

/**
 * 우선순위 (웹 1차 스펙):
 * 1 입금+키워드 → 계산제외
 * 2 식사/배달 → 불인정
 * 3 주차 → 확인필요
 * 4 간식 → 인정
 * 5 장소대관 → 인정
 * 6 활동용품 → 인정
 * 7 교통 → 인정
 * 8 나머지 → 확인필요
 */
export function classifyTransaction(
  description: string,
  merchant: string | undefined,
  deposit: number,
  withdrawal: number,
): ClassificationResult {
  const text = joinText(description, merchant);
  if (!text) {
    return { category: "확인필요", supportStatus: "확인필요", reason: "내용 없음 — 분류 불가" };
  }

  if (deposit > 0 && matchAny(text, [...DEPOSIT_EXCLUDE])) {
    return { category: "입금", supportStatus: "계산제외", reason: "입금 거래 — 사용금액 계산 제외" };
  }

  if (matchAny(text, [...MEAL_DENIED])) {
    return { category: "식대", supportStatus: "불인정", reason: "식대/식사류는 지원 기준상 불인정" };
  }

  if (matchAny(text, [...PARKING])) {
    return { category: "주차비", supportStatus: "확인필요", reason: "주차비는 교통비 인정 여부 확인 필요" };
  }

  if (matchAny(text, [...SNACK])) {
    return { category: "간식비", supportStatus: "인정", reason: "간식비는 지원 인정 항목" };
  }

  if (matchAny(text, [...VENUE])) {
    return { category: "장소임대", supportStatus: "인정", reason: "대관·시설 키워드 일치" };
  }

  if (matchAny(text, [...ACTIVITY]) || naverWithActivity(text)) {
    return { category: "활동용품", supportStatus: "인정", reason: "활동용품·재료비는 지원 인정 항목" };
  }

  if (matchTransport(text)) {
    return { category: "교통비", supportStatus: "인정", reason: "활동을 위한 교통비는 지원 인정 항목" };
  }

  void withdrawal;
  return { category: "확인필요", supportStatus: "확인필요", reason: "분류 규칙 미일치 — 수동 확인" };
}

function naverWithActivity(text: string): boolean {
  if (!text.toLowerCase().includes("네이버") && !text.includes("네이버페이")) return false;
  return matchAny(text, [...ACTIVITY]) || matchAny(text, [...VENUE]);
}
