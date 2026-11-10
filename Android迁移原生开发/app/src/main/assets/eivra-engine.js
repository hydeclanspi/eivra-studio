(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // <define:import.meta.env>
  var define_import_meta_env_default = {};

  // shims.js
  var values = /* @__PURE__ */ new Map();
  var listeners = /* @__PURE__ */ new Map();
  function nativeSetStorageJSON(text6) {
    values.clear();
    const incoming = JSON.parse(text6 || "{}");
    Object.entries(incoming).forEach(([k, v]) => values.set(k, String(v)));
  }
  function nativeGetStorageJSON() {
    return JSON.stringify(Object.fromEntries(values));
  }
  var nativeStore = {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
  var nativeWindow = {
    get localStorage() {
      return nativeStore;
    },
    get sessionStorage() {
      return nativeStore;
    },
    location: { pathname: "/native", search: "", hash: "", href: "native://eivra" },
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, /* @__PURE__ */ new Set());
      listeners.get(type).add(callback);
    },
    removeEventListener(type, callback) {
      listeners.get(type)?.delete(callback);
    },
    dispatchEvent(event) {
      listeners.get(event.type)?.forEach((fn) => fn(event));
      return true;
    },
    matchMedia() {
      return { matches: false, addEventListener() {
      }, removeEventListener() {
      } };
    }
  };
  var NativeCustomEvent = class {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  };
  function installEngineGlobals() {
    globalThis.window = nativeWindow;
    globalThis.localStorage = nativeStore;
    globalThis.sessionStorage = nativeStore;
    globalThis.CustomEvent = NativeCustomEvent;
    Object.defineProperty(globalThis, "navigator", { value: { onLine: true }, configurable: true, writable: true });
    globalThis.document = { hidden: false, visibilityState: "visible", addEventListener() {
    }, removeEventListener() {
    } };
    globalThis.fetch = async () => {
      throw new Error("Network is disabled in the native offline engine");
    };
  }

  // platform-init.js
  installEngineGlobals();
  nativeSetStorageJSON(JSON.stringify({
    "eivra.full_session_latch.v1": "1",
    "eivra.genesis_applied.v1": "1",
    "eivra.git_sync_state.v1": JSON.stringify({ enabled: false })
  }));

  // source/src/lib/demoData.js
  var TEAMS = [
    // ── EPL 20 ──
    { id: "mancity", name: "曼城", abbr: "mci", strength: 0.86 },
    { id: "liverpool", name: "利物浦", abbr: "liv", strength: 0.8 },
    { id: "arsenal", name: "阿森纳", abbr: "ars", strength: 0.78 },
    { id: "tottenham", name: "热刺", abbr: "tot", strength: 0.68 },
    { id: "astonvilla", name: "维拉", abbr: "avl", strength: 0.66 },
    { id: "newcastle", name: "纽卡斯尔", abbr: "new", strength: 0.66 },
    { id: "chelsea", name: "切尔西", abbr: "che", strength: 0.64 },
    { id: "manutd", name: "曼联", abbr: "mun", strength: 0.62 },
    { id: "westham", name: "西汉姆", abbr: "whu", strength: 0.56 },
    { id: "brighton", name: "布莱顿", abbr: "bha", strength: 0.55 },
    { id: "crystalpalace", name: "水晶宫", abbr: "cry", strength: 0.5 },
    { id: "brentford", name: "布伦特福德", abbr: "bre", strength: 0.5 },
    { id: "fulham", name: "富勒姆", abbr: "ful", strength: 0.48 },
    { id: "wolves", name: "狼队", abbr: "wol", strength: 0.47 },
    { id: "bournemouth", name: "伯恩茅斯", abbr: "bou", strength: 0.45 },
    { id: "everton", name: "埃弗顿", abbr: "eve", strength: 0.43 },
    { id: "nottingham", name: "诺丁汉森林", abbr: "nfo", strength: 0.41 },
    { id: "burnley", name: "伯恩利", abbr: "bur", strength: 0.34 },
    { id: "sheffield", name: "谢菲尔德联", abbr: "shu", strength: 0.32 },
    { id: "luton", name: "卢顿", abbr: "lut", strength: 0.3 },
    // ── EFL Championship promotion candidates (used in cup ties) ──
    { id: "leeds", name: "利兹联", abbr: "lee", strength: 0.42 },
    // ── European elites ──
    { id: "realmadrid", name: "皇马", abbr: "rma", strength: 0.84 },
    { id: "bayern", name: "拜仁", abbr: "bay", strength: 0.82 },
    { id: "barcelona", name: "巴萨", abbr: "bar", strength: 0.76 },
    { id: "psg", name: "巴黎圣日耳曼", abbr: "psg", strength: 0.76 },
    { id: "inter", name: "国际米兰", abbr: "int", strength: 0.72 },
    { id: "atletico", name: "马竞", abbr: "atm", strength: 0.7 },
    { id: "dortmund", name: "多特蒙德", abbr: "bvb", strength: 0.66 },
    { id: "juventus", name: "尤文图斯", abbr: "juv", strength: 0.66 },
    { id: "milan", name: "AC米兰", abbr: "acm", strength: 0.64 },
    { id: "leverkusen", name: "勒沃库森", abbr: "b04", strength: 0.62 }
  ];
  var MODES = ["常规", "常规-稳", "常规-杠杆", "半彩票半保险", "保险产品", "赌一把"];
  var TYS_LEVELS = ["S", "M", "L", "H"];
  var RESULT_ENTRIES = {
    win: { text: "主胜", short: "W" },
    draw: { text: "平局", short: "D" },
    lose: { text: "主负", short: "L" }
  };
  var SEED = 2510;
  var createRng = (seed) => {
    let t = seed >>> 0;
    return () => {
      t = t + 1831565813 >>> 0;
      let r = Math.imul(t ^ t >>> 15, t | 1);
      r ^= r + Math.imul(r ^ r >>> 7, r | 61);
      return ((r ^ r >>> 14) >>> 0) / 4294967296;
    };
  };
  var rand = createRng(SEED);
  var randRange = (min, max) => min + rand() * (max - min);
  var randChoice = (arr) => arr[Math.floor(rand() * arr.length)];
  var randChoiceWeighted = (arr, weights) => {
    const sum = weights.reduce((a, b) => a + b, 0);
    let r = rand() * sum;
    for (let i = 0; i < arr.length; i++) {
      r -= weights[i];
      if (r <= 0) return arr[i];
    }
    return arr[arr.length - 1];
  };
  var round2 = (v) => Math.round(v * 100) / 100;
  var round1 = (v) => Math.round(v * 10) / 10;
  var roundOdds = (v) => Math.round(v * 100) / 100;
  var matchResultProbabilities = (homeStrength, awayStrength) => {
    const homeAdj = homeStrength + 0.03;
    const total = homeAdj + awayStrength;
    const winRaw = homeAdj / total;
    const loseRaw = awayStrength / total;
    const closeness = 1 - Math.abs(homeAdj - awayStrength);
    const drawProb = 0.14 + closeness * 0.16;
    const winProb = winRaw * (1 - drawProb);
    const loseProb = loseRaw * (1 - drawProb);
    return { win: winProb, draw: drawProb, lose: loseProb };
  };
  var oddsForProbability = (p, vig = 1.08) => {
    if (p <= 1e-3) return 999;
    return roundOdds(vig / p);
  };
  var pickTeamPair = (forbid = []) => {
    let home;
    let away;
    let guard = 0;
    while (guard++ < 60) {
      home = randChoice(TEAMS);
      away = randChoice(TEAMS);
      if (home.id !== away.id && !forbid.includes(home.id) && !forbid.includes(away.id)) {
        return { home, away };
      }
    }
    return { home: TEAMS[0], away: TEAMS[1] };
  };
  var buildMatch = ({ home, away, mode, dateIso, idSuffix, parlaySize }) => {
    const probs = matchResultProbabilities(home.strength, away.strength);
    const oddsWin = oddsForProbability(probs.win);
    const oddsDraw = oddsForProbability(probs.draw);
    const oddsLose = oddsForProbability(probs.lose);
    const ranked = [
      { key: "win", odds: oddsWin, p: probs.win },
      { key: "draw", odds: oddsDraw, p: probs.draw },
      { key: "lose", odds: oddsLose, p: probs.lose }
    ].sort((a, b) => b.p - a.p);
    const pickedSlot = randChoiceWeighted([ranked[0], ranked[1], ranked[2]], [0.7, 0.22, 0.08]);
    const entry = RESULT_ENTRIES[pickedSlot.key];
    const odds = pickedSlot.odds;
    const implied = Math.min(0.92, Math.max(0.18, 1 / odds * 1.08));
    const conf = round2(Math.min(0.88, Math.max(0.42, implied + randRange(0.02, 0.22))));
    const sizeBase = parlaySize === 1 ? 0.54 : parlaySize === 2 ? 0.56 : parlaySize === 3 ? 0.58 : parlaySize === 4 ? 0.59 : 0.6;
    const confLift = (conf - 0.5) * 0.28;
    const hitProb = Math.min(0.84, Math.max(0.34, sizeBase + confLift + randRange(-0.04, 0.04)));
    const isCorrect = rand() < hitProb;
    const realisedResult = isCorrect ? pickedSlot.key : pickedSlot.key === "win" ? rand() < 0.5 ? "draw" : "lose" : pickedSlot.key === "lose" ? rand() < 0.5 ? "draw" : "win" : rand() < 0.5 ? "win" : "lose";
    const matchRating = isCorrect ? round2(Math.min(0.78, conf * 0.85 + randRange(0.05, 0.22))) : round2(Math.max(0.08, conf * 0.35 - randRange(0.04, 0.2)));
    const matchRep = rand() < 0.18 ? round1(randRange(0.2, 1.6)) : 0;
    return {
      id: `demo_match_${idSuffix}`,
      home_team: home.name,
      away_team: away.name,
      entries: [{ name: entry.text, odds }],
      entry_text: entry.text,
      odds,
      conf,
      mode,
      tys_home: randChoiceWeighted(TYS_LEVELS, [0.22, 0.42, 0.26, 0.1]),
      tys_away: randChoiceWeighted(TYS_LEVELS, [0.22, 0.42, 0.26, 0.1]),
      fid: randChoice([0, 0.25, 0.4, 0.5, 0.6, 0.75]),
      fse_home: round2(randRange(0.35, 0.85)),
      fse_away: round2(randRange(0.35, 0.85)),
      fse_match: round2(randRange(0.4, 0.8)),
      note: "",
      results: synthesiseScore(realisedResult, home.strength, away.strength),
      is_correct: isCorrect,
      match_rating: matchRating,
      match_rep: matchRep || null,
      post_note: ""
    };
  };
  var synthesiseScore = (trueResult, homeStrength, awayStrength) => {
    const expectedHome = 0.6 + homeStrength * 1.4;
    const expectedAway = 0.4 + awayStrength * 1.4;
    const homeGoals = Math.max(0, Math.round(expectedHome + randRange(-0.6, 0.6)));
    const awayGoals = Math.max(0, Math.round(expectedAway + randRange(-0.6, 0.6)));
    if (trueResult === "win" && homeGoals <= awayGoals) return `${awayGoals + 1}-${awayGoals}`;
    if (trueResult === "lose" && homeGoals >= awayGoals) return `${homeGoals}-${homeGoals + 1}`;
    if (trueResult === "draw" && homeGoals !== awayGoals) return `${homeGoals}-${homeGoals}`;
    return `${homeGoals}-${awayGoals}`;
  };
  var START_TS = (/* @__PURE__ */ new Date("2025-09-01T12:00:00.000Z")).getTime();
  var END_TS = (/* @__PURE__ */ new Date("2025-12-31T20:00:00.000Z")).getTime();
  var pickParlaySize = () => randChoiceWeighted([1, 2, 3, 4, 5], [0.34, 0.3, 0.2, 0.1, 0.06]);
  var pickMode = () => randChoiceWeighted(MODES, [0.32, 0.18, 0.18, 0.12, 0.12, 0.08]);
  var buildInvestment = (index, dateIso) => {
    const parlaySize = pickParlaySize();
    const mode = pickMode();
    const usedTeams = [];
    const matches = [];
    for (let leg = 0; leg < parlaySize; leg++) {
      const { home, away } = pickTeamPair(usedTeams);
      usedTeams.push(home.id, away.id);
      matches.push(buildMatch({
        home,
        away,
        mode,
        dateIso,
        idSuffix: `${index}_${leg + 1}`,
        parlaySize
      }));
    }
    const combinedOdds = roundOdds(matches.reduce((acc, m) => acc * m.odds, 1));
    const isWin = matches.every((m) => m.is_correct);
    let inputs;
    if (parlaySize === 1) {
      inputs = Math.round(randRange(25, 115));
    } else if (parlaySize === 2) {
      inputs = Math.round(randRange(20, 80));
    } else if (parlaySize === 3) {
      inputs = Math.round(randRange(20, 60));
    } else if (parlaySize === 4) {
      inputs = Math.round(randRange(15, 40));
    } else {
      inputs = Math.round(randRange(10, 25));
    }
    inputs = Math.max(1, Math.min(inputs, Math.floor(650 / combinedOdds)));
    const expectedRating = round2(
      matches.reduce((acc, m) => acc + m.conf, 0) / matches.length * 0.85
    );
    const actualRating = round2(
      matches.reduce((acc, m) => acc + m.match_rating, 0) / matches.length
    );
    const revenues = isWin ? round2(inputs * combinedOdds) : 0;
    const profit = round2(revenues - inputs);
    return {
      id: `demo_inv_${index}`,
      created_at: dateIso,
      parlay_size: parlaySize,
      inputs,
      suggested_amount: inputs,
      expected_rating: expectedRating,
      combined_odds: combinedOdds,
      status: isWin ? "win" : "lose",
      revenues,
      profit,
      actual_rating: actualRating,
      rep: matches.find((m) => m.match_rep)?.match_rep ?? null,
      remarks: "",
      matches
    };
  };
  var buildShowcaseSamples = () => {
    const sampleA = {
      id: "demo_inv_showcase_a",
      created_at: "2025-11-04T19:30:00.000Z",
      parlay_size: 1,
      inputs: 35,
      suggested_amount: 35,
      expected_rating: 0.62,
      combined_odds: 5.2,
      status: "win",
      revenues: 182,
      profit: 147,
      actual_rating: 0.72,
      rep: null,
      remarks: "High Conf-Surplus signal: model conviction far above market implied",
      matches: [{
        id: "demo_match_showcase_a_1",
        home_team: "维拉",
        away_team: "曼城",
        entries: [{ name: "主胜", odds: 5.2 }],
        entry_text: "主胜",
        odds: 5.2,
        conf: 0.62,
        mode: "常规-杠杆",
        tys_home: "L",
        tys_away: "M",
        fid: 0.6,
        fse_home: 0.78,
        fse_away: 0.55,
        fse_match: 0.66,
        note: "",
        results: "2-1",
        is_correct: true,
        match_rating: 0.72,
        match_rep: null,
        post_note: ""
      }]
    };
    const sampleB = {
      id: "demo_inv_showcase_b",
      created_at: "2025-11-18T20:00:00.000Z",
      parlay_size: 3,
      inputs: 45,
      suggested_amount: 45,
      expected_rating: 0.58,
      combined_odds: 6.74,
      status: "lose",
      revenues: 0,
      profit: -45,
      actual_rating: 0.41,
      rep: 1.4,
      remarks: "Anchor leg failed — fragility heatmap flagged this dependency",
      matches: [
        {
          id: "demo_match_showcase_b_1",
          home_team: "曼城",
          away_team: "布伦特福德",
          entries: [{ name: "主胜", odds: 1.55 }],
          entry_text: "主胜",
          odds: 1.55,
          conf: 0.78,
          mode: "常规",
          tys_home: "H",
          tys_away: "S",
          fid: 0.5,
          fse_home: 0.72,
          fse_away: 0.48,
          fse_match: 0.59,
          note: "",
          results: "3-0",
          is_correct: true,
          match_rating: 0.78,
          match_rep: null,
          post_note: ""
        },
        {
          id: "demo_match_showcase_b_2",
          home_team: "阿森纳",
          away_team: "富勒姆",
          entries: [{ name: "主胜", odds: 1.85 }],
          entry_text: "主胜",
          odds: 1.85,
          conf: 0.7,
          mode: "常规",
          tys_home: "H",
          tys_away: "M",
          fid: 0.4,
          fse_home: 0.66,
          fse_away: 0.54,
          fse_match: 0.6,
          note: "",
          results: "2-1",
          is_correct: true,
          match_rating: 0.66,
          match_rep: null,
          post_note: ""
        },
        {
          id: "demo_match_showcase_b_3",
          home_team: "热刺",
          away_team: "切尔西",
          entries: [{ name: "主胜", odds: 2.35 }],
          entry_text: "主胜",
          odds: 2.35,
          conf: 0.58,
          mode: "常规",
          tys_home: "M",
          tys_away: "M",
          fid: 0.6,
          fse_home: 0.66,
          fse_away: 0.62,
          fse_match: 0.64,
          note: "",
          results: "1-2",
          is_correct: false,
          match_rating: 0.18,
          match_rep: 1.4,
          post_note: "38分钟红牌——比赛结果被随机事件扭曲"
        }
      ]
    };
    const sampleC = {
      id: "demo_inv_showcase_c",
      created_at: "2025-12-09T19:15:00.000Z",
      parlay_size: 4,
      inputs: 12,
      suggested_amount: 12,
      expected_rating: 0.55,
      combined_odds: 15.86,
      status: "win",
      revenues: 190.32,
      profit: 178.32,
      actual_rating: 0.64,
      rep: null,
      remarks: "Fault-tolerant coverage survived — covering layer paid off",
      matches: [
        {
          id: "demo_match_showcase_c_1",
          home_team: "利物浦",
          away_team: "诺丁汉森林",
          entries: [{ name: "主胜", odds: 1.55 }],
          entry_text: "主胜",
          odds: 1.55,
          conf: 0.74,
          mode: "半彩票半保险",
          tys_home: "H",
          tys_away: "S",
          fid: 0.5,
          fse_home: 0.64,
          fse_away: 0.52,
          fse_match: 0.58,
          note: "",
          results: "2-0",
          is_correct: true,
          match_rating: 0.72,
          match_rep: null,
          post_note: ""
        },
        {
          id: "demo_match_showcase_c_2",
          home_team: "拜仁",
          away_team: "勒沃库森",
          entries: [{ name: "主胜", odds: 2.1 }],
          entry_text: "主胜",
          odds: 2.1,
          conf: 0.6,
          mode: "半彩票半保险",
          tys_home: "L",
          tys_away: "M",
          fid: 0.4,
          fse_home: 0.6,
          fse_away: 0.5,
          fse_match: 0.55,
          note: "",
          results: "3-1",
          is_correct: true,
          match_rating: 0.66,
          match_rep: null,
          post_note: ""
        },
        {
          id: "demo_match_showcase_c_3",
          home_team: "国际米兰",
          away_team: "尤文图斯",
          entries: [{ name: "主胜", odds: 2.4 }],
          entry_text: "主胜",
          odds: 2.4,
          conf: 0.58,
          mode: "半彩票半保险",
          tys_home: "M",
          tys_away: "M",
          fid: 0.5,
          fse_home: 0.58,
          fse_away: 0.52,
          fse_match: 0.55,
          note: "",
          results: "2-1",
          is_correct: true,
          match_rating: 0.62,
          match_rep: null,
          post_note: ""
        },
        {
          id: "demo_match_showcase_c_4",
          home_team: "皇马",
          away_team: "巴萨",
          entries: [{ name: "主胜", odds: 2.03 }],
          entry_text: "主胜",
          odds: 2.03,
          conf: 0.58,
          mode: "半彩票半保险",
          tys_home: "H",
          tys_away: "H",
          fid: 0.6,
          fse_home: 0.72,
          fse_away: 0.7,
          fse_match: 0.71,
          note: "",
          results: "3-2",
          is_correct: true,
          match_rating: 0.7,
          match_rep: null,
          post_note: ""
        }
      ]
    };
    return [sampleA, sampleB, sampleC];
  };
  var MARQUEE_FIXTURES = {
    arsenalLiverpool: {
      home: "阿森纳",
      away: "利物浦",
      entry: "主胜",
      odds: 2.45,
      conf: 0.58,
      mode: "常规",
      tysHome: "M",
      tysAway: "H",
      fid: 0.5,
      fseHome: 0.64,
      fseAway: 0.68,
      note: "利物浦连续三年在主队主场不胜"
    },
    mancityChelsea: {
      home: "曼城",
      away: "切尔西",
      entry: "主胜",
      odds: 1.85,
      conf: 0.68,
      mode: "常规-杠杆",
      tysHome: "H",
      tysAway: "M",
      fid: 0.6,
      fseHome: 0.74,
      fseAway: 0.62,
      note: "伊蒂哈德主场强度差距明显"
    },
    barcaReal: {
      home: "巴萨",
      away: "皇马",
      entry: "主胜",
      odds: 2.8,
      conf: 0.52,
      mode: "半彩票半保险",
      tysHome: "L",
      tysAway: "H",
      fid: 0.5,
      fseHome: 0.66,
      fseAway: 0.72,
      note: "国家德比 · 历史相互克制"
    },
    bayernPsg: {
      home: "拜仁",
      away: "巴黎圣日耳曼",
      entry: "主胜",
      odds: 2.2,
      conf: 0.62,
      mode: "常规",
      tysHome: "H",
      tysAway: "L",
      fid: 0.5,
      fseHome: 0.7,
      fseAway: 0.6,
      note: "欧冠淘汰赛 · 安联球场主场加成"
    },
    // Additional pending-only fixtures (next gameweek extras)
    milanInter: {
      home: "AC米兰",
      away: "国际米兰",
      entry: "win",
      odds: 2.9,
      conf: 0.48,
      mode: "半彩票半保险",
      tysHome: "M",
      tysAway: "H",
      fid: 0.5,
      fseHome: 0.62,
      fseAway: 0.68,
      note: "米兰德比 · 经典对抗 · 平局倾向较高"
    },
    manutdEverton: {
      home: "曼联",
      away: "埃弗顿",
      entry: "主胜",
      odds: 1.65,
      conf: 0.7,
      mode: "常规-稳",
      tysHome: "H",
      tysAway: "S",
      fid: 0.6,
      fseHome: 0.6,
      fseAway: 0.46,
      note: "老特拉福德主场 · 升降级压力下的稳态投注",
      // Still part of the pending 2-leg English bundle on the Settle page,
      // but hidden from the Portfolio candidate pool (demo polish).
      excludeFromPortfolio: true
    },
    leedsNottingham: {
      home: "利兹联",
      away: "诺丁汉森林",
      entry: "主胜",
      odds: 2.05,
      conf: 0.58,
      mode: "常规",
      tysHome: "M",
      tysAway: "M",
      fid: 0.4,
      fseHome: 0.54,
      fseAway: 0.52,
      note: "埃兰路主场 · 双方近期状态相近 · 信息深度偏低"
    },
    dortmundLeverkusen: {
      home: "多特蒙德",
      away: "勒沃库森",
      entry: "-1 draw",
      odds: 2.35,
      conf: 0.55,
      mode: "常规-杠杆",
      tysHome: "M",
      tysAway: "M",
      fid: 0.5,
      fseHome: 0.64,
      fseAway: 0.62,
      note: "德甲焦点 · 威斯特法伦主场 · 进攻对攻倾向"
    }
  };
  var makeMarqueeMatch = (idSuffix, fields, outcome) => {
    return {
      id: `demo_inv_marquee_${idSuffix}`,
      home_team: fields.home,
      away_team: fields.away,
      entries: [{ name: fields.entry, odds: fields.odds }],
      entry_text: fields.entry,
      odds: fields.odds,
      conf: fields.conf,
      mode: fields.mode,
      tys_home: fields.tysHome,
      tys_away: fields.tysAway,
      fid: fields.fid,
      fse_home: fields.fseHome,
      fse_away: fields.fseAway,
      fse_match: round2(Math.sqrt(fields.fseHome * fields.fseAway)),
      note: fields.note || "",
      exclude_from_portfolio: fields.excludeFromPortfolio === true,
      results: outcome.results,
      is_correct: outcome.isCorrect,
      match_rating: outcome.matchRating,
      match_rep: outcome.matchRep ?? null,
      post_note: outcome.postNote || ""
    };
  };
  var buildMarqueeSettled = () => {
    const dateIso = "2025-12-30T19:00:00.000Z";
    const arsenalLiverpoolOutcome = {
      results: "2-1",
      isCorrect: true,
      matchRating: 0.66,
      postNote: "维尔茨意外红牌"
    };
    const mancityChelseaOutcome = {
      results: "3-1",
      isCorrect: true,
      matchRating: 0.72,
      postNote: "哈兰德梅开二度"
    };
    const barcaRealOutcome = {
      results: "1-2",
      isCorrect: false,
      matchRating: 0.22,
      matchRep: 1.4,
      postNote: "维尼修斯 89 分钟绝杀 · 模型置信度 0.52 显然偏低"
    };
    const bayernPsgOutcome = {
      results: "2-0",
      isCorrect: true,
      matchRating: 0.7,
      postNote: "凯恩 + 穆夏拉锁定胜局"
    };
    const fourLeg = {
      id: "demo_inv_marquee_4leg",
      created_at: dateIso,
      parlay_size: 4,
      inputs: 45,
      suggested_amount: 45,
      expected_rating: 0.6,
      combined_odds: roundOdds(2.45 * 1.85 * 2.8 * 2.2),
      status: "lose",
      revenues: 0,
      profit: -45,
      actual_rating: round2((0.66 + 0.72 + 0.22 + 0.7) / 4),
      rep: 1.4,
      remarks: "四中三 · 巴萨翻车导致全军覆没 · 锚定失败典型案例",
      matches: [
        makeMarqueeMatch("4leg_m1", MARQUEE_FIXTURES.arsenalLiverpool, arsenalLiverpoolOutcome),
        makeMarqueeMatch("4leg_m2", MARQUEE_FIXTURES.mancityChelsea, mancityChelseaOutcome),
        makeMarqueeMatch("4leg_m3", MARQUEE_FIXTURES.barcaReal, barcaRealOutcome),
        makeMarqueeMatch("4leg_m4", MARQUEE_FIXTURES.bayernPsg, bayernPsgOutcome)
      ]
    };
    const englishOdds = roundOdds(2.45 * 1.85);
    const englishRevenue = round2(35 * englishOdds);
    const twoLegEnglish = {
      id: "demo_inv_marquee_2leg_eng",
      created_at: dateIso,
      parlay_size: 2,
      inputs: 35,
      suggested_amount: 35,
      expected_rating: 0.63,
      combined_odds: englishOdds,
      status: "win",
      revenues: englishRevenue,
      profit: round2(englishRevenue - 35),
      actual_rating: 0.69,
      rep: null,
      remarks: "英超双串完美收割 · 主场优势叠加",
      matches: [
        makeMarqueeMatch("2leg_eng_m1", MARQUEE_FIXTURES.arsenalLiverpool, arsenalLiverpoolOutcome),
        makeMarqueeMatch("2leg_eng_m2", MARQUEE_FIXTURES.mancityChelsea, mancityChelseaOutcome)
      ]
    };
    const twoLegContinental = {
      id: "demo_inv_marquee_2leg_eu",
      created_at: dateIso,
      parlay_size: 2,
      inputs: 65,
      suggested_amount: 65,
      expected_rating: 0.57,
      combined_odds: roundOdds(2.8 * 2.2),
      status: "lose",
      revenues: 0,
      profit: -65,
      actual_rating: round2((0.22 + 0.7) / 2),
      rep: 1.4,
      remarks: "欧陆经典 · 拜仁赢球 / 巴萨被绝杀 · 串联失败",
      matches: [
        makeMarqueeMatch("2leg_eu_m1", MARQUEE_FIXTURES.barcaReal, barcaRealOutcome),
        makeMarqueeMatch("2leg_eu_m2", MARQUEE_FIXTURES.bayernPsg, bayernPsgOutcome)
      ]
    };
    return [fourLeg, twoLegEnglish, twoLegContinental];
  };
  var buildPendingPresets = () => {
    const pendingOutcome = {
      results: "",
      isCorrect: null,
      matchRating: 0,
      matchRep: null,
      postNote: ""
    };
    const buildBundle2 = (id, idPrefix, fixtures, suggested, dateIso, remarks) => {
      const combinedOdds = roundOdds(fixtures.reduce((acc, f) => acc * f.odds, 1));
      const avgConf = round2(fixtures.reduce((acc, f) => acc + f.conf, 0) / fixtures.length);
      return {
        id,
        created_at: dateIso,
        parlay_size: fixtures.length,
        inputs: suggested,
        suggested_amount: suggested,
        expected_rating: round2(avgConf * 0.92),
        combined_odds: combinedOdds,
        status: "pending",
        revenues: 0,
        profit: 0,
        actual_rating: 0,
        rep: null,
        remarks,
        __demo_seed_pending: true,
        matches: fixtures.map((f, i) => makeMarqueeMatch(`${idPrefix}_m${i + 1}`, f, pendingOutcome))
      };
    };
    return [
      buildBundle2(
        "demo_inv_pending_4leg",
        "pending_4leg",
        [
          MARQUEE_FIXTURES.arsenalLiverpool,
          MARQUEE_FIXTURES.mancityChelsea,
          MARQUEE_FIXTURES.barcaReal,
          MARQUEE_FIXTURES.bayernPsg
        ],
        8,
        "2026-01-04T19:00:00.000Z",
        "本周主推四串 · 英超双德比叠加欧陆豪门"
      ),
      buildBundle2(
        "demo_inv_pending_2leg_eng",
        "pending_2leg_eng",
        [MARQUEE_FIXTURES.manutdEverton, MARQUEE_FIXTURES.leedsNottingham],
        12,
        "2026-01-04T20:00:00.000Z",
        "英超双串 · 主场稳态组合"
      ),
      buildBundle2(
        "demo_inv_pending_2leg_eu",
        "pending_2leg_eu",
        [MARQUEE_FIXTURES.milanInter, MARQUEE_FIXTURES.dortmundLeverkusen],
        10,
        "2026-01-04T21:00:00.000Z",
        "欧陆双串 · 德比 + 德甲攻防对决"
      )
    ];
  };
  var buildCurrentCycleReportDemo = () => {
    const specs = [
      ["2026-01-12T19:30:00.000Z", 38, 1.95, true],
      ["2026-01-14T20:00:00.000Z", 45, 2.1, false],
      ["2026-01-16T19:45:00.000Z", 46, 2.15, true],
      ["2026-01-18T18:30:00.000Z", 160, 1.72, true],
      ["2026-01-21T20:15:00.000Z", 68, 2.25, false],
      ["2026-01-23T19:30:00.000Z", 156, 2.05, true],
      ["2026-01-25T17:45:00.000Z", 72, 1.84, true],
      ["2026-01-28T20:00:00.000Z", 115, 1.78, false],
      ["2026-01-30T19:30:00.000Z", 128, 2.22, true],
      ["2026-02-01T18:00:00.000Z", 54, 1.92, false],
      ["2026-02-03T20:00:00.000Z", 85, 2.55, true],
      ["2026-02-05T19:45:00.000Z", 96, 1.76, true],
      ["2026-02-07T18:30:00.000Z", 78, 1.88, false],
      ["2026-02-09T20:15:00.000Z", 138, 2.15, true],
      ["2026-02-11T19:30:00.000Z", 195, 1.68, true]
    ];
    return specs.map(([dateIso, inputs, targetOdds, isWin], index) => {
      const investment = buildInvestment(900 + index, dateIso);
      const legOdds = roundOdds(targetOdds ** (1 / Math.max(1, investment.matches.length)));
      const matches = investment.matches.map((match, matchIndex) => ({
        ...match,
        odds: legOdds,
        entries: [{ name: match.entry_text, odds: legOdds }],
        is_correct: isWin ? true : matchIndex !== 0,
        match_rating: isWin ? round2(randRange(0.58, 0.76)) : round2(randRange(0.18, 0.48))
      }));
      const combinedOdds = roundOdds(matches.reduce((product, match) => product * match.odds, 1));
      const revenues = isWin ? round2(inputs * combinedOdds) : 0;
      return {
        ...investment,
        id: `demo_report_current_${String(index + 1).padStart(2, "0")}`,
        inputs,
        suggested_amount: inputs,
        combined_odds: combinedOdds,
        status: isWin ? "win" : "lose",
        revenues,
        profit: round2(revenues - inputs),
        actual_rating: round2(matches.reduce((sum, match) => sum + match.match_rating, 0) / matches.length),
        remarks: "战报演示周期 · 已自动匹配赛果",
        matches
      };
    });
  };
  var TOTAL_GENERATED = 72;
  var buildBundle = () => {
    const investments = [];
    for (let i = 0; i < TOTAL_GENERATED; i++) {
      const baseFraction = i / TOTAL_GENERATED;
      const jitter = randRange(-0.012, 0.012);
      const ts = START_TS + (END_TS - START_TS) * (baseFraction + jitter);
      const dateIso = new Date(ts).toISOString();
      investments.push(buildInvestment(i + 1, dateIso));
    }
    investments.push(...buildShowcaseSamples());
    investments.push(...buildMarqueeSettled());
    investments.push(...buildPendingPresets());
    investments.push(...buildCurrentCycleReportDemo());
    investments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    investments.forEach((inv, idx) => {
      inv.id = `demo_inv_${String(idx + 1).padStart(3, "0")}`;
      if (Array.isArray(inv.matches)) {
        inv.matches.forEach((m, mIdx) => {
          m.id = `${inv.id}_m${mIdx + 1}`;
        });
      }
    });
    const teamCounters = /* @__PURE__ */ new Map();
    const teamRepSums = /* @__PURE__ */ new Map();
    const teamRepCounts = /* @__PURE__ */ new Map();
    investments.forEach((inv) => {
      inv.matches.forEach((m) => {
        ;
        [m.home_team, m.away_team].forEach((name) => {
          teamCounters.set(name, (teamCounters.get(name) || 0) + 1);
          if (m.match_rep) {
            teamRepSums.set(name, (teamRepSums.get(name) || 0) + m.match_rep);
            teamRepCounts.set(name, (teamRepCounts.get(name) || 0) + 1);
          }
        });
      });
    });
    const teamProfiles = TEAMS.map((t) => {
      const samples = teamCounters.get(t.name) || 0;
      const repSum = teamRepSums.get(t.name) || 0;
      const repCount = teamRepCounts.get(t.name) || 0;
      return {
        teamId: t.id,
        teamName: t.name,
        abbreviations: [t.abbr, t.name.toLowerCase()],
        totalSamples: samples,
        avgRep: repCount > 0 ? round2(repSum / repCount) : 0.4
      };
    });
    return { investments, teamProfiles };
  };
  var bundleCache = null;
  var ensureBundle = () => {
    if (bundleCache == null) bundleCache = buildBundle();
    return bundleCache;
  };
  var getDemoInvestments = () => {
    const { investments } = ensureBundle();
    return JSON.parse(JSON.stringify(investments));
  };
  var getDemoTeamProfiles = () => {
    const { teamProfiles } = ensureBundle();
    return JSON.parse(JSON.stringify(teamProfiles));
  };
  var getDemoSystemConfig = () => {
    const closedProfit = round2(ensureBundle().investments.filter((row) => row.status !== "pending" && row.created_at <= "2026-01-10T12:00:00.000Z").reduce((sum, row) => sum + row.profit, 0));
    return {
      initialCapital: 1500,
      riskCapRatio: 0.12,
      defaultOdds: 2.5,
      kellyDivisor: 4,
      kellyOverrideEnabled: false,
      kellyOverrideValue: 4,
      kellyAdjustment: 0,
      maxWorstDrawdownAlertPct: 22,
      backupCadence: "half_week",
      lastBackupAt: "",
      weightConf: 0.45,
      weightMode: 0.16,
      weightTys: 0.12,
      weightFid: 0.14,
      weightOdds: 0.06,
      weightFse: 0.07,
      // ── 蓄水池 demo 展示流水 ─────────────────────────────────────────
      // 在「蓄水池余额·历史明细」第一页顶部演示两条特殊流水，第一眼即可见：
      //   · 周期止盈结算（01-10）—— 排在最顶端（第 1 行）
      //   · 注资 +300（01-04 12:00）—— 排在 3 条「待结算」行之下（第 5 行）
      // 二者被那 3 条待结算行隔开，呈现「分开来、止盈在上、注资在下」。把原始
      // 首期本金 600 = 原始 300 + 注资 300；另含新周期划拨 900，initialCapital 合计 1500。
      // 结算盈亏与结算前余额由同一份演示账本推导，金额调整后仍与历史明细一致。
      // 止盈后立即划拨 900 开启「26-27 欧冠淘汰赛阶段」，并配入 15 条已结算演示记录，
      // 让战报默认打开时能够完整展示净值、分项、结果序列与分页明细。
      capitalInjections: [
        {
          id: "inj_demo_20260104",
          amount: 300,
          note: "",
          created_at: "2026-01-04T12:00:00.000Z"
        },
        {
          id: "inj_demo_20260110_allocation",
          amount: 900,
          note: "周期结算划拨",
          created_at: "2026-01-10T12:00:00.001Z"
        }
      ],
      poolSettlements: [
        {
          id: "stl_demo_20260110",
          type: "take_profit",
          realizedProfit: closedProfit,
          poolBefore: round2(600 + closedProfit),
          cycleBase: 600,
          newCapital: 900,
          linkedInjectionId: "inj_demo_20260110_allocation",
          created_at: "2026-01-10T12:00:00.000Z"
        }
      ],
      cycleTitles: [
        {
          id: "cycle_stl_demo_20260110",
          title: "26-27 欧冠淘汰赛阶段",
          name: "26-27 欧冠淘汰赛阶段",
          created_at: "2026-01-10T12:00:00.000Z",
          updated_at: "2026-01-10T12:00:00.000Z"
        }
      ],
      adaptiveWeights: {
        enabled: false,
        mode: "suggest",
        minSamples: 50,
        learningRate: 0.05,
        maxSingleChange: 0.02,
        priorStrength: 0.1,
        updateEveryN: 5,
        lastUpdateAt: "",
        updateCount: 0,
        bounds: {
          weightConf: [0.25, 0.65],
          weightMode: [0.08, 0.28],
          weightTys: [0.05, 0.22],
          weightFid: [0.06, 0.24],
          weightOdds: [0.02, 0.12],
          weightFse: [0.03, 0.15]
        },
        priors: {
          weightConf: 0.45,
          weightMode: 0.16,
          weightTys: 0.12,
          weightFid: 0.14,
          weightOdds: 0.06,
          weightFse: 0.07
        },
        initialPriors: {
          weightConf: 0.45,
          weightMode: 0.16,
          weightTys: 0.12,
          weightFid: 0.14,
          weightOdds: 0.06,
          weightFse: 0.07
        }
      },
      pageAmbientThemes: {},
      __demo: true
    };
  };
  var getDemoAccessLogs = () => [];
  var DEMO_BUNDLE_REVISION = `demo-stakes-v3-${SEED.toString(36)}`;

  // source/src/lib/localData.js
  var localData_exports = {};
  __export(localData_exports, {
    PAGE_AMBIENT_THEME_DEFAULTS: () => PAGE_AMBIENT_THEME_DEFAULTS,
    PAGE_AMBIENT_THEME_VALUES: () => PAGE_AMBIENT_THEME_VALUES,
    TEAM_ALIAS_LIBRARY: () => TEAM_ALIAS_LIBRARY,
    addCapitalInjection: () => addCapitalInjection,
    appendAccessLog: () => appendAccessLog,
    beginTimeMachineSession: () => beginTimeMachineSession,
    bootstrapCloudSnapshotOnLoad: () => bootstrapCloudSnapshotOnLoad,
    bumpTeamSamples: () => bumpTeamSamples,
    deleteInvestment: () => deleteInvestment,
    deleteTimeMachineSnapshot: () => deleteTimeMachineSnapshot,
    endTimeMachineSession: () => endTimeMachineSession,
    ensureCurrentMonthSnapshot: () => ensureCurrentMonthSnapshot,
    ensureTeamProfile: () => ensureTeamProfile,
    exportDataBundle: () => exportDataBundle,
    findTeamProfile: () => findTeamProfile,
    getAccessLogs: () => getAccessLogs,
    getCapitalInjections: () => getCapitalInjections,
    getCloudSyncStatus: () => getCloudSyncStatus,
    getCycleTitles: () => getCycleTitles,
    getInvestments: () => getInvestments,
    getPoolSettlements: () => getPoolSettlements,
    getSystemConfig: () => getSystemConfig,
    getTeamDirectoryProfiles: () => getTeamDirectoryProfiles,
    getTeamProfiles: () => getTeamProfiles,
    getTimeMachineSessionInfo: () => getTimeMachineSessionInfo,
    importDataBundle: () => importDataBundle,
    initializeFlagshipGlassDefault: () => initializeFlagshipGlassDefault,
    isInTimeMachineMode: () => isInTimeMachineMode,
    listHistoricalSnapshots: () => listHistoricalSnapshots,
    pullCloudSnapshotNow: () => pullCloudSnapshotNow,
    recallPoolSettlement: () => recallPoolSettlement,
    restoreGenesisData: () => restoreGenesisData,
    runCloudSyncNow: () => runCloudSyncNow,
    saveInvestment: () => saveInvestment,
    saveInvestments: () => saveInvestments,
    saveSnapshot: () => saveSnapshot,
    saveSystemConfig: () => saveSystemConfig,
    searchTeamProfiles: () => searchTeamProfiles,
    setCloudSyncEnabled: () => setCloudSyncEnabled,
    setCycleTitle: () => setCycleTitle,
    setInvestmentArchived: () => setInvestmentArchived,
    settlePool: () => settlePool,
    updateInvestment: () => updateInvestment,
    updateInvestments: () => updateInvestments
  });

  // source/shared/brandCompatibility.js
  var LEGACY_BRAND = Object.freeze({
    storagePrefix: "dugou",
    ownerHeader: "x-dugou-arsenal",
    timeSnapshotSchema: "dugou_time_snapshot_v1",
    cloudSnapshotTable: "dugou_sync_snapshots"
  });
  var isTimeSnapshotSchema = (schema) => schema === "eivra_time_snapshot_v1" || schema === LEGACY_BRAND.timeSnapshotSchema;

  // source/src/lib/brandStorage.js
  var legacyKeyFor = (key) => {
    const value = String(key);
    return /^eivra[.:]/.test(value) ? `${LEGACY_BRAND.storagePrefix}${value.slice("eivra".length)}` : null;
  };
  var createBrandStorage = (getStorage) => ({
    getItem(key) {
      const storage3 = getStorage();
      const current = storage3.getItem(key);
      if (current !== null) return current;
      const legacyKey = legacyKeyFor(key);
      if (!legacyKey) return null;
      const legacy = storage3.getItem(legacyKey);
      if (legacy === null) return null;
      try {
        storage3.setItem(key, legacy);
      } catch {
      }
      return legacy;
    },
    setItem(key, value) {
      getStorage().setItem(key, value);
    },
    removeItem(key) {
      const storage3 = getStorage();
      const legacyKey = legacyKeyFor(key);
      if (legacyKey) storage3.removeItem(legacyKey);
      storage3.removeItem(key);
    }
  });
  var brandLocalStorage = createBrandStorage(() => window.localStorage);
  var brandSessionStorage = createBrandStorage(() => window.sessionStorage);

  // platform-cloud.js
  var createClient = () => {
    throw new Error("Cloud sync is not configured in native offline mode");
  };

  // source/src/lib/cloudSync.js
  var SYNC_STATE_KEY = "eivra.cloud_sync_state.v1";
  var TIME_MACHINE_PREFIX = "timemachine:";
  var TIME_MACHINE_SCHEMA = "eivra_time_snapshot_v1";
  var SNAPSHOT_TABLE = String(define_import_meta_env_default.VITE_EIVRA_SNAPSHOT_TABLE || "").trim() || LEGACY_BRAND.cloudSnapshotTable;
  var TIME_MACHINE_DEFAULT_PAGE_SIZE = 6;
  var DEFAULT_SYNC_STATE = {
    enabled: false,
    lastSyncAt: "",
    lastError: ""
  };
  var isBrowser = typeof window !== "undefined";
  var readJSON = (key, fallback) => {
    if (!isBrowser) return fallback;
    try {
      const raw = brandLocalStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };
  var writeJSON = (key, value) => {
    if (!isBrowser) return;
    brandLocalStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("eivra:data-changed", { detail: { key } }));
  };
  var getSupabaseEnv = () => {
    const url = define_import_meta_env_default.VITE_SUPABASE_URL || "";
    const anonKey = define_import_meta_env_default.VITE_SUPABASE_ANON_KEY || "";
    return {
      url: String(url).trim(),
      anonKey: String(anonKey).trim()
    };
  };
  var getSupabaseClient = () => {
    const env = getSupabaseEnv();
    if (!env.url || !env.anonKey) return null;
    return createClient(env.url, env.anonKey);
  };
  var pad2 = (value) => String(value).padStart(2, "0");
  var getTimeMachineMonthKey = (inputDate = /* @__PURE__ */ new Date()) => {
    const date = inputDate instanceof Date ? inputDate : new Date(inputDate);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
  };
  var buildMonthlySnapshotId = (monthKey) => `${TIME_MACHINE_PREFIX}monthly:${monthKey}`;
  var buildManualSnapshotId = () => `${TIME_MACHINE_PREFIX}manual:${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  var normalizeTimeMachineBundle = (snapshot) => {
    if (!snapshot || typeof snapshot !== "object") return null;
    const systemConfig = snapshot.system_config && typeof snapshot.system_config === "object" ? snapshot.system_config : null;
    const teamProfiles = Array.isArray(snapshot.team_profiles) ? snapshot.team_profiles : null;
    const investments = Array.isArray(snapshot.investments) ? snapshot.investments : null;
    if (!systemConfig || !teamProfiles || !investments) return null;
    return {
      version: Number(snapshot.version) || 1,
      exported_at: String(snapshot.exported_at || (/* @__PURE__ */ new Date()).toISOString()),
      system_config: systemConfig,
      team_profiles: teamProfiles,
      investments
    };
  };
  var normalizeTimeMachineMeta = (rawMeta = {}, fallback = {}) => {
    const mode = rawMeta.mode === "monthly" ? "monthly" : "manual";
    const snapshotAt = String(rawMeta.snapshot_at || fallback.snapshotAt || (/* @__PURE__ */ new Date()).toISOString());
    const monthKey = String(rawMeta.month_key || fallback.monthKey || "");
    const titleFallback = mode === "monthly" && monthKey ? `${monthKey} 月度快照` : "手动快照";
    return {
      mode,
      monthKey,
      snapshotAt,
      title: String(rawMeta.title || titleFallback),
      createdAt: String(rawMeta.created_at || fallback.createdAt || snapshotAt),
      includeAccessLogs: false
    };
  };
  var parseTimeMachineRow = (row) => {
    if (!row || typeof row !== "object") return null;
    const payload = row.payload && typeof row.payload === "object" ? row.payload : null;
    if (isTimeSnapshotSchema(payload?.schema) && payload.bundle) {
      const bundle = normalizeTimeMachineBundle(payload.bundle);
      if (!bundle) return null;
      const meta2 = normalizeTimeMachineMeta(payload.meta || {}, {
        snapshotAt: row.updated_at,
        createdAt: row.updated_at
      });
      return {
        id: String(row.id || ""),
        updatedAt: String(row.updated_at || meta2.snapshotAt),
        meta: meta2,
        bundle,
        stats: {
          investmentCount: Array.isArray(bundle.investments) ? bundle.investments.length : 0,
          teamCount: Array.isArray(bundle.team_profiles) ? bundle.team_profiles.length : 0
        }
      };
    }
    const legacyBundle = normalizeTimeMachineBundle(payload || {});
    if (!legacyBundle) return null;
    const fallbackMonth = getTimeMachineMonthKey(row.updated_at || Date.now());
    const mode = String(row.id || "").includes(":monthly:") ? "monthly" : "manual";
    const meta = normalizeTimeMachineMeta(
      {
        mode,
        month_key: mode === "monthly" ? fallbackMonth : "",
        snapshot_at: row.updated_at || (/* @__PURE__ */ new Date()).toISOString(),
        title: mode === "monthly" ? `${fallbackMonth} 月度快照` : "手动快照"
      },
      { snapshotAt: row.updated_at, createdAt: row.updated_at, monthKey: fallbackMonth }
    );
    return {
      id: String(row.id || ""),
      updatedAt: String(row.updated_at || meta.snapshotAt),
      meta,
      bundle: legacyBundle,
      stats: {
        investmentCount: Array.isArray(legacyBundle.investments) ? legacyBundle.investments.length : 0,
        teamCount: Array.isArray(legacyBundle.team_profiles) ? legacyBundle.team_profiles.length : 0
      }
    };
  };
  var getCloudSyncState = () => {
    const saved = readJSON(SYNC_STATE_KEY, null);
    const env = getSupabaseEnv();
    return {
      ...DEFAULT_SYNC_STATE,
      ...saved || {},
      hasEnv: Boolean(env.url && env.anonKey)
    };
  };
  var saveCloudSyncState = (patch) => {
    const current = getCloudSyncState();
    const next = {
      enabled: current.enabled,
      lastSyncAt: current.lastSyncAt,
      lastError: current.lastError,
      ...patch || {}
    };
    writeJSON(SYNC_STATE_KEY, next);
    return getCloudSyncState();
  };
  var saveTimeMachineSnapshot = async ({ snapshot, title = "", mode = "manual", monthKey = "" } = {}) => {
    const client = getSupabaseClient();
    if (!client) {
      const next = saveCloudSyncState({
        lastError: "Supabase 环境变量未配置（VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY）。"
      });
      return { ok: false, reason: "missing_env", state: next };
    }
    const bundle = normalizeTimeMachineBundle(snapshot);
    if (!bundle) return { ok: false, reason: "invalid_snapshot" };
    const normalizedMode = mode === "monthly" ? "monthly" : "manual";
    const normalizedMonthKey = normalizedMode === "monthly" ? monthKey || getTimeMachineMonthKey(Date.now()) : "";
    const snapshotId = normalizedMode === "monthly" ? buildMonthlySnapshotId(normalizedMonthKey) : buildManualSnapshotId();
    const snapshotAt = (/* @__PURE__ */ new Date()).toISOString();
    const resolvedTitle = String(title || "").trim() || (normalizedMode === "monthly" ? `${normalizedMonthKey} 月度快照` : "手动快照");
    const payload = {
      schema: TIME_MACHINE_SCHEMA,
      meta: {
        mode: normalizedMode,
        month_key: normalizedMonthKey,
        snapshot_at: snapshotAt,
        created_at: snapshotAt,
        title: resolvedTitle,
        include_access_logs: false
      },
      bundle
    };
    try {
      const { error, data } = await client.from(SNAPSHOT_TABLE).upsert({
        id: snapshotId,
        payload,
        updated_at: snapshotAt
      });
      if (error) {
        console.error("[saveTimeMachineSnapshot] Supabase error:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        const next = saveCloudSyncState({ lastError: `${error.code}: ${error.message}` });
        return { ok: false, reason: "save_failed", state: next, error };
      }
    } catch (err) {
      console.error("[saveTimeMachineSnapshot] Exception:", err);
      const next = saveCloudSyncState({ lastError: err.message || "时光快照保存异常。" });
      return { ok: false, reason: "exception", state: next, error: err };
    }
    return {
      ok: true,
      snapshotId,
      meta: {
        mode: normalizedMode,
        monthKey: normalizedMonthKey,
        snapshotAt,
        title: resolvedTitle
      }
    };
  };
  var deleteTimeMachineSnapshotById = async (snapshotId) => {
    const client = getSupabaseClient();
    if (!client) {
      return { ok: false, reason: "missing_env" };
    }
    try {
      const { error, data } = await client.from(SNAPSHOT_TABLE).delete().eq("id", snapshotId);
      if (error) {
        console.error("[deleteTimeMachineSnapshotById] Supabase error:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return { ok: false, reason: "delete_failed", errorCode: error.code, errorMessage: error.message };
      }
      return { ok: true, snapshotId };
    } catch (err) {
      console.error("[deleteTimeMachineSnapshotById] Exception:", err);
      return { ok: false, reason: "exception", errorMessage: err.message };
    }
  };
  var ensureMonthlyTimeMachineSnapshot = async ({ snapshot, now = Date.now() } = {}) => {
    const client = getSupabaseClient();
    if (!client) {
      const next = saveCloudSyncState({
        lastError: "Supabase 环境变量未配置（VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY）。"
      });
      return { ok: false, reason: "missing_env", state: next };
    }
    const monthKey = getTimeMachineMonthKey(now);
    if (!monthKey) return { ok: false, reason: "invalid_month" };
    const snapshotId = buildMonthlySnapshotId(monthKey);
    const { data: existing, error: checkError } = await client.from(SNAPSHOT_TABLE).select("id, updated_at").eq("id", snapshotId).maybeSingle();
    if (checkError) {
      const next = saveCloudSyncState({ lastError: checkError.message || "月度快照检查失败。" });
      return { ok: false, reason: "check_failed", state: next };
    }
    if (existing?.id) {
      return {
        ok: true,
        created: false,
        snapshotId,
        monthKey,
        snapshotAt: existing.updated_at || ""
      };
    }
    const result = await saveTimeMachineSnapshot({
      snapshot,
      mode: "monthly",
      monthKey
    });
    if (!result?.ok) return { ...result, created: false, monthKey };
    return { ...result, created: true, monthKey };
  };
  var listTimeMachineSnapshots = async ({ page = 1, pageSize = TIME_MACHINE_DEFAULT_PAGE_SIZE } = {}) => {
    const client = getSupabaseClient();
    if (!client) {
      const next = saveCloudSyncState({
        lastError: "Supabase 环境变量未配置（VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY）。"
      });
      return { ok: false, reason: "missing_env", state: next, rows: [], total: 0 };
    }
    const safePageSize = Math.max(1, Math.min(50, Number(pageSize) || TIME_MACHINE_DEFAULT_PAGE_SIZE));
    const safePage = Math.max(1, Number(page) || 1);
    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;
    const { data, error, count } = await client.from(SNAPSHOT_TABLE).select("id, payload, updated_at", { count: "exact" }).like("id", `${TIME_MACHINE_PREFIX}%`).order("updated_at", { ascending: false }).range(from, to);
    if (error) {
      const next = saveCloudSyncState({ lastError: error.message || "时光快照列表读取失败。" });
      return { ok: false, reason: "list_failed", state: next, rows: [], total: 0, page: safePage, pageSize: safePageSize };
    }
    const rows = Array.isArray(data) ? data.map((row) => parseTimeMachineRow(row)).filter(Boolean) : [];
    return {
      ok: true,
      rows,
      total: Number.isFinite(Number(count)) ? Number(count) : rows.length,
      page: safePage,
      pageSize: safePageSize
    };
  };
  var fetchTimeMachineSnapshotById = async (snapshotId) => {
    const client = getSupabaseClient();
    if (!client) {
      const next = saveCloudSyncState({
        lastError: "Supabase 环境变量未配置（VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY）。"
      });
      return { ok: false, reason: "missing_env", state: next };
    }
    const id = String(snapshotId || "").trim();
    if (!id) return { ok: false, reason: "invalid_id" };
    const { data, error } = await client.from(SNAPSHOT_TABLE).select("id, payload, updated_at").eq("id", id).maybeSingle();
    if (error) {
      const next = saveCloudSyncState({ lastError: error.message || "时光快照读取失败。" });
      return { ok: false, reason: "fetch_failed", state: next };
    }
    const parsed = parseTimeMachineRow(data);
    if (!parsed) return { ok: false, reason: "snapshot_not_found" };
    return {
      ok: true,
      snapshotId: parsed.id,
      bundle: parsed.bundle,
      meta: parsed.meta,
      stats: parsed.stats,
      updatedAt: parsed.updatedAt
    };
  };
  var TIME_MACHINE_SESSION_KEY = "eivra.time_machine_session.v1";
  var getTimeMachineSession = () => {
    if (!isBrowser) return null;
    try {
      const raw = brandSessionStorage.getItem(TIME_MACHINE_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  var startTimeMachineSession = (snapshotData) => {
    if (!isBrowser) return { ok: false, reason: "browser_only" };
    if (!snapshotData || typeof snapshotData !== "object") {
      return { ok: false, reason: "invalid_snapshot" };
    }
    const session = {
      snapshotId: String(snapshotData.snapshotId || ""),
      snapshotAt: String(snapshotData.updatedAt || (/* @__PURE__ */ new Date()).toISOString()),
      title: String(snapshotData.meta?.title || "快照"),
      monthKey: String(snapshotData.meta?.monthKey || ""),
      bundle: snapshotData.bundle || {},
      startedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    try {
      brandSessionStorage.setItem(TIME_MACHINE_SESSION_KEY, JSON.stringify(session));
      window.dispatchEvent(new CustomEvent("eivra:time-machine-changed", { detail: { active: true, session } }));
      return { ok: true, session };
    } catch {
      return { ok: false, reason: "session_storage_error" };
    }
  };
  var exitTimeMachineSession = () => {
    if (!isBrowser) return { ok: false, reason: "browser_only" };
    try {
      brandSessionStorage.removeItem(TIME_MACHINE_SESSION_KEY);
      window.dispatchEvent(new CustomEvent("eivra:time-machine-changed", { detail: { active: false, session: null } }));
      return { ok: true };
    } catch {
      return { ok: false, reason: "session_storage_error" };
    }
  };
  var isInTimeMachineSession = () => {
    return Boolean(getTimeMachineSession());
  };

  // source/src/design/inspiration2609.js
  var INSPIRATION_2609_MATERIALS = Object.freeze({
    "/": "folio",
    "/new": "folio",
    "/combo": "folio",
    "/settle": "glacier",
    "/dashboard": "prism",
    "/dashboard/analysis": "prism",
    "/dashboard/metrics": "prism",
    "/dashboard/report": "prism",
    "/dashboard/quants": "prism",
    "/quants": "prism",
    "/history": "prism",
    "/history/teams": "peach",
    "/params": "modern"
  });

  // source/src/design/labEditions.js
  var getDesignPreviewBase = (pathname = "") => String(pathname).match(/^\/(?:arsenal\/)?design\/inpiration(?=\/|$)/)?.[0] || null;
  var isDesignPreview = () => typeof window !== "undefined" && Boolean(getDesignPreviewBase(window.location?.pathname));

  // source/src/lib/displayMode.js
  var TOKEN_KEY = "eivra.preview_unlock_token.v1";
  var UNLOCK_LATCH_KEY = "eivra.full_session_latch.v1";
  var DISPLAY_MODE_EVENT = "eivra:display-mode-changed";
  var MOCK_TOKEN_PREFIX = "dev.mock.";
  var PREVIEW_MODE = "preview";
  var FULL_MODE = "full";
  var OWNER_ROUTE_BASENAME = "/arsenal";
  var isOwnerRoutePath = (pathname = "") => {
    const path = String(pathname || "");
    return path === OWNER_ROUTE_BASENAME || path.startsWith(`${OWNER_ROUTE_BASENAME}/`);
  };
  var isOwnerRoute = () => typeof window !== "undefined" && isOwnerRoutePath(window.location?.pathname);
  var safeGetSession = (key) => {
    if (typeof window === "undefined") return null;
    try {
      return brandSessionStorage.getItem(key);
    } catch (err) {
      return null;
    }
  };
  var decodeJwtPayload = (token) => {
    if (typeof token !== "string" || !token.includes(".")) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    try {
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
      const decoded = atob(padded);
      return JSON.parse(decoded);
    } catch (err) {
      return null;
    }
  };
  var isTokenLive = (token) => {
    if (!token) return false;
    if (token.startsWith(MOCK_TOKEN_PREFIX)) {
      const expiresAtRaw = token.slice(MOCK_TOKEN_PREFIX.length);
      const expiresAt = Number.parseInt(expiresAtRaw, 10);
      if (!Number.isFinite(expiresAt)) return false;
      return expiresAt > Date.now();
    }
    const payload = decodeJwtPayload(token);
    if (!payload) return false;
    if (typeof payload.exp !== "number") return true;
    return payload.exp * 1e3 > Date.now();
  };
  var getStoredToken = () => safeGetSession(TOKEN_KEY);
  var isSessionUnlocked = () => safeGetSession(UNLOCK_LATCH_KEY) === "1";
  var getDisplayMode = () => {
    if (isDesignPreview()) return PREVIEW_MODE;
    if (isOwnerRoute()) return FULL_MODE;
    if (isSessionUnlocked()) return FULL_MODE;
    const token = getStoredToken();
    return isTokenLive(token) ? FULL_MODE : PREVIEW_MODE;
  };
  var isPreviewMode = () => getDisplayMode() === PREVIEW_MODE;
  var isFullMode = () => getDisplayMode() === FULL_MODE;
  var DISPLAY_MODE_CHANGE_EVENT = DISPLAY_MODE_EVENT;

  // source/src/lib/gitSync.js
  var COMMIT_ENDPOINT = "/api/commit-bundle";
  var PULL_ENDPOINT = "/api/bundle";
  var STATE_KEY = "eivra.git_sync_state.v1";
  var DEBOUNCE_MS = 3e4;
  var COMMIT_THRESHOLD = 8;
  var DEFAULT_STATE = {
    enabled: true,
    // on by default — "just works" once the Vercel env vars exist
    lastSyncAt: "",
    lastPullAt: "",
    lastError: ""
  };
  var isBrowser2 = typeof window !== "undefined";
  var designPreviewState = { ...DEFAULT_STATE };
  var endpointUnavailable = false;
  var pendingChanges = 0;
  var debounceTimer = null;
  var commitInFlight = false;
  var lastSnapshotFactory = null;
  var readState = () => {
    if (isDesignPreview()) return { ...designPreviewState };
    if (!isBrowser2) return { ...DEFAULT_STATE };
    try {
      const raw = brandLocalStorage.getItem(STATE_KEY);
      return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : { ...DEFAULT_STATE };
    } catch {
      return { ...DEFAULT_STATE };
    }
  };
  var writeState = (next) => {
    if (isDesignPreview()) {
      designPreviewState = { ...next };
      return;
    }
    if (!isBrowser2) return;
    try {
      brandLocalStorage.setItem(STATE_KEY, JSON.stringify(next));
    } catch {
    }
  };
  var getGitSyncState = () => ({
    ...readState(),
    // Parity with the old getCloudSyncStatus() shape consumed by ParamsPage.
    hasEnv: true,
    endpointUnavailable
  });
  var saveGitSyncState = (patch) => {
    const next = { ...readState(), ...patch || {} };
    writeState(next);
    return getGitSyncState();
  };
  var setGitSyncEnabled = (enabled) => saveGitSyncState({ enabled: Boolean(enabled), lastError: "" });
  var authHeaders = () => {
    if (isOwnerRoute()) return { "X-Eivra-Arsenal": "1" };
    const token = getStoredToken();
    return token ? { Authorization: `Bearer ${token}` } : null;
  };
  var canSync = () => isBrowser2 && !endpointUnavailable && isFullMode() && getGitSyncState().enabled;
  var commitBundleNow = async (snapshot) => {
    if (!isBrowser2) return { ok: false, reason: "no_window" };
    if (!isFullMode()) return { ok: false, reason: "preview_mode" };
    const headers = authHeaders();
    if (!headers) return { ok: false, reason: "no_token" };
    if (!snapshot || typeof snapshot !== "object") return { ok: false, reason: "invalid_snapshot" };
    if (commitInFlight) return { ok: false, reason: "in_flight" };
    commitInFlight = true;
    try {
      const res = await fetch(COMMIT_ENDPOINT, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot })
      });
      if (res.status === 404) {
        endpointUnavailable = true;
        saveGitSyncState({ lastError: "同步端点未部署（本地 vite dev 不运行 /api）。" });
        return { ok: false, reason: "endpoint_unavailable" };
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        saveGitSyncState({ lastError: data.reason ? `提交失败：${data.reason}` : `提交失败（HTTP ${res.status}）。` });
        return { ok: false, reason: data.reason || "commit_failed", status: res.status };
      }
      pendingChanges = 0;
      saveGitSyncState({ lastSyncAt: (/* @__PURE__ */ new Date()).toISOString(), lastError: "" });
      return { ok: true, count: data.count, updatedAt: data.updated_at };
    } catch (err) {
      saveGitSyncState({ lastError: `提交异常：${err?.message || err}` });
      return { ok: false, reason: "network_error" };
    } finally {
      commitInFlight = false;
    }
  };
  var scheduleGitCommit = (snapshotFactory) => {
    if (typeof snapshotFactory === "function") lastSnapshotFactory = snapshotFactory;
    if (!canSync()) return;
    pendingChanges += 1;
    const flush = () => {
      if (debounceTimer) {
        window.clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      const snapshot = typeof lastSnapshotFactory === "function" ? lastSnapshotFactory() : null;
      if (snapshot) commitBundleNow(snapshot);
    };
    if (pendingChanges >= COMMIT_THRESHOLD) {
      flush();
      return;
    }
    if (debounceTimer) window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(flush, DEBOUNCE_MS);
  };
  var pullGitBundle = async () => {
    if (!isBrowser2 || endpointUnavailable) return { ok: false, reason: "unavailable", bundle: null };
    if (!isFullMode()) return { ok: false, reason: "preview_mode", bundle: null };
    const headers = authHeaders();
    if (!headers) return { ok: false, reason: "no_token", bundle: null };
    try {
      const res = await fetch(PULL_ENDPOINT, { headers });
      if (res.status === 404) {
        endpointUnavailable = true;
        return { ok: false, reason: "endpoint_unavailable", bundle: null };
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        saveGitSyncState({ lastError: data.reason ? `拉取失败：${data.reason}` : `拉取失败（HTTP ${res.status}）。` });
        return { ok: false, reason: data.reason || "pull_failed", bundle: null };
      }
      saveGitSyncState({ lastPullAt: (/* @__PURE__ */ new Date()).toISOString(), lastError: "" });
      return { ok: true, bundle: data.bundle || null, updatedAt: data.updated_at || "" };
    } catch (err) {
      saveGitSyncState({ lastError: `拉取异常：${err?.message || err}` });
      return { ok: false, reason: "network_error", bundle: null };
    }
  };
  if (isBrowser2) {
    const flushOnHide = () => {
      if (pendingChanges <= 0 || !canSync()) return;
      const headers = authHeaders();
      const snapshot = typeof lastSnapshotFactory === "function" ? lastSnapshotFactory() : null;
      if (!headers || !snapshot) return;
      try {
        fetch(COMMIT_ENDPOINT, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ snapshot }),
          keepalive: true
        }).catch(() => {
        });
      } catch {
      }
    };
    window.addEventListener("pagehide", flushOnHide);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushOnHide();
    });
  }

  // source/src/lib/entryParsing.js
  var ENTRY_MARKET_META = {
    score: { label: "比分", rank: 1 },
    half_full: { label: "半全场", rank: 2 },
    handicap: { label: "让球", rank: 3 },
    total: { label: "大小球", rank: 4 },
    result: { label: "赛果", rank: 5 },
    other: { label: "其他", rank: 99 }
  };
  var OUTCOME_TOKEN_GROUPS = {
    win: ["w", "win", "home", "homewin", "h", "主胜", "主", "胜"],
    draw: ["d", "draw", "x", "平", "平局"],
    lose: ["l", "lose", "away", "awaywin", "a", "客胜", "客", "负"]
  };
  var TOTAL_DIRECTION_GROUPS = {
    over: ["over", "o", "大", "大球"],
    under: ["under", "u", "小", "小球"]
  };
  var OUTCOME_TOKEN_MAP = Object.entries(OUTCOME_TOKEN_GROUPS).reduce((acc, [outcome, tokens]) => {
    tokens.forEach((token) => {
      acc.set(String(token).trim().toLowerCase(), outcome);
    });
    return acc;
  }, /* @__PURE__ */ new Map());
  var TOTAL_DIRECTION_MAP = Object.entries(TOTAL_DIRECTION_GROUPS).reduce((acc, [direction, tokens]) => {
    tokens.forEach((token) => {
      acc.set(String(token).trim().toLowerCase(), direction);
    });
    return acc;
  }, /* @__PURE__ */ new Map());
  var getMarketMeta = (marketType) => ENTRY_MARKET_META[marketType] || ENTRY_MARKET_META.other;
  var normalizeToken = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  var parseOutcomeToken = (value) => OUTCOME_TOKEN_MAP.get(normalizeToken(value)) || null;
  var parseTotalDirection = (value) => TOTAL_DIRECTION_MAP.get(normalizeToken(value)) || null;
  var toNumber = (value, fallback = Number.NaN) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  var buildSemanticResult = (name, marketType, semanticKey = "", detail = null) => ({
    name,
    marketType,
    marketLabel: getMarketMeta(marketType).label,
    semanticKey,
    detail
  });
  var normalizeEntryNameWhileTyping = (value) => String(value || "").replace(/，/g, ",").replace(/；/g, ";").replace(/。/g, ".").replace(/：/g, ":").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[—–－﹣−]/g, "-").replace(/[／]/g, "/").replace(/　/g, " ");
  var normalizeEntryName = (value) => normalizeEntryNameWhileTyping(value).replace(/\s*,\s*/g, ", ").replace(/\s+/g, " ").replace(/^[,;，；\s]+|[,;，；\s]+$/g, "").trim();
  var parseScoreEntry = (value) => {
    const match = String(value || "").match(/^(\d{1,2})\s*[-:]\s*(\d{1,2})$/);
    if (!match) return null;
    const home = Number.parseInt(match[1], 10);
    const away = Number.parseInt(match[2], 10);
    if (!Number.isFinite(home) || !Number.isFinite(away)) return null;
    return {
      semanticKey: `${home}-${away}`,
      detail: { home, away }
    };
  };
  var parseHalfFullEntry = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return null;
    const dashed = raw.replace(/[/|>→]/g, "-").replace(/\s*-\s*/g, "-").trim();
    const dashedMatch = dashed.match(/^([a-zA-Z\u4e00-\u9fa5]+)-([a-zA-Z\u4e00-\u9fa5]+)$/);
    if (dashedMatch) {
      const half = parseOutcomeToken(dashedMatch[1]);
      const full = parseOutcomeToken(dashedMatch[2]);
      if (half && full) {
        return {
          semanticKey: `${half}-${full}`,
          detail: { half, full }
        };
      }
    }
    const spaced = raw.split(/\s+/).filter(Boolean);
    if (spaced.length === 2) {
      const half = parseOutcomeToken(spaced[0]);
      const full = parseOutcomeToken(spaced[1]);
      if (half && full) {
        return {
          semanticKey: `${half}-${full}`,
          detail: { half, full }
        };
      }
    }
    const compact = dashed.replace(/-/g, "");
    if (/^[wdl]{2}$/i.test(compact)) {
      const half = parseOutcomeToken(compact.slice(0, 1));
      const full = parseOutcomeToken(compact.slice(1, 2));
      if (half && full) {
        return {
          semanticKey: `${half}-${full}`,
          detail: { half, full }
        };
      }
    }
    if (/^[胜平负]{2}$/.test(compact)) {
      const half = parseOutcomeToken(compact.slice(0, 1));
      const full = parseOutcomeToken(compact.slice(1, 2));
      if (half && full) {
        return {
          semanticKey: `${half}-${full}`,
          detail: { half, full }
        };
      }
    }
    const compactLower = compact.toLowerCase();
    const words = ["win", "draw", "lose"];
    for (let i = 0; i < words.length; i += 1) {
      for (let j = 0; j < words.length; j += 1) {
        const left = words[i];
        const right = words[j];
        if (compactLower === `${left}${right}`) {
          return {
            semanticKey: `${left}-${right}`,
            detail: { half: left, full: right }
          };
        }
      }
    }
    return null;
  };
  var HANDICAP_OPPOSITE_OUTCOME = { win: "lose", lose: "win", draw: "draw" };
  var canonicalHandicap = (line, outcome) => {
    const numericLine = toNumber(line, Number.NaN);
    if (!Number.isFinite(numericLine) || numericLine <= 0 || !outcome) return { line, outcome };
    return { line: -numericLine, outcome: HANDICAP_OPPOSITE_OUTCOME[outcome] || outcome };
  };
  var parseHandicapEntry = (value) => {
    const candidate = String(value || "").replace(/[()]/g, " ").replace(/让球?/g, " ").replace(/([+-])\s+(\d)/g, "$1$2").replace(/\s+/g, " ").trim();
    if (!candidate) return null;
    const leadingNumber = candidate.match(/^([+-]?\d+(?:\.\d+)?)\s*([a-zA-Z\u4e00-\u9fa5]+)$/);
    if (leadingNumber) {
      const line = toNumber(leadingNumber[1], Number.NaN);
      const outcome = parseOutcomeToken(leadingNumber[2]);
      if (Number.isFinite(line) && outcome) {
        const canonical2 = canonicalHandicap(line, outcome);
        return {
          semanticKey: `${canonical2.line}:${canonical2.outcome}`,
          detail: { line, outcome, canonicalLine: canonical2.line, canonicalOutcome: canonical2.outcome }
        };
      }
    }
    const trailingNumber = candidate.match(/^([a-zA-Z\u4e00-\u9fa5]+)\s*([+-]?\d+(?:\.\d+)?)$/);
    if (trailingNumber) {
      const outcome = parseOutcomeToken(trailingNumber[1]);
      const line = toNumber(trailingNumber[2], Number.NaN);
      if (Number.isFinite(line) && outcome) {
        const canonical2 = canonicalHandicap(line, outcome);
        return {
          semanticKey: `${canonical2.line}:${canonical2.outcome}`,
          detail: { line, outcome, canonicalLine: canonical2.line, canonicalOutcome: canonical2.outcome }
        };
      }
    }
    return null;
  };
  var parseTotalEntry = (value) => {
    const compact = String(value || "").trim().replace(/\s+/g, "");
    if (!compact) return null;
    const leadingDirection = compact.match(/^(over|under|o|u|大|小)(\d+(?:\.\d+)?)$/i);
    if (leadingDirection) {
      const direction = parseTotalDirection(leadingDirection[1]);
      const line = toNumber(leadingDirection[2], Number.NaN);
      if (direction && Number.isFinite(line)) {
        return {
          semanticKey: `${direction}:${line}`,
          detail: { direction, line }
        };
      }
    }
    const trailingDirection = compact.match(/^(\d+(?:\.\d+)?)(over|under|o|u|大|小)$/i);
    if (trailingDirection) {
      const line = toNumber(trailingDirection[1], Number.NaN);
      const direction = parseTotalDirection(trailingDirection[2]);
      if (direction && Number.isFinite(line)) {
        return {
          semanticKey: `${direction}:${line}`,
          detail: { direction, line }
        };
      }
    }
    return null;
  };
  var parseResultEntry = (value) => {
    const outcome = parseOutcomeToken(value);
    if (!outcome) return null;
    return {
      semanticKey: outcome,
      detail: { outcome }
    };
  };
  var parseEntrySemantic = (value) => {
    const name = normalizeEntryName(value);
    if (!name) return buildSemanticResult("", "other", "", null);
    const score = parseScoreEntry(name);
    if (score) return buildSemanticResult(name, "score", score.semanticKey, score.detail);
    const halfFull = parseHalfFullEntry(name);
    if (halfFull) return buildSemanticResult(name, "half_full", halfFull.semanticKey, halfFull.detail);
    const handicap = parseHandicapEntry(name);
    if (handicap) return buildSemanticResult(name, "handicap", handicap.semanticKey, handicap.detail);
    const total = parseTotalEntry(name);
    if (total) return buildSemanticResult(name, "total", total.semanticKey, total.detail);
    const result = parseResultEntry(name);
    if (result) return buildSemanticResult(name, "result", result.semanticKey, result.detail);
    return buildSemanticResult(name, "other", normalizeToken(name), null);
  };
  var normalizeEntryRecord = (entryInput, fallbackOdds = Number.NaN) => {
    const source = entryInput && typeof entryInput === "object" ? { ...entryInput } : {
      name: entryInput
    };
    const semantic = parseEntrySemantic(source.name || source.entry || "");
    const odds = Object.prototype.hasOwnProperty.call(source, "odds") ? toNumber(source.odds, Number.NaN) : toNumber(fallbackOdds, Number.NaN);
    return {
      ...source,
      name: semantic.name,
      odds,
      market_type: semantic.marketType,
      market_label: semantic.marketLabel,
      semantic_key: semantic.semanticKey,
      parse_detail: semantic.detail
    };
  };
  var normalizeEntries = (entriesInput, entryText = "", fallbackOdds = Number.NaN) => {
    if (Array.isArray(entriesInput) && entriesInput.length > 0) {
      return entriesInput.map((entry) => normalizeEntryRecord(entry, fallbackOdds)).filter((entry) => entry.name);
    }
    const rawText = normalizeEntryName(entryText);
    if (!rawText) return [];
    return rawText.split(/[|,]/).map((token) => token.trim()).filter(Boolean).map((name) => normalizeEntryRecord({ name, odds: fallbackOdds }, fallbackOdds)).filter((entry) => entry.name);
  };
  var getPrimaryEntryMarket = (entriesInput, entryText = "") => {
    const entries = normalizeEntries(entriesInput, entryText);
    if (entries.length === 0) {
      return {
        marketType: "other",
        marketLabel: getMarketMeta("other").label,
        semanticKey: ""
      };
    }
    const counts = /* @__PURE__ */ new Map();
    entries.forEach((entry, index) => {
      const marketType2 = String(entry.market_type || "").trim() || "other";
      if (!counts.has(marketType2)) {
        counts.set(marketType2, {
          count: 0,
          rank: getMarketMeta(marketType2).rank,
          firstIndex: index
        });
      }
      counts.get(marketType2).count += 1;
    });
    const best = [...counts.entries()].sort((a, b) => {
      if (b[1].count !== a[1].count) return b[1].count - a[1].count;
      if (a[1].rank !== b[1].rank) return a[1].rank - b[1].rank;
      return a[1].firstIndex - b[1].firstIndex;
    })[0];
    const marketType = best ? best[0] : "other";
    const firstEntry = entries.find((entry) => (entry.market_type || "other") === marketType) || entries[0];
    return {
      marketType,
      marketLabel: getMarketMeta(marketType).label,
      semanticKey: firstEntry?.semantic_key || ""
    };
  };

  // source/src/lib/atomicParlay.js
  var atomicParlay_exports = {};
  __export(atomicParlay_exports, {
    buildAtomicMatchProfile: () => buildAtomicMatchProfile,
    calcAtomicEquivalentOdds: () => calcAtomicEquivalentOdds,
    combineAtomicMatchProfiles: () => combineAtomicMatchProfiles,
    estimateEntryAnchorOdds: () => estimateEntryAnchorOdds,
    estimateEntryUnionProbability: () => estimateEntryUnionProbability,
    solveKellyFractionByAtomicDistribution: () => solveKellyFractionByAtomicDistribution
  });
  var EPS = 1e-9;
  var toNumber2 = (value, fallback = Number.NaN) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  var clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  var normalizeText = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  var RESULT_TOKEN_MAP = /* @__PURE__ */ new Map([
    ["w", "win"],
    ["win", "win"],
    ["home", "win"],
    ["homewin", "win"],
    ["h", "win"],
    ["主胜", "win"],
    ["主", "win"],
    ["胜", "win"],
    ["1", "win"],
    ["d", "draw"],
    ["draw", "draw"],
    ["x", "draw"],
    ["平", "draw"],
    ["平局", "draw"],
    ["0", "draw"],
    ["l", "lose"],
    ["lose", "lose"],
    ["away", "lose"],
    ["awaywin", "lose"],
    ["a", "lose"],
    ["客胜", "lose"],
    ["客", "lose"],
    ["负", "lose"],
    ["2", "lose"]
  ]);
  var RESULT_LABEL_MAP = {
    win: "主胜",
    draw: "平",
    lose: "客胜"
  };
  var normalizeOutcomeToken = (value) => RESULT_TOKEN_MAP.get(normalizeText(value)) || null;
  var parseOutcomeSetFromText = (rawValue) => {
    const text6 = String(rawValue || "").trim();
    if (!text6) return null;
    const compact = normalizeText(text6);
    const outcomes = /* @__PURE__ */ new Set();
    if (compact.includes("胜平") || compact.includes("平胜") || compact.includes("主不败") || compact.includes("1x") || compact.includes("x1") || compact.includes("winordraw") || compact.includes("draworwin") || compact.includes("homeordraw") || compact.includes("draworhome")) {
      outcomes.add("win");
      outcomes.add("draw");
    }
    if (compact.includes("平负") || compact.includes("负平") || compact.includes("客不败") || compact.includes("x2") || compact.includes("2x") || compact.includes("draworlose") || compact.includes("loseordraw") || compact.includes("draworaway") || compact.includes("awayordraw")) {
      outcomes.add("draw");
      outcomes.add("lose");
    }
    if (compact.includes("胜负") || compact.includes("负胜") || compact.includes("12") || compact.includes("21") || compact.includes("winorlose") || compact.includes("loseorwin") || compact.includes("homeoraway") || compact.includes("awayorhome")) {
      outcomes.add("win");
      outcomes.add("lose");
    }
    const tokenized = String(text6).toLowerCase().replace(/[()]/g, " ").replace(/[，,/|+&;、]/g, " ").replace(/或/g, " ").replace(/和/g, " ").replace(/or/gi, " ").split(/\s+/).filter(Boolean);
    tokenized.forEach((token) => {
      const outcome = normalizeOutcomeToken(token);
      if (outcome) outcomes.add(outcome);
    });
    if (outcomes.size === 0) {
      if (text6.includes("胜")) outcomes.add("win");
      if (text6.includes("平")) outcomes.add("draw");
      if (text6.includes("负")) outcomes.add("lose");
    }
    return outcomes.size > 0 ? outcomes : null;
  };
  var parseResultOutcomeSet = (entry) => {
    const marketType = String(entry?.market_type || "").trim();
    if (marketType && marketType !== "result" && marketType !== "other") return null;
    const semanticSet = parseOutcomeSetFromText(entry?.semantic_key);
    if (semanticSet) return semanticSet;
    return parseOutcomeSetFromText(entry?.name);
  };
  var normalizeAtomicEntries = (entriesInput) => {
    const rawEntries = Array.isArray(entriesInput) ? entriesInput : [];
    return rawEntries.map(
      (entry) => normalizeEntryRecord(
        {
          ...entry,
          name: entry?.name || entry?.entry || "",
          // A supplied entry must supply its own valid decimal odds. In
          // particular, never turn a malformed/empty quote into fallbackOdds.
          odds: Number(entry?.odds)
        },
        Number.NaN
      )
    );
  };
  var invalidProfile = (issues, entries = []) => ({
    valid: false,
    modelStatus: "invalid",
    issues,
    warnings: [],
    entries,
    states: [],
    expectedGross: Number.NaN,
    expectedReturn: Number.NaN,
    variance: Number.NaN,
    sigma: Number.NaN,
    hitProbability: Number.NaN,
    missProbability: Number.NaN,
    profitWinProbability: Number.NaN,
    conditionalOdds: Number.NaN,
    equivalentOdds: Number.NaN
  });
  var getEntryIssues = (entries) => entries.flatMap((entry, entryIndex) => {
    const issues = [];
    if (!entry.name) issues.push({ code: "missing_entry", entryIndex, message: `第 ${entryIndex + 1} 项缺少预测结果` });
    if (!Number.isFinite(entry.odds) || entry.odds <= 1) {
      issues.push({ code: "invalid_odds", entryIndex, message: `第 ${entryIndex + 1} 项赔率必须是大于 1 的数字` });
    }
    return issues;
  });
  var getOutcomeModel = (entries) => {
    const resultSets = entries.map(parseResultOutcomeSet);
    const resultModel = resultSets.every((set) => set?.size > 0);
    const sameMarket = entries.every((entry) => entry.market_type === entries[0]?.market_type);
    const categoricalMarket = sameMarket && ["score", "half_full"].includes(entries[0]?.market_type);
    const canonicalLine = (entry) => entry.parse_detail?.canonicalLine ?? entry.parse_detail?.line;
    const sameHandicap = sameMarket && entries[0]?.market_type === "handicap" && entries.every((entry) => canonicalLine(entry) === canonicalLine(entries[0]));
    const sameTotal = sameMarket && entries[0]?.market_type === "total" && entries.every((entry) => entry.parse_detail?.line === entries[0]?.parse_detail?.line);
    const knownCategorical = categoricalMarket || sameHandicap || sameTotal;
    const keys = entries.map((entry) => entry.semantic_key);
    const sets = resultModel ? resultSets : knownCategorical ? keys.map((key) => /* @__PURE__ */ new Set([key])) : null;
    const union = sets ? new Set(sets.flatMap((set) => [...set])) : /* @__PURE__ */ new Set();
    const disjoint = Boolean(sets && sets.reduce((n, set) => n + set.size, 0) === union.size);
    const totalComplete = sameTotal && (() => {
      const line = Number(entries[0]?.parse_detail?.line);
      const directions = new Set(entries.map((entry) => entry.parse_detail?.direction));
      return Number.isFinite(line) && Math.abs(line % 1) === 0.5 && directions.has("over") && directions.has("under");
    })();
    const complete = resultModel && union.size === 3 || totalComplete;
    const approximate = entries.length > 1 && (!sets || !disjoint);
    return { resultModel, sets, disjoint, complete, approximate };
  };
  var normalizeSplitWeights = (count, weightsInput) => {
    if (count <= 0) return [];
    const fallback = Array(count).fill(1 / count);
    if (!Array.isArray(weightsInput) || weightsInput.length !== count) return fallback;
    const safe = weightsInput.map((value) => Math.max(0, toNumber2(value, 0)));
    const sum = safe.reduce((acc, value) => acc + value, 0);
    if (sum <= EPS) return fallback;
    return safe.map((value) => value / sum);
  };
  var buildEntryDescriptors = (entries) => {
    const model = getOutcomeModel(entries);
    return entries.map((entry, idx) => {
      const atoms = model.sets ? model.sets[idx] : /* @__PURE__ */ new Set([`entry_${idx}`]);
      return {
        id: `entry-${idx + 1}`,
        index: idx,
        name: entry.name,
        odds: entry.odds,
        atoms,
        implied: clamp(1 / entry.odds, 1e-4, 0.995)
      };
    });
  };
  var buildAtomWeights = (descriptors) => {
    const atomWeightMap = /* @__PURE__ */ new Map();
    descriptors.forEach((descriptor) => {
      const atomCount = Math.max(1, descriptor.atoms.size);
      const share = descriptor.implied / atomCount;
      descriptor.atoms.forEach((atom) => {
        atomWeightMap.set(atom, (atomWeightMap.get(atom) || 0) + share);
      });
    });
    const atomKeys = [...atomWeightMap.keys()];
    if (atomKeys.length === 0) return /* @__PURE__ */ new Map();
    const totalWeight = atomKeys.reduce((sum, atom) => sum + (atomWeightMap.get(atom) || 0), 0);
    if (totalWeight <= EPS) {
      const equal = 1 / atomKeys.length;
      const equalMap = /* @__PURE__ */ new Map();
      atomKeys.forEach((atom) => equalMap.set(atom, equal));
      return equalMap;
    }
    const normalizedMap = /* @__PURE__ */ new Map();
    atomKeys.forEach((atom) => normalizedMap.set(atom, (atomWeightMap.get(atom) || 0) / totalWeight));
    return normalizedMap;
  };
  var estimateEntryUnionProbability = (entriesInput, fallbackOdds = 2.5) => {
    const fallback = clamp(1 / Math.max(1.01, toNumber2(fallbackOdds, 2.5)), 0.02, 0.95);
    const entries = normalizeAtomicEntries(entriesInput, fallbackOdds);
    if (entries.length === 0) return fallback;
    if (getEntryIssues(entries).length > 0) return Number.NaN;
    const model = getOutcomeModel(entries);
    if (model.complete) return 1;
    if (model.disjoint) return clamp(entries.reduce((sum, entry) => sum + 1 / entry.odds, 0), 0, 1);
    const missProbability = entries.reduce((miss, entry) => {
      const implied = clamp(1 / entry.odds, 1e-3, 0.97);
      return miss * (1 - implied);
    }, 1);
    return clamp(1 - missProbability, 0.02, 0.95);
  };
  var estimateEntryAnchorOdds = (entriesInput, fallbackOdds = 2.5) => {
    const unionProbability = estimateEntryUnionProbability(entriesInput, fallbackOdds);
    return Math.max(1.01, 1 / Math.max(unionProbability, 1e-3));
  };
  var buildAtomicMatchProfile = ({
    entries: entriesInput,
    unionProbability,
    fallbackOdds = 2.5,
    splitWeights
  } = {}) => {
    const normalizedEntries = normalizeAtomicEntries(entriesInput, fallbackOdds);
    const issues = getEntryIssues(normalizedEntries);
    if (normalizedEntries.length === 0 && !(Number.isFinite(Number(fallbackOdds)) && Number(fallbackOdds) > 1)) {
      issues.push({ code: "invalid_odds", message: "缺少有效赔率，无法计算收益分布" });
    }
    if (issues.length > 0) return invalidProfile(issues, normalizedEntries);
    const safeEntries = normalizedEntries.length > 0 ? normalizedEntries : [
      normalizeEntryRecord(
        {
          name: "default",
          odds: Math.max(1.01, toNumber2(fallbackOdds, 2.5))
        },
        fallbackOdds
      )
    ];
    const descriptors = buildEntryDescriptors(safeEntries);
    const model = getOutcomeModel(safeEntries);
    const weights = normalizeSplitWeights(descriptors.length, splitWeights);
    const baseUnionProbability = model.complete ? 1 : Number.isFinite(toNumber2(unionProbability, Number.NaN)) ? clamp(toNumber2(unionProbability, Number.NaN), 0, 1) : estimateEntryUnionProbability(safeEntries, fallbackOdds);
    const atomWeights = buildAtomWeights(descriptors);
    const outcomeStates = [...atomWeights.entries()].map(([atom, atomWeight]) => {
      const probability = clamp(baseUnionProbability * atomWeight, 0, 1);
      const gross = descriptors.reduce((sum, descriptor, idx) => {
        if (!descriptor.atoms.has(atom)) return sum;
        return sum + weights[idx] * descriptor.odds;
      }, 0);
      return {
        id: atom,
        label: RESULT_LABEL_MAP[atom] || atom,
        probability,
        gross,
        net: gross - 1,
        isMiss: false
      };
    }).filter((state) => state.probability > EPS);
    const missProbability = clamp(1 - baseUnionProbability, 0, 1);
    const states = [...outcomeStates];
    if (missProbability > EPS) {
      states.push({
        id: "miss",
        label: "miss",
        probability: missProbability,
        gross: 0,
        net: -1,
        isMiss: true
      });
    }
    const totalProbability = states.reduce((sum, state) => sum + state.probability, 0);
    const normalizedStates = totalProbability > EPS ? states.map((state) => ({
      ...state,
      probability: state.probability / totalProbability
    })) : [
      {
        id: "miss",
        label: "miss",
        probability: 1,
        gross: 0,
        net: -1,
        isMiss: true
      }
    ];
    const expectedGross = normalizedStates.reduce((sum, state) => sum + state.probability * state.gross, 0);
    const expectedReturn = expectedGross - 1;
    const variance = normalizedStates.reduce((sum, state) => {
      const diff = state.net - expectedReturn;
      return sum + state.probability * diff * diff;
    }, 0);
    const hitProbability = normalizedStates.reduce((sum, state) => sum + (state.isMiss ? 0 : state.probability), 0);
    const profitWinProbability = normalizedStates.reduce((sum, state) => sum + (state.net > 0 ? state.probability : 0), 0);
    const conditionalGross = hitProbability > EPS ? normalizedStates.reduce((sum, state) => sum + (state.isMiss ? 0 : state.probability * state.gross), 0) / hitProbability : 0;
    const entryHitProbabilities = descriptors.map(
      (descriptor) => normalizedStates.reduce((sum, state) => {
        if (state.isMiss) return sum;
        return descriptor.atoms.has(state.id) ? sum + state.probability : sum;
      }, 0)
    );
    return {
      valid: true,
      modelVersion: "atomic-v2",
      modelStatus: model.approximate ? "approximate" : "exact",
      issues: [],
      warnings: model.approximate ? ["同场混合市场或重叠选项的联合概率尚未建模；当前仅为近似，不用于自动仓位或风险模拟。"] : [],
      entries: descriptors.map((descriptor, idx) => ({
        id: descriptor.id,
        name: descriptor.name,
        odds: descriptor.odds,
        splitWeight: weights[idx],
        atomKeys: [...descriptor.atoms],
        hitProbability: entryHitProbabilities[idx] || 0
      })),
      states: normalizedStates,
      hitProbability,
      missProbability: Math.max(0, 1 - hitProbability),
      profitWinProbability,
      expectedGross,
      expectedReturn,
      variance: Math.max(variance, 0),
      sigma: Math.sqrt(Math.max(variance, 0)),
      conditionalOdds: conditionalGross,
      equivalentOdds: conditionalGross,
      fallbackOdds: Math.max(1.01, toNumber2(fallbackOdds, 2.5))
    };
  };
  var combineAtomicMatchProfiles = (profilesInput) => {
    const profiles = Array.isArray(profilesInput) ? profilesInput.filter(Boolean) : [];
    const invalid = profiles.find((profile) => profile.valid === false);
    if (invalid) return invalidProfile(invalid.issues || [{ code: "invalid_profile", message: "存在无效场次分布" }]);
    if (profiles.length === 0) {
      return {
        states: [{ probability: 1, gross: 0, net: -1 }],
        expectedGross: 0,
        expectedReturn: -1,
        variance: 0,
        sigma: 0,
        hitProbability: 0,
        profitWinProbability: 0,
        conditionalOdds: 0,
        equivalentOdds: 0
      };
    }
    let distribution = [{ probability: 1, gross: 1 }];
    profiles.forEach((profile) => {
      const nextMap = /* @__PURE__ */ new Map();
      const states2 = Array.isArray(profile.states) ? profile.states : [];
      distribution.forEach((baseState) => {
        states2.forEach((state) => {
          const probability = baseState.probability * state.probability;
          if (probability <= EPS) return;
          const gross = baseState.gross * state.gross;
          const key = gross.toFixed(8);
          if (!nextMap.has(key)) {
            nextMap.set(key, {
              probability: 0,
              gross
            });
          }
          nextMap.get(key).probability += probability;
        });
      });
      distribution = [...nextMap.values()];
    });
    const totalProbability = distribution.reduce((sum, state) => sum + state.probability, 0);
    const states = totalProbability > EPS ? distribution.map((state) => ({
      probability: state.probability / totalProbability,
      gross: state.gross,
      net: state.gross - 1
    })).filter((state) => state.probability > EPS) : [{ probability: 1, gross: 0, net: -1 }];
    const expectedGross = states.reduce((sum, state) => sum + state.probability * state.gross, 0);
    const expectedReturn = expectedGross - 1;
    const variance = states.reduce((sum, state) => {
      const diff = state.net - expectedReturn;
      return sum + state.probability * diff * diff;
    }, 0);
    const hitProbability = states.reduce((sum, state) => sum + (state.gross > 0 ? state.probability : 0), 0);
    const profitWinProbability = states.reduce((sum, state) => sum + (state.net > 0 ? state.probability : 0), 0);
    const conditionalOdds = hitProbability > EPS ? states.reduce((sum, state) => sum + (state.gross > 0 ? state.probability * state.gross : 0), 0) / hitProbability : 0;
    return {
      valid: true,
      modelVersion: "atomic-v2",
      modelStatus: profiles.some((profile) => profile.modelStatus === "approximate") ? "approximate" : "exact",
      issues: [],
      warnings: [...new Set(profiles.flatMap((profile) => profile.warnings || []))],
      states,
      expectedGross,
      expectedReturn,
      variance: Math.max(variance, 0),
      sigma: Math.sqrt(Math.max(variance, 0)),
      hitProbability,
      profitWinProbability,
      conditionalOdds,
      equivalentOdds: conditionalOdds
    };
  };
  var solveKellyFractionByAtomicDistribution = (statesInput, maxFraction = 0.95) => {
    const states = Array.isArray(statesInput) ? statesInput.map((state) => ({
      probability: clamp(toNumber2(state?.probability, 0), 0, 1),
      net: toNumber2(state?.net, Number.NaN)
    })).filter((state) => state.probability > EPS && Number.isFinite(state.net)) : [];
    if (states.length === 0) return 0;
    const safeMaxFraction = clamp(toNumber2(maxFraction, 0.95), 0, 0.95);
    if (safeMaxFraction <= 0) return 0;
    const evalObjective = (fraction) => {
      let score = 0;
      for (let i = 0; i < states.length; i += 1) {
        const growth = 1 + fraction * states[i].net;
        if (growth <= 1e-9) return Number.NEGATIVE_INFINITY;
        score += states[i].probability * Math.log(growth);
      }
      return score;
    };
    let bestFraction = 0;
    let bestScore = evalObjective(0);
    const coarseStep = 0.02;
    for (let fraction = coarseStep; fraction <= safeMaxFraction + EPS; fraction += coarseStep) {
      const score = evalObjective(fraction);
      if (score > bestScore) {
        bestScore = score;
        bestFraction = fraction;
      }
    }
    let step = coarseStep / 5;
    for (let iter = 0; iter < 4; iter += 1) {
      const low = Math.max(0, bestFraction - step * 2);
      const high = Math.min(safeMaxFraction, bestFraction + step * 2);
      for (let fraction = low; fraction <= high + EPS; fraction += step) {
        const score = evalObjective(fraction);
        if (score > bestScore) {
          bestScore = score;
          bestFraction = fraction;
        }
      }
      step *= 0.5;
    }
    return clamp(bestFraction, 0, safeMaxFraction);
  };
  var calcAtomicEquivalentOdds = (entriesInput, fallbackOdds = 2.5) => {
    const unionProbability = estimateEntryUnionProbability(entriesInput, fallbackOdds);
    const profile = buildAtomicMatchProfile({
      entries: entriesInput,
      unionProbability,
      fallbackOdds
    });
    return profile.valid === false ? Number.NaN : toNumber2(profile.conditionalOdds, Number.NaN);
  };

  // source/src/lib/investmentIdentity.js
  var text = (value) => String(value ?? "").trim();
  var buildSelectionKey = (match = {}) => {
    const entries = normalizeEntries(match.entries, match.entry_text || match.entry || "", match.odds);
    if (entries.length === 0) return "";
    return [...new Set(entries.map((entry) => `${entry.market_type}:${entry.semantic_key}`))].sort().join("|");
  };
  var getMatchSourceIdentity = (match = {}, investmentId = "") => ({
    source_investment_id: text(match.source_investment_id || match.sourceInvestmentId || investmentId),
    source_match_id: text(match.source_match_id || match.sourceMatchId || match.id),
    event_id: text(match.event_id || match.eventId),
    selection_key: buildSelectionKey(match) || text(match.selection_key || match.selectionKey)
  });
  var referenceKey = (identity) => identity.source_investment_id && identity.source_match_id && identity.selection_key ? JSON.stringify([identity.source_investment_id, identity.source_match_id, identity.selection_key]) : "";
  var eventKey = (identity) => identity.event_id && identity.selection_key ? JSON.stringify([identity.event_id, identity.selection_key]) : "";
  var getSelectionIdentityKey = (match, investmentId = "") => {
    const identity = getMatchSourceIdentity(match, investmentId);
    return referenceKey(identity) || eventKey(identity);
  };
  var buildSettledSelectionResolver = (investments = []) => {
    const own = /* @__PURE__ */ new Map();
    const source = /* @__PURE__ */ new Map();
    const events = /* @__PURE__ */ new Map();
    const append = (map, key, row) => {
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    };
    investments.filter((investment) => !investment.is_archived && ["win", "lose"].includes(investment.status)).forEach((investment) => {
      ;
      (investment.matches || []).forEach((match) => {
        const identity = getMatchSourceIdentity(match, investment.id);
        const row = { investment, match, identity, isCorrect: match.is_correct };
        append(own, referenceKey({ ...identity, source_investment_id: text(investment.id), source_match_id: text(match.id) }), row);
        append(source, referenceKey(identity), row);
        append(events, eventKey(identity), row);
      });
    });
    const unique = (rows) => rows?.length === 1 ? rows[0] : null;
    return (match, investmentId = "") => {
      const identity = getMatchSourceIdentity(match, investmentId);
      const ref = referenceKey(identity);
      if (ref && own.has(ref)) return unique(own.get(ref));
      if (ref && source.has(ref)) return unique(source.get(ref));
      return unique(events.get(eventKey(identity)));
    };
  };

  // source/src/lib/investmentForecast.js
  var FORECAST_SCHEMA_VERSION = 1;
  var MEAN_LEG_RATING_SEMANTICS = "mean_calibrated_leg_probability";
  var isValidDecimalOdds = (value) => {
    const number3 = Number(value);
    return value !== "" && value !== null && value !== void 0 && Number.isFinite(number3) && number3 > 1;
  };
  var capRecommendedStake = (amount, poolCapital, riskCapRatio) => {
    const capital = Number.isFinite(Number(poolCapital)) ? Math.max(0, Number(poolCapital)) : 0;
    const ratio = Number.isFinite(Number(riskCapRatio)) ? Math.max(0, Number(riskCapRatio)) : 0;
    const candidate = Number.isFinite(Number(amount)) ? Math.max(0, Math.round(Number(amount))) : 0;
    return Math.min(candidate, Math.max(0, Math.floor(capital * ratio)));
  };
  var snapshotStates = (states) => {
    if (!Array.isArray(states) || states.length === 0) return null;
    if (states.some((state) => !state || typeof state !== "object" || !Number.isFinite(state.probability) || state.probability < 0 || state.probability > 1 || !Number.isFinite(state.gross) || state.gross < 0)) return null;
    const rows = states.map((state) => ({ probability: state.probability, gross: state.gross, net: state.gross - 1 }));
    const total = rows.reduce((sum, state) => sum + state.probability, 0);
    if (Math.abs(total - 1) > 1e-6) return null;
    return rows;
  };
  var buildForecastSnapshot = ({ combinedProfile, legs = [], generatedAt, modelVersion = "atomic-v2", calibrationMetadata = null }) => {
    const states = snapshotStates(combinedProfile?.states);
    if (!states || combinedProfile?.valid === false || !generatedAt || !Number.isFinite(Date.parse(generatedAt))) return null;
    return {
      schema_version: FORECAST_SCHEMA_VERSION,
      model_version: modelVersion,
      generated_at: generatedAt,
      calibration: calibrationMetadata ? JSON.parse(JSON.stringify(calibrationMetadata)) : { stage: "unknown" },
      expected_rating_semantics: MEAN_LEG_RATING_SEMANTICS,
      model_status: combinedProfile.modelStatus || "unspecified",
      states,
      ticket_hit_probability: states.reduce((sum, state) => sum + (state.gross > 0 ? state.probability : 0), 0),
      ticket_profit_probability: states.reduce((sum, state) => sum + (state.gross > 1 ? state.probability : 0), 0),
      expected_return: states.reduce((sum, state) => sum + state.probability * state.net, 0),
      legs: legs.map(({ match, profile, investmentId }) => ({
        ...getMatchSourceIdentity(match, investmentId),
        calibrated_probability: Number(profile?.hitProbability),
        raw_conf: Number.isFinite(match?.conf) ? match.conf : null,
        entries: (match?.entries || []).map((entry) => ({ name: entry.name, odds: entry.odds })),
        input: {
          conf: match?.conf,
          mode: match?.mode,
          odds: match?.odds,
          home_team: match?.home_team ?? match?.homeTeam,
          away_team: match?.away_team ?? match?.awayTeam,
          tys_home: match?.tys_home ?? match?.tysHome,
          tys_away: match?.tys_away ?? match?.tysAway,
          fid: match?.fid,
          fse_home: match?.fse_home ?? match?.fseHome,
          fse_away: match?.fse_away ?? match?.fseAway,
          entries: (match?.entries || []).map((entry) => ({ name: entry.name, odds: entry.odds }))
        },
        model_status: profile?.modelStatus || "unspecified",
        states: snapshotStates(profile?.states)
      }))
    };
  };
  var addSettlementTimestamps = (previous, next, writtenAt) => {
    if (!["win", "lose"].includes(next?.status) || !Number.isFinite(Date.parse(writtenAt))) return next;
    const firstSettlement = previous?.status === "pending";
    const oldMatches = new Map((previous?.matches || []).map((match) => [match.id, match]));
    const labelChanged = (match) => {
      const old = oldMatches.get(match.id);
      return !old || ["results", "is_correct", "match_rating", "match_rep"].some((key) => old[key] !== match[key]);
    };
    const corrected = previous && (previous.status !== next.status || previous.profit !== next.profit || previous.revenues !== next.revenues || (next.matches || []).some(labelChanged));
    if (!firstSettlement && !corrected) return next;
    return {
      ...next,
      settled_at: next.settled_at || (firstSettlement ? writtenAt : void 0),
      outcome_available_at: writtenAt,
      matches: (next.matches || []).map((match) => ({
        ...match,
        outcome_available_at: firstSettlement || labelChanged(match) ? writtenAt : match.outcome_available_at
      }))
    };
  };

  // source/src/data/genesisBundle.json
  var genesisBundle_default = {
    version: 1,
    source: "G4 model running statistics v3.4 (2026-01-04; original source recorded in the frozen archive)",
    generated_at: "2026-02-04T00:00:00.000Z",
    system_config: {
      initialCapital: 600,
      riskCapRatio: 0.12,
      defaultOdds: 2.5,
      kellyDivisor: 4,
      weightConf: 0.5,
      weightTys: 0.25,
      weightMode: 0.2,
      weightFid: 0.05,
      weightOdds: 0.06,
      weightFse: 0.07
    },
    team_profiles: [
      {
        teamId: "gen_team_1",
        teamName: "曼城",
        abbreviations: [
          "曼城"
        ],
        totalSamples: 16,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_2",
        teamName: "阿森纳",
        abbreviations: [
          "阿森纳"
        ],
        totalSamples: 14,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_3",
        teamName: "利物浦",
        abbreviations: [
          "利物浦"
        ],
        totalSamples: 13,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_4",
        teamName: "切尔西",
        abbreviations: [
          "切尔西"
        ],
        totalSamples: 11,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_5",
        teamName: "狼队",
        abbreviations: [
          "狼队"
        ],
        totalSamples: 11,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_6",
        teamName: "桑德兰",
        abbreviations: [
          "桑德兰"
        ],
        totalSamples: 8,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_7",
        teamName: "热刺",
        abbreviations: [
          "热刺"
        ],
        totalSamples: 8,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_8",
        teamName: "纽卡",
        abbreviations: [
          "纽卡"
        ],
        totalSamples: 8,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_9",
        teamName: "曼联",
        abbreviations: [
          "曼联"
        ],
        totalSamples: 7,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_10",
        teamName: "伯恩茅斯",
        abbreviations: [
          "伯恩茅斯"
        ],
        totalSamples: 5,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_11",
        teamName: "利兹联",
        abbreviations: [
          "利兹联"
        ],
        totalSamples: 5,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_12",
        teamName: "水晶宫",
        abbreviations: [
          "水晶宫"
        ],
        totalSamples: 5,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_13",
        teamName: "埃弗顿",
        abbreviations: [
          "埃弗顿"
        ],
        totalSamples: 4,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_14",
        teamName: "富勒姆",
        abbreviations: [
          "富勒姆"
        ],
        totalSamples: 4,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_15",
        teamName: "布伦特福德",
        abbreviations: [
          "布伦特福德"
        ],
        totalSamples: 4,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_16",
        teamName: "拜仁",
        abbreviations: [
          "拜仁"
        ],
        totalSamples: 4,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_17",
        teamName: "西汉姆",
        abbreviations: [
          "西汉姆"
        ],
        totalSamples: 4,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_18",
        teamName: "伯恩利",
        abbreviations: [
          "伯恩利"
        ],
        totalSamples: 3,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_19",
        teamName: "巴萨",
        abbreviations: [
          "巴萨"
        ],
        totalSamples: 3,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_20",
        teamName: "皇马",
        abbreviations: [
          "皇马"
        ],
        totalSamples: 3,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_21",
        teamName: "诺丁汉森林",
        abbreviations: [
          "诺丁汉森林"
        ],
        totalSamples: 3,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_22",
        teamName: "那不勒斯",
        abbreviations: [
          "那不勒斯"
        ],
        totalSamples: 3,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_23",
        teamName: "阿斯顿维拉",
        abbreviations: [
          "阿斯顿维拉"
        ],
        totalSamples: 3,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_24",
        teamName: "博洛尼亚",
        abbreviations: [
          "博洛尼亚"
        ],
        totalSamples: 2,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_25",
        teamName: "巴黎",
        abbreviations: [
          "巴黎"
        ],
        totalSamples: 2,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_26",
        teamName: "泰u23",
        abbreviations: [
          "泰u23"
        ],
        totalSamples: 2,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_27",
        teamName: "维拉",
        abbreviations: [
          "维拉"
        ],
        totalSamples: 2,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_28",
        teamName: "西汉姆联",
        abbreviations: [
          "西汉姆联"
        ],
        totalSamples: 2,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_29",
        teamName: "马竞",
        abbreviations: [
          "马竞"
        ],
        totalSamples: 2,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_30",
        teamName: "黄潜",
        abbreviations: [
          "黄潜"
        ],
        totalSamples: 2,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_31",
        teamName: "伯恩茅斯",
        abbreviations: [
          "伯恩茅斯"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_32",
        teamName: "利雅得新月",
        abbreviations: [
          "利雅得新月"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_33",
        teamName: "加拉塔萨雷",
        abbreviations: [
          "加拉塔萨雷"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_34",
        teamName: "勒沃库森",
        abbreviations: [
          "勒沃库森"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_35",
        teamName: "博德闪耀",
        abbreviations: [
          "博德闪耀"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_36",
        teamName: "卡拉巴赫",
        abbreviations: [
          "卡拉巴赫"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_37",
        teamName: "吉马良斯",
        abbreviations: [
          "吉马良斯"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_38",
        teamName: "哥本哈根",
        abbreviations: [
          "哥本哈根"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_39",
        teamName: "国u23",
        abbreviations: [
          "国u23"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_40",
        teamName: "国际米兰",
        abbreviations: [
          "国际米兰"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_41",
        teamName: "圣吉尔",
        abbreviations: [
          "圣吉尔"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_42",
        teamName: "埃因霍温",
        abbreviations: [
          "埃因霍温"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_43",
        teamName: "奥格斯堡",
        abbreviations: [
          "奥格斯堡"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_44",
        teamName: "布拉格",
        abbreviations: [
          "布拉格"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_45",
        teamName: "布鲁日",
        abbreviations: [
          "布鲁日"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_46",
        teamName: "法兰克福",
        abbreviations: [
          "法兰克福"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_47",
        teamName: "波尔图",
        abbreviations: [
          "波尔图"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_48",
        teamName: "澳u23",
        abbreviations: [
          "澳u23"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_49",
        teamName: "热那亚",
        abbreviations: [
          "热那亚"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_50",
        teamName: "米兰",
        abbreviations: [
          "米兰"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_51",
        teamName: "葡体",
        abbreviations: [
          "葡体"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_52",
        teamName: "达马克",
        abbreviations: [
          "达马克"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_53",
        teamName: "阿尔维卡",
        abbreviations: [
          "阿尔维卡"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_54",
        teamName: "阿拉图木",
        abbreviations: [
          "阿拉图木"
        ],
        totalSamples: 1,
        avgRep: 0.5
      },
      {
        teamId: "gen_team_55",
        teamName: "阿拉维斯",
        abbreviations: [
          "阿拉维斯"
        ],
        totalSamples: 1,
        avgRep: 0.5
      }
    ],
    investments: [
      {
        id: "gen_inv_1",
        created_at: "2025-11-01T12:00:00.000Z",
        parlay_size: 1,
        inputs: 16,
        suggested_amount: 16,
        expected_rating: 0.56,
        combined_odds: 32,
        status: "lose",
        revenues: 0,
        profit: -16,
        actual_rating: 0.2,
        rep: null,
        remarks: "埃梅里和大马丁nmsl",
        matches: [
          {
            id: "gen_match_1_1",
            home_team: "利物浦",
            away_team: "维拉",
            entries: [
              {
                name: "1-2",
                odds: 32
              },
              {
                name: "1-3",
                odds: 32
              }
            ],
            entry_text: "1-2, 1-3",
            odds: 32,
            conf: 0.6,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "2-0",
            is_correct: false,
            match_rating: 0.2,
            match_rep: null,
            post_note: "埃梅里和大马丁nmsl"
          }
        ]
      },
      {
        id: "gen_inv_2",
        created_at: "2025-11-07T12:00:00.000Z",
        parlay_size: 2,
        inputs: 24,
        suggested_amount: 24,
        expected_rating: 0.52,
        combined_odds: 42.5,
        status: "lose",
        revenues: 0,
        profit: -24,
        actual_rating: 0.2,
        rep: null,
        remarks: "",
        matches: [
          {
            id: "gen_match_2_1",
            home_team: "曼城",
            away_team: "利物浦",
            entries: [
              {
                name: "2-1",
                odds: 8.5
              },
              {
                name: "2-2",
                odds: 8.5
              }
            ],
            entry_text: "2-1, 2-2",
            odds: 8.5,
            conf: 0.4,
            mode: "常规",
            tys_home: "M",
            tys_away: "M",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "3-0",
            is_correct: false,
            match_rating: 0.2,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_2_2",
            home_team: "桑德兰",
            away_team: "阿森纳",
            entries: [
              {
                name: "0-1",
                odds: 5
              },
              {
                name: "0-2",
                odds: 5
              }
            ],
            entry_text: "0-1, 0-2",
            odds: 5,
            conf: 0.6,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "2-2",
            is_correct: false,
            match_rating: 0.2,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_3",
        created_at: "2025-11-26T12:00:00.000Z",
        parlay_size: 1,
        inputs: 24,
        suggested_amount: 24,
        expected_rating: 0.58,
        combined_odds: 6.5,
        status: "lose",
        revenues: 0,
        profit: -24,
        actual_rating: 0.4,
        rep: null,
        remarks: "",
        matches: [
          {
            id: "gen_match_3_1",
            home_team: "阿森纳",
            away_team: "拜仁",
            entries: [
              {
                name: "1-1",
                odds: 6.5
              }
            ],
            entry_text: "1-1",
            odds: 6.5,
            conf: 0.6,
            mode: "半彩票半保险",
            tys_home: "L",
            tys_away: "L",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "3-1",
            is_correct: false,
            match_rating: 0.4,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_4",
        created_at: "2025-11-30T12:00:00.000Z",
        parlay_size: 1,
        inputs: 16,
        suggested_amount: 16,
        expected_rating: 0.52,
        combined_odds: 6,
        status: "win",
        revenues: 96,
        profit: 80,
        actual_rating: 0.8,
        rep: null,
        remarks: "第一次发国难财了",
        matches: [
          {
            id: "gen_match_4_1",
            home_team: "切尔西",
            away_team: "阿森纳",
            entries: [
              {
                name: "1-1",
                odds: 6
              }
            ],
            entry_text: "1-1",
            odds: 6,
            conf: 0.6,
            mode: "保险产品",
            tys_home: "H",
            tys_away: "H",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "1-1",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: "第一次发国难财了"
          }
        ]
      },
      {
        id: "gen_inv_5",
        created_at: "2025-11-30T12:00:00.000Z",
        parlay_size: 1,
        inputs: 8,
        suggested_amount: 8,
        expected_rating: 0.47,
        combined_odds: 2.06,
        status: "lose",
        revenues: 0,
        profit: -8,
        actual_rating: 0.4,
        rep: null,
        remarks: "",
        matches: [
          {
            id: "gen_match_5_1",
            home_team: "切尔西",
            away_team: "阿森纳",
            entries: [
              {
                name: "lose",
                odds: 2.06
              }
            ],
            entry_text: "lose",
            odds: 2.06,
            conf: 0.4,
            mode: "常规",
            tys_home: "H",
            tys_away: "H",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "draw",
            is_correct: false,
            match_rating: 0.4,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_6",
        created_at: "2025-12-06T12:00:00.000Z",
        parlay_size: 1,
        inputs: 10,
        suggested_amount: 10,
        expected_rating: 0.68,
        combined_odds: 1.14,
        status: "lose",
        revenues: 0,
        profit: -10,
        actual_rating: 0.8,
        rep: null,
        remarks: "",
        matches: [
          {
            id: "gen_match_6_1",
            home_team: "曼城",
            away_team: "桑德兰",
            entries: [
              {
                name: "win",
                odds: 1.14
              }
            ],
            entry_text: "win",
            odds: 1.14,
            conf: 0.8,
            mode: "半彩票半保险",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_7",
        created_at: "2025-12-06T12:00:00.000Z",
        parlay_size: 1,
        inputs: 16,
        suggested_amount: 16,
        expected_rating: 0.48,
        combined_odds: 24,
        status: "lose",
        revenues: 0,
        profit: -16,
        actual_rating: 0.01,
        rep: null,
        remarks: "",
        matches: [
          {
            id: "gen_match_7_1",
            home_team: "曼城",
            away_team: "桑德兰",
            entries: [
              {
                name: "2-2",
                odds: 24
              }
            ],
            entry_text: "2-2",
            odds: 24,
            conf: 0.2,
            mode: "赌一把",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "3-0",
            is_correct: false,
            match_rating: 0.01,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_8",
        created_at: "2025-12-10T12:00:00.000Z",
        parlay_size: 2,
        inputs: 16,
        suggested_amount: 16,
        expected_rating: 0.6,
        combined_odds: 4.72,
        status: "lose",
        revenues: 0,
        profit: -16,
        actual_rating: 0.7,
        rep: null,
        remarks: "666 瓜瓜居然没轮换",
        matches: [
          {
            id: "gen_match_8_1",
            home_team: "布鲁日",
            away_team: "阿森纳",
            entries: [
              {
                name: "lose",
                odds: 1.24
              }
            ],
            entry_text: "lose",
            odds: 1.24,
            conf: 0.8,
            mode: "常规",
            tys_home: "L",
            tys_away: "L",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_8_2",
            home_team: "皇马",
            away_team: "曼城",
            entries: [
              {
                name: "draw",
                odds: 3.81
              }
            ],
            entry_text: "draw",
            odds: 3.81,
            conf: 0.6,
            mode: "常规",
            tys_home: "M",
            tys_away: "M",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: false,
            match_rating: 0.6,
            match_rep: null,
            post_note: "666 瓜瓜居然没轮换"
          }
        ]
      },
      {
        id: "gen_inv_9",
        created_at: "2025-12-14T12:00:00.000Z",
        parlay_size: 2,
        inputs: 24,
        suggested_amount: 24,
        expected_rating: 0.59,
        combined_odds: 3.14,
        status: "win",
        revenues: 75.36,
        profit: 51.36,
        actual_rating: 0.8,
        rep: null,
        remarks: "",
        matches: [
          {
            id: "gen_match_9_1",
            home_team: "水晶宫",
            away_team: "曼城",
            entries: [
              {
                name: "lose",
                odds: 1.68
              }
            ],
            entry_text: "lose",
            odds: 1.68,
            conf: 0.6,
            mode: "半彩票半保险",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_9_2",
            home_team: "西汉姆",
            away_team: "阿斯顿维拉",
            entries: [
              {
                name: "lose",
                odds: 1.87
              }
            ],
            entry_text: "lose",
            odds: 1.87,
            conf: 0.6,
            mode: "半彩票半保险",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_10",
        created_at: "2025-12-14T12:00:00.000Z",
        parlay_size: 2,
        inputs: 24,
        suggested_amount: 24,
        expected_rating: 0.64,
        combined_odds: 2.55,
        status: "win",
        revenues: 61.32,
        profit: 37.32,
        actual_rating: 0.8,
        rep: null,
        remarks: "",
        matches: [
          {
            id: "gen_match_10_1",
            home_team: "水晶宫",
            away_team: "曼城",
            entries: [
              {
                name: "lose",
                odds: 1.68
              }
            ],
            entry_text: "lose",
            odds: 1.68,
            conf: 0.6,
            mode: "半彩票半保险",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_10_2",
            home_team: "阿拉维斯",
            away_team: "皇马",
            entries: [
              {
                name: "lose",
                odds: 1.52
              }
            ],
            entry_text: "lose",
            odds: 1.52,
            conf: 0.8,
            mode: "半彩票半保险",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_11",
        created_at: "2025-12-20T12:00:00.000Z",
        parlay_size: 1,
        inputs: 12,
        suggested_amount: 12,
        expected_rating: 0.46,
        combined_odds: 6.6,
        status: "lose",
        revenues: 0,
        profit: -12,
        actual_rating: 0.01,
        rep: null,
        remarks: "",
        matches: [
          {
            id: "gen_match_11_1",
            home_team: "埃弗顿",
            away_team: "阿森纳",
            entries: [
              {
                name: "1-1",
                odds: 6.6
              }
            ],
            entry_text: "1-1",
            odds: 6.6,
            conf: 0.2,
            mode: "保险产品",
            tys_home: "/",
            tys_away: "/",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "0-1",
            is_correct: false,
            match_rating: 0.01,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_12",
        created_at: "2025-12-20T12:00:00.000Z",
        parlay_size: 2,
        inputs: 28,
        suggested_amount: 28,
        expected_rating: 0.63,
        combined_odds: 3.05,
        status: "lose",
        revenues: 0,
        profit: -28,
        actual_rating: 0.65,
        rep: null,
        remarks: "妈的伯恩茅斯能被伯恩利绝平",
        matches: [
          {
            id: "gen_match_12_1",
            home_team: "曼城",
            away_team: "西汉姆",
            entries: [
              {
                name: "-2 win",
                odds: 2.21
              }
            ],
            entry_text: "-2 win",
            odds: 2.21,
            conf: 0.7,
            mode: "半彩票半保险",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "-2 win",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_12_2",
            home_team: "伯恩茅斯",
            away_team: "伯恩利",
            entries: [
              {
                name: "win",
                odds: 1.38
              }
            ],
            entry_text: "win",
            odds: 1.38,
            conf: 0.6,
            mode: "半彩票半保险",
            tys_home: "L",
            tys_away: "L",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "draw",
            is_correct: false,
            match_rating: 0.5,
            match_rep: null,
            post_note: "妈的伯恩茅斯能被伯恩利绝平"
          }
        ]
      },
      {
        id: "gen_inv_13",
        created_at: "2025-12-20T12:00:00.000Z",
        parlay_size: 2,
        inputs: 22,
        suggested_amount: 22,
        expected_rating: 0.65,
        combined_odds: 6.49,
        status: "win",
        revenues: 142.72,
        profit: 120.72,
        actual_rating: 0.8,
        rep: null,
        remarks: "",
        matches: [
          {
            id: "gen_match_13_1",
            home_team: "纽卡",
            away_team: "切尔西",
            entries: [
              {
                name: "draw",
                odds: 3.45
              }
            ],
            entry_text: "draw",
            odds: 3.45,
            conf: 0.7,
            mode: "常规",
            tys_home: "M",
            tys_away: "M",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "draw",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_13_2",
            home_team: "热刺",
            away_team: "利物浦",
            entries: [
              {
                name: "lose",
                odds: 1.88
              }
            ],
            entry_text: "lose",
            odds: 1.88,
            conf: 0.8,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_14",
        created_at: "2025-12-22T12:00:00.000Z",
        parlay_size: 2,
        inputs: 10,
        suggested_amount: 10,
        expected_rating: 0.51,
        combined_odds: 8.45,
        status: "lose",
        revenues: 0,
        profit: -10,
        actual_rating: 0.6,
        rep: null,
        remarks: "你妈的 巴萨门神附体 黄潜还红牌",
        matches: [
          {
            id: "gen_match_14_1",
            home_team: "黄潜",
            away_team: "巴萨",
            entries: [
              {
                name: "draw",
                odds: 4.4
              }
            ],
            entry_text: "draw",
            odds: 4.4,
            conf: 0.4,
            mode: "赌一把",
            tys_home: "/",
            tys_away: "/",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: false,
            match_rating: 0.4,
            match_rep: null,
            post_note: "你妈的 巴萨门神附体 黄潜还红牌"
          },
          {
            id: "gen_match_14_2",
            home_team: "维拉",
            away_team: "曼联",
            entries: [
              {
                name: "win",
                odds: 1.92
              }
            ],
            entry_text: "win",
            odds: 1.92,
            conf: 0.6,
            mode: "赌一把",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_15",
        created_at: "2025-12-22T12:00:00.000Z",
        parlay_size: 2,
        inputs: 56,
        suggested_amount: 56,
        expected_rating: 0.65,
        combined_odds: 2.38,
        status: "win",
        revenues: 133.28,
        profit: 77.28,
        actual_rating: 0.8,
        rep: null,
        remarks: "",
        matches: [
          {
            id: "gen_match_15_1",
            home_team: "那不勒斯",
            away_team: "博洛尼亚",
            entries: [
              {
                name: "win",
                odds: 1.95
              }
            ],
            entry_text: "win",
            odds: 1.95,
            conf: 0.8,
            mode: "常规",
            tys_home: "L",
            tys_away: "L",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_15_2",
            home_team: "阿尔维卡",
            away_team: "波尔图",
            entries: [
              {
                name: "lose",
                odds: 1.22
              }
            ],
            entry_text: "lose",
            odds: 1.22,
            conf: 0.8,
            mode: "常规",
            tys_home: "L",
            tys_away: "L",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_16",
        created_at: "2025-12-22T12:00:00.000Z",
        parlay_size: 2,
        inputs: 44,
        suggested_amount: 44,
        expected_rating: 0.52,
        combined_odds: 12.01,
        status: "lose",
        revenues: 0,
        profit: -44,
        actual_rating: 0.5,
        rep: null,
        remarks: "哎气死我了那不勒斯 2-0 结果另一场错了\n前天维拉也是，以后就应该串大保底的场次",
        matches: [
          {
            id: "gen_match_16_1",
            home_team: "那不勒斯",
            away_team: "博洛尼亚",
            entries: [
              {
                name: "-1 win",
                odds: 4.35
              }
            ],
            entry_text: "-1 win",
            odds: 4.35,
            conf: 0.6,
            mode: "常规",
            tys_home: "L",
            tys_away: "L",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "-1 win",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: "哎气死我了那不勒斯 2-0 结果另一场错了\n前天维拉也是，以后就应该串大保底的场次"
          },
          {
            id: "gen_match_16_2",
            home_team: "富勒姆",
            away_team: "诺丁汉森林",
            entries: [
              {
                name: "lose",
                odds: 2.76
              }
            ],
            entry_text: "lose",
            odds: 2.76,
            conf: 0.4,
            mode: "常规",
            tys_home: "M",
            tys_away: "M",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: false,
            match_rating: 0.2,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_17",
        created_at: "2025-12-23T12:00:00.000Z",
        parlay_size: 2,
        inputs: 10,
        suggested_amount: 10,
        expected_rating: 0.51,
        combined_odds: 4.32,
        status: "lose",
        revenues: 0,
        profit: -10,
        actual_rating: 0.7,
        rep: null,
        remarks: "你妈的  90+5' 被绝平  真的气死我了",
        matches: [
          {
            id: "gen_match_17_1",
            home_team: "阿森纳",
            away_team: "水晶宫",
            entries: [
              {
                name: "-1 draw",
                odds: 3.2
              }
            ],
            entry_text: "-1 draw",
            odds: 3.2,
            conf: 0.2,
            mode: "保险产品",
            tys_home: "/",
            tys_away: "/",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "-1 lose",
            is_correct: false,
            match_rating: 0.6,
            match_rep: null,
            post_note: "你妈的  90+5' 被绝平  真的气死我了"
          },
          {
            id: "gen_match_17_2",
            home_team: "吉马良斯",
            away_team: "葡体",
            entries: [
              {
                name: "lose",
                odds: 1.35
              }
            ],
            entry_text: "lose",
            odds: 1.35,
            conf: 0.6,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_18",
        created_at: "2025-12-27T12:00:00.000Z",
        parlay_size: 2,
        inputs: 56,
        suggested_amount: 56,
        expected_rating: 0.65,
        combined_odds: 1.67,
        status: "win",
        revenues: 93.52,
        profit: 37.52,
        actual_rating: 0.8,
        rep: null,
        remarks: "赔率太低了，这么稳的两场应该多加点",
        matches: [
          {
            id: "gen_match_18_1",
            home_team: "诺丁汉森林",
            away_team: "曼城",
            entries: [
              {
                name: "lose",
                odds: 1.45
              }
            ],
            entry_text: "lose",
            odds: 1.45,
            conf: 0.8,
            mode: "半彩票半保险",
            tys_home: "M",
            tys_away: "M",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: "赔率太低了，这么稳的两场应该多加点"
          },
          {
            id: "gen_match_18_2",
            home_team: "利物浦",
            away_team: "狼队",
            entries: [
              {
                name: "win",
                odds: 1.15
              }
            ],
            entry_text: "win",
            odds: 1.15,
            conf: 0.8,
            mode: "常规",
            tys_home: "L",
            tys_away: "L",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_19",
        created_at: "2025-12-27T12:00:00.000Z",
        parlay_size: 2,
        inputs: 24,
        suggested_amount: 24,
        expected_rating: 0.52,
        combined_odds: 8.92,
        status: "lose",
        revenues: 0,
        profit: -24,
        actual_rating: 0.5,
        rep: null,
        remarks: "草啊，曼城和利物浦都少赢1个球\n666，我当时纠结的是利物浦可能3-0，没想到才2-1\n其实本质上就是曼城这场我的err.<conf.了，简称预测错了",
        matches: [
          {
            id: "gen_match_19_1",
            home_team: "诺丁汉森林",
            away_team: "曼城",
            entries: [
              {
                name: "+1 lose",
                odds: 2.38
              }
            ],
            entry_text: "+1 lose",
            odds: 2.38,
            conf: 0.6,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "+1 draw",
            is_correct: false,
            match_rating: 0.4,
            match_rep: null,
            post_note: "草啊，曼城和利物浦都少赢1个球\n666，我当时纠结的是利物浦可能3-0，没想到才2-1\n其实本质上就是曼城这场我的err.<conf.了，简称预测错了"
          },
          {
            id: "gen_match_19_2",
            home_team: "利物浦",
            away_team: "狼队",
            entries: [
              {
                name: "-2 draw",
                odds: 3.75
              }
            ],
            entry_text: "-2 draw",
            odds: 3.75,
            conf: 0.3,
            mode: "赌一把",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "-2 lose",
            is_correct: false,
            match_rating: 0.6,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_20",
        created_at: "2025-12-27T12:00:00.000Z",
        parlay_size: 2,
        inputs: 34,
        suggested_amount: 34,
        expected_rating: 0.56,
        combined_odds: 4.08,
        status: "lose",
        revenues: 0,
        profit: -34,
        actual_rating: 0.6,
        rep: null,
        remarks: "切尔西进攻水平低于我预期，妈的",
        matches: [
          {
            id: "gen_match_20_1",
            home_team: "切尔西",
            away_team: "阿斯顿维拉",
            entries: [
              {
                name: "draw",
                odds: 3.55
              }
            ],
            entry_text: "draw",
            odds: 3.55,
            conf: 0.4,
            mode: "常规",
            tys_home: "H",
            tys_away: "H",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: false,
            match_rating: 0.4,
            match_rep: null,
            post_note: "切尔西进攻水平低于我预期，妈的"
          },
          {
            id: "gen_match_20_2",
            home_team: "利物浦",
            away_team: "狼队",
            entries: [
              {
                name: "win",
                odds: 1.15
              }
            ],
            entry_text: "win",
            odds: 1.15,
            conf: 0.8,
            mode: "常规",
            tys_home: "L",
            tys_away: "L",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_21",
        created_at: "2025-12-30T12:00:00.000Z",
        parlay_size: 2,
        inputs: 12,
        suggested_amount: 12,
        expected_rating: 0.55,
        combined_odds: 5.44,
        status: "lose",
        revenues: 0,
        profit: -12,
        actual_rating: 0.4,
        rep: null,
        remarks: "",
        matches: [
          {
            id: "gen_match_21_1",
            home_team: "阿森纳",
            away_team: "阿斯顿维拉",
            entries: [
              {
                name: "draw",
                odds: 4.35
              }
            ],
            entry_text: "draw",
            odds: 4.35,
            conf: 0.4,
            mode: "保险产品",
            tys_home: "/",
            tys_away: "/",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: false,
            match_rating: 0.4,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_21_2",
            home_team: "曼联",
            away_team: "狼队",
            entries: [
              {
                name: "win",
                odds: 1.25
              }
            ],
            entry_text: "win",
            odds: 1.25,
            conf: 0.8,
            mode: "常规",
            tys_home: "M",
            tys_away: "M",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "draw",
            is_correct: false,
            match_rating: 0.4,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_22",
        created_at: "2025-12-30T12:00:00.000Z",
        parlay_size: 2,
        inputs: 22,
        suggested_amount: 22,
        expected_rating: 0.57,
        combined_odds: 4.72,
        status: "lose",
        revenues: 0,
        profit: -22,
        actual_rating: 0.6,
        rep: null,
        remarks: "纽卡读秒吊射绝杀3-1哈哈哈哈；曼联爆冷了吗的 狼队都赢不了",
        matches: [
          {
            id: "gen_match_22_1",
            home_team: "伯恩利",
            away_team: "纽卡",
            entries: [
              {
                name: "-1 lose",
                odds: 2.55
              }
            ],
            entry_text: "-1 lose",
            odds: 2.55,
            conf: 0.6,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "-1 lose",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: "纽卡读秒吊射绝杀3-1哈哈哈哈"
          },
          {
            id: "gen_match_22_2",
            home_team: "曼联",
            away_team: "狼队",
            entries: [
              {
                name: "-1 win",
                odds: 1.85
              }
            ],
            entry_text: "-1 win",
            odds: 1.85,
            conf: 0.6,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "-1 lose",
            is_correct: false,
            match_rating: 0.4,
            match_rep: null,
            post_note: "曼联爆冷了吗的 狼队都赢不了"
          }
        ]
      },
      {
        id: "gen_inv_23",
        created_at: "2025-12-30T12:00:00.000Z",
        parlay_size: 1,
        inputs: 14,
        suggested_amount: 14,
        expected_rating: 0.57,
        combined_odds: 4.38,
        status: "win",
        revenues: 61.32,
        profit: 47.32,
        actual_rating: 0.8,
        rep: null,
        remarks: "马雷斯卡果然是不让我失望哈哈哈哈",
        matches: [
          {
            id: "gen_match_23_1",
            home_team: "切尔西",
            away_team: "伯恩茅斯",
            entries: [
              {
                name: "draw",
                odds: 4.38
              }
            ],
            entry_text: "draw",
            odds: 4.38,
            conf: 0.6,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "draw",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: "马雷斯卡果然是不让我失望哈哈哈哈"
          }
        ]
      },
      {
        id: "gen_inv_24",
        created_at: "2026-01-01T12:00:00.000Z",
        parlay_size: 3,
        inputs: 54,
        suggested_amount: 54,
        expected_rating: 0.52,
        combined_odds: 16.44,
        status: "lose",
        revenues: 0,
        profit: -54,
        actual_rating: 0.47,
        rep: null,
        remarks: "唉，啊啊啊啊 你厂突然丢2个球了吗的；读秒绝平。。",
        matches: [
          {
            id: "gen_match_24_1",
            home_team: "伯恩茅斯",
            away_team: "阿森纳",
            entries: [
              {
                name: "+1 lose",
                odds: 2.24
              }
            ],
            entry_text: "+1 lose",
            odds: 2.24,
            conf: 0.6,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "+1 draw",
            is_correct: false,
            match_rating: 0.6,
            match_rep: null,
            post_note: "唉，啊啊啊啊 你厂突然丢2个球了吗的"
          },
          {
            id: "gen_match_24_2",
            home_team: "富勒姆",
            away_team: "利物浦",
            entries: [
              {
                name: "lose",
                odds: 1.79
              }
            ],
            entry_text: "lose",
            odds: 1.79,
            conf: 0.45,
            mode: "常规",
            tys_home: "M",
            tys_away: "M",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "draw",
            is_correct: false,
            match_rating: 0.6,
            match_rep: null,
            post_note: "读秒绝平。。"
          },
          {
            id: "gen_match_24_3",
            home_team: "热刺",
            away_team: "桑德兰",
            entries: [
              {
                name: "lose",
                odds: 4.1
              }
            ],
            entry_text: "lose",
            odds: 4.1,
            conf: 0.45,
            mode: "常规",
            tys_home: "L",
            tys_away: "L",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: false,
            match_rating: 0.2,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_25",
        created_at: "2026-01-03T12:00:00.000Z",
        parlay_size: 2,
        inputs: 18,
        suggested_amount: 18,
        expected_rating: 0.54,
        combined_odds: 3.77,
        status: "lose",
        revenues: 0,
        profit: -18,
        actual_rating: 0.55,
        rep: null,
        remarks: "好好好，这个我错的心甘情愿，切尔西绝平。；我要继续做多利兹联，做空曼联，你妈的，我相信会均值回归，这场算曼联爆冷",
        matches: [
          {
            id: "gen_match_25_1",
            home_team: "曼城",
            away_team: "切尔西",
            entries: [
              {
                name: "win",
                odds: 1.52
              }
            ],
            entry_text: "win",
            odds: 1.52,
            conf: 0.6,
            mode: "半彩票半保险",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "draw",
            is_correct: false,
            match_rating: 0.5,
            match_rep: null,
            post_note: "好好好，这个我错的心甘情愿，切尔西绝平。"
          },
          {
            id: "gen_match_25_2",
            home_team: "利兹联",
            away_team: "曼联",
            entries: [
              {
                name: "win",
                odds: 2.48
              }
            ],
            entry_text: "win",
            odds: 2.48,
            conf: 0.4,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "draw",
            is_correct: false,
            match_rating: 0.6,
            match_rep: null,
            post_note: "我要继续做多利兹联，做空曼联，你妈的，我相信会均值回归，这场算曼联爆冷"
          }
        ]
      },
      {
        id: "gen_inv_26",
        created_at: "2026-01-03T12:00:00.000Z",
        parlay_size: 1,
        inputs: 8,
        suggested_amount: 8,
        expected_rating: 0.46,
        combined_odds: 2.32,
        status: "win",
        revenues: 18.8,
        profit: 10.8,
        actual_rating: 0.8,
        rep: null,
        remarks: "",
        matches: [
          {
            id: "gen_match_26_1",
            home_team: "狼队",
            away_team: "西汉姆联",
            entries: [
              {
                name: "win",
                odds: 2.32
              }
            ],
            entry_text: "win",
            odds: 2.32,
            conf: 0.3,
            mode: "赌一把",
            tys_home: "M",
            tys_away: "M",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_27",
        created_at: "2026-01-03T12:00:00.000Z",
        parlay_size: 1,
        inputs: 18,
        suggested_amount: 18,
        expected_rating: 0.48,
        combined_odds: 8.25,
        status: "lose",
        revenues: 0,
        profit: -18,
        actual_rating: 0.2,
        rep: null,
        remarks: "果然首胜。",
        matches: [
          {
            id: "gen_match_27_1",
            home_team: "狼队",
            away_team: "西汉姆联",
            entries: [
              {
                name: "1-2",
                odds: 8.25
              },
              {
                name: "0-1",
                odds: 8.25
              }
            ],
            entry_text: "1-2, 0-1",
            odds: 8.25,
            conf: 0.3,
            mode: "赌一把",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "3-0",
            is_correct: false,
            match_rating: 0.2,
            match_rep: null,
            post_note: "果然首胜。"
          }
        ]
      },
      {
        id: "gen_inv_28",
        created_at: "2026-01-04T12:00:00.000Z",
        parlay_size: 3,
        inputs: 56,
        suggested_amount: 56,
        expected_rating: 0.49,
        combined_odds: 21.75,
        status: "lose",
        revenues: 0,
        profit: -56,
        actual_rating: 0.4,
        rep: null,
        remarks: "曼联不配，这场利兹联就该3分的；根据评论区，埃弗顿本赛季全队踢的最梦游最摆烂的一场比赛。。给我撞上了你妈。不过也确实低估了布伦特福德的进攻",
        matches: [
          {
            id: "gen_match_28_1",
            home_team: "利兹联",
            away_team: "曼联",
            entries: [
              {
                name: "win",
                odds: 2.4
              }
            ],
            entry_text: "win",
            odds: 2.4,
            conf: 0.4,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "draw",
            is_correct: false,
            match_rating: 0.6,
            match_rep: null,
            post_note: "曼联不配，这场利兹联就该3分的"
          },
          {
            id: "gen_match_28_2",
            home_team: "热刺",
            away_team: "桑德兰",
            entries: [
              {
                name: "lose",
                odds: 4.1
              }
            ],
            entry_text: "lose",
            odds: 4.1,
            conf: 0.45,
            mode: "常规",
            tys_home: "L",
            tys_away: "L",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "draw",
            is_correct: false,
            match_rating: 0.4,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_28_3",
            home_team: "埃弗顿",
            away_team: "布伦特福德",
            entries: [
              {
                name: "win",
                odds: 2.21
              }
            ],
            entry_text: "win",
            odds: 2.21,
            conf: 0.35,
            mode: "常规",
            tys_home: "M",
            tys_away: "M",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: false,
            match_rating: 0.2,
            match_rep: null,
            post_note: "根据评论区，埃弗顿本赛季全队踢的最梦游最摆烂的一场比赛。。给我撞上了你妈。不过也确实低估了布伦特福德的进攻"
          }
        ]
      },
      {
        id: "gen_inv_29",
        created_at: "2026-01-04T12:00:00.000Z",
        parlay_size: 3,
        inputs: 56,
        suggested_amount: 56,
        expected_rating: 0.49,
        combined_odds: 30.91,
        status: "lose",
        revenues: 0,
        profit: -56,
        actual_rating: 0.4,
        rep: null,
        remarks: "行。",
        matches: [
          {
            id: "gen_match_29_1",
            home_team: "纽卡",
            away_team: "水晶宫",
            entries: [
              {
                name: "-1 draw",
                odds: 3.3
              }
            ],
            entry_text: "-1 draw",
            odds: 3.3,
            conf: 0.25,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "-1 win",
            is_correct: false,
            match_rating: 0.6,
            match_rep: null,
            post_note: "行。"
          },
          {
            id: "gen_match_29_2",
            home_team: "热刺",
            away_team: "桑德兰",
            entries: [
              {
                name: "lose",
                odds: 4.2
              }
            ],
            entry_text: "lose",
            odds: 4.2,
            conf: 0.45,
            mode: "常规",
            tys_home: "L",
            tys_away: "L",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "draw",
            is_correct: false,
            match_rating: 0.4,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_29_3",
            home_team: "埃弗顿",
            away_team: "布伦特福德",
            entries: [
              {
                name: "win",
                odds: 2.23
              }
            ],
            entry_text: "win",
            odds: 2.23,
            conf: 0.35,
            mode: "常规",
            tys_home: "M",
            tys_away: "M",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: false,
            match_rating: 0.2,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_30",
        created_at: "2026-01-04T12:00:00.000Z",
        parlay_size: 1,
        inputs: 12,
        suggested_amount: 12,
        expected_rating: 0.48,
        combined_odds: 14,
        status: "lose",
        revenues: 0,
        profit: -12,
        actual_rating: 0.4,
        rep: null,
        remarks: "",
        matches: [
          {
            id: "gen_match_30_1",
            home_team: "纽卡",
            away_team: "水晶宫",
            entries: [
              {
                name: "2-2",
                odds: 14
              }
            ],
            entry_text: "2-2",
            odds: 14,
            conf: 0.2,
            mode: "赌一把",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "2-0",
            is_correct: false,
            match_rating: 0.4,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_31",
        created_at: "2026-01-04T12:00:00.000Z",
        parlay_size: 3,
        inputs: 22,
        suggested_amount: 22,
        expected_rating: 0.58,
        combined_odds: 6.94,
        status: "lose",
        revenues: 0,
        profit: -22,
        actual_rating: 0.57,
        rep: null,
        remarks: '我真服了，凭什么你妈的，我真的不理解，我现在还是不理解。但是专业的足球模型还真给他算出来了，热刺主胜的赔率是1.9几，真的不得不服，但是我还是不理解。。；所以，其实今天这四场也都确实"冷"了，不是赔率最热门的选项，所以并不是说对抗专业模型就没有margin的。只不过我都选错了更具体的side。热刺桑德兰的显著胜变成了平，但我选了负。富勒姆利物浦的显著热门是负，但也平了。利兹联曼联的显著热门是负 结果也平了，可是我选成了胜。。唯一命中的高赔率是狼队主胜了，但我只单关下了轻注。。而纽卡的-1 win的赔率也是二点几，但是我选了保守的-1 draw 唉。。唯一错的离谱的是埃弗顿踢布伦特福德那场，不过刚好这本来就是唯一一场三个选项赔率都比较接近的纯粹中游比赛，主要是其他几场全错的太难受了',
        matches: [
          {
            id: "gen_match_31_1",
            home_team: "热刺",
            away_team: "桑德兰",
            entries: [
              {
                name: "lose",
                odds: 4.2
              }
            ],
            entry_text: "lose",
            odds: 4.2,
            conf: 0.45,
            mode: "常规",
            tys_home: "L",
            tys_away: "L",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "draw",
            is_correct: false,
            match_rating: 0.4,
            match_rep: null,
            post_note: "我真服了，凭什么你妈的，我真的不理解，我现在还是不理解。但是专业的足球模型还真给他算出来了，热刺主胜的赔率是1.9几，真的不得不服，但是我还是不理解。。"
          },
          {
            id: "gen_match_31_2",
            home_team: "曼城",
            away_team: "切尔西",
            entries: [
              {
                name: "win",
                odds: 1.45
              }
            ],
            entry_text: "win",
            odds: 1.45,
            conf: 0.6,
            mode: "半彩票半保险",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "draw",
            is_correct: false,
            match_rating: 0.5,
            match_rep: null,
            post_note: '所以，其实今天这四场也都确实"冷"了，不是赔率最热门的选项，所以并不是说对抗专业模型就没有margin的。只不过我都选错了更具体的side。热刺桑德兰的显著胜变成了平，但我选了负。富勒姆利物浦的显著热门是负，但也平了。利兹联曼联的显著热门是负 结果也平了，可是我选成了胜。。唯一命中的高赔率是狼队主胜了，但我只单关下了轻注。。而纽卡的-1 win的赔率也是二点几，但是我选了保守的-1 draw 唉。。唯一错的离谱的是埃弗顿踢布伦特福德那场，不过刚好这本来就是唯一一场三个选项赔率都比较接近的纯粹中游比赛，主要是其他几场全错的太难受了'
          },
          {
            id: "gen_match_31_3",
            home_team: "达马克",
            away_team: "利雅得新月",
            entries: [
              {
                name: "lose",
                odds: 1.14
              }
            ],
            entry_text: "lose",
            odds: 1.14,
            conf: 0.8,
            mode: "常规",
            tys_home: "L",
            tys_away: "L",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_32",
        created_at: "2026-01-07T12:00:00.000Z",
        parlay_size: 3,
        inputs: 24,
        suggested_amount: 24,
        expected_rating: 0.52,
        combined_odds: 19.19,
        status: "lose",
        revenues: 0,
        profit: -24,
        actual_rating: 0.8,
        rep: null,
        remarks: "好好好，这下又加上了一个切尔西绝平曼城了，another one, 高赔率option realized, 所以其实这周还真是基本每一场的结果都是高赔率选项，把它们串起来实现十几倍的赔率四位数的利润是完全可能的，只可惜我选错了具体选项唉 然后选择串的场次搭配也很有待改进。可惜哎！",
        matches: [
          {
            id: "gen_match_32_1",
            home_team: "布伦特福德",
            away_team: "桑德兰",
            entries: [
              {
                name: "win",
                odds: 1.67
              }
            ],
            entry_text: "win",
            odds: 1.67,
            conf: 0.6,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: "好好好，这下又加上了一个切尔西绝平曼城了，another one, 高赔率option realized, 所以其实这周还真是基本每一场的结果都是高赔率选项，把它们串起来实现十几倍的赔率四位数的利润是完全可能的，只可惜我选错了具体选项唉 然后选择串的场次搭配也很有待改进。可惜哎！"
          },
          {
            id: "gen_match_32_2",
            home_team: "富勒姆",
            away_team: "切尔西",
            entries: [
              {
                name: "win/lose",
                odds: 3.38
              }
            ],
            entry_text: "win/lose",
            odds: 3.38,
            conf: 0.4,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_32_3",
            home_team: "埃弗顿",
            away_team: "狼队",
            entries: [
              {
                name: "draw",
                odds: 3.4
              }
            ],
            entry_text: "draw",
            odds: 3.4,
            conf: 0.4,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "draw",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_33",
        created_at: "2026-01-01T12:00:00.000Z",
        parlay_size: 1,
        inputs: 16,
        suggested_amount: 16,
        expected_rating: 0.55,
        combined_odds: 3.8,
        status: "lose",
        revenues: 0,
        profit: -16,
        actual_rating: 0.7,
        rep: null,
        remarks: "纽卡90+12 绝杀 本来3-3利兹联的 啊啊啊 草泥马 我快疯了真的",
        matches: [
          {
            id: "gen_match_33_1",
            home_team: "纽卡",
            away_team: "利兹联",
            entries: [
              {
                name: "draw",
                odds: 3.8
              }
            ],
            entry_text: "draw",
            odds: 3.8,
            conf: 0.6,
            mode: "常规",
            tys_home: "M",
            tys_away: "M",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: false,
            match_rating: 0.7,
            match_rep: null,
            post_note: "纽卡90+12 绝杀 本来3-3利兹联的 啊啊啊 草泥马 我快疯了真的"
          }
        ]
      },
      {
        id: "gen_inv_34",
        created_at: "2026-01-08T12:00:00.000Z",
        parlay_size: 3,
        inputs: 52,
        suggested_amount: 52,
        expected_rating: 0.54,
        combined_odds: 9.07,
        status: "lose",
        revenues: 0,
        profit: -52,
        actual_rating: 0.33,
        rep: null,
        remarks: '富勒姆playing very direct，主场顺风就会很牛逼，反击有声有色。切尔西下半场反击机会也不少、但是接下来换帅了。利兹联地面高位压迫很猛，鉴定为稳定地牛逼了，阿伦森很牛逼，但是空中对抗落点好像不太行。纽卡主场太猛了，但是这场疑似进攻威胁太定位球了。布伦特福德不负我望，猛。曼联踢得有声有色，新套路很多，预计对手不会迅速适应。狼队威胁挺低的，不过也不是0。埃弗顿摇子又停赛了有的受了。；另，复盘昨日组合策略，布伦特福德主胜桑德兰、纽卡平利兹联是基石。在此基础之上，分别下了"埃弗顿胜狼队+富勒姆胜/负切尔西"和"埃弗顿平狼队+富勒姆平切尔西"两注，实际结果为"埃弗顿平狼队+富勒姆胜切尔西"。先不总结下定论，但是这个感觉是明显有总结价值和未来组合的策略提升空间的。',
        matches: [
          {
            id: "gen_match_34_1",
            home_team: "阿森纳",
            away_team: "利物浦",
            entries: [
              {
                name: "-1 win",
                odds: 2.53
              }
            ],
            entry_text: "-1 win",
            odds: 2.53,
            conf: 0.6,
            mode: "常规",
            tys_home: "H",
            tys_away: "H",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "draw",
            is_correct: false,
            match_rating: 0.2,
            match_rep: null,
            post_note: "富勒姆playing very direct，主场顺风就会很牛逼，反击有声有色。切尔西下半场反击机会也不少、但是接下来换帅了。利兹联地面高位压迫很猛，鉴定为稳定地牛逼了，阿伦森很牛逼，但是空中对抗落点好像不太行。纽卡主场太猛了，但是这场疑似进攻威胁太定位球了。布伦特福德不负我望，猛。曼联踢得有声有色，新套路很多，预计对手不会迅速适应。狼队威胁挺低的，不过也不是0。埃弗顿摇子又停赛了有的受了。"
          },
          {
            id: "gen_match_34_2",
            home_team: "马竞",
            away_team: "皇马",
            entries: [
              {
                name: "win",
                odds: 2.8
              }
            ],
            entry_text: "win",
            odds: 2.8,
            conf: 0.4,
            mode: "常规",
            tys_home: "L",
            tys_away: "L",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: false,
            match_rating: 0.4,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_34_3",
            home_team: "米兰",
            away_team: "热那亚",
            entries: [
              {
                name: "win",
                odds: 1.28
              }
            ],
            entry_text: "win",
            odds: 1.28,
            conf: 0.6,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "draw",
            is_correct: false,
            match_rating: 0.4,
            match_rep: null,
            post_note: '另，复盘昨日组合策略，布伦特福德主胜桑德兰、纽卡平利兹联是基石。在此基础之上，分别下了"埃弗顿胜狼队+富勒姆胜/负切尔西"和"埃弗顿平狼队+富勒姆平切尔西"两注，实际结果为"埃弗顿平狼队+富勒姆胜切尔西"。先不总结下定论，但是这个感觉是明显有总结价值和未来组合的策略提升空间的。'
          }
        ]
      },
      {
        id: "gen_inv_35",
        created_at: "2026-01-08T12:00:00.000Z",
        parlay_size: 2,
        inputs: 168,
        suggested_amount: 168,
        expected_rating: 0.58,
        combined_odds: 2.91,
        status: "lose",
        revenues: 0,
        profit: -168,
        actual_rating: 0.5,
        rep: null,
        remarks: "",
        matches: [
          {
            id: "gen_match_35_1",
            home_team: "阿森纳",
            away_team: "利物浦",
            entries: [
              {
                name: "-1 win",
                odds: 2.53
              }
            ],
            entry_text: "-1 win",
            odds: 2.53,
            conf: 0.6,
            mode: "常规",
            tys_home: "H",
            tys_away: "H",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "draw",
            is_correct: false,
            match_rating: 0.2,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_35_2",
            home_team: "澳u23",
            away_team: "泰u23",
            entries: [
              {
                name: "win",
                odds: 1.15
              }
            ],
            entry_text: "win",
            odds: 1.15,
            conf: 0.8,
            mode: "常规",
            tys_home: "H",
            tys_away: "H",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_36",
        created_at: "2026-01-14T12:00:00.000Z",
        parlay_size: 1,
        inputs: 10,
        suggested_amount: 10,
        expected_rating: 0.57,
        combined_odds: 2.88,
        status: "win",
        revenues: 28.8,
        profit: 18.8,
        actual_rating: null,
        rep: null,
        remarks: "",
        matches: [
          {
            id: "gen_match_36_1",
            home_team: "泰u23",
            away_team: "国u23",
            entries: [
              {
                name: "draw",
                odds: 2.88
              }
            ],
            entry_text: "draw",
            odds: 2.88,
            conf: 0.5,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "draw",
            is_correct: true,
            match_rating: null,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_37",
        created_at: "2026-01-17T12:00:00.000Z",
        parlay_size: 1,
        inputs: 84,
        suggested_amount: 84,
        expected_rating: 0.58,
        combined_odds: 2,
        status: "lose",
        revenues: 0,
        profit: -84,
        actual_rating: 0.2,
        rep: null,
        remarks: "",
        matches: [
          {
            id: "gen_match_37_1",
            home_team: "曼联",
            away_team: "曼城",
            entries: [
              {
                name: "lose",
                odds: 2
              }
            ],
            entry_text: "lose",
            odds: 2,
            conf: 0.6,
            mode: "半彩票半保险",
            tys_home: "L",
            tys_away: "L",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: false,
            match_rating: 0.2,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_38",
        created_at: "2026-01-17T12:00:00.000Z",
        parlay_size: 1,
        inputs: 52,
        suggested_amount: 52,
        expected_rating: 0.54,
        combined_odds: 3.8,
        status: "lose",
        revenues: 0,
        profit: -52,
        actual_rating: 0.2,
        rep: null,
        remarks: "",
        matches: [
          {
            id: "gen_match_38_1",
            home_team: "曼联",
            away_team: "曼城",
            entries: [
              {
                name: "lose",
                odds: 3.8
              }
            ],
            entry_text: "lose",
            odds: 3.8,
            conf: 0.5,
            mode: "常规",
            tys_home: "H",
            tys_away: "H",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: false,
            match_rating: 0.2,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_39",
        created_at: "2026-01-17T12:00:00.000Z",
        parlay_size: 3,
        inputs: 34,
        suggested_amount: 34,
        expected_rating: 0.53,
        combined_odds: 17.97,
        status: "lose",
        revenues: 0,
        profit: -34,
        actual_rating: null,
        rep: null,
        remarks: "",
        matches: [
          {
            id: "gen_match_39_1",
            home_team: "热刺",
            away_team: "西汉姆",
            entries: [
              {
                name: "win",
                odds: 1.7
              }
            ],
            entry_text: "win",
            odds: 1.7,
            conf: 0.5,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "",
            is_correct: null,
            match_rating: null,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_39_2",
            home_team: "利兹联",
            away_team: "富勒姆",
            entries: [
              {
                name: "draw",
                odds: 2.97
              }
            ],
            entry_text: "draw",
            odds: 2.97,
            conf: 0.5,
            mode: "常规",
            tys_home: "M",
            tys_away: "M",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "",
            is_correct: null,
            match_rating: null,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_39_3",
            home_team: "切尔西",
            away_team: "布伦特福德",
            entries: [
              {
                name: "draw",
                odds: 3.56
              }
            ],
            entry_text: "draw",
            odds: 3.56,
            conf: 0.4,
            mode: "常规",
            tys_home: "M",
            tys_away: "M",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "",
            is_correct: null,
            match_rating: null,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_40",
        created_at: "2026-01-20T12:00:00.000Z",
        parlay_size: 3,
        inputs: 56,
        suggested_amount: 56,
        expected_rating: 0.61,
        combined_odds: 6.1,
        status: "lose",
        revenues: 0,
        profit: -56,
        actual_rating: 0.73,
        rep: null,
        remarks: '赛前有个一手信源的视频号，记者去问塔子，塔子”语气严肃地说no excuses, same standard"，于是我心中就从0.4上升到了0.6的confidence，来买了，确实没让我失望；What can I say! 凯恩丢点球! 接着奥利赛门前丢王玉栋都能进的球! 棒子红牌! WHAT CAN I SAY!!!!!',
        matches: [
          {
            id: "gen_match_40_1",
            home_team: "国际米兰",
            away_team: "阿森纳",
            entries: [
              {
                name: "lose",
                odds: 2.44
              }
            ],
            entry_text: "lose",
            odds: 2.44,
            conf: 0.6,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: '赛前有个一手信源的视频号，记者去问塔子，塔子”语气严肃地说no excuses, same standard"，于是我心中就从0.4上升到了0.6的confidence，来买了，确实没让我失望'
          },
          {
            id: "gen_match_40_2",
            home_team: "拜仁",
            away_team: "圣吉尔",
            entries: [
              {
                name: "-2 win",
                odds: 1.97
              }
            ],
            entry_text: "-2 win",
            odds: 1.97,
            conf: 0.7,
            mode: "常规",
            tys_home: "M",
            tys_away: "M",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "-2 draw",
            is_correct: false,
            match_rating: 0.6,
            match_rep: null,
            post_note: "What can I say! 凯恩丢点球! 接着奥利赛门前丢王玉栋都能进的球! 棒子红牌! WHAT CAN I SAY!!!!!"
          },
          {
            id: "gen_match_40_3",
            home_team: "布拉格",
            away_team: "巴萨",
            entries: [
              {
                name: "lose",
                odds: 1.27
              }
            ],
            entry_text: "lose",
            odds: 1.27,
            conf: 0.7,
            mode: "常规",
            tys_home: "M",
            tys_away: "M",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_41",
        created_at: "2026-01-24T12:00:00.000Z",
        parlay_size: 2,
        inputs: 46,
        suggested_amount: 46,
        expected_rating: 0.56,
        combined_odds: 3.16,
        status: "lose",
        revenues: 0,
        profit: -46,
        actual_rating: 0.5,
        rep: null,
        remarks: "",
        matches: [
          {
            id: "gen_match_41_1",
            home_team: "曼城",
            away_team: "狼队",
            entries: [
              {
                name: "win",
                odds: 1.21
              }
            ],
            entry_text: "win",
            odds: 1.21,
            conf: 0.6,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_41_2",
            home_team: "拜仁",
            away_team: "奥格斯堡",
            entries: [
              {
                name: "-3 win",
                odds: 2.61
              }
            ],
            entry_text: "-3 win",
            odds: 2.61,
            conf: 0.6,
            mode: "常规",
            tys_home: "M",
            tys_away: "M",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: false,
            match_rating: 0.2,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_42",
        created_at: "2026-01-24T12:00:00.000Z",
        parlay_size: 1,
        inputs: 16,
        suggested_amount: 16,
        expected_rating: 0.48,
        combined_odds: 10.5,
        status: "lose",
        revenues: 0,
        profit: -16,
        actual_rating: 0.7,
        rep: null,
        remarks: "操你妈啊利物浦被最后一个界外球绝杀啊。。。劳资盯着屏幕看到最后一秒。。操啊。。。843块的收米啊。。",
        matches: [
          {
            id: "gen_match_42_1",
            home_team: "伯恩茅斯",
            away_team: "利物浦",
            entries: [
              {
                name: "2-2",
                odds: 10.5
              }
            ],
            entry_text: "2-2",
            odds: 10.5,
            conf: 0.4,
            mode: "常规",
            tys_home: "M",
            tys_away: "M",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "3-2",
            is_correct: false,
            match_rating: 0.7,
            match_rep: null,
            post_note: "操你妈啊利物浦被最后一个界外球绝杀啊。。。劳资盯着屏幕看到最后一秒。。操啊。。。843块的收米啊。。"
          }
        ]
      },
      {
        id: "gen_inv_43",
        created_at: "2026-01-24T12:00:00.000Z",
        parlay_size: 3,
        inputs: 46,
        suggested_amount: 46,
        expected_rating: 0.54,
        combined_odds: 14.55,
        status: "lose",
        revenues: 0,
        profit: -46,
        actual_rating: 0.77,
        rep: null,
        remarks: "可惜了这场热刺平局被我命中了啊 2-2对了啊 唉。。",
        matches: [
          {
            id: "gen_match_43_1",
            home_team: "伯恩茅斯",
            away_team: "利物浦",
            entries: [
              {
                name: "draw",
                odds: 3.7
              }
            ],
            entry_text: "draw",
            odds: 3.7,
            conf: 0.6,
            mode: "常规",
            tys_home: "M",
            tys_away: "M",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: false,
            match_rating: 0.7,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_43_2",
            home_team: "伯恩利",
            away_team: "热刺",
            entries: [
              {
                name: "draw",
                odds: 3.25
              }
            ],
            entry_text: "draw",
            odds: 3.25,
            conf: 0.4,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "draw",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: "可惜了这场热刺平局被我命中了啊 2-2对了啊 唉。。"
          },
          {
            id: "gen_match_43_3",
            home_team: "曼城",
            away_team: "狼队",
            entries: [
              {
                name: "win",
                odds: 1.21
              }
            ],
            entry_text: "win",
            odds: 1.21,
            conf: 0.6,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_44",
        created_at: "2026-01-28T12:00:00.000Z",
        parlay_size: 11,
        inputs: 1.08,
        suggested_amount: 1.08,
        expected_rating: 0.54,
        combined_odds: 4240.46,
        status: "lose",
        revenues: 0,
        profit: -1.08,
        actual_rating: 0.49,
        rep: null,
        remarks: "",
        matches: [
          {
            id: "gen_match_44_1",
            home_team: "拜仁",
            away_team: "埃因霍温",
            entries: [
              {
                name: "win",
                odds: 1.36
              }
            ],
            entry_text: "win",
            odds: 1.36,
            conf: 0.7,
            mode: "常规",
            tys_home: "H",
            tys_away: "H",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_44_2",
            home_team: "巴黎",
            away_team: "纽卡",
            entries: [
              {
                name: "win",
                odds: 1.43
              }
            ],
            entry_text: "win",
            odds: 1.43,
            conf: 0.6,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "draw",
            is_correct: false,
            match_rating: 0.4,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_44_3",
            home_team: "巴黎",
            away_team: "纽卡",
            entries: [
              {
                name: "-1 win",
                odds: 2.26
              }
            ],
            entry_text: "-1 win",
            odds: 2.26,
            conf: 0.4,
            mode: "常规",
            tys_home: "L",
            tys_away: "L",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "draw",
            is_correct: false,
            match_rating: 0.2,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_44_4",
            home_team: "勒沃库森",
            away_team: "黄潜",
            entries: [
              {
                name: "win",
                odds: 1.49
              }
            ],
            entry_text: "win",
            odds: 1.49,
            conf: 0.6,
            mode: "常规",
            tys_home: "L",
            tys_away: "L",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_44_5",
            home_team: "马竞",
            away_team: "博德闪耀",
            entries: [
              {
                name: "win",
                odds: 1.18
              }
            ],
            entry_text: "win",
            odds: 1.18,
            conf: 0.7,
            mode: "常规",
            tys_home: "M",
            tys_away: "M",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: false,
            match_rating: 0.3,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_44_6",
            home_team: "法兰克福",
            away_team: "热刺",
            entries: [
              {
                name: "draw",
                odds: 3.85
              }
            ],
            entry_text: "draw",
            odds: 3.85,
            conf: 0.3,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: false,
            match_rating: 0.2,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_44_7",
            home_team: "巴萨",
            away_team: "哥本哈根",
            entries: [
              {
                name: "-2 win",
                odds: 1.67
              }
            ],
            entry_text: "-2 win",
            odds: 1.67,
            conf: 0.4,
            mode: "常规",
            tys_home: "L",
            tys_away: "L",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "-2 win",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_44_8",
            home_team: "利物浦",
            away_team: "卡拉巴赫",
            entries: [
              {
                name: "-2 draw",
                odds: 4.2
              }
            ],
            entry_text: "-2 draw",
            odds: 4.2,
            conf: 0.3,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "-2 win",
            is_correct: false,
            match_rating: 0.2,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_44_9",
            home_team: "阿森纳",
            away_team: "阿拉图木",
            entries: [
              {
                name: "-3 draw",
                odds: 4.75
              }
            ],
            entry_text: "-3 draw",
            odds: 4.75,
            conf: 0.3,
            mode: "常规",
            tys_home: "H",
            tys_away: "H",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "-3 lose",
            is_correct: false,
            match_rating: 0.4,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_44_10",
            home_team: "切尔西",
            away_team: "那不勒斯",
            entries: [
              {
                name: "win",
                odds: 1.86
              }
            ],
            entry_text: "win",
            odds: 1.86,
            conf: 0.5,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_44_11",
            home_team: "曼城",
            away_team: "加拉塔萨雷",
            entries: [
              {
                name: "-2 lose",
                odds: 2.3
              }
            ],
            entry_text: "-2 lose",
            odds: 2.3,
            conf: 0.4,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "-2 draw",
            is_correct: false,
            match_rating: 0.5,
            match_rep: null,
            post_note: ""
          }
        ]
      },
      {
        id: "gen_inv_45",
        created_at: "2026-01-31T12:00:00.000Z",
        parlay_size: 4,
        inputs: 48.01,
        suggested_amount: 48.01,
        expected_rating: 0.57,
        combined_odds: 29.78,
        status: "lose",
        revenues: 0,
        profit: -48.01,
        actual_rating: 0.65,
        rep: null,
        remarks: "",
        matches: [
          {
            id: "gen_match_45_1",
            home_team: "狼队",
            away_team: "伯恩茅斯",
            entries: [
              {
                name: "draw+lose",
                odds: 2.57
              }
            ],
            entry_text: "draw+lose",
            odds: 2.57,
            conf: 0.6,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_45_2",
            home_team: "利兹联",
            away_team: "阿森纳",
            entries: [
              {
                name: "lose",
                odds: 1.39
              }
            ],
            entry_text: "lose",
            odds: 1.39,
            conf: 0.8,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "lose",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_45_3",
            home_team: "切尔西",
            away_team: "西汉姆",
            entries: [
              {
                name: "win+draw",
                odds: 2.1
              }
            ],
            entry_text: "win+draw",
            odds: 2.1,
            conf: 0.4,
            mode: "常规",
            tys_home: "S",
            tys_away: "S",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: true,
            match_rating: 0.8,
            match_rep: null,
            post_note: ""
          },
          {
            id: "gen_match_45_4",
            home_team: "利物浦",
            away_team: "纽卡",
            entries: [
              {
                name: "draw+lose",
                odds: 3.97
              }
            ],
            entry_text: "draw+lose",
            odds: 3.97,
            conf: 0.6,
            mode: "常规",
            tys_home: "M",
            tys_away: "M",
            fid: 0.4,
            fse_home: 0.5,
            fse_away: 0.5,
            fse_match: 0.5,
            note: "",
            results: "win",
            is_correct: false,
            match_rating: 0.2,
            match_rep: null,
            post_note: ""
          }
        ]
      }
    ]
  };

  // source/src/lib/previewStore.js
  var STORAGE_KEYS = {
    investments: "eivra.investments.v1",
    teamProfiles: "eivra.team_profiles.v1",
    systemConfig: "eivra.system_config.v1",
    accessLogs: "eivra.access_logs.v1"
  };
  var memoryStore = null;
  var deepClone = (value) => {
    if (value == null) return value;
    if (typeof structuredClone === "function") {
      try {
        return structuredClone(value);
      } catch (_) {
      }
    }
    return JSON.parse(JSON.stringify(value));
  };
  var buildInitialStore = () => ({
    [STORAGE_KEYS.investments]: getDemoInvestments(),
    [STORAGE_KEYS.teamProfiles]: getDemoTeamProfiles(),
    [STORAGE_KEYS.systemConfig]: getDemoSystemConfig(),
    [STORAGE_KEYS.accessLogs]: getDemoAccessLogs()
  });
  var ensureStore = () => {
    if (memoryStore == null) memoryStore = buildInitialStore();
    return memoryStore;
  };
  var previewRead = (key, fallback) => {
    const store = ensureStore();
    if (Object.prototype.hasOwnProperty.call(store, key)) {
      return deepClone(store[key]);
    }
    return fallback;
  };
  var previewWrite = (key, value) => {
    const store = ensureStore();
    store[key] = deepClone(value);
    return true;
  };
  var resetPreviewStore = () => {
    memoryStore = null;
  };

  // source/src/design/liquidGlassThemes.js
  var DEFAULT_LIQUID_GLASS_STYLE = "sand";
  var DEFAULT_LIQUID_GLASS_QUALITY = "smooth";
  var normalizeLiquidGlassQuality = (value) => value === "full" ? "full" : DEFAULT_LIQUID_GLASS_QUALITY;
  var DEFAULT_LIQUID_GLASS_MATERIAL_QUALITY = "full";
  var normalizeLiquidGlassMaterialQuality = (value) => value === "smooth" || value === "balanced" ? value : DEFAULT_LIQUID_GLASS_MATERIAL_QUALITY;
  var LIQUID_GLASS_THEMES = [
    { key: "vivid", label: "流光溢彩", description: "多彩流动", preview: "linear-gradient(135deg, #84b7ec, #b1a0ee 36%, #f4c174 68%, #84d9bd)" },
    { key: "hongguo", label: "红果", description: "薄荷青 · 杏橙 · 弧光", composed: true },
    { key: "daylight", label: "晴光", description: "银白 · 雾青 · 杏暖", composed: true },
    { key: "moon", label: "月汐", description: "月白 · 冰蓝 · 银灰", composed: true },
    { key: "sand", label: "暖砂", description: "暖白 · 浅砂 · 亚麻", composed: true },
    { key: "xuanji", label: "璇玑", description: "墨玉 · 鎏金刻度", dark: true, preview: "radial-gradient(circle at 76% 24%, #e8dfc82e, transparent 52%), radial-gradient(circle at 18% 88%, #1d4a38cc, transparent 60%), linear-gradient(150deg, #0d1713, #060d0a)" },
    { key: "spectra", label: "光谱", description: "深空 · 棱镜色散", dark: true, preview: "linear-gradient(115deg, transparent 42%, #a8c4ff40 46%, #ffffff70 50%, #b18cff40 54%, transparent 58%), radial-gradient(circle at 12% 20%, #16336b99, transparent 55%), linear-gradient(150deg, #0a1122, #04070f)" },
    { key: "starward", label: "牵星", description: "午夜 · 星图导航", dark: true, preview: "radial-gradient(1.5px 1.5px at 24% 30%, #ffffffe6, transparent 60%), radial-gradient(1px 1px at 68% 18%, #ffffffb3, transparent 60%), radial-gradient(1.2px 1.2px at 84% 42%, #ffffffcc, transparent 60%), radial-gradient(1px 1px at 42% 62%, #ffffff80, transparent 60%), linear-gradient(180deg, #040b1c, #0c2148)" }
  ];
  var isDarkGlassStyle = (value) => LIQUID_GLASS_THEMES.some((theme) => theme.key === value && theme.dark);
  var isLiquidGlassStyle = (value) => LIQUID_GLASS_THEMES.some((theme) => theme.key === value);
  var normalizeLiquidGlassStyle = (value) => isLiquidGlassStyle(value) ? value : DEFAULT_LIQUID_GLASS_STYLE;

  // source/src/lib/localData.js
  var STORAGE_KEYS2 = {
    investments: "eivra.investments.v1",
    teamProfiles: "eivra.team_profiles.v1",
    systemConfig: "eivra.system_config.v1",
    accessLogs: "eivra.access_logs.v1"
  };
  var GENESIS_APPLIED_KEY = "eivra.genesis_applied.v1";
  var DATA_PATCH_V20260205_KEY = "eivra.data_patch.v20260205";
  var DATA_PATCH_V20260206_KEY = "eivra.data_patch.v20260206";
  var ACCESS_LOG_MAX_ROWS = 600;
  var cloudBootstrapInProgress = false;
  var genesisApplying = false;
  var PAGE_AMBIENT_THEME_DEFAULTS = {
    new: "soft_blue",
    combo: "classic_white",
    settle: "classic_white",
    dashboard_overview: "classic_white",
    dashboard_analysis: "classic_white",
    dashboard_metrics: "classic_white",
    dashboard_report: "classic_white",
    dashboard_quants: "classic_white",
    quants: "classic_white",
    history: "classic_white",
    teams: "classic_white",
    params: "classic_white"
  };
  var PAGE_AMBIENT_THEME_VALUES = ["classic_white", "soft_blue", "soft_orange"];
  var normalizePageAmbientThemes = (themes) => {
    const incoming = themes && typeof themes === "object" ? themes : {};
    const next = { ...PAGE_AMBIENT_THEME_DEFAULTS };
    Object.keys(PAGE_AMBIENT_THEME_DEFAULTS).forEach((key) => {
      const candidate = String(incoming[key] || "").trim();
      if (PAGE_AMBIENT_THEME_VALUES.includes(candidate)) {
        next[key] = candidate;
      }
    });
    return next;
  };
  var DEFAULT_SYSTEM_CONFIG = {
    initialCapital: 600,
    riskCapRatio: 0.12,
    defaultOdds: 2.5,
    kellyDivisor: 4,
    kellyOverrideEnabled: false,
    kellyOverrideValue: 4,
    kellyAdjustment: 0,
    maxWorstDrawdownAlertPct: 22,
    backupCadence: "half_week",
    lastBackupAt: "",
    weightConf: 0.45,
    weightMode: 0.16,
    weightTys: 0.12,
    weightFid: 0.14,
    weightOdds: 0.06,
    weightFse: 0.07,
    // 注资历史记录
    capitalInjections: [],
    // 周期性结算记录（止盈/止损）—— 仅影响蓄水池当前周期，不影响历史总数据
    poolSettlements: [],
    // 周期自定义命名台账：[{ id: cycleId, name, created_at, updated_at }]
    // id 即 warReport 派生出的周期 id，故与 poolSettlements 同生共死（撤销结算一并清除）
    cycleTitles: [],
    // 自适应权重优化配置
    adaptiveWeights: {
      enabled: false,
      // 是否启用自动应用
      mode: "suggest",
      // 'suggest' | 'auto' | 'disabled'
      minSamples: 50,
      // 最小样本量
      learningRate: 0.05,
      // 学习率
      maxSingleChange: 0.02,
      // 单次最大变化
      priorStrength: 0.1,
      // 向先验回归强度
      updateEveryN: 5,
      // 每N场更新一次
      lastUpdateAt: "",
      // 上次更新时间
      updateCount: 0,
      // 累计更新次数
      bounds: {
        weightConf: [0.25, 0.65],
        weightMode: [0.08, 0.28],
        weightTys: [0.05, 0.22],
        weightFid: [0.06, 0.24],
        weightOdds: [0.02, 0.12],
        weightFse: [0.03, 0.15]
      },
      priors: {
        weightConf: 0.45,
        weightMode: 0.16,
        weightTys: 0.12,
        weightFid: 0.14,
        weightOdds: 0.06,
        weightFse: 0.07
      },
      initialPriors: {
        weightConf: 0.45,
        weightMode: 0.16,
        weightTys: 0.12,
        weightFid: 0.14,
        weightOdds: 0.06,
        weightFse: 0.07
      }
    },
    pageAmbientThemes: { ...PAGE_AMBIENT_THEME_DEFAULTS },
    // 液态玻璃背景（Liquid Glass）：UI 偏好，默认开启；时光穿越中同 pageAmbientThemes 一样保留当前值
    liquidGlassEnabled: true,
    // 背景主题选项统一维护于 design/liquidGlassThemes。
    liquidGlassStyle: DEFAULT_LIQUID_GLASS_STYLE,
    liquidGlassQuality: DEFAULT_LIQUID_GLASS_QUALITY,
    liquidGlassMaterialQuality: DEFAULT_LIQUID_GLASS_MATERIAL_QUALITY
  };
  var DEFAULT_TEAM_PROFILES = [
    { teamId: "arsenal", teamName: "阿森纳", abbreviations: ["ars", "arsenal", "阿森纳"], totalSamples: 18, avgRep: 0.42 },
    { teamId: "chelsea", teamName: "切尔西", abbreviations: ["che", "chelsea", "切尔西"], totalSamples: 16, avgRep: 0.48 },
    { teamId: "liverpool", teamName: "利物浦", abbreviations: ["liv", "liverpool", "利物浦"], totalSamples: 20, avgRep: 0.44 },
    { teamId: "mancity", teamName: "曼城", abbreviations: ["mci", "man city", "曼城"], totalSamples: 22, avgRep: 0.4 },
    { teamId: "manutd", teamName: "曼联", abbreviations: ["mun", "man united", "曼联"], totalSamples: 21, avgRep: 0.49 },
    { teamId: "tottenham", teamName: "热刺", abbreviations: ["tot", "spurs", "热刺"], totalSamples: 17, avgRep: 0.47 },
    { teamId: "newcastle", teamName: "纽卡", abbreviations: ["new", "newcastle", "纽卡"], totalSamples: 14, avgRep: 0.46 },
    { teamId: "astonvilla", teamName: "维拉", abbreviations: ["avl", "villa", "维拉"], totalSamples: 13, avgRep: 0.45 },
    { teamId: "barcelona", teamName: "巴塞罗那", abbreviations: ["bar", "barcelona", "巴萨", "巴塞罗那"], totalSamples: 15, avgRep: 0.43 },
    { teamId: "realmadrid", teamName: "皇马", abbreviations: ["rma", "real madrid", "皇马"], totalSamples: 19, avgRep: 0.41 }
  ];
  var TEAM_ALIAS_LIBRARY = [
    // Premier League (full coverage + common aliases)
    { teamId: "arsenal", teamName: "阿森纳", abbreviations: ["ars", "afc", "arsenal", "gunners", "阿森纳"] },
    { teamId: "astonvilla", teamName: "阿斯顿维拉", abbreviations: ["avl", "villa", "aston villa", "阿斯顿维拉", "维拉"] },
    { teamId: "bournemouth", teamName: "伯恩茅斯", abbreviations: ["bou", "bournemouth", "afcb", "伯恩茅斯", "樱桃"] },
    { teamId: "brentford", teamName: "布伦特福德", abbreviations: ["bre", "brentford", "布伦特福德"] },
    { teamId: "brighton", teamName: "布莱顿", abbreviations: ["bha", "brighton", "brighton & hove albion", "布莱顿"] },
    { teamId: "burnley", teamName: "伯恩利", abbreviations: ["bur", "burnley", "伯恩利"] },
    { teamId: "chelsea", teamName: "切尔西", abbreviations: ["che", "chelsea", "cfc", "切尔西"] },
    { teamId: "crystalpalace", teamName: "水晶宫", abbreviations: ["cry", "crystal palace", "水晶宫"] },
    { teamId: "everton", teamName: "埃弗顿", abbreviations: ["eve", "everton", "埃弗顿"] },
    { teamId: "fulham", teamName: "富勒姆", abbreviations: ["ful", "fulham", "富勒姆"] },
    { teamId: "ipswich", teamName: "伊普斯维奇", abbreviations: ["ips", "ipswich", "ipswich town", "伊普斯维奇"] },
    { teamId: "leicester", teamName: "莱斯特城", abbreviations: ["lei", "leicester", "leicester city", "莱斯特城"] },
    { teamId: "leeds", teamName: "利兹联", abbreviations: ["lee", "leeds", "leeds united", "利兹联"] },
    { teamId: "liverpool", teamName: "利物浦", abbreviations: ["liv", "liverpool", "lfc", "利物浦"] },
    { teamId: "mancity", teamName: "曼城", abbreviations: ["mci", "man city", "manchester city", "city", "曼城"] },
    { teamId: "manutd", teamName: "曼联", abbreviations: ["mun", "man utd", "manchester united", "utd", "曼联"] },
    { teamId: "newcastle", teamName: "纽卡斯尔", abbreviations: ["new", "newcastle", "newcastle united", "纽卡", "纽卡斯尔"] },
    { teamId: "nottingham", teamName: "诺丁汉森林", abbreviations: ["nfo", "nott'm forest", "nottingham forest", "诺丁汉森林"] },
    { teamId: "southampton", teamName: "南安普顿", abbreviations: ["sou", "southampton", "南安普顿"] },
    { teamId: "sunderland", teamName: "桑德兰", abbreviations: ["sun", "sunderland", "桑德兰"] },
    { teamId: "tottenham", teamName: "热刺", abbreviations: ["tot", "spurs", "tottenham", "tottenham hotspur", "热刺"] },
    { teamId: "westham", teamName: "西汉姆联", abbreviations: ["whu", "west ham", "west ham united", "西汉姆", "西汉姆联"] },
    { teamId: "wolves", teamName: "狼队", abbreviations: ["wol", "wolves", "wolverhampton", "wolverhampton wanderers", "狼队"] },
    // La Liga (mainstream)
    { teamId: "realmadrid", teamName: "皇马", abbreviations: ["rma", "real madrid", "madrid", "皇马"] },
    { teamId: "barcelona", teamName: "巴塞罗那", abbreviations: ["bar", "fcb", "barcelona", "巴萨", "巴塞罗那"] },
    { teamId: "atletico", teamName: "马竞", abbreviations: ["atm", "atleti", "atletico madrid", "马竞"] },
    { teamId: "athletic", teamName: "毕尔巴鄂", abbreviations: ["ath", "athletic club", "athletic bilbao", "毕尔巴鄂"] },
    { teamId: "realsociedad", teamName: "皇家社会", abbreviations: ["rso", "real sociedad", "皇家社会"] },
    { teamId: "betis", teamName: "贝蒂斯", abbreviations: ["bet", "real betis", "贝蒂斯"] },
    { teamId: "sevilla", teamName: "塞维利亚", abbreviations: ["sev", "sevilla", "塞维利亚"] },
    { teamId: "valencia", teamName: "瓦伦西亚", abbreviations: ["val", "valencia", "瓦伦西亚"] },
    { teamId: "villarreal", teamName: "黄潜", abbreviations: ["vil", "villarreal", "黄潜", "比利亚雷亚尔"] },
    { teamId: "girona", teamName: "赫罗纳", abbreviations: ["gir", "girona", "赫罗纳"] },
    // Serie A (mainstream)
    { teamId: "inter", teamName: "国际米兰", abbreviations: ["int", "inter", "inter milan", "国际米兰", "国米"] },
    { teamId: "milan", teamName: "米兰", abbreviations: ["mil", "ac milan", "milan", "米兰", "ac米兰"] },
    { teamId: "juventus", teamName: "尤文", abbreviations: ["juv", "juventus", "尤文", "尤文图斯"] },
    { teamId: "napoli", teamName: "那不勒斯", abbreviations: ["nap", "napoli", "那不勒斯"] },
    { teamId: "roma", teamName: "罗马", abbreviations: ["rom", "roma", "罗马"] },
    { teamId: "lazio", teamName: "拉齐奥", abbreviations: ["laz", "lazio", "拉齐奥"] },
    { teamId: "atalanta", teamName: "亚特兰大", abbreviations: ["ata", "atalanta", "亚特兰大"] },
    { teamId: "fiorentina", teamName: "佛罗伦萨", abbreviations: ["fio", "fiorentina", "佛罗伦萨"] },
    { teamId: "bologna", teamName: "博洛尼亚", abbreviations: ["bol", "bologna", "博洛尼亚"] },
    // Bundesliga (mainstream)
    { teamId: "bayern", teamName: "拜仁", abbreviations: ["bay", "bayern", "bayern munich", "拜仁"] },
    { teamId: "dortmund", teamName: "多特", abbreviations: ["bvb", "dor", "dortmund", "borussia dortmund", "多特"] },
    { teamId: "leverkusen", teamName: "勒沃库森", abbreviations: ["lev", "leverkusen", "勒沃库森"] },
    { teamId: "leipzig", teamName: "莱比锡", abbreviations: ["rbl", "rbl leipzig", "leipzig", "莱比锡"] },
    { teamId: "stuttgart", teamName: "斯图加特", abbreviations: ["stu", "stuttgart", "斯图加特"] },
    { teamId: "frankfurt", teamName: "法兰克福", abbreviations: ["sge", "fra", "frankfurt", "法兰克福"] },
    { teamId: "wolfsburg", teamName: "沃尔夫斯堡", abbreviations: ["wob", "wolfsburg", "沃尔夫斯堡"] },
    { teamId: "gladbach", teamName: "门兴", abbreviations: ["bmg", "m'gladbach", "gladbach", "门兴"] },
    // Ligue 1 (mainstream)
    { teamId: "psg", teamName: "巴黎圣日耳曼", abbreviations: ["psg", "paris", "paris saint-germain", "巴黎", "巴黎圣日耳曼"] },
    { teamId: "marseille", teamName: "马赛", abbreviations: ["om", "marseille", "马赛"] },
    { teamId: "monaco", teamName: "摩纳哥", abbreviations: ["asm", "monaco", "摩纳哥"] },
    { teamId: "lille", teamName: "里尔", abbreviations: ["losc", "lil", "lille", "里尔"] },
    { teamId: "lyon", teamName: "里昂", abbreviations: ["lyo", "lyon", "里昂"] },
    { teamId: "nice", teamName: "尼斯", abbreviations: ["nic", "nice", "尼斯"] },
    // ──────────────────────────────────────────────────────────────
    //  国际赛 · 2026 美加墨世界杯 48 强（后台预备）
    //  仅供「新建比赛」的输入解析 / 自动补全 / 缩写归一化使用：在被某场比赛
    //  实际使用并保存之前，不会出现在「球队档案馆」列表里——档案馆只渲染历史
    //  样本中出现过的球队。缩写取 FIFA 三字码 + 英文名 + 中文常用别名，与
    //  teamDatabase.js 的国际赛条目保持一致；首次被保存时档案会自动继承这些别名。
    // ──────────────────────────────────────────────────────────────
    // A 组
    { teamId: "natl_mexico", teamName: "墨西哥", abbreviations: ["mex", "mexico", "墨西哥", "墨西哥队"] },
    { teamId: "natl_southafrica", teamName: "南非", abbreviations: ["rsa", "south africa", "南非", "南非队"] },
    { teamId: "natl_southkorea", teamName: "韩国", abbreviations: ["kor", "korea", "south korea", "韩国", "韩国队", "太极虎"] },
    { teamId: "natl_czechia", teamName: "捷克", abbreviations: ["cze", "czech", "czechia", "捷克", "捷克队"] },
    // B 组
    { teamId: "natl_canada", teamName: "加拿大", abbreviations: ["can", "canada", "加拿大", "加拿大队"] },
    { teamId: "natl_bosnia", teamName: "波黑", abbreviations: ["bih", "bosnia", "bosnia and herzegovina", "波黑", "波斯尼亚", "波黑队", "波斯尼亚和黑塞哥维那"] },
    { teamId: "natl_qatar", teamName: "卡塔尔", abbreviations: ["qat", "qatar", "卡塔尔", "卡塔尔队"] },
    { teamId: "natl_switzerland", teamName: "瑞士", abbreviations: ["sui", "switzerland", "瑞士", "瑞士队"] },
    // C 组
    { teamId: "natl_brazil", teamName: "巴西", abbreviations: ["bra", "brazil", "巴西", "巴西队", "桑巴军团", "五星巴西"] },
    { teamId: "natl_morocco", teamName: "摩洛哥", abbreviations: ["mar", "morocco", "摩洛哥", "摩洛哥队", "阿特拉斯雄狮"] },
    { teamId: "natl_haiti", teamName: "海地", abbreviations: ["hai", "haiti", "海地", "海地队"] },
    { teamId: "natl_scotland", teamName: "苏格兰", abbreviations: ["sco", "scotland", "苏格兰", "苏格兰队"] },
    // D 组
    { teamId: "natl_usa", teamName: "美国", abbreviations: ["usa", "united states", "美国", "美国队"] },
    { teamId: "natl_paraguay", teamName: "巴拉圭", abbreviations: ["par", "paraguay", "巴拉圭", "巴拉圭队"] },
    { teamId: "natl_australia", teamName: "澳大利亚", abbreviations: ["aus", "australia", "澳大利亚", "澳大利亚队", "袋鼠军团"] },
    { teamId: "natl_turkey", teamName: "土耳其", abbreviations: ["tur", "turkey", "turkiye", "土耳其", "土耳其队"] },
    // E 组
    { teamId: "natl_germany", teamName: "德国", abbreviations: ["ger", "germany", "德国", "德国队", "日耳曼战车"] },
    { teamId: "natl_curacao", teamName: "库拉索", abbreviations: ["cuw", "curacao", "库拉索", "库拉索队"] },
    { teamId: "natl_ivorycoast", teamName: "科特迪瓦", abbreviations: ["civ", "ivory coast", "cote divoire", "科特迪瓦", "象牙海岸", "科特迪瓦队"] },
    { teamId: "natl_ecuador", teamName: "厄瓜多尔", abbreviations: ["ecu", "ecuador", "厄瓜多尔", "厄瓜多尔队"] },
    // F 组
    { teamId: "natl_netherlands", teamName: "荷兰", abbreviations: ["ned", "netherlands", "holland", "荷兰", "荷兰队", "橙衣军团"] },
    { teamId: "natl_japan", teamName: "日本", abbreviations: ["jpn", "japan", "日本", "日本队", "蓝色武士"] },
    { teamId: "natl_sweden", teamName: "瑞典", abbreviations: ["swe", "sweden", "瑞典", "瑞典队"] },
    { teamId: "natl_tunisia", teamName: "突尼斯", abbreviations: ["tun", "tunisia", "突尼斯", "突尼斯队"] },
    // G 组
    { teamId: "natl_belgium", teamName: "比利时", abbreviations: ["bel", "belgium", "比利时", "比利时队", "红魔", "欧洲红魔"] },
    { teamId: "natl_egypt", teamName: "埃及", abbreviations: ["egy", "egypt", "埃及", "埃及队", "法老"] },
    { teamId: "natl_iran", teamName: "伊朗", abbreviations: ["irn", "iran", "伊朗", "伊朗队", "波斯铁骑"] },
    { teamId: "natl_newzealand", teamName: "新西兰", abbreviations: ["nzl", "new zealand", "新西兰", "新西兰队", "全白队"] },
    // H 组
    { teamId: "natl_spain", teamName: "西班牙", abbreviations: ["esp", "spain", "西班牙", "西班牙队", "斗牛士军团"] },
    { teamId: "natl_capeverde", teamName: "佛得角", abbreviations: ["cpv", "cape verde", "佛得角", "佛得角队"] },
    { teamId: "natl_saudi", teamName: "沙特阿拉伯", abbreviations: ["ksa", "saudi arabia", "saudi", "沙特阿拉伯", "沙特", "沙特队"] },
    { teamId: "natl_uruguay", teamName: "乌拉圭", abbreviations: ["uru", "uruguay", "乌拉圭", "乌拉圭队"] },
    // I 组
    { teamId: "natl_france", teamName: "法国", abbreviations: ["fra", "france", "法国", "法国队", "高卢雄鸡"] },
    { teamId: "natl_senegal", teamName: "塞内加尔", abbreviations: ["sen", "senegal", "塞内加尔", "塞内加尔队"] },
    { teamId: "natl_iraq", teamName: "伊拉克", abbreviations: ["irq", "iraq", "伊拉克", "伊拉克队"] },
    { teamId: "natl_norway", teamName: "挪威", abbreviations: ["nor", "norway", "挪威", "挪威队"] },
    // J 组
    { teamId: "natl_argentina", teamName: "阿根廷", abbreviations: ["arg", "argentina", "阿根廷", "阿根廷队", "潘帕斯雄鹰"] },
    { teamId: "natl_algeria", teamName: "阿尔及利亚", abbreviations: ["alg", "dza", "algeria", "阿尔及利亚", "阿尔及利亚队"] },
    { teamId: "natl_austria", teamName: "奥地利", abbreviations: ["aut", "austria", "奥地利", "奥地利队"] },
    { teamId: "natl_jordan", teamName: "约旦", abbreviations: ["jor", "jordan", "约旦", "约旦队"] },
    // K 组
    { teamId: "natl_portugal", teamName: "葡萄牙", abbreviations: ["por", "portugal", "葡萄牙", "葡萄牙队"] },
    { teamId: "natl_drcongo", teamName: "刚果民主", abbreviations: ["cod", "dr congo", "congo dr", "刚果民主", "刚果民主共和国", "刚果金", "DR刚果"] },
    { teamId: "natl_uzbekistan", teamName: "乌兹别克斯坦", abbreviations: ["uzb", "uzbekistan", "乌兹别克斯坦", "乌兹别克", "乌兹别克斯坦队"] },
    { teamId: "natl_colombia", teamName: "哥伦比亚", abbreviations: ["col", "colombia", "哥伦比亚", "哥伦比亚队"] },
    // L 组
    { teamId: "natl_england", teamName: "英格兰", abbreviations: ["eng", "england", "英格兰", "英格兰队", "三狮军团"] },
    { teamId: "natl_croatia", teamName: "克罗地亚", abbreviations: ["cro", "croatia", "克罗地亚", "克罗地亚队", "格子军团"] },
    { teamId: "natl_ghana", teamName: "加纳", abbreviations: ["gha", "ghana", "加纳", "加纳队", "黑星"] },
    { teamId: "natl_panama", teamName: "巴拿马", abbreviations: ["pan", "panama", "巴拿马", "巴拿马队"] }
  ];
  var isBrowser3 = typeof window !== "undefined";
  var normalize = (value) => String(value || "").trim().toLowerCase();
  var markGenesisApplied = () => {
    if (!isBrowser3) return;
    brandLocalStorage.setItem(GENESIS_APPLIED_KEY, "1");
  };
  var mergeAliases = (...groups) => {
    const values2 = [];
    groups.forEach((group) => {
      if (Array.isArray(group)) {
        values2.push(...group);
        return;
      }
      values2.push(group);
    });
    const seen = /* @__PURE__ */ new Set();
    const result = [];
    values2.forEach((raw) => {
      const clean = String(raw || "").trim();
      if (!clean) return;
      const key = normalize(clean);
      if (seen.has(key)) return;
      seen.add(key);
      result.push(clean);
    });
    return result;
  };
  var getTeamDirectoryProfiles = (profiles = getTeamProfiles()) => {
    const byName = /* @__PURE__ */ new Map();
    TEAM_ALIAS_LIBRARY.forEach((profile) => {
      const key = normalize(profile.teamName);
      byName.set(key, {
        teamId: profile.teamId,
        teamName: profile.teamName,
        abbreviations: mergeAliases([profile.teamName], profile.abbreviations || []),
        totalSamples: 0,
        avgRep: 0.5
      });
    });
    profiles.map(withTeamDefaults).forEach((profile) => {
      const key = normalize(profile.teamName);
      const existing = byName.get(key);
      if (existing) {
        byName.set(key, {
          ...existing,
          ...profile,
          teamName: existing.teamName || profile.teamName,
          abbreviations: mergeAliases(
            [existing.teamName, profile.teamName],
            existing.abbreviations || [],
            profile.abbreviations || []
          )
        });
        return;
      }
      byName.set(key, {
        ...profile,
        abbreviations: mergeAliases([profile.teamName], profile.abbreviations || [])
      });
    });
    return [...byName.values()];
  };
  var readJSON2 = (key, fallback) => {
    if (!isBrowser3) return fallback;
    if (isPreviewMode()) return previewRead(key, fallback);
    try {
      const raw = brandLocalStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };
  var writeJSON2 = (key, value, options = {}) => {
    if (!isBrowser3) return;
    if (isPreviewMode()) {
      previewWrite(key, value);
      window.dispatchEvent(new CustomEvent("eivra:data-changed", { detail: { key, ...options, preview: true } }));
      return;
    }
    brandLocalStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("eivra:data-changed", { detail: { key, ...options } }));
    if (!cloudBootstrapInProgress && (key === STORAGE_KEYS2.investments || key === STORAGE_KEYS2.teamProfiles || key === STORAGE_KEYS2.systemConfig || key === STORAGE_KEYS2.accessLogs)) {
      scheduleGitCommit(() => exportDataBundle());
    }
  };
  if (typeof window !== "undefined") {
    const DISPLAY_MODE_HANDLER_KEY = "__eivraDisplayModeHandler__";
    if (typeof window[DISPLAY_MODE_HANDLER_KEY] === "function") {
      window.removeEventListener(DISPLAY_MODE_CHANGE_EVENT, window[DISPLAY_MODE_HANDLER_KEY]);
    }
    const handler = (event) => {
      resetPreviewStore();
      window.dispatchEvent(
        new CustomEvent("eivra:data-changed", { detail: { key: "__display_mode__" } })
      );
      const mode = event?.detail?.mode;
      if (mode === "full" || mode == null && !isPreviewMode()) {
        syncFromGitOnUnlock();
      }
    };
    window[DISPLAY_MODE_HANDLER_KEY] = handler;
    window.addEventListener(DISPLAY_MODE_CHANGE_EVENT, handler);
  }
  var getTimeMachineDataOverride = (key) => {
    if (!isBrowser3) return null;
    if (isPreviewMode()) return null;
    const session = getTimeMachineSession();
    if (!session || !session.bundle) return null;
    switch (key) {
      case STORAGE_KEYS2.investments:
        return Array.isArray(session.bundle.investments) ? session.bundle.investments : null;
      case STORAGE_KEYS2.teamProfiles:
        return Array.isArray(session.bundle.team_profiles) ? session.bundle.team_profiles : null;
      case STORAGE_KEYS2.systemConfig:
        return session.bundle.system_config && typeof session.bundle.system_config === "object" ? session.bundle.system_config : null;
      default:
        return null;
    }
  };
  var isInTimeMachineMode = () => isPreviewMode() ? false : isInTimeMachineSession();
  var getTimeMachineSessionInfo = () => {
    if (isPreviewMode()) return null;
    const session = getTimeMachineSession();
    if (!session) return null;
    return {
      snapshotId: session.snapshotId,
      title: session.title,
      monthKey: session.monthKey,
      snapshotAt: session.snapshotAt,
      startedAt: session.startedAt
    };
  };
  var withTeamDefaults = (profile) => ({
    teamId: profile.teamId,
    teamName: profile.teamName,
    abbreviations: profile.abbreviations || [],
    totalSamples: Number(profile.totalSamples) || 0,
    avgRep: Number(profile.avgRep) || 0.5
  });
  var normalizeAccessLogRecord = (record) => {
    const createdAtDate = new Date(record?.created_at || record?.visited_at || Date.now());
    const created_at = Number.isNaN(createdAtDate.getTime()) ? (/* @__PURE__ */ new Date()).toISOString() : createdAtDate.toISOString();
    return {
      id: String(record?.id || `visit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`),
      created_at,
      route: String(record?.route || "/params"),
      endpoint: String(record?.endpoint || ""),
      host: String(record?.host || ""),
      origin: String(record?.origin || ""),
      access_channel: String(record?.access_channel || "web"),
      device_type: String(record?.device_type || "unknown"),
      client_browser: String(record?.client_browser || ""),
      client_os: String(record?.client_os || ""),
      user_agent: String(record?.user_agent || ""),
      platform: String(record?.platform || ""),
      language: String(record?.language || ""),
      timezone: String(record?.timezone || ""),
      viewport: String(record?.viewport || ""),
      screen: String(record?.screen || ""),
      network_type: String(record?.network_type || ""),
      referrer: String(record?.referrer || ""),
      session_id: String(record?.session_id || ""),
      ip: String(record?.ip || "N/A (browser restricted)"),
      mac: String(record?.mac || "N/A (browser restricted)")
    };
  };
  var getSystemConfig = () => {
    const tmOverride = getTimeMachineDataOverride(STORAGE_KEYS2.systemConfig);
    if (tmOverride !== null) {
      const merged2 = { ...DEFAULT_SYSTEM_CONFIG, ...tmOverride };
      const currentConfig = readJSON2(STORAGE_KEYS2.systemConfig, null);
      if (currentConfig?.pageAmbientThemes) {
        merged2.pageAmbientThemes = normalizePageAmbientThemes(currentConfig.pageAmbientThemes);
      } else {
        merged2.pageAmbientThemes = normalizePageAmbientThemes(tmOverride?.pageAmbientThemes);
      }
      if (typeof currentConfig?.liquidGlassEnabled === "boolean") {
        merged2.liquidGlassEnabled = currentConfig.liquidGlassEnabled;
      }
      if (isLiquidGlassStyle(currentConfig?.liquidGlassStyle)) {
        merged2.liquidGlassStyle = currentConfig.liquidGlassStyle;
      }
      merged2.liquidGlassStyle = normalizeLiquidGlassStyle(merged2.liquidGlassStyle);
      merged2.liquidGlassQuality = normalizeLiquidGlassQuality(currentConfig?.liquidGlassQuality);
      merged2.liquidGlassMaterialQuality = normalizeLiquidGlassMaterialQuality(currentConfig?.liquidGlassMaterialQuality);
      return merged2;
    }
    ensureGenesisApplied();
    const saved = readJSON2(STORAGE_KEYS2.systemConfig, null);
    const merged = { ...DEFAULT_SYSTEM_CONFIG, ...saved || {} };
    merged.pageAmbientThemes = normalizePageAmbientThemes(saved?.pageAmbientThemes);
    merged.liquidGlassStyle = normalizeLiquidGlassStyle(merged.liquidGlassStyle);
    merged.liquidGlassQuality = normalizeLiquidGlassQuality(merged.liquidGlassQuality);
    merged.liquidGlassMaterialQuality = normalizeLiquidGlassMaterialQuality(merged.liquidGlassMaterialQuality);
    return merged;
  };
  var initializeFlagshipGlassDefault = () => {
    try {
      const saved = readJSON2(STORAGE_KEYS2.systemConfig, null);
      if (!saved) return;
      if (saved.liquidGlassStylePinned) return;
      if (isDarkGlassStyle(saved.liquidGlassStyle)) return;
      if (saved.liquidGlassStyle !== void 0 && !isLiquidGlassStyle(saved.liquidGlassStyle)) return;
      saveSystemConfig({ liquidGlassStyle: DEFAULT_LIQUID_GLASS_STYLE });
    } catch {
    }
  };
  var saveSystemConfig = (configPatch) => {
    if (!configPatch) return getSystemConfig();
    const UI_CONFIG_KEYS = ["pageAmbientThemes", "liquidGlassEnabled", "liquidGlassStyle", "liquidGlassStylePinned", "liquidGlassQuality", "liquidGlassMaterialQuality"];
    const isOnlyUIConfig = Object.keys(configPatch).every((key) => UI_CONFIG_KEYS.includes(key));
    const current = isOnlyUIConfig && isInTimeMachineMode() ? { ...DEFAULT_SYSTEM_CONFIG, ...readJSON2(STORAGE_KEYS2.systemConfig, null) || {} } : getSystemConfig();
    const next = {
      ...current,
      ...configPatch || {}
    };
    next.liquidGlassQuality = normalizeLiquidGlassQuality(next.liquidGlassQuality);
    next.liquidGlassMaterialQuality = normalizeLiquidGlassMaterialQuality(next.liquidGlassMaterialQuality);
    if (!isOnlyUIConfig && !checkReadOnlyMode("Update System Config")) {
      return next;
    }
    if (Object.prototype.hasOwnProperty.call(configPatch || {}, "pageAmbientThemes")) {
      next.pageAmbientThemes = normalizePageAmbientThemes({
        ...current.pageAmbientThemes,
        ...configPatch && configPatch.pageAmbientThemes || {}
      });
    }
    if (isOnlyUIConfig || isInTimeMachineMode() === false) {
      writeJSON2(STORAGE_KEYS2.systemConfig, next, isOnlyUIConfig ? { uiOnly: true } : {});
    }
    return next;
  };
  var getCapitalInjections = () => {
    const config = getSystemConfig();
    return Array.isArray(config.capitalInjections) ? config.capitalInjections : [];
  };
  var addCapitalInjection = (amount, note = "") => {
    const config = getSystemConfig();
    const injections = Array.isArray(config.capitalInjections) ? config.capitalInjections : [];
    const newInjection = {
      id: `inj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      amount: Number(amount),
      note: String(note || "").trim(),
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const updatedInjections = [...injections, newInjection];
    saveSystemConfig({ capitalInjections: updatedInjections });
    return newInjection;
  };
  var CYCLE_TITLE_MAX_LEN = 24;
  var getCycleTitles = () => {
    const config = getSystemConfig();
    return Array.isArray(config.cycleTitles) ? config.cycleTitles : [];
  };
  var setCycleTitle = (cycleId, title) => {
    const id = String(cycleId || "").trim();
    if (!id) return null;
    const clean = String(title || "").trim().slice(0, CYCLE_TITLE_MAX_LEN);
    const titles = getCycleTitles();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (!clean) {
      saveSystemConfig({ cycleTitles: titles.filter((item) => item.id !== id) });
      return null;
    }
    const existing = titles.find((item) => item.id === id);
    const next = existing ? titles.map((item) => item.id === id ? { ...item, title: clean, name: clean, updated_at: now } : item) : [...titles, { id, title: clean, name: clean, created_at: now, updated_at: now }];
    saveSystemConfig({ cycleTitles: next });
    return next.find((item) => item.id === id) || null;
  };
  var getPoolSettlements = () => {
    const config = getSystemConfig();
    return Array.isArray(config.poolSettlements) ? config.poolSettlements : [];
  };
  var settlePool = ({
    type,
    realizedProfit = 0,
    poolBefore = 0,
    cycleBase = 0,
    newCapital = 0,
    nextCycleName = ""
  } = {}) => {
    const config = getSystemConfig();
    const settlements = Array.isArray(config.poolSettlements) ? config.poolSettlements : [];
    const injections = Array.isArray(config.capitalInjections) ? config.capitalInjections : [];
    const now = Date.now();
    const allocation = Math.max(0, Number(newCapital) || 0);
    const settlement = {
      id: `stl_${now}_${Math.random().toString(36).slice(2, 8)}`,
      type: type === "stop_loss" ? "stop_loss" : "take_profit",
      realizedProfit: Number(realizedProfit) || 0,
      poolBefore: Number(poolBefore) || 0,
      cycleBase: Number(cycleBase) || 0,
      newCapital: allocation,
      linkedInjectionId: null,
      created_at: new Date(now).toISOString()
    };
    const patch = { poolSettlements: [...settlements, settlement] };
    if (allocation > 0) {
      const injection = {
        id: `inj_${now}_${Math.random().toString(36).slice(2, 8)}`,
        amount: allocation,
        note: "周期结算划拨",
        created_at: new Date(now + 1).toISOString()
      };
      settlement.linkedInjectionId = injection.id;
      patch.capitalInjections = [...injections, injection];
      patch.initialCapital = Number(config.initialCapital || 0) + allocation;
    }
    const cycleName = String(nextCycleName || "").trim().slice(0, CYCLE_TITLE_MAX_LEN);
    if (cycleName) {
      const titles = Array.isArray(config.cycleTitles) ? config.cycleTitles : [];
      const nextCycleId = `cycle_${settlement.id}`;
      patch.cycleTitles = [
        ...titles.filter((item) => item.id !== nextCycleId),
        { id: nextCycleId, title: cycleName, name: cycleName, created_at: new Date(now).toISOString(), updated_at: new Date(now).toISOString() }
      ];
    }
    saveSystemConfig(patch);
    return settlement;
  };
  var recallPoolSettlement = (settlementId) => {
    const config = getSystemConfig();
    const settlements = Array.isArray(config.poolSettlements) ? config.poolSettlements : [];
    const target = settlements.find((item) => item.id === settlementId);
    if (!target) return false;
    const patch = { poolSettlements: settlements.filter((item) => item.id !== settlementId) };
    const titles = Array.isArray(config.cycleTitles) ? config.cycleTitles : [];
    const orphanCycleId = `cycle_${settlementId}`;
    if (titles.some((item) => item.id === orphanCycleId)) {
      patch.cycleTitles = titles.filter((item) => item.id !== orphanCycleId);
    }
    if (target.linkedInjectionId) {
      const injections = Array.isArray(config.capitalInjections) ? config.capitalInjections : [];
      patch.capitalInjections = injections.filter((item) => item.id !== target.linkedInjectionId);
      patch.initialCapital = Math.max(0, Number(config.initialCapital || 0) - Number(target.newCapital || 0));
    }
    saveSystemConfig(patch);
    return true;
  };
  var getTeamProfiles = () => {
    const tmOverride = getTimeMachineDataOverride(STORAGE_KEYS2.teamProfiles);
    if (tmOverride !== null) {
      const data = Array.isArray(tmOverride) ? tmOverride : [];
      return data.map(withTeamDefaults);
    }
    ensureGenesisApplied();
    applyManualDataPatchV20260206();
    const saved = readJSON2(STORAGE_KEYS2.teamProfiles, null);
    if (Array.isArray(saved) && saved.length > 0) {
      return saved.map(withTeamDefaults);
    }
    writeJSON2(STORAGE_KEYS2.teamProfiles, DEFAULT_TEAM_PROFILES);
    return DEFAULT_TEAM_PROFILES;
  };
  var searchTeamProfiles = (query, profiles = getTeamProfiles(), limit = 6) => {
    const normalized = normalize(query);
    if (!normalized) return [];
    const directory = getTeamDirectoryProfiles(profiles);
    const scored = directory.map((profile) => {
      const teamName = normalize(profile.teamName);
      const allAliases = mergeAliases([teamName], (profile.abbreviations || []).map(normalize));
      const exact = allAliases.some((alias) => alias === normalized);
      const startsWith = allAliases.some((alias) => alias.startsWith(normalized));
      const contains = allAliases.some((alias) => alias.includes(normalized));
      let score = 0;
      if (exact) score += 12;
      if (startsWith) score += 4;
      if (contains) score += 1;
      return { profile, score };
    }).filter((item) => item.score > 0).sort(
      (a, b) => b.score - a.score || b.profile.totalSamples - a.profile.totalSamples || a.profile.teamName.length - b.profile.teamName.length
    ).slice(0, limit).map((item) => item.profile);
    return scored;
  };
  var findTeamProfile = (query, profiles = getTeamProfiles()) => {
    const normalized = normalize(query);
    if (!normalized) return null;
    const directory = getTeamDirectoryProfiles(profiles);
    return directory.find((profile) => {
      const aliases = [profile.teamName, ...profile.abbreviations || []];
      return aliases.some((alias) => normalize(alias) === normalized);
    }) || null;
  };
  var createNewTeamProfile = (teamName) => {
    const cleanName = String(teamName || "").trim();
    const teamId = typeof crypto !== "undefined" && crypto.randomUUID ? `team_${crypto.randomUUID()}` : `team_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const libraryHit = TEAM_ALIAS_LIBRARY.find((profile) => normalize(profile.teamName) === normalize(cleanName));
    const abbreviations = libraryHit && Array.isArray(libraryHit.abbreviations) && libraryHit.abbreviations.length > 0 ? mergeAliases([cleanName], libraryHit.abbreviations) : [normalize(cleanName)];
    return {
      teamId,
      teamName: cleanName,
      abbreviations,
      totalSamples: 0,
      avgRep: 0.5
    };
  };
  var ensureTeamProfile = (teamName) => {
    const cleanName = String(teamName || "").trim();
    if (!cleanName) return null;
    const current = getTeamProfiles();
    const existing = findTeamProfile(cleanName, current);
    if (existing) return existing;
    const created = createNewTeamProfile(cleanName);
    writeJSON2(STORAGE_KEYS2.teamProfiles, [...current, created]);
    return created;
  };
  var bumpTeamSamples = (teamNames = []) => {
    if (!Array.isArray(teamNames) || teamNames.length === 0) return;
    const current = getTeamProfiles();
    let changed = false;
    const updated = current.map((profile) => ({ ...profile }));
    teamNames.forEach((name) => {
      const cleanName = String(name || "").trim();
      if (!cleanName) return;
      let matchedProfile = updated.find((profile) => {
        const aliases = [profile.teamName, ...profile.abbreviations || []];
        return aliases.some((alias) => normalize(alias) === normalize(cleanName));
      });
      if (!matchedProfile) {
        matchedProfile = createNewTeamProfile(cleanName);
        updated.push(matchedProfile);
      }
      matchedProfile.totalSamples += 1;
      changed = true;
    });
    if (changed) {
      writeJSON2(STORAGE_KEYS2.teamProfiles, updated);
    }
  };
  var VALID_TYS_VALUES = /* @__PURE__ */ new Set(["S", "M", "L", "H"]);
  var normalizeTysValue = (value) => {
    const normalizedValue = String(value || "").trim().toUpperCase();
    return VALID_TYS_VALUES.has(normalizedValue) ? normalizedValue : "";
  };
  var normalizeMatchRecord = (matchRaw) => {
    const match = matchRaw && typeof matchRaw === "object" ? { ...matchRaw } : {};
    const legacyTys = normalizeTysValue(match.tys_base || match.tysBase || match.tys);
    const tysHome = normalizeTysValue(match.tys_home) || legacyTys || "M";
    const tysAway = normalizeTysValue(match.tys_away) || legacyTys || tysHome;
    const fidParsed = Number.parseFloat(match.fid);
    const fid = Number.isFinite(fidParsed) ? fidParsed : 0.4;
    const fallbackOdds = Number.parseFloat(match.odds);
    const entries = normalizeEntries(match.entries, match.entry_text || match.entry || "", fallbackOdds);
    const normalizedEntryText = String(match.entry_text || "").trim() || entries.map((entry) => entry.name).join(", ");
    const entryMarket = getPrimaryEntryMarket(entries, normalizedEntryText);
    const invalidOdds = entries.some((entry) => !isValidDecimalOdds(entry.odds)) || entries.length === 0 && !isValidDecimalOdds(match.odds);
    return {
      ...match,
      entries,
      entry_text: normalizedEntryText,
      entry_market_type: match.entry_market_type || entryMarket.marketType,
      entry_market_label: match.entry_market_label || entryMarket.marketLabel,
      entry_semantic_key: match.entry_semantic_key || entryMarket.semanticKey,
      tys_home: tysHome,
      tys_away: tysAway,
      fid,
      model_validation: invalidOdds ? { valid: false, reason: "invalid_decimal_odds" } : { valid: true }
    };
  };
  var calcCombinedOdds = (matches, fallback = 0) => {
    if (matches.some((match) => match.model_validation?.valid === false)) return 0;
    const odds = matches.map((match) => {
      if (Array.isArray(match?.entries) && match.entries.length > 0) {
        const matchFallback = Number.parseFloat(match?.odds);
        const safeFallback = Number.isFinite(matchFallback) && matchFallback > 1 ? matchFallback : 2.5;
        return calcAtomicEquivalentOdds(match.entries, safeFallback);
      }
      return Number.parseFloat(match?.odds);
    });
    if (odds.length === 0 || odds.some((odd) => !Number.isFinite(odd) || odd <= 0)) {
      const parsedFallback = Number.parseFloat(fallback);
      return Number.isFinite(parsedFallback) ? parsedFallback : 0;
    }
    const product = odds.reduce((result, odd) => result * odd, 1);
    return Number(product.toFixed(2));
  };
  var normalizeInvestmentRecord = (itemRaw) => {
    const item = itemRaw && typeof itemRaw === "object" ? { ...itemRaw } : {};
    const matches = Array.isArray(item.matches) ? item.matches.map(normalizeMatchRecord) : [];
    const parlaySizeParsed = Number.parseInt(item.parlay_size, 10);
    const parlaySize = Number.isFinite(parlaySizeParsed) && parlaySizeParsed > 0 ? parlaySizeParsed : matches.length || 1;
    const combinedOdds = calcCombinedOdds(matches, item.combined_odds);
    return {
      ...item,
      parlay_size: parlaySize,
      combined_odds: combinedOdds,
      matches
    };
  };
  var cloneMatchWithOverrides = (match, overrides = {}) => {
    if (!match || typeof match !== "object") return null;
    const next = { ...match, ...overrides };
    if (Array.isArray(match.entries)) {
      next.entries = match.entries.map((entry) => ({ ...entry }));
    }
    if (Object.prototype.hasOwnProperty.call(overrides, "odds")) {
      const parsedOdds = Number.parseFloat(overrides.odds);
      if (Number.isFinite(parsedOdds)) {
        next.odds = parsedOdds;
        if (Array.isArray(next.entries) && next.entries.length > 0) {
          next.entries = next.entries.map((entry, index) => index === 0 ? { ...entry, odds: parsedOdds } : entry);
        }
      }
    }
    return normalizeMatchRecord(next);
  };
  var averageMatchField = (matches, field) => {
    const values2 = matches.map((match) => Number.parseFloat(match?.[field])).filter((value) => Number.isFinite(value));
    if (values2.length === 0) return 0;
    return values2.reduce((sum, value) => sum + value, 0) / values2.length;
  };
  var buildInvestmentLegSignature = (item) => {
    const matches = Array.isArray(item?.matches) ? item.matches : [];
    const legs = matches.map((match) => {
      const odd = Number.parseFloat(match?.odds);
      const oddText = Number.isFinite(odd) ? odd.toFixed(2) : "-";
      const entryText = match?.entry_text || (Array.isArray(match?.entries) ? match.entries.map((entry) => entry?.name || "").filter(Boolean).join("|") : "");
      return [normalize(match?.home_team), normalize(match?.away_team), normalize(entryText), oddText].join("::");
    }).join("||");
    return `${matches.length}::${legs}`;
  };
  var buildSplitInvestmentsFromLegacy11 = (legacyItem) => {
    const baseMatches = Array.isArray(legacyItem?.matches) ? legacyItem.matches : [];
    if (baseMatches.length === 0) return [];
    const baseTime = new Date(legacyItem.created_at || "2026-01-28T12:00:00.000Z").getTime();
    const specs = [
      { idSuffix: "t1", inputs: 100, legs: [{ index: 1 }, { index: 5 }] },
      // 2x1, 100
      { idSuffix: "t2", inputs: 100, legs: [{ index: 1 }, { index: 4 }, { index: 2 }] },
      // 3x1, 100
      { idSuffix: "t3", inputs: 40, legs: [{ index: 11 }, { index: 4 }, { index: 5 }] },
      // 3x1, 40
      { idSuffix: "t4", inputs: 40, legs: [{ index: 5 }, { index: 7, odds: 1.63 }, { index: 3 }] },
      // 3x1, 40
      { idSuffix: "t5", inputs: 40, legs: [{ index: 1 }, { index: 10, odds: 1.84 }, { index: 6, odds: 3.93 }] },
      // 3x1, 40
      { idSuffix: "t6", inputs: 42, legs: [{ index: 1 }, { index: 8, odds: 4.3 }, { index: 9, odds: 4.9 }] }
      // 3x1, 42
    ];
    return specs.map((spec, specIndex) => {
      const matches = spec.legs.map((leg, legIndex) => {
        const source = baseMatches[leg.index - 1];
        if (!source) return null;
        return cloneMatchWithOverrides(source, {
          id: `${legacyItem.id}_${spec.idSuffix}_m${legIndex + 1}`,
          ...Number.isFinite(Number.parseFloat(leg.odds)) ? { odds: Number(leg.odds) } : {}
        });
      }).filter(Boolean);
      if (matches.length === 0) return null;
      const combinedOdds = calcCombinedOdds(matches, 0);
      const expectedRating = Number(averageMatchField(matches, "conf").toFixed(2));
      const actualRating = Number(averageMatchField(matches, "match_rating").toFixed(2));
      const status = matches.every((match) => match.is_correct === true) ? "win" : "lose";
      const stake = Number(spec.inputs);
      const revenues = status === "win" ? Number((stake * combinedOdds).toFixed(2)) : 0;
      const profit = Number((revenues - stake).toFixed(2));
      return normalizeInvestmentRecord({
        ...legacyItem,
        id: `${legacyItem.id}_${spec.idSuffix}`,
        created_at: new Date(baseTime + specIndex * 6e4).toISOString(),
        parlay_size: matches.length,
        inputs: stake,
        suggested_amount: stake,
        expected_rating: expectedRating,
        expected_rating_semantics: MEAN_LEG_RATING_SEMANTICS,
        combined_odds: combinedOdds,
        status,
        revenues,
        profit,
        actual_rating: actualRating,
        matches
      });
    }).filter(Boolean);
  };
  var applyManualDataPatchV20260205 = () => {
    if (!isBrowser3) return;
    if (brandLocalStorage.getItem(DATA_PATCH_V20260205_KEY) === "1") return;
    const rawInvestments = readJSON2(STORAGE_KEYS2.investments, null);
    if (!Array.isArray(rawInvestments)) {
      brandLocalStorage.setItem(DATA_PATCH_V20260205_KEY, "1");
      return;
    }
    let nextInvestments = rawInvestments.map((item) => normalizeInvestmentRecord(item));
    let changed = false;
    const january31Index = nextInvestments.findIndex((item) => item.id === "gen_inv_45");
    if (january31Index >= 0) {
      const target = nextInvestments[january31Index];
      const inputs = Number.parseFloat(target.inputs);
      const safeInputs = Number.isFinite(inputs) ? inputs : 0;
      const patchedProfit = 85.11;
      const patchedRevenues = Number((safeInputs + patchedProfit).toFixed(2));
      if (target.status !== "win" || Number(target.profit) !== patchedProfit || Number(target.revenues) !== patchedRevenues) {
        nextInvestments[january31Index] = normalizeInvestmentRecord({
          ...target,
          status: "win",
          revenues: patchedRevenues,
          profit: patchedProfit
        });
        changed = true;
      }
    }
    const legacyElevenCombo = nextInvestments.find((item) => item.id === "gen_inv_44" && Number(item.parlay_size) === 11);
    if (legacyElevenCombo) {
      const splitRecords = buildSplitInvestmentsFromLegacy11(legacyElevenCombo);
      const existingSignatures = new Set(
        nextInvestments.filter((item) => item.id !== legacyElevenCombo.id).map((item) => buildInvestmentLegSignature(item))
      );
      const uniqueSplitRecords = splitRecords.filter((item) => {
        const signature = buildInvestmentLegSignature(item);
        if (!signature || existingSignatures.has(signature)) return false;
        existingSignatures.add(signature);
        return true;
      });
      nextInvestments = nextInvestments.filter((item) => item.id !== legacyElevenCombo.id);
      if (uniqueSplitRecords.length > 0) {
        nextInvestments = [...nextInvestments, ...uniqueSplitRecords];
      }
      changed = true;
    }
    if (changed) {
      writeJSON2(STORAGE_KEYS2.investments, nextInvestments);
    }
    brandLocalStorage.setItem(DATA_PATCH_V20260205_KEY, "1");
  };
  var normalizeLegacyTeamName = (value) => {
    const raw = String(value || "").trim();
    if (raw === "s伯恩茅斯") return "伯恩茅斯";
    return value;
  };
  var applyManualDataPatchV20260206 = () => {
    if (!isBrowser3) return;
    if (brandLocalStorage.getItem(DATA_PATCH_V20260206_KEY) === "1") return;
    const rawTeamProfiles = readJSON2(STORAGE_KEYS2.teamProfiles, null);
    const rawInvestments = readJSON2(STORAGE_KEYS2.investments, null);
    let teamProfilesChanged = false;
    let investmentsChanged = false;
    if (Array.isArray(rawTeamProfiles)) {
      const nextProfiles = rawTeamProfiles.map((profile) => {
        const fixedTeamName = normalizeLegacyTeamName(profile?.teamName);
        const fixedAbbr = Array.isArray(profile?.abbreviations) ? profile.abbreviations.map((abbr) => normalizeLegacyTeamName(abbr)) : [];
        if (fixedTeamName !== profile?.teamName) teamProfilesChanged = true;
        if (fixedAbbr.some((abbr, idx) => abbr !== profile?.abbreviations?.[idx])) teamProfilesChanged = true;
        return withTeamDefaults({
          ...profile,
          teamName: fixedTeamName || profile?.teamName,
          abbreviations: fixedAbbr
        });
      });
      if (teamProfilesChanged) {
        writeJSON2(STORAGE_KEYS2.teamProfiles, nextProfiles);
      }
    }
    if (Array.isArray(rawInvestments)) {
      let nextInvestments = rawInvestments.map((item) => {
        const matches = Array.isArray(item?.matches) ? item.matches : [];
        let localChanged = false;
        const fixedMatches = matches.map((match) => {
          const fixedHome = normalizeLegacyTeamName(match?.home_team);
          const fixedAway = normalizeLegacyTeamName(match?.away_team);
          if (fixedHome !== match?.home_team || fixedAway !== match?.away_team) {
            localChanged = true;
          }
          return normalizeMatchRecord({
            ...match,
            home_team: fixedHome,
            away_team: fixedAway
          });
        });
        if (localChanged) investmentsChanged = true;
        return normalizeInvestmentRecord({
          ...item,
          matches: fixedMatches
        });
      });
      const seenDerbySignatures = /* @__PURE__ */ new Set();
      const dedupedInvestments = [];
      nextInvestments.forEach((item) => {
        const matches = Array.isArray(item?.matches) ? item.matches : [];
        const isTarget = String(item?.created_at || "").startsWith("2026-01-17") && Number(item?.parlay_size || matches.length || 1) === 1 && matches.length === 1 && (matches[0]?.home_team === "曼联" && matches[0]?.away_team === "曼城" || matches[0]?.home_team === "曼城" && matches[0]?.away_team === "曼联");
        if (!isTarget) {
          dedupedInvestments.push(item);
          return;
        }
        const match = matches[0];
        const signature = JSON.stringify([
          item.created_at,
          match.home_team,
          match.away_team,
          match.entry_text,
          match.odds,
          match.conf,
          match.mode,
          match.results,
          match.is_correct,
          item.inputs,
          item.revenues,
          item.profit
        ]);
        if (seenDerbySignatures.has(signature)) {
          investmentsChanged = true;
          return;
        }
        seenDerbySignatures.add(signature);
        dedupedInvestments.push(item);
      });
      if (investmentsChanged) {
        writeJSON2(STORAGE_KEYS2.investments, dedupedInvestments);
      }
    }
    brandLocalStorage.setItem(DATA_PATCH_V20260206_KEY, "1");
  };
  var toArray = (value) => Array.isArray(value) ? value : [];
  var LEDGER_CONFIG_KEYS = ["poolSettlements", "capitalInjections", "cycleTitles"];
  var unionLedgerById = (localList, incomingList) => {
    const map = /* @__PURE__ */ new Map();
    (Array.isArray(localList) ? localList : []).forEach((item) => {
      if (item && item.id != null) map.set(String(item.id), item);
    });
    (Array.isArray(incomingList) ? incomingList : []).forEach((item) => {
      if (item && item.id != null) map.set(String(item.id), item);
    });
    return [...map.values()];
  };
  var mergeSystemConfig = (localCfg, incomingCfg) => {
    const merged = { ...localCfg || {}, ...incomingCfg || {} };
    merged.liquidGlassQuality = normalizeLiquidGlassQuality(localCfg?.liquidGlassQuality);
    merged.liquidGlassMaterialQuality = normalizeLiquidGlassMaterialQuality(localCfg?.liquidGlassMaterialQuality);
    LEDGER_CONFIG_KEYS.forEach((key) => {
      merged[key] = unionLedgerById(localCfg?.[key], incomingCfg?.[key]);
    });
    return merged;
  };
  var applyDataBundle = (bundle, mode = "replace") => {
    if (!bundle || typeof bundle !== "object") return false;
    const incomingConfig = bundle.system_config && typeof bundle.system_config === "object" ? bundle.system_config : {};
    const incomingTeams = toArray(bundle.team_profiles).map(withTeamDefaults);
    const incomingInvestments = toArray(bundle.investments).filter((item) => item && typeof item === "object" && item.id).map((item) => normalizeInvestmentRecord(item));
    const incomingAccessLogs = toArray(bundle.access_logs).filter((item) => item && typeof item === "object").map((item) => normalizeAccessLogRecord(item));
    if (mode === "merge") {
      const currentTeams = getTeamProfiles();
      const teamMap = new Map(currentTeams.map((team) => [normalize(team.teamName), team]));
      incomingTeams.forEach((team) => {
        const key = normalize(team.teamName);
        if (!teamMap.has(key)) {
          teamMap.set(key, team);
        }
      });
      const currentInvestments = getInvestments();
      const investmentMap = new Map(currentInvestments.map((item) => [item.id, item]));
      incomingInvestments.forEach((item) => {
        if (!investmentMap.has(item.id)) {
          investmentMap.set(item.id, item);
        }
      });
      const currentAccessLogs = getAccessLogs();
      const accessMap = new Map(currentAccessLogs.map((item) => [item.id, item]));
      incomingAccessLogs.forEach((item) => {
        const existing = accessMap.get(item.id);
        if (!existing) {
          accessMap.set(item.id, item);
          return;
        }
        const incomingTime = new Date(item.created_at || 0).getTime();
        const existingTime = new Date(existing.created_at || 0).getTime();
        if (incomingTime >= existingTime) {
          accessMap.set(item.id, item);
        }
      });
      const mergedAccessLogs = [...accessMap.values()].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, ACCESS_LOG_MAX_ROWS);
      writeJSON2(STORAGE_KEYS2.systemConfig, mergeSystemConfig(getSystemConfig(), incomingConfig));
      writeJSON2(STORAGE_KEYS2.teamProfiles, [...teamMap.values()]);
      writeJSON2(STORAGE_KEYS2.investments, [...investmentMap.values()]);
      writeJSON2(STORAGE_KEYS2.accessLogs, mergedAccessLogs);
      markGenesisApplied();
      return true;
    }
    const deviceConfig = readJSON2(STORAGE_KEYS2.systemConfig, null);
    writeJSON2(STORAGE_KEYS2.systemConfig, {
      ...DEFAULT_SYSTEM_CONFIG,
      ...incomingConfig,
      liquidGlassQuality: normalizeLiquidGlassQuality(deviceConfig?.liquidGlassQuality),
      liquidGlassMaterialQuality: normalizeLiquidGlassMaterialQuality(deviceConfig?.liquidGlassMaterialQuality)
    });
    writeJSON2(STORAGE_KEYS2.teamProfiles, incomingTeams.length > 0 ? incomingTeams : DEFAULT_TEAM_PROFILES);
    writeJSON2(STORAGE_KEYS2.investments, incomingInvestments);
    writeJSON2(STORAGE_KEYS2.accessLogs, incomingAccessLogs.slice(0, ACCESS_LOG_MAX_ROWS));
    markGenesisApplied();
    return true;
  };
  var ensureGenesisApplied = () => {
    if (!isBrowser3 || genesisApplying) return;
    if (isPreviewMode()) return;
    if (brandLocalStorage.getItem(GENESIS_APPLIED_KEY) === "1") return;
    genesisApplying = true;
    try {
      const ok = applyDataBundle(genesisBundle_default, "replace");
      if (ok) brandLocalStorage.setItem(GENESIS_APPLIED_KEY, "1");
    } finally {
      genesisApplying = false;
    }
  };
  var getInvestments = () => {
    const tmOverride = getTimeMachineDataOverride(STORAGE_KEYS2.investments);
    if (tmOverride !== null) {
      const data = Array.isArray(tmOverride) ? tmOverride : [];
      return data.map((item) => normalizeInvestmentRecord(item)).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }
    ensureGenesisApplied();
    applyManualDataPatchV20260205();
    applyManualDataPatchV20260206();
    const saved = readJSON2(STORAGE_KEYS2.investments, []);
    if (!Array.isArray(saved)) return [];
    return saved.map((item) => normalizeInvestmentRecord(item)).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  };
  var getAccessLogs = () => {
    ensureGenesisApplied();
    const saved = readJSON2(STORAGE_KEYS2.accessLogs, []);
    if (!Array.isArray(saved)) return [];
    return saved.map((item) => normalizeAccessLogRecord(item)).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, ACCESS_LOG_MAX_ROWS);
  };
  var appendAccessLog = (record, options = {}) => {
    const maxRows = Number.isFinite(Number(options.maxRows)) ? Math.max(50, Math.min(2e3, Number(options.maxRows))) : ACCESS_LOG_MAX_ROWS;
    const existing = getAccessLogs();
    const normalized = normalizeAccessLogRecord(record);
    const latest = existing[0];
    if (latest && latest.session_id && normalized.session_id && latest.session_id === normalized.session_id && latest.route === normalized.route && latest.endpoint === normalized.endpoint && latest.user_agent === normalized.user_agent && Math.abs(new Date(normalized.created_at).getTime() - new Date(latest.created_at).getTime()) <= 8e3) {
      return latest;
    }
    const next = [normalized, ...existing.filter((item) => item.id !== normalized.id)].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, maxRows);
    writeJSON2(STORAGE_KEYS2.accessLogs, next);
    return normalized;
  };
  var checkReadOnlyMode = (operationName = "Operation") => {
    if (isInTimeMachineMode()) {
      console.warn(`[Eivra] 时光穿越中：${operationName}已禁用，仅浏览历史快照。`);
      return false;
    }
    return true;
  };
  var saveInvestment = (investment) => {
    if (!checkReadOnlyMode("New Investment")) return null;
    const existing = getInvestments();
    const normalized = normalizeInvestmentRecord(investment);
    const next = [normalized, ...existing];
    writeJSON2(STORAGE_KEYS2.investments, next);
    return normalized;
  };
  var saveInvestments = (investments) => {
    if (!checkReadOnlyMode("New Investments")) return [];
    const incoming = Array.isArray(investments) ? investments : [];
    if (incoming.length === 0) return [];
    const normalized = incoming.map((investment) => normalizeInvestmentRecord(investment));
    writeJSON2(STORAGE_KEYS2.investments, [...normalized, ...getInvestments()]);
    return normalized;
  };
  var updateInvestment = (investmentId, updater) => {
    if (!checkReadOnlyMode("Update Investment")) return null;
    const existing = getInvestments();
    let changed = false;
    const next = existing.map((item) => {
      if (item.id !== investmentId) return item;
      changed = true;
      const updated = typeof updater === "function" ? updater(item) : { ...item, ...updater || {} };
      return normalizeInvestmentRecord(addSettlementTimestamps(item, updated, (/* @__PURE__ */ new Date()).toISOString()));
    });
    if (!changed) return null;
    writeJSON2(STORAGE_KEYS2.investments, next);
    return next.find((item) => item.id === investmentId) || null;
  };
  var updateInvestments = (updates) => {
    if (!checkReadOnlyMode("Update Investments")) return [];
    const updateMap = new Map(
      (Array.isArray(updates) ? updates : []).filter((item) => item?.id).map((item) => [item.id, item.updater])
    );
    if (updateMap.size === 0) return [];
    const changed = [];
    const writtenAt = (/* @__PURE__ */ new Date()).toISOString();
    const next = getInvestments().map((item) => {
      if (!updateMap.has(item.id)) return item;
      const updater = updateMap.get(item.id);
      const updated = typeof updater === "function" ? updater(item) : { ...item, ...updater || {} };
      const normalized = normalizeInvestmentRecord(addSettlementTimestamps(item, updated, writtenAt));
      changed.push(normalized);
      return normalized;
    });
    if (changed.length !== updateMap.size) return [];
    writeJSON2(STORAGE_KEYS2.investments, next);
    return changed;
  };
  var deleteInvestment = (investmentId) => {
    if (!checkReadOnlyMode("Delete Investment")) return false;
    const existing = getInvestments();
    const next = existing.filter((item) => item.id !== investmentId);
    if (next.length === existing.length) return false;
    writeJSON2(STORAGE_KEYS2.investments, next);
    return true;
  };
  var setInvestmentArchived = (investmentId, archived = true) => {
    if (!checkReadOnlyMode("Archive Investment")) return false;
    const updated = updateInvestment(investmentId, (previous) => ({
      ...previous,
      is_archived: Boolean(archived)
    }));
    return Boolean(updated);
  };
  var exportDataBundle = () => ({
    version: 1,
    exported_at: (/* @__PURE__ */ new Date()).toISOString(),
    system_config: getSystemConfig(),
    team_profiles: getTeamProfiles(),
    investments: getInvestments(),
    access_logs: getAccessLogs()
  });
  var importDataBundle = (bundle, mode = "replace") => {
    return applyDataBundle(bundle, mode);
  };
  var restoreGenesisData = () => {
    if (isPreviewMode()) return false;
    const ok = applyDataBundle(genesisBundle_default, "replace");
    if (ok && isBrowser3) {
      brandLocalStorage.setItem(GENESIS_APPLIED_KEY, "1");
    }
    return ok;
  };
  var getCloudSyncStatus = () => getGitSyncState();
  var setCloudSyncEnabled = (enabled) => setGitSyncEnabled(enabled);
  var mergeGitBundleIntoLocal = (bundle) => {
    if (!bundle || typeof bundle !== "object") return { applied: false, localExtras: 0 };
    const incomingConfig = bundle.system_config && typeof bundle.system_config === "object" ? bundle.system_config : {};
    const incomingTeams = toArray(bundle.team_profiles).map(withTeamDefaults);
    const incomingInvestments = toArray(bundle.investments).filter((item) => item && typeof item === "object" && item.id).map((item) => normalizeInvestmentRecord(item));
    const incomingAccessLogs = toArray(bundle.access_logs).filter((item) => item && typeof item === "object").map((item) => normalizeAccessLogRecord(item));
    const investmentMap = new Map(incomingInvestments.map((item) => [item.id, item]));
    let localExtras = 0;
    getInvestments().forEach((item) => {
      if (item && item.id != null && !investmentMap.has(item.id)) {
        investmentMap.set(item.id, item);
        localExtras += 1;
      }
    });
    const teamMap = new Map(incomingTeams.map((team) => [normalize(team.teamName), team]));
    getTeamProfiles().forEach((team) => {
      const key = normalize(team.teamName);
      if (!teamMap.has(key)) teamMap.set(key, team);
    });
    const accessMap = new Map(getAccessLogs().map((item) => [item.id, item]));
    incomingAccessLogs.forEach((item) => {
      const existing = accessMap.get(item.id);
      const incomingTime = new Date(item.created_at || 0).getTime();
      const existingTime = new Date(existing?.created_at || 0).getTime();
      if (!existing || incomingTime >= existingTime) {
        accessMap.set(item.id, item);
      }
    });
    const mergedAccessLogs = [...accessMap.values()].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, ACCESS_LOG_MAX_ROWS);
    writeJSON2(STORAGE_KEYS2.systemConfig, mergeSystemConfig(getSystemConfig(), incomingConfig));
    writeJSON2(STORAGE_KEYS2.teamProfiles, [...teamMap.values()]);
    writeJSON2(STORAGE_KEYS2.investments, [...investmentMap.values()]);
    writeJSON2(STORAGE_KEYS2.accessLogs, mergedAccessLogs);
    markGenesisApplied();
    return { applied: true, localExtras };
  };
  var syncFromGitOnUnlock = async () => {
    if (isPreviewMode()) return;
    const pulled = await pullGitBundle();
    if (!pulled.ok || !pulled.bundle) return;
    cloudBootstrapInProgress = true;
    let result;
    try {
      result = mergeGitBundleIntoLocal(pulled.bundle);
    } finally {
      cloudBootstrapInProgress = false;
    }
    if (isBrowser3) {
      window.dispatchEvent(new CustomEvent("eivra:data-changed", { detail: { key: "all" } }));
    }
    if (result?.localExtras > 0) {
      commitBundleNow(exportDataBundle());
    }
  };
  var bootstrapCloudSnapshotOnLoad = async () => {
    if (isPreviewMode()) return { ok: false, reason: "preview_mode_blocked", applied: false };
    cloudBootstrapInProgress = true;
    try {
      const pulled = await pullGitBundle();
      if (!pulled.ok || !pulled.bundle) return { ...pulled, applied: false };
      const result = mergeGitBundleIntoLocal(pulled.bundle);
      if (result.localExtras > 0) commitBundleNow(exportDataBundle());
      return { ok: true, applied: result.applied, localExtras: result.localExtras };
    } finally {
      cloudBootstrapInProgress = false;
    }
  };
  var runCloudSyncNow = async () => {
    if (isPreviewMode()) return { ok: false, reason: "preview_mode_blocked" };
    return commitBundleNow(exportDataBundle());
  };
  var pullCloudSnapshotNow = async (mode = "merge") => {
    if (isPreviewMode()) return { ok: false, reason: "preview_mode_blocked", applied: false };
    const pulled = await pullGitBundle();
    if (!pulled.ok) return { ...pulled, applied: false };
    if (!pulled.bundle) return { ok: false, reason: "empty_remote", applied: false };
    const normalizedMode = mode === "replace" ? "replace" : "merge";
    const applied = normalizedMode === "replace" ? applyDataBundle(pulled.bundle, "replace") : mergeGitBundleIntoLocal(pulled.bundle).applied;
    if (!applied) {
      const state = saveGitSyncState({ lastError: "云端快照结构不符合 Eivra 模板，未应用。" });
      return { ok: false, reason: "invalid_snapshot", state, applied: false };
    }
    if (isBrowser3) {
      window.dispatchEvent(new CustomEvent("eivra:data-changed", { detail: { key: "all" } }));
    }
    return { ok: true, applied: true, mode: normalizedMode, updatedAt: pulled.updatedAt };
  };
  var beginTimeMachineSession = async (snapshotId) => {
    if (isPreviewMode()) return { ok: false, reason: "preview_mode_blocked" };
    const result = await fetchTimeMachineSnapshotById(snapshotId);
    if (!result.ok) return result;
    const sessionResult = startTimeMachineSession({
      snapshotId: result.snapshotId,
      bundle: result.bundle,
      meta: result.meta,
      updatedAt: result.updatedAt
    });
    if (sessionResult.ok) {
      window.dispatchEvent(new CustomEvent("eivra:data-changed", { detail: { key: "all" } }));
    }
    return sessionResult;
  };
  var endTimeMachineSession = () => {
    const result = exitTimeMachineSession();
    if (result.ok) {
      window.dispatchEvent(new CustomEvent("eivra:data-changed", { detail: { key: "all" } }));
    }
    return result;
  };
  var listHistoricalSnapshots = (page = 1, pageSize = 6) => {
    if (isPreviewMode()) return Promise.resolve({ ok: true, items: [], total: 0, page, pageSize });
    return listTimeMachineSnapshots({ page, pageSize });
  };
  var saveSnapshot = async (title = "", mode = "manual") => {
    if (isPreviewMode()) return { ok: false, reason: "preview_mode_blocked" };
    const snapshot = exportDataBundle();
    if (!snapshot.system_config || typeof snapshot.system_config !== "object") {
      console.error("[saveSnapshot] Invalid system_config:", snapshot.system_config);
      return { ok: false, reason: "invalid_system_config" };
    }
    if (!Array.isArray(snapshot.team_profiles)) {
      console.error("[saveSnapshot] Invalid team_profiles:", snapshot.team_profiles);
      return { ok: false, reason: "invalid_team_profiles" };
    }
    if (!Array.isArray(snapshot.investments)) {
      console.error("[saveSnapshot] Invalid investments:", snapshot.investments);
      return { ok: false, reason: "invalid_investments" };
    }
    return saveTimeMachineSnapshot({
      snapshot,
      title,
      mode
    });
  };
  var ensureCurrentMonthSnapshot = async () => {
    if (isPreviewMode()) return { ok: false, reason: "preview_mode_blocked" };
    const snapshot = exportDataBundle();
    return ensureMonthlyTimeMachineSnapshot({ snapshot });
  };
  var deleteTimeMachineSnapshot = async (snapshotId) => {
    if (isPreviewMode()) return { ok: false, reason: "preview_mode_blocked" };
    try {
      const result = await deleteTimeMachineSnapshotById(snapshotId);
      return result;
    } catch (err) {
      return { ok: false, reason: err.message || "Unknown error" };
    }
  };

  // source/src/lib/analytics.js
  var analytics_exports = {};
  __export(analytics_exports, {
    __testables: () => __testables,
    adjustForBaseRate: () => adjustForBaseRate,
    assessComboFragility: () => assessComboFragility,
    assessFragilityScore: () => assessFragilityScore,
    autoApplyAdaptiveWeights: () => autoApplyAdaptiveWeights,
    backtestComboHyperparams: () => backtestComboHyperparams,
    bootstrapDateClusterInterval: () => bootstrapDateClusterInterval,
    buildComboRetrospective: () => buildComboRetrospective,
    buildEntryCorrelationMatrix: () => buildEntryCorrelationMatrix,
    buildIsotonicRegression: () => buildIsotonicRegression,
    calculateDependencyPremium: () => calculateDependencyPremium,
    checkSurvivingBias: () => checkSurvivingBias,
    computeAdaptiveWeightSuggestions: () => computeAdaptiveWeightSuggestions,
    computeWalkForwardFeedback: () => computeWalkForwardFeedback,
    generateFragilityRecommendations: () => generateFragilityRecommendations,
    getAnalysisSnapshot: () => getAnalysisSnapshot,
    getConfRegressionCalibration: () => getConfRegressionCalibration,
    getConfidenceWeight: () => getConfidenceWeight,
    getDashboardSnapshot: () => getDashboardSnapshot,
    getDependencyHistory: () => getDependencyHistory,
    getExpectedVsActualRows: () => getExpectedVsActualRows,
    getKellyDivisorBacktest: () => getKellyDivisorBacktest,
    getKellyDivisorMatrix: () => getKellyDivisorMatrix,
    getMarketImpliedFailureRate: () => getMarketImpliedFailureRate,
    getMetricsSnapshot: () => getMetricsSnapshot,
    getModeKellyRecommendations: () => getModeKellyRecommendations,
    getModelValidationSnapshot: () => getModelValidationSnapshot,
    getOddsBand: () => getOddsBand,
    getPerMatchEjrSnapshot: () => getPerMatchEjrSnapshot,
    getPredictionCalibrationContext: () => getPredictionCalibrationContext,
    getReservoirState: () => getReservoirState,
    getTeamsSnapshot: () => getTeamsSnapshot,
    getTemporalWeight: () => getTemporalWeight,
    getWeightedObservedFailure: () => getWeightedObservedFailure,
    learnContextFactors: () => learnContextFactors,
    normalizeAjrForModel: () => normalizeAjrForModel
  });

  // source/src/lib/analyticsSource.js
  var workerSnapshot = null;
  var getSystemConfig2 = () => workerSnapshot ? structuredClone(workerSnapshot.config) : getSystemConfig();
  var getInvestments2 = () => workerSnapshot ? structuredClone(workerSnapshot.investments) : getInvestments();
  var getTeamProfiles2 = () => workerSnapshot ? structuredClone(workerSnapshot.teamProfiles) : getTeamProfiles();

  // source/src/lib/teamDatabase.js
  var TEAM_DB = [
    // ----------------------------------------------------------
    //  英超 Premier League (20 teams) 2024-25 / 2025-26
    // ----------------------------------------------------------
    { name: "曼城", league: "英超", abbr: "MCI", aliases: ["曼彻斯特城", "蓝月亮", "曼城队", "Manchester City"] },
    { name: "阿森纳", league: "英超", abbr: "ARS", aliases: ["阿森纳队", "枪手", "兵工厂", "Arsenal"] },
    { name: "利物浦", league: "英超", abbr: "LIV", aliases: ["利物浦队", "红军", "Liverpool"] },
    { name: "切尔西", league: "英超", abbr: "CHE", aliases: ["切尔西队", "蓝军", "Chelsea"] },
    { name: "曼联", league: "英超", abbr: "MUN", aliases: ["曼彻斯特联", "红魔", "曼联队", "Manchester United"] },
    { name: "热刺", league: "英超", abbr: "TOT", aliases: ["托特纳姆热刺", "托特纳姆", "热刺队", "Tottenham"] },
    { name: "纽卡斯尔联", league: "英超", abbr: "NEW", aliases: ["纽卡斯尔", "纽卡", "喜鹊", "纽卡联", "Newcastle"] },
    { name: "阿斯顿维拉", league: "英超", abbr: "AVL", aliases: ["维拉", "阿斯顿维拉队", "Aston Villa"] },
    { name: "伯恩茅斯", league: "英超", abbr: "BOU", aliases: ["伯恩茅斯队", "樱桃", "Bournemouth"] },
    { name: "布莱顿", league: "英超", abbr: "BHA", aliases: ["布莱顿队", "海鸥", "布莱顿霍夫", "Brighton"] },
    { name: "布伦特福德", league: "英超", abbr: "BRE", aliases: ["布伦特福德队", "蜜蜂", "Brentford"] },
    { name: "水晶宫", league: "英超", abbr: "CRY", aliases: ["水晶宫队", "鹰", "Crystal Palace"] },
    { name: "埃弗顿", league: "英超", abbr: "EVE", aliases: ["埃弗顿队", "太妃糖", "Everton"] },
    { name: "富勒姆", league: "英超", abbr: "FUL", aliases: ["富勒姆队", "Fulham"] },
    { name: "伊普斯维奇", league: "英超", abbr: "IPS", aliases: ["伊普斯维奇城", "伊普斯维奇队", "Ipswich"] },
    { name: "莱斯特城", league: "英超", abbr: "LEI", aliases: ["莱斯特", "狐狸", "莱斯特城队", "Leicester"] },
    { name: "诺丁汉森林", league: "英超", abbr: "NFO", aliases: ["诺森", "森林", "诺丁汉", "Nottingham Forest"] },
    { name: "南安普顿", league: "英超", abbr: "SOU", aliases: ["南安普敦", "圣徒", "南安普顿队", "Southampton"] },
    { name: "西汉姆联", league: "英超", abbr: "WHU", aliases: ["西汉姆", "铁锤帮", "西汉姆联队", "West Ham"] },
    { name: "狼队", league: "英超", abbr: "WOL", aliases: ["伍尔弗汉普顿", "狼队队", "伍尔弗", "Wolves"] },
    // ----------------------------------------------------------
    //  英冠 Championship (24 teams)
    // ----------------------------------------------------------
    { name: "利兹联", league: "英超", abbr: "LEE", aliases: ["利兹", "利兹联队", "Leeds"] },
    { name: "伯恩利", league: "英超", abbr: "BUR", aliases: ["伯恩利队", "Burnley"] },
    { name: "谢菲尔德联", league: "英超", abbr: "SHU", aliases: ["谢菲联", "谢联", "谢菲尔德联队", "Sheffield United"] },
    { name: "卢顿", league: "英冠", abbr: "LUT", aliases: ["卢顿队", "卢顿城", "Luton"] },
    { name: "桑德兰", league: "英冠", abbr: "SUN", aliases: ["桑德兰队", "黑猫", "Sunderland"] },
    { name: "米德尔斯堡", league: "英冠", abbr: "MID", aliases: ["米堡", "米德尔斯堡队", "Middlesbrough"] },
    { name: "西布朗", league: "英冠", abbr: "WBA", aliases: ["西布罗姆维奇", "西布朗队", "West Brom"] },
    { name: "诺维奇", league: "英冠", abbr: "NOR", aliases: ["诺维奇城", "金丝雀", "Norwich"] },
    { name: "考文垂", league: "英冠", abbr: "COV", aliases: ["考文垂城", "考文垂队", "Coventry"] },
    { name: "斯托克城", league: "英冠", abbr: "STK", aliases: ["斯托克", "Stoke"] },
    { name: "布里斯托尔城", league: "英冠", abbr: "BRC", aliases: ["布里斯托城", "布城", "Bristol City"] },
    { name: "赫尔城", league: "英冠", abbr: "HUL", aliases: ["赫尔", "Hull City"] },
    { name: "斯旺西", league: "英冠", abbr: "SWA", aliases: ["斯旺西城", "天鹅", "Swansea"] },
    { name: "普利茅斯", league: "英冠", abbr: "PLY", aliases: ["普利茅斯队", "Plymouth"] },
    { name: "布莱克本", league: "英冠", abbr: "BLB", aliases: ["布莱克本流浪者", "Blackburn"] },
    { name: "米尔沃尔", league: "英冠", abbr: "MIL", aliases: ["米尔沃尔队", "Millwall"] },
    { name: "卡迪夫城", league: "英冠", abbr: "CAR", aliases: ["卡迪夫", "Cardiff"] },
    { name: "谢菲尔德星期三", league: "英冠", abbr: "SHW", aliases: ["谢周三", "谢菲星期三", "Sheffield Wednesday"] },
    { name: "女王公园巡游者", league: "英冠", abbr: "QPR", aliases: ["QPR", "女王公园", "Queens Park Rangers"] },
    { name: "沃特福德", league: "英冠", abbr: "WAT", aliases: ["沃特福德队", "大黄蜂", "Watford"] },
    { name: "普雷斯顿", league: "英冠", abbr: "PNE", aliases: ["普雷斯顿队", "Preston"] },
    { name: "德比郡", league: "英冠", abbr: "DER", aliases: ["德比", "Derby"] },
    { name: "朴茨茅斯", league: "英冠", abbr: "POR", aliases: ["朴茨茅斯队", "Portsmouth"] },
    { name: "牛津联", league: "英冠", abbr: "OXF", aliases: ["牛津联队", "牛津", "Oxford United"] },
    // ----------------------------------------------------------
    //  西甲 La Liga (20 teams)
    // ----------------------------------------------------------
    { name: "巴萨", league: "西甲", abbr: "BAR", aliases: ["巴塞罗那", "巴塞", "巴萨队", "Barcelona"] },
    { name: "皇马", league: "西甲", abbr: "RMA", aliases: ["皇家马德里", "白衣军团", "皇马队", "Real Madrid"] },
    { name: "马竞", league: "西甲", abbr: "ATM", aliases: ["马德里竞技", "床单军团", "马竞队", "Atletico Madrid"] },
    { name: "皇家社会", league: "西甲", abbr: "RSO", aliases: ["皇社", "社会", "Real Sociedad"] },
    { name: "皇家贝蒂斯", league: "西甲", abbr: "BET", aliases: ["贝蒂斯", "Real Betis"] },
    { name: "比利亚雷亚尔", league: "西甲", abbr: "VIL", aliases: ["比利亚雷亚尔队", "黄色潜水艇", "黄潜", "维拉利尔", "Villarreal"] },
    { name: "赫罗纳", league: "西甲", abbr: "GIR", aliases: ["赫罗纳队", "吉罗纳", "Girona"] },
    { name: "塞维利亚", league: "西甲", abbr: "SEV", aliases: ["塞维利亚队", "Sevilla"] },
    { name: "塞尔塔", league: "西甲", abbr: "CEL", aliases: ["维戈塞尔塔", "塞尔塔队", "Celta Vigo"] },
    { name: "马洛卡", league: "西甲", abbr: "MAL", aliases: ["马略卡", "皇家马洛卡", "Mallorca"] },
    { name: "巴列卡诺", league: "西甲", abbr: "RAY", aliases: ["巴列卡诺队", "闪电", "Rayo Vallecano"] },
    { name: "阿拉维斯", league: "西甲", abbr: "ALV", aliases: ["阿拉维斯队", "德波蒂沃阿拉维斯", "Alaves"] },
    { name: "瓦伦西亚", league: "西甲", abbr: "VAL", aliases: ["瓦伦西亚队", "蝙蝠军团", "Valencia"] },
    { name: "西班牙人", league: "西甲", abbr: "ESP", aliases: ["RCD西班牙人", "爱斯帕尼奥尔", "Espanyol"] },
    { name: "赫塔费", league: "西甲", abbr: "GET", aliases: ["赫塔菲", "赫塔费队", "Getafe"] },
    { name: "奥萨苏纳", league: "西甲", abbr: "OCA", aliases: ["奥萨苏纳队", "Osasuna"] },
    { name: "莱加内斯", league: "西甲", abbr: "LEG", aliases: ["莱加内斯队", "Leganes"] },
    { name: "巴拉多利德", league: "西甲", abbr: "VLL", aliases: ["巴利亚多利德", "巴拉多利德队", "Valladolid"] },
    { name: "拉斯帕尔马斯", league: "西甲", abbr: "LPA", aliases: ["拉斯帕尔马斯队", "帕尔马斯", "Las Palmas"] },
    { name: "毕尔巴鄂竞技", league: "西甲", abbr: "ATB", aliases: ["毕尔巴鄂", "毕巴", "Athletic Bilbao"] },
    // ----------------------------------------------------------
    //  西乙 Segunda División (22 teams)
    // ----------------------------------------------------------
    { name: "萨拉戈萨", league: "西乙", abbr: "ZAR", aliases: ["皇家萨拉戈萨", "Zaragoza"] },
    { name: "奥维耶多", league: "西乙", abbr: "OVI", aliases: ["奥维耶多队", "Oviedo"] },
    { name: "格拉纳达", league: "西乙", abbr: "GRA", aliases: ["格拉纳达队", "Granada"] },
    { name: "埃尔切", league: "西乙", abbr: "ELC", aliases: ["埃尔切队", "Elche"] },
    { name: "韦斯卡", league: "西乙", abbr: "HUE", aliases: ["韦斯卡队", "Huesca"] },
    { name: "特内里费", league: "西乙", abbr: "TEN", aliases: ["特内里费队", "Tenerife"] },
    { name: "卡迪斯", league: "西乙", abbr: "CAD", aliases: ["加迪斯", "卡迪斯队", "Cadiz"] },
    { name: "阿尔梅里亚", league: "西乙", abbr: "ALM", aliases: ["阿尔梅里亚队", "Almeria"] },
    { name: "桑坦德竞技", league: "西乙", abbr: "RAC", aliases: ["桑坦德", "Racing Santander"] },
    { name: "马拉加", league: "西乙", abbr: "MLG", aliases: ["马拉加队", "Malaga"] },
    { name: "希洪竞技", league: "西乙", abbr: "SPG", aliases: ["希洪", "希洪竞技队", "Sporting Gijon"] },
    { name: "莱万特", league: "西乙", abbr: "LEV", aliases: ["莱万特队", "Levante"] },
    { name: "米兰德斯", league: "西乙", abbr: "MIR", aliases: ["米兰德斯队", "Mirandes"] },
    { name: "布尔戈斯", league: "西乙", abbr: "BUR", aliases: ["布尔戈斯队", "Burgos"] },
    { name: "卡塔赫纳", league: "西乙", abbr: "CTG", aliases: ["卡塔赫纳队", "Cartagena"] },
    { name: "阿尔科尔孔", league: "西乙", abbr: "ALC", aliases: ["阿尔科尔孔队", "Alcorcon"] },
    { name: "费罗尔竞技", league: "西乙", abbr: "RFE", aliases: ["费罗尔", "Racing Ferrol"] },
    { name: "埃瓦尔", league: "西乙", abbr: "EIB", aliases: ["埃瓦尔队", "Eibar"] },
    { name: "皇家卡斯蒂利亚", league: "西乙", abbr: "RMC", aliases: ["卡斯蒂利亚", "Castilla"] },
    { name: "巴萨B队", league: "西乙", abbr: "BAB", aliases: ["巴塞罗那B队", "Barcelona B"] },
    { name: "维尔瓦", league: "西乙", abbr: "REC", aliases: ["维尔瓦队", "韦尔瓦", "Recreativo Huelva"] },
    { name: "科尔多瓦", league: "西乙", abbr: "COR", aliases: ["科尔多瓦队", "Cordoba"] },
    // ----------------------------------------------------------
    //  意甲 Serie A (20 teams)
    // ----------------------------------------------------------
    { name: "那不勒斯", league: "意甲", abbr: "NAP", aliases: ["那不勒斯队", "拿波利", "Napoli"] },
    { name: "尤文图斯", league: "意甲", abbr: "JUV", aliases: ["尤文", "老妇人", "尤文图斯队", "Juventus"] },
    { name: "国际米兰", league: "意甲", abbr: "INT", aliases: ["国米", "蓝黑军团", "国际米兰队", "Inter Milan"] },
    { name: "AC米兰", league: "意甲", abbr: "MIL", aliases: ["米兰", "红黑军团", "AC米兰队", "AC Milan"] },
    { name: "亚特兰大", league: "意甲", abbr: "ATA", aliases: ["阿塔兰塔", "亚特兰大队", "Atalanta"] },
    { name: "拉齐奥", league: "意甲", abbr: "LAZ", aliases: ["拉齐奥队", "蓝鹰", "Lazio"] },
    { name: "罗马", league: "意甲", abbr: "ROM", aliases: ["罗马队", "AS罗马", "Roma"] },
    { name: "佛罗伦萨", league: "意甲", abbr: "FIO", aliases: ["佛罗伦萨队", "紫百合", "佛罗伦", "Fiorentina"] },
    { name: "博洛尼亚", league: "意甲", abbr: "BOL", aliases: ["博洛尼亚队", "Bologna"] },
    { name: "都灵", league: "意甲", abbr: "TOR", aliases: ["都灵队", "都灵FC", "Torino"] },
    { name: "乌迪内斯", league: "意甲", abbr: "UDI", aliases: ["乌迪内斯队", "Udinese"] },
    { name: "热那亚", league: "意甲", abbr: "GEN", aliases: ["热那亚队", "Genoa"] },
    { name: "卡利亚里", league: "意甲", abbr: "CAG", aliases: ["卡利亚里队", "Cagliari"] },
    { name: "恩波利", league: "意甲", abbr: "EMP", aliases: ["恩波利队", "Empoli"] },
    { name: "维罗纳", league: "意甲", abbr: "VER", aliases: ["维罗纳队", "维罗纳希拉斯", "Hellas Verona"] },
    { name: "蒙扎", league: "意甲", abbr: "MON", aliases: ["蒙扎队", "Monza"] },
    { name: "帕尔马", league: "意甲", abbr: "PAR", aliases: ["帕尔马队", "Parma"] },
    { name: "科莫", league: "意甲", abbr: "COM", aliases: ["科莫队", "Como"] },
    { name: "莱切", league: "意甲", abbr: "LEC", aliases: ["莱切队", "Lecce"] },
    { name: "威尼斯", league: "意甲", abbr: "VEN", aliases: ["威尼斯队", "Venezia"] },
    // ----------------------------------------------------------
    //  意乙 Serie B (20 teams)
    // ----------------------------------------------------------
    { name: "萨索洛", league: "意乙", abbr: "SAS", aliases: ["萨索洛队", "Sassuolo"] },
    { name: "萨勒尼塔纳", league: "意乙", abbr: "SAL", aliases: ["萨勒尼塔纳队", "Salernitana"] },
    { name: "布雷西亚", league: "意乙", abbr: "BRE", aliases: ["布雷西亚队", "Brescia"] },
    { name: "巴里", league: "意乙", abbr: "BAR", aliases: ["巴里队", "Bari"] },
    { name: "帕拉蒙", league: "意乙", abbr: "PAL", aliases: ["巴勒莫", "帕勒莫", "Palermo"] },
    { name: "克雷莫纳", league: "意乙", abbr: "CRE", aliases: ["克雷莫纳队", "Cremonese"] },
    { name: "卡坦扎罗", league: "意乙", abbr: "CTZ", aliases: ["卡坦扎罗队", "Catanzaro"] },
    { name: "桑普多利亚", league: "意乙", abbr: "SAM", aliases: ["桑普", "桑普多利亚队", "Sampdoria"] },
    { name: "弗洛西诺内", league: "意乙", abbr: "FRO", aliases: ["弗洛西诺内队", "Frosinone"] },
    { name: "斯佩齐亚", league: "意乙", abbr: "SPE", aliases: ["斯佩齐亚队", "Spezia"] },
    { name: "摩德纳", league: "意乙", abbr: "MOD", aliases: ["摩德纳队", "Modena"] },
    { name: "苏迪蒂罗尔", league: "意乙", abbr: "SUD", aliases: ["苏迪蒂罗尔队", "Sudtirol"] },
    { name: "皮亚琴察", league: "意乙", abbr: "PIA", aliases: ["皮亚琴察队", "Piacenza"] },
    { name: "雷吉纳", league: "意乙", abbr: "REG", aliases: ["雷吉纳队", "Reggiana"] },
    { name: "费拉拉", league: "意乙", abbr: "SPA", aliases: ["斯帕尔", "SPAL"] },
    { name: "佩斯卡拉", league: "意乙", abbr: "PES", aliases: ["佩斯卡拉队", "Pescara"] },
    { name: "切塞纳", league: "意乙", abbr: "CES", aliases: ["切塞纳队", "Cesena"] },
    { name: "曼托瓦", league: "意乙", abbr: "MAN", aliases: ["曼托瓦队", "Mantova"] },
    { name: "柯森察", league: "意乙", abbr: "COS", aliases: ["科森扎", "柯森察队", "Cosenza"] },
    { name: "尤文图斯B队", league: "意乙", abbr: "JNG", aliases: ["尤文次队", "Juventus Next Gen"] },
    // ----------------------------------------------------------
    //  德甲 Bundesliga (18 teams)
    // ----------------------------------------------------------
    { name: "拜仁", league: "德甲", abbr: "BAY", aliases: ["拜仁慕尼黑", "拜慕", "南部之星", "Bayern Munich"] },
    { name: "多特蒙德", league: "德甲", abbr: "BVB", aliases: ["多特", "大黄蜂", "多特蒙德队", "Borussia Dortmund"] },
    { name: "莱比锡红牛", league: "德甲", abbr: "RBL", aliases: ["莱比锡", "RB莱比锡", "莱比锡队", "RB Leipzig"] },
    { name: "勒沃库森", league: "德甲", abbr: "LEV", aliases: ["勒沃库森队", "药厂", "Bayer Leverkusen"] },
    { name: "法兰克福", league: "德甲", abbr: "SGE", aliases: ["法兰克福队", "Eintracht Frankfurt"] },
    { name: "门兴格拉德巴赫", league: "德甲", abbr: "BMG", aliases: ["门兴", "小马驹", "门兴队", "Monchengladbach"] },
    { name: "沃尔夫斯堡", league: "德甲", abbr: "WOB", aliases: ["狼堡", "沃尔夫斯堡队", "Wolfsburg"] },
    { name: "弗赖堡", league: "德甲", abbr: "FRE", aliases: ["弗莱堡", "弗赖堡队", "Freiburg"] },
    { name: "霍芬海姆", league: "德甲", abbr: "TSG", aliases: ["霍芬海姆队", "霍村", "Hoffenheim"] },
    { name: "柏林联合", league: "德甲", abbr: "UNB", aliases: ["柏林联", "柏林联合队", "Union Berlin"] },
    { name: "美因茨", league: "德甲", abbr: "MAI", aliases: ["美因茨队", "美因茨05", "Mainz"] },
    { name: "奥格斯堡", league: "德甲", abbr: "AUG", aliases: ["奥格斯堡队", "Augsburg"] },
    { name: "斯图加特", league: "德甲", abbr: "STU", aliases: ["斯图加特队", "Stuttgart"] },
    { name: "海登海姆", league: "德甲", abbr: "HEI", aliases: ["海登海姆队", "Heidenheim"] },
    { name: "波鸿", league: "德甲", abbr: "BOC", aliases: ["波鸿队", "Bochum"] },
    { name: "不莱梅", league: "德甲", abbr: "SVW", aliases: ["云达不莱梅", "不莱梅队", "Werder Bremen"] },
    { name: "荷尔施泰因基尔", league: "德甲", abbr: "FCH", aliases: ["基尔", "荷尔施泰因", "Holstein Kiel"] },
    { name: "圣保利", league: "德甲", abbr: "DAR", aliases: ["圣保利队", "St. Pauli"] },
    // ----------------------------------------------------------
    //  德乙 2. Bundesliga (18 teams)
    // ----------------------------------------------------------
    { name: "科隆", league: "德乙", abbr: "KOL", aliases: ["科隆队", "科隆FC", "FC Koln"] },
    { name: "达姆施塔特", league: "德乙", abbr: "DAR", aliases: ["达姆施塔特队", "Darmstadt"] },
    { name: "汉堡", league: "德乙", abbr: "HSV", aliases: ["汉堡队", "汉堡SV", "HSV Hamburg"] },
    { name: "汉诺威96", league: "德乙", abbr: "H96", aliases: ["汉诺威", "汉诺威队", "Hannover"] },
    { name: "杜塞尔多夫", league: "德乙", abbr: "DUS", aliases: ["杜塞尔多夫队", "杜塞", "Fortuna Dusseldorf"] },
    { name: "帕德博恩", league: "德乙", abbr: "PAD", aliases: ["帕德博恩队", "Paderborn"] },
    { name: "纽伦堡", league: "德乙", abbr: "NUR", aliases: ["纽伦堡队", "Nurnberg"] },
    { name: "柏林赫塔", league: "德乙", abbr: "BSC", aliases: ["赫塔", "柏林赫塔队", "Hertha Berlin"] },
    { name: "卡尔斯鲁厄", league: "德乙", abbr: "KSC", aliases: ["卡尔斯鲁厄队", "Karlsruhe"] },
    { name: "马格德堡", league: "德乙", abbr: "MAG", aliases: ["马格德堡队", "Magdeburg"] },
    { name: "沙尔克04", league: "德乙", abbr: "S04", aliases: ["沙尔克", "皇家蓝", "Schalke"] },
    { name: "布伦瑞克", league: "德乙", abbr: "EBS", aliases: ["布伦瑞克队", "Braunschweig"] },
    { name: "格罗伊特菲尔特", league: "德乙", abbr: "GRF", aliases: ["菲尔特", "Greuther Furth"] },
    { name: "厄尔格博格", league: "德乙", abbr: "AUE", aliases: ["奥厄", "厄尔格博格队", "Erzgebirge Aue"] },
    { name: "埃尔弗斯堡", league: "德乙", abbr: "ELV", aliases: ["埃尔弗斯堡队", "Elversberg"] },
    { name: "乌尔姆", league: "德乙", abbr: "ULM", aliases: ["乌尔姆队", "SSV Ulm"] },
    { name: "普鲁士明斯特", league: "德乙", abbr: "SCP", aliases: ["明斯特", "Preussen Munster"] },
    { name: "雷根斯堡", league: "德乙", abbr: "SSV", aliases: ["雷根斯堡队", "Jahn Regensburg"] },
    // ----------------------------------------------------------
    //  法甲 Ligue 1 (18 teams)
    // ----------------------------------------------------------
    { name: "巴黎圣日耳曼", league: "法甲", abbr: "PSG", aliases: ["巴黎", "PSG", "大巴黎", "巴黎队", "Paris Saint-Germain"] },
    { name: "里昂", league: "法甲", abbr: "OL", aliases: ["里昂队", "奥林匹克里昂", "Lyon"] },
    { name: "马赛", league: "法甲", abbr: "OM", aliases: ["马赛队", "奥林匹克马赛", "Marseille"] },
    { name: "摩纳哥", league: "法甲", abbr: "ASM", aliases: ["摩纳哥队", "Monaco"] },
    { name: "里尔", league: "法甲", abbr: "LIL", aliases: ["里尔队", "Lille"] },
    { name: "雷恩", league: "法甲", abbr: "REN", aliases: ["雷恩队", "Rennes"] },
    { name: "朗斯", league: "法甲", abbr: "RCL", aliases: ["朗斯队", "Lens"] },
    { name: "尼斯", league: "法甲", abbr: "NIC", aliases: ["尼斯队", "Nice"] },
    { name: "斯特拉斯堡", league: "法甲", abbr: "STR", aliases: ["斯特拉斯堡队", "Strasbourg"] },
    { name: "南特", league: "法甲", abbr: "NAN", aliases: ["南特队", "Nantes"] },
    { name: "图卢兹", league: "法甲", abbr: "TFC", aliases: ["图卢兹队", "Toulouse"] },
    { name: "欧塞尔", league: "法甲", abbr: "AUX", aliases: ["欧塞尔队", "Auxerre"] },
    { name: "圣埃蒂安", league: "法甲", abbr: "STE", aliases: ["圣埃蒂安队", "Saint-Etienne"] },
    { name: "勒阿弗尔", league: "法甲", abbr: "HAC", aliases: ["勒阿弗尔队", "Le Havre"] },
    { name: "蒙彼利埃", league: "法甲", abbr: "MON", aliases: ["蒙彼利埃队", "Montpellier"] },
    { name: "布雷斯特", league: "法甲", abbr: "BRE", aliases: ["布雷斯特队", "Brest"] },
    { name: "昂热", league: "法甲", abbr: "ANG", aliases: ["昂热队", "Angers"] },
    { name: "兰斯", league: "法甲", abbr: "REI", aliases: ["兰斯队", "Reims"] },
    // ----------------------------------------------------------
    //  法乙 Ligue 2 (20 teams)
    // ----------------------------------------------------------
    { name: "梅斯", league: "法乙", abbr: "MET", aliases: ["梅斯队", "Metz"] },
    { name: "洛里昂", league: "法乙", abbr: "LOR", aliases: ["洛里昂队", "Lorient"] },
    { name: "克莱蒙", league: "法乙", abbr: "CLE", aliases: ["克莱蒙费朗", "克莱蒙队", "Clermont"] },
    { name: "卡昂", league: "法乙", abbr: "CAE", aliases: ["卡昂队", "Caen"] },
    { name: "巴黎FC", league: "法乙", abbr: "PFC", aliases: ["巴黎FC队", "Paris FC"] },
    { name: "阿雅克肖", league: "法乙", abbr: "AJA", aliases: ["阿雅克肖队", "Ajaccio"] },
    { name: "甘冈", league: "法乙", abbr: "GIN", aliases: ["甘冈队", "Guingamp"] },
    { name: "亚眠", league: "法乙", abbr: "AMI", aliases: ["亚眠队", "Amiens"] },
    { name: "特鲁瓦", league: "法乙", abbr: "TRO", aliases: ["特鲁瓦队", "Troyes"] },
    { name: "格勒诺布尔", league: "法乙", abbr: "GRE", aliases: ["格勒诺布尔队", "Grenoble"] },
    { name: "波尔多", league: "法乙", abbr: "BOR", aliases: ["波尔多队", "Bordeaux"] },
    { name: "罗德兹", league: "法乙", abbr: "ROD", aliases: ["罗德兹队", "Rodez"] },
    { name: "瓦朗谢纳", league: "法乙", abbr: "VAL", aliases: ["瓦朗谢纳队", "Valenciennes"] },
    { name: "拉瓦勒", league: "法乙", abbr: "LAV", aliases: ["拉瓦勒队", "Laval"] },
    { name: "巴斯蒂亚", league: "法乙", abbr: "BAS", aliases: ["巴斯蒂亚队", "Bastia"] },
    { name: "敦刻尔克", league: "法乙", abbr: "DUN", aliases: ["敦刻尔克队", "Dunkerque"] },
    { name: "红星", league: "法乙", abbr: "RED", aliases: ["红星队", "Red Star"] },
    { name: "马蒂格", league: "法乙", abbr: "MAR", aliases: ["马蒂格队", "Martigues"] },
    { name: "昂热SCO", league: "法乙", abbr: "ANG", aliases: ["昂热B", "Angers B"] },
    { name: "索肖", league: "法乙", abbr: "SOC", aliases: ["索肖队", "Sochaux"] },
    // ----------------------------------------------------------
    //  荷甲 Eredivisie (18 teams)
    // ----------------------------------------------------------
    { name: "阿贾克斯", league: "荷甲", abbr: "AJA", aliases: ["阿贾克斯队", "Ajax"] },
    { name: "埃因霍温", league: "荷甲", abbr: "PSV", aliases: ["PSV", "PSV埃因霍温", "埃因霍温队", "PSV Eindhoven"] },
    { name: "费耶诺德", league: "荷甲", abbr: "FEY", aliases: ["费耶诺德队", "Feyenoord"] },
    { name: "阿尔克马尔", league: "荷甲", abbr: "AZ", aliases: ["AZ", "AZ阿尔克马尔", "AZ Alkmaar"] },
    { name: "特温特", league: "荷甲", abbr: "TWE", aliases: ["特温特队", "Twente"] },
    { name: "乌得勒支", league: "荷甲", abbr: "UTR", aliases: ["乌得勒支队", "FC Utrecht"] },
    { name: "海伦芬", league: "荷甲", abbr: "HEE", aliases: ["海伦芬队", "Heerenveen"] },
    { name: "维特斯", league: "荷甲", abbr: "VIT", aliases: ["维特斯队", "Vitesse"] },
    { name: "兹沃勒", league: "荷甲", abbr: "ZWO", aliases: ["兹沃勒队", "PEC Zwolle"] },
    { name: "格罗宁根", league: "荷甲", abbr: "GRO", aliases: ["格罗宁根队", "Groningen"] },
    { name: "奈梅亨", league: "荷甲", abbr: "NEC", aliases: ["NEC奈梅亨", "奈梅亨队", "NEC Nijmegen"] },
    { name: "福图纳锡塔德", league: "荷甲", abbr: "FOR", aliases: ["锡塔德", "福图纳", "Fortuna Sittard"] },
    { name: "布雷达", league: "荷甲", abbr: "NAC", aliases: ["NAC布雷达", "NAC Breda"] },
    { name: "瓦尔韦克", league: "荷甲", abbr: "RKC", aliases: ["RKC瓦尔韦克", "RKC Waalwijk"] },
    { name: "斯巴达鹿特丹", league: "荷甲", abbr: "SPA", aliases: ["斯巴达", "鹿特丹", "Sparta Rotterdam"] },
    { name: "赫拉克勒斯", league: "荷甲", abbr: "HER", aliases: ["赫拉克勒斯队", "Heracles"] },
    { name: "阿尔梅勒城", league: "荷甲", abbr: "ALM", aliases: ["阿尔梅勒", "Almere City"] },
    { name: "威廉二世", league: "荷甲", abbr: "WIL", aliases: ["威廉二世队", "Willem II"] },
    // ----------------------------------------------------------
    //  葡超 Primeira Liga (18 teams)
    // ----------------------------------------------------------
    { name: "本菲卡", league: "葡超", abbr: "BEN", aliases: ["本菲卡队", "老鹰", "Benfica"] },
    { name: "波尔图", league: "葡超", abbr: "POR", aliases: ["波尔图队", "波尔图FC", "FC Porto"] },
    { name: "葡萄牙体育", league: "葡超", abbr: "SCP", aliases: ["里斯本竞技", "体育", "葡体", "Sporting CP"] },
    { name: "布拉加", league: "葡超", abbr: "BRA", aliases: ["布拉加队", "布拉加体育", "SC Braga"] },
    { name: "吉马良斯", league: "葡超", abbr: "VIT", aliases: ["吉马良斯队", "维多利亚", "Vitoria Guimaraes"] },
    { name: "法马利康", league: "葡超", abbr: "FAM", aliases: ["法马利康队", "Famalicao"] },
    { name: "里奥阿维", league: "葡超", abbr: "RIO", aliases: ["里奥阿维队", "Rio Ave"] },
    { name: "博阿维斯塔", league: "葡超", abbr: "BOA", aliases: ["博阿维斯塔队", "Boavista"] },
    { name: "吉尔维森特", league: "葡超", abbr: "GIL", aliases: ["吉尔维森特队", "Gil Vicente"] },
    { name: "马里迪莫", league: "葡超", abbr: "MAR", aliases: ["马里迪莫队", "Maritimo"] },
    { name: "阿罗卡", league: "葡超", abbr: "ARO", aliases: ["阿罗卡队", "Arouca"] },
    { name: "卡萨皮亚", league: "葡超", abbr: "CAS", aliases: ["卡萨皮亚队", "Casa Pia"] },
    { name: "莫雷伦斯", league: "葡超", abbr: "MOR", aliases: ["莫雷伦斯队", "Moreirense"] },
    { name: "埃斯托里尔", league: "葡超", abbr: "EST", aliases: ["埃斯托里尔队", "Estoril"] },
    { name: "维塞乌", league: "葡超", abbr: "ACA", aliases: ["维塞乌队", "Academica Viseu"] },
    { name: "阿维斯", league: "葡超", abbr: "AVE", aliases: ["阿维斯队", "Aves"] },
    { name: "星队", league: "葡超", abbr: "EST", aliases: ["星队", "Estrela Amadora"] },
    { name: "国民队", league: "葡超", abbr: "NAC", aliases: ["国民", "Nacional"] },
    // ----------------------------------------------------------
    //  土超 Süper Lig (19 teams)
    // ----------------------------------------------------------
    { name: "加拉塔萨雷", league: "土超", abbr: "GAL", aliases: ["加拉塔", "加拉塔萨雷队", "Galatasaray"] },
    { name: "费内巴切", league: "土超", abbr: "FEN", aliases: ["费内巴切队", "Fenerbahce"] },
    { name: "贝西克塔斯", league: "土超", abbr: "BES", aliases: ["贝西克塔斯队", "黑鹰", "Besiktas"] },
    { name: "特拉布宗", league: "土超", abbr: "TRA", aliases: ["特拉布宗体育", "特拉布宗队", "Trabzonspor"] },
    { name: "巴萨克谢希尔", league: "土超", abbr: "IBB", aliases: ["巴萨克谢希尔队", "Basaksehir"] },
    { name: "阿达纳", league: "土超", abbr: "ADA", aliases: ["阿达纳德米尔", "Adana Demirspor"] },
    { name: "开塞利", league: "土超", abbr: "KAY", aliases: ["开塞利体育", "Kayserispor"] },
    { name: "安塔利亚", league: "土超", abbr: "ANT", aliases: ["安塔利亚体育", "Antalyaspor"] },
    { name: "科尼亚", league: "土超", abbr: "KON", aliases: ["科尼亚体育", "Konyaspor"] },
    { name: "锡瓦斯", league: "土超", abbr: "SIV", aliases: ["锡瓦斯体育", "Sivasspor"] },
    { name: "加济安泰普", league: "土超", abbr: "GAZ", aliases: ["加济安泰普队", "Gaziantep"] },
    { name: "阿兰亚", league: "土超", abbr: "ALA", aliases: ["阿兰亚体育", "Alanyaspor"] },
    { name: "里泽", league: "土超", abbr: "RIZ", aliases: ["里泽体育", "Rizespor"] },
    { name: "哈塔伊", league: "土超", abbr: "HAT", aliases: ["哈塔伊体育", "Hatayspor"] },
    { name: "彭迪克", league: "土超", abbr: "PEN", aliases: ["彭迪克体育", "Pendikspor"] },
    { name: "伊斯坦布尔", league: "土超", abbr: "IST", aliases: ["伊斯坦布尔体育", "Istanbulspor"] },
    { name: "卡斯帕萨", league: "土超", abbr: "KAS", aliases: ["卡斯帕萨队", "Kasimpasa"] },
    { name: "萨姆松", league: "土超", abbr: "SAM", aliases: ["萨姆松体育", "Samsunspor"] },
    { name: "博德鲁姆", league: "土超", abbr: "BOD", aliases: ["博德鲁姆体育", "Bodrumspor"] },
    // ----------------------------------------------------------
    //  比甲 Belgian Pro League (top 16)
    // ----------------------------------------------------------
    { name: "布鲁日", league: "比甲", abbr: "CLB", aliases: ["布鲁日队", "布鲁日俱乐部", "Club Brugge"] },
    { name: "安德莱赫特", league: "比甲", abbr: "AND", aliases: ["安德莱赫特队", "Anderlecht"] },
    { name: "根特", league: "比甲", abbr: "GEN", aliases: ["根特队", "KAA Gent"] },
    { name: "安特卫普", league: "比甲", abbr: "ANT", aliases: ["安特卫普队", "Royal Antwerp"] },
    { name: "标准列日", league: "比甲", abbr: "STL", aliases: ["列日", "标准列日队", "Standard Liege"] },
    { name: "亨克", league: "比甲", abbr: "GNK", aliases: ["亨克队", "Racing Genk"] },
    { name: "圣吉尔联合", league: "比甲", abbr: "USG", aliases: ["圣吉尔", "Union SG"] },
    { name: "梅赫伦", league: "比甲", abbr: "MEC", aliases: ["梅赫伦队", "Mechelen"] },
    { name: "色格拉布鲁日", league: "比甲", abbr: "CER", aliases: ["色格拉", "Cercle Brugge"] },
    { name: "奥斯坦德", league: "比甲", abbr: "OST", aliases: ["奥斯坦德队", "Oostende"] },
    { name: "科特赖克", league: "比甲", abbr: "KVK", aliases: ["科特赖克队", "Kortrijk"] },
    { name: "沙勒罗瓦", league: "比甲", abbr: "CHA", aliases: ["沙勒罗瓦队", "Charleroi"] },
    { name: "韦斯特洛", league: "比甲", abbr: "WES", aliases: ["韦斯特洛队", "Westerlo"] },
    { name: "欧本", league: "比甲", abbr: "EUP", aliases: ["欧本队", "Eupen"] },
    { name: "鲁汶", league: "比甲", abbr: "OHL", aliases: ["鲁汶队", "OH Leuven"] },
    { name: "贝弗伦", league: "比甲", abbr: "BEV", aliases: ["贝弗伦队", "Beveren"] },
    // ----------------------------------------------------------
    //  苏超 Scottish Premiership (12 teams - top 6-8 notable)
    // ----------------------------------------------------------
    { name: "凯尔特人", league: "苏超", abbr: "CEL", aliases: ["凯尔特人队", "格拉斯哥凯尔特人", "Celtic"] },
    { name: "流浪者", league: "苏超", abbr: "RAN", aliases: ["格拉斯哥流浪者", "流浪者队", "Rangers"] },
    { name: "阿伯丁", league: "苏超", abbr: "ABE", aliases: ["阿伯丁队", "Aberdeen"] },
    { name: "哈茨", league: "苏超", abbr: "HEA", aliases: ["哈茨队", "心脏队", "Hearts"] },
    { name: "希伯尼安", league: "苏超", abbr: "HIB", aliases: ["希伯尼安队", "Hibernian"] },
    { name: "邓迪联", league: "苏超", abbr: "DUN", aliases: ["邓迪联队", "Dundee United"] },
    { name: "马瑟韦尔", league: "苏超", abbr: "MOT", aliases: ["马瑟韦尔队", "Motherwell"] },
    { name: "基尔马诺克", league: "苏超", abbr: "KIL", aliases: ["基尔马诺克队", "Kilmarnock"] },
    // ----------------------------------------------------------
    //  奥甲 Austrian Bundesliga (12 teams - top 6-8 notable)
    // ----------------------------------------------------------
    { name: "萨尔茨堡红牛", league: "奥甲", abbr: "RBS", aliases: ["萨尔茨堡", "红牛萨尔茨堡", "RB Salzburg"] },
    { name: "格拉茨风暴", league: "奥甲", abbr: "STU", aliases: ["格拉茨", "风暴格拉茨", "Sturm Graz"] },
    { name: "维也纳快速", league: "奥甲", abbr: "RAP", aliases: ["快速", "维也纳快速队", "Rapid Wien"] },
    { name: "奥地利维也纳", league: "奥甲", abbr: "AUS", aliases: ["维也纳", "奥地利维也纳队", "Austria Wien"] },
    { name: "林茨", league: "奥甲", abbr: "LAS", aliases: ["林茨队", "LASK Linz"] },
    { name: "沃尔夫斯贝格", league: "奥甲", abbr: "WAC", aliases: ["沃尔夫斯贝格队", "Wolfsberger"] },
    { name: "哈特贝格", league: "奥甲", abbr: "HAR", aliases: ["哈特贝格队", "Hartberg"] },
    { name: "克拉根福", league: "奥甲", abbr: "KLA", aliases: ["克拉根福队", "Austria Klagenfurt"] },
    // ----------------------------------------------------------
    //  瑞超 Swiss Super League (12 teams - top 6-8 notable)
    // ----------------------------------------------------------
    { name: "伯尔尼年轻人", league: "瑞超", abbr: "YB", aliases: ["年轻人", "BSC年轻人", "Young Boys"] },
    { name: "巴塞尔", league: "瑞超", abbr: "BAS", aliases: ["巴塞尔队", "FC Basel"] },
    { name: "苏黎世", league: "瑞超", abbr: "FCZ", aliases: ["苏黎世队", "FC Zurich"] },
    { name: "卢塞恩", league: "瑞超", abbr: "LUZ", aliases: ["卢塞恩队", "Luzern"] },
    { name: "塞尔维特", league: "瑞超", abbr: "SER", aliases: ["塞尔维特队", "Servette"] },
    { name: "圣加仑", league: "瑞超", abbr: "STG", aliases: ["圣加仑队", "St. Gallen"] },
    { name: "草蜢", league: "瑞超", abbr: "GCZ", aliases: ["草蜢队", "Grasshoppers"] },
    { name: "锡昂", league: "瑞超", abbr: "SIO", aliases: ["锡昂队", "FC Sion"] },
    // ----------------------------------------------------------
    //  希超 Greek Super League (top 6-8 notable)
    // ----------------------------------------------------------
    { name: "奥林匹亚科斯", league: "希超", abbr: "OLY", aliases: ["奥林匹亚科斯队", "Olympiacos"] },
    { name: "帕纳辛奈科斯", league: "希超", abbr: "PAO", aliases: ["帕纳辛奈科斯队", "Panathinaikos"] },
    { name: "PAOK", league: "希超", abbr: "PAK", aliases: ["塞萨洛尼基", "PAOK Thessaloniki"] },
    { name: "AEK雅典", league: "希超", abbr: "AEK", aliases: ["雅典AEK", "AEK Athens"] },
    { name: "阿里斯", league: "希超", abbr: "ARI", aliases: ["阿里斯队", "阿里斯萨洛尼卡", "Aris"] },
    { name: "沃洛斯", league: "希超", abbr: "VOL", aliases: ["沃洛斯队", "Volos"] },
    // ----------------------------------------------------------
    //  捷甲 Czech First League (top 6-8 notable)
    // ----------------------------------------------------------
    { name: "布拉格斯巴达", league: "捷甲", abbr: "SPA", aliases: ["斯巴达", "布拉格斯巴达队", "Sparta Prague"] },
    { name: "布拉格斯拉维亚", league: "捷甲", abbr: "SLA", aliases: ["斯拉维亚", "布拉格斯拉维亚队", "Slavia Prague"] },
    { name: "比尔森胜利", league: "捷甲", abbr: "PLZ", aliases: ["比尔森", "维多利亚比尔森", "Viktoria Plzen"] },
    { name: "布拉格博莱斯拉夫", league: "捷甲", abbr: "MBL", aliases: ["博莱斯拉夫", "Mlada Boleslav"] },
    { name: "利贝雷茨", league: "捷甲", abbr: "LIB", aliases: ["利贝雷茨队", "Liberec"] },
    { name: "奥洛穆茨", league: "捷甲", abbr: "SIG", aliases: ["奥洛穆茨队", "Sigma Olomouc"] },
    { name: "俄斯特拉发", league: "捷甲", abbr: "BAO", aliases: ["俄斯特拉发队", "Banik Ostrava"] },
    // ----------------------------------------------------------
    //  克甲 Croatian First Football League (top 6-8 notable)
    // ----------------------------------------------------------
    { name: "萨格勒布迪纳摩", league: "克甲", abbr: "DIN", aliases: ["迪纳摩", "萨格勒布", "Dinamo Zagreb"] },
    { name: "海杜克", league: "克甲", abbr: "HAJ", aliases: ["海杜克队", "海杜克斯普利特", "Hajduk Split"] },
    { name: "奥西耶克", league: "克甲", abbr: "OSI", aliases: ["奥西耶克队", "Osijek"] },
    { name: "里耶卡", league: "克甲", abbr: "RIJ", aliases: ["里耶卡队", "Rijeka"] },
    { name: "戈里察", league: "克甲", abbr: "GOR", aliases: ["戈里察队", "Gorica"] },
    { name: "伊斯特拉", league: "克甲", abbr: "IST", aliases: ["伊斯特拉队", "Istra 1961"] },
    // ----------------------------------------------------------
    //  塞超 Serbian SuperLiga (top 6-8 notable)
    // ----------------------------------------------------------
    { name: "贝尔格莱德红星", league: "塞超", abbr: "CZV", aliases: ["红星", "贝红星", "Red Star Belgrade"] },
    { name: "游击队", league: "塞超", abbr: "PAR", aliases: ["贝尔格莱德游击队", "游击", "Partizan Belgrade"] },
    { name: "沃伊沃迪纳", league: "塞超", abbr: "VOJ", aliases: ["沃伊沃迪纳队", "Vojvodina"] },
    { name: "茨维塔", league: "塞超", abbr: "CUK", aliases: ["茨维塔队", "Cukaricki"] },
    { name: "尼什工人", league: "塞超", abbr: "RAD", aliases: ["尼什", "工人队", "Radnicki Nis"] },
    { name: "TSC", league: "塞超", abbr: "TSC", aliases: ["巴奇卡托波拉", "TSC Backa Topola"] },
    // ----------------------------------------------------------
    //  丹超 Danish Superliga (top 6-8 notable)
    // ----------------------------------------------------------
    { name: "哥本哈根", league: "丹超", abbr: "FCK", aliases: ["哥本哈根队", "FC Copenhagen"] },
    { name: "米迪兰特", league: "丹超", abbr: "FCM", aliases: ["中日德兰", "米迪兰特队", "FC Midtjylland"] },
    { name: "北西兰", league: "丹超", abbr: "NOR", aliases: ["北西兰队", "FC Nordsjaelland"] },
    { name: "布隆德比", league: "丹超", abbr: "BRO", aliases: ["布隆德比队", "Brondby"] },
    { name: "奥尔胡斯", league: "丹超", abbr: "AGF", aliases: ["奥胡斯", "奥尔胡斯队", "AGF Aarhus"] },
    { name: "欧登塞", league: "丹超", abbr: "OB", aliases: ["欧登塞队", "OB Odense"] },
    { name: "锡尔克堡", league: "丹超", abbr: "SIL", aliases: ["锡尔克堡队", "Silkeborg"] },
    // ----------------------------------------------------------
    //  瑞典超 Allsvenskan (top 6-8 notable)
    // ----------------------------------------------------------
    { name: "马尔默", league: "瑞典超", abbr: "MFF", aliases: ["马尔默队", "Malmo FF"] },
    { name: "佐加顿斯", league: "瑞典超", abbr: "DIF", aliases: ["佐加顿斯队", "Djurgardens"] },
    { name: "AIK", league: "瑞典超", abbr: "AIK", aliases: ["AIK索尔纳", "AIK Solna"] },
    { name: "哈马比", league: "瑞典超", abbr: "HAM", aliases: ["哈马比队", "Hammarby"] },
    { name: "哥德堡", league: "瑞典超", abbr: "IFK", aliases: ["哥德堡队", "IFK Goteborg"] },
    { name: "北雪平", league: "瑞典超", abbr: "NOR", aliases: ["北雪平队", "IFK Norrkoping"] },
    { name: "埃尔夫斯堡", league: "瑞典超", abbr: "ELF", aliases: ["埃尔夫斯堡队", "IF Elfsborg"] },
    // ----------------------------------------------------------
    //  挪超 Eliteserien (top 6-8 notable)
    // ----------------------------------------------------------
    { name: "博德闪耀", league: "挪超", abbr: "BOD", aliases: ["博德格林特", "博德", "Bodo/Glimt"] },
    { name: "莫尔德", league: "挪超", abbr: "MOL", aliases: ["莫尔德队", "Molde"] },
    { name: "罗森博格", league: "挪超", abbr: "RBK", aliases: ["罗森博格队", "Rosenborg"] },
    { name: "瓦勒伦加", league: "挪超", abbr: "VIF", aliases: ["瓦勒伦加队", "Valerenga"] },
    { name: "维京", league: "挪超", abbr: "VIK", aliases: ["维京队", "Viking"] },
    { name: "布兰", league: "挪超", abbr: "BRA", aliases: ["布兰队", "SK Brann"] },
    { name: "利勒斯特罗姆", league: "挪超", abbr: "LIL", aliases: ["利勒斯特罗姆队", "Lillestrom"] },
    // ----------------------------------------------------------
    //  沙特联 Saudi Pro League (18 teams)
    // ----------------------------------------------------------
    { name: "利雅得新月", league: "沙特联", abbr: "HIL", aliases: ["新月", "利雅得新月队", "Al Hilal"] },
    { name: "利雅得胜利", league: "沙特联", abbr: "NAS", aliases: ["胜利", "利雅得胜利队", "Al Nassr"] },
    { name: "吉达联合", league: "沙特联", abbr: "AHI", aliases: ["阿赫利", "吉达联合队", "Al Ahli"] },
    { name: "吉达联", league: "沙特联", abbr: "ITT", aliases: ["伊蒂哈德", "吉达联队", "Al Ittihad"] },
    { name: "利雅得青年", league: "沙特联", abbr: "SHA", aliases: ["阿尔沙巴布", "利雅得青年队", "Al Shabab"] },
    { name: "塔亚文", league: "沙特联", abbr: "TAA", aliases: ["塔亚文队", "Al Taawoun"] },
    { name: "法特赫", league: "沙特联", abbr: "FAT", aliases: ["法特赫队", "Al Fateh"] },
    { name: "拉伊德", league: "沙特联", abbr: "RAE", aliases: ["拉伊德队", "Al Raed"] },
    { name: "达曼协作", league: "沙特联", abbr: "ETT", aliases: ["达曼", "达曼协作队", "Ettifaq"] },
    { name: "利雅得合作", league: "沙特联", abbr: "FEI", aliases: ["费哈", "利雅得合作队", "Al Feiha"] },
    { name: "哈泽姆", league: "沙特联", abbr: "HAZ", aliases: ["哈泽姆队", "Al Hazem"] },
    { name: "卡利杰", league: "沙特联", abbr: "KHO", aliases: ["卡利杰队", "科利季", "Al Khaleej"] },
    { name: "阿科多", league: "沙特联", abbr: "AKH", aliases: ["阿科多队", "Al Akhdoud"] },
    { name: "阿维赫达", league: "沙特联", abbr: "WEH", aliases: ["阿维赫达队", "Al Wehda"] },
    { name: "奥鲁巴", league: "沙特联", abbr: "ORO", aliases: ["奥鲁巴队", "Al Orubah"] },
    { name: "利雅得", league: "沙特联", abbr: "RIY", aliases: ["利雅得队", "Al Riyadh"] },
    { name: "卡迪西亚", league: "沙特联", abbr: "QAD", aliases: ["卡迪西亚队", "Al Qadisiyah"] },
    { name: "吉赞", league: "沙特联", abbr: "JIZ", aliases: ["吉赞队", "Jizzan"] },
    { name: "达马克", league: "沙特联", abbr: "DMK", aliases: ["达马克队", "Damac", "Dhamk"] },
    // ----------------------------------------------------------
    //  中超 Chinese Super League (16 teams 2025-2026)
    // ----------------------------------------------------------
    { name: "上海海港", league: "中超", abbr: "SHP", aliases: ["海港", "上港", "上海上港", "Shanghai Port"] },
    { name: "山东泰山", league: "中超", abbr: "SDT", aliases: ["泰山", "山东鲁能", "鲁能", "Shandong Taishan"] },
    { name: "上海申花", league: "中超", abbr: "SHE", aliases: ["申花", "上海申花队", "Shanghai Shenhua"] },
    { name: "北京国安", league: "中超", abbr: "BGA", aliases: ["国安", "北京国安队", "御林军", "Beijing Guoan"] },
    { name: "成都蓉城", league: "中超", abbr: "CDR", aliases: ["蓉城", "成都", "Chengdu Rongcheng"] },
    { name: "武汉三镇", league: "中超", abbr: "WHS", aliases: ["三镇", "武汉", "Wuhan Three Towns"] },
    { name: "浙江队", league: "中超", abbr: "ZHJ", aliases: ["浙江", "浙江绿城", "绿城", "Zhejiang FC"] },
    { name: "天津津门虎", league: "中超", abbr: "TJT", aliases: ["津门虎", "天津", "天津泰达", "Tianjin Jinmen Tiger"] },
    { name: "长春亚泰", league: "中超", abbr: "CYA", aliases: ["亚泰", "长春", "Changchun Yatai"] },
    { name: "河南队", league: "中超", abbr: "HEN", aliases: ["河南", "河南建业", "建业", "Henan FC"] },
    { name: "大连人", league: "中超", abbr: "DLR", aliases: ["大连", "大连人队", "Dalian Pro"] },
    { name: "深圳新鹏城", league: "中超", abbr: "SZN", aliases: ["深圳", "新鹏城", "鹏城", "深圳队", "Shenzhen"] },
    { name: "沧州雄狮", league: "中超", abbr: "CZX", aliases: ["沧州", "雄狮", "Cangzhou Mighty Lions"] },
    { name: "南通支云", league: "中超", abbr: "NTZ", aliases: ["南通", "支云", "Nantong Zhiyun"] },
    { name: "梅州客家", league: "中超", abbr: "MZK", aliases: ["梅州", "客家", "Meizhou Hakka"] },
    { name: "青岛海牛", league: "中超", abbr: "QDH", aliases: ["青岛", "海牛", "青岛队", "Qingdao Hainiu"] },
    // ----------------------------------------------------------
    //  美职联 MLS (30 teams)
    // ----------------------------------------------------------
    { name: "迈阿密国际", league: "美职联", abbr: "MIA", aliases: ["迈阿密", "国际迈阿密", "Inter Miami"] },
    { name: "洛杉矶FC", league: "美职联", abbr: "LAF", aliases: ["LAFC", "洛杉矶FC队", "LAFC"] },
    { name: "洛杉矶银河", league: "美职联", abbr: "LAG", aliases: ["银河", "洛杉矶银河队", "LA Galaxy"] },
    { name: "纽约城", league: "美职联", abbr: "NYC", aliases: ["纽约城队", "纽约城FC", "New York City FC"] },
    { name: "纽约红牛", league: "美职联", abbr: "NYR", aliases: ["纽约红牛队", "New York Red Bulls"] },
    { name: "亚特兰大联", league: "美职联", abbr: "ATL", aliases: ["亚特兰大联队", "Atlanta United"] },
    { name: "西雅图海湾人", league: "美职联", abbr: "SEA", aliases: ["西雅图", "海湾人", "Seattle Sounders"] },
    { name: "波特兰伐木工", league: "美职联", abbr: "POR", aliases: ["波特兰", "伐木工", "Portland Timbers"] },
    { name: "辛辛那提", league: "美职联", abbr: "CIN", aliases: ["辛辛那提FC", "FC Cincinnati"] },
    { name: "纳什维尔", league: "美职联", abbr: "NSH", aliases: ["纳什维尔SC", "Nashville SC"] },
    { name: "哥伦布机员", league: "美职联", abbr: "CLB", aliases: ["哥伦布", "Columbus Crew"] },
    { name: "费城联合", league: "美职联", abbr: "PHI", aliases: ["费城", "费城联合队", "Philadelphia Union"] },
    { name: "多伦多FC", league: "美职联", abbr: "TOR", aliases: ["多伦多", "Toronto FC"] },
    { name: "蒙特利尔", league: "美职联", abbr: "MTL", aliases: ["蒙特利尔队", "CF Montreal"] },
    { name: "温哥华白浪", league: "美职联", abbr: "VAN", aliases: ["温哥华", "Vancouver Whitecaps"] },
    { name: "达拉斯FC", league: "美职联", abbr: "DAL", aliases: ["达拉斯", "FC Dallas"] },
    { name: "休斯顿发电机", league: "美职联", abbr: "HOU", aliases: ["休斯顿", "发电机", "Houston Dynamo"] },
    { name: "堪萨斯城竞技", league: "美职联", abbr: "SKC", aliases: ["堪萨斯城", "Sporting KC"] },
    { name: "明尼苏达联", league: "美职联", abbr: "MIN", aliases: ["明尼苏达", "Minnesota United"] },
    { name: "科罗拉多急流", league: "美职联", abbr: "COL", aliases: ["科罗拉多", "急流", "Colorado Rapids"] },
    { name: "奥斯汀FC", league: "美职联", abbr: "ATX", aliases: ["奥斯汀", "Austin FC"] },
    { name: "盐湖城", league: "美职联", abbr: "RSL", aliases: ["盐湖城队", "皇家盐湖城", "Real Salt Lake"] },
    { name: "圣何塞地震", league: "美职联", abbr: "SJE", aliases: ["圣何塞", "地震", "San Jose Earthquakes"] },
    { name: "新英格兰革命", league: "美职联", abbr: "NE", aliases: ["新英格兰", "革命", "New England Revolution"] },
    { name: "芝加哥火焰", league: "美职联", abbr: "CHI", aliases: ["芝加哥", "火焰", "Chicago Fire"] },
    { name: "夏洛特FC", league: "美职联", abbr: "CLT", aliases: ["夏洛特", "Charlotte FC"] },
    { name: "奥兰多城", league: "美职联", abbr: "ORL", aliases: ["奥兰多", "Orlando City"] },
    { name: "DC联合", league: "美职联", abbr: "DC", aliases: ["华盛顿联", "DC United"] },
    { name: "圣路易斯城", league: "美职联", abbr: "STL", aliases: ["圣路易斯", "St. Louis City"] },
    { name: "圣迭戈FC", league: "美职联", abbr: "SDG", aliases: ["圣迭戈", "San Diego FC"] },
    // ----------------------------------------------------------
    //  日职 J1 League (20 teams)
    // ----------------------------------------------------------
    { name: "横滨水手", league: "日职", abbr: "YFM", aliases: ["横滨F马里诺斯", "横滨", "Yokohama F. Marinos"] },
    { name: "神户胜利船", league: "日职", abbr: "VKO", aliases: ["神户", "胜利船", "Vissel Kobe"] },
    { name: "川崎前锋", league: "日职", abbr: "KAW", aliases: ["川崎", "前锋", "Kawasaki Frontale"] },
    { name: "浦和红钻", league: "日职", abbr: "URA", aliases: ["浦和", "红钻", "Urawa Reds"] },
    { name: "鹿岛鹿角", league: "日职", abbr: "KAS", aliases: ["鹿岛", "鹿角", "Kashima Antlers"] },
    { name: "广岛三箭", league: "日职", abbr: "HIR", aliases: ["广岛", "三箭", "Sanfrecce Hiroshima"] },
    { name: "名古屋鲸八", league: "日职", abbr: "NAG", aliases: ["名古屋", "鲸八", "Nagoya Grampus"] },
    { name: "FC东京", league: "日职", abbr: "FCT", aliases: ["东京", "FC东京队", "FC Tokyo"] },
    { name: "大阪樱花", league: "日职", abbr: "COS", aliases: ["大阪", "樱花", "Cerezo Osaka"] },
    { name: "大阪飞脚", league: "日职", abbr: "GAM", aliases: ["飞脚", "钢巴大阪", "Gamba Osaka"] },
    { name: "札幌冈萨多", league: "日职", abbr: "CON", aliases: ["札幌", "Consadole Sapporo"] },
    { name: "新潟天鹅", league: "日职", abbr: "ALB", aliases: ["新潟", "天鹅", "Albirex Niigata"] },
    { name: "柏太阳神", league: "日职", abbr: "KRE", aliases: ["柏", "太阳神", "Kashiwa Reysol"] },
    { name: "湘南比马", league: "日职", abbr: "SHO", aliases: ["湘南", "Shonan Bellmare"] },
    { name: "町田泽维亚", league: "日职", abbr: "MAC", aliases: ["町田", "Machida Zelvia"] },
    { name: "磐田喜悦", league: "日职", abbr: "JUB", aliases: ["磐田", "Jubilo Iwata"] },
    { name: "东京绿茵", league: "日职", abbr: "TOK", aliases: ["东京日尔迪", "Tokyo Verdy"] },
    { name: "京都不死鸟", league: "日职", abbr: "KYO", aliases: ["京都", "不死鸟", "Kyoto Sanga"] },
    { name: "福冈黄蜂", league: "日职", abbr: "AVI", aliases: ["福冈", "Avispa Fukuoka"] },
    { name: "清水心跳", league: "日职", abbr: "SHI", aliases: ["清水", "心跳", "Shimizu S-Pulse"] },
    // ----------------------------------------------------------
    //  韩K K League 1 (12 teams)
    // ----------------------------------------------------------
    { name: "蔚山现代", league: "韩K", abbr: "ULS", aliases: ["蔚山", "现代", "Ulsan HD"] },
    { name: "全北现代", league: "韩K", abbr: "JBM", aliases: ["全北", "全北汽车", "Jeonbuk Motors"] },
    { name: "浦项制铁", league: "韩K", abbr: "POH", aliases: ["浦项", "制铁", "Pohang Steelers"] },
    { name: "首尔FC", league: "韩K", abbr: "SEO", aliases: ["首尔", "FC Seoul"] },
    { name: "水原三星", league: "韩K", abbr: "SUW", aliases: ["水原", "三星蓝翼", "Suwon Bluewings"] },
    { name: "济州联", league: "韩K", abbr: "JEJ", aliases: ["济州", "济州联队", "Jeju United"] },
    { name: "仁川联", league: "韩K", abbr: "INC", aliases: ["仁川", "仁川联队", "Incheon United"] },
    { name: "大邱FC", league: "韩K", abbr: "DAE", aliases: ["大邱", "Daegu FC"] },
    { name: "大田市民", league: "韩K", abbr: "DAJ", aliases: ["大田", "大田公民", "Daejeon Citizen"] },
    { name: "光州FC", league: "韩K", abbr: "GWA", aliases: ["光州", "Gwangju FC"] },
    { name: "江原FC", league: "韩K", abbr: "GAN", aliases: ["江原", "Gangwon FC"] },
    { name: "金泉尚武", league: "韩K", abbr: "GIM", aliases: ["尚武", "金泉", "Gimcheon Sangmu"] },
    // ----------------------------------------------------------
    //  澳超 A-League (13 teams)
    // ----------------------------------------------------------
    { name: "墨尔本城", league: "澳超", abbr: "MCY", aliases: ["墨城", "墨尔本城队", "Melbourne City"] },
    { name: "墨尔本胜利", league: "澳超", abbr: "MVC", aliases: ["墨胜", "墨尔本胜利队", "Melbourne Victory"] },
    { name: "悉尼FC", league: "澳超", abbr: "SYD", aliases: ["悉尼", "Sydney FC"] },
    { name: "西悉尼流浪者", league: "澳超", abbr: "WSW", aliases: ["西悉尼", "Western Sydney Wanderers"] },
    { name: "中岸水手", league: "澳超", abbr: "CCM", aliases: ["中岸", "水手", "Central Coast Mariners"] },
    { name: "惠灵顿凤凰", league: "澳超", abbr: "WPH", aliases: ["惠灵顿", "凤凰", "Wellington Phoenix"] },
    { name: "布里斯班狮吼", league: "澳超", abbr: "BRI", aliases: ["布里斯班", "狮吼", "Brisbane Roar"] },
    { name: "珀斯光荣", league: "澳超", abbr: "PER", aliases: ["珀斯", "光荣", "Perth Glory"] },
    { name: "阿德莱德联", league: "澳超", abbr: "ADL", aliases: ["阿德莱德", "Adelaide United"] },
    { name: "纽卡斯尔喷射机", league: "澳超", abbr: "NEW", aliases: ["纽卡喷射机", "Newcastle Jets"] },
    { name: "西联", league: "澳超", abbr: "WUN", aliases: ["西联队", "西部联", "Western United"] },
    { name: "麦克阿瑟", league: "澳超", abbr: "MAC", aliases: ["麦克阿瑟FC", "Macarthur FC"] },
    { name: "奥克兰FC", league: "澳超", abbr: "AUK", aliases: ["奥克兰", "Auckland FC"] },
    // ----------------------------------------------------------
    //  国际赛 International (FIFA top ~100 + notable nations)
    // ----------------------------------------------------------
    // South America
    { name: "巴西", league: "国际赛", abbr: "BRA", aliases: ["巴西队", "桑巴军团", "五星巴西"] },
    { name: "阿根廷", league: "国际赛", abbr: "ARG", aliases: ["阿根廷队", "潘帕斯雄鹰"] },
    { name: "乌拉圭", league: "国际赛", abbr: "URU", aliases: ["乌拉圭队"] },
    { name: "哥伦比亚", league: "国际赛", abbr: "COL", aliases: ["哥伦比亚队"] },
    { name: "智利", league: "国际赛", abbr: "CHI", aliases: ["智利队"] },
    { name: "厄瓜多尔", league: "国际赛", abbr: "ECU", aliases: ["厄瓜多尔队"] },
    { name: "巴拉圭", league: "国际赛", abbr: "PAR", aliases: ["巴拉圭队"] },
    { name: "秘鲁", league: "国际赛", abbr: "PER", aliases: ["秘鲁队"] },
    { name: "玻利维亚", league: "国际赛", abbr: "BOL", aliases: ["玻利维亚队"] },
    { name: "委内瑞拉", league: "国际赛", abbr: "VEN", aliases: ["委内瑞拉队"] },
    // Europe - Western
    { name: "法国", league: "国际赛", abbr: "FRA", aliases: ["法国队", "高卢雄鸡"] },
    { name: "英格兰", league: "国际赛", abbr: "ENG", aliases: ["英格兰队", "三狮军团"] },
    { name: "西班牙", league: "国际赛", abbr: "ESP", aliases: ["西班牙队", "斗牛士军团"] },
    { name: "德国", league: "国际赛", abbr: "GER", aliases: ["德国队", "日耳曼战车"] },
    { name: "意大利", league: "国际赛", abbr: "ITA", aliases: ["意大利队", "蓝衣军团"] },
    { name: "葡萄牙", league: "国际赛", abbr: "POR", aliases: ["葡萄牙队"] },
    { name: "荷兰", league: "国际赛", abbr: "NED", aliases: ["荷兰队", "橙衣军团"] },
    { name: "比利时", league: "国际赛", abbr: "BEL", aliases: ["比利时队", "红魔", "欧洲红魔"] },
    { name: "瑞士", league: "国际赛", abbr: "SUI", aliases: ["瑞士队"] },
    { name: "奥地利", league: "国际赛", abbr: "AUT", aliases: ["奥地利队"] },
    { name: "苏格兰", league: "国际赛", abbr: "SCO", aliases: ["苏格兰队"] },
    { name: "威尔士", league: "国际赛", abbr: "WAL", aliases: ["威尔士队"] },
    { name: "爱尔兰", league: "国际赛", abbr: "IRL", aliases: ["爱尔兰队"] },
    { name: "北爱尔兰", league: "国际赛", abbr: "NIR", aliases: ["北爱尔兰队"] },
    // Europe - Scandinavia
    { name: "丹麦", league: "国际赛", abbr: "DEN", aliases: ["丹麦队", "丹麦童话"] },
    { name: "瑞典", league: "国际赛", abbr: "SWE", aliases: ["瑞典队"] },
    { name: "挪威", league: "国际赛", abbr: "NOR", aliases: ["挪威队"] },
    { name: "芬兰", league: "国际赛", abbr: "FIN", aliases: ["芬兰队"] },
    { name: "冰岛", league: "国际赛", abbr: "ISL", aliases: ["冰岛队"] },
    // Europe - Central & Eastern
    { name: "克罗地亚", league: "国际赛", abbr: "CRO", aliases: ["克罗地亚队", "格子军团"] },
    { name: "塞尔维亚", league: "国际赛", abbr: "SRB", aliases: ["塞尔维亚队"] },
    { name: "波兰", league: "国际赛", abbr: "POL", aliases: ["波兰队"] },
    { name: "捷克", league: "国际赛", abbr: "CZE", aliases: ["捷克队"] },
    { name: "乌克兰", league: "国际赛", abbr: "UKR", aliases: ["乌克兰队"] },
    { name: "匈牙利", league: "国际赛", abbr: "HUN", aliases: ["匈牙利队"] },
    { name: "罗马尼亚", league: "国际赛", abbr: "ROU", aliases: ["罗马尼亚队"] },
    { name: "斯洛伐克", league: "国际赛", abbr: "SVK", aliases: ["斯洛伐克队"] },
    { name: "斯洛文尼亚", league: "国际赛", abbr: "SVN", aliases: ["斯洛文尼亚队"] },
    { name: "波黑", league: "国际赛", abbr: "BIH", aliases: ["波斯尼亚", "波黑队", "波斯尼亚和黑塞哥维那"] },
    { name: "黑山", league: "国际赛", abbr: "MNE", aliases: ["黑山队"] },
    { name: "北马其顿", league: "国际赛", abbr: "MKD", aliases: ["北马其顿队", "马其顿"] },
    { name: "阿尔巴尼亚", league: "国际赛", abbr: "ALB", aliases: ["阿尔巴尼亚队"] },
    { name: "保加利亚", league: "国际赛", abbr: "BUL", aliases: ["保加利亚队"] },
    { name: "希腊", league: "国际赛", abbr: "GRE", aliases: ["希腊队"] },
    { name: "土耳其", league: "国际赛", abbr: "TUR", aliases: ["土耳其队"] },
    { name: "格鲁吉亚", league: "国际赛", abbr: "GEO", aliases: ["格鲁吉亚队"] },
    { name: "科索沃", league: "国际赛", abbr: "KVX", aliases: ["科索沃队"] },
    { name: "白俄罗斯", league: "国际赛", abbr: "BLR", aliases: ["白俄罗斯队"] },
    { name: "俄罗斯", league: "国际赛", abbr: "RUS", aliases: ["俄罗斯队"] },
    // Europe - Other
    { name: "以色列", league: "国际赛", abbr: "ISR", aliases: ["以色列队"] },
    { name: "塞浦路斯", league: "国际赛", abbr: "CYP", aliases: ["塞浦路斯队"] },
    { name: "卢森堡", league: "国际赛", abbr: "LUX", aliases: ["卢森堡队"] },
    { name: "亚美尼亚", league: "国际赛", abbr: "ARM", aliases: ["亚美尼亚队"] },
    { name: "阿塞拜疆", league: "国际赛", abbr: "AZE", aliases: ["阿塞拜疆队"] },
    { name: "爱沙尼亚", league: "国际赛", abbr: "EST", aliases: ["爱沙尼亚队"] },
    { name: "拉脱维亚", league: "国际赛", abbr: "LVA", aliases: ["拉脱维亚队"] },
    { name: "立陶宛", league: "国际赛", abbr: "LTU", aliases: ["立陶宛队"] },
    // Africa
    { name: "摩洛哥", league: "国际赛", abbr: "MAR", aliases: ["摩洛哥队", "阿特拉斯雄狮"] },
    { name: "塞内加尔", league: "国际赛", abbr: "SEN", aliases: ["塞内加尔队"] },
    { name: "尼日利亚", league: "国际赛", abbr: "NGA", aliases: ["尼日利亚队", "超级雄鹰"] },
    { name: "喀麦隆", league: "国际赛", abbr: "CMR", aliases: ["喀麦隆队", "非洲雄狮"] },
    { name: "加纳", league: "国际赛", abbr: "GHA", aliases: ["加纳队", "黑星"] },
    { name: "埃及", league: "国际赛", abbr: "EGY", aliases: ["埃及队", "法老"] },
    { name: "阿尔及利亚", league: "国际赛", abbr: "ALG", aliases: ["阿尔及利亚队"] },
    { name: "突尼斯", league: "国际赛", abbr: "TUN", aliases: ["突尼斯队"] },
    { name: "科特迪瓦", league: "国际赛", abbr: "CIV", aliases: ["象牙海岸", "科特迪瓦队"] },
    { name: "马里", league: "国际赛", abbr: "MLI", aliases: ["马里队"] },
    { name: "布基纳法索", league: "国际赛", abbr: "BFA", aliases: ["布基纳法索队"] },
    { name: "南非", league: "国际赛", abbr: "RSA", aliases: ["南非队"] },
    { name: "刚果民主", league: "国际赛", abbr: "COD", aliases: ["刚果金", "DR刚果"] },
    { name: "刚果", league: "国际赛", abbr: "CGO", aliases: ["刚果共和国", "刚果布"] },
    { name: "几内亚", league: "国际赛", abbr: "GUI", aliases: ["几内亚队"] },
    { name: "赞比亚", league: "国际赛", abbr: "ZAM", aliases: ["赞比亚队"] },
    { name: "佛得角", league: "国际赛", abbr: "CPV", aliases: ["佛得角队"] },
    { name: "莫桑比克", league: "国际赛", abbr: "MOZ", aliases: ["莫桑比克队"] },
    { name: "坦桑尼亚", league: "国际赛", abbr: "TAN", aliases: ["坦桑尼亚队"] },
    { name: "乌干达", league: "国际赛", abbr: "UGA", aliases: ["乌干达队"] },
    { name: "贝宁", league: "国际赛", abbr: "BEN", aliases: ["贝宁队"] },
    { name: "加蓬", league: "国际赛", abbr: "GAB", aliases: ["加蓬队"] },
    { name: "赤道几内亚", league: "国际赛", abbr: "EQG", aliases: ["赤道几内亚队"] },
    { name: "安哥拉", league: "国际赛", abbr: "ANG", aliases: ["安哥拉队"] },
    { name: "肯尼亚", league: "国际赛", abbr: "KEN", aliases: ["肯尼亚队"] },
    { name: "利比亚", league: "国际赛", abbr: "LBY", aliases: ["利比亚队"] },
    { name: "纳米比亚", league: "国际赛", abbr: "NAM", aliases: ["纳米比亚队"] },
    { name: "马达加斯加", league: "国际赛", abbr: "MAD", aliases: ["马达加斯加队"] },
    // Asia
    { name: "日本", league: "国际赛", abbr: "JPN", aliases: ["日本队", "蓝色武士"] },
    { name: "韩国", league: "国际赛", abbr: "KOR", aliases: ["韩国队", "太极虎"] },
    { name: "中国", league: "国际赛", abbr: "CHN", aliases: ["中国队", "国足"] },
    { name: "伊朗", league: "国际赛", abbr: "IRN", aliases: ["伊朗队", "波斯铁骑"] },
    { name: "澳大利亚", league: "国际赛", abbr: "AUS", aliases: ["澳大利亚队", "袋鼠军团"] },
    { name: "沙特阿拉伯", league: "国际赛", abbr: "KSA", aliases: ["沙特", "沙特队"] },
    { name: "卡塔尔", league: "国际赛", abbr: "QAT", aliases: ["卡塔尔队"] },
    { name: "阿联酋", league: "国际赛", abbr: "UAE", aliases: ["阿联酋队"] },
    { name: "伊拉克", league: "国际赛", abbr: "IRQ", aliases: ["伊拉克队"] },
    { name: "乌兹别克斯坦", league: "国际赛", abbr: "UZB", aliases: ["乌兹别克", "乌兹别克斯坦队"] },
    { name: "泰国", league: "国际赛", abbr: "THA", aliases: ["泰国队"] },
    { name: "越南", league: "国际赛", abbr: "VIE", aliases: ["越南队"] },
    { name: "印度", league: "国际赛", abbr: "IND", aliases: ["印度队"] },
    { name: "约旦", league: "国际赛", abbr: "JOR", aliases: ["约旦队"] },
    { name: "巴林", league: "国际赛", abbr: "BHR", aliases: ["巴林队"] },
    { name: "阿曼", league: "国际赛", abbr: "OMA", aliases: ["阿曼队"] },
    { name: "叙利亚", league: "国际赛", abbr: "SYR", aliases: ["叙利亚队"] },
    { name: "巴勒斯坦", league: "国际赛", abbr: "PLE", aliases: ["巴勒斯坦队"] },
    { name: "黎巴嫩", league: "国际赛", abbr: "LBN", aliases: ["黎巴嫩队"] },
    { name: "吉尔吉斯斯坦", league: "国际赛", abbr: "KGZ", aliases: ["吉尔吉斯"] },
    { name: "塔吉克斯坦", league: "国际赛", abbr: "TJK", aliases: ["塔吉克"] },
    { name: "印度尼西亚", league: "国际赛", abbr: "IDN", aliases: ["印尼", "印度尼西亚队"] },
    { name: "马来西亚", league: "国际赛", abbr: "MAS", aliases: ["马来西亚队", "大马"] },
    { name: "朝鲜", league: "国际赛", abbr: "PRK", aliases: ["朝鲜队"] },
    { name: "缅甸", league: "国际赛", abbr: "MYA", aliases: ["缅甸队"] },
    { name: "土库曼斯坦", league: "国际赛", abbr: "TKM", aliases: ["土库曼"] },
    { name: "新加坡", league: "国际赛", abbr: "SGP", aliases: ["新加坡队"] },
    { name: "菲律宾", league: "国际赛", abbr: "PHI", aliases: ["菲律宾队"] },
    { name: "中国香港", league: "国际赛", abbr: "HKG", aliases: ["香港", "香港队"] },
    { name: "中国台北", league: "国际赛", abbr: "TPE", aliases: ["台北", "中华台北"] },
    // North & Central America + Caribbean
    { name: "墨西哥", league: "国际赛", abbr: "MEX", aliases: ["墨西哥队"] },
    { name: "美国", league: "国际赛", abbr: "USA", aliases: ["美国队"] },
    { name: "加拿大", league: "国际赛", abbr: "CAN", aliases: ["加拿大队"] },
    { name: "哥斯达黎加", league: "国际赛", abbr: "CRC", aliases: ["哥斯达黎加队"] },
    { name: "洪都拉斯", league: "国际赛", abbr: "HON", aliases: ["洪都拉斯队"] },
    { name: "巴拿马", league: "国际赛", abbr: "PAN", aliases: ["巴拿马队"] },
    { name: "牙买加", league: "国际赛", abbr: "JAM", aliases: ["牙买加队"] },
    { name: "萨尔瓦多", league: "国际赛", abbr: "SLV", aliases: ["萨尔瓦多队"] },
    { name: "特立尼达和多巴哥", league: "国际赛", abbr: "TRI", aliases: ["特多", "特立尼达"] },
    { name: "危地马拉", league: "国际赛", abbr: "GUA", aliases: ["危地马拉队"] },
    { name: "库拉索", league: "国际赛", abbr: "CUW", aliases: ["库拉索队"] },
    { name: "海地", league: "国际赛", abbr: "HAI", aliases: ["海地队"] },
    // Oceania
    { name: "新西兰", league: "国际赛", abbr: "NZL", aliases: ["新西兰队", "全白队"] }
  ];
  var lookupTeam = (inputName) => {
    if (!inputName || typeof inputName !== "string") return null;
    const q = inputName.trim();
    if (q.length === 0) return null;
    for (const team of TEAM_DB) {
      if (team.name === q) {
        return { name: team.name, league: team.league, abbr: team.abbr };
      }
    }
    for (const team of TEAM_DB) {
      if (team.aliases && team.aliases.some((a) => a === q)) {
        return { name: team.name, league: team.league, abbr: team.abbr };
      }
    }
    let bestMatch = null;
    let bestLen = Infinity;
    for (const team of TEAM_DB) {
      const candidates = [team.name, ...team.aliases || []];
      for (const c of candidates) {
        if (c.includes(q) || q.includes(c)) {
          const diff = Math.abs(c.length - q.length);
          if (diff < bestLen) {
            bestLen = diff;
            bestMatch = team;
          }
        }
      }
    }
    if (bestMatch) {
      return { name: bestMatch.name, league: bestMatch.league, abbr: bestMatch.abbr };
    }
    return null;
  };

  // source/src/lib/returnRisk.js
  var getReturnRiskRatios = (returns, target = 0) => {
    const values2 = (returns || []).filter(Number.isFinite).map((r) => r - target);
    const n = values2.length;
    const mean = n ? values2.reduce((s, r) => s + r, 0) / n : NaN;
    const deviation = n > 1 ? Math.sqrt(values2.reduce((s, r) => s + (r - mean) ** 2, 0) / n) : NaN;
    const downsideDeviation = n ? Math.sqrt(values2.reduce((s, r) => s + Math.min(0, r) ** 2, 0) / n) : NaN;
    return {
      samples: n,
      target,
      basis: "per_investment_non_annualized",
      deviation,
      downsideDeviation,
      sharpe: deviation > 1e-12 ? mean / deviation : NaN,
      sortino: downsideDeviation > 1e-12 ? mean / downsideDeviation : NaN
    };
  };

  // source/src/lib/matchPrediction.js
  var clamp2 = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  var weight = (x, fallback) => Number.isFinite(Number.parseFloat(x)) ? clamp2(Number.parseFloat(x), 0.01, 1.5) : fallback;
  var MODE = { 常规: 1, "常规-稳": 1.05, "常规-杠杆": 0.95, "常规-激进": 0.95, 半彩票半保险: 0.92, 保险产品: 1.08, 赌一把: 0.88 };
  var TYS = { S: 0.94, M: 1, L: 1.04, H: 1.08 };
  var FID = { 0: 0.92, 0.25: 0.99, 0.4: 1.02, 0.5: 1.05, 0.6: 1.07, 0.75: 1.1 };
  var MODE_AFFECTS_PROBABILITY = false;
  var predictMatchProbability = (match, config, context) => {
    const rawConf = clamp2(Number(match.conf), 0.05, 0.95);
    const conf = typeof context?.calibrate === "function" ? clamp2(context.calibrate(rawConf), 0.05, 0.95) : clamp2(rawConf * clamp2(Number(context?.multipliers?.conf || 1), 0.75, 1.25), 0.05, 0.95);
    const lf = context?.learnedFactors;
    const learned = lf && lf.reliability > 0.15;
    const factor = (kind, key, priors) => learned && lf[kind]?.[key] != null ? lf[kind][key] : priors[key] || 1;
    const mode = MODE_AFFECTS_PROBABILITY ? factor("mode", match.mode, MODE) : 1;
    const tys = (factor("tys", match.tysHome ?? match.tys_home, TYS) + factor("tys", match.tysAway ?? match.tys_away, TYS)) / 2;
    const fid = factor("fid", String(match.fid), FID);
    const fseGeo = Math.sqrt(clamp2(Number(match.fseHome ?? match.fse_home ?? 0.1), 0.05, 1) * clamp2(Number(match.fseAway ?? match.fse_away ?? 0.1), 0.05, 1));
    const fseBase = learned && typeof lf.fse?.interpolate === "function" ? lf.fse.interpolate(fseGeo) : 0.88 + fseGeo * 0.24;
    const fse = clamp2(fseBase * clamp2(Number(context?.multipliers?.fse || 1), 0.75, 1.25), 0.72, 1.35);
    const lift = mode ** weight(config.weightMode, 0.16) * tys ** weight(config.weightTys, 0.12) * fid ** weight(config.weightFid, 0.14) * fse ** weight(config.weightFse, 0.07);
    const baseProbability2 = clamp2(conf * lift, 0.05, 0.95);
    const odds = estimateEntryAnchorOdds(match.entries, Number(match.odds) || Number(config.defaultOdds || 2.5));
    if (typeof context?.calibrateProbabilityForMatch !== "function") return baseProbability2;
    return clamp2(context.calibrateProbabilityForMatch({
      baseProbability: baseProbability2,
      conf: rawConf,
      odds,
      homeTeam: match.homeTeam ?? match.home_team,
      awayTeam: match.awayTeam ?? match.away_team
    }), 0.05, 0.95);
  };

  // source/src/lib/temporalValidation.js
  var validTime = (value) => value == null || value === "" ? NaN : new Date(value).getTime();
  var LEGACY_OUTCOME_AVAILABILITY_HOURS = 72;
  var OUTCOME_AVAILABILITY_BASIS = Object.freeze({
    recorded: "recorded_settlement_time",
    derived: "derived_created_at_plus_72h",
    unknown: "unknown"
  });
  var resolveOutcomeAvailability = (recordedAt, createdAt) => {
    const recorded = validTime(recordedAt);
    if (Number.isFinite(recorded)) return { at: recorded, basis: OUTCOME_AVAILABILITY_BASIS.recorded };
    const created = validTime(createdAt);
    if (Number.isFinite(created)) {
      return {
        at: created + LEGACY_OUTCOME_AVAILABILITY_HOURS * 60 * 60 * 1e3,
        basis: OUTCOME_AVAILABILITY_BASIS.derived
      };
    }
    return { at: Number.NaN, basis: OUTCOME_AVAILABILITY_BASIS.unknown };
  };
  var matchEventKey = (match, investmentId) => {
    const id = getMatchSourceIdentity(match, investmentId);
    return id.event_id ? `event:${id.event_id}` : id.source_match_id && id.source_investment_id ? `source:${JSON.stringify([id.source_investment_id, id.source_match_id])}` : "";
  };
  var uniqueMatchRows = (investments) => {
    const selected = /* @__PURE__ */ new Map();
    const unknown = /* @__PURE__ */ new Map();
    const anonymous = [];
    for (const investment of investments) {
      for (const match of investment.matches || []) {
        const identity = getMatchSourceIdentity(match, investment.id);
        const eventKey3 = matchEventKey(match, investment.id);
        const availability = resolveOutcomeAvailability(
          match.outcome_available_at || investment.outcome_available_at || investment.settled_at,
          investment.created_at
        );
        const row = {
          investment,
          match,
          created_at: investment.created_at,
          eventKey: eventKey3,
          outcome_available_at: availability.at,
          outcome_availability_basis: availability.basis
        };
        if (!eventKey3 || !identity.selection_key) {
          const coarseKey = eventKey3 ? JSON.stringify(["event", eventKey3, match.id || ""]) : match.id ? JSON.stringify(["match", investment.id, match.id]) : "";
          if (!coarseKey) {
            anonymous.push(row);
            continue;
          }
          const old2 = unknown.get(coarseKey);
          if (!old2 || validTime(row.created_at) < validTime(old2.created_at)) unknown.set(coarseKey, row);
          continue;
        }
        const key = JSON.stringify([eventKey3, identity.selection_key]);
        const old = selected.get(key);
        if (!old || validTime(row.created_at) < validTime(old.created_at)) selected.set(key, row);
      }
    }
    return [...selected.values(), ...unknown.values(), ...anonymous];
  };
  var historyFromRows = (rows) => {
    const grouped = /* @__PURE__ */ new Map();
    for (const row of rows) {
      if (!row.investment || !row.match) continue;
      const key = row.investment.id || row.investment;
      if (!grouped.has(key)) grouped.set(key, { ...row.investment, matches: [] });
      grouped.get(key).matches.push(row.match);
    }
    return [...grouped.values()];
  };

  // source/src/lib/adaptiveValidation.js
  var probabilityLoss = (rows, predict) => {
    if (!rows.length) return { brier: NaN, logLoss: NaN };
    let brier = 0, logLoss = 0;
    for (const row of rows) {
      const p = Math.max(1e-3, Math.min(0.999, predict(row)));
      if (!Number.isFinite(p)) return { brier: NaN, logLoss: NaN };
      brier += (p - row.actual) ** 2;
      logLoss -= row.actual * Math.log(p) + (1 - row.actual) * Math.log(1 - p);
    }
    return { brier: brier / rows.length, logLoss: logLoss / rows.length };
  };
  var validatesProbabilityUpdate = (baseline, candidate) => Number.isFinite(baseline?.brier) && Number.isFinite(candidate?.brier) && Number.isFinite(baseline?.logLoss) && Number.isFinite(candidate?.logLoss) && candidate.brier < baseline.brier - 1e-8 && candidate.logLoss <= baseline.logLoss + 1e-8;

  // source/src/lib/dependencyHistory.js
  var canonicalDependencyHistory = (history) => {
    const seen = /* @__PURE__ */ new Set();
    return [...history].sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0) || JSON.stringify(a).localeCompare(JSON.stringify(b))).filter((row) => {
      const keys = (row.matches || []).map((m) => m.identityKey);
      if (!keys.length || keys.some((key2) => !key2)) return true;
      const key = JSON.stringify([...keys].sort());
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  var toDependencyHistory = (investments) => canonicalDependencyHistory(investments.filter((inv) => !inv.is_archived && inv.status !== "pending" && (inv.matches || []).length >= 2 && (["win", "lose", "settled", "settled_win", "settled_loss"].includes(inv.status) || Number.isFinite(Number.parseFloat(inv.profit)))).map((inv) => ({
    id: inv.id,
    createdAt: inv.created_at || inv.createdAt,
    succeeded: Number(inv.revenues) > 0 || inv.status === "win" || inv.status === "settled_win",
    matches: inv.matches.map((m) => ({
      odds: Number(m.odds),
      result: typeof m.is_correct === "boolean" ? m.is_correct : void 0,
      eventKey: matchEventKey(m, inv.id),
      identityKey: m.event_id ? `${m.event_id}:${getSelectionIdentityKey({ ...m, source_investment_id: "", source_match_id: "", id: "" })}` : getSelectionIdentityKey(m, inv.id)
    }))
  })));

  // source/src/lib/matchAttribution.js
  var number = (value) => Number.parseFloat(value);
  var splitInvestmentToMatches = (investment) => {
    const matches = Array.isArray(investment.matches) ? investment.matches : [];
    if (!matches.length) return [];
    const inputs = Math.max(0, number(investment.inputs) || 0);
    const declared = number(investment.revenues), profit = number(investment.profit);
    const revenue = investment.status === "pending" ? NaN : Number.isFinite(declared) ? Math.max(0, declared) : Number.isFinite(profit) ? Math.max(0, inputs + profit) : NaN;
    const odds = matches.map((m) => Math.max(0, number(m.odds) || 0));
    const sum = odds.reduce((s, n) => s + n, 0);
    return matches.map((match, i) => {
      const allocatedRevenue = revenue * (sum > 0 ? odds[i] / sum : 1 / matches.length);
      return {
        ...match,
        allocated_input: inputs / matches.length,
        allocated_revenue: allocatedRevenue,
        allocated_profit: allocatedRevenue - inputs / matches.length,
        attribution_basis: matches.length > 1 ? "synthetic_equal_stake_odds_weighted_revenue" : "single_match_realized"
      };
    });
  };

  // source/src/lib/analytics.js
  var MODE_KEYS = ["常规", "常规-稳", "常规-杠杆", "半彩票半保险", "保险产品", "赌一把"];
  var MODE_ALIAS = {
    "常规-激进": "常规-杠杆"
  };
  var toNumber3 = (value, fallback = 0) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  var clamp3 = (value, min, max) => Math.max(min, Math.min(max, value));
  var AJR_INPUT_MAX = 0.8;
  var MONTE_CARLO_TARGET_RUNS = 1e5;
  var MONTE_CARLO_MIN_RUNS = 12e3;
  var MONTE_CARLO_OP_BUDGET = 6e6;
  var PREQUENTIAL_STEP_MATCHES = 7;
  var PREQUENTIAL_MIN_TRAIN_MATCHES = 14;
  var PREQUENTIAL_MIN_TEST_MATCHES = 7;
  var WINDOW_TIME_BASIS = Object.freeze({
    derivedAvailability: "contains_derived_availability",
    recordedOnly: "recorded_only"
  });
  var ANALYTICS_CACHE_EVENT = "eivra:data-changed";
  var ANALYTICS_CACHE_HANDLER_KEY = "__eivraAnalyticsCacheInvalidator__";
  var analyticsMemo = {
    revision: 0,
    modeKelly: /* @__PURE__ */ new Map(),
    dashboard: /* @__PURE__ */ new Map(),
    analysis: /* @__PURE__ */ new Map(),
    metrics: /* @__PURE__ */ new Map(),
    expectedVsActual: /* @__PURE__ */ new Map(),
    kellyMatrix: /* @__PURE__ */ new Map(),
    kellyBacktest: /* @__PURE__ */ new Map(),
    calibrationContext: /* @__PURE__ */ new Map(),
    modelValidation: /* @__PURE__ */ new Map()
  };
  var clearAnalyticsMemo = () => {
    analyticsMemo.modeKelly.clear();
    analyticsMemo.dashboard.clear();
    analyticsMemo.analysis.clear();
    analyticsMemo.metrics.clear();
    analyticsMemo.expectedVsActual.clear();
    analyticsMemo.kellyMatrix.clear();
    analyticsMemo.kellyBacktest.clear();
    analyticsMemo.calibrationContext.clear();
    analyticsMemo.modelValidation.clear();
  };
  var bumpAnalyticsRevision = () => {
    analyticsMemo.revision += 1;
    clearAnalyticsMemo();
  };
  var getRevisionCacheKey = (scope, suffix = "") => `${analyticsMemo.revision}|${scope}|${suffix}`;
  if (typeof window !== "undefined") {
    const previousInvalidator = window[ANALYTICS_CACHE_HANDLER_KEY];
    if (typeof previousInvalidator === "function") {
      window.removeEventListener(ANALYTICS_CACHE_EVENT, previousInvalidator);
    }
    const invalidator = (event) => {
      if (event?.detail?.uiOnly === true) return;
      bumpAnalyticsRevision();
    };
    window.addEventListener(ANALYTICS_CACHE_EVENT, invalidator);
    window[ANALYTICS_CACHE_HANDLER_KEY] = invalidator;
  }
  var normalizeAjrForModel = (value, fallback = Number.NaN) => {
    const parsed = toNumber3(value, Number.NaN);
    if (!Number.isFinite(parsed)) return fallback;
    const clamped = clamp3(parsed, 0, AJR_INPUT_MAX);
    return clamp3(clamped / AJR_INPUT_MAX, 0, 1);
  };
  var formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}-${day}`;
  };
  var normalize2 = (value) => String(value || "").trim().toLowerCase();
  var normalizeMode = (mode) => MODE_ALIAS[mode] || mode;
  var isActiveInvestment = (item) => !item?.is_archived;
  var getActiveInvestments = () => getInvestments2().filter(isActiveInvestment);
  var getDependencyHistory = () => toDependencyHistory(getActiveInvestments());
  var getWeightFactor = (value, fallback = 0.06) => clamp3(toNumber3(value, fallback), 0.01, 1.5);
  var toImpliedProbability = (odds, floor = 0.02, ceil = 0.98) => {
    const parsed = toNumber3(odds, Number.NaN);
    if (!Number.isFinite(parsed) || parsed <= 1) return Number.NaN;
    return clamp3(1 / parsed, floor, ceil);
  };
  var resolveTeamNameForCalibration = (teamName, profiles = []) => {
    const clean = String(teamName || "").trim();
    if (!clean) return "";
    const profile = findTeamProfile(clean, profiles);
    return profile?.teamName || clean;
  };
  var getRangeDays = (periodKey) => {
    if (periodKey === "1w") return 7;
    if (periodKey === "2w") return 14;
    if (periodKey === "1m") return 30;
    return null;
  };
  var getPeriodRange = (periodKey, shift = 0, now = /* @__PURE__ */ new Date()) => {
    const days = getRangeDays(periodKey);
    if (!days) return null;
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    end.setDate(end.getDate() - days * shift);
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return { start, end, days };
  };
  var inRange = (value, range) => {
    if (!range) return true;
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) return false;
    return time >= range.start.getTime() && time <= range.end.getTime();
  };
  var getSettledInvestments = (investments) => investments.filter(
    (item) => isActiveInvestment(item) && item.status !== "pending" && (item.status === "win" || item.status === "lose" || Number.isFinite(Number.parseFloat(item.profit)))
  );
  var calcRoi = (profit, inputs) => inputs > 0 ? profit / inputs * 100 : 0;
  var calcRatingFit = (rows) => {
    if (rows.length === 0) return 0;
    const avgAbsDiff = rows.reduce((sum, row) => sum + Math.abs(row.actual_rating - row.expected_rating), 0) / rows.length;
    return clamp3(1 - avgAbsDiff, 0, 1);
  };
  var getRatingRowsFromInvestments = (investments) => {
    const rows = [];
    investments.forEach((item) => {
      const normalizedInvestmentRating = normalizeAjrForModel(item.expected_rating, Number.NaN);
      const matches = Array.isArray(item.matches) ? item.matches : [];
      matches.forEach((match) => {
        const calibrated = toNumber3(match.calibrated_probability, NaN);
        const conf = toNumber3(match.conf, NaN);
        const expectation = Number.isFinite(calibrated) ? { value: calibrated, basis: "leg_calibrated_probability" } : Number.isFinite(conf) && conf > 0 && conf <= 1 ? { value: conf, basis: "leg_conf" } : Number.isFinite(normalizedInvestmentRating) ? { value: normalizedInvestmentRating, basis: "investment_expected_rating_normalized" } : null;
        const actual = normalizeAjrForModel(match.match_rating, Number.NaN);
        if (!expectation || !Number.isFinite(actual)) return;
        rows.push({
          investment_id: item.id,
          date: item.created_at,
          match: `${match.home_team || "-"} vs ${match.away_team || "-"}`,
          expected_rating: expectation.value,
          actual_rating: actual,
          expectedBasis: expectation.basis,
          actualBasis: "normalized_AJR"
        });
      });
    });
    return rows;
  };
  var buildConfCalibration = (investments) => {
    const bins = [
      { label: "0.0-0.2", min: 0, max: 0.2 },
      { label: "0.2-0.4", min: 0.2, max: 0.4 },
      { label: "0.4-0.6", min: 0.4, max: 0.6 },
      { label: "0.6-0.7", min: 0.6, max: 0.7 },
      { label: "0.7-0.8", min: 0.7, max: 0.8 },
      { label: "0.8+", min: 0.8, max: 1.01 }
    ];
    const rows = bins.map((bin) => ({
      ...bin,
      expected_sum: 0,
      actual_sum: 0,
      samples: 0
    }));
    investments.forEach((item) => {
      const matches = Array.isArray(item.matches) ? item.matches : [];
      matches.forEach((match) => {
        const conf = toNumber3(match.conf, NaN);
        const actual = normalizeAjrForModel(match.match_rating, Number.NaN);
        if (!Number.isFinite(conf) || !Number.isFinite(actual)) return;
        const row = rows.find((bin) => conf >= bin.min && conf < bin.max);
        if (!row) return;
        row.expected_sum += conf;
        row.actual_sum += actual;
        row.samples += 1;
      });
    });
    return rows.map((row) => {
      const expected = row.samples > 0 ? row.expected_sum / row.samples : 0;
      const actual = row.samples > 0 ? row.actual_sum / row.samples : 0;
      return {
        label: row.label,
        expected,
        actual,
        actualBasis: "normalized_AJR_judgment_scale",
        samples: row.samples
      };
    });
  };
  var buildBalanceSeries = (settledInvestments, initialCapital, periodKey) => {
    const sorted = [...settledInvestments].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const points = [];
    let balance = initialCapital;
    sorted.forEach((item) => {
      const firstMatch = item.matches?.[0];
      const parlaySize = Number(item.parlay_size || item.matches?.length || 1);
      const matchLabel = parlaySize > 1 ? `${firstMatch?.home_team || "-"} vs ${firstMatch?.away_team || "-"} 等${parlaySize}场` : `${firstMatch?.home_team || "-"} vs ${firstMatch?.away_team || "-"}`;
      balance += toNumber3(item.profit);
      points.push({
        date: item.created_at,
        label: formatDate(item.created_at),
        balance: Number(balance.toFixed(2)),
        match: matchLabel
      });
    });
    if (periodKey === "all") {
      return points.slice(-40);
    }
    const range = getPeriodRange(periodKey);
    if (!range) return points.slice(-40);
    const within = points.filter((point) => inRange(point.date, range));
    const before = points.filter((point) => new Date(point.date).getTime() < range.start.getTime());
    const baseline = before.length > 0 ? before[before.length - 1] : null;
    const result = baseline ? [baseline, ...within] : within;
    if (result.length === 0) {
      return [
        {
          date: (/* @__PURE__ */ new Date()).toISOString(),
          label: formatDate((/* @__PURE__ */ new Date()).toISOString()),
          balance: Number(initialCapital.toFixed(2)),
          match: "初始资金基线"
        }
      ];
    }
    return result.slice(-40);
  };
  var calcRepBuckets = (settledInvestments) => {
    const buckets = {
      low: { label: "低随机性", count: 0, inputs: 0, profit: 0 },
      medium: { label: "中随机性", count: 0, inputs: 0, profit: 0 },
      high: { label: "高随机性", count: 0, inputs: 0, profit: 0 }
    };
    settledInvestments.forEach((item) => {
      const rep = toNumber3(item.rep, 0);
      const inputs = Math.max(0, toNumber3(item.inputs));
      const profit = toNumber3(item.profit);
      const bucketKey = rep <= 0.4 ? "low" : rep <= 0.8 ? "medium" : "high";
      buckets[bucketKey].count += 1;
      buckets[bucketKey].inputs += inputs;
      buckets[bucketKey].profit += profit;
    });
    return Object.values(buckets).map((bucket) => ({
      ...bucket,
      roi: calcRoi(bucket.profit, bucket.inputs)
    }));
  };
  var calcConf04Stats = (settledInvestments) => {
    let total = 0;
    let correct = 0;
    settledInvestments.forEach((item) => {
      ;
      (item.matches || []).forEach((match) => {
        const conf = toNumber3(match.conf, NaN);
        if (!Number.isFinite(conf) || conf < 0.4) return;
        if (typeof match.is_correct !== "boolean") return;
        total += 1;
        if (match.is_correct) correct += 1;
      });
    });
    return { total, correct };
  };
  var getConfBandLabel = (conf) => {
    if (!Number.isFinite(conf)) return "unknown";
    if (conf < 0.2) return "0.0-0.2";
    if (conf < 0.4) return "0.2-0.4";
    if (conf < 0.6) return "0.4-0.6";
    if (conf < 0.7) return "0.6-0.7";
    if (conf < 0.8) return "0.7-0.8";
    return "0.8+";
  };
  var getMatchOutcomeStatus = (match, fallbackStatus = "pending") => {
    if (match?.is_correct === true) return "win";
    if (match?.is_correct === false) return "lose";
    if (fallbackStatus === "win" || fallbackStatus === "lose" || fallbackStatus === "draw") return fallbackStatus;
    return "pending";
  };
  var calcStreakSummary = (settledInvestments) => {
    const sorted = [...settledInvestments].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    let maxWin = 0;
    let maxLose = 0;
    let currentType = "none";
    let currentLength = 0;
    let runType = "none";
    let runLength = 0;
    sorted.forEach((item) => {
      const type = item.status === "win" ? "win" : item.status === "lose" ? "lose" : "none";
      if (type === "none") {
        runType = "none";
        runLength = 0;
        return;
      }
      if (runType === type) {
        runLength += 1;
      } else {
        runType = type;
        runLength = 1;
      }
      if (type === "win") maxWin = Math.max(maxWin, runLength);
      if (type === "lose") maxLose = Math.max(maxLose, runLength);
    });
    for (let i = sorted.length - 1; i >= 0; i -= 1) {
      const type = sorted[i].status === "win" ? "win" : sorted[i].status === "lose" ? "lose" : "none";
      if (type === "none") {
        if (currentType === "none") continue;
        break;
      }
      if (currentType === "none") {
        currentType = type;
        currentLength = 1;
      } else if (currentType === type) {
        currentLength += 1;
      } else {
        break;
      }
    }
    return {
      maxWin,
      maxLose,
      currentType,
      currentLength
    };
  };
  var calcMomentumSummary = (settledInvestments) => {
    const sorted = [...settledInvestments].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    if (sorted.length === 0) {
      return {
        score: 0,
        direction: "flat",
        strength: "mild",
        recentSamples: 0,
        baseSamples: 0,
        recentRoi: 0,
        baseRoi: 0,
        roiDelta: 0,
        recentHitRate: 0,
        baseHitRate: 0,
        hitRateDelta: 0
      };
    }
    const calcWindow = (items) => {
      const samples = items.length;
      if (samples === 0) {
        return { samples: 0, roi: 0, hitRate: 0 };
      }
      const inputs = items.reduce((sum, item) => sum + Math.max(0, toNumber3(item.inputs)), 0);
      const profit = items.reduce((sum, item) => sum + toNumber3(item.profit), 0);
      const wins = items.filter((item) => item.status === "win").length;
      return {
        samples,
        roi: calcRoi(profit, inputs),
        hitRate: wins / samples * 100
      };
    };
    const recentSize = Math.max(2, Math.min(6, Math.ceil(sorted.length * 0.4)));
    const recentWindow = sorted.slice(-recentSize);
    const historyBeforeRecent = sorted.slice(0, Math.max(0, sorted.length - recentSize));
    const baselineWindow = historyBeforeRecent.slice(-Math.max(2, Math.min(10, historyBeforeRecent.length)));
    const recent = calcWindow(recentWindow);
    const baseline = calcWindow(baselineWindow.length > 0 ? baselineWindow : sorted.slice(0, Math.max(1, sorted.length - 1)));
    const roiDelta = recent.roi - baseline.roi;
    const hitRateDelta = recent.hitRate - baseline.hitRate;
    const score = clamp3(roiDelta / 12 + hitRateDelta / 20, -2, 2);
    const absScore = Math.abs(score);
    const direction = score > 0.35 ? "up" : score < -0.35 ? "down" : "flat";
    const strength = absScore >= 1.1 ? "strong" : absScore >= 0.6 ? "medium" : "mild";
    return {
      score: Number(score.toFixed(2)),
      direction,
      strength,
      recentSamples: recent.samples,
      baseSamples: baseline.samples,
      recentRoi: Number(recent.roi.toFixed(2)),
      baseRoi: Number(baseline.roi.toFixed(2)),
      roiDelta: Number(roiDelta.toFixed(2)),
      recentHitRate: Number(recent.hitRate.toFixed(1)),
      baseHitRate: Number(baseline.hitRate.toFixed(1)),
      hitRateDelta: Number(hitRateDelta.toFixed(1))
    };
  };
  var calcModeBreakdown = (investments) => {
    const map = /* @__PURE__ */ new Map();
    MODE_KEYS.forEach((mode) => {
      map.set(mode, { mode, samples: 0, inputs: 0, profit: 0 });
    });
    investments.forEach((item) => {
      splitInvestmentToMatches(item).forEach((match) => {
        const mode = normalizeMode(match.mode);
        const canonicalMode = MODE_KEYS.includes(mode) ? mode : "常规";
        const row = map.get(canonicalMode);
        row.samples += 1;
        row.inputs += match.allocated_input;
        row.profit += match.allocated_profit;
      });
    });
    return [...map.values()].map((row) => ({
      ...row,
      roi: calcRoi(row.profit, row.inputs)
    }));
  };
  var KELLY_DIVISOR_CANDIDATES = [2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10];
  var getDominantModeFromInvestment = (investment) => {
    const matches = Array.isArray(investment?.matches) ? investment.matches : [];
    if (matches.length === 0) return "常规";
    const counts = /* @__PURE__ */ new Map();
    matches.forEach((match) => {
      const mode = MODE_KEYS.includes(normalizeMode(match.mode)) ? normalizeMode(match.mode) : "常规";
      counts.set(mode, (counts.get(mode) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "常规";
  };
  var estimateInvestmentExpected = (investment) => {
    const matches = Array.isArray(investment?.matches) ? investment.matches : [];
    if (matches.length !== 1 || !Array.isArray(matches[0].entries) || matches[0].entries.length !== 1) return NaN;
    const expected = toNumber3(investment?.expected_rating, NaN);
    return Number.isFinite(expected) && expected >= 0 && expected <= 1 ? expected : NaN;
  };
  var estimateInvestmentOdds = (investment) => {
    const combined = toNumber3(investment?.combined_odds, NaN);
    if (Number.isFinite(combined) && combined > 1) return combined;
    const matches = Array.isArray(investment?.matches) ? investment.matches : [];
    const odds = matches.map((match) => toNumber3(match.odds, NaN)).filter((value) => Number.isFinite(value) && value > 1);
    if (odds.length === 0 || odds.length !== matches.length) return NaN;
    const product = odds.reduce((result, value) => result * value, 1);
    return Number(product.toFixed(2));
  };
  var getForecastStates = (investment) => {
    const snapshot = investment?.forecast_snapshot;
    if (snapshot?.schema_version !== 1 || snapshot?.model_status === "approximate") return null;
    const states = snapshot.states;
    if (!Array.isArray(states) || states.length === 0) return null;
    if (states.some((s) => !s || typeof s !== "object" || !Number.isFinite(s.probability) || s.probability < 0 || s.probability > 1 || !Number.isFinite(s.gross) || s.gross < 0 || !Number.isFinite(s.net) || Math.abs(s.net - (s.gross - 1)) > 1e-7)) return null;
    if (Math.abs(states.reduce((sum, s) => sum + s.probability, 0) - 1) > 1e-6) return null;
    return states;
  };
  var toKellySimulationRowsFromInvestments = (investments) => investments.map((item) => {
    const inputs = Math.max(0, toNumber3(item.inputs, 0));
    if (inputs <= 0) return null;
    const profit = toNumber3(item.profit, NaN);
    if (!Number.isFinite(profit)) return null;
    const states = getForecastStates(item);
    if (item.forecast_snapshot && !states) return null;
    const expected = states ? states.reduce((sum, s) => sum + (s.gross > 0 ? s.probability : 0), 0) : estimateInvestmentExpected(item);
    const odds = states ? Math.max(...states.map((s) => s.gross)) : estimateInvestmentOdds(item);
    if (!Number.isFinite(expected) || !Number.isFinite(odds) || odds <= 1) return null;
    const availability = resolveOutcomeAvailability(
      item.outcome_available_at || item.settled_at,
      item.created_at
    );
    return {
      createdAt: item.created_at,
      outcome_available_at: availability.at,
      outcome_availability_basis: availability.basis,
      eventKeys: (item.matches || []).map((m) => matchEventKey(m, item.id)).filter(Boolean),
      expected,
      odds,
      inputs,
      profit,
      states
    };
  }).filter(Boolean);
  var calcKellyStake = (expected, odds, divisor, config) => {
    const kelly = (expected * odds - 1) / (odds - 1);
    if (!Number.isFinite(kelly) || kelly <= 0) return 0;
    const base = toNumber3(config.initialCapital, 0) * (kelly / Math.max(1, divisor));
    const riskCap = toNumber3(config.initialCapital, 0) * toNumber3(config.riskCapRatio, 0);
    return Math.max(0, Math.min(riskCap, base));
  };
  var calcKellyRowStake = (row, divisor, config) => {
    if (!row.states) return calcKellyStake(row.expected, row.odds, divisor, config);
    const fraction = solveKellyFractionByAtomicDistribution(row.states);
    const capital = Math.max(0, toNumber3(config.initialCapital, 0));
    return Math.max(0, Math.min(
      capital * Math.max(0, toNumber3(config.riskCapRatio, 0)),
      capital * fraction / Math.max(1, divisor)
    ));
  };
  var resolveMonteCarloRuns = (sampleCount, targetRuns = MONTE_CARLO_TARGET_RUNS) => {
    const n = Math.max(1, Number.parseInt(sampleCount, 10) || 1);
    const budgetCap = Math.floor(MONTE_CARLO_OP_BUDGET / n);
    const hardFloor = 4e3;
    if (budgetCap >= MONTE_CARLO_MIN_RUNS) {
      return Math.max(MONTE_CARLO_MIN_RUNS, Math.min(targetRuns, budgetCap));
    }
    return Math.max(hardFloor, Math.min(targetRuns, Math.max(hardFloor, budgetCap)));
  };
  var createSeededRng = (seedInput = 1) => {
    let seed = Number(seedInput) >>> 0 || 1;
    return () => {
      seed = seed + 1831565813 >>> 0;
      let t = seed;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  var buildMonteCarloSeed = (rows, salt = 0) => {
    let hash = (2166136261 ^ salt >>> 0) >>> 0;
    const limit = Math.min(rows.length, 96);
    for (let i = 0; i < limit; i += 1) {
      const row = rows[i] || {};
      const expected = Math.round(clamp3(toNumber3(row.expected, toNumber3(row.conf, 0.5)), 0, 1) * 1e3);
      const odds = Math.round(Math.max(1, toNumber3(row.odds, 1)) * 100);
      const unitReturn = Math.round(toNumber3(row.unitReturn, toNumber3(row.profit, 0)) * 100);
      hash ^= expected + 31 * odds + 17 * unitReturn + i;
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    hash ^= rows.length;
    hash = Math.imul(hash, 16777619) >>> 0;
    return hash >>> 0;
  };
  var runKellyBootstrapMonteCarlo = (simRowsInput, config, requestedRuns = MONTE_CARLO_TARGET_RUNS, seedSalt = 0) => {
    const simRows = Array.isArray(simRowsInput) ? simRowsInput.filter(Boolean) : [];
    if (simRows.length === 0) {
      return {
        runs: 0,
        samples: 0,
        totalInvest: 0,
        totalProfit: 0,
        roi: 0,
        hitRate: 0,
        maxDrawdown: 0,
        sharpe: 0
      };
    }
    const runs = resolveMonteCarloRuns(simRows.length, requestedRuns);
    const initialCapital = toNumber3(config.initialCapital, 0);
    const rng = createSeededRng(buildMonteCarloSeed(simRows, seedSalt));
    const sampleSize = simRows.length;
    const stakes = new Array(sampleSize);
    const unitReturns = new Array(sampleSize);
    for (let i = 0; i < sampleSize; i += 1) {
      stakes[i] = Math.max(0, toNumber3(simRows[i].stake, 0));
      unitReturns[i] = toNumber3(simRows[i].unitReturn, 0);
    }
    let totalInvestSum = 0;
    let totalProfitSum = 0;
    let roiSum = 0;
    let hitRateSum = 0;
    let maxDrawdownSum = 0;
    let sharpeSum = 0;
    let samplesSum = 0;
    for (let run = 0; run < runs; run += 1) {
      let balance = initialCapital;
      let peak = balance;
      let maxDrawdown = 0;
      let totalInvest = 0;
      let totalProfit = 0;
      let wins = 0;
      let samples = 0;
      let meanReturn = 0;
      let m2 = 0;
      for (let step = 0; step < sampleSize; step += 1) {
        const idx = Math.min(sampleSize - 1, Math.floor(rng() * sampleSize));
        const stake = stakes[idx];
        if (stake <= 0) continue;
        const unitReturn = unitReturns[idx];
        const simProfit = stake * unitReturn;
        totalInvest += stake;
        totalProfit += simProfit;
        samples += 1;
        if (simProfit > 0) wins += 1;
        const delta = unitReturn - meanReturn;
        meanReturn += delta / samples;
        m2 += delta * (unitReturn - meanReturn);
        balance += simProfit;
        if (balance > peak) peak = balance;
        const drawdown = peak > 0 ? (peak - balance) / peak * 100 : 0;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      }
      const roi = calcRoi(totalProfit, totalInvest);
      const hitRate = samples > 0 ? wins / samples * 100 : 0;
      const volatility = samples > 1 ? Math.sqrt(Math.max(m2 / samples, 0)) : 0;
      const sharpe = volatility > 0 ? meanReturn / volatility : meanReturn > 0 ? 1 : 0;
      totalInvestSum += totalInvest;
      totalProfitSum += totalProfit;
      roiSum += roi;
      hitRateSum += hitRate;
      maxDrawdownSum += maxDrawdown;
      sharpeSum += sharpe;
      samplesSum += samples;
    }
    return {
      runs,
      samples: runs > 0 ? Math.round(samplesSum / runs) : 0,
      totalInvest: runs > 0 ? totalInvestSum / runs : 0,
      totalProfit: runs > 0 ? totalProfitSum / runs : 0,
      roi: runs > 0 ? roiSum / runs : 0,
      hitRate: runs > 0 ? hitRateSum / runs : 0,
      maxDrawdown: runs > 0 ? maxDrawdownSum / runs : 0,
      sharpe: runs > 0 ? sharpeSum / runs : 0
    };
  };
  var simulateKellyDivisorFromRows = (rows, divisor, config) => {
    const simRows = [];
    rows.forEach((row) => {
      const inputs = Math.max(0, toNumber3(row.inputs, 0));
      const profit = toNumber3(row.profit, 0);
      if (inputs <= 0) return;
      const expected = toNumber3(row.expected, NaN);
      const odds = toNumber3(row.odds, NaN);
      if (!Number.isFinite(expected) || !Number.isFinite(odds) || odds <= 1) return;
      const stake = Math.round(calcKellyRowStake(row, divisor, config));
      if (stake <= 0) return;
      const profitRatio = Math.max(-1, profit / inputs);
      simRows.push({
        expected,
        odds,
        stake,
        unitReturn: profitRatio
      });
    });
    const mc = runKellyBootstrapMonteCarlo(simRows, config, MONTE_CARLO_TARGET_RUNS, Math.round(divisor * 1e3));
    const samplePenalty = mc.samples > 0 ? clamp3(12 / Math.max(1, mc.samples), 0, 12) : 12;
    const score = mc.roi - mc.maxDrawdown * 0.72 + mc.sharpe * 8 - samplePenalty;
    return {
      divisor,
      runs: mc.runs,
      samples: mc.samples,
      totalInvest: mc.totalInvest,
      totalProfit: mc.totalProfit,
      roi: mc.roi,
      hitRate: mc.hitRate,
      maxDrawdown: mc.maxDrawdown,
      sharpe: mc.sharpe,
      score: Number(score.toFixed(3))
    };
  };
  var getRowTemporalTs = (row) => {
    const raw = row?.createdAt ?? row?.created_at ?? row?.date;
    if (raw === null || raw === void 0 || typeof raw === "string" && !raw.trim()) return Number.NaN;
    const ts = new Date(raw).getTime();
    return Number.isFinite(ts) ? ts : Number.NaN;
  };
  var buildPrequentialWalkForwardWindows = (rows, {
    minRows = 24,
    minTrain = PREQUENTIAL_MIN_TRAIN_MATCHES,
    minTest = PREQUENTIAL_MIN_TEST_MATCHES,
    step = PREQUENTIAL_STEP_MATCHES,
    initialTrain = null
  } = {}) => {
    if (!Array.isArray(rows) || rows.length < Math.max(minRows, minTrain + minTest)) return [];
    const ordered = rows.filter((row) => Number.isFinite(getRowTemporalTs(row))).sort((a, b) => getRowTemporalTs(a) - getRowTemporalTs(b));
    if (ordered.length < Math.max(minRows, minTrain + minTest, Math.floor(rows.length * 0.6))) return [];
    const stride = Math.max(1, Number.parseInt(step, 10) || PREQUENTIAL_STEP_MATCHES);
    const testSize = Math.max(minTest, stride);
    const startTrain = Math.max(
      minTrain,
      Number.isFinite(initialTrain) ? Number(initialTrain) : Math.max(minTrain, stride * 2)
    );
    const windows = [];
    for (let split = startTrain; split + minTest <= ordered.length; split += testSize) {
      const testRows = ordered.slice(split, Math.min(ordered.length, split + testSize));
      const cutoff = getRowTemporalTs(testRows[0]);
      const keys = (row) => row.eventKeys || (row.eventKey ? [row.eventKey] : []);
      const testEvents = new Set(testRows.flatMap(keys));
      const trainRows = ordered.slice(0, split).filter((row) => getRowTemporalTs(row) < cutoff && validTime(row.outcome_available_at) < cutoff && keys(row).length > 0 && !keys(row).some((key) => testEvents.has(key)));
      if (trainRows.length < minTrain || testRows.length < minTest) continue;
      const eligibleTest = testRows.filter((row) => keys(row).length > 0 && Number.isFinite(validTime(row.outcome_available_at)));
      if (eligibleTest.length < minTest) continue;
      const derivedAvailabilityRows = [...trainRows, ...eligibleTest].filter((row) => row.outcome_availability_basis === OUTCOME_AVAILABILITY_BASIS.derived).length;
      windows.push({
        trainRows,
        testRows: eligibleTest,
        cutoff: new Date(cutoff).toISOString(),
        derivedAvailabilityRows,
        timeBasis: derivedAvailabilityRows > 0 ? WINDOW_TIME_BASIS.derivedAvailability : WINDOW_TIME_BASIS.recordedOnly
      });
    }
    return windows;
  };
  var buildKellyWalkForwardWindows = (rows, options = {}) => buildPrequentialWalkForwardWindows(rows, {
    minRows: 24,
    minTrain: 16,
    minTest: PREQUENTIAL_MIN_TEST_MATCHES,
    step: PREQUENTIAL_STEP_MATCHES,
    ...options
  });
  var simulateKellyDivisorDeterministic = (rows, divisor, config) => {
    if (!Array.isArray(rows) || rows.length === 0) {
      return {
        runs: 1,
        samples: 0,
        totalInvest: 0,
        totalProfit: 0,
        roi: 0,
        hitRate: 0,
        maxDrawdown: 0,
        sharpe: 0
      };
    }
    const ordered = [...rows].sort(
      (a, b) => new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime()
    );
    const initialCapital = toNumber3(config.initialCapital, 0);
    let balance = initialCapital;
    let peak = balance;
    let maxDrawdown = 0;
    let totalInvest = 0;
    let totalProfit = 0;
    let wins = 0;
    let samples = 0;
    let meanReturn = 0;
    let m2 = 0;
    ordered.forEach((row) => {
      const inputs = Math.max(0, toNumber3(row.inputs, 0));
      const profit = toNumber3(row.profit, 0);
      if (inputs <= 0) return;
      const expected = toNumber3(row.expected, NaN);
      const odds = toNumber3(row.odds, NaN);
      if (!Number.isFinite(expected) || !Number.isFinite(odds) || odds <= 1) return;
      const stake = Math.round(calcKellyRowStake(row, divisor, config));
      if (stake <= 0) return;
      const unitReturn = Math.max(-1, profit / inputs);
      const simProfit = stake * unitReturn;
      totalInvest += stake;
      totalProfit += simProfit;
      samples += 1;
      if (simProfit > 0) wins += 1;
      const delta = unitReturn - meanReturn;
      meanReturn += delta / samples;
      m2 += delta * (unitReturn - meanReturn);
      balance += simProfit;
      if (balance > peak) peak = balance;
      const drawdown = peak > 0 ? (peak - balance) / peak * 100 : 0;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    const roi = calcRoi(totalProfit, totalInvest);
    const hitRate = samples > 0 ? wins / samples * 100 : 0;
    const volatility = samples > 1 ? Math.sqrt(Math.max(m2 / samples, 0)) : 0;
    const sharpe = volatility > 0 ? meanReturn / volatility : meanReturn > 0 ? 1 : 0;
    return {
      runs: 1,
      samples,
      totalInvest,
      totalProfit,
      roi,
      hitRate,
      maxDrawdown,
      sharpe
    };
  };
  var evaluateKellyDivisorWalkForward = (rows, divisor, config) => {
    const windows = buildKellyWalkForwardWindows(rows);
    if (windows.length === 0) return null;
    let totalWeight = 0;
    let samples = 0;
    let totalInvest = 0;
    let totalProfit = 0;
    let roiWeighted = 0;
    let hitRateWeighted = 0;
    let maxDrawdownWeighted = 0;
    let sharpeWeighted = 0;
    windows.forEach((window2) => {
      const sim = simulateKellyDivisorDeterministic(window2.testRows, divisor, config);
      if (sim.samples <= 0) return;
      const w = sim.samples;
      totalWeight += w;
      samples += sim.samples;
      totalInvest += sim.totalInvest;
      totalProfit += sim.totalProfit;
      roiWeighted += sim.roi * w;
      hitRateWeighted += sim.hitRate * w;
      maxDrawdownWeighted += sim.maxDrawdown * w;
      sharpeWeighted += sim.sharpe * w;
    });
    if (totalWeight <= 0) return null;
    const roi = roiWeighted / totalWeight;
    const hitRate = hitRateWeighted / totalWeight;
    const maxDrawdown = maxDrawdownWeighted / totalWeight;
    const sharpe = sharpeWeighted / totalWeight;
    const samplePenalty = clamp3(10 / Math.max(1, samples), 0, 8);
    const score = roi - maxDrawdown * 0.72 + sharpe * 8 - samplePenalty;
    return {
      runs: windows.length,
      walkForwardWindows: windows.length,
      samples,
      totalInvest,
      totalProfit,
      roi: Number(roi.toFixed(3)),
      hitRate: Number(hitRate.toFixed(3)),
      maxDrawdown: Number(maxDrawdown.toFixed(3)),
      sharpe: Number(sharpe.toFixed(4)),
      score: Number(score.toFixed(3)),
      evaluationMethod: "walk_forward",
      derivedAvailabilityRows: windows.reduce((sum, window2) => sum + window2.derivedAvailabilityRows, 0),
      timeBasis: windows.some((window2) => window2.timeBasis === WINDOW_TIME_BASIS.derivedAvailability) ? WINDOW_TIME_BASIS.derivedAvailability : WINDOW_TIME_BASIS.recordedOnly
    };
  };
  var pickClosestDivisor = (divisors, target, fallback) => {
    if (!Array.isArray(divisors) || divisors.length === 0) return fallback;
    return [...divisors].sort((a, b) => Math.abs(a - target) - Math.abs(b - target) || a - b)[0];
  };
  var pickKellyDivisor = (rows, config, fallbackDivisor = 4, divisors = KELLY_DIVISOR_CANDIDATES) => {
    const results = divisors.map((divisor) => {
      const wf = evaluateKellyDivisorWalkForward(rows, divisor, config);
      if (wf) {
        return {
          divisor,
          ...wf
        };
      }
      return {
        ...simulateKellyDivisorFromRows(rows, divisor, config),
        evaluationMethod: "bootstrap",
        walkForwardWindows: 0,
        derivedAvailabilityRows: 0,
        timeBasis: WINDOW_TIME_BASIS.recordedOnly
      };
    });
    const validRows = results.filter((row) => row.samples > 0);
    const safeFallback = pickClosestDivisor(divisors, fallbackDivisor, divisors[0]);
    if (validRows.length === 0) {
      return {
        rows: results,
        best: null,
        rawBest: null,
        reliability: 0,
        recommendedDivisor: safeFallback,
        sampleCount: 0,
        timeBasis: WINDOW_TIME_BASIS.recordedOnly,
        derivedAvailabilityRows: 0
      };
    }
    const rawBest = [...validRows].sort((a, b) => b.score - a.score || b.samples - a.samples || a.divisor - b.divisor)[0];
    const wfFactor = (rawBest.walkForwardWindows || 0) > 0 ? 1 : 0.82;
    const reliability = clamp3((rawBest.samples - 6) / 22, 0, 1) * wfFactor;
    const blendedDivisor = rawBest.divisor * reliability + safeFallback * (1 - reliability);
    const recommendedDivisor = pickClosestDivisor(divisors, blendedDivisor, rawBest.divisor);
    const best = validRows.find((row) => row.divisor === recommendedDivisor) || rawBest;
    return {
      rows: results,
      best,
      rawBest,
      reliability: Number(reliability.toFixed(3)),
      recommendedDivisor,
      sampleCount: best.samples,
      timeBasis: best.timeBasis || WINDOW_TIME_BASIS.recordedOnly,
      derivedAvailabilityRows: best.derivedAvailabilityRows || 0
    };
  };
  var getKellyDivisorBacktest = (divisors = KELLY_DIVISOR_CANDIDATES) => {
    const divisorsKey = Array.isArray(divisors) && divisors.length > 0 ? divisors.map((value) => Number(value)).join(",") : "default";
    const cacheKey = getRevisionCacheKey("kellyBacktest", divisorsKey);
    const cached = analyticsMemo.kellyBacktest.get(cacheKey);
    if (cached) return cached;
    const config = getSystemConfig2();
    const investments = getSettledInvestments(getActiveInvestments()).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const globalRowsSource = toKellySimulationRowsFromInvestments(investments, config);
    const globalPick = pickKellyDivisor(globalRowsSource, config, toNumber3(config.kellyDivisor, 4), divisors);
    const globalRows = globalPick.rows;
    const globalBest = globalPick.best ? {
      ...globalPick.best,
      reliability: globalPick.reliability,
      recommendedDivisor: globalPick.recommendedDivisor
    } : null;
    const modeMap = /* @__PURE__ */ new Map();
    investments.forEach((item) => {
      const mode = getDominantModeFromInvestment(item);
      if (!modeMap.has(mode)) modeMap.set(mode, []);
      modeMap.get(mode).push(item);
    });
    const modeRecommendations = MODE_KEYS.map((mode) => {
      const modeRows = modeMap.get(mode) || [];
      const sourceRows = toKellySimulationRowsFromInvestments(modeRows, config);
      const pick2 = pickKellyDivisor(
        sourceRows,
        config,
        globalPick.recommendedDivisor || toNumber3(config.kellyDivisor, 4),
        divisors
      );
      const best = pick2.best ? {
        ...pick2.best,
        reliability: pick2.reliability,
        recommendedDivisor: pick2.recommendedDivisor
      } : null;
      return {
        mode,
        best,
        rows: pick2.rows
      };
    });
    const snapshot = {
      divisors,
      inputSamples: investments.length,
      eligibleSamples: globalRowsSource.length,
      excludedSamples: investments.length - globalRowsSource.length,
      globalRows,
      globalBest,
      modeRecommendations
    };
    analyticsMemo.kellyBacktest.set(cacheKey, snapshot);
    return snapshot;
  };
  var DEMO_POOL_BALANCE = 1529;
  var getReservoirState = () => {
    const config = getSystemConfig2();
    const activeInvestments = getActiveInvestments();
    const settledAll = getSettledInvestments(activeInvestments);
    const injections = Array.isArray(config.capitalInjections) ? config.capitalInjections : [];
    const settlements = Array.isArray(config.poolSettlements) ? config.poolSettlements : [];
    const initialCapital = toNumber3(config.initialCapital, 0);
    const totalInjected = injections.reduce((sum, inj) => sum + toNumber3(inj.amount), 0);
    const originalCapital = initialCapital - totalInjected;
    const sortedSettlements = [...settlements].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const lastSettlement = sortedSettlements.length > 0 ? sortedSettlements[sortedSettlements.length - 1] : null;
    const cycleStartTime = lastSettlement ? new Date(lastSettlement.created_at).getTime() : -Infinity;
    const cycleInjected = injections.reduce(
      (sum, inj) => new Date(inj.created_at).getTime() > cycleStartTime ? sum + toNumber3(inj.amount) : sum,
      0
    );
    const cycleBaseCapital = (lastSettlement ? 0 : originalCapital) + cycleInjected;
    const cycleProfit = settledAll.reduce(
      (sum, inv) => new Date(inv.created_at).getTime() > cycleStartTime ? sum + toNumber3(inv.profit) : sum,
      0
    );
    const poolBalance = cycleBaseCapital + cycleProfit;
    const inFlightCommitment = activeInvestments.filter((item) => item.status === "pending" && !item.is_archived).reduce((sum, item) => sum + Math.max(0, toNumber3(item.inputs, 0)), 0);
    const availableCash = Math.max(0, poolBalance - inFlightCommitment);
    const displayPoolBalance = isPreviewMode() ? DEMO_POOL_BALANCE : Number(poolBalance.toFixed(2));
    const displayAvailableCash = isPreviewMode() ? DEMO_POOL_BALANCE : Number(availableCash.toFixed(2));
    return {
      poolBalance: displayPoolBalance,
      availableCash: displayAvailableCash,
      inFlightCommitment: isPreviewMode() ? 0 : Number(inFlightCommitment.toFixed(2)),
      cycleBaseCapital: Number(cycleBaseCapital.toFixed(2)),
      cycleProfit: Number(cycleProfit.toFixed(2)),
      cycleStartTime,
      hasSettlement: !!lastSettlement,
      lastSettlement
    };
  };
  var getDashboardSnapshot = (periodKey = "2w") => {
    const cacheKey = getRevisionCacheKey("dashboard", periodKey);
    const cached = analyticsMemo.dashboard.get(cacheKey);
    if (cached) return cached;
    const config = getSystemConfig2();
    const allInvestments = getActiveInvestments();
    const range = getPeriodRange(periodKey);
    const periodInvestments = allInvestments.filter((item) => inRange(item.created_at, range));
    const settledAll = getSettledInvestments(allInvestments);
    const settledPeriod = getSettledInvestments(periodInvestments);
    const settledPrevious = (() => {
      if (!range) return [];
      const previousRange = getPeriodRange(periodKey, 1);
      return getSettledInvestments(allInvestments.filter((item) => inRange(item.created_at, previousRange)));
    })();
    const totalInputsPeriod = settledPeriod.reduce((sum, item) => sum + Math.max(0, toNumber3(item.inputs)), 0);
    const totalProfitPeriod = settledPeriod.reduce((sum, item) => sum + toNumber3(item.profit), 0);
    const roiPeriod = calcRoi(totalProfitPeriod, totalInputsPeriod);
    const totalInputsPrev = settledPrevious.reduce((sum, item) => sum + Math.max(0, toNumber3(item.inputs)), 0);
    const totalProfitPrev = settledPrevious.reduce((sum, item) => sum + toNumber3(item.profit), 0);
    const roiPrev = calcRoi(totalProfitPrev, totalInputsPrev);
    const winsPeriod = settledPeriod.filter((item) => item.status === "win").length;
    const hitRatePeriod = settledPeriod.length > 0 ? winsPeriod / settledPeriod.length * 100 : 0;
    const winsPrev = settledPrevious.filter((item) => item.status === "win").length;
    const hitRatePrev = settledPrevious.length > 0 ? winsPrev / settledPrevious.length * 100 : 0;
    const ratingRowsPeriod = getRatingRowsFromInvestments(periodInvestments);
    const ratingRowsPrev = getRatingRowsFromInvestments(settledPrevious);
    const ratingFit = calcRatingFit(ratingRowsPeriod);
    const ratingFitPrev = calcRatingFit(ratingRowsPrev);
    const initialCapital = toNumber3(config.initialCapital, 0);
    const reservoir = getReservoirState();
    const poolBalance = reservoir.poolBalance;
    const conf04 = calcConf04Stats(settledPeriod);
    const confCalibration = buildConfCalibration(settledPeriod);
    const repBuckets = calcRepBuckets(settledPeriod);
    const balanceLedger = (() => {
      const injections = Array.isArray(config.capitalInjections) ? config.capitalInjections : [];
      const settlements = Array.isArray(config.poolSettlements) ? config.poolSettlements : [];
      const totalInjected = injections.reduce((sum, inj) => sum + toNumber3(inj.amount), 0);
      const originalCapital = initialCapital - totalInjected;
      const events = [];
      settledAll.forEach((inv) => {
        events.push({ time: new Date(inv.created_at).getTime(), priority: 0, kind: "investment", payload: inv });
      });
      settlements.forEach((stl) => {
        events.push({ time: new Date(stl.created_at).getTime(), priority: 1, kind: "settlement", payload: stl });
      });
      injections.forEach((inj) => {
        events.push({ time: new Date(inj.created_at).getTime(), priority: 2, kind: "injection", payload: inj });
      });
      events.sort((a, b) => a.time - b.time || a.priority - b.priority);
      const ledgerEntries = [];
      let runningBalance = originalCapital;
      events.forEach((event) => {
        const before = runningBalance;
        if (event.kind === "settlement") {
          const stl = event.payload;
          const realized = toNumber3(stl.realizedProfit);
          runningBalance = 0;
          ledgerEntries.push({
            id: stl.id,
            date: stl.created_at,
            dateLabel: formatDate(stl.created_at),
            match: stl.type === "stop_loss" ? "周期性结算止损" : "周期性结算止盈",
            before: Number(before.toFixed(2)),
            profit: Number(realized.toFixed(2)),
            after: 0,
            isInjection: false,
            isSettlement: true,
            settlementType: stl.type === "stop_loss" ? "stop_loss" : "take_profit"
          });
        } else if (event.kind === "injection") {
          const amount = toNumber3(event.payload.amount);
          const amountLabel = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
          runningBalance += amount;
          ledgerEntries.push({
            id: event.payload.id,
            date: event.payload.created_at,
            dateLabel: formatDate(event.payload.created_at),
            match: `注资新增 ${amountLabel} rmb`,
            before: Number(before.toFixed(2)),
            profit: Number(amount.toFixed(2)),
            after: Number(runningBalance.toFixed(2)),
            isInjection: true,
            isSettlement: false
          });
        } else {
          const inv = event.payload;
          const profit = toNumber3(inv.profit);
          runningBalance += profit;
          const firstMatch = inv.matches?.[0];
          ledgerEntries.push({
            id: inv.id,
            date: inv.created_at,
            dateLabel: formatDate(inv.created_at),
            match: Number(inv.parlay_size || inv.matches?.length || 1) > 1 ? `${firstMatch?.home_team || "-"} vs ${firstMatch?.away_team || "-"} 等${inv.parlay_size}场` : `${firstMatch?.home_team || "-"} vs ${firstMatch?.away_team || "-"}`,
            before: Number(before.toFixed(2)),
            profit: Number(profit.toFixed(2)),
            after: Number(runningBalance.toFixed(2)),
            isInjection: false,
            isSettlement: false
          });
        }
      });
      return ledgerEntries.reverse();
    })();
    const recent = periodInvestments.slice(0, 8).map((item) => {
      const firstMatch = item.matches?.[0];
      const label = Number(item.parlay_size || item.matches?.length || 1) > 1 ? `${firstMatch?.home_team || "-"} vs ${firstMatch?.away_team || "-"} 等${item.parlay_size}场` : `${firstMatch?.home_team || "-"} vs ${firstMatch?.away_team || "-"}`;
      return {
        id: item.id,
        match: label,
        entry: firstMatch?.entry_text || firstMatch?.entries?.map((entry) => entry.name).join(", ") || "-",
        status: item.status || "pending",
        amount: item.status === "pending" ? `${toNumber3(item.inputs)} rmb` : `${toNumber3(item.profit) >= 0 ? "+" : ""}${toNumber3(item.profit).toFixed(0)} rmb`
      };
    });
    const periodInvestmentRoiSeries = settledPeriod.map((item) => ({
      match: Number(item.parlay_size || item.matches?.length || 1) > 1 ? `${item.matches?.[0]?.home_team || "-"} vs ${item.matches?.[0]?.away_team || "-"} 等${item.parlay_size}场` : `${item.matches?.[0]?.home_team || "-"} vs ${item.matches?.[0]?.away_team || "-"}`,
      id: item.id,
      date: item.created_at,
      dateLabel: formatDate(item.created_at),
      roi: Number(calcRoi(toNumber3(item.profit), Math.max(0, toNumber3(item.inputs))).toFixed(2)),
      inputs: Math.max(0, toNumber3(item.inputs)),
      profit: toNumber3(item.profit)
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const periodMatchRows = settledPeriod.flatMap(
      (item) => splitInvestmentToMatches(item).map((match, idx) => {
        const conf = toNumber3(match.conf, NaN);
        const ajr = toNumber3(match.match_rating, NaN);
        const rep = toNumber3(match.match_rep, toNumber3(item.rep, NaN));
        const input = Math.max(0, toNumber3(match.allocated_input));
        const profit = toNumber3(match.allocated_profit);
        const status = getMatchOutcomeStatus(match, item.status);
        return {
          id: `${item.id}-m${idx + 1}`,
          investmentId: item.id,
          date: item.created_at,
          dateLabel: formatDate(item.created_at),
          homeTeam: match.home_team || "-",
          awayTeam: match.away_team || "-",
          match: `${match.home_team || "-"} vs ${match.away_team || "-"}`,
          entry: match.entry_text || (Array.isArray(match.entries) ? match.entries.map((entry) => entry.name).join(", ") : "-") || "-",
          conf,
          ajr,
          normalizedAjr: Number.isFinite(ajr) ? normalizeAjrForModel(ajr) : Number.NaN,
          rep,
          odds: toNumber3(match.odds, NaN),
          input,
          profit,
          roi: input > 0 ? calcRoi(profit, input) : 0,
          status,
          confBand: getConfBandLabel(conf)
        };
      })
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const repDetailBuckets = {
      low: { key: "low", label: "低 REP (<=0.4)", rows: [] },
      mid: { key: "mid", label: "中 REP (0.4~0.8)", rows: [] },
      high: { key: "high", label: "高 REP (>0.8)", rows: [] }
    };
    periodMatchRows.forEach((row) => {
      if (!Number.isFinite(row.rep)) return;
      if (row.rep <= 0.4) repDetailBuckets.low.rows.push(row);
      else if (row.rep <= 0.8) repDetailBuckets.mid.rows.push(row);
      else repDetailBuckets.high.rows.push(row);
    });
    const repDetail = Object.values(repDetailBuckets).map((bucket) => {
      const inputs = bucket.rows.reduce((sum, row) => sum + row.input, 0);
      const profit = bucket.rows.reduce((sum, row) => sum + row.profit, 0);
      const hitCount = bucket.rows.filter((row) => row.status === "win").length;
      return {
        key: bucket.key,
        label: bucket.label,
        samples: bucket.rows.length,
        hitRate: bucket.rows.length > 0 ? hitCount / bucket.rows.length * 100 : 0,
        roi: calcRoi(profit, inputs),
        rows: bucket.rows
      };
    });
    const confDetailMap = new Map(
      ["0.0-0.2", "0.2-0.4", "0.4-0.6", "0.6-0.7", "0.7-0.8", "0.8+"].map((label) => [
        label,
        {
          label,
          samples: 0,
          expectedSum: 0,
          actualSum: 0,
          inputs: 0,
          profit: 0,
          wins: 0,
          rows: []
        }
      ])
    );
    periodMatchRows.forEach((row) => {
      if (!Number.isFinite(row.conf)) return;
      const bucket = confDetailMap.get(row.confBand);
      if (!bucket) return;
      bucket.samples += 1;
      bucket.expectedSum += row.conf;
      if (Number.isFinite(row.ajr)) bucket.actualSum += row.normalizedAjr;
      bucket.inputs += row.input;
      bucket.profit += row.profit;
      if (row.status === "win") bucket.wins += 1;
      bucket.rows.push(row);
    });
    const confDetail = [...confDetailMap.values()].filter((row) => row.samples > 0).map((row) => ({
      label: row.label,
      samples: row.samples,
      expected: row.expectedSum / row.samples,
      actual: row.actualSum / row.samples,
      diff: row.actualSum / row.samples - row.expectedSum / row.samples,
      hitRate: row.wins / row.samples * 100,
      roi: calcRoi(row.profit, row.inputs),
      rows: row.rows
    }));
    const advantageMap = /* @__PURE__ */ new Map();
    periodMatchRows.forEach((row) => {
      const teams = [row.homeTeam, row.awayTeam];
      teams.forEach((team) => {
        if (!advantageMap.has(team)) {
          advantageMap.set(team, {
            team,
            samples: 0,
            inputs: 0,
            profit: 0,
            wins: 0
          });
        }
        const item = advantageMap.get(team);
        item.samples += 1;
        item.inputs += row.input / 2;
        item.profit += row.profit / 2;
        if (row.status === "win") item.wins += 1;
      });
    });
    const advantageRows = [...advantageMap.values()].filter((row) => row.samples > 0).map((row) => ({
      ...row,
      roi: calcRoi(row.profit, row.inputs),
      hitRate: row.wins / row.samples * 100
    }));
    const advantage = {
      top: advantageRows.filter((row) => row.samples >= 2).sort((a, b) => b.roi - a.roi || b.hitRate - a.hitRate).slice(0, 6),
      bottom: advantageRows.filter((row) => row.samples >= 2).sort((a, b) => a.roi - b.roi || a.hitRate - b.hitRate).slice(0, 6)
    };
    const streaks = calcStreakSummary(settledPeriod);
    const momentum = calcMomentumSummary(settledPeriod);
    const snapshot = {
      periodInvestments: periodInvestments.length,
      settledPeriod: settledPeriod.length,
      pendingPeriod: periodInvestments.length - settledPeriod.length,
      poolBalance: Number(poolBalance.toFixed(2)),
      cycleBaseCapital: reservoir.cycleBaseCapital,
      cycleProfit: reservoir.cycleProfit,
      hasSettlement: reservoir.hasSettlement,
      lastSettlement: reservoir.lastSettlement,
      roiPeriod: Number(roiPeriod.toFixed(2)),
      roiDelta: Number((roiPeriod - roiPrev).toFixed(2)),
      hitRatePeriod: Number(hitRatePeriod.toFixed(1)),
      hitRateDelta: Number((hitRatePeriod - hitRatePrev).toFixed(1)),
      ratingFit: Number(ratingFit.toFixed(2)),
      ratingFitDelta: Number((ratingFit - ratingFitPrev).toFixed(2)),
      conf04,
      confCalibration,
      repBuckets,
      balanceLedger,
      recent,
      periodMatchRows,
      repDetail,
      confDetail,
      advantage,
      streaks,
      momentum,
      timeline: buildBalanceSeries(settledAll, toNumber3(config.initialCapital, 0), periodKey),
      modeBreakdown: calcModeBreakdown(settledPeriod),
      periodInvestmentRoiSeries,
      ratingRows: ratingRowsPeriod.map((row) => ({
        ...row,
        dateLabel: formatDate(row.date),
        diff: Number((row.actual_rating - row.expected_rating).toFixed(2))
      }))
    };
    analyticsMemo.dashboard.set(cacheKey, snapshot);
    return snapshot;
  };
  var normalizeTeamName = (teamName, aliasMap) => {
    const key = normalize2(teamName);
    const resolved = aliasMap.get(key) || String(teamName || "").trim();
    if (normalize2(resolved) === "西汉姆") return "西汉姆联";
    if (normalize2(resolved) === "维拉") return "阿斯顿维拉";
    return resolved;
  };
  var buildAliasMap = (profiles) => {
    const map = /* @__PURE__ */ new Map();
    profiles.forEach((profile) => {
      const aliases = [profile.teamName, ...profile.abbreviations || []];
      aliases.forEach((alias) => map.set(normalize2(alias), profile.teamName));
    });
    return map;
  };
  var pickTeamAbbr = (teamName, profile) => {
    const dbMatch = lookupTeam(String(teamName || "").trim());
    if (dbMatch?.abbr) return dbMatch.abbr;
    const aliases = [profile?.abbreviations || [], profile?.teamName, teamName].flat().map((value) => String(value || "").trim()).filter(Boolean);
    const asciiAliases = aliases.filter((alias) => /^[\x20-\x7e]+$/.test(alias));
    const shortCode = asciiAliases.find((alias) => /^[a-z0-9]{2,5}$/i.test(alias));
    if (shortCode) return shortCode.toUpperCase();
    const asciiAlias = asciiAliases.find((alias) => /^[a-z0-9 .'-]{2,20}$/i.test(alias));
    if (asciiAlias) {
      const compact = asciiAlias.replace(/[^a-z0-9]/gi, "").toUpperCase();
      if (compact.length >= 2) return compact.slice(0, 5);
    }
    return String(teamName || "").trim();
  };
  var calcMedian = (values2, fallback = 0) => {
    const sorted = (Array.isArray(values2) ? values2 : []).map((value) => Number(value)).filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
    if (sorted.length === 0) return fallback;
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) return sorted[mid];
    return (sorted[mid - 1] + sorted[mid]) / 2;
  };
  var getTeamsSnapshot = (query = "", periodKey = "all") => {
    const profiles = getTeamProfiles2();
    const range = getPeriodRange(periodKey);
    const investments = getSettledInvestments(getActiveInvestments()).filter((item) => inRange(item.created_at, range));
    const aliasMap = buildAliasMap(profiles);
    const teamMap = /* @__PURE__ */ new Map();
    const ensureTeam = (teamName) => {
      if (!teamMap.has(teamName)) {
        const profile = findTeamProfile(teamName, profiles);
        teamMap.set(teamName, {
          name: teamName,
          abbr: pickTeamAbbr(teamName, profile),
          totalSamples: 0,
          totalInputs: 0,
          totalProfit: 0,
          repValues: [],
          ajrValues: [],
          ratingDiffValues: [],
          roiHistoryRaw: [],
          ratingHistoryRaw: []
        });
      }
      return teamMap.get(teamName);
    };
    profiles.forEach((profile) => {
      ensureTeam(normalizeTeamName(profile.teamName, aliasMap));
    });
    investments.forEach((investment) => {
      const splitMatches = splitInvestmentToMatches(investment);
      splitMatches.forEach((match) => {
        const teams2 = [normalizeTeamName(match.home_team, aliasMap), normalizeTeamName(match.away_team, aliasMap)];
        const conf = toNumber3(match.conf, NaN);
        const matchRating = toNumber3(match.match_rating, NaN);
        const rep = toNumber3(match.match_rep, NaN);
        teams2.forEach((teamName) => {
          const team = ensureTeam(teamName);
          team.totalSamples += 1;
          team.totalInputs += match.allocated_input;
          team.totalProfit += match.allocated_profit;
          if (Number.isFinite(rep)) team.repValues.push(rep);
          if (Number.isFinite(matchRating)) team.ajrValues.push(matchRating);
          if (Number.isFinite(conf) && Number.isFinite(matchRating)) {
            const diff = matchRating - conf;
            team.ratingDiffValues.push(diff);
            team.ratingHistoryRaw.push({ date: investment.created_at, value: diff });
          }
          team.roiHistoryRaw.push({
            date: investment.created_at,
            input: match.allocated_input,
            profit: match.allocated_profit
          });
        });
      });
    });
    const queryNormalized = normalize2(query);
    const teams = [...teamMap.values()].map((team) => {
      const roi = calcRoi(team.totalProfit, team.totalInputs);
      const avgRep = team.repValues.length > 0 ? team.repValues.reduce((sum, value) => sum + value, 0) / team.repValues.length : 0.5;
      const avgAjr = team.ajrValues.length > 0 ? team.ajrValues.reduce((sum, value) => sum + value, 0) / team.ajrValues.length : 0;
      const medianAjr = calcMedian(team.ajrValues, 0);
      const ratingDiff = team.ratingDiffValues.length > 0 ? team.ratingDiffValues.reduce((sum, value) => sum + value, 0) / team.ratingDiffValues.length : 0;
      const roiHistory = (() => {
        let inputCum = 0;
        let profitCum = 0;
        return team.roiHistoryRaw.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((point) => {
          inputCum += point.input;
          profitCum += point.profit;
          return {
            date: point.date,
            label: formatDate(point.date),
            value: calcRoi(profitCum, inputCum)
          };
        }).slice(-20);
      })();
      const ratingHistory = team.ratingHistoryRaw.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((point) => ({
        date: point.date,
        label: formatDate(point.date),
        value: point.value
      })).slice(-20);
      return {
        ...team,
        roi,
        avgRep,
        avgAjr,
        medianAjr,
        ratingDiff,
        roiHistory,
        ratingHistory
      };
    }).filter((team) => {
      if (!queryNormalized) return true;
      const target = `${team.name} ${team.abbr}`.toLowerCase();
      return target.includes(queryNormalized);
    }).sort((a, b) => b.totalSamples - a.totalSamples);
    return teams;
  };
  var getExpectedVsActualRows = (limit = 120) => {
    const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 120);
    const cacheKey = getRevisionCacheKey("expectedVsActual", safeLimit);
    const cached = analyticsMemo.expectedVsActual.get(cacheKey);
    if (cached) return cached;
    const investments = getSettledInvestments(getActiveInvestments());
    const rows = getRatingRowsFromInvestments(investments).map((row) => ({
      ...row,
      dateLabel: formatDate(row.date),
      diff: Number((row.actual_rating - row.expected_rating).toFixed(2))
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, safeLimit);
    analyticsMemo.expectedVsActual.set(cacheKey, rows);
    return rows;
  };
  var getConfBucket = (conf) => {
    if (conf >= 0.7) return "0.7-1.0";
    if (conf >= 0.4) return "0.4-0.7";
    return "0.0-0.4";
  };
  var getOddsBucket = (odds) => {
    if (odds >= 3) return "3.0+";
    if (odds >= 2) return "2.0-3.0";
    return "1.0-2.0";
  };
  var getKellyDivisorMatrix = () => {
    const cacheKey = getRevisionCacheKey("kellyMatrix");
    const cached = analyticsMemo.kellyMatrix.get(cacheKey);
    if (cached) return cached;
    const config = getSystemConfig2();
    const investments = getSettledInvestments(getActiveInvestments());
    const globalRowsSource = toKellySimulationRowsFromInvestments(investments, config);
    const globalPick = pickKellyDivisor(globalRowsSource, config, toNumber3(config.kellyDivisor, 4));
    const rows = /* @__PURE__ */ new Map();
    investments.forEach((investment) => {
      splitInvestmentToMatches(investment).forEach((match) => {
        const mode = normalizeMode(match.mode);
        const canonicalMode = MODE_KEYS.includes(mode) ? mode : "常规";
        const conf = toNumber3(match.conf, NaN);
        const odds = toNumber3(match.odds, NaN);
        if (!Number.isFinite(conf) || !Number.isFinite(odds)) return;
        const confBucket = getConfBucket(conf);
        const oddsBucket = getOddsBucket(odds);
        const key = `${canonicalMode}|${confBucket}|${oddsBucket}`;
        if (!rows.has(key)) {
          rows.set(key, {
            mode: canonicalMode,
            confBucket,
            oddsBucket,
            samples: 0,
            inputs: 0,
            profit: 0,
            hits: 0,
            rows: []
          });
        }
        const row = rows.get(key);
        row.samples += 1;
        row.inputs += match.allocated_input;
        row.profit += match.allocated_profit;
        if (match.is_correct === true) row.hits += 1;
        if (investment.matches?.length === 1) {
          row.rows.push(...toKellySimulationRowsFromInvestments([investment]));
        }
      });
    });
    const matrix = [...rows.values()].map((row) => {
      const roi = calcRoi(row.profit, row.inputs);
      const hitRate = row.samples > 0 ? row.hits / row.samples * 100 : 0;
      const pick2 = pickKellyDivisor(
        row.rows,
        config,
        globalPick.recommendedDivisor || toNumber3(config.kellyDivisor, 4)
      );
      return {
        mode: row.mode,
        confBucket: row.confBucket,
        oddsBucket: row.oddsBucket,
        samples: row.samples,
        kellyEligibleSamples: row.rows.length,
        inputs: row.inputs,
        profit: row.profit,
        roi,
        hitRate,
        kellyDivisor: pick2.recommendedDivisor,
        kellyReliability: pick2.reliability,
        timeBasis: pick2.timeBasis
      };
    }).sort((a, b) => b.samples - a.samples);
    matrix.timeBasis = globalPick.timeBasis;
    matrix.derivedAvailabilityRows = globalPick.derivedAvailabilityRows;
    analyticsMemo.kellyMatrix.set(cacheKey, matrix);
    return matrix;
  };
  var getModeKellyRecommendations = () => {
    const cacheKey = getRevisionCacheKey("modeKelly");
    const cached = analyticsMemo.modeKelly.get(cacheKey);
    if (cached) return cached;
    const config = getSystemConfig2();
    const investments = getSettledInvestments(getActiveInvestments());
    const globalRowsSource = toKellySimulationRowsFromInvestments(investments, config);
    const globalPick = pickKellyDivisor(globalRowsSource, config, toNumber3(config.kellyDivisor, 4));
    const grouped = /* @__PURE__ */ new Map();
    MODE_KEYS.forEach((mode) => {
      grouped.set(mode, []);
    });
    investments.forEach((item) => {
      const mode = getDominantModeFromInvestment(item);
      const key = grouped.has(mode) ? mode : "常规";
      grouped.get(key).push(item);
    });
    const recommendations = [...grouped.entries()].map(([mode, items]) => {
      const sourceRows = toKellySimulationRowsFromInvestments(items, config);
      const pick2 = pickKellyDivisor(
        sourceRows,
        config,
        globalPick.recommendedDivisor || toNumber3(config.kellyDivisor, 4)
      );
      const inputs = sourceRows.reduce((sum, row) => sum + row.inputs, 0);
      const profit = sourceRows.reduce((sum, row) => sum + row.profit, 0);
      const roi = calcRoi(profit, inputs);
      return {
        mode,
        samples: sourceRows.length,
        roi,
        kellyDivisor: pick2.recommendedDivisor,
        reliability: pick2.reliability,
        timeBasis: pick2.timeBasis
      };
    });
    recommendations.timeBasis = globalPick.timeBasis;
    recommendations.derivedAvailabilityRows = globalPick.derivedAvailabilityRows;
    analyticsMemo.modeKelly.set(cacheKey, recommendations);
    return recommendations;
  };
  var calcStdDev = (values2) => {
    if (!values2 || values2.length === 0) return 0;
    const mean = values2.reduce((sum, value) => sum + value, 0) / values2.length;
    const variance = values2.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values2.length;
    return Math.sqrt(variance);
  };
  var calcPearson = (xs, ys) => {
    if (!Array.isArray(xs) || !Array.isArray(ys) || xs.length !== ys.length || xs.length < 2) return 0;
    const n = xs.length;
    const meanX = xs.reduce((sum, value) => sum + value, 0) / n;
    const meanY = ys.reduce((sum, value) => sum + value, 0) / n;
    let numerator = 0;
    let varX = 0;
    let varY = 0;
    for (let i = 0; i < n; i += 1) {
      const dx = xs[i] - meanX;
      const dy = ys[i] - meanY;
      numerator += dx * dy;
      varX += dx * dx;
      varY += dy * dy;
    }
    const denominator = Math.sqrt(varX * varY);
    if (!Number.isFinite(denominator) || denominator === 0) return 0;
    return numerator / denominator;
  };
  var weightedLinearRegression = (xs, ys, weights = null) => {
    if (!Array.isArray(xs) || !Array.isArray(ys) || xs.length !== ys.length || xs.length < 2) {
      return { slope: 1, intercept: 0, r2: 0, rmse: 0, n: 0 };
    }
    const n = xs.length;
    const w = weights || Array(n).fill(1);
    const sumW = w.reduce((sum, wi) => sum + wi, 0);
    const meanX = w.reduce((sum, wi, i) => sum + wi * xs[i], 0) / sumW;
    const meanY = w.reduce((sum, wi, i) => sum + wi * ys[i], 0) / sumW;
    let covXY = 0;
    let varX = 0;
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - meanX;
      const dy = ys[i] - meanY;
      covXY += w[i] * dx * dy;
      varX += w[i] * dx * dx;
    }
    const slope = varX > 0 ? covXY / varX : 1;
    const intercept = meanY - slope * meanX;
    let ssTot = 0;
    let ssRes = 0;
    for (let i = 0; i < n; i++) {
      const predicted = intercept + slope * xs[i];
      const residual = ys[i] - predicted;
      ssTot += w[i] * (ys[i] - meanY) ** 2;
      ssRes += w[i] * residual ** 2;
    }
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
    const rmse = Math.sqrt(ssRes / sumW);
    return {
      slope: Number(slope.toFixed(4)),
      intercept: Number(intercept.toFixed(4)),
      r2: Number(clamp3(r2, 0, 1).toFixed(4)),
      rmse: Number(rmse.toFixed(4)),
      n
    };
  };
  var getRepDirectionWeight = (rep) => {
    if (!Number.isFinite(rep)) return 1;
    if (rep <= 0.4) return 1.15;
    if (rep <= 0.8) return 1;
    return 0.78;
  };
  var getConfRegressionCalibration = (matchRowsInput = null) => {
    const matchRows = Array.isArray(matchRowsInput) ? [...matchRowsInput].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : getSettledInvestments(getActiveInvestments()).flatMap(
      (investment) => splitInvestmentToMatches(investment).map((match) => ({
        investment,
        match,
        created_at: investment.created_at
      }))
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const sampleCount = matchRows.length;
    const n = Math.max(1, Math.floor(sampleCount / 50));
    const validPoints = [];
    matchRows.forEach((row, index) => {
      const conf = toNumber3(row.match.conf, Number.NaN);
      const actual = normalizeAjrForModel(row.match.match_rating, Number.NaN);
      if (!Number.isFinite(conf) || !Number.isFinite(actual) || conf <= 0) return;
      let recencyWeight = 1;
      if (index < 6 * n) recencyWeight = 1.4;
      else if (index < 11 * n) recencyWeight = 1.15;
      const repValue = toNumber3(row.match.match_rep, toNumber3(row.investment.rep, Number.NaN));
      const repWeight = getRepDirectionWeight(repValue);
      const weight2 = recencyWeight * repWeight;
      validPoints.push({
        x: conf,
        y: actual,
        weight: weight2,
        date: row.created_at,
        match: `${row.match.home_team || "-"} vs ${row.match.away_team || "-"}`,
        rep: repValue,
        recencyBand: index < 6 * n ? "recent" : index < 11 * n ? "mid" : "base"
      });
    });
    if (validPoints.length < 3) {
      return {
        regression: { slope: 1, intercept: 0, r2: 0, rmse: 0, n: 0 },
        scatterData: [],
        calibrate: (conf) => conf,
        calibrationMultiplier: 1,
        regressionReliability: 0
      };
    }
    const xs = validPoints.map((p) => p.x);
    const ys = validPoints.map((p) => p.y);
    const weights = validPoints.map((p) => p.weight);
    const regression = weightedLinearRegression(xs, ys, weights);
    const weightedSumX = validPoints.reduce((sum, p) => sum + p.x * p.weight, 0);
    const weightedSumY = validPoints.reduce((sum, p) => sum + p.y * p.weight, 0);
    const totalWeight = validPoints.reduce((sum, p) => sum + p.weight, 0);
    const avgX = weightedSumX / totalWeight;
    const avgY = weightedSumY / totalWeight;
    const calibrationMultiplier = avgX > 0 ? clamp3(avgY / avgX, 0.7, 1.3) : 1;
    const reliabilityBySamples = clamp3((validPoints.length - 8) / 52, 0, 1);
    const reliabilityByFit = clamp3((regression.r2 - 0.02) / 0.28, 0, 1);
    const regressionReliability = clamp3(reliabilityBySamples * 0.72 + reliabilityByFit * 0.28, 0, 1);
    const calibrate = (conf) => {
      if (!Number.isFinite(conf) || conf <= 0) return conf;
      const linearCalibrated = regression.intercept + regression.slope * conf;
      const multiplierCalibrated = conf * calibrationMultiplier;
      const blendedModel = linearCalibrated * 0.72 + multiplierCalibrated * 0.28;
      const stabilized = conf * (1 - regressionReliability) + blendedModel * regressionReliability;
      return clamp3(stabilized, 0.1, 0.95);
    };
    const scatterData = validPoints.map((p) => ({
      x: Number(p.x.toFixed(3)),
      y: Number(p.y.toFixed(3)),
      weight: Number(p.weight.toFixed(2)),
      date: formatDate(p.date),
      match: p.match,
      rep: Number.isFinite(p.rep) ? Number(p.rep.toFixed(2)) : null,
      recencyBand: p.recencyBand,
      residual: Number((p.y - (regression.intercept + regression.slope * p.x)).toFixed(3))
    }));
    return {
      regression,
      scatterData,
      calibrate,
      calibrationMultiplier: Number(calibrationMultiplier.toFixed(4)),
      regressionReliability: Number(regressionReliability.toFixed(4))
    };
  };
  var getRepDirectionBucket = (rep) => {
    if (!Number.isFinite(rep)) return "medium";
    if (rep <= 0.4) return "low";
    if (rep <= 0.8) return "medium";
    return "high";
  };
  var getRecencyBandByIndex = (index, n) => {
    if (index < 6 * n) return "recent";
    if (index < 11 * n) return "mid";
    return "base";
  };
  var buildTeamCalibrationModelFromMatchRows = (matchRows, teamProfiles, baseCalibrate, n) => {
    const teamStats = /* @__PURE__ */ new Map();
    const ensureTeam = (teamName) => {
      if (!teamStats.has(teamName)) {
        teamStats.set(teamName, {
          teamName,
          samples: 0,
          weight: 0,
          weightedResidual: 0,
          weightedResidualSq: 0
        });
      }
      return teamStats.get(teamName);
    };
    matchRows.forEach((row, index) => {
      const conf = toNumber3(row?.match?.conf, Number.NaN);
      const actual = normalizeAjrForModel(row?.match?.match_rating, Number.NaN);
      if (!Number.isFinite(conf) || !Number.isFinite(actual) || conf <= 0) return;
      const calibrated = clamp3(baseCalibrate(conf), 0.02, 0.98);
      const residual = actual - calibrated;
      let recencyWeight = 1;
      if (index < 6 * n) recencyWeight = 1.4;
      else if (index < 11 * n) recencyWeight = 1.15;
      const repValue = toNumber3(row?.match?.match_rep, toNumber3(row?.investment?.rep, Number.NaN));
      const repWeight = getRepDirectionWeight(repValue);
      const sampleWeight = recencyWeight * repWeight;
      const homeTeam = resolveTeamNameForCalibration(row?.match?.home_team, teamProfiles);
      const awayTeam = resolveTeamNameForCalibration(row?.match?.away_team, teamProfiles);
      const teams = [homeTeam, awayTeam].filter(Boolean);
      if (teams.length === 0) return;
      const teamWeight = sampleWeight / teams.length;
      teams.forEach((teamName) => {
        const bucket = ensureTeam(teamName);
        bucket.samples += 1 / teams.length;
        bucket.weight += teamWeight;
        bucket.weightedResidual += residual * teamWeight;
        bucket.weightedResidualSq += residual * residual * teamWeight;
      });
    });
    const teamRows = [...teamStats.values()].map((row) => {
      const meanResidual = row.weight > 0 ? row.weightedResidual / row.weight : 0;
      const variance = row.weight > 0 ? row.weightedResidualSq / row.weight - meanResidual * meanResidual : 0;
      const residualStd = Math.sqrt(Math.max(variance, 0));
      const sampleReliability = clamp3((row.weight - 2.5) / 24, 0, 1);
      const stability = clamp3(1 - residualStd / 0.34, 0, 1);
      const reliability = clamp3(sampleReliability * 0.72 + stability * 0.28, 0, 1);
      const shift = clamp3(meanResidual * reliability, -0.18, 0.18);
      return {
        teamName: row.teamName,
        samples: Number(row.samples.toFixed(1)),
        reliability: Number(reliability.toFixed(3)),
        shift: Number(shift.toFixed(4)),
        residualMean: Number(meanResidual.toFixed(4)),
        residualStd: Number(residualStd.toFixed(4))
      };
    }).filter((row) => row.samples > 0).sort((a, b) => b.reliability - a.reliability || b.samples - a.samples);
    const teamMap = new Map(teamRows.map((row) => [normalize2(row.teamName), row]));
    const defaultReliability = teamRows.length > 0 ? clamp3(teamRows.reduce((sum, row) => sum + row.reliability, 0) / teamRows.length * 0.6, 0.12, 0.35) : 0.2;
    const getMatchAdjustment = (homeTeam, awayTeam) => {
      const homeKey = normalize2(resolveTeamNameForCalibration(homeTeam, teamProfiles));
      const awayKey = normalize2(resolveTeamNameForCalibration(awayTeam, teamProfiles));
      const homeMeta = homeKey ? teamMap.get(homeKey) : null;
      const awayMeta = awayKey ? teamMap.get(awayKey) : null;
      const parts = [homeMeta, awayMeta].filter(Boolean);
      if (parts.length === 0) {
        return {
          shift: 0,
          reliability: defaultReliability
        };
      }
      const shift = parts.reduce((sum, item) => sum + item.shift, 0) / parts.length;
      const reliability = clamp3(parts.reduce((sum, item) => sum + item.reliability, 0) / parts.length, 0, 1);
      return {
        shift,
        reliability
      };
    };
    return {
      teams: teamRows.slice(0, 32),
      teamCount: teamRows.length,
      defaultReliability: Number(defaultReliability.toFixed(3)),
      getMatchAdjustment
    };
  };
  var summarizeBlendWalkForward = (windows) => {
    if (!Array.isArray(windows) || windows.length === 0) {
      return {
        marketLean: 0.26,
        blendReliability: 0,
        calibratedBrier: 0,
        marketBrier: 0,
        blendedBrier: 0,
        calibratedLogLoss: 0,
        marketLogLoss: 0,
        blendedLogLoss: 0,
        calibratedRoi: 0,
        marketRoi: 0,
        blendedRoi: 0
      };
    }
    const mean = (key) => windows.reduce((sum, row) => sum + toNumber3(row[key], 0), 0) / windows.length;
    const calibratedBrier = mean("calibratedBrier");
    const marketBrier = mean("marketBrier");
    const blendedBrier = mean("blendedBrier");
    const calibratedLogLoss = mean("calibratedLogLoss");
    const marketLogLoss = mean("marketLogLoss");
    const blendedLogLoss = mean("blendedLogLoss");
    const calibratedRoi = mean("calibratedRoi");
    const marketRoi = mean("marketRoi");
    const blendedRoi = mean("blendedRoi");
    const brierEdgeToMarket = calibratedBrier - marketBrier;
    const brierEdgeToBlend = calibratedBrier - blendedBrier;
    const marketLean = clamp3(
      0.24 + brierEdgeToMarket * 3.1 + brierEdgeToBlend * 2.2 - Math.max(0, blendedBrier - calibratedBrier) * 2.8,
      0.12,
      0.62
    );
    const blendReliability = clamp3((windows.length - 1) / 4, 0, 1);
    return {
      marketLean: Number(marketLean.toFixed(3)),
      blendReliability: Number(blendReliability.toFixed(3)),
      calibratedBrier: Number(calibratedBrier.toFixed(4)),
      marketBrier: Number(marketBrier.toFixed(4)),
      blendedBrier: Number(blendedBrier.toFixed(4)),
      calibratedLogLoss: Number(calibratedLogLoss.toFixed(4)),
      marketLogLoss: Number(marketLogLoss.toFixed(4)),
      blendedLogLoss: Number(blendedLogLoss.toFixed(4)),
      calibratedRoi: Number(calibratedRoi.toFixed(2)),
      marketRoi: Number(marketRoi.toFixed(2)),
      blendedRoi: Number(blendedRoi.toFixed(2))
    };
  };
  var evaluateBlendWalkForward = (rows, config, teamProfiles, includeStrategy = true) => {
    const windows = buildPrequentialWalkForwardWindows(rows, {
      minRows: 24,
      minTrain: 14,
      minTest: PREQUENTIAL_MIN_TEST_MATCHES,
      step: PREQUENTIAL_STEP_MATCHES
    });
    return windows.map((window2, idx) => {
      const { trainRows, testRows } = window2;
      const windowFit = getPredictionCalibrationContext({ investments: historyFromRows(trainRows), config, detail: "lite" });
      const { calibrateProbabilityForMatch: _anchor, ...windowFitNoAnchor } = windowFit;
      const predictCalibrated = (row) => predictMatchProbability(row.match, config, windowFitNoAnchor);
      const predictMarket = (row) => {
        const implied = toImpliedProbability(row.odds, 0.02, 0.98);
        return Number.isFinite(implied) ? implied : clamp3(row.conf, 0.02, 0.98);
      };
      const predictBlended = (row) => predictMatchProbability(row.match, config, windowFit);
      const divisor = Math.max(1, toNumber3(config.kellyDivisor, 4));
      const strategyCalibrated = includeStrategy ? simulateKellyStrategyByRows(testRows, predictCalibrated, config, divisor) : { roi: null };
      const strategyMarket = includeStrategy ? simulateKellyStrategyByRows(testRows, predictMarket, config, divisor) : { roi: null };
      const strategyBlended = includeStrategy ? simulateKellyStrategyByRows(testRows, predictBlended, config, divisor) : { roi: null };
      return {
        label: `B${idx + 1}`,
        trainSamples: trainRows.length,
        testSamples: testRows.length,
        calibratedBrier: Number(calcBrierScore(testRows, predictCalibrated).toFixed(4)),
        marketBrier: Number(calcBrierScore(testRows, predictMarket).toFixed(4)),
        blendedBrier: Number(calcBrierScore(testRows, predictBlended).toFixed(4)),
        calibratedLogLoss: Number(calcLogLoss(testRows, predictCalibrated).toFixed(4)),
        marketLogLoss: Number(calcLogLoss(testRows, predictMarket).toFixed(4)),
        blendedLogLoss: Number(calcLogLoss(testRows, predictBlended).toFixed(4)),
        calibratedRoi: strategyCalibrated.roi == null ? null : Number(strategyCalibrated.roi.toFixed(2)),
        marketRoi: strategyMarket.roi == null ? null : Number(strategyMarket.roi.toFixed(2)),
        blendedRoi: strategyBlended.roi == null ? null : Number(strategyBlended.roi.toFixed(2))
      };
    });
  };
  var buildConfOddsCalibrationLayer = (matchRowsInput = null) => {
    const fallback = {
      buckets: [],
      adjustForOddsBucket: (_conf, _odds) => ({ adjustedConf: _conf, bucketShift: 0, bucketKey: "unknown", reliability: 0 }),
      reliability: 0
    };
    const matchRows = Array.isArray(matchRowsInput) ? matchRowsInput : getSettledInvestments(getActiveInvestments()).flatMap(
      (investment) => splitInvestmentToMatches(investment).map((match) => ({
        investment,
        match,
        created_at: investment.created_at
      }))
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const points = [];
    matchRows.forEach((row, index) => {
      const conf = toNumber3(row.match?.conf, Number.NaN);
      const actual = normalizeAjrForModel(row.match?.match_rating, Number.NaN);
      const odds = toNumber3(row.match?.odds, Number.NaN);
      if (!Number.isFinite(conf) || !Number.isFinite(actual) || !Number.isFinite(odds) || conf <= 0 || odds <= 1) return;
      const n = Math.max(1, Math.floor(matchRows.length / 50));
      let recencyWeight = 1;
      if (index < 6 * n) recencyWeight = 1.35;
      else if (index < 11 * n) recencyWeight = 1.1;
      points.push({ conf, actual, odds, weight: recencyWeight });
    });
    if (points.length < 12) return fallback;
    const ODDS_BUCKETS = [
      { key: "low", label: "低赔 1.0-1.8", min: 1, max: 1.8 },
      { key: "medium", label: "中赔 1.8-2.5", min: 1.8, max: 2.5 },
      { key: "high", label: "高赔 2.5-3.5", min: 2.5, max: 3.5 },
      { key: "very_high", label: "超高赔 3.5+", min: 3.5, max: 100 }
    ];
    const bucketStats = ODDS_BUCKETS.map((bucket) => {
      const bucketPoints = points.filter((p) => p.odds >= bucket.min && p.odds < bucket.max);
      if (bucketPoints.length < 3) {
        return { ...bucket, samples: 0, shift: 0, reliability: 0, confBias: 0, meanConf: 0, meanActual: 0 };
      }
      let weightedResidual = 0;
      let weightedResidualSq = 0;
      let weightedConfSum = 0;
      let weightedActualSum = 0;
      let totalWeight = 0;
      bucketPoints.forEach((p) => {
        const residual = p.actual - p.conf;
        weightedResidual += residual * p.weight;
        weightedResidualSq += residual * residual * p.weight;
        weightedConfSum += p.conf * p.weight;
        weightedActualSum += p.actual * p.weight;
        totalWeight += p.weight;
      });
      const meanResidual = totalWeight > 0 ? weightedResidual / totalWeight : 0;
      const variance = totalWeight > 0 ? weightedResidualSq / totalWeight - meanResidual * meanResidual : 0;
      const residualStd = Math.sqrt(Math.max(variance, 0));
      const meanConf = totalWeight > 0 ? weightedConfSum / totalWeight : 0;
      const meanActual = totalWeight > 0 ? weightedActualSum / totalWeight : 0;
      const sampleReliability = clamp3((bucketPoints.length - 3) / 20, 0, 1);
      const stability = clamp3(1 - residualStd / 0.4, 0, 1);
      const reliability = clamp3(sampleReliability * 0.68 + stability * 0.32, 0, 1);
      const shift = clamp3(meanResidual * reliability, -0.2, 0.2);
      const confBias = meanConf > 0 ? (meanActual - meanConf) / meanConf : 0;
      return {
        ...bucket,
        samples: bucketPoints.length,
        shift: Number(shift.toFixed(4)),
        reliability: Number(reliability.toFixed(3)),
        confBias: Number(confBias.toFixed(3)),
        meanConf: Number(meanConf.toFixed(3)),
        meanActual: Number(meanActual.toFixed(3)),
        residualStd: Number(residualStd.toFixed(3))
      };
    });
    const overallReliability = clamp3(
      bucketStats.reduce((sum, b) => sum + b.reliability * b.samples, 0) / Math.max(1, bucketStats.reduce((sum, b) => sum + b.samples, 0)),
      0,
      1
    );
    const adjustForOddsBucket = (conf, odds) => {
      if (!Number.isFinite(conf) || !Number.isFinite(odds) || odds <= 1) {
        return { adjustedConf: conf, bucketShift: 0, bucketKey: "unknown", reliability: 0 };
      }
      const bucket = bucketStats.find((b) => odds >= b.min && odds < b.max) || bucketStats[bucketStats.length - 1];
      if (!bucket || bucket.reliability <= 0) {
        return { adjustedConf: conf, bucketShift: 0, bucketKey: bucket?.key || "unknown", reliability: 0 };
      }
      const adjustedConf = clamp3(conf + bucket.shift, 0.05, 0.95);
      return {
        adjustedConf,
        bucketShift: bucket.shift,
        bucketKey: bucket.key,
        reliability: bucket.reliability
      };
    };
    return {
      buckets: bucketStats,
      adjustForOddsBucket,
      reliability: Number(overallReliability.toFixed(3))
    };
  };
  var getPredictionCalibrationContext = (options = {}) => {
    const detail = options?.detail === "lite" ? "lite" : "full";
    const includeHeavy = detail === "full";
    const includeWeightSuggestions = options.includeWeightSuggestions !== false;
    const cacheKey = getRevisionCacheKey("calibrationContext", `${detail}:${includeWeightSuggestions}`);
    const isolated = Array.isArray(options.investments);
    const cached = !isolated && analyticsMemo.calibrationContext.get(cacheKey);
    if (cached) return cached;
    const config = options.config || getSystemConfig2();
    const teamProfiles = options.teamProfiles || (isolated ? [] : getTeamProfiles2());
    const settled = getSettledInvestments(isolated ? options.investments : getActiveInvestments());
    const matchRows = uniqueMatchRows(settled).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const sampleCount = matchRows.length;
    const n = Math.max(1, Math.floor(sampleCount / 50));
    const bands = {
      recent: { key: "recent", label: `最近 ${6 * n} 场`, weight: 1.4, samples: 0 },
      mid: { key: "mid", label: `${6 * n + 1}~${11 * n} 场`, weight: 1.15, samples: 0 },
      base: { key: "base", label: `${11 * n + 1}+ 场`, weight: 1, samples: 0 }
    };
    const repBuckets = {
      low: { key: "low", label: "REP ≤ 0.4", weight: 1.15, samples: 0 },
      medium: { key: "medium", label: "0.4 < REP ≤ 0.8", weight: 1, samples: 0 },
      high: { key: "high", label: "REP > 0.8", weight: 0.78, samples: 0 }
    };
    let confWeightedSum = 0;
    let confWeightTotal = 0;
    let fseWeightedSum = 0;
    let fseWeightTotal = 0;
    matchRows.forEach((row, index) => {
      const bandKey = getRecencyBandByIndex(index, n);
      const band = bands[bandKey];
      band.samples += 1;
      const repValue = toNumber3(row.match.match_rep, toNumber3(row.investment.rep, Number.NaN));
      const repKey = getRepDirectionBucket(repValue);
      const repBucket = repBuckets[repKey];
      repBucket.samples += 1;
      const sampleWeight = band.weight * repBucket.weight;
      const conf = toNumber3(row.match.conf, Number.NaN);
      const actual = normalizeAjrForModel(row.match.match_rating, Number.NaN);
      if (!Number.isFinite(conf) || !Number.isFinite(actual) || conf <= 0) return;
      const confRatio = clamp3(actual / conf, 0.6, 1.4);
      confWeightedSum += confRatio * sampleWeight;
      confWeightTotal += sampleWeight;
      const fseHome = toNumber3(row.match.fse_home, Number.NaN);
      const fseAway = toNumber3(row.match.fse_away, Number.NaN);
      if (!Number.isFinite(fseHome) || !Number.isFinite(fseAway)) return;
      const fseMatch = Math.sqrt(clamp3(fseHome, 0.05, 1) * clamp3(fseAway, 0.05, 1));
      const fseBaseline = 0.88 + fseMatch * 0.24;
      const fseRatio = clamp3(confRatio / fseBaseline, 0.6, 1.4);
      fseWeightedSum += fseRatio * sampleWeight;
      fseWeightTotal += sampleWeight;
    });
    const confMultiplier = confWeightTotal > 0 ? clamp3(confWeightedSum / confWeightTotal, 0.75, 1.25) : 1;
    const fseMultiplier = fseWeightTotal > 0 ? clamp3(fseWeightedSum / fseWeightTotal, 0.75, 1.25) : 1;
    const effectiveRecencyWeight = sampleCount > 0 ? (bands.recent.samples * bands.recent.weight + bands.mid.samples * bands.mid.weight + bands.base.samples * bands.base.weight) / sampleCount : 1;
    const regressionData = getConfRegressionCalibration(matchRows);
    const baseConfCalibrate = (conf) => {
      const cleanConf = clamp3(toNumber3(conf, Number.NaN), 0.02, 0.98);
      if (!Number.isFinite(cleanConf)) return 0.5;
      if (typeof regressionData.calibrate === "function") {
        return clamp3(regressionData.calibrate(cleanConf), 0.02, 0.98);
      }
      return clamp3(cleanConf * confMultiplier, 0.02, 0.98);
    };
    const teamCalibration = buildTeamCalibrationModelFromMatchRows(matchRows, teamProfiles, baseConfCalibrate, n);
    const binaryRows = getBinaryOutcomeRows(settled, teamProfiles);
    const blendWalkForward = includeHeavy ? evaluateBlendWalkForward(binaryRows, config, teamProfiles, !isolated) : [];
    const blendSummary = summarizeBlendWalkForward(blendWalkForward);
    const confOddsCalibration = buildConfOddsCalibrationLayer(matchRows);
    const learnedFactors = learnContextFactors(settled);
    const isotonicModel = buildIsotonicRegression(binaryRows);
    const walkForwardFeedback = includeHeavy ? computeWalkForwardFeedback(blendWalkForward, { config, rows: binaryRows, teamProfiles }) : {
      ready: false,
      adjustments: {},
      diagnostics: {},
      sampleCount: binaryRows.length
    };
    const rawOddsWeight = 0.12 + getWeightFactor(config.weightOdds, 0.06) * 0.95;
    const wfOddsWeightDelta = walkForwardFeedback.ready && Number.isFinite(walkForwardFeedback.adjustments?.oddsWeightDelta) ? walkForwardFeedback.adjustments.oddsWeightDelta : 0;
    const oddsWeightBase = clamp3(rawOddsWeight + wfOddsWeightDelta, 0.08, 0.55);
    const entryCorrelation = includeHeavy ? buildEntryCorrelationMatrix(settled) : {
      ready: false,
      avgCorrelation: 0,
      pairs: [],
      sampleCount: 0,
      getCorrelation: () => ({ rho: 0, samples: 0, reliability: 0 })
    };
    const comboHyperparams = includeHeavy && !isolated ? backtestComboHyperparams() : null;
    const adaptiveWeightSnapshot = includeHeavy && !isolated && includeWeightSuggestions ? computeAdaptiveWeightSuggestions() : {
      suggestions: [],
      sampleCount,
      minSamples: 0,
      ready: false,
      lastUpdateAt: null,
      updateCount: 0
    };
    const adaptiveWeightResult = {
      ...adaptiveWeightSnapshot,
      applied: false,
      reason: !includeWeightSuggestions ? "not_requested" : includeHeavy ? comboHyperparams?.ready ? "deferred_apply" : "combo_calibration_not_ready" : "lite_deferred"
    };
    const compositeCalibrate = (rawConf) => {
      const linearCal = baseConfCalibrate(rawConf);
      if (!isotonicModel.ready || isotonicModel.reliability < 0.2) return linearCal;
      const isoCal = isotonicModel.calibrate(rawConf);
      const isoWeight = clamp3(isotonicModel.reliability * 0.6, 0, 0.6);
      return clamp3(linearCal * (1 - isoWeight) + isoCal * isoWeight, 0.02, 0.98);
    };
    const calibrateProbabilityForMatch = (input = {}) => {
      const rawConf = toNumber3(input.conf ?? input.rawConf, Number.NaN);
      const baseProbability2 = toNumber3(input.baseProbability, Number.NaN);
      const odds = toNumber3(input.odds, Number.NaN);
      const homeTeam = input.homeTeam || input.home_team || "";
      const awayTeam = input.awayTeam || input.away_team || "";
      let probability = Number.isFinite(baseProbability2) ? clamp3(baseProbability2, 0.02, 0.98) : compositeCalibrate(rawConf);
      if (Number.isFinite(odds) && odds > 1 && confOddsCalibration.reliability > 0) {
        const bucketAdj = confOddsCalibration.adjustForOddsBucket(probability, odds);
        probability = clamp3(bucketAdj.adjustedConf, 0.02, 0.98);
      }
      const teamAdjustment = teamCalibration.getMatchAdjustment(homeTeam, awayTeam);
      probability = clamp3(probability + teamAdjustment.shift, 0.02, 0.98);
      if (Number.isFinite(odds) && odds > 1) {
        const impliedProbability = toImpliedProbability(odds, 0.02, 0.98);
        if (Number.isFinite(impliedProbability)) {
          const oddsAnchor = clamp3(
            oddsWeightBase * (0.78 + blendSummary.marketLean) + (1 - teamAdjustment.reliability) * 0.22,
            0.08,
            0.72
          );
          probability = clamp3(probability * (1 - oddsAnchor) + impliedProbability * oddsAnchor, 0.02, 0.98);
        }
      }
      return probability;
    };
    const context = {
      metadata: {
        pipeline_version: "2026-09-calibration-v2",
        parameters: Object.fromEntries(["weightMode", "weightTys", "weightFid", "weightFse", "weightOdds", "defaultOdds", "kellyDivisor"].map((key) => [key, config[key] ?? null])),
        stage: detail,
        data_revision: isolated ? null : analyticsMemo.revision,
        fitted_at: (/* @__PURE__ */ new Date()).toISOString(),
        training_samples: sampleCount,
        // 拟合后真正生效的标量（不只是顶层配置键），让快照能对照出当时的模型实际取值；
        // 完整曲线（回归系数、isotonic 节点）可由训练样本重建，此处记录其规模与可靠度。
        fitted: {
          confMultiplier: Number(confMultiplier.toFixed(4)),
          fseMultiplier: Number(fseMultiplier.toFixed(4)),
          oddsWeightBase: Number(oddsWeightBase.toFixed(4)),
          marketLean: Number(toNumber3(blendSummary.marketLean, 0).toFixed(4)),
          effectiveRecencyWeight: Number(effectiveRecencyWeight.toFixed(4)),
          isotonicReliability: Number(toNumber3(isotonicModel?.reliability, 0).toFixed(4)),
          isotonicNodes: Array.isArray(isotonicModel?.nodes) ? isotonicModel.nodes.length : 0,
          learnedFactorsReliability: Number(toNumber3(learnedFactors?.reliability, 0).toFixed(4))
        }
      },
      detail,
      sampleCount,
      n,
      multipliers: {
        conf: Number(confMultiplier.toFixed(3)),
        fse: Number(fseMultiplier.toFixed(3))
      },
      effectiveRecencyWeight: Number(effectiveRecencyWeight.toFixed(3)),
      bands: [bands.recent, bands.mid, bands.base],
      repBuckets: [repBuckets.low, repBuckets.medium, repBuckets.high],
      // 新增回归分析数据
      regression: regressionData.regression,
      regressionMultiplier: regressionData.calibrationMultiplier,
      regressionReliability: regressionData.regressionReliability,
      scatterData: regressionData.scatterData,
      calibrate: compositeCalibrate,
      teamCalibration: {
        teamCount: teamCalibration.teamCount,
        defaultReliability: teamCalibration.defaultReliability,
        topTeams: teamCalibration.teams
      },
      confOddsCalibration: {
        buckets: confOddsCalibration.buckets,
        reliability: confOddsCalibration.reliability
      },
      marketBlend: {
        oddsWeightBase: Number(oddsWeightBase.toFixed(3)),
        marketLean: blendSummary.marketLean,
        blendReliability: blendSummary.blendReliability,
        calibratedBrier: blendSummary.calibratedBrier,
        marketBrier: blendSummary.marketBrier,
        blendedBrier: blendSummary.blendedBrier,
        calibratedLogLoss: blendSummary.calibratedLogLoss,
        marketLogLoss: blendSummary.marketLogLoss,
        blendedLogLoss: blendSummary.blendedLogLoss,
        calibratedRoi: blendSummary.calibratedRoi,
        marketRoi: blendSummary.marketRoi,
        blendedRoi: blendSummary.blendedRoi,
        walkForward: blendWalkForward
      },
      calibrateProbabilityForMatch,
      // FIX #1: Learned factors from historical data
      learnedFactors: {
        mode: learnedFactors.mode,
        tys: learnedFactors.tys,
        fid: learnedFactors.fid,
        fse: learnedFactors.fse,
        totalSamples: learnedFactors.totalSamples,
        reliability: learnedFactors.reliability,
        globalHitRate: learnedFactors.globalHitRate
      },
      // FIX #2: Isotonic regression
      isotonicRegression: {
        ready: isotonicModel.ready,
        reliability: isotonicModel.reliability,
        brierImprovement: isotonicModel.brierImprovement || 0,
        evaluationBasis: "in_sample_fit_only",
        nodeCount: isotonicModel.nodes?.length || 0,
        sampleCount: isotonicModel.sampleCount
      },
      // FIX #3: Walk-forward feedback
      walkForwardFeedback: {
        ready: walkForwardFeedback.ready,
        adjustments: walkForwardFeedback.adjustments || {},
        diagnostics: walkForwardFeedback.diagnostics || {}
      },
      // FIX #4: Entry correlation
      entryCorrelation: {
        ready: entryCorrelation.ready,
        avgCorrelation: entryCorrelation.avgCorrelation,
        topPairs: (entryCorrelation.pairs || []).slice(0, 8),
        sampleCount: entryCorrelation.sampleCount,
        getCorrelation: entryCorrelation.getCorrelation
      },
      // FIX #6: Comprehensive combo hyperparameter calibration
      comboHyperparams,
      // FIX #7: Adaptive weight auto-apply result
      adaptiveWeightResult,
      // FIX #8: Per-match EJR diagnostics (was dead code — now wired in)
      ejrDiagnostics: isolated ? null : getPerMatchEjrSnapshot()
    };
    if (!isolated) analyticsMemo.calibrationContext.set(cacheKey, context);
    return context;
  };
  var toCalibrationMatchRows = (rows) => rows.map((row) => ({
    investment: {
      rep: row.rep,
      created_at: row.created_at
    },
    match: {
      ...row.match,
      conf: row.conf,
      match_rating: row.match?.match_rating ?? row.ajr,
      match_rep: row.rep,
      home_team: row.homeTeam || "",
      away_team: row.awayTeam || ""
    },
    created_at: row.created_at
  }));
  var getBinaryOutcomeRows = (investments = getActiveInvestments(), teamProfiles = getTeamProfiles2()) => {
    const settled = getSettledInvestments(investments);
    return uniqueMatchRows(settled).map((source) => {
      const { investment, match } = source;
      if (typeof match.is_correct !== "boolean") return null;
      const conf = toNumber3(match.conf, Number.NaN);
      const odds = toNumber3(match.odds, Number.NaN);
      if (!Number.isFinite(conf) || !Number.isFinite(odds) || conf <= 0 || odds <= 1) return null;
      return {
        ...source,
        created_at: investment.created_at,
        conf: clamp3(conf, 0.02, 0.98),
        actual: match.is_correct ? 1 : 0,
        odds,
        binaryPayout: !Array.isArray(match.entries) || match.entries.length <= 1,
        rep: toNumber3(match.match_rep, toNumber3(investment.rep, Number.NaN)),
        homeTeam: resolveTeamNameForCalibration(match.home_team, teamProfiles),
        awayTeam: resolveTeamNameForCalibration(match.away_team, teamProfiles)
      };
    }).filter(Boolean).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };
  var calcBrierScore = (rows, predictFn) => {
    if (!Array.isArray(rows) || rows.length === 0) return 0;
    const loss = rows.reduce((sum, row) => {
      const p = clamp3(toNumber3(predictFn(row), row.conf), 1e-3, 0.999);
      const y = row.actual;
      return sum + (p - y) ** 2;
    }, 0);
    return loss / rows.length;
  };
  var calcLogLoss = (rows, predictFn) => {
    if (!Array.isArray(rows) || rows.length === 0) return 0;
    const loss = rows.reduce((sum, row) => {
      const p = clamp3(toNumber3(predictFn(row), row.conf), 1e-3, 0.999);
      const y = row.actual;
      return sum - (y * Math.log(p) + (1 - y) * Math.log(1 - p));
    }, 0);
    return loss / rows.length;
  };
  var calcCalibrationMae = (rows, predictFn, bins = 8) => {
    if (!Array.isArray(rows) || rows.length === 0) return 0;
    const bucketMap = /* @__PURE__ */ new Map();
    rows.forEach((row) => {
      const p = clamp3(toNumber3(predictFn(row), row.conf), 1e-3, 0.999);
      const idx = Math.min(bins - 1, Math.max(0, Math.floor(p * bins)));
      if (!bucketMap.has(idx)) {
        bucketMap.set(idx, { count: 0, pSum: 0, ySum: 0 });
      }
      const bucket = bucketMap.get(idx);
      bucket.count += 1;
      bucket.pSum += p;
      bucket.ySum += row.actual;
    });
    const total = [...bucketMap.values()].reduce((sum, bucket) => sum + bucket.count, 0);
    if (total <= 0) return 0;
    return [...bucketMap.values()].reduce((sum, bucket) => {
      const pAvg = bucket.pSum / bucket.count;
      const yAvg = bucket.ySum / bucket.count;
      return sum + Math.abs(pAvg - yAvg) * bucket.count;
    }, 0) / total;
  };
  var simulateKellyStrategyByRows = (rows, predictFn, config, divisor) => {
    const simRows = [];
    rows.forEach((row) => {
      if (row.binaryPayout === false) return;
      const p = clamp3(toNumber3(predictFn(row), row.conf), 0.02, 0.98);
      const odds = Math.max(1.01, toNumber3(row.odds, toNumber3(config.defaultOdds, 2.5)));
      const stake = Math.round(calcKellyStake(p, odds, divisor, config));
      if (stake <= 0) return;
      const unitReturn = row.actual === 1 ? odds - 1 : -1;
      simRows.push({
        expected: p,
        odds,
        stake,
        unitReturn
      });
    });
    const mc = runKellyBootstrapMonteCarlo(simRows, config, MONTE_CARLO_TARGET_RUNS, rows.length * 97 + Math.round(divisor * 1e3));
    return {
      runs: mc.runs,
      samples: mc.samples,
      totalInvest: mc.totalInvest,
      totalProfit: mc.totalProfit,
      roi: mc.roi,
      hitRate: mc.hitRate,
      maxDrawdown: mc.maxDrawdown
    };
  };
  var FROZEN_HOLDOUT_RATIO = 0.07;
  var FROZEN_HOLDOUT_MIN_ROWS = 3;
  var splitFrozenHoldoutRows = (rows) => {
    const unavailable = { available: false, trainingRows: rows, holdoutRows: [] };
    const dated = rows.map((row, index) => ({ row, index, ts: validTime(row?.created_at) })).filter((entry) => Number.isFinite(entry.ts)).sort((a, b) => a.ts - b.ts || a.index - b.index);
    if (dated.length < FROZEN_HOLDOUT_MIN_ROWS) return unavailable;
    const span = dated[dated.length - 1].ts - dated[0].ts;
    const cutoff = dated[dated.length - 1].ts - span * FROZEN_HOLDOUT_RATIO;
    let holdoutEntries = dated.filter((entry) => entry.ts >= cutoff);
    if (holdoutEntries.length < FROZEN_HOLDOUT_MIN_ROWS) holdoutEntries = dated.slice(-FROZEN_HOLDOUT_MIN_ROWS);
    if (rows.length - holdoutEntries.length < 24) return unavailable;
    const holdoutSet = new Set(holdoutEntries.map((entry) => entry.row));
    return {
      available: true,
      trainingRows: rows.filter((row) => !holdoutSet.has(row)),
      holdoutRows: holdoutEntries.map((entry) => entry.row)
    };
  };
  var bootstrapDateClusterInterval = (rows, { statistic, resamples = 400, ci = 0.9 } = {}) => {
    if (!Array.isArray(rows) || rows.length === 0 || typeof statistic !== "function") return null;
    const clusterMap = /* @__PURE__ */ new Map();
    rows.forEach((row, index) => {
      const ts = validTime(row?.created_at);
      const key = Number.isFinite(ts) ? new Date(ts).toISOString().slice(0, 10) : `__undated_${index}`;
      if (!clusterMap.has(key)) clusterMap.set(key, []);
      clusterMap.get(key).push(row);
    });
    const clusters = [...clusterMap.values()];
    const runs = Math.max(1, Math.round(toNumber3(resamples, 400)) || 400);
    const alpha = clamp3((1 - clamp3(toNumber3(ci, 0.9), 0.02, 0.999)) / 2, 5e-4, 0.49);
    const rng = createSeededRng(buildMonteCarloSeed(rows, runs * 31 + clusters.length));
    const stats = [];
    for (let r = 0; r < runs; r += 1) {
      const subset = [];
      for (let k = 0; k < clusters.length; k += 1) {
        const picked = clusters[Math.min(clusters.length - 1, Math.floor(rng() * clusters.length))];
        subset.push(...picked);
      }
      const value = Number(statistic(subset));
      if (Number.isFinite(value)) stats.push(value);
    }
    if (stats.length === 0) return null;
    stats.sort((a, b) => a - b);
    const quantile = (q) => {
      const pos = clamp3(q, 0, 1) * (stats.length - 1);
      const lo = Math.floor(pos);
      const hi = Math.min(stats.length - 1, lo + 1);
      return stats[lo] + (stats[hi] - stats[lo]) * (pos - lo);
    };
    return {
      p05: quantile(alpha),
      p50: quantile(0.5),
      p95: quantile(1 - alpha),
      resamples: runs,
      clusters: clusters.length
    };
  };
  var summarizeModelValidationPrequential = (rows, config) => {
    const holdoutSplit = splitFrozenHoldoutRows(rows);
    const windows = buildPrequentialWalkForwardWindows(holdoutSplit.trainingRows, {
      minRows: 24,
      minTrain: 12,
      minTest: PREQUENTIAL_MIN_TEST_MATCHES,
      step: PREQUENTIAL_STEP_MATCHES
    });
    if (windows.length === 0) return null;
    const weighted = {
      trainWeight: 0,
      testWeight: 0,
      trainRawBrier: 0,
      trainCalBrier: 0,
      testRawBrier: 0,
      testCalBrier: 0,
      trainRawLogLoss: 0,
      trainCalLogLoss: 0,
      testRawLogLoss: 0,
      testCalLogLoss: 0,
      testRawMae: 0,
      testCalMae: 0,
      regressionReliability: 0
    };
    const walkForward = [];
    const rawSimRows = [];
    const calibratedSimRows = [];
    const scoredTestRows = [];
    windows.forEach((window2, idx) => {
      const { trainRows, testRows } = window2;
      const fit = getPredictionCalibrationContext({ investments: historyFromRows(trainRows), config, detail: "full" });
      const rawPredict = (row) => row.conf;
      const calibratedPredict = (row) => predictMatchProbability(row.match, config, fit);
      const trainRawBrier = calcBrierScore(trainRows, rawPredict);
      const trainCalBrier = calcBrierScore(trainRows, calibratedPredict);
      const testRawBrier = calcBrierScore(testRows, rawPredict);
      const testCalBrier = calcBrierScore(testRows, calibratedPredict);
      const trainRawLogLoss = calcLogLoss(trainRows, rawPredict);
      const trainCalLogLoss = calcLogLoss(trainRows, calibratedPredict);
      const testRawLogLoss = calcLogLoss(testRows, rawPredict);
      const testCalLogLoss = calcLogLoss(testRows, calibratedPredict);
      const testRawMae = calcCalibrationMae(testRows, rawPredict);
      const testCalMae = calcCalibrationMae(testRows, calibratedPredict);
      const gain = testRawBrier > 0 ? (testRawBrier - testCalBrier) / testRawBrier * 100 : 0;
      const trainW = Math.max(1, trainRows.length);
      const testW = Math.max(1, testRows.length);
      weighted.trainWeight += trainW;
      weighted.testWeight += testW;
      weighted.trainRawBrier += trainRawBrier * trainW;
      weighted.trainCalBrier += trainCalBrier * trainW;
      weighted.testRawBrier += testRawBrier * testW;
      weighted.testCalBrier += testCalBrier * testW;
      weighted.trainRawLogLoss += trainRawLogLoss * trainW;
      weighted.trainCalLogLoss += trainCalLogLoss * trainW;
      weighted.testRawLogLoss += testRawLogLoss * testW;
      weighted.testCalLogLoss += testCalLogLoss * testW;
      weighted.testRawMae += testRawMae * testW;
      weighted.testCalMae += testCalMae * testW;
      weighted.regressionReliability += toNumber3(fit.regressionReliability, 0) * trainW;
      walkForward.push({
        label: `W${idx + 1}`,
        cutoff: window2.cutoff,
        trainingIds: trainRows.map((row) => row.eventKey),
        predictions: testRows.map((row) => ({ eventKey: row.eventKey, created_at: row.created_at, probability: calibratedPredict(row), actual: row.actual })),
        trainSamples: trainRows.length,
        testSamples: testRows.length,
        rawBrier: Number(testRawBrier.toFixed(4)),
        calibratedBrier: Number(testCalBrier.toFixed(4)),
        gainPct: Number(gain.toFixed(2))
      });
      const divisor = Math.max(1, toNumber3(config.kellyDivisor, 4));
      testRows.forEach((row) => {
        const pRaw = clamp3(toNumber3(rawPredict(row), row.conf), 0.02, 0.98);
        const pCal = clamp3(toNumber3(calibratedPredict(row), row.conf), 0.02, 0.98);
        scoredTestRows.push({
          created_at: row.created_at,
          conf: row.conf,
          odds: row.odds,
          rawSqError: (pRaw - row.actual) ** 2,
          calibratedSqError: (pCal - row.actual) ** 2
        });
        if (row.binaryPayout === false) return;
        const odds = Math.max(1.01, toNumber3(row.odds, toNumber3(config.defaultOdds, 2.5)));
        const unitReturn = row.actual === 1 ? odds - 1 : -1;
        const rawStake = Math.round(calcKellyStake(pRaw, odds, divisor, config));
        const calibratedStake = Math.round(calcKellyStake(pCal, odds, divisor, config));
        if (rawStake > 0) {
          rawSimRows.push({ expected: pRaw, odds, stake: rawStake, unitReturn });
        }
        if (calibratedStake > 0) {
          calibratedSimRows.push({ expected: pCal, odds, stake: calibratedStake, unitReturn });
        }
      });
    });
    if (weighted.trainWeight <= 0 || weighted.testWeight <= 0) return null;
    const latestWindow = windows[windows.length - 1] || { trainRows: [], testRows: [] };
    const derivedAvailabilityRows = windows.reduce((sum, window2) => sum + window2.derivedAvailabilityRows, 0);
    const meanTrain = (value) => value / weighted.trainWeight;
    const meanTest = (value) => value / weighted.testWeight;
    const strategyRawMc = runKellyBootstrapMonteCarlo(
      rawSimRows,
      config,
      MONTE_CARLO_TARGET_RUNS,
      rows.length * 193 + 17
    );
    const strategyCalibratedMc = runKellyBootstrapMonteCarlo(
      calibratedSimRows,
      config,
      MONTE_CARLO_TARGET_RUNS,
      rows.length * 193 + 29
    );
    const brierGainInterval = bootstrapDateClusterInterval(scoredTestRows, {
      statistic: (subset) => subset.length === 0 ? Number.NaN : subset.reduce((sum, row) => sum + (row.rawSqError - row.calibratedSqError), 0) / subset.length
    });
    let holdout = { available: false, basis: "frozen_holdout_never_trained_2026_09", samples: 0 };
    if (holdoutSplit.available) {
      const holdoutFit = getPredictionCalibrationContext({
        investments: historyFromRows(holdoutSplit.trainingRows),
        config,
        detail: "full"
      });
      const holdoutRawPredict = (row) => row.conf;
      const holdoutCalibratedPredict = (row) => predictMatchProbability(row.match, config, holdoutFit);
      holdout = {
        available: true,
        basis: "frozen_holdout_never_trained_2026_09",
        samples: holdoutSplit.holdoutRows.length,
        brier: {
          raw: calcBrierScore(holdoutSplit.holdoutRows, holdoutRawPredict),
          calibrated: calcBrierScore(holdoutSplit.holdoutRows, holdoutCalibratedPredict)
        },
        logLoss: {
          raw: calcLogLoss(holdoutSplit.holdoutRows, holdoutRawPredict),
          calibrated: calcLogLoss(holdoutSplit.holdoutRows, holdoutCalibratedPredict)
        }
      };
    }
    return {
      trainSamples: latestWindow.trainRows.length,
      testSamples: latestWindow.testRows.length,
      regressionReliability: meanTrain(weighted.regressionReliability),
      brier: {
        trainRaw: meanTrain(weighted.trainRawBrier),
        trainCalibrated: meanTrain(weighted.trainCalBrier),
        testRaw: meanTest(weighted.testRawBrier),
        testCalibrated: meanTest(weighted.testCalBrier)
      },
      logLoss: {
        trainRaw: meanTrain(weighted.trainRawLogLoss),
        trainCalibrated: meanTrain(weighted.trainCalLogLoss),
        testRaw: meanTest(weighted.testRawLogLoss),
        testCalibrated: meanTest(weighted.testCalLogLoss)
      },
      calibrationMae: {
        testRaw: meanTest(weighted.testRawMae),
        testCalibrated: meanTest(weighted.testCalMae)
      },
      strategy: {
        raw: strategyRawMc,
        calibrated: strategyCalibratedMc
      },
      walkForward,
      positiveWalkForward: walkForward.filter((row) => row.gainPct > 0).length,
      derivedAvailabilityRows,
      brierGainInterval,
      holdout,
      timeBasis: derivedAvailabilityRows > 0 ? WINDOW_TIME_BASIS.derivedAvailability : WINDOW_TIME_BASIS.recordedOnly
    };
  };
  var getModelValidationSnapshot = () => {
    const cacheKey = getRevisionCacheKey("modelValidation");
    const cached = analyticsMemo.modelValidation.get(cacheKey);
    if (cached) return cached;
    const config = getSystemConfig2();
    const rows = getBinaryOutcomeRows();
    const minimumSamples = 24;
    if (rows.length < minimumSamples) {
      const insufficient = {
        ready: false,
        minimumSamples,
        sampleCount: rows.length,
        trainSamples: 0,
        testSamples: 0,
        stability: "insufficient",
        message: `尚无法进行严格时间验证：需要至少 ${minimumSamples} 场含事件身份与命中结果的记录。`,
        walkForward: []
      };
      analyticsMemo.modelValidation.set(cacheKey, insufficient);
      return insufficient;
    }
    const prequentialSummary = summarizeModelValidationPrequential(rows, config);
    if (!prequentialSummary) {
      const insufficient = {
        ready: false,
        minimumSamples,
        sampleCount: rows.length,
        trainSamples: 0,
        testSamples: 0,
        stability: "insufficient",
        message: `尚无法进行严格时间验证：需要足够的独立事件样本与可用时间顺序；缺少结算时间的旧记录按“创建后 72 小时视为已知”近似参与排序。`,
        walkForward: []
      };
      analyticsMemo.modelValidation.set(cacheKey, insufficient);
      return insufficient;
    }
    const {
      trainSamples,
      testSamples,
      regressionReliability,
      brier,
      logLoss,
      calibrationMae,
      strategy,
      walkForward,
      positiveWalkForward,
      timeBasis,
      derivedAvailabilityRows,
      brierGainInterval,
      holdout
    } = prequentialSummary;
    const brierGainPct = brier.testRaw > 0 ? (brier.testRaw - brier.testCalibrated) / brier.testRaw * 100 : 0;
    const logLossGainPct = logLoss.testRaw > 0 ? (logLoss.testRaw - logLoss.testCalibrated) / logLoss.testRaw * 100 : 0;
    const maeGainPct = calibrationMae.testRaw > 0 ? (calibrationMae.testRaw - calibrationMae.testCalibrated) / calibrationMae.testRaw * 100 : 0;
    const drift = brier.testCalibrated - brier.trainCalibrated;
    let stability = "stable";
    if (drift > 0.03 || brierGainPct < -2) stability = "risk";
    else if (drift > 0.015 || brierGainPct < 1) stability = "watch";
    const marketBlend = getPredictionCalibrationContext()?.marketBlend || {};
    const blendWalkForward = Array.isArray(marketBlend.walkForward) ? marketBlend.walkForward : [];
    const blendRoiReported = blendWalkForward.some((row) => row && row.calibratedRoi !== null && row.calibratedRoi !== void 0);
    const blendArm = (prefix) => ({
      brier: Number(toNumber3(marketBlend[`${prefix}Brier`], 0).toFixed(4)),
      logLoss: Number(toNumber3(marketBlend[`${prefix}LogLoss`], 0).toFixed(4)),
      roi: blendRoiReported && Number.isFinite(marketBlend[`${prefix}Roi`]) ? Number(marketBlend[`${prefix}Roi`].toFixed(2)) : null
    });
    const blendBaselines = {
      basis: "fixed_config_prequential_blend_walk_forward",
      windows: blendWalkForward.length,
      calibrated: blendArm("calibrated"),
      market: blendArm("market"),
      blended: blendArm("blended")
    };
    const snapshot = {
      ready: true,
      evaluationBasis: "production_probability_pipeline_fixed_config_prequential",
      strategyBasis: "single_selection_leg_diagnostic_not_account_replay",
      minimumSamples,
      sampleCount: rows.length,
      trainSamples,
      testSamples,
      divisor: Math.max(1, toNumber3(config.kellyDivisor, 4)),
      stability,
      regressionReliability: Number(regressionReliability.toFixed(3)),
      brier: {
        trainRaw: Number(brier.trainRaw.toFixed(4)),
        trainCalibrated: Number(brier.trainCalibrated.toFixed(4)),
        testRaw: Number(brier.testRaw.toFixed(4)),
        testCalibrated: Number(brier.testCalibrated.toFixed(4)),
        gainPct: Number(brierGainPct.toFixed(2)),
        drift: Number(drift.toFixed(4)),
        // （原始 − 校准）逐场 Brier 差值的日期聚类 Bootstrap 区间；null = 无法估计
        gainCi90: brierGainInterval ? {
          p05: Number(brierGainInterval.p05.toFixed(4)),
          p50: Number(brierGainInterval.p50.toFixed(4)),
          p95: Number(brierGainInterval.p95.toFixed(4)),
          resamples: brierGainInterval.resamples,
          clusters: brierGainInterval.clusters
        } : null
      },
      logLoss: {
        trainRaw: Number(logLoss.trainRaw.toFixed(4)),
        trainCalibrated: Number(logLoss.trainCalibrated.toFixed(4)),
        testRaw: Number(logLoss.testRaw.toFixed(4)),
        testCalibrated: Number(logLoss.testCalibrated.toFixed(4)),
        gainPct: Number(logLossGainPct.toFixed(2))
      },
      calibrationMae: {
        testRaw: Number(calibrationMae.testRaw.toFixed(4)),
        testCalibrated: Number(calibrationMae.testCalibrated.toFixed(4)),
        gainPct: Number(maeGainPct.toFixed(2))
      },
      strategy: {
        raw: {
          runs: strategy.raw.runs || 0,
          roi: Number(strategy.raw.roi.toFixed(2)),
          maxDrawdown: Number(strategy.raw.maxDrawdown.toFixed(2)),
          hitRate: Number(strategy.raw.hitRate.toFixed(1)),
          samples: strategy.raw.samples
        },
        calibrated: {
          runs: strategy.calibrated.runs || 0,
          roi: Number(strategy.calibrated.roi.toFixed(2)),
          maxDrawdown: Number(strategy.calibrated.maxDrawdown.toFixed(2)),
          hitRate: Number(strategy.calibrated.hitRate.toFixed(1)),
          samples: strategy.calibrated.samples
        }
      },
      walkForward,
      positiveWalkForward,
      timeBasis,
      derivedAvailabilityRows,
      blendBaselines,
      holdout: holdout?.available ? {
        available: true,
        basis: holdout.basis,
        samples: holdout.samples,
        brier: {
          raw: Number(holdout.brier.raw.toFixed(4)),
          calibrated: Number(holdout.brier.calibrated.toFixed(4))
        },
        logLoss: {
          raw: Number(holdout.logLoss.raw.toFixed(4)),
          calibrated: Number(holdout.logLoss.calibrated.toFixed(4))
        }
      } : { available: false, basis: "frozen_holdout_never_trained_2026_09", samples: 0 }
    };
    analyticsMemo.modelValidation.set(cacheKey, snapshot);
    return snapshot;
  };
  var getFineConfBucket = (conf) => {
    if (conf >= 0.8) return "0.8+";
    if (conf >= 0.7) return "0.7-0.8";
    if (conf >= 0.6) return "0.6-0.7";
    if (conf >= 0.5) return "0.5-0.6";
    if (conf >= 0.4) return "0.4-0.5";
    return "<0.4";
  };
  var FINE_CONF_BUCKET_ORDER = ["0.8+", "0.7-0.8", "0.6-0.7", "0.5-0.6", "0.4-0.5", "<0.4"];
  var getOddsBucketByHalf = (odds) => {
    if (!Number.isFinite(odds) || odds <= 0) return "unknown";
    if (odds >= 4) return "4.0+";
    const start = Math.floor((odds - 1) / 0.5) * 0.5 + 1;
    const end = start + 0.5;
    return `${start.toFixed(1)}-${end.toFixed(1)}`;
  };
  var ODDS_BUCKET_ORDER = ["1.0-1.5", "1.5-2.0", "2.0-2.5", "2.5-3.0", "3.0-3.5", "3.5-4.0", "4.0+"];
  var getReturnsByPeriod = (settledInvestments, days, now = /* @__PURE__ */ new Date()) => {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return settledInvestments.filter((item) => inRange(item.created_at, { start, end })).map((item) => ({
      profit: toNumber3(item.profit),
      inputs: Math.max(0, toNumber3(item.inputs)),
      ret: toNumber3(item.inputs) > 0 ? toNumber3(item.profit) / toNumber3(item.inputs) : 0
    }));
  };
  var calcMatchStreaks = (splitMatches) => {
    const sorted = [...splitMatches].sort((a, b) => {
      const ta = new Date(a?.created_at || 0).getTime();
      const tb = new Date(b?.created_at || 0).getTime();
      if (ta !== tb) return ta - tb;
      return Number(a?.match_index || 0) - Number(b?.match_index || 0);
    });
    let maxWin = 0;
    let maxLose = 0;
    let curWin = 0;
    let curLose = 0;
    sorted.forEach((match) => {
      if (match?.is_correct === true) {
        curWin += 1;
        curLose = 0;
      } else if (match?.is_correct === false) {
        curLose += 1;
        curWin = 0;
      } else {
        return;
      }
      if (curWin > maxWin) maxWin = curWin;
      if (curLose > maxLose) maxLose = curLose;
    });
    return { maxWin, maxLose };
  };
  var getAnalysisSnapshot = (periodKey = "all") => {
    const cacheKey = getRevisionCacheKey("analysis", periodKey);
    const cached = analyticsMemo.analysis.get(cacheKey);
    if (cached) return cached;
    const range = getPeriodRange(periodKey);
    const investments = getActiveInvestments().filter((item) => inRange(item.created_at, range));
    const settled = getSettledInvestments(investments);
    const modeKelly = getModeKellyRecommendations();
    const modeKellyMap = new Map(modeKelly.map((row) => [row.mode, row.kellyDivisor]));
    const strategyMap = /* @__PURE__ */ new Map([
      [1, { type: "solo", label: "Solo Position", sublabel: "单标的持仓", samples: 0, wins: 0, inputs: 0, profit: 0, oddsSum: 0 }],
      [2, { type: "double", label: "Double Position", sublabel: "双标的持仓", samples: 0, wins: 0, inputs: 0, profit: 0, oddsSum: 0 }],
      [3, { type: "triple", label: "Triple Position", sublabel: "三标的持仓", samples: 0, wins: 0, inputs: 0, profit: 0, oddsSum: 0 }],
      [4, { type: "quad", label: "Quad Position", sublabel: "四标的持仓", samples: 0, wins: 0, inputs: 0, profit: 0, oddsSum: 0 }]
    ]);
    const multiBucket = {
      type: "multi",
      label: "Multi Position",
      sublabel: "多标的持仓",
      samples: 0,
      wins: 0,
      inputs: 0,
      profit: 0,
      oddsSum: 0
    };
    settled.forEach((item) => {
      const size = Number(item.parlay_size || item.matches?.length || 1);
      const target = strategyMap.get(size) || multiBucket;
      target.samples += 1;
      target.inputs += Math.max(0, toNumber3(item.inputs));
      target.profit += toNumber3(item.profit);
      target.oddsSum += Math.max(1, toNumber3(item.combined_odds, 1));
      if (item.status === "win") target.wins += 1;
    });
    const strategyData = [...strategyMap.values(), multiBucket].filter((row) => row.samples > 0).map((row) => ({
      ...row,
      roi: calcRoi(row.profit, row.inputs),
      hitRate: row.samples > 0 ? row.wins / row.samples * 100 : 0,
      avgOdds: row.samples > 0 ? row.oddsSum / row.samples : 0
    }));
    const modeRowsMap = /* @__PURE__ */ new Map();
    MODE_KEYS.forEach((mode) => {
      modeRowsMap.set(mode, {
        mode,
        samples: 0,
        wins: 0,
        inputs: 0,
        profit: 0,
        oddsSum: 0,
        diffSum: 0,
        diffCount: 0
      });
    });
    settled.forEach((item) => {
      splitInvestmentToMatches(item).forEach((match) => {
        const mode = MODE_KEYS.includes(normalizeMode(match.mode)) ? normalizeMode(match.mode) : "常规";
        const row = modeRowsMap.get(mode);
        row.samples += 1;
        row.inputs += match.allocated_input;
        row.profit += match.allocated_profit;
        row.oddsSum += Math.max(1, toNumber3(match.odds, 1));
        if (match.is_correct === true) row.wins += 1;
        const conf = toNumber3(match.conf, NaN);
        const ajr = toNumber3(match.match_rating, NaN);
        if (Number.isFinite(conf) && Number.isFinite(ajr)) {
          row.diffSum += normalizeAjrForModel(ajr) - conf;
          row.diffCount += 1;
        }
      });
    });
    const modeData = [...modeRowsMap.values()].filter((row) => row.samples > 0).map((row) => ({
      mode: row.mode,
      samples: row.samples,
      roi: calcRoi(row.profit, row.inputs),
      hitRate: row.samples > 0 ? row.wins / row.samples * 100 : 0,
      avgOdds: row.samples > 0 ? row.oddsSum / row.samples : 0,
      avgActualMinusConf: row.diffCount > 0 ? row.diffSum / row.diffCount : 0,
      diffBasis: "normalized_AJR_minus_conf_judgment_residual_not_probability_error",
      kelly: modeKellyMap.get(row.mode) || 4
    })).sort((a, b) => b.samples - a.samples);
    const confBucketMap = /* @__PURE__ */ new Map([
      ["0.0-0.4", { confBucket: "0.0-0.4", samples: 0, wins: 0, inputs: 0, profit: 0, expectedSum: 0, actualSum: 0 }],
      ["0.4-0.7", { confBucket: "0.4-0.7", samples: 0, wins: 0, inputs: 0, profit: 0, expectedSum: 0, actualSum: 0 }],
      ["0.7-1.0", { confBucket: "0.7-1.0", samples: 0, wins: 0, inputs: 0, profit: 0, expectedSum: 0, actualSum: 0 }]
    ]);
    settled.forEach((item) => {
      splitInvestmentToMatches(item).forEach((match) => {
        const conf = toNumber3(match.conf, NaN);
        if (!Number.isFinite(conf)) return;
        const key = getConfBucket(conf);
        const row = confBucketMap.get(key);
        row.samples += 1;
        row.inputs += match.allocated_input;
        row.profit += match.allocated_profit;
        row.expectedSum += conf;
        if (match.is_correct === true) row.wins += 1;
        const ajr = toNumber3(match.match_rating, NaN);
        if (Number.isFinite(ajr)) row.actualSum += ajr;
      });
    });
    const confData = [...confBucketMap.values()].filter((row) => row.samples > 0).map((row) => ({
      ...row,
      roi: calcRoi(row.profit, row.inputs),
      hitRate: row.wins / row.samples * 100,
      expected: row.expectedSum / row.samples,
      actual: row.actualSum / row.samples
    }));
    const entryTypeMap = /* @__PURE__ */ new Map();
    settled.forEach((item) => {
      splitInvestmentToMatches(item).forEach((match) => {
        const market = getPrimaryEntryMarket(match.entries, match.entry_text || "");
        const key = market.marketType || "other";
        if (!entryTypeMap.has(key)) {
          entryTypeMap.set(key, {
            marketType: key,
            marketLabel: market.marketLabel || "其他",
            samples: 0,
            wins: 0,
            inputs: 0,
            profit: 0,
            examples: []
          });
        }
        const row = entryTypeMap.get(key);
        row.samples += 1;
        row.inputs += match.allocated_input;
        row.profit += match.allocated_profit;
        if (match.is_correct === true) row.wins += 1;
        const sampleEntry = Array.isArray(match.entries) ? String(match.entries[0]?.name || "").trim() : "";
        if (sampleEntry && row.examples.length < 3 && !row.examples.includes(sampleEntry)) {
          row.examples.push(sampleEntry);
        }
      });
    });
    const entryTypeData = [...entryTypeMap.values()].filter((row) => row.samples > 0).map((row) => ({
      marketType: row.marketType,
      marketLabel: row.marketLabel,
      samples: row.samples,
      roi: calcRoi(row.profit, row.inputs),
      hitRate: row.samples > 0 ? row.wins / row.samples * 100 : 0,
      examples: row.examples.join(" / ")
    })).sort((a, b) => b.samples - a.samples || b.roi - a.roi);
    const snapshot = {
      strategyData,
      modeData,
      confData,
      entryTypeData
    };
    analyticsMemo.analysis.set(cacheKey, snapshot);
    return snapshot;
  };
  var getMetricsSnapshot = (periodKey = "all") => {
    const cacheKey = getRevisionCacheKey("metrics", periodKey);
    const cached = analyticsMemo.metrics.get(cacheKey);
    if (cached) return cached;
    const config = getSystemConfig2();
    const range = getPeriodRange(periodKey);
    const investments = getActiveInvestments().filter((item) => inRange(item.created_at, range));
    const settled = getSettledInvestments(investments);
    const splitMatches = settled.flatMap(
      (item) => splitInvestmentToMatches(item).map((match, matchIndex) => ({
        ...match,
        investment_id: item.id,
        created_at: item.created_at,
        parlay_size: Number(item.parlay_size || item.matches?.length || 1),
        status: item.status,
        match_index: matchIndex
      }))
    );
    const returns = settled.map((item) => {
      const inputs = Math.max(0, toNumber3(item.inputs));
      const profit = toNumber3(item.profit);
      return inputs > 0 ? profit / inputs : 0;
    });
    const totalInputs = settled.reduce((sum, item) => sum + Math.max(0, toNumber3(item.inputs)), 0);
    const totalProfit = settled.reduce((sum, item) => sum + toNumber3(item.profit), 0);
    const roi = calcRoi(totalProfit, totalInputs);
    const settledMatchRows = splitMatches.filter((match) => typeof match?.is_correct === "boolean");
    const matchWins = settledMatchRows.filter((match) => match.is_correct === true).length;
    const hitRate = settledMatchRows.length > 0 ? matchWins / settledMatchRows.length * 100 : 0;
    const avgExpectedEdge = splitMatches.length > 0 ? splitMatches.reduce((sum, match) => sum + (toNumber3(match.conf) * toNumber3(match.odds) - 1), 0) / splitMatches.length : 0;
    const maxWin = splitMatches.reduce((max, match) => Math.max(max, toNumber3(match.allocated_profit)), 0);
    const maxLoss = splitMatches.reduce((min, match) => Math.min(min, toNumber3(match.allocated_profit)), 0);
    const streaks = calcMatchStreaks(splitMatches);
    const volatility = calcStdDev(returns) * 100;
    const meanReturn = returns.length > 0 ? returns.reduce((sum, value) => sum + value, 0) / returns.length : 0;
    const { sharpe, sortino } = getReturnRiskRatios(returns);
    const grossProfit = settled.reduce((sum, item) => sum + Math.max(0, toNumber3(item.profit)), 0);
    const grossLoss = Math.abs(settled.reduce((sum, item) => sum + Math.min(0, toNumber3(item.profit)), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;
    const poolBalance = toNumber3(config.initialCapital) + totalProfit;
    const utilization = poolBalance > 0 ? totalInputs / Math.max(poolBalance, 1) * 100 : 0;
    const returns7 = getReturnsByPeriod(settled, 7);
    const returns14 = getReturnsByPeriod(settled, 14);
    const returns30 = getReturnsByPeriod(settled, 30);
    const roi7 = calcRoi(
      returns7.reduce((sum, row) => sum + row.profit, 0),
      returns7.reduce((sum, row) => sum + row.inputs, 0)
    );
    const roi14 = calcRoi(
      returns14.reduce((sum, row) => sum + row.profit, 0),
      returns14.reduce((sum, row) => sum + row.inputs, 0)
    );
    const roi30 = calcRoi(
      returns30.reduce((sum, row) => sum + row.profit, 0),
      returns30.reduce((sum, row) => sum + row.inputs, 0)
    );
    let runningBalance = toNumber3(config.initialCapital);
    let peak = runningBalance;
    let maxDrawdown = 0;
    [...settled].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).forEach((item) => {
      runningBalance += toNumber3(item.profit);
      if (runningBalance > peak) peak = runningBalance;
      const drawdown = peak > 0 ? (peak - runningBalance) / peak * 100 : 0;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    const modeMatrixMap = /* @__PURE__ */ new Map();
    MODE_KEYS.forEach(
      (mode) => modeMatrixMap.set(mode, {
        mode,
        samples: 0,
        wins: 0,
        inputs: 0,
        profit: 0,
        oddsSum: 0,
        confSum: 0,
        confCount: 0,
        ajrSum: 0,
        ajrCount: 0,
        diffSum: 0,
        diffCount: 0
      })
    );
    const confMatrixMap = new Map(
      FINE_CONF_BUCKET_ORDER.map((bucket) => [
        bucket,
        {
          bucket,
          samples: 0,
          wins: 0,
          inputs: 0,
          profit: 0,
          expectedSum: 0,
          expectedCount: 0,
          actualSum: 0,
          actualCount: 0
        }
      ])
    );
    const oddsMatrixMap = new Map(
      ODDS_BUCKET_ORDER.map((bucket) => [
        bucket,
        {
          bucket,
          samples: 0,
          wins: 0,
          inputs: 0,
          profit: 0,
          confSum: 0,
          confCount: 0,
          ajrSum: 0,
          ajrCount: 0,
          normalizedAjrSum: 0,
          normalizedAjrCount: 0
        }
      ])
    );
    const entryMatrixMap = /* @__PURE__ */ new Map();
    const corrPairs = {
      confAjr: { x: [], y: [] },
      oddsReturn: { x: [], y: [] },
      repReturn: { x: [], y: [] },
      fidReturn: { x: [], y: [] },
      fseReturn: { x: [], y: [] }
    };
    const matchRows = splitMatches.map((match) => {
      const mode = MODE_KEYS.includes(normalizeMode(match.mode)) ? normalizeMode(match.mode) : "常规";
      const conf = toNumber3(match.conf, NaN);
      const ajr = toNumber3(match.match_rating, NaN);
      const odds = toNumber3(match.odds, NaN);
      const rep = toNumber3(match.match_rep, NaN);
      const fid = toNumber3(match.fid, NaN);
      const fseHome = toNumber3(match.fse_home, NaN);
      const fseAway = toNumber3(match.fse_away, NaN);
      const fse = Number.isFinite(fseHome) && Number.isFinite(fseAway) ? Number(Math.sqrt(clamp3(fseHome, 0.05, 1) * clamp3(fseAway, 0.05, 1)).toFixed(3)) : Number.NaN;
      const allocatedInput = Math.max(0, toNumber3(match.allocated_input, 0));
      const allocatedProfit = toNumber3(match.allocated_profit, 0);
      const roiByMatch = allocatedInput > 0 ? calcRoi(allocatedProfit, allocatedInput) : 0;
      const confBucket = Number.isFinite(conf) ? getFineConfBucket(conf) : "<0.4";
      const oddsBucket = Number.isFinite(odds) ? getOddsBucketByHalf(odds) : "unknown";
      const entryMarket = getPrimaryEntryMarket(match.entries, match.entry_text || "");
      const entryType = entryMarket.marketType || "other";
      const entryLabel = entryMarket.marketLabel || "其他";
      const modeRow = modeMatrixMap.get(mode) || modeMatrixMap.get("常规");
      modeRow.samples += 1;
      modeRow.inputs += allocatedInput;
      modeRow.profit += allocatedProfit;
      if (match.is_correct === true) modeRow.wins += 1;
      if (Number.isFinite(odds)) modeRow.oddsSum += odds;
      if (Number.isFinite(conf)) {
        modeRow.confSum += conf;
        modeRow.confCount += 1;
      }
      if (Number.isFinite(ajr)) {
        modeRow.ajrSum += ajr;
        modeRow.ajrCount += 1;
      }
      if (Number.isFinite(conf) && Number.isFinite(ajr)) {
        modeRow.diffSum += normalizeAjrForModel(ajr) - conf;
        modeRow.diffCount += 1;
      }
      const confRow = confMatrixMap.get(confBucket);
      if (confRow) {
        confRow.samples += 1;
        confRow.inputs += allocatedInput;
        confRow.profit += allocatedProfit;
        if (match.is_correct === true) confRow.wins += 1;
        if (Number.isFinite(conf)) {
          confRow.expectedSum += conf;
          confRow.expectedCount += 1;
        }
        if (Number.isFinite(ajr)) {
          confRow.actualSum += normalizeAjrForModel(ajr);
          confRow.actualCount += 1;
        }
      }
      const oddsRow = oddsMatrixMap.get(oddsBucket);
      if (oddsRow) {
        oddsRow.samples += 1;
        oddsRow.inputs += allocatedInput;
        oddsRow.profit += allocatedProfit;
        if (match.is_correct === true) oddsRow.wins += 1;
        if (Number.isFinite(conf)) {
          oddsRow.confSum += conf;
          oddsRow.confCount += 1;
        }
        if (Number.isFinite(ajr)) {
          oddsRow.ajrSum += ajr;
          oddsRow.ajrCount += 1;
          oddsRow.normalizedAjrSum += normalizeAjrForModel(ajr);
          oddsRow.normalizedAjrCount += 1;
        }
      }
      if (!entryMatrixMap.has(entryType)) {
        entryMatrixMap.set(entryType, {
          marketType: entryType,
          marketLabel: entryLabel,
          samples: 0,
          wins: 0,
          inputs: 0,
          profit: 0,
          confSum: 0,
          confCount: 0,
          ajrSum: 0,
          ajrCount: 0,
          normalizedAjrSum: 0,
          normalizedAjrCount: 0,
          oddsSum: 0,
          oddsCount: 0
        });
      }
      const entryRow = entryMatrixMap.get(entryType);
      entryRow.samples += 1;
      entryRow.inputs += allocatedInput;
      entryRow.profit += allocatedProfit;
      if (match.is_correct === true) entryRow.wins += 1;
      if (Number.isFinite(conf)) {
        entryRow.confSum += conf;
        entryRow.confCount += 1;
      }
      if (Number.isFinite(ajr)) {
        entryRow.ajrSum += ajr;
        entryRow.ajrCount += 1;
        entryRow.normalizedAjrSum += normalizeAjrForModel(ajr);
        entryRow.normalizedAjrCount += 1;
      }
      if (Number.isFinite(odds)) {
        entryRow.oddsSum += odds;
        entryRow.oddsCount += 1;
      }
      const matchReturn = allocatedInput > 0 ? allocatedProfit / allocatedInput : 0;
      if (Number.isFinite(conf) && Number.isFinite(ajr)) {
        corrPairs.confAjr.x.push(conf);
        corrPairs.confAjr.y.push(ajr);
      }
      if (Number.isFinite(odds)) {
        corrPairs.oddsReturn.x.push(odds);
        corrPairs.oddsReturn.y.push(matchReturn);
      }
      if (Number.isFinite(rep)) {
        corrPairs.repReturn.x.push(rep);
        corrPairs.repReturn.y.push(matchReturn);
      }
      if (Number.isFinite(fid)) {
        corrPairs.fidReturn.x.push(fid);
        corrPairs.fidReturn.y.push(matchReturn);
      }
      if (Number.isFinite(fse)) {
        corrPairs.fseReturn.x.push(fse);
        corrPairs.fseReturn.y.push(matchReturn);
      }
      return {
        id: `${match.investment_id}-${match.match_index}`,
        investmentId: match.investment_id,
        date: match.created_at,
        dateLabel: formatDate(match.created_at),
        match: `${match.home_team || "-"} vs ${match.away_team || "-"}`,
        entry: match.entry_text || (Array.isArray(match.entries) ? match.entries.map((entry) => entry?.name).filter(Boolean).join(", ") : "-") || "-",
        result: match.results || "-",
        mode,
        conf: Number.isFinite(conf) ? conf : Number.NaN,
        ajr: Number.isFinite(ajr) ? ajr : Number.NaN,
        normalizedAjr: Number.isFinite(ajr) ? normalizeAjrForModel(ajr) : Number.NaN,
        odds: Number.isFinite(odds) ? odds : Number.NaN,
        rep: Number.isFinite(rep) ? rep : Number.NaN,
        fid: Number.isFinite(fid) ? fid : Number.NaN,
        fse: Number.isFinite(fse) ? fse : Number.NaN,
        confBucket,
        oddsBucket,
        entryType,
        entryLabel,
        parlaySize: match.parlay_size,
        isCorrect: match.is_correct === true,
        allocatedInput,
        allocatedProfit,
        roi: roiByMatch
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const modeKellyMap = new Map(getModeKellyRecommendations().map((row) => [row.mode, row.kellyDivisor]));
    const modeMatrix = [...modeMatrixMap.values()].filter((row) => row.samples > 0).map((row) => ({
      mode: row.mode,
      samples: row.samples,
      roi: calcRoi(row.profit, row.inputs),
      hitRate: row.samples > 0 ? row.wins / row.samples * 100 : 0,
      avgOdds: row.samples > 0 ? row.oddsSum / row.samples : 0,
      avgConf: row.confCount > 0 ? row.confSum / row.confCount : 0,
      avgAjr: row.ajrCount > 0 ? row.ajrSum / row.ajrCount : 0,
      avgActualMinusConf: row.diffCount > 0 ? row.diffSum / row.diffCount : 0,
      diffBasis: "normalized_AJR_minus_conf_judgment_residual_not_probability_error",
      kelly: modeKellyMap.get(row.mode) || toNumber3(config.kellyDivisor, 4)
    })).sort((a, b) => b.samples - a.samples);
    const confMatrix = FINE_CONF_BUCKET_ORDER.map((bucket) => confMatrixMap.get(bucket)).filter((row) => row && row.samples > 0).map((row) => {
      const expected = row.expectedCount > 0 ? row.expectedSum / row.expectedCount : 0;
      const actual = row.actualCount > 0 ? row.actualSum / row.actualCount : 0;
      return {
        bucket: row.bucket,
        samples: row.samples,
        hitRate: row.samples > 0 ? row.wins / row.samples * 100 : 0,
        roi: calcRoi(row.profit, row.inputs),
        expected,
        actual,
        actualBasis: "normalized_AJR_judgment_scale",
        diff: actual - expected
      };
    });
    const oddsMatrix = ODDS_BUCKET_ORDER.map((bucket) => oddsMatrixMap.get(bucket)).filter((row) => row && row.samples > 0).map((row) => ({
      bucket: row.bucket,
      samples: row.samples,
      hitRate: row.samples > 0 ? row.wins / row.samples * 100 : 0,
      roi: calcRoi(row.profit, row.inputs),
      avgConf: row.confCount > 0 ? row.confSum / row.confCount : 0,
      avgAjr: row.ajrCount > 0 ? row.ajrSum / row.ajrCount : 0,
      diff: row.confCount > 0 && row.normalizedAjrCount > 0 ? row.normalizedAjrSum / row.normalizedAjrCount - row.confSum / row.confCount : 0,
      diffBasis: "normalized_AJR_minus_conf_judgment_residual_not_probability_error"
    }));
    const entriesMatrix = [...entryMatrixMap.values()].filter((row) => row.samples > 0).map((row) => ({
      marketType: row.marketType,
      marketLabel: row.marketLabel,
      samples: row.samples,
      hitRate: row.samples > 0 ? row.wins / row.samples * 100 : 0,
      roi: calcRoi(row.profit, row.inputs),
      avgConf: row.confCount > 0 ? row.confSum / row.confCount : 0,
      avgAjr: row.ajrCount > 0 ? row.ajrSum / row.ajrCount : 0,
      avgOdds: row.oddsCount > 0 ? row.oddsSum / row.oddsCount : 0,
      diff: row.normalizedAjrCount > 0 && row.confCount > 0 ? row.normalizedAjrSum / row.normalizedAjrCount - row.confSum / row.confCount : 0,
      diffBasis: "normalized_AJR_minus_conf_judgment_residual_not_probability_error"
    })).sort((a, b) => b.samples - a.samples || b.roi - a.roi);
    const correlations = {
      conf_vs_ajr: calcPearson(corrPairs.confAjr.x, corrPairs.confAjr.y),
      odds_vs_return: calcPearson(corrPairs.oddsReturn.x, corrPairs.oddsReturn.y),
      rep_vs_return: calcPearson(corrPairs.repReturn.x, corrPairs.repReturn.y),
      fid_vs_return: calcPearson(corrPairs.fidReturn.x, corrPairs.fidReturn.y),
      fse_vs_return: calcPearson(corrPairs.fseReturn.x, corrPairs.fseReturn.y)
    };
    const snapshot = {
      headline: {
        totalInvestments: settled.length,
        totalInputs,
        totalProfit,
        roi,
        maxWin,
        maxLoss,
        maxWinStreak: streaks.maxWin,
        maxLoseStreak: streaks.maxLose,
        avgConf: splitMatches.length > 0 ? splitMatches.reduce((sum, match) => sum + toNumber3(match.conf), 0) / splitMatches.length : 0,
        avgOdds: splitMatches.length > 0 ? splitMatches.reduce((sum, match) => sum + toNumber3(match.odds), 0) / splitMatches.length : 0,
        sharpe,
        hitRate,
        avgExpectedEdge
      },
      trends: {
        roi7,
        roi14,
        roi30
      },
      risk: {
        maxDrawdown,
        volatility,
        sortino
      },
      efficiency: {
        avgProfitPerInvest: settled.length > 0 ? totalProfit / settled.length : 0,
        profitFactor,
        utilization
      },
      matrix: {
        mode: modeMatrix,
        conf: confMatrix,
        odds: oddsMatrix,
        entries: entriesMatrix
      },
      correlations,
      matchRows
    };
    analyticsMemo.metrics.set(cacheKey, snapshot);
    return snapshot;
  };
  var WEIGHT_KEYS = ["weightConf", "weightMode", "weightTys", "weightFid", "weightOdds", "weightFse"];
  var INACTIVE_WEIGHT_KEYS = /* @__PURE__ */ new Set(["weightConf", "weightMode"]);
  var DEFAULT_WEIGHT_BOUNDS = {
    weightConf: [0.25, 0.65],
    weightMode: [0.08, 0.28],
    weightTys: [0.05, 0.22],
    weightFid: [0.06, 0.24],
    weightOdds: [0.02, 0.12],
    weightFse: [0.03, 0.15]
  };
  var DEFAULT_WEIGHT_PRIORS = {
    weightConf: 0.45,
    weightMode: 0.16,
    weightTys: 0.12,
    weightFid: 0.14,
    weightOdds: 0.06,
    weightFse: 0.07
  };
  var computeInvestmentScore = (investment, weights) => {
    const matches = Array.isArray(investment.matches) ? investment.matches : [];
    if (matches.length === 0) return { score: 0, profit: 0, components: {} };
    const profit = toNumber3(investment.profit, 0);
    const inputs = Math.max(1, toNumber3(investment.inputs, 1));
    const roi = profit / inputs;
    const avgConf = matches.reduce((sum, m) => sum + toNumber3(m.conf, 0.5), 0) / matches.length;
    const avgOdds = matches.reduce((sum, m) => sum + toNumber3(m.odds, 2), 0) / matches.length;
    const avgFseHome = matches.reduce((sum, m) => sum + toNumber3(m.fse_home, 0.5), 0) / matches.length;
    const avgFseAway = matches.reduce((sum, m) => sum + toNumber3(m.fse_away, 0.5), 0) / matches.length;
    const avgFse = Math.sqrt(avgFseHome * avgFseAway);
    const tysFeature = (() => {
      const tysMap = { S: 1, M: 0.7, L: 0.4, H: 0.2 };
      const tysValues = matches.map((m) => {
        const home = m.tys_home ?? m.tys_base_home ?? m.tys_base;
        const away = m.tys_away ?? m.tys_base_away ?? home;
        return ((tysMap[home] ?? 0.5) + (tysMap[away] ?? 0.5)) / 2;
      });
      return tysValues.reduce((sum, v) => sum + v, 0) / tysValues.length;
    })();
    const fidFeature = (() => {
      const fidValues = matches.map((m) => toNumber3(m.fid, toNumber3(m.fid_base_home, 0.5)));
      return fidValues.reduce((sum, v) => sum + v, 0) / fidValues.length;
    })();
    const modeFeature = (() => {
      const modeScores = {
        "常规": 0.5,
        "常规-稳": 0.7,
        "常规-杠杆": 0.3,
        "半彩票半保险": 0.4,
        "保险产品": 0.8,
        "赌一把": 0.1
      };
      return matches.reduce((sum, m) => {
        const mode = normalizeMode(m.mode || investment.mode || "常规");
        return sum + (modeScores[mode] ?? 0.5);
      }, 0) / matches.length;
    })();
    const components = {
      conf: avgConf,
      mode: modeFeature,
      tys: tysFeature,
      fid: fidFeature,
      odds: clamp3(1 - (avgOdds - 1.5) / 3, 0, 1),
      // 低赔率得分高
      fse: avgFse
    };
    return { score: roi, profit, inputs, components };
  };
  var computeAdaptiveWeightSuggestions = () => {
    const config = getSystemConfig2();
    const adaptive = config.adaptiveWeights || {};
    const priors = adaptive.initialPriors || DEFAULT_WEIGHT_PRIORS;
    const bounds = adaptive.bounds || DEFAULT_WEIGHT_BOUNDS;
    const minSamples = Math.max(24, toNumber3(adaptive.minSamples, 50));
    const rows = getBinaryOutcomeRows();
    const windows = buildPrequentialWalkForwardWindows(rows);
    const derivedAvailabilityRows = windows.reduce((sum, window2) => sum + window2.derivedAvailabilityRows, 0);
    const timeBasis = derivedAvailabilityRows > 0 ? WINDOW_TIME_BASIS.derivedAvailability : WINDOW_TIME_BASIS.recordedOnly;
    const current = Object.fromEntries(WEIGHT_KEYS.map((key) => [key, toNumber3(config[key], priors[key])]));
    const empty = (reason) => ({
      suggestions: WEIGHT_KEYS.map((key) => ({
        key,
        label: key.replace("weight", ""),
        current: current[key],
        suggested: current[key],
        prior: priors[key],
        bounds: bounds[key] || DEFAULT_WEIGHT_BOUNDS[key],
        gradient: 0,
        confidence: 0,
        change: 0,
        reason
      })),
      sampleCount: rows.length,
      minSamples,
      ready: false,
      evaluationBasis: "production_brier_temporal_tuning",
      confidenceBasis: "direction_agreement_not_probability",
      lastUpdateAt: adaptive.lastUpdateAt || null,
      updateCount: adaptive.updateCount || 0,
      timeBasis,
      derivedAvailabilityRows
    });
    if (rows.length < minSamples || windows.length < 2) return empty("独立事件或结算时间不足，未进行权重验证");
    const tuning = windows.slice(0, -1);
    const holdout = windows[windows.length - 1];
    const contexts = /* @__PURE__ */ new Map();
    const evaluate2 = (window2, weights) => {
      const cfg = { ...config, ...weights };
      const key = window2.cutoff + ":" + cfg.weightOdds;
      if (!contexts.has(key)) contexts.set(key, getPredictionCalibrationContext({
        investments: historyFromRows(window2.trainRows),
        config: cfg,
        detail: "full"
      }));
      return probabilityLoss(window2.testRows, (row) => predictMatchProbability(row.match, cfg, contexts.get(key)));
    };
    const tuneScore = (weights) => {
      const n = tuning.reduce((sum, w) => sum + w.testRows.length, 0);
      return -tuning.reduce((sum, w) => sum + evaluate2(w, weights).brier * w.testRows.length, 0) / n;
    };
    const learningRate = Math.max(0, toNumber3(adaptive.learningRate, 0.05));
    const priorStrength = Math.max(0, toNumber3(adaptive.priorStrength, 0.1));
    const maxChange = Math.min(0.02, Math.max(0, toNumber3(adaptive.maxSingleChange, 0.02)));
    let remaining = 0.08;
    const suggestions = WEIGHT_KEYS.map((key) => {
      const inactive = INACTIVE_WEIGHT_KEYS.has(key);
      const limits = bounds[key] || DEFAULT_WEIGHT_BOUNDS[key];
      const plus = { ...current, [key]: clamp3(current[key] + 0.01, ...limits) };
      const minus = { ...current, [key]: clamp3(current[key] - 0.01, ...limits) };
      const width = plus[key] - minus[key];
      const gradient = inactive || width <= 0 ? 0 : (tuneScore(plus) - tuneScore(minus)) / width;
      const agreement = inactive || Math.abs(gradient) < 1e-10 ? 0 : tuning.filter((w) => Math.sign(evaluate2(w, minus).brier - evaluate2(w, plus).brier) === Math.sign(gradient)).length / tuning.length;
      let change = inactive || agreement < 0.3 ? 0 : clamp3(
        learningRate * gradient - priorStrength * (current[key] - priors[key]),
        -maxChange,
        maxChange
      );
      change = clamp3(current[key] + change, ...limits) - current[key];
      if (Math.abs(change) > remaining || Math.abs(change) < 1e-3 || inactive) change = 0;
      const suggested = Number((current[key] + change).toFixed(4));
      remaining -= Math.abs(suggested - current[key]);
      return {
        key,
        label: key.replace("weight", ""),
        current: current[key],
        suggested,
        prior: priors[key],
        bounds: limits,
        gradient,
        confidence: agreement,
        confidenceBasis: "window_direction_agreement",
        change: suggested - current[key],
        reason: inactive ? "当前生产管线未使用该权重，不自动调整" : change ? "基于完整预测管道的 Brier 调参建议" : "维持不变"
      };
    });
    const proposed = { ...current, ...Object.fromEntries(suggestions.map((s) => [s.key, s.suggested])) };
    const baseline = evaluate2(holdout, current);
    const candidate = evaluate2(holdout, proposed);
    const accepted = validatesProbabilityUpdate(baseline, candidate);
    return {
      suggestions,
      sampleCount: rows.length,
      minSamples,
      ready: true,
      baseScore: tuneScore(current),
      evaluationBasis: "production_brier_temporal_tuning",
      confidenceBasis: "direction_agreement_not_probability",
      validation: {
        accepted,
        baseline,
        candidate,
        cutoff: holdout.cutoff,
        samples: holdout.testRows.length,
        tuningWindows: tuning.length,
        note: "本次未参与调参的后置检查；不代表长期实盘收益保证"
      },
      lastUpdateAt: adaptive.lastUpdateAt || null,
      updateCount: adaptive.updateCount || 0,
      timeBasis,
      derivedAvailabilityRows
    };
  };
  var learnContextFactors = (investments = getActiveInvestments()) => {
    const settled = getSettledInvestments(investments);
    const matchRows = uniqueMatchRows(settled).map((row) => row.match).filter((m) => typeof m.is_correct === "boolean");
    const minSamplesPerBucket = 5;
    const shrinkageK = 12;
    const modeStats = /* @__PURE__ */ new Map();
    matchRows.forEach((m) => {
      const mode = normalizeMode(m.mode) || "常规";
      if (!modeStats.has(mode)) modeStats.set(mode, { wins: 0, total: 0, confSum: 0 });
      const row = modeStats.get(mode);
      row.total += 1;
      row.confSum += toNumber3(m.conf, 0.5);
      if (m.is_correct === true) row.wins += 1;
    });
    const globalWins = matchRows.filter((m) => m.is_correct === true).length;
    const globalTotal = matchRows.filter((m) => typeof m.is_correct === "boolean").length;
    const globalHitRate = globalTotal > 0 ? globalWins / globalTotal : 0.5;
    const learnedMode = {};
    modeStats.forEach((stats, mode) => {
      if (stats.total < minSamplesPerBucket || globalTotal === 0) {
        learnedMode[mode] = 1;
        return;
      }
      const hitRate = stats.wins / stats.total;
      const avgConf = stats.confSum / stats.total;
      const empiricalFactor = globalHitRate > 0 ? hitRate / globalHitRate : 1;
      const shrink = stats.total / (stats.total + shrinkageK);
      const factor = shrink * empiricalFactor + (1 - shrink) * 1;
      learnedMode[mode] = Number(clamp3(factor, 0.75, 1.3).toFixed(4));
    });
    const tysValues = ["S", "M", "L", "H"];
    const tysStats = /* @__PURE__ */ new Map();
    tysValues.forEach((v) => tysStats.set(v, { wins: 0, total: 0 }));
    matchRows.forEach((m) => {
      const home = m.tys_home || "M";
      const away = m.tys_away || "M";
      [.../* @__PURE__ */ new Set([home, away])].forEach((tys) => {
        const key = tysValues.includes(tys) ? tys : "M";
        const row = tysStats.get(key);
        row.total += 1;
        if (m.is_correct === true) row.wins += 1;
      });
    });
    const learnedTys = {};
    tysStats.forEach((stats, tys) => {
      if (stats.total < minSamplesPerBucket || globalTotal === 0) {
        learnedTys[tys] = 1;
        return;
      }
      const hitRate = stats.wins / stats.total;
      const empiricalFactor = globalHitRate > 0 ? hitRate / globalHitRate : 1;
      const shrink = stats.total / (stats.total + shrinkageK);
      learnedTys[tys] = Number(clamp3(shrink * empiricalFactor + (1 - shrink) * 1, 0.8, 1.2).toFixed(4));
    });
    const fidBuckets = [
      { key: "0", range: [0, 0.12], center: 0 },
      { key: "0.25", range: [0.12, 0.32], center: 0.25 },
      { key: "0.4", range: [0.32, 0.45], center: 0.4 },
      { key: "0.5", range: [0.45, 0.55], center: 0.5 },
      { key: "0.6", range: [0.55, 0.67], center: 0.6 },
      { key: "0.75", range: [0.67, 1], center: 0.75 }
    ];
    const fidStats = /* @__PURE__ */ new Map();
    fidBuckets.forEach((b) => fidStats.set(b.key, { wins: 0, total: 0 }));
    matchRows.forEach((m) => {
      const fid = toNumber3(m.fid, 0.4);
      const bucket = fidBuckets.find((b) => fid >= b.range[0] && fid < b.range[1]) || fidBuckets[2];
      const row = fidStats.get(bucket.key);
      row.total += 1;
      if (m.is_correct === true) row.wins += 1;
    });
    const learnedFid = {};
    fidStats.forEach((stats, key) => {
      if (stats.total < minSamplesPerBucket || globalTotal === 0) {
        learnedFid[key] = 1;
        return;
      }
      const hitRate = stats.wins / stats.total;
      const empiricalFactor = globalHitRate > 0 ? hitRate / globalHitRate : 1;
      const shrink = stats.total / (stats.total + shrinkageK);
      learnedFid[key] = Number(clamp3(shrink * empiricalFactor + (1 - shrink) * 1, 0.8, 1.2).toFixed(4));
    });
    const fseBuckets = [
      { key: "very_low", range: [0, 0.25], center: 0.125 },
      { key: "low", range: [0.25, 0.45], center: 0.35 },
      { key: "mid", range: [0.45, 0.6], center: 0.525 },
      { key: "high", range: [0.6, 0.8], center: 0.7 },
      { key: "very_high", range: [0.8, 1.01], center: 0.9 }
    ];
    const fseStats = /* @__PURE__ */ new Map();
    fseBuckets.forEach((b) => fseStats.set(b.key, { wins: 0, total: 0 }));
    matchRows.forEach((m) => {
      const fseHome = toNumber3(m.fse_home, 0.5);
      const fseAway = toNumber3(m.fse_away, 0.5);
      const fseGeo = Math.sqrt(clamp3(fseHome, 0.05, 1) * clamp3(fseAway, 0.05, 1));
      const bucket = fseBuckets.find((b) => fseGeo >= b.range[0] && fseGeo < b.range[1]) || fseBuckets[2];
      const row = fseStats.get(bucket.key);
      row.total += 1;
      if (m.is_correct === true) row.wins += 1;
    });
    const fseBucketFactors = [];
    fseStats.forEach((stats, key) => {
      const bucket = fseBuckets.find((b) => b.key === key);
      if (stats.total < minSamplesPerBucket || globalTotal === 0) {
        fseBucketFactors.push({ center: bucket.center, factor: 1 });
        return;
      }
      const hitRate = stats.wins / stats.total;
      const empiricalFactor = globalHitRate > 0 ? hitRate / globalHitRate : 1;
      const shrink = stats.total / (stats.total + shrinkageK);
      const factor = clamp3(shrink * empiricalFactor + (1 - shrink) * 1, 0.75, 1.3);
      fseBucketFactors.push({ center: bucket.center, factor: Number(factor.toFixed(4)) });
    });
    fseBucketFactors.sort((a, b) => a.center - b.center);
    const interpolateFseFactor = (fseGeo) => {
      const x = clamp3(fseGeo, 0, 1);
      if (fseBucketFactors.length === 0) return 1;
      if (x <= fseBucketFactors[0].center) return fseBucketFactors[0].factor;
      if (x >= fseBucketFactors[fseBucketFactors.length - 1].center) return fseBucketFactors[fseBucketFactors.length - 1].factor;
      for (let i = 0; i < fseBucketFactors.length - 1; i++) {
        const a = fseBucketFactors[i];
        const b = fseBucketFactors[i + 1];
        if (x >= a.center && x <= b.center) {
          const t = (x - a.center) / (b.center - a.center);
          return a.factor + t * (b.factor - a.factor);
        }
      }
      return 1;
    };
    const totalSamples = globalTotal;
    const reliability = clamp3((totalSamples - 15) / 60, 0, 1);
    return {
      mode: learnedMode,
      tys: learnedTys,
      fid: learnedFid,
      fse: { buckets: fseBucketFactors, interpolate: interpolateFseFactor },
      totalSamples,
      reliability: Number(reliability.toFixed(3)),
      globalHitRate: Number(globalHitRate.toFixed(4))
    };
  };
  var buildIsotonicRegression = (binaryRows = null) => {
    const rows = Array.isArray(binaryRows) ? binaryRows : getBinaryOutcomeRows();
    const fallback = {
      ready: false,
      calibrate: (p) => p,
      nodes: [],
      sampleCount: rows.length,
      reliability: 0
    };
    if (rows.length < 30) return fallback;
    const sorted = [...rows].sort((a, b) => a.conf - b.conf);
    const blocks = [];
    sorted.forEach((r) => {
      const previous = blocks[blocks.length - 1];
      if (previous && previous.high === r.conf) {
        previous.sumY += r.actual;
        previous.sumW += 1;
      } else {
        blocks.push({ sumY: r.actual, sumW: 1, low: r.conf, high: r.conf });
      }
    });
    let i = 0;
    while (i < blocks.length - 1) {
      const valI = blocks[i].sumY / blocks[i].sumW;
      const valJ = blocks[i + 1].sumY / blocks[i + 1].sumW;
      if (valI > valJ) {
        blocks[i].sumY += blocks[i + 1].sumY;
        blocks[i].sumW += blocks[i + 1].sumW;
        blocks[i].high = blocks[i + 1].high;
        blocks.splice(i + 1, 1);
        if (i > 0) i -= 1;
      } else {
        i += 1;
      }
    }
    const nodes = blocks.map((b) => ({
      x: (b.low + b.high) / 2,
      y: clamp3(b.sumY / b.sumW, 0.02, 0.98),
      n: b.sumW
    }));
    const calibrate = (rawP) => {
      const p = clamp3(rawP, 0.02, 0.98);
      if (nodes.length === 0) return p;
      if (p <= nodes[0].x) return nodes[0].y;
      if (p >= nodes[nodes.length - 1].x) return nodes[nodes.length - 1].y;
      for (let j = 0; j < nodes.length - 1; j++) {
        if (p >= nodes[j].x && p <= nodes[j + 1].x) {
          const t = (p - nodes[j].x) / (nodes[j + 1].x - nodes[j].x || 1e-9);
          return clamp3(nodes[j].y + t * (nodes[j + 1].y - nodes[j].y), 0.02, 0.98);
        }
      }
      return p;
    };
    const isoBrier = rows.reduce((sum, r) => {
      const p = calibrate(r.conf);
      return sum + (p - r.actual) ** 2;
    }, 0) / rows.length;
    const rawBrier = rows.reduce((sum, r) => sum + (r.conf - r.actual) ** 2, 0) / rows.length;
    const improvement = rawBrier > 0 ? (rawBrier - isoBrier) / rawBrier : 0;
    return {
      ready: true,
      calibrate,
      nodes,
      sampleCount: rows.length,
      reliability: Number(clamp3((rows.length - 20) / 80, 0, 1).toFixed(3)),
      brierImprovement: Number(improvement.toFixed(4)),
      isoBrier: Number(isoBrier.toFixed(4)),
      rawBrier: Number(rawBrier.toFixed(4))
    };
  };
  var computeWalkForwardFeedback = (precomputedWindows = null, options = {}) => {
    const config = options.config || getSystemConfig2();
    const rows = options.rows || getBinaryOutcomeRows();
    const teamProfiles = options.teamProfiles || getTeamProfiles2();
    const wf = Array.isArray(precomputedWindows) ? precomputedWindows : evaluateBlendWalkForward(rows, config, teamProfiles);
    const fallback = {
      ready: false,
      adjustments: {},
      diagnostics: {},
      sampleCount: rows.length
    };
    if (!Array.isArray(wf) || wf.length === 0) return fallback;
    const avgCalBrier = wf.reduce((s, w) => s + w.calibratedBrier, 0) / wf.length;
    const avgBlendBrier = wf.reduce((s, w) => s + w.blendedBrier, 0) / wf.length;
    const avgMarketBrier = wf.reduce((s, w) => s + w.marketBrier, 0) / wf.length;
    const avgCalRoi = wf.reduce((s, w) => s + w.calibratedRoi, 0) / wf.length;
    const avgBlendRoi = wf.reduce((s, w) => s + w.blendedRoi, 0) / wf.length;
    const avgCalLogLoss = wf.reduce((s, w) => s + w.calibratedLogLoss, 0) / wf.length;
    const avgBlendLogLoss = wf.reduce((s, w) => s + w.blendedLogLoss, 0) / wf.length;
    const calBetterThanMarket = avgCalBrier < avgMarketBrier;
    const blendBetterThanCal = avgBlendBrier < avgCalBrier;
    const brierQuality = avgBlendBrier < 0.22 ? "good" : avgBlendBrier < 0.26 ? "fair" : "poor";
    const currentKelly = toNumber3(config.kellyDivisor, 4);
    let suggestedKelly = currentKelly;
    if (brierQuality === "poor") {
      suggestedKelly = clamp3(currentKelly * 1.15, 3, 12);
    } else if (brierQuality === "good" && avgBlendRoi > 0) {
      suggestedKelly = clamp3(currentKelly * 0.92, 2, 8);
    }
    const currentOddsWeight = toNumber3(config.weightOdds, 0.06);
    let suggestedOddsWeight = currentOddsWeight;
    if (blendBetterThanCal && avgBlendBrier < avgCalBrier * 0.96) {
      suggestedOddsWeight = clamp3(currentOddsWeight + 0.015, 0.02, 0.2);
    } else if (!blendBetterThanCal && avgCalBrier < avgBlendBrier * 0.96) {
      suggestedOddsWeight = clamp3(currentOddsWeight - 0.015, 0.02, 0.2);
    }
    const recentRows = rows.slice(-Math.min(40, Math.floor(rows.length * 0.3)));
    const highConfRows = recentRows.filter((r) => r.conf >= 0.7);
    const lowConfRows = recentRows.filter((r) => r.conf < 0.4);
    const highConfHitRate = highConfRows.length > 5 ? highConfRows.filter((r) => r.actual === 1).length / highConfRows.length : null;
    const lowConfHitRate = lowConfRows.length > 5 ? lowConfRows.filter((r) => r.actual === 1).length / lowConfRows.length : null;
    let tierAdjustment = 0;
    if (highConfHitRate !== null && highConfHitRate < 0.55) {
      tierAdjustment = 0.03;
    } else if (highConfHitRate !== null && highConfHitRate > 0.75) {
      tierAdjustment = -0.02;
    }
    return {
      ready: true,
      adjustments: {
        kellyDivisor: Number(suggestedKelly.toFixed(2)),
        kellyDelta: Number((suggestedKelly - currentKelly).toFixed(2)),
        oddsWeight: Number(suggestedOddsWeight.toFixed(4)),
        oddsWeightDelta: Number((suggestedOddsWeight - currentOddsWeight).toFixed(4)),
        tierShift: Number(tierAdjustment.toFixed(3))
      },
      diagnostics: {
        brierQuality,
        avgCalBrier: Number(avgCalBrier.toFixed(4)),
        avgBlendBrier: Number(avgBlendBrier.toFixed(4)),
        avgMarketBrier: Number(avgMarketBrier.toFixed(4)),
        avgCalLogLoss: Number(avgCalLogLoss.toFixed(4)),
        avgBlendLogLoss: Number(avgBlendLogLoss.toFixed(4)),
        avgCalRoi: Number(avgCalRoi.toFixed(2)),
        avgBlendRoi: Number(avgBlendRoi.toFixed(2)),
        calBetterThanMarket,
        blendBetterThanCal,
        highConfHitRate: highConfHitRate !== null ? Number(highConfHitRate.toFixed(3)) : null,
        lowConfHitRate: lowConfHitRate !== null ? Number(lowConfHitRate.toFixed(3)) : null,
        walkForwardWindows: wf.length
      },
      sampleCount: rows.length
    };
  };
  var buildEntryCorrelationMatrix = (investments = getActiveInvestments()) => {
    const settled = getSettledInvestments(investments);
    const fallback = {
      ready: false,
      getCorrelation: () => ({ rho: 0, samples: 0, reliability: 0 }),
      pairs: [],
      avgCorrelation: 0,
      sampleCount: 0
    };
    const combos = settled.filter((inv) => {
      const matches = Array.isArray(inv.matches) ? inv.matches : [];
      return matches.length >= 2 && matches.every((m) => typeof m.is_correct === "boolean");
    }).map((inv) => inv.matches.map((m) => ({
      key: `${m.home_team || "-"} vs ${m.away_team || "-"}`,
      identity: getSelectionIdentityKey(m, inv.id),
      eventKey: m.event_id ? `event:${m.event_id}` : "",
      entryType: m.entry_market_type || "other",
      isCorrect: m.is_correct === true,
      odds: toNumber3(m.odds, 2),
      conf: toNumber3(m.conf, 0.5)
    })));
    if (combos.length < 8) return fallback;
    const pairStats = /* @__PURE__ */ new Map();
    const seenEventPairs = /* @__PURE__ */ new Set();
    combos.forEach((legs) => {
      for (let i = 0; i < legs.length; i++) {
        for (let j = i + 1; j < legs.length; j++) {
          const [a, b] = [legs[i], legs[j]].sort((left, right) => left.entryType < right.entryType ? -1 : left.entryType > right.entryType ? 1 : 0);
          if (a.eventKey && a.eventKey === b.eventKey) continue;
          const evidenceKey = a.identity && b.identity ? JSON.stringify([a.identity, b.identity].sort()) : "";
          if (evidenceKey && seenEventPairs.has(evidenceKey)) continue;
          if (evidenceKey) seenEventPairs.add(evidenceKey);
          const pairKey = [a.entryType, b.entryType].join("|");
          if (!pairStats.has(pairKey)) {
            pairStats.set(pairKey, { key: pairKey, n: 0, bothWin: 0, aWin: 0, bWin: 0, sumAConf: 0, sumBConf: 0 });
          }
          const pair = pairStats.get(pairKey);
          pair.n += 1;
          if (a.entryType === b.entryType) {
            const marginalWins = (Number(a.isCorrect) + Number(b.isCorrect)) / 2;
            const marginalConf = (a.conf + b.conf) / 2;
            pair.aWin += marginalWins;
            pair.bWin += marginalWins;
            pair.sumAConf += marginalConf;
            pair.sumBConf += marginalConf;
          } else {
            pair.sumAConf += a.conf;
            pair.sumBConf += b.conf;
            if (a.isCorrect) pair.aWin += 1;
            if (b.isCorrect) pair.bWin += 1;
          }
          if (a.isCorrect && b.isCorrect) pair.bothWin += 1;
        }
      }
    });
    const pairsWithCorrelation = [];
    pairStats.forEach((pair) => {
      if (pair.n < 5) return;
      const pA = pair.aWin / pair.n;
      const pB = pair.bWin / pair.n;
      const pAB = pair.bothWin / pair.n;
      const independent = pA * pB;
      const denom = Math.sqrt(pA * (1 - pA) * pB * (1 - pB));
      if (denom <= 1e-3) return;
      const rho = (pAB - independent) / denom;
      const shrinkage = pair.n / (pair.n + 10);
      const shrunkRho = shrinkage * rho;
      pairsWithCorrelation.push({
        key: pair.key,
        rho: Number(clamp3(shrunkRho, -0.5, 0.5).toFixed(4)),
        rawRho: Number(rho.toFixed(4)),
        samples: pair.n,
        reliability: Number(clamp3((pair.n - 5) / 20, 0, 1).toFixed(3)),
        pA: Number(pA.toFixed(3)),
        pB: Number(pB.toFixed(3)),
        pAB: Number(pAB.toFixed(3))
      });
    });
    const correlationMap = /* @__PURE__ */ new Map();
    pairsWithCorrelation.forEach((p) => correlationMap.set(p.key, p));
    const getCorrelation = (entryTypeA, entryTypeB) => {
      const key = [entryTypeA, entryTypeB].sort().join("|");
      return correlationMap.get(key) || { rho: 0, samples: 0, reliability: 0 };
    };
    const avgCorrelation = pairsWithCorrelation.length > 0 ? pairsWithCorrelation.reduce((s, p) => s + p.rho * p.samples, 0) / pairsWithCorrelation.reduce((s, p) => s + p.samples, 0) : 0;
    return {
      ready: pairsWithCorrelation.length > 0,
      getCorrelation,
      pairs: pairsWithCorrelation.sort((a, b) => Math.abs(b.rho) - Math.abs(a.rho)),
      avgCorrelation: Number(avgCorrelation.toFixed(4)),
      sampleCount: combos.length
    };
  };
  var buildComboRetrospective = (planHistory) => {
    const fallback = {
      ready: false,
      reliability: 0,
      epochCount: 0,
      layerHitRates: { core: null, satellite: null, covering: null, moonshot: null },
      surplusMissRate: null,
      optimalLegsQuotaShift: {},
      anchorSuccessRate: null,
      stratifiedQuotaAdj: {},
      surplusBonusAdj: 0,
      anchorBonusAdj: 0
    };
    if (!Array.isArray(planHistory) || planHistory.length === 0) return fallback;
    const settled = getSettledInvestments(getActiveInvestments());
    const resolveSelection = buildSettledSelectionResolver(settled);
    const resolveLeg = (leg) => {
      const result = resolveSelection(leg);
      return typeof result?.isCorrect === "boolean" ? result : null;
    };
    const layerStats = { core: { hit: 0, total: 0 }, satellite: { hit: 0, total: 0 }, covering: { hit: 0, total: 0 }, moonshot: { hit: 0, total: 0 } };
    const legsHitMap = {};
    let anchorHits = 0;
    let anchorTotal = 0;
    let surplusMissHits = 0;
    let surplusMissTotal = 0;
    let epochsWithData = 0;
    const seenCombos = /* @__PURE__ */ new Set();
    const seenAnchors = /* @__PURE__ */ new Set();
    const seenSurplus = /* @__PURE__ */ new Set();
    const evidenceEvents = /* @__PURE__ */ new Set();
    const FT_LAYER_ALIAS = { "主推": "core", "次推": "satellite", "博冷": "moonshot" };
    planHistory.forEach((epoch) => {
      const recs = Array.isArray(epoch.recommendations) ? epoch.recommendations : [];
      if (recs.length === 0) return;
      let hasSettledMatch = false;
      recs.forEach((rec) => {
        const subset = Array.isArray(rec.subset) ? rec.subset : [];
        subset.forEach((leg) => {
          if (resolveLeg(leg)) hasSettledMatch = true;
        });
      });
      if (!hasSettledMatch) return;
      let newEvidence = false;
      recs.forEach((rec) => {
        const subset = Array.isArray(rec.subset) ? rec.subset : [];
        const legs = subset.length;
        const ftTag = rec.explain?.ftLayerTag || FT_LAYER_ALIAS[rec.layer] || null;
        const layerKey = ftTag && layerStats[ftTag] ? ftTag : null;
        const legResults = subset.map(resolveLeg);
        const allSettled = legResults.length > 0 && legResults.every((r) => r != null);
        if (!allSettled) return;
        const signature = JSON.stringify(subset.map((leg) => getSelectionIdentityKey(leg)).sort());
        if (seenCombos.has(signature)) return;
        seenCombos.add(signature);
        legResults.forEach(({ match, investment }) => {
          const key = matchEventKey(match, investment.id);
          if (key) evidenceEvents.add(key);
        });
        newEvidence = true;
        const comboHit = legResults.every((r) => r.isCorrect);
        if (layerKey) {
          layerStats[layerKey].total += 1;
          if (comboHit) layerStats[layerKey].hit += 1;
        }
        const lk = String(legs);
        if (!legsHitMap[lk]) legsHitMap[lk] = { hit: 0, total: 0 };
        legsHitMap[lk].total += 1;
        if (comboHit) legsHitMap[lk].hit += 1;
        if (subset.length > 0) {
          const anchor = [...subset].sort((a, b) => (b.conf || 0) - (a.conf || 0))[0];
          const anchorResult = resolveLeg(anchor);
          const anchorKey = getSelectionIdentityKey(anchor);
          if (anchorResult && !seenAnchors.has(anchorKey)) {
            seenAnchors.add(anchorKey);
            anchorTotal += 1;
            if (anchorResult.isCorrect) anchorHits += 1;
          }
        }
      });
      const recommendedMatchKeys = /* @__PURE__ */ new Set();
      recs.forEach((rec) => {
        const subset = Array.isArray(rec.subset) ? rec.subset : [];
        subset.forEach((leg) => {
          const key = getSelectionIdentityKey(leg);
          if (key) recommendedMatchKeys.add(key);
        });
      });
      const candidateKeys = epoch.candidateMatchKeys || [];
      candidateKeys.forEach((candidateKey) => {
        if (typeof candidateKey !== "object") return;
        const mk = getSelectionIdentityKey(candidateKey);
        const surplus = toNumber3(candidateKey.surplus, 0);
        if (!mk || surplus < 0.08 || recommendedMatchKeys.has(mk) || seenSurplus.has(mk)) return;
        const result = resolveLeg(candidateKey);
        if (!result) return;
        seenSurplus.add(mk);
        surplusMissTotal += 1;
        if (result.isCorrect) surplusMissHits += 1;
      });
      if (newEvidence) epochsWithData += 1;
    });
    if (epochsWithData < 1) return fallback;
    const reliability = clamp3((evidenceEvents.size - 1) / 9, 0, 1);
    const layerHitRates = {};
    for (const [key, stats] of Object.entries(layerStats)) {
      layerHitRates[key] = stats.total >= 2 ? Number((stats.hit / stats.total).toFixed(3)) : null;
    }
    const totalComboHits = Object.values(legsHitMap).reduce((s, v) => s + v.hit, 0);
    const totalCombos = Object.values(legsHitMap).reduce((s, v) => s + v.total, 0);
    const globalHitRate = totalCombos > 0 ? totalComboHits / totalCombos : 0;
    const stratifiedQuotaAdj = {};
    for (const [legs, stats] of Object.entries(legsHitMap)) {
      if (stats.total < 3) continue;
      const legHitRate = stats.hit / stats.total;
      const delta = legHitRate - globalHitRate;
      stratifiedQuotaAdj[legs] = Number((delta * reliability * 0.15).toFixed(4));
    }
    const surplusMissRate = surplusMissTotal >= 2 ? Number((surplusMissHits / surplusMissTotal).toFixed(3)) : null;
    const surplusBonusAdj = surplusMissRate !== null ? Number((clamp3(surplusMissRate - 0.4, -0.1, 0.2) * reliability * 0.08).toFixed(4)) : 0;
    const anchorSuccessRate = anchorTotal >= 3 ? Number((anchorHits / anchorTotal).toFixed(3)) : null;
    const anchorBonusAdj = anchorSuccessRate !== null ? Number((clamp3(anchorSuccessRate - 0.65, -0.15, 0.1) * reliability * 0.06).toFixed(4)) : 0;
    return {
      ready: true,
      reliability: Number(reliability.toFixed(3)),
      epochCount: epochsWithData,
      uniqueEventCount: evidenceEvents.size,
      reliabilityBasis: "unique_events_not_generated_plans",
      layerHitRates,
      legsHitMap,
      globalComboHitRate: Number(globalHitRate.toFixed(3)),
      surplusMissRate,
      anchorSuccessRate,
      stratifiedQuotaAdj,
      surplusBonusAdj,
      anchorBonusAdj
    };
  };
  var getPerMatchEjrSnapshot = () => {
    const settled = getSettledInvestments(getActiveInvestments());
    const matchRows = settled.flatMap(
      (item) => splitInvestmentToMatches(item).map((match, idx) => {
        const ejr = toNumber3(match.conf, Number.NaN);
        const ajr = toNumber3(match.match_rating, Number.NaN);
        const normalizedAjr = normalizeAjrForModel(ajr, Number.NaN);
        const odds = toNumber3(match.odds, Number.NaN);
        return {
          id: `${item.id}-m${idx}`,
          investmentId: item.id,
          date: item.created_at,
          homeTeam: match.home_team || "-",
          awayTeam: match.away_team || "-",
          entry: match.entry_text || "-",
          mode: normalizeMode(match.mode) || "常规",
          fid: toNumber3(match.fid, 0.4),
          tys: `${match.tys_home || "M"}/${match.tys_away || "M"}`,
          fseGeo: Number(Math.sqrt(clamp3(toNumber3(match.fse_home, 0.5), 0.05, 1) * clamp3(toNumber3(match.fse_away, 0.5), 0.05, 1)).toFixed(3)),
          ejr: Number.isFinite(ejr) ? Number(ejr.toFixed(3)) : null,
          ajr: Number.isFinite(ajr) ? Number(ajr.toFixed(3)) : null,
          normalizedAjr: Number.isFinite(normalizedAjr) ? normalizedAjr : null,
          odds: Number.isFinite(odds) ? Number(odds.toFixed(2)) : null,
          delta: Number.isFinite(ejr) && Number.isFinite(normalizedAjr) ? Number((normalizedAjr - ejr).toFixed(3)) : null,
          isCorrect: match.is_correct
        };
      })
    ).filter((r) => r.ejr !== null);
    const withAjr = matchRows.filter((r) => r.ajr !== null);
    const deltas = withAjr.map((r) => r.delta);
    const meanDelta = deltas.length > 0 ? deltas.reduce((s, d) => s + d, 0) / deltas.length : 0;
    const maeScore = deltas.length > 0 ? deltas.reduce((s, d) => s + Math.abs(d), 0) / deltas.length : 0;
    const rmse = deltas.length > 0 ? Math.sqrt(deltas.reduce((s, d) => s + d * d, 0) / deltas.length) : 0;
    const modeAccuracy = /* @__PURE__ */ new Map();
    withAjr.forEach((r) => {
      if (!modeAccuracy.has(r.mode)) modeAccuracy.set(r.mode, { n: 0, absDeltaSum: 0, deltaSum: 0 });
      const row = modeAccuracy.get(r.mode);
      row.n += 1;
      row.absDeltaSum += Math.abs(r.delta);
      row.deltaSum += r.delta;
    });
    const perModeAccuracy = [...modeAccuracy.entries()].map(([mode, stats]) => ({
      mode,
      samples: stats.n,
      mae: Number((stats.absDeltaSum / stats.n).toFixed(3)),
      bias: Number((stats.deltaSum / stats.n).toFixed(3))
    })).sort((a, b) => b.samples - a.samples);
    return {
      matches: matchRows,
      metricBasis: "normalized_AJR_minus_raw_Conf_judgment_residual_not_probability_error",
      totalMatches: matchRows.length,
      matchesWithAjr: withAjr.length,
      calibrationStats: {
        basis: "judgment_scale_0_to_1_not_hit_probability_calibration",
        meanDelta: Number(meanDelta.toFixed(4)),
        mae: Number(maeScore.toFixed(4)),
        rmse: Number(rmse.toFixed(4))
      },
      perModeAccuracy
    };
  };
  var evaluateComboTemporalHoldoutQuality = (rows, surplusThresholds, vigOverround) => {
    if (!Array.isArray(rows) || rows.length < PREQUENTIAL_MIN_TEST_MATCHES) {
      return { quality: null, strongHitRate: null, negativeHitRate: null, samples: 0 };
    }
    const groups = {
      strong: { hits: 0, total: 0 },
      moderate: { hits: 0, total: 0 },
      neutral: { hits: 0, total: 0 },
      negative: { hits: 0, total: 0 }
    };
    rows.forEach((row) => {
      if (!Number.isFinite(row?.odds) || row.odds <= 1 || !Number.isFinite(row.conf) || row.actual !== 0 && row.actual !== 1) return;
      const implied = clamp3(1 / row.odds * (1 - vigOverround), 0.02, 0.98);
      const surplus = row.conf - implied;
      let bucket = "negative";
      if (surplus >= surplusThresholds.strongEdge) bucket = "strong";
      else if (surplus >= surplusThresholds.moderateEdge) bucket = "moderate";
      else if (surplus >= surplusThresholds.neutral) bucket = "neutral";
      groups[bucket].total += 1;
      if (row.actual === 1) groups[bucket].hits += 1;
    });
    const hitRate = (name) => {
      const g = groups[name];
      return g.total > 0 ? g.hits / g.total : null;
    };
    const strongHitRate = hitRate("strong");
    const negativeHitRate = hitRate("negative");
    const moderateHitRate = hitRate("moderate");
    const neutralHitRate = hitRate("neutral");
    const overallHits = Object.values(groups).reduce((sum, g) => sum + g.hits, 0);
    const overallTotal = Object.values(groups).reduce((sum, g) => sum + g.total, 0);
    if (overallTotal < PREQUENTIAL_MIN_TEST_MATCHES) {
      return { quality: null, strongHitRate: null, negativeHitRate: null, samples: 0 };
    }
    const overallHitRate = overallTotal > 0 ? overallHits / overallTotal : 0.5;
    const strongDelta = strongHitRate != null ? strongHitRate - overallHitRate : 0;
    const negDelta = negativeHitRate != null ? overallHitRate - negativeHitRate : 0;
    const modDelta = moderateHitRate != null && neutralHitRate != null ? moderateHitRate - neutralHitRate : 0;
    const separation = strongDelta + negDelta + modDelta * 0.45;
    const quality = clamp3(0.72 + separation * 1.55, 0.58, 1.08);
    return {
      quality: Number(quality.toFixed(4)),
      strongHitRate: strongHitRate != null ? Number(strongHitRate.toFixed(4)) : null,
      negativeHitRate: negativeHitRate != null ? Number(negativeHitRate.toFixed(4)) : null,
      samples: overallTotal
    };
  };
  var deriveComboSurplusProfile = (rows, reliability = 1) => {
    const safeReliability = clamp3(Number(reliability) || 0, 0, 1);
    const oddsValues = Array.isArray(rows) ? rows.map((r) => r?.odds).filter((o) => Number.isFinite(o) && o > 1) : [];
    const avgImplied = oddsValues.length > 3 ? oddsValues.reduce((sum, odds) => sum + 1 / odds, 0) / oddsValues.length : 0.5;
    const estimatedVig = clamp3(2 * (avgImplied - 0.48), 0.02, 0.12);
    const vigOverround = safeReliability > 0.3 ? estimatedVig : 0.05;
    const surplusBuckets = [
      { min: 0.1, hits: 0, total: 0 },
      { min: 0.03, hits: 0, total: 0 },
      { min: -0.04, hits: 0, total: 0 },
      { min: -Infinity, hits: 0, total: 0 }
    ];
    (rows || []).forEach((row) => {
      if (!Number.isFinite(row?.odds) || row.odds <= 1) return;
      const implied = clamp3(1 / row.odds * (1 - vigOverround), 0.02, 0.98);
      const surplus = row.conf - implied;
      const bucket = surplusBuckets.find((item) => surplus >= item.min) || surplusBuckets[surplusBuckets.length - 1];
      bucket.total += 1;
      if (row.actual === 1) bucket.hits += 1;
    });
    const surplusHRs = surplusBuckets.map((bucket) => bucket.total >= 5 ? bucket.hits / bucket.total : null);
    const strongEdge = surplusHRs[0] !== null && surplusHRs[0] > 0.55 ? clamp3(surplusBuckets[0].min - 0.02, 0.06, 0.2) : 0.12;
    const moderateEdge = surplusHRs[1] !== null && surplusHRs[1] > 0.45 ? clamp3(surplusBuckets[1].min - 0.01, 0.01, 0.1) : 0.04;
    const neutralEdge = surplusHRs[2] !== null ? clamp3(surplusBuckets[2].min + 0.01, -0.08, 0) : -0.03;
    return {
      vigOverround,
      strongEdge,
      moderateEdge,
      neutralEdge
    };
  };
  var evaluateComboPrequentialQuality = (rows) => {
    const windows = buildPrequentialWalkForwardWindows(rows, {
      minRows: 35,
      minTrain: 25,
      minTest: PREQUENTIAL_MIN_TEST_MATCHES,
      step: PREQUENTIAL_STEP_MATCHES,
      initialTrain: 25
    });
    if (!Array.isArray(windows) || windows.length === 0) {
      return {
        enabled: false,
        windowCount: 0,
        quality: null,
        strongHitRate: null,
        negativeHitRate: null,
        samples: 0
      };
    }
    let weightedQuality = 0;
    let weightedStrongHitRate = 0;
    let weightedNegativeHitRate = 0;
    let qualityWeight = 0;
    let strongWeight = 0;
    let negativeWeight = 0;
    let evaluatedWindows = 0;
    windows.forEach((window2) => {
      const localReliability = clamp3((window2.trainRows.length - 25) / 95, 0, 1);
      const localProfile = deriveComboSurplusProfile(window2.trainRows, localReliability);
      const evalRow = evaluateComboTemporalHoldoutQuality(
        window2.testRows,
        {
          strongEdge: localProfile.strongEdge,
          moderateEdge: localProfile.moderateEdge,
          neutral: localProfile.neutralEdge
        },
        localProfile.vigOverround
      );
      if (evalRow.samples <= 0 || !Number.isFinite(evalRow.quality)) return;
      evaluatedWindows += 1;
      const weight2 = evalRow.samples;
      weightedQuality += evalRow.quality * weight2;
      qualityWeight += weight2;
      if (Number.isFinite(evalRow.strongHitRate)) {
        weightedStrongHitRate += evalRow.strongHitRate * weight2;
        strongWeight += weight2;
      }
      if (Number.isFinite(evalRow.negativeHitRate)) {
        weightedNegativeHitRate += evalRow.negativeHitRate * weight2;
        negativeWeight += weight2;
      }
    });
    return {
      enabled: qualityWeight > 0,
      windowCount: evaluatedWindows,
      quality: qualityWeight > 0 ? Number((weightedQuality / qualityWeight).toFixed(4)) : null,
      strongHitRate: strongWeight > 0 ? Number((weightedStrongHitRate / strongWeight).toFixed(4)) : null,
      negativeHitRate: negativeWeight > 0 ? Number((weightedNegativeHitRate / negativeWeight).toFixed(4)) : null,
      samples: qualityWeight
    };
  };
  var backtestComboHyperparams = () => {
    const settled = getSettledInvestments(getActiveInvestments()).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const config = getSystemConfig2();
    const matchRows = settled.flatMap((item) => splitInvestmentToMatches(item));
    const binaryRows = getBinaryOutcomeRows();
    const totalSampleCount = binaryRows.length;
    const fallback = {
      ready: false,
      reliability: 0,
      sampleCount: totalSampleCount,
      // All defaults — consumed when insufficient data
      portfolioWeights: { ev: 0.35, coverage: 0.3, diversity: 0.2, layerDiv: 0.1, tierDiv: 0.05 },
      stratifiedQuotas: { 1: 0, 2: 0.2, 3: 0.35, 4: 0.3, 5: 0.15 },
      surplusThresholds: { strongEdge: 0.12, moderateEdge: 0.04, neutral: -0.03 },
      surplusBonusScale: 0.15,
      surplusBonusMaxThreshold: 0.12,
      surplusBonusMaxBonus: 0.03,
      mmrConcentrationBase: 0.18,
      mmrConcentrationEtaScale: 0.08,
      mmrAnchorSharePenalty: 0.12,
      vigOverround: 0.05,
      roleCoefficients: { tilt: 0.62, diversity: 0.44, synergy: 0.48, gap: -0.78 },
      coverageDecayBase: 0.6,
      coverageDecayBoost: 0.08,
      softPenaltyScales: { evGapBase: 1.15, evGapAlpha: 0.55, winGapBase: 0.85, winGapAlpha: 0.45, corrGapBase: 0.72, corrGapAlpha: 0.28 },
      familyBonusBaseline: 0.5,
      familyBonusScale: 0.04,
      hardConstraintPenalty: 0.5,
      teamBiasMagnitude: 0.12,
      correlationFormula: { base: 0.1, overlapWeight: 0.58, jaccardWeight: 0.24 },
      portfolioOptimizer: { diversPenaltyBase: 0.03, diversPenaltyRiskScale: 0.16, learningRate: 0.16, iterations: 180 },
      recencyWeights: { recent: 1.4, mid: 1.15, base: 1 },
      repWeights: { low: 1.15, medium: 1, high: 0.78 },
      matchConcentrationCap: 0.6,
      entryCorrelationScale: 0.04
    };
    if (totalSampleCount < 25) return fallback;
    const calibrationBinaryRows = binaryRows;
    const calibrationSettled = settled;
    const calibrationMatchRows = matchRows;
    const n = calibrationBinaryRows.length;
    if (n < 25) return fallback;
    const baseReliability = clamp3((n - 25) / 95, 0, 1);
    const surplusProfile = deriveComboSurplusProfile(calibrationBinaryRows, baseReliability);
    const vigOverround = surplusProfile.vigOverround;
    const strongEdge = surplusProfile.strongEdge;
    const moderateEdge = surplusProfile.moderateEdge;
    const neutralEdge = surplusProfile.neutralEdge;
    const prequentialQuality = evaluateComboPrequentialQuality(calibrationBinaryRows);
    const surplusOutcomes = calibrationBinaryRows.filter((r) => Number.isFinite(r.odds) && r.odds > 1).map((r) => ({
      surplus: r.conf - clamp3(1 / r.odds * (1 - vigOverround), 0.02, 0.98),
      hit: r.actual
    }));
    let surplusBonusScale = 0.15;
    if (surplusOutcomes.length >= 20) {
      const meanS = surplusOutcomes.reduce((s, r) => s + r.surplus, 0) / surplusOutcomes.length;
      const meanH = surplusOutcomes.reduce((s, r) => s + r.hit, 0) / surplusOutcomes.length;
      let covSH = 0, varS = 0;
      surplusOutcomes.forEach((r) => {
        covSH += (r.surplus - meanS) * (r.hit - meanH);
        varS += (r.surplus - meanS) ** 2;
      });
      const surplusBeta = varS > 1e-4 ? covSH / varS : 0;
      surplusBonusScale = clamp3(surplusBeta * 0.5, 0.05, 0.3);
    }
    const legPerformance = /* @__PURE__ */ new Map();
    calibrationSettled.forEach((inv) => {
      const legs = (inv.matches || []).length;
      if (legs < 1 || legs > 5) return;
      if (!legPerformance.has(legs)) legPerformance.set(legs, { hits: 0, total: 0, profit: 0, input: 0 });
      const row = legPerformance.get(legs);
      row.total += 1;
      if (inv.status === "win") row.hits += 1;
      row.profit += toNumber3(inv.profit, 0);
      row.input += Math.max(0, toNumber3(inv.inputs, 0));
    });
    const defaultQuotas = { 1: 0, 2: 0.2, 3: 0.35, 4: 0.3, 5: 0.15 };
    const stratifiedQuotas = { ...defaultQuotas };
    if (legPerformance.size >= 2) {
      const legScores = /* @__PURE__ */ new Map();
      let totalScore = 0;
      legPerformance.forEach((perf, legs) => {
        if (perf.total < 3 || legs < 2) return;
        const roi = perf.input > 0 ? perf.profit / perf.input : 0;
        const score = Math.max(0, (roi + 0.5) * Math.sqrt(perf.total));
        legScores.set(legs, score);
        totalScore += score;
      });
      if (totalScore > 0 && legScores.size >= 2) {
        legScores.forEach((score, legs) => {
          const dataDriven = score / totalScore;
          const blended = dataDriven * baseReliability * 0.5 + (defaultQuotas[legs] || 0.1) * (1 - baseReliability * 0.5);
          stratifiedQuotas[legs] = Number(clamp3(blended, 0.02, 0.6).toFixed(3));
        });
      }
    }
    const matchFrequency = /* @__PURE__ */ new Map();
    calibrationMatchRows.forEach((m) => {
      const key = `${m.home_team}-${m.away_team}`;
      if (!matchFrequency.has(key)) matchFrequency.set(key, { total: 0, hits: 0 });
      const row = matchFrequency.get(key);
      row.total += 1;
      if (m.is_correct === true) row.hits += 1;
    });
    const freqEntries = [...matchFrequency.values()].filter((v) => v.total >= 2);
    const avgFreqHR = freqEntries.length > 3 ? freqEntries.reduce((s, v) => s + v.hits / v.total, 0) / freqEntries.length : 0.5;
    const mmrConcentrationBase = clamp3(0.18 + (0.5 - avgFreqHR) * 0.2, 0.1, 0.28);
    const mmrAnchorSharePenalty = clamp3(0.12 + (0.5 - avgFreqHR) * 0.15, 0.06, 0.22);
    const roleAnalysis = { highP: { hits: 0, total: 0 }, highOdds: { hits: 0, total: 0 }, mid: { hits: 0, total: 0 } };
    calibrationBinaryRows.forEach((r) => {
      if (r.conf >= 0.58) {
        roleAnalysis.highP.total++;
        if (r.actual === 1) roleAnalysis.highP.hits++;
      } else if (Number.isFinite(r.odds) && r.odds >= 2.55) {
        roleAnalysis.highOdds.total++;
        if (r.actual === 1) roleAnalysis.highOdds.hits++;
      } else {
        roleAnalysis.mid.total++;
        if (r.actual === 1) roleAnalysis.mid.hits++;
      }
    });
    const stableHR = roleAnalysis.highP.total >= 5 ? roleAnalysis.highP.hits / roleAnalysis.highP.total : 0.6;
    const leverHR = roleAnalysis.highOdds.total >= 5 ? roleAnalysis.highOdds.hits / roleAnalysis.highOdds.total : 0.35;
    const roleCoefficients = {
      tilt: clamp3(stableHR * 0.8, 0.35, 0.85),
      diversity: clamp3(0.44 + (leverHR - 0.35) * 0.5, 0.25, 0.65),
      synergy: clamp3(Math.sqrt(stableHR * leverHR) * 1.2, 0.25, 0.7),
      gap: clamp3(-0.78 + (1 - stableHR) * 0.3, -1, -0.45)
    };
    const portfolioWeights = { ev: 0.35, coverage: 0.3, diversity: 0.2, layerDiv: 0.1, tierDiv: 0.05 };
    if (n >= 40) {
      const highConfHR = calibrationBinaryRows.filter((r) => r.conf >= 0.6);
      const hrMetric = highConfHR.length >= 10 ? highConfHR.filter((r) => r.actual === 1).length / highConfHR.length : 0.5;
      portfolioWeights.ev = clamp3(0.25 + hrMetric * 0.2, 0.2, 0.5);
      portfolioWeights.diversity = clamp3(0.3 - hrMetric * 0.15, 0.1, 0.35);
      const remaining = 1 - portfolioWeights.ev - portfolioWeights.diversity;
      portfolioWeights.coverage = Number((remaining * 0.55).toFixed(3));
      portfolioWeights.layerDiv = Number((remaining * 0.25).toFixed(3));
      portfolioWeights.tierDiv = Number((remaining * 0.2).toFixed(3));
    }
    let calibratedRecencyWeights = { ...fallback.recencyWeights };
    if (n >= 40) {
      const cutoff = Math.floor(n * 0.3);
      const recentBrier = calibrationBinaryRows.slice(-cutoff).reduce((s, r) => s + (r.conf - r.actual) ** 2, 0) / cutoff;
      const oldBrier = calibrationBinaryRows.slice(0, cutoff).reduce((s, r) => s + (r.conf - r.actual) ** 2, 0) / cutoff;
      const brierRatio = oldBrier > 1e-3 ? recentBrier / oldBrier : 1;
      calibratedRecencyWeights = {
        recent: clamp3(1.4 + (1 - brierRatio) * 0.4, 1.1, 1.8),
        mid: clamp3(1.15 + (1 - brierRatio) * 0.15, 1, 1.35),
        base: 1
      };
    }
    const repBucketPerf = { low: { hits: 0, total: 0 }, mid: { hits: 0, total: 0 }, high: { hits: 0, total: 0 } };
    calibrationBinaryRows.forEach((r) => {
      const rep = Number.isFinite(r.rep) ? r.rep : 0.5;
      const bucket = rep <= 0.4 ? "low" : rep <= 0.8 ? "mid" : "high";
      repBucketPerf[bucket].total += 1;
      if (r.actual === 1) repBucketPerf[bucket].hits += 1;
    });
    const repHRs = {
      low: repBucketPerf.low.total >= 5 ? repBucketPerf.low.hits / repBucketPerf.low.total : 0.5,
      mid: repBucketPerf.mid.total >= 5 ? repBucketPerf.mid.hits / repBucketPerf.mid.total : 0.5,
      high: repBucketPerf.high.total >= 5 ? repBucketPerf.high.hits / repBucketPerf.high.total : 0.5
    };
    const repWeights = {
      low: clamp3(1 + (repHRs.low - 0.5) * 0.5, 0.85, 1.35),
      medium: 1,
      high: clamp3(1 - (repHRs.low - repHRs.high) * 0.4, 0.55, 1)
    };
    const overallBrier = n > 0 ? calibrationBinaryRows.reduce((s, r) => s + (r.conf - r.actual) ** 2, 0) / n : 0.25;
    const softPenaltyScales = {
      evGapBase: clamp3(1.15 + (overallBrier - 0.22) * 2, 0.8, 1.8),
      evGapAlpha: clamp3(0.55 + (overallBrier - 0.22) * 1.5, 0.3, 0.9),
      winGapBase: clamp3(0.85 + (overallBrier - 0.22) * 1.5, 0.5, 1.4),
      winGapAlpha: clamp3(0.45 + (overallBrier - 0.22) * 1, 0.2, 0.7),
      corrGapBase: clamp3(0.72 + (overallBrier - 0.22) * 1, 0.4, 1.1),
      corrGapAlpha: clamp3(0.28 + (overallBrier - 0.22) * 0.5, 0.15, 0.5)
    };
    const coverageDecayBase = clamp3(0.6 - (overallBrier - 0.22) * 0.5, 0.35, 0.8);
    const coverageDecayBoost = clamp3(0.08 + (overallBrier - 0.22) * 0.1, 0.04, 0.16);
    const portfolioOptimizer = {
      diversPenaltyBase: clamp3(0.03 + (overallBrier - 0.22) * 0.1, 0.01, 0.08),
      diversPenaltyRiskScale: clamp3(0.16 + (overallBrier - 0.22) * 0.2, 0.08, 0.28),
      learningRate: clamp3(0.16 - (overallBrier - 0.22) * 0.1, 0.08, 0.24),
      iterations: 180
    };
    const matchConcentrationCap = clamp3(0.6 + (0.22 - overallBrier) * 0.5, 0.4, 0.75);
    const entryCorrelationScale = clamp3(0.04 + (overallBrier - 0.22) * 0.05, 0.02, 0.08);
    const hardConstraintPenalty = clamp3(0.5 + (overallBrier - 0.22) * 1, 0.3, 0.8);
    const teamBiasMagnitude = clamp3(0.12 - (overallBrier - 0.22) * 0.2, 0.06, 0.2);
    const familyBonusBaseline = 0.5;
    const familyBonusScale = clamp3(0.04 + (0.22 - overallBrier) * 0.03, 0.02, 0.08);
    const qualityFactor = prequentialQuality.enabled && Number.isFinite(prequentialQuality.quality) ? prequentialQuality.quality : 1;
    const reliability = clamp3(baseReliability * qualityFactor, 0, 1);
    const blend = (calibrated, defaultVal) => Number((calibrated * reliability + defaultVal * (1 - reliability)).toFixed(4));
    const blendObj = (calibratedObj, defaultObj) => {
      const result = {};
      for (const key of Object.keys(defaultObj)) {
        result[key] = Number(((calibratedObj[key] ?? defaultObj[key]) * reliability + defaultObj[key] * (1 - reliability)).toFixed(4));
      }
      return result;
    };
    return {
      ready: true,
      reliability: Number(reliability.toFixed(3)),
      sampleCount: n,
      fullSampleCount: totalSampleCount,
      overallBrier: Number(overallBrier.toFixed(4)),
      temporalSplit: prequentialQuality.enabled ? {
        enabled: true,
        mode: "prequential",
        windowCount: prequentialQuality.windowCount,
        stepMatches: PREQUENTIAL_STEP_MATCHES,
        trainSamples: n,
        holdoutSamples: prequentialQuality.samples,
        holdoutQuality: prequentialQuality.quality,
        holdoutStrongHitRate: prequentialQuality.strongHitRate,
        holdoutNegativeHitRate: prequentialQuality.negativeHitRate
      } : { enabled: false, mode: "insufficient", trainSamples: n, holdoutSamples: 0, holdoutQuality: null, windowCount: 0, stepMatches: PREQUENTIAL_STEP_MATCHES },
      portfolioWeights: blendObj(portfolioWeights, fallback.portfolioWeights),
      stratifiedQuotas: blendObj(stratifiedQuotas, fallback.stratifiedQuotas),
      surplusThresholds: {
        strongEdge: blend(strongEdge, 0.12),
        moderateEdge: blend(moderateEdge, 0.04),
        neutral: blend(neutralEdge, -0.03)
      },
      surplusBonusScale: blend(surplusBonusScale, 0.15),
      surplusBonusMaxThreshold: blend(strongEdge, 0.12),
      surplusBonusMaxBonus: blend(clamp3(surplusBonusScale * 0.2, 0.01, 0.06), 0.03),
      mmrConcentrationBase: blend(mmrConcentrationBase, 0.18),
      mmrConcentrationEtaScale: blend(clamp3(mmrConcentrationBase * 0.44, 0.04, 0.14), 0.08),
      mmrAnchorSharePenalty: blend(mmrAnchorSharePenalty, 0.12),
      vigOverround: blend(vigOverround, 0.05),
      roleCoefficients: blendObj(roleCoefficients, fallback.roleCoefficients),
      coverageDecayBase: blend(coverageDecayBase, 0.6),
      coverageDecayBoost: blend(coverageDecayBoost, 0.08),
      softPenaltyScales: blendObj(softPenaltyScales, fallback.softPenaltyScales),
      familyBonusBaseline: blend(familyBonusBaseline, 0.5),
      familyBonusScale: blend(familyBonusScale, 0.04),
      hardConstraintPenalty: blend(hardConstraintPenalty, 0.5),
      teamBiasMagnitude: blend(teamBiasMagnitude, 0.12),
      correlationFormula: blendObj(
        { base: 0.1, overlapWeight: clamp3(0.58 + (overallBrier - 0.22) * 0.5, 0.35, 0.8), jaccardWeight: clamp3(0.24 + (overallBrier - 0.22) * 0.3, 0.12, 0.4) },
        fallback.correlationFormula
      ),
      portfolioOptimizer: blendObj(portfolioOptimizer, fallback.portfolioOptimizer),
      recencyWeights: blendObj(calibratedRecencyWeights, fallback.recencyWeights),
      repWeights: blendObj(repWeights, fallback.repWeights),
      matchConcentrationCap: blend(matchConcentrationCap, 0.6),
      entryCorrelationScale: blend(entryCorrelationScale, 0.04)
    };
  };
  var getAdaptiveTrainingRevision = (investments) => {
    const compareCanonicalRows = (a, b) => {
      const left = JSON.stringify(a);
      const right = JSON.stringify(b);
      return left < right ? -1 : left > right ? 1 : 0;
    };
    const rows = uniqueMatchRows(investments).map(({ investment: inv, match: m, eventKey: eventKey3 }) => ({
      id: eventKey3,
      selection: getMatchSourceIdentity(m, inv.id).selection_key,
      createdAt: inv.created_at,
      outcomeAvailableAt: m.outcome_available_at || inv.outcome_available_at || inv.settled_at,
      status: inv.status,
      mode: inv.mode,
      // Include the resolved scoring features too: malformed modern fields may
      // fall back to legacy values, which must still invalidate this revision.
      components: computeInvestmentScore({ ...inv, matches: [m] }, {}).components,
      match: {
        home: m.home_team,
        away: m.away_team,
        conf: m.conf,
        odds: m.odds,
        mode: m.mode,
        tysHome: m.tys_home ?? m.tys_base_home ?? m.tys_base,
        tysAway: m.tys_away ?? m.tys_base_away ?? m.tys_home ?? m.tys_base_home ?? m.tys_base,
        fid: m.fid ?? m.fid_base_home,
        fseHome: m.fse_home,
        fseAway: m.fse_away,
        isCorrect: m.is_correct,
        rating: m.match_rating,
        rep: m.match_rep ?? inv.rep,
        entries: m.entries
      }
    })).sort(compareCanonicalRows);
    const serialized = JSON.stringify(rows);
    let hash = 2166136261;
    for (let i = 0; i < serialized.length; i += 1) {
      hash = Math.imul(hash ^ serialized.charCodeAt(i), 16777619);
    }
    return {
      signature: `v2:${serialized.length}:${hash >>> 0}`,
      matchCount: rows.length
    };
  };
  var autoApplyAdaptiveWeights = () => {
    const config = getSystemConfig2();
    const adaptiveConfig = config.adaptiveWeights || {};
    if (adaptiveConfig.enabled !== true || adaptiveConfig.mode === "disabled") {
      return { applied: false, reason: "disabled" };
    }
    if (adaptiveConfig.mode !== "auto") return { applied: false, reason: "suggest_only" };
    const revision = getAdaptiveTrainingRevision(getSettledInvestments(getActiveInvestments()));
    if (adaptiveConfig.lastAppliedDataSignature === revision.signature) {
      return { applied: false, reason: "unchanged_data" };
    }
    const lastMatchCount = toNumber3(adaptiveConfig.lastAppliedMatchCount, Number.NaN);
    const updateEveryN = Math.max(1, Math.floor(toNumber3(adaptiveConfig.updateEveryN, 5)));
    if (Number.isFinite(lastMatchCount) && revision.matchCount > lastMatchCount && revision.matchCount - lastMatchCount < updateEveryN) {
      return { applied: false, reason: "waiting_for_samples" };
    }
    const result = computeAdaptiveWeightSuggestions();
    if (!result.ready) return { applied: false, reason: "insufficient_samples", ...result };
    if (!result.validation?.accepted) return { ...result, applied: false, reason: "validation_not_improved" };
    const minConfidence = 0.3;
    const maxTotalChange = 0.08;
    const updates = {};
    let totalAbsChange = 0;
    const appliedChanges = [];
    result.suggestions.forEach((suggestion) => {
      if (INACTIVE_WEIGHT_KEYS.has(suggestion.key)) return;
      if (suggestion.confidence < minConfidence) return;
      if (Math.abs(suggestion.change) < 1e-3) return;
      const safeChange = clamp3(suggestion.change, -0.02, 0.02);
      if (totalAbsChange + Math.abs(safeChange) > maxTotalChange) return;
      const newValue = clamp3(
        suggestion.current + safeChange,
        suggestion.bounds[0],
        suggestion.bounds[1]
      );
      if (Math.abs(newValue - suggestion.current) < 1e-3) return;
      updates[suggestion.key] = Number(newValue.toFixed(4));
      totalAbsChange += Math.abs(safeChange);
      appliedChanges.push({
        key: suggestion.key,
        from: suggestion.current,
        to: Number(newValue.toFixed(4)),
        confidence: suggestion.confidence
      });
    });
    if (Object.keys(updates).length === 0) {
      return { applied: false, reason: "no_significant_changes", suggestions: result.suggestions };
    }
    const saved = saveSystemConfig({
      ...updates,
      adaptiveWeights: {
        ...config.adaptiveWeights || {},
        lastUpdateAt: (/* @__PURE__ */ new Date()).toISOString(),
        lastAppliedDataSignature: revision.signature,
        lastAppliedMatchCount: revision.matchCount,
        updateCount: ((config.adaptiveWeights || {}).updateCount || 0) + 1,
        lastAppliedChanges: appliedChanges,
        lastValidation: result.validation
      }
    });
    const persisted = getSystemConfig2();
    if (!saved || persisted.adaptiveWeights?.lastAppliedDataSignature !== revision.signature || Object.entries(updates).some(([key, value]) => persisted[key] !== value)) {
      return { applied: false, reason: "save_rejected", suggestions: result.suggestions };
    }
    return {
      applied: true,
      appliedChanges,
      totalAbsChange: Number(totalAbsChange.toFixed(4)),
      suggestions: result.suggestions
    };
  };
  var getMarketImpliedFailureRate = (odds) => {
    const parsed = toNumber3(odds, Number.NaN);
    if (!Number.isFinite(parsed) || parsed <= 1) return Number.NaN;
    return clamp3(1 - 1 / parsed, 0.02, 0.98);
  };
  var getConfidenceWeight = (sampleSize) => {
    const size = Math.max(0, toNumber3(sampleSize, 0));
    if (size === 0) return 0;
    const raw = Math.log(1 + size) / Math.log(1 + 30);
    return clamp3(raw, 0.05, 1);
  };
  var getTemporalWeight = (date, baseDate = /* @__PURE__ */ new Date(), comboIndex = -1, totalCombos = -1) => {
    if (comboIndex >= 0 && totalCombos > 0) {
      if (comboIndex < 30) return 1.45;
      if (comboIndex < 75) return 1.28;
      if (comboIndex < 150) return 1.15;
      return 1;
    }
    const dataDate = new Date(date);
    if (Number.isNaN(dataDate.getTime())) return 1;
    const daysDiff = (new Date(baseDate).getTime() - dataDate.getTime()) / (1e3 * 60 * 60 * 24);
    if (daysDiff <= 30) return 1.45;
    if (daysDiff <= 90) return 1.28;
    if (daysDiff <= 180) return 1.15;
    return 1;
  };
  var getOddsBand = (odds) => {
    if (odds < 1.3) return 1.2;
    if (odds < 1.6) return 1.45;
    if (odds < 2) return 1.8;
    if (odds < 2.5) return 2.25;
    if (odds < 3.5) return 3;
    if (odds < 5) return 4;
    if (odds < 8) return 6;
    return 10;
  };
  var BANDS = [1.2, 1.45, 1.8, 2.25, 3, 4, 6, 10];
  var getBandIndex = (odds) => {
    const band = getOddsBand(odds);
    const idx = BANDS.indexOf(band);
    return idx === -1 ? 0 : idx;
  };
  var KERNEL_TABLE = [1, 0.63, 0.214, 0.045, 0.0135];
  var kernelWeight = (d) => {
    const di = Math.floor(Math.abs(d));
    if (di < KERNEL_TABLE.length) return KERNEL_TABLE[di];
    const ratio = KERNEL_TABLE[4] / KERNEL_TABLE[3];
    return KERNEL_TABLE[4] * Math.pow(ratio, di - 4);
  };
  var MIN_COMPARABLE_KERNEL_WEIGHT = KERNEL_TABLE[1] * KERNEL_TABLE[1] * 0.5;
  var computeDensityFactors = (historicalData) => {
    const bandCounts = new Float64Array(BANDS.length);
    historicalData.forEach((combo) => {
      const matches = Array.isArray(combo.matches) ? combo.matches : [];
      matches.forEach((m) => {
        const odds = toNumber3(m?.odds, 0);
        if (odds > 1) bandCounts[getBandIndex(odds)] += 1;
      });
    });
    const smoothed = bandCounts.map((c) => c + 1);
    const logSum = smoothed.reduce((s, c) => s + Math.log(c), 0);
    const geometricMean = Math.exp(logSum / BANDS.length);
    const factors = new Float64Array(BANDS.length);
    for (let i = 0; i < BANDS.length; i++) {
      factors[i] = clamp3(Math.pow(geometricMean / smoothed[i], 0.3), 0.5, 2);
    }
    return factors;
  };
  var computeAdaptiveBandwidths = (historicalData) => computeDensityFactors(historicalData);
  var computePairKernelWeight = (targetIdxA, targetIdxB, histIdxA, histIdxB, densityFactors) => {
    const dA = Math.abs(targetIdxA - histIdxA);
    const dB = Math.abs(targetIdxB - histIdxB);
    const baseWeight = kernelWeight(dA) * kernelWeight(dB);
    const densityAdj = (densityFactors[histIdxA] + densityFactors[histIdxB]) / 2;
    return baseWeight * densityAdj;
  };
  var getWeightedObservedFailure = (historicalData = [], oddsA, oddsB, bandwidths = null) => {
    if (!Array.isArray(historicalData) || historicalData.length === 0) {
      return { failedTogether: 0, totalWeight: 0, effectiveSampleSize: 0, rawPairCount: 0 };
    }
    historicalData = canonicalDependencyHistory(historicalData);
    const seenPairs = /* @__PURE__ */ new Set();
    const bw = bandwidths || computeAdaptiveBandwidths(historicalData);
    const targetIdxA = getBandIndex(oddsA);
    const targetIdxB = getBandIndex(oddsB);
    const totalCombos = historicalData.length;
    let weightedFailedTogether = 0;
    let weightedPartialMiss = 0;
    let totalWeight = 0;
    let rawPairCount = 0;
    let sumW2 = 0;
    historicalData.forEach((combo, comboIdx) => {
      const matches = Array.isArray(combo.matches) ? combo.matches : [];
      if (matches.length < 2) return;
      const temporalW = getTemporalWeight(combo.createdAt, void 0, comboIdx, totalCombos);
      let bestKernelW = 0;
      let bestFailedBoth = false;
      let bestPartialMiss = false;
      let bestIdentity = "";
      for (let i = 0; i < matches.length; i++) {
        const mOddsI = toNumber3(matches[i]?.odds, 0);
        if (mOddsI <= 1) continue;
        const idxI = getBandIndex(mOddsI);
        for (let j = 0; j < matches.length; j++) {
          if (j === i) continue;
          if (matches[i].eventKey && matches[i].eventKey === matches[j].eventKey) continue;
          const mOddsJ = toNumber3(matches[j]?.odds, 0);
          if (mOddsJ <= 1) continue;
          const rI = matches[i]?.result;
          const rJ = matches[j]?.result;
          const bothDefined = typeof rI === "boolean" && typeof rJ === "boolean";
          if (!bothDefined) continue;
          const idxJ = getBandIndex(mOddsJ);
          const kw = computePairKernelWeight(targetIdxA, targetIdxB, idxI, idxJ, bw);
          if (kw > bestKernelW) {
            bestKernelW = kw;
            bestFailedBoth = rI === false && rJ === false;
            bestPartialMiss = rI === true && rJ === false || rI === false && rJ === true;
            bestIdentity = matches[i].identityKey && matches[j].identityKey ? JSON.stringify([matches[i].identityKey, matches[j].identityKey].sort()) : "";
          }
        }
      }
      if (bestKernelW >= MIN_COMPARABLE_KERNEL_WEIGHT) {
        if (bestIdentity && seenPairs.has(bestIdentity)) return;
        if (bestIdentity) seenPairs.add(bestIdentity);
        const w = bestKernelW * temporalW;
        totalWeight += w;
        sumW2 += w * w;
        rawPairCount += 1;
        if (bestFailedBoth) {
          weightedFailedTogether += w;
        }
        if (bestPartialMiss) {
          weightedPartialMiss += w;
        }
      }
    });
    const effectiveSampleSize = sumW2 > 0 ? totalWeight * totalWeight / sumW2 : 0;
    return {
      failedTogether: weightedFailedTogether,
      partialMiss: weightedPartialMiss,
      totalWeight,
      effectiveSampleSize,
      rawPairCount
    };
  };
  var calculateDependencyPremium = (raceA, raceB, historicalData = [], raceAIndex = 0, raceBIndex = 1, precomputedBandwidths = null) => {
    const oddsA = toNumber3(raceA?.odds, Number.NaN);
    const oddsB = toNumber3(raceB?.odds, Number.NaN);
    historicalData = canonicalDependencyHistory(historicalData);
    if (!Number.isFinite(oddsA) || !Number.isFinite(oddsB)) {
      return {
        premium: Number.NaN,
        pFailA: Number.NaN,
        pFailB: Number.NaN,
        pFailBothObserved: Number.NaN,
        pFailBothIndependent: Number.NaN,
        sampleSize: 0,
        effectiveSampleSize: 0,
        confidence: 0,
        pValue: Number.NaN,
        isSignificant: false
      };
    }
    const pFailA = getMarketImpliedFailureRate(oddsA);
    const pFailB = getMarketImpliedFailureRate(oddsB);
    const bw = precomputedBandwidths || computeAdaptiveBandwidths(historicalData);
    const observed = getWeightedObservedFailure(historicalData, oddsA, oddsB, bw);
    const pFailBothObserved = observed.totalWeight > 0 ? observed.failedTogether / observed.totalWeight : Number.NaN;
    const pFailBothIndependent = pFailA * pFailB;
    const rawPremium = pFailBothObserved - pFailBothIndependent;
    const calibratePremium = (() => {
      const targetIdxA = getBandIndex(oddsA);
      const targetIdxB = getBandIndex(oddsB);
      const recentMatches = [];
      for (let ci = 0; ci < historicalData.length && recentMatches.length < 25; ci++) {
        const combo = historicalData[ci];
        const matches = Array.isArray(combo?.matches) ? combo.matches : [];
        if (matches.length < 2) continue;
        let found = false;
        for (let i = 0; i < matches.length && !found; i++) {
          const oi = toNumber3(matches[i]?.odds, 0);
          if (oi <= 1) continue;
          const idxI = getBandIndex(oi);
          const dA = Math.abs(idxI - targetIdxA);
          if (dA > 1) continue;
          for (let j = 0; j < matches.length; j++) {
            if (j === i) continue;
            if (typeof matches[i]?.result !== "boolean" || typeof matches[j]?.result !== "boolean") continue;
            const oj = toNumber3(matches[j]?.odds, 0);
            if (oj <= 1) continue;
            const idxJ = getBandIndex(oj);
            const dB = Math.abs(idxJ - targetIdxB);
            if (dB > 1) continue;
            recentMatches.push({
              failedBoth: matches[i]?.result === false && matches[j]?.result === false,
              recency: ci
              // 越小越近
            });
            found = true;
            break;
          }
        }
      }
      if (recentMatches.length < 3) return rawPremium;
      let localWeightedFail = 0;
      let localTotalWeight = 0;
      recentMatches.forEach((m, idx) => {
        const w = 1 + 0.5 * (1 - idx / recentMatches.length);
        localTotalWeight += w;
        if (m.failedBoth) localWeightedFail += w;
      });
      const localRate = localTotalWeight > 0 ? localWeightedFail / localTotalWeight : 0;
      const localPremium = localRate - pFailBothIndependent;
      if (Math.abs(rawPremium) < 1e-3 && Math.abs(localPremium) < 1e-3) return rawPremium;
      const diff = localPremium - rawPremium;
      const calConfidence = clamp3((recentMatches.length - 3) / 22, 0, 1);
      const consistency = 1 - 4 * localRate * (1 - localRate);
      const sameDirection = rawPremium > 5e-3 && localPremium > 5e-3 || rawPremium < -5e-3 && localPremium < -5e-3;
      const oppositeDirection = rawPremium > 5e-3 && localPremium < -5e-3 || rawPremium < -5e-3 && localPremium > 5e-3;
      const directionBoost = sameDirection ? 1.3 : oppositeDirection ? 0.55 : 0.85;
      const baseMaxInfluence = 0.06 + calConfidence * 0.14;
      const consistencyMult = 0.7 + consistency * 0.6;
      const maxInfluence = baseMaxInfluence * consistencyMult * directionBoost;
      const absBase = Math.max(Math.abs(rawPremium), 0.02);
      const scale = absBase * 2.5;
      const tanhResponse = Math.tanh(diff / scale);
      const adjustment = tanhResponse * maxInfluence * absBase;
      return rawPremium + adjustment;
    })();
    const premium = calibratePremium;
    const confidenceWeight = getConfidenceWeight(observed.effectiveSampleSize);
    const pValue = Number.NaN;
    const isSignificant = false;
    return {
      premium: clamp3(premium, -1, 1),
      pFailA,
      pFailB,
      pFailBothObserved: clamp3(pFailBothObserved, 0, 1),
      pFailBothIndependent: clamp3(pFailBothIndependent, 0, 1),
      sampleSize: observed.rawPairCount,
      effectiveSampleSize: observed.effectiveSampleSize,
      confidence: confidenceWeight,
      pValue,
      pValueMethod: "unavailable_dependent_selected_sample",
      inferenceStatus: "exploratory_only",
      confidenceBasis: "ess_support_weight_not_statistical_confidence",
      isSignificant,
      observedFailedCount: observed.failedTogether,
      observedPartialMiss: observed.partialMiss,
      weightedCount: observed.totalWeight
    };
  };
  var checkSurvivingBias = (raceA, raceB, historicalData = [], raceAIndex = 0, raceBIndex = 1, toleranceFactor = 0.15) => {
    const oddsA = toNumber3(raceA?.odds, Number.NaN);
    const oddsB = toNumber3(raceB?.odds, Number.NaN);
    if (!Number.isFinite(oddsA) || !Number.isFinite(oddsB)) {
      return {
        hasBias: false,
        biasDirection: "unknown",
        biasStrength: 0,
        matchedPairs: 0,
        investedInTarget: 0,
        investedInSimilar: 0
      };
    }
    let matchedPairs = 0;
    let exactBandMatch = 0;
    let neighborBandMatch = 0;
    let exactBandWon = 0;
    let neighborBandWon = 0;
    let exactBandPartialMiss = 0;
    let neighborBandPartialMiss = 0;
    const targetBandA = getOddsBand(oddsA);
    const targetBandB = getOddsBand(oddsB);
    const BANDS2 = [1.2, 1.45, 1.8, 2.25, 3, 4, 6, 10];
    const isNeighborBand = (band1, band2) => {
      const idx1 = BANDS2.indexOf(band1);
      const idx2 = BANDS2.indexOf(band2);
      if (idx1 === -1 || idx2 === -1) return false;
      return Math.abs(idx1 - idx2) <= 1 && idx1 !== idx2;
    };
    historicalData.forEach((combo) => {
      const matches = Array.isArray(combo.matches) ? combo.matches : [];
      if (matches.length < 2) return;
      let foundExact = false;
      let foundNeighbor = false;
      let bothCorrectExact = false;
      let bothCorrectNeighbor = false;
      let partialMissExact = false;
      let partialMissNeighbor = false;
      for (let i = 0; i < matches.length; i++) {
        const mOddsI = toNumber3(matches[i]?.odds, 0);
        const bandI = getOddsBand(mOddsI);
        const exactMatchA = bandI === targetBandA;
        const neighborMatchA = isNeighborBand(bandI, targetBandA);
        if (!exactMatchA && !neighborMatchA) continue;
        for (let j = 0; j < matches.length; j++) {
          if (j === i) continue;
          const mOddsJ = toNumber3(matches[j]?.odds, 0);
          const bandJ = getOddsBand(mOddsJ);
          const exactMatchB = bandJ === targetBandB;
          const neighborMatchB = isNeighborBand(bandJ, targetBandB);
          const rI = matches[i]?.result;
          const rJ = matches[j]?.result;
          const bothDefined = typeof rI === "boolean" && typeof rJ === "boolean";
          if (!bothDefined) continue;
          const bothCorrect = bothDefined && rI === true && rJ === true;
          const partialMiss = bothDefined && (rI === true && rJ === false || rI === false && rJ === true);
          if (exactMatchA && exactMatchB) {
            foundExact = true;
            bothCorrectExact = bothCorrect;
            partialMissExact = partialMiss;
            break;
          }
          if ((exactMatchA || neighborMatchA) && (exactMatchB || neighborMatchB)) {
            if (!foundNeighbor) {
              foundNeighbor = true;
              bothCorrectNeighbor = bothCorrect;
              partialMissNeighbor = partialMiss;
            }
          }
        }
        if (foundExact) break;
      }
      if (foundExact) {
        matchedPairs += 1;
        exactBandMatch += 1;
        if (bothCorrectExact) exactBandWon += 1;
        if (partialMissExact) exactBandPartialMiss += 1;
      } else if (foundNeighbor) {
        matchedPairs += 1;
        neighborBandMatch += 1;
        if (bothCorrectNeighbor) neighborBandWon += 1;
        if (partialMissNeighbor) neighborBandPartialMiss += 1;
      }
    });
    const totalCombos = historicalData.length;
    const expectedRate = totalCombos > 0 ? matchedPairs / totalCombos : 0;
    const hasBias = matchedPairs < 3 && totalCombos > 10;
    const biasStrength = totalCombos > 0 ? clamp3(1 - matchedPairs / Math.max(totalCombos * 0.1, 1), 0, 0.5) : 0;
    return {
      hasBias,
      biasDirection: hasBias ? "undersampled" : "normal",
      biasStrength,
      matchedPairs,
      investedInTarget: exactBandMatch,
      investedInSimilar: neighborBandMatch,
      exactWon: exactBandWon,
      neighborWon: neighborBandWon,
      exactPartialMiss: exactBandPartialMiss,
      neighborPartialMiss: neighborBandPartialMiss
    };
  };
  var adjustForBaseRate = (premium, historicalData = [], conservativeFactor = 0.2) => {
    if (!Array.isArray(historicalData) || historicalData.length === 0) {
      return {
        adjustedPremium: premium,
        adjustmentFactor: 1,
        globalFailureRate: Number.NaN
      };
    }
    let totalFailed = 0;
    let totalCombos = 0;
    historicalData.forEach((combo) => {
      if (!combo.succeeded) totalFailed += 1;
      totalCombos += 1;
    });
    const globalFailureRate = totalCombos > 0 ? totalFailed / totalCombos : 0;
    const adjustmentFactor = premium > 0 ? 1 - conservativeFactor : 1 + conservativeFactor;
    const adjustedPremium = premium * adjustmentFactor;
    return {
      adjustedPremium: clamp3(adjustedPremium, -1, 1),
      adjustmentFactor,
      globalFailureRate,
      conservativeFactor,
      method: "heuristic_sign_scaling_not_base_rate_estimation"
    };
  };
  var assessFragilityScore = (raceA, raceB, historicalData = [], raceAIndex = 0, raceBIndex = 1, precomputedBandwidths = null) => {
    const premium = calculateDependencyPremium(
      raceA,
      raceB,
      historicalData,
      raceAIndex,
      raceBIndex,
      precomputedBandwidths
    );
    if (!Number.isFinite(premium.premium)) {
      return {
        fragilityScore: Number.NaN,
        fragilityPercentage: "—",
        riskLevel: "insufficient_data",
        confidence: 0,
        isSignificant: false,
        components: {
          premium,
          bias: null,
          adjusted: null
        }
      };
    }
    const bias = checkSurvivingBias(
      raceA,
      raceB,
      historicalData,
      raceAIndex,
      raceBIndex
    );
    const biasCorrectedPremium = bias.hasBias ? premium.premium * (1 - bias.biasStrength * 0.5) : premium.premium;
    const adjusted = adjustForBaseRate(biasCorrectedPremium, historicalData);
    const maxPremium = 0.5;
    const fragilityScore = clamp3(
      (adjusted.adjustedPremium + maxPremium) / (2 * maxPremium) * 100,
      0,
      100
    );
    const fragilityPercentage = `${fragilityScore.toFixed(2)} / 100`;
    let riskLevel = "low";
    if (fragilityScore > 60) riskLevel = "critical";
    else if (fragilityScore > 40) riskLevel = "high";
    else if (fragilityScore > 25) riskLevel = "medium";
    return {
      fragilityScore: Number(fragilityScore.toFixed(2)),
      metricType: "exploratory_relative_index_not_probability",
      fragilityPercentage,
      riskLevel,
      isSignificant: premium.isSignificant,
      confidence: premium.confidence,
      components: {
        premium,
        bias,
        adjusted
      }
    };
  };
  var assessComboFragility = (matchGroup = [], historicalData = []) => {
    if (!Array.isArray(matchGroup) || matchGroup.length < 2) {
      return {
        comboSize: 0,
        overallFragility: Number.NaN,
        criticalPairs: [],
        recommendations: []
      };
    }
    const bandwidths = computeAdaptiveBandwidths(historicalData);
    const pairAnalysis = [];
    for (let i = 0; i < matchGroup.length; i++) {
      for (let j = i + 1; j < matchGroup.length; j++) {
        const assessment = assessFragilityScore(
          matchGroup[i],
          matchGroup[j],
          historicalData,
          i,
          j,
          bandwidths
        );
        pairAnalysis.push({
          pair: [i, j],
          assessment
        });
      }
    }
    if (!pairAnalysis.some((pair) => Number.isFinite(pair.assessment.fragilityScore))) {
      return {
        comboSize: matchGroup.length,
        overallFragility: Number.NaN,
        pairAnalysis,
        criticalPairs: [],
        recommendations: generateFragilityRecommendations(matchGroup, pairAnalysis, [])
      };
    }
    const makeEdgeKey = (a, b) => `${Math.min(a, b)}:${Math.max(a, b)}`;
    const seededRandom = (seedInput) => {
      let seed = Math.floor(Math.abs(seedInput)) % 2147483647;
      if (seed <= 0) seed += 2147483646;
      return () => {
        seed = seed * 16807 % 2147483647;
        return (seed - 1) / 2147483646;
      };
    };
    const deterministicPermutation = (length, seedValue) => {
      const rng = seededRandom(seedValue);
      const arr = Array.from({ length }, (_, idx) => idx);
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
      return arr;
    };
    const historicalByRecency = Array.isArray(historicalData) ? [...historicalData].sort((a, b) => {
      const ta = new Date(a?.createdAt || 0).getTime();
      const tb = new Date(b?.createdAt || 0).getTime();
      return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
    }) : [];
    const estimateRecentJointFailure = (oddsA, oddsB, windowSize = 60) => {
      if (historicalByRecency.length === 0) {
        return { rate: Number.NaN, effectiveSample: 0 };
      }
      const recentData = historicalByRecency.slice(0, Math.min(windowSize, historicalByRecency.length));
      const observed = getWeightedObservedFailure(recentData, oddsA, oddsB, bandwidths);
      const rate = observed.totalWeight > 0 ? observed.failedTogether / observed.totalWeight : Number.NaN;
      return {
        rate,
        effectiveSample: Number.isFinite(observed.effectiveSampleSize) ? observed.effectiveSampleSize : 0
      };
    };
    const pFailByMatch = matchGroup.map((match) => {
      const odds = toNumber3(match?.odds, Number.NaN);
      const p = getMarketImpliedFailureRate(odds);
      return Number.isFinite(p) ? clamp3(p, 1e-5, 1 - 1e-5) : 0.5;
    });
    const independentCollapse = clamp3(
      pFailByMatch.reduce((prod, p) => prod * p, 1),
      1e-8,
      0.999999
    );
    const edgeScale = 1 / Math.max(1, matchGroup.length - 1);
    const pairCopulaModel = /* @__PURE__ */ new Map();
    pairAnalysis.forEach((item) => {
      const [i, j] = item.pair;
      const premium = item.assessment?.components?.premium || {};
      if (!(premium.effectiveSampleSize > 0) || !Number.isFinite(premium.pFailBothObserved)) return;
      const pA = Number.isFinite(pFailByMatch[i]) ? pFailByMatch[i] : toNumber3(premium.pFailA, 0.5);
      const pB = Number.isFinite(pFailByMatch[j]) ? pFailByMatch[j] : toNumber3(premium.pFailB, 0.5);
      const qInd = clamp3(pA * pB, 1e-8, 0.999999);
      const qGlobalRaw = toNumber3(premium.pFailBothObserved, Number.NaN);
      const qGlobal = Number.isFinite(qGlobalRaw) ? clamp3(qGlobalRaw, 0, 1) : qInd;
      const oddsA = toNumber3(matchGroup[i]?.odds, Number.NaN);
      const oddsB = toNumber3(matchGroup[j]?.odds, Number.NaN);
      const recent = estimateRecentJointFailure(oddsA, oddsB, 60);
      const recentRate = Number.isFinite(recent.rate) ? clamp3(recent.rate, 0, 1) : qGlobal;
      const recentCredibility = clamp3(recent.effectiveSample / (recent.effectiveSample + 10), 0, 1);
      const qTimeVarying = recentCredibility * recentRate + (1 - recentCredibility) * qGlobal;
      const nEff = Math.max(
        0,
        toNumber3(premium.effectiveSampleSize, 0)
      );
      const priorStrength = 16;
      const posteriorMean = clamp3(
        (qTimeVarying * nEff + qInd * priorStrength) / (nEff + priorStrength),
        0,
        1
      );
      const fgmDenominator = Math.max(qInd * (1 - pA) * (1 - pB), 1e-8);
      const thetaRaw = (posteriorMean - qInd) / fgmDenominator;
      const copulaTheta = clamp3(thetaRaw, -0.95, 0.95);
      const frechetLower = Math.max(0, pA + pB - 1);
      const frechetUpper = Math.min(pA, pB);
      const qCopula = clamp3(
        qInd + copulaTheta * fgmDenominator,
        frechetLower + 1e-8,
        Math.max(frechetLower + 1e-8, frechetUpper - 1e-8)
      );
      const interactionLift = Math.log((qCopula + 1e-8) / (qInd + 1e-8));
      const thetaEdge = clamp3(interactionLift, -2.5, 2.5);
      pairCopulaModel.set(makeEdgeKey(i, j), {
        i,
        j,
        pA,
        pB,
        qInd,
        qGlobal,
        qRecent: recentRate,
        qTimeVarying,
        qPosterior: posteriorMean,
        qCopula,
        copulaTheta,
        thetaEdge,
        recentCredibility,
        effectiveSample: nEff
      });
    });
    const edges = Array.from(pairCopulaModel.values());
    if (edges.length > 0) {
      const valueFromEdgeSet = (activeSet) => {
        let survivalCopula = 1;
        let survivalInd = 1;
        for (let k = 0; k < activeSet.length; k++) {
          if (activeSet[k]) {
            survivalCopula *= 1 - edges[k].qCopula;
            survivalInd *= 1 - edges[k].qInd;
          }
        }
        return 1 - survivalCopula - (1 - survivalInd);
      };
      const sampleCount = 7500;
      const contributions = new Float64Array(edges.length);
      const seedBase = matchGroup.reduce((acc, match, idx) => {
        const odds = toNumber3(match?.odds, 1 + idx);
        return acc + Math.floor(odds * 1e3) * (idx + 11);
      }, 17029);
      for (let s = 0; s < sampleCount; s++) {
        const permutation = deterministicPermutation(edges.length, seedBase + s * 7919);
        const active = new Uint8Array(edges.length);
        let prevValue = 0;
        for (let k = 0; k < permutation.length; k++) {
          const edgeIdx = permutation[k];
          active[edgeIdx] = 1;
          const nextValue = valueFromEdgeSet(active);
          contributions[edgeIdx] += nextValue - prevValue;
          prevValue = nextValue;
        }
      }
      edges.forEach((edge, edgeIdx) => {
        const shapleyValue = contributions[edgeIdx] / sampleCount;
        const msiPP = -shapleyValue * 100;
        const key = makeEdgeKey(edge.i, edge.j);
        const pairItem = pairAnalysis.find((item) => makeEdgeKey(item.pair[0], item.pair[1]) === key);
        if (!pairItem || !pairItem.assessment) return;
        if (!pairItem.assessment.components) pairItem.assessment.components = {};
        pairItem.assessment.components.msi = {
          attributionBasis: "edge_product_proxy_game_not_causal_tail_probability",
          marginalSurvivalImpactPP: Number(msiPP.toFixed(3)),
          copulaTheta: Number(edge.copulaTheta.toFixed(4)),
          qIndependent: Number(edge.qInd.toFixed(6)),
          qGlobal: Number(edge.qGlobal.toFixed(6)),
          qRecent: Number(edge.qRecent.toFixed(6)),
          qTimeVarying: Number(edge.qTimeVarying.toFixed(6)),
          qPosterior: Number(edge.qPosterior.toFixed(6)),
          qCopula: Number(edge.qCopula.toFixed(6)),
          recentCredibility: Number(edge.recentCredibility.toFixed(4)),
          edgeScale: Number(edgeScale.toFixed(4))
        };
      });
    }
    const weights = pairAnalysis.map((p) => Number.isFinite(p.assessment.fragilityScore) ? p.assessment.confidence || 0 : 0);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const overallFragility = totalWeight > 0 ? pairAnalysis.reduce((sum, p, idx) => weights[idx] > 0 ? sum + p.assessment.fragilityScore * weights[idx] : sum, 0) / totalWeight : Number.NaN;
    const criticalPairs = pairAnalysis.filter((p) => p.assessment.fragilityScore > 40).sort((a, b) => b.assessment.fragilityScore - a.assessment.fragilityScore);
    const recommendations = generateFragilityRecommendations(
      matchGroup,
      pairAnalysis,
      criticalPairs
    );
    return {
      comboSize: matchGroup.length,
      overallFragility: Number(overallFragility.toFixed(2)),
      pairAnalysis,
      criticalPairs,
      recommendations
    };
  };
  var generateFragilityRecommendations = (matchGroup = [], pairAnalysis = [], criticalPairs = []) => {
    const recommendations = [];
    if (!pairAnalysis.some((pair) => Number.isFinite(pair.assessment?.fragilityScore))) {
      return [{ type: "insufficient_data", description: "历史证据不足，暂无法判断依赖风险。", riskReduction: null }];
    }
    if (criticalPairs.length === 0) {
      recommendations.push({
        type: "maintain",
        description: "当前探索性指数未触发高风险阈值；不代表已证实安全。",
        riskReduction: 0
      });
      return recommendations;
    }
    const problemMatchCounts = {};
    criticalPairs.forEach((cp) => {
      const [idx1, idx2] = cp.pair;
      problemMatchCounts[idx1] = (problemMatchCounts[idx1] || 0) + 1;
      problemMatchCounts[idx2] = (problemMatchCounts[idx2] || 0) + 1;
    });
    const sortedProblems = Object.entries(problemMatchCounts).sort((a, b) => b[1] - a[1]).map(([idx]) => parseInt(idx));
    if (sortedProblems.length > 0) {
      const excludeIdx = sortedProblems[0];
      const remainingMatches = matchGroup.filter((_, idx) => idx !== excludeIdx);
      if (remainingMatches.length >= 2) {
        recommendations.push({
          type: "exclude",
          description: `排除比赛 ${excludeIdx + 1}（赔率 ${matchGroup[excludeIdx].odds}），仅投注其他 ${remainingMatches.length} 场`,
          excludedIndex: excludeIdx,
          newComboSize: remainingMatches.length,
          riskReduction: "medium"
        });
      }
    }
    if (matchGroup.length >= 4) {
      recommendations.push({
        type: "split",
        description: "将 4 串分割为多个 2-3 串组合，降低灾难性失败风险",
        suggestedSplits: [
          {
            combo1: [0, 1],
            combo2: [2, 3]
          },
          {
            combo1: [0, 2, 3],
            combo2: [1, 2]
          }
        ],
        riskReduction: "high"
      });
    }
    return recommendations;
  };
  var __testables = {
    computeInvestmentScore,
    getBinaryOutcomeRows,
    toCalibrationMatchRows,
    summarizeModelValidationPrequential,
    bumpAnalyticsRevision,
    calcKellyStake,
    calcKellyRowStake,
    getForecastStates,
    toKellySimulationRowsFromInvestments,
    simulateKellyDivisorDeterministic,
    getRowTemporalTs,
    buildPrequentialWalkForwardWindows,
    evaluateComboTemporalHoldoutQuality,
    evaluateComboPrequentialQuality,
    resolveMonteCarloRuns,
    createSeededRng,
    buildMonteCarloSeed,
    MONTE_CARLO_TARGET_RUNS,
    MONTE_CARLO_MIN_RUNS,
    MONTE_CARLO_OP_BUDGET
  };

  // source/src/lib/naturalInputParser.js
  var naturalInputParser_exports = {};
  __export(naturalInputParser_exports, {
    parseNaturalInput: () => parseNaturalInput
  });
  var MODE_OPTIONS_SORTED = [
    "常规-稳",
    "常规-杠杆",
    "常规-激进",
    "半彩票半保险",
    "保险产品",
    "赌一把",
    "常规"
  ];
  var MODE_ALIASES = /* @__PURE__ */ new Map([
    ["stable", "常规-稳"],
    ["稳", "常规-稳"],
    ["leverage", "常规-杠杆"],
    ["杠杆", "常规-杠杆"],
    ["gamble", "赌一把"],
    ["赌", "赌一把"],
    ["insurance", "保险产品"],
    ["保险", "保险产品"],
    ["half", "半彩票半保险"],
    ["半", "半彩票半保险"],
    ["半保险半常规", "半彩票半保险"]
  ]);
  var escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var isAsciiToken = (value) => /^[a-z0-9_-]+$/i.test(String(value || ""));
  var resolveModeToken = (raw) => {
    const token = String(raw || "").trim();
    if (!token) return null;
    for (const mode of MODE_OPTIONS_SORTED) {
      if (token.toLowerCase() === mode.toLowerCase()) return mode;
    }
    const normalized = token.toLowerCase();
    const aliasMatched = MODE_ALIASES.get(normalized);
    if (aliasMatched) return aliasMatched;
    return null;
  };
  var TYS_SET = /* @__PURE__ */ new Set(["S", "M", "L", "H"]);
  var FID_OPTIONS = [0, 0.25, 0.4, 0.5, 0.6, 0.75];
  var snapFid = (v) => {
    let best = "0.4";
    let bestDist = Infinity;
    for (const opt of FID_OPTIONS) {
      const d = Math.abs(v - opt);
      if (d < bestDist) {
        bestDist = d;
        best = String(opt);
      }
    }
    return best;
  };
  var clamp4 = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  var ENTRY_TOKENS_SHORT = /* @__PURE__ */ new Set([
    "w",
    "d",
    "l",
    "h",
    "a",
    "x",
    "胜",
    "平",
    "负",
    "主",
    "客",
    "win",
    "draw",
    "lose",
    "home",
    "away",
    "主胜",
    "客胜",
    "平局"
  ]);
  var normalizeText2 = (text6) => String(text6 || "").replace(/，/g, ",").replace(/；/g, ";").replace(/。/g, ".").replace(/：/g, ":").replace(/（/g, "(").replace(/）/g, ")").replace(/[／]/g, "/").replace(/[""]/g, '"').replace(/['']/g, "'").replace(/[—–－﹣−]/g, "-").replace(/　/g, " ").replace(/\s+/g, " ").trim();
  var normalizeConfValue = (raw) => {
    const num = Number.parseFloat(raw);
    if (!Number.isFinite(num) || num < 0) return null;
    if (num <= 1) return { value: Math.round(num * 100), warning: null };
    if (num >= 10 && num <= 100) return { value: Math.round(num), warning: null };
    const reconstructed = Math.round(num * 10);
    if (reconstructed >= 10 && reconstructed <= 95) {
      return { value: reconstructed, warning: `conf${raw} → ${reconstructed}%` };
    }
    return { value: Math.round(num), warning: `conf${raw} 含义模糊` };
  };
  var normalizeFseValue = (raw) => {
    const num = Number.parseFloat(raw);
    if (!Number.isFinite(num) || num < 0) return null;
    if (num <= 1) return Math.round(num * 100);
    if (num <= 100) return Math.round(num);
    return null;
  };
  var splitValueGroup = (str) => String(str || "").split(/[/,\s]+/).map((s) => s.trim()).filter((s) => s && /^\d+(?:\.\d+)?$/.test(s));
  var extractParameters = (text6) => {
    const params = {
      conf: [],
      odds: [],
      // flat list of odds values
      oddsGroups: [],
      // per-match groups, each group is an array (for multi-entry linking)
      fse_home: [],
      fse_away: [],
      fse_global: [],
      // when no h/a specified, will be distributed later
      fid: [],
      tys_home: [],
      tys_away: [],
      tys_global: [],
      mode: null,
      actualInput: null,
      remark: ""
    };
    const warnings = [];
    let cleaned = text6;
    const remarkRe = /\b(?:remark|备注|note)[:\s]*(.*)/i;
    const remarkMatch = cleaned.match(remarkRe);
    if (remarkMatch) {
      params.remark = remarkMatch[1].trim();
      cleaned = cleaned.slice(0, remarkMatch.index).trim();
    }
    const modeKeywordRe = /\b(?:mode|模式)[:=\s]*([^\s,;]+)/gi;
    let modeM;
    while ((modeM = modeKeywordRe.exec(cleaned)) !== null) {
      const resolved = resolveModeToken(modeM[1]);
      if (resolved) params.mode = resolved;
    }
    cleaned = cleaned.replace(modeKeywordRe, " ");
    for (const mode of MODE_OPTIONS_SORTED) {
      const idx = cleaned.toLowerCase().indexOf(mode.toLowerCase());
      if (idx !== -1) {
        params.mode = mode;
        cleaned = cleaned.slice(0, idx) + " " + cleaned.slice(idx + mode.length);
        break;
      }
    }
    if (!params.mode) {
      for (const [alias, mode] of MODE_ALIASES) {
        const re = isAsciiToken(alias) ? new RegExp(`\\b${escapeRegex(alias)}\\b`, "i") : new RegExp(escapeRegex(alias), "i");
        if (re.test(cleaned)) {
          params.mode = mode;
          cleaned = cleaned.replace(re, " ");
          break;
        }
      }
    }
    const amountForwardRe = /\b(?:input|inputs|invest|stake|bet|投入|下注|实际投资|投资额)[:\s]*([0-9]+(?:\.[0-9]+)?)/gi;
    let amountM;
    while ((amountM = amountForwardRe.exec(cleaned)) !== null) {
      const n = Number.parseFloat(amountM[1]);
      if (Number.isFinite(n) && n > 0) params.actualInput = Math.max(1, Math.round(n));
    }
    cleaned = cleaned.replace(amountForwardRe, " ");
    const amountReverseRe = /([0-9]+(?:\.[0-9]+)?)\s*(?:(?:input|inputs|invest|stake|bet)\b|元|块|rmb\b)/gi;
    while ((amountM = amountReverseRe.exec(cleaned)) !== null) {
      const n = Number.parseFloat(amountM[1]);
      if (Number.isFinite(n) && n > 0) params.actualInput = Math.max(1, Math.round(n));
    }
    cleaned = cleaned.replace(amountReverseRe, " ");
    const fseHRe = /\bfse[\s_-]*(?:h|home|主)[:\s]*(\d+(?:\.\d+)?)/gi;
    const fseARe = /\bfse[\s_-]*(?:a|away|客)[:\s]*(\d+(?:\.\d+)?)/gi;
    let fseM;
    while ((fseM = fseHRe.exec(cleaned)) !== null) {
      const v = normalizeFseValue(fseM[1]);
      if (v !== null) params.fse_home.push(v);
    }
    cleaned = cleaned.replace(fseHRe, " ");
    while ((fseM = fseARe.exec(cleaned)) !== null) {
      const v = normalizeFseValue(fseM[1]);
      if (v !== null) params.fse_away.push(v);
    }
    cleaned = cleaned.replace(fseARe, " ");
    const fseGlobalRe = /\bfse[:\s]*([\d./,\s]+)/gi;
    while ((fseM = fseGlobalRe.exec(cleaned)) !== null) {
      const vals = splitValueGroup(fseM[1]);
      for (const v of vals) {
        const n = normalizeFseValue(v);
        if (n !== null) params.fse_global.push(n);
      }
    }
    cleaned = cleaned.replace(/\bfse[:\s]*[\d./,\s]+/gi, " ");
    const tysHRe = /\btys[\s_-]*(?:h|home|主)[:\s]*([smlhSMLH])/gi;
    const tysARe = /\btys[\s_-]*(?:a|away|客)[:\s]*([smlhSMLH])/gi;
    let tysM;
    while ((tysM = tysHRe.exec(cleaned)) !== null) {
      const v = tysM[1].toUpperCase();
      if (TYS_SET.has(v)) params.tys_home.push(v);
    }
    cleaned = cleaned.replace(tysHRe, " ");
    while ((tysM = tysARe.exec(cleaned)) !== null) {
      const v = tysM[1].toUpperCase();
      if (TYS_SET.has(v)) params.tys_away.push(v);
    }
    cleaned = cleaned.replace(tysARe, " ");
    const tysGlobalRe = /\btys[:\s]*([smlhSMLH])(?:[\s/,]+([smlhSMLH]))?/gi;
    while ((tysM = tysGlobalRe.exec(cleaned)) !== null) {
      const v1 = tysM[1].toUpperCase();
      if (TYS_SET.has(v1)) params.tys_global.push(v1);
      if (tysM[2]) {
        const v2 = tysM[2].toUpperCase();
        if (TYS_SET.has(v2)) params.tys_global.push(v2);
      }
    }
    cleaned = cleaned.replace(/\btys[:\s]*[smlhSMLH](?:[\s/,]+[smlhSMLH])?/gi, " ");
    const confFwdRe = /\bconf[:\s]*([\d./,\s]+)/gi;
    let cM;
    while ((cM = confFwdRe.exec(cleaned)) !== null) {
      for (const v of splitValueGroup(cM[1])) {
        const parsed = normalizeConfValue(v);
        if (parsed) {
          params.conf.push(parsed.value);
          if (parsed.warning) warnings.push(parsed.warning);
        }
      }
    }
    cleaned = cleaned.replace(confFwdRe, " ");
    const confRevRe = /([\d./,\s]+)\s*\bconf\b/gi;
    while ((cM = confRevRe.exec(cleaned)) !== null) {
      for (const v of splitValueGroup(cM[1])) {
        const parsed = normalizeConfValue(v);
        if (parsed) {
          params.conf.push(parsed.value);
          if (parsed.warning) warnings.push(parsed.warning);
        }
      }
    }
    cleaned = cleaned.replace(confRevRe, " ");
    const oddsFwdRe = /\bodds[:\s]*([\d./,\s]+)/gi;
    let oM;
    while ((oM = oddsFwdRe.exec(cleaned)) !== null) {
      const group = [];
      for (const v of splitValueGroup(oM[1])) {
        const n = Number.parseFloat(v);
        if (Number.isFinite(n) && n >= 1) {
          params.odds.push(n);
          group.push(n);
        }
      }
      if (group.length > 0) params.oddsGroups.push(group);
    }
    cleaned = cleaned.replace(oddsFwdRe, " ");
    const oddsRevRe = /([\d./,\s]+)\s*\bodds\b/gi;
    while ((oM = oddsRevRe.exec(cleaned)) !== null) {
      const group = [];
      for (const v of splitValueGroup(oM[1])) {
        const n = Number.parseFloat(v);
        if (Number.isFinite(n) && n >= 1) {
          params.odds.push(n);
          group.push(n);
        }
      }
      if (group.length > 0) params.oddsGroups.push(group);
    }
    cleaned = cleaned.replace(oddsRevRe, " ");
    const fidFwdRe = /\bfid[:\s]*([\d./,\s]+)/gi;
    let fM;
    while ((fM = fidFwdRe.exec(cleaned)) !== null) {
      for (const v of splitValueGroup(fM[1])) {
        const n = Number.parseFloat(v);
        if (Number.isFinite(n)) params.fid.push(snapFid(n));
      }
    }
    cleaned = cleaned.replace(fidFwdRe, " ");
    const fidRevRe = /([\d./,\s]+)\s*\bfid\b/gi;
    while ((fM = fidRevRe.exec(cleaned)) !== null) {
      for (const v of splitValueGroup(fM[1])) {
        const n = Number.parseFloat(v);
        if (Number.isFinite(n)) params.fid.push(snapFid(n));
      }
    }
    cleaned = cleaned.replace(fidRevRe, " ");
    const bareOddsRe = /(^|[^\p{L}\p{N}.:+-])(\d+(?:\.\d+)?)(?=$|[^\p{L}\p{N}.])/gu;
    const bareOddsMatches = [];
    let bareOddsMatch;
    while ((bareOddsMatch = bareOddsRe.exec(cleaned)) !== null) {
      const value = Number.parseFloat(bareOddsMatch[2]);
      const numberStart = bareOddsMatch.index + bareOddsMatch[1].length;
      const after = cleaned[numberStart + bareOddsMatch[2].length] || "";
      if (!Number.isFinite(value) || value <= 1 || value > 1e3 || /[-:]/.test(after)) continue;
      bareOddsMatches.push({ start: numberStart, end: numberStart + bareOddsMatch[2].length, value });
    }
    if (bareOddsMatches.length > 0) {
      bareOddsMatches.forEach(({ value }) => {
        params.odds.push(value);
        params.oddsGroups.push([value]);
      });
      let cursor = 0;
      cleaned = bareOddsMatches.map(({ start, end }) => {
        const prefix = cleaned.slice(cursor, start);
        cursor = end;
        return prefix;
      }).join("") + cleaned.slice(cursor);
    }
    cleaned = cleaned.replace(/\s+/g, " ").trim();
    return { params, warnings, contentText: cleaned };
  };
  var _cachedDict = null;
  var _cachedDictTimestamp = 0;
  var buildAliasDictionary = (profiles) => {
    const entries = [];
    for (const profile of profiles) {
      const aliases = /* @__PURE__ */ new Set();
      if (profile.teamName) aliases.add(profile.teamName);
      if (Array.isArray(profile.abbreviations)) {
        for (const a of profile.abbreviations) {
          if (a && a.trim()) aliases.add(a.trim());
        }
      }
      for (const alias of aliases) {
        entries.push({
          alias,
          aliasLower: alias.toLowerCase(),
          len: alias.length,
          teamId: profile.teamId,
          teamName: profile.teamName
        });
      }
    }
    entries.sort((a, b) => b.len - a.len);
    const seen = /* @__PURE__ */ new Set();
    return entries.filter((e) => {
      if (seen.has(e.aliasLower)) return false;
      seen.add(e.aliasLower);
      return true;
    });
  };
  var getAliasDictionary = () => {
    const now = Date.now();
    if (_cachedDict && now - _cachedDictTimestamp < 3e4) return _cachedDict;
    const profiles = getTeamDirectoryProfiles();
    _cachedDict = buildAliasDictionary(profiles);
    _cachedDictTimestamp = now;
    return _cachedDict;
  };
  var isLatinAlphanumeric = (ch) => /[a-zA-Z0-9]/.test(ch);
  var isWordBoundary = (text6, start, end) => {
    const before = start > 0 ? text6[start - 1] : "";
    const after = end < text6.length ? text6[end] : "";
    const beforeOk = !before || !isLatinAlphanumeric(before);
    const afterOk = !after || !isLatinAlphanumeric(after);
    return beforeOk && afterOk;
  };
  var scanTeamNames = (text6, dict) => {
    const results = [];
    const lower = text6.toLowerCase();
    let pos = 0;
    while (pos < lower.length) {
      let matched = false;
      for (const entry of dict) {
        if (pos + entry.len > lower.length) continue;
        if (!lower.startsWith(entry.aliasLower, pos)) continue;
        if (ENTRY_TOKENS_SHORT.has(entry.aliasLower)) continue;
        if (entry.len <= 4 && /^[a-z]+$/i.test(entry.alias)) {
          if (!isWordBoundary(text6, pos, pos + entry.len)) continue;
        }
        if (/^[a-z\s]+$/i.test(entry.alias) && entry.alias.includes(" ")) {
          if (!isWordBoundary(text6, pos, pos + entry.len)) continue;
        }
        results.push({
          teamId: entry.teamId,
          teamName: entry.teamName,
          alias: entry.alias,
          start: pos,
          end: pos + entry.len
        });
        pos += entry.len;
        matched = true;
        break;
      }
      if (!matched) pos++;
    }
    return results;
  };
  var VERSUS_RE = /^(vs|v|对阵|对|×)$/i;
  var SHORT_OUTCOME_TOKEN_MAP = /* @__PURE__ */ new Map([
    ["w", "win"],
    ["h", "win"],
    ["home", "win"],
    ["win", "win"],
    ["d", "draw"],
    ["x", "draw"],
    ["draw", "draw"],
    ["l", "lose"],
    ["a", "lose"],
    ["away", "lose"],
    ["lose", "lose"]
  ]);
  var getCanonicalEntryName = (rawToken, semantic) => {
    if (!semantic || semantic.marketType !== "result") return semantic?.name || String(rawToken || "");
    const key = String(rawToken || "").trim().toLowerCase().replace(/\s+/g, "");
    const mapped = SHORT_OUTCOME_TOKEN_MAP.get(key);
    if (mapped) return mapped;
    if (semantic.semanticKey === "win") return "win";
    if (semantic.semanticKey === "draw") return "draw";
    if (semantic.semanticKey === "lose") return "lose";
    return semantic.name || String(rawToken || "");
  };
  var parseGapAsEntries = (gapText) => {
    if (!gapText || !gapText.trim()) return { entries: [], isVersus: false, unknown: [] };
    const cleaned = gapText.replace(/^[\s,;.]+|[\s,;.]+$/g, "").trim();
    if (!cleaned) return { entries: [], isVersus: false, unknown: [] };
    if (VERSUS_RE.test(cleaned)) return { entries: [], isVersus: true, unknown: [] };
    const slashParts = cleaned.split(/\//).map((s) => s.trim()).filter(Boolean);
    const entries = [];
    const unknown = [];
    for (const part of slashParts) {
      const semantic = parseEntrySemantic(part);
      if (semantic.marketType !== "other") {
        entries.push({ name: getCanonicalEntryName(part, semantic), semantic });
        continue;
      }
      const spaceParts = part.split(/\s+/).filter(Boolean);
      let anyParsed = false;
      for (const sp of spaceParts) {
        const sem = parseEntrySemantic(sp);
        if (sem.marketType !== "other") {
          entries.push({ name: getCanonicalEntryName(sp, sem), semantic: sem });
          anyParsed = true;
        } else {
          unknown.push(sp);
        }
      }
      if (!anyParsed && spaceParts.length > 0) {
      }
    }
    return { entries, isVersus: false, unknown };
  };
  var extractSegments = (text6, teamHits) => {
    const segments = [];
    let cursor = 0;
    for (const hit of teamHits) {
      if (cursor < hit.start) {
        const gap = text6.slice(cursor, hit.start);
        if (gap.trim()) segments.push({ type: "gap", text: gap.trim(), start: cursor, end: hit.start });
      }
      segments.push({ type: "team", ...hit });
      cursor = hit.end;
    }
    if (cursor < text6.length) {
      const gap = text6.slice(cursor).trim();
      if (gap) segments.push({ type: "gap", text: gap, start: cursor, end: text6.length });
    }
    return segments;
  };
  var segmentMatches = (segments) => {
    const matches = [];
    let i = 0;
    while (i < segments.length) {
      const seg = segments[i];
      if (seg.type === "team") {
        const home = seg;
        if (i + 2 < segments.length && segments[i + 1].type === "gap" && segments[i + 2].type === "team") {
          const gap = parseGapAsEntries(segments[i + 1].text);
          if (gap.entries.length > 0 || gap.isVersus) {
            const away = segments[i + 2];
            const match = {
              home: { teamId: home.teamId, teamName: home.teamName, alias: home.alias },
              away: { teamId: away.teamId, teamName: away.teamName, alias: away.alias },
              entries: gap.entries,
              rawEntryText: segments[i + 1].text
            };
            i += 3;
            if (i < segments.length && segments[i].type === "gap") {
              const trailing = parseGapAsEntries(segments[i].text);
              if (trailing.entries.length > 0) {
                match.entries.push(...trailing.entries);
                match.rawEntryText = (match.rawEntryText || "") + " " + segments[i].text;
                i++;
              }
            }
            matches.push(match);
            continue;
          }
        }
        if (i + 1 < segments.length && segments[i + 1].type === "team") {
          const away = segments[i + 1];
          matches.push({
            home: { teamId: home.teamId, teamName: home.teamName, alias: home.alias },
            away: { teamId: away.teamId, teamName: away.teamName, alias: away.alias },
            entries: [],
            rawEntryText: ""
          });
          i += 2;
          continue;
        }
        if (i + 1 < segments.length && segments[i + 1].type === "gap") {
          const gap = parseGapAsEntries(segments[i + 1].text);
          if (gap.entries.length > 0) {
            const firstEntry = gap.entries[0];
            const isAway = firstEntry.semantic?.semanticKey === "lose" || firstEntry.name === "客胜" || firstEntry.name === "客";
            matches.push({
              home: isAway ? null : { teamId: home.teamId, teamName: home.teamName, alias: home.alias },
              away: isAway ? { teamId: home.teamId, teamName: home.teamName, alias: home.alias } : null,
              entries: gap.entries,
              rawEntryText: segments[i + 1].text
            });
            i += 2;
            continue;
          }
        }
        matches.push({
          home: { teamId: home.teamId, teamName: home.teamName, alias: home.alias },
          away: null,
          entries: [],
          rawEntryText: ""
        });
        i++;
        continue;
      }
      if (seg.type === "gap") {
        const gap = parseGapAsEntries(seg.text);
        if (gap.entries.length > 0 && i + 1 < segments.length && segments[i + 1].type === "team") {
          const nextTeam = segments[i + 1];
          const firstEntry = gap.entries[0];
          const isAway = firstEntry.semantic?.semanticKey === "lose" || firstEntry.name === "客胜" || firstEntry.name === "客";
          matches.push({
            home: isAway ? null : { teamId: nextTeam.teamId, teamName: nextTeam.teamName, alias: nextTeam.alias },
            away: isAway ? { teamId: nextTeam.teamId, teamName: nextTeam.teamName, alias: nextTeam.alias } : null,
            entries: gap.entries,
            rawEntryText: seg.text
          });
          i += 2;
          continue;
        }
        i++;
        continue;
      }
      i++;
    }
    return matches;
  };
  var assignParameters = (matches, params) => {
    const n = matches.length;
    if (n === 0) return;
    const assignSimple = (arr, setter) => {
      if (!arr || arr.length === 0) return;
      if (arr.length === 1) {
        matches.forEach((m) => setter(m, arr[0]));
      } else {
        matches.forEach((m, i) => {
          if (i < arr.length) setter(m, arr[i]);
        });
      }
    };
    assignSimple(params.conf, (m, v) => {
      m.conf = clamp4(v, 0, 100);
    });
    assignSimple(params.fid, (m, v) => {
      m.fid = v;
    });
    if (params.mode) {
      matches.forEach((m) => {
        m.mode = params.mode;
      });
    }
    if (params.remark) {
      matches.forEach((m) => {
        m.remark = params.remark;
      });
    }
    if (params.fse_home.length > 0 || params.fse_away.length > 0) {
      assignSimple(params.fse_home, (m, v) => {
        m.fse_home = clamp4(v, 0, 100);
      });
      assignSimple(params.fse_away, (m, v) => {
        m.fse_away = clamp4(v, 0, 100);
      });
    } else if (params.fse_global.length > 0) {
      const fg = params.fse_global;
      if (fg.length === 1) {
        matches.forEach((m) => {
          m.fse_home = clamp4(fg[0], 0, 100);
          m.fse_away = clamp4(fg[0], 0, 100);
        });
      } else if (fg.length === 2 && n === 1) {
        matches[0].fse_home = clamp4(fg[0], 0, 100);
        matches[0].fse_away = clamp4(fg[1], 0, 100);
      } else if (fg.length === n * 2) {
        matches.forEach((m, i) => {
          m.fse_home = clamp4(fg[i * 2], 0, 100);
          m.fse_away = clamp4(fg[i * 2 + 1], 0, 100);
        });
      } else if (fg.length >= 2 && fg.length % 2 === 0) {
        const pairs = Math.min(Math.floor(fg.length / 2), n);
        for (let i = 0; i < pairs; i++) {
          matches[i].fse_home = clamp4(fg[i * 2], 0, 100);
          matches[i].fse_away = clamp4(fg[i * 2 + 1], 0, 100);
        }
      } else {
        assignSimple(fg, (m, v) => {
          m.fse_home = clamp4(v, 0, 100);
          m.fse_away = clamp4(v, 0, 100);
        });
      }
    }
    if (params.tys_home.length > 0 || params.tys_away.length > 0) {
      assignSimple(params.tys_home, (m, v) => {
        m.tys_home = v;
      });
      assignSimple(params.tys_away, (m, v) => {
        m.tys_away = v;
      });
    } else if (params.tys_global.length > 0) {
      const tg = params.tys_global;
      if (tg.length === 1) {
        matches.forEach((m) => {
          m.tys_home = tg[0];
          m.tys_away = tg[0];
        });
      } else if (tg.length === 2 && n === 1) {
        matches[0].tys_home = tg[0];
        matches[0].tys_away = tg[1];
      } else if (tg.length === n * 2) {
        matches.forEach((m, i) => {
          m.tys_home = tg[i * 2];
          m.tys_away = tg[i * 2 + 1];
        });
      } else if (tg.length >= 2 && tg.length % 2 === 0) {
        const pairs = Math.min(Math.floor(tg.length / 2), n);
        for (let i = 0; i < pairs; i++) {
          matches[i].tys_home = tg[i * 2];
          matches[i].tys_away = tg[i * 2 + 1];
        }
      } else {
        assignSimple(tg, (m, v) => {
          m.tys_home = v;
          m.tys_away = v;
        });
      }
    }
    if (params.oddsGroups.length > 0) {
      const groups = params.oddsGroups;
      matches.forEach((m, mi) => {
        let group = null;
        if (groups.length === 1) {
          group = groups[0];
          if (n > 1 && mi > 0) group = null;
        } else if (mi < groups.length) {
          group = groups[mi];
        }
        if (!group || group.length === 0) return;
        if (m.entries.length > 0) {
          m.entries.forEach((e, ei) => {
            if (ei < group.length) {
              e.assignedOdds = group[ei];
            }
          });
        } else {
          m.assignedOdds = group[0];
        }
      });
    } else if (params.odds.length > 0) {
      assignSimple(params.odds, (m, v) => {
        if (m.entries.length > 0) {
          m.entries[0].assignedOdds = v;
        } else {
          m.assignedOdds = v;
        }
      });
    }
  };
  var buildMatchDraft = (parsed) => {
    const entries = parsed.entries.length > 0 ? parsed.entries.map((e) => ({
      name: e.name || "",
      odds: String(e.assignedOdds || "")
    })) : [{ name: "", odds: String(parsed.assignedOdds || "") }];
    return {
      homeTeam: parsed.home?.teamName || "",
      awayTeam: parsed.away?.teamName || "",
      entries,
      conf: parsed.conf ?? 50,
      mode: parsed.mode || "常规",
      tys_home: parsed.tys_home || "M",
      tys_away: parsed.tys_away || "M",
      fid: parsed.fid || "0.4",
      fse_home: parsed.fse_home ?? "default",
      fse_away: parsed.fse_away ?? "default",
      note: parsed.remark || "",
      _nlMeta: {
        homeResolution: parsed.home ? { teamId: parsed.home.teamId, alias: parsed.home.alias } : null,
        awayResolution: parsed.away ? { teamId: parsed.away.teamId, alias: parsed.away.alias } : null,
        rawEntryText: parsed.rawEntryText || ""
      }
    };
  };
  var scoreParse = (matches, diagnostics) => {
    if (matches.length === 0) return 0;
    let score = 0.3;
    if (matches.every((m) => m.homeTeam || m.awayTeam)) score += 0.25;
    if (matches.every((m) => m.entries.some((e) => e.name))) score += 0.2;
    if (matches.every((m) => m.homeTeam && m.awayTeam)) score += 0.15;
    if (diagnostics.filter((d) => d.level === "warning").length === 0) score += 0.1;
    return Math.min(1, score);
  };
  var parseNaturalInput = (rawText) => {
    const diagnostics = [];
    if (!rawText || !rawText.trim()) {
      return { matches: [], diagnostics: [{ level: "info", message: "输入为空" }], confidence: 0, rawInput: rawText || "", actualInput: null };
    }
    const normalized = normalizeText2(rawText);
    const { params, warnings: paramWarnings, contentText } = extractParameters(normalized);
    for (const w of paramWarnings) diagnostics.push({ level: "warning", message: w });
    const dict = getAliasDictionary();
    const teamHits = scanTeamNames(contentText, dict);
    if (teamHits.length === 0) {
      diagnostics.push({ level: "error", message: "未识别到任何球队名称" });
      return { matches: [], diagnostics, confidence: 0, rawInput: rawText, actualInput: params.actualInput };
    }
    const segments = extractSegments(contentText, teamHits);
    const rawMatches = segmentMatches(segments);
    if (rawMatches.length === 0) {
      diagnostics.push({ level: "error", message: "无法组合出有效比赛" });
      return { matches: [], diagnostics, confidence: 0.1, rawInput: rawText, actualInput: params.actualInput };
    }
    assignParameters(rawMatches, params);
    const matches = rawMatches.map(buildMatchDraft);
    matches.forEach((m, idx) => {
      if (!m.homeTeam && !m.awayTeam) {
        diagnostics.push({ level: "error", message: `比赛 ${idx + 1}: 缺少球队`, matchIndex: idx });
      } else if (!m.homeTeam || !m.awayTeam) {
        diagnostics.push({ level: "info", message: `比赛 ${idx + 1}: 仅识别到一支球队 (${m.homeTeam || m.awayTeam})，请补充对手`, matchIndex: idx });
      }
      if (!m.entries.some((e) => e.name)) {
        diagnostics.push({ level: "info", message: `比赛 ${idx + 1}: 未识别到投注项，请手动填写`, matchIndex: idx });
      }
      if (!m.entries.some((e) => e.odds)) {
        diagnostics.push({ level: "info", message: `比赛 ${idx + 1}: 缺少赔率`, matchIndex: idx });
      }
    });
    const confidence = scoreParse(matches, diagnostics);
    return { matches, diagnostics, confidence, rawInput: rawText, actualInput: params.actualInput };
  };

  // source/src/lib/quantStrategy.js
  var quantStrategy_exports = {};
  __export(quantStrategy_exports, {
    DEFAULT_DISCOVERY_TEMPLATES: () => DEFAULT_DISCOVERY_TEMPLATES,
    DEGRADED_WARNING: () => DEGRADED_WARNING,
    STRATEGY_STATUS_LABELS: () => STRATEGY_STATUS_LABELS,
    aliasesForTeam: () => aliasesForTeam,
    analyzeStrategy: () => analyzeStrategy,
    autoRetireStrategy: () => autoRetireStrategy,
    autoVoidStalePositions: () => autoVoidStalePositions,
    backtestStrategy: () => backtestStrategy,
    baseProbability: () => baseProbability,
    binomialPmf: () => binomialPmf,
    buildInvestmentFromPosition: () => buildInvestmentFromPosition,
    buildLegs: () => buildLegs,
    createEmptySpec: () => createEmptySpec,
    deleteStrategy: () => deleteStrategy,
    discoverStrategies: () => discoverStrategies,
    exportStrategiesCsv: () => exportStrategiesCsv,
    getStrategies: () => getStrategies,
    kellyStakeForPool: () => kellyStakeForPool,
    markPositionExecuted: () => markPositionExecuted,
    matchVenueForTeam: () => matchVenueForTeam,
    normalizeSpec: () => normalizeSpec,
    refreshClosingOdds: () => refreshClosingOdds,
    saveStrategy: () => saveStrategy,
    settleStrategyPositions: () => settleStrategyPositions,
    simulateStrategyPortfolio: () => simulateStrategyPortfolio,
    specFromDiscoveryRow: () => specFromDiscoveryRow,
    strategyPortfolio: () => strategyPortfolio,
    strategyPositionsCsv: () => strategyPositionsCsv,
    strategyQualityScore: () => strategyQualityScore,
    strategyStats: () => strategyStats,
    syncStrategyFixtures: () => syncStrategyFixtures,
    updateStrategy: () => updateStrategy,
    validateExecution: () => validateExecution,
    voidStrategyPosition: () => voidStrategyPosition,
    walkForwardStrategy: () => walkForwardStrategy,
    wilsonInterval: () => wilsonInterval
  });

  // source/src/lib/readQuality.js
  var READ_TIERS = Object.freeze({
    R3: "R3_scoreline",
    R2A: "R2A_lined",
    R2B: "R2B_intensity",
    R1: "R1_binary"
  });
  var READ_TIER_LABELS = Object.freeze({
    [READ_TIERS.R3]: "R3 · 比分登记",
    [READ_TIERS.R2A]: "R2A · 盘口线自带",
    [READ_TIERS.R2B]: "R2B · 方向+强度（预留）",
    [READ_TIERS.R1]: "R1 · 仅结果"
  });
  var SCORELINE_EXPONENTIAL_SCALE = 1.8;
  var SCORELINE_TRANSFORMS = Object.freeze({
    sqrt: (value) => Math.sign(value) * Math.sqrt(Math.abs(value)),
    saturating: (value) => value / (1 + Math.abs(value)),
    exponential: (value) => Math.sign(value) * (1 - Math.exp(-Math.abs(value) / SCORELINE_EXPONENTIAL_SCALE))
  });
  var SCORELINE_DISTANCE_DEFAULTS = Object.freeze({
    transform: "exponential",
    totalWeight: 0.31,
    exponentialScale: SCORELINE_EXPONENTIAL_SCALE
  });
  var lnFactorial = (n) => {
    let sum = 0;
    for (let i = 2; i <= n; i += 1) sum += Math.log(i);
    return sum;
  };
  var poissonPmf = (k, lambda) => {
    const goalCount = Math.max(0, Math.round(Number(k)));
    const mean = Number(lambda);
    if (!Number.isFinite(mean) || mean < 0) return 0;
    if (mean === 0) return goalCount === 0 ? 1 : 0;
    return Math.exp(-mean + goalCount * Math.log(mean) - lnFactorial(goalCount));
  };
  var deriveScoreDistribution = (homeLambda, awayLambda, maxGoals = 8) => {
    const homeP = [];
    const awayP = [];
    for (let goals = 0; goals <= maxGoals; goals += 1) {
      homeP.push(poissonPmf(goals, homeLambda));
      awayP.push(poissonPmf(goals, awayLambda));
    }
    const cells = [];
    for (let home = 0; home <= maxGoals; home += 1) {
      for (let away = 0; away <= maxGoals; away += 1) {
        cells.push({ home, away, p: homeP[home] * awayP[away] });
      }
    }
    return cells;
  };
  var deriveMarketProbabilities = (homeLambda, awayLambda, { maxGoals = 8, totalLines = [1.5, 2.5, 3.5], handicapLines = [-1, 0, 1] } = {}) => {
    const cells = deriveScoreDistribution(homeLambda, awayLambda, maxGoals);
    return marketProbabilitiesFromCells(cells, { totalLines, handicapLines });
  };
  var marketProbabilitiesFromCells = (cellsInput, { totalLines = [1.5, 2.5, 3.5], handicapLines = [-1, 0, 1] } = {}) => {
    const cells = Array.isArray(cellsInput) ? cellsInput : [];
    const sum = (predicate) => cells.reduce((acc, cell) => acc + (predicate(cell) ? cell.p : 0), 0);
    const oneXTwo = {
      home: sum((c) => c.home > c.away),
      draw: sum((c) => c.home === c.away),
      away: sum((c) => c.home < c.away)
    };
    const totals = totalLines.map((line) => ({
      line,
      over: sum((c) => c.home + c.away > line),
      push: sum((c) => c.home + c.away === line),
      under: sum((c) => c.home + c.away < line)
    }));
    const handicaps = handicapLines.map((line) => ({
      line,
      win: sum((c) => c.home + line > c.away),
      push: sum((c) => c.home + line === c.away),
      lose: sum((c) => c.home + line < c.away)
    }));
    const topScores = [...cells].sort((a, b) => b.p - a.p).slice(0, 6).map((cell) => ({ score: `${cell.home}-${cell.away}`, p: cell.p }));
    return { oneXTwo, totals, handicaps, topScores };
  };
  var deVigProportional = (oddsList) => {
    const implied = (Array.isArray(oddsList) ? oddsList : []).map((odds) => {
      const value = Number(odds);
      return Number.isFinite(value) && value > 1 ? 1 / value : Number.NaN;
    });
    if (implied.some((value) => !Number.isFinite(value))) return { ok: false, overround: Number.NaN, fair: [] };
    const sum = implied.reduce((acc, value) => acc + value, 0);
    if (!(sum > 0)) return { ok: false, overround: Number.NaN, fair: [] };
    return {
      ok: true,
      overround: Number((sum - 1).toFixed(4)),
      fair: implied.map((value) => value / sum)
    };
  };
  var marketTargetsFromInput = (input = {}) => {
    const targets = [];
    const notes = [];
    const oneXTwoOdds = input.oneXTwo;
    if (oneXTwoOdds) {
      const devig = deVigProportional([oneXTwoOdds.home, oneXTwoOdds.draw, oneXTwoOdds.away]);
      if (devig.ok) {
        targets.push({ key: "home", label: "主胜", value: devig.fair[0] });
        targets.push({ key: "draw", label: "平", value: devig.fair[1] });
        targets.push({ key: "away", label: "客胜", value: devig.fair[2] });
      } else {
        notes.push("1X2 赔率不完整或非十进制，未参与倒算");
      }
    }
    ;
    (Array.isArray(input.totals) ? input.totals : []).forEach((row) => {
      const devig = deVigProportional([row?.over, row?.under]);
      if (devig.ok && Number.isFinite(Number(row?.line))) {
        targets.push({ key: `over:${Number(row.line)}`, label: `大 ${Number(row.line)}`, value: devig.fair[0] });
        targets.push({ key: `under:${Number(row.line)}`, label: `小 ${Number(row.line)}`, value: devig.fair[1] });
      } else {
        notes.push(`大小球 ${row?.line ?? "?"} 赔率需两边都给，未参与倒算`);
      }
    });
    (Array.isArray(input.handicaps) ? input.handicaps : []).forEach((row) => {
      const devig = deVigProportional([row?.win, row?.draw, row?.lose]);
      const line = Number(row?.line);
      if (devig.ok && Number.isFinite(line)) {
        targets.push({ key: `handicap:${line}:win`, label: `让 ${line} 主`, value: devig.fair[0] });
        targets.push({ key: `handicap:${line}:push`, label: `让 ${line} 走`, value: devig.fair[1] });
        targets.push({ key: `handicap:${line}:lose`, label: `让 ${line} 客`, value: devig.fair[2] });
      } else {
        notes.push(`让球 ${Number.isFinite(line) ? line : "?"} 赔率需三项都给，未参与倒算`);
      }
    });
    return { targets, notes };
  };
  var fitMarketLambdas = (input = {}, { maxGoals = 8, coarseStep = 0.1, fineStep = 0.02, min = 0.2, max = 3.6 } = {}) => {
    const { targets, notes } = marketTargetsFromInput(input);
    if (targets.length < 3) {
      return { ready: false, reason: "insufficient_market_input", targets: [], notes, samples: targets.length };
    }
    const lineOf = (prefix) => [...new Set(
      targets.filter((target) => target.key.startsWith(`${prefix}:`)).map((target) => Number(target.key.split(":")[1])).filter(Number.isFinite)
    )];
    const totalLines = lineOf("over");
    const handicapLines = lineOf("handicap");
    const marketOptions = {
      maxGoals,
      ...totalLines.length ? { totalLines } : {},
      ...handicapLines.length ? { handicapLines } : {}
    };
    const marketValueMap = (markets2) => {
      const valueByKey2 = {
        home: markets2.oneXTwo.home,
        draw: markets2.oneXTwo.draw,
        away: markets2.oneXTwo.away
      };
      markets2.totals.forEach((row) => {
        valueByKey2[`over:${row.line}`] = row.over;
        valueByKey2[`under:${row.line}`] = row.under;
      });
      markets2.handicaps.forEach((row) => {
        valueByKey2[`handicap:${row.line}:win`] = row.win;
        valueByKey2[`handicap:${row.line}:push`] = row.push;
        valueByKey2[`handicap:${row.line}:lose`] = row.lose;
      });
      return valueByKey2;
    };
    const evaluate2 = (home, away) => {
      const markets2 = deriveMarketProbabilities(home, away, marketOptions);
      const valueByKey2 = marketValueMap(markets2);
      let sse = 0;
      targets.forEach((target) => {
        const model = valueByKey2[target.key];
        if (Number.isFinite(model)) sse += (model - target.value) ** 2;
      });
      return { sse, markets: markets2 };
    };
    let best = { home: DEFAULT_LAMBDA_PRIOR.home, away: DEFAULT_LAMBDA_PRIOR.away, sse: Number.POSITIVE_INFINITY };
    for (let home = min; home <= max + 1e-9; home += coarseStep) {
      for (let away = min; away <= max + 1e-9; away += coarseStep) {
        const { sse } = evaluate2(home, away);
        if (sse < best.sse) best = { home, away, sse };
      }
    }
    const coarseBest = { ...best };
    for (let home = Math.max(min, coarseBest.home - coarseStep * 1.5); home <= Math.min(max, coarseBest.home + coarseStep * 1.5) + 1e-9; home += fineStep) {
      for (let away = Math.max(min, coarseBest.away - coarseStep * 1.5); away <= Math.min(max, coarseBest.away + coarseStep * 1.5) + 1e-9; away += fineStep) {
        const { sse } = evaluate2(home, away);
        if (sse < best.sse) best = { home, away, sse };
      }
    }
    const { markets } = evaluate2(best.home, best.away);
    const valueByKey = marketValueMap(markets);
    return {
      ready: true,
      homeLambda: Number(best.home.toFixed(3)),
      awayLambda: Number(best.away.toFixed(3)),
      sse: Number(best.sse.toFixed(6)),
      samples: targets.length,
      notes,
      targets: targets.map((target) => ({
        ...target,
        model: Number((valueByKey[target.key] ?? Number.NaN).toFixed(4)),
        delta: Number(((valueByKey[target.key] ?? Number.NaN) - target.value).toFixed(4))
      }))
    };
  };
  var DEFAULT_LAMBDA_PRIOR = Object.freeze({ home: 1.45, away: 1.15 });

  // source/src/lib/marketOdds.js
  var marketOddsForFit = (match) => {
    if (!match?.had) return null;
    const handicaps = match.hhad ? [{ line: match.hhad.goalLine, win: match.hhad.home, draw: match.hhad.draw, lose: match.hhad.away }] : [];
    return { oneXTwo: { home: match.had.home, draw: match.had.draw, away: match.had.away }, handicaps };
  };
  var marketScorelineProbabilities = (match) => {
    const cells = Array.isArray(match?.scores) ? match.scores : [];
    const other = match?.other;
    const options = [
      ...cells.map((cell) => ({ type: "cell", home: cell.home, away: cell.away, odds: cell.odds })),
      ...other ? [
        { type: "other", side: "win", odds: other.win },
        { type: "other", side: "draw", odds: other.draw },
        { type: "other", side: "away", odds: other.away }
      ] : []
    ];
    if (cells.length < 10 || !other) {
      return { ok: false, reason: "insufficient_scoreline_quotes", cells: [], other: null, overround: Number.NaN };
    }
    const devig = deVigProportional(options.map((option) => option.odds));
    if (!devig.ok) return { ok: false, reason: "invalid_scoreline_odds", cells: [], other: null, overround: Number.NaN };
    const fairCells = [];
    const fairOther = { win: Number.NaN, draw: Number.NaN, away: Number.NaN };
    options.forEach((option, index) => {
      const probability = devig.fair[index];
      if (option.type === "cell") fairCells.push({ home: option.home, away: option.away, probability });
      else fairOther[option.side] = probability;
    });
    return {
      ok: true,
      overround: devig.overround,
      samples: options.length,
      cells: fairCells,
      other: fairOther,
      updatedAt: match?.crsUpdatedAt || ""
    };
  };

  // source/src/lib/matchResults.js
  var text2 = (value) => String(value ?? "").trim();
  var normalizeMatchDate = (value) => {
    if (value == null) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    const direct = raw.match(/(\d{4})[-/年.](\d{1,2})[-/月.](\d{1,2})/);
    if (direct) {
      const year = Number(direct[1]);
      const month = Number(direct[2]);
      const day = Number(direct[3]);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }
    const compact = raw.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`;
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return null;
  };
  var normalizeName = (value) => text2(value).toLowerCase();
  var normalizeTeamName2 = (value) => {
    const withoutSuffix = text2(value).replace(/(?:\s+(?:afc|cf|sc|sv|ac|fc))+\s*$/i, "");
    const folded = withoutSuffix.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    return folded.replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "").toLowerCase();
  };
  var teamKeyForName = (name) => {
    const identity = resolveTeamIdentity(name);
    if (identity?.teamId) return identity.teamId;
    const normalized = normalizeTeamName2(name) || normalizeName(name);
    return normalized ? `name:${normalized}` : null;
  };
  var STRICT_CLUB_SUFFIXES = /* @__PURE__ */ new Set(["fc", "afc", "cf", "sc", "sv", "ac", "as", "ss", "rc", "rcd", "ud", "sd", "cfc"]);
  var STRICT_CONNECTOR_WORDS = /* @__PURE__ */ new Set(["de", "del", "do", "da", "of"]);
  var STRICT_AMBIGUOUS_KEYS = /* @__PURE__ */ new Set(["paris", "madrid"]);
  var normalizeStrictTeamName = (value) => {
    const folded = text2(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const tokens = folded.replace(/[^a-z0-9\u4e00-\u9fff]+/gi, " ").trim().split(/\s+/).filter(Boolean).filter((token) => !STRICT_CONNECTOR_WORDS.has(token));
    while (tokens.length > 0 && STRICT_CLUB_SUFFIXES.has(tokens[0])) tokens.shift();
    while (tokens.length > 0 && STRICT_CLUB_SUFFIXES.has(tokens[tokens.length - 1])) tokens.pop();
    return tokens.join("");
  };
  var EXTRA_TEAM_NAMES = Object.freeze({
    "fc bayern munchen": "bayern",
    "bayern munchen": "bayern",
    "internazionale milano": "inter",
    "fc internazionale milano": "inter",
    "fc internazionale": "inter",
    "paris saint-germain": "psg",
    "paris saint germain": "psg",
    "atletico de madrid": "atletico",
    "club atletico de madrid": "atletico",
    "athletic club": "athletic",
    "real sociedad": "realsociedad",
    "real betis": "betis",
    "wolverhampton wanderers": "wolves",
    "tottenham hotspur": "tottenham",
    "brighton & hove albion": "brighton",
    "newcastle united": "newcastle",
    "nottingham forest": "nottingham",
    "west ham united": "westham",
    "leicester city": "leicester",
    "leeds united": "leeds",
    "sunderland afc": "sunderland",
    "crystal palace": "crystalpalace",
    "aston villa": "astonvilla",
    "manchester united": "manutd",
    "manchester city": "mancity",
    "real madrid": "realmadrid",
    "fc barcelona": "barcelona",
    "ac milan": "milan",
    "as roma": "roma",
    "ssc napoli": "napoli",
    "ss lazio": "lazio",
    "juventus": "juventus",
    "bayer leverkusen": "leverkusen",
    "borussia dortmund": "dortmund",
    "borussia monchengladbach": "gladbach",
    "eintracht frankfurt": "frankfurt",
    "rb leipzig": "leipzig",
    "vfb stuttgart": "stuttgart"
  });
  var STRICT_IDENTITY_LOOKUP = (() => {
    const entryById = new Map(TEAM_ALIAS_LIBRARY.map((entry) => [entry.teamId, entry]));
    const lookup = /* @__PURE__ */ new Map();
    const ambiguous = /* @__PURE__ */ new Set();
    const add = (alias, entry) => {
      const key = normalizeStrictTeamName(alias);
      if (!key || STRICT_AMBIGUOUS_KEYS.has(key)) return;
      const existing = lookup.get(key);
      if (existing && existing.teamId !== entry.teamId) {
        ambiguous.add(key);
        return;
      }
      lookup.set(key, { teamId: entry.teamId, teamName: entry.teamName });
    };
    TEAM_ALIAS_LIBRARY.forEach((entry) => {
      ;
      [entry.teamName, ...entry.abbreviations || []].forEach((alias) => add(alias, entry));
    });
    ambiguous.forEach((key) => lookup.delete(key));
    Object.entries(EXTRA_TEAM_NAMES).forEach(([alias, teamId]) => {
      const entry = entryById.get(teamId);
      const key = normalizeStrictTeamName(alias);
      if (entry && key) lookup.set(key, { teamId: entry.teamId, teamName: entry.teamName });
    });
    return lookup;
  })();
  var resolveTeamIdentity = (name) => {
    const key = normalizeStrictTeamName(name);
    if (!key) return null;
    return STRICT_IDENTITY_LOOKUP.get(key) || null;
  };

  // source/src/lib/oddsHistory.js
  var QUOTE_INTERVAL_MS = 30 * 60 * 1e3;
  var MAX_MATCH_AGE_MS = 120 * 24 * 60 * 60 * 1e3;
  var text3 = (value) => String(value ?? "").trim();
  var marketMatchKey = (match) => {
    if (!match || typeof match !== "object") return "";
    const matchId = text3(match.matchId);
    if (matchId) return matchId;
    const home = normalizeTeamName2(match.home);
    const away = normalizeTeamName2(match.away);
    if (!home || !away) return "";
    return `${home}|${away}|${text3(match.kickoff)}`;
  };

  // source/src/lib/teamRatings.js
  var INITIAL_ELO = 1500;
  var DAY_MS = 24 * 60 * 60 * 1e3;
  var rowsOf = (resultsIndex) => Array.isArray(resultsIndex) ? resultsIndex : Array.isArray(resultsIndex?.matches) ? resultsIndex.matches : [];
  var finiteGoals = (row) => row && Number.isFinite(Number(row.homeGoals)) && Number.isFinite(Number(row.awayGoals));
  var timeOf = (row) => {
    const time = new Date(row?.date || 0).getTime();
    return Number.isNaN(time) ? 0 : time;
  };
  var chronological = (resultsIndex) => rowsOf(resultsIndex).map((row, index) => ({ row, index })).filter(({ row }) => finiteGoals(row)).sort((a, b) => timeOf(a.row) - timeOf(b.row) || a.index - b.index).map(({ row }) => row);
  var teamKey = (row, side) => {
    const capitalized = side === "home" ? "Home" : "Away";
    return row[`teamKey${capitalized}`] || row[`teamId${capitalized}`] || teamKeyForName(row[side]);
  };
  var displayNameFor = (row, side, key) => {
    const capitalized = side === "home" ? "Home" : "Away";
    const raw = String(row?.[side] || "").trim();
    const teamId = row?.[`teamId${capitalized}`];
    const libraryEntry = teamId ? TEAM_ALIAS_LIBRARY.find((entry) => entry.teamId === teamId) : null;
    const identity = libraryEntry || resolveTeamIdentity(raw);
    if (identity?.teamName) {
      return { teamName: identity.teamName, rawTeamName: raw || identity.teamName };
    }
    return { teamName: raw || key || "未知球队", rawTeamName: raw };
  };
  var ratingBaseline = (resultsIndex) => {
    const rows = chronological(resultsIndex);
    const sample = rows.length;
    if (sample === 0) {
      return { avgGoalsPerMatch: 0, avgHomeGoals: 0, avgAwayGoals: 0, drawRate: 0, homeWinRate: 0, sample: 0 };
    }
    const sum = (selector) => rows.reduce((total, row) => total + selector(row), 0);
    const homeGoals = sum((row) => Number(row.homeGoals));
    const awayGoals = sum((row) => Number(row.awayGoals));
    return {
      avgGoalsPerMatch: (homeGoals + awayGoals) / sample,
      avgHomeGoals: homeGoals / sample,
      avgAwayGoals: awayGoals / sample,
      drawRate: rows.filter((row) => Number(row.homeGoals) === Number(row.awayGoals)).length / sample,
      homeWinRate: rows.filter((row) => Number(row.homeGoals) > Number(row.awayGoals)).length / sample,
      sample
    };
  };
  var newTeam = (teamKey2, teamName, rawTeamName) => ({
    teamKey: teamKey2,
    teamName,
    rawTeamName,
    elo: INITIAL_ELO,
    n: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    gf: 0,
    ga: 0,
    attack: 0,
    defense: 0,
    form: "",
    rank: null
  });
  var goalDifferenceMultiplier = (goalDifference) => {
    if (goalDifference <= 0) return 1;
    return Math.log(goalDifference + 1) * (2.2 / (goalDifference * 1e-3 + 2.2));
  };
  var recordResult = (team, goalsFor, goalsAgainst, result) => {
    team.n += 1;
    team.gf += goalsFor;
    team.ga += goalsAgainst;
    if (result === "W") team.wins += 1;
    else if (result === "D") team.draws += 1;
    else team.losses += 1;
    team.form = `${team.form}${result}`.slice(-5);
    team.attack = team.gf / team.n;
    team.defense = team.ga / team.n;
  };
  var buildTeamRatings = (resultsIndex, { k = 20, homeAdvantage = 60, recencyHalfLifeDays = 240 } = {}) => {
    const rows = chronological(resultsIndex);
    const byTeam = {};
    const latestTime = rows.reduce((latest, row) => Math.max(latest, timeOf(row)), 0);
    const halfLife = Math.max(1, Number(recencyHalfLifeDays) || 240);
    const baseK = Math.max(0, Number(k) || 20);
    rows.forEach((row) => {
      const homeKey = teamKey(row, "home");
      const awayKey = teamKey(row, "away");
      if (!homeKey || !awayKey || homeKey === awayKey) return;
      if (!byTeam[homeKey]) {
        const homeName = displayNameFor(row, "home", homeKey);
        byTeam[homeKey] = newTeam(homeKey, homeName.teamName, homeName.rawTeamName);
      }
      if (!byTeam[awayKey]) {
        const awayName = displayNameFor(row, "away", awayKey);
        byTeam[awayKey] = newTeam(awayKey, awayName.teamName, awayName.rawTeamName);
      }
      const home = byTeam[homeKey];
      const away = byTeam[awayKey];
      const expectedHome = 1 / (10 ** (-(home.elo + homeAdvantage - away.elo) / 400) + 1);
      const homeGoals = Number(row.homeGoals);
      const awayGoals = Number(row.awayGoals);
      const actualHome = homeGoals > awayGoals ? 1 : homeGoals === awayGoals ? 0.5 : 0;
      const ageDays = Math.max(0, (latestTime - timeOf(row)) / DAY_MS);
      const effectiveK = baseK * 0.5 ** (ageDays / halfLife);
      const delta = effectiveK * goalDifferenceMultiplier(Math.abs(homeGoals - awayGoals)) * (actualHome - expectedHome);
      home.elo += delta;
      away.elo -= delta;
      recordResult(home, homeGoals, awayGoals, homeGoals > awayGoals ? "W" : homeGoals === awayGoals ? "D" : "L");
      recordResult(away, awayGoals, homeGoals, awayGoals > homeGoals ? "W" : awayGoals === homeGoals ? "D" : "L");
    });
    const teams = Object.values(byTeam).sort(
      (a, b) => b.elo - a.elo || a.teamName.localeCompare(b.teamName)
    );
    teams.forEach((team, index) => {
      team.rank = index + 1;
    });
    return { teams, byTeam, baseline: ratingBaseline(rows) };
  };
  var shrunkRatio = (rate, baselineRate, n) => {
    const base = Math.max(0.05, Number(baselineRate) || 0.05);
    const games = Math.max(0, Number(n) || 0);
    const value = Number.isFinite(Number(rate)) ? Number(rate) : base;
    return (games * value + 10 * base) / (games + 10) / base;
  };
  var probabilityFromRatings = ({ teamKeyHome, teamKeyAway } = {}, ratings, { maxGoals = 8 } = {}) => {
    const table = ratings?.byTeam || (ratings && !Array.isArray(ratings) ? ratings : {});
    const home = table[teamKeyHome];
    const away = table[teamKeyAway];
    const baseline = ratings?.baseline;
    if (!home || !away || !baseline || !(baseline.sample > 0)) {
      return { cells: [], homeLambda: Number.NaN, awayLambda: Number.NaN, ready: false };
    }
    const homeBase = Math.max(0.05, baseline.avgHomeGoals || DEFAULT_LAMBDA_PRIOR.home);
    const awayBase = Math.max(0.05, baseline.avgAwayGoals || DEFAULT_LAMBDA_PRIOR.away);
    const homeLambda = Math.min(
      5,
      Math.max(
        0.05,
        1.12 * homeBase * shrunkRatio(home.attack, homeBase, home.n) * shrunkRatio(away.defense, homeBase, away.n)
      )
    );
    const awayLambda = Math.min(
      5,
      Math.max(
        0.05,
        0.9 * awayBase * shrunkRatio(away.attack, awayBase, away.n) * shrunkRatio(home.defense, awayBase, home.n)
      )
    );
    return { cells: deriveScoreDistribution(homeLambda, awayLambda, maxGoals), homeLambda, awayLambda, ready: true };
  };

  // source/src/lib/quantStrategy.js
  var STRATEGIES_KEY = "eivra.strategies.v1";
  var isBrowser4 = typeof window !== "undefined";
  var clamp5 = (value, min, max) => Math.max(min, Math.min(max, value));
  var toNumber4 = (value, fallback = Number.NaN) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  var toInt = (value, fallback = 0) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  var finiteOr = (value, fallback) => Number.isFinite(value) ? value : fallback;
  var numberIfPresent = (value) => value === null || value === void 0 || typeof value === "string" && value.trim() === "" ? Number.NaN : Number(value);
  var meanOf = (list) => {
    const valid = (Array.isArray(list) ? list : []).filter(Number.isFinite);
    return valid.length > 0 ? valid.reduce((sum, value) => sum + value, 0) / valid.length : Number.NaN;
  };
  var STRATEGY_STATUS_LABELS = Object.freeze({
    shadow: "影子盘",
    live: "已转正",
    retired: "已退役"
  });
  var createEmptySpec = (defaults = {}) => ({
    id: "",
    name: "",
    created_at: "",
    status: "shadow",
    team: "",
    venue: "any",
    market: "score",
    score: { for: 1, against: 1 },
    outcome: "win",
    matchesPlanned: 6,
    stakePerMatch: 20,
    oddsMode: "market",
    manualOdds: 6.5,
    probMode: "market",
    customProb: 0.12,
    bankroll: 600,
    positions: [],
    ...defaults
  });
  var normalizeSpec = (input = {}) => {
    const base = createEmptySpec(input);
    const market = base.market === "result" ? "result" : "score";
    const scoreFor = clamp5(toInt(base.score?.for, 1), 0, 9);
    const scoreAgainst = clamp5(toInt(base.score?.against, 1), 0, 9);
    return {
      ...base,
      name: String(base.name || "").trim(),
      team: String(base.team || "").trim(),
      venue: ["home", "away"].includes(base.venue) ? base.venue : "any",
      market,
      score: market === "score" ? { for: scoreFor, against: scoreAgainst } : null,
      outcome: market === "result" && ["win", "draw", "lose"].includes(base.outcome) ? base.outcome : market === "result" ? "win" : null,
      matchesPlanned: clamp5(toInt(base.matchesPlanned, 6), 1, 20),
      stakePerMatch: Math.max(0, toNumber4(base.stakePerMatch, 20)),
      oddsMode: base.oddsMode === "manual" ? "manual" : "market",
      manualOdds: Math.max(1.01, toNumber4(base.manualOdds, 6.5)),
      probMode: ["market", "base", "custom", "ratings"].includes(base.probMode) ? base.probMode : "market",
      customProb: clamp5(toNumber4(base.customProb, 0.12), 0, 1),
      bankroll: Math.max(0, toNumber4(base.bankroll, 600)),
      status: ["shadow", "live", "retired"].includes(base.status) ? base.status : "shadow",
      positions: Array.isArray(base.positions) ? base.positions : []
    };
  };
  var aliasesForTeam = (team) => {
    const needle = String(team || "").trim().toLowerCase();
    if (!needle) return [];
    const entry = TEAM_ALIAS_LIBRARY.find(
      (item) => item.teamName.toLowerCase() === needle || (item.abbreviations || []).some((alias) => String(alias).toLowerCase() === needle)
    );
    const pool = entry ? [entry.teamName, ...entry.abbreviations || []] : [team];
    return [
      ...new Set(
        pool.map((alias) => String(alias || "").trim().toLowerCase()).filter(Boolean).filter((alias) => !entry || resolveTeamIdentity(alias) !== null)
      )
    ];
  };
  var matchVenueForTeam = (match, aliases) => {
    if (!Array.isArray(aliases) || aliases.length === 0) return null;
    const home = String(match?.home || "").toLowerCase();
    const away = String(match?.away || "").toLowerCase();
    const hits = (side) => aliases.some((alias) => side.includes(alias));
    if (hits(home)) return "home";
    if (hits(away)) return "away";
    return null;
  };
  var venueFilterFor = (spec) => String(spec?.team || "").trim() && spec?.venue !== "any" ? spec.venue : null;
  var scoreCellForVenue = (spec, venue) => venue === "home" ? { home: spec.score.for, away: spec.score.against } : { home: spec.score.against, away: spec.score.for };
  var probabilityFromCells = (cells, spec, venue) => {
    if (spec.market === "score") {
      const target = scoreCellForVenue(spec, venue);
      const cell = cells.find((row) => row.home === target.home && row.away === target.away);
      return cell ? cell.p : Number.NaN;
    }
    const outcome = spec.outcome || "win";
    return cells.reduce((sum, cell) => {
      const teamWon = venue === "home" ? cell.home > cell.away : cell.away > cell.home;
      const teamLost = venue === "home" ? cell.home < cell.away : cell.away < cell.home;
      const drawn = cell.home === cell.away;
      if (outcome === "win" && teamWon) return sum + cell.p;
      if (outcome === "draw" && drawn) return sum + cell.p;
      if (outcome === "lose" && teamLost) return sum + cell.p;
      return sum;
    }, 0);
  };
  var poissonProbability = (match, spec, venue) => {
    const fitInput = marketOddsForFit(match);
    if (!fitInput) return Number.NaN;
    const fit = fitMarketLambdas(fitInput);
    if (!fit?.ready) return Number.NaN;
    const cells = deriveScoreDistribution(fit.homeLambda, fit.awayLambda);
    return probabilityFromCells(cells, spec, venue);
  };
  var devigProbability = (match, spec, venue) => {
    if (spec.market === "score") {
      const market = marketScorelineProbabilities(match);
      if (!market?.ok) return Number.NaN;
      const target = scoreCellForVenue(spec, venue);
      const cell = market.cells.find((row) => row.home === target.home && row.away === target.away);
      return cell ? cell.probability : Number.NaN;
    }
    const had = match?.had;
    const devig = deVigProportional([had?.home, had?.draw, had?.away]);
    if (!devig.ok) return Number.NaN;
    const outcome = spec.outcome || "win";
    if (outcome === "draw") return devig.fair[1];
    if (venue === "home") return outcome === "win" ? devig.fair[0] : devig.fair[2];
    return outcome === "win" ? devig.fair[2] : devig.fair[0];
  };
  var ratingsProbability = (match, spec, venue, ratings) => {
    if (!ratings) return Number.NaN;
    const teamKeyHome = teamKeyForName(match?.home);
    const teamKeyAway = teamKeyForName(match?.away);
    if (!teamKeyHome || !teamKeyAway) return Number.NaN;
    const distribution = probabilityFromRatings({ teamKeyHome, teamKeyAway }, ratings);
    if (!distribution.ready) return Number.NaN;
    return probabilityFromCells(distribution.cells, spec, venue);
  };
  var baseProbability = (spec) => {
    const cells = deriveScoreDistribution(DEFAULT_LAMBDA_PRIOR.home, DEFAULT_LAMBDA_PRIOR.away);
    const asHome = probabilityFromCells(cells, spec, "home");
    const asAway = probabilityFromCells(cells, spec, "away");
    return (asHome + asAway) / 2;
  };
  var marketQuoteForLeg = (match, spec, venue) => {
    if (spec.market === "score") {
      const target = scoreCellForVenue(spec, venue);
      const cell = (Array.isArray(match?.scores) ? match.scores : []).find(
        (row) => row.home === target.home && row.away === target.away
      );
      return toNumber4(cell?.odds);
    }
    const had = match?.had;
    if (!had) return Number.NaN;
    const outcome = spec.outcome || "win";
    if (outcome === "draw") return toNumber4(had.draw);
    if (venue === "home") return outcome === "win" ? toNumber4(had.home) : toNumber4(had.away);
    return outcome === "win" ? toNumber4(had.away) : toNumber4(had.home);
  };
  var pickLegProbability = (spec, views) => {
    if (spec.probMode === "custom") return spec.customProb;
    if (spec.probMode === "base") return views.pBase;
    if (spec.probMode === "ratings") return views.pRatings;
    return Number.isFinite(views.pPoisson) ? views.pPoisson : views.pDevig;
  };
  var RATINGS_UNAVAILABLE_MESSAGE = "评级概率不可用：缺少双方球队的有效评级，当前策略不能按评级口径推演或生成新头寸。";
  var forecastForMatch = (spec, match, venue, context = {}) => {
    const views = {
      pPoisson: poissonProbability(match, spec, venue),
      pDevig: devigProbability(match, spec, venue),
      pBase: baseProbability(spec),
      pRatings: ratingsProbability(match, spec, venue, context.ratings)
    };
    const raw = pickLegProbability(spec, views);
    const unavailable = spec.probMode === "ratings" && !Number.isFinite(raw);
    const probability = unavailable ? null : finiteOr(raw, views.pBase);
    const source = unavailable ? null : spec.probMode === "market" ? Number.isFinite(views.pPoisson) ? "market_poisson" : Number.isFinite(views.pDevig) ? "market_devig" : "base" : spec.probMode;
    const generatedAt = new Date(context.now ?? Date.now()).toISOString();
    return {
      views,
      forecastSnapshot: {
        schemaVersion: 1,
        requestedMode: spec.probMode,
        source,
        probability,
        generatedAt,
        available: !unavailable,
        reason: unavailable ? "ratings_unavailable" : source === "base" && spec.probMode !== "base" ? "market_probability_unavailable" : null
      }
    };
  };
  var DEGRADED_WARNING = "未在市场赔率中找到该队的在售赛事，已降级为手动赔率与联赛基准概率——当前读数只是占位口径，不代表市场定价。";
  var buildLegs = (specInput, marketMatches = [], context = {}) => {
    const spec = normalizeSpec(specInput);
    const matches = Array.isArray(marketMatches) ? marketMatches : [];
    const aliases = aliasesForTeam(spec.team);
    const planned = spec.matchesPlanned;
    const venueFilter = venueFilterFor(spec);
    const matched = matches.map((match) => ({ match, venue: aliases.length ? matchVenueForTeam(match, aliases) : "home" })).filter((entry) => entry.venue !== null && (!venueFilter || entry.venue === venueFilter)).slice(0, planned);
    const legs = matched.map(({ match, venue }, index) => {
      const { views, forecastSnapshot } = forecastForMatch(spec, match, venue, context);
      const oddsRaw = spec.oddsMode === "manual" ? spec.manualOdds : marketQuoteForLeg(match, spec, venue);
      const opponent = venue === "home" ? match.away : match.home;
      return {
        index,
        label: `${match.home} vs ${match.away}`,
        opponent: opponent || "",
        kickoff: match.kickoff || "",
        league: match.league || "",
        matchKey: marketMatchKey(match),
        outcomeKey: outcomeKeyFor(spec, venue),
        venue,
        p: forecastSnapshot.probability,
        forecastSnapshot,
        odds: finiteOr(oddsRaw, spec.manualOdds),
        estimated: false,
        pPoisson: views.pPoisson,
        pDevig: views.pDevig,
        pBase: views.pBase,
        pRatings: views.pRatings,
        overround: Number.NaN,
        oddsFallback: !Number.isFinite(oddsRaw)
      };
    });
    legs.forEach((leg, i) => {
      const match = matched[i]?.match;
      if (!match) return;
      if (spec.market === "score") {
        leg.overround = toNumber4(marketScorelineProbabilities(match)?.overround);
      } else {
        const had = match.had || {};
        leg.overround = toNumber4(deVigProportional([had.home, had.draw, had.away]).overround);
      }
    });
    let degraded = false;
    let warning = "";
    if (legs.length < planned) {
      const missing = planned - legs.length;
      if (legs.length === 0 && spec.oddsMode === "market") {
        degraded = true;
        warning = DEGRADED_WARNING;
      } else if (legs.length === 0 && spec.probMode === "market") {
        degraded = true;
        warning = DEGRADED_WARNING;
      }
      const fillP = finiteOr(
        meanOf(legs.map((leg) => leg.p)),
        spec.probMode === "ratings" ? null : spec.probMode === "custom" ? spec.customProb : baseProbability(spec)
      );
      const fillOdds = finiteOr(meanOf(legs.map((leg) => leg.odds)), spec.manualOdds);
      const fillViews = {
        pPoisson: meanOf(legs.map((leg) => leg.pPoisson)),
        pDevig: meanOf(legs.map((leg) => leg.pDevig)),
        pBase: baseProbability(spec),
        pRatings: meanOf(legs.map((leg) => leg.pRatings))
      };
      for (let i = 0; i < missing; i += 1) {
        const index = legs.length;
        legs.push({
          index,
          label: `未来第 ${index + 1} 场 · 估计`,
          opponent: "",
          kickoff: "",
          league: "",
          venue: null,
          p: fillP,
          odds: fillOdds,
          estimated: true,
          pPoisson: fillViews.pPoisson,
          pDevig: fillViews.pDevig,
          pBase: fillViews.pBase,
          pRatings: fillViews.pRatings,
          overround: Number.NaN,
          oddsFallback: false
        });
      }
    }
    const available = legs.every((leg) => Number.isFinite(leg.p));
    if (!available) {
      degraded = true;
      warning = RATINGS_UNAVAILABLE_MESSAGE;
    }
    return { legs, degraded, warning, available, reason: available ? null : "ratings_unavailable" };
  };
  var mulberry32 = (seed) => {
    let a = Number(seed) >>> 0;
    return () => {
      a = a + 1831565813 >>> 0;
      let t = a;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  var lnFactorial2 = (n) => {
    let sum = 0;
    for (let i = 2; i <= n; i += 1) sum += Math.log(i);
    return sum;
  };
  var binomialPmf = (k, n, p) => {
    const count = Math.round(Number(k));
    const trials = Math.round(Number(n));
    const prob = Number(p);
    if (!Number.isFinite(prob) || trials < 0 || count < 0 || count > trials) return 0;
    if (prob <= 0) return count === 0 ? 1 : 0;
    if (prob >= 1) return count === trials ? 1 : 0;
    const logC = lnFactorial2(trials) - lnFactorial2(count) - lnFactorial2(trials - count);
    return Math.exp(logC + count * Math.log(prob) + (trials - count) * Math.log(1 - prob));
  };
  var percentileOf = (sorted, p) => {
    if (sorted.length === 0) return Number.NaN;
    const rank = p / 100 * (sorted.length - 1);
    const low = Math.floor(rank);
    const high = Math.ceil(rank);
    if (low === high) return sorted[low];
    return sorted[low] + (sorted[high] - sorted[low]) * (rank - low);
  };
  var buildHistogram = (values2, binCount = 24) => {
    if (!values2.length) return [];
    const min = Math.min(...values2);
    const max = Math.max(...values2);
    if (min === max) return [{ x0: min, x1: max, count: values2.length }];
    const width = (max - min) / binCount;
    const bins = Array.from({ length: binCount }, (_, i) => ({ x0: min + i * width, x1: min + (i + 1) * width, count: 0 }));
    values2.forEach((value) => {
      const index = Math.min(binCount - 1, Math.floor((value - min) / width));
      bins[index].count += 1;
    });
    return bins;
  };
  var MC_ITERATIONS = 2e4;
  var MC_SEED = 20260930;
  var HISTOGRAM_BINS = 24;
  var runMonteCarlo = (legs, stakePerMatch) => {
    const rng = mulberry32(MC_SEED);
    const profits = [];
    let ruinCount = 0;
    let profitCount = 0;
    let ddSum = 0;
    for (let iter = 0; iter < MC_ITERATIONS; iter += 1) {
      let profit = 0;
      let peak = 0;
      let maxDD = 0;
      let hits = 0;
      legs.forEach((leg) => {
        const won = rng() < leg.p;
        if (won) hits += 1;
        profit += won ? stakePerMatch * (leg.odds - 1) : -stakePerMatch;
        if (profit > peak) peak = profit;
        const dd = peak - profit;
        if (dd > maxDD) maxDD = dd;
      });
      profits.push(profit);
      if (hits === 0) ruinCount += 1;
      if (profit > 0) profitCount += 1;
      ddSum += maxDD;
    }
    const sorted = [...profits].sort((a, b) => a - b);
    const meanProfit = profits.reduce((sum, value) => sum + value, 0) / MC_ITERATIONS;
    const totalStake = stakePerMatch * legs.length;
    return {
      iterations: MC_ITERATIONS,
      seed: MC_SEED,
      meanProfit,
      expectedRoiPct: totalStake > 0 ? meanProfit / totalStake * 100 : 0,
      medianProfit: percentileOf(sorted, 50),
      p5: percentileOf(sorted, 5),
      p95: percentileOf(sorted, 95),
      pProfit: profitCount / MC_ITERATIONS,
      pRuin: ruinCount / MC_ITERATIONS,
      expectedMaxDD: ddSum / MC_ITERATIONS,
      worst: sorted[0],
      best: sorted[sorted.length - 1],
      histogram: buildHistogram(profits, HISTOGRAM_BINS)
    };
  };
  var runExact = (legs, stakePerMatch) => {
    const first = legs[0];
    const uniform = legs.every(
      (leg) => Math.abs(leg.p - first.p) < 1e-12 && Math.abs(leg.odds - first.odds) < 1e-12
    );
    if (!uniform || legs.length === 0) return null;
    const n = legs.length;
    const { p, odds } = first;
    const hits = Array.from({ length: n + 1 }, (_, k) => ({ k, p: binomialPmf(k, n, p) }));
    const profitOf = (k) => stakePerMatch * (k * odds - n);
    const cdf = [];
    let cumulative = 0;
    hits.forEach((row) => {
      cumulative += row.p;
      cdf.push({ k: row.k, cumulative });
    });
    const quantileHits = (q) => cdf.find((row) => row.cumulative >= q)?.k ?? n;
    const meanHits = n * p;
    return {
      hits,
      meanProfit: stakePerMatch * (meanHits * odds - n),
      pProfit: hits.reduce((sum, row) => sum + (profitOf(row.k) > 0 ? row.p : 0), 0),
      pRuin: hits[0]?.p ?? 0,
      median: profitOf(quantileHits(0.5)),
      p5: profitOf(quantileHits(0.05)),
      p95: profitOf(quantileHits(0.95))
    };
  };
  var fmtPct = (value, digits = 1) => Number.isFinite(value) ? `${(value * 100).toFixed(digits)}%` : "—";
  var fmtYuan = (value, digits = 1) => Number.isFinite(value) ? `¥${value.toFixed(digits)}` : "—";
  var buildVerdict = ({ avgEvPct, avgEdgeVsFair, monteCarlo, overround, significance }) => {
    const hasFair = Number.isFinite(avgEdgeVsFair);
    const pProfit = monteCarlo.pProfit;
    let tone = "neutral";
    let headline = "边际不清 — 先观察，不加注";
    if (hasFair && avgEdgeVsFair > 0.03 && pProfit > 0.6) {
      tone = "positive";
      headline = "正期望候选 — 先入影子盘验证";
    } else if (avgEvPct < -0.02 || hasFair && avgEdgeVsFair < -0.03) {
      tone = "negative";
      headline = "负期望陷阱 — 抽水在吃你的本金";
    }
    const lines = [
      `每场期望 ROI ${fmtPct(avgEvPct)}：每投 ¥100 期望拿回 ${fmtYuan(100 * (1 + avgEvPct))}`,
      `${monteCarlo.iterations / 1e4} 万次推演：盈利概率 ${fmtPct(pProfit)}，全亏概率 ${fmtPct(monteCarlo.pRuin)}`
    ];
    if (Number.isFinite(overround)) {
      lines.push(`市场抽水率约 ${fmtPct(overround)}——永远看去水后的边际，不看牌面赔率`);
    }
    if (significance.nNeeded === Infinity) {
      lines.push("估计命中率与盈亏平衡线几乎重合，多少样本都分不出胜负——这本身就是结论");
    } else {
      lines.push(`要在统计上确认这个边际，约需 ${significance.nNeeded} 场样本（95% 置信）`);
    }
    return { tone, headline, lines };
  };
  var analyzeStrategy = (specInput, marketMatches = [], context = {}) => {
    const spec = normalizeSpec(specInput);
    const kellyDivisor = Math.max(1, toNumber4(context.kellyDivisor, 4));
    const { legs, degraded, warning, available, reason } = buildLegs(spec, marketMatches, context);
    const stake = spec.stakePerMatch;
    const totalStake = stake * legs.length;
    if (!available) {
      return {
        available: false,
        reason,
        message: warning,
        spec,
        legs,
        degraded,
        warning,
        totalStake,
        perBet: { evPct: null, breakevenP: null, edgePP: null, edgeVsFairPP: null, avgP: null, avgOdds: null },
        exact: null,
        monteCarlo: {
          iterations: 0,
          meanProfit: null,
          expectedRoiPct: null,
          medianProfit: null,
          p5: null,
          p95: null,
          pProfit: null,
          pRuin: null,
          expectedMaxDD: null,
          worst: null,
          best: null,
          histogram: []
        },
        kelly: { fraction: null, divisor: kellyDivisor, bankroll: spec.bankroll, suggestedStake: null, stakePerMatch: stake },
        significance: { delta: null, nNeeded: null },
        probViews: { devig: null, poisson: null, base: null, ratings: null },
        overround: null,
        verdict: { tone: "neutral", headline: "评级概率不可用", lines: [warning] }
      };
    }
    const perBet = {
      evPct: meanOf(legs.map((leg) => leg.p * leg.odds - 1)),
      breakevenP: meanOf(legs.map((leg) => 1 / leg.odds)),
      edgePP: meanOf(legs.map((leg) => leg.p - 1 / leg.odds)),
      edgeVsFairPP: meanOf(legs.map((leg) => Number.isFinite(leg.pDevig) ? leg.p - leg.pDevig : Number.NaN)),
      avgP: meanOf(legs.map((leg) => leg.p)),
      avgOdds: meanOf(legs.map((leg) => leg.odds))
    };
    const exact = runExact(legs, stake);
    const monteCarlo = runMonteCarlo(legs, stake);
    const b = Math.max(1e-9, perBet.avgOdds - 1);
    const kellyFraction = Math.max(0, (perBet.avgP * perBet.avgOdds - 1) / b);
    const kelly = {
      fraction: kellyFraction,
      divisor: kellyDivisor,
      bankroll: spec.bankroll,
      suggestedStake: spec.bankroll * kellyFraction / kellyDivisor,
      stakePerMatch: stake
    };
    const delta = Math.abs(perBet.avgP - perBet.breakevenP);
    const significance = {
      delta,
      nNeeded: delta < 1e-9 ? Infinity : Math.ceil(1.96 ** 2 * perBet.avgP * (1 - perBet.avgP) / delta ** 2)
    };
    const probViews = {
      devig: meanOf(legs.map((leg) => leg.pDevig)),
      poisson: meanOf(legs.map((leg) => leg.pPoisson)),
      base: meanOf(legs.map((leg) => leg.pBase)),
      ratings: meanOf(legs.map((leg) => leg.pRatings))
    };
    const overround = meanOf(legs.map((leg) => leg.overround));
    const verdict = buildVerdict({
      avgEvPct: perBet.evPct,
      avgEdgeVsFair: perBet.edgeVsFairPP,
      monteCarlo,
      overround,
      significance
    });
    return {
      available: true,
      reason: null,
      spec,
      legs,
      degraded,
      warning,
      totalStake,
      perBet,
      exact,
      monteCarlo,
      kelly,
      significance,
      probViews,
      overround,
      verdict
    };
  };
  var readJSON3 = (key, fallback) => {
    if (!isBrowser4) return fallback;
    if (isPreviewMode()) return previewRead(key, fallback);
    try {
      const raw = brandLocalStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };
  var writeJSON3 = (key, value) => {
    if (!isBrowser4) return;
    if (isPreviewMode()) {
      previewWrite(key, value);
      window.dispatchEvent(new CustomEvent("eivra:data-changed", { detail: { key, preview: true } }));
      return;
    }
    brandLocalStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("eivra:data-changed", { detail: { key } }));
  };
  var getStrategies = () => {
    const list = readJSON3(STRATEGIES_KEY, []);
    return Array.isArray(list) ? list : [];
  };
  var saveStrategy = (specInput) => {
    const spec = normalizeSpec(specInput);
    const saved = {
      ...spec,
      id: spec.id || `stg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      created_at: spec.created_at || (/* @__PURE__ */ new Date()).toISOString()
    };
    const list = getStrategies();
    list.push(saved);
    writeJSON3(STRATEGIES_KEY, list);
    return saved;
  };
  var updateStrategy = (id, patch = {}) => {
    const list = getStrategies();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;
    const next = { ...list[index], ...patch, id };
    list[index] = next;
    writeJSON3(STRATEGIES_KEY, list);
    return next;
  };
  var deleteStrategy = (id) => {
    const list = getStrategies();
    const next = list.filter((item) => item.id !== id);
    if (next.length === list.length) return false;
    writeJSON3(STRATEGIES_KEY, next);
    return true;
  };
  var normName = (value) => String(value ?? "").trim().toLowerCase();
  var positionKeyFor = (match) => match?.matchId ? `id:${match.matchId}` : `${normName(match?.home)}|${normName(match?.away)}|${String(match?.kickoff || "").trim()}`;
  var outcomeKeyFor = (spec, venue) => {
    if (spec.market === "score") {
      const target = scoreCellForVenue(spec, venue);
      return `crs:${target.home}-${target.away}`;
    }
    const outcome = spec.outcome || "win";
    if (outcome === "draw") return "had:draw";
    if (venue === "away") return outcome === "win" ? "had:away" : "had:home";
    return outcome === "win" ? "had:home" : "had:away";
  };
  var positionOutcomeKey = (strategy, position) => position?.outcomeKey || outcomeKeyFor(normalizeSpec(strategy), position?.venue || "home");
  var positionMatchKey = (position) => position?.matchKey || marketMatchKey(position) || `position:${position?.id || "unknown"}`;
  var buildPositionForMatch = (spec, match, venue, context = {}) => {
    const { forecastSnapshot } = forecastForMatch(spec, match, venue, context);
    if (!forecastSnapshot.available) return null;
    const oddsRaw = spec.oddsMode === "manual" ? spec.manualOdds : marketQuoteForLeg(match, spec, venue);
    const homeIdentity = resolveTeamIdentity(match.home);
    const awayIdentity = resolveTeamIdentity(match.away);
    return {
      id: `pos_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      matchId: match.matchId || "",
      matchKey: marketMatchKey(match),
      outcomeKey: outcomeKeyFor(spec, venue),
      kickoff: match.kickoff || "",
      home: match.home || "",
      away: match.away || "",
      teamIdHome: homeIdentity?.teamId || null,
      teamIdAway: awayIdentity?.teamId || null,
      venue,
      entryOdds: finiteOr(oddsRaw, spec.manualOdds),
      p: forecastSnapshot.probability,
      forecastSnapshot,
      stake: spec.stakePerMatch,
      status: "pending",
      lastSeenOdds: finiteOr(oddsRaw, spec.manualOdds)
    };
  };
  var syncStrategyFixtures = (strategyInput, marketMatches = [], context = {}) => {
    const spec = normalizeSpec(strategyInput);
    const positions = [...spec.positions];
    if (spec.status === "retired") return { ...spec, positions };
    const matches = Array.isArray(marketMatches) ? marketMatches : [];
    const aliases = aliasesForTeam(spec.team);
    const venueFilter = venueFilterFor(spec);
    const known = new Set(positions.map((position) => positionKeyFor(position)));
    let remaining = Math.max(0, spec.matchesPlanned - positions.length);
    if (remaining === 0) return { ...spec, positions };
    let skippedCount = 0;
    for (const match of matches) {
      if (remaining <= 0) break;
      const venue = aliases.length ? matchVenueForTeam(match, aliases) : "home";
      if (!venue || venueFilter && venue !== venueFilter) continue;
      const key = positionKeyFor(match);
      if (known.has(key)) continue;
      const position = buildPositionForMatch(spec, match, venue, context);
      if (!position) {
        skippedCount += 1;
        continue;
      }
      known.add(key);
      positions.push(position);
      remaining -= 1;
    }
    return {
      ...spec,
      positions,
      syncStatus: {
        available: skippedCount === 0,
        reason: skippedCount > 0 ? "ratings_unavailable" : null,
        message: skippedCount > 0 ? RATINGS_UNAVAILABLE_MESSAGE : "",
        skippedCount
      }
    };
  };
  var refreshClosingOdds = (strategyInput, marketMatches = []) => {
    const spec = normalizeSpec(strategyInput);
    const matches = Array.isArray(marketMatches) ? marketMatches : [];
    const positions = spec.positions.map((position) => {
      if (position?.status !== "pending") return position;
      const match = matches.find((item) => positionKeyFor(item) === positionKeyFor(position));
      if (!match) return position;
      const quote = marketQuoteForLeg(match, spec, position.venue || "home");
      if (!Number.isFinite(quote) || quote <= 1) return position;
      return { ...position, lastSeenOdds: quote };
    });
    return { ...spec, positions };
  };
  var resultRowsOf = (resultsIndex) => Array.isArray(resultsIndex) ? resultsIndex : Array.isArray(resultsIndex?.matches) ? resultsIndex.matches : [];
  var DAY_MS2 = 24 * 60 * 60 * 1e3;
  var positionMatchesResult = (position, row) => {
    const idMatch = position.teamIdHome && position.teamIdAway && row.teamIdHome && row.teamIdAway ? position.teamIdHome === row.teamIdHome && position.teamIdAway === row.teamIdAway : null;
    if (idMatch === false) return false;
    if (idMatch === null) {
      const homeA = teamKeyForName(position.home);
      const awayA = teamKeyForName(position.away);
      const homeB = teamKeyForName(row.home);
      const awayB = teamKeyForName(row.away);
      if (!homeA || !awayA || !homeB || !awayB) return false;
      if (homeA !== homeB || awayA !== awayB) return false;
    }
    const positionDate = normalizeMatchDate(position.kickoff);
    if (!positionDate || !row.date) return true;
    return Math.abs(new Date(positionDate).getTime() - new Date(row.date).getTime()) <= DAY_MS2;
  };
  var positionHitsResult = (spec, venue, row) => {
    const side = venue === "away" ? "away" : "home";
    const teamGoals = side === "away" ? row.awayGoals : row.homeGoals;
    const oppGoals = side === "away" ? row.homeGoals : row.awayGoals;
    if (spec.market === "score") {
      return teamGoals === spec.score.for && oppGoals === spec.score.against;
    }
    const outcome = spec.outcome || "win";
    if (outcome === "draw") return teamGoals === oppGoals;
    if (outcome === "win") return teamGoals > oppGoals;
    return teamGoals < oppGoals;
  };
  var settleStrategyPositions = (strategyInput, resultsIndex) => {
    const spec = normalizeSpec(strategyInput);
    const rows = resultRowsOf(resultsIndex);
    const positions = spec.positions.map((position) => {
      if (position?.status !== "pending") return position;
      const row = rows.find((candidate) => positionMatchesResult(position, candidate));
      if (!row) return position;
      const hit = positionHitsResult(spec, position.venue, row);
      const stake = Number.isFinite(Number(position.stake)) ? Number(position.stake) : spec.stakePerMatch;
      const entryOdds = Number.isFinite(Number(position.entryOdds)) ? Number(position.entryOdds) : spec.manualOdds;
      const lastSeen = Number(position.lastSeenOdds);
      return {
        ...position,
        status: hit ? "hit" : "miss",
        profit: hit ? stake * (entryOdds - 1) : -stake,
        clv: Number.isFinite(lastSeen) && lastSeen > 1 ? entryOdds / lastSeen - 1 : null,
        settledAt: (/* @__PURE__ */ new Date()).toISOString(),
        finalScore: `${row.homeGoals}-${row.awayGoals}`,
        resultDate: row.date || null
      };
    });
    return { ...spec, positions };
  };
  var wilsonInterval = (hitsInput, nInput, z = 1.96) => {
    const n = Math.max(0, Math.round(Number(nInput) || 0));
    const hits = clamp5(Math.round(Number(hitsInput) || 0), 0, n);
    if (n === 0) return { low: 0, high: 1 };
    const p = hits / n;
    const z2 = z * z;
    const denominator = 1 + z2 / n;
    const center = (p + z2 / (2 * n)) / denominator;
    const margin = z / denominator * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n));
    return { low: Math.max(0, center - margin), high: Math.min(1, center + margin) };
  };
  var settledPositionsOf = (strategy) => (Array.isArray(strategy?.positions) ? strategy.positions : []).filter(
    (position) => position?.status === "hit" || position?.status === "miss"
  );
  var positionProfit = (position) => Number.isFinite(Number(position?.profit)) ? Number(position.profit) : position?.status === "hit" ? Number(position.stake || 0) * (Number(position.entryOdds || 1) - 1) : -Number(position.stake || 0);
  var positionTime = (position) => {
    const time = new Date(position?.settledAt || position?.createdAt || 0).getTime();
    return Number.isNaN(time) ? 0 : time;
  };
  var maxDrawdownOf = (profits) => {
    let cumulative = 0;
    let peak = 0;
    let maxDrawdown = 0;
    profits.forEach((profit) => {
      cumulative += profit;
      if (cumulative > peak) peak = cumulative;
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    return maxDrawdown;
  };
  var sharpeOfPositions = (positions) => {
    const returns = positions.map((position) => {
      const stake = Number(position?.stake);
      return Number.isFinite(stake) && stake > 0 ? positionProfit(position) / stake : Number.NaN;
    }).filter(Number.isFinite);
    if (returns.length < 2) return null;
    const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
    const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (returns.length - 1);
    const std = Math.sqrt(variance);
    return std > 0 ? mean / std : null;
  };
  var PROMOTION_MIN_SETTLED = 20;
  var RETIRE_MIN_SETTLED = 10;
  var RECENT_WINDOW = 5;
  var DRIFT_ROI_THRESHOLD = -0.3;
  var DRIFT_HITRATE_DROP = 0.5;
  var strategyStats = (strategy) => {
    const positions = Array.isArray(strategy?.positions) ? strategy.positions : [];
    const settled = settledPositionsOf(strategy).slice().sort((a, b) => positionTime(a) - positionTime(b));
    const pending = positions.filter((position) => position?.status === "pending").length;
    const voided = positions.filter((position) => position?.status === "void").length;
    const n = settled.length;
    const hits = settled.filter((position) => position.status === "hit").length;
    const hitRate = n > 0 ? hits / n : null;
    const hitCI = wilsonInterval(hits, n);
    const totalStaked = settled.reduce((sum, position) => sum + (Number.isFinite(Number(position.stake)) ? Number(position.stake) : 0), 0);
    const totalProfit = settled.reduce((sum, position) => sum + positionProfit(position), 0);
    const roi = totalStaked > 0 ? totalProfit / totalStaked : null;
    const entryOddsList = settled.map((position) => Number(position.entryOdds)).filter((value) => Number.isFinite(value) && value > 1);
    const avgEntryOdds = entryOddsList.length > 0 ? entryOddsList.reduce((sum, value) => sum + value, 0) / entryOddsList.length : Number.NaN;
    const breakevenP = Number.isFinite(avgEntryOdds) ? 1 / avgEntryOdds : Number.NaN;
    const roiCI = n > 0 && Number.isFinite(avgEntryOdds) ? { low: hitCI.low * avgEntryOdds - 1, high: hitCI.high * avgEntryOdds - 1 } : null;
    const clvList = settled.map((position) => numberIfPresent(position.clv)).filter(Number.isFinite);
    const avgClv = clvList.length > 0 ? clvList.reduce((sum, value) => sum + value, 0) / clvList.length : null;
    const recent = settled.slice(-RECENT_WINDOW);
    const recentStaked = recent.reduce((sum, position) => sum + Number(position.stake || 0), 0);
    const recentProfit = recent.reduce((sum, position) => sum + positionProfit(position), 0);
    const recent5 = { n: recent.length, roi: recentStaked > 0 ? recentProfit / recentStaked : null };
    const recentHitRate = recent.length > 0 ? recent.filter((position) => position.status === "hit").length / recent.length : null;
    const drift = recent5.n >= RECENT_WINDOW && (recent5.roi !== null && recent5.roi < DRIFT_ROI_THRESHOLD || hitRate !== null && recentHitRate !== null && recentHitRate < hitRate * (1 - DRIFT_HITRATE_DROP));
    const suggestRetire = n >= RETIRE_MIN_SETTLED && Number.isFinite(breakevenP) && hitCI.high < breakevenP;
    const gateChecks = [
      {
        id: "sample_size",
        label: `样本量：已结算 ${n} 场 / 需 ≥ ${PROMOTION_MIN_SETTLED}`,
        pass: n >= PROMOTION_MIN_SETTLED,
        detail: n >= PROMOTION_MIN_SETTLED ? "样本量达标" : `还差 ${PROMOTION_MIN_SETTLED - n} 场`
      },
      {
        id: "edge_significance",
        label: "命中率 Wilson 下界 > 盈亏平衡概率",
        pass: n > 0 && Number.isFinite(breakevenP) && hitCI.low > breakevenP,
        detail: n > 0 && Number.isFinite(breakevenP) ? `下界 ${(hitCI.low * 100).toFixed(1)}% vs 平衡线 ${(breakevenP * 100).toFixed(1)}%（平均赔率 ${avgEntryOdds.toFixed(2)}）` : "样本或赔率不足，无法判定"
      },
      {
        id: "clv_positive",
        label: "平均 CLV > 0（持续跑赢收盘）",
        pass: avgClv !== null && avgClv > 0,
        detail: avgClv !== null ? `平均 CLV ${(avgClv * 100).toFixed(1)}%` : "尚无 CLV 样本"
      }
    ];
    const promotable = gateChecks.every((gate) => gate.pass);
    return {
      n,
      pending,
      voided,
      hits,
      hitRate,
      hitCI,
      roi,
      roiCI,
      avgEntryOdds,
      breakevenP,
      sharpe: sharpeOfPositions(settled),
      maxDrawdown: maxDrawdownOf(settled.map(positionProfit)),
      avgClv,
      recent5,
      drift,
      suggestRetire,
      promotable,
      gateChecks
    };
  };
  var BACKTEST_DISCLAIMER = (assumedOdds) => `回测口径声明：历史真实赔率不可考，以下每一场都按假定赔率 ${assumedOdds} 平价结算。它回答的是"这个比分/结果在历史上出现了多少次、按这个价结算盈亏如何"，不是对历史可获收益的还原；真实入场价请以仓位台账的 entryOdds 为准。`;
  var backtestStrategy = (specInput, resultsIndex, assumedOddsArg) => {
    const spec = normalizeSpec(specInput);
    const rows = resultRowsOf(resultsIndex);
    const aliases = aliasesForTeam(spec.team);
    const venueFilter = venueFilterFor(spec);
    const parsedOdds = Number(assumedOddsArg);
    const assumedOdds = Number.isFinite(parsedOdds) && parsedOdds > 1 ? parsedOdds : spec.manualOdds > 1 ? spec.manualOdds : 6.5;
    const played = rows.map((row) => ({ row, venue: aliases.length ? matchVenueForTeam(row, aliases) : "home" })).filter((entry) => entry.venue !== null && (!venueFilter || entry.venue === venueFilter)).sort((a, b) => {
      if (!a.row.date && !b.row.date) return 0;
      if (!a.row.date) return 1;
      if (!b.row.date) return -1;
      return a.row.date < b.row.date ? -1 : a.row.date > b.row.date ? 1 : 0;
    });
    const stake = spec.stakePerMatch;
    let cumulative = 0;
    let hits = 0;
    const equityCurve = [];
    const profitPositions = [];
    played.forEach(({ row, venue }, index) => {
      const hit = positionHitsResult(spec, venue, row);
      if (hit) hits += 1;
      const profit = hit ? stake * (assumedOdds - 1) : -stake;
      cumulative += profit;
      equityCurve.push({ i: index + 1, cum: cumulative });
      profitPositions.push({ stake, profit, status: hit ? "hit" : "miss" });
    });
    const n = played.length;
    const totalStaked = n * stake;
    return {
      n,
      hits,
      hitRate: n > 0 ? hits / n : null,
      hitCI: wilsonInterval(hits, n),
      roi: totalStaked > 0 ? cumulative / totalStaked : null,
      maxDrawdown: maxDrawdownOf(profitPositions.map((position) => position.profit)),
      sharpe: sharpeOfPositions(profitPositions),
      equityCurve,
      assumedOdds,
      disclaimer: BACKTEST_DISCLAIMER(assumedOdds)
    };
  };
  var DEFAULT_DISCOVERY_TEMPLATES = Object.freeze([
    { id: "score_0_0", kind: "score", score: { for: 0, against: 0 }, venue: "any", assumedOdds: 11, label: "比分 0-0（不分主客）" },
    { id: "score_1_1", kind: "score", score: { for: 1, against: 1 }, venue: "any", assumedOdds: 6.5, label: "比分 1-1（不分主客）" },
    { id: "score_2_2", kind: "score", score: { for: 2, against: 2 }, venue: "any", assumedOdds: 13, label: "比分 2-2（不分主客）" },
    { id: "result_win_home", kind: "result", outcome: "win", venue: "home", assumedOdds: 2.2, label: "主场 · 胜" },
    { id: "result_win_away", kind: "result", outcome: "win", venue: "away", assumedOdds: 2.2, label: "客场 · 胜" },
    { id: "result_draw_home", kind: "result", outcome: "draw", venue: "home", assumedOdds: 3.4, label: "主场 · 平" },
    { id: "result_draw_away", kind: "result", outcome: "draw", venue: "away", assumedOdds: 3.4, label: "客场 · 平" },
    { id: "result_lose_home", kind: "result", outcome: "lose", venue: "home", assumedOdds: 2.9, label: "主场 · 负" },
    { id: "result_lose_away", kind: "result", outcome: "lose", venue: "away", assumedOdds: 2.9, label: "客场 · 负" }
  ]);
  var specFromDiscoveryRow = (row, templates = DEFAULT_DISCOVERY_TEMPLATES) => {
    const template = (Array.isArray(templates) ? templates : DEFAULT_DISCOVERY_TEMPLATES).find((item) => item.id === row?.templateId);
    if (!template) return normalizeSpec({});
    return normalizeSpec({
      name: `${row.teamName} ${template.label}`,
      team: row.teamName,
      venue: template.venue || "any",
      market: template.kind === "result" ? "result" : "score",
      ...template.kind === "result" ? { outcome: template.outcome } : { score: { ...template.score } },
      matchesPlanned: 20,
      oddsMode: "manual",
      manualOdds: row.assumedOdds || template.assumedOdds,
      probMode: "base",
      status: "shadow"
    });
  };
  var templateHitsGame = (template, game) => {
    const teamGoals = game.venue === "away" ? game.awayGoals : game.homeGoals;
    const oppGoals = game.venue === "away" ? game.homeGoals : game.awayGoals;
    if (template.kind === "score") {
      return teamGoals === template.score.for && oppGoals === template.score.against;
    }
    if (template.outcome === "draw") return teamGoals === oppGoals;
    if (template.outcome === "win") return teamGoals > oppGoals;
    return teamGoals < oppGoals;
  };
  var binomialUpperTail = (hits, n, p0) => {
    let sum = 0;
    for (let k = hits; k <= n; k += 1) sum += binomialPmf(k, n, p0);
    return Math.min(1, sum);
  };
  var discoverStrategies = (resultsIndex, options = {}) => {
    const rows = resultRowsOf(resultsIndex);
    const minN = Math.max(1, toInt(options.minN, 15));
    const q = Number.isFinite(Number(options.q)) ? Number(options.q) : 0.1;
    const oddsOverrides = options.assumedOdds && typeof options.assumedOdds === "object" ? options.assumedOdds : {};
    const templates = (Array.isArray(options.templates) && options.templates.length > 0 ? options.templates : DEFAULT_DISCOVERY_TEMPLATES).map((template) => {
      const override = Number(oddsOverrides[template.id]);
      return { ...template, assumedOdds: Number.isFinite(override) && override > 1 ? override : template.assumedOdds };
    });
    const byTeam = /* @__PURE__ */ new Map();
    const pushGame = (teamId, rawName, venue, homeGoals, awayGoals) => {
      const teamKey2 = teamId || teamKeyForName(rawName);
      if (!teamKey2) return;
      if (!byTeam.has(teamKey2)) {
        const libraryEntry = teamId ? TEAM_ALIAS_LIBRARY.find((entry) => entry.teamId === teamId) : null;
        byTeam.set(teamKey2, {
          teamId: teamId || null,
          teamKey: teamKey2,
          teamName: libraryEntry?.teamName || String(rawName ?? "").trim() || teamKey2,
          games: []
        });
      }
      byTeam.get(teamKey2).games.push({ venue, homeGoals, awayGoals });
    };
    rows.forEach((row) => {
      if (!row || !Number.isFinite(Number(row.homeGoals)) || !Number.isFinite(Number(row.awayGoals))) return;
      pushGame(row.teamIdHome, row.home, "home", Number(row.homeGoals), Number(row.awayGoals));
      pushGame(row.teamIdAway, row.away, "away", Number(row.homeGoals), Number(row.awayGoals));
    });
    const cells = [];
    byTeam.forEach((team) => {
      templates.forEach((template) => {
        const games = template.venue === "any" ? team.games : team.games.filter((game) => game.venue === template.venue);
        const n = games.length;
        if (n < minN) return;
        const hits = games.filter((game) => templateHitsGame(template, game)).length;
        const hitRate = hits / n;
        const breakevenP = 1 / template.assumedOdds;
        cells.push({
          teamId: team.teamId,
          teamKey: team.teamKey,
          teamName: team.teamName,
          templateId: template.id,
          label: template.label,
          venue: template.venue || "any",
          n,
          hits,
          hitRate,
          hitCI: wilsonInterval(hits, n),
          assumedOdds: template.assumedOdds,
          pValue: binomialUpperTail(hits, n, breakevenP),
          qValue: null,
          survivesFdr: false,
          roi: hitRate * template.assumedOdds - 1
        });
      });
    });
    const m = cells.length;
    const order = cells.map((_, index) => index).sort((a, b) => cells[a].pValue - cells[b].pValue);
    let runningMin = 1;
    for (let rank = m; rank >= 1; rank -= 1) {
      const index = order[rank - 1];
      runningMin = Math.min(runningMin, cells[index].pValue * m / rank);
      cells[index].qValue = Math.min(1, runningMin);
    }
    cells.forEach((cell) => {
      cell.survivesFdr = cell.qValue !== null && cell.qValue <= q;
    });
    const ranked = cells.slice().sort((a, b) => b.roi - a.roi || b.hitRate - a.hitRate || b.n - a.n);
    return { rows: ranked, totalTested: m, survivors: ranked.filter((cell) => cell.survivesFdr) };
  };
  var assumedOddsFor = (spec, value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 1 ? parsed : spec.manualOdds > 1 ? spec.manualOdds : 6.5;
  };
  var chronologicalTeamResults = (spec, resultsIndex) => {
    const aliases = aliasesForTeam(spec.team);
    const venueFilter = venueFilterFor(spec);
    return resultRowsOf(resultsIndex).map((row) => ({ row, venue: aliases.length ? matchVenueForTeam(row, aliases) : "home" })).filter((entry) => entry.venue !== null && (!venueFilter || entry.venue === venueFilter)).sort((a, b) => {
      if (!a.row.date && !b.row.date) return 0;
      if (!a.row.date) return 1;
      if (!b.row.date) return -1;
      return a.row.date < b.row.date ? -1 : a.row.date > b.row.date ? 1 : 0;
    });
  };
  var evaluateResultWindow = (spec, entries, assumedOdds) => {
    let hits = 0;
    let profit = 0;
    entries.forEach(({ row, venue }) => {
      const hit = positionHitsResult(spec, venue, row);
      if (hit) hits += 1;
      profit += hit ? spec.stakePerMatch * (assumedOdds - 1) : -spec.stakePerMatch;
    });
    const n = entries.length;
    return {
      n,
      hits,
      hitRate: n > 0 ? hits / n : null,
      hitCI: wilsonInterval(hits, n),
      roi: n > 0 && spec.stakePerMatch > 0 ? profit / (n * spec.stakePerMatch) : null
    };
  };
  var walkForwardStrategy = (specInput, resultsIndex, { trainRatio = 0.7, assumedOdds } = {}) => {
    const spec = normalizeSpec(specInput);
    const odds = assumedOddsFor(spec, assumedOdds);
    const entries = chronologicalTeamResults(spec, resultsIndex);
    const ratio = clamp5(Number(trainRatio) || 0.7, 0.1, 0.9);
    const split = Math.floor(entries.length * ratio);
    const train = evaluateResultWindow(spec, entries.slice(0, split), odds);
    const test = evaluateResultWindow(spec, entries.slice(split), odds);
    const breakeven = 1 / odds;
    const testProfitable = test.n > 0 && test.hitRate !== null && test.hitRate > breakeven && test.roi !== null && test.roi > 0;
    const notDegraded = test.n === 0 || (test.hitRate === null || test.hitRate >= breakeven * 0.8) && (test.roi === null || test.roi >= -0.2);
    const oosDegraded = !notDegraded;
    let verdict = "样本外未明显退化，但仍为负期望（未通过）";
    if (test.n === 0) verdict = "没有样本外比赛：当前只能证明训练段拟合，不能证明策略可持续。";
    else if (oosDegraded) verdict = "样本外退化，淘汰";
    else if (testProfitable) verdict = "样本外仍为正期望，通过";
    return { train, test, testProfitable, notDegraded, oosDegraded, verdict, assumedOdds: odds, splitAt: split };
  };
  var autoRetireStrategy = (strategy) => {
    if (!strategy || strategy.status === "retired") return strategy;
    if (!strategyStats(strategy).suggestRetire) return strategy;
    return {
      ...strategy,
      status: "retired",
      retiredReason: "monitor_auto",
      statusHistory: [
        ...Array.isArray(strategy.statusHistory) ? strategy.statusHistory : [],
        { from: strategy.status, to: "retired", reason: "monitor_auto", at: (/* @__PURE__ */ new Date()).toISOString() }
      ]
    };
  };
  var pendingPositionsOf = (strategy) => (Array.isArray(strategy?.positions) ? strategy.positions : []).filter((position) => position?.status === "pending");
  var strategyPortfolio = (strategiesInput, { poolBalance = 0, riskCapRatio = 0.12 } = {}) => {
    const strategies = Array.isArray(strategiesInput) ? strategiesInput : [];
    const active = strategies.filter((strategy) => strategy?.status !== "retired");
    const pool = Math.max(0, Number(poolBalance) || 0);
    const teamMap = /* @__PURE__ */ new Map();
    let pendingCount = 0;
    let pendingStake = 0;
    active.forEach((strategy) => {
      const positions = pendingPositionsOf(strategy);
      if (positions.length === 0) return;
      const stake = positions.reduce((sum, position) => sum + Math.max(0, Number(position.stake) || 0), 0);
      const teamName = String(strategy.team || "").trim() || "全联赛";
      const teamKey2 = teamKeyForName(strategy.team) || "all";
      if (!teamMap.has(teamKey2)) teamMap.set(teamKey2, { teamKey: teamKey2, teamName, stake: 0, strategies: [] });
      const bucket = teamMap.get(teamKey2);
      bucket.stake += stake;
      bucket.strategies.push(strategy.name || "未命名策略");
      pendingCount += positions.length;
      pendingStake += stake;
    });
    const teams = [...teamMap.values()].map((team) => ({ ...team, pctOfPool: pool > 0 ? team.stake / pool : null })).sort((a, b) => b.stake - a.stake);
    const exposurePct = pool > 0 ? pendingStake / pool : null;
    const topTeamPct = pool > 0 && teams.length > 0 ? teams[0].stake / pool : 0;
    const alerts = [];
    const cap = Math.max(0, Number(riskCapRatio) || 0.12);
    if (pendingStake > 0 && (pool <= 0 || pendingStake > pool * cap)) {
      alerts.push({
        id: "total_exposure",
        level: pool > 0 && pendingStake <= pool * cap * 1.5 ? "warn" : "danger",
        text: `待执行注码 ¥${pendingStake.toFixed(1)}，${pool > 0 ? `占蓄水池 ${(exposurePct * 100).toFixed(1)}%` : "蓄水池余额未知"}，已超过 ${(cap * 100).toFixed(0)}% 风险上限。`
      });
    }
    teams.forEach((team) => {
      if (pool > 0 && team.stake / pool > 0.25) {
        alerts.push({ id: `team_exposure:${team.teamKey}`, level: "danger", text: `${team.teamName} 的待执行敞口占蓄水池 ${(team.stake / pool * 100).toFixed(1)}%，超过 25%。` });
      }
      if (team.strategies.length >= 3) {
        alerts.push({ id: `team_count:${team.teamKey}`, level: "warn", text: `${team.teamName} 同时运行 ${team.strategies.length} 个策略，注意同队相关性。` });
      }
    });
    return {
      activeCount: active.length,
      pendingCount,
      pendingStake,
      exposurePct,
      teams,
      alerts,
      concentration: { topTeamPct }
    };
  };
  var PORTFOLIO_MC_SEED = 20261017;
  var simulateStrategyPortfolio = (strategiesInput, { iterations = 1e4 } = {}) => {
    const strategies = Array.isArray(strategiesInput) ? strategiesInput : [];
    const groups = /* @__PURE__ */ new Map();
    let nPositions = 0;
    strategies.forEach((strategy) => {
      pendingPositionsOf(strategy).forEach((position) => {
        const matchKey = positionMatchKey(position);
        if (!groups.has(matchKey)) groups.set(matchKey, []);
        groups.get(matchKey).push({
          outcomeKey: positionOutcomeKey(strategy, position),
          p: numberIfPresent(position.p),
          stake: Math.max(0, Number(position.stake) || 0),
          entryOdds: numberIfPresent(position.entryOdds)
        });
        nPositions += 1;
      });
    });
    const groupList = [...groups.values()];
    const unavailable = (reason, message) => ({
      available: false,
      reason,
      message,
      iterations: 0,
      pProfit: null,
      pRuin: null,
      p5: null,
      median: null,
      p95: null,
      expectedMaxDD: null,
      worst: null,
      best: null,
      histogram: [],
      nMatches: groupList.length,
      nPositions
    });
    if (groupList.length === 0) {
      return unavailable("no_pending_positions", "尚无待结算头寸，组合推演不可用。");
    }
    const models = [];
    for (const positions of groupList) {
      if (positions.some(({ p, entryOdds }) => !Number.isFinite(p) || p < 0 || p > 1 || !Number.isFinite(entryOdds) || entryOdds <= 1)) {
        return unavailable("invalid_position_forecast", "头寸缺少有效概率或入场赔率，不能生成组合风险读数。");
      }
      const markets = /* @__PURE__ */ new Set();
      const categories = /* @__PURE__ */ new Map();
      for (const position of positions) {
        const key = position.outcomeKey;
        const market = /^had:(home|draw|away)$/.test(key) ? "had" : /^crs:\d+-\d+$/.test(key) ? "crs" : null;
        if (!market) return unavailable("unsupported_market", "头寸玩法缺少受支持的事件定义，组合推演不可用。");
        markets.add(market);
        if (categories.has(key) && Math.abs(categories.get(key) - position.p) > 1e-9) {
          return unavailable("inconsistent_probabilities", "同场同一结果的概率快照不一致，无法建立可靠的联合分布。");
        }
        categories.set(key, position.p);
      }
      if (markets.size > 1) {
        return unavailable("joint_distribution_unavailable", "同场比分与胜平负头寸可能同时命中，缺少完整一致的联合比分分布，组合推演不可用。");
      }
      const entries = [...categories.entries()].map(([outcomeKey, p]) => ({ outcomeKey, p }));
      const total = entries.reduce((sum, entry) => sum + entry.p, 0);
      if (total > 1 + 1e-9) {
        return unavailable("inconsistent_probabilities", "同场互斥结果的概率合计超过 100%，不能靠归一化修饰不一致的预测。");
      }
      models.push({ positions, entries });
    }
    const count = Math.max(1, Math.round(Number(iterations) || 1e4));
    const rng = mulberry32(PORTFOLIO_MC_SEED);
    const profits = [];
    let ruinCount = 0;
    let profitCount = 0;
    let ddSum = 0;
    for (let iteration = 0; iteration < count; iteration += 1) {
      let profit = 0;
      let hits = 0;
      let peak = 0;
      let maxDD = 0;
      models.forEach(({ positions, entries }) => {
        const roll = rng();
        let cumulative = 0;
        let selected = null;
        for (const entry of entries) {
          cumulative += entry.p;
          if (roll < cumulative) {
            selected = entry.outcomeKey;
            break;
          }
        }
        positions.forEach((position) => {
          const hit = selected === position.outcomeKey;
          if (hit) hits += 1;
          profit += hit ? position.stake * (position.entryOdds - 1) : -position.stake;
          if (profit > peak) peak = profit;
          maxDD = Math.max(maxDD, peak - profit);
        });
      });
      profits.push(profit);
      if (hits === 0) ruinCount += 1;
      if (profit > 0) profitCount += 1;
      ddSum += maxDD;
    }
    const sorted = [...profits].sort((a, b) => a - b);
    return {
      available: true,
      reason: null,
      message: "",
      iterations: count,
      pProfit: profitCount / count,
      pRuin: ruinCount / count,
      p5: percentileOf(sorted, 5),
      median: percentileOf(sorted, 50),
      p95: percentileOf(sorted, 95),
      expectedMaxDD: ddSum / count,
      worst: sorted[0],
      best: sorted[sorted.length - 1],
      histogram: buildHistogram(profits, HISTOGRAM_BINS),
      nMatches: groupList.length,
      nPositions
    };
  };
  var strategyQualityScore = (stats, { oosPassed = null } = {}) => {
    const safe = stats || {};
    const parts = {
      sample: clamp5((Number(safe.n) || 0) / 40, 0, 1) * 30,
      wilsonEdge: 0,
      clv: Number.isFinite(safe.avgClv) ? clamp5(safe.avgClv / 0.05, 0, 1) * 20 : 0,
      oos: oosPassed === true ? 10 : oosPassed === false ? 0 : 5,
      drift: safe.drift ? -10 : 0
    };
    let breakevenP = Number(safe.breakevenP);
    if (!Number.isFinite(breakevenP) && safe.hitCI && safe.roiCI) {
      const ratioSource = safe.hitCI.high > 0 ? "high" : safe.hitCI.low > 0 ? "low" : null;
      if (ratioSource) {
        const avgOdds = (safe.roiCI[ratioSource] + 1) / safe.hitCI[ratioSource];
        if (Number.isFinite(avgOdds) && avgOdds > 1) breakevenP = 1 / avgOdds;
      }
    }
    if (safe.hitCI && Number.isFinite(breakevenP)) {
      parts.wilsonEdge = clamp5((safe.hitCI.low - breakevenP) / 0.1, 0, 1) * 30;
    }
    const score = Math.round(clamp5(Object.values(parts).reduce((sum, value) => sum + value, 0), 0, 100));
    return { score, grade: score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : "D", parts };
  };
  var kellyStakeForPool = ({ p, odds, poolBalance, riskCapRatio = 0.12, kellyDivisor = 4 } = {}) => {
    const prob = clamp5(Number(p) || 0, 0, 1);
    const price = Number(odds);
    const pool = Math.max(0, Number(poolBalance) || 0);
    const fraction = Number.isFinite(price) && price > 1 ? Math.max(0, (prob * price - 1) / (price - 1)) : 0;
    const rawStake = pool * fraction / Math.max(1, Number(kellyDivisor) || 4);
    const cap = pool * Math.max(0, Number(riskCapRatio) || 0.12);
    const cappedStake = Math.min(rawStake, cap);
    return { fraction, rawStake, cappedStake, capReason: rawStake > cap + 1e-9 ? "risk_cap" : null };
  };
  var EXECUTION_OUTCOME_LABELS = { win: "胜", draw: "平", lose: "负" };
  var positionEntryName = (strategy, position) => {
    const spec = normalizeSpec(strategy);
    if (spec.market === "score") {
      const target = scoreCellForVenue(spec, position?.venue || "home");
      return `${target.home}-${target.away}`;
    }
    return EXECUTION_OUTCOME_LABELS[spec.outcome] || "胜";
  };
  var buildInvestmentFromPosition = (strategy, position, { stake, now = Date.now() } = {}) => {
    const amount = Math.max(0, Number(stake ?? position?.stake ?? strategy?.stakePerMatch) || 0);
    const createdAt = new Date(now).toISOString();
    const entryName = positionEntryName(strategy, position);
    const odds = Math.max(1.01, Number(position?.entryOdds) || 1.01);
    const investmentId = `inv_quants_${strategy?.id || "strategy"}_${position?.id || Date.now().toString(36)}`;
    return {
      id: investmentId,
      created_at: createdAt,
      parlay_size: 1,
      inputs: amount,
      suggested_amount: amount,
      expected_rating: clamp5(Number(position?.p) || 0, 0, 1),
      combined_odds: odds,
      status: "pending",
      source: "quants",
      strategy_id: strategy?.id || null,
      strategy_position_id: position?.id || null,
      matches: [
        {
          id: `match_${position?.id || investmentId}`,
          home_team: position?.home || "",
          away_team: position?.away || "",
          entries: [{ name: entryName, odds }],
          entry_text: entryName,
          odds,
          conf: clamp5(Number(position?.p) || 0, 0, 1),
          mode: "常规",
          tys_home: "M",
          tys_away: "M",
          fid: 0.4,
          fse_home: 0.5,
          fse_away: 0.5,
          fse_match: 0.5,
          note: ""
        }
      ]
    };
  };
  var markPositionExecuted = (strategy, positionId, { investmentId, stake, at } = {}) => {
    const positions = (Array.isArray(strategy?.positions) ? strategy.positions : []).map((position) => {
      if (position?.id !== positionId) return position;
      return {
        ...position,
        executedAt: at || (/* @__PURE__ */ new Date()).toISOString(),
        executedInvestmentId: investmentId || null,
        executedStake: Number.isFinite(Number(stake)) ? Number(stake) : position.stake
      };
    });
    return { ...strategy, positions };
  };
  var validateExecution = (strategy, position, { poolBalance = 0, riskCapRatio = 0.12, existingStrategies = [] } = {}) => {
    const reasons = [];
    if (strategy?.status !== "live") reasons.push("策略未转正，禁止进入实盘执行");
    if (position?.status !== "pending") reasons.push("该头寸已结算或已作废，不能重复执行");
    const stake = Math.max(0, Number(position?.stake ?? strategy?.stakePerMatch) || 0);
    const pool = Math.max(0, Number(poolBalance) || 0);
    const portfolio = strategyPortfolio(existingStrategies, { poolBalance: pool, riskCapRatio });
    const availableCash = Math.max(0, pool - portfolio.pendingStake);
    if (stake > availableCash + 1e-9) reasons.push("注码超过当前可用现金");
    if (pool <= 0 || portfolio.pendingStake + stake > pool * riskCapRatio + 1e-9) {
      reasons.push("组合总敞口将超过风险上限");
    }
    return { ok: reasons.length === 0, reasons };
  };
  var voidStrategyPosition = (strategy, positionId, reason = "manual") => {
    const positions = (Array.isArray(strategy?.positions) ? strategy.positions : []).map((position) => {
      if (position?.id !== positionId || position.status !== "pending") return position;
      return { ...position, status: "void", profit: 0, voidedAt: (/* @__PURE__ */ new Date()).toISOString(), reason };
    });
    return { ...strategy, positions };
  };
  var autoVoidStalePositions = (strategy, { now = Date.now(), staleDays = 10 } = {}) => {
    const nowMs = Number(now) || Date.now();
    const staleMs = Math.max(0, Number(staleDays) || 10) * DAY_MS2;
    const positions = (Array.isArray(strategy?.positions) ? strategy.positions : []).map((position) => {
      if (position?.status !== "pending") return position;
      const kickoff = new Date(position.kickoff).getTime();
      if (Number.isNaN(kickoff) || nowMs - kickoff <= staleMs) return position;
      return { ...position, status: "void", profit: 0, voidedAt: new Date(nowMs).toISOString(), reason: "stale_no_result" };
    });
    return { ...strategy, positions };
  };
  var csvEscape = (value) => {
    const textValue = String(value ?? "");
    return /[",\n\r]/.test(textValue) ? `"${textValue.replace(/"/g, '""')}"` : textValue;
  };
  var csvNumber = (value, digits = 2) => Number.isFinite(value) ? Number(value).toFixed(digits) : "";
  var exportStrategiesCsv = (strategiesInput) => {
    const strategies = Array.isArray(strategiesInput) ? strategiesInput : [];
    const headers = ["策略ID", "名称", "状态", "球队", "玩法", "计划场次", "每场注码", "已结算", "命中率", "ROI", "Sharpe", "平均CLV", "漂移", "建议退役", "可转正"];
    const rows = strategies.map((strategy) => {
      const stats = strategyStats(strategy);
      const market = strategy?.market === "score" ? `比分 ${strategy.score?.for ?? "?"}-${strategy.score?.against ?? "?"}` : `胜平负·${EXECUTION_OUTCOME_LABELS[strategy?.outcome] || "?"}`;
      return [
        strategy?.id,
        strategy?.name,
        STRATEGY_STATUS_LABELS[strategy?.status] || strategy?.status,
        strategy?.team || "全联赛",
        market,
        strategy?.matchesPlanned,
        strategy?.stakePerMatch,
        stats.n,
        stats.hitRate === null ? "" : (stats.hitRate * 100).toFixed(2) + "%",
        stats.roi === null ? "" : (stats.roi * 100).toFixed(2) + "%",
        csvNumber(stats.sharpe),
        stats.avgClv === null ? "" : (stats.avgClv * 100).toFixed(2) + "%",
        stats.drift ? "是" : "否",
        stats.suggestRetire ? "是" : "否",
        stats.promotable ? "是" : "否"
      ];
    });
    return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  };
  var POSITION_CSV_STATUS = { pending: "待结算", hit: "命中", miss: "未中", void: "作废" };
  var strategyPositionsCsv = (strategy) => {
    const headers = ["策略", "头寸ID", "主队", "客队", "开赛", "主客", "入场赔率", "收盘赔率", "CLV", "概率p", "状态", "盈亏", "最终比分", "作废原因"];
    const positions = Array.isArray(strategy?.positions) ? strategy.positions : [];
    const rows = positions.map((position) => [
      strategy?.name,
      position.id,
      position.home,
      position.away,
      position.kickoff,
      position.venue === "home" ? "主" : position.venue === "away" ? "客" : "",
      csvNumber(Number(position.entryOdds)),
      csvNumber(Number(position.lastSeenOdds)),
      Number.isFinite(position.clv) ? (position.clv * 100).toFixed(2) + "%" : "",
      Number.isFinite(Number(position.p)) ? (Number(position.p) * 100).toFixed(2) + "%" : "",
      POSITION_CSV_STATUS[position.status] || position.status,
      position.status === "pending" ? "" : csvNumber(Number(position.profit)),
      position.finalScore || "",
      position.reason || ""
    ]);
    return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  };

  // source/src/lib/quantResearch.js
  var quantResearch_exports = {};
  __export(quantResearch_exports, {
    RESEARCH_ENGINE_VERSION: () => RESEARCH_ENGINE_VERSION,
    RESEARCH_RANDOM_SEED: () => RESEARCH_RANDOM_SEED,
    RESEARCH_STORAGE_KEY: () => RESEARCH_STORAGE_KEY,
    compareResearchRuns: () => compareResearchRuns,
    createResearchExperiment: () => createResearchExperiment,
    getResearchDataCoverage: () => getResearchDataCoverage,
    getResearchStore: () => getResearchStore,
    rerunResearchExperiment: () => rerunResearchExperiment,
    saveResearchConclusion: () => saveResearchConclusion
  });
  var RESEARCH_STORAGE_KEY = "eivra.quant_research.v1";
  var RESEARCH_ENGINE_VERSION = "quant-research/1.0.0;quant-strategy/20261020";
  var RESEARCH_RANDOM_SEED = 20260930;
  var MAX_STORE_BYTES = 4 * 1024 * 1024;
  var KINDS = ["frequency", "scenario", "simulation"];
  var SPEC_FIELDS = [
    "name",
    "team",
    "venue",
    "market",
    "score",
    "outcome",
    "matchesPlanned",
    "stakePerMatch",
    "oddsMode",
    "manualOdds",
    "probMode",
    "customProb",
    "bankroll"
  ];
  var RESULT_FIELDS = [
    "id",
    "matchId",
    "date",
    "kickoff",
    "home",
    "away",
    "homeGoals",
    "awayGoals",
    "teamIdHome",
    "teamIdAway",
    "teamKeyHome",
    "teamKeyAway",
    "source",
    "league",
    "outcome_available_at"
  ];
  var clone = (value) => JSON.parse(JSON.stringify(value));
  var emptyStore = () => ({ schemaVersion: 1, projects: [], versions: [], runs: [] });
  var text4 = (value) => String(value ?? "").trim();
  var pick = (value, fields) => Object.fromEntries(fields.filter((field) => value?.[field] !== void 0).map((field) => [field, value[field]]));
  var makeId = (prefix) => `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`}`;
  var rowsOf2 = (index) => Array.isArray(index) ? index : Array.isArray(index?.matches) ? index.matches : [];
  var stableStringify = (value) => {
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
    if (value && typeof value === "object") {
      return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
    }
    return JSON.stringify(value);
  };
  var fingerprint = (value) => {
    const content = stableStringify(value);
    let a = 2166136261;
    let b = 2246822519;
    for (let i = 0; i < content.length; i += 1) {
      a = Math.imul(a ^ content.charCodeAt(i), 16777619);
      b = Math.imul(b ^ content.charCodeAt(i), 3266489917);
    }
    return `qr1_${(a >>> 0).toString(16).padStart(8, "0")}${(b >>> 0).toString(16).padStart(8, "0")}`;
  };
  var assertStore = (store) => {
    if (!store || store.schemaVersion !== 1 || !Array.isArray(store.projects) || !Array.isArray(store.versions) || !Array.isArray(store.runs)) {
      throw new Error("研究记录格式无法识别；原有数据已保留，请先备份并检查浏览器存储。");
    }
    const allIds = /* @__PURE__ */ new Set();
    for (const item of [...store.projects, ...store.versions, ...store.runs]) {
      if (!item || typeof item.id !== "string" || !item.id || allIds.has(item.id)) {
        throw new Error("研究记录存在损坏或重复标识；原有数据已保留。");
      }
      allIds.add(item.id);
    }
    const projectIds = new Set(store.projects.map((project) => project.id));
    const versionIds = new Set(store.versions.map((version) => version.id));
    if (store.versions.some((version) => !projectIds.has(version.projectId) || !version.spec) || store.runs.some((run) => !projectIds.has(run.projectId) || !versionIds.has(run.versionId) || !run.inputSnapshot || !run.result)) {
      throw new Error("研究记录关联不完整；原有数据已保留。");
    }
    return store;
  };
  var getResearchStore = () => {
    if (typeof window === "undefined") return emptyStore();
    if (isPreviewMode()) return clone(assertStore(previewRead(RESEARCH_STORAGE_KEY, emptyStore())));
    const raw = brandLocalStorage.getItem(RESEARCH_STORAGE_KEY);
    if (raw === null) return emptyStore();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("研究记录无法解析；原有数据已保留，请先备份并检查浏览器存储。");
    }
    return clone(assertStore(parsed));
  };
  var writeStore = (store) => {
    if (typeof window === "undefined") throw new Error("当前环境无法保存研究记录。");
    assertStore(store);
    const serialized = JSON.stringify(store);
    if (serialized.length * 2 > MAX_STORE_BYTES) {
      throw new Error("研究记录已接近本地容量上限，本次未保存；请先备份记录并缩小实验数据范围。");
    }
    const preview = isPreviewMode();
    if (preview) previewWrite(RESEARCH_STORAGE_KEY, store);
    else brandLocalStorage.setItem(RESEARCH_STORAGE_KEY, serialized);
    window.dispatchEvent(new CustomEvent("eivra:data-changed", {
      detail: { key: RESEARCH_STORAGE_KEY, preview }
    }));
  };
  var strictDate = (input) => {
    const date = normalizeMatchDate(input);
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const timestamp = Date.parse(`${date}T00:00:00Z`);
    return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === date ? date : null;
  };
  var normalizeProtocol = (protocol = {}) => {
    const normalized = {};
    for (const field of ["startDate", "endDate", "holdoutStart"]) {
      const raw = text4(protocol[field]);
      const date = raw ? strictDate(raw) : "";
      if (raw && !date) throw new Error("实验日期无效，请使用真实的年月日。");
      normalized[field] = date;
    }
    const { startDate, endDate, holdoutStart } = normalized;
    if (startDate && endDate && startDate > endDate) throw new Error("研究开始日期不能晚于结束日期。");
    if (holdoutStart && (startDate && holdoutStart <= startDate || endDate && holdoutStart > endDate)) {
      throw new Error("时间切分点必须晚于开始日期，且不晚于结束日期。");
    }
    return normalized;
  };
  var scoreValue = (value) => {
    if (value == null || typeof value === "boolean" || text4(value) === "") return null;
    const number3 = Number(value);
    return Number.isInteger(number3) && number3 >= 0 && number3 <= 30 ? number3 : null;
  };
  var historicalRows = (inputRows) => {
    const excluded = [];
    const groups = /* @__PURE__ */ new Map();
    inputRows.forEach((raw, index) => {
      const row = {
        id: text4(raw?.id || raw?.matchId) || `row_${index + 1}`,
        date: strictDate(raw?.date || raw?.kickoff),
        home: text4(raw?.home),
        away: text4(raw?.away),
        homeGoals: scoreValue(raw?.homeGoals),
        awayGoals: scoreValue(raw?.awayGoals),
        source: text4(raw?.source),
        league: text4(raw?.league)
      };
      let reason = "";
      if (!row.date) reason = "missing_or_invalid_date";
      else if (row.homeGoals === null || row.awayGoals === null) reason = "invalid_score";
      else if (!row.home || !row.away) reason = "missing_team";
      const homeKey = row.home ? teamKeyForName(row.home) : null;
      const awayKey = row.away ? teamKeyForName(row.away) : null;
      if (!reason && (!homeKey || !awayKey || homeKey === awayKey)) reason = "invalid_team_identity";
      if (reason) {
        excluded.push({ ...row, reason });
        return;
      }
      const eventKey3 = `${row.date}|${homeKey}|${awayKey}`;
      const enriched = {
        ...row,
        eventKey: eventKey3,
        homeKey,
        awayKey,
        homeScore: row.homeGoals,
        awayScore: row.awayGoals
      };
      groups.set(eventKey3, [...groups.get(eventKey3) || [], enriched]);
    });
    const valid = [];
    groups.forEach((group) => {
      const scoreSet = new Set(group.map((row) => `${row.homeGoals}:${row.awayGoals}`));
      if (scoreSet.size > 1) {
        group.forEach((row) => excluded.push({ ...row, reason: "conflicting_result" }));
        return;
      }
      valid.push(group[0]);
      group.slice(1).forEach((row) => excluded.push({ ...row, reason: "duplicate" }));
    });
    valid.sort((a, b) => a.date.localeCompare(b.date) || a.eventKey.localeCompare(b.eventKey));
    return { valid, excluded };
  };
  var venueFor = (spec, row) => {
    if (!spec.team) return "home";
    const key = teamKeyForName(spec.team);
    if (key === row.homeKey) return "home";
    if (key === row.awayKey) return "away";
    return null;
  };
  var hitFor = (spec, row, venue) => {
    const goals = venue === "away" ? row.awayGoals : row.homeGoals;
    const opponent = venue === "away" ? row.homeGoals : row.awayGoals;
    if (spec.market === "score") return goals === spec.score.for && opponent === spec.score.against;
    if (spec.outcome === "draw") return goals === opponent;
    return spec.outcome === "win" ? goals > opponent : goals < opponent;
  };
  var summarize = (rows, spec, kind) => {
    const n = rows.length;
    const hits = rows.filter((row) => row.hit).length;
    const summary = { n, hits, hitRate: n ? hits / n : null, hitCI: n ? wilsonInterval(hits, n) : null };
    if (kind !== "scenario") return summary;
    let totalProfit = 0;
    let peak = 0;
    let maxDrawdown = 0;
    const equityCurve = rows.map((row, index) => {
      const profit = row.hit ? spec.stakePerMatch * (spec.manualOdds - 1) : -spec.stakePerMatch;
      totalProfit += profit;
      peak = Math.max(peak, totalProfit);
      maxDrawdown = Math.max(maxDrawdown, peak - totalProfit);
      return { i: index + 1, id: row.id, date: row.date, profit, cum: totalProfit };
    });
    const totalStaked = n * spec.stakePerMatch;
    return {
      ...summary,
      roi: totalStaked > 0 ? totalProfit / totalStaked : null,
      totalProfit: n ? totalProfit : null,
      totalStaked,
      maxDrawdown: n ? maxDrawdown : null,
      equityCurve,
      assumedOdds: spec.manualOdds
    };
  };
  var evaluateHistory = (snapshot, kind) => {
    const { spec, protocol } = snapshot;
    const { valid, excluded: invalid } = historicalRows(snapshot.results);
    const excluded = [...invalid];
    const included = [];
    const baselineRows = [];
    valid.forEach((row) => {
      let reason = "";
      if (protocol.startDate && row.date < protocol.startDate || protocol.endDate && row.date > protocol.endDate) {
        reason = "outside_period";
      } else {
        baselineRows.push({ ...row, venue: "home", hit: hitFor(spec, row, "home") });
        const venue = venueFor(spec, row);
        if (!venue) reason = "outside_team";
        else if (spec.team && spec.venue !== "any" && spec.venue !== venue) reason = "outside_venue";
        else included.push({ ...row, venue, hit: hitFor(spec, row, venue) });
      }
      if (reason) excluded.push({ ...row, reason });
    });
    const splitEnabled = Boolean(protocol.holdoutStart);
    const training = splitEnabled ? included.filter((row) => row.date < protocol.holdoutStart) : [];
    const holdout = splitEnabled ? included.filter((row) => row.date >= protocol.holdoutStart) : [];
    return {
      label: kind === "frequency" ? "历史规律研究" : "统一假定赔率情景推演",
      disclaimer: kind === "frequency" ? "仅统计已知赛果的历史频率，不推导历史可执行收益。未用于预测质量评估。" : `所有入选比赛均按统一假定赔率 ${spec.manualOdds}、每场 ${spec.stakePerMatch} 单位结算；没有历史报价快照，不能还原历史可执行收益。`,
      counts: { source: snapshot.results.length, valid: valid.length, selected: included.length, excluded: excluded.length },
      included,
      excluded,
      summary: summarize(included, spec, kind),
      baseline: {
        label: "同期全部有效赛事 · 主队视角频率参考",
        disclaimer: "用于描述样本背景；与筛选样本不同，不代表策略增量收益或因果贡献。",
        summary: summarize(baselineRows, spec, "frequency")
      },
      split: {
        enabled: splitEnabled,
        holdoutStart: protocol.holdoutStart,
        training: splitEnabled ? summarize(training, spec, kind) : null,
        holdout: splitEnabled ? summarize(holdout, spec, kind) : null,
        note: "这是单次历史时间切分；切分后的数据已经可见，不能据此声明独立验证或策略有效。"
      },
      analysis: null
    };
  };
  var evaluate = (snapshot, kind) => {
    if (kind !== "simulation") return evaluateHistory(snapshot, kind);
    const analysis = analyzeStrategy(snapshot.spec, snapshot.marketMatches, {
      ratings: snapshot.ratings,
      kellyDivisor: snapshot.kellyDivisor,
      now: snapshot.capturedAt
    });
    if (analysis.available === false) {
      throw new Error(analysis.message || "当前输入不足以进行可靠推演，本次实验未保存。");
    }
    const actualLegs = analysis.legs.filter((leg) => !leg.estimated);
    return clone({
      label: "条件概率推演",
      disclaimer: "根据当前概率和报价假设推演未来路径。补齐的未来场次与缺失报价使用估计值，结果不是历史验证；时间切分不适用于此实验。",
      counts: {
        source: snapshot.marketMatches.length,
        valid: snapshot.marketMatches.length,
        selected: actualLegs.length,
        excluded: Math.max(0, snapshot.marketMatches.length - actualLegs.length),
        estimated: analysis.legs.filter((leg) => leg.estimated).length
      },
      included: analysis.legs,
      excluded: [],
      summary: {
        n: analysis.legs.length,
        hits: null,
        hitRate: null,
        hitCI: null,
        expectedProfit: analysis.monteCarlo.meanProfit,
        expectedRoi: analysis.monteCarlo.expectedRoiPct / 100,
        profitProbability: analysis.monteCarlo.pProfit,
        maxDrawdown: analysis.monteCarlo.expectedMaxDD
      },
      split: { enabled: false, holdoutStart: "", training: null, holdout: null, note: "条件推演不使用历史时间切分。" },
      baseline: null,
      analysis
    });
  };
  var getResearchDataCoverage = (resultsIndex, marketMatches = []) => {
    const source = rowsOf2(resultsIndex);
    const { valid, excluded } = historicalRows(source);
    const reasons = {};
    excluded.forEach(({ reason }) => {
      reasons[reason] = (reasons[reason] || 0) + 1;
    });
    return {
      source: source.length,
      valid: valid.length,
      excluded: excluded.length,
      reasons,
      firstDate: valid[0]?.date || null,
      lastDate: valid.at(-1)?.date || null,
      marketCount: Array.isArray(marketMatches) ? marketMatches.length : 0,
      capabilities: { frequency: valid.length > 0, scenario: valid.length > 0, simulation: true, historicalPriceReplay: false }
    };
  };
  var snapshotOf = ({ spec, brief = {}, protocol = {}, resultsIndex, marketMatches = [], ratings = null, kellyDivisor = 4 }, kind) => {
    const parsedDivisor = Number(kellyDivisor);
    return clone({
      capturedAt: (/* @__PURE__ */ new Date()).toISOString(),
      spec: pick(normalizeSpec(spec), SPEC_FIELDS),
      brief: { hypothesis: text4(brief.hypothesis), falsifier: text4(brief.falsifier), notes: text4(brief.notes) },
      protocol: normalizeProtocol(protocol),
      results: kind === "simulation" ? [] : rowsOf2(resultsIndex).map((row) => pick(row, RESULT_FIELDS)),
      marketMatches: kind === "simulation" && Array.isArray(marketMatches) ? marketMatches : [],
      ratings: kind === "simulation" ? ratings : null,
      kellyDivisor: Number.isFinite(parsedDivisor) && parsedDivisor >= 1 ? parsedDivisor : 4
    });
  };
  var dataFingerprint = (snapshot, kind) => fingerprint(kind === "simulation" ? { marketMatches: snapshot.marketMatches, ratings: snapshot.ratings, kellyDivisor: snapshot.kellyDivisor } : snapshot.results);
  var makeRun = ({ projectId, versionId, kind, snapshot, reproductionOf = null }) => ({
    id: makeId("run"),
    projectId,
    versionId,
    kind,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    inputSnapshot: snapshot,
    result: evaluate(snapshot, kind),
    conclusion: "",
    dataFingerprint: dataFingerprint(snapshot, kind),
    engineVersion: RESEARCH_ENGINE_VERSION,
    randomSeed: kind === "simulation" ? RESEARCH_RANDOM_SEED : null,
    reproductionOf
  });
  var createResearchExperiment = ({ projectId = null, kind = "frequency", ...input } = {}) => {
    if (!KINDS.includes(kind)) throw new Error("不支持的实验类型。");
    const store = getResearchStore();
    const snapshot = snapshotOf(input, kind);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const previous = projectId ? store.projects.find((project2) => project2.id === projectId) : null;
    if (projectId && !previous) throw new Error("未找到该研究，请刷新记录后重试。");
    const project = previous ? { ...previous, updatedAt: now } : { id: makeId("research"), name: snapshot.spec.name || snapshot.brief.hypothesis || "未命名研究", createdAt: now, updatedAt: now };
    const version = {
      id: makeId("version"),
      projectId: project.id,
      number: store.versions.filter((item) => item.projectId === project.id).length + 1,
      createdAt: now,
      spec: snapshot.spec,
      brief: snapshot.brief,
      protocol: snapshot.protocol,
      kind
    };
    const run = makeRun({ projectId: project.id, versionId: version.id, kind, snapshot });
    const next = {
      ...store,
      projects: previous ? store.projects.map((item) => item.id === project.id ? project : item) : [...store.projects, project],
      versions: [...store.versions, version],
      runs: [...store.runs, run]
    };
    writeStore(next);
    return clone({ project, version, run, store: next });
  };
  var rerunResearchExperiment = (runId) => {
    const store = getResearchStore();
    const original = store.runs.find((run2) => run2.id === runId);
    if (!original) throw new Error("未找到原实验记录。");
    if (original.engineVersion !== RESEARCH_ENGINE_VERSION) {
      throw new Error("原实验使用不同的计算引擎，当前版本无法严格复现；原记录已保留。");
    }
    if (original.kind === "simulation" && original.randomSeed !== RESEARCH_RANDOM_SEED) {
      throw new Error("原实验随机种子与当前引擎不一致，无法严格复现。");
    }
    const run = makeRun({
      projectId: original.projectId,
      versionId: original.versionId,
      kind: original.kind,
      snapshot: clone(original.inputSnapshot),
      reproductionOf: original.id
    });
    const project = { ...store.projects.find((item) => item.id === run.projectId), updatedAt: run.createdAt };
    const version = store.versions.find((item) => item.id === run.versionId);
    const next = {
      ...store,
      projects: store.projects.map((item) => item.id === project.id ? project : item),
      runs: [...store.runs, run]
    };
    writeStore(next);
    return clone({ project, version, run, store: next });
  };
  var saveResearchConclusion = (runId, conclusion) => {
    const store = getResearchStore();
    const original = store.runs.find((run2) => run2.id === runId);
    if (!original) throw new Error("未找到要记录结论的实验。");
    const run = { ...original, conclusion: text4(conclusion), conclusionUpdatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    const next = { ...store, runs: store.runs.map((item) => item.id === runId ? run : item) };
    writeStore(next);
    return clone(run);
  };
  var compareResearchRuns = (left, right) => {
    const reasons = [];
    if (!left || !right) return { comparable: false, reasons: ["请选择两个实验。"], changedFields: [], deltas: {} };
    if (left.kind !== right.kind) reasons.push("实验类型不同。");
    if (!left.dataFingerprint || left.dataFingerprint !== right.dataFingerprint) reasons.push("数据或行情快照不同。");
    if (stableStringify(left.inputSnapshot?.protocol) !== stableStringify(right.inputSnapshot?.protocol)) reasons.push("实验区间或切分协议不同。");
    if (!left.engineVersion || left.engineVersion !== right.engineVersion) reasons.push("计算引擎版本不同。");
    if (left.randomSeed !== right.randomSeed) reasons.push("随机种子不同。");
    if (left.kind !== "frequency" && right.kind !== "frequency") {
      for (const field of ["stakePerMatch", "bankroll"]) {
        if (left.inputSnapshot?.spec?.[field] !== right.inputSnapshot?.spec?.[field]) {
          reasons.push("投入或资金假设不同；不能直接将资金差异当作策略收益提升。");
          break;
        }
      }
      if (left.kind === "scenario" && left.inputSnapshot?.spec?.manualOdds !== right.inputSnapshot?.spec?.manualOdds) {
        reasons.push("统一假定赔率不同；仅比较价格假设的变化。");
      }
    }
    const changedFields = SPEC_FIELDS.filter((field) => stableStringify(left.inputSnapshot?.spec?.[field]) !== stableStringify(right.inputSnapshot?.spec?.[field])).map((field) => ({ field, before: left.inputSnapshot?.spec?.[field], after: right.inputSnapshot?.spec?.[field] }));
    const deltas = {};
    if (!reasons.length) {
      for (const metric of ["n", "hits", "hitRate", "roi", "totalProfit", "expectedProfit", "expectedRoi", "maxDrawdown"]) {
        const before = left.result?.summary?.[metric];
        const after = right.result?.summary?.[metric];
        if (Number.isFinite(before) && Number.isFinite(after)) deltas[metric] = after - before;
      }
    }
    return {
      comparable: reasons.length === 0,
      reasons,
      changedFields,
      deltas,
      note: "差异为右侧减左侧。相同输入条件允许描述性比较，不能据此推断因果贡献或独立验证通过。"
    };
  };

  // source/src/lib/quantForward.js
  var quantForward_exports = {};
  __export(quantForward_exports, {
    FORWARD_KEY: () => FORWARD_KEY,
    FORWARD_REASON_LABELS: () => FORWARD_REASON_LABELS,
    assertForwardStore: () => assertForwardStore,
    createObservationPlan: () => createObservationPlan,
    emptyForwardStore: () => emptyForwardStore,
    exportForwardSnapshot: () => exportForwardSnapshot,
    forwardPlanMetrics: () => forwardPlanMetrics,
    getForwardStore: () => getForwardStore,
    importForwardSnapshot: () => importForwardSnapshot,
    mergeForwardStores: () => mergeForwardStores,
    processForwardBatch: () => processForwardBatch,
    runForwardTask: () => runForwardTask
  });

  // source/src/lib/quantStore.js
  var copy = (value) => JSON.parse(JSON.stringify(value));
  var uid = (prefix) => `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`}`;
  var stableJSON = (value) => {
    if (Array.isArray(value)) return `[${value.map(stableJSON).join(",")}]`;
    if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJSON(value[key])}`).join(",")}}`;
    return JSON.stringify(value);
  };
  var contentId = (value) => {
    let a = 2166136261;
    let b = 2246822519;
    const data = stableJSON(value);
    for (let i = 0; i < data.length; i += 1) {
      a = Math.imul(a ^ data.charCodeAt(i), 16777619);
      b = Math.imul(b ^ data.charCodeAt(i), 3266489917);
    }
    return `${(a >>> 0).toString(16).padStart(8, "0")}${(b >>> 0).toString(16).padStart(8, "0")}`;
  };
  function quantStore(key, arrayFields, maxBytes = 4 * 1024 * 1024) {
    const empty = () => ({ schemaVersion: 1, ...Object.fromEntries(arrayFields.map((field) => [field, []])) });
    const assert = (store) => {
      if (!store || store.schemaVersion !== 1 || arrayFields.some((field) => !Array.isArray(store[field]))) throw new Error("研究存储格式不兼容，原数据已保留。请先导出备份。");
      for (const field of arrayFields) {
        const ids = /* @__PURE__ */ new Set();
        for (const item of store[field]) {
          if (!item?.id || ids.has(item.id)) throw new Error("研究存储有缺失或重复标识，原数据已保留。");
          ids.add(item.id);
        }
      }
      return store;
    };
    const read = () => {
      if (typeof window === "undefined") return empty();
      if (isPreviewMode()) return copy(assert(previewRead(key, empty())));
      const raw = brandLocalStorage.getItem(key);
      if (raw == null) return empty();
      try {
        return copy(assert(JSON.parse(raw)));
      } catch (error) {
        throw new Error(`无法读取研究记录：${error.message}。没有覆盖原数据。`);
      }
    };
    const write = (store) => {
      assert(store);
      if (typeof window === "undefined") throw new Error("当前环境无法保存浏览器研究记录。");
      const raw = JSON.stringify(store);
      if (raw.length * 2 > maxBytes) throw new Error("本地研究记录达到容量上限，本次未保存；请先导出备份。");
      const preview = isPreviewMode();
      if (preview) previewWrite(key, copy(store));
      else brandLocalStorage.setItem(key, raw);
      window.dispatchEvent(new CustomEvent("eivra:data-changed", { detail: { key, preview } }));
      return copy(store);
    };
    return { empty, assert, read, write };
  }
  var immutableUnion = (left, right) => {
    const items = new Map(left.map((item) => [item.id, item]));
    for (const item of right) {
      const previous = items.get(item.id);
      if (previous && stableJSON(previous) !== stableJSON(item)) throw new Error(`不可变记录冲突：${item.id}，未覆盖旧记录。`);
      items.set(item.id, item);
    }
    return [...items.values()];
  };

  // source/src/lib/quantEvidence.js
  var EVIDENCE_KEY = "eivra.quant_evidence.v1";
  var storage = quantStore(EVIDENCE_KEY, ["events", "quotes", "results", "imports"]);
  var getEvidenceStore = storage.read;
  var emptyEvidenceStore = storage.empty;
  var text5 = (value) => String(value ?? "").trim();
  var numeric = (value) => value !== "" && value != null && typeof value !== "boolean" && Number.isFinite(Number(value)) ? Number(value) : null;
  var instant = (value) => {
    if (typeof value !== "string") return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
    if (!match) return null;
    const [, year, month, day, hour, minute, second = "0", zone] = match;
    if (+month < 1 || +month > 12 || +day < 1 || +hour > 23 || +minute > 59 || +second > 59) return null;
    if (new Date(Date.UTC(+year, +month - 1, +day)).toISOString().slice(0, 10) !== `${year}-${month}-${day}`) return null;
    if (zone !== "Z" && (+zone.slice(1, 3) > 14 || +zone.slice(4) > 59 || +zone.slice(1, 3) === 14 && +zone.slice(4) !== 0)) return null;
    const time = Date.parse(value);
    return Number.isFinite(time) ? time : null;
  };
  var iso = (value) => instant(value) === null ? null : new Date(instant(value)).toISOString();
  var eventKey2 = (row) => {
    const kickoff = iso(row?.kickoff);
    const home = text5(row?.home) && teamKeyForName(row.home);
    const away = text5(row?.away) && teamKeyForName(row.away);
    return kickoff && home && away && home !== away ? `${kickoff}|${home}|${away}` : null;
  };
  var quoteForSpec = (spec, row) => {
    const key = spec.team ? teamKeyForName(spec.team) : null;
    const venue = !key ? spec.venue === "away" ? "away" : "home" : key === teamKeyForName(row.home) ? "home" : key === teamKeyForName(row.away) ? "away" : null;
    if (!venue || spec.venue !== "all" && spec.venue !== "any" && spec.venue && spec.venue !== venue) return null;
    if (spec.market === "score") {
      const h = numeric(spec.score?.for);
      const a = numeric(spec.score?.against);
      if (![h, a].every((value) => Number.isInteger(value) && value >= 0 && value <= 30)) return null;
      return { venue, selection: venue === "home" ? `${h}-${a}` : `${a}-${h}` };
    }
    if (!["win", "draw", "lose"].includes(spec.outcome)) return null;
    return { venue, selection: spec.outcome === "draw" ? "draw" : spec.outcome === "win" === (venue === "home") ? "home" : "away" };
  };
  var resultHit = (selection, market, result) => market === "score" ? selection === `${result.homeGoals}-${result.awayGoals}` : selection === "draw" ? result.homeGoals === result.awayGoals : selection === "home" ? result.homeGoals > result.awayGoals : result.homeGoals < result.awayGoals;
  var latestQuote = (quotes, { eventId, market, selection, at, maxAgeMinutes = 60, source } = {}) => {
    const time = instant(at);
    if (time === null) return { quote: null, reason: "invalid_decision_time" };
    const eligible = quotes.filter((quote2) => quote2.eventId === eventId && quote2.market === market && quote2.selection === selection && (!source || quote2.source === source) && instant(quote2.observedAt) !== null && instant(quote2.observedAt) <= time && instant(quote2.observedAt) < instant(quote2.kickoff)).sort((a, b) => instant(b.observedAt) - instant(a.observedAt) || a.source.localeCompare(b.source));
    const quote = eligible[0];
    if (!quote) return { quote: null, reason: "missing_asof_quote" };
    const simultaneous = eligible.filter((item) => item.observedAt === quote.observedAt && item.source === quote.source);
    if (new Set(simultaneous.map((item) => `${item.odds}|${item.tradable}`)).size > 1) return { quote: null, reason: "conflicting_quote" };
    if (quote.tradable === false) return { quote: null, reason: "market_closed" };
    if (time - instant(quote.observedAt) > maxAgeMinutes * 6e4) return { quote: null, reason: "stale_quote" };
    return { quote, reason: null };
  };
  var resolveForecast = (spec, eventQuotes, { results = [], at, source: requestedSource } = {}) => {
    const time = instant(at);
    const base = { available: false, probability: null, source: null, reason: "forecast_unavailable", generatedAt: at, trainingCount: 0 };
    const quotes = (eventQuotes || []).filter((row) => time !== null && instant(row.observedAt) !== null && instant(row.observedAt) <= time && instant(row.kickoff) > time && row.eventId === eventKey2(row) && (!requestedSource || row.source === requestedSource) && Number.isFinite(row.odds) && row.odds > 1);
    const event = quotes[0];
    const target = event && quoteForSpec(spec, event);
    if (!target) return base;
    const fromCells = (cells) => cells.reduce((sum, cell) => sum + (resultHit(target.selection, spec.market, { homeGoals: cell.home, awayGoals: cell.away }) ? cell.p : 0), 0);
    let probability = null;
    let source = spec.probMode;
    let trainingCount = 0;
    let inputs = { engineVersion: "quant-forecast/1.0.0", requestedMode: spec.probMode };
    if (spec.probMode === "custom") probability = numeric(spec.customProb);
    else if (spec.probMode === "base") probability = fromCells(deriveScoreDistribution(DEFAULT_LAMBDA_PRIOR.home, DEFAULT_LAMBDA_PRIOR.away));
    else if (spec.probMode === "ratings") {
      const grouped = /* @__PURE__ */ new Map();
      results.filter((row) => row.eventId === eventKey2(row) && instant(row.availableAt) !== null && instant(row.availableAt) < time && instant(row.kickoff) < time && instant(row.availableAt) >= instant(row.kickoff) && [row.homeGoals, row.awayGoals].every((value) => Number.isInteger(value) && value >= 0 && value <= 30)).forEach((row) => grouped.set(row.eventId, [...grouped.get(row.eventId) || [], row]));
      const training = [...grouped.values()].filter((group) => new Set(group.map((row) => `${row.homeGoals}:${row.awayGoals}`)).size === 1).map((group) => ({ ...group[0], date: group[0].kickoff, teamKeyHome: teamKeyForName(group[0].home), teamKeyAway: teamKeyForName(group[0].away) }));
      trainingCount = training.length;
      const model = probabilityFromRatings({ teamKeyHome: teamKeyForName(event.home), teamKeyAway: teamKeyForName(event.away) }, buildTeamRatings(training));
      inputs = { ...inputs, trainingEvidenceIds: training.map((row) => row.id), homeLambda: model.ready ? model.homeLambda : null, awayLambda: model.ready ? model.awayLambda : null };
      if (model.ready) probability = fromCells(model.cells);
      else return { ...base, reason: "ratings_unavailable", trainingCount };
    } else if (spec.probMode === "market") {
      const groups = /* @__PURE__ */ new Map();
      quotes.filter((row) => row.eventId === event.eventId && row.market === "result").forEach((row) => {
        const key = `${row.source}|${row.observedAt}`;
        groups.set(key, [...groups.get(key) || [], row]);
      });
      const latest = [...groups.values()].sort((a, b) => instant(b[0].observedAt) - instant(a[0].observedAt) || a[0].source.localeCompare(b[0].source))[0];
      if (!latest || !["home", "draw", "away"].every((key) => new Set(latest.filter((row) => row.selection === key).map((row) => `${row.odds}|${row.tradable}`)).size === 1)) return { ...base, reason: "incomplete_market_distribution" };
      if (latest.some((row) => row.tradable === false)) return { ...base, reason: "market_closed" };
      const prices = Object.fromEntries(latest.map((row) => [row.selection, row.odds]));
      const fit = fitMarketLambdas({ oneXTwo: prices });
      inputs = {
        ...inputs,
        quoteIds: latest.map((row) => row.id),
        quoteSource: latest[0].source,
        observedAt: latest[0].observedAt,
        homeLambda: fit?.ready ? fit.homeLambda : null,
        awayLambda: fit?.ready ? fit.awayLambda : null
      };
      if (fit?.ready) {
        probability = fromCells(deriveScoreDistribution(fit.homeLambda, fit.awayLambda));
        source = "market_poisson";
      } else if (spec.market === "result") {
        probability = 1 / prices[target.selection] / Object.values(prices).reduce((sum, odds) => sum + 1 / odds, 0);
        source = "market_devig";
      }
    }
    return Number.isFinite(probability) && probability >= 0 && probability <= 1 ? { ...base, available: true, probability, source, reason: null, trainingCount, inputs } : { ...base, trainingCount };
  };

  // source/src/lib/quantForward.js
  var FORWARD_KEY = "eivra.quant_forward.v1";
  var FIELDS = ["plans", "batches", "candidates", "orders", "settlements", "reviews", "tasks"];
  var storage2 = quantStore(FORWARD_KEY, FIELDS);
  var withDefaults = (store) => ({ ...store, disputes: store.disputes ?? [] });
  var number2 = (value) => value == null || value === "" || typeof value === "boolean" ? null : Number.isFinite(Number(value)) ? Number(value) : null;
  var timeOf2 = (now) => {
    const time = instant(now);
    if (time === null) throw new Error("前向观察需要带时区的有效时间。");
    return time;
  };
  var canonical = (row) => Boolean(row?.eventId && row.eventId === eventKey2(row));
  var cloneVersion = (version) => ({ id: version.id, projectId: version.projectId || null, number: version.number || null, createdAt: version.createdAt, spec: copy(version.spec) });
  var emptyForwardStore = () => withDefaults(storage2.empty());
  var getForwardStore = () => copy(withDefaults(assertForwardStore(storage2.read())));
  function assertForwardStore(store, { now = (/* @__PURE__ */ new Date()).toISOString() } = {}) {
    const cutoff = timeOf2(now);
    storage2.assert(store);
    const plans = new Map(store.plans.map((plan) => [plan.id, plan]));
    const versions = /* @__PURE__ */ new Set();
    for (const plan of store.plans) {
      if (!plan.versionId || versions.has(plan.versionId) || !plan.spec || instant(plan.createdAt) === null || instant(plan.createdAt) > cutoff || instant(plan.reviewAt) === null || instant(plan.reviewAt) <= instant(plan.createdAt) || !Number.isInteger(plan.minSettled) || plan.minSettled < 1 || !(plan.maxDrawdown > 0) || ![plan.stake, plan.maxDrawdown, plan.maxQuoteAgeMinutes, plan.closingWindowMinutes].every((value) => Number.isFinite(value) && value > 0) || !Number.isFinite(plan.minExpectedRoi) || !Number.isInteger(plan.driftWindow) || plan.driftWindow < 2 || plan.versionSnapshot?.id !== plan.versionId || stableJSON(plan.versionSnapshot?.spec) !== stableJSON(plan.spec) || instant(plan.versionSnapshot?.createdAt) === null || instant(plan.versionSnapshot.createdAt) > instant(plan.createdAt) || plan.stake !== number2(plan.spec.stakePerMatch)) {
        throw new Error("观察计划的冻结规则或复盘条件无效，未覆盖原记录。");
      }
      versions.add(plan.versionId);
    }
    const identities = /* @__PURE__ */ new Set();
    const orders = new Map(store.orders.map((order) => [order.id, order]));
    const candidates = new Map(store.candidates.map((candidate) => [candidate.id, candidate]));
    const batches = new Map(store.batches.map((batch) => [batch.id, batch]));
    for (const order of store.orders) {
      const plan = plans.get(order.planId);
      const identity = `${order.versionId}|${order.eventId}`;
      const decision = instant(order.decisionAt);
      const quote = order.entryQuote;
      const target = plan && quoteForSpec(plan.spec, order);
      const candidate = candidates.get(order.candidateId);
      if (!plan || order.versionId !== plan.versionId || identities.has(identity) || !canonical(order) || !target || order.selection !== target.selection || order.venue !== target.venue || order.market !== plan.spec.market || !candidate || candidate.orderId !== order.id || candidate.status !== "accepted" || candidate.planId !== plan.id || candidate.eventId !== order.eventId || instant(candidate.decisionAt) !== decision || decision === null || decision > cutoff || decision <= instant(plan.createdAt) || decision >= instant(plan.reviewAt) || decision >= instant(order.kickoff) || !quote || !canonical(quote) || quote.eventId !== order.eventId || quote.market !== order.market || quote.selection !== order.selection || quote.tradable === false || !String(quote.source || "").trim() || instant(quote.observedAt) === null || instant(quote.observedAt) > decision || decision - instant(quote.observedAt) > plan.maxQuoteAgeMinutes * 6e4 || quote.sourceUpdatedAt != null && (instant(quote.sourceUpdatedAt) === null || instant(quote.sourceUpdatedAt) > instant(quote.observedAt)) || quote.odds !== order.entryOdds || !Number.isFinite(order.entryOdds) || !(order.entryOdds > 1) || order.stake !== plan.stake || !order.forecastSnapshot?.available || !Number.isFinite(order.forecastSnapshot.probability) || order.forecastSnapshot.probability < 0 || order.forecastSnapshot.probability > 1 || instant(order.forecastSnapshot.generatedAt) !== decision || order.forecastSnapshot.probability * quote.odds - 1 < plan.minExpectedRoi) {
        throw new Error("纸面订单缺少可验证的赛前计划、报价或概率快照，未覆盖原记录。");
      }
      identities.add(identity);
    }
    const settled = /* @__PURE__ */ new Set();
    for (const settlement of store.settlements) {
      const order = orders.get(settlement.orderId);
      const plan = order && plans.get(order.planId);
      if (!order || settled.has(order.id) || settlement.planId !== order.planId || !canonical(settlement.result) || settlement.result.eventId !== order.eventId || instant(settlement.result.availableAt) === null || instant(settlement.settledAt) === null || instant(settlement.settledAt) > cutoff || instant(settlement.result.availableAt) > instant(settlement.settledAt) || instant(settlement.result.availableAt) < instant(order.kickoff) || ![settlement.result.homeGoals, settlement.result.awayGoals].every((value) => Number.isInteger(value) && value >= 0 && value <= 30)) throw new Error("纸面结算关联或赛果可知时间无效。");
      const hit = resultHit(order.selection, order.market, settlement.result);
      const profit = hit ? order.stake * (order.entryOdds - 1) : -order.stake;
      const brier = (order.forecastSnapshot.probability - Number(hit)) ** 2;
      const close = settlement.closingQuote;
      if (close && (!canonical(close) || close.eventId !== order.eventId || close.market !== order.market || close.selection !== order.selection || close.source !== order.entryQuote.source || close.tradable === false || !(close.odds > 1) || instant(close.observedAt) === null || instant(close.observedAt) >= instant(order.kickoff) || instant(order.kickoff) - instant(close.observedAt) > plan.closingWindowMinutes * 6e4 || close.sourceUpdatedAt != null && (instant(close.sourceUpdatedAt) === null || instant(close.sourceUpdatedAt) > instant(close.observedAt)))) throw new Error("收盘参考报价不满足同源、同盘口和赛前新鲜窗口。");
      const clv = close ? order.entryOdds / close.odds - 1 : null;
      if (settlement.hit !== hit || !Number.isFinite(settlement.profit) || Math.abs(settlement.profit - profit) > 1e-9 || !Number.isFinite(settlement.brier) || Math.abs(settlement.brier - brier) > 1e-9 || (clv === null ? settlement.clv !== null : !Number.isFinite(settlement.clv) || Math.abs(settlement.clv - clv) > 1e-9)) {
        throw new Error("导入的盈亏、命中、Brier 或 CLV 与冻结快照不一致，拒绝写入。");
      }
      settled.add(order.id);
    }
    for (const field of ["batches", "candidates", "reviews", "tasks"]) {
      if (store[field].some((row) => !plans.has(row.planId))) throw new Error("前向记录关联到不存在的计划，原记录已保留。");
    }
    for (const candidate of store.candidates) {
      const batch = batches.get(candidate.batchId);
      if (!batch || batch.planId !== candidate.planId || instant(candidate.decisionAt) === null || instant(candidate.decisionAt) > cutoff || !["accepted", "rejected"].includes(candidate.status) || !candidate.reason || candidate.status === "accepted" && !orders.has(candidate.orderId)) throw new Error("候选审计与批次或订单关联不完整。");
    }
    for (const row of [...store.batches, ...store.reviews]) if (instant(row.createdAt) === null || instant(row.createdAt) > cutoff) throw new Error("前向记录包含无效或未来时间。");
    for (const task of store.tasks) if (instant(task.startedAt) === null || instant(task.completedAt) === null || instant(task.completedAt) < instant(task.startedAt) || instant(task.completedAt) > cutoff) throw new Error("任务回执时间无效。");
    if (store.disputes !== void 0 && !Array.isArray(store.disputes)) throw new Error("结算争议记录格式无效。");
    const disputeIds = /* @__PURE__ */ new Set();
    for (const dispute of store.disputes || []) {
      const order = orders.get(dispute.orderId);
      if (!dispute.id || disputeIds.has(dispute.id) || !order || dispute.planId !== order.planId || instant(dispute.observedAt) === null || instant(dispute.observedAt) > cutoff || !Array.isArray(dispute.resultEvidence) || dispute.resultEvidence.some((row) => !canonical(row) || row.eventId !== order.eventId || instant(row.availableAt) === null || instant(row.availableAt) > instant(dispute.observedAt) || instant(row.availableAt) < instant(order.kickoff) || ![row.homeGoals, row.awayGoals].every((value) => Number.isInteger(value) && value >= 0 && value <= 30)) || new Set(dispute.resultEvidence.map((row) => `${row.homeGoals}-${row.awayGoals}`)).size < 2) {
        throw new Error("结算争议缺少当时可知的冲突赛果证据。");
      }
      disputeIds.add(dispute.id);
    }
    for (const review of store.reviews) {
      const expected = forwardPlanMetrics(store, review.planId, { now: review.createdAt });
      if (review.assessment !== expected.assessment || ["settled", "profit", "roi", "brier", "clv", "maxDrawdown"].some((key) => review.metrics?.[key] !== expected[key])) throw new Error("复盘结论与该时点可知的纸面证据不一致。");
    }
    return store;
  }
  var commit = (before, next) => {
    assertForwardStore(next);
    if (stableJSON(getForwardStore()) !== stableJSON(before)) throw new Error("其他窗口已更新前向记录，本次未覆盖；请刷新后重试。");
    return storage2.write(next);
  };
  function createObservationPlan({
    version,
    reviewAt,
    minSettled = 30,
    maxDrawdown,
    minExpectedRoi = 0,
    maxQuoteAgeMinutes = 30,
    closingWindowMinutes = 30,
    now = (/* @__PURE__ */ new Date()).toISOString()
  } = {}) {
    const time = timeOf2(now);
    if (!version?.id || !version.spec || instant(version.createdAt) === null || instant(version.createdAt) > time) throw new Error("请先保存一份有效研究版本，再开始前向观察。");
    const store = getForwardStore();
    if (store.plans.some((plan2) => plan2.versionId === version.id)) throw new Error("该版本已有冻结计划；调整条件请创建新的研究版本。");
    const plan = {
      id: uid("forward_plan"),
      versionId: version.id,
      versionSnapshot: cloneVersion(version),
      spec: copy(version.spec),
      name: version.spec.name || `研究版本 ${version.number || ""}`,
      createdAt: new Date(time).toISOString(),
      reviewAt,
      minSettled: number2(minSettled),
      maxDrawdown: number2(maxDrawdown),
      minExpectedRoi: number2(minExpectedRoi),
      maxQuoteAgeMinutes: number2(maxQuoteAgeMinutes),
      closingWindowMinutes: number2(closingWindowMinutes),
      stake: number2(version.spec.stakePerMatch),
      driftWindow: 10,
      quotePolicy: "latest_observed_then_source_lexical",
      capturePolicy: "decision_time_only"
    };
    const next = { ...store, plans: [...store.plans, plan] };
    commit(store, next);
    return copy(plan);
  }
  var FORWARD_REASON_LABELS = {
    accepted: "已纳入纸面观察",
    outside_scope: "不符合版本球队或主客规则",
    invalid_event: "赛事身份或时间不完整",
    event_not_observed: "该时点尚未观察到赛事",
    event_started: "比赛已开赛",
    event_closed: "赛事已停售",
    plan_not_started: "计划冻结时间不早于本次决策",
    review_window_closed: "已到预定复盘时间，停止新增",
    risk_limit_reached: "达到预定回撤上限，暂停新增",
    duplicate_order: "同版本同赛事已有纸面订单",
    missing_asof_quote: "缺少当时可用的目标赔率",
    conflicting_quote: "同源同刻报价冲突",
    market_closed: "目标盘口已停售",
    stale_quote: "报价已超出新鲜窗口",
    forecast_unavailable: "概率模型不可用",
    ratings_unavailable: "评级样本不足",
    incomplete_market_distribution: "市场概率所需的完整报价不足",
    edge_below_threshold: "预期收益未达到计划门槛",
    invalid_forecast: "概率快照无效",
    result_not_available: "尚无当时可知赛果",
    conflicting_result: "赛果来源冲突，暂不结算",
    unresolved_result_conflict: "已有订单赛果存在争议，暂停新增",
    result_already_known: "决策前已知赛果",
    unknown: "不可用"
  };
  var appendTask = (store, plan, action, now, counts) => {
    const task = { id: uid("forward_task"), planId: plan.id, action, state: "completed", startedAt: now, completedAt: now, counts };
    store.tasks.push(task);
    return task;
  };
  var knownResults = (evidence, eventId, now) => (evidence.results || []).filter((row) => canonical(row) && row.eventId === eventId && instant(row.availableAt) !== null && instant(row.availableAt) <= now && instant(row.availableAt) >= instant(row.kickoff) && [row.homeGoals, row.awayGoals].every((value) => Number.isInteger(value) && value >= 0 && value <= 30));
  var disputeIdsAt = (store, orders, evidence, time) => {
    const ids = new Set((store.disputes || []).filter((row) => instant(row.observedAt) <= time).map((row) => row.orderId));
    if (evidence) for (const order of orders) {
      const prior = store.settlements.find((row) => row.orderId === order.id && instant(row.settledAt) <= time);
      const results = knownResults(evidence, order.eventId, time);
      if (prior) results.push(prior.result);
      if (new Set(results.map((row) => `${row.homeGoals}-${row.awayGoals}`)).size > 1) ids.add(order.id);
    }
    return ids;
  };
  var candidateEvents = (evidence) => {
    const events = /* @__PURE__ */ new Map();
    for (const [index, row] of [...evidence.events || [], ...evidence.quotes || [], ...evidence.results || []].entries()) {
      const key = canonical(row) ? row.eventId : `invalid:${row.id || index}`;
      if (!events.has(key)) events.set(key, row);
    }
    return [...events.values()].sort((a, b) => String(a.eventId || a.id).localeCompare(String(b.eventId || b.id)));
  };
  var captureInto = (store, plan, evidence, now, scopeEventIds = null) => {
    const time = timeOf2(now);
    const scope = scopeEventIds === null ? null : new Set(scopeEventIds);
    const batch = {
      id: uid("forward_batch"),
      planId: plan.id,
      createdAt: now,
      state: "completed",
      accepted: 0,
      rejected: 0,
      candidates: 0,
      scopeEventIds: scope ? [...scope] : null
    };
    const metrics = forwardPlanMetrics(store, plan.id, { now, evidence });
    const halted = metrics.maxDrawdown !== null && metrics.maxDrawdown >= plan.maxDrawdown;
    for (const event of candidateEvents(evidence)) {
      if (scope && !scope.has(event.eventId)) continue;
      const candidate = {
        id: uid("forward_candidate"),
        batchId: batch.id,
        planId: plan.id,
        versionId: plan.versionId,
        eventId: event.eventId || null,
        home: event.home || "",
        away: event.away || "",
        kickoff: event.kickoff || null,
        decisionAt: now,
        status: "rejected",
        reason: null,
        orderId: null,
        quoteId: null
      };
      let reason = null;
      const target = quoteForSpec(plan.spec, event);
      const eventQuotes = (evidence.quotes || []).filter((row) => canonical(row) && row.eventId === event.eventId && instant(row.observedAt) !== null && instant(row.observedAt) <= time && (row.sourceUpdatedAt == null || instant(row.sourceUpdatedAt) !== null && instant(row.sourceUpdatedAt) <= instant(row.observedAt)));
      const observations = [...evidence.events || [], ...eventQuotes].filter((row) => canonical(row) && row.eventId === event.eventId && instant(row.observedAt) !== null && instant(row.observedAt) <= time).sort((a, b) => instant(b.observedAt) - instant(a.observedAt));
      if (!canonical(event)) reason = "invalid_event";
      else if (!target) reason = "outside_scope";
      else if (time <= instant(plan.createdAt)) reason = "plan_not_started";
      else if (time >= instant(plan.reviewAt)) reason = "review_window_closed";
      else if (instant(event.kickoff) <= time) reason = "event_started";
      else if (knownResults(evidence, event.eventId, time).length) reason = "result_already_known";
      else if (!observations.length) reason = "event_not_observed";
      else if ((evidence.events || []).filter((row) => row.eventId === event.eventId && instant(row.observedAt) <= time).sort((a, b) => instant(b.observedAt) - instant(a.observedAt))[0]?.tradable === false) reason = "event_closed";
      else if (metrics.disputed > 0) reason = "unresolved_result_conflict";
      else if (halted) reason = "risk_limit_reached";
      else if (store.orders.some((order) => order.versionId === plan.versionId && order.eventId === event.eventId)) reason = "duplicate_order";
      let quote = null;
      let forecast = null;
      if (!reason) {
        const picked = latestQuote(eventQuotes, {
          eventId: event.eventId,
          market: plan.spec.market,
          selection: target.selection,
          at: now,
          maxAgeMinutes: plan.maxQuoteAgeMinutes
        });
        quote = picked.quote;
        if (!quote) reason = picked.reason || "missing_asof_quote";
        if (quote) candidate.quoteId = quote.id;
      }
      if (!reason) {
        const modelQuotes = eventQuotes.filter((row) => time - instant(row.observedAt) <= plan.maxQuoteAgeMinutes * 6e4);
        forecast = resolveForecast(plan.spec, modelQuotes, { results: evidence.results || [], at: now, source: quote.source });
        if (!forecast.available) reason = forecast.reason || "forecast_unavailable";
        else if (!Number.isFinite(forecast.probability) || forecast.probability < 0 || forecast.probability > 1) reason = "invalid_forecast";
        else if (forecast.probability * quote.odds - 1 < plan.minExpectedRoi) reason = "edge_below_threshold";
        candidate.forecastSnapshot = copy(forecast);
      }
      if (!reason) {
        const order = {
          id: uid("paper_order"),
          planId: plan.id,
          versionId: plan.versionId,
          candidateId: candidate.id,
          eventId: event.eventId,
          home: event.home,
          away: event.away,
          kickoff: event.kickoff,
          market: plan.spec.market,
          selection: target.selection,
          venue: target.venue,
          decisionAt: now,
          createdAt: now,
          stake: plan.stake,
          entryOdds: quote.odds,
          entryQuote: copy(quote),
          forecastSnapshot: copy(forecast)
        };
        store.orders.push(order);
        candidate.status = "accepted";
        candidate.orderId = order.id;
        batch.accepted += 1;
      } else batch.rejected += 1;
      candidate.reason = reason || "accepted";
      store.candidates.push(candidate);
      batch.candidates += 1;
    }
    store.batches.push(batch);
    appendTask(store, plan, "capture", now, { candidates: batch.candidates, accepted: batch.accepted, rejected: batch.rejected });
  };
  var closingFor = (order, plan, evidence) => {
    const kickoff = instant(order.kickoff);
    const picked = latestQuote((evidence.quotes || []).filter((row) => canonical(row) && instant(row.observedAt) < kickoff && (!row.sourceUpdatedAt || instant(row.sourceUpdatedAt) !== null && instant(row.sourceUpdatedAt) <= instant(row.observedAt))), {
      eventId: order.eventId,
      market: order.market,
      selection: order.selection,
      source: order.entryQuote.source,
      at: order.kickoff,
      maxAgeMinutes: plan.closingWindowMinutes
    });
    return { quote: picked.quote ? copy(picked.quote) : null, reason: picked.reason };
  };
  var settleInto = (store, plan, evidence, now) => {
    const time = timeOf2(now);
    let added = 0;
    let missing = 0;
    let conflicting = 0;
    const issues = [];
    for (const order of store.orders.filter((item) => item.planId === plan.id && instant(item.decisionAt) <= time)) {
      const previous = store.settlements.find((item) => item.orderId === order.id);
      const results = knownResults(evidence, order.eventId, time);
      if (previous && !results.some((row) => row.id === previous.result.id)) results.push(previous.result);
      if (!results.length) {
        missing += 1;
        issues.push({ orderId: order.id, reason: "result_not_available" });
        continue;
      }
      if (new Set(results.map((row) => `${row.homeGoals}-${row.awayGoals}`)).size !== 1) {
        const id = `paper_dispute_${contentId({ orderId: order.id, resultIds: results.map((row) => row.id).sort() })}`;
        if (!store.disputes.some((row) => row.id === id)) store.disputes.push({
          id,
          planId: plan.id,
          orderId: order.id,
          observedAt: now,
          priorSettlementId: previous?.id || null,
          resultEvidence: copy(results),
          reason: "conflicting_result"
        });
        conflicting += 1;
        issues.push({ orderId: order.id, reason: "conflicting_result" });
        continue;
      }
      if (previous) continue;
      if (store.disputes.some((row) => row.orderId === order.id)) {
        conflicting += 1;
        issues.push({ orderId: order.id, reason: "conflicting_result" });
        continue;
      }
      results.sort((a, b) => instant(a.availableAt) - instant(b.availableAt) || a.source.localeCompare(b.source));
      const result = results[0];
      const hit = resultHit(order.selection, order.market, result);
      const closing = closingFor(order, plan, evidence);
      const probability = order.forecastSnapshot.probability;
      store.settlements.push({
        id: uid("paper_settlement"),
        planId: plan.id,
        orderId: order.id,
        eventId: order.eventId,
        settledAt: now,
        result: copy(result),
        resultEvidenceIds: results.map((row) => row.id),
        hit,
        profit: hit ? order.stake * (order.entryOdds - 1) : -order.stake,
        brier: Number.isFinite(probability) ? (probability - Number(hit)) ** 2 : null,
        closingQuote: closing.quote,
        closingReason: closing.reason,
        clv: closing.quote ? order.entryOdds / closing.quote.odds - 1 : null
      });
      added += 1;
    }
    const task = appendTask(store, plan, "settle", now, { added, missing, conflicting });
    task.issues = issues;
  };
  function forwardPlanMetrics(store, planId, { now = (/* @__PURE__ */ new Date()).toISOString(), evidence = null } = {}) {
    const time = timeOf2(now);
    const plan = store.plans.find((item) => item.id === planId);
    if (!plan) throw new Error("未找到观察计划。");
    const orders = store.orders.filter((order) => order.planId === planId && instant(order.decisionAt) <= time);
    const byId = new Map(orders.map((order) => [order.id, order]));
    const disputedIds = disputeIdsAt(store, orders, evidence, time);
    const settlements = store.settlements.filter((row) => row.planId === planId && byId.has(row.orderId) && !disputedIds.has(row.orderId) && instant(row.settledAt) <= time && instant(row.result.availableAt) <= time).sort((a, b) => instant(a.result.availableAt) - instant(b.result.availableAt) || a.orderId.localeCompare(b.orderId));
    const totalStake = settlements.reduce((sum, row) => sum + byId.get(row.orderId).stake, 0);
    const profit = settlements.reduce((sum, row) => sum + row.profit, 0);
    const brierRows = settlements.filter((row) => Number.isFinite(row.brier));
    const clvRows = settlements.filter((row) => Number.isFinite(row.clv));
    const timeGroups = /* @__PURE__ */ new Map();
    for (const row of settlements) {
      const at = instant(row.result.availableAt);
      timeGroups.set(at, [...timeGroups.get(at) || [], row]);
    }
    let equity = 0;
    let peak = 0;
    let drawdown = 0;
    for (const rows of timeGroups.values()) {
      equity += rows.reduce((sum, row) => sum + row.profit, 0);
      peak = Math.max(peak, equity);
      drawdown = Math.max(drawdown, peak - equity);
    }
    const window2 = plan.driftWindow;
    const remainingGroups = [...timeGroups.values()].reverse();
    const recent = [];
    const previous = [];
    while (remainingGroups.length && recent.length < window2) recent.unshift(...remainingGroups.shift());
    while (remainingGroups.length && previous.length < window2) previous.unshift(...remainingGroups.shift());
    const roiOf = (rows) => {
      const stake = rows.reduce((sum, row) => sum + byId.get(row.orderId).stake, 0);
      return stake > 0 ? rows.reduce((sum, row) => sum + row.profit, 0) / stake : null;
    };
    const driftReady = recent.length >= window2 && previous.length >= window2;
    const maxDrawdown = settlements.length ? drawdown : null;
    const reviewDue = time >= instant(plan.reviewAt);
    const disputedOrderIds = orders.filter((order) => disputedIds.has(order.id)).map((order) => order.id);
    const assessment = !reviewDue ? "observing" : disputedOrderIds.length ? "data_disputed" : settlements.length < plan.minSettled ? "insufficient_sample" : maxDrawdown >= plan.maxDrawdown ? "risk_limit_reached" : "review_ready";
    return {
      orders: orders.length,
      settled: settlements.length,
      disputed: disputedOrderIds.length,
      disputedOrderIds,
      pending: orders.length - settlements.length - disputedOrderIds.length,
      coverage: { roi: settlements.length, brier: brierRows.length, clv: clvRows.length, orders: orders.length },
      profit: settlements.length ? profit : null,
      roi: totalStake > 0 ? profit / totalStake : null,
      totalStake,
      brier: brierRows.length ? brierRows.reduce((sum, row) => sum + row.brier, 0) / brierRows.length : null,
      clv: clvRows.length ? clvRows.reduce((sum, row) => sum + row.clv, 0) / clvRows.length : null,
      maxDrawdown,
      equityTimeBasis: "result_available_at_grouped",
      reviewDue,
      assessment,
      sampleReady: settlements.length >= plan.minSettled,
      riskHalted: maxDrawdown !== null && maxDrawdown >= plan.maxDrawdown,
      drift: {
        available: driftReady,
        previousCount: previous.length,
        recentCount: recent.length,
        requiredPerWindow: window2,
        previousRoi: driftReady ? roiOf(previous) : null,
        recentRoi: driftReady ? roiOf(recent) : null,
        deltaRoi: driftReady ? roiOf(recent) - roiOf(previous) : null
      }
    };
  }
  var reviewInto = (store, plan, now, note = "") => {
    const metrics = forwardPlanMetrics(store, plan.id, { now });
    const fingerprint2 = contentId({ metrics, note });
    const latest = store.reviews.filter((row) => row.planId === plan.id).at(-1);
    if (latest?.fingerprint === fingerprint2) return;
    store.reviews.push({
      id: uid("forward_review"),
      planId: plan.id,
      createdAt: now,
      assessment: metrics.assessment,
      metrics: copy(metrics),
      note: String(note || "").trim(),
      fingerprint: fingerprint2,
      boundary: metrics.reviewDue ? "达到复盘时间后仍需人工解释证据；不自动晋级实盘。" : "预定复盘时间前仅描述当前观察，不据此宣告策略通过。"
    });
    appendTask(store, plan, "review", now, { settled: metrics.settled, required: plan.minSettled, assessment: metrics.assessment });
  };
  function processForwardBatch(store, evidence, { now = (/* @__PURE__ */ new Date()).toISOString(), planId = null, action = "all", note = "", scopeEventIds = null } = {}) {
    timeOf2(now);
    assertForwardStore(store, { now });
    if (!evidence || !Array.isArray(evidence.quotes) || !Array.isArray(evidence.results)) throw new Error("前向任务缺少证据数据。");
    if (!["all", "capture", "settle", "review"].includes(action)) throw new Error("未知前向任务。");
    if (scopeEventIds !== null && (!Array.isArray(scopeEventIds) || scopeEventIds.some((id) => typeof id !== "string"))) throw new Error("采集范围必须是事件标识数组。");
    const next = copy(withDefaults(store));
    const plans = next.plans.filter((plan) => !planId || plan.id === planId);
    if (planId && !plans.length) throw new Error("未找到观察计划。");
    for (const plan of plans) {
      if (action === "all" || action === "settle" || action === "review") settleInto(next, plan, evidence, now);
      if (action === "all" || action === "capture") captureInto(next, plan, evidence, now, scopeEventIds);
      if (action === "all" || action === "review") reviewInto(next, plan, now, note);
    }
    return copy(assertForwardStore(next, { now }));
  }
  function runForwardTask(planId, evidence, options = {}) {
    const before = getForwardStore();
    const next = processForwardBatch(before, evidence, { ...options, planId });
    return commit(before, next);
  }
  function mergeForwardStores(current, incoming) {
    assertForwardStore(current);
    assertForwardStore(incoming);
    return copy(assertForwardStore({ schemaVersion: 1, ...Object.fromEntries([...FIELDS, "disputes"].map((field) => [field, immutableUnion(current[field] || [], incoming[field] || [])])) }));
  }
  function importForwardSnapshot(payload) {
    const before = getForwardStore();
    const incoming = payload?.forwardStore || payload;
    const next = mergeForwardStores(before, incoming);
    return commit(before, next);
  }
  var exportForwardSnapshot = (store, evidence) => ({ schemaVersion: 1, exportedAt: (/* @__PURE__ */ new Date()).toISOString(), forwardStore: copy(assertForwardStore(store)), evidence: copy(evidence) });

  // entry.js
  installEngineGlobals();
  var modules = { localData: localData_exports, analytics: analytics_exports, atomicParlay: atomicParlay_exports, naturalInputParser: naturalInputParser_exports, quantStrategy: quantStrategy_exports, quantResearch: quantResearch_exports, quantForward: quantForward_exports };
  function hydrateStorage(stores = {}) {
    const investmentsKey = "eivra.investments.v1";
    const configKey = "eivra.system_config.v1";
    const teamsKey = "eivra.team_profiles.v1";
    const logsKey = "eivra.access_logs.v1";
    const input = stores[investmentsKey] || stores["eivra.workspace.native"];
    let bundle = input;
    if (typeof bundle === "string") {
      try {
        bundle = JSON.parse(bundle);
      } catch {
        bundle = null;
      }
    }
    if (!bundle || typeof bundle === "object" && Object.keys(bundle).length === 0) bundle = {
      investments: getDemoInvestments(),
      system_config: getDemoSystemConfig(),
      team_profiles: getDemoTeamProfiles(),
      access_logs: getDemoAccessLogs()
    };
    if (!input || typeof input === "string" && input.trim() === "{}") {
      importDataBundle({ investments: getDemoInvestments(), system_config: getDemoSystemConfig(), team_profiles: getDemoTeamProfiles(), access_logs: getDemoAccessLogs() }, "replace");
      return;
    }
    const records = bundle.investments || [];
    const config = bundle.system_config || bundle.systemConfig || {};
    const teams = bundle.team_profiles || [];
    const logs = bundle.access_logs || [];
    nativeSetStorageJSON(JSON.stringify({
      [investmentsKey]: JSON.stringify(records),
      [configKey]: JSON.stringify(config),
      [teamsKey]: JSON.stringify(teams),
      [logsKey]: JSON.stringify(logs),
      "eivra.full_session_latch.v1": "1"
    }));
  }
  var allowed = {
    "localData.getInvestments": getInvestments,
    "localData.getSystemConfig": getSystemConfig,
    "localData.saveSystemConfig": saveSystemConfig,
    "localData.getTeamProfiles": getTeamProfiles,
    "localData.exportDataBundle": exportDataBundle,
    "localData.importDataBundle": importDataBundle,
    "localData.saveInvestment": saveInvestment,
    "localData.updateInvestment": updateInvestment,
    "localData.updateInvestments": updateInvestments,
    "analytics.getDashboardSnapshot": getDashboardSnapshot,
    "analytics.getAnalysisSnapshot": getAnalysisSnapshot,
    "analytics.getMetricsSnapshot": getMetricsSnapshot,
    "analytics.getReservoirState": getReservoirState,
    "analytics.getPredictionCalibrationContext": getPredictionCalibrationContext,
    "analytics.getTeamsSnapshot": getTeamsSnapshot,
    "analytics.getModelValidationSnapshot": getModelValidationSnapshot,
    "forecast.buildDraft": (matches, generatedAt) => globalThis.eivraEngine.forecast.buildDraft(matches, generatedAt),
    "naturalInputParser.parseNaturalInput": parseNaturalInput,
    "quantResearch.getResearchStore": getResearchStore,
    "quantForward.getForwardStore": getForwardStore
  };
  globalThis.eivraEngine = {
    version: "native-contract-1",
    modules: Object.keys(modules),
    hydrate(storageJSON = "{}") {
      const raw = JSON.parse(storageJSON);
      const values2 = typeof raw === "string" ? JSON.parse(raw) : raw;
      hydrateStorage(values2);
      return this.exportWorkspace();
    },
    forecast: {
      buildDraft(matches, generatedAt = (/* @__PURE__ */ new Date()).toISOString()) {
        const config = getSystemConfig();
        const calibrationContext = getPredictionCalibrationContext();
        const profiles = (matches || []).map((match) => {
          const unionProbability = predictMatchProbability({
            ...match,
            conf: Number(match.conf) > 1 ? Number(match.conf) / 100 : Number(match.conf),
            fse_home: Number(match.fse_home) > 1 ? Number(match.fse_home) / 100 : Number(match.fse_home),
            fse_away: Number(match.fse_away) > 1 ? Number(match.fse_away) / 100 : Number(match.fse_away)
          }, config, calibrationContext);
          return {
            ...buildAtomicMatchProfile({ entries: match.entries || [], unionProbability, fallbackOdds: config.defaultOdds }),
            unionProbability
          };
        });
        const combinedProfile = combineAtomicMatchProfiles(profiles);
        const poolBalance = getReservoirState().poolBalance || 0;
        const kellyFraction = solveKellyFractionByAtomicDistribution(combinedProfile.states);
        const recommendedInvest = capRecommendedStake(poolBalance * kellyFraction / Math.max(1, config.kellyDivisor), poolBalance, config.riskCapRatio);
        const expectedRating = profiles.length ? profiles.reduce((sum, row) => sum + row.hitProbability, 0) / profiles.length : null;
        const conditionalOdds = Number(combinedProfile.conditionalOdds);
        const combinedOdds = Number.isFinite(conditionalOdds) && conditionalOdds > 0 ? conditionalOdds : (matches || []).reduce((product, match) => product * calcAtomicEquivalentOdds(match.entries || [], config.defaultOdds), 1);
        return {
          profiles,
          combinedProfile,
          expectedRating,
          combinedOdds,
          recommendedInvest,
          kellyFraction,
          poolBalance,
          forecastSnapshot: buildForecastSnapshot({
            combinedProfile,
            generatedAt,
            calibrationMetadata: calibrationContext.metadata,
            legs: (matches || []).map((match, index) => ({ match, profile: profiles[index] }))
          })
        };
      }
    },
    invoke(name, args = []) {
      if (!Object.prototype.hasOwnProperty.call(allowed, name)) throw new Error("Unregistered native engine operation: " + name);
      return allowed[name](...args);
    },
    invokeJSON(name, argsJSON = "[]") {
      return JSON.stringify(this.invoke(name, JSON.parse(argsJSON)) ?? null);
    },
    exportWorkspace() {
      const storage3 = JSON.parse(nativeGetStorageJSON());
      const key = "eivra.investments.v1";
      const configKey = "eivra.system_config.v1";
      if (!storage3[key]) {
        const demo = getDemoInvestments();
        const config = getDemoSystemConfig();
        const teams = getDemoTeamProfiles();
        const logs = getDemoAccessLogs();
        nativeSetStorageJSON(JSON.stringify({ ...storage3, [key]: JSON.stringify(demo), [configKey]: JSON.stringify(config), "eivra.team_profiles.v1": JSON.stringify(teams), "eivra.access_logs.v1": JSON.stringify(logs) }));
      }
      return { version: 1, system_config: getSystemConfig(), team_profiles: getTeamProfiles(), investments: getInvestments(), access_logs: getAccessLogs() };
    },
    exportWorkspaceJSON() {
      return JSON.stringify(this.exportWorkspace());
    },
    nativeGetStorageJSON
  };
})();
