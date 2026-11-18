// ============================================================================
// ALPHA PULSE PRO — 데이트레이딩 주가흐름 종목 탐색기 메인 컨트롤러
// ============================================================================

(function () {
  const engine = new window.MarketUniverseEngine();

  // 상태 관리
  const state = {
    preset: 'RVOL_ORB_BREAKOUT',
    market: 'ALL', // ALL, KOSPI, KOSDAQ, WATCHLIST
    sector: 'ALL',
    searchQuery: '',
    minRvol: 1.8,
    minChange: 1.5,
    maxChange: 28.0,
    minVolPower: 105,
    minScore: 70,
    aboveVwap: true,
    orbBreakout: true,
    prevHighBreak: false,
    maAligned: false,
    sortField: 'score',
    sortAsc: false,
    pageLimit: 1500,
    selectedCode: null,
    isLive: true,
    hasSyncedClosingSnapshot: false,
    simIntervalMs: 2000,
    timerId: null,
    pollChunkIndex: 0,
    jsonpSeq: 0,
    watchlist: new Set(JSON.parse(localStorage.getItem('alphaPulseWatchlist') || '["005930","000660","042700","105560","055550"]')),
    liveAlerts: [],
    mobilePanel: 'center',
    mobileLeftTab: 'presets',
    mobileRightTab: 'chart',
    chartZoom: 'auto',
    mobileCardView: true,
    quickFilter: 'all'
  };

  // DOM 참조
  const el = {
    brandSnapshotSubtitle: document.getElementById('brandSnapshotSubtitle'),
    btnResetRealPrice: document.getElementById('btnResetRealPrice'),
    mobileBottomNav: document.getElementById('mobileBottomNav'),
    btnMobileBackToScanner: document.getElementById('btnMobileBackToScanner'),
    btnMobileApplyAndSeeScanner: document.getElementById('btnMobileApplyAndSeeScanner'),
    mLeftSubtabs: document.getElementById('mLeftSubtabs'),
    mRightSubtabs: document.getElementById('mRightSubtabs'),
    mTabUsPredict: document.getElementById('mTabUsPredict'),
    btnToggleMobileTableView: document.getElementById('btnToggleMobileTableView'),
    mNavMatchCount: document.getElementById('mNavMatchCount'),
    mNavStockBadge: document.getElementById('mNavStockBadge'),
    kpiTotalUniverse: document.getElementById('kpiTotalUniverse'),
    kpiMatchedCount: document.getElementById('kpiMatchedCount'),
    kpiRvolSurge: document.getElementById('kpiRvolSurge'),
    kpiBreakoutCount: document.getElementById('kpiBreakoutCount'),
    kpiTopSector: document.getElementById('kpiTopSector'),
    btnToggleLive: document.getElementById('btnToggleLive'),
    liveStatusText: document.getElementById('liveStatusText'),
    selectSimSpeed: document.getElementById('selectSimSpeed'),
    selectMarketScenario: document.getElementById('selectMarketScenario'),
    liveAlertTrack: document.getElementById('liveAlertTrack'),
    strategyPresetList: document.getElementById('strategyPresetList'),
    btnResetFilters: document.getElementById('btnResetFilters'),
    marketFilterTabs: document.getElementById('marketFilterTabs'),
    selectSectorFilter: document.getElementById('selectSectorFilter'),
    rangeMinRvol: document.getElementById('rangeMinRvol'),
    valMinRvol: document.getElementById('valMinRvol'),
    inputMinChange: document.getElementById('inputMinChange'),
    inputMaxChange: document.getElementById('inputMaxChange'),
    valChangeRange: document.getElementById('valChangeRange'),
    rangeMinVolPower: document.getElementById('rangeMinVolPower'),
    valMinVolPower: document.getElementById('valMinVolPower'),
    rangeMinScore: document.getElementById('rangeMinScore'),
    valMinScore: document.getElementById('valMinScore'),
    chkAboveVwap: document.getElementById('chkAboveVwap'),
    chkOrbBreakout: document.getElementById('chkOrbBreakout'),
    chkPrevHighBreak: document.getElementById('chkPrevHighBreak'),
    chkMaAligned: document.getElementById('chkMaAligned'),
    sectorHeatmapList: document.getElementById('sectorHeatmapList'),
    inputStockSearch: document.getElementById('inputStockSearch'),
    btnClearSearch: document.getElementById('btnClearSearch'),
    btnToggleLeftPanel: document.getElementById('btnToggleLeftPanel'),
    workspaceGrid: document.querySelector('.workspace-grid'),
    scannerQuickChips: document.getElementById('scannerQuickChips'),
    scannerResultCount: document.getElementById('scannerResultCount'),
    scannerTotalCount: document.getElementById('scannerTotalCount'),
    selectPageLimit: document.getElementById('selectPageLimit'),
    scannerTableBody: document.getElementById('scannerTableBody'),
    marketClosedBanner: document.getElementById('marketClosedBanner'),
    btnBannerPresetToggle: document.getElementById('btnBannerPresetToggle'),
    btnSortByUsGap: document.getElementById('btnSortByUsGap'),
    bannerUsBar: document.getElementById('bannerUsBar'),
    thColSignals: document.getElementById('thColSignals'),
    // 🇺🇸 미 증시 연동 익일 시초가 예측 카드
    usPredictionCard: document.getElementById('usPredictionCard'),
    usPredCardTitle: document.getElementById('usPredCardTitle'),
    usSessionBadge: document.getElementById('usSessionBadge'),
    btnRefreshUsMarket: document.getElementById('btnRefreshUsMarket'),
    btnCopyUsStrategy: document.getElementById('btnCopyUsStrategy'),
    usPrimaryName: document.getElementById('usPrimaryName'),
    usPrimaryBeta: document.getElementById('usPrimaryBeta'),
    usPrimaryPrice: document.getElementById('usPrimaryPrice'),
    usPrimaryChg: document.getElementById('usPrimaryChg'),
    usSecondaryName: document.getElementById('usSecondaryName'),
    usSecondaryChg: document.getElementById('usSecondaryChg'),
    usEwyChg: document.getElementById('usEwyChg'),
    usPredictedPrice: document.getElementById('usPredictedPrice'),
    usPredictedGap: document.getElementById('usPredictedGap'),
    usPredictedRange: document.getElementById('usPredictedRange'),
    usScenarioLabel: document.getElementById('usScenarioLabel'),
    usScenarioSlider: document.getElementById('usScenarioSlider'),
    usSliderValDisplay: document.getElementById('usSliderValDisplay'),
    usAiStrategyBox: document.getElementById('usAiStrategyBox'),
    // 우측 상세 패널
    detailMarketBadge: document.getElementById('detailMarketBadge'),
    detailNxtBadge: document.getElementById('detailNxtBadge'),
    detailSectorBadge: document.getElementById('detailSectorBadge'),
    detailStockName: document.getElementById('detailStockName'),
    detailStockCode: document.getElementById('detailStockCode'),
    btnNaverFinanceLink: document.getElementById('btnNaverFinanceLink'),
    detailStockPrice: document.getElementById('detailStockPrice'),
    detailStockChange: document.getElementById('detailStockChange'),
    detailTvLine: document.getElementById('detailTvLine'),
    detailSignalBadges: document.getElementById('detailSignalBadges'),
    intradayChartCanvas: document.getElementById('intradayChartCanvas'),
    btnToggleChartZoom: document.getElementById('btnToggleChartZoom'),
    chartHoverBanner: document.getElementById('chartHoverBanner'),
    detailTurnover: document.getElementById('detailTurnover'),
    detailVolume: document.getElementById('detailVolume'),
    detailRvol: document.getElementById('detailRvol'),
    detailVolPower: document.getElementById('detailVolPower'),
    detailVwap: document.getElementById('detailVwap'),
    detailOrbHigh: document.getElementById('detailOrbHigh'),
    detailLarryTarget: document.getElementById('detailLarryTarget'),
    detailRsiGap: document.getElementById('detailRsiGap'),
    tradePlanTitle: document.getElementById('tradePlanTitle'),
    detailRrBadge: document.getElementById('detailRrBadge'),
    planEntryLabel: document.getElementById('planEntryLabel'),
    planEntryPrice: document.getElementById('planEntryPrice'),
    planTarget1Label: document.getElementById('planTarget1Label'),
    planTarget1Price: document.getElementById('planTarget1Price'),
    planTarget2Label: document.getElementById('planTarget2Label'),
    planTarget2Price: document.getElementById('planTarget2Price'),
    planStopLabel: document.getElementById('planStopLabel'),
    planStopPrice: document.getElementById('planStopPrice'),
    inputAccountSize: document.getElementById('inputAccountSize'),
    inputRiskPct: document.getElementById('inputRiskPct'),
    calcMaxLossKRW: document.getElementById('calcMaxLossKRW'),
    calcRecommendedShares: document.getElementById('calcRecommendedShares'),
    calcPositionCost: document.getElementById('calcPositionCost'),
    detailAiCommentary: document.getElementById('detailAiCommentary'),
    // 모달 및 내보내기
    btnOpenImportModal: document.getElementById('btnOpenImportModal'),
    btnExportCsv: document.getElementById('btnExportCsv'),
    importModalBackdrop: document.getElementById('importModalBackdrop'),
    btnCloseImportModal: document.getElementById('btnCloseImportModal'),
    btnCancelImport: document.getElementById('btnCancelImport'),
    btnConfirmImport: document.getElementById('btnConfirmImport'),
    btnLoadSampleData: document.getElementById('btnLoadSampleData'),
    inputCsvFile: document.getElementById('inputCsvFile'),
    textareaImportData: document.getElementById('textareaImportData')
  };

  // 섹터 셀렉트박스 초기화
  function populateSectorOptions() {
    window.SECTORS.forEach(sec => {
      const opt = document.createElement('option');
      opt.value = sec;
      opt.textContent = sec;
      el.selectSectorFilter.appendChild(opt);
    });
  }

  // 전략 프리셋 적용 함수
  function applyStrategyPreset(presetKey) {
    state.preset = presetKey;

    const isMarketOpen = typeof isRegularMarketHoursNow === 'function' ? isRegularMarketHoursNow() : true;
    const isNextDayMode = (!isMarketOpen && el.selectMarketScenario?.value === 'REAL_SNAPSHOT') || presetKey === 'NEXT_DAY_CANDIDATE';
    if (isNextDayMode) {
      document.body.classList.add('next-day-mode');
      if (el.usPredictionCard) el.usPredictionCard.style.display = 'flex';
    } else {
      document.body.classList.remove('next-day-mode');
      if (el.usPredictionCard) el.usPredictionCard.style.display = 'none';
    }

    document.querySelectorAll('.preset-card').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === presetKey);
    });

    if (el.btnBannerPresetToggle) {
      el.btnBannerPresetToggle.textContent = presetKey === 'NEXT_DAY_CANDIDATE' ? '전체 종목 보기' : '🌙 내일 공략 후보 보기';
    }

    if (presetKey === 'NEXT_DAY_CANDIDATE') {
      state.minRvol = 1.3;
      state.minChange = 2.0;
      state.maxChange = 29.8;
      state.minVolPower = 105;
      state.minScore = 65;
      state.aboveVwap = true;
      state.orbBreakout = false;
      state.prevHighBreak = false;
      state.maAligned = false;
    } else if (presetKey === 'RVOL_ORB_BREAKOUT') {
      state.minRvol = 1.8;
      state.minChange = 1.5;
      state.maxChange = 28.0;
      state.minVolPower = 105;
      state.minScore = 70;
      state.aboveVwap = true;
      state.orbBreakout = true;
      state.prevHighBreak = false;
      state.maAligned = false;
    } else if (presetKey === 'PREV_HIGH_SURGE') {
      state.minRvol = 1.6;
      state.minChange = 2.0;
      state.maxChange = 29.5;
      state.minVolPower = 115;
      state.minScore = 72;
      state.aboveVwap = true;
      state.orbBreakout = false;
      state.prevHighBreak = true;
      state.maAligned = false;
    } else if (presetKey === 'VWAP_TREND_LEADER') {
      state.minRvol = 1.3;
      state.minChange = 1.0;
      state.maxChange = 25.0;
      state.minVolPower = 100;
      state.minScore = 65;
      state.aboveVwap = true;
      state.orbBreakout = false;
      state.prevHighBreak = false;
      state.maAligned = true;
    } else if (presetKey === 'VWAP_PULLBACK_BOUNCE') {
      state.minRvol = 1.2;
      state.minChange = 1.2;
      state.maxChange = 20.0;
      state.minVolPower = 95;
      state.minScore = 60;
      state.aboveVwap = false;
      state.orbBreakout = false;
      state.prevHighBreak = false;
      state.maAligned = false;
    } else if (presetKey === 'ALL_UNIVERSE') {
      state.minRvol = 0.5;
      state.minChange = -30.0;
      state.maxChange = 30.0;
      state.minVolPower = 50;
      state.minScore = 0;
      state.aboveVwap = false;
      state.orbBreakout = false;
      state.prevHighBreak = false;
      state.maAligned = false;
    }

    syncFilterInputsFromState();
    refreshAllViews(true);
  }

  function syncFilterInputsFromState() {
    el.rangeMinRvol.value = state.minRvol;
    el.valMinRvol.textContent = `${Number(state.minRvol).toFixed(1)}x 이상`;

    el.inputMinChange.value = state.minChange;
    el.inputMaxChange.value = state.maxChange;
    const minSign = state.minChange > 0 ? '+' : '';
    const maxSign = state.maxChange > 0 ? '+' : '';
    el.valChangeRange.textContent = `${minSign}${state.minChange}% ~ ${maxSign}${state.maxChange}%`;

    el.rangeMinVolPower.value = state.minVolPower;
    el.valMinVolPower.textContent = `${state.minVolPower}% 이상`;

    el.rangeMinScore.value = state.minScore;
    el.valMinScore.textContent = `${state.minScore}점 이상`;

    el.chkAboveVwap.checked = state.aboveVwap;
    el.chkOrbBreakout.checked = state.orbBreakout;
    el.chkPrevHighBreak.checked = state.prevHighBreak;
    el.chkMaAligned.checked = state.maAligned;
  }

  // 필터링 및 정렬 수행
  function getFilteredAndSortedStocks() {
    const q = state.searchQuery.trim().toLowerCase();

    const filtered = engine.stocks.filter(s => {
      if (state.market === 'KOSPI' && s.market !== 'KOSPI') return false;
      if (state.market === 'KOSDAQ' && s.market !== 'KOSDAQ') return false;
      if (state.market === 'WATCHLIST' && !state.watchlist.has(s.code)) return false;

      if (state.sector !== 'ALL' && s.sector !== state.sector) return false;

      if (q) {
        const matchName = s.name.toLowerCase().includes(q);
        const matchCode = s.code.includes(q);
        const matchSec = s.sector.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchSec) return false;
      }

      if (s.rvol < state.minRvol) return false;
      if (s.changePct < state.minChange || s.changePct > state.maxChange) return false;
      if (s.volPower < state.minVolPower) return false;
      if (s.score < state.minScore) return false;

      if (state.aboveVwap && s.price < s.vwap) return false;
      if (state.orbBreakout && !(s.isOrbBreakout || s.isLarryBreakout)) return false;
      if (state.prevHighBreak && !s.isPrevHighBreakout) return false;
      if (state.maAligned && s.ma5 < s.ma20) return false;

      // 퀵 필터 칩 조건 적용
      if (state.quickFilter === 'surge5' && s.changePct < 5.0) return false;
      if (state.quickFilter === 'tv500' && (s.turnoverEok || 0) < 500) return false;
      if (state.quickFilter === 'rvol2' && s.rvol < 2.0) return false;
      if (state.quickFilter === 'watchlist' && !state.watchlist.has(s.code)) return false;

      // 눌림목 프리셋일 경우 VWAP 근처 지지 반등 조건 추가 적용
      if (state.preset === 'VWAP_PULLBACK_BOUNCE') {
        const nearVwap = Math.abs(s.vwapDiffPct) <= 2.2;
        const hasUpperPullback = s.high > s.price * 1.01;
        if (!nearVwap || !hasUpperPullback) return false;
      }

      // 내일 공략 후보(종가베팅 & 익일 시초가) 특화 필터
      if (state.preset === 'NEXT_DAY_CANDIDATE') {
        // 1) 당일 거래대금 80억 이상 (주도주급 유동성)
        if ((s.turnoverEok || 0) < 80) return false;
        // 2) 고가 부근 장악형 양봉 (윗꼬리 5.5% 이내)
        const upperTailPct = (s.high - s.price) / Math.max(1, s.price);
        if (upperTailPct > 0.055) return false;
        // 3) 당일 양봉 마감 (종가 >= 시가)
        if (s.price < s.openPrice) return false;
      }

      return true;
    });

    const field = state.sortField;
    const dir = state.sortAsc ? 1 : -1;

    filtered.sort((a, b) => {
      if (field === 'name') return a.name.localeCompare(b.name, 'ko') * dir;
      if (field === 'usGap') {
        const gapA = window.US_PREDICTOR ? window.US_PREDICTOR.calculatePredictedOpen(a).gapPct : 0;
        const gapB = window.US_PREDICTOR ? window.US_PREDICTOR.calculatePredictedOpen(b).gapPct : 0;
        return (gapA - gapB) * dir;
      }
      if (state.preset === 'NEXT_DAY_CANDIDATE' && field === 'score') {
        // 익일 공략 후보는 거래대금(주도주 파워)과 종합 AI타점을 복합 가중하여 시장 대장주가 최우선 정렬되도록 함
        const scoreA = (a.score || 0) * 0.45 + Math.min(100, (a.turnoverEok || 0) / 15) * 0.55;
        const scoreB = (b.score || 0) * 0.45 + Math.min(100, (b.turnoverEok || 0) / 15) * 0.55;
        return (scoreA - scoreB) * dir;
      }
      return ((a[field] || 0) - (b[field] || 0)) * dir;
    });

    return filtered;
  }

  // 스파크라인 SVG 생성기
  function buildSparklineSvg(prices, isUp) {
    const w = 52;
    const h = 20;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const span = Math.max(1, max - min);

    const pts = prices.map((p, i) => {
      const x = ((i / (prices.length - 1)) * (w - 4) + 2).toFixed(1);
      const y = (h - 3 - ((p - min) / span) * (h - 6)).toFixed(1);
      return `${x},${y}`;
    });

    const stroke = isUp ? '#ff4757' : '#3b82f6';
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <polyline fill="none" stroke="${stroke}" stroke-width="1.6" points="${pts.join(' ')}" />
    </svg>`;
  }

  // 거래대금 포맷터 (억, 조, 만원 단위 정밀 표기)
  function formatTurnover(eok) {
    if (eok == null || isNaN(eok) || eok <= 0) return '0억';
    if (eok >= 10000) {
      const jo = Math.floor(eok / 10000);
      const rem = Math.round(eok % 10000);
      return rem > 0 ? `${jo}조 ${rem.toLocaleString()}억` : `${jo}조원`;
    }
    if (eok >= 100) {
      return `${Math.round(eok).toLocaleString()}억`;
    }
    if (eok >= 1) {
      return `${Number(eok.toFixed(1))}억`;
    }
    const manwon = Math.round(eok * 10000);
    return `${manwon.toLocaleString()}만`;
  }

  // 거래량 포맷터 (만주, 주 단위 정밀 표기)
  function formatVolume(vol) {
    if (vol == null || isNaN(vol) || vol <= 0) return '0주';
    if (vol >= 10000000) {
      return `${(vol / 10000000).toFixed(1)}천만주`;
    }
    if (vol >= 10000) {
      return `${Math.round(vol / 10000).toLocaleString()}만주`;
    }
    return `${vol.toLocaleString()}주`;
  }

  // 중앙 스캐너 테이블 렌더링
  function renderScannerTable(filteredStocks, highlightTickSet = null) {
    const totalUniverse = engine.stocks.length;
    el.scannerResultCount.textContent = filteredStocks.length.toLocaleString();
    el.scannerTotalCount.textContent = totalUniverse.toLocaleString();
    el.kpiTotalUniverse.textContent = `${totalUniverse.toLocaleString()}종목`;
    el.kpiMatchedCount.textContent = `${filteredStocks.length.toLocaleString()}종목`;
    if (el.mNavMatchCount) {
      el.mNavMatchCount.textContent = filteredStocks.length.toLocaleString();
    }
    const btnMarketAll = document.getElementById('btnMarketAll');
    if (btnMarketAll) btnMarketAll.textContent = `전체 (${totalUniverse.toLocaleString()})`;
    const presetAllTitle = document.getElementById('presetAllUniverseTitle');
    if (presetAllTitle) presetAllTitle.textContent = `🌐 KRX 전체 ${totalUniverse.toLocaleString()}종목`;
    const presetAllDesc = document.getElementById('presetAllUniverseDesc');
    if (presetAllDesc) presetAllDesc.textContent = `필터 제약 없이 ${totalUniverse.toLocaleString()}개 전체 상장종목의 KRX 실제 현재가·등락률·거래대금 확인`;

    // 전체 유니버스 통계 업데이트
    let rvolSurgeCount = 0;
    let breakoutCount = 0;
    for (const s of engine.stocks) {
      if (s.rvol >= 2.0) rvolSurgeCount++;
      if (s.isOrbBreakout || s.isPrevHighBreakout) breakoutCount++;
    }
    el.kpiRvolSurge.textContent = `${rvolSurgeCount.toLocaleString()}종목`;
    el.kpiBreakoutCount.textContent = `${breakoutCount.toLocaleString()}종목`;

    if (engine.sectorStats.length > 0) {
      const topSec = engine.sectorStats[0];
      const sign = topSec.avgChangePct >= 0 ? '+' : '';
      el.kpiTopSector.textContent = `${topSec.sector} (${sign}${topSec.avgChangePct}%)`;
    }

    // 선택된 종목이 없으면 첫 번째 종목 자동 선택
    if (!state.selectedCode || !engine.stockMap.has(state.selectedCode)) {
      state.selectedCode = (filteredStocks[0] || engine.stocks[0]).code;
    }

    const slice = filteredStocks.slice(0, state.pageLimit);
    const rowsHtml = [];

    for (const s of slice) {
      const isSelected = s.code === state.selectedCode;
      const isStarred = state.watchlist.has(s.code);
      const isUp = s.changePct > 0;
      const isDown = s.changePct < 0;
      const colorCls = isUp ? 'up-color' : isDown ? 'down-color' : '';
      const sign = isUp ? '+' : '';

      let tickClass = '';
      const isMarketOpen = typeof isRegularMarketHoursNow === 'function' ? isRegularMarketHoursNow() : true;
      const scenarioMode = el.selectMarketScenario ? el.selectMarketScenario.value : 'REAL_SNAPSHOT';
      const allowTickFlash = (scenarioMode !== 'REAL_SNAPSHOT') || isMarketOpen;

      if (allowTickFlash && highlightTickSet && highlightTickSet.has(s.code)) {
        tickClass = s.lastTickDir > 0 ? 'tick-up' : s.lastTickDir < 0 ? 'tick-down' : '';
      }

      const rvolCls = s.rvol >= 2.5 ? 'extreme' : s.rvol >= 1.7 ? 'high' : 'normal';
      const vwapSign = s.vwapDiffPct > 0 ? '+' : '';
      const vwapCls = s.vwapDiffPct >= 0 ? 'up-color' : 'down-color';

      const scoreCls =
        s.score >= 85 ? 's-top' : s.score >= 75 ? 's-high' : s.score >= 60 ? 's-mid' : 's-low';

      // 장마감 모드 또는 익일 공략 후보일 때 뱃지 보강 (미국 증시 연동 시초가 갭 예측 포함)
      const isNextDayView = state.preset === 'NEXT_DAY_CANDIDATE' || !isMarketOpen;
      let displaySignals = [...s.signals];
      let rowTooltip = '';
      if (isNextDayView) {
        if (window.US_PREDICTOR) {
          const pred = window.US_PREDICTOR.calculatePredictedOpen(s);
          const gapSign = pred.gapPct >= 0 ? '+' : '';
          const bCls = pred.gapPct >= 0 ? 'us-up' : 'us-down';
          displaySignals.unshift({
            code: 'US_PRED',
            label: `🇺🇸 ${gapSign}${pred.gapPct.toFixed(1)}% (${pred.predictedPrice.toLocaleString()}원)`,
            type: bCls
          });
          rowTooltip = `[익일 예상 시초가] ${pred.predictedPrice.toLocaleString()}원 (${gapSign}${pred.gapPct.toFixed(2)}%) · 연동주: ${pred.mapping.primaryName}`;
        }
        const upperTailPct = (s.high - s.price) / Math.max(1, s.price);
        if (s.turnoverEok >= 150 && upperTailPct <= 0.04 && s.price >= s.openPrice) {
          displaySignals.push({ code: 'NEXT_DAY_GO', label: '🌙익일시초가돌파', type: 'nextday' });
        } else if (s.turnoverEok >= 80 && s.price >= s.vwap) {
          displaySignals.push({ code: 'CLOSING_BET', label: '🔥주도주종가베팅', type: 'hot' });
        }
      }

      const sigHtml = displaySignals
        .slice(0, 2)
        .map(sig => `<span class="sig-badge ${sig.type}">${sig.label}</span>`)
        .join('');

      rowsHtml.push(`
        <tr data-code="${s.code}" class="${isSelected ? 'selected-row' : ''} ${tickClass}" ${rowTooltip ? `title="${rowTooltip}"` : ''}>
          <td class="text-center col-watch">
            <button class="btn-star ${isStarred ? 'starred' : ''}" data-star="${s.code}" title="관심종목 토글">
              ${isStarred ? '★' : '☆'}
            </button>
          </td>
          <td class="col-name">
            <div class="stock-cell-main">
              <div class="stock-name-line">
                <span class="mini-mkt ${s.market.toLowerCase()}">${s.market}</span>
                <span class="stock-name-text">${s.name}</span>
                ${s.isNxt ? '<span class="nxt-tag" title="NXT(넥스트레이드) 상장 종목 · 거래대금/거래량 통합 합산">NXT+</span>' : ''}
              </div>
              <div class="stock-sub-line mono">${s.code} · ${s.sector}</div>
            </div>
          </td>
          <td class="text-right mono col-price ${colorCls}"><strong>${s.price.toLocaleString()}</strong></td>
          <td class="text-right mono col-chg ${colorCls}"><strong>${sign}${s.changePct.toFixed(2)}%</strong></td>
          <td class="text-right mono col-rvol"><span class="rvol-pill ${rvolCls}">${s.rvol.toFixed(2)}x</span></td>
          <td class="text-right mono col-vp ${s.volPower >= 110 ? 'up-color' : ''}">${s.volPower.toFixed(1)}%</td>
          <td class="text-right mono col-vwap ${vwapCls}">${vwapSign}${s.vwapDiffPct.toFixed(2)}%</td>
          <td class="text-right mono col-tv" title="${s.isNxt ? `통합 ${formatTurnover(s.turnoverEok)} (KRX: ${formatTurnover(s.krxTurnoverEok || s.turnoverEok)} + NXT: ${formatTurnover(s.nxtTurnoverEok || 0)})` : `거래대금 ${formatTurnover(s.turnoverEok)}`}">
            <div class="tv-val">${formatTurnover(s.turnoverEok)}</div>
            <div class="tv-vol">${formatVolume(s.volume)}</div>
          </td>
          <td class="text-center col-spark">${buildSparklineSvg(s.sparkline, s.changePct >= 0)}</td>
          <td class="text-center col-signals"><div class="signal-tags-wrap">${sigHtml || '<span class="stock-sub-line">관망/일반흐름</span>'}</div></td>
          <td class="text-center mono col-score"><span class="score-pill ${scoreCls}">${s.score}</span></td>

          <!-- 📱 모바일 전용 초압축 스마트 카드 셀 (가로 스크롤 완전 제거) -->
          <td class="m-card-cell">
            <div class="m-card-inner">
              <div class="m-card-top">
                <div class="m-card-left">
                  <button class="btn-star ${isStarred ? 'starred' : ''}" data-star="${s.code}">${isStarred ? '★' : '☆'}</button>
                  <span class="mini-mkt ${s.market.toLowerCase()}">${s.market}</span>
                  <strong class="m-card-name">${s.name}</strong>
                  ${s.isNxt ? '<span class="nxt-tag">NXT+</span>' : ''}
                  <span class="m-card-code mono">${s.code}</span>
                </div>
                <div class="m-card-right">
                  <strong class="m-card-price mono ${colorCls}">${s.price.toLocaleString()}원</strong>
                  <span class="m-card-chg mono ${colorCls}">${sign}${s.changePct.toFixed(2)}%</span>
                </div>
              </div>
              <div class="m-card-bottom">
                <div class="m-card-signals">
                  ${sigHtml || `<span class="m-card-sub-info">RVOL ${s.rvol.toFixed(1)}x · 체결 ${s.volPower.toFixed(0)}%</span>`}
                </div>
                <div class="m-card-metrics">
                  <span class="m-card-metric-rvol mono">RVOL ${s.rvol.toFixed(1)}x</span>
                  <span class="m-card-tv mono">대금 ${formatTurnover(s.turnoverEok)}</span>
                  <span class="score-pill ${scoreCls} mono">${s.score}점</span>
                </div>
              </div>
            </div>
          </td>
        </tr>
      `);
    }

    if (rowsHtml.length === 0) {
      el.scannerTableBody.innerHTML = `
        <tr>
          <td colspan="11" class="text-center" style="padding: 40px; color: var(--text-sub);">
            현재 필터 조건에 부합하는 종목이 없습니다. 좌측에서 [초기화] 또는 다른 전략 프리셋을 선택해 보세요.
          </td>
        </tr>
      `;
    } else {
      el.scannerTableBody.innerHTML = rowsHtml.join('');
    }
  }

  // 좌측 섹터별 수급 순위 렌더링
  function renderSectorHeatmap() {
    const html = engine.sectorStats
      .map((item, idx) => {
        const isUp = item.avgChangePct >= 0;
        const sign = isUp ? '+' : '';
        const activeCls = state.sector === item.sector ? 'active' : '';
        return `
          <div class="sector-row ${activeCls}" data-sector="${item.sector}">
            <div class="sector-name-wrap">
              <span class="sector-rank-num mono">${idx + 1}</span>
              <span>${item.sector}</span>
            </div>
            <div class="sector-metrics mono">
              <span class="badge-subtle">돌파 ${item.breakoutCount}</span>
              <span class="${isUp ? 'up-color' : 'down-color'}"><strong>${sign}${item.avgChangePct.toFixed(2)}%</strong></span>
            </div>
          </div>
        `;
      })
      .join('');
    el.sectorHeatmapList.innerHTML = html;
  }

  // 실시간 브레이크아웃 티커 바 렌더링
  function renderLiveAlerts() {
    if (state.liveAlerts.length === 0) {
      // 초기 상위 돌파 종목들로 시드 알림 채우기
      const topBreakouts = [...engine.stocks]
        .filter(s => s.isOrbBreakout && s.rvol >= 2.0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

      topBreakouts.forEach(s => {
        state.liveAlerts.push({
          code: s.code,
          time: '장중포착',
          name: s.name,
          changePct: s.changePct,
          rvol: s.rvol,
          signalText: `ORB 고점 돌파 · RVOL ${s.rvol}x`
        });
      });
    }

    el.liveAlertTrack.innerHTML = state.liveAlerts
      .slice(0, 12)
      .map(a => {
        const sign = a.changePct >= 0 ? '+' : '';
        return `
          <div class="alert-pill" data-code="${a.code}">
            <span class="a-time mono">${a.time}</span>
            <span class="a-name">${a.name}</span>
            <span class="mono up-color">${sign}${a.changePct.toFixed(2)}%</span>
            <span class="a-desc">${a.signalText}</span>
          </div>
        `;
      })
      .join('');
  }

  // 🇺🇸 미 증시 연동 익일 시초가 예측 카드 렌더링
  function renderUsPredictionCard(stock) {
    if (!el.usPredictionCard || !window.US_PREDICTOR) return;

    const isMarketOpen = typeof isRegularMarketHoursNow === 'function' ? isRegularMarketHoursNow() : true;
    const isNextDayMode = (!isMarketOpen && el.selectMarketScenario?.value === 'REAL_SNAPSHOT') || state.preset === 'NEXT_DAY_CANDIDATE';

    // 모바일 우측 서브탭 제어 (장중에는 시초예측 탭 숨기고 차트로 자동 전환)
    if (el.mTabUsPredict) {
      el.mTabUsPredict.style.display = isNextDayMode ? 'inline-flex' : 'none';
      if (!isNextDayMode && state.mobileRightTab === 'us-predict') {
        setMobileRightTab('chart');
      }
    }

    // 장 마감 모드 또는 익일 공략 후보 모드가 아니면 화면에서 완전히 숨김
    if (!isNextDayMode) {
      el.usPredictionCard.style.display = 'none';
      return;
    }
    el.usPredictionCard.style.display = 'flex';

    const pred = window.US_PREDICTOR.calculatePredictedOpen(stock);
    const gapSign = pred.gapPct >= 0 ? '+' : '';
    const gapCls = pred.gapPct >= 0 ? 'up-color' : 'down-color';

    // 1) 예상 시초가 메인 & 밴드
    if (el.usPredictedPrice) el.usPredictedPrice.textContent = `${pred.predictedPrice.toLocaleString()}원`;
    if (el.usPredictedGap) {
      el.usPredictedGap.className = `f-gap-badge ${gapCls}`;
      const dirArrow = pred.gapPct >= 0 ? '▲ ' : '▼ ';
      el.usPredictedGap.textContent = `${dirArrow}${gapSign}${pred.gapPct.toFixed(1)}% 갭${pred.gapPct >= 0 ? '상승' : '하락'}`;
    }
    if (el.usPredictedRange) {
      el.usPredictedRange.textContent = `${pred.rangeLow.toLocaleString()}원 ~ ${pred.rangeHigh.toLocaleString()}원`;
    }

    // 2) 연동 미국 핵심 자산 정보
    if (el.usPrimaryName) el.usPrimaryName.textContent = pred.mapping.primaryName;
    if (el.usPrimaryBeta) el.usPrimaryBeta.textContent = `β ${pred.mapping.beta.toFixed(2)}`;

    const pAsset = window.US_PREDICTOR.assets[pred.mapping.primary];
    const session = typeof window.US_PREDICTOR?.getUsMarketSession === 'function'
      ? window.US_PREDICTOR.getUsMarketSession()
      : { isPre: false, isRegular: true, badgeText: '본장 LIVE', sessionName: '본장' };

    if (pAsset && el.usPrimaryPrice) {
      el.usPrimaryPrice.textContent = `$${pAsset.price.toFixed(2)}`;
      const pSign = pred.primaryChg >= 0 ? '+' : '';
      const pCls = pred.primaryChg >= 0 ? 'up-color' : 'down-color';

      let subNote = '';
      if (session.isPre && typeof pAsset.preChgPct === 'number') {
        subNote = `(프리 ${pSign}${pAsset.preChgPct.toFixed(2)}%)`;
      } else if (session.isAfter && typeof pAsset.afterChgPct === 'number') {
        subNote = `(애프터 ${pSign}${pAsset.afterChgPct.toFixed(2)}%)`;
      }

      if (el.usPrimaryChg) {
        el.usPrimaryChg.className = `d-chg mono ${pCls}`;
        el.usPrimaryChg.textContent = `${pSign}${pred.primaryChg.toFixed(2)}% ${subNote}`.trim();
      }
    }

    if (el.usSecondaryName) el.usSecondaryName.textContent = pred.mapping.secondaryName;
    if (el.usSecondaryChg) {
      const sSign = pred.secondaryChg >= 0 ? '+' : '';
      const sCls = pred.secondaryChg >= 0 ? 'up-color' : 'down-color';
      el.usSecondaryChg.className = `mono ${sCls}`;
      el.usSecondaryChg.textContent = `${sSign}${pred.secondaryChg.toFixed(2)}%`;
    }

    if (el.usEwyChg) {
      const ewySign = pred.ewyChg >= 0 ? '+' : '';
      const ewyCls = pred.ewyChg >= 0 ? 'up-color' : 'down-color';
      el.usEwyChg.className = `mono ${ewyCls}`;
      el.usEwyChg.textContent = `${ewySign}${pred.ewyChg.toFixed(2)}%`;
    }

    // 3) AI 전략 코멘트 & 세션 뱃지
    if (el.usAiStrategyBox) el.usAiStrategyBox.innerHTML = pred.strategyAdvice;
    if (el.usSessionBadge) el.usSessionBadge.textContent = session.badgeText;

    // 시뮬레이션 기본 LIVE 라벨도 현재 세션에 맞게 동적 업데이트
    if (window.US_PREDICTOR.scenario === 'LIVE') {
      const liveLabel = session.isPre ? '실시간 프리마켓 시세'
                      : session.isRegular ? '실시간 본장 시세'
                      : session.isAfter ? '실시간 애프터마켓 시세'
                      : '미 증시 최종 종가';
      if (el.usScenarioLabel) el.usScenarioLabel.textContent = liveLabel;
    }
    const liveBtn = document.querySelector('.btn-scenario[data-scenario="LIVE"]');
    if (liveBtn) {
      liveBtn.textContent = session.isPre ? '실시간 프리'
                          : session.isRegular ? '실시간 본장'
                          : session.isAfter ? '실시간 애프터'
                          : '실시간 LIVE';
    }
  }

  // 우측 선택 종목 상세 정보 및 캔버스 차트 렌더링
  function renderStockDetail() {
    const stock = engine.stockMap.get(state.selectedCode) || engine.stocks[0];
    if (!stock) return;

    el.detailMarketBadge.textContent = stock.market;
    if (el.detailNxtBadge) {
      el.detailNxtBadge.style.display = stock.isNxt ? 'inline-flex' : 'none';
    }
    el.detailSectorBadge.textContent = stock.sector;
    el.detailStockName.textContent = stock.name;
    el.detailStockCode.textContent = stock.code;
    if (el.btnNaverFinanceLink) {
      el.btnNaverFinanceLink.href = `https://finance.naver.com/item/main.naver?code=${stock.code}`;
    }
    if (el.mNavStockBadge) {
      el.mNavStockBadge.textContent = stock.name;
    }

    const isUp = stock.changePct > 0;
    const isDown = stock.changePct < 0;
    const colorCls = isUp ? 'up-color' : isDown ? 'down-color' : '';
    const arrow = isUp ? '▲' : isDown ? '▼' : '-';
    const sign = isUp ? '+' : '';

    el.detailStockPrice.className = `detail-price mono ${colorCls}`;
    el.detailStockPrice.textContent = `${stock.price.toLocaleString()}원`;

    el.detailStockChange.className = `detail-change mono ${colorCls}`;
    el.detailStockChange.textContent = `${arrow} ${Math.abs(stock.change).toLocaleString()}원 (${sign}${stock.changePct.toFixed(2)}%)`;

    if (el.detailTvLine) {
      if (stock.isNxt && stock.nxtTurnoverEok > 0) {
        const krxTv = formatTurnover(stock.krxTurnoverEok || (stock.turnoverEok - stock.nxtTurnoverEok));
        const nxtTv = formatTurnover(stock.nxtTurnoverEok);
        el.detailTvLine.innerHTML = `
          <span>거래대금 <strong class="tv-highlight">${formatTurnover(stock.turnoverEok)}</strong> <span class="tv-sub-krx-nxt">(${krxTv}+NXT ${nxtTv})</span></span>
          <span style="color:#475569;">|</span>
          <span>누적량 <strong class="tv-highlight">${formatVolume(stock.volume)}</strong></span>
        `;
      } else {
        el.detailTvLine.innerHTML = `
          <span>당일 거래대금 <strong class="tv-highlight">${formatTurnover(stock.turnoverEok)}</strong></span>
          <span style="color:#475569;">|</span>
          <span>누적 거래량 <strong class="tv-highlight">${formatVolume(stock.volume)}</strong></span>
        `;
      }
    }

    if (el.detailTurnover) {
      if (stock.isNxt && stock.nxtTurnoverEok > 0) {
        el.detailTurnover.innerHTML = `${formatTurnover(stock.turnoverEok)} <span class="nxt-mini-tag">KRX+NXT</span>`;
      } else {
        el.detailTurnover.textContent = formatTurnover(stock.turnoverEok);
      }
    }
    if (el.detailVolume) {
      if (stock.isNxt && stock.nxtVolume > 0) {
        el.detailVolume.innerHTML = `${stock.volume.toLocaleString()}주 <span class="nxt-mini-tag">NXT포함</span>`;
      } else {
        el.detailVolume.textContent = `${stock.volume.toLocaleString()}주`;
      }
    }

    el.detailSignalBadges.innerHTML =
      stock.signals.map(sig => `<span class="sig-badge ${sig.type}">${sig.label}</span>`).join('') ||
      '<span class="badge-subtle">특이 돌파 시그널 대기중</span>';

    el.detailRvol.textContent = `${stock.rvol.toFixed(2)}x (평소대비)`;
    el.detailRvol.className = `m-val mono ${stock.rvol >= 2.0 ? 'highlight-gold' : ''}`;

    el.detailVolPower.textContent = `${stock.volPower.toFixed(1)}%`;
    el.detailVolPower.className = `m-val mono ${stock.volPower >= 110 ? 'up-color' : ''}`;

    el.detailVwap.textContent = `${stock.vwap.toLocaleString()}원 (${stock.vwapDiffPct >= 0 ? '+' : ''}${stock.vwapDiffPct}%)`;
    el.detailOrbHigh.textContent = `${stock.orbHigh.toLocaleString()}원`;
    el.detailLarryTarget.textContent = `${stock.larryTarget.toLocaleString()}원`;
    el.detailRsiGap.textContent = `RSI ${stock.rsi} / 갭 ${stock.gapPct >= 0 ? '+' : ''}${stock.gapPct}%`;

    // 데이트레이딩 / 익일 시초가 타점 플랜
    const isMarketOpen = typeof isRegularMarketHoursNow === 'function' ? isRegularMarketHoursNow() : true;
    const isNextDayMode = (!isMarketOpen && el.selectMarketScenario?.value === 'REAL_SNAPSHOT') || state.preset === 'NEXT_DAY_CANDIDATE';

    const plan = stock.tradePlan;
    if (isNextDayMode) {
      if (el.tradePlanTitle) el.tradePlanTitle.innerHTML = '🌙 익일 시초가 공략 가이드';
      if (el.planEntryLabel) el.planEntryLabel.textContent = '익일 돌파기준 (K=0.5)';
      if (el.planTarget1Label) el.planTarget1Label.textContent = '1차 익절가 (+3.5%)';
      if (el.planTarget2Label) el.planTarget2Label.textContent = '2차 슈팅가 (+6.0%)';
      if (el.planStopLabel) el.planStopLabel.textContent = '익일 손절선 (저가 이탈)';

      // 래리 윌리엄스 익일 변동성 돌파 타점: 오늘 변동폭(고가-저가) * 0.5
      const dayRange = Math.max(stock.price * 0.02, stock.high - stock.low);
      const nextBreakoutOffset = Math.round(dayRange * 0.5);
      const nextBreakoutPrice = stock.price + nextBreakoutOffset;
      const target1Price = Math.round(stock.price * 1.035);
      const target2Price = Math.round(stock.price * 1.06);
      const stopPrice = Math.min(stock.low, Math.round(stock.price * 0.978));

      el.detailRrBadge.textContent = `손익비 1:2.5 · AI ${stock.score}점`;
      el.planEntryPrice.innerHTML = `<span>시초가+${nextBreakoutOffset.toLocaleString()}원</span>`;
      el.planTarget1Price.innerHTML = `<span>${target1Price.toLocaleString()}원</span><span class="lvl-pct">+3.5%</span>`;
      el.planTarget2Price.innerHTML = `<span>${target2Price.toLocaleString()}원</span><span class="lvl-pct">+6.0%</span>`;
      const stopPct = (((stopPrice - stock.price) / stock.price) * 100).toFixed(1);
      el.planStopPrice.innerHTML = `<span>${stopPrice.toLocaleString()}원</span><span class="lvl-pct">${stopPct}%</span>`;
    } else {
      if (el.tradePlanTitle) el.tradePlanTitle.innerHTML = '🧭 데이트레이딩 타점 가이드';
      if (el.planEntryLabel) el.planEntryLabel.textContent = plan.entryLabel || '권장 진입타점 (눌림목 지지)';
      if (el.planTarget1Label) el.planTarget1Label.textContent = '1차 익절 목표가';
      if (el.planTarget2Label) el.planTarget2Label.textContent = '2차 슈팅 목표가';
      if (el.planStopLabel) el.planStopLabel.textContent = '손절 기준선 (지지선 이탈)';

      el.detailRrBadge.textContent = `손익비 ${plan.rrRatio} · AI ${stock.score}점`;

      const diffFromCurrent = (((plan.entryPrice - stock.price) / stock.price) * 100).toFixed(1);
      const diffSign = plan.entryPrice > stock.price ? '+' : '';
      const diffBadge = plan.entryPrice === stock.price
        ? ''
        : `<span class="lvl-pct" style="color:${plan.entryPrice < stock.price ? '#38bdf8' : '#ff6b81'};">${diffSign}${diffFromCurrent}% ${plan.entryPrice < stock.price ? '눌림' : '돌파'}</span>`;

      const t1Pct = Number(plan.target1Pct).toFixed(1);
      const t2Pct = (((plan.target2Price - plan.entryPrice) / plan.entryPrice) * 100).toFixed(1);
      const slPct = Number(plan.stopLossPct).toFixed(1);

      el.planEntryPrice.innerHTML = `<span>${plan.entryPrice.toLocaleString()}원</span>${diffBadge}`;
      el.planTarget1Price.innerHTML = `<span>${plan.target1Price.toLocaleString()}원</span><span class="lvl-pct">+${t1Pct}%</span>`;
      el.planTarget2Price.innerHTML = `<span>${plan.target2Price.toLocaleString()}원</span><span class="lvl-pct">+${t2Pct}%</span>`;
      el.planStopPrice.innerHTML = `<span>${plan.stopLossPrice.toLocaleString()}원</span><span class="lvl-pct">${slPct}%</span>`;
    }

    updatePositionCalculator(stock);
    renderAiCommentary(stock);
    drawIntradayChart(stock);
    renderUsPredictionCard(stock);
  }

  // 리스크 기반 주문수량 계산기
  function updatePositionCalculator(stock) {
    const accountManwon = Number(el.inputAccountSize.value) || 3000;
    const riskPct = Number(el.inputRiskPct.value) || 1.0;

    const totalAccountKRW = accountManwon * 10000;
    const maxLossKRW = Math.round(totalAccountKRW * (riskPct / 100));

    const entry = stock.tradePlan.entryPrice;
    const stop = stock.tradePlan.stopLossPrice;
    const lossPerShare = Math.max(entry * 0.01, entry - stop);

    let shares = Math.floor(maxLossKRW / lossPerShare);
    // 총 계좌 금액을 초과하지 않도록 캡
    const maxAffordableShares = Math.floor(totalAccountKRW / entry);
    shares = Math.max(1, Math.min(shares, maxAffordableShares));

    const totalCostManwon = Math.round((shares * entry) / 10000);

    el.calcMaxLossKRW.textContent = `${maxLossKRW.toLocaleString()}원`;
    el.calcRecommendedShares.textContent = `${shares.toLocaleString()}주`;
    el.calcPositionCost.textContent = `약 ${totalCostManwon.toLocaleString()}만원`;
  }

  // AI 주가흐름 진단 코멘터리 생성
  function renderAiCommentary(stock) {
    const isMarketOpen = typeof isRegularMarketHoursNow === 'function' ? isRegularMarketHoursNow() : true;
    const isNextDayMode = (!isMarketOpen && el.selectMarketScenario?.value === 'REAL_SNAPSHOT') || state.preset === 'NEXT_DAY_CANDIDATE';

    const parts = [];
    if (isNextDayMode) {
      parts.push(`<strong>[${stock.name} (${stock.code})]</strong> 오늘 거래대금 <strong>${formatTurnover(stock.turnoverEok)}</strong>, 평소 대비 <strong>${stock.rvol}배(RVOL)</strong>의 대량 거래가 유입되며 <strong>+${stock.changePct}%</strong> 강세로 마감했습니다. `);

      const dayRange = Math.max(stock.price * 0.02, stock.high - stock.low);
      const nextBreakoutOffset = Math.round(dayRange * 0.5);

      if (stock.price >= stock.high * 0.96) {
        parts.push(`고가 부근을 장악한 양봉 마감으로 매수세가 여전히 살아있어 <strong>내일(익일) 시초가 갭상승 또는 변동성 돌파(+${nextBreakoutOffset.toLocaleString()}원 돌파 시)</strong> 1차 타점 공략이 유망합니다. `);
      } else {
        parts.push(`장중 고점 형성 후 일부 차익실현이 나왔으므로, 내일 시초가 형성 후 오늘 VWAP(${stock.vwap.toLocaleString()}원) 부근 지지 여부를 확인하며 분할 접근하는 전략이 안전합니다. `);
      }

      if (stock.isPrevHighBreakout) {
        parts.push(`전일 고점을 돌파한 신고가 주도주이므로 익일 장초반 거래대금 1위~3위 섹터에 해당할 경우 슈팅 가능성이 높습니다.`);
      } else {
        parts.push(`손절선은 오늘 저가 또는 ${Math.round(stock.price * 0.978).toLocaleString()}원(-2.2%) 이탈 시로 설정해 손익비를 방어하세요.`);
      }
    } else {
      parts.push(`<strong>[${stock.name} (${stock.code})]</strong> 현재 평소 동시간대 대비 <strong>${stock.rvol}배(RVOL)</strong>의 거래량이 유입되며 `);

      if (stock.isOrbBreakout && stock.price >= stock.vwap) {
        parts.push(`장초반 30분 고점인 <strong>ORB 저항선(${stock.orbHigh.toLocaleString()}원)</strong>과 <strong>VWAP(${stock.vwap.toLocaleString()}원)</strong> 위에서 강한 돌파 흐름을 유지하고 있습니다. `);
      } else if (stock.price >= stock.vwap) {
        parts.push(`당일 거래량가중평균가(VWAP ${stock.vwap.toLocaleString()}원) 상단에서 매수 우위(체결강도 ${stock.volPower}%) 흐름을 보이고 있습니다. `);
      } else {
        parts.push(`VWAP(${stock.vwap.toLocaleString()}원) 하단에 위치해 있어 VWAP 탈환 및 거래량 동반 여부를 먼저 확인하는 것이 안전합니다. `);
      }

      if (stock.tradePlan && stock.tradePlan.entryPrice < stock.price) {
        parts.push(`현재가 추격보다는 권장 지지가인 <strong>${stock.tradePlan.entryPrice.toLocaleString()}원</strong> 부근 눌림목에서 분할 진입하는 것이 안전합니다. `);
      }

      if (stock.isPrevHighBreakout) {
        parts.push(`특히 <strong>전일 고가(${stock.prevHigh.toLocaleString()}원)</strong> 매물대를 소화하며 신고가 영역에 진입해 단기 데이트레이딩 모멘텀이 매우 강합니다. `);
      } else {
        parts.push(`손절 기준선인 <strong>${stock.tradePlan.stopLossPrice.toLocaleString()}원</strong> 이탈 시 칼손절 대응을 권장합니다.`);
      }
    }

    el.detailAiCommentary.innerHTML = parts.join('');
  }

  // 캔버스 기반 장중 5분봉 + VWAP + ORB 고점 + 전일고가 + 거래량 차트 렌더링
  function drawIntradayChart(stock, hoverIndex = null) {
    const canvas = el.intradayChartCanvas;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 400;
    const height = rect.height || 255;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const candles = stock.candles;
    const n = candles.length;
    if (n === 0) return;

    const padLeft = 10;
    const padRight = 58;
    const padTop = 14;
    const priceAreaH = height * 0.70;
    const volAreaTop = height * 0.75;
    const volAreaH = height * 0.20;
    const plotW = width - padLeft - padRight;

    // 가격 최대/최소 범위 계산 (ORB 고점, 전일고가 포함)
    let minP = Infinity;
    let maxP = -Infinity;
    let maxVol = 1;

    for (const c of candles) {
      if (c.low < minP) minP = c.low;
      if (c.high > maxP) maxP = c.high;
      if (c.vwap < minP) minP = c.vwap;
      if (c.vwap > maxP) maxP = c.vwap;
      if (c.volume > maxVol) maxVol = c.volume;
    }

    if (stock.orbHigh > maxP) maxP = stock.orbHigh;
    if (stock.prevHigh <= maxP * 1.04 && stock.prevHigh >= minP * 0.96) {
      if (stock.prevHigh > maxP) maxP = stock.prevHigh;
      if (stock.prevHigh < minP) minP = stock.prevHigh;
    }

    const pricePadding = Math.max(10, (maxP - minP) * 0.08);
    minP -= pricePadding;
    maxP += pricePadding;
    const priceSpan = Math.max(1, maxP - minP);

    // 장중 진행 세션 동적 확대 vs 79봉 전체 타임라인 계산
    const isMarketOpen = typeof isRegularMarketHoursNow === 'function' ? isRegularMarketHoursNow() : false;
    const lastSlot = typeof candles[n - 1].slotIdx === 'number' ? candles[n - 1].slotIdx : n - 1;
    const isZoomMode = state.chartZoom !== 'full' && isMarketOpen && lastSlot < 72;
    const totalDaySlots = isZoomMode ? Math.min(79, Math.max(16, lastSlot + 4)) : 79;

    const yOfPrice = p => padTop + ((maxP - p) / priceSpan) * (priceAreaH - padTop);
    const xOfIdx = i => padLeft + ((i + 0.5) / totalDaySlots) * plotW;

    if (el.btnToggleChartZoom) {
      if (isMarketOpen && lastSlot < 72) {
        el.btnToggleChartZoom.style.display = 'inline-flex';
        el.btnToggleChartZoom.textContent = isZoomMode ? '🔍 세션확대' : '📊 전체79봉';
        el.btnToggleChartZoom.title = isZoomMode ? '클릭 시 전체 79봉(09:00~15:30) 뷰로 전환' : '클릭 시 현재 진행 세션 확대 뷰로 전환';
        el.btnToggleChartZoom.classList.toggle('is-full', !isZoomMode);
      } else {
        el.btnToggleChartZoom.style.display = 'none';
      }
    }

    // 배경 가로 그리드 선
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
    ctx.lineWidth = 1;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';

    for (let g = 0; g <= 4; g++) {
      const pVal = minP + (priceSpan * (4 - g)) / 4;
      const y = yOfPrice(pVal);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
      ctx.fillText(Math.round(pVal).toLocaleString(), width - padRight + 4, y + 3);
    }

    // 1) ORB 30분 고점 수평 점선 (하늘색)
    const yOrb = yOfPrice(stock.orbHigh);
    const yPrevH = yOfPrice(stock.prevHigh);
    const isLinesClose = Math.abs(yOrb - yPrevH) < 15;

    if (yOrb >= padTop && yOrb <= priceAreaH) {
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(padLeft, yOrb);
      ctx.lineTo(width - padRight, yOrb);
      ctx.stroke();

      const lblOrb = 'ORB고점';
      const lblX = width - padRight - 46;
      const lblY = isLinesClose && yOrb > yPrevH ? Math.min(priceAreaH - 2, yOrb + 11) : Math.max(padTop + 9, yOrb - 4);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.fillRect(lblX - 2, lblY - 9, 44, 12);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(lblOrb, lblX, lblY);
      ctx.restore();
    }

    // 2) 전일 고가 수평 점선 (보라색)
    if (yPrevH >= padTop && yPrevH <= priceAreaH) {
      ctx.save();
      ctx.setLineDash([2, 3]);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.75)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(padLeft, yPrevH);
      ctx.lineTo(width - padRight, yPrevH);
      ctx.stroke();

      const lblPrev = '전일고가';
      const lblX = width - padRight - (isLinesClose ? 94 : 46);
      const lblY = isLinesClose && yPrevH >= yOrb ? Math.min(priceAreaH - 2, yPrevH + 11) : Math.max(padTop + 9, yPrevH - 4);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.fillRect(lblX - 2, lblY - 9, 44, 12);
      ctx.fillStyle = '#c084fc';
      ctx.fillText(lblPrev, lblX, lblY);
      ctx.restore();
    }

    // 2.6) 현재 시각 진행 위치 표시선 (정규 장중에만 실시간 현재 슬롯 위치에 수직 점선 표시)
    if (isMarketOpen && lastSlot < totalDaySlots - 1) {
      const xNow = xOfIdx(lastSlot);
      ctx.save();
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xNow, padTop);
      ctx.lineTo(xNow, volAreaTop + volAreaH);
      ctx.stroke();
      ctx.restore();
    }

    // 3) 5분봉 캔들 및 하단 거래량 바 렌더링 (가독성 높은 반응형 캔들 너비)
    const candleW = Math.max(3.5, Math.min(18, (plotW / totalDaySlots) * 0.72));

    for (let i = 0; i < n; i++) {
      const c = candles[i];
      const slot = typeof c.slotIdx === 'number' ? c.slotIdx : i;
      const x = xOfIdx(slot);
      const isBull = c.close >= c.open;
      const color = isBull ? '#ff4757' : '#3b82f6';

      // 심지(Wick)
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, yOfPrice(c.high));
      ctx.lineTo(x, yOfPrice(c.low));
      ctx.stroke();

      // 몸통(Body)
      const yOpen = yOfPrice(c.open);
      const yClose = yOfPrice(c.close);
      const topY = Math.min(yOpen, yClose);
      const bodyH = Math.max(1.5, Math.abs(yClose - yOpen));

      ctx.fillStyle = color;
      ctx.fillRect(x - candleW / 2, topY, candleW, bodyH);

      // 거래량 바
      const vH = (c.volume / maxVol) * volAreaH;
      ctx.fillStyle = isBull ? 'rgba(255, 71, 87, 0.55)' : 'rgba(59, 130, 246, 0.55)';
      ctx.fillRect(x - candleW / 2, volAreaTop + volAreaH - vH, candleW, vH);
    }

    // 4) MA5 곡선 (에메랄드)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    candles.forEach((c, i) => {
      const slot = typeof c.slotIdx === 'number' ? c.slotIdx : i;
      const x = xOfIdx(slot);
      const y = yOfPrice(c.ma5);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 5) VWAP 곡선 (골드 굵은 실선)
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    candles.forEach((c, i) => {
      const slot = typeof c.slotIdx === 'number' ? c.slotIdx : i;
      const x = xOfIdx(slot);
      const y = yOfPrice(c.vwap);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 하단 시간 축 라벨 (슬롯 수에 맞춘 반응형 인터벌)
    ctx.fillStyle = '#64748b';
    let timeTicks = [];
    if (totalDaySlots <= 24) {
      for (let s = 0; s <= totalDaySlots; s += 6) {
        if (s <= 78) timeTicks.push([s, getSlotTimeLabel(s)]);
      }
    } else if (totalDaySlots <= 48) {
      for (let s = 0; s <= totalDaySlots; s += 12) {
        if (s <= 78) timeTicks.push([s, getSlotTimeLabel(s)]);
      }
    } else {
      timeTicks = [
        [0, '09:00'],
        [18, '10:30'],
        [36, '12:00'],
        [54, '13:30'],
        [78, '15:30']
      ];
    }
    for (const [slotIdx, label] of timeTicks) {
      if (slotIdx > totalDaySlots) continue;
      const x = xOfIdx(slotIdx);
      const offset = slotIdx === 0 ? 0 : slotIdx >= totalDaySlots - 2 ? 24 : 13;
      ctx.fillText(label, x - offset, height - 2);
    }

    // 6) 마우스/터치 인터랙티브 십자선(Crosshair) 및 실시간 툴팁 배너
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < n) {
      const hc = candles[hoverIndex];
      if (hc) {
        const slot = typeof hc.slotIdx === 'number' ? hc.slotIdx : hoverIndex;
        const hx = xOfIdx(slot);
        const hy = yOfPrice(hc.close);

        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.75)';
        ctx.lineWidth = 1;

        // 수직선
        ctx.beginPath();
        ctx.moveTo(hx, padTop);
        ctx.lineTo(hx, volAreaTop + volAreaH);
        ctx.stroke();

        // 수평선 (종가 기준)
        ctx.beginPath();
        ctx.moveTo(padLeft, hy);
        ctx.lineTo(width - padRight, hy);
        ctx.stroke();

        // 우측 Y축 가격 배지
        ctx.setLineDash([]);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(width - padRight + 1, hy - 9, padRight - 3, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
        ctx.fillText(Math.round(hc.close).toLocaleString(), width - padRight + 4, hy + 3.5);
        ctx.restore();

        // 상단 오버레이 배너 업데이트
        if (el.chartHoverBanner) {
          const isUp = hc.close >= hc.open;
          const colorClass = isUp ? 'up-color' : 'down-color';
          const chgFromOpen = (((hc.close - hc.open) / hc.open) * 100).toFixed(2);
          el.chartHoverBanner.innerHTML = `
            <span class="hb-time">⏱️ ${hc.time || (slot * 5 + '분')}</span>
            <span class="hb-price ${colorClass}">종가 ${Math.round(hc.close).toLocaleString()}원 (${chgFromOpen >= 0 ? '+' : ''}${chgFromOpen}%)</span>
            <span class="hb-muted">시 ${Math.round(hc.open).toLocaleString()} | 고 ${Math.round(hc.high).toLocaleString()} | 저 ${Math.round(hc.low).toLocaleString()}</span>
            <span class="hb-muted">거래량 ${Math.round(hc.volume).toLocaleString()}주</span>
            <span style="color:#fbbf24;">VWAP ${Math.round(hc.vwap).toLocaleString()}원</span>
          `;
          el.chartHoverBanner.style.display = 'flex';
        }
      }
    } else if (hoverIndex === null && el.chartHoverBanner) {
      el.chartHoverBanner.style.display = 'none';
    }
  }

  // 전체 화면 갱신
  function refreshAllViews(resetSelectionIfHidden = false, highlightTickSet = null) {
    const filtered = getFilteredAndSortedStocks();
    if (resetSelectionIfHidden && filtered.length > 0) {
      const stillVisible = filtered.some(s => s.code === state.selectedCode);
      if (!stillVisible) {
        state.selectedCode = filtered[0].code;
      }
    }
    renderScannerTable(filtered, highlightTickSet);
    renderSectorHeatmap();
    renderLiveAlerts();
    renderStockDetail();
  }

  // 네이버 금융 / KRX 실시간 JSONP 폴링 함수 (CORS 제약 없이 file:// 브라우저에서 직접 실시간 시세 수신)
  function fetchNaverRealtimeBatch(codesArray) {
    return new Promise(resolve => {
      if (!codesArray || codesArray.length === 0) {
        resolve([]);
        return;
      }

      const cbName = `__krxLiveCb_${Date.now()}_${++state.jsonpSeq}`;
      const script = document.createElement('script');
      let settled = false;

      const cleanup = () => {
        if (script.parentNode) script.parentNode.removeChild(script);
        try {
          delete window[cbName];
        } catch (_) {
          window[cbName] = undefined;
        }
      };

      const timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve([]);
      }, 4500);

      window[cbName] = function (res) {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        cleanup();
        const datas =
          res &&
          res.result &&
          Array.isArray(res.result.areas) &&
          res.result.areas[0] &&
          Array.isArray(res.result.areas[0].datas)
            ? res.result.areas[0].datas
            : [];
        resolve(datas);
      };

      script.onerror = function () {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        cleanup();
        resolve([]);
      };

      script.referrerPolicy = 'no-referrer';
      script.charset = 'euc-kr';
      script.src = `https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:${codesArray.join(',')}&_callback=${cbName}`;
      document.head.appendChild(script);
    });
  }

  // 백그라운드에서 최신 krxRealSnapshot.js를 무중단 리로드하여 새로 추가된 5분봉(m5) 자동 반영
  let lastSnapshotReloadTs = Date.now();
  function reloadSnapshotM5Script() {
    return new Promise((resolve) => {
      const prevTime = window.REAL_KRX_SNAPSHOT_TIME;
      const script = document.createElement('script');
      script.src = `krxRealSnapshot.js?_t=${Date.now()}`;
      script.onload = () => {
        if (script.parentNode) script.parentNode.removeChild(script);
        if (window.REAL_KRX_SNAPSHOT && window.REAL_KRX_SNAPSHOT_TIME !== prevTime && typeof engine.syncLiveSnapshotM5 === 'function') {
          const cnt = engine.syncLiveSnapshotM5(window.REAL_KRX_SNAPSHOT);
          if (cnt > 0) {
            refreshAllViews(false);
          }
        }
        resolve(true);
      };
      script.onerror = () => {
        if (script.parentNode) script.parentNode.removeChild(script);
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  // 현재 화면의 포착 종목 + 선택 종목 + 전체 유니버스 순환 배치를 실시간 KRX 시세로 갱신
  async function pollLiveKrxPrices(forceFullSweep = false) {
    if (!forceFullSweep && Date.now() - lastSnapshotReloadTs >= 60000) {
      lastSnapshotReloadTs = Date.now();
      reloadSnapshotM5Script();
    }
    if (forceFullSweep) {
      lastSnapshotReloadTs = Date.now();
      await reloadSnapshotM5Script();
      // 전체 종목을 180개씩 나누어 병렬/순차 고속 동기화
      const allCodes = engine.stocks.map(s => s.code);
      const chunkSize = 180;
      const allUpdatedCodes = new Set();

      if (el.brandSnapshotSubtitle) {
        el.brandSnapshotSubtitle.textContent = `KRX 전체 ${allCodes.length.toLocaleString()}종목 실시간 시세 동기화 중...`;
      }

      for (let i = 0; i < allCodes.length; i += chunkSize) {
        const chunk = allCodes.slice(i, i + chunkSize);
        const datas = await fetchNaverRealtimeBatch(chunk);
        const { updatedStocks, breakoutAlerts } = engine.applyRealMarketQuotes(datas);
        updatedStocks.forEach(s => allUpdatedCodes.add(s.code));
        if (breakoutAlerts.length > 0) {
          state.liveAlerts.unshift(...breakoutAlerts.slice(0, 3));
          if (state.liveAlerts.length > 20) state.liveAlerts.length = 20;
        }
      }

      const nowStr = new Date().toLocaleTimeString('ko-KR', { hour12: false });
      const isMarketOpen = typeof isRegularMarketHoursNow === 'function' ? isRegularMarketHoursNow() : true;
      if (el.brandSnapshotSubtitle) {
        if (!isMarketOpen) {
          el.brandSnapshotSubtitle.textContent = `KRX 정규장 마감 · 전체 1,381종목 최종 종가 동기화 완료 (${nowStr})`;
        } else {
          el.brandSnapshotSubtitle.textContent = `KRX 실시간 연동중 (최근 전체동기화: ${nowStr})`;
        }
      }
      refreshAllViews(false, allUpdatedCodes);
      return;
    }

    // 일반 실시간 주기 폴링: (1) 선택된 종목 + 관심종목 + 현재 필터 상위 90종목 + (2) 전체 종목 중 100개 순환 배치
    const priorityCodes = new Set();
    if (state.selectedCode) priorityCodes.add(state.selectedCode);
    state.watchlist.forEach(c => priorityCodes.add(c));

    const filtered = getFilteredAndSortedStocks();
    filtered.slice(0, 90).forEach(s => priorityCodes.add(s.code));

    const allStocks = engine.stocks;
    const sweepSize = 100;
    const startIdx = (state.pollChunkIndex * sweepSize) % Math.max(1, allStocks.length);
    state.pollChunkIndex++;

    for (let i = 0; i < sweepSize && priorityCodes.size < 190; i++) {
      const s = allStocks[(startIdx + i) % allStocks.length];
      if (s) priorityCodes.add(s.code);
    }

    const datas = await fetchNaverRealtimeBatch([...priorityCodes]);
    if (datas.length > 0) {
      const { updatedStocks, breakoutAlerts } = engine.applyRealMarketQuotes(datas);
      const updatedCodes = new Set(updatedStocks.map(s => s.code));

      if (breakoutAlerts.length > 0) {
        state.liveAlerts.unshift(...breakoutAlerts.slice(0, 3));
        if (state.liveAlerts.length > 20) state.liveAlerts.length = 20;
      }

      const nowStr = new Date().toLocaleTimeString('ko-KR', { hour12: false });
      const isMarketOpen = typeof isRegularMarketHoursNow === 'function' ? isRegularMarketHoursNow() : true;
      if (el.brandSnapshotSubtitle) {
        if (!isMarketOpen) {
          el.brandSnapshotSubtitle.textContent = `KRX 정규장 마감 · 최종 종가 확정 (${nowStr} 기준)`;
        } else {
          el.brandSnapshotSubtitle.textContent = `KRX 실시간 스트리밍 (${nowStr} · 변동 ${updatedCodes.size}종목)`;
        }
      }
      refreshAllViews(false, updatedCodes);
    }
  }

  // 장 운영 상태(정규장 09:00~15:30 vs 장마감) 및 UI 뱃지/깜빡임 상태 갱신
  function updateMarketStatusUI() {
    const isMarketOpen = typeof isRegularMarketHoursNow === 'function' ? isRegularMarketHoursNow() : true;
    const scenarioMode = el.selectMarketScenario ? el.selectMarketScenario.value : 'REAL_SNAPSHOT';

    if (scenarioMode === 'REAL_SNAPSHOT') {
      if (!isMarketOpen) {
        document.body.classList.add('market-closed');
        if (el.usPredictionCard) el.usPredictionCard.style.display = 'flex';
        if (el.btnToggleLive) {
          el.btnToggleLive.classList.remove('active');
          el.btnToggleLive.classList.add('closed');
        }
        if (el.liveStatusText) {
          el.liveStatusText.textContent = '정규장 마감 (종가 확정)';
        }
        if (el.brandSnapshotSubtitle && !el.brandSnapshotSubtitle.textContent.includes('마감')) {
          el.brandSnapshotSubtitle.textContent = 'KRX 정규장 마감 · 최종 종가 확정 완료';
        }
        if (el.marketClosedBanner) {
          el.marketClosedBanner.style.display = 'flex';
          if (el.bannerUsBar && window.US_PREDICTOR) {
            el.bannerUsBar.innerHTML = window.US_PREDICTOR.buildUsTickerHtml();
          }
          if (el.btnBannerPresetToggle) {
            el.btnBannerPresetToggle.textContent = state.preset === 'NEXT_DAY_CANDIDATE' ? '전체 종목 보기' : '🌙 내일 공략 후보 보기';
          }
          if (el.btnSortByUsGap) {
            el.btnSortByUsGap.classList.toggle('active', state.sortField === 'usGap');
          }
        }
        if (el.thColSignals) {
          const arrow = el.thColSignals.querySelector('.sort-arrow');
          const arrowText = arrow ? arrow.textContent : '';
          el.thColSignals.innerHTML = `🇺🇸예상·시그널 <span class="sort-arrow">${arrowText}</span>`;
        }
      } else {
        document.body.classList.remove('market-closed');
        if (state.preset !== 'NEXT_DAY_CANDIDATE' && el.usPredictionCard) {
          el.usPredictionCard.style.display = 'none';
        }
        if (el.btnToggleLive) {
          el.btnToggleLive.classList.remove('closed');
          el.btnToggleLive.classList.toggle('active', state.isLive);
        }
        if (el.liveStatusText) {
          el.liveStatusText.textContent = state.isLive ? 'KRX 실시간 연동중' : '실시간 일시정지';
        }
        if (el.marketClosedBanner) {
          el.marketClosedBanner.style.display = 'none';
        }
        if (el.thColSignals) {
          const arrow = el.thColSignals.querySelector('.sort-arrow');
          const arrowText = arrow ? arrow.textContent : '';
          el.thColSignals.innerHTML = `포착 시그널 <span class="sort-arrow">${arrowText}</span>`;
        }
        if (el.btnSortByUsGap) {
          el.btnSortByUsGap.classList.remove('active');
        }
      }
    } else {
      // 가상 시뮬레이션 모드 (장초반 30분, 오후장 눌림 등)
      document.body.classList.remove('market-closed');
      document.body.classList.remove('next-day-mode');
      if (state.preset !== 'NEXT_DAY_CANDIDATE' && el.usPredictionCard) {
        el.usPredictionCard.style.display = 'none';
      }
      if (el.btnToggleLive) {
        el.btnToggleLive.classList.remove('closed');
        el.btnToggleLive.classList.toggle('active', state.isLive);
      }
      if (el.liveStatusText) {
        el.liveStatusText.textContent = state.isLive ? '시뮬레이션 가동중' : '시뮬레이션 일시정지';
      }
      if (el.marketClosedBanner) {
        el.marketClosedBanner.style.display = 'none';
      }
      if (el.thColSignals) {
        const arrow = el.thColSignals.querySelector('.sort-arrow');
        const arrowText = arrow ? arrow.textContent : '';
        el.thColSignals.innerHTML = `포착 시그널 <span class="sort-arrow">${arrowText}</span>`;
      }
      if (el.btnSortByUsGap) {
        el.btnSortByUsGap.classList.remove('active');
      }
    }
  }

  // 실시간 시세 스트리밍 / 시뮬레이션 루프
  function startRealtimeSimulation() {
    stopRealtimeSimulation();
    updateMarketStatusUI();
    if (!state.isLive) return;

    const scenarioMode = el.selectMarketScenario ? el.selectMarketScenario.value : 'REAL_SNAPSHOT';

    if (scenarioMode === 'REAL_SNAPSHOT') {
      const isMarketOpen = typeof isRegularMarketHoursNow === 'function' ? isRegularMarketHoursNow() : true;

      if (!isMarketOpen) {
        // 장마감 상태: 화면을 계속해서 깜빡이지 않고, 확정 종가 1회 반영 후 불필요한 무한 2초 재렌더링 중단
        if (!state.hasSyncedClosingSnapshot) {
          state.hasSyncedClosingSnapshot = true;
          pollLiveKrxPrices(false);
        }
        // 장마감 시에는 화면 깜빡임을 유발하는 2초 고속 폴링을 멈추고,
        // 익일 개장(09:00) 전환 여부만 30초 주기로 가볍게 체크
        state.timerId = setInterval(() => {
          if (typeof isRegularMarketHoursNow === 'function' && isRegularMarketHoursNow()) {
            state.hasSyncedClosingSnapshot = false;
            startRealtimeSimulation();
          }
        }, 30000);
        return;
      }

      // 정규장 운영 중일 때: 장마감 프리셋이었으면 실시간 코어 프리셋으로 자동 복귀
      if (state.preset === 'NEXT_DAY_CANDIDATE') {
        applyStrategyPreset('RVOL_ORB_BREAKOUT');
      }

      // 2.0초 주기로 실시간 시세 폴링
      pollLiveKrxPrices(false);
      state.timerId = setInterval(() => {
        if (typeof isRegularMarketHoursNow === 'function' && !isRegularMarketHoursNow()) {
          // 장 마감 시간(15:30)에 도달하면 즉시 장마감 모드로 전환하여 깜빡임 정지
          startRealtimeSimulation();
          return;
        }
        pollLiveKrxPrices(false);
      }, state.simIntervalMs);
    } else {
      // 시뮬레이션 시나리오 모드일 때만 가상 호가 틱 구동
      state.timerId = setInterval(() => {
        const { updatedStocks, breakoutAlerts } = engine.simulateRealtimeTicks(110);
        const updatedCodes = new Set(updatedStocks.map(s => s.code));

        if (breakoutAlerts.length > 0) {
          state.liveAlerts.unshift(...breakoutAlerts.slice(0, 3));
          if (state.liveAlerts.length > 20) state.liveAlerts.length = 20;
        }

        refreshAllViews(false, updatedCodes);
      }, state.simIntervalMs);
    }
  }

  function stopRealtimeSimulation() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  // 모바일 3단 뷰 스위처 (스캐너 / 종목상세 / 전략필터)
  function setMobilePanel(panelName) {
    state.mobilePanel = panelName;
    document.body.setAttribute('data-m-panel', panelName);
    document.querySelectorAll('#mobileBottomNav .m-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.panel === panelName);
    });
    if (panelName === 'right') {
      const stock = engine.stockMap.get(state.selectedCode) || engine.stocks[0];
      if (stock) {
        setTimeout(() => {
          drawIntradayChart(stock);
        }, 60);
      }
      const rightPanel = document.querySelector('.right-panel');
      if (rightPanel) rightPanel.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (panelName === 'left') {
      const leftPanel = document.querySelector('.left-panel');
      if (leftPanel) leftPanel.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // 모바일 좌측 패널 서브탭 (전략 / 필터 / 섹터)
  function setMobileLeftTab(ltab) {
    state.mobileLeftTab = ltab;
    document.body.setAttribute('data-m-ltab', ltab);
    document.querySelectorAll('#mLeftSubtabs .m-subtab-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.ltab === ltab);
    });
    const leftPanel = document.querySelector('.left-panel');
    if (leftPanel) leftPanel.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 모바일 우측 상세 패널 서브탭 (시초예측 / 5분차트 / 타점전략 / 전체)
  function setMobileRightTab(rtab) {
    state.mobileRightTab = rtab;
    document.body.setAttribute('data-m-rtab', rtab);
    document.querySelectorAll('#mRightSubtabs .m-subtab-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.rtab === rtab);
    });
    if (rtab === 'chart' || rtab === 'all') {
      const stock = engine.stockMap.get(state.selectedCode) || engine.stocks[0];
      if (stock) {
        setTimeout(() => {
          drawIntradayChart(stock);
        }, 60);
      }
    }
    const rightPanel = document.querySelector('.right-panel');
    if (rightPanel) rightPanel.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 모바일 스캐너 테이블 뷰 토글 (초압축 카드 뷰 vs 전체 표 뷰)
  function toggleMobileCardView() {
    state.mobileCardView = !state.mobileCardView;
    document.body.classList.toggle('m-table-view', !state.mobileCardView);
    if (el.btnToggleMobileTableView) {
      el.btnToggleMobileTableView.innerHTML = state.mobileCardView
        ? `<span class="m-view-icon">📊</span> <span class="m-view-text">표로 보기</span>`
        : `<span class="m-view-icon">📱</span> <span class="m-view-text">카드 뷰</span>`;
      el.btnToggleMobileTableView.classList.toggle('active', !state.mobileCardView);
    }
  }

  // 이벤트 리스너 바인딩
  function bindEvents() {
    // 장마감 배너 토글 버튼
    if (el.btnBannerPresetToggle) {
      el.btnBannerPresetToggle.addEventListener('click', () => {
        if (state.preset === 'NEXT_DAY_CANDIDATE') {
          applyStrategyPreset('ALL_UNIVERSE');
        } else {
          applyStrategyPreset('NEXT_DAY_CANDIDATE');
        }
      });
    }

    // 장마감 배너 🇺🇸 US예상순 정렬 원클릭 버튼
    if (el.btnSortByUsGap) {
      el.btnSortByUsGap.addEventListener('click', () => {
        if (state.sortField === 'usGap') {
          state.sortAsc = !state.sortAsc;
        } else {
          state.sortField = 'usGap';
          state.sortAsc = false; // 높은 예상 갭상승률 우선 정렬
        }

        document.querySelectorAll('.scanner-table th.sortable').forEach(h => {
          const isTarget = h.dataset.sort === 'usGap';
          h.classList.toggle('active-sort', isTarget);
          const arrow = h.querySelector('.sort-arrow');
          if (arrow) {
            arrow.textContent = isTarget ? (state.sortAsc ? '▲' : '▼') : '';
          }
        });

        el.btnSortByUsGap.classList.toggle('active', state.sortField === 'usGap');
        refreshAllViews();
      });
    }

    // 프리셋 클릭
    el.strategyPresetList.addEventListener('click', e => {
      const card = e.target.closest('.preset-card');
      if (!card) return;
      applyStrategyPreset(card.dataset.preset);
    });

    // 필터 초기화
    el.btnResetFilters.addEventListener('click', () => {
      state.market = 'ALL';
      state.sector = 'ALL';
      state.searchQuery = '';
      el.inputStockSearch.value = '';
      el.selectSectorFilter.value = 'ALL';
      document.querySelectorAll('#marketFilterTabs .tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.market === 'ALL');
      });
      applyStrategyPreset('RVOL_ORB_BREAKOUT');
    });

    // 마켓 탭 전환
    el.marketFilterTabs.addEventListener('click', e => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      state.market = btn.dataset.market;
      document.querySelectorAll('#marketFilterTabs .tab-btn').forEach(b => {
        b.classList.toggle('active', b === btn);
      });
      refreshAllViews(true);
    });

    // 섹터 드롭다운 변경
    el.selectSectorFilter.addEventListener('change', () => {
      state.sector = el.selectSectorFilter.value;
      refreshAllViews(true);
    });

    // 좌측 섹터 히트맵 클릭 시 해당 섹터 필터 토글
    el.sectorHeatmapList.addEventListener('click', e => {
      const row = e.target.closest('.sector-row');
      if (!row) return;
      const clickedSec = row.dataset.sector;
      state.sector = state.sector === clickedSec ? 'ALL' : clickedSec;
      el.selectSectorFilter.value = state.sector;
      refreshAllViews(true);
    });

    // 슬라이더 및 숫자 필터
    el.rangeMinRvol.addEventListener('input', () => {
      state.minRvol = Number(el.rangeMinRvol.value);
      syncFilterInputsFromState();
      refreshAllViews();
    });

    el.inputMinChange.addEventListener('change', () => {
      state.minChange = Number(el.inputMinChange.value);
      syncFilterInputsFromState();
      refreshAllViews();
    });

    el.inputMaxChange.addEventListener('change', () => {
      state.maxChange = Number(el.inputMaxChange.value);
      syncFilterInputsFromState();
      refreshAllViews();
    });

    el.rangeMinVolPower.addEventListener('input', () => {
      state.minVolPower = Number(el.rangeMinVolPower.value);
      syncFilterInputsFromState();
      refreshAllViews();
    });

    el.rangeMinScore.addEventListener('input', () => {
      state.minScore = Number(el.rangeMinScore.value);
      syncFilterInputsFromState();
      refreshAllViews();
    });

    // 체크박스 필터
    [
      [el.chkAboveVwap, 'aboveVwap'],
      [el.chkOrbBreakout, 'orbBreakout'],
      [el.chkPrevHighBreak, 'prevHighBreak'],
      [el.chkMaAligned, 'maAligned']
    ].forEach(([chk, key]) => {
      chk.addEventListener('change', () => {
        state[key] = chk.checked;
        refreshAllViews(true);
      });
    });

    // 검색창
    el.inputStockSearch.addEventListener('input', () => {
      state.searchQuery = el.inputStockSearch.value;
      refreshAllViews(true);
    });

    el.btnClearSearch.addEventListener('click', () => {
      state.searchQuery = '';
      el.inputStockSearch.value = '';
      refreshAllViews();
    });

    el.selectPageLimit.addEventListener('change', () => {
      state.pageLimit = Number(el.selectPageLimit.value);
      refreshAllViews();
    });

    // 테이블 정렬 헤더 클릭
    document.querySelectorAll('.scanner-table th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.sort;
        if (state.sortField === field) {
          state.sortAsc = !state.sortAsc;
        } else {
          state.sortField = field;
          state.sortAsc = field === 'name';
        }

        document.querySelectorAll('.scanner-table th.sortable').forEach(h => {
          h.classList.toggle('active-sort', h === th);
          const arrow = h.querySelector('.sort-arrow');
          if (h === th) {
            arrow.textContent = state.sortAsc ? '▲' : '▼';
          } else {
            arrow.textContent = '';
          }
        });

        if (el.btnSortByUsGap) {
          el.btnSortByUsGap.classList.toggle('active', state.sortField === 'usGap');
        }

        refreshAllViews();
      });
    });

    // 테이블 행 클릭(종목 선택) 및 별표(관심종목) 토글
    el.scannerTableBody.addEventListener('click', e => {
      const starBtn = e.target.closest('.btn-star');
      if (starBtn) {
        e.stopPropagation();
        const code = starBtn.dataset.star;
        if (state.watchlist.has(code)) state.watchlist.delete(code);
        else state.watchlist.add(code);
        localStorage.setItem('alphaPulseWatchlist', JSON.stringify([...state.watchlist]));
        refreshAllViews();
        return;
      }

      const tr = e.target.closest('tr[data-code]');
      if (!tr) return;
      state.selectedCode = tr.dataset.code;
      refreshAllViews();
      const rightPanel = document.querySelector('.right-panel');
      if (rightPanel) rightPanel.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.innerWidth <= 900) {
        setMobilePanel('right');
      }
    });

    // 상단 실시간 돌파 티커 클릭 시 해당 종목 상세로 이동
    el.liveAlertTrack.addEventListener('click', e => {
      const pill = e.target.closest('.alert-pill');
      if (!pill) return;
      state.selectedCode = pill.dataset.code;
      renderStockDetail();
      // 테이블 행 하이라이트 갱신
      document.querySelectorAll('#scannerTableBody tr').forEach(tr => {
        tr.classList.toggle('selected-row', tr.dataset.code === state.selectedCode);
      });
      const rightPanel = document.querySelector('.right-panel');
      if (rightPanel) rightPanel.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.innerWidth <= 900) {
        setMobilePanel('right');
      }
    });

    // KRX 전체 1,381종목 실시간 시세 즉시 강제 동기화 버튼
    if (el.btnResetRealPrice) {
      el.btnResetRealPrice.addEventListener('click', () => {
        pollLiveKrxPrices(true);
      });
    }

    // 실시간 시세 스트리밍 토글 및 속도/시나리오 변경
    el.btnToggleLive.addEventListener('click', () => {
      state.isLive = !state.isLive;
      updateMarketStatusUI();
      if (state.isLive) startRealtimeSimulation();
      else stopRealtimeSimulation();
    });

    el.selectSimSpeed.addEventListener('change', () => {
      state.simIntervalMs = Number(el.selectSimSpeed.value);
      if (state.isLive) startRealtimeSimulation();
    });

    el.selectMarketScenario.addEventListener('change', () => {
      const mode = el.selectMarketScenario.value;
      const isMarketOpen = typeof isRegularMarketHoursNow === 'function' ? isRegularMarketHoursNow() : true;
      if (mode !== 'REAL_SNAPSHOT' && state.preset === 'NEXT_DAY_CANDIDATE') {
        applyStrategyPreset('RVOL_ORB_BREAKOUT');
      } else if (mode === 'REAL_SNAPSHOT' && !isMarketOpen && state.preset !== 'NEXT_DAY_CANDIDATE') {
        applyStrategyPreset('NEXT_DAY_CANDIDATE');
      }
      engine.initUniverse(mode);
      state.liveAlerts = [];
      refreshAllViews(true);
      updateMarketStatusUI();
      if (state.isLive) startRealtimeSimulation();
    });

    // 주문수량 계산기 입력 연동
    el.inputAccountSize.addEventListener('input', () => {
      const stock = engine.stockMap.get(state.selectedCode);
      if (stock) updatePositionCalculator(stock);
    });
    el.inputRiskPct.addEventListener('input', () => {
      const stock = engine.stockMap.get(state.selectedCode);
      if (stock) updatePositionCalculator(stock);
    });

    // 창 크기 변경 시 차트 재렌더링 및 태블릿 사이드바 자동 반응형 조절
    let userManuallyToggledSidebar = false;
    window.addEventListener('resize', () => {
      if (!userManuallyToggledSidebar && el.workspaceGrid && el.btnToggleLeftPanel) {
        if (window.innerWidth <= 1200 && window.innerWidth > 900) {
          el.workspaceGrid.classList.add('left-collapsed');
          el.btnToggleLeftPanel.classList.add('active');
        } else if (window.innerWidth > 1200) {
          el.workspaceGrid.classList.remove('left-collapsed');
          el.btnToggleLeftPanel.classList.remove('active');
        }
      }
      const stock = engine.stockMap.get(state.selectedCode);
      if (stock) drawIntradayChart(stock);
    });

    // 좌측 전략·필터 사이드바 접기/펼치기 토글 (태블릿 & 데스크톱 스캐너 최대화)
    if (el.btnToggleLeftPanel && el.workspaceGrid) {
      el.btnToggleLeftPanel.addEventListener('click', () => {
        userManuallyToggledSidebar = true;
        const isCollapsed = el.workspaceGrid.classList.toggle('left-collapsed');
        el.btnToggleLeftPanel.classList.toggle('active', isCollapsed);
        el.btnToggleLeftPanel.title = isCollapsed ? '전략·필터 패널 펼치기' : '전략·필터 사이드바 접기 (스캐너 최대화)';
      });

      // 태블릿(901px ~ 1200px)에서는 진입 시 기본으로 사이드바를 접어 중앙 스캐너 영역을 넓게 확보
      if (window.innerWidth <= 1200 && window.innerWidth > 900) {
        el.workspaceGrid.classList.add('left-collapsed');
        el.btnToggleLeftPanel.classList.add('active');
        el.btnToggleLeftPanel.title = '전략·필터 패널 펼치기';
      }
    }

    // CSV 내보내기
    el.btnExportCsv.addEventListener('click', () => {
      const filtered = getFilteredAndSortedStocks();
      const headers = ['종목코드', '종목명', '시장', '섹터', '현재가', '등락률(%)', 'RVOL(배)', '체결강도(%)', 'VWAP', 'ORB고점', 'AI타점점수', '권장진입가', '1차목표가', '손절기준선'];
      const rows = filtered.map(s => [
        `="${s.code}"`,
        s.name,
        s.market,
        s.sector,
        s.price,
        s.changePct,
        s.rvol,
        s.volPower,
        s.vwap,
        s.orbHigh,
        s.score,
        s.tradePlan.entryPrice,
        s.tradePlan.target1Price,
        s.tradePlan.stopLossPrice
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daytrading_scan_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // 외부 CSV/JSON 모달 제어
    el.btnOpenImportModal.addEventListener('click', () => {
      el.importModalBackdrop.classList.remove('hidden');
    });
    const closeModal = () => el.importModalBackdrop.classList.add('hidden');
    el.btnCloseImportModal.addEventListener('click', closeModal);
    el.btnCancelImport.addEventListener('click', closeModal);

    el.btnLoadSampleData.addEventListener('click', () => {
      el.textareaImportData.value = [
        '종목코드,종목명,시장,섹터,현재가,등락률,거래량',
        '005930,삼성전자,KOSPI,반도체/장비,209000,0.48,12822005',
        '000660,SK하이닉스,KOSPI,반도체/장비,1233000,-1.67,3199812',
        '042700,한미반도체,KOSPI,반도체/장비,182400,0.27,503592',
        '105560,KB금융,KOSPI,금융/지주,158000,4.08,651807',
        '055550,신한지주,KOSPI,금융/지주,89800,5.65,913692'
      ].join('\n');
    });

    el.inputCsvFile.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        el.textareaImportData.value = ev.target.result;
      };
      reader.readAsText(file, 'utf-8');
    });

    el.btnConfirmImport.addEventListener('click', () => {
      const raw = el.textareaImportData.value.trim();
      if (!raw) return;

      let records = [];
      if (raw.startsWith('[') || raw.startsWith('{')) {
        try {
          const parsed = JSON.parse(raw);
          records = Array.isArray(parsed) ? parsed : [parsed];
        } catch (err) {
          alert('JSON 구문 오류입니다: ' + err.message);
          return;
        }
      } else {
        const lines = raw.split(/\r?\n/).filter(Boolean);
        if (lines.length >= 2) {
          const headers = lines[0].split(',').map(h => h.trim());
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim());
            const obj = {};
            headers.forEach((h, idx) => {
              obj[h] = cols[idx];
            });
            records.push(obj);
          }
        }
      }

      const count = engine.importExternalData(records);
      closeModal();
      if (count > 0) {
        state.selectedCode = String(records[0].code || records[0]['종목코드']).trim().padStart(6, '0');
        refreshAllViews(false);
      }
    });

    // 🇺🇸 미 증시 시나리오 프리셋 버튼 제어
    document.querySelectorAll('.btn-scenario').forEach(btn => {
      btn.addEventListener('click', () => {
        const scenario = btn.dataset.scenario;
        if (!window.US_PREDICTOR) return;

        window.US_PREDICTOR.scenario = scenario;
        window.US_PREDICTOR.sliderOffset = 0;

        document.querySelectorAll('.btn-scenario').forEach(b => {
          b.classList.toggle('active', b === btn);
        });

        if (el.usScenarioSlider) el.usScenarioSlider.value = 0;
        if (el.usSliderValDisplay) el.usSliderValDisplay.textContent = '±0.0%';

        const session = typeof window.US_PREDICTOR?.getUsMarketSession === 'function'
          ? window.US_PREDICTOR.getUsMarketSession()
          : { isPre: false, isRegular: true, badgeText: '본장 LIVE', sessionName: '본장' };

        const liveLabel = session.isPre ? '실시간 프리마켓 시세'
                        : session.isRegular ? '실시간 본장 시세'
                        : session.isAfter ? '실시간 애프터마켓 시세'
                        : '미 증시 최종 종가';

        const labels = {
          LIVE: liveLabel,
          BULL_STRONG: '미 증시 랠리 (+2.5%)',
          FLAT: '보합/혼조세 (0.0%)',
          BEAR_TECH: '기술주 급락 (-3.5%)'
        };
        if (el.usScenarioLabel) el.usScenarioLabel.textContent = labels[scenario] || scenario;

        if (el.bannerUsBar && window.US_PREDICTOR) {
          el.bannerUsBar.innerHTML = window.US_PREDICTOR.buildUsTickerHtml();
        }
        const currentStock = engine.stockMap.get(state.selectedCode);
        if (currentStock) renderUsPredictionCard(currentStock);
        refreshAllViews();
      });
    });

    // 🇺🇸 미 증시 슬라이더 조절
    if (el.usScenarioSlider) {
      el.usScenarioSlider.addEventListener('input', e => {
        if (!window.US_PREDICTOR) return;
        const val = parseFloat(e.target.value) / 10;
        window.US_PREDICTOR.scenario = 'CUSTOM';
        window.US_PREDICTOR.sliderOffset = val;

        document.querySelectorAll('.btn-scenario').forEach(b => b.classList.remove('active'));
        if (el.usSliderValDisplay) {
          el.usSliderValDisplay.textContent = `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
        }
        if (el.usScenarioLabel) {
          el.usScenarioLabel.textContent = `사용자 정의 (${val >= 0 ? '+' : ''}${val.toFixed(1)}%)`;
        }

        if (el.bannerUsBar && window.US_PREDICTOR) {
          el.bannerUsBar.innerHTML = window.US_PREDICTOR.buildUsTickerHtml();
        }
        const currentStock = engine.stockMap.get(state.selectedCode);
        if (currentStock) renderUsPredictionCard(currentStock);
        refreshAllViews();
      });
    }

    // 🇺🇸 미 증시 시세 새로고침 버튼
    if (el.btnRefreshUsMarket) {
      el.btnRefreshUsMarket.addEventListener('click', async () => {
        if (!window.US_PREDICTOR) return;
        el.btnRefreshUsMarket.textContent = '동기화중';
        el.btnRefreshUsMarket.disabled = true;

        await window.US_PREDICTOR.syncLatestUsMarketQuotes();

        el.btnRefreshUsMarket.textContent = '✓ 완료';
        setTimeout(() => {
          el.btnRefreshUsMarket.textContent = '🔄 동기화';
          el.btnRefreshUsMarket.disabled = false;
        }, 1200);

        if (el.bannerUsBar && window.US_PREDICTOR) {
          el.bannerUsBar.innerHTML = window.US_PREDICTOR.buildUsTickerHtml();
        }
        const currentStock = engine.stockMap.get(state.selectedCode);
        if (currentStock) renderUsPredictionCard(currentStock);
        refreshAllViews();
      });
    }

    // 모바일 하단 탭 내비게이션 바
    if (el.mobileBottomNav) {
      el.mobileBottomNav.addEventListener('click', e => {
        const item = e.target.closest('.m-nav-item');
        if (!item || !item.dataset.panel) return;
        setMobilePanel(item.dataset.panel);
      });
    }

    // 모바일 뒤로가기 버튼
    if (el.btnMobileBackToScanner) {
      el.btnMobileBackToScanner.addEventListener('click', () => {
        setMobilePanel('center');
      });
    }

    // 모바일 좌측 전략/필터 패널 "스캐너 결과 보기" 버튼
    if (el.btnMobileApplyAndSeeScanner) {
      el.btnMobileApplyAndSeeScanner.addEventListener('click', () => {
        setMobilePanel('center');
      });
    }

    // 모바일 좌측 서브탭 (전략 / 필터 / 섹터)
    if (el.mLeftSubtabs) {
      el.mLeftSubtabs.addEventListener('click', e => {
        const btn = e.target.closest('.m-subtab-pill');
        if (!btn || !btn.dataset.ltab) return;
        setMobileLeftTab(btn.dataset.ltab);
      });
    }

    // 모바일 우측 상세 서브탭 (시초예측 / 5분차트 / 타점전략 / 전체)
    if (el.mRightSubtabs) {
      el.mRightSubtabs.addEventListener('click', e => {
        const btn = e.target.closest('.m-subtab-pill');
        if (!btn || !btn.dataset.rtab) return;
        setMobileRightTab(btn.dataset.rtab);
      });
    }

    // 모바일 간편 카드 뷰 vs 전체 표 뷰 토글
    if (el.btnToggleMobileTableView) {
      el.btnToggleMobileTableView.addEventListener('click', () => {
        toggleMobileCardView();
      });
    }

    // 퀵 필터 칩 바 (전체 / 급등 / 대금500억 / RVOL 2x / 관심종목 / 내일공략)
    if (el.scannerQuickChips) {
      el.scannerQuickChips.addEventListener('click', (e) => {
        const btn = e.target.closest('.quick-chip');
        if (!btn) return;
        const chip = btn.dataset.chip;
        state.quickFilter = (state.quickFilter === chip && chip !== 'all') ? 'all' : chip;

        el.scannerQuickChips.querySelectorAll('.quick-chip').forEach(b => {
          b.classList.toggle('active', b.dataset.chip === state.quickFilter);
        });

        if (state.quickFilter === 'tomorrow') {
          applyStrategyPreset('NEXT_DAY_CANDIDATE');
        } else if (state.preset === 'NEXT_DAY_CANDIDATE' && state.quickFilter === 'all') {
          applyStrategyPreset('ALL_UNIVERSE');
        } else {
          refreshAllViews(true);
        }
      });
    }

    // 🇺🇸 익일 시초가 예측 및 AI 전략 클립보드 원클릭 복사
    if (el.btnCopyUsStrategy) {
      el.btnCopyUsStrategy.addEventListener('click', () => {
        const stock = engine.stocks.find(s => s.code === state.selectedCode);
        if (!stock) return;

        const pred = window.usMarketPredictor?.calculatePredictedOpeningPrice(stock);
        const primaryDriver = window.usMarketPredictor?.getPrimaryDriverForStock(stock);
        const isUp = pred ? pred.predictedGapPct >= 0 : false;
        const gapSign = isUp ? '+' : '';

        const textLines = [
          `📊 [${stock.name} (${stock.code})] 미 증시 연동 익일 시초가 리포트`,
          `• 당일 종가: ${stock.price.toLocaleString()}원 (${stock.changePct >= 0 ? '+' : ''}${stock.changePct.toFixed(2)}%)`,
          pred ? `• 익일 예상 시초가: ${pred.predictedPrice.toLocaleString()}원 (${gapSign}${pred.predictedGapPct}% ${pred.gapDirection})` : '',
          pred ? `• 예상 시초가 밴드: ${pred.expectedBand.min.toLocaleString()}원 ~ ${pred.expectedBand.max.toLocaleString()}원 (신뢰도 ${pred.confidence}%)` : '',
          primaryDriver ? `• 1순위 핵심 연동주: ${primaryDriver.name} ($${primaryDriver.price}, ${primaryDriver.changePct >= 0 ? '+' : ''}${primaryDriver.changePct}%)` : '',
          `• 당일 거래대금: ${formatTurnover(stock.turnoverEok)} | RVOL: ${stock.rvol}x | 체결강도: ${stock.volPower}%`,
          `• AI 전략: ${el.usAiStrategyBox ? el.usAiStrategyBox.textContent.trim() : ''}`,
          `— ALPHA PULSE PRO 데이트레이딩 시스템`
        ].filter(Boolean);

        const fullText = textLines.join('\n');
        copyTextToClipboard(fullText, '📋 익일 시초가 예측 & 전략이 클립보드에 복사되었습니다!');
      });
    }

    // 5분봉 캔버스 인터랙티브 크로스헤어 & 툴팁 호버
    if (el.intradayChartCanvas) {
      function handleCanvasHover(evt) {
        const stock = engine.stockMap.get(state.selectedCode) || engine.stocks[0];
        if (!stock || !stock.candles || stock.candles.length === 0) return;

        const rect = el.intradayChartCanvas.getBoundingClientRect();
        const clientX = (evt.touches && evt.touches[0]) ? evt.touches[0].clientX : evt.clientX;
        const mouseX = clientX - rect.left;

        const padLeft = 10;
        const padRight = 58;
        const plotW = (rect.width || 400) - padLeft - padRight;
        
        const isMarketOpen = typeof isRegularMarketHoursNow === 'function' ? isRegularMarketHoursNow() : false;
        const n = stock.candles.length;
        const lastSlot = typeof stock.candles[n - 1].slotIdx === 'number' ? stock.candles[n - 1].slotIdx : n - 1;
        const isZoomMode = state.chartZoom !== 'full' && isMarketOpen && lastSlot < 72;
        const totalDaySlots = isZoomMode ? Math.min(79, Math.max(16, lastSlot + 4)) : 79;

        const rawSlot = ((mouseX - padLeft) / plotW) * totalDaySlots - 0.5;
        const slot = Math.round(rawSlot);

        let closestIdx = -1;
        let minDiff = Infinity;
        stock.candles.forEach((c, idx) => {
          const sIdx = typeof c.slotIdx === 'number' ? c.slotIdx : idx;
          const diff = Math.abs(sIdx - slot);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
          }
        });

        if (closestIdx !== -1 && minDiff <= 3) {
          drawIntradayChart(stock, closestIdx);
        } else {
          drawIntradayChart(stock, null);
        }
      }

      el.intradayChartCanvas.addEventListener('mousemove', handleCanvasHover);
      el.intradayChartCanvas.addEventListener('mouseleave', () => {
        const stock = engine.stockMap.get(state.selectedCode) || engine.stocks[0];
        if (stock) drawIntradayChart(stock, null);
      });
      el.intradayChartCanvas.addEventListener('touchmove', handleCanvasHover, { passive: true });
      el.intradayChartCanvas.addEventListener('touchend', () => {
        const stock = engine.stockMap.get(state.selectedCode) || engine.stocks[0];
        if (stock) drawIntradayChart(stock, null);
      });
    }

    // 5분봉 캔버스 장중 세션 확대 / 전체 79봉 전환 버튼
    if (el.btnToggleChartZoom) {
      el.btnToggleChartZoom.addEventListener('click', () => {
        state.chartZoom = state.chartZoom === 'full' ? 'auto' : 'full';
        const stock = engine.stockMap.get(state.selectedCode) || engine.stocks[0];
        if (stock) drawIntradayChart(stock, null);
      });
    }

    // 데이트레이더 전용 단축키 네비게이션
    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      const isEditing = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT' ||
        activeEl.isContentEditable
      );

      if (e.key === 'Escape') {
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
          activeEl.blur();
        }
        if (state.searchQuery) {
          state.searchQuery = '';
          if (el.inputStockSearch) el.inputStockSearch.value = '';
          refreshAllViews();
        }
        return;
      }

      if (isEditing) return;

      if (e.key === '/') {
        e.preventDefault();
        if (el.inputStockSearch) {
          el.inputStockSearch.focus();
          el.inputStockSearch.select();
        }
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        if (state.selectedCode) {
          toggleWatchlist(state.selectedCode);
          refreshAllViews();
          showToast(state.watchlist.has(state.selectedCode)
            ? `★ 관심종목에 추가되었습니다 (${state.selectedCode})`
            : `☆ 관심종목에서 해제되었습니다 (${state.selectedCode})`);
        }
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const list = getFilteredAndSortedStocks();
        if (list.length === 0) return;

        let idx = list.findIndex(s => s.code === state.selectedCode);
        if (idx === -1) idx = 0;
        else if (e.key === 'ArrowDown') idx = Math.min(list.length - 1, idx + 1);
        else if (e.key === 'ArrowUp') idx = Math.max(0, idx - 1);

        state.selectedCode = list[idx].code;
        refreshAllViews();

        const row = document.querySelector(`tr[data-code="${state.selectedCode}"]`);
        if (row) {
          row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        return;
      }
    });
  }

  function showToast(msg) {
    let toast = document.getElementById('appToastNotice');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appToastNotice';
      toast.className = 'app-toast-notice';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  function copyTextToClipboard(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMsg);
      }).catch(() => {
        fallbackCopyText(text, successMsg);
      });
    } else {
      fallbackCopyText(text, successMsg);
    }
  }

  function fallbackCopyText(text, successMsg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      showToast(successMsg);
    } catch (err) {
      alert('복사에 실패했습니다. 권한을 확인해주세요.');
    }
    document.body.removeChild(ta);
  }

  // 초기 구동
  const isMarketOpenNow = typeof isRegularMarketHoursNow === 'function' ? isRegularMarketHoursNow() : true;
  updateMarketStatusUI();
  if (el.brandSnapshotSubtitle) {
    if (!isMarketOpenNow) {
      el.brandSnapshotSubtitle.textContent = `KRX 정규장 마감 · 최종 종가 확정 (${window.REAL_KRX_SNAPSHOT_TIME || '마감'} 기준)`;
    } else {
      el.brandSnapshotSubtitle.textContent = `KRX 정규장 실시간 연동중 (09:00 ~ 15:30)`;
    }
  }
  populateSectorOptions();
  bindEvents();

  // 모바일 기본 패널 및 서브탭 초기 세팅
  setMobilePanel('center');
  setMobileLeftTab('presets');
  setMobileRightTab(!isMarketOpenNow ? 'us-predict' : 'chart');

  // 장마감 시간에는 자동으로 "내일 공략 후보(종가&시초가)" 화면으로 자동 전환 시작!
  // 정규장 중에는 기본 "거래량 급증 + 변동성 돌파" 화면으로 시작
  if (!isMarketOpenNow) {
    applyStrategyPreset('NEXT_DAY_CANDIDATE');
  } else {
    applyStrategyPreset('RVOL_ORB_BREAKOUT');
  }

  window.appSelectStock = function(code) {
    if (engine && engine.stockMap.has(code)) {
      state.selectedCode = code;
      refreshAllViews();
    }
  };

  startRealtimeSimulation();
})();
