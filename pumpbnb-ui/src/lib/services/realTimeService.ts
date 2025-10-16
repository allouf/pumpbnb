'use client';

import { Token } from '@/lib/mock-data/tokens';

export class RealTimeService {
  private static instance: RealTimeService;
  private subscribers: Map<string, ((data: any) => void)[]> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  static getInstance(): RealTimeService {
    if (!RealTimeService.instance) {
      RealTimeService.instance = new RealTimeService();
    }
    return RealTimeService.instance;
  }

  // Simulate price updates for a token
  subscribeToPriceUpdates(tokenAddress: string, callback: (data: { price: number; change: number }) => void) {
    const key = `price_${tokenAddress}`;
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }
    
    this.subscribers.get(key)!.push(callback);

    // Start price update interval if not already running
    if (!this.intervals.has(key)) {
      const interval = setInterval(() => {
        // Generate realistic price movement
        const volatility = 0.005; // 0.5% volatility
        const trend = Math.sin(Date.now() / 10000) * 0.001; // Very slight trend
        const change = (Math.random() - 0.5) * volatility + trend;
        
        // Notify all subscribers
        const callbacks = this.subscribers.get(key) || [];
        callbacks.forEach(cb => {
          cb({
            price: Math.random() * 0.001 + 0.0001, // Mock price
            change: change * 100 // Convert to percentage
          });
        });
      }, 3000 + Math.random() * 2000); // 3-5 second intervals
      
      this.intervals.set(key, interval);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(key) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      
      // Clear interval if no more subscribers
      if (callbacks.length === 0) {
        const interval = this.intervals.get(key);
        if (interval) {
          clearInterval(interval);
          this.intervals.delete(key);
        }
        this.subscribers.delete(key);
      }
    };
  }

  // Simulate new trade notifications
  subscribeToTrades(tokenAddress: string, callback: (trade: any) => void) {
    const key = `trades_${tokenAddress}`;
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }
    
    this.subscribers.get(key)!.push(callback);

    if (!this.intervals.has(key)) {
      const interval = setInterval(() => {
        const tradeTypes = ['buy', 'sell'];
        const type = tradeTypes[Math.floor(Math.random() * tradeTypes.length)];
        const amount = Math.floor(Math.random() * 5000000) + 100000; // 100K - 5M tokens
        const bnbAmount = (Math.random() * 2 + 0.1).toFixed(3); // 0.1 - 2.1 BNB
        
        const trade = {
          id: Date.now().toString(),
          type,
          amount: amount.toLocaleString(),
          bnbAmount,
          user: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
          timestamp: new Date()
        };

        const callbacks = this.subscribers.get(key) || [];
        callbacks.forEach(cb => cb(trade));
      }, 8000 + Math.random() * 7000); // 8-15 second intervals
      
      this.intervals.set(key, interval);
    }

    return () => {
      const callbacks = this.subscribers.get(key) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      
      if (callbacks.length === 0) {
        const interval = this.intervals.get(key);
        if (interval) {
          clearInterval(interval);
          this.intervals.delete(key);
        }
        this.subscribers.delete(key);
      }
    };
  }

  // Simulate new comments
  subscribeToComments(tokenAddress: string, callback: (comment: any) => void) {
    const key = `comments_${tokenAddress}`;
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }
    
    this.subscribers.get(key)!.push(callback);

    if (!this.intervals.has(key)) {
      const mockComments = [
        'This is going to the moon! 🚀',
        'Great project, love the community',
        'Just bought the dip 💎🙌',
        'When lambo?',
        'Strong fundamentals, holding long term',
        'Let\'s pump this to 100K!',
        'Diamond hands only 💎',
        'Best meme coin on BNB Chain'
      ];

      const interval = setInterval(() => {
        const comment = {
          id: Date.now().toString(),
          user: {
            address: `0x${Math.random().toString(16).substr(2, 40)}`,
            username: `user${Math.floor(Math.random() * 1000)}`
          },
          content: mockComments[Math.floor(Math.random() * mockComments.length)],
          timestamp: new Date().toISOString(),
          likes: Math.floor(Math.random() * 10),
          isLiked: false
        };

        const callbacks = this.subscribers.get(key) || [];
        callbacks.forEach(cb => cb(comment));
      }, 20000 + Math.random() * 15000); // 20-35 second intervals
      
      this.intervals.set(key, interval);
    }

    return () => {
      const callbacks = this.subscribers.get(key) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      
      if (callbacks.length === 0) {
        const interval = this.intervals.get(key);
        if (interval) {
          clearInterval(interval);
          this.intervals.delete(key);
        }
        this.subscribers.delete(key);
      }
    };
  }

  // Simulate holder count updates
  subscribeToHolderUpdates(tokenAddress: string, callback: (data: { holders: number; change: number }) => void) {
    const key = `holders_${tokenAddress}`;
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }
    
    this.subscribers.get(key)!.push(callback);

    if (!this.intervals.has(key)) {
      let currentHolders = Math.floor(Math.random() * 500) + 100; // Start with 100-600 holders
      
      const interval = setInterval(() => {
        // Simulate holder count changes (usually increasing)
        const change = Math.random() > 0.3 ? Math.floor(Math.random() * 3) + 1 : -Math.floor(Math.random() * 2);
        currentHolders = Math.max(1, currentHolders + change);
        
        const callbacks = this.subscribers.get(key) || [];
        callbacks.forEach(cb => {
          cb({
            holders: currentHolders,
            change: change
          });
        });
      }, 15000 + Math.random() * 10000); // 15-25 second intervals
      
      this.intervals.set(key, interval);
    }

    return () => {
      const callbacks = this.subscribers.get(key) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      
      if (callbacks.length === 0) {
        const interval = this.intervals.get(key);
        if (interval) {
          clearInterval(interval);
          this.intervals.delete(key);
        }
        this.subscribers.delete(key);
      }
    };
  }

  // Clean up all subscriptions (useful for component unmounting)
  cleanup() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.subscribers.clear();
  }
}

// Export singleton instance
export const realTimeService = RealTimeService.getInstance();