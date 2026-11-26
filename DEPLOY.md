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
- `sw.js`를 수정했다면 `CACHE` 값을 반드시 올린다(현재 `yongko-shift-v2.3.0`). 안 올리면 기존 사용자 홈 화면 앱이 옛 캐시를 계속 볼 수 있음.
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
