/** 거래내용·분류로 거래처·활동보고서 사용내역 추정 (데스크톱 usage_merchant_heuristics.py) */

export function inferUsageType(description: string, category: string): string {
  const t = description || "";
  const u = `${t} ${category || ""}`.toLowerCase();

  if (/bbq|비비큐|우아한형제들/i.test(u) || (u.includes("식사") && u.includes("한강"))) {
    return "저녁식사";
  }
  if (["cu", "gs25", "편의점", "카페", "라면", "간식"].some((x) => u.includes(x))) {
    return "간식";
  }
  if (t.includes("케이엠") || t.includes("주차")) {
    return "주차비";
  }
  if (t.includes("네이버페이") && t.includes("가죽")) {
    return "가죽공예";
  }
  if (t.includes("네이버페이") && (t.includes("장소") || t.includes("대관"))) {
    return "장소대관";
  }
  if (u.includes("캐시백")) {
    return "체크카드 캐시백";
  }
  if (t.includes("이자") || t.includes("예금이자")) {
    return "이자";
  }
  if (["동호회비", "맵퍼스레체능", "동호회 입금", "맵퍼스_", "맵퍼스 "].some((k) => t.includes(k))) {
    return "동호회비";
  }
  return "확인필요";
}

export function inferMerchant(description: string): string {
  const t = (description || "").trim();
  if (!t) return "";
  let head = t.split(/[,/|]/, 1)[0]?.trim() ?? "";
  head = head.replace(/\s+#\S+/g, "").trim();
  return (head || t).slice(0, 80);
}

/** 분류(category) → 보고서 사용내역 라벨 */
export function categoryToReportUsage(category: string): string {
  switch (category) {
    case "간식비":
      return "간식";
    case "장소임대":
      return "장소대관";
    case "입금":
      return "동호회비";
    default:
      return category;
  }
}
