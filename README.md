# 🚀 Cryptocurrency Trading Dashboard

A beautiful, real-time cryptocurrency price tracking dashboard for Bitcoin (BTC), Ethereum (ETH), and Binance Coin (BNB).

## Features

- **⚡ ULTRA REAL-TIME**: Price updates every **0.5 SECONDS** (500ms) - 2 updates per second!
- **💰 Portfolio Management**: Track your 20 ETH holdings with live USD value calculation
- **📊 Most Accurate Prices**: Direct from **Binance** - world's largest exchange
- **💎 True 24h Statistics**: Real high, low, volume, and change data
- **📈 Mini Charts**: Visual price trend sparklines for each coin
- **🎨 Beautiful UI**: Modern, responsive design with buttery smooth animations
- **🔴 LIVE Indicator**: Real-time connection status showing 500ms refresh rate
- **🎯 Price Change Alerts**: Instant visual flash animations (green ↗️ up, red ↘️ down)
- **🚀 Binance API**: No API key required - most accurate prices!
- **⚙️ Optional DexTools**: Can switch to DEX prices if desired

## How to Use

1. **Start a Local Server**: Run `python -m http.server 8000` in the project folder
2. **Open Browser**: Visit `http://localhost:8000`
3. **Watch Real-Time Updates**: Prices update **every 0.5 seconds** automatically!
4. **Manual Refresh**: Click the "🔄 Refresh" button for instant update
5. **Portfolio Value**: Your 20 ETH wallet value updates in real-time (USD)
6. **Price Flashes**: Watch for green (price up) and red (price down) animations

## Technical Details

- **Data Source**: Binance API (free, no API key required!)
- **Price Accuracy**: ⭐⭐⭐⭐⭐ World's largest exchange
- **Update Frequency**: **0.5 seconds (500ms)** - TRUE real-time tracking!
- **Updates Per Second**: 2 price updates every second
- **Updates Per Minute**: 120 price updates
- **Supported Cryptocurrencies**: BTC, ETH, BNB
- **Technologies Used**: HTML5, CSS3, Vanilla JavaScript
- **Performance**: Optimized with DOM batching and requestAnimationFrame
- **Alternative API**: DexTools support built-in (requires free API key)
- **Real-Time Features**: Instant price change detection with visual animations

## File Structure

```
├── index.html          # Main HTML structure
├── styles.css          # All styling and animations
├── script.js           # JavaScript for API calls and updates
└── README.md          # This file
```

## Customization

### Change Wallet Amount
Edit the `WALLET_ETH_AMOUNT` constant in `script.js`:
```javascript
const WALLET_ETH_AMOUNT = 20; // Change this value
```

### Change Update Frequency
Edit the `REFRESH_INTERVAL` constant in `script.js`:
```javascript
const REFRESH_INTERVAL = 500; // Time in milliseconds (500 = 0.5 seconds)
```

**Current Setting**: 500ms = 2 updates per second (ultra real-time!)

**Available Options**:
- `500` = 0.5 seconds (2 updates/sec) - Current setting
- `1000` = 1 second (1 update/sec)
- `5000` = 5 seconds (12 updates/min)
- `10000` = 10 seconds (6 updates/min)

**Note**: Binance has generous rate limits, so 500ms (120 calls/min) is very safe!

### Add More Cryptocurrencies
To add more coins, you'll need to:
1. Add a new price card in `index.html`
2. Update the API call in `script.js` to include the new coin ID
3. Add a new `updateCryptoCard()` call for the new coin

## API Configuration

### Current Setup: Binance API ✅
- **No API key required!** Works out of the box
- **Most accurate prices** from world's largest exchange
- **Rate Limit**: Generous (unlimited for our usage)
- **Current Usage**: 120 calls/minute (500ms interval)
- **Status**: ✅ Perfect for real-time tracking

### Optional: DexTools API
Want DEX prices instead? See `DEXTOOLS_SETUP.md` for instructions!

1. Get free API key from https://www.dextools.io/app/en/developers
2. Add key to `script.js` (line 8)
3. Automatically switches to DEX prices

**Both APIs support 0.5-second real-time updates!**

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Any modern browser with ES6 support

## Live Features

✅ Real-time price updates  
✅ 24-hour price change percentage  
✅ Daily high/low prices  
✅ Market capitalization  
✅ Portfolio value calculation  
✅ Price trend charts  
✅ Responsive design  
✅ Connection status indicator  

## Notes

- Internet connection required for real-time data
- Prices are in USD
- Historical chart data loads on initial page load
- All price calculations are done client-side

Enjoy tracking your crypto portfolio! 📈

