# Troubleshooting Guide

## Problem: Can't See ETH or BNB Prices

If you're seeing Bitcoin prices but not Ethereum or Binance Coin prices, try these steps:

### Step 1: Check Browser Console
1. Open the dashboard (`index.html`)
2. Press `F12` or right-click → "Inspect" → "Console" tab
3. Look for error messages (red text)
4. You should see logs like:
   - ✅ "Crypto Dashboard Initialized - Real-Time Mode Active"
   - 🔄 "Fetching cryptocurrency prices..."
   - ✅ "Price data received:"
   - 📊 "Updating BTC:", "Updating ETH:", "Updating BNB:"

### Step 2: Common Issues & Solutions

#### Issue: CORS or Network Errors
**Symptoms**: Console shows "CORS policy" or "Failed to fetch" errors

**Solution**: 
- Some browsers block API calls when opening HTML files directly (file://)
- Use one of these methods instead:

**Option A: Python Server (Recommended)**
```bash
# If you have Python 3
python -m http.server 8000

# Then open: http://localhost:8000
```

**Option B: VS Code Live Server**
- Install "Live Server" extension in VS Code
- Right-click `index.html` → "Open with Live Server"

**Option C: Node.js Server**
```bash
npx http-server
# Then open the URL shown
```

#### Issue: API Rate Limit
**Symptoms**: Console shows "429 Too Many Requests"

**Solution**: 
- Wait 1-2 minutes
- Increase `REFRESH_INTERVAL` in `script.js` to 30000 (30 seconds)

#### Issue: Internet/Firewall Block
**Symptoms**: Console shows "Network error" or timeout

**Solution**:
- Check your internet connection
- Check if your firewall/antivirus is blocking api.coingecko.com
- Try accessing https://api.coingecko.com/api/v3/ping in your browser

#### Issue: Cards Show $--
**Symptoms**: Cards visible but prices show "$--"

**Solution**:
- Open browser console (F12) and check for JavaScript errors
- Click the "🔄 Refresh" button
- Make sure all 3 files are in the same folder:
  - index.html
  - styles.css
  - script.js

### Step 3: Test API Connection

Open this URL in your browser to test if the API works:
```
https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin&vs_currencies=usd
```

You should see JSON data like:
```json
{
  "bitcoin": {"usd": 67000},
  "ethereum": {"usd": 2600},
  "binancecoin": {"usd": 590}
}
```

If this doesn't work, the issue is with your network/firewall.

### Step 4: Clear Browser Cache

1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "Cached files" 
3. Clear and reload the page (`Ctrl+F5`)

### Step 5: Try Different Browser

Test in a different browser:
- Google Chrome
- Mozilla Firefox  
- Microsoft Edge

### Still Not Working?

Check the browser console (F12) and look for specific error messages. The enhanced logging will show you exactly where the issue is occurring.

## Quick Fix Commands

If you want to quickly serve the dashboard properly:

```bash
# Navigate to the folder
cd "C:\Users\Vector\Desktop\New folder"

# Start a simple server (choose one):

# Python 3:
python -m http.server 8000

# Python 2:
python -m SimpleHTTPServer 8000

# Node.js:
npx http-server -p 8000

# Then open: http://localhost:8000
```

This ensures the API calls work correctly without CORS issues!

