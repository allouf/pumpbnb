'use client';

import React, { useState } from 'react';
import { formatTimeAgo } from '@/lib/mock-data/tokens';
import { 
  HeartIcon,
  ArrowUpTrayIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

interface Comment {
  id: string;
  user: {
    address: string;
    avatar: string;
    username?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
  replies?: Comment[];
}

interface CommentsSectionProps {
  tokenSymbol: string;
}

export function CommentsSection({ tokenSymbol }: CommentsSectionProps) {
  const [activeTab, setActiveTab] = useState<'comments' | 'trades'>('comments');
  const [newComment, setNewComment] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Mock comments data
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      user: {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f4e89',
        avatar: '/api/placeholder/32/32',
        username: 'pumper123'
      },
      content: 'hello, i am a 25 year old robotics engineer from engineering from Indonesia and these are my creations',
      timestamp: '2024-10-15T14:20:00Z',
      likes: 5,
      isLiked: false
    },
    {
      id: '2',
      user: {
        address: '0x9876543210fedcba9876543210fedcba98765432',
        avatar: '/api/placeholder/32/32'
      },
      content: 'Nobody believed I could develop a farm --- until I proved them wrong',
      timestamp: '2024-10-15T14:18:00Z',
      likes: 12,
      isLiked: true
    },
    {
      id: '3',
      user: {
        address: '0xabcdef1234567890abcdef1234567890abcdef12',
        avatar: '/api/placeholder/32/32',
        username: 'cryptowhale'
      },
      content: 'The older your wallet is, the more valuable is it',
      timestamp: '2024-10-15T14:15:00Z',
      likes: 8,
      isLiked: false
    },
    {
      id: '4',
      user: {
        address: '0x1111222233334444555566667777888899990000',
        avatar: '/api/placeholder/32/32'
      },
      content: 'Please start from 0.5 if it costs 6 Solana or more.',
      timestamp: '2024-10-15T14:10:00Z',
      likes: 3,
      isLiked: false
    }
  ]);

  const handleLike = (commentId: string) => {
    setComments(comments.map(comment => 
      comment.id === commentId 
        ? { 
            ...comment, 
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            isLiked: !comment.isLiked 
          }
        : comment
    ));
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      user: {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        avatar: '/api/placeholder/32/32',
        username: 'you'
      },
      content: newComment,
      timestamp: new Date().toISOString(),
      likes: 0,
      isLiked: false
    };

    setComments([comment, ...comments]);
    setNewComment('');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  return (
    <div className="bg-background-card border border-border rounded-lg">
      {/* Tab Header */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('comments')}
          className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${
            activeTab === 'comments'
              ? 'text-text-primary border-b-2 border-primary-green bg-background-dark/50'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Comments
        </button>
        <button
          onClick={() => setActiveTab('trades')}
          className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${
            activeTab === 'trades'
              ? 'text-text-primary border-b-2 border-primary-green bg-background-dark/50'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Trades
        </button>
      </div>

      {activeTab === 'comments' && (
        <div className="p-4 space-y-4">
          
          {/* User Avatar and Community Info */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-green to-accent-blue rounded-full flex items-center justify-center text-black text-sm font-bold">
                U
              </div>
              <span className="text-sm font-medium text-text-primary">
                Umay Robots community
              </span>
            </div>
            <div className="text-xs text-text-muted">
              View on Advanced · Trade on BSC.scan
            </div>
          </div>

          {/* Comment Input */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-green to-accent-blue rounded-full flex items-center justify-center text-black text-sm font-bold flex-shrink-0">
                Y
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full bg-background-dark border border-border rounded-lg p-3 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  rows={3}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-text-muted">
                    {newComment.length}/500
                  </span>
                  <button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim()}
                    className="bg-primary-green text-black px-4 py-1 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-400 transition-colors"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">
              {comments.length} comments
            </h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="bg-background-dark border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-green"
            >
              <option value="newest">↑ Newest</option>
              <option value="oldest">↓ Oldest</option>
            </select>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {sortedComments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                {/* User Avatar */}
                <div className="w-8 h-8 bg-gradient-to-br from-primary-green to-accent-blue rounded-full flex items-center justify-center text-black text-sm font-bold flex-shrink-0">
                  {comment.user.username?.charAt(0).toUpperCase() || comment.user.address.charAt(2).toUpperCase()}
                </div>
                
                {/* Comment Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">
                      {comment.user.username || formatAddress(comment.user.address)}
                    </span>
                    <span className="text-xs text-text-muted">
                      {formatTimeAgo(comment.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {comment.content}
                  </p>
                  
                  {/* Comment Actions */}
                  <div className="flex items-center gap-4 pt-2">
                    <button
                      onClick={() => handleLike(comment.id)}
                      className="flex items-center gap-1 text-text-muted hover:text-primary-red transition-colors"
                    >
                      {comment.isLiked ? (
                        <HeartIconSolid className="w-4 h-4 text-primary-red" />
                      ) : (
                        <HeartIcon className="w-4 h-4" />
                      )}
                      <span className="text-xs">{comment.likes}</span>
                    </button>
                    
                    <button className="text-xs text-text-muted hover:text-text-primary transition-colors">
                      Reply
                    </button>
                    
                    <button className="text-xs text-text-muted hover:text-text-primary transition-colors">
                      <ArrowUpTrayIcon className="w-4 h-4" />
                    </button>
                    
                    <button className="text-xs text-text-muted hover:text-text-primary transition-colors">
                      <EllipsisHorizontalIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center pt-4">
            <button className="text-sm text-primary-green hover:text-green-400 font-medium transition-colors">
              Load more comments
            </button>
          </div>
        </div>
      )}

      {activeTab === 'trades' && (
        <div className="p-4">
          <div className="space-y-3">
            {/* Mock trading activity */}
            <div className="flex items-center justify-between py-2 px-3 bg-background-dark rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-green rounded-full"></div>
                <span className="text-sm text-text-primary font-medium">Buy</span>
                <span className="text-sm text-text-secondary">0xabcd...ef01</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-text-primary">1.5M {tokenSymbol}</div>
                <div className="text-xs text-text-muted">0.5 BNB</div>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 px-3 bg-background-dark rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-red rounded-full"></div>
                <span className="text-sm text-text-primary font-medium">Sell</span>
                <span className="text-sm text-text-secondary">0x1234...5678</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-text-primary">800K {tokenSymbol}</div>
                <div className="text-xs text-text-muted">0.3 BNB</div>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 px-3 bg-background-dark rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-green rounded-full"></div>
                <span className="text-sm text-text-primary font-medium">Buy</span>
                <span className="text-sm text-text-secondary">0x9876...5432</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-text-primary">2.1M {tokenSymbol}</div>
                <div className="text-xs text-text-muted">0.8 BNB</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}