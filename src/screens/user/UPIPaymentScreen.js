import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  Clipboard,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { settingsAPI, emiAPI } from '../../services/api';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEFAULTS = {
  upiId: '9530305519-9@axl',
  upiNumber: '9530305519',
  supportNumber: '9672030409',
};

const UPIPaymentScreen = ({ route, navigation }) => {
  const { emi: initialEmi, loan } = route.params;

  const [emi, setEmi] = useState(initialEmi);
  const [settings, setSettings] = useState({
    qrImageBase64: '',
    upiId: DEFAULTS.upiId,
    upiNumber: DEFAULTS.upiNumber,
    supportNumber: DEFAULTS.supportNumber,
  });
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await settingsAPI.getSettings();
      setSettings({
        qrImageBase64: res.data.qrImageBase64 || '',
        upiId: res.data.upiId || DEFAULTS.upiId,
        upiNumber: res.data.upiNumber || DEFAULTS.upiNumber,
        supportNumber: res.data.supportNumber || DEFAULTS.supportNumber,
      });
    } catch (e) {
      console.warn('Failed to load settings, using defaults');
    } finally {
      setLoading(false);
    }
  };

  const refreshEmi = async () => {
    try {
      const res = await emiAPI.getEMI(emi._id);
      setEmi(res.data);
    } catch (e) {
      console.warn('Failed to refresh EMI');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSettings();
      refreshEmi();
    }, [])
  );

  const formatCurrency = (amount) => `₹${amount?.toLocaleString('en-IN') || 0}`;

  const copyToClipboard = (text, field) => {
    Clipboard.setString(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRequestPayment = () => {
    if (emi.paymentRequested) {
      Alert.alert('Already Requested', 'You have already sent a payment request for this EMI. Admin will verify and approve it soon.');
      return;
    }

    Alert.alert(
      'Confirm Payment Request',
      `Kya aapne Day ${emi.dayNumber} ka ₹${emi.totalAmount} UPI se pay kar diya hai?\n\nAdmin ko verification request bhej di jayegi.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Haan, Maine Pay Kar Diya',
          onPress: async () => {
            setRequesting(true);
            try {
              const res = await emiAPI.requestPayment(emi._id);
              setEmi(res.data.emi);
              Alert.alert(
                'Request Sent!',
                'Aapki payment request admin ko bhej di gayi hai. Admin verify karke approve kar dega.',
                [{ text: 'OK' }]
              );
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || 'Failed to send request');
            } finally {
              setRequesting(false);
            }
          }
        }
      ]
    );
  };

  const openWhatsApp = () => {
    const supportNumber = settings.supportNumber || DEFAULTS.supportNumber;
    const cleanNumber = supportNumber.replace(/\D/g, '');
    const whatsappNumber = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
    const message = `Hi, maine Day ${emi.dayNumber} ka EMI ₹${emi.totalAmount} pay kar diya hai. Please verify.`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp open nahi ho paya. Please check if WhatsApp is installed.');
    });
  };

  let defaultQR = null;
  try { defaultQR = require('../../../assets/QR.jpeg'); } catch {}
  if (!defaultQR) try { defaultQR = require('../../../assets/QR.jpg'); } catch {}
  const qrSource = settings.qrImageBase64 ? { uri: settings.qrImageBase64 } : defaultQR;

  const supportNumber = settings.supportNumber || DEFAULTS.supportNumber;
  const isRequested = emi.paymentRequested;
  const isCanceled = emi.requestCanceled && !emi.paymentRequested && emi.status !== 'paid';
  const isPaid = emi.status === 'paid';

  const CopyableRow = ({ icon, label, value, fieldKey }) => (
    <TouchableOpacity
      style={styles.copyableRow}
      onPress={() => copyToClipboard(value, fieldKey)}
      activeOpacity={0.7}
    >
      <View style={styles.copyableLeft}>
        <View style={styles.copyableIcon}>
          <Ionicons name={icon} size={16} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.copyableLabel}>{label}</Text>
          <Text style={styles.copyableValue}>{value}</Text>
        </View>
      </View>
      <View style={[styles.copyBadge, copiedField === fieldKey && styles.copyBadgeCopied]}>
        <Ionicons
          name={copiedField === fieldKey ? 'checkmark' : 'copy-outline'}
          size={14}
          color={copiedField === fieldKey ? colors.success : colors.primary}
        />
        <Text style={[styles.copyBadgeText, copiedField === fieldKey && styles.copyBadgeTextCopied]}>
          {copiedField === fieldKey ? 'Copied' : 'Copy'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Header */}
        <View style={styles.amountHeader}>
          <Text style={styles.amountHeaderLabel}>Amount to Pay</Text>
          <Text style={styles.amountHeaderValue}>{formatCurrency(emi.totalAmount)}</Text>
          <Text style={styles.amountHeaderSub}>
            Loan: {formatCurrency(loan?.amount)} • Day {emi.dayNumber}
          </Text>
          {isPaid && (
            <View style={styles.statusChip}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.statusChipText}>Paid</Text>
            </View>
          )}
          {isRequested && (
            <View style={[styles.statusChip, styles.statusChipRequested]}>
              <Ionicons name="time" size={16} color={colors.primary} />
              <Text style={[styles.statusChipText, { color: colors.primary }]}>Waiting for Approval</Text>
            </View>
          )}
          {isCanceled && (
            <View style={[styles.statusChip, styles.statusChipCanceled]}>
              <Ionicons name="close-circle" size={16} color={colors.error} />
              <Text style={[styles.statusChipText, { color: colors.error }]}>Request Canceled</Text>
            </View>
          )}
        </View>

        {/* QR Code Section */}
        {qrSource && (
          <View style={styles.qrSection}>
            <Text style={styles.sectionLabel}>Scan QR Code to Pay</Text>
            <TouchableOpacity
              style={styles.qrContainer}
              onPress={() => setQrModalVisible(true)}
              activeOpacity={0.8}
            >
              <Image source={qrSource} style={styles.qrImage} resizeMode="contain" />
              <View style={styles.qrOverlay}>
                <Ionicons name="expand-outline" size={20} color={colors.primary} />
                <Text style={styles.qrOverlayText}>Tap to view full screen</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* UPI Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionLabel}>UPI Details</Text>
          <CopyableRow icon="card-outline" label="UPI ID" value={settings.upiId} fieldKey="upiId" />
          <CopyableRow icon="call-outline" label="UPI Number" value={settings.upiNumber} fieldKey="upiNumber" />
          <CopyableRow icon="headset-outline" label="Support Number" value={supportNumber} fieldKey="supportNumber" />
        </View>

        {/* Instructions */}
        <View style={styles.instructionSection}>
          <Text style={styles.sectionLabel}>Payment ke baad kya karein?</Text>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
            <Text style={styles.stepText}>UPI se payment karein</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
            <Text style={styles.stepText}>Neeche "I Have Paid" button dabayein</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
            <Text style={styles.stepText}>Admin verify karke approve kar dega</Text>
          </View>
        </View>

        {/* WhatsApp Button */}
        <TouchableOpacity style={styles.whatsappBtn} onPress={openWhatsApp} activeOpacity={0.8}>
          <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
          <Text style={styles.whatsappBtnText}>WhatsApp pe Screenshot Bhejein</Text>
        </TouchableOpacity>

        {/* Bottom spacer for button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Action */}
      <View style={styles.bottomBar}>
        {isPaid ? (
          <View style={styles.paidBar}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text style={styles.paidBarText}>This EMI is already paid</Text>
          </View>
        ) : isRequested ? (
          <View style={styles.requestedBar}>
            <Ionicons name="hourglass-outline" size={22} color={colors.primary} />
            <View style={styles.requestedBarText}>
              <Text style={styles.requestedBarTitle}>Request Sent</Text>
              <Text style={styles.requestedBarSub}>Admin ko notification bhej di gayi hai</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.payBtn, requesting && styles.payBtnDisabled]}
            onPress={handleRequestPayment}
            disabled={requesting}
            activeOpacity={0.8}
          >
            {requesting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" />
            )}
            <Text style={styles.payBtnText}>
              {requesting ? 'Sending...' : isCanceled ? 'Re-Request Verification' : 'I Have Paid - Request Verification'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Full Screen QR Modal */}
      <Modal
        visible={qrModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setQrModalVisible(false)}
            >
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Scan QR Code</Text>
              <Text style={styles.modalSubtitle}>Pay {formatCurrency(emi.totalAmount)}</Text>
              {qrSource && (
                <View style={styles.modalQrWrapper}>
                  <Image source={qrSource} style={styles.modalQrImage} resizeMode="contain" />
                </View>
              )}
              <Text style={styles.modalUpiText}>UPI ID: {settings.upiId}</Text>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },

  // Amount Header
  amountHeader: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  amountHeaderLabel: {
    fontSize: fontSize.sm,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  amountHeaderValue: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
    marginTop: 4,
  },
  amountHeaderSub: {
    fontSize: fontSize.sm,
    color: '#FFFFFF',
    opacity: 0.7,
    marginTop: 4,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  statusChipRequested: {
    backgroundColor: colors.accentLight,
  },
  statusChipCanceled: {
    backgroundColor: colors.errorLight,
  },
  statusChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },

  // QR Section
  qrSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.full,
  },
  qrOverlayText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },

  // UPI Details
  detailsSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  copyableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  copyableLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  copyableIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyableLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  copyableValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  copyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accentLight,
  },
  copyBadgeCopied: {
    backgroundColor: colors.successLight,
  },
  copyBadgeText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  copyBadgeTextCopied: {
    color: colors.success,
  },

  // Instructions
  instructionSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },
  stepText: {
    fontSize: fontSize.sm,
    color: colors.text,
    flex: 1,
  },

  // WhatsApp
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#25D366',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },

  // Bottom Bar
  bottomBar: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: borderRadius.xl,
  },
  payBtnDisabled: {
    opacity: 0.7,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  paidBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successLight,
    paddingVertical: 16,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.success,
  },
  paidBarText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  requestedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.accentLight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  requestedBarText: {
    flex: 1,
  },
  requestedBarTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  requestedBarSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // QR Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: fontSize.lg,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: spacing.lg,
  },
  modalQrWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  modalQrImage: {
    width: SCREEN_WIDTH - 100,
    height: SCREEN_WIDTH - 100,
  },
  modalUpiText: {
    fontSize: fontSize.md,
    color: '#FFFFFF',
    marginTop: spacing.lg,
    opacity: 0.9,
  },
});

export default UPIPaymentScreen;
