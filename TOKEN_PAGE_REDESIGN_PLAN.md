# Token Page Redesign Plan - Match Pump.fun

**Date**: 2025-11-04  
**Goal**: Redesign token page to match Pump.fun's design and functionality  
**Reference**: main.png, options.png, pump.fun live site

---

## 📊 Current vs Pump.fun Analysis

### **Pump.fun Token Page Layout** (from main.png):

#### Left Side - Main Content (70%):
1. **Token Header** (compact, top):
   - Token image + name + symbol
   - Creation time ("2h ago")
   - Contract address (Solana)
   - Share button + Favorite button
   
2. **Market Cap Section** (below header):
   - Large Market Cap display: "$7.5K"
   - 24h change: "+$2.9K (+62.90%) 24hr"
   - Progress bar showing ATH
   
3. **Chart Controls** (above chart):
   - Timeframe buttons: "5m" | icon | "Trade Display" | "Show All Bubbles" | "Price/MCap" | "USD/SOL"
   - Chart toolbar (left side vertical):
     - Crosshair tool
     - Drawing tools (trend line, horizontal line, etc.)
     - Zoom controls
     - Chart settings
     - TradingView logo
   - Period selector at bottom: "1D  5D  1M"
   - Additional controls: % | log | auto

4. **Chart** (main area):
   - Full-width candlestick chart
   - Volume bars at bottom
   - Clean, dark theme
   - Shows all candles by default (initial zoom shows full history)
   - Header ALWAYS visible (not hiding on hover)

5. **Stats Bar** (below chart):
   - Vol 24h: $475.4K
   - Price: $0.00000747
   - 5m: -21.01%
   - 1h: -73.14%
   - 6h: +62.90%

#### Right Side - Trading Panel (30%):
1. **Profit/Loss indicator** (top):
   - Shows user's position
   - P&L visualization
   
2. **Chat Section**:
   - "Join chat" button
   - Member count

3. **Bonding Curve Progress**:
   - "100.0%" with "Coin has graduated!" message
   - Progress bar

4. **Top Holders List**:
   - Wallet addresses with percentages
   - "Generate bubble map" button

---

## 🎯 Required Changes to Our Implementation

### **1. Chart Component Improvements** 🔥 PRIORITY

#### Current Issues:
- ❌ Initial zoom doesn't show all candles
- ❌ Header above chart hides on mouse hover
- ❌ No chart type selector (Candlestick, Line, Area, etc.)
- ❌ Missing drawing tools
- ❌ Missing zoom controls UI
- ❌ Chart toolbar not visible

#### Required:
- ✅ Show all candles on initial load (`fitContent()` on mount only)
- ✅ Keep stats header visible at ALL times (remove hover hide logic)
- ✅ Add chart type selector dropdown (options.png):
  - Bars
  - Candles (default)
  - Hollow Candles
  - HLC bars
  - Line
  - Line with markers
  - Step line
  - Area
  - Baseline
  - Columns
- ✅ Add chart toolbar (left side):
  - Crosshair mode toggle
  - Drawing tools (trend lines, horizontal lines)
  - Zoom in/out buttons
  - Settings button
- ✅ Add period selectors: 1D, 5D, 1M buttons
- ✅ Add % / log / auto toggles at bottom

### **2. Layout Restructure**

#### Current Layout:
```
- Full-width token header (large, takes too much space)
- Stats grid (3 columns)
- Dual progress bars (bonding curve + ATH)
- Chart (70% width)
- Trading panel (30% width)
- Tabs (Trades, Holders, Comments)
```

#### Pump.fun Layout:
```
- Compact header (left side, minimal)
- Market cap card (compact, above chart)
- Chart with built-in controls (70% width)
- Stats bar below chart
- Trading panel (30% width) with:
  - P&L indicator
  - Chat button
  - Progress bar
  - Top holders
```

#### Changes Needed:
1. **Move token header to compact format**:
   - Smaller image (80px → 60px)
   - Inline name + symbol
   - Move to top-left of chart area
   - Add back button

2. **Simplify market cap display**:
   - Single card instead of grid
   - Show: Market Cap, 24h change, progress bar
   - Place above chart

3. **Remove dual progress bars**:
   - Keep only one progress bar in right panel
   - Show "Graduated" status if applicable

4. **Simplify right panel**:
   - Remove large About section from header
   - Move creator info to bottom or tooltip
   - Focus on: P&L, Chat, Progress, Holders

### **3. Chart Display Options Menu**

From `options.png`, need to implement:
```typescript
const chartTypes = [
  { value: 'bars', label: 'Bars', icon: '📊' },
  { value: 'candles', label: 'Candles', icon: '🕯️' },
  { value: 'hollow-candles', label: 'Hollow candles', icon: '🕯️' },
  { value: 'hlc-bars', label: 'HLC bars', icon: '📊' },
  { value: 'line', label: 'Line', icon: '📈' },
  { value: 'line-markers', label: 'Line with markers', icon: '📈' },
  { value: 'step-line', label: 'Step line', icon: '📊' },
  { value: 'area', label: 'Area', icon: '🏔️' },
  { value: 'baseline', label: 'Baseline', icon: '📊' },
  { value: 'columns', label: 'Columns', icon: '📊' },
]
```

### **4. Chart Stats Header - Always Visible**

Current: Header shows/hides on hover  
Required: Always visible with real-time stats

```tsx
<div className="chart-stats-header"> {/* Always visible */}
  <div>Price: $0.00000747</div>
  <div>5m: -21.01%</div>
  <div>1h: -73.14%</div>
  <div>6h: +62.90%</div>
  <div>Vol 24h: $475.4K</div>
</div>
```

### **5. Initial Chart Zoom**

Current behavior:
```typescript
// Called on every data update - BAD
chartRef.current?.timeScale().fitContent()
```

Required behavior:
```typescript
// Call ONLY on initial mount
useEffect(() => {
  if (chartRef.current && isInitialLoad) {
    chartRef.current.timeScale().fitContent()
    setIsInitialLoad(false) // Never auto-fit again
  }
}, [isInitialLoad])
```

---

## 📝 Implementation Tasks

### **Phase 1: Chart Improvements** (Priority: HIGH)

#### Task 1.1: Fix Initial Zoom
- [ ] Add `isInitialLoad` state
- [ ] Call `fitContent()` only once on mount
- [ ] Never auto-fit on data updates
- [ ] Test with various data amounts

#### Task 1.2: Make Stats Header Always Visible
- [ ] Remove conditional rendering based on `hoveredData`
- [ ] Show both: persistent stats + hover OHLC details
- [ ] Update styling for dual display

#### Task 1.3: Add Chart Type Selector
- [ ] Create dropdown with 10 chart types
- [ ] Implement series type switching in lightweight-charts
- [ ] Add icons for each type
- [ ] Save user preference to localStorage

#### Task 1.4: Add Chart Toolbar
- [ ] Create vertical toolbar on left side
- [ ] Add crosshair toggle
- [ ] Add drawing tools buttons
- [ ] Add zoom in/out buttons
- [ ] Add settings button

#### Task 1.5: Add Period Selectors
- [ ] Add 1D, 5D, 1M buttons below chart
- [ ] Implement period filtering logic
- [ ] Add % / log / auto toggles

### **Phase 2: Layout Restructure** (Priority: MEDIUM)

#### Task 2.1: Compact Token Header
- [ ] Reduce header size
- [ ] Move to inline layout
- [ ] Add back button
- [ ] Move About section elsewhere

#### Task 2.2: Simplify Market Cap Display
- [ ] Create single compact card
- [ ] Show: MCap + 24h change + progress
- [ ] Place above chart

#### Task 2.3: Redesign Right Panel
- [ ] Add P&L indicator section
- [ ] Add Chat button/section
- [ ] Simplify progress bar
- [ ] Keep holders list

### **Phase 3: Additional Features** (Priority: LOW)

#### Task 3.1: Trading View Integration
- [ ] Add TradingView logo
- [ ] Add "Trade Display" toggle
- [ ] Add "Show All Bubbles" toggle

#### Task 3.2: Mobile Responsiveness
- [ ] Test on mobile devices
- [ ] Adjust chart height
- [ ] Stack layout vertically

---

## 🎨 Design Specifications

### **Colors** (from main.png):
```css
--chart-bg: #1a1b1e;
--chart-grid: #2b2b43;
--green-candle: #26a69a;
--red-candle: #ef5350;
--progress-bar: linear-gradient(to right, #f0b90b, #26a69a);
--text-primary: #ffffff;
--text-secondary: #a0a0a0;
```

### **Chart Dimensions**:
```css
height: 500px; /* Current */
height: 600px; /* New - taller chart */
```

### **Stats Header**:
```css
position: sticky;
top: 0;
background: rgba(26, 27, 30, 0.95);
backdrop-filter: blur(10px);
z-index: 10;
padding: 12px 16px;
border-bottom: 1px solid #2b2b43;
```

---

## 🔧 Code Changes Required

### **File: `AdvancedPriceChart.tsx`**

#### Change 1: Initial Load Logic
```typescript
const [isInitialLoad, setIsInitialLoad] = useState(true);

// Remove from data update effect:
// chartRef.current?.timeScale().fitContent() ❌

// Add new effect:
useEffect(() => {
  if (chartRef.current && isInitialLoad && candleData.length > 0) {
    chartRef.current.timeScale().fitContent();
    setIsInitialLoad(false);
  }
}, [isInitialLoad, candleData.length]);
```

#### Change 2: Always Visible Header
```typescript
// Remove:
{hoveredData && ( ... )}

// Replace with:
<div className="chart-stats-always-visible">
  {/* Always show current stats */}
</div>
{hoveredData && (
  <div className="chart-hover-ohlc">
    {/* Show OHLC on hover */}
  </div>
)}
```

#### Change 3: Chart Type Selector
```typescript
const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area'>('candlestick');

const switchChartType = (type: string) => {
  // Remove old series
  if (priceSeriesRef.current) {
    chartRef.current.removeSeries(priceSeriesRef.current);
  }
  
  // Add new series based on type
  switch(type) {
    case 'line':
      priceSeriesRef.current = chartRef.current.addSeries(LineSeries, {...});
      break;
    case 'area':
      priceSeriesRef.current = chartRef.current.addSeries(AreaSeries, {...});
      break;
    // ... other types
  }
  
  // Re-apply data
  priceSeriesRef.current.setData(candleData);
};
```

---

## 📊 Success Criteria

### **Must Have** ✅
- [ ] Chart shows all candles on initial load
- [ ] Stats header always visible (not hiding)
- [ ] Chart type selector working (min: Candles, Line, Area)
- [ ] Period filters working (1D, 5D, 1M)
- [ ] Zoom preserved on data updates
- [ ] Timeframe selector working properly

### **Should Have** 🎯
- [ ] Chart toolbar with basic controls
- [ ] Compact token header
- [ ] Simplified market cap card
- [ ] Redesigned right panel

### **Nice to Have** 💫
- [ ] Drawing tools
- [ ] All 10 chart types from options.png
- [ ] Bubble map integration
- [ ] Chat integration

---

## 🚀 Implementation Priority

### **Week 1** (Critical):
1. Fix initial chart zoom (show all candles)
2. Make stats header always visible
3. Add basic chart type selector (Candles, Line, Area)
4. Ensure period filters work correctly

### **Week 2** (Important):
1. Add chart toolbar
2. Redesign token header (compact)
3. Simplify market cap display
4. Update right panel layout

### **Week 3** (Enhancement):
1. Add remaining chart types
2. Mobile responsiveness
3. Polish and testing

---

## 📞 References

- **Design**: main.png, options.png
- **Live Site**: https://pump.fun
- **Current Code**: `frontend/components/AdvancedPriceChart.tsx`
- **Page Layout**: `frontend/app/token/[address]/TokenPageClient.tsx`

---

**Status**: Ready to implement  
**Estimated Time**: 2-3 weeks  
**Priority**: HIGH 🔥
