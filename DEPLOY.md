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
- `sw.js`를 수정했다면 `CACHE` 값을 반드시 올린다(현재 `yongko-shift-v2.1.0`). 안 올리면 기존 사용자 홈 화면 앱이 옛 캐시를 계속 볼 수 있음.
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

## v2.1 (2026-11-26)
- 화면 테마 3종(`data-theme="dark|light|navy"`) · A·B·C·D조 기본 표기 · 조 순환 순서 기본 `A→C→D→B`(4조 2교대 실제 근무표 기준) · 오늘 탭 코칭 1줄 요약 · 오늘·내일 흐름으로 고르는 세팅.
- `apple-mobile-web-app-status-bar-style`을 `black-translucent` → `black`으로 바꿔 아이폰 홈 화면 실행 시 상태바와 헤더가 겹치지 않게 함.
- 기존 사용자 `localStorage`(`kingyongko_shift_v1`, `v:2`)는 첫 실행 때 `v:3`으로 이사하며 기준일만 새 오프셋에 맞게 재계산(오늘 근무는 유지).

## 상대경로 규칙(서브패스 배포 필수)
`/kingyongko-shift/` 하위에서 뜨므로 `index.html`·`manifest.json`·`sw.js`의 모든 참조는 `./` 상대경로여야 한다. 2026-11-26 검수: 절대경로 0건, 라이브에서 리소스 404 0건, SW scope `https://nyk5191-creator.github.io/kingyongko-shift/` activated.
