import { useCallback, useSyncExternalStore } from "react";
import { useFocusEffect } from "expo-router";
import { loadNewsFeed, newsFeedSnapshot, subscribeNewsFeed } from "@/services/newsFeedStore";
export function useNewsFeed() {
  const feed = useSyncExternalStore(subscribeNewsFeed, newsFeedSnapshot, newsFeedSnapshot);
  useFocusEffect(useCallback(() => { void loadNewsFeed(); }, []));
  const refresh = useCallback(() => loadNewsFeed(true), []);
  return { ...feed, refresh };
}
