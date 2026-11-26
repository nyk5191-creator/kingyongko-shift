/* ===================================================================
   교대핏 v2.5.0 — 교대근무 + 헬스·식단 코칭 PWA
   순수 JS · localStorage · 단일 폴더 배포용
   v2  : 가이드 탭 · 오늘 내 근무 원탭 역산 · 2026~2027 공휴일 · 러닝 기록
   v2.1: 화면 테마 3종 · A·B·C·D조 표기 · 조 순환 순서(기본 A→C→D→B)
         · 오늘 탭 코칭 1줄 요약(접기/펼치기) · 오늘·내일 흐름으로 고르는 세팅
   v2.2: 교대핏 리브랜딩 · 내 회사 찾기(업종별 40곳 검색) · 5조 3교대·주간연속 2교대
         · 첫 화면을 달력으로 + 한 줄 오늘 바(오운완·식단 원탭)
         · 날짜별 근무 변경 태그(대근·특근·연차·교육) + 짧은 일정 메모를 달력 칸에 표시
   v2.2.1: 회사 추가 요청 버튼(네이버 메일·인스타 DM)
   v2.2.2: 캐시버스트(app.css?v=2.2.2) + 서비스워커 네트워크 우선 → 구버전 CSS/JS 섞임 차단
           · 검색창 옆 [검색] 버튼(클릭·Enter·한글 compositionend 모두) 
           · 회사 목록을 검색어 없이도 ㄱㄴㄷ순 전체로 바로 노출(스크롤)
   v2.3: 월급날(설정 1~31일·말일·없음 · 달력 칸 초록 '월급' 배지 · 월급 D-N)
         · 이달 근태 정산 — 대근·특근·연차·교육 횟수 + 예정 근무시간
         · 근무표 이미지 저장 — 현재 보는 달(내 달력/전체 조)을 1080px PNG로
           (공유 시트 → 없으면 다운로드 + 미리보기 모달)
   v2.3.2: 앱 아이콘 교체 — 다크 달력 + 골드 펄스(사용자 선택 2번) · 상단 로고 배지도 같은 아이콘
   v2.3.1: 회사 추가 — 한국엔지니어링플라스틱(석유화학 · 4조 2교대 주 07:00~19:00/야 19:00~07:00, 별칭 KEP·한엔플·한국엔지니어링)
   v2.4.0: 가이드 탭 대확장 — 카테고리 칩(전체·전자책 핵심·Q&A 백과·24h 타임라인·러닝·건강)
           · 전자책 핵심(탄단지 공식·75kg 식단 예시·3/4분할 루틴표·보충제 WPC/WPI·크레아틴)
           · 교대근무 Q&A 백과 Q1~Q6 · 근무별 24시간 타임라인(주간·야간·오프·3교대 전환)
           · 심박수 존 러닝(Zone 2/4) · 교대근무 3대 건강 수칙 · 오늘 탭 코칭에서 가이드 바로가기
   v2.4.1: 24h 타임라인 섹션·카테고리 칩 제거(가이드 단순화) — 저장된 guideCat='timeline'은 'all'로 폴백
           · 오늘 탭 코칭 바로가기는 📕 전자책 핵심 · ❓ Q&A 백과 2개
   v2.5.0: 가이드 칩 6개 — 🏃 러닝(run) / 🩺 건강·수면(health) 분리 · 🧮 칼로리 계산기(calc) 신설
           · 계산기: 성별·몸무게·활동량·목표 → 목표칼로리·단백질·지방·탄수 + 닭가슴살/햇반 환산 한 줄
           · 입력값은 state.calc로 localStorage 저장(다시 열어도 유지) · 탄수 50g 하한선 보호
   v2.5.2: 계산기를 가이드 탭에서 기록 탭 맨 위로 이동 — 가이드 'calc' 칩·블록 제거(칩 5개)
           · 저장된 guideCat='calc'는 'all'로 폴백 · renderTab('log')에서 renderCalc() 호출
   v2.5.3: 설정 탭 근무 배지 색깔 커스텀 — 주·오·야·휴 4종 각각 7색 원탭 + '기본값' 초기화
           · state.badgeColors(localStorage) · html의 --d/--a/--n/--o(+rgb)를 덮어써서
             달력·전체 조·오늘 카드·근무표 PNG까지 실시간 반영 · 화이트 테마는 진한 톤으로 자동 교체
   =================================================================== */
(function () {
  'use strict';

  /* ---------------- 상수 ---------------- */
  var LS_KEY = 'kingyongko_shift_v1';
  var STATE_V = 5;
  var PARTS = ['가슴', '등', '어깨', '하체', '팔', '복근', '유산소'];
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];
  var ABC = ['A', 'B', 'C', 'D', 'E'];
  /* 날짜별 근무 변경 태그 */
  var DAY_TAGS = ['대근', '특근', '연차', '교육'];

  /* 조 순환 순서 — 앞 조가 먼저 주간을 시작하고, 뒤 조는 그만큼 밀린다.
     기본 A→C→D→B: 11/26(목) 기준 A조 야간 · B조 휴무 · C조 휴무 · D조 주간 */
  var GROUP_ORDERS = [
    { id: 'ACDB', label: 'A→C→D→B', note: '기본' },
    { id: 'ABCD', label: 'A→B→C→D' },
    { id: 'ADCB', label: 'A→D→C→B' }
  ];

  /* 화면 테마 — CSS의 html[data-theme] 블록과 짝 */
  var THEMES = [
    { id: 'dark', name: '다크 골드', bg: '#0D0D0F', card: '#17171B', line: '#33333B', accent: '#FFD400' },
    { id: 'light', name: '밝은 화이트', bg: '#F5F6F8', card: '#FFFFFF', line: '#C7CDD8', accent: '#F2B300' },
    { id: 'navy', name: '네이비 블루', bg: '#0F172A', card: '#16213A', line: '#33456A', accent: '#FFD400' }
  ];

  /* 가이드 카테고리 칩 (v2.5) — index.html의 #gcatChips / .gblock[data-cat]과 짝 */
  var GCATS = ['all', 'ebook', 'qa', 'run', 'health'];

  /* 탄단지·칼로리 계산기 (v2.5) — 기본값과 계수.
     유지칼로리 = 체중 × kcal/kg(성별·활동량) · 목표 = 유지 + 감량(-400)/유지(0)/증량(+250)
     단백질 = 체중 × 2.0(감량)/1.8(유지·증량) · 지방 = 체중 × 0.8 · 탄수 = 남은 칼로리 ÷ 4 */
  var CALC_DEF = { sex: 'm', weight: 75, act: 'shift', goal: 'keep' };
  var CALC_GOAL = { cut: -400, keep: 0, bulk: 250 };
  var CALC_KCALKG = { m: { shift: 33, office: 30 }, f: { shift: 30, office: 27 } };
  var CALC_PROT_G = { cut: 2.0, keep: 1.8, bulk: 1.8 };
  var CALC_FAT_G = 0.8;
  var CALC_CARB_FLOOR = 50;     /* 탄수 하한선(g) — 이 밑으로는 내리지 않는다 */
  var CALC_P_CHICKEN = 23;      /* 닭가슴살 100g = 단백질 약 23g */
  var CALC_C_RICE = 65;         /* 햇반 210g = 탄수 약 65g */

  /* 2026~2027 대한민국 법정공휴일 (대체공휴일 포함).
     근거: 「관공서의 공휴일에 관한 규정」 제2조·제3조, 우주항공청 월력요항(2026·2027).
     값 = [달력 표시용 짧은 이름, 전체 이름] · 임시공휴일은 반영하지 않음. */
  var HOL = {
    '2026-01-01': ['신정', '신정'],
    '2026-02-16': ['설연휴', '설날 연휴'],
    '2026-02-17': ['설날', '설날'],
    '2026-02-18': ['설연휴', '설날 연휴'],
    '2026-03-01': ['삼일절', '삼일절'],
    '2026-03-02': ['대체', '대체공휴일(삼일절)'],
    '2026-05-01': ['노동절', '노동절'],
    '2026-05-05': ['어린이날', '어린이날'],
    '2026-05-24': ['부처님', '부처님오신날'],
    '2026-05-25': ['대체', '대체공휴일(부처님오신날)'],
    '2026-06-03': ['선거일', '전국동시지방선거'],
    '2026-06-06': ['현충일', '현충일'],
    '2026-07-17': ['제헌절', '제헌절'],
    '2026-08-15': ['광복절', '광복절'],
    '2026-08-17': ['대체', '대체공휴일(광복절)'],
    '2026-09-24': ['추석연휴', '추석 연휴'],
    '2026-09-25': ['추석', '추석'],
    '2026-09-26': ['추석연휴', '추석 연휴'],
    '2026-10-03': ['개천절', '개천절'],
    '2026-10-05': ['대체', '대체공휴일(개천절)'],
    '2026-10-09': ['한글날', '한글날'],
    '2026-12-25': ['성탄절', '성탄절'],
    '2027-01-01': ['신정', '신정'],
    '2027-02-06': ['설연휴', '설날 연휴'],
    '2027-02-07': ['설날', '설날'],
    '2027-02-08': ['설연휴', '설날 연휴'],
    '2027-02-09': ['대체', '대체공휴일(설날)'],
    '2027-03-01': ['삼일절', '삼일절'],
    '2027-05-01': ['노동절', '노동절'],
    '2027-05-03': ['대체', '대체공휴일(노동절)'],
    '2027-05-05': ['어린이날', '어린이날'],
    '2027-05-13': ['부처님', '부처님오신날'],
    '2027-06-06': ['현충일', '현충일'],
    '2027-07-17': ['제헌절', '제헌절'],
    '2027-07-19': ['대체', '대체공휴일(제헌절)'],
    '2027-08-15': ['광복절', '광복절'],
    '2027-08-16': ['대체', '대체공휴일(광복절)'],
    '2027-09-14': ['추석연휴', '추석 연휴'],
    '2027-09-15': ['추석', '추석'],
    '2027-09-16': ['추석연휴', '추석 연휴'],
    '2027-10-03': ['개천절', '개천절'],
    '2027-10-04': ['대체', '대체공휴일(개천절)'],
    '2027-10-09': ['한글날', '한글날'],
    '2027-10-11': ['대체', '대체공휴일(한글날)'],
    '2027-12-25': ['성탄절', '성탄절'],
    '2027-12-27': ['대체', '대체공휴일(성탄절)']
  };
  function holOf(iso) { return HOL[iso] || null; }

  var SHIFT = {
    D: { code: 'D', short: '주', badge: '주', name: '주간', cls: 'd' },
    A: { code: 'A', short: '오', badge: '오', name: '오후', cls: 'a' },
    N: { code: 'N', short: '야', badge: '야', name: '야간', cls: 'n' },
    O: { code: 'O', short: '휴', badge: '휴', name: '휴무', cls: 'o' }
  };

  /* 근무 색은 테마마다 CSS 변수(--d/--a/--n/--o + *-rgb)에 들어 있으니 JS는 이름만 안다 */
  var SHIFT_VAR = { D: '--d', A: '--a', N: '--n', O: '--o' };
  var SHIFT_RGB = { D: '--d-rgb', A: '--a-rgb', N: '--n-rgb', O: '--o-rgb' };

  /* 근무 배지 색깔 (v2.5.3) — 설정 탭에서 고르는 7가지 색.
     dark  = 다크·네이비 배경에서 잘 보이는 밝은 톤
     light = 화이트 배경에서 잘 보이는 진한 톤 (테마에 맞춰 자동 교체) */
  var BADGE_PALETTE = [
    { id: 'blue',   name: '파랑', dark: '#4C8DFF', light: '#1A63D8' },
    { id: 'sky',    name: '하늘', dark: '#38BDF8', light: '#0284C7' },
    { id: 'purple', name: '보라', dark: '#B18CFF', light: '#6B45D6' },
    { id: 'navy',   name: '남색', dark: '#7B8BFF', light: '#3B3FA8' },
    { id: 'green',  name: '초록', dark: '#35D07F', light: '#0E8A5E' },
    { id: 'orange', name: '주황', dark: '#FFA24C', light: '#BE6600' },
    { id: 'coral',  name: '코랄', dark: '#FF6B81', light: '#C4213C' }
  ];
  var BADGE_CODES = ['D', 'A', 'N', 'O'];

  var PRESETS = [
    {
      id: '4-2', name: '4조 2교대', groups: 4,
      cycle: ['D', 'D', 'O', 'O', 'N', 'N', 'O', 'O'],
      text: '주·주·오·오·야·야·오·오 (8일)',
      legend: '오 = 오프(휴무) · 킹용코 기본', star: true
    },
    {
      id: '3-2', name: '3조 2교대', groups: 3,
      cycle: ['D', 'D', 'N', 'N', 'O', 'O'],
      text: '주·주·야·야·비·휴 (6일)',
      legend: '비·휴 = 휴무'
    },
    {
      id: '4-3', name: '4조 3교대', groups: 4,
      cycle: ['D', 'D', 'A', 'A', 'N', 'N', 'O', 'O'],
      text: '주·주·오·오·야·야·휴·휴 (8일)',
      legend: '오 = 오후 근무'
    },
    {
      id: '2-2', name: '2조 2교대', groups: 2,
      cycle: ['D', 'N'],
      text: '주·야 (2일)',
      legend: '주·야 반복'
    },
    {
      id: '5-3', name: '5조 3교대', groups: 5,
      cycle: ['D', 'D', 'A', 'A', 'N', 'N', 'O', 'O', 'O', 'O'],
      text: '주·주·오·오·야·야·비·휴·휴·휴 (10일)',
      legend: '발전·공기업 대표 패턴'
    },
    {
      id: '2-2w', name: '주간연속 2교대', groups: 2,
      cycle: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'A', 'A', 'A', 'A', 'A', 'A', 'A'],
      text: '주 7일 → 오 7일 (14일)',
      legend: '자동차 · 1주마다 조 교대'
    }
  ];

  /* 프리셋을 고를 때 함께 맞춰지는 기본 근무 시간 — [설정]에서 얼마든지 수정 */
  var PRESET_TIMES = {
    '4-2': { D: ['07:00', '19:00'], A: ['07:00', '19:00'], N: ['19:00', '07:00'] },
    '3-2': { D: ['07:00', '19:00'], A: ['07:00', '19:00'], N: ['19:00', '07:00'] },
    '4-3': { D: ['06:00', '14:00'], A: ['14:00', '22:00'], N: ['22:00', '06:00'] },
    '2-2': { D: ['07:00', '19:00'], A: ['07:00', '19:00'], N: ['19:00', '07:00'] },
    '5-3': { D: ['06:00', '14:00'], A: ['14:00', '22:00'], N: ['22:00', '06:00'] },
    '2-2w': { D: ['08:00', '16:40'], A: ['16:40', '01:40'], N: ['16:40', '01:40'] }
  };

  /* =================================================================
     내 회사 찾기 — 업종별 회사 리스트 (v2.2)
     회사를 고르면 교대 형태 · 조 이름 표기(ABCD/1234) · 근무 시간이 한 번에 세팅된다.
     공장·현장마다 조 순서와 세부 시간이 다를 수 있어 [설정]에서 언제든 고칠 수 있다.
     ================================================================= */
  var HOURS_2C_PETRO = { D: ['07:00', '19:00'], N: ['19:00', '07:00'] };
  var HOURS_3C = { D: ['06:00', '14:00'], A: ['14:00', '22:00'], N: ['22:00', '06:00'] };

  var INDUSTRIES = [
    { id: 'petro', name: '석유화학 · 정유', short: '석유화학' },
    { id: 'semi', name: '반도체 · 디스플레이 · 배터리', short: '반도체' },
    { id: 'heavy', name: '제철 · 조선 · 중공업', short: '제철·조선' },
    { id: 'power', name: '발전 · 공기업', short: '발전' },
    { id: 'auto', name: '자동차 · 부품', short: '자동차' },
    { id: 'safe', name: '소방 · 경찰 · 병원 · 보안', short: '소방·의료' }
  ];

  /* 업종 기본값 */
  var IND_DEF = {
    petro: { p: '4-2', s: 'abc', t: HOURS_2C_PETRO },
    semi: { p: '4-3', s: 'num', t: HOURS_3C },
    heavy: { p: '4-2', s: 'abc', t: { D: ['08:00', '20:00'], N: ['20:00', '08:00'] } },
    power: { p: '5-3', s: 'num', t: HOURS_3C },
    auto: { p: '2-2w', s: 'num', t: { D: ['08:00', '16:40'], A: ['16:40', '01:40'], N: ['16:40', '01:40'] } },
    safe: { p: '4-2', s: 'num', t: HOURS_2C_PETRO }
  };

  /* '회사명|검색어1/검색어2' — 검색어는 회사 이름에 없어도 찾아진다 */
  var CO_LIST = {
    petro: [
      'SK에너지|sk에너지/에스케이에너지/skt',
      'S-OIL|s-oil/에쓰오일/에스오일',
      'GS칼텍스|gs칼텍스/칼텍스',
      'HD현대오일뱅크|오일뱅크/현대오일뱅크',
      'LG화학|lg화학/엘지화학',
      '롯데케미칼|롯데케미칼/롯데',
      '한화솔루션|한화솔루션/한화',
      '금호석유화학|금호석유/금호',
      '대한유화',
      '여천NCC|여천/ncc',
      '코오롱인더스트리|코오롱',
      '한국엔지니어링플라스틱|KEP/한엔플/한국엔지니어링',
      '효성화학|효성화학/효성'
    ],
    semi: [
      '삼성전자 DS|삼성전자/삼전/ds',
      'SK하이닉스|하이닉스',
      '삼성디스플레이|삼성디스플레이',
      'LG디스플레이|lg디스플레이/엘지디스플레이',
      'LG에너지솔루션|엔솔/lg엔솔/에너지솔루션',
      '삼성SDI|sdi/삼성sdi',
      '에코프로|에코프로/에코프로비엠'
    ],
    heavy: [
      '포스코|posco/포항제철',
      '현대제철',
      'HD현대중공업|현대중공업/중공업',
      '한화오션|오션',
      '삼성중공업|삼중'
    ],
    power: [
      '한국수력원자력|한수원/수력원자력',
      '한국남동발전|남동발전',
      '한국중부발전|중부발전',
      '한국서부발전|서부발전',
      '한국남부발전|남부발전',
      '한국동서발전|동서발전',
      '한국가스공사|가스공사'
    ],
    auto: [
      '현대자동차|현대차/현차',
      '기아|기아차/기아자동차',
      '현대모비스|모비스'
    ],
    safe: [
      '소방공무원 · 3조 2교대|소방/소방공무원/119',
      '소방공무원 · 4조 2교대|소방/소방공무원/119',
      '경찰공무원|경찰/112',
      '병원 간호사|간호사/간호/병원',
      '시설·보안 · 3조 2교대|보안/경비/시설',
      '시설·보안 · 2조 2교대|보안/경비/시설'
    ]
  };

  /* 업종 기본과 다른 회사 — 교대 형태·시간·안내 한 줄 */
  var CO_OVERRIDE = {
    '포스코': { t: HOURS_2C_PETRO, nt: '현장별 4조 3교대도 있음' },
    '현대제철': { p: '4-3', t: HOURS_3C, nt: '현장별 4조 2교대도 있음' },
    '한국가스공사': { p: '4-3', t: HOURS_3C, nt: '현장별 5조 3교대도 있음' },
    '소방공무원 · 3조 2교대': { p: '3-2', t: { D: ['09:00', '21:00'], N: ['21:00', '09:00'] } },
    '소방공무원 · 4조 2교대': { p: '4-2', t: { D: ['09:00', '21:00'], N: ['21:00', '09:00'] } },
    '경찰공무원': { t: { D: ['08:00', '20:00'], N: ['20:00', '08:00'] } },
    '병원 간호사': { p: 'custom', cy: '주,주,오,오,야,야,휴,휴', cg: 4, t: { D: ['07:00', '15:00'], A: ['15:00', '23:00'], N: ['23:00', '07:00'] }, nt: '3교대 커스텀' },
    '시설·보안 · 3조 2교대': { p: '3-2', t: HOURS_2C_PETRO },
    '시설·보안 · 2조 2교대': { p: '2-2', t: HOURS_2C_PETRO }
  };

  var COMPANIES = (function () {
    var out = [];
    INDUSTRIES.forEach(function (ind) {
      var base = IND_DEF[ind.id];
      (CO_LIST[ind.id] || []).forEach(function (row) {
        var parts = row.split('|');
        var ov = CO_OVERRIDE[parts[0]] || {};
        out.push({
          name: parts[0],
          keys: (parts[1] || '').split('/').filter(Boolean),
          ind: ind.id,
          p: ov.p || base.p,
          s: base.s,
          t: ov.t || base.t,
          cy: ov.cy || '',
          cg: ov.cg || 0,
          nt: ov.nt || ''
        });
      });
    });
    return out;
  })();

  function presetById(id) {
    for (var i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i];
    return null;
  }
  function companyByName(name) {
    for (var i = 0; i < COMPANIES.length; i++) if (COMPANIES[i].name === name) return COMPANIES[i];
    return null;
  }
  function coCycle(c) {
    var p = presetById(c.p);
    if (p) return p.cycle.slice();
    return parseCycle(c.cy) || PRESETS[0].cycle.slice();
  }
  function coGroups(c) {
    var p = presetById(c.p);
    return p ? p.groups : Math.max(1, Math.min(5, c.cg || 4));
  }
  /* 'A·B·C·D조' / '1~5조' */
  function styleLabel(style, G) {
    if (style === 'num') {
      if (G >= 4) return '1~' + G + '조';
      var a = [];
      for (var i = 1; i <= G; i++) a.push(i);
      return a.join('·') + '조';
    }
    return groupLetters(G).join('·') + '조';
  }
  /* 주 07:00~19:00 / 야 19:00~07:00 — 그 주기에 실제로 있는 근무만 */
  function shiftTimesText(c) {
    var cyc = coCycle(c);
    var has = {};
    cyc.forEach(function (k) { if (SHIFT[k]) has[k] = true; });
    return ['D', 'A', 'N'].filter(function (k) { return has[k]; }).map(function (k) {
      var t = (c.t && c.t[k]) || (PRESET_TIMES[c.p] || {})[k] || ['07:00', '19:00'];
      return SHIFT[k].short + ' ' + t[0] + '~' + t[1];
    }).join(' / ');
  }
  function cloneTimes(src) {
    var o = {};
    ['D', 'A', 'N'].forEach(function (k) {
      o[k] = (src[k] || ['07:00', '19:00']).slice();
    });
    return o;
  }
  /* 조 수에 맞지 않는 조 순서를 자연 순서로 되돌린다 */
  function normalizeOrder() {
    var G = getGroups();
    var letters = groupLetters(G);
    var cur = String(state.groupOrder || '').toUpperCase();
    var ok = true;
    letters.forEach(function (l) { if (cur.indexOf(l) < 0) ok = false; });
    if (!ok) state.groupOrder = (G === 4 ? 'ACDB' : letters.join(''));
  }

  /* ---------------- 아이콘 (인라인 SVG) ---------------- */
  var SVG = function (inner, sw) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.8) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  };
  var ICON = {
    dumbbell: SVG('<path d="M3.4 10v4M6.2 7.4v9.2M17.8 7.4v9.2M20.6 10v4M6.2 12h11.6"/>', 2),
    bowl: SVG('<path d="M6.4 3.4v6.4a2 2 0 0 0 4 0V3.4"/><path d="M8.4 9.8V20.6"/><path d="M17.6 3.4c1.6 1 2.4 2.6 2.4 4.6 0 1.8-.9 2.9-2.2 3.3v9.3"/>', 1.9),
    coffee: SVG('<path d="M4.4 8.6h10.8v5.2a4 4 0 0 1-4 4H8.4a4 4 0 0 1-4-4V8.6Z"/><path d="M15.2 10.2h1.6a2.6 2.6 0 0 1 0 5.2h-1.6"/><path d="M7.4 3.4v2M10.6 3.4v2"/>'),
    clock: SVG('<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="M12 7.6v4.9l3.1 1.9"/>'),
    calendar: SVG('<rect x="3.4" y="5" width="17.2" height="16" rx="3.4"/><path d="M8 3v4M16 3v4M3.4 10.2h17.2"/>'),
    chart: SVG('<path d="M4 19.4V5"/><path d="M4 19.4h16"/><path d="M7.6 15.4l3.8-4.8 3.2 2.8 4-6.2"/>'),
    sliders: SVG('<path d="M4 7.2h8.2M17 7.2h3M4 16.8h4.4M13.2 16.8H20"/><circle cx="14.6" cy="7.2" r="2.4"/><circle cx="10.8" cy="16.8" r="2.4"/>'),
    book: SVG('<path d="M12 6.6C10.4 5.1 8.2 4.5 5 4.5v13.2c3.2 0 5.4.6 7 2 1.6-1.4 3.8-2 7-2V4.5c-3.2 0-5.4.6-7 2.1Z"/><path d="M12 6.6v13.1"/>'),
    check: SVG('<path d="M5 12.6l4.4 4.4L19 6.6"/>', 2.4)
  };
  function hydrateIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (n) {
      var k = n.getAttribute('data-icon');
      if (k && ICON[k]) n.innerHTML = ICON[k];
    });
  }

  /* ---------------- 코칭 데이터 ---------------- */
  var COACH = {
    D: {
      chip: '회복 우선',
      short: ['🏋️ 퇴근 후 30~40분 운동', '🍱 점심 탄단 꽉 채우기', '☕ 오후 2시 카페인 컷'],
      workout: {
        lead: '오늘은 회복이 먼저 — 30~40분 자극, 아니면 완전 휴식',
        rows: [
          ['타이밍', '퇴근 후 <b>19:30~20:30</b>. 20:30 넘으면 오늘은 접는다'],
          ['강도', '머신·케이블 3~4종, <b>8~12회 × 3세트</b>. 무게 욕심 금지'],
          ['판단', '몸 상태 5점 만점에 3점 이하면 <b>완전 휴식</b>이 정답']
        ],
        note: '주간 2일은 근성으로 버티는 날이 아니라, 오프 90분을 위한 충전일이다.'
      },
      diet: {
        lead: '아침 거르지 말고, 점심은 도시락 탄단',
        rows: [
          ['1식 05:30', '기상 직후 — 밥 반 공기 + 계란 2~3개 or 닭가슴 100g'],
          ['2식 12:00', '도시락 — 탄수 1공기 + 단백질 150g + 채소'],
          ['3식 20:30', '퇴근 후 — 단백질 30g + 채소, 밤 탄수는 최소'],
          ['하루', '단백질 <b>체중×1.6~2g</b> (75kg이면 120~150g)']
        ],
        note: '12시간 서서 일하는 날은 탄수를 아끼면 오히려 밤에 무너진다. 점심은 꽉 채워라.'
      },
      caffeine: {
        lead: '오후 2시 이후 카페인 금지',
        rows: [
          ['컷오프', '<b>14:00</b> — 23:00 취침 기준 9시간 전'],
          ['대체', '오후엔 물·탄산수·디카페인. 졸리면 10분 낮잠'],
          ['수면', '취침 23:00, <b>7시간</b> 확보. 낮잠은 20분까지']
        ],
        note: ''
      }
    },
    A: {
      chip: '오전 운동',
      short: ['🏋️ 오전 9시 30분 60분 운동', '🍱 근무 전 탄수 충실히', '☕ 18시 카페인 컷'],
      workout: {
        lead: '오전이 유일한 운동 창 — 60분에 끝내기',
        rows: [
          ['타이밍', '<b>09:30~10:30</b>, 근무 3시간 전에 끝낸다'],
          ['강도', '복합관절 2~3종 + 보조 2종, <b>8~10회 × 3세트</b>'],
          ['축소판', '시간 없으면 40분 한 부위 집중 (가슴+삼두 or 등+이두)']
        ],
        note: '근무 직전 운동은 밤잠을 밀어낸다. 오전에 끝내는 게 핵심이다.'
      },
      diet: {
        lead: '근무 전 탄수, 근무 중 간식, 퇴근 후 단백질만',
        rows: [
          ['1식 09:00', '기상 후 — 오트밀+프로틴 or 밥 반 공기+고기 100g'],
          ['2식 12:30', '근무 전 — 탄수 충실히(밥 1공기 + 단백질 150g)'],
          ['3식 17:30', '근무 중 — 바나나+프로틴 or 삶은 계란 2개'],
          ['4식 22:30', '퇴근 후 — 단백질 30g만. 야식·배달 금지']
        ],
        note: '오후 8시간은 탄수로 버틴다. 근무 전 끼니를 대충 하면 21시에 편의점으로 간다.'
      },
      caffeine: {
        lead: '18시 이후 카페인 금지',
        rows: [
          ['컷오프', '<b>18:00</b> — 23:30 취침 기준'],
          ['허용', '근무 시작 전 13:00까지 1~2잔'],
          ['수면', '23:30 취침 <b>7시간</b>. 방 암막 + 폰은 거실에']
        ],
        note: ''
      }
    },
    N: {
      chip: '기상 후 60분',
      short: ['🏋️ 기상 후 60분 운동', '🍱 퇴근 후 단백질 30~40g', '☕ 새벽 2시 카페인 컷'],
      workout: {
        lead: '기상 60분 안에 웨이트 60분',
        rows: [
          ['타이밍', '기상 <b>60분 이내</b> 착수 (16:00 기상 → 16:40 시작)'],
          ['강도', '복합관절 4~5종, <b>8~10회 × 3~4세트</b>'],
          ['금지', '퇴근 후 운동 금지 — 그 시간은 수면이다']
        ],
        note: '야간 2일은 운동 2일. 리듬이 깨져도 이 60분만 지키면 몸은 유지된다.'
      },
      diet: {
        lead: '기상 후 탄단, 근무 중 3·4식, 퇴근 후 단백질 30~40g',
        rows: [
          ['1식 17:00', '기상 후 — 운동 전이면 탄수 먼저(바나나·오트밀)'],
          ['2식 18:30', '근무 전 — 밥 1공기 + 단백질 150g'],
          ['3식 00:30', '근무 중 — 도시락 탄단(밥 반 공기 + 고기 100g)'],
          ['4식 04:30', '새벽 간식 — 프로틴 1잔 + 견과 한 줌'],
          ['퇴근 07:30', '<b>단백질 30~40g</b>만 넣고 바로 취침']
        ],
        note: '퇴근 후 밥까지 먹으면 소화 때문에 잠이 밀린다. 단백질만 넣고 눕는 게 낫다.'
      },
      caffeine: {
        lead: '새벽 2시 이후 카페인 금지',
        rows: [
          ['컷오프', '<b>02:00</b> — 08:00 취침 기준 6시간 전'],
          ['허용', '근무 초반 21~23시 1잔까지'],
          ['수면', '07:30~15:30 <b>7~8시간</b>. 퇴근 후 햇빛 10분만 피하고 암막']
        ],
        note: ''
      }
    },
    O: {
      chip: '90분 고강도',
      short: ['🏋️ 고강도 90분 운동', '🍱 3~4끼 단백질 120~150g', '☕ 오후 2시 카페인 컷'],
      workout: {
        lead: '고강도 90분 — 중량 제대로 치는 날',
        rows: [
          ['타이밍', '오전 10~11시 or 오후 4~6시 (몸이 깨어난 시간)'],
          ['강도', '스쿼트·벤치·데드·풀업 <b>5~8회 × 4~5세트</b>, 마지막 세트는 한계까지'],
          ['2일째', '오프 둘째 날은 보조 종목 + 유산소 20분']
        ],
        note: '오프 2일이 8일 주기의 성장일이다. 여기서 안 치면 주간·야간은 유지만 된다.'
      },
      diet: {
        lead: '3~4끼 클린식 + 단백질 체중×1.6~2g',
        rows: [
          ['1식', '기상 후 — 탄단 (밥+계란 or 오트밀+프로틴)'],
          ['2식', '운동 1시간 전 — 탄수 (밥 1공기)'],
          ['3식', '운동 후 30~60분 — <b>단백질 40g</b> + 탄수'],
          ['4식', '저녁 — 단백질 + 채소 위주'],
          ['하루', '75kg 기준 단백질 120~150g, 물 2.5~3L']
        ],
        note: '외식·술은 이 날 1끼까지. 다음 날 야간이면 밤 10시 이후엔 입 닫는다.'
      },
      caffeine: {
        lead: '오후 2시 이후 카페인 금지',
        rows: [
          ['컷오프', '<b>14:00</b> — 23:00 취침 기준'],
          ['야간 대비', '야간 첫날 전날은 23:00 취침 + 낮잠 90분으로 리듬을 미리 민다'],
          ['수면', '취침·기상 시간을 근무일과 1시간 안으로 유지']
        ],
        note: ''
      }
    }
  };

  /* ---------------- 날짜 유틸 ---------------- */
  function pad(n) { return String(n).padStart(2, '0'); }
  function isoOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseISO(s) { var p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function todayISO() { return isoOf(new Date()); }
  function addDays(iso, n) { var d = parseISO(iso); d.setDate(d.getDate() + n); return isoOf(d); }
  function dayDiff(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 86400000); }
  function nowHM() { var d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function atTime(iso, hm) {
    var p = (hm || '00:00').split(':').map(Number);
    var d = parseISO(iso); d.setHours(p[0], p[1], 0, 0); return d;
  }
  function fmtHM(ms) {
    var m = Math.max(0, Math.round(ms / 60000));
    var h = Math.floor(m / 60); m = m % 60;
    return (h > 0 ? h + '시간 ' : '') + m + '분';
  }

  /* 러닝 거리(km) — 0.1 단위, 최대 200km */
  function fmtKm(v) { return (Math.round((Number(v) || 0) * 10) / 10).toFixed(1); }
  function parseKm(raw) {
    var s = String(raw == null ? '' : raw).trim().replace(',', '.');
    if (s === '') return null;
    var v = Number(s);
    if (!isFinite(v) || v <= 0) return null;
    return Math.min(200, Math.round(v * 10) / 10);
  }
  function monthRun(prefix) {
    var km = 0, days = 0;
    Object.keys(state.logs).forEach(function (k) {
      if (k.slice(0, 7) !== prefix) return;
      var v = state.logs[k].run;
      if (typeof v === 'number' && v > 0) { km += v; days++; }
    });
    return { km: Math.round(km * 10) / 10, days: days };
  }
  /* 원탭 세팅 버튼에 쓰는 이름 — 휴무는 '오프'로 */
  /* 화면에 읽히는 근무 이름 — 휴무까지 '휴무'로 통일 */
  function pickName(code) { return (SHIFT[code] || SHIFT.O).name; }

  /* ---------------- 월급날 (v2.3) ---------------- */
  function monthLastDay(y, m) { return new Date(y, m, 0).getDate(); }

  /* 그 달의 월급날(1~31) — 없으면 0. 31일처럼 없는 달은 말일로 당긴다 */
  function paydayDay(y, m) {
    var p = state.payday;
    if (p === 0 || p === null || p === undefined) return 0;
    var last = monthLastDay(y, m);
    if (p === 'last') return last;
    var n = Math.round(Number(p) || 0);
    if (n < 1) return 0;
    return Math.min(n, last);
  }
  function paydayISOOf(y, m) {
    var d = paydayDay(y, m);
    return d ? (y + '-' + pad(m) + '-' + pad(d)) : '';
  }
  /* 오늘 이후 가장 가까운 월급날 (오늘이 월급날이면 오늘) */
  function nextPaydayISO(fromISO) {
    var from = fromISO || todayISO();
    var d = parseISO(from);
    var y = d.getFullYear(), m = d.getMonth() + 1;
    for (var i = 0; i < 24; i++) {
      var iso = paydayISOOf(y, m);
      if (iso && dayDiff(from, iso) >= 0) return iso;
      m++; if (m > 12) { m = 1; y++; }
    }
    return '';
  }
  function ddayText(iso) {
    if (!iso) return '';
    var n = dayDiff(todayISO(), iso);
    return n === 0 ? '오늘' : (n > 0 ? 'D-' + n : 'D+' + (-n));
  }

  /* ---------------- 근무 시간·월간 정산 (v2.3) ---------------- */
  function hmMin(hm) {
    var p = String(hm || '').split(':').map(Number);
    return (p[0] || 0) * 60 + (p[1] || 0);
  }
  /* 한 근무의 길이(시간) — 야간처럼 자정을 넘기면 24시간을 더한다 */
  function shiftHours(code) {
    var t = state.times && state.times[code];
    if (!t) return 0;
    var s = hmMin(t[0]), e = hmMin(t[1]);
    if (e <= s) e += 1440;
    return (e - s) / 60;
  }
  /* 한 달 정산 — 출근·휴무 일수, 근무 변경 태그 횟수, 예정 근무시간 */
  function monthSettle(y, m, lastDay) {
    var out = { work: 0, off: 0, hours: 0, tags: {} };
    DAY_TAGS.forEach(function (t) { out.tags[t] = 0; });
    for (var day = 1; day <= lastDay; day++) {
      var iso = y + '-' + pad(m) + '-' + pad(day);
      var code = myShift(iso);
      if (code === 'O') out.off++;
      else { out.work++; out.hours += shiftHours(code); }
      var lg = state.logs[iso];
      var tags = (lg && Array.isArray(lg.tags)) ? lg.tags : [];
      tags.forEach(function (t) { if (out.tags[t] != null) out.tags[t]++; });
    }
    out.hours = Math.round(out.hours * 10) / 10;
    return out;
  }

  /* ---------------- 상태 ---------------- */
  var DEFAULTS = {
    v: STATE_V,
    presetId: '4-2',
    custom: '주,주,휴,휴,야,야,휴,휴',
    customGroups: 4,
    group: 1,
    groupStyle: 'abc',     /* 'abc' = A·B·C·D조(기본) · 'num' = 1·2·3·4조 */
    groupOrder: 'ACDB',    /* 조 순환 순서 — 킹용코 회사 기본 */
    theme: 'dark',
    coachOpen: false,
    guideCat: 'all',       /* 가이드 카테고리 칩 — all/ebook/qa/run/health (v2.5.2: calc 제거) */
    calc: { sex: 'm', weight: 75, act: 'shift', goal: 'keep' },   /* v2.5 탄단지·칼로리 계산기 입력값 */
    badgeColors: { D: '', A: '', N: '', O: '' },   /* v2.5.3 근무 배지 색 — '' = 테마 기본색, 그 외 BADGE_PALETTE id */
    payday: 25,            /* 0 = 없음 · 1~31 = 그 날(없는 달은 말일) · 'last' = 말일 */
    anchor: todayISO(),
    times: { D: ['07:00', '19:00'], A: ['14:00', '22:00'], N: ['19:00', '07:00'] },
    logs: {},
    bannerDismissed: false,
    setupDone: false
  };

  var state = load();

  function load() {
    var s;
    try { s = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch (e) { s = null; }
    if (!s || typeof s !== 'object') s = {};
    var out = {
      v: STATE_V,
      presetId: s.presetId || DEFAULTS.presetId,
      custom: s.custom || DEFAULTS.custom,
      customGroups: Math.max(2, Math.min(5, s.customGroups || DEFAULTS.customGroups)),
      group: Math.max(1, Math.min(5, s.group || 1)),
      groupStyle: s.groupStyle === 'num' ? 'num' : 'abc',
      groupOrder: /^[A-E]{2,5}$/.test(String(s.groupOrder || '')) ? s.groupOrder : DEFAULTS.groupOrder,
      theme: ['dark', 'light', 'navy'].indexOf(s.theme) >= 0 ? s.theme : DEFAULTS.theme,
      coachOpen: s.coachOpen === true,
      guideCat: GCATS.indexOf(s.guideCat) >= 0 ? s.guideCat : 'all',
      calc: normalizeCalc(s.calc),
      badgeColors: normalizeBadgeColors(s.badgeColors),
      payday: (function () {
        var p = s.payday;
        if (p === undefined || p === null) return DEFAULTS.payday;
        if (p === 'last') return 'last';
        var n = Math.round(Number(p));
        if (!isFinite(n) || n < 0) return DEFAULTS.payday;
        if (n === 0) return 0;
        return Math.min(31, Math.max(1, n));
      })(),
      anchor: s.anchor || todayISO(),
      times: Object.assign({}, DEFAULTS.times, s.times || {}),
      logs: (s.logs && typeof s.logs === 'object') ? s.logs : {},
      bannerDismissed: !!s.bannerDismissed,
      setupDone: s.setupDone === true
    };
    if (!PRESETS.some(function (p) { return p.id === out.presetId; }) && out.presetId !== 'custom') {
      out.presetId = DEFAULTS.presetId;
    }

    /* v2.0 → v2.1 이사: 조 오프셋 계산이 바뀌었으므로(기본 A→C→D→B),
       저장된 기준일을 새 계산에 맞춰 다시 잡는다.
       사용자가 골랐던 '오늘 내 근무'는 그대로 유지된다. */
    if ((s.v || 2) < 3 && s.anchor) {
      var info = cycleOfState(out);
      var M = info.cycle.length, GG = info.groups;
      var step = Math.max(1, Math.round(M / GG));
      var g = Math.max(1, Math.min(GG, out.group));
      var dOld = dayDiff(out.anchor, todayISO());
      var oldPos = ((dOld + (g - 1) * step) % M + M) % M;
      var back = ((oldPos - offsetFor(out.groupOrder, g, M, GG)) % M + M) % M;
      out.anchor = addDays(todayISO(), -back);
    }
    return out;
  }

  /* 근무 배지 색 정리 — 아는 색 id만 남기고 나머지는 기본색('') */
  function normalizeBadgeColors(b) {
    b = (b && typeof b === 'object') ? b : {};
    var out = {};
    BADGE_CODES.forEach(function (code) {
      out[code] = paletteOf(b[code]) ? b[code] : '';
    });
    return out;
  }
  function paletteOf(id) {
    for (var i = 0; i < BADGE_PALETTE.length; i++) {
      if (BADGE_PALETTE[i].id === id) return BADGE_PALETTE[i];
    }
    return null;
  }
  function hexRgb(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    if (h.length !== 6) return '0,0,0';
    return parseInt(h.slice(0, 2), 16) + ',' + parseInt(h.slice(2, 4), 16) + ',' + parseInt(h.slice(4, 6), 16);
  }

  /* 계산기 입력값 정리 — 성별/활동량/목표는 정해진 값만, 몸무게는 30~200kg */
  function normalizeCalc(c) {
    c = (c && typeof c === 'object') ? c : {};
    var w = Math.round(Number(c.weight) * 10) / 10;
    if (!isFinite(w) || w < 30 || w > 200) w = CALC_DEF.weight;
    return {
      sex: c.sex === 'f' ? 'f' : 'm',
      weight: w,
      act: c.act === 'office' ? 'office' : 'shift',
      goal: (c.goal === 'cut' || c.goal === 'bulk') ? c.goal : 'keep'
    };
  }

  /* 저장된 상태(s)만 보고 주기·조 수를 구한다 — load() 안에서 쓰려고 state에 의존하지 않게 분리 */
  function cycleOfState(s) {
    var p = null;
    for (var i = 0; i < PRESETS.length; i++) {
      if (PRESETS[i].id === s.presetId) p = PRESETS[i];
    }
    if (p) return { cycle: p.cycle.slice(), groups: p.groups };
    var c = parseCycle(s.custom);
    return {
      cycle: (c && c.length ? c : PRESETS[0].cycle.slice()),
      groups: Math.max(1, Math.min(5, s.customGroups || 4))
    };
  }

  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { toast('저장 실패 — 저장 공간 확인'); }
  }

  /* ---------------- 교대 계산 ---------------- */
  function getPreset() {
    var p = PRESETS.filter(function (x) { return x.id === state.presetId; })[0];
    return p || null;
  }
  function getCycle() {
    var p = getPreset();
    if (p) return p.cycle.slice();
    var c = parseCycle(state.custom);
    return c && c.length ? c : PRESETS[0].cycle.slice();
  }
  function getGroups() {
    var p = getPreset();
    var g = p ? p.groups : (state.customGroups || 4);
    return Math.max(1, Math.min(5, g));
  }
  function presetName() {
    var p = getPreset();
    return p ? p.name : '커스텀 주기';
  }
  /* 조 수만큼의 이름(A·B·C·D·E) */
  function groupLetters(G) {
    var out = [];
    for (var i = 1; i <= Math.max(1, G); i++) out.push(ABC[(i - 1) % ABC.length]);
    return out;
  }

  /* 조 순환 순서 → 조별 주기 오프셋.
     순서의 첫 조가 기준(0)이고, 뒤 조는 한 칸(step일)씩 앞당겨 시작한 것으로 본다.
     A→C→D→B(기본) · 8일 주기 4조 → A 0 · C 6 · D 4 · B 2 */
  function offsetFor(order, g, N, G) {
    var letters = groupLetters(G);
    var raw = String(order || '').toUpperCase().replace(/[^A-E]/g, '');
    var ord = [];
    raw.split('').forEach(function (l) {
      if (ord.indexOf(l) < 0 && letters.indexOf(l) >= 0) ord.push(l);
    });
    letters.forEach(function (l) { if (ord.indexOf(l) < 0) ord.push(l); });
    var step = Math.max(1, Math.round(N / G));
    var idx = Math.max(1, Math.min(G, Math.round(g || 1))) - 1;
    var k = ord.indexOf(letters[idx]);
    if (k < 0) k = idx;
    return ((-k * step) % N + N) % N;
  }

  function groupOffset(g) {
    var cyc = getCycle();
    return offsetFor(state.groupOrder, g, cyc.length, getGroups());
  }

  /* 조 이름 표기 — 기본 A·B·C·D조, 설정에서 1·2·3·4조로 전환 */
  function groupName(g) {
    var n = Math.max(1, Math.round(g || 1));
    return state.groupStyle === 'num' ? (n + '조') : (ABC[(n - 1) % ABC.length] + '조');
  }

  function shiftFor(iso, group0) {
    var cyc = getCycle(), N = cyc.length;
    var d = dayDiff(state.anchor, iso);
    var pos = ((d + groupOffset(group0 + 1)) % N + N) % N;
    return cyc[pos] || 'O';
  }
  function myShift(iso) { return shiftFor(iso, Math.max(0, state.group - 1)); }
  function cyclePos(iso) {
    var cyc = getCycle(), N = cyc.length;
    var d = dayDiff(state.anchor, iso);
    return ((d + groupOffset(state.group)) % N + N) % N;
  }

  var TOKENS = {
    '주': 'D', '주간': 'D', '데이': 'D', 'd': 'D', 'day': 'D',
    '오': 'A', '오후': 'A', '중': 'A', 'a': 'A', 'eve': 'A', 'evening': 'A', 'afternoon': 'A',
    '야': 'N', '야간': 'N', '나이트': 'N', 'n': 'N', 'night': 'N',
    '휴': 'O', '휴무': 'O', '오프': 'O', '비': 'O', '비번': 'O', 'o': 'O', 'off': 'O', 'r': 'O', 'rest': 'O'
  };
  function parseCycle(str) {
    if (!str) return null;
    var parts = String(str).split(/[,\s·・|\/]+/).map(function (t) { return t.trim(); }).filter(Boolean);
    if (!parts.length) return null;
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var k = TOKENS[parts[i].toLowerCase()] || TOKENS[parts[i]];
      if (!k) return null;
      out.push(k);
    }
    if (out.length < 2 || out.length > 40) return null;
    return out;
  }

  /* ---------------- 로그 ---------------- */
  function getLog(iso) {
    var l = state.logs[iso];
    if (!l) l = { workout: false, clean: false, weight: null, run: null, parts: [], memo: '', tags: [], sched: '' };
    if (!Array.isArray(l.parts)) l.parts = [];
    if (!Array.isArray(l.tags)) l.tags = [];
    return l;
  }
  function patchLog(iso, patch, removeIfEmpty) {
    var cur = Object.assign({}, getLog(iso), patch);
    var hasData = cur.workout || cur.clean ||
      (typeof cur.weight === 'number' && cur.weight > 0) ||
      (typeof cur.run === 'number' && cur.run > 0) ||
      (cur.parts && cur.parts.length) ||
      (cur.tags && cur.tags.length) ||
      (cur.sched && String(cur.sched).trim()) ||
      (cur.memo && cur.memo.trim());
    if (hasData) state.logs[iso] = cur;
    else delete state.logs[iso];
    save();
  }

  /* ---------------- DOM ---------------- */
  function $(id) { return document.getElementById(id); }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    v = (v || '').trim();
    return v || (fallback || '');
  }
  function setShiftVars(code) {
    var k = SHIFT_VAR[code] ? code : 'O';
    var c = cssVar(SHIFT_VAR[k], '#35D07F');
    var rgb = cssVar(SHIFT_RGB[k], '53,208,127');
    var r = document.documentElement.style;
    r.setProperty('--sc', c);
    r.setProperty('--sc-bg', 'rgba(' + rgb + ',.15)');
    r.setProperty('--sc-bd', 'rgba(' + rgb + ',.38)');
    r.setProperty('--sc-glow', 'rgba(' + rgb + ',.20)');
  }

  var toastTimer = null;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 1500);
  }

  /* ---------------- 렌더: 상단 ---------------- */
  function renderTop() {
    $('topSub').textContent = 'by 킹용코 · ' + presetName() + ' · ' + groupName(state.group);
  }

  /* ---------------- 화면 테마 ---------------- */
  function themeMeta(id) {
    for (var i = 0; i < THEMES.length; i++) {
      if (THEMES[i].id === id) return THEMES[i];
    }
    return THEMES[0];
  }
  function applyTheme(id, persist) {
    var t = themeMeta(id).id;
    document.documentElement.setAttribute('data-theme', t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', themeMeta(t).bg);
    if (persist) { state.theme = t; save(); }
    /* 테마가 바뀌면 CSS 변수 값도 바뀌므로 근무 색을 다시 읽어 준다.
       고른 배지 색이 있으면 테마에 맞는 톤으로 다시 덮어쓴 뒤 읽어야 한다. */
    applyBadgeColors();
    setShiftVars(myShift(todayISO()));
    renderThemePick();
    renderBadgePick();
  }

  /* 고른 배지 색을 html 인라인 변수로 덮어쓴다 — CSS·SVG·달력·전체 조·오늘 카드·PNG 캔버스까지
     모두 var(--d/--a/--n/--o)를 쓰므로 여기 한 곳만 바꾸면 전체에 실시간 반영된다.
     '기본색'이면 인라인 변수를 지워 테마 CSS 값이 그대로 살아나게 한다. */
  function applyBadgeColors() {
    var root = document.documentElement;
    var isLight = root.getAttribute('data-theme') === 'light';
    BADGE_CODES.forEach(function (code) {
      var p = paletteOf(state.badgeColors && state.badgeColors[code]);
      if (!p) {
        root.style.removeProperty(SHIFT_VAR[code]);
        root.style.removeProperty(SHIFT_RGB[code]);
        return;
      }
      var hex = isLight ? p.light : p.dark;
      root.style.setProperty(SHIFT_VAR[code], hex);
      root.style.setProperty(SHIFT_RGB[code], hexRgb(hex));
    });
  }

  /* 설정 탭 — 근무 배지 색깔 고르기 (4종 × 7색 + 기본값) */
  function renderBadgePick() {
    var box = $('badgePick');
    if (!box) return;
    var isLight = document.documentElement.getAttribute('data-theme') === 'light';
    box.innerHTML = BADGE_CODES.map(function (code) {
      var meta = SHIFT[code];
      var picked = paletteOf(state.badgeColors[code]);
      var sw = BADGE_PALETTE.map(function (p) {
        var on = !!picked && picked.id === p.id;
        var c = isLight ? p.light : p.dark;
        return '<button class="bp-sw' + (on ? ' on' : '') + '" type="button"' +
          ' data-bc="' + code + '" data-bcid="' + p.id + '"' +
          ' aria-pressed="' + (on ? 'true' : 'false') + '"' +
          ' aria-label="' + meta.name + ' ' + p.name + '" title="' + p.name + '"' +
          ' style="--sw:' + c + '"></button>';
      }).join('');
      return '<div class="bp-row">' +
        '<div class="bp-head">' +
          '<span class="bp-chip c-' + meta.cls + '">' + meta.badge + '</span>' +
          '<span class="bp-name">' + meta.name + '</span>' +
          '<span class="bp-val">' + (picked ? picked.name : '기본색') + '</span>' +
          '<button class="bp-reset" type="button" data-bc="' + code + '" data-bcid=""' +
            (picked ? '' : ' disabled') + '>기본값</button>' +
        '</div>' +
        '<div class="bp-colors">' + sw + '</div>' +
      '</div>';
    }).join('');
  }
  function renderThemePick() {
    var box = $('themePick');
    if (!box) return;
    box.innerHTML = THEMES.map(function (t) {
      var on = t.id === state.theme;
      return '<button class="th-btn' + (on ? ' on' : '') + '" data-theme="' + t.id + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
        '<span class="th-sw" style="background:' + t.bg + ';border-color:' + t.line + '">' +
          '<i style="background:' + t.card + '"></i>' +
          '<i style="background:' + t.accent + '"></i>' +
          '<i style="background:' + t.line + '"></i>' +
        '</span>' +
        '<span class="th-name">' + t.name + '</span>' +
      '</button>';
    }).join('');
  }
  /* 조 이름 표기 토글 상태 */
  function syncGroupStyle() {
    var list = document.querySelectorAll('[data-gstyle]');
    for (var i = 0; i < list.length; i++) {
      var on = list[i].getAttribute('data-gstyle') === state.groupStyle;
      list[i].classList.toggle('is-on', on);
      list[i].setAttribute('aria-selected', on ? 'true' : 'false');
    }
  }

  /* ---------------- 렌더: 오늘 ---------------- */
  function shiftWindow(iso, code) {
    var t = state.times[code] || ['00:00', '00:00'];
    var s = atTime(iso, t[0]);
    var e = atTime(iso, t[1]);
    if (e <= s) e = new Date(e.getTime() + 86400000);
    return { s: s, e: e, st: t[0], en: t[1], cross: t[1] <= t[0] };
  }

  function statusFor(iso, code) {
    if (code === 'O') return { html: '오늘은 <b>휴무</b> — 고강도 90분 데이', pct: 100, off: true };
    var now = new Date();
    var w = shiftWindow(iso, code);
    if (now >= w.s && now < w.e) {
      return { html: '지금 근무 중 · <b>' + fmtHM(w.e - now) + '</b> 남음', pct: (now - w.s) / (w.e - w.s) * 100 };
    }
    if (now < w.s) {
      return { html: '근무 시작까지 <b>' + fmtHM(w.s - now) + '</b>', pct: 0 };
    }
    return { html: '근무 종료 · 지금은 <b>회복 시간</b>', pct: 100 };
  }

  function renderToday() {
    var t = todayISO();
    var code = myShift(t);
    var meta = SHIFT[code];
    var d = parseISO(t);
    setShiftVars(code);

    $('todayDate').textContent = (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + DOW[d.getDay()] + '요일';
    var hol = holOf(t);
    var hb = $('todayHol');
    if (hol) { hb.textContent = hol[1]; hb.hidden = false; }
    else { hb.hidden = true; }
    var cyc = getCycle();
    updateTodaySub();
    var s = streak();
    $('checkStreak').textContent = s > 1 ? '오운완 ' + s + '일 연속' : '';

    /* 근무 카드 */
    var w = shiftWindow(t, code);
    var timeTxt = code === 'O' ? '근무 없음' :
      (w.st + ' ~ ' + (w.cross ? '익일 ' : '') + w.en);
    var st = statusFor(t, code);
    var card = $('todayShiftCard');
    card.innerHTML =
      '<div class="sc-top">' +
        '<div class="sc-badge ' + meta.cls + (code === 'O' ? ' off' : '') + '">' + (code === 'O' ? 'OFF' : code) + '</div>' +
        '<div class="sc-main">' +
          '<div class="sc-name"><b>' + meta.name + '</b><i>' + groupName(state.group) + ' · 주기 ' + (cyclePos(t) + 1) + '/' + cyc.length + '</i></div>' +
          '<div class="sc-time">' + timeTxt + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="sc-status"><span class="pulse"></span><span>' + st.html + '</span></div>' +
      (code === 'O' ? '' : '<div class="sc-bar"><span style="width:' + Math.max(2, Math.min(100, st.pct)).toFixed(1) + '%"></span></div>');

    /* 달력 첫 화면 상단 오늘 바 */
    renderTodayBar(t, code, w);

    /* 코칭 — 1줄 요약 + (자세히 펼칠 때) 3카드 */
    var c = COACH[code];
    $('coachChip').textContent = c.chip;
    $('coachLine').textContent = c.short.join(' · ');
    $('coachCards').innerHTML =
      coachCard(ICON.dumbbell, '오늘 운동', c.workout) +
      coachCard(ICON.bowl, '오늘 식단 타이밍', c.diet) +
      coachCard(ICON.coffee, '카페인 · 수면', c.caffeine) +
      '<div class="cs-guide">' +
        '<button class="cs-gbtn" data-gcat="ebook">📕 전자책 핵심<span class="ar">→</span></button>' +
        '<button class="cs-gbtn" data-gcat="qa">❓ Q&amp;A 백과<span class="ar">→</span></button>' +
      '</div>';
    applyCoachOpen();

    /* 체크 상태 — 오늘 탭과 달력 상단 오늘 바를 같이 맞춘다 */
    var lg = getLog(t);
    syncTodayChecks();
    var ri = $('runInput');
    if (document.activeElement !== ri) {
      ri.value = (typeof lg.run === 'number' && lg.run > 0) ? lg.run : '';
    }
    var mi = $('memoInput');
    if (document.activeElement !== mi) mi.value = lg.memo || '';

    renderWeek();
  }

  /* 달력 맨 위 — 오늘 근무 + 오운완·식단 원탭 */
  function renderTodayBar(iso, code, w) {
    var txt = $('tbTxt');
    if (!txt) return;
    var meta = SHIFT[code] || SHIFT.O;
    var d = parseISO(iso);
    var tTxt = code === 'O' ? '' : (w.st + '~' + (w.cross ? '익일 ' : '') + w.en);
    txt.innerHTML = '오늘 <b>' + (d.getMonth() + 1) + '/' + d.getDate() + '</b> · ' +
      groupName(state.group) + ' <b class="' + meta.cls + '">' + meta.name + '</b>' +
      (tTxt ? ' ' + tTxt : '');
  }
  function setTbBtn(btn, on) {
    if (!btn) return;
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  function syncTodayChecks() {
    var lg = getLog(todayISO());
    setCheckBtn($('btnWorkout'), !!lg.workout);
    setCheckBtn($('btnClean'), !!lg.clean);
    setTbBtn($('tbWorkout'), !!lg.workout);
    setTbBtn($('tbClean'), !!lg.clean);
  }

  /* 코칭 요약 카드 접기/펼치기 상태 반영 */
  function applyCoachOpen() {
    var sum = $('coachSum'), box = $('coachCards'), btn = $('coachToggle');
    if (!sum || !box || !btn) return;
    var on = !!state.coachOpen;
    sum.classList.toggle('open', on);
    box.hidden = !on;
    btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (btn.firstChild && btn.firstChild.nodeType === 3) {
      btn.firstChild.nodeValue = on ? '접기' : '자세히';
    }
  }

  /* 오늘 탭 부제 — 이달 오운완·식단 클린·러닝 누적 */
  function updateTodaySub() {
    var mp = monthPrefix(todayISO()), mw = 0, mc = 0;
    Object.keys(state.logs).forEach(function (k) {
      if (monthPrefix(k) !== mp) return;
      if (state.logs[k].workout) mw++;
      if (state.logs[k].clean) mc++;
    });
    var mr = monthRun(mp);
    $('todaySub').textContent = '이번 달 오운완 ' + mw + '일 · 식단 클린 ' + mc + '일' +
      (mr.km > 0 ? ' · 러닝 ' + fmtKm(mr.km) + 'km' : '');
  }

  function coachCard(em, title, data) {
    var rows = data.rows.map(function (r) {
      return '<div class="cline"><span class="k">' + esc(r[0]) + '</span><span class="v">' + r[1] + '</span></div>';
    }).join('');
    return '<div class="ccard">' +
      '<div class="ccard-h"><span class="em">' + em + '</span><span class="tt">' + title + '</span></div>' +
      '<div class="ccard-lead hl">' + data.lead + '</div>' +
      rows +
      (data.note ? '<div class="cnote">' + data.note + '</div>' : '') +
      '</div>';
  }

  function setCheckBtn(btn, on) {
    if (!btn) return;
    btn.classList.toggle('on', on);
    var s = btn.querySelector('.state');
    if (s) s.textContent = on ? '완료' : '미체크';
  }

  /* 7일 근무표 */
  function renderWeek() {
    var G = getGroups();
    var t = todayISO();
    var days = [];
    for (var i = -1; i <= 5; i++) days.push(addDays(t, i));

    var html = '<div class="wk-corner"></div>';
    days.forEach(function (ds) {
      var d = parseISO(ds);
      var isHol = !!holOf(ds);
      var isToday = ds === t;
      /* 오늘 열 — 헤더에 '오늘' 필을 달고, 열 전체는 CSS가 한 줄로 이어서 강조 (v2.5.4) */
      html += '<div class="wk-dow' + (isToday ? ' today' : '') + (isHol ? ' hol' : '') + '">' +
        (isToday ? '<span class="wk-today-pill">오늘</span>' : '') +
        '<b>' + DOW[d.getDay()] + '</b>' +
        (d.getMonth() + 1) + '/' + d.getDate() + '</div>';
    });

    for (var g = 1; g <= G; g++) {
      var mine = g === state.group;
      html += '<div class="wk-label' + (mine ? ' mine' : '') + '">' + groupName(g) + '</div>';
      days.forEach(function (ds) {
        var code = shiftFor(ds, g - 1);
        var m = SHIFT[code];
        html += '<div class="wk-cell' + (mine ? ' mine-row' : '') + (ds === t ? ' today' : '') + '">' +
          '<span class="dotc ' + m.cls + '">' + m.short + '</span></div>';
      });
    }
    var wg = $('weekGrid');
    if (wg) {
      wg.innerHTML = html;
      var ti = days.indexOf(t);
      if (ti >= 0) wg.style.setProperty('--wk-today', String(ti));
    }
  }

  /* ---------------- 렌더: 달력 ---------------- */
  var calRef = todayISO();
  var calView = 'month';   /* 'month' = 내 달력 · 'all' = 전체 조 */

  function renderCal() {
    var base = parseISO(calRef);
    var y = base.getFullYear(), m = base.getMonth();
    $('calTitle').textContent = y + '년 ' + (m + 1) + '월';

    var isAll = calView === 'all';
    $('calMonthView').hidden = isAll;
    $('calAllView').hidden = !isAll;
    var segs = document.querySelectorAll('#calViewSeg .seg-b');
    for (var s = 0; s < segs.length; s++) {
      segs[s].classList.toggle('is-on', segs[s].getAttribute('data-calview') === calView);
      segs[s].setAttribute('aria-selected', segs[s].getAttribute('data-calview') === calView ? 'true' : 'false');
    }

    var lastDay = new Date(y, m + 1, 0).getDate();
    if (isAll) renderCalAll(y, m, lastDay);
    else renderCalMonth(y, m, lastDay);

    /* 이 달 요약 */
    var cnt = { w: 0, c: 0, h: 0 };
    for (var dd = 1; dd <= lastDay; dd++) {
      var is2 = y + '-' + pad(m + 1) + '-' + pad(dd);
      if (holOf(is2)) cnt.h++;
      var l2 = state.logs[is2];
      if (l2 && l2.workout) cnt.w++;
      if (l2 && l2.clean) cnt.c++;
    }
    var settle = monthSettle(y, m + 1, lastDay);
    $('calHolSub').textContent = cnt.h ? '공휴일 ' + cnt.h + '일' : '';
    $('calStats').innerHTML =
      stat(cnt.w, '일', '오운완', 'y') +
      stat(cnt.c, '일', '식단 클린', 'g') +
      stat(settle.work, '일', '출근일', 'd') +
      stat(settle.off, '일', '휴무일', '');
    renderSettleCard(m + 1, settle);
  }

  /* 이달 근태 정산 — 대근·특근·연차·교육 + 예정 근무시간 + 월급 D-N */
  function renderSettleCard(month, settle) {
    var box = $('calSettle');
    if (!box) return;
    var cells = DAY_TAGS.map(function (t) {
      return '<div class="sk"><b>' + settle.tags[t] + '</b><i>' + t + '</i></div>';
    }).join('');
    var pay = '';
    var payIso = nextPaydayISO(todayISO());
    if (payIso) {
      var pd = parseISO(payIso);
      pay = '<span class="st-pay"><b>💰 월급날 ' + (pd.getMonth() + 1) + '월 ' + pd.getDate() + '일</b>' +
        '<i>' + ddayText(payIso) + '</i></span>';
    }
    box.innerHTML =
      '<div class="sk-head"><b>이달 근태 정산</b><span>' + month + '월</span></div>' +
      '<div class="sk-row">' + cells + '</div>' +
      '<div class="sk-foot">' +
        '<span class="sk-hours">예정 근무 <b>' + settle.hours + '</b><i>시간</i></span>' +
        pay +
      '</div>';
  }

  /* 내 달력 — 한 달 격자 */
  function renderCalMonth(y, m, lastDay) {
    var first = new Date(y, m, 1);
    var startPad = first.getDay();
    var t = todayISO();
    var payDay = paydayDay(y, m + 1);
    var html = '';

    for (var i = 0; i < startPad; i++) html += '<div class="cday pad"></div>';
    for (var day = 1; day <= lastDay; day++) {
      var iso = y + '-' + pad(m + 1) + '-' + pad(day);
      var code = myShift(iso);
      var meta = SHIFT[code];
      var lg = state.logs[iso] || null;
      var hol = holOf(iso);
      var dow = new Date(y, m, day).getDay();
      var cls = 'cday' + (dow === 0 ? ' sun' : dow === 6 ? ' sat' : '') +
        (iso === t ? ' has-today' : '') + (hol ? ' hol' : '') +
        (payDay === day ? ' payday' : '');
      var dots = '';
      if (lg) {
        if (lg.workout) dots += '<i class="pt y"></i>';
        if (lg.clean) dots += '<i class="pt g"></i>';
        if (typeof lg.weight === 'number' && lg.weight > 0) dots += '<i class="pt w"></i>';
        if (typeof lg.run === 'number' && lg.run > 0) dots += '<i class="pt r"></i>';
      }
      /* 한 줄 표시 — 근무 변경 태그 > 짧은 일정 > 공휴일 이름 (칸이 좁아 하나만) */
      var tags = (lg && Array.isArray(lg.tags)) ? lg.tags : [];
      var sched = (lg && lg.sched) ? String(lg.sched) : '';
      var mark = '';
      if (tags.length) mark = '<span class="ctag">' + esc(tags[0]) + (tags.length > 1 ? '+' + (tags.length - 1) : '') + '</span>';
      else if (sched) mark = '<span class="ctag m">' + esc(sched.slice(0, 5)) + '</span>';
      else if (hol) mark = '<span class="hn">' + esc(hol[0]) + '</span>';
      /* 월급날 — 태그·공휴일 이름이 없을 때 그 자리에 초록 '월급' */
      var payMark = (payDay === day && !tags.length && !sched) ? '<span class="ctag pay">월급</span>' : '';
      html += '<button class="' + cls + '" data-date="' + iso + '">' +
        '<span class="n">' + day + '</span>' +
        '<span class="bb ' + meta.cls + '">' + meta.short + '</span>' +
        (payMark || mark) +
        '<span class="dots">' + dots + '</span>' +
        '</button>';
    }
    var tail = (7 - ((startPad + lastDay) % 7)) % 7;
    for (var j = 0; j < tail; j++) html += '<div class="cday pad"></div>';

    $('calGrid').innerHTML = html;
  }

  /* 전체 조 — 주 단위로 끊어 1조~N조 근무표를 나란히 */
  function renderCalAll(y, m, lastDay) {
    var t = todayISO();
    var G = getGroups();
    var firstDow = new Date(y, m, 1).getDay();
    var total = firstDow + lastDay;
    var weeks = Math.ceil(total / 7);
    var html = '';

    for (var w = 0; w < weeks; w++) {
      html += '<div class="wk-block">';

      /* 요일 + 날짜 헤더 */
      html += '<div class="wk-line wk-hrow"><span class="wk-hl"></span>';
      for (var d = 0; d < 7; d++) {
        var dayNum = w * 7 + d - firstDow + 1;
        if (dayNum < 1 || dayNum > lastDay) { html += '<span class="wk-h"></span>'; continue; }
        var iso0 = y + '-' + pad(m + 1) + '-' + pad(dayNum);
        var hol0 = holOf(iso0);
        var dw = (firstDow + dayNum - 1) % 7;
        html += '<span class="wk-h' + (dw === 0 ? ' sun' : dw === 6 ? ' sat' : '') +
          (hol0 ? ' hol' : '') + (iso0 === t ? ' today' : '') +
          (dayNum === paydayDay(y, m + 1) ? ' pay' : '') + '">' +
          '<i>' + DOW[dw] + '</i><b>' + dayNum + '</b></span>';
      }
      html += '</div>';

      /* 조별 행 */
      for (var g = 1; g <= G; g++) {
        var mine = g === state.group;
        html += '<div class="wk-line wk-row' + (mine ? ' mine' : '') + '">' +
          '<span class="wk-rl">' + groupName(g) + '</span>';
        for (var d2 = 0; d2 < 7; d2++) {
          var day2 = w * 7 + d2 - firstDow + 1;
          if (day2 < 1 || day2 > lastDay) { html += '<span class="wk-c"></span>'; continue; }
          var iso = y + '-' + pad(m + 1) + '-' + pad(day2);
          var code = shiftFor(iso, g - 1);
          var meta = SHIFT[code];
          var hol = holOf(iso);
          html += '<span class="wk-c' + (iso === t ? ' today' : '') + (hol ? ' hol' : '') + '">' +
            '<i class="dotc ' + meta.cls + '">' + meta.short + '</i></span>';
        }
        html += '</div>';
      }
      html += '</div>';
    }

    $('calAll').innerHTML = html;
  }

  function stat(v, unit, label, cls) {
    return '<div class="stat ' + (cls || '') + '"><div class="sv">' + v + '<small>' + unit + '</small></div>' +
      '<div class="sl">' + label + '</div></div>';
  }

  /* =================================================================
     근무표 이미지 저장 (v2.3) — 현재 보는 달을 1080px PNG 한 장으로
     내 달력 = 한 달 격자, 전체 조 = 주별 조 비교표
     ================================================================= */
  var IMG_W = 1080;
  var IMG_FONT = '"Pretendard Variable",Pretendard,-apple-system,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",system-ui,sans-serif';
  var imgURL = null;

  function imgPalette() {
    return {
      bg: cssVar('--bg', '#0D0D0F'),
      card: cssVar('--card', '#17171B'),
      line: cssVar('--line', '#26262C'),
      txt: cssVar('--txt', '#F3F3F5'),
      txt2: cssVar('--txt2', '#B4B4BD'),
      muted: cssVar('--muted', '#7E7E89'),
      faint: cssVar('--faint', '#5F5F69'),
      gold: cssVar('--yellow', '#FFD400'),
      acc: cssVar('--accent-rgb', '255,212,0'),
      hol: cssVar('--hol', '#FF6B6B'),
      green: cssVar('--green', '#3DDC97'),
      run: cssVar('--run-ink', '#FFB877'),
      runRgb: cssVar('--run-rgb', '255,159,69'),
      d: imgShiftColor('D', '#4C8DFF', '76,141,255', '.15'),
      a: imgShiftColor('A', '#FFA24C', '255,162,76', '.15'),
      n: imgShiftColor('N', '#B18CFF', '177,140,255', '.15'),
      o: imgShiftColor('O', '#35D07F', '53,208,127', '.14')
    };
  }
  /* PNG 한 군데에서 쓰는 근무 색 [글자색, 배경색].
     고른 배지 색(v2.5.3)이 있으면 CSS 변수 해석에 기대지 않고 직접 계산해 넣는다. */
  function imgShiftColor(code, defHex, defRgb, alpha) {
    var p = paletteOf(state.badgeColors && state.badgeColors[code]);
    if (!p) {
      return [cssVar(SHIFT_VAR[code], defHex), cssVar(SHIFT_VAR[code] + '-bg', 'rgba(' + defRgb + ',' + alpha + ')')];
    }
    var isLight = document.documentElement.getAttribute('data-theme') === 'light';
    var hex = isLight ? p.light : p.dark;
    return [hex, 'rgba(' + hexRgb(hex) + ',' + alpha + ')'];
  }
  function imgRound(ctx, x, y, w, h, r) {
    var rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }
  function imgFont(ctx, size, weight) {
    ctx.font = (weight || 700) + ' ' + size + 'px ' + IMG_FONT;
  }
  function imgText(ctx, txt, x, y, size, weight, color, align) {
    imgFont(ctx, size, weight);
    ctx.fillStyle = color;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(txt, x, y);
  }
  function imgWidth(ctx, txt, size, weight) {
    imgFont(ctx, size, weight);
    return ctx.measureText(txt).width;
  }

  function buildCalCanvas() {
    var base = parseISO(calRef);
    var y = base.getFullYear(), m = base.getMonth() + 1;
    var lastDay = monthLastDay(y, m);
    var isAll = calView === 'all';
    var G = getGroups();
    var pal = imgPalette();
    var PAD = 48, GAP = 8;
    var innerW = IMG_W - PAD * 2;
    var firstDow = new Date(y, m - 1, 1).getDay();
    var weeks = Math.ceil((firstDow + lastDay) / 7);
    var TOP = 236, DOW_H = 46, LEG_H = 46, FOOT_H = 150;
    var cellW = (innerW - GAP * 6) / 7;
    var cellH = 140;
    var allLabelW = 92, allHeadH = 56, allRowH = 62, allGap = 20;
    var allCellW = (innerW - allLabelW - GAP * 6) / 7;
    var gridH = isAll
      ? weeks * (allHeadH + G * allRowH + allGap)
      : weeks * cellH + (weeks - 1) * GAP;
    var H = TOP + (isAll ? 0 : DOW_H) + gridH + (isAll ? 0 : LEG_H) + FOOT_H;

    var canvas = document.createElement('canvas');
    canvas.width = IMG_W;
    canvas.height = Math.round(H);
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, IMG_W, canvas.height);

    /* ── 제목 ── */
    ctx.fillStyle = pal.gold;
    imgRound(ctx, PAD, 50, 9, 38, 4.5);
    ctx.fill();
    imgText(ctx, '교대핏', PAD + 22, 80, 24, 800, pal.gold);
    imgText(ctx, y + '년 ' + m + '월', PAD, 156, 56, 800, pal.txt);
    imgText(ctx, isAll ? ('전체 조 근무표 · ' + G + '개 조')
      : (groupName(state.group) + ' · ' + presetName()), PAD, 194, 22, 600, pal.muted);

    /* 오른쪽 — 공휴일 수 · 월급날 */
    var holCnt = 0;
    for (var hd = 1; hd <= lastDay; hd++) if (holOf(y + '-' + pad(m) + '-' + pad(hd))) holCnt++;
    if (holCnt) imgText(ctx, '공휴일 ' + holCnt + '일', IMG_W - PAD, 126, 22, 700, pal.muted, 'right');
    var payIso = paydayISOOf(y, m);
    if (payIso) {
      var pd = parseISO(payIso);
      imgText(ctx, '월급날 ' + (pd.getMonth() + 1) + '/' + pd.getDate(), IMG_W - PAD, 168, 24, 800, pal.green, 'right');
    }

    var gTop = TOP + DOW_H;
    if (isAll) {
      /* ── 전체 조 — 주마다 요일·날짜 + 조별 한 줄 ── */
      var payNumA = paydayDay(y, m);
      for (var w = 0; w < weeks; w++) {
        var bTop = TOP + w * (allHeadH + G * allRowH + allGap);
        for (var d0 = 0; d0 < 7; d0++) {
          var day0 = w * 7 + d0 - firstDow + 1;
          if (day0 < 1 || day0 > lastDay) continue;
          var iso0 = y + '-' + pad(m) + '-' + pad(day0);
          var dw0 = (firstDow + day0 - 1) % 7;
          var hol0 = holOf(iso0);
          var cx0 = PAD + allLabelW + d0 * (allCellW + GAP) + allCellW / 2;
          imgText(ctx, DOW[dw0], cx0, bTop + 20, 18, 700,
            dw0 === 0 ? pal.hol : (dw0 === 6 ? pal.d[0] : pal.muted), 'center');
          imgText(ctx, String(day0), cx0, bTop + 47, 24, 800,
            (hol0 || dw0 === 0) ? pal.hol : pal.txt, 'center');
          if (day0 === payNumA) {
            ctx.fillStyle = pal.green;
            ctx.beginPath();
            ctx.arc(cx0 + imgWidth(ctx, String(day0), 24, 800) / 2 + 9, bTop + 40, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        for (var g = 1; g <= G; g++) {
          var rTop = bTop + allHeadH + (g - 1) * allRowH;
          var mine = g === state.group;
          if (mine) {
            ctx.fillStyle = 'rgba(' + pal.acc + ',.07)';
            imgRound(ctx, PAD, rTop - 7, innerW, allRowH, 14);
            ctx.fill();
          }
          imgText(ctx, groupName(g), PAD + 10, rTop + 40, 22, 800, mine ? pal.gold : pal.txt2);
          for (var d1 = 0; d1 < 7; d1++) {
            var day1 = w * 7 + d1 - firstDow + 1;
            if (day1 < 1 || day1 > lastDay) continue;
            var iso1 = y + '-' + pad(m) + '-' + pad(day1);
            var meta1 = SHIFT[shiftFor(iso1, g - 1)] || SHIFT.O;
            var pair1 = pal[meta1.cls];
            var bx = PAD + allLabelW + d1 * (allCellW + GAP);
            ctx.fillStyle = pair1[1];
            imgRound(ctx, bx + 4, rTop + 8, allCellW - 8, 46, 12);
            ctx.fill();
            imgText(ctx, meta1.short, bx + allCellW / 2, rTop + 39, 22, 800, pair1[0], 'center');
          }
        }
      }
    } else {
      /* ── 내 달력 — 요일 + 날짜 + 근무 배지 + 태그 + 공휴일 ── */
      var dows = ['일', '월', '화', '수', '목', '금', '토'];
      for (var i = 0; i < 7; i++) {
        imgText(ctx, dows[i], PAD + i * (cellW + GAP) + cellW / 2, TOP + 26, 21, 700,
          i === 0 ? pal.hol : (i === 6 ? pal.d[0] : pal.muted), 'center');
      }
      var payNum = paydayDay(y, m);
      for (var day = 1; day <= lastDay; day++) {
        var idx = firstDow + day - 1;
        var row = Math.floor(idx / 7), col = idx % 7;
        var x = PAD + col * (cellW + GAP);
        var yy = gTop + row * (cellH + GAP);
        var iso = y + '-' + pad(m) + '-' + pad(day);
        var meta = SHIFT[myShift(iso)] || SHIFT.O;
        var hol = holOf(iso);
        var lg = state.logs[iso] || null;
        var tags = (lg && Array.isArray(lg.tags)) ? lg.tags : [];
        var sched = (lg && lg.sched) ? String(lg.sched) : '';
        var ddw = new Date(y, m - 1, day).getDay();

        ctx.fillStyle = pal.card;
        imgRound(ctx, x, yy, cellW, cellH, 18);
        ctx.fill();
        ctx.strokeStyle = pal.line;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        imgText(ctx, String(day), x + cellW / 2, yy + 40, 26, 800,
          (hol || ddw === 0) ? pal.hol : (ddw === 6 ? pal.d[0] : pal.txt), 'center');

        if (day === payNum) {
          var pw = imgWidth(ctx, '월급', 13, 800) + 12;
          ctx.fillStyle = pal.green;
          imgRound(ctx, x + cellW - pw - 8, yy + 9, pw, 21, 7);
          ctx.fill();
          imgText(ctx, '월급', x + cellW - pw / 2 - 8, yy + 24, 13, 800, pal.bg, 'center');
        }

        /* 근무 배지 */
        var pair = pal[meta.cls];
        ctx.fillStyle = pair[1];
        imgRound(ctx, x + (cellW - 78) / 2, yy + 50, 78, 42, 11);
        ctx.fill();
        imgText(ctx, meta.short, x + cellW / 2, yy + 79, 24, 800, pair[0], 'center');

        /* 근무 변경 태그 / 짧은 일정 */
        var mark = tags.length ? (tags[0] + (tags.length > 1 ? '+' + (tags.length - 1) : ''))
          : (sched ? sched.slice(0, 7) : '');
        if (mark) {
          var tw = Math.min(cellW - 18, imgWidth(ctx, mark, 16, 800) + 18);
          ctx.fillStyle = tags.length ? 'rgba(' + pal.runRgb + ',.20)' : 'rgba(' + pal.acc + ',.16)';
          imgRound(ctx, x + (cellW - tw) / 2, yy + 98, tw, 26, 8);
          ctx.fill();
          imgText(ctx, mark, x + cellW / 2, yy + 116, 16, 800, tags.length ? pal.run : pal.gold, 'center');
        }

        /* 공휴일 이름 */
        if (hol) imgText(ctx, hol[0], x + cellW / 2, yy + 133, 14, 700, pal.hol, 'center');
      }

      /* 범례 */
      var ly = gTop + weeks * cellH + (weeks - 1) * GAP + 28;
      var lx = PAD;
      ['D', 'A', 'N', 'O'].forEach(function (code) {
        var mt = SHIFT[code], pr = pal[mt.cls];
        ctx.fillStyle = pr[1];
        imgRound(ctx, lx, ly, 32, 32, 9);
        ctx.fill();
        imgText(ctx, mt.short, lx + 16, ly + 23, 17, 800, pr[0], 'center');
        imgText(ctx, mt.name, lx + 41, ly + 22, 18, 700, pal.muted);
        lx += 41 + imgWidth(ctx, mt.name, 18, 700) + 26;
      });
      if (payNum) {
        ctx.fillStyle = pal.green;
        imgRound(ctx, lx, ly + 8, 17, 17, 5);
        ctx.fill();
        imgText(ctx, '월급날', lx + 25, ly + 22, 18, 700, pal.muted);
      }
    }

    /* ── 하단 워터마크 ── */
    var fy = canvas.height - 72;
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, fy - 42);
    ctx.lineTo(IMG_W - PAD, fy - 42);
    ctx.stroke();
    imgText(ctx, '교대핏', PAD, fy + 4, 26, 800, pal.gold);
    imgText(ctx, 'by 킹용코', PAD + imgWidth(ctx, '교대핏', 26, 800) + 10, fy + 4, 20, 700, pal.muted);
    imgText(ctx, '교대근무 근무표 · 헬스 · 식단', PAD, fy + 32, 17, 600, pal.faint);
    imgText(ctx, todayISO().replace(/-/g, '.') + ' 기준', IMG_W - PAD, fy + 32, 17, 600, pal.muted, 'right');

    return {
      canvas: canvas,
      filename: '교대핏_' + y + '-' + pad(m) + (isAll ? '_전체조' : '') + '.png',
      title: y + '년 ' + m + '월 ' + (isAll ? '전체 조 근무표' : '근무표')
    };
  }

  function canvasToBlob(canvas) {
    return new Promise(function (resolve, reject) {
      if (canvas.toBlob) {
        canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error('blob')); }, 'image/png');
        return;
      }
      try {
        var url = canvas.toDataURL('image/png');
        var bin = atob(url.split(',')[1]);
        var arr = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        resolve(new Blob([arr], { type: 'image/png' }));
      } catch (e) { reject(e); }
    });
  }

  /* Pretendard가 준비된 뒤에 그려야 글자가 깨지지 않는다 */
  function imgFontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('800 56px "Pretendard Variable"'),
      document.fonts.load('700 22px "Pretendard Variable"'),
      document.fonts.load('600 18px "Pretendard Variable"')
    ]).catch(function () { }).then(function () {
      return document.fonts.ready;
    }).catch(function () { });
  }

  function triggerDownload(url, name) {
    try {
      var a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, 0);
    } catch (e) { }
  }

  function showImageModal(url, name, file) {
    var wrap = $('imgWrap');
    if (!wrap) return;
    $('imgPreview').src = url;
    var a = $('imgDownload');
    a.href = url;
    a.setAttribute('download', name);
    $('imgTitle').textContent = name.replace(/\.png$/i, '');
    $('imgSub').textContent = '길게 눌러 사진 저장 · 카톡으로 보내기';
    var sh = $('imgShare');
    if (sh) {
      if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        sh.hidden = false;
        sh.onclick = function () {
          navigator.share({ files: [file], title: name }).catch(function () { });
        };
      } else {
        sh.hidden = true;
      }
    }
    wrap.classList.add('open');
  }
  function closeImageModal() {
    var wrap = $('imgWrap');
    if (wrap) wrap.classList.remove('open');
  }

  /* 이미지 저장 버튼 — 공유 시트가 되면 공유, 아니면 다운로드 + 미리보기 */
  function exportCalendarImage() {
    var btn = $('btnCalImage');
    if (btn) { btn.disabled = true; btn.classList.add('busy'); }
    imgFontsReady()
      .then(function () { return buildCalCanvas(); })
      .then(function (out) {
        return canvasToBlob(out.canvas).then(function (blob) {
          var url = URL.createObjectURL(blob);
          var file = null;
          try { file = new File([blob], out.filename, { type: 'image/png' }); } catch (e) { file = null; }
          var canShare = !!(file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] }));
          var fallback = function () {
            triggerDownload(url, out.filename);
            showImageModal(url, out.filename, file);
            if (imgURL && imgURL !== url) { try { URL.revokeObjectURL(imgURL); } catch (e) { } }
            imgURL = url;
            toast('이미지 준비 완료 — 저장 또는 길게 눌러 저장');
          };
          if (!canShare) { fallback(); return; }
          navigator.share({ files: [file], title: out.title }).then(function () {
            try { URL.revokeObjectURL(url); } catch (e) { }
          }).catch(function (err) {
            if (err && err.name === 'AbortError') { try { URL.revokeObjectURL(url); } catch (e) { } return; }
            fallback();
          });
        });
      })
      .catch(function (e) {
        if (window.console && console.warn) console.warn('[교대핏] 이미지 저장 실패', e);
        toast('이미지를 만들지 못했어요 — 다시 눌러주세요');
      })
      .then(function () {
        if (btn) { btn.disabled = false; btn.classList.remove('busy'); }
      });
  }

  /* ---------------- 렌더: 기록 ---------------- */
  function monthPrefix(iso) { return iso.slice(0, 7); }

  function streak() {
    var t = todayISO();
    var n = 0;
    var cur = getLog(t).workout ? t : addDays(t, -1);
    for (var i = 0; i < 400; i++) {
      var l = state.logs[cur];
      if (l && l.workout) { n++; cur = addDays(cur, -1); }
      else break;
    }
    return n;
  }

  function renderLog() {
    var t = todayISO();
    var mp = monthPrefix(t);
    var w = 0, c = 0, days = 0;
    Object.keys(state.logs).forEach(function (k) {
      if (monthPrefix(k) !== mp) return;
      var l = state.logs[k];
      if (l.workout) w++;
      if (l.clean) c++;
      days++;
    });
    var mr = monthRun(mp);

    var weights = Object.keys(state.logs)
      .filter(function (k) { return typeof state.logs[k].weight === 'number' && state.logs[k].weight > 0; })
      .sort();
    var lastW = weights.length ? state.logs[weights[weights.length - 1]].weight : null;
    var diff = weights.length >= 2 ? (lastW - state.logs[weights[0]].weight) : null;

    $('logStats').innerHTML =
      '<div class="stat wide r"><div class="sv">' + fmtKm(mr.km) + '<small>km</small></div>' +
        '<div class="sl">이달 누적 러닝' + (mr.days ? ' · ' + mr.days + '회' : ' · 기록 없음') + '</div></div>' +
      stat(w, '일', '이달 오운완', 'y') +
      stat(streak(), '일', '오운완 연속', 'g') +
      stat(c, '일', '이달 식단 클린', 'g') +
      (lastW != null
        ? '<div class="stat d"><div class="sv">' + lastW + '<small>kg</small></div><div class="sl">최근 체중' +
          (diff != null ? ' · 처음 대비 ' + (diff > 0 ? '+' : '') + diff.toFixed(1) + 'kg' : '') + '</div></div>'
        : stat(days, '일', '기록한 날', 'd'));

    renderChart();

    /* 리스트 */
    var keys = Object.keys(state.logs).sort().reverse();
    if (!keys.length) {
      $('logList').innerHTML = '<div class="empty">아직 기록이 없습니다.<br>오늘 탭에서 <b>오운완</b>과 <b>식단 클린</b>을 눌러보세요.</div>';
      return;
    }
    var html = keys.map(function (k) {
      var l = state.logs[k];
      var d = parseISO(k);
      var code = myShift(k);
      var meta = SHIFT[code];
      var tags = '';
      if (l.workout) tags += '<span class="tag y">오운완</span>';
      if (l.clean) tags += '<span class="tag g">식단 클린</span>';
      if (typeof l.run === 'number' && l.run > 0) tags += '<span class="tag r">🏃 ' + fmtKm(l.run) + 'km</span>';
      if (typeof l.weight === 'number' && l.weight > 0) tags += '<span class="tag w">' + l.weight + 'kg</span>';
      (Array.isArray(l.tags) ? l.tags : []).forEach(function (tg) { tags += '<span class="tag t">' + esc(tg) + '</span>'; });
      if (l.sched) tags += '<span class="tag t">📌 ' + esc(l.sched) + '</span>';
      (l.parts || []).forEach(function (p) { tags += '<span class="tag">' + esc(p) + '</span>'; });
      return '<div class="log-item">' +
        '<div class="li-top">' +
          '<span class="li-date">' + (d.getMonth() + 1) + '/' + d.getDate() + '</span>' +
          '<span class="li-wd">' + DOW[d.getDay()] + '</span>' +
          '<span class="li-badge ' + meta.cls + '">' + meta.name + '</span>' +
          '<button class="li-del" data-del="' + k + '" aria-label="삭제">✕</button>' +
        '</div>' +
        (tags ? '<div class="li-meta">' + tags + '</div>' : '') +
        (l.memo ? '<div class="li-memo">' + esc(l.memo) + '</div>' : '') +
        '</div>';
    }).join('');
    $('logList').innerHTML = html;
  }

  function renderChart() {
    var entries = Object.keys(state.logs)
      .filter(function (k) { return typeof state.logs[k].weight === 'number' && state.logs[k].weight > 0; })
      .sort().slice(-20);
    var box = $('weightChart');
    if (entries.length < 2) {
      box.innerHTML = '<div class="chart-empty">체중을 2회 이상 기록하면 추이가 보입니다</div>';
      $('chartSub').textContent = entries.length ? '기록 1회' : '기록 없음';
      return;
    }
    var vals = entries.map(function (k) { return state.logs[k].weight; });
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    var span = Math.max(0.6, max - min);
    min = min - span * 0.25; max = max + span * 0.2;
    var W = 300, H = 80, padX = 8, padY = 10;
    var pts = vals.map(function (v, i) {
      var x = padX + i * (W - padX * 2) / (vals.length - 1);
      var y = H - padY - (v - min) / (max - min) * (H - padY * 2);
      return [x, y];
    });
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = line + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + H + ' L' + pts[0][0].toFixed(1) + ' ' + H + ' Z';
    var dots = pts.map(function (p, i) {
      var last = i === pts.length - 1;
      return '<circle class="ch-dot' + (last ? ' last' : '') + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (last ? 3.4 : 2) + '"/>';
    }).join('');
    var lastV = vals[vals.length - 1];
    box.innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">' +
      '<defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">' +
      '<stop class="ch-g0" offset="0%"/>' +
      '<stop class="ch-g1" offset="100%"/>' +
      '</linearGradient></defs>' +
      '<path class="ch-area" d="' + area + '"/>' +
      '<path class="ch-line" d="' + line + '"/>' +
      dots +
      '</svg>';
    var first = vals[0];
    $('chartSub').textContent = entries.length + '회 · ' + first + ' → ' + lastV + 'kg';
  }

  /* ---------------- 내 회사 찾기 (설정 탭 · 첫 세팅 시트 공통) ---------------- */
  var coState = {
    settings: { ind: 'all', q: '', open: false, picked: '' },
    setup: { ind: 'all', q: '', open: false, picked: '' }
  };

  function coNorm(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/[\s()\uff08\uff09\-_.]/g, '');
  }
  function coResults(s) {
    var q = coNorm(s.q);
    return COMPANIES.filter(function (c) {
      if (!q && s.ind !== 'all' && c.ind !== s.ind) return false;
      if (!q) return true;
      if (coNorm(c.name).indexOf(q) >= 0) return true;
      for (var i = 0; i < c.keys.length; i++) {
        if (coNorm(c.keys[i]).indexOf(q) >= 0) return true;
      }
      return false;
    });
  }
  function coIndShort(id) {
    for (var i = 0; i < INDUSTRIES.length; i++) if (INDUSTRIES[i].id === id) return INDUSTRIES[i].short;
    return '';
  }
  function coItemHTML(c, scope) {
    var p = presetById(c.p);
    return '<button class="co-item" data-co-pick="' + esc(c.name) + '" data-co-scope="' + scope + '">' +
      '<span class="co-top"><b>' + esc(c.name) + '</b><i>' + esc(coIndShort(c.ind)) + '</i></span>' +
      '<span class="co-sub">' + esc((p ? p.name : '커스텀 주기') + ' · ' + styleLabel(c.s, coGroups(c))) + '</span>' +
      '<span class="co-time">' + esc(shiftTimesText(c)) + '</span>' +
      (c.nt ? '<span class="co-nt">' + esc(c.nt) + '</span>' : '') +
      '</button>';
  }
  /* 회사 추가 요청 버튼 — 메일(nyk542@naver.com) · 인스타 DM(@kingyongko) */
  var CO_ASK_MAIL = 'mailto:nyk542@naver.com?subject=%5B%EA%B5%90%EB%8C%80%ED%95%8F%5D%20%ED%9A%8C%EC%82%AC%20%EA%B7%BC%EB%AC%B4%ED%91%9C%20%EC%B6%94%EA%B0%80%20%EC%9A%94%EC%B2%AD&body=%ED%9A%8C%EC%82%AC%EB%AA%85%3A%20%0A%EA%B5%90%EB%8C%80%20%ED%98%95%ED%83%9C(%EC%98%88%3A%204%EC%A1%B02%EA%B5%90%EB%8C%80)%3A%20%0A%EA%B7%BC%EB%AC%B4%20%EC%88%9C%EC%84%9C(%EC%98%88%3A%20%EC%A3%BC%C2%B7%EC%A3%BC%C2%B7%ED%9C%B4%C2%B7%ED%9C%B4%C2%B7%EC%95%BC%C2%B7%EC%95%BC%C2%B7%ED%9C%B4%C2%B7%ED%9C%B4)%3A%20%0A%EA%B7%BC%EB%AC%B4%20%EC%8B%9C%EA%B0%84%3A%20';
  function coAskHTML(withLead) {
    return '<div class="co-ask">' +
      (withLead ? '<div class="co-ask-t">찾는 회사가 없나요? 회사명과 근무 순서를 보내주시면 표에 추가해 드립니다</div>' : '') +
      '<div class="co-ask-row">' +
        '<a class="co-ask-b" href="' + CO_ASK_MAIL + '">📧 메일로 회사 추가 요청</a>' +
        '<a class="co-ask-b ig" href="https://www.instagram.com/kingyongko/" target="_blank" rel="noopener">📸 인스타 DM 요청 (@kingyongko)</a>' +
      '</div>' +
    '</div>';
  }
  function renderCompanyBlock(scope) {
    var s = coState[scope];
    var chipsEl = $(scope === 'settings' ? 'coChips' : 'setupCoChips');
    var listEl = $(scope === 'settings' ? 'coList' : 'setupCoList');
    var inputEl = $(scope === 'settings' ? 'coInput' : 'setupCoInput');
    var pickEl = $(scope === 'settings' ? 'coPicked' : 'setupCoPicked');
    if (!chipsEl || !listEl) return;

    if (inputEl && document.activeElement !== inputEl && inputEl.value !== s.q) inputEl.value = s.q;

    var chips = '<button class="chip' + (s.ind === 'all' ? ' on' : '') + '" data-co-ind="all" data-co-scope="' + scope + '">전체</button>';
    INDUSTRIES.forEach(function (d) {
      chips += '<button class="chip' + (s.ind === d.id ? ' on' : '') + '" data-co-ind="' + d.id + '" data-co-scope="' + scope + '">' + d.name + '</button>';
    });
    chipsEl.innerHTML = chips;

    if (pickEl) {
      var pk = s.picked ? companyByName(s.picked) : null;
      pickEl.hidden = !pk;
      if (pk) {
        pickEl.innerHTML = '<b>' + esc(pk.name) + '</b> 세팅 완료 — ' +
          esc((presetById(pk.p) ? presetById(pk.p).name : '커스텀 주기') + ' · ' + styleLabel(pk.s, coGroups(pk))) +
          '<i>내 조와 오늘 내 근무만 확인하세요</i>';
      }
    }

    /* 검색어가 비어 있으면 41곳 전체를 ㄱㄴㄷ순으로 바로 보여준다 (아래로 스크롤하며 보기) */
    var rows = coResults(s).sort(function (a, b) { return a.name.localeCompare(b.name, 'ko'); });
    var isAll = !coNorm(s.q) && s.ind === 'all';
    if (!rows.length) {
      listEl.innerHTML = '<div class="co-hint">검색 결과가 없습니다. 다른 업종이나 다른 이름으로 찾아보세요.<br><b>없는 회사는 아래로 바로 요청할 수 있어요</b></div>' + coAskHTML(false);
      return;
    }
    listEl.innerHTML = '<div class="co-cnt">' + (isAll ? '전체 ' + rows.length + '곳' : rows.length + '곳') + ' · ㄱㄴㄷ순</div>' +
      rows.map(function (c) { return coItemHTML(c, scope); }).join('');
  }

  /* 회사를 골랐을 때: 교대 형태 · 조 표기 · 근무 시간을 한 번에 세팅 */
  function applyCompany(c) {
    state.presetId = c.p || '4-2';
    if (state.presetId === 'custom') {
      state.custom = parseCycle(c.cy) ? c.cy : state.custom;
      state.customGroups = Math.max(2, Math.min(5, c.cg || 4));
    }
    state.groupStyle = c.s === 'num' ? 'num' : 'abc';
    state.group = 1;

    var G = getGroups();
    var letters = groupLetters(G);
    var cur = String(state.groupOrder || '');
    var four = (/^[A-D]{4}$/.test(cur) && cur.split('').filter(function (v, i, a) { return a.indexOf(v) === i; }).length === 4);
    if (G === 4) state.groupOrder = four ? cur : 'ACDB';
    else state.groupOrder = letters.join('');

    var base = PRESET_TIMES[state.presetId] || PRESET_TIMES['4-2'];
    var t = {};
    ['D', 'A', 'N'].forEach(function (k) {
      t[k] = ((c.t && c.t[k]) || base[k] || state.times[k] || ['07:00', '19:00']).slice();
    });
    state.times = t;
    save();
  }

  function pickCompany(name, scope) {
    var c = companyByName(name);
    if (!c) return;
    applyCompany(c);
    var s = coState[scope] || coState.settings;
    s.picked = c.name;
    s.open = false;
    s.q = '';
    s.ind = 'all';
    renderAll();
    renderSettings();
    renderSetup();
    toast(c.name + ' — ' + presetName() + ' 세팅');

    /* 바로 '내 조' → '오늘 내 근무'로 이어지게 */
    if (scope === 'setup') {
      [$('setupStep2'), $('setupStep3')].forEach(function (n) { if (n) n.classList.add('next'); });
      if ($('setupStep2') && $('setupStep2').scrollIntoView) {
        $('setupStep2').scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    } else {
      var card = $('groupCard');
      if (card) {
        card.classList.add('flash');
        if (card.scrollIntoView) card.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setTimeout(function () { card.classList.remove('flash'); }, 1800);
      }
    }
  }

  /* ---------------- 렌더: 설정 ---------------- */
  function renderSettings() {
    var p = getPreset();
    $('presetList').innerHTML = PRESETS.map(function (x) {
      var on = x.id === state.presetId;
      return '<button class="preset' + (on ? ' on' : '') + '" data-preset="' + x.id + '">' +
        '<span class="pdot"></span>' +
        '<span class="pt">' +
          '<span class="pn">' + x.name + (x.star ? '<em>기본</em>' : '') + '</span>' +
          '<span class="pc">' + x.text + '</span>' +
          '<span class="pl">' + x.legend + ' · ' + x.groups + '개 조</span>' +
        '</span>' +
        '</button>';
    }).join('') +
      '<button class="preset' + (state.presetId === 'custom' ? ' on' : '') + '" data-preset="custom">' +
        '<span class="pdot"></span>' +
        '<span class="pt">' +
          '<span class="pn">커스텀 주기</span>' +
          '<span class="pc">' + esc(state.custom) + '</span>' +
          '<span class="pl">직접 입력 · ' + (parseCycle(state.custom) || []).length + '일 주기</span>' +
        '</span>' +
      '</button>';

    /* 테마 · 근무 배지 색 */
    renderThemePick();
    renderBadgePick();

    /* 조 이름 표기 + 조 칩 */
    var G = getGroups();
    var chips = '';
    for (var g = 1; g <= G; g++) {
      chips += '<button class="chip' + (state.group === g ? ' on' : '') + '" data-group="' + g + '">' + groupName(g) + '</button>';
    }
    $('groupChips').innerHTML = chips;
    syncGroupStyle();

    /* 조 순환 순서 — 4조는 킹용코 회사 기본(A→C→D→B) 포함 3가지, 그 외 조 수는 자연 순서 */
    var orders = (G === 4) ? GROUP_ORDERS : [{ id: groupLetters(G).join(''), label: groupLetters(G).join(' → '), note: '기본' }];
    $('groupOrderChips').innerHTML = orders.map(function (o) {
      return '<button class="chip' + (state.groupOrder === o.id ? ' on' : '') + '" data-gorder="' + o.id + '">' +
        o.label + (o.note ? ' <i>' + o.note + '</i>' : '') + '</button>';
    }).join('');

    /* 오늘 내 근무 — 오늘·내일 흐름으로 고르기 */
    renderTodayPick($('todayPick'), !state.setupDone);
    var tIdx = cyclePos(todayISO());
    var tc = getCycle()[tIdx] || 'O';
    var tcN = myShift(addDays(todayISO(), 1));
    $('todayPickNote').innerHTML =
      '지금 설정 — 오늘 <b>' + pickName(tc) + '</b> · 내일 <b>' + pickName(tcN) + '</b> · ' + groupName(state.group) + '<br>' +
      '<span style="color:var(--faint)">기준일 ' + state.anchor + ' = ' + groupName(state.group) + ' 주기의 1일째</span>';

    $('anchorInput').value = state.anchor;

    /* 커스텀 조 수 */
    var cg = '';
    [2, 3, 4, 5].forEach(function (n) {
      cg += '<button class="chip' + (state.customGroups === n ? ' on' : '') + '" data-cgroup="' + n + '">' + n + '조</button>';
    });
    $('customGroupChips').innerHTML = cg;

    /* 내 회사 찾기 */
    renderCompanyBlock('settings');

    if (document.activeElement !== $('customInput')) $('customInput').value = state.custom;

    /* 주기 미리보기 */
    var cyc = getCycle();
    var prev = cyc.map(function (c) {
      var m = SHIFT[c];
      return '<span class="dotc ' + m.cls + '" style="width:24px;height:24px;font-size:10px">' + m.short + '</span>';
    }).join('');
    $('cyclePreview').innerHTML =
      '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:7px">' + prev + '</div>' +
      presetName() + ' · ' + cyc.length + '일 주기 · 지금 <b style="color:var(--yellow-ink)">' + groupName(state.group) + '</b> · 조마다 ' +
      Math.max(1, Math.round(cyc.length / getGroups())) + '일씩 밀림<br>' +
      '<span style="color:var(--faint)">기준일 ' + state.anchor + ' = ' + groupName(state.group) + '의 주기 1일째</span>';

    /* 시간 */
    ['D', 'A', 'N'].forEach(function (c) {
      var t = state.times[c] || ['00:00', '00:00'];
      $('t' + c + '_s').value = t[0];
      $('t' + c + '_e').value = t[1];
    });

    /* 월급날 */
    var sel = $('paydaySelect');
    if (sel) {
      var opts = '<option value="none">없음</option>';
      for (var pd = 1; pd <= 31; pd++) opts += '<option value="' + pd + '">' + pd + '일</option>';
      opts += '<option value="last">말일</option>';
      sel.innerHTML = opts;
      sel.value = state.payday === 0 ? 'none' : (state.payday === 'last' ? 'last' : String(state.payday));
    }

    $('customErr').hidden = true;
  }

  /* ---------------- 오늘 내 근무 — 오늘·내일 흐름으로 고르기 ---------------- */
  /* 주기의 각 자리를 '오늘 X (내일도 X / 내일 Y · 다다음날 Z)' 문장으로 바꾼다.
     일차 번호는 쓰지 않고, 같은 문장이 둘 이상이면 그때만 작은 일차 태그를 붙인다. */
  function flowOptions(cyc) {
    var N = cyc.length, items = [];
    for (var i = 0; i < N; i++) {
      var t = cyc[i], tm = cyc[(i + 1) % N], dd = cyc[(i + 2) % N];
      var pair = (tm === t) ? '내일도 ' + pickName(tm) : '내일 ' + pickName(tm);
      if (t === 'O' && tm === 'O') pair += ' · 다다음날 ' + pickName(dd);
      items.push({ idx: i, code: t, pair: pair });
    }
    /* 오늘 근무까지 같은 문장이 둘 이상일 때만 다다음날로 구분하고,
       그래도 같으면 작은 일차 태그를 붙인다 (대부분은 태그 없이 구분된다) */
    var key = function (it) { return it.code + '|' + it.pair; };
    var count = {};
    items.forEach(function (it) { count[key(it)] = (count[key(it)] || 0) + 1; });
    items.forEach(function (it) {
      if (count[key(it)] > 1 && it.pair.indexOf('다다음날') < 0) {
        it.pair += ' · 다다음날 ' + pickName(cyc[(it.idx + 2) % N]);
      }
    });
    var count2 = {};
    items.forEach(function (it) { count2[key(it)] = (count2[key(it)] || 0) + 1; });
    items.forEach(function (it) {
      it.tag = count2[key(it)] > 1 ? ((it.idx + 1) + '일차') : '';
      it.html = '오늘 <b class="' + SHIFT[it.code].cls + '">' + pickName(it.code) + '</b> <em>(' + esc(it.pair) + ')</em>';
    });
    return items;
  }

  function renderTodayPick(box, noHighlight) {
    if (!box) return;
    var cyc = getCycle(), cur = cyclePos(todayISO());
    box.innerHTML = flowOptions(cyc).map(function (o) {
      var on = !noHighlight && o.idx === cur;
      return '<button class="tpick' + (on ? ' on' : '') + '" data-idx="' + o.idx + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
        '<span class="tp-dot ' + SHIFT[o.code].cls + '">' + SHIFT[o.code].short + '</span>' +
        '<span class="tp-lbl">' + o.html + '</span>' +
        (o.tag ? '<span class="tp-tag">' + o.tag + '</span>' : '') +
        '</button>';
    }).join('');
  }

  /* 오늘의 주기 위치(idx)를 받아 기준일을 역산한다.
     오늘의 위치 = (오늘-anchor + 조 오프셋) % N 이므로, anchor = 오늘 - (idx - 오프셋). */
  function applyTodayShift(idx) {
    var cyc = getCycle(), N = cyc.length;
    if (!(idx >= 0 && idx < N)) return;
    var back = ((idx - groupOffset(state.group)) % N + N) % N;
    state.anchor = addDays(todayISO(), -back);
    state.setupDone = true;
    save();
    renderTop();
    renderToday();
    renderCal();
    renderLog();
    if (curTab === 'settings') renderSettings();
    renderSetup();
    toast('오늘 ' + pickName(cyc[idx]) + ' · 내일 ' + pickName(cyc[(idx + 1) % N]) + ' 로 맞췄습니다');
  }

  /* ---------------- 첫 방문 · 10초 세팅 ---------------- */
  function renderSetup() {
    var sp = $('setupPresets');
    if (!sp) return;
    syncGroupStyle();
    sp.innerHTML = PRESETS.map(function (x) {
      return '<button class="chip' + (x.id === state.presetId ? ' on' : '') + '" data-spreset="' + x.id + '">' + x.name + '</button>';
    }).join('') +
      '<button class="chip' + (state.presetId === 'custom' ? ' on' : '') + '" data-spreset="custom">커스텀 주기</button>';

    var G = getGroups(), g = '';
    for (var i = 1; i <= G; i++) {
      g += '<button class="chip' + (state.group === i ? ' on' : '') + '" data-sgroup="' + i + '">' + groupName(i) + '</button>';
    }
    $('setupGroups').innerHTML = g;

    /* 내 회사 찾기 */
    renderCompanyBlock('setup');

    /* 아직 고른 적 없으면 오늘 버튼을 미리 켜 두지 않는다 */
    renderTodayPick($('setupPick'), !state.setupDone);
  }

  function openSetup() {
    if (!$('setupWrap')) return;
    renderSetup();
    $('setupWrap').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeSetup() {
    $('setupWrap').classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ---------------- 탭 ---------------- */
  var curTab = 'calendar';   /* v2.2 — 첫 화면은 달력(내 달력) */
  function switchTab(name) {
    curTab = name;
    document.querySelectorAll('.tab').forEach(function (s) {
      s.classList.toggle('is-active', s.id === 'tab-' + name);
    });
    document.querySelectorAll('.tabbtn').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.tab === name);
    });
    window.scrollTo(0, 0);
    renderTab(name);
  }
  function renderTab(name) {
    if (name === 'today') renderToday();
    else if (name === 'calendar') renderCal();
    else if (name === 'log') { renderLog(); renderCalc(); }   /* v2.5.2 — 계산기는 기록 탭 맨 위 */
    else if (name === 'settings') renderSettings();
    else if (name === 'guide') { applyGuideCat(state.guideCat, { persist: false }); renderCalc(); }
  }

  /* ---------------- 가이드 카테고리 칩 (v2.4) ---------------- */
  /* 고른 카테고리만 남기고, 그 카테고리의 첫 아코디언을 펼쳐 바로 보여준다.
     '더 보기(cta)' 블록은 어느 카테고리에서도 항상 남긴다. */
  function applyGuideCat(cat, opts) {
    opts = opts || {};
    if (GCATS.indexOf(cat) < 0) cat = 'all';
    if (opts.persist !== false) { state.guideCat = cat; save(); }

    var chips = $('gcatChips');
    if (chips) {
      Array.prototype.forEach.call(chips.querySelectorAll('[data-gcat]'), function (b) {
        var on = b.getAttribute('data-gcat') === cat;
        b.classList.toggle('on', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }

    var blocks = document.querySelectorAll('#guideLib .gblock');
    var first = null;
    Array.prototype.forEach.call(blocks, function (b) {
      var c = b.getAttribute('data-cat');
      var show = cat === 'all' ? true : (c === cat || c === 'cta');
      b.hidden = !show;
      if (show && c === cat && !first) first = b;
    });

    if (first && cat !== 'all') {
      var d = first.querySelector('details.acc');
      if (d) d.open = true;
      if (opts.scroll) {
        /* 칩 줄이 화면 위쪽에 남도록 그 위치로 — 카테고리를 바꾼 걸 바로 알아보게 */
        var anchor = document.querySelector('.gcat-bar') || first.querySelector('.sec-head');
        if (anchor) {
          var y = anchor.getBoundingClientRect().top + (window.pageYOffset || 0) - 62;
          window.scrollTo(0, Math.max(0, y));
        }
      }
    }
  }
  function openGuideCat(cat) {
    switchTab('guide');   /* switchTab이 맨 위로 올려준다 — 칩과 섹션 제목이 한 화면에 들어온다 */
    applyGuideCat(cat);
  }

  /* ---------------- 탄단지·칼로리 계산기 (v2.5) ---------------- */
  function calcResult(c) {
    var w = Math.min(200, Math.max(30, Number(c.weight) || CALC_DEF.weight));
    var goal = (c.goal === 'cut' || c.goal === 'bulk') ? c.goal : 'keep';
    var kcalKg = CALC_KCALKG[c.sex === 'f' ? 'f' : 'm'][c.act === 'office' ? 'office' : 'shift'];
    var maintain = w * kcalKg;
    var target = maintain + CALC_GOAL[goal];
    var prot = Math.round(w * (CALC_PROT_G[goal] || 1.8));
    var fat = Math.round(w * CALC_FAT_G);
    var carbRaw = (target - prot * 4 - fat * 9) / 4;
    var carb = Math.max(CALC_CARB_FLOOR, Math.round(carbRaw));
    /* 화면 칼로리는 실제 매크로 합계 — 하한선이 걸리면 목표보다 조금 높아진다 */
    var kcal = Math.round((prot * 4 + fat * 9 + carb * 4) / 10) * 10;
    return {
      maintain: Math.round(maintain / 10) * 10,
      target: Math.round(target / 10) * 10,
      kcal: kcal,
      protein: prot,
      fat: fat,
      carb: carb,
      floored: carbRaw < CALC_CARB_FLOOR,
      goal: goal
    };
  }
  function fmt1(v) { return (Math.round((Number(v) || 0) * 10) / 10).toFixed(1); }

  function renderCalc() {
    if (!$('calcCard')) return;
    var c = normalizeCalc(state.calc);
    var sex = $('calcSex'), act = $('calcAct'), goal = $('calcGoal');
    if (sex) Array.prototype.forEach.call(sex.querySelectorAll('[data-csex]'), function (b) {
      var on = b.getAttribute('data-csex') === c.sex;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (act) Array.prototype.forEach.call(act.querySelectorAll('[data-cact]'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-cact') === c.act);
    });
    if (goal) Array.prototype.forEach.call(goal.querySelectorAll('[data-cgoal]'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-cgoal') === c.goal);
    });
    var wi = $('calcWeight');
    if (wi && document.activeElement !== wi) wi.value = c.weight;

    var r = calcResult(c);
    $('calcKcal').textContent = String(r.kcal).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    $('calcP').textContent = r.protein;
    $('calcF').textContent = r.fat;
    $('calcC').textContent = r.carb;

    $('calcLine').innerHTML = '닭가슴살 100g 약 <b>' + fmt1(r.protein / CALC_P_CHICKEN) + '팩</b> + 햇반 210g 약 <b>' +
      fmt1(r.carb / CALC_C_RICE) + '공기</b> 기준';
    $('calcSub').innerHTML = '단백질은 한 끼 ' + Math.round(r.protein / 4) + 'g씩 4끼로 나누고, 지방은 계란·견과·올리브유로 채우면 맞습니다';

    var note = $('calcNote');
    var msg = '';
    if (r.floored) {
      msg = '탄수 하한선 <b>' + CALC_CARB_FLOOR + 'g</b>을 지키느라 목표보다 <b>' + (r.kcal - r.target) +
        'kcal</b> 높게 잡았습니다. 이만큼은 빼지 않는 게 근손실·무기력이 없는 선입니다.';
    } else if (r.goal === 'cut') {
      msg = '유지칼로리 <b>' + r.maintain + 'kcal</b>에서 400kcal만 뺐습니다. 주 0.5kg 넘게 빠지면 단백질은 그대로 두고 탄수를 20~30g 올리세요.';
    } else if (r.goal === 'bulk') {
      msg = '유지칼로리 <b>' + r.maintain + 'kcal</b> +250. 한 달 1~2kg이 근육이 붙는 최대 속도입니다. 더 빨리 늘면 지방입니다.';
    } else {
      msg = '유지칼로리 <b>' + r.maintain + 'kcal</b> 그대로. 2주 평균 체중이 ±1kg 안이면 이 값이 맞습니다.';
    }
    if (note) {
      note.innerHTML = msg;
      note.hidden = !msg;
    }
  }
  function renderAll() {
    renderTop();
    renderTab(curTab);
    if (curTab !== 'today') renderToday();
  }

  /* ---------------- 시트 ---------------- */
  var sheetISO = null, sheetParts = [], sheetTags = [];

  function openSheet(iso) {
    sheetISO = iso;
    var code = myShift(iso);
    var meta = SHIFT[code];
    var d = parseISO(iso);
    $('sheetDate').textContent = (d.getMonth() + 1) + '월 ' + d.getDate() + '일 (' + DOW[d.getDay()] + ')';
    var w = shiftWindow(iso, code);
    $('sheetShift').textContent = code === 'O'
      ? meta.name + ' · ' + groupName(state.group)
      : meta.name + ' ' + w.st + ' ~ ' + (w.cross ? '익일 ' : '') + w.en + ' · ' + groupName(state.group);
    var hol = holOf(iso);
    var hb = $('sheetHol');
    if (hol) { hb.textContent = '공휴일 · ' + hol[1]; hb.hidden = false; }
    else { hb.hidden = true; }

    var c = COACH[code];
    $('sheetCoach').innerHTML =
      '<div class="mini-coach">' +
        '<div class="mc"><b>운동</b><span>' + stripTags(c.workout.lead) + '</span></div>' +
        '<div class="mc"><b>식단</b><span>' + stripTags(c.diet.lead) + '</span></div>' +
        '<div class="mc"><b>카페인</b><span>' + stripTags(c.caffeine.lead) + '</span></div>' +
      '</div>';

    var lg = getLog(iso);
    setCheckBtn($('sheetWorkout'), !!lg.workout);
    setCheckBtn($('sheetClean'), !!lg.clean);
    $('sheetWeight').value = (typeof lg.weight === 'number' && lg.weight > 0) ? lg.weight : '';
    $('sheetRun').value = (typeof lg.run === 'number' && lg.run > 0) ? lg.run : '';
    $('sheetMemo').value = lg.memo || '';
    sheetParts = (lg.parts || []).slice();
    sheetTags = (Array.isArray(lg.tags) ? lg.tags : []).slice();
    $('sheetSched').value = lg.sched || '';
    renderSheetParts();
    renderSheetTags();

    $('sheetWrap').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function stripTags(s) { return String(s).replace(/<[^>]+>/g, ''); }

  function renderSheetParts() {
    $('sheetParts').innerHTML = PARTS.map(function (p) {
      return '<button class="chip' + (sheetParts.indexOf(p) >= 0 ? ' on' : '') + '" data-part="' + p + '">' + p + '</button>';
    }).join('');
  }

  function renderSheetTags() {
    $('sheetTags').innerHTML = DAY_TAGS.map(function (t) {
      return '<button class="chip' + (sheetTags.indexOf(t) >= 0 ? ' on' : '') + '" data-dtag="' + t + '">' + t + '</button>';
    }).join('');
  }

  function commitSheet() {
    if (!sheetISO) return;
    var wRaw = $('sheetWeight').value.trim();
    var w = wRaw === '' ? null : Number(wRaw);
    if (w != null && (!isFinite(w) || w <= 0 || w > 400)) w = null;
    patchLog(sheetISO, {
      weight: w,
      run: parseKm($('sheetRun').value),
      parts: sheetParts.slice(),
      tags: sheetTags.slice(),
      sched: $('sheetSched').value.trim().slice(0, 12),
      memo: $('sheetMemo').value.slice(0, 200)
    });
    renderCal(); renderLog(); renderToday();
  }

  function closeSheet() {
    commitSheet();
    $('sheetWrap').classList.remove('open');
    document.body.style.overflow = '';
    sheetISO = null;
  }

  /* ---------------- 이벤트 ---------------- */
  function showInstallGuide() {
    window.alert('아이폰(사파리): 하단 공유 버튼 → 홈 화면에 추가\n안드로이드(크롬): 우측 상단 ⋮ → 홈 화면에 추가\nPC(크롬·엣지): 주소창 오른쪽 설치 아이콘');
  }

  function bind() {
    /* 탭바 */
    document.querySelector('.tabbar').addEventListener('click', function (e) {
      var b = e.target.closest('.tabbtn');
      if (b) switchTab(b.dataset.tab);
    });

    /* 체크 버튼 (오늘 / 시트) */
    function toggleCheck(btn, iso) {
      var k = btn.dataset.k;
      var lg = getLog(iso);
      var v = !lg[k];
      patchLog(iso, (function () { var o = {}; o[k] = v; return o; })());
      setCheckBtn(btn, v);
      if (iso === todayISO()) syncTodayChecks();
      if (sheetISO) {
        setCheckBtn($('sheetWorkout'), !!getLog(sheetISO).workout);
        setCheckBtn($('sheetClean'), !!getLog(sheetISO).clean);
      }
      toast((k === 'workout' ? '오운완' : '식단 클린') + (v ? ' 체크' : ' 해제'));
      renderCal(); renderLog();
    }
    $('btnWorkout').addEventListener('click', function () { toggleCheck(this, todayISO()); });
    $('btnClean').addEventListener('click', function () { toggleCheck(this, todayISO()); });
    $('sheetWorkout').addEventListener('click', function () { if (sheetISO) toggleCheck(this, sheetISO); });
    $('sheetClean').addEventListener('click', function () { if (sheetISO) toggleCheck(this, sheetISO); });

    /* 달력 상단 오늘 바 — 오운완·식단 원탭 */
    ['tbWorkout', 'tbClean'].forEach(function (id) {
      var b = $(id);
      if (b) b.addEventListener('click', function () { toggleCheck(this, todayISO()); });
    });

    /* 오늘 한 줄 메모 */
    var memo = $('memoInput'), memoTimer = null;
    memo.addEventListener('input', function () {
      clearTimeout(memoTimer);
      var v = memo.value;
      memoTimer = setTimeout(function () { patchLog(todayISO(), { memo: v.slice(0, 80) }); }, 400);
    });
    memo.addEventListener('blur', function () {
      clearTimeout(memoTimer);
      patchLog(todayISO(), { memo: memo.value.slice(0, 80) });
      renderLog();
    });

    /* 오늘 러닝 거리(km) */
    var runI = $('runInput'), runTimer = null;
    function commitRun() {
      clearTimeout(runTimer);
      patchLog(todayISO(), { run: parseKm(runI.value) });
      updateTodaySub();
      renderLog();
      renderCal();
    }
    runI.addEventListener('input', function () {
      clearTimeout(runTimer);
      runTimer = setTimeout(commitRun, 500);
    });
    runI.addEventListener('blur', commitRun);

    /* 오늘 내 근무 원탭 세팅 (설정 탭 + 첫 방문 시트) */
    ['todayPick', 'setupPick'].forEach(function (id) {
      var box = $(id);
      if (!box) return;
      box.addEventListener('click', function (e) {
        var b = e.target.closest('[data-idx]');
        if (b) applyTodayShift(Number(b.dataset.idx));
      });
    });

    /* 첫 방문 세팅 시트 */
    $('setupPresets').addEventListener('click', function (e) {
      var b = e.target.closest('[data-spreset]');
      if (!b) return;
      state.presetId = b.dataset.spreset;
      if (PRESET_TIMES[state.presetId]) state.times = cloneTimes(PRESET_TIMES[state.presetId]);
      normalizeOrder();
      state.group = Math.min(state.group, getGroups());
      save();
      renderSetup();
      renderToday(); renderCal(); renderLog();
    });
    $('setupGroups').addEventListener('click', function (e) {
      var b = e.target.closest('[data-sgroup]');
      if (!b) return;
      state.group = Number(b.dataset.sgroup);
      save();
      renderSetup();
      renderToday(); renderCal(); renderLog();
    });
    $('setupDone').addEventListener('click', function () {
      state.setupDone = true;
      save();
      closeSetup();
      switchTab('calendar');
      toast('설정 완료 — 한 달 근무표부터 확인하세요');
    });

    /* 가이드 탭 → 다른 탭으로 */
    document.querySelectorAll('[data-goto]').forEach(function (b) {
      b.addEventListener('click', function () { switchTab(b.dataset.goto); });
    });

    /* 가이드 카테고리 칩 + 오늘 탭 코칭에서 가이드 바로가기 (v2.4) */
    document.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('[data-gcat]') : null;
      if (!b) return;
      var cat = b.getAttribute('data-gcat');
      if (b.closest('#gcatChips')) {
        if (b.classList.contains('on')) return;
        applyGuideCat(cat, { scroll: true });
      } else {
        openGuideCat(cat);
      }
    });
    $('btnGuideInstall').addEventListener('click', function () { showInstallGuide(); });

    /* 탄단지·칼로리 계산기 (v2.5) — 성별·활동량·목표 칩과 몸무게 입력 */
    document.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('[data-csex],[data-cact],[data-cgoal]') : null;
      if (!b || !b.closest('#calcCard')) return;
      state.calc = normalizeCalc(state.calc);
      if (b.hasAttribute('data-csex')) state.calc.sex = b.getAttribute('data-csex') === 'f' ? 'f' : 'm';
      else if (b.hasAttribute('data-cact')) state.calc.act = b.getAttribute('data-cact') === 'office' ? 'office' : 'shift';
      else state.calc.goal = b.getAttribute('data-cgoal');
      save();
      renderCalc();
    });
    if ($('calcWeight')) {
      $('calcWeight').addEventListener('input', function () {
        var v = Number(this.value);
        state.calc = normalizeCalc(state.calc);
        if (isFinite(v) && v >= 30 && v <= 200) state.calc.weight = Math.round(v * 10) / 10;
        save();
        renderCalc();
      });
      $('calcWeight').addEventListener('change', function () {
        state.calc = normalizeCalc(state.calc);   /* 범위 밖·빈 값은 75kg로 되돌림 */
        save();
        renderCalc();
      });
    }

    /* 달력 */
    /* 달력 보기 전환 — 내 달력 / 전체 조 */
    $('calViewSeg').addEventListener('click', function (e) {
      var b = e.target.closest('[data-calview]');
      if (!b || b.getAttribute('data-calview') === calView) return;
      calView = b.getAttribute('data-calview');
      renderCal();
    });

    $('calPrev').addEventListener('click', function () {
      var d = parseISO(calRef); d.setDate(1); d.setMonth(d.getMonth() - 1);
      calRef = isoOf(d); renderCal();
    });
    $('calNext').addEventListener('click', function () {
      var d = parseISO(calRef); d.setDate(1); d.setMonth(d.getMonth() + 1);
      calRef = isoOf(d); renderCal();
    });
    $('calGrid').addEventListener('click', function (e) {
      var b = e.target.closest('[data-date]');
      if (b) openSheet(b.dataset.date);
    });

    /* 근무표 이미지 저장 (v2.3) */
    if ($('btnCalImage')) $('btnCalImage').addEventListener('click', exportCalendarImage);
    if ($('imgWrap')) {
      $('imgWrap').addEventListener('click', function (e) {
        if (e.target.closest('[data-close]')) closeImageModal();
      });
    }
    if ($('imgClose')) $('imgClose').addEventListener('click', closeImageModal);

    /* 월급날 설정 (v2.3) */
    if ($('paydaySelect')) {
      $('paydaySelect').addEventListener('change', function () {
        var v = this.value;
        state.payday = v === 'none' ? 0 : (v === 'last' ? 'last' : Math.round(Number(v)));
        save();
        renderCal();
        renderSettings();
        if (state.payday === 0) toast('월급날 표시를 꿨습니다');
        else if (state.payday === 'last') toast('월급날 — 매월 말일');
        else toast('월급날 — 매월 ' + state.payday + '일');
      });
    }

    /* 기록 */
    $('btnAddLog').addEventListener('click', function () { openSheet(todayISO()); });
    $('logList').addEventListener('click', function (e) {
      var del = e.target.closest('[data-del]');
      if (del) {
        var k = del.dataset.del;
        if (window.confirm((k.slice(5, 7) * 1) + '/' + (k.slice(8, 10) * 1) + ' 기록을 삭제할까요?')) {
          delete state.logs[k]; save();
          renderLog(); renderCal(); renderToday();
          toast('삭제했습니다');
        }
        return;
      }
      var item = e.target.closest('.log-item');
      if (item) {
        var d = item.querySelector('[data-del]');
        if (d) openSheet(d.dataset.del);
      }
    });

    /* 시트 */
    $('sheetWrap').addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) closeSheet();
    });
    $('sheetSave').addEventListener('click', function () { closeSheet(); toast('저장했습니다'); });
    $('sheetDelete').addEventListener('click', function () {
      if (!sheetISO) return;
      if (!window.confirm('이 날 기록을 전부 삭제할까요?')) return;
      delete state.logs[sheetISO]; save();
      renderToday(); renderCal(); renderLog();
      sheetISO = null; /* 닫힐 때 시트의 옛 값이 다시 저장되지 않게 */
      closeSheet(); toast('삭제했습니다');
    });
    $('sheetParts').addEventListener('click', function (e) {
      var b = e.target.closest('[data-part]');
      if (!b) return;
      var p = b.dataset.part;
      var i = sheetParts.indexOf(p);
      if (i >= 0) sheetParts.splice(i, 1); else sheetParts.push(p);
      renderSheetParts();
    });
    $('sheetTags').addEventListener('click', function (e) {
      var b = e.target.closest('[data-dtag]');
      if (!b) return;
      var tg = b.getAttribute('data-dtag');
      var i = sheetTags.indexOf(tg);
      if (i >= 0) sheetTags.splice(i, 1); else sheetTags.push(tg);
      renderSheetTags();
    });

    /* 오늘 코칭 요약 카드 펼치기/접기 */
    $('coachToggle').addEventListener('click', function () {
      state.coachOpen = !state.coachOpen;
      save();
      applyCoachOpen();
    });

    /* 화면 테마 */
    $('themePick').addEventListener('click', function (e) {
      var b = e.target.closest('[data-theme]');
      if (!b) return;
      var id = b.getAttribute('data-theme');
      if (id === state.theme) return;
      applyTheme(id, true);
      toast(themeMeta(id).name);
    });

    /* 근무 배지 색깔 — 색 칩 원탭 / 기본값 초기화 */
    var bpBox = $('badgePick');
    if (bpBox) bpBox.addEventListener('click', function (e) {
      var b = e.target.closest('[data-bc]');
      if (!b || b.disabled) return;
      var code = b.getAttribute('data-bc');
      var id = b.getAttribute('data-bcid') || '';
      var p = paletteOf(id);
      var next = p ? id : '';
      if (state.badgeColors[code] === next) return;
      state.badgeColors[code] = next;
      save();
      applyBadgeColors();
      setShiftVars(myShift(todayISO()));
      renderBadgePick();
      renderCal();
      renderLog();
      renderToday();
      toast(p ? (SHIFT[code].name + ' 배지 ' + p.name) : (SHIFT[code].name + ' 배지 기본색'));
    });

    /* 조 이름 표기 — 설정 탭과 첫 세팅 공통 */
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-gstyle]');
      if (!b) return;
      var v = b.getAttribute('data-gstyle');
      if (v === state.groupStyle) return;
      state.groupStyle = v;
      save();
      renderAll();
      renderSettings();
      renderSetup();
      toast(v === 'num' ? '1·2·3·4조로 표기합니다' : 'A·B·C·D조로 표기합니다');
    });

    /* 조 순환 순서 */
    $('groupOrderChips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-gorder]');
      if (!b) return;
      state.groupOrder = b.getAttribute('data-gorder');
      save();
      renderAll();
      renderSettings();
      toast('조 순환 순서 ' + state.groupOrder.split('').join(' → '));
    });

    /* 설정: 프리셋 */
    $('presetList').addEventListener('click', function (e) {
      var b = e.target.closest('[data-preset]');
      if (!b) return;
      var id = b.dataset.preset;
      state.presetId = id;
      if (PRESET_TIMES[id]) state.times = cloneTimes(PRESET_TIMES[id]);
      normalizeOrder();
      state.group = Math.min(state.group, getGroups());
      save(); renderAll();
      toast(id === 'custom' ? '커스텀 주기 — 아래에서 입력' : presetName() + ' 적용');
    });

    /* 설정: 조 */
    $('groupChips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-group]');
      if (!b) return;
      state.group = Number(b.dataset.group);
      save(); renderAll();
      toast(state.group + '조로 설정');
    });

    /* 설정: 기준일 */
    $('anchorInput').addEventListener('change', function () {
      var v = this.value;
      if (!v) return;
      state.anchor = v;
      save(); renderAll();
      toast('기준일 ' + v);
    });

    /* 설정: 커스텀 조수 */
    $('customGroupChips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-cgroup]');
      if (!b) return;
      state.customGroups = Number(b.dataset.cgroup);
      state.presetId = 'custom';
      state.group = Math.min(state.group, getGroups());
      save(); renderAll();
    });

    /* 설정: 커스텀 적용 */
    $('btnFillCycle').addEventListener('click', function () {
      $('customInput').value = getCycle().map(function (c) { return SHIFT[c].short; }).join(',');
      $('customErr').hidden = true;
    });
    $('btnApplyCustom').addEventListener('click', function () {
      var raw = $('customInput').value.trim();
      var cyc = parseCycle(raw);
      var err = $('customErr');
      if (!cyc) {
        err.hidden = false;
        err.textContent = '주기 문자열을 읽지 못했습니다. 예: 주,주,휴,휴,야,야,휴,휴';
        return;
      }
      err.hidden = true;
      state.custom = cyc.map(function (c) { return SHIFT[c].short; }).join(',');
      state.presetId = 'custom';
      state.group = Math.min(state.group, getGroups());
      save(); renderAll();
      toast(cyc.length + '일 커스텀 주기 적용');
    });

    /* 설정: 근무 시간 */
    ['D', 'A', 'N'].forEach(function (c) {
      ['s', 'e'].forEach(function (k, idx) {
        $('t' + c + '_' + k).addEventListener('change', function () {
          var t = (state.times[c] || ['07:00', '19:00']).slice();
          t[idx] = this.value || t[idx];
          state.times[c] = t;
          save(); renderToday();
          if (curTab === 'settings') renderSettings();
        });
      });
    });

    /* 설정: 데이터 */
    $('btnExport').addEventListener('click', function () {
      var data = JSON.stringify(state, null, 2);
      var blob = new Blob([data], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'yongko-shift-backup-' + todayISO() + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000);
      toast('백업 파일을 저장했습니다');
    });
    $('btnReset').addEventListener('click', function () {
      if (!window.confirm('모든 근무 설정과 기록을 지웁니다. 계속할까요?')) return;
      try { localStorage.removeItem(LS_KEY); } catch (e) { }
      state = load();
      state.anchor = todayISO();
      save();
      renderAll();
      toast('초기화했습니다');
    });
    $('btnInstallGuide').addEventListener('click', function () {
      showInstallGuide();
    });
    $('btnSetupAgain').addEventListener('click', function () {
      openSetup();
    });

    /* 검색 실행 — 검색 버튼 클릭 · Enter · 한글 조합 완료에서 공통으로 부른다 */
    function coSearch(scope, hideKeyboard) {
      var s = coState[scope];
      if (!s) return;
      var inp = $(scope === 'settings' ? 'coInput' : 'setupCoInput');
      if (inp) s.q = inp.value;
      s.open = true;
      renderCompanyBlock(scope);
      var listEl = $(scope === 'settings' ? 'coList' : 'setupCoList');
      if (listEl && listEl.scrollIntoView) listEl.scrollIntoView({ block: 'nearest' });
      if (hideKeyboard && inp && inp.blur) inp.blur();
    }

    /* 내 회사 찾기 — 검색 · 업종 칩 · 회사 선택 (설정 탭 + 첫 세팅 시트 공통) */
    [['coInput', 'settings'], ['setupCoInput', 'setup']].forEach(function (pair) {
      var inp = $(pair[0]);
      if (!inp) return;
      var scope = pair[1];
      inp.addEventListener('input', function () {
        coState[scope].q = inp.value;
        coState[scope].open = true;
        renderCompanyBlock(scope);
      });
      /* 한글은 조합이 끝난 순간 값을 다시 읽어 필터링한다 (조합 중 글자로 걸러지는 문제 방지) */
      inp.addEventListener('compositionend', function () {
        coState[scope].q = inp.value;
        coState[scope].open = true;
        renderCompanyBlock(scope);
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        if (e.isComposing || e.keyCode === 229) return;   /* 조합 중 Enter는 무시 */
        e.preventDefault();
        coSearch(scope, true);
      });
      inp.addEventListener('focus', function () {
        coState[scope].open = true;
        renderCompanyBlock(scope);
      });
    });
    document.addEventListener('click', function (e) {
      var go = e.target.closest('[data-co-go]');
      if (go) {
        coSearch(go.getAttribute('data-co-go'), true);
        return;
      }
      var ind = e.target.closest('[data-co-ind]');
      if (ind) {
        var sc = ind.getAttribute('data-co-scope');
        coState[sc].ind = ind.getAttribute('data-co-ind');
        coState[sc].q = '';
        coState[sc].open = true;
        renderCompanyBlock(sc);
        return;
      }
      var pick = e.target.closest('[data-co-pick]');
      if (pick) pickCompany(pick.getAttribute('data-co-pick'), pick.getAttribute('data-co-scope'));
    });

    /* iOS 배너 */
    var closeB = $('iosBannerClose');
    if (closeB) closeB.addEventListener('click', function () {
      state.bannerDismissed = true; save();
      $('iosBanner').hidden = true;
    });
  }

  /* ---------------- PWA ---------------- */
  var installEvent = null;
  function setupPWA() {
    var ua = navigator.userAgent || '';
    var standalone = window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    var isIOS = /iPhone|iPad|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOS && !standalone && !state.bannerDismissed) {
      $('iosBanner').hidden = false;
    }

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      installEvent = e;
      $('btnInstallTop').hidden = false;
    });
    $('btnInstallTop').addEventListener('click', function () {
      if (!installEvent) return;
      installEvent.prompt();
      installEvent = null;
      this.hidden = true;
    });

    if ('serviceWorker' in navigator) {
      var ok = location.protocol === 'https:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
      if (ok) {
        window.addEventListener('load', function () {
          var hadController = !!navigator.serviceWorker.controller;
          var reloaded = false;
          /* 구버전 SW → 새 SW로 교체되는 순간 한 번만 새로고침해서 화면을 최신으로 */
          navigator.serviceWorker.addEventListener('controllerchange', function () {
            if (!hadController || reloaded) return;
            reloaded = true;
            location.reload();
          });
          navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
            .then(function (reg) { if (reg && reg.update) return reg.update(); })
            .catch(function () { });
        });
      }
    }
  }

  /* ---------------- 시작 ---------------- */
  function boot() {
    if (!state.anchor) state.anchor = todayISO();
    applyTheme(state.theme, false);   /* 저장된 테마를 첫 페인트 전에 적용 */
    hydrateIcons(document);
    bind();
    renderTop();
    renderToday();
    renderCal();
    renderLog();
    renderSettings();
    renderCalc();
    setupPWA();
    if (!state.setupDone) openSetup();
    /* 1분마다 근무 상태 갱신, 날짜가 바뀌면 전체 렌더 */
    var lastDay = todayISO();
    setInterval(function () {
      var t = todayISO();
      if (t !== lastDay) {
        lastDay = t;
        calRef = t;
        renderAll();
        renderCal(); renderLog(); renderSettings();
      } else if (curTab === 'today') {
        renderToday();
      }
    }, 30000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) renderTab(curTab);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
