/* ===================================================================
   용코교대 v2.0 — 교대근무 + 헬스·식단 코칭 PWA
   순수 JS · localStorage · 단일 폴더 배포용
   v2: 가이드 탭 · 오늘 내 근무 원탭 역산 · 2026~2027 공휴일 · 러닝 기록
   =================================================================== */
(function () {
  'use strict';

  /* ---------------- 상수 ---------------- */
  var LS_KEY = 'kingyongko_shift_v1';
  var PARTS = ['가슴', '등', '어깨', '하체', '팔', '복근', '유산소'];
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];

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

  var COLOR = {
    D: ['#4C8DFF', 'rgba(76,141,255,.15)', 'rgba(76,141,255,.38)', 'rgba(76,141,255,.20)'],
    A: ['#FFA24C', 'rgba(255,162,76,.15)', 'rgba(255,162,76,.38)', 'rgba(255,162,76,.20)'],
    N: ['#B18CFF', 'rgba(177,140,255,.15)', 'rgba(177,140,255,.38)', 'rgba(177,140,255,.20)'],
    O: ['#35D07F', 'rgba(53,208,127,.14)', 'rgba(53,208,127,.36)', 'rgba(53,208,127,.18)']
  };

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
    }
  ];

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
  function pickName(code) { return code === 'O' ? '오프' : SHIFT[code].name; }

  /* ---------------- 상태 ---------------- */
  var DEFAULTS = {
    v: 2,
    presetId: '4-2',
    custom: '주,주,휴,휴,야,야,휴,휴',
    customGroups: 4,
    group: 1,
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
      v: 2,
      presetId: s.presetId || DEFAULTS.presetId,
      custom: s.custom || DEFAULTS.custom,
      customGroups: s.customGroups || DEFAULTS.customGroups,
      group: s.group || 1,
      anchor: s.anchor || todayISO(),
      times: Object.assign({}, DEFAULTS.times, s.times || {}),
      logs: (s.logs && typeof s.logs === 'object') ? s.logs : {},
      bannerDismissed: !!s.bannerDismissed,
      setupDone: s.setupDone === true
    };
    if (!PRESETS.some(function (p) { return p.id === out.presetId; }) && out.presetId !== 'custom') {
      out.presetId = DEFAULTS.presetId;
    }
    return out;
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
    return Math.max(1, Math.min(4, g));
  }
  function presetName() {
    var p = getPreset();
    return p ? p.name : '커스텀 주기';
  }
  function shiftFor(iso, group0) {
    var cyc = getCycle(), N = cyc.length, G = getGroups();
    var off = Math.max(1, Math.round(N / G));
    var d = dayDiff(state.anchor, iso);
    var pos = ((d + group0 * off) % N + N) % N;
    return cyc[pos] || 'O';
  }
  function myShift(iso) { return shiftFor(iso, Math.max(0, state.group - 1)); }
  function cyclePos(iso) {
    var cyc = getCycle(), N = cyc.length, G = getGroups();
    var off = Math.max(1, Math.round(N / G));
    var d = dayDiff(state.anchor, iso);
    return ((d + (state.group - 1) * off) % N + N) % N;
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
    if (!l) l = { workout: false, clean: false, weight: null, run: null, parts: [], memo: '' };
    if (!Array.isArray(l.parts)) l.parts = [];
    return l;
  }
  function patchLog(iso, patch, removeIfEmpty) {
    var cur = Object.assign({}, getLog(iso), patch);
    var hasData = cur.workout || cur.clean ||
      (typeof cur.weight === 'number' && cur.weight > 0) ||
      (typeof cur.run === 'number' && cur.run > 0) ||
      (cur.parts && cur.parts.length) ||
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
  function setShiftVars(code) {
    var c = COLOR[code] || COLOR.O;
    var r = document.documentElement.style;
    r.setProperty('--sc', c[0]);
    r.setProperty('--sc-bg', c[1]);
    r.setProperty('--sc-bd', c[2]);
    r.setProperty('--sc-glow', c[3]);
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
    var cyc = getCycle();
    $('topSub').textContent = presetName() + ' · ' + state.group + '조 · ' + cyc.length + '일 주기';
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
          '<div class="sc-name"><b>' + meta.name + '</b><i>' + state.group + '조 · 주기 ' + (cyclePos(t) + 1) + '/' + cyc.length + '</i></div>' +
          '<div class="sc-time">' + timeTxt + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="sc-status"><span class="pulse"></span><span>' + st.html + '</span></div>' +
      (code === 'O' ? '' : '<div class="sc-bar"><span style="width:' + Math.max(2, Math.min(100, st.pct)).toFixed(1) + '%"></span></div>');

    /* 코칭 칩 */
    $('coachChip').textContent = COACH[code].chip;

    /* 코칭 3카드 */
    var c = COACH[code];
    $('coachCards').innerHTML =
      coachCard(ICON.dumbbell, '오늘 운동', c.workout) +
      coachCard(ICON.bowl, '오늘 식단 타이밍', c.diet) +
      coachCard(ICON.coffee, '카페인 · 수면', c.caffeine);

    /* 체크 상태 */
    var lg = getLog(t);
    setCheckBtn($('btnWorkout'), !!lg.workout);
    setCheckBtn($('btnClean'), !!lg.clean);
    var ri = $('runInput');
    if (document.activeElement !== ri) {
      ri.value = (typeof lg.run === 'number' && lg.run > 0) ? lg.run : '';
    }
    var mi = $('memoInput');
    if (document.activeElement !== mi) mi.value = lg.memo || '';

    renderWeek();
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
    var days = [];
    for (var i = -1; i <= 5; i++) days.push(addDays(todayISO(), i));
    var t = todayISO();

    var html = '<div class="wk-corner"></div>';
    days.forEach(function (ds) {
      var d = parseISO(ds);
      var isHol = !!holOf(ds);
      html += '<div class="wk-dow' + (ds === t ? ' today' : '') + (isHol ? ' hol' : '') + '"><b>' + DOW[d.getDay()] + '</b>' +
        (d.getMonth() + 1) + '/' + d.getDate() + '</div>';
    });

    for (var g = 1; g <= G; g++) {
      var mine = g === state.group;
      html += '<div class="wk-label' + (mine ? ' mine' : '') + '">' + g + '조</div>';
      days.forEach(function (ds) {
        var code = shiftFor(ds, g - 1);
        var m = SHIFT[code];
        html += '<div class="wk-cell' + (mine ? ' mine-row' : '') + (ds === t ? ' today' : '') + '">' +
          '<span class="dotc ' + m.cls + '">' + m.short + '</span></div>';
      });
    }
    $('weekGrid').innerHTML = html;
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
    var cnt = { w: 0, c: 0, d: 0, o: 0, h: 0 };
    for (var dd = 1; dd <= lastDay; dd++) {
      var is2 = y + '-' + pad(m + 1) + '-' + pad(dd);
      var c2 = myShift(is2);
      if (c2 === 'O') cnt.o++; else cnt.d++;
      if (holOf(is2)) cnt.h++;
      var l2 = state.logs[is2];
      if (l2 && l2.workout) cnt.w++;
      if (l2 && l2.clean) cnt.c++;
    }
    $('calHolSub').textContent = cnt.h ? '공휴일 ' + cnt.h + '일' : '';
    $('calStats').innerHTML =
      stat(cnt.w, '일', '오운완', 'y') +
      stat(cnt.c, '일', '식단 클린', 'g') +
      stat(cnt.d, '일', '출근일', 'd') +
      stat(cnt.o, '일', '휴무일', '');
  }

  /* 내 달력 — 한 달 격자 */
  function renderCalMonth(y, m, lastDay) {
    var first = new Date(y, m, 1);
    var startPad = first.getDay();
    var t = todayISO();
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
        (iso === t ? ' has-today' : '') + (hol ? ' hol' : '');
      var dots = '';
      if (lg) {
        if (lg.workout) dots += '<i class="pt y"></i>';
        if (lg.clean) dots += '<i class="pt g"></i>';
        if (typeof lg.weight === 'number' && lg.weight > 0) dots += '<i class="pt w"></i>';
        if (typeof lg.run === 'number' && lg.run > 0) dots += '<i class="pt r"></i>';
      }
      html += '<button class="' + cls + '" data-date="' + iso + '">' +
        '<span class="n">' + day + '</span>' +
        '<span class="bb ' + meta.cls + '">' + meta.short + '</span>' +
        (hol ? '<span class="hn">' + esc(hol[0]) + '</span>' : '') +
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
          (hol0 ? ' hol' : '') + (iso0 === t ? ' today' : '') + '">' +
          '<i>' + DOW[dw] + '</i><b>' + dayNum + '</b></span>';
      }
      html += '</div>';

      /* 조별 행 */
      for (var g = 1; g <= G; g++) {
        var mine = g === state.group;
        html += '<div class="wk-line wk-row' + (mine ? ' mine' : '') + '">' +
          '<span class="wk-rl">' + g + '조</span>';
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
      return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (last ? 3.4 : 2) + '" fill="' + (last ? '#FFD400' : '#1E1E24') + '" stroke="#FFD400" stroke-width="' + (last ? 2 : 1.3) + '"/>';
    }).join('');
    var lastV = vals[vals.length - 1];
    box.innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">' +
      '<defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#FFD400" stop-opacity=".28"/>' +
      '<stop offset="100%" stop-color="#FFD400" stop-opacity="0"/>' +
      '</linearGradient></defs>' +
      '<path d="' + area + '" fill="url(#wg)"/>' +
      '<path d="' + line + '" fill="none" stroke="#FFD400" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      dots +
      '</svg>';
    var first = vals[0];
    $('chartSub').textContent = entries.length + '회 · ' + first + ' → ' + lastV + 'kg';
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

    /* 조 칩 */
    var G = getGroups();
    var chips = '';
    for (var g = 1; g <= G; g++) {
      chips += '<button class="chip' + (state.group === g ? ' on' : '') + '" data-group="' + g + '">' + g + '조</button>';
    }
    $('groupChips').innerHTML = chips;

    /* 오늘 내 근무 — 원탭 세팅 */
    renderTodayPick($('todayPick'), !state.setupDone);
    var tIdx = cyclePos(todayISO());
    var tc = getCycle()[tIdx] || 'O';
    $('todayPickNote').innerHTML =
      '지금 설정 — 오늘은 <b>' + (tIdx + 1) + '일차 ' + pickName(tc) + '</b><br>' +
      '<span style="color:#5F5F69">기준일 ' + state.anchor + ' = ' + state.group + '조 주기의 1일째</span>';

    $('anchorInput').value = state.anchor;

    /* 커스텀 조 수 */
    var cg = '';
    [2, 3, 4].forEach(function (n) {
      cg += '<button class="chip' + (state.customGroups === n ? ' on' : '') + '" data-cgroup="' + n + '">' + n + '조</button>';
    });
    $('customGroupChips').innerHTML = cg;

    if (document.activeElement !== $('customInput')) $('customInput').value = state.custom;

    /* 주기 미리보기 */
    var cyc = getCycle();
    var prev = cyc.map(function (c) {
      var m = SHIFT[c];
      return '<span class="dotc ' + m.cls + '" style="width:24px;height:24px;font-size:10px">' + m.short + '</span>';
    }).join('');
    $('cyclePreview').innerHTML =
      '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:7px">' + prev + '</div>' +
      presetName() + ' · ' + cyc.length + '일 주기 · 지금 <b style="color:#FFD400">' + state.group + '조</b> · 조마다 ' +
      Math.max(1, Math.round(cyc.length / getGroups())) + '일씩 밀림<br>' +
      '<span style="color:#5F5F69">기준일 ' + state.anchor + ' = ' + state.group + '조의 주기 1일째</span>';

    /* 시간 */
    ['D', 'A', 'N'].forEach(function (c) {
      var t = state.times[c] || ['00:00', '00:00'];
      $('t' + c + '_s').value = t[0];
      $('t' + c + '_e').value = t[1];
    });

    $('customErr').hidden = true;
  }

  /* ---------------- 오늘 내 근무 원탭 세팅 ---------------- */
  function renderTodayPick(box, noHighlight) {
    if (!box) return;
    var cyc = getCycle(), t = todayISO(), cur = cyclePos(t);
    box.innerHTML = cyc.map(function (code, i) {
      var m = SHIFT[code];
      var on = !noHighlight && i === cur;
      return '<button class="tpick' + (on ? ' on' : '') + '" data-idx="' + i + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
        '<span class="tp-n">' + (i + 1) + '일차</span>' +
        '<span class="tp-s ' + m.cls + '">' + pickName(code) + '</span>' +
        '</button>';
    }).join('');
  }

  /* 오늘의 주기 위치(idx)를 받아 기준일을 역산한다.
     shiftFor()는 ((오늘-anchor)+(조-1)*off) % N = idx 가 되도록 anchor를 잡으면 된다. */
  function applyTodayShift(idx) {
    var cyc = getCycle(), N = cyc.length, G = getGroups();
    if (!(idx >= 0 && idx < N)) return;
    var off = Math.max(1, Math.round(N / G));
    var back = ((idx - (state.group - 1) * off) % N + N) % N;
    state.anchor = addDays(todayISO(), -back);
    state.setupDone = true;
    save();
    renderTop();
    renderToday();
    renderCal();
    renderLog();
    if (curTab === 'settings') renderSettings();
    renderSetup();
    toast('오늘 내 근무 = ' + (idx + 1) + '일차 ' + pickName(cyc[idx]));
  }

  /* ---------------- 첫 방문 · 10초 세팅 ---------------- */
  function renderSetup() {
    var sp = $('setupPresets');
    if (!sp) return;
    sp.innerHTML = PRESETS.map(function (x) {
      return '<button class="chip' + (x.id === state.presetId ? ' on' : '') + '" data-spreset="' + x.id + '">' + x.name + '</button>';
    }).join('') +
      '<button class="chip' + (state.presetId === 'custom' ? ' on' : '') + '" data-spreset="custom">커스텀 주기</button>';

    var G = getGroups(), g = '';
    for (var i = 1; i <= G; i++) {
      g += '<button class="chip' + (state.group === i ? ' on' : '') + '" data-sgroup="' + i + '">' + i + '조</button>';
    }
    $('setupGroups').innerHTML = g;

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
  var curTab = 'today';
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
    else if (name === 'log') renderLog();
    else if (name === 'settings') renderSettings();
  }
  function renderAll() {
    renderTop();
    renderTab(curTab);
    if (curTab !== 'today') renderToday();
  }

  /* ---------------- 시트 ---------------- */
  var sheetISO = null, sheetParts = [];

  function openSheet(iso) {
    sheetISO = iso;
    var code = myShift(iso);
    var meta = SHIFT[code];
    var d = parseISO(iso);
    $('sheetDate').textContent = (d.getMonth() + 1) + '월 ' + d.getDate() + '일 (' + DOW[d.getDay()] + ')';
    var w = shiftWindow(iso, code);
    $('sheetShift').textContent = code === 'O'
      ? meta.name + ' · ' + state.group + '조'
      : meta.name + ' ' + w.st + ' ~ ' + (w.cross ? '익일 ' : '') + w.en + ' · ' + state.group + '조';
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
    renderSheetParts();

    $('sheetWrap').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function stripTags(s) { return String(s).replace(/<[^>]+>/g, ''); }

  function renderSheetParts() {
    $('sheetParts').innerHTML = PARTS.map(function (p) {
      return '<button class="chip' + (sheetParts.indexOf(p) >= 0 ? ' on' : '') + '" data-part="' + p + '">' + p + '</button>';
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
      if (iso === todayISO()) {
        setCheckBtn($('btnWorkout'), !!getLog(iso).workout);
        setCheckBtn($('btnClean'), !!getLog(iso).clean);
      }
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
      switchTab('today');
      toast('설정 완료 — 오늘 코칭을 확인하세요');
    });

    /* 가이드 탭 → 다른 탭으로 */
    document.querySelectorAll('[data-goto]').forEach(function (b) {
      b.addEventListener('click', function () { switchTab(b.dataset.goto); });
    });
    $('btnGuideInstall').addEventListener('click', function () { showInstallGuide(); });

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

    /* 설정: 프리셋 */
    $('presetList').addEventListener('click', function (e) {
      var b = e.target.closest('[data-preset]');
      if (!b) return;
      var id = b.dataset.preset;
      state.presetId = id;
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
          navigator.serviceWorker.register('sw.js').catch(function () { });
        });
      }
    }
  }

  /* ---------------- 시작 ---------------- */
  function boot() {
    if (!state.anchor) state.anchor = todayISO();
    hydrateIcons(document);
    bind();
    renderTop();
    renderToday();
    renderCal();
    renderLog();
    renderSettings();
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
