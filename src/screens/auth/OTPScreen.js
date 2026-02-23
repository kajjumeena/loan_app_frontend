import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const OTPScreen = ({ route, navigation }) => {
  const { email, otp: testOtp } = route.params || {};
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const { verifyOTP, sendOTP, error, setError } = useAuth();
  const inputRefs = useRef([]);

  useEffect(() => {
    // Countdown timer for resend OTP
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 4) {
      showAlert('Error', 'Please enter the complete 4-digit OTP');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await verifyOTP(email, otpString);
      // Navigation will be handled by AuthContext state change
    } catch (err) {
      showAlert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;

    try {
      const response = await sendOTP(email);
      setTimer(60);
      setOtp(['', '', '', '']);
      showAlert('OTP Sent', response.otp ? `(Testing) New OTP: ${response.otp}` : 'New OTP sent to your email.');
    } catch (err) {
      showAlert('Error', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              Enter the 4-digit code sent to
            </Text>
            <Text style={styles.mobileText}>{email}</Text>
          </View>

          {/* Test OTP Display - only when using test mode (no real SMS) */}
          {testOtp && (
            <View style={styles.testOtpContainer}>
              <Text style={styles.testOtpLabel}>Test OTP:</Text>
              <Text style={styles.testOtpValue}>{testOtp}</Text>
            </View>
          )}

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled,
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <Button
            title="Verify & Login"
            onPress={handleVerify}
            loading={loading}
            size="large"
            style={styles.button}
          />

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={timer > 0}
            >
              <Text
                style={[
                  styles.resendLink,
                  timer > 0 && styles.resendDisabled,
                ]}
              >
                {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.lg,
  },
  backText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  mobileText: {
    fontSize: fontSize.lg,
    color: colors.text,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.xs,
  },
  testOtpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  testOtpLabel: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginRight: spacing.sm,
  },
  testOtpValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: 4,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.sm,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    color: colors.text,
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.accentLight,
  },
  button: {
    marginBottom: spacing.lg,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  resendLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  resendDisabled: {
    color: colors.textLight,
  },
});

export default OTPScreen;
