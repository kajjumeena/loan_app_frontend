import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  Alert,
  TouchableOpacity,
  Animated,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { sendOTP, error, setError } = useAuth();
  const isFocused = useRef(false);
  const inputRef = useRef(null);

  // Animations - only for the top purple section (no animation wrapper on form)
  const logoScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(titleSlide, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      ]),
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSendOTP = async () => {
    if (!email) { Alert.alert('Error', 'Please enter your email'); return; }
    if (!validateEmail(email)) { Alert.alert('Error', 'Please enter a valid email address'); return; }

    setLoading(true);
    setError(null);

    try {
      const response = await sendOTP(email);
      const testOtp = response.otp;
      if (Platform.OS === 'web') {
        window.alert(testOtp ? `OTP Sent! (Testing) Your OTP: ${testOtp}` : 'OTP sent to your email. Check your inbox.');
        navigation.navigate('OTP', { email, otp: testOtp });
      } else {
        Alert.alert(
          'OTP Sent',
          testOtp ? `(Testing) Your OTP: ${testOtp}` : 'OTP sent to your email. Check your inbox.',
          [{ text: 'OK', onPress: () => navigation.navigate('OTP', { email, otp: testOtp }) }]
        );
      }
    } catch (err) {
      const msg = (err && err.message && String(err.message).trim()) || 'Failed to send OTP. Please try again.';
      if (Platform.OS === 'web') { window.alert('Error: ' + msg); }
      else { Alert.alert('Error', msg, [{ text: 'OK' }]); }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        bounces={false}
      >
        {/* Purple Top Section */}
        <View style={styles.topSection}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <View style={styles.decorCircle3} />

          {/* Logo */}
          <Animated.View
            style={[
              styles.logoOuter,
              { transform: [{ scale: logoScale }] },
            ]}
          >
            <View style={styles.logoInner}>
              <Text style={styles.logoSymbol}>₹</Text>
            </View>
          </Animated.View>

          {/* App Name - Single Line */}
          <Animated.Text
            style={[
              styles.appName,
              { opacity: titleOpacity, transform: [{ translateY: titleSlide }] },
            ]}
          >
            LoanSnap
          </Animated.Text>

          {/* Tagline */}
          <Animated.Text style={[styles.tagline, { opacity: subtitleOpacity }]}>
            Instant loans, easy daily EMIs
          </Animated.Text>
        </View>

        {/* Curved Divider */}
        <View style={styles.curveContainer}>
          <View style={styles.curve} />
        </View>

        {/* Form Section - NO Animated.View wrapper, plain Views only */}
        <View style={styles.formSection}>
          <View style={styles.formCard}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to continue managing your loans</Text>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconWrap}>
                  <Ionicons name="mail-outline" size={20} color={colors.textLight} />
                </View>
                <TextInput
                  ref={inputRef}
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email address"
                  placeholderTextColor={colors.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Send OTP Button */}
            <TouchableOpacity
              style={[styles.otpButton, loading && styles.otpButtonDisabled]}
              onPress={handleSendOTP}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.btnContent}>
                  <ActivityIndicator size="small" color="#FFF" />
                  <Text style={[styles.otpButtonText, { marginLeft: 10 }]}>Sending...</Text>
                </View>
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.otpButtonText}>Send OTP</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>

            {/* Forgot Email */}
            <TouchableOpacity
              onPress={() => navigation.navigate('FindEmail')}
              style={styles.forgotRow}
            >
              <Ionicons name="help-circle-outline" size={16} color={colors.primary} />
              <Text style={styles.forgotText}>Forgot Email? Find it here</Text>
            </TouchableOpacity>
          </View>

          {/* Features row */}
          <View style={styles.featuresRow}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.successLight }]}>
                <Ionicons name="flash" size={16} color={colors.success} />
              </View>
              <Text style={styles.featureText}>Instant</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
              </View>
              <Text style={styles.featureText}>Secure</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.warningLight }]}>
                <Ionicons name="wallet" size={16} color={colors.warning} />
              </View>
              <Text style={styles.featureText}>Easy EMIs</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our{' '}
            <Text style={styles.footerLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Top Purple Section
  topSection: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 30,
    alignItems: 'center',
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorCircle2: {
    position: 'absolute',
    top: 60,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  decorCircle3: {
    position: 'absolute',
    bottom: -20,
    right: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  // Logo
  logoOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSymbol: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },

  // App Name - Single Line
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '400',
    letterSpacing: 0.5,
  },

  // Curved transition
  curveContainer: {
    height: 20,
    backgroundColor: colors.primary,
  },
  curve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  // Form Section
  formSection: {
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(107,70,193,0.06)',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 18,
  },

  // Input
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7FC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  inputIconWrap: {
    paddingLeft: 16,
    paddingRight: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 14,
    paddingRight: 16,
  },

  // OTP Button
  otpButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  otpButtonDisabled: {
    opacity: 0.7,
  },
  otpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Forgot
  forgotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  forgotText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },

  // Features
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginTop: 28,
    marginBottom: 8,
  },
  featureItem: {
    alignItems: 'center',
    gap: 6,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Footer
  footer: {
    paddingHorizontal: 32,
    paddingVertical: 20,
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 16,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '500',
  },
});

export default LoginScreen;
