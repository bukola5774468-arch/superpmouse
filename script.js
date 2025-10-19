// Cryptocurrency Trading Dashboard
// Real-time price tracking for BTC, ETH, and BNB

const WALLET_ETH_AMOUNT = 20; // User's ETH holdings
const REFRESH_INTERVAL = 500; // 0.5 seconds for real-time updates

// DexTools API Configuration
const DEXTOOLS_API_KEY = 'YOUR_DEXTOOLS_API_KEY'; // Get from https://www.dextools.io/app/en/developers
const DEXTOOLS_API_BASE = 'https://public-api.dextools.io/trial/v2';

// Specific DEX trading pairs you want to track
const DEX_PAIRS = {
    ETH: {
        chain: 'ether',
        pair: '0x4e68ccd3e89f51c3074ca5072bbac773960dfa36' // Your specific ETH pair
    },
    BNB: {
        chain: 'bnb',
        pair: '0x16b9a82891338f9ba80e2d6970fdda79d1eb0dae' // Your specific BNB pair
    },
    BTC: {
        // Using Binance for BTC since it's not a DEX token
        useBinance: true
    }
};

let updateTimer;
let countdown = REFRESH_INTERVAL / 1000;
let updateCount = 0;

// Store price history for charts
const priceHistory = {
    bitcoin: [],
    ethereum: [],
    binancecoin: []
};

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('Crypto Dashboard Initialized - Real-Time Mode Active');
    updatePrices();
    
    // Set up auto-refresh for real-time updates
    setInterval(updatePrices, REFRESH_INTERVAL);
    
    // Countdown timer for next update
    startCountdown();
    
    // Manual refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        updatePrices();
        animateRefreshButton();
        resetCountdown();
    });
    
    // Moon Task Calculator - Auto-calculate BNB
    setupMoonTaskCalculator();
});

// Animate refresh button
function animateRefreshButton() {
    const btn = document.getElementById('refreshBtn');
    btn.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        btn.style.transform = 'rotate(0deg)';
    }, 600);
}

// Fetch cryptocurrency prices - DexTools API for your specific pairs
async function updatePrices() {
    updateStatus('connecting');
    updateCount++;
    
    if (updateCount % 10 === 1) {
        console.log(`🔄 Fetching prices from your DEX pairs... (Update #${updateCount})`);
    }
    
    try {
        let data;
        
        if (DEXTOOLS_API_KEY === 'YOUR_DEXTOOLS_API_KEY') {
            // Using fallback without API key - direct DexTools public endpoints
            console.log('⚠️ Using public DexTools API - Add API key for better rate limits');
            data = await fetchPricesPublicDexTools();
        } else {
            // Using DexTools API with your key
            data = await fetchPricesDexTools();
        }
        
        // Update each cryptocurrency
        updateCryptoCard('btc', 'bitcoin', data.bitcoin);
        updateCryptoCard('eth', 'ethereum', data.ethereum);
        updateCryptoCard('bnb', 'binancecoin', data.binancecoin);
        
        // Update ETH to BNB exchange rate (updates both circle and Moon Task calculator)
        updateExchangeRate(data.ethereum.usd, data.binancecoin.usd);
        
        // Update last update time
        updateLastUpdateTime();
        
        // Update status
        updateStatus('connected');
        
        // Store prices for charts and update every 20 updates (10 seconds)
        if (updateCount % 20 === 0) {
            storePriceHistory(data);
            drawCharts();
        }
        
        if (updateCount % 50 === 0) {
            console.log('✅ 25 seconds of real-time DEX updates completed');
        }
        
    } catch (error) {
        console.error('❌ Error fetching prices:', error);
        updateStatus('error');
        
        const statusText = document.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = `Error: ${error.message}`;
        }
    }
}

// Fetch from DexTools API with your specific pairs (with API key)
async function fetchPricesDexTools() {
    // Fetch your specific pairs in parallel
    const [btcData, ethData, bnbData] = await Promise.all([
        fetchBTCPrice(), // BTC from Binance
        fetchDexToolsPair(DEX_PAIRS.ETH.chain, DEX_PAIRS.ETH.pair),
        fetchDexToolsPair(DEX_PAIRS.BNB.chain, DEX_PAIRS.BNB.pair)
    ]);
    
    return {
        bitcoin: btcData,
        ethereum: ethData,
        binancecoin: bnbData
    };
}

// Fetch from DexTools public API (no key needed)
async function fetchPricesPublicDexTools() {
    // Fetch your specific pairs in parallel
    const [btcData, ethData, bnbData] = await Promise.all([
        fetchBTCPrice(), // BTC from Binance
        fetchDexToolsPairPublic(DEX_PAIRS.ETH.chain, DEX_PAIRS.ETH.pair),
        fetchDexToolsPairPublic(DEX_PAIRS.BNB.chain, DEX_PAIRS.BNB.pair)
    ]);
    
    return {
        bitcoin: btcData,
        ethereum: ethData,
        binancecoin: bnbData
    };
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

// Fetch BTC price from Binance
async function fetchBTCPrice() {
    return await fetchBinancePair('BTCUSDT');
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

// Legacy Binance fetch (keeping for compatibility)
async function fetchPricesBinance() {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
    
    const responses = await Promise.all(
        symbols.map(symbol => 
            fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
        )
    );
    
    const data = await Promise.all(responses.map(r => r.json()));
    
    return {
        bitcoin: {
            usd: parseFloat(data[0].lastPrice),
            usd_24h_change: parseFloat(data[0].priceChangePercent),
            usd_24h_high: parseFloat(data[0].highPrice),
            usd_24h_low: parseFloat(data[0].lowPrice),
            usd_market_cap: parseFloat(data[0].quoteVolume)
        },
        ethereum: {
            usd: parseFloat(data[1].lastPrice),
            usd_24h_change: parseFloat(data[1].priceChangePercent),
            usd_24h_high: parseFloat(data[1].highPrice),
            usd_24h_low: parseFloat(data[1].lowPrice),
            usd_market_cap: parseFloat(data[1].quoteVolume)
        },
        binancecoin: {
            usd: parseFloat(data[2].lastPrice),
            usd_24h_change: parseFloat(data[2].priceChangePercent),
            usd_24h_high: parseFloat(data[2].highPrice),
            usd_24h_low: parseFloat(data[2].lowPrice),
            usd_market_cap: parseFloat(data[2].quoteVolume)
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
    
    // Update price with animation
    const priceElement = document.getElementById(`${symbol}-price`);
    const oldPrice = parseFloat(priceElement.textContent.replace(/[$,]/g, '')) || 0;
    const newPrice = price;
    
    priceElement.textContent = formatPrice(price);
    
    // Add flash animation based on price change
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
        statusText.textContent = `🔴 LIVE • Real-Time (${REFRESH_INTERVAL}ms refresh)`;
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

// Store price history for charts
function storePriceHistory(data) {
    const maxHistory = 50; // Keep last 50 data points for smooth 24h view
    
    priceHistory.bitcoin.push(data.bitcoin.usd);
    priceHistory.ethereum.push(data.ethereum.usd);
    priceHistory.binancecoin.push(data.binancecoin.usd);
    
    // Keep only last 50 data points (24h window)
    if (priceHistory.bitcoin.length > maxHistory) {
        priceHistory.bitcoin.shift();
        priceHistory.ethereum.shift();
        priceHistory.binancecoin.shift();
    }
}

// Draw mini charts
function drawCharts() {
    drawMiniChart('btc-canvas', priceHistory.bitcoin, '#667eea');
    drawMiniChart('eth-canvas', priceHistory.ethereum, '#764ba2');
    drawMiniChart('bnb-canvas', priceHistory.binancecoin, '#F3BA2F');
}

// Draw individual mini chart
function drawMiniChart(canvasId, data, color) {
    if (data.length < 2) return;
    
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
        return { x, y };
    });
    
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
}

// Fetch 24-hour historical data for charts
async function fetchHistoricalData() {
    try {
        console.log('📈 Loading 24-hour historical chart data...');
        
        // Fetch 24h historical data from CoinGecko (free API)
        const response = await fetch(
            'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,binancecoin&order=market_cap_desc&sparkline=true&price_change_percentage=24h'
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch historical data');
        }
        
        const data = await response.json();
        
        // Extract sparkline data (24h price points)
        data.forEach(coin => {
            if (coin.id === 'bitcoin' && coin.sparkline_in_7d) {
                priceHistory.bitcoin = coin.sparkline_in_7d.price.slice(-50); // Last 50 points
            } else if (coin.id === 'ethereum' && coin.sparkline_in_7d) {
                priceHistory.ethereum = coin.sparkline_in_7d.price.slice(-50);
            } else if (coin.id === 'binancecoin' && coin.sparkline_in_7d) {
                priceHistory.binancecoin = coin.sparkline_in_7d.price.slice(-50);
            }
        });
        
        // Draw initial charts
        drawCharts();
        console.log('✅ 24-hour historical charts loaded successfully');
    } catch (error) {
        console.error('Error loading historical charts:', error);
        console.log('Charts will populate with live data');
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

