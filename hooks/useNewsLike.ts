import { useSyncExternalStore } from 'react';
import { initialLikeState, likesRevision, newsLikeState, subscribeNewsLikes, toggleNewsLike, type LikeSource } from '@/services/newsLikes';

export function useNewsLike(item: LikeSource) {
  useSyncExternalStore(subscribeNewsLikes, likesRevision, likesRevision);
  const state = newsLikeState(item.id, item.kind) ?? initialLikeState(item);
  return { ...state, toggle: () => toggleNewsLike(item) };
}
