import { useEffect, useState } from "react";
import { Animated } from "react-native";

export const useWelcomeAnimations = () => {
  const [fadeTop] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(-16));
  const [fadeButtons] = useState(() => new Animated.Value(0));
  const [translateB] = useState(() => new Animated.Value(24));

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeTop, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeButtons, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(translateB, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fadeButtons, fadeTop, translateB, translateY]);

  return {
    fadeTop,
    translateY,
    fadeButtons,
    translateB,
  };
};
