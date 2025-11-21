import logger from '../utils/logger';

interface PriceData {
  asterUsdPrice: number;
  bnbUsdPrice: number;
  lastUpdated: Date;
}

class UsdPriceService {
  private priceData: PriceData | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL = 5 * 60 * 1000; // Update every 5 minutes

  async initialize(): Promise<void> {
    logger.info('Initializing USD Price Service...');
    
    // Initial fetch
    await this.updatePrices();
    
    // Set up periodic updates
    this.updateInterval = setInterval(() => {
      this.updatePrices().catch(error => {
        logger.error('Error in periodic price update:', error);
      });
    }, this.UPDATE_INTERVAL);
    
    logger.info('USD Price Service initialized');
  }

  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    logger.info('USD Price Service stopped');
  }

  private async updatePrices(): Promise<void> {
    try {
      // Try multiple APIs for reliability
      const bnbPrice = await this.fetchBnbPrice();
      const asterPrice = await this.fetchAsterPrice(bnbPrice);
      
      this.priceData = {
        asterUsdPrice: asterPrice,
        bnbUsdPrice: bnbPrice,
        lastUpdated: new Date(),
      };
      
      logger.debug(`Price update: BNB=$${bnbPrice.toFixed(2)}, ASTER=$${asterPrice.toFixed(6)}`);
    } catch (error) {
      logger.error('Failed to update USD prices:', error);
      
      // Use fallback prices if no data available
      if (!this.priceData) {
        this.priceData = {
          asterUsdPrice: 1.17, // ASTER ~$1.17 as of late 2024
          bnbUsdPrice: 600, // Fallback BNB price
          lastUpdated: new Date(),
        };
        logger.warn('Using fallback USD prices');
      }
    }
  }

  private async fetchBnbPrice(): Promise<number> {
    const apis = [
      // CoinGecko (free, no API key needed)
      {
        url: 'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd',
        parser: (data: any) => data.binancecoin.usd
      },
      // CoinCap (free, no API key needed)
      {
        url: 'https://api.coincap.io/v2/assets/binance-coin',
        parser: (data: any) => parseFloat(data.data.priceUsd)
      },
      // Binance public API (free, no API key needed)
      {
        url: 'https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT',
        parser: (data: any) => parseFloat(data.price)
      }
    ];

    for (const api of apis) {
      try {
        const response = await fetch(api.url, {
          headers: { 'User-Agent': 'ASTER-FUN/1.0' },
        });
        
        if (response.ok) {
          const data = await response.json();
          const price = api.parser(data);
          
          if (price && price > 0) {
            logger.debug(`BNB price from ${new URL(api.url).hostname}: $${price}`);
            return price;
          }
        }
      } catch (error) {
        logger.warn(`Failed to fetch BNB price from ${api.url}:`, error);
      }
    }

    throw new Error('Failed to fetch BNB price from all APIs');
  }

  private async fetchAsterPrice(bnbPrice: number): Promise<number> {
    // ASTER token: 0x000Ae314E2A2172a039B26378814C252734f556A on BSC
    // Try to fetch live price from multiple sources

    const apis = [
      // GeckoTerminal API - ASTER/USDT pool on PancakeSwap V3
      {
        url: 'https://api.geckoterminal.com/api/v2/networks/bsc/tokens/0x000ae314e2a2172a039b26378814c252734f556a',
        parser: (data: any) => {
          const price = data?.data?.attributes?.price_usd;
          return price ? parseFloat(price) : null;
        }
      },
      // CoinGecko API - ASTER by contract address
      {
        url: 'https://api.coingecko.com/api/v3/simple/token_price/binance-smart-chain?contract_addresses=0x000ae314e2a2172a039b26378814c252734f556a&vs_currencies=usd',
        parser: (data: any) => {
          const price = data?.['0x000ae314e2a2172a039b26378814c252734f556a']?.usd;
          return price ? parseFloat(price) : null;
        }
      },
      // CoinGecko API - ASTER by ID
      {
        url: 'https://api.coingecko.com/api/v3/simple/price?ids=aster-2&vs_currencies=usd',
        parser: (data: any) => {
          const price = data?.['aster-2']?.usd;
          return price ? parseFloat(price) : null;
        }
      }
    ];

    for (const api of apis) {
      try {
        const response = await fetch(api.url, {
          headers: { 'User-Agent': 'ASTER-FUN/1.0' },
        });

        if (response.ok) {
          const data = await response.json();
          const price = api.parser(data);

          if (price && price > 0) {
            logger.debug(`ASTER price from ${new URL(api.url).hostname}: $${price}`);
            return price;
          }
        }
      } catch (error) {
        logger.warn(`Failed to fetch ASTER price from ${api.url}:`, error);
      }
    }

    // Fallback: ASTER is trading around $1.17 as of late 2024
    logger.warn('Failed to fetch ASTER price from all APIs, using fallback');
    return 1.17;
  }

  // Public methods to get prices
  getAsterUsdPrice(): number {
    return this.priceData?.asterUsdPrice || 1.17; // ASTER ~$1.17 as of late 2024
  }

  getBnbUsdPrice(): number {
    return this.priceData?.bnbUsdPrice || 600;
  }

  getPriceData(): PriceData | null {
    return this.priceData;
  }

  // Convert ASTER amount to USD
  asterToUsd(asterAmount: number): number {
    return asterAmount * this.getAsterUsdPrice();
  }

  // Convert token price (in ASTER) to USD
  tokenPriceToUsd(tokenPriceInAster: number): number {
    return tokenPriceInAster * this.getAsterUsdPrice();
  }

  // Format small numbers with appropriate precision
  formatPrice(price: number, currency: 'USD' | 'ASTER' = 'USD'): string {
    if (price === 0) return currency === 'USD' ? '$0' : '0 ASTER';
    
    if (currency === 'USD') {
      if (price >= 1) return `$${price.toFixed(2)}`;
      if (price >= 0.01) return `$${price.toFixed(4)}`;
      if (price >= 0.0001) return `$${price.toFixed(6)}`;
      return `$${price.toFixed(8)}`;
    } else {
      if (price >= 1) return `${price.toFixed(4)} ASTER`;
      if (price >= 0.0001) return `${price.toFixed(6)} ASTER`;
      return `${price.toFixed(8)} ASTER`;
    }
  }

  isStale(): boolean {
    if (!this.priceData) return true;
    const ageMs = Date.now() - this.priceData.lastUpdated.getTime();
    return ageMs > this.UPDATE_INTERVAL * 2; // Consider stale if 2x update interval
  }
}

export const usdPriceService = new UsdPriceService();