import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { colors } from '../styles/theme';

const { width, height } = Dimensions.get('window');

const AnimatedSplash = ({ onFinish }) => {
  const [phase, setPhase] = useState(0); // 0=circles, 1=logo, 2=text, 3=fade out

  // Background circles
  const circle1Scale = useRef(new Animated.Value(0)).current;
  const circle2Scale = useRef(new Animated.Value(0)).current;
  const circle3Scale = useRef(new Animated.Value(0)).current;

  // Logo
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const logoGlow = useRef(new Animated.Value(0.3)).current;

  // Text
  const loanOpacity = useRef(new Animated.Value(0)).current;
  const loanSlide = useRef(new Animated.Value(-40)).current;
  const snapOpacity = useRef(new Animated.Value(0)).current;
  const snapSlide = useRef(new Animated.Value(40)).current;

  // Tagline
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineSlide = useRef(new Animated.Value(20)).current;

  // Dots
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  // Overall fade out
  const fadeOut = useRef(new Animated.Value(1)).current;
  const scaleOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      // Phase 1: Background circles ripple out
      Animated.stagger(150, [
        Animated.spring(circle1Scale, { toValue: 1, tension: 30, friction: 8, useNativeDriver: true }),
        Animated.spring(circle2Scale, { toValue: 1, tension: 30, friction: 8, useNativeDriver: true }),
        Animated.spring(circle3Scale, { toValue: 1, tension: 30, friction: 8, useNativeDriver: true }),
      ]),

      // Phase 2: Logo bounces in with rotation
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 5, useNativeDriver: true }),
        Animated.timing(logoRotate, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),

      // Brief glow pulse
      Animated.sequence([
        Animated.timing(logoGlow, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(logoGlow, { toValue: 0.6, duration: 300, useNativeDriver: true }),
      ]),

      // Phase 3: "Loan" slides from left, "Snap" slides from right
      Animated.parallel([
        Animated.timing(loanOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(loanSlide, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(snapOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(snapSlide, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
      ]),

      // Tagline fades in
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(taglineSlide, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),

      // Loading dots animation
      Animated.stagger(150, [
        Animated.timing(dot1, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),

      // Hold for a moment
      Animated.delay(600),

      // Phase 4: Zoom out and fade
      Animated.parallel([
        Animated.timing(fadeOut, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(scaleOut, { toValue: 1.1, duration: 400, useNativeDriver: true }),
      ]),
    ]);

    animation.start(() => {
      if (onFinish) onFinish();
    });
  }, []);

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeOut, transform: [{ scale: scaleOut }] },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Background Circles */}
      <Animated.View
        style={[
          styles.bgCircle,
          styles.bgCircle1,
          { transform: [{ scale: circle1Scale }] },
        ]}
      />
      <Animated.View
        style={[
          styles.bgCircle,
          styles.bgCircle2,
          { transform: [{ scale: circle2Scale }] },
        ]}
      />
      <Animated.View
        style={[
          styles.bgCircle,
          styles.bgCircle3,
          { transform: [{ scale: circle3Scale }] },
        ]}
      />

      {/* Center Content */}
      <View style={styles.center}>
        {/* Logo with glow */}
        <Animated.View style={[styles.logoGlow, { opacity: logoGlow, transform: [{ scale: logoScale }] }]}>
          <Animated.View
            style={[
              styles.logoOuter,
              { transform: [{ scale: logoScale }, { rotate: spin }] },
            ]}
          >
            <View style={styles.logoInner}>
              <Text style={styles.logoSymbol}>₹</Text>
            </View>
          </Animated.View>
        </Animated.View>

        {/* App Name */}
        <View style={styles.nameRow}>
          <Animated.Text
            style={[
              styles.nameLoan,
              { opacity: loanOpacity, transform: [{ translateX: loanSlide }] },
            ]}
          >
            Loan
          </Animated.Text>
          <Animated.Text
            style={[
              styles.nameSnap,
              { opacity: snapOpacity, transform: [{ translateX: snapSlide }] },
            ]}
          >
            Snap
          </Animated.Text>
        </View>

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            { opacity: taglineOpacity, transform: [{ translateY: taglineSlide }] },
          ]}
        >
          Instant loans, easy daily EMIs
        </Animated.Text>

        {/* Loading Dots */}
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, { opacity: dot1, transform: [{ scale: dot1 }] }]} />
          <Animated.View style={[styles.dot, { opacity: dot2, transform: [{ scale: dot2 }] }]} />
          <Animated.View style={[styles.dot, { opacity: dot3, transform: [{ scale: dot3 }] }]} />
        </View>
      </View>

      {/* Bottom branding */}
      <Animated.Text style={[styles.bottomText, { opacity: taglineOpacity }]}>
        Your trusted lending partner
      </Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Background circles
  bgCircle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  bgCircle1: {
    width: width * 1.6,
    height: width * 1.6,
    top: -width * 0.3,
    left: -width * 0.3,
  },
  bgCircle2: {
    width: width * 1.2,
    height: width * 1.2,
    bottom: -width * 0.2,
    right: -width * 0.3,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  bgCircle3: {
    width: width * 0.8,
    height: width * 0.8,
    top: height * 0.15,
    right: -width * 0.2,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  center: {
    alignItems: 'center',
  },

  // Logo
  logoGlow: {
    borderRadius: 70,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 30,
  },
  logoOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  logoSymbol: {
    fontSize: 44,
    fontWeight: '700',
    color: colors.primary,
  },

  // Name
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  nameLoan: {
    fontSize: 42,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  nameSnap: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },

  // Tagline
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
    marginBottom: 30,
  },

  // Loading dots
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },

  // Bottom
  bottomText: {
    position: 'absolute',
    bottom: 50,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
  },
});

export default AnimatedSplash;
