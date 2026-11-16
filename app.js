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
    simIntervalMs: 2000,
    timerId: null,
    pollChunkIndex: 0,
    jsonpSeq: 0,
    watchlist: new Set(JSON.parse(localStorage.getItem('alphaPulseWatchlist') || '["005930","000660","042700","105560","055550"]')),
    liveAlerts: []
  };

  // DOM 참조
  const el = {
    brandSnapshotSubtitle: document.getElementById('brandSnapshotSubtitle'),
    btnResetRealPrice: document.getElementById('btnResetRealPrice'),
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
    scannerResultCount: document.getElementById('scannerResultCount'),
    scannerTotalCount: document.getElementById('scannerTotalCount'),
    selectPageLimit: document.getElementById('selectPageLimit'),
    scannerTableBody: document.getElementById('scannerTableBody'),
    // 우측 상세 패널
    detailMarketBadge: document.getElementById('detailMarketBadge'),
    detailSectorBadge: document.getElementById('detailSectorBadge'),
    detailStockName: document.getElementById('detailStockName'),
    detailStockCode: document.getElementById('detailStockCode'),
    detailStockPrice: document.getElementById('detailStockPrice'),
    detailStockChange: document.getElementById('detailStockChange'),
    detailSignalBadges: document.getElementById('detailSignalBadges'),
    intradayChartCanvas: document.getElementById('intradayChartCanvas'),
    detailRvol: document.getElementById('detailRvol'),
    detailVolPower: document.getElementById('detailVolPower'),
    detailVwap: document.getElementById('detailVwap'),
    detailOrbHigh: document.getElementById('detailOrbHigh'),
    detailLarryTarget: document.getElementById('detailLarryTarget'),
    detailRsiGap: document.getElementById('detailRsiGap'),
    detailRrBadge: document.getElementById('detailRrBadge'),
    planEntryPrice: document.getElementById('planEntryPrice'),
    planTarget1Price: document.getElementById('planTarget1Price'),
    planTarget2Price: document.getElementById('planTarget2Price'),
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

    document.querySelectorAll('.preset-card').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === presetKey);
    });

    if (presetKey === 'RVOL_ORB_BREAKOUT') {
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

      // 눌림목 프리셋일 경우 VWAP 근처 지지 반등 조건 추가 적용
      if (state.preset === 'VWAP_PULLBACK_BOUNCE') {
        const nearVwap = Math.abs(s.vwapDiffPct) <= 2.2;
        const hasUpperPullback = s.high > s.price * 1.01;
        if (!nearVwap || !hasUpperPullback) return false;
      }

      return true;
    });

    const field = state.sortField;
    const dir = state.sortAsc ? 1 : -1;

    filtered.sort((a, b) => {
      if (field === 'name') return a.name.localeCompare(b.name, 'ko') * dir;
      return ((a[field] || 0) - (b[field] || 0)) * dir;
    });

    return filtered;
  }

  // 스파크라인 SVG 생성기
  function buildSparklineSvg(prices, isUp) {
    const w = 68;
    const h = 22;
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

  // 중앙 스캐너 테이블 렌더링
  function renderScannerTable(filteredStocks, highlightTickSet = null) {
    const totalUniverse = engine.stocks.length;
    el.scannerResultCount.textContent = filteredStocks.length.toLocaleString();
    el.scannerTotalCount.textContent = totalUniverse.toLocaleString();
    el.kpiTotalUniverse.textContent = `${totalUniverse.toLocaleString()}종목`;
    el.kpiMatchedCount.textContent = `${filteredStocks.length.toLocaleString()}종목`;

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
      if (highlightTickSet && highlightTickSet.has(s.code)) {
        tickClass = s.lastTickDir > 0 ? 'tick-up' : s.lastTickDir < 0 ? 'tick-down' : '';
      }

      const rvolCls = s.rvol >= 2.5 ? 'extreme' : s.rvol >= 1.7 ? 'high' : 'normal';
      const vwapSign = s.vwapDiffPct > 0 ? '+' : '';
      const vwapCls = s.vwapDiffPct >= 0 ? 'up-color' : 'down-color';

      const scoreCls =
        s.score >= 85 ? 's-top' : s.score >= 75 ? 's-high' : s.score >= 60 ? 's-mid' : 's-low';

      const sigHtml = s.signals
        .slice(0, 2)
        .map(sig => `<span class="sig-badge ${sig.type}">${sig.label}</span>`)
        .join('');

      rowsHtml.push(`
        <tr data-code="${s.code}" class="${isSelected ? 'selected-row' : ''} ${tickClass}">
          <td class="text-center">
            <button class="btn-star ${isStarred ? 'starred' : ''}" data-star="${s.code}" title="관심종목 토글">
              ${isStarred ? '★' : '☆'}
            </button>
          </td>
          <td>
            <div class="stock-cell-main">
              <div class="stock-name-line">
                <span class="mini-mkt ${s.market.toLowerCase()}">${s.market}</span>
                <span>${s.name}</span>
              </div>
              <div class="stock-sub-line mono">${s.code} · ${s.sector}</div>
            </div>
          </td>
          <td class="text-right mono ${colorCls}"><strong>${s.price.toLocaleString()}</strong></td>
          <td class="text-right mono ${colorCls}"><strong>${sign}${s.changePct.toFixed(2)}%</strong></td>
          <td class="text-right mono"><span class="rvol-pill ${rvolCls}">${s.rvol.toFixed(2)}x</span></td>
          <td class="text-right mono ${s.volPower >= 110 ? 'up-color' : ''}">${s.volPower.toFixed(1)}%</td>
          <td class="text-right mono ${vwapCls}">${vwapSign}${s.vwapDiffPct.toFixed(2)}%</td>
          <td class="text-right mono">${s.turnoverEok.toLocaleString()}억</td>
          <td class="text-center">${buildSparklineSvg(s.sparkline, s.changePct >= 0)}</td>
          <td><div class="signal-tags-wrap">${sigHtml || '<span class="stock-sub-line">관망/일반흐름</span>'}</div></td>
          <td class="text-center mono"><span class="score-pill ${scoreCls}">${s.score}</span></td>
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

  // 우측 선택 종목 상세 정보 및 캔버스 차트 렌더링
  function renderStockDetail() {
    const stock = engine.stockMap.get(state.selectedCode) || engine.stocks[0];
    if (!stock) return;

    el.detailMarketBadge.textContent = stock.market;
    el.detailSectorBadge.textContent = stock.sector;
    el.detailStockName.textContent = stock.name;
    el.detailStockCode.textContent = stock.code;

    const isUp = stock.changePct > 0;
    const isDown = stock.changePct < 0;
    const colorCls = isUp ? 'up-color' : isDown ? 'down-color' : '';
    const arrow = isUp ? '▲' : isDown ? '▼' : '-';
    const sign = isUp ? '+' : '';

    el.detailStockPrice.className = `detail-price mono ${colorCls}`;
    el.detailStockPrice.textContent = `${stock.price.toLocaleString()}원`;

    el.detailStockChange.className = `detail-change mono ${colorCls}`;
    el.detailStockChange.textContent = `${arrow} ${Math.abs(stock.change).toLocaleString()}원 (${sign}${stock.changePct.toFixed(2)}%)`;

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

    // 데이트레이딩 타점 플랜
    const plan = stock.tradePlan;
    el.detailRrBadge.textContent = `손익비 ${plan.rrRatio} · AI ${stock.score}점`;
    el.planEntryPrice.textContent = `${plan.entryPrice.toLocaleString()}원`;
    el.planTarget1Price.textContent = `${plan.target1Price.toLocaleString()}원 (+${plan.target1Pct}%)`;
    const target2Pct = (((plan.target2Price - plan.entryPrice) / plan.entryPrice) * 100).toFixed(2);
    el.planTarget2Price.textContent = `${plan.target2Price.toLocaleString()}원 (+${target2Pct}%)`;
    el.planStopPrice.textContent = `${plan.stopLossPrice.toLocaleString()}원 (${plan.stopLossPct}%)`;

    updatePositionCalculator(stock);
    renderAiCommentary(stock);
    drawIntradayChart(stock);
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
    const parts = [];
    parts.push(`<strong>[${stock.name} (${stock.code})]</strong> 현재 평소 동시간대 대비 <strong>${stock.rvol}배(RVOL)</strong>의 거래량이 유입되며 `);

    if (stock.isOrbBreakout && stock.price >= stock.vwap) {
      parts.push(`장초반 30분 고점인 <strong>ORB 저항선(${stock.orbHigh.toLocaleString()}원)</strong>과 <strong>VWAP(${stock.vwap.toLocaleString()}원)</strong> 위에서 강한 돌파 흐름을 유지하고 있습니다. `);
    } else if (stock.price >= stock.vwap) {
      parts.push(`당일 거래량가중평균가(VWAP ${stock.vwap.toLocaleString()}원) 상단에서 매수 우위(체결강도 ${stock.volPower}%) 흐름을 보이고 있습니다. `);
    } else {
      parts.push(`VWAP(${stock.vwap.toLocaleString()}원) 하단에 위치해 있어 VWAP 탈환 및 거래량 동반 여부를 먼저 확인하는 것이 안전합니다. `);
    }

    if (stock.isPrevHighBreakout) {
      parts.push(`특히 <strong>전일 고가(${stock.prevHigh.toLocaleString()}원)</strong> 매물대를 소화하며 신고가 영역에 진입해 단기 데이트레이딩 모멘텀이 매우 강합니다.`);
    } else {
      parts.push(`손절 기준선인 <strong>${stock.tradePlan.stopLossPrice.toLocaleString()}원</strong> 이탈 시 칼손절 대응을 권장합니다.`);
    }

    el.detailAiCommentary.innerHTML = parts.join('');
  }

  // 캔버스 기반 장중 5분봉 + VWAP + ORB 고점 + 전일고가 + 거래량 차트 렌더링
  function drawIntradayChart(stock) {
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

    // X축은 정규장 78슬롯(09:00 ~ 15:30) 고정 타임라인으로 배치하고,
    // 캔들은 현재 시각(n개)까지만 그려서 미래의 5분봉은 비워둠
    const totalDaySlots = 78;
    const yOfPrice = p => padTop + ((maxP - p) / priceSpan) * (priceAreaH - padTop);
    const xOfIdx = i => padLeft + ((i + 0.5) / totalDaySlots) * plotW;

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
    if (yOrb >= padTop && yOrb <= priceAreaH) {
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(padLeft, yOrb);
      ctx.lineTo(width - padRight, yOrb);
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('ORB고점', padLeft + 4, yOrb - 3);
      ctx.restore();
    }

    // 2) 전일 고가 수평 점선 (보라색)
    const yPrevH = yOfPrice(stock.prevHigh);
    if (yPrevH >= padTop && yPrevH <= priceAreaH) {
      ctx.save();
      ctx.setLineDash([2, 3]);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.75)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(padLeft, yPrevH);
      ctx.lineTo(width - padRight, yPrevH);
      ctx.stroke();
      ctx.fillStyle = '#c084fc';
      ctx.fillText('전일고가', padLeft + 52, yPrevH - 3);
      ctx.restore();
    }

    // 2.6) 현재 시각 진행 위치 표시선 (장중일 때 현재 봉의 실제 slotIdx 위치 강조)
    const lastSlot = typeof candles[n - 1].slotIdx === 'number' ? candles[n - 1].slotIdx : n - 1;
    if (lastSlot < totalDaySlots - 1) {
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

    // 3) 5분봉 캔들 및 하단 거래량 바 렌더링 (각 캔들의 고유 시간 슬롯 c.slotIdx 위치에 정확히 렌더링)
    const candleW = Math.max(2.6, (plotW / totalDaySlots) * 0.72);

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

    // 4) MA5 곡선 (에메랄드 - 실제 시간 슬롯 위치로 연결)
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

    // 5) VWAP 곡선 (골드 굵은 실선 - 실제 시간 슬롯 위치로 연결)
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

    // 하단 시간 축 라벨 (09:00 ~ 15:30 정규장 78슬롯 고정 눈금)
    ctx.fillStyle = '#64748b';
    const fixedTimeTicks = [
      [0, '09:00'],
      [12, '10:00'],
      [24, '11:00'],
      [36, '12:00'],
      [48, '13:00'],
      [60, '14:00'],
      [77, '15:30']
    ];
    for (const [slotIdx, label] of fixedTimeTicks) {
      const x = xOfIdx(slotIdx);
      const offset = slotIdx === 0 ? 0 : slotIdx === 77 ? 26 : 14;
      ctx.fillText(label, x - offset, height - 2);
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

  // 현재 화면의 포착 종목 + 선택 종목 + 전체 유니버스 순환 배치를 실시간 KRX 시세로 갱신
  async function pollLiveKrxPrices(forceFullSweep = false) {
    if (forceFullSweep) {
      // 전체 1,381개 종목을 180개씩 나누어 병렬/순차 고속 동기화
      const allCodes = engine.stocks.map(s => s.code);
      const chunkSize = 180;
      const allUpdatedCodes = new Set();

      if (el.brandSnapshotSubtitle) {
        el.brandSnapshotSubtitle.textContent = 'KRX 전체 1,381종목 실시간 시세 동기화 중...';
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
      if (el.brandSnapshotSubtitle) {
        el.brandSnapshotSubtitle.textContent = `KRX 실시간 연동중 (최근 전체동기화: ${nowStr})`;
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
      if (el.brandSnapshotSubtitle) {
        el.brandSnapshotSubtitle.textContent = `KRX 실시간 스트리밍 (${nowStr} · 변동 ${updatedCodes.size}종목)`;
      }
      refreshAllViews(false, updatedCodes);
    }
  }

  // 실시간 시세 스트리밍 / 시뮬레이션 루프
  function startRealtimeSimulation() {
    stopRealtimeSimulation();
    if (!state.isLive) return;

    const scenarioMode = el.selectMarketScenario ? el.selectMarketScenario.value : 'REAL_SNAPSHOT';

    if (scenarioMode === 'REAL_SNAPSHOT') {
      // 즉시 1회 실시간 시세 폴링 후 주기적 실행
      pollLiveKrxPrices(false);
      state.timerId = setInterval(() => {
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

  // 이벤트 리스너 바인딩
  function bindEvents() {
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
      el.btnToggleLive.classList.toggle('active', state.isLive);
      el.liveStatusText.textContent = state.isLive ? 'KRX 실시간 연동중' : '실시간 일시정지';
      if (state.isLive) startRealtimeSimulation();
      else stopRealtimeSimulation();
    });

    el.selectSimSpeed.addEventListener('change', () => {
      state.simIntervalMs = Number(el.selectSimSpeed.value);
      if (state.isLive) startRealtimeSimulation();
    });

    el.selectMarketScenario.addEventListener('change', () => {
      const mode = el.selectMarketScenario.value;
      engine.initUniverse(mode);
      state.liveAlerts = [];
      refreshAllViews(true);
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

    // 창 크기 변경 시 차트 재렌더링
    window.addEventListener('resize', () => {
      const stock = engine.stockMap.get(state.selectedCode);
      if (stock) drawIntradayChart(stock);
    });

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
  }

  // 초기 구동
  if (el.brandSnapshotSubtitle && window.REAL_KRX_SNAPSHOT_TIME) {
    el.brandSnapshotSubtitle.textContent = `KRX 실세 동기화 (${window.REAL_KRX_SNAPSHOT_TIME})`;
  }
  populateSectorOptions();
  bindEvents();
  applyStrategyPreset('RVOL_ORB_BREAKOUT');
  startRealtimeSimulation();
})();
