import { useCallback, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getProfile, type UserProfile } from '../services/authService';
import { verificationError } from '../services/emailVerification';

export function useVerifiedProfile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(false);
  const generation = useRef(0);
  const pending = useRef(false);

  const refresh = useCallback(async () => {
    if (pending.current) return null;
    pending.current = true;
    const request = ++generation.current;
    setLoading(true);
    setConfirmed(false);
    setError('');
    try {
      const profile = await getProfile();
      if (active.current && request === generation.current) {
        setUser(profile);
        setConfirmed(true);
      }
      return profile;
    } catch (err) {
      if (active.current && request === generation.current) setError(verificationError(err));
      return null;
    } finally {
      if (request === generation.current) {
        pending.current = false;
        if (active.current) setLoading(false);
      }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    active.current = true;
    void refresh();
    const onActive = () => { void refresh(); };
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') onActive();
    });
    if (Platform.OS === 'web') window.addEventListener('focus', onActive);
    return () => {
      active.current = false;
      generation.current++;
      pending.current = false;
      subscription.remove();
      if (Platform.OS === 'web') window.removeEventListener('focus', onActive);
    };
  }, [refresh]));

  return { user, loading, confirmed, error, refresh };
}
