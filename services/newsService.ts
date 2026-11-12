import api from './api';
import { invalidateNewsFeed } from './newsFeedStore';
import { API_BASE_URL } from './apiConfig';

export const getNewsList = async (category?: string) => {
  try {
    console.log('Fetching from:', API_BASE_URL);
    const params = category ? { category } : {};
    const response = await api.get('/news', { params, timeout: 15000 });
    return response.data;
  } catch (error: any) {
    console.error('API Error:', error.message);
    console.error('API URL:', API_BASE_URL);
    throw error;
  }
};

export const getNewsDetail = async (id: string) => {
  const response = await api.get(`/news/${id}`, { timeout: 15000 });
  return response.data;
};

export const likeNews = async (id: string) => {
  const response = await api.post(`/news/${id}/like`);
  invalidateNewsFeed();
  return response.data;
};

export const postComment = async (id: string, content: string) => {
  const response = await api.post(`/news/${id}/comment`, { content });
  invalidateNewsFeed();
  return response.data;
};
// Use the existing mobile reply and reporting routes; moderation remains server-side.
export const postCommentReply = async (commentId: string, content: string) => {
  const response = await api.post(`/comments/${commentId}/replies`, { content });
  invalidateNewsFeed();
  return response.data;
};
export const reportNewsComment = async (commentId: string, reason: string) => {
  const response = await api.post(`/comments/${commentId}/report`, { reason });
  return response.data;
};
