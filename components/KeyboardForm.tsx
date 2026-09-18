import { useCallback, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, type ScrollViewProps } from 'react-native';
import { useFocusEffect } from 'expo-router';

/** Keeps form fields and their actions reachable without changing the closed-keyboard layout. */
export function KeyboardForm({ style, contentContainerStyle, onFocus, onLayout, onScroll, children, ...props }: ScrollViewProps) {
  const scroll = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const keyboardTop = useRef(Number.POSITIVE_INFINITY);
  const frame = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const active = useRef(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const revealInput = useCallback(() => {
    if (Platform.OS === 'web' || !active.current) return;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const input = TextInput.State.currentlyFocusedInput();
      if (!input || !Number.isFinite(keyboardTop.current)) return;
      scroll.current?.getNativeScrollRef()?.measureInWindow((_x, top, _width, height) => {
        input.measureInWindow((_inputX, inputTop, _inputWidth, inputHeight) => {
          if (!active.current || TextInput.State.currentlyFocusedInput() !== input) return;
          const bottom = Math.min(top + height, keyboardTop.current) - 12;
          // Leave room for actions below the field, including OTP submit/resend.
          const delta = inputTop < top + 12
            ? inputTop - top - 12
            : Math.min(
              Math.max(0, inputTop + inputHeight + 160 - bottom),
              Math.max(0, inputTop - top - 12),
            );
          if (delta !== 0) scroll.current?.scrollTo({ y: Math.max(0, scrollY.current + delta), animated: true });
        });
      });
    });
  }, []);

  useFocusEffect(useCallback(() => {
    active.current = true;
    if (Platform.OS === 'web') return () => { active.current = false; };
    const metrics = Keyboard.metrics();
    if (metrics) {
      keyboardTop.current = metrics.screenY;
      setKeyboardOpen(true);
      revealInput();
    }
    const shown = Keyboard.addListener('keyboardDidShow', event => {
      keyboardTop.current = event.endCoordinates.screenY;
      setKeyboardOpen(true);
      revealInput();
    });
    const moved = Keyboard.addListener('keyboardDidChangeFrame', event => {
      keyboardTop.current = event.endCoordinates.screenY;
      revealInput();
    });
    const hidden = Keyboard.addListener('keyboardDidHide', () => {
      keyboardTop.current = Number.POSITIVE_INFINITY;
      setKeyboardOpen(false);
    });
    return () => {
      active.current = false;
      keyboardTop.current = Number.POSITIVE_INFINITY;
      setKeyboardOpen(false);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      shown.remove();
      moved.remove();
      hidden.remove();
    };
  }, [revealInput]));

  const content = StyleSheet.flatten(contentContainerStyle);
  const existingBottom = typeof content?.paddingBottom === 'number' ? content.paddingBottom : 0;
  return (
    <KeyboardAvoidingView style={[styles.fill, style]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        {...props}
        ref={scroll}
        style={styles.fill}
        contentContainerStyle={[styles.content, contentContainerStyle, keyboardOpen && { paddingBottom: Math.max(existingBottom, 184) }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        onFocus={event => { onFocus?.(event); revealInput(); }}
        onLayout={event => { onLayout?.(event); revealInput(); }}
        onContentSizeChange={(width, height) => { props.onContentSizeChange?.(width, height); revealInput(); }}
        onScroll={event => { scrollY.current = event.nativeEvent.contentOffset.y; onScroll?.(event); }}
        scrollEventThrottle={16}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flexGrow: 1 },
});
