import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  RefreshControl,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const DEFAULTS = {
  upiId: '9530305519-9@axl',
  upiNumber: '9530305519',
  supportNumber: '9672030409',
  helpText: '',
};

const InputField = ({ icon, label, value, onChangeText, placeholder, keyboardType, multiline, inputRef, onFocus, disabled }) => (
  <View style={styles.inputContainer}>
    <View style={styles.inputLabelRow}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.inputLabel}>{label}</Text>
    </View>
    <TextInput
      ref={inputRef}
      style={[styles.input, multiline && styles.textArea, disabled && styles.inputDisabled]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textLight}
      keyboardType={keyboardType}
      autoCapitalize={multiline ? 'sentences' : 'none'}
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      textAlignVertical={multiline ? 'top' : 'center'}
      editable={!disabled}
      onFocus={onFocus}
    />
  </View>
);

const AdminSettingsScreen = () => {
  const { isAdmin, isManager } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState({
    qrImageBase64: '',
    upiId: DEFAULTS.upiId,
    upiNumber: DEFAULTS.upiNumber,
    supportNumber: DEFAULTS.supportNumber,
    helpText: DEFAULTS.helpText,
  });
  const scrollViewRef = useRef(null);
  const supportNumberInputRef = useRef(null);
  const helpTextInputRef = useRef(null);

  const fetchSettings = async () => {
    try {
      const res = await adminAPI.getSettings();
      setSettings({
        qrImageBase64: res.data.qrImageBase64 || '',
        upiId: res.data.upiId || DEFAULTS.upiId,
        upiNumber: res.data.upiNumber || DEFAULTS.upiNumber,
        supportNumber: res.data.supportNumber || DEFAULTS.supportNumber,
        helpText: res.data.helpText || DEFAULTS.helpText,
      });
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to load settings');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSettings();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSettings().finally(() => setRefreshing(false));
  };

  const pickQRImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets[0]?.base64) {
        const data = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setSettings((s) => ({ ...s, qrImageBase64: data }));
        Alert.alert('Success', 'QR code uploaded successfully');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updateSettings(settings);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const scrollToInput = (inputRef) => {
    setTimeout(() => {
      inputRef.current?.measureLayout(
        scrollViewRef.current?.getInnerViewNode(),
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
        },
        () => {}
      );
    }, 100);
  };

  const qrSource = settings.qrImageBase64 ? { uri: settings.qrImageBase64 } : null;
  let defaultQRSource = null;
  try { defaultQRSource = require('../../../assets/QR.jpeg'); } catch {}
  if (!defaultQRSource) try { defaultQRSource = require('../../../assets/QR.jpg'); } catch {}

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="settings" size={32} color={colors.primary} />
            </View>
            <Text style={styles.headerTitle}>App Settings</Text>
            <Text style={styles.headerSubtitle}>Manage payment details and help information</Text>
          </View>

          {/* QR Code Section */}
          <Card style={styles.qrCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.cardIconContainer}>
                  <Ionicons name="qr-code" size={24} color={colors.primary} />
                </View>
                <Text style={styles.cardTitle}>QR Code</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.qrBox}
              onPress={isAdmin ? pickQRImage : undefined}
              activeOpacity={isAdmin ? 0.8 : 1}
              disabled={isManager}
            >
              {(qrSource || defaultQRSource) ? (
                <View style={styles.qrImageContainer}>
                  <Image 
                    source={qrSource || defaultQRSource} 
                    style={styles.qrImage} 
                    resizeMode="contain" 
                  />
                  <View style={styles.qrOverlay}>
                    <Ionicons name="camera" size={24} color={colors.white} />
                    <Text style={styles.qrOverlayText}>Tap to change</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.qrPlaceholder}>
                  <Ionicons name="image-outline" size={48} color={colors.textLight} />
                  <Text style={styles.placeholderText}>No QR Code</Text>
                  <Text style={styles.uploadHint}>Tap to upload QR code</Text>
                </View>
              )}
            </TouchableOpacity>
          </Card>

          {/* Payment Details Section */}
          <Card style={styles.paymentCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.cardIconContainer}>
                  <Ionicons name="wallet" size={24} color={colors.primary} />
                </View>
                <Text style={styles.cardTitle}>Payment Details</Text>
              </View>
            </View>

            <InputField
              icon="card-outline"
              label="UPI ID"
              value={settings.upiId}
              onChangeText={(t) => setSettings((s) => ({ ...s, upiId: t }))}
              placeholder={DEFAULTS.upiId}
              keyboardType="email-address"
              disabled={isManager}
            />

            <InputField
              icon="call-outline"
              label="UPI Number"
              value={settings.upiNumber}
              onChangeText={(t) => setSettings((s) => ({ ...s, upiNumber: t }))}
              placeholder={DEFAULTS.upiNumber}
              keyboardType="phone-pad"
              disabled={isManager}
            />

            <InputField
              icon="headset-outline"
              label="Support Number"
              value={settings.supportNumber}
              onChangeText={(t) => setSettings((s) => ({ ...s, supportNumber: t }))}
              placeholder={DEFAULTS.supportNumber}
              keyboardType="phone-pad"
              inputRef={supportNumberInputRef}
              onFocus={() => scrollToInput(supportNumberInputRef)}
              disabled={isManager}
            />
          </Card>

          {/* Help Text Section */}
          <Card style={styles.helpCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.cardIconContainer}>
                  <Ionicons name="information-circle" size={24} color={colors.primary} />
                </View>
                <Text style={styles.cardTitle}>Help Text</Text>
              </View>
            </View>
            <InputField
              icon="document-text-outline"
              label="Help Information"
              value={settings.helpText}
              onChangeText={(t) => setSettings((s) => ({ ...s, helpText: t }))}
              placeholder="Add any help text for users..."
              multiline
              inputRef={helpTextInputRef}
              onFocus={() => scrollToInput(helpTextInputRef)}
              disabled={isManager}
            />
            <Text style={styles.helpHint}>
              This text will be displayed to users on the Help page
            </Text>
          </Card>

          {/* Save Button - admin only */}
          {isAdmin && (
            <Button
              title={saving ? "Saving..." : "Save Settings"}
              onPress={handleSave}
              loading={saving}
              style={styles.saveBtn}
              size="large"
              icon={<Ionicons name="checkmark-circle" size={20} color={colors.textOnPrimary} />}
            />
          )}
          {isManager && (
            <View style={styles.viewOnlyBanner}>
              <Ionicons name="eye-outline" size={18} color={colors.primary} />
              <Text style={styles.viewOnlyText}>View only. Contact admin to change settings.</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  headerIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  qrCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  paymentCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  helpCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  qrBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  qrImageContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  qrOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  qrOverlayText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    minHeight: 200,
    width: '100%',
  },
  placeholderText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginTop: spacing.sm,
  },
  uploadHint: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.white,
    minHeight: 48,
  },
  textArea: {
    minHeight: 120,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  helpHint: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    fontStyle: 'italic',
    marginTop: -spacing.md,
    marginBottom: spacing.sm,
  },
  saveBtn: {
    marginTop: spacing.lg,
  },
  inputDisabled: {
    backgroundColor: colors.backgroundSecondary,
    color: colors.textSecondary,
  },
  viewOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  viewOnlyText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.primaryDark,
  },
});

export default AdminSettingsScreen;
