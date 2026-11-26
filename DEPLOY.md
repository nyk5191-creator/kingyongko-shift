# 용코교대 — GitHub Pages 배포 정보 (2026-11-26 완료)

## 라이브 주소
- https://nyk5191-creator.github.io/kingyongko-shift/
- 저장소: https://github.com/nyk5191-creator/kingyongko-shift (public, `main`)
- Pages 설정: Source = `Deploy from a branch`, Branch = `main`, Folder = `/ (root)`, `https_enforced: true`, `build_type: legacy`
- 배포 커밋: `8638e59`(최초), `03c3b23`(README 공개주소 추가), v2.1 커밋(테마 3종·ABCD조·코칭 요약) — 모두 `built` 확인

## 앱 고칠 때 갱신 방법
```bash
cd work/gh_deploy_shift
# downloads/kingyongko_shift_app/ 에서 수정 후 파일 복사
cp ../../downloads/kingyongko_shift_app/*.{html,css,js,json,png} . 2>/dev/null   # sh에서는 개별 cp 사용
git add -A && git commit -m "feat: ..." && git push origin main
```
- 푸시 후 30~60초면 자동 반영(`gh api repos/nyk5191-creator/kingyongko-shift/pages/builds/latest --jq .status` 로 `built` 확인).
- `sw.js`를 수정했다면 `CACHE` 값을 반드시 올린다(현재 `yongko-shift-v2.5.3`). 안 올리면 기존 사용자 홈 화면 앱이 옛 캐시를 계속 볼 수 있음.
- 검증: `curl -s -o /dev/null -w '%{http_code}' https://nyk5191-creator.github.io/kingyongko-shift/` → 200, 그리고 `index.html`/`app.js`/`app.css`/`manifest.json`/`icon-192.png` 모두 200.

## Pickle GitHub 앱(@nyk5191-creator) 권한 — 2026-11-26 기준
- 설치 id 186138821, `repository_selection: all`
- 부여됨: `contents:write`, `issues:write`, `pull_requests:write`, `actions:write`, `checks:read`, `statuses:read`, `metadata:read`
- **없음(그래서 막히는 것)**
  - `administration` → `gh repo create` 불가: `nyk5191-creator does not have the correct permissions to execute 'CreateRepository'`
  - `pages` → Pages 켜기/수정 불가: `Resource not accessible by integration` (POST·PUT `/pages`)
  - `workflows` → `.github/workflows/*.yml` 푸시 불가: `refusing to allow a GitHub App to create or update workflow ... without 'workflows' permission`
  - 그래서 이번엔 **사용자가 저장소 생성 + Settings → Pages 토글**을 직접 했다.
  - `PATCH /repos/...`(homepage·topics)도 403 — 저장소 소개 링크는 사용자가 직접 넣어야 함.

## v2.5.3 (2026-11-27) — 설정 탭 🎨 근무 배지 색깔
- **`index.html`** — `설정 → 화면 테마` 카드 바로 아래(내 회사 찾기 위)에 `🎨 근무 배지 색깔` `sec-head` + `.card`(#badgePick) + `.help` 추가. 버전: `?v=2.5.3`(6곳: apple-touch-icon·favicon-32·icon-192·app.css·brand-mark·app.js) · 하단 표기 `교대핏 v2.5.3`(3곳) · `?v=2.5.2` 0건(남은 `2.5.2` 1건은 계산기 이동을 설명하는 v2.5.2 이력 주석).
- **`app.js`** — `BADGE_PALETTE` 7색(파랑 `#4C8DFF`/`#1A63D8` · 하늘 `#38BDF8`/`#0284C7` · 보라 `#B18CFF`/`#6B45D6` · 남색 `#7B8BFF`/`#3B3FA8` · 초록 `#35D07F`/`#0E8A5E` · 주황 `#FFA24C`/`#BE6600` · 코랄 `#FF6B81`/`#C4213C` — 앞=다크·네이비, 뒤=화이트) · `BADGE_CODES=['D','A','N','O']` · `state.badgeColors`(DEFAULTS + `load()`의 `normalizeBadgeColors`, 모르는 id는 `''`=기본색) · `applyBadgeColors()`가 `document.documentElement.style`에 `--d/--d-rgb`(등 4종)를 set/removeProperty · `renderBadgePick()`(4행 × 7색 + 행별 `기본값` 버튼, 배지 미리보기는 `var(--d)` 등으로 자동) · `applyTheme()`에서 `applyBadgeColors()` → `setShiftVars()` 순서로 호출(테마 바뀌면 톤 자동 교체) · `#badgePick` 클릭 위임 → `save()` + `applyBadgeColors()` + `setShiftVars()` + `renderBadgePick()` + `renderCal/renderLog/renderToday` + 토스트 · PNG는 `imgPalette()`의 `imgShiftColor(code,…)`가 팔레트에서 직접 계산(=`getComputedStyle` 의존 없이 확실히 반영).
- **`app.css`** — `.badge-pick/.bp-row/.bp-head/.bp-chip(.c-d/.c-a/.c-n/.c-o)/.bp-name/.bp-val/.bp-reset/.bp-colors/.bp-sw(.on ✓표시)` 17개 규칙 추가. 색 칩은 `--sw` 인라인 값으로 칠하고 선택 시 `box-shadow` 링.
- **`sw.js`** — `VERSION = '2.5.3'` · `CACHE = 'yongko-shift-v2.5.3'`(리터럴).
- 배포: 커밋 `774b0cc`(기능) → `c412b48`(sw CACHE 리터럴) → Pages `built`. 검수(2026-11-27 05:00 KST): 라이브 HTTP 200 — `/`·`/index.html` 70,925B, `app.js?v=2.5.3` 128,124B, `app.css?v=2.5.3` 60,183B, `sw.js` 3,009B, `manifest.json` 930B, `icon-192.png` 39,476B. **MD5 로컬=라이브 6/6 일치** — `index.html` `d4f37571`, `app.js` `c0c66865`, `app.css` `8c4eaadd`, `sw.js` `1fa301ab`, `manifest.json` `f421ce74`, `icon-192.png` `e9bedde1`.
- 라이브 구조 — `#badgePick` 1개(설정 탭, `#themePick` 뒤·`#coInput` 앞), `BADGE_PALETTE`·`renderBadgePick`·`badgeColors` 존재, 팔레트 id 7개(`blue`·`sky`·`purple`·`navy`·`green`·`orange`·`coral`), `.bp-` CSS 17건, `sw.js` `VERSION='2.5.3'`/`CACHE='yongko-shift-v2.5.3'`.
- JS 문법: `esprima.parseScript` 통과(`app.js` 128,124B · `sw.js` 3,009B). HTML 태그 밸런스 오류 0건(section 5/5), CSS 중괄호 583/583. **Playwright 미실시** — 브리프 지시(문법·구조 검사 + `git push` + `curl` HTTP·MD5로 대체).

## v2.5.2 (2026-11-27) — 칼로리 계산기를 기록 탭 맨 위로 이동
- **`index.html`** — `#tab-log`의 날짜바 바로 아래(이달 누적 러닝/오운완 `#logStats` 위)에 `🧮 내 탄단지·칼로리` `sec-head` + `#calcCard` 카드 + `계산 공식 — 직접 검산용` 아코디언을 통째로 이동. 기존 `gblock[data-cat="calc"]` 래퍼는 벗기고 내부만 2칸 dedent. ID 10개(`calcSex`·`calcWeight`·`calcAct`·`calcGoal`·`calcKcal`·`calcP`·`calcF`·`calcC`·`calcLine`·`calcSub`)와 `calcNote` 그대로 — 기능·저장값(`state.calc`) 변경 없음.
- **가이드 정리** — `data-gcat="calc"` 칩 삭제(칩 5개: `전체 | 📕 전자책 핵심 | ❓ Q&A 백과 | 🏃 러닝 | 🩺 건강·수면`), 가이드 날짜바 설명에서 `· 계산기` 제거, 더 보기 블록 주석 번호 6→5. 기록 탭 날짜바 설명은 `탄단지 계산 · 체중 · 러닝 거리 · 운동 부위 · 식단 메모`.
- **`app.js`** — `GCATS = ['all','ebook','qa','run','health']`(저장된 `guideCat='calc'`는 `load()`의 `GCATS.indexOf` 폴백으로 `'all'`), `renderTab('log')`에서 `renderCalc()` 호출. 계산기 이벤트는 document 위임 + `#calcWeight` 직접 바인딩이라 탭과 무관하게 동작.
- `?v=2.5.2`(index.html 9곳) · `sw.js` `VERSION = '2.5.2'` / `CACHE = yongko-shift-v2.5.2` · 하단 표기 `교대핏 v2.5.2`(3곳). README 상단 버전·v2.5.2 절 추가.
- 배포: 커밋 `bd1f789` → Pages `built`. 검수(2026-11-27 04:53 KST): 라이브 HTTP 200 — `/`·`/index.html` 70,375B, `app.js?v=2.5.2` 122,079B, `app.css?v=2.5.2` 58,406B, `sw.js` 2,970B, `manifest.json` 930B, `icon-192.png` 39,476B. **MD5 로컬=라이브 6/6 일치** — `index.html` `8b876139`, `app.js` `e7a15a2b`, `app.css` `abf1747c`, `sw.js` `b5e10fe8`, `manifest.json` `f421ce74`, `icon-192.png` `e9bedde1`.
- 라이브 구조 — `data-gcat` 칩 5개(`all`·`ebook`·`qa`·`run`·`health`, `calc` 0건), `gblock` 6개(`start`·`ebook`·`qa`·`run`·`health`·`cta`), `#calcCard`는 `#tab-log` 안(줄 202) · `#logStats`(줄 270)보다 앞, `#tab-guide` 안에 `calcCard` 없음. `app.js` `GCATS = ['all', 'ebook', 'qa', 'run', 'health']`, `sw.js` `VERSION = '2.5.2'`, `index.html` `2.5.2` 10곳·`2.5.1` 0곳.
- JS 문법: `esprima.parseScript` 통과(`app.js` 122,079B · `sw.js`) — node 없음. HTML 태그 밸런스 오류 0건(미닫힘 0), CSS 중괄호 564/564. **Playwright 미실시** — 브리프 지시(한도 절약: 문법·태그 검사 + `git push` + `curl` HTTP·MD5로 대체).

## v2.5.1 (2026-11-27) — 가이드 문구 3곳
- Q3 제목 `잠 어떻게 자나요?` · Q3 카페인 행 `수면 패턴 바꾸는 날` · 4조 2교대 `주·주·휴·휴·야·야·휴·휴 (8일)` · 3대 수칙 하단 `더 자세히 볼 수 있다`. 커밋 `cfe183f`.

## v2.5.0 (2026-11-27) — 가이드 분리(러닝·건강·수면) + 탄단지·칼로리 계산기
- **가이드 칩 6개** — `전체 | 📕 전자책 핵심 | ❓ Q&A 백과 | 🏃 러닝 | 🩺 건강·수면 | 🧮 칼로리 계산기`. `GCATS = ['all','ebook','qa','run','health','calc']`, `.gblock[data-cat]` 7개(`start`·`ebook`·`qa`·`run`·`health`·`calc`·`cta`).
  - 기존 `🏃 러닝·건강`(run)을 둘로 — `run` = 심박수 존(Zone 2/4) + 교대근무자 러닝 가이드(+기록 행 신설), `health` = 3대 건강 수칙(수면 위생·혈당 스파이크·위장 보호) + 수면·생체리듬 + 위장·혈당·피로 + **필수 영양제(마그네슘·비타민D) 신설**.
- **🧮 칼로리 계산기(calc)** — 성별(남/여) · 몸무게(기본 75kg, 30~200) · 활동량(교대·현장직/일반 사무직) · 목표(다이어트 −400/유지/벌크업 +250). 출력 = 목표 하루 칼로리 · 단백질 · 지방 · 탄수화물 + `닭가슴살 100g 약 N팩 + 햇반 210g 약 N공기 기준` 한 줄 + 한 끼 단백질 힌트.
  - 계산식 — 유지 = 체중 × 33(남·현장)/30(남·사무·여·현장)/27(여·사무), 단백질 = 체중 × 2.0(감량)·1.8(유지·증량), 지방 = 체중 × 0.8, 탄수 = (목표 − 단백질×4 − 지방×9) ÷ 4, **탄수 50g 하한선**(걸리면 화면 칼로리를 매크로 합계로 올려 표시하고 사유를 적음).
  - 입력값은 `state.calc`로 기존 `localStorage`(`kingyongko_shift_v1`)에 저장 — 다시 열어도 유지, `normalizeCalc()`가 범위 밖 값을 75kg/기본 옵션으로 되돌림. 카드 아래 `계산 공식 — 직접 검산용` 아코디언 추가.
- `app.css` v2.5 블록 31줄(`.calc-card/.calc-row/.calc-out/.calc-kcal/.calc-macros/.calc-line/.calc-note`) 추가 — 테마 3종 변수만 사용.
- `?v=2.5.0`(index.html 9곳) · `sw.js` `VERSION = '2.5.0'` / `CACHE = yongko-shift-v2.5.0` · 하단 표기 `교대핏 v2.5.0`(3곳). README 상단 버전·v2.5 절 추가.
- 배포: 커밋 `7dacde2` → Pages `built`. 검수(2026-11-27 04:22 KST): 라이브 HTTP 200 — `/`·`/index.html` 70,626B, `app.css?v=2.5.0` 58,406B, `app.js?v=2.5.0` 121,773B, `sw.js` 2,970B, `manifest.json` 930B, `icon-192.png` 39,476B. **MD5 로컬=라이브 6/6 일치** — `index.html` `4e0c8345`, `app.css` `abf1747c`, `app.js` `0fcb021c`, `sw.js` `849bf1ed`, `manifest.json` `f421ce74`, `icon-192.png` `e9bedde1`.
- 라이브 콘텐츠 — `data-gcat` 칩 6개(`all`·`ebook`·`qa`·`run`·`health`·`calc`), `gblock` 7개, `calcCard`/`calcWeight`/`calcLine` 존재, `app.js`에 `GCATS = ['all','ebook','qa','run','health','calc']`·`renderCalc`/`calcResult`/`CALC_CARB_FLOOR` 12곳, `sw.js` `VERSION = '2.5.0'`, `index.html` 버전문자열 `2.5.0` 9곳·`2.4.1` 0곳.
- JS 문법: `esprima.parseScript` 통과(`app.js` 121,773B · `sw.js`) — node 없음. CSS 중괄호 564/564, HTML 태그 밸런스 오류 0건. 계산값은 같은 식을 파이썬으로 옮겨 검산(남 75kg 현장 유지 2,480kcal·P135/F60/C349 / 다이어트 2,080·P150/F60/C234 / 여 50kg 사무 다이어트 960kcal·P100/F40/C50(하한선 발동)). **Playwright 미실시** — 브리프 지시(한도 절약, 정적 검사+라이브 HTTP로 대체).

## v2.4.1 (2026-11-27) — 24h 타임라인 제거
- **가이드에서 24h 타임라인 삭제** — 카테고리 칩 `🕒 24h 타임라인` 제거(칩 5개 → 4개: `전체 | 📕 전자책 핵심 | ❓ Q&A 백과 | 🏃 러닝·건강`), `index.html`의 `<div class="gblock" data-cat="timeline">` 블록(주간·야간·오프·3교대 전환 4개 아코디언, 6,910B) 통째로 삭제, 가이드 날짜바 설명 문구에서도 '24시간 타임라인' 뺌.
- **오늘 탭 코칭 바로가기** — `.cs-guide`의 `🕒 오늘 24h 타임라인` 버튼을 **`📕 전자책 핵심`**으로 교체(`data-gcat="ebook"`), `❓ Q&A 백과`는 유지. `openGuideCat()` 위임 클릭 로직은 그대로.
- **저장값 폴백** — `app.js` `GCATS = ['all','ebook','qa','run']`. `load()`의 `GCATS.indexOf(s.guideCat) >= 0 ? ... : 'all'`, `applyGuideCat()`의 `GCATS.indexOf(cat) < 0 → 'all'` 두 곳에서 기존 `guideCat='timeline'`이 'all'로 떨어짐(빈 가이드 화면 방지).
- `app.css`에서 미사용 `.tlines/.tline/.tl-time/.tl-body` 규칙(540B) 삭제, v2.4 추가분 주석도 정리.
- `?v=2.4.1` 캐시버스트(index.html 6곳) · `sw.js` `VERSION = '2.4.1'` / `CACHE = yongko-shift-v2.4.1` · 하단 표기 `교대핏 v2.4.1`(3곳). README도 v2.4.1 절 추가.
- 배포: 커밋 `f1510e9` → Pages `built`. 검수(2026-11-27 04:15 KST): 라이브 HTTP 200 — `/`·`/index.html` 62,676B, `app.js?v=2.4.1` 115,056B, `app.css?v=2.4.1` 55,849B, `sw.js` 2,970B, `manifest.json` 930B, `icon-192.png` 39,476B. MD5 일치 — `index.html` `8d4b28af`, `app.js` `95b7f145`, `app.css` `9f9fc637`, `sw.js` `f4a94a38`. 버전 문자열 — 라이브 `index.html` `2.4.1` 9곳·`교대핏 v2.4.1` 3곳, `sw.js` `VERSION = '2.4.1'`, `app.js` `GCATS = ['all','ebook','qa','run']`·`data-gcat="ebook"` 버튼 2개.
- 콘텐츠 확인 — 라이브 `index.html`에 `timeline` 0건·`타임라인` 0건, `data-gcat` 칩 4개(`all`·`ebook`·`qa`·`run`), `gblock` 5개(`start`·`ebook`·`qa`·`run`·`cta`). `app.js`에 남은 `timeline` 2건은 주석(변경 이력)뿐.
- JS 문법: `esprima.parseScript` 통과(`app.js` 103,223B · `sw.js`) — node 없음. CSS 중괄호 537/537, HTML 태그 밸런스 오류 0건. Playwright는 이번에도 미실시(브리프 "Playwright 불필요").

## v2.4.0 (2026-11-27)
- **가이드 탭 대확장** — 카테고리 칩 `전체 | 📕 전자책 핵심 | ❓ Q&A 백과 | 🕒 24h 타임라인 | 🏃 러닝·건강`(`#gcatChips`, 블록은 `.gblock[data-cat]`). 칩을 고르면 해당 블록만 남고 첫 아코디언이 자동으로 펼쳐지며, 선택은 `state.guideCat`으로 localStorage에 저장.
  - 전자책 핵심 5개(탄단지 공식+75kg 식단 예시 · 3/4분할 루틴표 · 교대별 최적 분할 · 식단·카페인 4원칙 · 보충제 WPC/WPI·크레아틴) · Q&A Q1~Q6 · 타임라인 4개(주간·야간·오프·3교대 전환) · 러닝·건강 5개(Zone2/4 · 러닝 가이드 · 3대 건강 수칙 · 수면 · 위장·혈당).
- **오늘 탭 연동** — 코칭 `자세히` 아래 `.cs-guide` 버튼 2개(24h 타임라인·Q&A). `data-gcat` 위임 클릭으로 `openGuideCat()` → 가이드 탭 전환+카테고리 적용.
- `app.js` `GCATS`·`applyGuideCat()`·`openGuideCat()` 추가, `renderTab('guide')`에서 저장된 칩 복원. `app.css`에 `.gcat-chips`(가로 스크롤)·`.acc-q`·`.rk.z2/z4/warn`·`.tlines/.tline`·`.cs-gbtn` 추가. `sw.js` `VERSION = '2.4.0'`.
- 검수(2026-11-27 · Pages `built` 2b256ec): 라이브 HTTP 200 — `/`·`/index.html` 71,660B, `app.js?v=2.4.0` 114,826B, `app.css?v=2.4.0` 56,379B, `sw.js` 2,970B, `manifest.json` 930B. MD5 일치 — `index.html` `7eca26d7`, `app.js` `ff84d1dd`, `app.css` `897d344c`, `sw.js` `8b86898a`. 버전 문자열 확인 — `sw.js` `VERSION = '2.4.0'`, 라이브 `index.html` `app.js?v=2.4.0`·`교대핏 v2.4.0`, `app.js`에 `applyGuideCat`·`data-gcat`. 콘텐츠 확인 — 라이브 `index.html`에 `data-gcat` 5개 칩, `acc-q">Q1`~`Q6`, `식단·탄단지 계산 공식`·`심박수 존 러닝 가이드`·`교대근무 3대 건강 수칙`·`24시간 타임라인` 문자열 존재.
- JS 문법: `esprima.parseScript` 통과(`app.js`·`sw.js`), CSS 중괄호 544/544, HTML 태그 밸런스 검사 통과. Playwright 브라우저 검수는 로컬 chromium 라이브러리 부재(libnspr4.so)로 미실시 — 정적 검사+라이브 HTTP로 대체.

## v2.3.2 (2026-11-27)
- **앱 아이콘 6종 전면 교체 — 다크 달력 + 골드 펄스**(사용자가 고른 2번 안, `downloads/icon_opt_2_calendar.png` 1254px 원본에서 생성).
  - any: `icon-512` / `icon-192` (둥근 모서리 22.5%), maskable: 내용 74% + 배경 풀블리드, `apple-touch-icon` 180 불투명, `favicon-32`는 골드 펄스 중심 크롭.
  - 생성 스크립트: `work/shift_app_qa/make_icons_v232.py` (이전 아이콘 백업: `work/shift_app_qa/icons_v231_backup/`).
- **상단 로고 배지** — `<span class="brand-mark">핏</span>` → `<img class="brand-mark" src="icon-192.png?v=2.3.2">` 30×30, CSS 배경/글자 스타일 제거.
- `?v=2.3.2` 캐시버스트(app.css·app.js·아이콘 링크), `CACHE = yongko-shift-v2.3.2`, 하단 표기 `교대핏 v2.3.2`.
- 검수(2026-11-27 00:05 · Pages `built` 5941104): 라이브 HTTP 200 + MD5 일치 — `icon-512.png?/·p` `ab2971…`, `icon-192.png` `e9bedd…`, `apple-touch-icon.png` `6d8f18…`, `favicon-32.png` `f12e89…`, `icon-maskable-512.png` `d98a56…`, `icon-maskable-192.png` `68a145…`, `index.html` `bd940e…`, `sw.js` `c4aba4…`, `app.css?v=2.3.2` `ce35d2…`, `app.js?v=2.3.2` `9d9f1b…`. 쿼리 없는 아이콘 경로도 새 파일로 교체 확인(GitHub CDN 잔여 캐시 없음).
  - 라이브 화면: 상단 배지 `<img class=brand-mark>` naturalSize 192×192, 표시 30×30 · radius 9px · object-fit cover, 리소스 200(404 0건).

## v2.3.1 (2026-11-26)
- **회사 추가 — `한국엔지니어링플라스틱`** (`석유화학 · 정유`): 4조 2교대 · A·B·C·D조 · 주 07:00~19:00 / 야 19:00~07:00, 별칭 `KEP` `한엔플` `한국엔지니어링`. 회사 목록 40곳 → 41곳.
- `?v=2.3.1` 캐시버스트, `CACHE = yongko-shift-v2.3.1`.
- 검수: 로컬(390×844) 검색 `한국엔지니어링플라스틱`/`한국엔지니어링`/`KEP`/`한엔플` 모두 1건 hit, 선택 시 `4조 2교대 · A·B·C·D조 · 주 07:00~19:00 / 야 19:00~07:00` 세팅, 전체 목록 `41곳`, 콘솔 에러 0건.

## v2.3.0 (2026-11-26)
- **월급날** — 설정에 `월급날`(없음 / 1~31일 / 말일, 기본 25일) 추가. 달력 칸에 초록 테두리 + 초록 `월급`, 이달 근태 정산 카드에 `월급날 12월 25일 · D-5`. 30일·31일처럼 없는 달은 말일로 당김.
- **이달 근태 정산** — 대근·특근·연차·교육 횟수(날짜 태그 기준) + 예정 근무시간(근무일 × 설정 근무시간, 4조 2교대 11월 = 15일 × 12h = 180시간).
- **근무표 이미지 저장** — 달력 탭 상단 `📷 이미지 저장`. 현재 보는 달(내 달력/전체 조)을 canvas로 1080px PNG 생성(제목·요일·날짜·근무 배지·대근/연차 태그·공휴일·월급날·범례·`교대핏 by 킹용코` 워터마크). `navigator.share({files})` 지원 시 공유 시트, 아니면 `교대핏_2026-11.png` 다운로드 + 미리보기 시트.
- `?v=2.3.0` 캐시버스트, `CACHE = yongko-shift-v2.3.0`, 저장값 `v:4 → v:5`(payday 추가, 기존 저장본은 25일 기본값).
- 검수: Playwright 390×844 라이브 — 콘솔/페이지 에러 0건, 월 이미지 1080×1210, 전체 조 이미지 1080×2006, 다운로드 파일명 `교대핏_2026-11.png`.

## v2.2 (2026-11-26)
- **교대핏 리브랜딩** — `<title>`·`manifest.json`(`name`·`short_name`=`교대핏`)·상단 로고(`교대핏` + `by 킹용코 · …`), 아이콘 6종을 골드 `핏` + 교대 회전 링으로 재생성.
- **내 회사 찾기** — 설정 탭(테마 아래)·첫 세팅 시트 0단계에 업종 칩 6종 + 검색. 회사 40곳, 선택 시 교대 형태·조 표기(ABCD/1234)·근무 시간 자동 세팅 후 `내 조`→`오늘 내 근무`로 이어짐.
- **프리셋 추가** — `5조 3교대`(10일) · `주간연속 2교대`(14일, 1주 교대). 조 수 상한 4→5, `A~E` 조 이름 지원.
- **첫 화면 = 달력** — 기본 탭 `달력`, 탭바 순서 `달력·오늘·기록·가이드·설정`. 달력 맨 위 한 줄 `오늘 바`(`오늘 11/26 · A조 야간 19:00~07:00` + 오운완·식단 원탭).
- **날짜 근무 태그** — 날짜 시트에서 `대근/특근/연차/교육` 원탭 + 짧은 일정(12자). 달력 칸에 태그(또는 메모 앞 5자) 표시, 기록 목록에 칩.
- 저장값 `v:3` → `v:4`. **기준일 재계산 없음**(오프셋 규칙 동일) — 2026-11-22 기준 A조가 여전히 11/26 야간으로 나오는 것 확인.
- 검수: Playwright 390×844, 콘솔 에러 0건. 달력 첫 화면 `calH 840px`(뷰포트 844)로 한 달+범례까지 한 화면, 가로 스크롤 0(`390/390`).

## v2.1 (2026-11-26)
- 화면 테마 3종(`data-theme="dark|light|navy"`) · A·B·C·D조 기본 표기 · 조 순환 순서 기본 `A→C→D→B`(4조 2교대 실제 근무표 기준) · 오늘 탭 코칭 1줄 요약 · 오늘·내일 흐름으로 고르는 세팅.
- `apple-mobile-web-app-status-bar-style`을 `black-translucent` → `black`으로 바꿔 아이폰 홈 화면 실행 시 상태바와 헤더가 겹치지 않게 함.
- 기존 사용자 `localStorage`(`kingyongko_shift_v1`, `v:2`)는 첫 실행 때 `v:3`으로 이사하며 기준일만 새 오프셋에 맞게 재계산(오늘 근무는 유지).

## 상대경로 규칙(서브패스 배포 필수)
`/kingyongko-shift/` 하위에서 뜨므로 `index.html`·`manifest.json`·`sw.js`의 모든 참조는 `./` 상대경로여야 한다. 2026-11-26 검수: 절대경로 0건, 라이브에서 리소스 404 0건, SW scope `https://nyk5191-creator.github.io/kingyongko-shift/` activated.
