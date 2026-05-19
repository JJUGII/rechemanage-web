# RecheManage Web (`web-js/`)

**RecheManage Web**은 **JavaScript / TypeScript** 기반의 **브라우저 전용 클라이언트** 앱입니다.  
거래내역 **Excel(.xlsx)** · **CSV**를 읽어 분류·월별 요약·활동보고서 HTML을 생성합니다.

## 개인정보·보안

- **거래내역 파일은 서버로 업로드하지 않습니다.** 모든 파싱·분류·HTML 생성은 **브라우저 메모리**에서만 수행됩니다.
- **localStorage**에는 다음만 저장합니다: 삭제한 거래 키, 반영 취소한 파일 키, 회원 수, 마지막 선택 월.  
  **원본 거래 전체를 localStorage에 저장하지 않습니다.**
- 배포는 **정적 파일(`next export` → `out/`)** 만으로 가능합니다(Vercel / Firebase Hosting / Netlify 등).
- 금융 정보이므로 **공용 PC·타인 브라우저**에서는 사용하지 마세요.

## 기능 요약

| 지원 | 미지원 (1차) |
|------|----------------|
| Excel `.xlsx` / `.xls`, CSV, **드래그앤드롭·다중** 업로드, **암호 Excel**(ECMA-376) | OCR |
| 월·상태 필터, **컬럼 정렬**, 행 편집·추가·선택 삭제 | 서버 저장, 로그인, DB |
| 반영 취소·제외 기록(localStorage), **설정 JSON보내기/불러오기** | 데스크톱 INPUT 폴더·설치 프로그램 |
| 회원 수·월별 요약·예상 캐시백 (천단위 콤마 표시) | |
| 활동보고서 HTML 미리보기·복사·다운로드 | |
| **가상 스크롤** 거래 표, **PWA** 설치, 모바일 최소 대응 | |

암호화된 엑셀(`.xlsx` / `.xls`)은 업로드 후 비밀번호 입력으로 브라우저에서 복호화합니다. 비밀번호는 서버·localStorage에 저장하지 않습니다. 일부 암호화 형식(Extensible 등)은 브라우저에서 해제되지 않을 수 있으며, 이 경우 엑셀에서 암호 해제 후 다시 업로드하라는 안내가 표시됩니다.

## 실행 (개발)

```bash
cd web-js
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 을 엽니다.

## 빌드 (정적 export)

```bash
cd web-js
npm run build
```

산출물: **`web-js/out/`** (Next.js `output: "export"`)

로컬에서 정적 서버로 확인:

```bash
npx serve out
```

## 테스트

```bash
cd web-js
npm test
```

## 배포 예시

### Vercel

**Root Directory**(프로젝트 설정 → General)를 반드시 Next 앱 폴더로 맞춥니다.

| Git 저장소 루트 | Vercel Root Directory |
|-----------------|------------------------|
| `club_cashback_manager` | `web-js` |
| `bank` (상위 monorepo) | `club_cashback_manager/web-js` |
| `web-js`만 단독 push | `.` (비움) |

- Build: `npm run build` (또는 저장소 루트의 `vercel.json`이 하위 경로로 위임)
- Output: `out` (`output: "export"`)

`Couldn't find any pages or app directory` 오류는 대부분 **Root Directory가 `web-js`가 아닐 때** 발생합니다.

또는 CLI: `cd web-js && npx vercel`

### Firebase Hosting

```bash
cd web-js
npm run build
firebase init hosting   # public directory = out
firebase deploy
```

### Netlify

- Build command: `npm run build`
- Publish directory: `out`

## PWA (홈 화면에 설치)

`public/manifest.json`, `public/sw.js`, `public/icons/icon.svg` 로 기본 PWA 셸을 제공합니다.  
**HTTPS** 또는 **localhost** 에서만 Service Worker가 등록됩니다.

### 배포 후 설치 방법

1. `npm run build` 후 `out/` 을 정적 호스팅에 올립니다.
2. 브라우저에서 사이트를 엽니다 (반드시 HTTPS 권장).

### Android (Chrome)

1. 사이트 접속 → 메뉴(⋮) → **앱 설치** 또는 **홈 화면에 추가**
2. 설치 후 앱 아이콘으로 실행 (standalone)

### iPhone / iPad (Safari)

1. Safari로 사이트 접속 → 공유(□↑) → **홈 화면에 추가**
2. 이름 확인 후 **추가** → 홈 화면 아이콘으로 실행

### Desktop (Chrome / Edge)

1. 주소창 오른쪽 **설치** 아이콘 또는 메뉴 → **앱 설치** / **RecheManage Web 설치**
2. 설치된 앱은 창 모드로 실행 (브라우저 탭과 분리)

오프라인 시 Service Worker가 캐시한 **기본 shell** 만 제공합니다. 거래 분석은 온라인·로컬 파일 업로드가 필요합니다.

## 설정보내기 / 불러오기

헤더 **설정** 메뉴:

- **보내기**: `reche-web-settings.json` — 제외 파일 키, 제외 거래 키, 회원 수, 마지막 선택 월만 포함
- **불러오기**: 동일 JSON 검증 후 localStorage 반영
- **제외 초기화**: 사용자 제외 기록 삭제

거래 원본 데이터는 JSON에 **포함되지 않습니다**.

## 데스크톱과의 관계

- **RecheManage Full / Lite**(Python·PyQt)는 이 폴더와 별도로 동작합니다.
- OCR·암호화 엑셀·WebEngine 미리보기(데스크톱)가 필요하면 **데스크톱 Full**을 사용하세요.
