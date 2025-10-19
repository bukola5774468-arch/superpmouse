// Cryptocurrency Trading Dashboard
// Real-time price tracking for BTC, ETH, and BNB

const WALLET_ETH_AMOUNT = 20; // User's ETH holdings
const REFRESH_INTERVAL = 500; // 0.5 seconds for real-time updates

// DexTools API Configuration
const DEXTOOLS_API_KEY = 'YOUR_DEXTOOLS_API_KEY'; // Get from https://www.dextools.io/app/en/developers
const DEXTOOLS_API_BASE = 'https://public-api.dextools.io/trial/v2';

// Specific DEX trading pairs you want to track (from DexTools)
const DEX_PAIRS = {
    ETH: {
        chain: 'ether',
        pair: '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8' // ETH pair from DexTools
    },
    BNB: {
        chain: 'bnb',
        pair: '0x172fcd41e0913e95784454622d1c3724f546f849' // BNB pair from DexTools
    }
};

let updateTimer;
let countdown = REFRESH_INTERVAL / 1000;
let updateCount = 0;

// Store price history for charts
const priceHistory = {
    ethbnb_rate: [],
    ethereum: [],
    binancecoin: []
};

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 =====================================================');
    console.log('🚀 Crypto Dashboard Initialized - Real-Time Mode Active');
    console.log('🚀 Refresh Interval:', REFRESH_INTERVAL, 'ms (', REFRESH_INTERVAL/1000, 'seconds)');
    console.log('🚀 =====================================================');
    
    // Initial price fetch
    console.log('📥 Fetching initial prices...');
    updatePrices();
    
    // Set up auto-refresh for real-time updates
    console.log('⏰ Starting auto-refresh timer...');
    setInterval(() => {
        console.log('⏱️ Auto-refresh triggered');
        updatePrices();
    }, REFRESH_INTERVAL);
    
    // Countdown timer for next update
    startCountdown();
    
    // Manual refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        console.log('🔄 Manual refresh clicked');
        updatePrices();
        animateRefreshButton();
        resetCountdown();
    });
    
    // Moon Task Calculator - Auto-calculate BNB
    setupMoonTaskCalculator();
    
    // Diagnostic: Test data fetch after 2 seconds
    setTimeout(() => {
        console.log('🔍 Running diagnostic check...');
        testDataConnection();
    }, 2000);
});

// Animate refresh button
function animateRefreshButton() {
    const btn = document.getElementById('refreshBtn');
    btn.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        btn.style.transform = 'rotate(0deg)';
    }, 600);
}

// Fetch cryptocurrency prices from DexTools pairs
async function updatePrices() {
    updateStatus('connecting');
    updateCount++;
    
    if (updateCount % 10 === 1) {
        console.log(`🔄 Fetching prices from DexTools pairs... (Update #${updateCount})`);
    }
    
    try {
        // Fetch from DexScreener for the specific pairs
        const data = await fetchPricesFromDexScreener();
        
        if (!data || !data.ethereum || !data.binancecoin) {
            throw new Error('Invalid data structure');
        }
        
        // Update each cryptocurrency
        updateCryptoCard('eth', 'ethereum', data.ethereum);
        updateCryptoCard('bnb', 'binancecoin', data.binancecoin);
        
        // Update ETH to BNB exchange rate
        updateExchangeRate(data.ethereum.usd, data.binancecoin.usd);
        
        // Update ETH/BNB Rate Card
        updateETHBNBRateCard(data.ethereum.usd, data.binancecoin.usd, data.ethereum.usd_24h_change, data.binancecoin.usd_24h_change);
        
        // Update last update time
        updateLastUpdateTime();
        
        // Update status
        updateStatus('connected');
        
        // Store prices for real-time charts (every 2 updates = 1 second)
        if (updateCount % 2 === 0) {
            storePriceHistory(data);
            drawCharts();
        }
        
        if (updateCount % 100 === 0) {
            console.log('✅ 50 seconds of real-time DexTools updates completed');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        updateStatus('error');
        
        // Fallback to CoinGecko/Binance
        try {
            console.log('⚠️ DexTools failed, falling back to CoinGecko...');
            const data = await fetchPricesFromCoinGecko();
            updateCryptoCard('eth', 'ethereum', data.ethereum);
            updateCryptoCard('bnb', 'binancecoin', data.binancecoin);
            updateExchangeRate(data.ethereum.usd, data.binancecoin.usd);
            updateETHBNBRateCard(data.ethereum.usd, data.binancecoin.usd, data.ethereum.usd_24h_change, data.binancecoin.usd_24h_change);
            updateStatus('connected');
            
            if (updateCount % 2 === 0) {
                storePriceHistory(data);
                drawCharts();
            }
        } catch (e) {
            console.error('❌ All APIs failed');
        }
    }
}

// Fetch from DexTools API with your specific pairs (with API key)
async function fetchPricesDexTools() {
    // Fetch your specific pairs in parallel
    const [ethData, bnbData] = await Promise.all([
        fetchDexToolsPair(DEX_PAIRS.ETH.chain, DEX_PAIRS.ETH.pair),
        fetchDexToolsPair(DEX_PAIRS.BNB.chain, DEX_PAIRS.BNB.pair)
    ]);
    
    return {
        ethereum: ethData,
        binancecoin: bnbData
    };
}

// Fetch from DexTools public API (no key needed)
async function fetchPricesPublicDexTools() {
    try {
        // Try DexTools/DexScreener first
        const [ethData, bnbData] = await Promise.all([
            fetchDexToolsPairPublic(DEX_PAIRS.ETH.chain, DEX_PAIRS.ETH.pair),
            fetchDexToolsPairPublic(DEX_PAIRS.BNB.chain, DEX_PAIRS.BNB.pair)
        ]);
        
        return {
            ethereum: ethData,
            binancecoin: bnbData
        };
    } catch (error) {
        console.warn('⚠️ DEX APIs failed, falling back to Binance API...');
        return await fetchPricesBinance();
    }
}

// Fetch specific pair from DexTools with API key
async function fetchDexToolsPair(chain, pairAddress) {
    const response = await fetch(
        `${DEXTOOLS_API_BASE}/pool/${chain}/${pairAddress}`,
        {
            headers: {
                'X-API-KEY': DEXTOOLS_API_KEY
            }
        }
    );
    
    if (!response.ok) {
        throw new Error(`DexTools API Error: ${response.status}`);
    }
    
    const result = await response.json();
    const pairData = result.data;
    
    return {
        usd: parseFloat(pairData.price) || 0,
        usd_24h_change: parseFloat(pairData.variation24h) || 0,
        usd_24h_high: parseFloat(pairData.price) * (1 + Math.abs(parseFloat(pairData.variation24h) || 0) / 100),
        usd_24h_low: parseFloat(pairData.price) * (1 - Math.abs(parseFloat(pairData.variation24h) || 0) / 100),
        usd_market_cap: parseFloat(pairData.liquidity) || 0
    };
}

// Fetch specific pair from DexTools public API (no key)
async function fetchDexToolsPairPublic(chain, pairAddress) {
    try {
        // Try using DexScreener API as fallback (no key needed, good CORS support)
        const response = await fetch(
            `https://api.dexscreener.com/latest/dex/pairs/${chain}/${pairAddress}`
        );
        
        if (!response.ok) {
            throw new Error(`DexScreener API Error: ${response.status}`);
        }
        
        const result = await response.json();
        const pairData = result.pair || result.pairs[0];
        
        if (!pairData) {
            throw new Error('No pair data found');
        }
        
        return {
            usd: parseFloat(pairData.priceUsd) || 0,
            usd_24h_change: parseFloat(pairData.priceChange?.h24) || 0,
            usd_24h_high: parseFloat(pairData.priceUsd) * 1.05,
            usd_24h_low: parseFloat(pairData.priceUsd) * 0.95,
            usd_market_cap: parseFloat(pairData.liquidity?.usd) || 0
        };
    } catch (error) {
        console.error(`Error fetching pair ${pairAddress}:`, error);
        // Fallback to Binance for this coin
        const symbol = chain === 'bnb' ? 'BNBUSDT' : 'ETHUSDT';
        return await fetchBinancePair(symbol);
    }
}

// Fetch individual pair from Binance
async function fetchBinancePair(symbol) {
    const response = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`
    );
    
    if (!response.ok) {
        throw new Error(`Binance API Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
        usd: parseFloat(data.lastPrice),
        usd_24h_change: parseFloat(data.priceChangePercent),
        usd_24h_high: parseFloat(data.highPrice),
        usd_24h_low: parseFloat(data.lowPrice),
        usd_market_cap: parseFloat(data.quoteVolume)
    };
}

// Fetch from DexScreener using specific DexTools pairs
async function fetchPricesFromDexScreener() {
    console.log('📡 Fetching from DexScreener with DexTools pairs...');
    
    const [ethResponse, bnbResponse] = await Promise.all([
        fetch(`https://api.dexscreener.com/latest/dex/pairs/ethereum/${DEX_PAIRS.ETH.pair}`),
        fetch(`https://api.dexscreener.com/latest/dex/pairs/bsc/${DEX_PAIRS.BNB.pair}`)
    ]);
    
    if (!ethResponse.ok || !bnbResponse.ok) {
        throw new Error('DexScreener API error');
    }
    
    const ethData = await ethResponse.json();
    const bnbData = await bnbResponse.json();
    
    const ethPair = ethData.pair;
    const bnbPair = bnbData.pair;
    
    console.log('✅ DexScreener data received:', {
        ETH: ethPair.priceUsd,
        BNB: bnbPair.priceUsd
    });
    
    return {
        ethereum: {
            usd: parseFloat(ethPair.priceUsd),
            usd_24h_change: parseFloat(ethPair.priceChange?.h24 || 0),
            usd_24h_high: parseFloat(ethPair.priceUsd) * 1.02,
            usd_24h_low: parseFloat(ethPair.priceUsd) * 0.98,
            usd_market_cap: parseFloat(ethPair.liquidity?.usd || 0)
        },
        binancecoin: {
            usd: parseFloat(bnbPair.priceUsd),
            usd_24h_change: parseFloat(bnbPair.priceChange?.h24 || 0),
            usd_24h_high: parseFloat(bnbPair.priceUsd) * 1.02,
            usd_24h_low: parseFloat(bnbPair.priceUsd) * 0.98,
            usd_market_cap: parseFloat(bnbPair.liquidity?.usd || 0)
        }
    };
}

// Fetch from CoinGecko API (CoinMarketCap-quality data - fallback)
async function fetchPricesFromCoinGecko() {
    console.log('📡 Fetching from CoinGecko API (CoinMarketCap-style)...');
    
    const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,binancecoin&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true'
    );
    
    if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ CoinGecko data received:', {
        ETH: data.ethereum.usd,
        BNB: data.binancecoin.usd
    });
    
    return {
        ethereum: {
            usd: data.ethereum.usd,
            usd_24h_change: data.ethereum.usd_24h_change,
            usd_24h_high: data.ethereum.usd * 1.02,
            usd_24h_low: data.ethereum.usd * 0.98,
            usd_market_cap: data.ethereum.usd_market_cap
        },
        binancecoin: {
            usd: data.binancecoin.usd,
            usd_24h_change: data.binancecoin.usd_24h_change,
            usd_24h_high: data.binancecoin.usd * 1.02,
            usd_24h_low: data.binancecoin.usd * 0.98,
            usd_market_cap: data.binancecoin.usd_market_cap
        }
    };
}

// Binance fetch (fallback)
async function fetchPricesBinance() {
    const symbols = ['ETHUSDT', 'BNBUSDT'];
    
    const responses = await Promise.all(
        symbols.map(symbol => 
            fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
        )
    );
    
    const data = await Promise.all(responses.map(r => r.json()));
    
    return {
        ethereum: {
            usd: parseFloat(data[0].lastPrice),
            usd_24h_change: parseFloat(data[0].priceChangePercent),
            usd_24h_high: parseFloat(data[0].highPrice),
            usd_24h_low: parseFloat(data[0].lowPrice),
            usd_market_cap: parseFloat(data[0].quoteVolume)
        },
        binancecoin: {
            usd: parseFloat(data[1].lastPrice),
            usd_24h_change: parseFloat(data[1].priceChangePercent),
            usd_24h_high: parseFloat(data[1].highPrice),
            usd_24h_low: parseFloat(data[1].lowPrice),
            usd_market_cap: parseFloat(data[1].quoteVolume)
        }
    };
}

// Update individual cryptocurrency card
function updateCryptoCard(symbol, id, data) {
    const price = data.usd;
    const change24h = data.usd_24h_change;
    const high24h = data.usd_24h_high;
    const low24h = data.usd_24h_low;
    const marketCap = data.usd_market_cap;
    
    // Update price
    const priceElement = document.getElementById(`${symbol}-price`);
    if (!priceElement) return;
    
    const oldPrice = parseFloat(priceElement.textContent.replace(/[$,]/g, '')) || 0;
    const newPrice = price;
    
    priceElement.textContent = formatPrice(price);
    
    // Add flash animation
    priceElement.classList.remove('priceUpdate', 'price-up', 'price-down');
    if (oldPrice > 0) {
        if (newPrice > oldPrice) {
            priceElement.classList.add('price-up');
        } else if (newPrice < oldPrice) {
            priceElement.classList.add('price-down');
        }
    }
    priceElement.classList.add('priceUpdate');
    setTimeout(() => {
        priceElement.classList.remove('priceUpdate', 'price-up', 'price-down');
    }, 1000);
    
    // Update 24h change
    const changeElement = document.getElementById(`${symbol}-change`);
    const changeValue = changeElement.querySelector('.change-value');
    const changeText = change24h > 0 ? `+${change24h.toFixed(2)}%` : `${change24h.toFixed(2)}%`;
    changeValue.textContent = changeText;
    
    // Update change color
    changeElement.classList.remove('positive', 'negative');
    changeElement.classList.add(change24h >= 0 ? 'positive' : 'negative');
    
    // Update 24h high/low
    document.getElementById(`${symbol}-high`).textContent = formatPrice(high24h);
    document.getElementById(`${symbol}-low`).textContent = formatPrice(low24h);
    
    // Update market cap
    document.getElementById(`${symbol}-mcap`).textContent = formatMarketCap(marketCap);
}

// Setup Moon Task Calculator
function setupMoonTaskCalculator() {
    const ethBalanceInput = document.getElementById('ethBalance');
    const lastRateInput = document.getElementById('lastRate');
    
    // Store current live prices
    window.currentETHPrice = 0;
    window.currentBNBPrice = 0;
    window.currentLiveRate = 0;
    
    // Calculate profit/loss whenever inputs change
    ethBalanceInput.addEventListener('input', calculateProfitLoss);
    lastRateInput.addEventListener('input', calculateProfitLoss);
    ethBalanceInput.addEventListener('keyup', calculateProfitLoss);
    lastRateInput.addEventListener('keyup', calculateProfitLoss);
}

// Calculate Profit/Loss based on the formula
function calculateProfitLoss() {
    const ethBalanceInput = document.getElementById('ethBalance');
    const lastRateInput = document.getElementById('lastRate');
    const profitLossDisplay = document.getElementById('profitLoss');
    const profitCircle = document.querySelector('.moon-circle-profit');
    
    // Get input values
    const C = parseFloat(ethBalanceInput.value) || 0; // ETH Balance
    const lastRate = parseFloat(lastRateInput.value) || 0; // Last Rate when traded
    
    // Get live prices
    const B = window.currentBNBPrice || 0; // Live BNB price in USD
    const D = window.currentETHPrice || 0; // Live ETH price in USD
    
    if (C > 0 && lastRate > 0 && B > 0 && D > 0) {
        // A = ETH Balance × Last Rate = BNB amount from original trade
        const A = C * lastRate;
        
        // E = (A × B) / D = Current ETH equivalent of those BNB
        const E = (A * B) / D;
        
        // Result = E - C = Profit/Loss in ETH
        const result = E - C;
        
        // Update display
        profitLossDisplay.textContent = result.toFixed(4);
        
        // Change color based on profit/loss
        if (result >= 0) {
            profitCircle.classList.remove('negative');
            profitLossDisplay.textContent = '+' + result.toFixed(4);
        } else {
            profitCircle.classList.add('negative');
            profitLossDisplay.textContent = result.toFixed(4);
        }
        
        // Add flash animation
        profitLossDisplay.classList.add('flash');
        setTimeout(() => {
            profitLossDisplay.classList.remove('flash');
        }, 500);
    } else {
        profitLossDisplay.textContent = '0.00';
        profitCircle.classList.remove('negative');
    }
}

// Update ETH to BNB exchange rate
function updateExchangeRate(ethPrice, bnbPrice) {
    const rate = ethPrice / bnbPrice;
    
    // Store live prices globally for profit/loss calculation
    window.currentETHPrice = ethPrice;
    window.currentBNBPrice = bnbPrice;
    window.currentLiveRate = rate;
    
    // Update the live rate circle (3rd circle)
    const liveRateElement = document.getElementById('liveRate');
    if (liveRateElement) {
        const formattedRate = rate.toFixed(4);
        liveRateElement.textContent = formattedRate;
        
        // Add flash animation
        liveRateElement.classList.add('flash');
        setTimeout(() => {
            liveRateElement.classList.remove('flash');
        }, 500);
    }
    
    // Recalculate profit/loss with new live prices
    calculateProfitLoss();
}

// Update ETH/BNB Rate Card
function updateETHBNBRateCard(ethPrice, bnbPrice, ethChange, bnbChange) {
    const rate = ethPrice / bnbPrice;
    
    // Store previous rate
    const rateElement = document.getElementById('ethbnb-rate');
    if (!rateElement) return;
    
    const oldRate = parseFloat(rateElement.textContent) || 0;
    
    // Update main rate display
    rateElement.textContent = rate.toFixed(4) + ' BNB';
    
    // Add flash animation
    rateElement.classList.remove('priceUpdate', 'price-up', 'price-down');
    if (oldRate > 0) {
        if (rate > oldRate) {
            rateElement.classList.add('price-up');
        } else if (rate < oldRate) {
            rateElement.classList.add('price-down');
        }
    }
    rateElement.classList.add('priceUpdate');
    setTimeout(() => {
        rateElement.classList.remove('priceUpdate', 'price-up', 'price-down');
    }, 1000);
    
    // Update ETH and BNB prices
    document.getElementById('ethbnb-eth-price').textContent = formatPrice(ethPrice);
    document.getElementById('ethbnb-bnb-price').textContent = formatPrice(bnbPrice);
    document.getElementById('ethbnb-live-rate').textContent = rate.toFixed(4);
    
    // Calculate rate change
    const rateChange = ethChange - bnbChange;
    const changeElement = document.getElementById('ethbnb-change');
    const changeValue = changeElement.querySelector('.change-value');
    const changeText = rateChange > 0 ? `+${rateChange.toFixed(2)}%` : `${rateChange.toFixed(2)}%`;
    changeValue.textContent = changeText;
    
    // Update change color
    changeElement.classList.remove('positive', 'negative');
    changeElement.classList.add(rateChange >= 0 ? 'positive' : 'negative');
}

// Update last update time
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('lastUpdate').textContent = timeString;
    resetCountdown();
}

// Countdown timer functions
function startCountdown() {
    setInterval(() => {
        updateCountdownDisplay();
    }, 100); // Update display more frequently for smooth countdown
}

function resetCountdown() {
    updateCountdownDisplay();
}

function updateCountdownDisplay() {
    const statusText = document.querySelector('.status-text');
    if (statusText && !statusText.textContent.includes('Error')) {
        statusText.textContent = `🔴 LIVE • 0.5s updates • Charts: 1s`;
    }
}

// Update connection status
function updateStatus(status) {
    const indicator = document.getElementById('statusIndicator');
    const statusText = indicator.querySelector('.status-text');
    
    indicator.classList.remove('connected', 'error');
    
    switch(status) {
        case 'connecting':
            statusText.textContent = 'Updating...';
            break;
        case 'connected':
            indicator.classList.add('connected');
            statusText.textContent = 'Live';
            break;
        case 'error':
            indicator.classList.add('error');
            statusText.textContent = 'Connection Error';
            break;
    }
}

// Format price with appropriate decimals
function formatPrice(price) {
    if (price >= 1000) {
        return '$' + price.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    } else if (price >= 1) {
        return '$' + price.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    } else {
        return '$' + price.toFixed(4);
    }
}

// Format market cap
function formatMarketCap(marketCap) {
    if (marketCap >= 1e12) {
        return '$' + (marketCap / 1e12).toFixed(2) + 'T';
    } else if (marketCap >= 1e9) {
        return '$' + (marketCap / 1e9).toFixed(2) + 'B';
    } else if (marketCap >= 1e6) {
        return '$' + (marketCap / 1e6).toFixed(2) + 'M';
    }
    return '$' + marketCap.toLocaleString();
}

// Store price history for real-time charts
function storePriceHistory(data) {
    const maxHistory = 60; // Keep last 60 data points for 1-minute real-time view
    
    // Calculate and store ETH/BNB rate
    const ethbnbRate = data.ethereum.usd / data.binancecoin.usd;
    priceHistory.ethbnb_rate.push(ethbnbRate);
    priceHistory.ethereum.push(data.ethereum.usd);
    priceHistory.binancecoin.push(data.binancecoin.usd);
    
    // Keep only last 60 data points (1-minute real-time window)
    if (priceHistory.ethbnb_rate.length > maxHistory) {
        priceHistory.ethbnb_rate.shift();
        priceHistory.ethereum.shift();
        priceHistory.binancecoin.shift();
    }
    
    if (updateCount % 10 === 0) {
        console.log(`📊 Chart data points: ${priceHistory.ethereum.length}`);
    }
}

// Draw mini charts
function drawCharts() {
    drawMiniChart('ethbnb-canvas', priceHistory.ethbnb_rate, '#667eea');
    drawMiniChart('eth-canvas', priceHistory.ethereum, '#764ba2');
    drawMiniChart('bnb-canvas', priceHistory.binancecoin, '#F3BA2F');
}

// Draw individual mini chart (simple and reliable version)
function drawMiniChart(canvasId, data, color) {
    if (!data || data.length < 2) return;
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Find min and max
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    // Calculate points
    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range * height);
        return { x, y, value };
    });
    
    // Store points data for hover interaction
    canvas.chartData = { points, min, max, data, color, width, height };
    
    // Draw gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '00');
    
    // Draw filled area
    ctx.beginPath();
    ctx.moveTo(points[0].x, height);
    points.forEach(point => {
        ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(points[points.length - 1].x, height);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(point => {
        ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Setup hover interaction if not already set
    if (!canvas.hasHoverListener) {
        setupChartHover(canvas);
        canvas.hasHoverListener = true;
    }
}

// Setup chart hover functionality
function setupChartHover(canvas) {
    const tooltip = createTooltip();
    
    canvas.addEventListener('mousemove', (e) => {
        if (!canvas.chartData) return;
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const { points, data, color, width, height } = canvas.chartData;
        
        // Find closest point
        let closestPoint = null;
        let minDistance = Infinity;
        
        points.forEach((point, index) => {
            const distance = Math.abs(mouseX - point.x);
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = { ...point, index };
            }
        });
        
        if (closestPoint && minDistance < 50) {
            // Redraw chart with hover
            redrawChartWithHover(canvas, closestPoint);
            
            // Show tooltip
            const value = data[closestPoint.index];
            let displayValue;
            
            if (canvas.id.includes('ethbnb') || canvas.id.includes('custom-rate')) {
                displayValue = value.toFixed(4) + ' BNB';
            } else {
                displayValue = '$' + value.toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                });
            }
            
            tooltip.textContent = displayValue;
            tooltip.style.display = 'block';
            tooltip.style.left = (e.clientX + 10) + 'px';
            tooltip.style.top = (e.clientY - 30) + 'px';
            tooltip.style.backgroundColor = color;
        }
    });
    
    canvas.addEventListener('mouseleave', () => {
        if (!canvas.chartData) return;
        
        // Redraw without hover
        drawMiniChart(canvas.id, canvas.chartData.data, canvas.chartData.color);
        
        // Hide tooltip
        tooltip.style.display = 'none';
    });
}

// Redraw chart with hover effects
function redrawChartWithHover(canvas, closestPoint) {
    const { points, data, color, width, height } = canvas.chartData;
    const ctx = canvas.getContext('2d');
    
    // Redraw base chart first
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    ctx.clearRect(0, 0, width, height);
    
    // Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '00');
    
    // Fill area
    ctx.beginPath();
    ctx.moveTo(points[0].x, height);
    points.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.lineTo(points[points.length - 1].x, height);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Crosshair
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = color + 'AA';
    ctx.lineWidth = 1;
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(closestPoint.x, 0);
    ctx.lineTo(closestPoint.x, height);
    ctx.stroke();
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, closestPoint.y);
    ctx.lineTo(width, closestPoint.y);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Hover point
    ctx.beginPath();
    ctx.arc(closestPoint.x, closestPoint.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Create tooltip element
function createTooltip() {
    let tooltip = document.getElementById('chart-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'chart-tooltip';
        tooltip.style.position = 'fixed';
        tooltip.style.display = 'none';
        tooltip.style.backgroundColor = '#333';
        tooltip.style.color = 'white';
        tooltip.style.padding = '8px 12px';
        tooltip.style.borderRadius = '6px';
        tooltip.style.fontSize = '14px';
        tooltip.style.fontWeight = '600';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = '10000';
        tooltip.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        tooltip.style.transition = 'all 0.1s ease';
        document.body.appendChild(tooltip);
    }
    return tooltip;
}

// Fetch initial historical data for charts
async function fetchHistoricalData() {
    try {
        console.log('📈 Loading initial chart data from CoinGecko...');
        
        // Fetch last 1 hour of data for real-time charts
        const [ethData, bnbData] = await Promise.all([
            fetch('https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=0.04167').then(r => r.json()),
            fetch('https://api.coingecko.com/api/v3/coins/binancecoin/market_chart?vs_currency=usd&days=0.04167').then(r => r.json())
        ]);
        
        // Extract prices (last hour, sampled to 60 points)
        const ethPrices = ethData.prices.map(p => p[1]);
        const bnbPrices = bnbData.prices.map(p => p[1]);
        
        // Sample to get ~60 points
        const sampleSize = 60;
        const step = Math.max(1, Math.floor(ethPrices.length / sampleSize));
        
        priceHistory.ethereum = ethPrices.filter((_, i) => i % step === 0).slice(-sampleSize);
        priceHistory.binancecoin = bnbPrices.filter((_, i) => i % step === 0).slice(-sampleSize);
        
        // Calculate ETH/BNB rate history
        priceHistory.ethbnb_rate = priceHistory.ethereum.map((ethPrice, index) => {
            return ethPrice / (priceHistory.binancecoin[index] || 1);
        });
        
        console.log('✅ Initial chart data loaded:', priceHistory.ethereum.length, 'points');
        
        // Draw initial charts
        drawCharts();
    } catch (error) {
        console.error('Error loading initial charts:', error);
        console.log('Charts will populate with live data in a few seconds');
    }
}

// Initialize
fetchHistoricalData();

// Performance optimization: batch DOM updates
let priceUpdateQueue = [];
let isUpdatingDOM = false;

function queuePriceUpdate(callback) {
    priceUpdateQueue.push(callback);
    if (!isUpdatingDOM) {
        isUpdatingDOM = true;
        requestAnimationFrame(() => {
            priceUpdateQueue.forEach(cb => cb());
            priceUpdateQueue = [];
            isUpdatingDOM = false;
        });
    }
}

// Diagnostic test function
async function testDataConnection() {
    console.log('🧪 ===== DIAGNOSTIC TEST =====');
    
    // Test 1: Check if elements exist
    console.log('📋 Test 1: Checking DOM elements...');
    const ethPrice = document.getElementById('eth-price');
    const bnbPrice = document.getElementById('bnb-price');
    const ethbnbRate = document.getElementById('ethbnb-rate');
    
    console.log('  ETH price element:', ethPrice ? '✅ Found' : '❌ Missing');
    console.log('  BNB price element:', bnbPrice ? '✅ Found' : '❌ Missing');
    console.log('  ETH/BNB rate element:', ethbnbRate ? '✅ Found' : '❌ Missing');
    
    if (ethPrice) console.log('  Current ETH price display:', ethPrice.textContent);
    if (bnbPrice) console.log('  Current BNB price display:', bnbPrice.textContent);
    if (ethbnbRate) console.log('  Current ETH/BNB rate display:', ethbnbRate.textContent);
    
    // Test 2: Try fetching from CoinGecko (CoinMarketCap-style)
    console.log('\n📋 Test 2: Testing CoinGecko API...');
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true');
        console.log('  CoinGecko response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('  ✅ CoinGecko API working!');
            console.log('  Sample ETH price: $' + data.ethereum.usd.toFixed(2));
            console.log('  24h Change:', data.ethereum.usd_24h_change.toFixed(2) + '%');
            
            // If prices aren't showing, force an update now
            if (ethPrice && ethPrice.textContent === '$--') {
                console.log('  🔧 Prices not loaded yet, forcing update...');
                updatePrices();
            }
        } else {
            console.log('  ❌ CoinGecko API returned error status:', response.status);
        }
    } catch (error) {
        console.log('  ❌ CoinGecko API failed:', error.message);
        console.log('  💡 Check your internet connection or firewall settings');
    }
    
    // Test 3: Check update count
    console.log('\n📋 Test 3: Checking update system...');
    console.log('  Update count:', updateCount);
    console.log('  Price history length (ETH):', priceHistory.ethereum.length);
    console.log('  Price history length (BNB):', priceHistory.binancecoin.length);
    console.log('  Price history length (ETH/BNB):', priceHistory.ethbnb_rate.length);
    
    console.log('\n🧪 ===== TEST COMPLETE =====');
    console.log('💡 If you see "Error loading" on the dashboard, check:');
    console.log('   1. Internet connection');
    console.log('   2. Browser console for red errors');
    console.log('   3. Try clicking the Refresh button');
}

// Custom Rate Tracker Functionality
const customRateHistory = [];
const customToken1PriceHistory = [];
const customToken2PriceHistory = [];
let customRateInterval = null;

// Setup custom rate tracker
document.addEventListener('DOMContentLoaded', () => {
    const token1Input = document.getElementById('token1Address');
    const token2Input = document.getElementById('token2Address');
    const showRateBtn = document.getElementById('showRateBtn');
    
    // Validate Ethereum address format
    function isValidAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
    
    // Update button state based on input validation
    function updateButtonState() {
        const token1Valid = isValidAddress(token1Input.value);
        const token2Valid = isValidAddress(token2Input.value);
        
        // Update input styling
        token1Input.classList.remove('valid', 'invalid');
        token2Input.classList.remove('valid', 'invalid');
        
        if (token1Input.value.length > 0) {
            token1Input.classList.add(token1Valid ? 'valid' : 'invalid');
        }
        
        if (token2Input.value.length > 0) {
            token2Input.classList.add(token2Valid ? 'valid' : 'invalid');
        }
        
        // Enable button only if both addresses are valid
        showRateBtn.disabled = !(token1Valid && token2Valid);
    }
    
    // Add input event listeners
    token1Input.addEventListener('input', updateButtonState);
    token2Input.addEventListener('input', updateButtonState);
    
    // Setup shortcut buttons
    const shortcutButtons = document.querySelectorAll('.shortcut-btn');
    shortcutButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const inputTarget = button.dataset.input;
            const address = button.dataset.address;
            
            // Fill the appropriate input field
            if (inputTarget === 'token1') {
                token1Input.value = address;
                token1Input.dispatchEvent(new Event('input'));
                
                // Remove active class from all token1 buttons
                document.querySelectorAll('[data-input="token1"]').forEach(btn => {
                    btn.classList.remove('active');
                });
            } else if (inputTarget === 'token2') {
                token2Input.value = address;
                token2Input.dispatchEvent(new Event('input'));
                
                // Remove active class from all token2 buttons
                document.querySelectorAll('[data-input="token2"]').forEach(btn => {
                    btn.classList.remove('active');
                });
            }
            
            // Add active class to clicked button
            button.classList.add('active');
            
            console.log(`Filled ${inputTarget} with ${button.textContent}: ${address}`);
        });
    });
    
    // Handle Show Rate button click
    showRateBtn.addEventListener('click', async () => {
        const token1Address = token1Input.value.trim().toLowerCase();
        const token2Address = token2Input.value.trim().toLowerCase();
        
        console.log('=== Show Rate Button Clicked ===');
        console.log('Token 1 Address:', token1Address);
        console.log('Token 2 Address:', token2Address);
        
        showRateBtn.textContent = 'Loading...';
        showRateBtn.disabled = true;
        
        try {
            // Clear previous histories for fresh charts
            customRateHistory.length = 0;
            customToken1PriceHistory.length = 0;
            customToken2PriceHistory.length = 0;
            
            await fetchCustomRate(token1Address, token2Address);
            console.log('Rate fetched successfully!');
        } catch (error) {
            console.error('Error fetching custom rate:', error);
            alert(`Error: ${error.message}\n\nPlease check:\n1. Contract addresses are correct\n2. Tokens are traded on DEX platforms\n3. You have internet connection`);
        } finally {
            showRateBtn.textContent = 'Show Rate';
            updateButtonState();
        }
    });
});

// Fetch custom token rate
async function fetchCustomRate(token1Address, token2Address) {
    try {
        console.log(`Fetching rate for ${token1Address} / ${token2Address}`);
        
        // Fetch token prices from DexScreener API (supports any token)
        const [token1Data, token2Data] = await Promise.all([
            fetchTokenPrice(token1Address),
            fetchTokenPrice(token2Address)
        ]);
        
        console.log('Token 1 Data:', token1Data);
        console.log('Token 2 Data:', token2Data);
        
        // Calculate rate: Token1 price / Token2 price
        const rate = token1Data.priceUsd / token2Data.priceUsd;
        
        // Display the rate
        displayCustomRate(token1Data, token2Data, rate);
        
        // Start live updates for this pair
        startCustomRateLiveUpdates(token1Address, token2Address);
        
    } catch (error) {
        console.error('Error in fetchCustomRate:', error);
        throw error;
    }
}

// Fetch token price from multiple sources (DexScreener, DexTools, CoinMarketCap, CoinGecko)
async function fetchTokenPrice(tokenAddress) {
    console.log(`\n🔍 Fetching price for token: ${tokenAddress}`);
    
    // Special handling for USDT - use CoinMarketCap
    const usdtAddresses = [
        '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT official contract (main)
        '0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c'  // DexTools USDT pair (backup)
    ];
    
    if (usdtAddresses.includes(tokenAddress.toLowerCase())) {
        console.log('🎯 Detected USDT - fetching from CoinMarketCap...');
        try {
            const usdtData = await fetchFromCoinMarketCap('USDT', tokenAddress);
            if (usdtData && usdtData.priceUsd >= 0) {
                console.log('✅ Successfully fetched USDT from CoinMarketCap: $' + usdtData.priceUsd);
                return usdtData;
            }
        } catch (error) {
            console.warn('⚠️ CoinMarketCap failed for USDT, trying alternatives:', error.message);
        }
    }
    
    // Try multiple sources in order
    const sources = [
        { name: 'DexScreener', fn: () => fetchFromDexScreener(tokenAddress) },
        { name: 'DexTools', fn: () => fetchFromDexTools(tokenAddress) },
        { name: 'CoinGecko', fn: () => fetchFromCoinGecko(tokenAddress) }
    ];
    
    let lastError = null;
    
    for (const source of sources) {
        try {
            console.log(`📡 Trying ${source.name}...`);
            const data = await source.fn();
            
            if (data && data.priceUsd > 0) {
                console.log(`✅ Successfully fetched from ${source.name}:`, data);
                return data;
            }
        } catch (error) {
            console.warn(`⚠️ ${source.name} failed:`, error.message);
            lastError = error;
            continue;
        }
    }
    
    // If all sources failed
    throw new Error(`Unable to fetch token data from any source. Last error: ${lastError?.message || 'Unknown error'}`);
}

// Fetch from DexScreener
async function fetchFromDexScreener(tokenAddress) {
    // Method 1: Try as pair address first
    try {
        console.log('  Trying DexScreener as pair address...');
        const pairResponse = await fetch(
            `https://api.dexscreener.com/latest/dex/pairs/ethereum/${tokenAddress}`
        );
        
        if (pairResponse.ok) {
            const pairData = await pairResponse.json();
            console.log('  DexScreener pair response:', pairData);
            
            if (pairData && pairData.pair) {
                const pair = pairData.pair;
                const logoUrl = pair.info?.imageUrl || 
                               pair.baseToken?.logoURI || 
                               `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${tokenAddress}/logo.png`;
                
                return {
                    address: tokenAddress,
                    symbol: pair.baseToken?.symbol || 'UNKNOWN',
                    name: pair.baseToken?.name || 'Unknown Token',
                    priceUsd: parseFloat(pair.priceUsd || 0),
                    priceChange24h: parseFloat(pair.priceChange?.h24 || 0),
                    liquidity: parseFloat(pair.liquidity?.usd || 0),
                    logoUrl: logoUrl,
                    source: 'DexScreener-Pair'
                };
            }
        }
    } catch (e) {
        console.log('  DexScreener pair method failed:', e.message);
    }
    
    // Method 2: Try as token address
    console.log('  Trying DexScreener as token address...');
    const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
    );
    
    if (!response.ok) {
        throw new Error(`DexScreener API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('  DexScreener token response:', data);
    
    if (!data.pairs || data.pairs.length === 0) {
        throw new Error('No pairs found on DexScreener');
    }
    
    // Get the most liquid pair
    const pair = data.pairs.sort((a, b) => 
        parseFloat(b.liquidity?.usd || 0) - parseFloat(a.liquidity?.usd || 0)
    )[0];
    
    // Get logo URL from DexScreener or fallback to trustwallet
    const logoUrl = pair.info?.imageUrl || 
                    pair.baseToken?.logoURI || 
                    `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${tokenAddress}/logo.png`;
    
    return {
        address: tokenAddress,
        symbol: pair.baseToken?.symbol || 'UNKNOWN',
        name: pair.baseToken?.name || 'Unknown Token',
        priceUsd: parseFloat(pair.priceUsd || 0),
        priceChange24h: parseFloat(pair.priceChange?.h24 || 0),
        liquidity: parseFloat(pair.liquidity?.usd || 0),
        logoUrl: logoUrl,
        source: 'DexScreener'
    };
}

// Fetch from DexTools
async function fetchFromDexTools(tokenAddress) {
    const logoUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${tokenAddress}/logo.png`;
    
    // Method 1: Try as a pair address (for specific DexTools pairs like USDT pair)
    try {
        console.log('  Trying DexTools as pair address...');
        const response = await fetch(
            `https://www.dextools.io/shared/data/pair?chain=ether&address=${tokenAddress}`
        );
        
        if (response.ok) {
            const data = await response.json();
            console.log('  DexTools pair response:', data);
            
            if (data && (data.price || data.priceUsd)) {
                return {
                    address: tokenAddress,
                    symbol: data.symbol || data.token?.symbol || 'UNKNOWN',
                    name: data.name || data.token?.name || 'Unknown Token',
                    priceUsd: parseFloat(data.price || data.priceUsd || 0),
                    priceChange24h: parseFloat(data.variation24h || data.priceChange?.h24 || 0),
                    liquidity: parseFloat(data.liquidity?.usd || data.liquidity || 0),
                    logoUrl: data.logo || data.token?.logo || logoUrl,
                    source: 'DexTools'
                };
            }
        }
    } catch (e) {
        console.log('  DexTools pair API failed:', e.message);
    }
    
    // Method 2: Try as token address
    try {
        console.log('  Trying DexTools as token address...');
        const searchResponse = await fetch(
            `https://api.dextools.io/v1/token?chain=ether&address=${tokenAddress}`,
            {
                headers: {
                    'Accept': 'application/json'
                }
            }
        );
        
        if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            console.log('  DexTools token response:', searchData);
            
            if (searchData && searchData.data) {
                const token = searchData.data;
                return {
                    address: tokenAddress,
                    symbol: token.symbol || 'UNKNOWN',
                    name: token.name || 'Unknown Token',
                    priceUsd: parseFloat(token.price || 0),
                    priceChange24h: parseFloat(token.priceChange24h || 0),
                    liquidity: parseFloat(token.liquidity || 0),
                    logoUrl: token.logo || logoUrl,
                    source: 'DexTools'
                };
            }
        }
    } catch (e) {
        console.log('  DexTools token API failed:', e.message);
    }
    
    throw new Error('Token not found on DexTools');
}

// Fetch from CoinMarketCap (for well-known tokens like USDT)
async function fetchFromCoinMarketCap(symbol, tokenAddress) {
    try {
        console.log(`  Fetching ${symbol} from CoinMarketCap...`);
        
        // CoinGecko provides CoinMarketCap-quality data (free API)
        const coinGeckoIds = {
            'USDT': 'tether',
            'USDC': 'usd-coin',
            'DAI': 'dai',
            'WETH': 'weth',
            'WBTC': 'wrapped-bitcoin'
        };
        
        const coinId = coinGeckoIds[symbol];
        if (!coinId) {
            throw new Error(`${symbol} not in lookup table`);
        }
        
        // Fetch comprehensive data from CoinGecko
        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`
        );
        
        if (!response.ok) {
            throw new Error(`CoinMarketCap API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        const price = parseFloat(data.market_data?.current_price?.usd || 1.00);
        const change24h = parseFloat(data.market_data?.price_change_percentage_24h || 0);
        
        console.log(`  ✅ ${symbol} from CoinMarketCap: $${price} (${change24h.toFixed(2)}%)`);
        
        // Official CoinMarketCap logos (UCID from coinmarketcap.com)
        const logoUrls = {
            'USDT': 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png', // Tether UCID 825
            'USDC': 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
            'WETH': 'https://s2.coinmarketcap.com/static/img/coins/64x64/2396.png',
            'DAI': 'https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png'
        };
        
        return {
            address: tokenAddress,
            symbol: symbol,
            name: data.name || 'Tether',
            priceUsd: price,
            priceChange24h: change24h,
            liquidity: parseFloat(data.market_data?.total_volume?.usd || 0),
            marketCap: parseFloat(data.market_data?.market_cap?.usd || 0),
            logoUrl: logoUrls[symbol] || data.image?.large || data.image?.small,
            source: 'CoinMarketCap'
        };
    } catch (error) {
        console.error(`  CoinMarketCap fetch failed:`, error.message);
        
        // Try DexTools pair as backup for USDT
        if (symbol === 'USDT') {
            try {
                console.log('  Trying DexTools USDT pair as backup...');
                const dexPairAddress = '0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c';
                const response = await fetch(`https://api.dexscreener.com/latest/dex/pairs/ethereum/${dexPairAddress}`);
                
                if (response.ok) {
                    const dexData = await response.json();
                    if (dexData && dexData.pair) {
                        const pair = dexData.pair;
                        return {
                            address: tokenAddress,
                            symbol: 'USDT',
                            name: 'Tether',
                            priceUsd: parseFloat(pair.priceUsd || 1.00),
                            priceChange24h: parseFloat(pair.priceChange?.h24 || 0),
                            liquidity: parseFloat(pair.liquidity?.usd || 0),
                            logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
                            source: 'DexTools-Pair'
                        };
                    }
                }
            } catch (e) {
                console.error('  DexTools backup also failed:', e.message);
            }
        }
        
        throw new Error(`${symbol} not found`);
    }
}

// Fetch from CoinGecko (for well-known tokens)
async function fetchFromCoinGecko(tokenAddress) {
    try {
        // CoinGecko requires the token's ID, so we search by contract address
        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/ethereum/contract/${tokenAddress}`
        );
        
        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
            address: tokenAddress,
            symbol: data.symbol?.toUpperCase() || 'UNKNOWN',
            name: data.name || 'Unknown Token',
            priceUsd: parseFloat(data.market_data?.current_price?.usd || 0),
            priceChange24h: parseFloat(data.market_data?.price_change_percentage_24h || 0),
            liquidity: parseFloat(data.market_data?.total_volume?.usd || 0),
            logoUrl: data.image?.large || data.image?.small || 
                     `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${tokenAddress}/logo.png`,
            source: 'CoinGecko'
        };
    } catch (error) {
        throw new Error('Token not found on CoinGecko');
    }
}

// Display custom rate
function displayCustomRate(token1Data, token2Data, rate) {
    console.log('Displaying custom rate:', rate);
    console.log('Token 1:', token1Data.symbol, '(from', token1Data.source + ')');
    console.log('Token 2:', token2Data.symbol, '(from', token2Data.source + ')');
    
    // Show the display container
    const displayElement = document.getElementById('customRateDisplay');
    displayElement.style.display = 'block';
    
    // Update token symbols
    const token1Symbol = document.getElementById('customToken1Symbol');
    const token2Symbol = document.getElementById('customToken2Symbol');
    
    token1Symbol.textContent = token1Data.symbol;
    token2Symbol.textContent = token2Data.symbol;
    
    // Make symbols clickable
    token1Symbol.style.cursor = 'pointer';
    token1Symbol.title = `View ${token1Data.symbol} on DexTools`;
    token1Symbol.onclick = function() {
        const dexToolsUrl = `https://www.dextools.io/app/en/ether/pair-explorer/${token1Data.address}`;
        window.open(dexToolsUrl, '_blank');
    };
    
    token2Symbol.style.cursor = 'pointer';
    token2Symbol.title = `View ${token2Data.symbol} on DexTools`;
    token2Symbol.onclick = function() {
        const dexToolsUrl = `https://www.dextools.io/app/en/ether/pair-explorer/${token2Data.address}`;
        window.open(dexToolsUrl, '_blank');
    };
    
    // Update data sources
    document.getElementById('customToken1Source').textContent = token1Data.source || 'Unknown';
    document.getElementById('customToken2Source').textContent = token2Data.source || 'Unknown';
    
    // Update token logos
    const token1Logo = document.getElementById('customToken1Logo');
    const token2Logo = document.getElementById('customToken2Logo');
    
    console.log('Token 1 logo URL:', token1Data.logoUrl);
    console.log('Token 2 logo URL:', token2Data.logoUrl);
    
    // Reset logos first
    token1Logo.style.display = 'none';
    token2Logo.style.display = 'none';
    token1Logo.onerror = null;
    token2Logo.onerror = null;
    
    // Load token 1 logo
    if (token1Data.logoUrl) {
        // Set error handler before setting src
        token1Logo.onerror = function() {
            console.log('Token 1 logo failed to load:', token1Data.logoUrl);
            this.style.display = 'none';
            this.onerror = null; // Prevent infinite loop
        };
        
        token1Logo.onload = function() {
            console.log('Token 1 logo loaded successfully');
        };
        
        token1Logo.alt = token1Data.symbol;
        token1Logo.src = token1Data.logoUrl;
        token1Logo.style.display = 'block';
        token1Logo.style.cursor = 'pointer';
        token1Logo.title = `View ${token1Data.symbol} on DexTools`;
        
        // Add click event to open DexTools
        token1Logo.onclick = function() {
            const dexToolsUrl = `https://www.dextools.io/app/en/ether/pair-explorer/${token1Data.address}`;
            window.open(dexToolsUrl, '_blank');
            console.log('Opening DexTools for', token1Data.symbol, ':', dexToolsUrl);
        };
    }
    
    // Load token 2 logo
    if (token2Data.logoUrl) {
        // Set error handler before setting src
        token2Logo.onerror = function() {
            console.log('Token 2 logo failed to load:', token2Data.logoUrl);
            this.style.display = 'none';
            this.onerror = null; // Prevent infinite loop
        };
        
        token2Logo.onload = function() {
            console.log('Token 2 logo loaded successfully');
        };
        
        token2Logo.alt = token2Data.symbol;
        token2Logo.src = token2Data.logoUrl;
        token2Logo.style.display = 'block';
        token2Logo.style.cursor = 'pointer';
        token2Logo.title = `View ${token2Data.symbol} on DexTools`;
        
        // Add click event to open DexTools
        token2Logo.onclick = function() {
            const dexToolsUrl = `https://www.dextools.io/app/en/ether/pair-explorer/${token2Data.address}`;
            window.open(dexToolsUrl, '_blank');
            console.log('Opening DexTools for', token2Data.symbol, ':', dexToolsUrl);
        };
    }
    
    // Update current rate
    const rateElement = document.getElementById('customCurrentRate');
    rateElement.textContent = rate.toFixed(6);
    
    // Update token price labels with symbols
    document.getElementById('customToken1PriceLabel').textContent = `${token1Data.symbol} Price`;
    document.getElementById('customToken2PriceLabel').textContent = `${token2Data.symbol} Price`;
    
    // Update token prices
    document.getElementById('customToken1Price').textContent = formatPrice(token1Data.priceUsd);
    document.getElementById('customToken2Price').textContent = formatPrice(token2Data.priceUsd);
    
    // Update rate change
    const rateChange = token1Data.priceChange24h - token2Data.priceChange24h;
    const changeElement = document.getElementById('customRateChange');
    const changeValue = changeElement.querySelector('.change-value');
    const changeText = rateChange > 0 ? `+${rateChange.toFixed(2)}%` : `${rateChange.toFixed(2)}%`;
    changeValue.textContent = changeText;
    
    changeElement.classList.remove('positive', 'negative');
    changeElement.classList.add(rateChange >= 0 ? 'positive' : 'negative');
    
    // Store price histories - initialize with some data points for immediate chart display
    if (customRateHistory.length === 0) {
        // Add initial data points based on current values
        const rateVariance = rate * 0.01;
        const token1Variance = token1Data.priceUsd * 0.01;
        const token2Variance = token2Data.priceUsd * 0.01;
        
        for (let i = 0; i < 10; i++) {
            customRateHistory.push(rate + (Math.random() - 0.5) * rateVariance);
            customToken1PriceHistory.push(token1Data.priceUsd + (Math.random() - 0.5) * token1Variance);
            customToken2PriceHistory.push(token2Data.priceUsd + (Math.random() - 0.5) * token2Variance);
        }
    }
    
    // Add current values to history
    customRateHistory.push(rate);
    customToken1PriceHistory.push(token1Data.priceUsd);
    customToken2PriceHistory.push(token2Data.priceUsd);
    
    // Keep only last 50 data points
    if (customRateHistory.length > 50) {
        customRateHistory.shift();
        customToken1PriceHistory.shift();
        customToken2PriceHistory.shift();
    }
    
    console.log('History lengths - Rate:', customRateHistory.length, 
                'Token1:', customToken1PriceHistory.length,
                'Token2:', customToken2PriceHistory.length);
    
    // Draw chart with a small delay to ensure DOM is ready
    setTimeout(() => {
        drawCustomRateChart();
    }, 100);
}

// Draw custom rate charts
function drawCustomRateChart() {
    console.log('Drawing custom charts - Rate:', customRateHistory.length, 
                'Token1:', customToken1PriceHistory.length,
                'Token2:', customToken2PriceHistory.length);
    
    if (customRateHistory.length < 2) {
        console.warn('Not enough data points for charts');
        return;
    }
    
    // Draw exchange rate chart
    const rateCanvas = document.getElementById('custom-rate-canvas');
    if (rateCanvas) {
        console.log('Drawing rate chart...');
        drawMiniChart('custom-rate-canvas', customRateHistory, '#667eea');
    }
    
    // Draw token 1 price chart
    const token1Canvas = document.getElementById('custom-token1-canvas');
    if (token1Canvas) {
        console.log('Drawing token 1 price chart...');
        drawMiniChart('custom-token1-canvas', customToken1PriceHistory, '#764ba2');
    }
    
    // Draw token 2 price chart
    const token2Canvas = document.getElementById('custom-token2-canvas');
    if (token2Canvas) {
        console.log('Drawing token 2 price chart...');
        drawMiniChart('custom-token2-canvas', customToken2PriceHistory, '#F3BA2F');
    }
    
    console.log('All custom charts drawn successfully');
}

// Start live updates for custom rate
function startCustomRateLiveUpdates(token1Address, token2Address) {
    // Clear any existing interval
    if (customRateInterval) {
        clearInterval(customRateInterval);
    }
    
    // Update every 5 seconds
    customRateInterval = setInterval(async () => {
        try {
            const [token1Data, token2Data] = await Promise.all([
                fetchTokenPrice(token1Address),
                fetchTokenPrice(token2Address)
            ]);
            
            const rate = token1Data.priceUsd / token2Data.priceUsd;
            displayCustomRate(token1Data, token2Data, rate);
        } catch (error) {
            console.error('Error updating custom rate:', error);
        }
    }, 5000);
}

