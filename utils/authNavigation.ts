import type { Href } from 'expo-router';

export function authDestination(value?: string | string[]): Extract<Href, string> {
  const destination = Array.isArray(value) ? value[0] : value;
  if (destination && /^\/\(tabs\)\/video\?id=\d+$/.test(destination)) return destination as Extract<Href, string>;
  // Only concrete internal article routes may return from engagement login.
  if (destination && /^\/\(tabs\)\/news_content\/\d+(\?comments=open)?$/.test(destination)) return destination as Extract<Href, string>;
  return destination === '/(tabs)/notification' || destination === '/(tabs)/profile'
    ? destination : '/(tabs)/news_content';
}
