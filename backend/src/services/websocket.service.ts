import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import config from '../config';
import logger from '../utils/logger';
import { redis } from './database.service';

export class WebSocketService {
  private io: SocketIOServer | null = null;

  initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.corsOrigin,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.io.on('connection', (socket) => {
      logger.info(`WebSocket client connected: ${socket.id}`);

      // Join token-specific rooms
      socket.on('subscribe:token', (tokenAddress: string) => {
        const room = `token:${tokenAddress.toLowerCase()}`;
        socket.join(room);
        logger.info(`Client ${socket.id} subscribed to ${room}`);
      });

      // Leave token-specific rooms
      socket.on('unsubscribe:token', (tokenAddress: string) => {
        const room = `token:${tokenAddress.toLowerCase()}`;
        socket.leave(room);
        logger.info(`Client ${socket.id} unsubscribed from ${room}`);
      });

      // Subscribe to all new tokens
      socket.on('subscribe:new-tokens', () => {
        socket.join('new-tokens');
        logger.info(`Client ${socket.id} subscribed to new tokens`);
      });

      socket.on('unsubscribe:new-tokens', () => {
        socket.leave('new-tokens');
        logger.info(`Client ${socket.id} unsubscribed from new tokens`);
      });

      // Subscribe to trending tokens
      socket.on('subscribe:trending', () => {
        socket.join('trending');
        logger.info(`Client ${socket.id} subscribed to trending`);
      });

      socket.on('unsubscribe:trending', () => {
        socket.leave('trending');
        logger.info(`Client ${socket.id} unsubscribed from trending`);
      });

      socket.on('disconnect', () => {
        logger.info(`WebSocket client disconnected: ${socket.id}`);
      });
    });

    // Set up Redis pub/sub for multi-instance support
    if (redis) {
      const subscriber = redis.duplicate();
      subscriber.subscribe('blockchain-events', (err) => {
        if (err) {
          logger.error('Failed to subscribe to blockchain-events:', err);
        } else {
          logger.info('Subscribed to blockchain-events channel');
        }
      });

      subscriber.on('message', (channel, message) => {
        if (channel === 'blockchain-events') {
          const event = JSON.parse(message);
          this.handleBlockchainEvent(event);
        }
      });
    }

    logger.info('WebSocket server initialized');
  }

  /**
   * Broadcast new token creation
   */
  broadcastNewToken(tokenData: any): void {
    if (!this.io) return;

    this.io.to('new-tokens').emit('token:created', tokenData);
    logger.info(`Broadcasted new token: ${tokenData.address}`);
  }

  /**
   * Broadcast new trade
   */
  broadcastTrade(tokenAddress: string, tradeData: any): void {
    if (!this.io) return;

    const room = `token:${tokenAddress.toLowerCase()}`;
    this.io.to(room).emit('token:trade', tradeData);
    logger.info(`Broadcasted trade for token: ${tokenAddress}`);
  }

  /**
   * Broadcast price update
   */
  broadcastPriceUpdate(tokenAddress: string, priceData: any): void {
    if (!this.io) return;

    const room = `token:${tokenAddress.toLowerCase()}`;
    this.io.to(room).emit('token:price', priceData);
  }

  /**
   * Broadcast graduation event
   */
  broadcastGraduation(tokenAddress: string, graduationData: any): void {
    if (!this.io) return;

    const room = `token:${tokenAddress.toLowerCase()}`;
    this.io.to(room).emit('token:graduated', graduationData);
    this.io.to('new-tokens').emit('token:graduated', graduationData);
    logger.info(`Broadcasted graduation for token: ${tokenAddress}`);
  }

  /**
   * Broadcast trending tokens update
   */
  broadcastTrending(trendingTokens: any[]): void {
    if (!this.io) return;

    this.io.to('trending').emit('trending:update', trendingTokens);
    logger.info('Broadcasted trending tokens update');
  }

  /**
   * Broadcast new comment
   */
  broadcastComment(tokenAddress: string, commentData: any): void {
    if (!this.io) return;

    const room = `token:${tokenAddress.toLowerCase()}`;
    this.io.to(room).emit('token:comment', commentData);
    logger.info(`Broadcasted comment for token: ${tokenAddress}`);
  }

  /**
   * Broadcast comment update
   */
  broadcastCommentUpdate(tokenAddress: string, commentId: string, updatedContent: string): void {
    if (!this.io) return;

    const room = `token:${tokenAddress.toLowerCase()}`;
    this.io.to(room).emit('comment:updated', {
      commentId,
      content: updatedContent,
      updatedAt: new Date().toISOString(),
    });
    logger.info(`Broadcasted comment update for comment: ${commentId}`);
  }

  /**
   * Broadcast comment deletion
   */
  broadcastCommentDelete(tokenAddress: string, commentId: string): void {
    if (!this.io) return;

    const room = `token:${tokenAddress.toLowerCase()}`;
    this.io.to(room).emit('comment:deleted', { commentId });
    logger.info(`Broadcasted comment deletion for comment: ${commentId}`);
  }

  /**
   * Broadcast comment like
   */
  broadcastCommentLike(tokenAddress: string, commentId: string, likeCount: number): void {
    if (!this.io) return;

    const room = `token:${tokenAddress.toLowerCase()}`;
    this.io.to(room).emit('comment:liked', {
      commentId,
      likeCount,
    });
  }

  /**
   * Broadcast holder update
   */
  broadcastHolderUpdate(tokenAddress: string, holderData: any): void {
    if (!this.io) return;

    const room = `token:${tokenAddress.toLowerCase()}`;
    this.io.to(room).emit('token:holder-update', holderData);
    logger.info(`Broadcasted holder update for token: ${tokenAddress}`);
  }

  /**
   * Broadcast holder stats update (concentration, distribution)
   */
  broadcastHolderStats(tokenAddress: string, statsData: any): void {
    if (!this.io) return;

    const room = `token:${tokenAddress.toLowerCase()}`;
    this.io.to(room).emit('token:holder-stats', statsData);
  }

  /**
   * Broadcast OHLCV candle update
   */
  broadcastCandle(tokenAddress: string, candleData: any): void {
    if (!this.io) return;

    const room = `token:${tokenAddress.toLowerCase()}`;
    this.io.to(room).emit('token:candle', candleData);
    logger.debug(`Broadcasted candle for token: ${tokenAddress}`);
  }

  /**
   * Handle blockchain events from Redis pub/sub
   */
  private handleBlockchainEvent(event: any): void {
    switch (event.type) {
      case 'TokenCreated':
        this.broadcastNewToken(event.data);
        break;
      case 'Trade':
        this.broadcastTrade(event.data.tokenAddress, event.data);
        break;
      case 'PriceUpdate':
        this.broadcastPriceUpdate(event.data.tokenAddress, event.data);
        break;
      case 'Graduation':
        this.broadcastGraduation(event.data.tokenAddress, event.data);
        break;
      case 'Comment':
        this.broadcastComment(event.data.tokenAddress, event.data);
        break;
      case 'CommentUpdate':
        this.broadcastCommentUpdate(event.data.tokenAddress, event.data.commentId, event.data.content);
        break;
      case 'CommentDelete':
        this.broadcastCommentDelete(event.data.tokenAddress, event.data.commentId);
        break;
      case 'CommentLike':
        this.broadcastCommentLike(event.data.tokenAddress, event.data.commentId, event.data.likeCount);
        break;
      case 'HolderUpdate':
        this.broadcastHolderUpdate(event.data.tokenAddress, event.data);
        break;
      case 'HolderStats':
        this.broadcastHolderStats(event.data.tokenAddress, event.data);
        break;
      case 'CandleUpdate':
        this.broadcastCandle(event.data.tokenAddress, event.data);
        break;
      default:
        logger.warn(`Unknown blockchain event type: ${event.type}`);
    }
  }

  /**
   * Publish event to Redis (for multi-instance support)
   */
  async publishEvent(eventType: string, data: any): Promise<void> {
    if (!redis) return;

    const event = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
    };

    await redis.publish('blockchain-events', JSON.stringify(event));
  }

  /**
   * Get connected clients count
   */
  getConnectionsCount(): number {
    if (!this.io) return 0;
    return this.io.sockets.sockets.size;
  }

  /**
   * Get room size
   */
  getRoomSize(room: string): number {
    if (!this.io) return 0;
    const roomSockets = this.io.sockets.adapter.rooms.get(room);
    return roomSockets ? roomSockets.size : 0;
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
