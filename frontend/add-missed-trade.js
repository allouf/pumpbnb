// Script to manually add missed sell transaction to local storage
// Run this in browser console

const tokenAddress = '0x8d00d3e20be61cdee4b602b7b032cfc64dcfd3b3';
const txHash = '0xe50cc920adaf21f5e4fcf867358b0dcd46d9afae4bea86e81347bd8a8a79ea1b';

// Create trade data based on the transaction
const tradeData = {
  tokenAddress,
  trader: '0x5F9Ce34bB4909088Bf2D3629249f2EfA0d6A9F94', // Your wallet
  isBuy: false, // This is a sell transaction
  amountIn: '1000000000000000000000000', // 1M tokens (estimate)
  amountOut: '100000000000000000', // 0.1 ASTER (estimate) 
  fee: '0',
  timestamp: new Date('2025-11-11T19:21:25Z').toISOString(), // From BSCScan
  txHash,
  blockNumber: 72183310, // From BSCScan
  asterAmount: '100000000000000000', // 0.1 ASTER
  tokenAmount: '1000000000000000000000000', // 1M tokens
  isLocal: true
};

// Get existing local trades
const localStorageKey = `pumpbnb_local_trades_${tokenAddress}`;
let existingTrades = [];
try {
  const stored = localStorage.getItem(localStorageKey);
  if (stored) {
    existingTrades = JSON.parse(stored);
  }
} catch (error) {
  console.error('Error reading existing trades:', error);
}

// Check if this trade already exists
const existingIndex = existingTrades.findIndex(trade => trade.txHash === txHash);
if (existingIndex >= 0) {
  console.log('✅ Trade already exists in local storage');
} else {
  // Add the new trade
  existingTrades.push(tradeData);
  
  // Save back to localStorage
  try {
    localStorage.setItem(localStorageKey, JSON.stringify(existingTrades));
    console.log('✅ Trade added to local storage successfully!');
    console.log('📊 Trade data:', tradeData);
    console.log('🔄 Refresh the page to see the trade in the trades table');
  } catch (error) {
    console.error('❌ Error saving trade to local storage:', error);
  }
}

console.log('📋 Current local trades count:', existingTrades.length);