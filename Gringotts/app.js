const canonicalRates = {
  Galleons: { Galleons: 1, Sickles: 17, Knuts: 493, USD: 6.5, EUR: 6.05, GBP: 5.2 },
  Sickles: { Galleons: 1 / 17, Sickles: 1, Knuts: 29, USD: 0.382, EUR: 0.355, GBP: 0.305 },
  Knuts: { Galleons: 1 / 493, Sickles: 1 / 29, Knuts: 1, USD: 0.013, EUR: 0.012, GBP: 0.01 },
  USD: { Galleons: 1 / 6.5, Sickles: 17 / 6.5, Knuts: 493 / 6.5, USD: 1, EUR: 0.92, GBP: 0.8 },
  EUR: { Galleons: 1 / 6.05, Sickles: 17 / 6.05, Knuts: 493 / 6.05, USD: 1.09, EUR: 1, GBP: 0.87 },
  GBP: { Galleons: 1 / 5.2, Sickles: 17 / 5.2, Knuts: 493 / 5.2, USD: 1.25, EUR: 1.15, GBP: 1 },
};

const assets = [
  { name: 'Dragon Liver Packages', weight: 0.34, base: 6.8, volatility: 0.22 },
  { name: 'Acromantula Venom Ounces', weight: 0.28, base: 9.4, volatility: 0.31 },
  { name: 'Floo Powder Barrels', weight: 0.24, base: 4.5, volatility: 0.18 },
  { name: 'Basilisk Scale Bundles', weight: 0.14, base: 11.2, volatility: 0.35 },
];

const instruments = [
  { symbol: 'GALL/USD', name: 'Galleon Spot', price: 1.42, swing: 0.07, color: 'emerald' },
  { symbol: 'SICK/EUR', name: 'Sickle Corridor', price: 0.382, swing: 0.05, color: 'amber' },
  { symbol: 'KNUT/GBP', name: 'Knut Ledger', price: 0.011, swing: 0.09, color: 'crimson' },
  { symbol: 'DRGN/VLT', name: 'Dragon Liver Futures', price: 6.8, swing: 0.14, color: 'gold' },
  { symbol: 'VENM/VLT', name: 'Venom Arbitrage', price: 9.4, swing: 0.17, color: 'emerald' },
  { symbol: 'FLOO/VLT', name: 'Floo Liquidity', price: 4.5, swing: 0.08, color: 'amber' },
  { symbol: 'SCAL/VLT', name: 'Scale Trust', price: 11.2, swing: 0.2, color: 'crimson' },
  { symbol: 'VAULT/BNK', name: 'Reserve Pressure', price: 98.3, swing: 0.03, color: 'gold' },
];

const chartCanvas = document.getElementById('chart-canvas');
const chartContext = chartCanvas.getContext('2d');
const tickerTrack = document.getElementById('ticker-track');
const amountInput = document.getElementById('amount-input');
const fromCurrency = document.getElementById('from-currency');
const toCurrency = document.getElementById('to-currency');
const conversionOutput = document.getElementById('conversion-output');
const instrumentStrip = document.getElementById('instrument-strip');
const chartSymbol = document.getElementById('chart-symbol');
const chartPrice = document.getElementById('chart-price');
const chartDelta = document.getElementById('chart-delta');
const allocationList = document.getElementById('allocation-list');
const portfolioValue = document.getElementById('portfolio-value');
const portfolioYield = document.getElementById('portfolio-yield');
const riskIndex = document.getElementById('risk-index');
const volatilityOutput = document.getElementById('volatility');
const concentrationOutput = document.getElementById('concentration');
const reserveBufferOutput = document.getElementById('reserve-buffer');
const maxDrawdownOutput = document.getElementById('max-drawdown');
const shockExposureOutput = document.getElementById('shock-exposure');
const securityLog = document.getElementById('security-log');
const resetAllocation = document.getElementById('reset-allocation');
const downloadInvoice = document.getElementById('download-invoice');
const marketPulse = document.getElementById('market-pulse');
const vaultIntegrity = document.getElementById('vault-integrity');
const feedStatus = document.getElementById('feed-status');

const currencyOptions = ['Galleons', 'Sickles', 'Knuts', 'USD', 'EUR', 'GBP'];
const portfolio = [
  { name: 'Dragon Liver Packages', share: 32 },
  { name: 'Acromantula Venom Ounces', share: 26 },
  { name: 'Floo Powder Barrels', share: 24 },
  { name: 'Basilisk Scale Bundles', share: 18 },
];

const state = {
  chartSeries: Array.from({ length: 42 }, (_, index) => {
    const open = 1 + Math.sin(index / 4) * 0.07 + index * 0.002;
    const close = open + Math.cos(index / 3.5) * 0.045;
    return buildCandle(open, close, index);
  }),
  price: 1.42,
  previousPrice: 1.42,
  volatility: 0.19,
  securityEvents: [],
  instrumentIndex: 0,
  instrumentFrame: instruments.map((instrument, index) => ({
    ...instrument,
    price: instrument.price,
    delta: index % 2 === 0 ? 0.012 : -0.008,
  })),
  allocations: portfolio.map((item) => ({
    ...item,
    ...assets.find((asset) => asset.name === item.name),
  })),
};

function buildCandle(open, close, index) {
  const spread = Math.max(0.04, Math.abs(close - open) * 0.7 + 0.03 + (index % 5) * 0.003);
  return {
    open,
    close,
    high: Math.max(open, close) + spread,
    low: Math.min(open, close) - spread,
  };
}

function formatCurrency(value, digits = 2) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatTimestamp(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function populateSelects() {
  for (const currency of currencyOptions) {
    const optionA = document.createElement('option');
    optionA.value = currency;
    optionA.textContent = currency;
    fromCurrency.appendChild(optionA);

    const optionB = document.createElement('option');
    optionB.value = currency;
    optionB.textContent = currency;
    toCurrency.appendChild(optionB);
  }
  fromCurrency.value = 'Galleons';
  toCurrency.value = 'USD';
}

function populateTicker() {
  const items = [
    'Galleon reserves up 2.8% on dragon-hoard inflows',
    'Sickle spread tightens against EUR corridor',
    'Knut liquidity flashes through the lower vaults',
    'Vault beta remains elevated in the South Wing market',
    'Floo Powder barrels posting a fresh risk premium',
    'Dragon Liver desk printing volatile upside',
    'Acromantula Venom bid depth shrinking at the bell',
    'Basilisk Scale vaults hit a scarcity premium',
  ];

  tickerTrack.innerHTML = '';
  const doubled = items.concat(items);
  for (const item of doubled) {
    const pill = document.createElement('div');
    pill.className = 'ticker-pill';
    pill.textContent = item;
    tickerTrack.appendChild(pill);
  }
}

function renderInstruments() {
  instrumentStrip.innerHTML = '';

  state.instrumentFrame.forEach((instrument, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `instrument-card color-${instrument.color}`;
    if (index === state.instrumentIndex) {
      card.classList.add('active');
    }
    card.innerHTML = `
      <span>${instrument.symbol}</span>
      <strong>${instrument.name}</strong>
      <em>${formatCurrency(instrument.price)} ${index < 3 ? 'FX' : 'G'}</em>
      <small>${instrument.delta >= 0 ? '+' : ''}${(instrument.delta * 100).toFixed(2)}% swing</small>
    `;

    card.addEventListener('click', () => {
      state.instrumentIndex = index;
      syncInstrumentFocus();
      drawChart();
    });

    instrumentStrip.appendChild(card);
  });
}

function syncInstrumentFocus() {
  const active = state.instrumentFrame[state.instrumentIndex];
  chartSymbol.textContent = active.symbol;
  chartPrice.textContent = `${formatCurrency(active.price)} ${state.instrumentIndex < 3 ? 'FX' : 'G'}`;
  const cardNodes = [...instrumentStrip.querySelectorAll('.instrument-card')];
  cardNodes.forEach((node, index) => {
    node.classList.toggle('active', index === state.instrumentIndex);
  });
}

function convertCurrency() {
  const amount = Number.parseFloat(amountInput.value || '0');
  const from = fromCurrency.value;
  const to = toCurrency.value;
  const baseKnuts = amount * canonicalRates[from].Knuts;
  const result = baseKnuts / canonicalRates[to].Knuts;

  conversionOutput.textContent = `${formatCurrency(result, to === 'Knuts' ? 0 : 2)} ${to}`;
}

function renderAllocationInputs() {
  allocationList.innerHTML = '';

  for (const asset of state.allocations) {
    const row = document.createElement('div');
    row.className = 'allocation-row';
    row.innerHTML = `
      <strong>${asset.name}</strong>
      <input type="range" min="0" max="100" step="1" value="${asset.share}" aria-label="${asset.name} allocation" />
      <div class="value">${asset.share}%</div>
    `;

    const slider = row.querySelector('input');
    const valueLabel = row.querySelector('.value');

    slider.addEventListener('input', () => {
      asset.share = Number(slider.value);
      valueLabel.textContent = `${asset.share}%`;
      updatePortfolioMetrics();
    });

    allocationList.appendChild(row);
  }
}

function computeAssetValue(asset, marketFactor) {
  const priceDrift = asset.base * (1 + marketFactor * (0.85 + asset.volatility));
  const allocationFactor = asset.share / 100;
  return priceDrift * allocationFactor * 100;
}

function updatePortfolioMetrics() {
  const totalShare = state.allocations.reduce((sum, asset) => sum + asset.share, 0);
  const normalizedShares = totalShare > 0 ? totalShare : 1;
  const marketFactor = (state.price - 1.2) * 0.4 + state.volatility * 0.35;

  let totalValue = 0;
  let weightedRisk = 0;
  let maxShare = 0;

  for (const asset of state.allocations) {
    const normalizedAsset = asset.share / normalizedShares;
    totalValue += computeAssetValue({ ...asset, share: normalizedAsset * 100 }, marketFactor);
    weightedRisk += normalizedAsset * asset.volatility;
    maxShare = Math.max(maxShare, normalizedAsset);
  }

  const projectedYield = 4.8 + marketFactor * 8.5 - weightedRisk * 3.1 + maxShare * 1.8;
  const riskScore = Math.min(99, Math.max(11, 18 + weightedRisk * 120 + Math.abs(marketFactor) * 28 + maxShare * 12));
  const concentration = Math.min(100, maxShare * 100);
  const reserveBuffer = Math.max(2, 100 - concentration - riskScore * 0.45);
  const maxDrawdown = Math.min(24, Math.max(2.4, weightedRisk * 42 + Math.abs(marketFactor) * 18));
  const shockExposure = Math.min(100, (state.volatility * 100 + riskScore * 0.42 + concentration * 0.18) / 1.35);

  portfolioValue.textContent = `${formatCurrency(totalValue)} G`; 
  portfolioYield.textContent = `${projectedYield.toFixed(1)}%`;
  riskIndex.textContent = `${riskScore.toFixed(0)}/100`;
  volatilityOutput.textContent = `${(weightedRisk * 100).toFixed(1)}%`;
  concentrationOutput.textContent = `${concentration.toFixed(0)}%`;
  reserveBufferOutput.textContent = `${reserveBuffer.toFixed(1)}%`;
  maxDrawdownOutput.textContent = `${maxDrawdown.toFixed(1)}%`;
  shockExposureOutput.textContent = `${shockExposure.toFixed(0)}/100`;

  document.documentElement.style.setProperty('--risk-glow', `${Math.min(1, riskScore / 100).toFixed(2)}`);
}

function renderSecurityLog() {
  securityLog.innerHTML = '';
  for (const event of state.securityEvents.slice().reverse()) {
    const element = document.createElement('div');
    element.className = `event flag-${event.severity}`;
    element.innerHTML = `
      <time>${event.time}</time>
      <div>
        <strong>${event.title}</strong>
        <span>${event.detail}</span>
      </div>
    `;
    securityLog.appendChild(element);
  }
}

function pushSecurityEvent(title, detail, severity = 'low') {
  state.securityEvents.push({ title, detail, severity, time: formatTimestamp() });
  if (state.securityEvents.length > 8) {
    state.securityEvents.shift();
  }
  renderSecurityLog();
}

function resizeCanvas() {
  const width = chartCanvas.clientWidth;
  const height = chartCanvas.clientHeight;
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  chartCanvas.width = Math.floor(width * ratio);
  chartCanvas.height = Math.floor(height * ratio);
  chartContext.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawChart() {
  const width = chartCanvas.clientWidth;
  const height = chartCanvas.clientHeight;
  const margin = { top: 24, right: 22, bottom: 30, left: 50 };
  const series = state.chartSeries;
  const values = series.flatMap((candle) => [candle.low, candle.high]);
  const min = Math.min(...values) * 0.985;
  const max = Math.max(...values) * 1.015;
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const step = plotWidth / series.length;
  const candleWidth = Math.max(4, step * 0.58);

  chartContext.clearRect(0, 0, width, height);
  chartContext.fillStyle = 'rgba(3, 9, 6, 0.18)';
  chartContext.fillRect(0, 0, width, height);

  chartContext.strokeStyle = 'rgba(216, 177, 90, 0.1)';
  chartContext.lineWidth = 1;
  for (let line = 0; line <= 4; line += 1) {
    const y = margin.top + (plotHeight / 4) * line;
    chartContext.beginPath();
    chartContext.moveTo(margin.left, y);
    chartContext.lineTo(width - margin.right, y);
    chartContext.stroke();
  }

  const yFor = (value) => margin.top + (max - value) * (plotHeight / (max - min));

  chartContext.strokeStyle = 'rgba(244, 216, 139, 0.35)';
  chartContext.fillStyle = 'rgba(244, 216, 139, 0.08)';
  chartContext.beginPath();
  series.forEach((candle, index) => {
    const x = margin.left + index * step + step / 2;
    const y = yFor(candle.close);
    if (index === 0) {
      chartContext.moveTo(x, y);
    } else {
      chartContext.lineTo(x, y);
    }
  });
  chartContext.stroke();

  series.forEach((candle, index) => {
    const x = margin.left + index * step + step / 2;
    const openY = yFor(candle.open);
    const closeY = yFor(candle.close);
    const highY = yFor(candle.high);
    const lowY = yFor(candle.low);
    const rising = candle.close >= candle.open;
    const color = rising ? '#5fd19b' : '#f36a5f';

    chartContext.strokeStyle = color;
    chartContext.lineWidth = 2;
    chartContext.beginPath();
    chartContext.moveTo(x, highY);
    chartContext.lineTo(x, lowY);
    chartContext.stroke();

    chartContext.fillStyle = color;
    const top = Math.min(openY, closeY);
    const bodyHeight = Math.max(2, Math.abs(openY - closeY));
    chartContext.fillRect(x - candleWidth / 2, top, candleWidth, bodyHeight);
  });

  const latest = series[series.length - 1];
  const delta = ((latest.close - series[series.length - 2].close) / series[series.length - 2].close) * 100;
  chartDelta.textContent = `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}% from prior candle`;
}

function advanceMarket() {
  state.previousPrice = state.price;
  const marketShock = (Math.random() - 0.48) * 0.09;
  const vaultFlow = (Math.sin(Date.now() / 6400) + Math.cos(Date.now() / 3900)) * 0.015;
  const drift = marketShock + vaultFlow;
  const nextPrice = Math.max(0.55, state.price + drift);
  const open = state.price;
  const close = nextPrice;
  const high = Math.max(open, close) + Math.random() * 0.05 + state.volatility * 0.03;
  const low = Math.min(open, close) - Math.random() * 0.05 - state.volatility * 0.03;

  state.price = nextPrice;
  state.volatility = 0.15 + Math.abs(drift) * 3.5 + Math.random() * 0.08;
  state.instrumentIndex = (state.instrumentIndex + 1) % state.instrumentFrame.length;
  state.instrumentFrame = state.instrumentFrame.map((instrument, index) => {
    const baseMove = index === state.instrumentIndex ? drift * 4.6 : drift * 1.8;
    const nextInstrumentPrice = Math.max(0.01, instrument.price + baseMove + (Math.random() - 0.5) * instrument.swing * 0.08);
    return {
      ...instrument,
      price: nextInstrumentPrice,
      delta: nextInstrumentPrice - instrument.price,
    };
  });
  state.chartSeries.push({ open, close, high, low });
  if (state.chartSeries.length > 42) {
    state.chartSeries.shift();
  }

  const pulse = drift > 0.05 ? 'Surging' : drift < -0.05 ? 'Turbulent' : drift < -0.015 ? 'Braced' : 'Stable';
  marketPulse.textContent = pulse;
  feedStatus.textContent = drift > 0.03 ? 'ALERT' : drift < -0.03 ? 'STRESSED' : 'LIVE';
  vaultIntegrity.textContent = `${Math.max(92.4, 98.4 - Math.abs(drift) * 12).toFixed(1)}%`;
  syncInstrumentFocus();

  if (Math.abs(drift) > 0.05) {
    pushSecurityEvent(
      'High-Security Deposit Registered',
      `Price shock absorbed by reserve wards. Movement ${drift >= 0 ? 'up' : 'down'} ${Math.abs(drift).toFixed(3)} G/USD.`,
      'high'
    );
  } else if (Math.abs(drift) > 0.02) {
    pushSecurityEvent(
      'Dragon-Guarded Transfer Logged',
      `A vault transfer clipped the outer ring with ${Math.abs(drift).toFixed(3)} G/USD volatility.`,
      'medium'
    );
  }

  convertCurrency();
  updatePortfolioMetrics();
  drawChart();
}

function downloadLedger() {
  const lines = [
    'Gringotts Transaction Invoice',
    `Generated: ${new Date().toLocaleString()}`,
    '',
    'Vault Allocation Summary',
    ...state.allocations.map((asset) => `${asset.name}: ${asset.share}%`),
    '',
    `Total Projected Net Worth: ${portfolioValue.textContent}`,
    `Risk Index: ${riskIndex.textContent}`,
    `Volatility: ${volatilityOutput.textContent}`,
    '',
    'Security Flags',
    ...state.securityEvents.map((event) => `${event.time} | ${event.title} | ${event.detail}`),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `gringotts-invoice-${Date.now()}.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
  pushSecurityEvent('Invoice Export Completed', 'Transaction invoice written to the client ledger.', 'low');
}

function resetAllocations() {
  const defaults = [32, 26, 24, 18];
  state.allocations.forEach((asset, index) => {
    asset.share = defaults[index];
  });
  renderAllocationInputs();
  updatePortfolioMetrics();
  pushSecurityEvent('Allocation Model Reset', 'Vault weights restored to strategic baseline.', 'low');
}

function bindEvents() {
  amountInput.addEventListener('input', convertCurrency);
  fromCurrency.addEventListener('change', convertCurrency);
  toCurrency.addEventListener('change', convertCurrency);
  resetAllocation.addEventListener('click', resetAllocations);
  downloadInvoice.addEventListener('click', downloadLedger);
  window.addEventListener('resize', () => {
    resizeCanvas();
    drawChart();
  });
}

function bootstrap() {
  populateSelects();
  populateTicker();
  renderInstruments();
  renderAllocationInputs();
  resizeCanvas();
  bindEvents();
  convertCurrency();
  updatePortfolioMetrics();
  syncInstrumentFocus();
  pushSecurityEvent('Vault Feed Online', 'Exchange feeds and security wards initialized.', 'low');
  pushSecurityEvent('Portfolio Surface Armed', 'Commodity modeler synced against simulated volatility.', 'low');
  drawChart();
  advanceMarket();
  setInterval(advanceMarket, 2400);
}

bootstrap();
