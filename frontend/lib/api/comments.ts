const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pumpbnb-backend.onrender.com'

export interface Comment {
  id: string
  tokenAddress: string
  userAddress: string
  content: string
  replyTo?: string | null
  likes: number
  createdAt: string
  updatedAt: string
}

export interface CommentStats {
  totalComments: number
  uniqueCommenters: number
  totalLikes: number
}

export interface GetCommentsParams {
  userAddress?: string
  sortBy?: 'newest' | 'oldest' | 'mostLiked'
  includeReplies?: boolean
  page?: number
  limit?: number
}

export interface GetCommentsResponse {
  success: boolean
  data: Comment[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

/**
 * Get comments for a token
 */
export async function getTokenComments(
  tokenAddress: string,
  params?: GetCommentsParams
): Promise<GetCommentsResponse> {
  const query = new URLSearchParams()
  if (params?.userAddress) query.append('userAddress', params.userAddress)
  if (params?.sortBy) query.append('sortBy', params.sortBy)
  if (params?.includeReplies !== undefined) query.append('includeReplies', String(params.includeReplies))
  if (params?.page) query.append('page', String(params.page))
  if (params?.limit) query.append('limit', String(params.limit))

  const url = `${API_URL}/api/v2/tokens/${tokenAddress}/comments${query.toString() ? `?${query}` : ''}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch comments: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get recent comments for a token (cached)
 */
export async function getRecentComments(tokenAddress: string, limit = 10): Promise<Comment[]> {
  const response = await fetch(
    `${API_URL}/api/v2/tokens/${tokenAddress}/comments/recent?limit=${limit}`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch recent comments: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data
}

/**
 * Get comment statistics for a token
 */
export async function getCommentStats(tokenAddress: string): Promise<CommentStats> {
  const response = await fetch(`${API_URL}/api/v2/tokens/${tokenAddress}/comments/stats`)

  if (!response.ok) {
    throw new Error(`Failed to fetch comment stats: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data
}

/**
 * Create a new comment
 */
export async function createComment(
  tokenAddress: string,
  userAddress: string,
  content: string,
  replyTo?: string
): Promise<Comment> {
  const response = await fetch(`${API_URL}/api/v2/tokens/${tokenAddress}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userAddress,
      content,
      replyTo,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to create comment: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data
}

/**
 * Update a comment
 */
export async function updateComment(
  commentId: string,
  userAddress: string,
  content: string
): Promise<Comment> {
  const response = await fetch(`${API_URL}/api/v2/comments/${commentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userAddress,
      content,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to update comment: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string, userAddress: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/v2/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userAddress,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to delete comment: ${response.statusText}`)
  }
}

/**
 * Like a comment
 */
export async function likeComment(commentId: string, userAddress: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/v2/comments/${commentId}/like`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userAddress,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to like comment: ${response.statusText}`)
  }
}

/**
 * Unlike a comment
 */
export async function unlikeComment(commentId: string, userAddress: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/v2/comments/${commentId}/unlike`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userAddress,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to unlike comment: ${response.statusText}`)
  }
}

/**
 * Get replies for a comment
 */
export async function getCommentReplies(
  tokenAddress: string,
  parentCommentId: string
): Promise<Comment[]> {
  const response = await fetch(
    `${API_URL}/api/v2/tokens/${tokenAddress}/comments?replyTo=${parentCommentId}&sortBy=oldest`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch replies: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data || []
}
