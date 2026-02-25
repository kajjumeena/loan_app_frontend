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
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { settingsAPI } from '../../services/api';
import Card from '../../components/Card';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Asset } from 'expo-asset';

const DEFAULTS = {
  upiId: '9530305519-9@axl',
  upiNumber: '9530305519',
  supportNumber: '9672030409',
  helpText: '',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const [qrFullScreen, setQrFullScreen] = useState(false);

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

  const openWhatsApp = () => {
    const num = (settings.supportNumber || DEFAULTS.supportNumber).replace(/\D/g, '');
    const whatsappNumber = num.length === 10 ? `91${num}` : num;
    const url = `https://wa.me/${whatsappNumber}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        'WhatsApp Not Found',
        'Please install WhatsApp or contact support directly.',
        [
          { text: 'Call Support', onPress: () => Linking.openURL(`tel:${num}`) },
          { text: 'OK', style: 'cancel' },
        ]
      );
    });
  };

  const downloadQR = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to save QR code to gallery.');
        return;
      }

      let fileUri;
      if (settings.qrImageBase64) {
        const base64Data = settings.qrImageBase64.replace(/^data:image\/\w+;base64,/, '');
        fileUri = FileSystem.cacheDirectory + 'qr-code.png';
        await FileSystem.writeAsStringAsync(fileUri, base64Data, { encoding: FileSystem.EncodingType.Base64 });
      } else if (defaultQR) {
        const asset = Asset.fromModule(defaultQR);
        await asset.downloadAsync();
        fileUri = asset.localUri;
      }

      if (fileUri) {
        await MediaLibrary.saveToLibraryAsync(fileUri);
        Alert.alert('Saved!', 'QR code saved to your gallery.');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to save QR code. Please take a screenshot instead.');
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
            <TouchableOpacity style={styles.qrContainer} onPress={() => setQrFullScreen(true)} activeOpacity={0.8}>
              <Image source={qrSource} style={styles.qrImage} resizeMode="contain" />
            </TouchableOpacity>
            <Text style={styles.qrHint}>Scan this QR code with any UPI app</Text>
            <View style={styles.qrActions}>
              <TouchableOpacity
                style={styles.viewFullBtn}
                onPress={() => setQrFullScreen(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="expand-outline" size={18} color={colors.primary} />
                <Text style={styles.viewFullBtnText}>View Full</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={downloadQR}
                activeOpacity={0.7}
              >
                <Ionicons name="download-outline" size={18} color={colors.success} />
                <Text style={styles.downloadBtnText}>Save to Gallery</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* QR Full Screen Modal */}
        <Modal
          visible={qrFullScreen}
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setQrFullScreen(false)}
        >
          <View style={styles.fullScreenModal}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <TouchableOpacity
              style={styles.fullScreenCloseBtn}
              onPress={() => setQrFullScreen(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.fullScreenContent}>
              <View style={styles.fullScreenQrWrapper}>
                <Image source={qrSource} style={styles.fullScreenQr} resizeMode="contain" />
              </View>
              <TouchableOpacity style={styles.fullScreenDownloadBtn} onPress={downloadQR} activeOpacity={0.7}>
                <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                <Text style={styles.fullScreenDownloadText}>Save to Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  qrImage: { width: SCREEN_WIDTH - 100, height: SCREEN_WIDTH - 100 },
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
  qrActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  viewFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  viewFullBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  downloadBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreenCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 16,
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenQrWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
  },
  fullScreenQr: {
    width: SCREEN_WIDTH - 16,
    height: SCREEN_WIDTH - 16,
  },
  fullScreenDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.full,
  },
  fullScreenDownloadText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: '#FFFFFF',
  },
});

export default HelpScreen;
