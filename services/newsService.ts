import { newsLikesVersion, observeNewsLikes, toggleNewsLike } from "./newsLikes";
import api from './api';
import { invalidateNewsFeed, updateNewsCommentCount } from './newsFeedStore';
import { API_BASE_URL } from './apiConfig';
import { submitPublicComment } from './guestCommentService';

export const getNewsList = async (category?: string) => {
  try {
    console.log('Fetching from:', API_BASE_URL);
    const params = category ? { category } : {};
    const version = newsLikesVersion();
    const response = await api.get('/news', { params, timeout: 15000 });
    const items = response.data?.data ?? response.data;
    if (Array.isArray(items)) observeNewsLikes(items, version);
    return response.data;
  } catch (error: any) {
    console.error('API Error:', error.message);
    console.error('API URL:', API_BASE_URL);
    throw error;
  }
};

export const getNewsDetail = async (id: string) => {
  const version = newsLikesVersion();
  const response = await api.get(`/news/${id}`, { timeout: 15000 });
  observeNewsLikes([response.data?.data ?? response.data], version);
  return response.data;
};

export const likeNews = async (id: string) => {
  const result = await toggleNewsLike({ id });
  if (!result) throw Error('Authentication required');
  return { liked: result.liked, likes_count: result.count };
};

export const postComment = async (id: string, content: string) => {
  const result = await submitPublicComment(`/news/${id}/comment`, 'news', id, content);
  if (typeof result.comments_count === "number") updateNewsCommentCount(id, result.comments_count);
  invalidateNewsFeed();
  return result;
};
// Use the existing mobile reply and reporting routes; moderation remains server-side.
export const postCommentReply = async (commentId: string, content: string, newsId: string) => {
  const result = await submitPublicComment(`/comments/${commentId}/replies`, 'news', newsId, content);
  if (typeof result.comments_count === "number") updateNewsCommentCount(newsId, result.comments_count);
  invalidateNewsFeed();
  return result;
};
export const reportNewsComment = async (commentId: string, reason: string, category?: string) => {
  const response = await api.post(`/comments/${commentId}/report`, category ? { category, details: reason } : { reason });
  return response.data;
};
