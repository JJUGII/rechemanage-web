const STORAGE_KEYS = {
  excludedFileKeys: "reche_web_excluded_file_keys",
  excludedTransactionKeys: "reche_web_excluded_tx_keys",
  memberCount: "reche_web_member_count",
  lastSelectedMonth: "reche_web_last_month",
} as const;

function parseJson<T>(raw: string | null, fallback: T): T {
  if (raw == null || raw === "") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadExcludedFileKeys(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const arr = parseJson<string[]>(localStorage.getItem(STORAGE_KEYS.excludedFileKeys), []);
  return new Set(arr);
}

export function saveExcludedFileKeys(keys: Set<string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.excludedFileKeys, JSON.stringify([...keys]));
}

export function loadExcludedTransactionKeys(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const arr = parseJson<string[]>(localStorage.getItem(STORAGE_KEYS.excludedTransactionKeys), []);
  return new Set(arr);
}

export function saveExcludedTransactionKeys(keys: Set<string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.excludedTransactionKeys, JSON.stringify([...keys]));
}

export function loadMemberCount(defaultValue = 20): number {
  if (typeof window === "undefined") return defaultValue;
  const v = localStorage.getItem(STORAGE_KEYS.memberCount);
  if (v == null) return defaultValue;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : defaultValue;
}

export function saveMemberCount(n: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.memberCount, String(n));
}

export function loadLastSelectedMonth(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEYS.lastSelectedMonth) ?? "";
}

export function saveLastSelectedMonth(month: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.lastSelectedMonth, month);
}

export function clearUserExclusions(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.excludedFileKeys);
  localStorage.removeItem(STORAGE_KEYS.excludedTransactionKeys);
}

/** 설정보내기/가져오기 — 거래 원본 데이터는 포함하지 않음 */
export const SETTINGS_EXPORT_VERSION = 1 as const;

export interface PersistedWebSettings {
  version: typeof SETTINGS_EXPORT_VERSION;
  excludedFileKeys: string[];
  excludedTransactionKeys: string[];
  memberCount: number;
  lastSelectedMonth: string;
}

export function buildPersistedSettingsSnapshot(params: {
  excludedFileKeys: Set<string>;
  excludedTransactionKeys: Set<string>;
  memberCount: number;
  lastSelectedMonth: string;
}): PersistedWebSettings {
  return {
    version: SETTINGS_EXPORT_VERSION,
    excludedFileKeys: [...params.excludedFileKeys],
    excludedTransactionKeys: [...params.excludedTransactionKeys],
    memberCount: params.memberCount,
    lastSelectedMonth: params.lastSelectedMonth,
  };
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

/** JSON 객체 검증 후 스냅샷 반환 (localStorage 반영은 호출부에서) */
export function parseImportedSettings(data: unknown): PersistedWebSettings {
  if (typeof data !== "object" || data === null) throw new Error("JSON 형식이 올바르지 않습니다.");
  const o = data as Record<string, unknown>;
  if (o.version !== SETTINGS_EXPORT_VERSION) throw new Error(`지원하지 않는 설정 버전입니다: ${String(o.version)}`);
  if (!isStringArray(o.excludedFileKeys)) throw new Error("excludedFileKeys가 문자열 배열이 아닙니다.");
  if (!isStringArray(o.excludedTransactionKeys)) throw new Error("excludedTransactionKeys가 문자열 배열이 아닙니다.");
  const mc = o.memberCount;
  if (typeof mc !== "number" || !Number.isFinite(mc) || mc < 1) throw new Error("memberCount가 올바르지 않습니다.");
  const lm = o.lastSelectedMonth;
  if (typeof lm !== "string") throw new Error("lastSelectedMonth가 문자열이 아닙니다.");
  return {
    version: SETTINGS_EXPORT_VERSION,
    excludedFileKeys: o.excludedFileKeys,
    excludedTransactionKeys: o.excludedTransactionKeys,
    memberCount: Math.floor(mc),
    lastSelectedMonth: lm,
  };
}

/** 검증된 설정을 localStorage에 즉시 반영 */
export function writePersistedSettingsToStorage(s: PersistedWebSettings): void {
  saveExcludedFileKeys(new Set(s.excludedFileKeys));
  saveExcludedTransactionKeys(new Set(s.excludedTransactionKeys));
  saveMemberCount(s.memberCount);
  if (s.lastSelectedMonth) saveLastSelectedMonth(s.lastSelectedMonth);
}
