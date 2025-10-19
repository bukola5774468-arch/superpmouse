# 🚀 API Setup Guide for Real-Time Trading Dashboard

## Current Status: ✅ Working with Binance API (Most Accurate!)

Your dashboard is now configured for **0.5-second real-time updates** using **Binance API** - the world's largest exchange with the most accurate prices!

### Why Binance API?
- ✅ **Most accurate prices** globally
- ✅ **Highest liquidity** (billions in daily volume)
- ✅ **No API key required**
- ✅ **True 24h statistics** (high, low, volume)
- ✅ **Free forever**

---

## Option 1: Binance API (Currently Active) ✅

**Status:** Already configured and working perfectly!

**Features:**
- ✅ **No API key required**
- ✅ **0.5-second updates** (500ms)
- ✅ **Most accurate spot prices**
- ✅ **Unlimited free calls**
- ✅ **Real 24h high/low data**
- ✅ **Best for general trading**

**No setup needed! Just open the dashboard and it works!**

**Price Sources:**
- BTC: Binance BTCUSDT spot market
- ETH: Binance ETHUSDT spot market  
- BNB: Binance BNBUSDT spot market

---

## Option 2: DexTools API (Optional - For DEX Prices)

If you specifically want **decentralized exchange (DEX)** prices instead of centralized exchange prices, follow these steps:

### Step 1: Get Your DexTools API Key

1. Go to: https://www.dextools.io/app/en/developers
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy your API key

### Step 2: Add Your API Key

Open `script.js` and update line 8:

```javascript
const DEXTOOLS_API_KEY = 'YOUR_DEXTOOLS_API_KEY'; // Replace with your actual key
```

### Step 3: Save and Refresh

Save the file and refresh your browser!

The dashboard will automatically switch from Binance to DexTools when it detects a valid API key.

---

## API Comparison

| Feature | Binance API (Current) ✅ | DexTools API |
|---------|------------------------|---------------|
| API Key | ❌ Not Required | ✅ Required (Free) |
| Setup | None | 5 minutes |
| Price Type | CEX Spot Prices | DEX Pool Prices |
| Update Speed | 500ms (0.5s) | 500ms (0.5s) |
| Accuracy | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Liquidity | Massive | Varies |
| Free Calls | Unlimited | Limited |
| Best For | General Trading | DeFi/DEX Trading |

**Recommendation:** Stick with Binance API (current setup) - most accurate prices!

---

## How Fast is 0.5 Seconds?

With **500ms refresh interval**, you get:
- **2 updates per second**
- **120 updates per minute**
- **7,200 updates per hour**

This is true real-time tracking! 🔥

---

## Performance Notes

The dashboard is optimized for ultra-fast updates:
- DOM updates batched with `requestAnimationFrame`
- Charts update every 5 seconds (not every 0.5s to avoid clutter)
- Console logs reduced to show every 5 seconds
- Price change animations show green/red flashes

---

## Troubleshooting

### Issue: Too many API calls
**Solution:** Increase `REFRESH_INTERVAL` in `script.js`:
```javascript
const REFRESH_INTERVAL = 1000; // 1 second instead of 0.5
```

### Issue: Prices not updating
**Solution:** 
1. Open browser console (F12)
2. Check for error messages
3. Verify you're using `http://localhost` not `file://`

### Issue: Rate limit exceeded
**Solution:**
- Wait 1 minute
- Increase refresh interval to 1000ms or higher
- Binance has generous rate limits, 500ms = 120 calls/min is very safe
- If using DexTools, check your API tier limits

---

## Running the Dashboard

### Method 1: Simple HTTP Server (Recommended)

```bash
# Python 3
python -m http.server 8000

# Then open: http://localhost:8000
```

### Method 2: Node.js

```bash
npx http-server -p 8000

# Then open: http://localhost:8000
```

### Method 3: VS Code Live Server

1. Install "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"

---

## Security Note

⚠️ **Never commit your API keys to GitHub!**

If using CoinMarketCap:
- Keep your API key private
- Don't share it in screenshots
- Add `script.js` to `.gitignore` if pushing to GitHub

---

## Need Help?

1. Check browser console (F12) for errors
2. Read `TROUBLESHOOTING.md`
3. Verify you're accessing via `http://localhost`, not `file://`

Enjoy your real-time crypto dashboard! 📈🚀

