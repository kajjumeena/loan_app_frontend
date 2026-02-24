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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { settingsAPI, emiAPI } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

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
    // Remove any non-digit characters and ensure 91 prefix for Indian numbers
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

  const handleDownloadQR = () => {
    Alert.alert(
      'QR Code',
      'QR code upar dikh raha hai. Aap screenshot le kar ya image par long press karke use save kar sakte hain.'
    );
  };

  const supportNumber = settings.supportNumber || DEFAULTS.supportNumber;
  const isRequested = emi.paymentRequested;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* EMI Summary */}
        <Card style={styles.emiCard}>
          <View style={styles.emiHeader}>
            <View>
              <Text style={styles.emiTitle}>EMI Payment</Text>
              <Text style={styles.emiSubTitle}>
                Loan: {formatCurrency(loan?.amount)} • Day {emi.dayNumber}
              </Text>
            </View>
            <View style={styles.amountChip}>
              <Text style={styles.amountLabel}>Payable</Text>
              <Text style={styles.amountValue}>{formatCurrency(emi.totalAmount)}</Text>
            </View>
          </View>
          {isRequested && (
            <View style={styles.requestedBanner}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={styles.requestedBannerText}>Request sent - Waiting for admin approval</Text>
            </View>
          )}
        </Card>

        {/* QR + UPI Details */}
        <Card style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="qr-code" size={26} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.cardTitle}>UPI Payment</Text>
                <Text style={styles.cardSubtitle}>Scan QR ya UPI se payment karein</Text>
              </View>
            </View>
          </View>

          {qrSource && (
            <View style={styles.qrContainer}>
              <Image source={qrSource} style={styles.qrImage} resizeMode="contain" />
            </View>
          )}

          <Button
            title="QR Code Download / Save"
            onPress={handleDownloadQR}
            variant="outline"
            size="small"
            style={styles.downloadBtn}
          />

          <View style={styles.divider} />

          {/* UPI ID with copy */}
          <View style={styles.infoRow}>
            <View style={styles.infoLabelRow}>
              <Ionicons name="card-outline" size={18} color={colors.primary} />
              <Text style={styles.infoLabel}>UPI ID</Text>
            </View>
            <View style={styles.infoValueRow}>
              <Text style={styles.infoValue} selectable>
                {settings.upiId}
              </Text>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => copyToClipboard(settings.upiId, 'upiId')}
              >
                <Ionicons
                  name={copiedField === 'upiId' ? 'checkmark-circle' : 'copy-outline'}
                  size={18}
                  color={copiedField === 'upiId' ? colors.success : colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* UPI Number with copy */}
          <View style={styles.infoRow}>
            <View style={styles.infoLabelRow}>
              <Ionicons name="call-outline" size={18} color={colors.primary} />
              <Text style={styles.infoLabel}>UPI Number</Text>
            </View>
            <View style={styles.infoValueRow}>
              <Text style={styles.infoValue} selectable>
                {settings.upiNumber}
              </Text>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => copyToClipboard(settings.upiNumber, 'upiNumber')}
              >
                <Ionicons
                  name={copiedField === 'upiNumber' ? 'checkmark-circle' : 'copy-outline'}
                  size={18}
                  color={copiedField === 'upiNumber' ? colors.success : colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Support Number with copy */}
          <View style={styles.infoRow}>
            <View style={styles.infoLabelRow}>
              <Ionicons name="headset-outline" size={18} color={colors.primary} />
              <Text style={styles.infoLabel}>Support Number</Text>
            </View>
            <View style={styles.infoValueRow}>
              <Text style={styles.infoValue} selectable>
                {supportNumber}
              </Text>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => copyToClipboard(supportNumber, 'supportNumber')}
              >
                <Ionicons
                  name={copiedField === 'supportNumber' ? 'checkmark-circle' : 'copy-outline'}
                  size={18}
                  color={copiedField === 'supportNumber' ? colors.success : colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Hindi Instruction + WhatsApp */}
        <Card style={styles.hindiCard}>
          <View style={styles.hindiHeader}>
            <Ionicons name="chatbubbles-outline" size={22} color={colors.primary} />
            <Text style={styles.hindiTitle}>Payment ke baad kya karein?</Text>
          </View>
          <Text style={styles.hindiText}>
            1. UPI se payment karein{'\n'}
            2. Neeche "I Have Paid" button dabayein{'\n'}
            3. Admin verify karke approve kar dega
          </Text>

          <TouchableOpacity style={styles.whatsappBtn} onPress={openWhatsApp}>
            <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
            <Text style={styles.whatsappBtnText}>WhatsApp pe Screenshot Bhejein</Text>
          </TouchableOpacity>
        </Card>

        {/* Request Payment Button */}
        <View style={styles.requestSection}>
          {emi.status === 'paid' ? (
            <View style={styles.paidBanner}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={styles.paidBannerText}>This EMI is already paid</Text>
            </View>
          ) : isRequested ? (
            <View style={styles.requestedContainer}>
              <View style={styles.requestedInfo}>
                <Ionicons name="hourglass-outline" size={24} color={colors.primary} />
                <View style={styles.requestedTextContainer}>
                  <Text style={styles.requestedTitle}>Request Sent</Text>
                  <Text style={styles.requestedSubtitle}>Admin ko notification bhej di gayi hai. Jaldi approve ho jayegi.</Text>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.requestBtn, requesting && styles.requestBtnDisabled]}
              onPress={handleRequestPayment}
              disabled={requesting}
              activeOpacity={0.8}
            >
              {requesting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="send" size={20} color={colors.white} />
              )}
              <Text style={styles.requestBtnText}>
                {requesting ? 'Sending Request...' : 'I Have Paid - Request Verification'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
    paddingBottom: spacing.xl,
  },
  emiCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  emiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emiTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  emiSubTitle: {
    marginTop: 4,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  amountChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: fontSize.xs,
    color: colors.textOnPrimary,
    opacity: 0.9,
  },
  amountValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
  requestedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  requestedBannerText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  mainCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  cardHeader: {
    marginBottom: spacing.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
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
  cardSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  downloadBtn: {
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: fontWeight.semibold,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  copyBtn: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accentLight,
  },
  hindiCard: {
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  hindiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  hindiTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  hindiText: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#25D366',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  requestSection: {
    marginBottom: spacing.xl,
  },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  requestBtnDisabled: {
    opacity: 0.7,
  },
  requestBtnText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  requestedContainer: {
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  requestedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  requestedTextContainer: {
    flex: 1,
  },
  requestedTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  requestedSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  paidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successLight,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.success,
  },
  paidBannerText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
});

export default UPIPaymentScreen;
