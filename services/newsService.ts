import api from './api';

export const getNewsList = async (category?: string) => {
  try {
    console.log('Fetching from:', process.env.EXPO_PUBLIC_API_URL);
    const params = category ? { category } : {};
    const response = await api.get('/news', { params });
    return response.data;
  } catch (error: any) {
    console.error('API Error:', error.message);
    console.error('API URL:', process.env.EXPO_PUBLIC_API_URL);
    throw error;
  }
};

export const getNewsDetail = async (id: string) => {
  const response = await api.get(`/news/${id}`);
  return response.data;
};

export const likeNews = async (id: string) => {
  const response = await api.post(`/news/${id}/like`);
  return response.data;
};

export const postComment = async (id: string, content: string) => {
  const response = await api.post(`/news/${id}/comment`, { content });
  return response.data;
};