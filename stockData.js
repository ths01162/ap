// ============================================================================
// KRX 1,379개 실제 상장종목 현재가/등락률/거래량 마스터 유니버스 & 주가흐름 엔진
// ============================================================================

const SECTORS = [
  '반도체/장비', '2차전지/소재', '바이오/헬스케어', 'AI/소프트웨어', '자동차/전장',
  '로봇/자동화', '방산/우주항공', '조선/해운/중공업', '전력설비/원전', '금융/지주',
  '엔터/미디어/게임', '화학/에너지', '소비재/유통', '통신/네트워크', '건설/건자재'
];

// 주요 종목코드별 정확 섹터 매핑 + 종목명 키워드 기반 자동 섹터 분류기
const EXACT_SECTOR_MAP = {
  '005930': '반도체/장비', '000660': '반도체/장비', '005935': '반도체/장비', '042700': '반도체/장비',
  '000990': '반도체/장비', '058470': '반도체/장비', '403870': '반도체/장비', '039030': '반도체/장비',
  '036930': '반도체/장비', '005290': '반도체/장비', '240810': '반도체/장비', '084370': '반도체/장비',
  '095340': '반도체/장비', '357780': '반도체/장비', '166090': '반도체/장비', '108320': '반도체/장비',
  '373220': '2차전지/소재', '006400': '2차전지/소재', '003670': '2차전지/소재', '005490': '2차전지/소재',
  '247540': '2차전지/소재', '086520': '2차전지/소재', '066970': '2차전지/소재', '450080': '2차전지/소재',
  '020150': '2차전지/소재', '348370': '2차전지/소재', '278280': '2차전지/소재', '078600': '2차전지/소재',
  '207940': '바이오/헬스케어', '068270': '바이오/헬스케어', '196170': '바이오/헬스케어', '028300': '바이오/헬스케어',
  '326030': '바이오/헬스케어', '000100': '바이오/헬스케어', '145020': '바이오/헬스케어', '214150': '바이오/헬스케어',
  '141080': '바이오/헬스케어', '214450': '바이오/헬스케어', '128940': '바이오/헬스케어', '006280': '바이오/헬스케어',
  '035420': 'AI/소프트웨어', '035720': 'AI/소프트웨어', '018260': 'AI/소프트웨어', '012510': 'AI/소프트웨어',
  '377300': 'AI/소프트웨어', '053800': 'AI/소프트웨어', '030520': 'AI/소프트웨어', '402340': 'AI/소프트웨어',
  '005380': '자동차/전장', '000270': '자동차/전장', '012330': '자동차/전장', '009150': '자동차/전장',
  '011070': '자동차/전장', '161390': '자동차/전장', '066570': '자동차/전장', '204320': '자동차/전장',
  '012450': '방산/우주항공', '079550': '방산/우주항공', '064350': '방산/우주항공', '047810': '방산/우주항공',
  '272210': '방산/우주항공', '103140': '방산/우주항공',
  '454910': '로봇/자동화', '277810': '로봇/자동화', '108490': '로봇/자동화', '117730': '로봇/자동화',
  '298040': '전력설비/원전', '267260': '전력설비/원전', '010120': '전력설비/원전', '034020': '전력설비/원전',
  '006260': '전력설비/원전', '001440': '전력설비/원전', '103590': '전력설비/원전', '015760': '전력설비/원전',
  '329180': '조선/해운/중공업', '009540': '조선/해운/중공업', '010140': '조선/해운/중공업', '042660': '조선/해운/중공업',
  '011200': '조선/해운/중공업', '028670': '조선/해운/중공업', '082740': '조선/해운/중공업', '267250': '조선/해운/중공업',
  '105560': '금융/지주', '055550': '금융/지주', '086790': '금융/지주', '316140': '금융/지주',
  '138040': '금융/지주', '000810': '금융/지주', '032830': '금융/지주', '003550': '금융/지주',
  '034730': '금융/지주', '000150': '금융/지주', '024110': '금융/지주', '006800': '금융/지주',
  '352820': '엔터/미디어/게임', '035900': '엔터/미디어/게임', '041510': '엔터/미디어/게임', '122870': '엔터/미디어/게임',
  '259960': '엔터/미디어/게임', '036570': '엔터/미디어/게임', '251270': '엔터/미디어/게임', '263750': '엔터/미디어/게임',
  '003230': '소비재/유통', '090430': '소비재/유통', '278470': '소비재/유통', '192820': '소비재/유통',
  '097950': '소비재/유통', '033780': '소비재/유통', '004170': '소비재/유통', '023530': '소비재/유통',
  '051910': '화학/에너지', '096770': '화학/에너지', '010950': '화학/에너지', '009830': '화학/에너지',
  '017670': '통신/네트워크', '030200': '통신/네트워크', '032640': '통신/네트워크',
  '000720': '건설/건자재', '028260': '건설/건자재', '006360': '건설/건자재', '047040': '건설/건자재'
};

function classifySector(code, name) {
  if (EXACT_SECTOR_MAP[code]) return EXACT_SECTOR_MAP[code];

  if (/반도체|세미콘|마이크론|하이텍|테크윙|칩스|실리콘|웨이퍼|피에스케이|원익|솔브레인|테스|코미코|하나마이크론|리노|이오테크|주성|동진쎄미|유진테크|한미반도체|케이씨텍|네패스|심텍|대덕전자|해성디에스|자람|오픈엣지|가온칩스|파두/.test(name)) {
    return '반도체/장비';
  }
  if (/에코프로|엘앤에프|에너지솔루션|SDI|퓨처엠|전지|배터리|엔켐|천보|나노신소재|성일하이텍|피엔티|코스모신소재|금양|대주전자|일진머티|솔루스|신흥에스이씨|더블유씨피|상신이디피|새빗켐|윤성에프앤씨/.test(name)) {
    return '2차전지/소재';
  }
  if (/바이오|제약|파마|약품|생명|메디|헬스|테라퓨틱|지노믹|사이언스|젠|셀|큐어|백신|임플란트|덴티|바텍|루트로닉|클래시스|휴젤|알테오젠|보로노이|리가켐|펩트론|씨젠|녹십자|유한|종근당|대웅|한미약품|동아에스티|일동|보령|삼진|광동|부광|영진|제일약품|차백신|오스코텍|에이비엘|신풍|메지온|네이처셀|루닛|뷰노|딥노이드/.test(name)) {
    return '바이오/헬스케어';
  }
  if (/소프트|시스템|에이아이|AI|데이터|데이타|네트웍|클라우드|플랫폼|솔루션|인포|시큐|안랩|더존|한글과컴퓨터|솔트룩스|코난|마음AI|폴라리스|링네트|가비아|케이사인|라온|모바일|위메이드|카카오|NAVER|카페24|NHN|더블유게임즈|엠로|비즈니스온|웹케시|브리지텍|이스트소프트|자이언트스텝|디어유|SOOP/.test(name)) {
    return 'AI/소프트웨어';
  }
  if (/로보|오토메이션|메카|모션|에스피지|뉴로메카|유일로보|티로보|큐렉소|삼익THK|스맥|맥스로텍|라온테크|코닉오토/.test(name)) {
    return '로봇/자동화';
  }
  if (/에어로|방산|디펜스|항공|우주|스페이스|넥스원|현대로템|한화시스템|세트렉아이|제노코|퍼스텍|빅텍|스페코|풍산|SNT/.test(name)) {
    return '방산/우주항공';
  }
  if (/일렉트릭|전선|전력|원전|에너빌리티|파워|피코그램|보성파워|우리기술|우진|비츠로|일진전기|대한전선|효성중공업|제룡전기|광명전기|가온전선|LS|한국전력|지역난방/.test(name)) {
    return '전력설비/원전';
  }
  if (/중공업|조선|해양|오션|해운|상선|마린|팬오션|HMM|대한해운|흥아해운|KSS|엔진|세진중공업|태광|성광벤드|하이록|동성화인텍|한국카본/.test(name)) {
    return '조선/해운/중공업';
  }
  if (/금융|지주|은행|증권|보험|화재|생명|캐피탈|투자|창투|인베스트|벤처|신한|하나|우리|기업|미래에셋|삼성카드|현대해상|DB손해|메리츠|키움|대신|유안타|한화생명|동양생명|코리안리|한국금융|BNK|DGB|JB|홀딩스|SK|LG|GS|CJ|코오롱|효성|두산|롯데지주|한진칼|영원무역홀딩스|하림지주/.test(name)) {
    return '금융/지주';
  }
  if (/엔터|미디어|게임|스튜디오|콘텐츠|픽쳐|시네마|뮤직|방송|SBS|CJ ENM|하이브|JYP|에스엠|와이지|크래프톤|엔씨|넷마블|펄어비스|컴투스|네오위즈|데브시스터즈|웹젠|조이시티|넥슨|쇼박스|덱스터|위지윅|삼화네트웍스|키이스트|판타지오|큐브/.test(name)) {
    return '엔터/미디어/게임';
  }
  if (/현대차|기아|모비스|만도|오토|모터|타이어|한온|에스엘|화신|성우하이텍|서연|아진산업|세방전지|넥센타이어|금호타이어|명신산업|구영테크|대원강업|삼기|유라테크|모트렉스|엠씨넥스|파워로직스|자화전자|LG이노텍|삼성전기|LG전자/.test(name)) {
    return '자동차/전장';
  }
  if (/화학|유화|석유|케미|폴리머|카본|가스|S-Oil|이노베이션|한화솔루션|금호석유|롯데케미칼|대한유화|코오롱인더|효성화학|효성첨단|태광산업|SKC|티케이케미칼|송원산업|백광산업|후성|유니드|한솔케미칼|이수화학|국도화학|애경케미칼|삼천리|서울가스|대성에너지|SK가스/.test(name)) {
    return '화학/에너지';
  }
  if (/건설|시멘트|건업|개발|토건|하우징|인프라|페인트|노루|삼화페인트|KCC|아세아시멘트|한일시멘트|쌍용C&E|성신양회|유진기업|동양|아이에스동서|태영|금호건설|코오롱글로벌|동부건설|계룡|한신공영|서희|HDC|DL|GS건설|대우건설|현대건설|삼성물산|삼성엔지니어링|도화/.test(name)) {
    return '건설/건자재';
  }
  if (/텔레콤|통신|KT|유플러스|알에프|RF|이노와이어|케이엠더블유|에이스테크|서진시스템|오이솔루션|쏠리드|다산네트웍스|유비쿼스|코위버|우리넷|기산텔레콤|전파기지국/.test(name)) {
    return '통신/네트워크';
  }
  if (/식품|푸드|제과|음료|칠성|하이트|진로|오리온|농심|삼양|오뚜기|풀무원|빙그레|대상|동원|하림|이지바이오|마니커|신세계|이마트|롯데쇼핑|현대백화점|호텔신라|아모레|LG생활|코스맥스|콜마|클리오|토니모리|에이블씨엔씨|마녀공장|브이티|에이피알|패션|한섬|F&F|휠라|영원무역|신성통상|코웨이|쿠쿠|하츠|락앤락|깨끗한나라|모나리자/.test(name)) {
    return '소비재/유통';
  }

  // 종목코드 해시로 일관성 있게 나머지 분류
  const num = parseInt(code, 10) || 0;
  return SECTORS[num % SECTORS.length];
}

// 결정론적 난수 생성기
function createSeededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// KRX 호가 단위 규격 (2023년 개정 KRX 호가단위 완벽 반영)
function getTickSize(price) {
  if (price < 2000) return 1;
  if (price < 5000) return 5;
  if (price < 20000) return 10;
  if (price < 50000) return 50;
  if (price < 200000) return 100;
  if (price < 500000) return 500;
  return 1000;
}

function roundToTick(price) {
  if (price < 2000) return Math.max(10, Math.round(price));
  const tick = getTickSize(price);
  return Math.round(price / tick) * tick;
}

// KRX 정규장 운영 여부 (월~금 09:00 ~ 15:30 KST)
function isRegularMarketHoursNow() {
  try {
    const kstDateStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
    const kst = new Date(kstDateStr);
    const day = kst.getDay();
    if (day === 0 || day === 6) return false;
    const totalMins = kst.getHours() * 60 + kst.getMinutes();
    return totalMins >= 9 * 60 && totalMins < 15 * 60 + 30;
  } catch (e) {
    const now = new Date();
    const day = now.getDay();
    if (day === 0 || day === 6) return false;
    const totalMins = now.getHours() * 60 + now.getMinutes();
    return totalMins >= 9 * 60 && totalMins < 15 * 60 + 30;
  }
}
window.isRegularMarketHoursNow = isRegularMarketHoursNow;

// 스냅샷 데이터가 오늘 생성된 것인지 검증 (KST 기준)
function isSnapshotFromToday() {
  if (!window.REAL_KRX_SNAPSHOT_TIME) return false;
  try {
    const kst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const yyyy = kst.getFullYear();
    const mm = String(kst.getMonth() + 1).padStart(2, '0');
    const dd = String(kst.getDate()).padStart(2, '0');
    const todayPrefix = `${yyyy}-${mm}-${dd}`;
    const timeStr = String(window.REAL_KRX_SNAPSHOT_TIME).trim();
    if (!timeStr.startsWith(todayPrefix)) return false;

    // 장중(09:00~15:30)일 때는 09:00 이후에 생성된 스냅샷만 당일 장중 데이터로 인정!
    // 00:00 ~ 08:59에 생성된 스냅샷은 전일 장마감 데이터이므로 장중에 당일 분봉으로 오인되지 않도록 엄격 차단
    const isMarketOpen = typeof isRegularMarketHoursNow === 'function' ? isRegularMarketHoursNow() : false;
    if (isMarketOpen) {
      const parts = timeStr.split(' ');
      if (parts.length >= 2) {
        const hh = parseInt(parts[1].split(':')[0], 10);
        if (hh < 9) return false;
      }
    }
    return true;
  } catch (_) {
    return false;
  }
}
window.isSnapshotFromToday = isSnapshotFromToday;

// 당일 정규장 5분봉 세션 생성 헬퍼 (09:00 ~ 현재 슬롯까지의 자연스러운 캔들 생성)
function createTodayCandles(openP, highP, lowP, currentP, totalV, currentSlotIdx, seedCode = 105930) {
  const candles = [];
  const openPrice = roundToTick(openP || currentP);
  const targetP = roundToTick(currentP);
  const count = Math.max(1, currentSlotIdx + 1);
  const avgVol = Math.max(10, Math.round((totalV * 0.65) / count));
  const rng = createSeededRandom((parseInt(seedCode, 10) || 105930) * 73 + 20261118);

  const dayH = Math.max(openPrice, targetP, highP || targetP);
  const dayL = Math.min(openPrice, targetP, lowP || targetP);
  const daySpan = Math.max(getTickSize(targetP) * 4, dayH - dayL);

  const isUpDay = targetP >= openPrice;
  const firstPeakSlot = count > 2 ? Math.max(1, Math.floor(count * (isUpDay ? 0.28 : 0.68))) : 0;
  const firstTroughSlot = count > 2 ? Math.max(1, Math.floor(count * (isUpDay ? 0.62 : 0.30))) : 0;

  let prevClose = openPrice;
  for (let s = 0; s <= currentSlotIdx; s++) {
    const isLast = (s === currentSlotIdx);
    const progress = count > 1 ? s / (count - 1) : 1;
    const cOpen = prevClose;
    const tick = getTickSize(cOpen);

    let cClose;
    if (isLast) {
      cClose = targetP;
    } else if (s === firstPeakSlot && dayH > Math.max(openPrice, targetP)) {
      cClose = roundToTick(dayH - tick * (1 + Math.floor(rng() * 2)));
    } else if (s === firstTroughSlot && dayL < Math.min(openPrice, targetP)) {
      cClose = roundToTick(dayL + tick * (1 + Math.floor(rng() * 2)));
    } else {
      const baseP = openPrice + (targetP - openPrice) * progress;
      const wave = Math.sin(progress * Math.PI * 2.5) * (daySpan * 0.14) + (rng() - 0.48) * (daySpan * 0.18);
      cClose = roundToTick(Math.min(dayH, Math.max(dayL, baseP + wave)));
      if (cClose === cOpen) {
        cClose = roundToTick(Math.min(dayH, Math.max(dayL, cOpen + (rng() > 0.48 ? tick : -tick))));
      }
    }

    const bodySpan = Math.abs(cClose - cOpen);
    const wickUp = roundToTick(Math.max(tick, bodySpan * (0.2 + rng() * 0.5)));
    const wickDown = roundToTick(Math.max(tick, bodySpan * (0.2 + rng() * 0.5)));

    let cHigh = Math.min(dayH, Math.max(cOpen, cClose) + (isLast ? tick : wickUp));
    let cLow = Math.max(dayL, Math.min(cOpen, cClose) - (isLast ? tick : wickDown));
    if (s === firstPeakSlot) cHigh = dayH;
    if (s === firstTroughSlot) cLow = dayL;

    const uShape = s === 0 ? 1.8 : s < 4 ? 1.35 : 0.65 + rng() * 0.7;
    const cVol = Math.max(10, Math.round(avgVol * uShape));

    candles.push({
      slotIdx: s,
      time: getSlotTimeLabel(s),
      open: cOpen,
      high: Math.max(cOpen, cClose, cHigh),
      low: Math.min(cOpen, cClose, cLow),
      close: cClose,
      volume: cVol
    });
    prevClose = cClose;
  }
  return candles;
}

// 스냅샷 마지막 슬롯 이후 ~ 현재 실시간 슬롯 사이의 공백을 왜곡(수평선/거래량 폭발) 없이 자연스럽게 연결하는 헬퍼
function bridgePostSnapshotCandles(candles, rawM5Map, startSlot, endSlot, targetPrice, dayHigh, dayLow, seedCode = 105930) {
  if (endSlot <= startSlot || candles.length === 0) return;

  // 기존 실제 캔들들의 평균 5분 변동폭 및 평균 5분 거래량 산출 (09:00 동시호가 급증봉 제외한 안정적 중앙값 수준)
  let sumRange = 0;
  let sumVol = 0;
  let validVolCount = 0;
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    sumRange += Math.max(getTickSize(c.close), c.high - c.low);
    if (c.volume > 0 && (i > 0 || candles.length === 1)) {
      sumVol += c.volume;
      validVolCount++;
    }
  }
  const tick = getTickSize(targetPrice);
  const avgRange = Math.max(tick * 2, sumRange / Math.max(1, candles.length));
  const avgVol = validVolCount > 0 ? Math.max(10, Math.round(sumVol / validVolCount)) : 500;

  const startCandle = candles[candles.length - 1];
  const startPrice = startCandle.close;
  let pClose = startPrice;
  const gap = endSlot - startSlot;
  const boundHigh = Math.max(startPrice, targetPrice, dayHigh || targetPrice);
  const boundLow = Math.min(startPrice, targetPrice, dayLow || targetPrice);

  for (let s = startSlot + 1; s <= endSlot; s++) {
    const isLast = (s === endSlot);
    if (rawM5Map && rawM5Map.has(s)) {
      const raw = rawM5Map.get(s);
      const cCandle = {
        slotIdx: s,
        time: raw.time || getSlotTimeLabel(s),
        open: raw.open,
        high: isLast ? Math.max(raw.high, targetPrice) : raw.high,
        low: isLast ? Math.min(raw.low, targetPrice) : raw.low,
        close: isLast ? targetPrice : raw.close,
        volume: raw.volume > 0 ? raw.volume : Math.round(avgVol * 0.7)
      };
      candles.push(cCandle);
      pClose = cCandle.close;
      continue;
    }

    const rng = createSeededRandom((parseInt(seedCode, 10) || 105930) * 131 + s * 37 + 2026);
    const t = (s - startSlot) / gap;
    const cOpen = pClose;
    let cClose;

    if (isLast) {
      cClose = targetPrice;
    } else {
      const linearP = startPrice + (targetPrice - startPrice) * t;
      const wave = Math.sin(t * Math.PI * (gap >= 4 ? 2 : 1)) * (avgRange * 0.45) + (rng() - 0.5) * (avgRange * 0.65);
      cClose = roundToTick(Math.min(boundHigh, Math.max(boundLow, linearP + wave)));
      if (cClose === cOpen) {
        const dir = targetPrice >= cOpen ? (rng() > 0.35 ? 1 : -1) : (rng() > 0.35 ? -1 : 1);
        cClose = roundToTick(Math.min(boundHigh, Math.max(boundLow, cOpen + dir * tick)));
      }
    }

    const bodySpan = Math.abs(cClose - cOpen);
    const wickUp = roundToTick(Math.max(tick, (bodySpan + avgRange * 0.35) * (0.2 + rng() * 0.45)));
    const wickDown = roundToTick(Math.max(tick, (bodySpan + avgRange * 0.35) * (0.2 + rng() * 0.45)));

    const cHigh = Math.min(boundHigh, Math.max(cOpen, cClose) + (isLast ? tick : wickUp));
    const cLow = Math.max(boundLow, Math.min(cOpen, cClose) - (isLast ? tick : wickDown));
    const volFactor = isLast ? (0.45 + rng() * 0.45) : (0.55 + rng() * 0.65);
    const cVol = Math.max(10, Math.round(avgVol * volFactor));

    candles.push({
      slotIdx: s,
      time: getSlotTimeLabel(s),
      open: cOpen,
      high: Math.max(cOpen, cClose, cHigh),
      low: Math.min(cOpen, cClose, cLow),
      close: cClose,
      volume: cVol
    });
    pClose = cClose;
  }
}

// 현재 시각(KST) 기준 정규장(09:00 ~ 15:30) 활성 5분봉 인덱스(0 ~ 78, 총 79슬롯) 반환
// 09:00: 0, 10:00: 12, 11:00: 24, 12:00: 36, 13:00: 48, 14:00: 60, 15:00: 72, 15:25: 77, 15:30: 78
function getCurrentIntradaySlotIndex() {
  let kst;
  try {
    kst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  } catch (_) {
    kst = new Date();
  }
  const day = kst.getDay();
  if (day === 0 || day === 6) return 78; // 주말은 정규장 전체 79봉 표시

  const totalMins = kst.getHours() * 60 + kst.getMinutes();
  const startMins = 9 * 60;       // 09:00
  const endMins = 15 * 60 + 30;   // 15:30

  if (totalMins < startMins) return 78; // 장 시작 전에는 전일 전체 79봉 표시
  if (totalMins >= endMins) return 78;  // 15:30 마감 이후에는 당일 정규장 전체 79봉 표시

  return Math.min(78, Math.max(0, Math.floor((totalMins - startMins) / 5)));
}

function getSlotTimeLabel(slotIdx) {
  if (slotIdx >= 78) return '15:30';
  const totalMinutes = 9 * 60 + slotIdx * 5;
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const mm = String(totalMinutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function getSlotIdxFromTimeStr(timeStr) {
  const parts = String(timeStr || '09:00').split(':');
  const hh = parseInt(parts[0], 10) || 9;
  const mm = parseInt(parts[1], 10) || 0;
  return Math.min(78, Math.max(0, Math.floor((hh * 60 + mm - 9 * 60) / 5)));
}

class MarketUniverseEngine {
  constructor() {
    this.stocks = [];
    this.stockMap = new Map();
    this.sectorStats = [];
    this.snapshotTime = window.REAL_KRX_SNAPSHOT_TIME || '실시간 KRX 시세 기준';
    this.initUniverse('REAL_SNAPSHOT');
  }

  // 1,379개 실제 KRX 종목 스냅샷을 기반으로 초기화 (종목코드 중복 원천 차단)
  initUniverse(scenarioMode = 'REAL_SNAPSHOT') {
    const rawList = window.REAL_KRX_SNAPSHOT || [];
    this.stocks = [];
    this.stockMap.clear();

    const seenCodes = new Set();
    rawList.forEach((item, idx) => {
      const code = String(item.c || '').trim();
      if (!code || seenCodes.has(code)) return;
      seenCodes.add(code);
      const stock = this.createStockFromRealSnapshot(item, idx, scenarioMode);
      this.stocks.push(stock);
      this.stockMap.set(stock.code, stock);
    });

    this.recalculateSectorStats();
  }

  createStockFromRealSnapshot(item, idx, scenarioMode) {
    const rng = createSeededRandom(parseInt(item.c, 10) * 31 + idx * 17 + 2026);
    const r = () => rng();

    const realPrice = Number(item.p);
    const realChange = Number(item.d);
    const realChangePct = Number(item.cr);
    const realVolume = Math.max(1000, Number(item.v));
    const realTurnoverEok = Number(item.tv) > 0
      ? Number(Number(item.tv).toFixed(2))
      : Math.max(0.1, Number(((realVolume * realPrice) / 100000000).toFixed(2)));

    const isNxt = item.isNxt === true || (item.nxtTv != null && Number(item.nxtTv) > 0);
    const nxtTurnoverEok = Number(item.nxtTv || 0);
    const nxtVolume = Number(item.nxtV || 0);
    const krxTurnoverEok = Number(item.krxTv || item.tv || realTurnoverEok);
    const krxVolume = Number(item.krxV || item.v || realVolume);

    // 전일 종가 정확 역산 (현재가 - 전일대비)
    const prevClose = Math.max(100, realPrice - realChange);
    const sector = classifySector(item.c, item.n);

    // 시나리오 모드에 따른 목표 현재가 설정
    // 기본 'REAL_SNAPSHOT' 모드에서는 실제 KRX 현재가/등락률을 100% 그대로 유지!
    let targetPrice = realPrice;
    if (scenarioMode === 'MORNING_BREAKOUT' && realChangePct > 0.5) {
      targetPrice = roundToTick(realPrice * (1 + Math.random() * 0.015));
    } else if (scenarioMode === 'PULLBACK_FOCUS' && realChangePct > 1.5) {
      targetPrice = roundToTick(realPrice * (1 - Math.random() * 0.008));
    }

    // 전일 고가 및 전일 저가 설정
    // 실제 상승률이 높은 종목들이 전일고가 돌파나 변동성 돌파 조건을 자연스럽게 만족하도록 현실적 범위 산정
    const prevRangePct = 0.018 + r() * 0.032; // 전일 일봉 변동폭 1.8% ~ 5.0%
    const prevHigh = roundToTick(prevClose * (1 + prevRangePct * (0.35 + r() * 0.45)));
    const prevLow = roundToTick(prevClose * (1 - prevRangePct * (0.35 + r() * 0.45)));
    const prevRange = Math.max(getTickSize(prevClose) * 2, prevHigh - prevLow);

    const isMarketOpen = typeof isRegularMarketHoursNow === 'function' ? isRegularMarketHoursNow() : false;
    const currentSlotIdx = getCurrentIntradaySlotIndex();
    const snapshotIsToday = isSnapshotFromToday();
    const isTodaySession = isMarketOpen;

    const candles = [];
    const totalVol = realVolume;
    let openPrice = roundToTick(Math.max(100, prevClose));
    let rawM5Map = null;
    let snapshotMaxSlot = null;

    // 1) 실제 KRX 5분봉 데이터(item.m5) 처리 조건:
    // - 장마감 상태(야간/주말/장전)일 때는 스냅샷의 전체 캔들을 그대로 표시
    // - 정규 장중(09:00 ~ 15:30)일 때:
    //   a) 스냅샷이 오늘 생성된 데이터라면, 현재 시각(currentSlotIdx)까지만 로드하여 미래 봉 노출 차단
    //   b) 스냅샷이 어제(과거) 생성된 데이터라면, 어제 오후 봉들을 절대 노출하지 않고 오늘 09:00 ~ 현재 시각까지만 생성
    const canUseM5 = Array.isArray(item.m5) && item.m5.length > 0 && scenarioMode === 'REAL_SNAPSHOT' && (!isMarketOpen || snapshotIsToday);

    if (canUseM5) {
      const rawBars = Array.isArray(item.m5[0]) ? item.m5 : [item.m5];
      const slotMap = new Map();
      rawM5Map = slotMap;
      let maxSlotInM5 = 0;

      for (let i = 0; i < rawBars.length; i++) {
        const bar = rawBars[i];
        const tStr = String(bar[0] || '09:00');
        const sIdx = getSlotIdxFromTimeStr(tStr);

        // 장중일 경우 현재 시각(currentSlotIdx)을 초과하는 미래 봉은 제외!
        if (isMarketOpen && sIdx > currentSlotIdx) continue;

        const bOpen = Number(bar[1]) || realPrice;
        const bHigh = Number(bar[2]) || Math.max(bOpen, realPrice);
        const bLow = Number(bar[3]) || Math.min(bOpen, realPrice);
        const bClose = Number(bar[4]) || realPrice;
        const bVol = Math.max(0, Number(bar[5]) || 0);

        if (i === 0) openPrice = bOpen;
        if (sIdx > maxSlotInM5) maxSlotInM5 = sIdx;

        slotMap.set(sIdx, {
          slotIdx: sIdx,
          time: tStr,
          open: bOpen,
          high: Math.max(bOpen, bClose, bHigh),
          low: Math.min(bOpen, bClose, bLow),
          close: bClose,
          volume: bVol
        });
      }

      // 0번 슬롯(09:00)부터 realLimitSlot(스냅샷 실제 마지막 슬롯)까지 실제 5분봉 배치
      // 장마감(야간/휴일) 상태에서는 15:30(78번 슬롯)까지 온전한 전체 세션 캔들을 완성하여 우측 공백 방지
      const realLimitSlot = isMarketOpen ? Math.min(currentSlotIdx, maxSlotInM5) : 78;
      snapshotMaxSlot = realLimitSlot;
      let carryPrice = openPrice;
      for (let s = 0; s <= realLimitSlot; s++) {
        if (slotMap.has(s)) {
          const c = slotMap.get(s);
          candles.push(c);
          carryPrice = c.close;
        } else {
          candles.push({
            slotIdx: s,
            time: getSlotTimeLabel(s),
            open: carryPrice,
            high: carryPrice,
            low: carryPrice,
            close: carryPrice,
            volume: 0
          });
        }
      }

      // 장중에 현재 시각(currentSlotIdx)이 스냅샷 마지막 슬롯(realLimitSlot)보다 앞선 경우,
      // 빈 수평선(—) 대신 평균 변동폭·거래량 기반의 자연스러운 브릿지 캔들로 연결
      if (isMarketOpen && currentSlotIdx > realLimitSlot) {
        bridgePostSnapshotCandles(candles, slotMap, realLimitSlot, currentSlotIdx, realPrice, realPrice, realPrice, item.c);
      }

      if (candles.length === 1 && !isMarketOpen) {
        const c0 = candles[0];
        candles.push({
          slotIdx: Math.min(78, c0.slotIdx + 1),
          time: getSlotTimeLabel(Math.min(78, c0.slotIdx + 1)),
          open: c0.close,
          high: c0.close,
          low: c0.close,
          close: c0.close,
          volume: 0
        });
      }
    } else if (isMarketOpen) {
      // 2) 장중인데 스냅샷이 어제 데이터이거나 m5가 없는 경우:
      // 오늘 09:00부터 현재 시각(currentSlotIdx)까지만 오늘 당일 세션으로 정확히 초기화!
      const todayOpen = roundToTick(Number(item.ov || (prevClose * (1 + (realChangePct >= 0 ? 0.003 : -0.003)))));
      const todayHigh = Math.max(todayOpen, realPrice, Number(item.hv || realPrice));
      const todayLow = Math.min(todayOpen, realPrice, Number(item.lv || realPrice));
      openPrice = todayOpen;
      const todayCandles = createTodayCandles(todayOpen, todayHigh, todayLow, realPrice, totalVol, currentSlotIdx, item.c);
      todayCandles.forEach(c => candles.push(c));
    } else {
      // 3) 장마감/시뮬레이션 모드이거나 외부 CSV 입력 시에만 곡선 생성
      let gapFactor = (r() - 0.46) * 0.015;
      if (realChangePct >= 3.0) {
        gapFactor = Math.min((realChangePct / 100) * (0.25 + r() * 0.35), 0.06);
      } else if (realChangePct <= -3.0) {
        gapFactor = Math.max((realChangePct / 100) * (0.25 + r() * 0.35), -0.06);
      }
      openPrice = roundToTick(Math.max(100, prevClose * (1 + gapFactor)));

      const activeSlotIdx = getCurrentIntradaySlotIndex();
      const candleCount = Math.max(2, activeSlotIdx + 1);
      const avgCandleVol = totalVol / candleCount;

      let prevCloseCandle = openPrice;
      let allocatedVol = 0;

      for (let i = 0; i < candleCount; i++) {
        const progress = (i + 1) / candleCount;
        const cOpen = prevCloseCandle;

        let cClose;
        if (i === candleCount - 1) {
          cClose = targetPrice;
        } else {
          let curve = progress;
          if (realChangePct >= 1.5) curve = Math.pow(progress, 1.35);
          const expectedP = openPrice + (targetPrice - openPrice) * curve;
          const noiseAmp = Math.max(getTickSize(realPrice), Math.abs(targetPrice - openPrice) * 0.11 + realPrice * 0.0022);
          const noise = (r() - 0.5) * noiseAmp;
          cClose = roundToTick(Math.max(100, expectedP + noise));
        }

        const tick = getTickSize(cClose);
        const bodySpan = Math.abs(cClose - cOpen);
        const wickUp = Math.max(tick, roundToTick(bodySpan * (0.15 + r() * 0.45) + (i === candleCount - 1 ? 0 : tick)));
        const wickDown = Math.max(tick, roundToTick(bodySpan * (0.15 + r() * 0.45) + tick));

        const cHigh = i === candleCount - 1 && realChangePct >= 2.5
          ? Math.max(cOpen, cClose) + (r() < 0.4 ? 0 : tick)
          : Math.max(cOpen, cClose) + wickUp;
        const cLow = Math.max(100, Math.min(cOpen, cClose) - wickDown);

        let volWeight = 0.55 + r() * 0.55;
        if (i < 6) volWeight = 1.45 + r() * 0.95;
        else if (i >= candleCount - 6 && realChangePct > 2.0) volWeight = 1.25 + r() * 1.35;

        const cVol = Math.max(10, Math.round(avgCandleVol * volWeight));
        allocatedVol += cVol;

        candles.push({
          slotIdx: i,
          time: getSlotTimeLabel(i),
          open: cOpen,
          high: roundToTick(Math.max(cOpen, cClose, cHigh)),
          low: roundToTick(Math.min(cOpen, cClose, cLow)),
          close: cClose,
          volume: cVol
        });

        prevCloseCandle = cClose;
      }

      const volScale = totalVol / Math.max(1, allocatedVol);
      let scaledSum = 0;
      for (let i = 0; i < candleCount; i++) {
        if (i === candleCount - 1) {
          candles[i].volume = Math.max(10, totalVol - scaledSum);
        } else {
          candles[i].volume = Math.max(10, Math.round(candles[i].volume * volScale));
          scaledSum += candles[i].volume;
        }
      }
    }

    // 실제 등락률과 거래대금 규모에 맞춘 평소 거래량(avgCumulativeVol) 산정 -> 현실적인 RVOL 분포 도출
    let rvolFactor = 0.65 + Math.pow(r(), 1.4) * 1.1;
    if (realChangePct >= 10.0) rvolFactor = 2.6 + Math.pow(r(), 1.2) * 3.2;
    else if (realChangePct >= 5.0) rvolFactor = 1.9 + Math.pow(r(), 1.3) * 2.3;
    else if (realChangePct >= 2.5) rvolFactor = 1.45 + Math.pow(r(), 1.4) * 1.75;
    else if (realChangePct >= 1.0) rvolFactor = 1.05 + Math.pow(r(), 1.5) * 1.35;
    else if (Math.abs(realChangePct) >= 3.5) rvolFactor = 1.25 + r() * 1.1;

    const avgCumulativeVol = Math.max(1000, Math.round(totalVol / rvolFactor));

    // 체결강도 기본값 (종목별 편차를 넓혀 변별력 강화)
    const baseVolPower = realChangePct >= 5.0
      ? 118 + r() * 42
      : realChangePct >= 2.0
        ? 104 + r() * 34
        : realChangePct >= 0.5
          ? 94 + r() * 26
          : realChangePct >= 0
            ? 86 + r() * 22
            : 66 + r() * 28;

    const stock = {
      code: item.c,
      name: item.n,
      market: item.m,
      sector,
      archetype: realChangePct >= 2.5 ? 'ORB_VOLUME_BREAKOUT' : realChangePct >= 0.8 ? 'VWAP_TREND_SURGE' : 'CHOPPY_RANGE',
      realSnapshotPrice: realPrice,
      realSnapshotChange: realChange,
      realSnapshotChangePct: realChangePct,
      realSnapshotVolume: realVolume,
      realSnapshotTurnoverEok: realTurnoverEok,
      isNxt,
      nxtTurnoverEok,
      nxtVolume,
      krxTurnoverEok,
      krxVolume,
      prevClose,
      prevHigh,
      prevLow,
      prevRange,
      openPrice,
      candles,
      _rawM5Map: rawM5Map,
      _snapshotMaxSlot: snapshotMaxSlot,
      _hasLiveBridge: false,
      _lastPolledKrxVol: krxVolume,
      avgCumulativeVol,
      baseVolPower,
      isTodaySession,
      lastTickDir: 0,
      lastUpdatedTs: Date.now()
    };

    this.computeIndicators(stock, scenarioMode === 'REAL_SNAPSHOT');
    return stock;
  }

  // 모든 KRX 종목을 원래 실제 스냅샷 가격으로 즉시 복원
  resetToExactRealPrices() {
    for (const stock of this.stocks) {
      const lastCandle = stock.candles[stock.candles.length - 1];
      lastCandle.close = stock.realSnapshotPrice;
      if (stock.realSnapshotPrice > lastCandle.high) lastCandle.high = stock.realSnapshotPrice;
      if (stock.realSnapshotPrice < lastCandle.low) lastCandle.low = stock.realSnapshotPrice;
      stock.lastTickDir = 0;
      this.computeIndicators(stock, true);
    }
    this.recalculateSectorStats();
  }

  // 종목의 데이트레이딩 핵심 기술적 지표 및 시그널 점수 산출
  computeIndicators(stock, exactSnapshot = false) {
    const candles = stock.candles;
    const len = candles.length;
    const lastCandle = candles[len - 1];
    const price = lastCandle.close;

    let high = 0;
    let low = Infinity;
    let totalVol = 0;
    let totalPV = 0;

    let orbHigh = 0;
    let orbLow = Infinity;

    for (let i = 0; i < len; i++) {
      const c = candles[i];
      if (c.high > high) high = c.high;
      if (c.low < low) low = c.low;
      const typicalPrice = (c.high + c.low + c.close) / 3;
      totalVol += c.volume;
      totalPV += typicalPrice * c.volume;

      c.vwap = roundToTick(totalPV / Math.max(1, totalVol));

      if (i < 6) {
        if (c.high > orbHigh) orbHigh = c.high;
        if (c.low < orbLow) orbLow = c.low;
      }
    }

    const vwap = roundToTick(totalPV / Math.max(1, totalVol));
    const change = price - stock.prevClose;
    const changePct = exactSnapshot && price === stock.realSnapshotPrice
      ? stock.realSnapshotChangePct
      : Number(((change / stock.prevClose) * 100).toFixed(2));
    const vwapDiffPct = Number((((price - vwap) / Math.max(1, vwap)) * 100).toFixed(2));

    // 이동평균선 (MA5, MA20)
    let sum5 = 0, sum20 = 0;
    for (let i = 0; i < len; i++) {
      sum5 += candles[i].close;
      sum20 += candles[i].close;
      if (i >= 5) sum5 -= candles[i - 5].close;
      if (i >= 20) sum20 -= candles[i - 20].close;
      candles[i].ma5 = i >= 4 ? Math.round(sum5 / 5) : candles[i].close;
      candles[i].ma20 = i >= 19 ? Math.round(sum20 / 20) : candles[i].close;
    }

    const ma5 = lastCandle.ma5;
    const ma20 = lastCandle.ma20;

    // RSI (14) 계산
    let gains = 0, losses = 0;
    const rsiPeriod = Math.min(14, len - 1);
    for (let i = len - rsiPeriod; i < len; i++) {
      const diff = candles[i].close - candles[i - 1].close;
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }
    const rs = losses === 0 ? 100 : (gains / rsiPeriod) / (losses / rsiPeriod);
    const rsi = Math.min(99, Math.max(1, Math.round(100 - 100 / (1 + rs))));

    // 상대거래량 (RVOL) — 실제 누적거래량(realSnapshotVolume)과 캔들 거래량 합산 중 큰 값을 사용하여 왜곡 방지
    const effectiveVol = Math.max(totalVol, stock.realSnapshotVolume || 0);
    const recentCount = Math.min(3, len);
    let recentVolSum = 0;
    for (let i = len - recentCount; i < len; i++) {
      recentVolSum += candles[i].volume;
    }
    const recent3Vol = recentVolSum / Math.max(1, recentCount);
    const avgSingleVol = stock.avgCumulativeVol / Math.max(1, len);
    const recentVolBurst = recent3Vol / Math.max(1, avgSingleVol);
    const cumRvol = effectiveVol / Math.max(1, stock.avgCumulativeVol);
    const rvol = Number((cumRvol * 0.65 + recentVolBurst * 0.35).toFixed(2));

    // 거래대금 (억 단위) — 실제 KRX 누적 거래대금(realSnapshotTurnoverEok)을 소수점 1~2자리까지 100% 그대로 반영
    let turnoverEok;
    if (stock.realSnapshotTurnoverEok > 0) {
      if (exactSnapshot) {
        turnoverEok = Number(stock.realSnapshotTurnoverEok.toFixed(2));
      } else {
        const extraVol = Math.max(0, totalVol - (stock.realSnapshotVolume || 0));
        turnoverEok = Number((stock.realSnapshotTurnoverEok + (extraVol * price) / 100000000).toFixed(2));
      }
    } else {
      turnoverEok = Number((totalPV / 100000000).toFixed(2));
    }

    // 래리 윌리엄스 변동성 돌파 목표가 (시초가 + 전일 변동폭 * 0.5)
    const larryTarget = roundToTick(stock.openPrice + stock.prevRange * 0.5);

    // 돌파 여부 판단
    const isOrbBreakout = price >= orbHigh && changePct > 0.4;
    const isPrevHighBreakout = price >= stock.prevHigh && changePct > 0.5;
    const isLarryBreakout = price >= larryTarget && changePct > 0.5;
    const isNearDayHigh = high > low && (price - low) / (high - low) >= 0.80;

    // 체결강도 (Volume Power %)
    const volPower = Number(
      Math.max(45, Math.min(280, stock.baseVolPower + changePct * 2.0 + (rvol - 1) * 6)).toFixed(1)
    );

    // 시초 갭 (%)
    const gapPct = Number((((stock.openPrice - stock.prevClose) / stock.prevClose) * 100).toFixed(2));

    // 스파크라인 (09:00 ~ 20:00 전체 궤적을 대표하는 22개 샘플 포인트)
    const sparkStep = Math.max(1, Math.floor(len / 22));
    const sparkline = [];
    for (let i = 0; i < len; i += sparkStep) {
      sparkline.push(candles[i].close);
    }
    if (sparkline[sparkline.length - 1] !== price) {
      sparkline.push(price);
    }

    // 데이트레이딩 셋업 태그 판별
    const signals = [];
    if (rvol >= 1.8 && (isOrbBreakout || isLarryBreakout)) {
      signals.push({ code: 'VOL_BREAKOUT', label: '거래량+변동성돌파', type: 'hot' });
    } else if (isOrbBreakout) {
      signals.push({ code: 'ORB_HIGH', label: 'ORB고점돌파', type: 'breakout' });
    }
    if (isPrevHighBreakout && changePct > 1.0) {
      signals.push({ code: 'PREV_HIGH', label: '전일고가돌파', type: 'breakout' });
    }
    if (price >= vwap && ma5 >= ma20 && vwapDiffPct >= 0.1 && vwapDiffPct <= 5.0 && changePct > 0.5) {
      signals.push({ code: 'VWAP_SURGE', label: 'VWAP정배열', type: 'trend' });
    }
    if (
      changePct >= 1.0 &&
      high > price * 1.008 &&
      Math.abs(vwapDiffPct) <= 1.8 &&
      lastCandle.close >= lastCandle.open &&
      rvol >= 1.2
    ) {
      signals.push({ code: 'PULLBACK_TURN', label: 'VWAP눌림반등', type: 'dip' });
    }
    if (gapPct >= 1.8 && price >= stock.openPrice && volPower >= 115) {
      signals.push({ code: 'GAP_GO', label: '갭상승돌파', type: 'gap' });
    }
    if (rvol >= 2.8) {
      signals.push({ code: 'RVOL_SPIKE', label: `수급폭발(${rvol}x)`, type: 'vol' });
    }

    // 종합 데이트레이딩 AI 스코어 (15 ~ 98점, 변별력 강화를 위한 비선형 연속 스코어링)
    // 1) 상대거래량(RVOL) 점수 (최대 28점) — RVOL 4.5x 이상에서 만점 근접하도록 완만한 로그/선형 결합
    const rvolExcess = Math.max(0, rvol - 0.85);
    const rvolScore = Math.min(28, 28 * (1 - Math.exp(-0.55 * rvolExcess)));

    // 2) 돌파 강도 및 일중 고가 장악력 점수 (최대 26점)
    let breakoutScore = 0;
    if (isOrbBreakout) {
      const orbMarginPct = Math.max(0, ((price - orbHigh) / Math.max(1, orbHigh)) * 100);
      breakoutScore += Math.min(10, 4.5 + orbMarginPct * 2.2);
    }
    if (isLarryBreakout) {
      const larryMarginPct = Math.max(0, ((price - larryTarget) / Math.max(1, larryTarget)) * 100);
      breakoutScore += Math.min(8, 3.5 + larryMarginPct * 1.8);
    }
    if (isPrevHighBreakout) {
      const prevMarginPct = Math.max(0, ((price - stock.prevHigh) / Math.max(1, stock.prevHigh)) * 100);
      breakoutScore += Math.min(8, 3.0 + prevMarginPct * 2.0);
    }
    // 당일 저가~고가 중 현재가 위치 비율(0.0 ~ 1.0) 연속 반영
    const dayPosRatio = high > low ? (price - low) / (high - low) : 0.5;
    if (changePct > 0) {
      breakoutScore += Math.max(0, (dayPosRatio - 0.5) * 8);
    }
    breakoutScore = Math.min(26, breakoutScore);

    // 3) VWAP & 이평선 정배열 및 등락률 탄력 점수 (최대 24점)
    let trendScore = 0;
    if (price >= vwap) {
      // VWAP 위 0.2% ~ 3.5% 구간이 가장 이상적인 데이트레이딩 타점 (너무 과열되면 감점)
      if (vwapDiffPct <= 3.5) trendScore += 5 + (vwapDiffPct / 3.5) * 4;
      else trendScore += Math.max(3, 9 - (vwapDiffPct - 3.5) * 0.8);
    } else {
      trendScore += Math.max(0, 3 + vwapDiffPct * 1.2);
    }

    if (ma5 > ma20) {
      const maSpreadPct = ((ma5 - ma20) / Math.max(1, ma20)) * 100;
      trendScore += Math.min(6, 2.5 + maSpreadPct * 2.5);
    }

    // 등락률 모멘텀 (3% ~ 14% 구간이 데이트레이딩 최적 탄력 구간)
    if (changePct > 0) {
      if (changePct <= 14.0) trendScore += (changePct / 14.0) * 9;
      else trendScore += Math.max(4, 9 - (changePct - 14.0) * 0.35);
    }
    trendScore = Math.min(24, trendScore);

    // 4) 체결강도 & 거래대금 유동성 & RSI 밸런스 점수 (최대 20점)
    const vpScore = Math.min(10, Math.max(0, (volPower - 92) * 0.13));
    // 거래대금 가산점 (최소 50억 ~ 1,000억 이상 유동성 풍부 종목 우대)
    const liqScore = Math.min(5, Math.log10(Math.max(1, turnoverEok)) * 1.45);
    // RSI 58 ~ 74 구간 우대
    const rsiScore = rsi >= 58 && rsi <= 74
      ? 5
      : rsi > 74
        ? Math.max(1, 5 - (rsi - 74) * 0.25)
        : Math.max(0, (rsi - 42) * 0.28);

    const rawScore = rvolScore + breakoutScore + trendScore + vpScore + liqScore + rsiScore;
    const totalScore = Math.min(98, Math.max(15, Math.round(rawScore)));

    // 트레이딩 타점 가이드 (권장 진입가, 1차/2차 목표가, 손절가)
    // 현재가 바로 추격매수가 아닌, 현실적인 눌림목 지지선(VWAP/이평/돌파선) 또는 고가 돌파 기준 타점 산출
    let entryPrice;
    let entryLabel = '눌림목 지지타점 (VWAP 지지)';
    let entryType = 'dip';
    const tickSize = getTickSize(price);

    if (price >= vwap * 1.018) {
      // 1) 현재가가 VWAP 대비 +1.8% 이상 급등한 경우: 추격매수 금지 -> VWAP 상단 또는 돌파 지지선(ORB) 부근 눌림목 대기
      const idealDip = Math.max(vwap * 1.004, price * 0.982);
      if (orbHigh > vwap && orbHigh <= price * 0.995 && orbHigh >= vwap * 0.99) {
        entryPrice = roundToTick(orbHigh);
        entryLabel = '눌림목 지지타점 (ORB선 지지)';
      } else {
        entryPrice = roundToTick(idealDip);
        entryLabel = '눌림목 지지타점 (VWAP 상단 지지)';
      }
    } else if (price >= vwap * 1.005) {
      // 2) 현재가가 VWAP 살짝 위(+0.5% ~ +1.8%)에서 지지 테스트 중인 경우
      entryPrice = roundToTick(Math.max(vwap * 1.002, price * 0.988));
      entryLabel = '눌림목 지지타점 (VWAP 지지확인)';
    } else if (price < vwap) {
      // 3) 현재가가 VWAP 하단에 있는 경우: VWAP 회복 돌파 시 매수
      entryPrice = roundToTick(vwap + tickSize);
      entryLabel = 'VWAP 탈환 돌파타점';
      entryType = 'breakout';
    } else {
      // 4) 보합권
      entryPrice = roundToTick(price * 0.988);
      entryLabel = '눌림목 지지타점';
    }

    // 진입가가 현재가와 완전히 같거나 너무 붙지 않도록 최소 2~3호가 이상 차이 확보
    if (entryType === 'dip' && entryPrice >= price) {
      entryPrice = roundToTick(price - tickSize * 3);
    } else if (entryType === 'breakout' && entryPrice <= price) {
      entryPrice = roundToTick(price + tickSize * 2);
    }

    // 손절선: 진입가 대비 -1.5% ~ -2.0% 타이트한 리스크 관리 (손실률 -1.8% 내외)
    let stopLossPrice = roundToTick(
      Math.max(vwap * 0.992, entryPrice * 0.982)
    );
    if (stopLossPrice >= entryPrice) {
      stopLossPrice = roundToTick(entryPrice - tickSize * 3);
    }
    const riskPerShare = Math.max(tickSize * 3, entryPrice - stopLossPrice);
    
    // 1차 익절: 손익비 1:2.2 이상 보장 (+2.5% ~ +4.0%)
    const target1Price = roundToTick(entryPrice + riskPerShare * 2.2);
    // 2차 익절: 손익비 1:3.6 이상 보장 (+5.0% ~ +6.8%)
    const target2Price = roundToTick(entryPrice + riskPerShare * 3.6);

    const stopLossPct = (((stopLossPrice - entryPrice) / entryPrice) * 100).toFixed(2);
    const target1Pct = (((target1Price - entryPrice) / entryPrice) * 100).toFixed(2);

    stock.price = price;
    stock.high = high;
    stock.low = low;
    stock.volume = effectiveVol;
    stock.turnoverEok = turnoverEok;
    stock.vwap = vwap;
    stock.vwapDiffPct = vwapDiffPct;
    stock.change = change;
    stock.changePct = changePct;
    stock.ma5 = ma5;
    stock.ma20 = ma20;
    stock.rsi = rsi;
    stock.rvol = rvol;
    stock.volPower = volPower;
    stock.gapPct = gapPct;
    stock.orbHigh = orbHigh;
    stock.orbLow = orbLow;
    stock.larryTarget = larryTarget;
    stock.isOrbBreakout = isOrbBreakout;
    stock.isPrevHighBreakout = isPrevHighBreakout;
    stock.isLarryBreakout = isLarryBreakout;
    stock.isNearDayHigh = isNearDayHigh;
    stock.signals = signals;
    stock.score = totalScore;
    stock.sparkline = sparkline;
    stock.tradePlan = {
      entryPrice,
      entryLabel,
      entryType,
      target1Price,
      target2Price,
      stopLossPrice,
      target1Pct,
      stopLossPct,
      rrRatio: '1 : 2.2'
    };
  }

  // 장중 실시간 틱 변동 시뮬레이션 (선택 시 실제 현재가 주변 ±1~2 호가 내에서 현실적으로 틱 작동)
  simulateRealtimeTicks(batchSize = 90) {
    const updatedStocks = [];
    const breakoutAlerts = [];
    const total = this.stocks.length;

    for (let k = 0; k < batchSize; k++) {
      const idx = Math.floor(Math.random() * total);
      const stock = this.stocks[idx];
      const prevScore = stock.score;
      const wasBreakout = stock.isOrbBreakout || stock.isLarryBreakout;

      const lastCandle = stock.candles[stock.candles.length - 1];
      const tick = getTickSize(stock.price);

      // 실제 스냅샷 가격에서 너무 멀어지지 않도록 평균 회귀 바이어스 적용 (±1.5% 이내)
      const driftFromReal = (stock.price - stock.realSnapshotPrice) / Math.max(1, stock.realSnapshotPrice);
      let upProb = stock.realSnapshotChangePct >= 1.5 ? 0.54 : 0.49;
      if (driftFromReal > 0.012) upProb = 0.32;
      else if (driftFromReal < -0.012) upProb = 0.68;

      const dir = Math.random() < upProb ? 1 : -1;
      const newPrice = Math.max(100, roundToTick(stock.price + dir * tick));

      lastCandle.close = newPrice;
      if (newPrice > lastCandle.high) lastCandle.high = newPrice;
      if (newPrice < lastCandle.low) lastCandle.low = newPrice;

      const addedVol = Math.max(1, Math.round((stock.avgCumulativeVol / stock.candles.length) * (0.01 + Math.random() * 0.04)));
      lastCandle.volume += addedVol;

      stock.lastTickDir = newPrice > stock.price ? 1 : newPrice < stock.price ? -1 : 0;
      stock.lastUpdatedTs = Date.now();

      this.computeIndicators(stock, false);
      updatedStocks.push(stock);

      const nowBreakout = stock.isOrbBreakout || stock.isLarryBreakout;
      if ((!wasBreakout && nowBreakout && stock.rvol >= 1.6) || (stock.score >= 82 && stock.score - prevScore >= 2)) {
        breakoutAlerts.push({
          id: `${stock.code}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          time: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
          code: stock.code,
          name: stock.name,
          sector: stock.sector,
          price: stock.price,
          changePct: stock.changePct,
          rvol: stock.rvol,
          score: stock.score,
          signalText: stock.isOrbBreakout
            ? `ORB 고점(${stock.orbHigh.toLocaleString()}원) + RVOL ${stock.rvol}x 돌파`
            : `변동성 목표가(${stock.larryTarget.toLocaleString()}원) 돌파 · 체결강도 ${stock.volPower}%`
        });
      }
    }

    this.recalculateSectorStats();
    return { updatedStocks, breakoutAlerts };
  }

  // 네이버 금융 / KRX 실시간 JSONP 폴링 데이터를 받아 실제 현재가·고가·저가·거래량·거래대금 실시간 업데이트
  applyRealMarketQuotes(datas) {
    if (!Array.isArray(datas) || datas.length === 0) {
      return { updatedStocks: [], breakoutAlerts: [] };
    }

    const updatedStocks = [];
    const breakoutAlerts = [];

    for (const d of datas) {
      const code = String(d.cd || '').trim();
      const stock = this.stockMap.get(code);
      if (!stock) continue;

      const newPrice = Number(d.nv);
      if (!newPrice || newPrice <= 0) continue;

      const prevPrice = stock.price;
      const prevScore = stock.score;
      const wasBreakout = stock.isOrbBreakout || stock.isLarryBreakout;

      // rf: '1'(상한), '2'(상승), '3'(보합), '4'(하한), '5'(하락)
      const rf = String(d.rf || '3');
      const isDown = rf === '4' || rf === '5' || Number(d.cr) < 0;
      const sign = isDown ? -1 : rf === '3' ? 0 : 1;
      const realDiff = Math.abs(Number(d.cv || 0)) * sign;
      const realChangePct = Number((Math.abs(Number(d.cr || 0)) * sign).toFixed(2));
      const realPrevClose = Number(d.pcv || d.sv || stock.prevClose);
      const realOpen = Number(d.ov || stock.openPrice);
      const realHigh = Number(d.hv || Math.max(stock.high, newPrice));
      const realLow = Number(d.lv || Math.min(stock.low, newPrice));

      // KRX 및 NXT(넥스트레이드) 거래대금/거래량 합산 (NXT 상장 종목은 통합 표시)
      const krxTurnoverWon = Number(d.aa || 0);
      const krxVol = Number(d.aq || stock.krxVolume || stock.volume);

      const nxtInfo = d.nxtOverMarketPriceInfo;
      const nxtTurnoverWon = nxtInfo && nxtInfo.accumulatedTradingValueRaw
        ? Number(nxtInfo.accumulatedTradingValueRaw)
        : (stock.nxtTurnoverEok ? stock.nxtTurnoverEok * 100000000 : 0);
      const nxtVol = nxtInfo && nxtInfo.accumulatedTradingVolumeRaw
        ? Number(nxtInfo.accumulatedTradingVolumeRaw)
        : (stock.nxtVolume || 0);

      const hasNxt = (nxtTurnoverWon > 0 || nxtVol > 0);
      const totalTurnoverWon = krxTurnoverWon + nxtTurnoverWon;
      const totalVol = krxVol + nxtVol;

      const realTurnoverEok = totalTurnoverWon > 0
        ? Number((totalTurnoverWon / 100000000).toFixed(2))
        : stock.turnoverEok;
      const realVol = totalVol > 0 ? totalVol : stock.volume;

      stock.isNxt = stock.isNxt || hasNxt;
      stock.krxTurnoverEok = Number((krxTurnoverWon / 100000000).toFixed(2));
      stock.nxtTurnoverEok = Number((nxtTurnoverWon / 100000000).toFixed(2));
      stock.krxVolume = krxVol;
      stock.nxtVolume = nxtVol;

      stock.prevClose = realPrevClose > 0 ? realPrevClose : stock.prevClose;
      if (realOpen > 0) stock.openPrice = realOpen;
      stock.realSnapshotPrice = newPrice;
      stock.realSnapshotChange = realDiff;
      stock.realSnapshotChangePct = realChangePct;
      if (realVol > 0) stock.realSnapshotVolume = realVol;
      if (realTurnoverEok > 0) stock.realSnapshotTurnoverEok = realTurnoverEok;

      // 실시간 시세 수신 시 5분봉 동기화:
      // 1) 정규장(09:00 ~ 15:30) 외에는 캔들을 절대 임의 생성하지 않음 (스냅샷 실제 일봉 유지)
      // 2) 장중일 때:
      //    a) 만약 기존 캔들이 어제 데이터이거나(lastSlotIdx > currentSlotIdx) 비어있거나 오늘 세션 플래그가 없으면 즉시 오늘 09:00~현재 슬롯 캔들로 리셋!
      //    b) 현재 슬롯이 마지막 캔들 슬롯과 같으면 해당 봉의 종가/고가/저가/거래량 실시간 갱신
      //    c) 5분이 지나 새로운 슬롯이 시작되면 단 하나의 새 활성 봉만 시작 (미래 예측 또는 선형보간 절대 금지!)
      if (isRegularMarketHoursNow()) {
        const currentSlotIdx = getCurrentIntradaySlotIndex();
        const candles = stock.candles;
        const len = candles.length;
        const lastCandle = len > 0 ? candles[len - 1] : null;
        const lastSlotIdx = lastCandle ? (typeof lastCandle.slotIdx === 'number' ? lastCandle.slotIdx : len - 1) : -1;

        if (lastSlotIdx > currentSlotIdx || len === 0 || !stock.isTodaySession) {
          stock.isTodaySession = true;
          stock.candles = createTodayCandles(
            realOpen > 0 ? realOpen : (stock.openPrice || prevPrice),
            realHigh > 0 ? realHigh : Math.max(prevPrice, newPrice),
            realLow > 0 ? realLow : Math.min(prevPrice, newPrice),
            newPrice,
            krxVol > 0 ? krxVol : realVol,
            currentSlotIdx,
            stock.code
          );
          stock._hasLiveBridge = true;
          stock._lastPolledKrxVol = krxVol;
        } else if (!stock._hasLiveBridge && stock._snapshotMaxSlot != null && currentSlotIdx > stock._snapshotMaxSlot) {
          // 스냅샷 로드 후 최초 실시간 시세 수신 시:
          // 스냅샷의 실제 캔들(0 ~ _snapshotMaxSlot)은 100% 보존하고,
          // 그 이후 ~ 현재 슬롯까지의 구간을 실시간 현재가(newPrice)에 맞춰 왜곡 없이 자연스럽게 재연결
          candles.length = stock._snapshotMaxSlot + 1;
          bridgePostSnapshotCandles(
            candles,
            stock._rawM5Map,
            stock._snapshotMaxSlot,
            currentSlotIdx,
            newPrice,
            realHigh,
            realLow,
            stock.code
          );
          stock._hasLiveBridge = true;
          stock._lastPolledKrxVol = krxVol;
        } else if (currentSlotIdx === lastSlotIdx) {
          // 현재 5분봉 진행 중: 종가, 고가, 저가 및 2초 주기 순증 거래량만 실시간 갱신 (누적 갭 일괄 합산으로 인한 거래량 폭발 원천 차단)
          lastCandle.close = newPrice;
          if (newPrice > lastCandle.high) lastCandle.high = newPrice;
          if (newPrice < lastCandle.low) lastCandle.low = newPrice;

          if (stock._hasLiveBridge && stock._lastPolledKrxVol > 0 && krxVol > stock._lastPolledKrxVol) {
            const tickVolDiff = krxVol - stock._lastPolledKrxVol;
            let sumVol = 0, cntVol = 0;
            for (let i = 1; i < len; i++) {
              if (candles[i].volume > 0) { sumVol += candles[i].volume; cntVol++; }
            }
            const avgCVol = cntVol > 0 ? Math.round(sumVol / cntVol) : 1000;
            lastCandle.volume = Math.min(Math.round(avgCVol * 2.2), lastCandle.volume + Math.min(tickVolDiff, Math.round(avgCVol * 0.45)));
          }
          stock._hasLiveBridge = true;
          stock._lastPolledKrxVol = krxVol;
        } else if (currentSlotIdx > lastSlotIdx && currentSlotIdx <= 78) {
          // 새로운 5분봉 슬롯 진입 시: 자연스러운 브릿지 캔들 생성
          bridgePostSnapshotCandles(
            candles,
            stock._rawM5Map,
            lastSlotIdx,
            currentSlotIdx,
            newPrice,
            realHigh,
            realLow,
            stock.code
          );
          stock._hasLiveBridge = true;
          stock._lastPolledKrxVol = krxVol;
        }
      }

      if (newPrice !== prevPrice) {
        stock.lastTickDir = newPrice > prevPrice ? 1 : -1;
        stock.lastUpdatedTs = Date.now();
        updatedStocks.push(stock);
      } else {
        stock.lastTickDir = 0;
      }

      this.computeIndicators(stock, true);

      // 실시간 돌파 알림 생성
      const nowBreakout = stock.isOrbBreakout || stock.isLarryBreakout;
      if (
        newPrice > prevPrice &&
        ((!wasBreakout && nowBreakout && stock.rvol >= 1.6) || (stock.score >= 82 && stock.score - prevScore >= 1))
      ) {
        breakoutAlerts.push({
          id: `${stock.code}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          time: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
          code: stock.code,
          name: stock.name,
          sector: stock.sector,
          price: stock.price,
          changePct: stock.changePct,
          rvol: stock.rvol,
          score: stock.score,
          signalText: stock.isOrbBreakout
            ? `실시간 ORB 고점(${stock.orbHigh.toLocaleString()}원) 돌파 · RVOL ${stock.rvol}x`
            : `실시간 변동성 목표가(${stock.larryTarget.toLocaleString()}원) 돌파`
        });
      }
    }

    this.recalculateSectorStats();
    return { updatedStocks, breakoutAlerts };
  }

  recalculateSectorStats() {
    const map = new Map();
    for (const sec of SECTORS) {
      map.set(sec, { sector: sec, count: 0, sumChange: 0, sumRvol: 0, breakoutCount: 0 });
    }

    for (const s of this.stocks) {
      const item = map.get(s.sector);
      if (!item) continue;
      item.count++;
      item.sumChange += s.changePct;
      item.sumRvol += s.rvol;
      if (s.score >= 75) item.breakoutCount++;
    }

    const result = [];
    for (const [, val] of map) {
      if (val.count === 0) continue;
      result.push({
        sector: val.sector,
        count: val.count,
        avgChangePct: Number((val.sumChange / val.count).toFixed(2)),
        avgRvol: Number((val.sumRvol / val.count).toFixed(2)),
        breakoutCount: val.breakoutCount
      });
    }

    result.sort((a, b) => b.avgChangePct - a.avgChangePct);
    this.sectorStats = result;
    return result;
  }

  importExternalData(records) {
    let importedCount = 0;
    for (const row of records) {
      const code = String(row.code || row['종목코드'] || '').trim().padStart(6, '0');
      const name = String(row.name || row['종목명'] || '').trim();
      if (!code || !name) continue;

      const market = String(row.market || row['시장'] || 'KOSDAQ').toUpperCase().includes('KOSPI')
        ? 'KOSPI'
        : 'KOSDAQ';
      const price = Number(String(row.price || row['현재가'] || row['종가'] || 25000).replace(/,/g, ''));
      const changePct = Number(String(row.changePct || row['등락률'] || 2.5).replace(/%/g, ''));
      const diff = Math.round(price - price / (1 + changePct / 100));
      const volume = Number(String(row.volume || row['거래량'] || 500000).replace(/,/g, ''));

      const newStock = this.createStockFromRealSnapshot(
        {
          c: code,
          n: name,
          m: market,
          p: price,
          d: diff,
          cr: changePct,
          v: volume,
          tv: Math.round((price * volume) / 100000000)
        },
        this.stocks.length,
        'REAL_SNAPSHOT'
      );

      if (this.stockMap.has(code)) {
        const idx = this.stocks.findIndex(s => s.code === code);
        if (idx !== -1) this.stocks[idx] = newStock;
      } else {
        this.stocks.unshift(newStock);
      }
      this.stockMap.set(code, newStock);
      importedCount++;
    }

    this.recalculateSectorStats();
    return importedCount;
  }
}

window.MarketUniverseEngine = MarketUniverseEngine;
window.SECTORS = SECTORS;
