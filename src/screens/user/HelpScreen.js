import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  RefreshControl,
  Alert,
  Platform,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { settingsAPI } from '../../services/api';
import Card from '../../components/Card';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const DEFAULTS = {
  upiId: '9530305519-9@axl',
  upiNumber: '9530305519',
  supportNumber: '9672030409',
  helpText: '',
};

const HelpScreen = () => {
  const [settings, setSettings] = useState({
    qrImageBase64: '',
    upiId: DEFAULTS.upiId,
    upiNumber: DEFAULTS.upiNumber,
    supportNumber: DEFAULTS.supportNumber,
    helpText: DEFAULTS.helpText,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const fetchSettings = async () => {
    try {
      const res = await settingsAPI.getSettings();
      setSettings({
        qrImageBase64: res.data.qrImageBase64 || '',
        upiId: res.data.upiId || DEFAULTS.upiId,
        upiNumber: res.data.upiNumber || DEFAULTS.upiNumber,
        supportNumber: res.data.supportNumber || DEFAULTS.supportNumber,
        helpText: res.data.helpText || DEFAULTS.helpText,
      });
    } catch (e) {
      console.warn('Failed to load settings, using defaults');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchSettings(); }, []));
  const onRefresh = () => { setRefreshing(true); fetchSettings(); };

  const copyToClipboard = (text, field) => {
    Clipboard.setString(text);
    setCopiedField(field);
    Alert.alert('Copied!', `${field} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openWhatsApp = async () => {
    const num = (settings.supportNumber || DEFAULTS.supportNumber).replace(/\D/g, '');
    
    // Try multiple WhatsApp URL formats
    const urls = [
      `whatsapp://send?phone=91${num}`,
      `https://wa.me/91${num}`,
      `https://api.whatsapp.com/send?phone=91${num}`,
    ];

    let opened = false;
    for (const url of urls) {
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          opened = true;
          break;
        }
      } catch (e) {
        console.log(`Failed to open ${url}:`, e);
      }
    }

    if (!opened) {
      // Fallback: try opening WhatsApp app directly
      try {
        await Linking.openURL('whatsapp://');
      } catch {
        Alert.alert(
          'WhatsApp Not Found',
          'Please install WhatsApp or contact support directly.',
          [
            { text: 'Call Support', onPress: () => Linking.openURL(`tel:${num}`) },
            { text: 'OK', style: 'cancel' },
          ]
        );
      }
    }
  };

  let defaultQR = null;
  try { defaultQR = require('../../../assets/QR.jpeg'); } catch {}
  if (!defaultQR) try { defaultQR = require('../../../assets/QR.jpg'); } catch {}
  const qrSource = settings.qrImageBase64 ? { uri: settings.qrImageBase64 } : defaultQR;

  const InfoRow = ({ icon, label, value, onCopy, field }) => (
    <TouchableOpacity
      style={styles.infoRow}
      onPress={() => onCopy(value, field)}
      activeOpacity={0.7}
    >
      <View style={styles.infoLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => onCopy(value, field)}
        style={styles.copyBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={copiedField === field ? 'checkmark-circle' : 'copy-outline'}
          size={22}
          color={copiedField === field ? colors.success : colors.primary}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="help-circle" size={32} color={colors.primary} />
          </View>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <Text style={styles.headerSubtitle}>Get assistance and payment details</Text>
        </View>

        {/* QR Code Card */}
        {qrSource && (
          <Card style={styles.qrCard}>
            <View style={styles.qrHeader}>
              <Ionicons name="qr-code-outline" size={24} color={colors.primary} />
              <Text style={styles.qrTitle}>Scan to Pay</Text>
            </View>
            <View style={styles.qrContainer}>
              <Image source={qrSource} style={styles.qrImage} resizeMode="contain" />
            </View>
            <Text style={styles.qrHint}>Scan this QR code with any UPI app</Text>
          </Card>
        )}

        {/* Payment Details Card */}
        <Card style={styles.paymentCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="wallet-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Payment Details</Text>
          </View>
          
          <View style={styles.infoSection}>
            <InfoRow
              icon="card-outline"
              label="UPI ID"
              value={settings.upiId}
              onCopy={copyToClipboard}
              field="UPI ID"
            />
            <View style={styles.divider} />
            <InfoRow
              icon="call-outline"
              label="UPI Number"
              value={settings.upiNumber}
              onCopy={copyToClipboard}
              field="UPI Number"
            />
            <View style={styles.divider} />
            <InfoRow
              icon="headset-outline"
              label="Support Number"
              value={settings.supportNumber}
              onCopy={copyToClipboard}
              field="Support Number"
            />
          </View>
        </Card>

        {/* Help Text Card */}
        {(settings.helpText || '').trim().length > 0 && (
          <Card style={styles.helpCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>Help</Text>
            </View>
            <Text style={styles.helpText}>{settings.helpText}</Text>
          </Card>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => Linking.openURL(`tel:${settings.supportNumber.replace(/\D/g, '')}`)}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={20} color={colors.primary} />
            <Text style={styles.actionBtnText}>Call Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* WhatsApp Floating Button */}
      <TouchableOpacity
        style={styles.whatsappBtn}
        onPress={openWhatsApp}
        activeOpacity={0.8}
      >
        <Ionicons name="logo-whatsapp" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: 100 },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
  },
  qrCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  qrTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  qrImage: { width: 200, height: 200 },
  qrHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
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
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  infoSection: {
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  copyBtn: {
    padding: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 56,
  },
  helpText: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 24,
  },
  actionsContainer: {
    marginTop: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  whatsappBtn: {
    position: 'absolute',
    bottom: spacing.xl + (Platform.OS === 'ios' ? 20 : 10),
    right: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default HelpScreen;
