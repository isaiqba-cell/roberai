import { PropsWithChildren, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
} from "react-native";

export function Reveal({
  children,
  delay = 0,
  style,
}: PropsWithChildren<{
  delay?: number;
  style?: StyleProp<ViewStyle>;
}>) {
  // Content stays fully opaque at all times — the entrance is a subtle
  // upward slide only. This guarantees a screen never renders blank while an
  // opacity animation is pending (a real risk on react-native-web, where a
  // stalled animation frame would otherwise leave everything invisible).
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    const animation = Animated.timing(translateY, {
      toValue: 0,
      duration: 320,
      delay: Math.min(delay, 220),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [delay, translateY]);

  return (
    <Animated.View style={[style, { transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
