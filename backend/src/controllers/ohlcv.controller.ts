import { Request, Response, NextFunction } from 'express';
import ohlcvService from '../services/ohlcv.service';
import { Timeframe } from '../types/tokenPage';
import logger from '../utils/logger';

class OHLCVController {
  /**
   * GET /api/v2/tokens/:address/ohlcv
   * Get OHLCV chart data for a token
   */
  async getOHLCVData(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params;
      const { timeframe = '1h', from, to } = req.query;

      if (!from || !to) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: from, to',
        });
      }

      const fromDate = new Date(from as string);
      const toDate = new Date(to as string);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format',
        });
      }

      const data = await ohlcvService.getOHLCVData(
        address,
        timeframe as Timeframe,
        fromDate,
        toDate
      );

      res.json({
        success: true,
        data,
        count: data.length,
      });
    } catch (error) {
      logger.error('Error fetching OHLCV data:', error);
      next(error);
    }
  }

  /**
   * GET /api/v2/tokens/:address/chart
   * Get chart data formatted for TradingView Lightweight Charts
   */
  async getChartData(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params;
      const { timeframe = '1h', from, to } = req.query;

      if (!from || !to) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: from, to',
        });
      }

      const fromDate = new Date(from as string);
      const toDate = new Date(to as string);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format',
        });
      }

      const chartData = await ohlcvService.getChartData(
        address,
        timeframe as Timeframe,
        fromDate,
        toDate
      );

      res.json({
        success: true,
        data: chartData,
        count: chartData.length,
        timeframe,
      });
    } catch (error) {
      logger.error('Error fetching chart data:', error);
      next(error);
    }
  }

  /**
   * GET /api/v2/tokens/:address/ohlcv/latest
   * Get latest candle for a token
   */
  async getLatestCandle(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params;
      const { timeframe = '1h' } = req.query;

      const candle = await ohlcvService.getLatestCandle(
        address,
        timeframe as Timeframe
      );

      if (!candle) {
        return res.status(404).json({
          success: false,
          error: 'No candle data found',
        });
      }

      res.json({
        success: true,
        data: candle,
      });
    } catch (error) {
      logger.error('Error fetching latest candle:', error);
      next(error);
    }
  }

  /**
   * POST /api/v2/tokens/:address/ohlcv/aggregate
   * Manually trigger OHLCV aggregation from trades
   * (Admin/internal use)
   */
  async aggregateOHLCV(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params;
      const { timeframe = '1h', from, to } = req.body;

      if (!from || !to) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: from, to',
        });
      }

      const fromDate = new Date(from);
      const toDate = new Date(to);

      const candles = await ohlcvService.aggregateFromTrades(
        address,
        timeframe as Timeframe,
        fromDate,
        toDate
      );

      res.json({
        success: true,
        message: 'OHLCV aggregation completed',
        candlesCreated: candles.length,
      });
    } catch (error) {
      logger.error('Error aggregating OHLCV:', error);
      next(error);
    }
  }
}

export const ohlcvController = new OHLCVController();
export default ohlcvController;
