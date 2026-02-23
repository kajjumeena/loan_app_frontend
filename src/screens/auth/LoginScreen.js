import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { sendOTP, error, setError } = useAuth();

  const validateEmail = (e) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(e);
  };

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await sendOTP(email);
      const testOtp = response.otp;
      if (Platform.OS === 'web') {
        if (testOtp) {
          window.alert(`OTP Sent! (Testing) Your OTP: ${testOtp}`);
        } else {
          window.alert('OTP sent to your email. Check your inbox.');
        }
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
      if (Platform.OS === 'web') {
        window.alert('Error: ' + msg);
      } else {
        Alert.alert('Error', msg, [{ text: 'OK' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>₹</Text>
            </View>
            <Text style={styles.title}>Loan App</Text>
            <Text style={styles.subtitle}>
              Get instant loans with easy daily EMIs
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.formTitle}>Login with Email</Text>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button
              title="Send OTP"
              onPress={handleSendOTP}
              loading={loading}
              size="large"
              style={styles.button}
            />
            <TouchableOpacity
              onPress={() => navigation.navigate('FindEmail')}
              style={styles.forgotEmailLink}
            >
              <Text style={styles.forgotEmailText}>Forgot Email? Find it here</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
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
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    fontSize: 40,
    color: colors.textOnPrimary,
    fontWeight: fontWeight.bold,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginVertical: spacing.xl,
  },
  formTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.md,
  },
  footer: {
    paddingBottom: spacing.lg,
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  forgotEmailLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  forgotEmailText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
