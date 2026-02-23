import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { settingsAPI } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const DEFAULTS = {
  upiId: '9530305519-9@axl',
  upiNumber: '9530305519',
  supportNumber: '9672030409',
};

const UPIPaymentScreen = ({ route }) => {
  const { emi, loan } = route.params;

  const [settings, setSettings] = useState({
    qrImageBase64: '',
    upiId: DEFAULTS.upiId,
    upiNumber: DEFAULTS.upiNumber,
    supportNumber: DEFAULTS.supportNumber,
  });
  const [loading, setLoading] = useState(true);

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

  useFocusEffect(
    useCallback(() => {
      fetchSettings();
    }, [])
  );

  const formatCurrency = (amount) => `₹${amount?.toLocaleString('en-IN') || 0}`;

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
  const hindiText = `Aapko payment karne ke baad screenshot ${supportNumber} par share kar dena h uske baad admin aapki emi approve kar dega`;

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

          <View style={styles.infoRow}>
            <View style={styles.infoLabelRow}>
              <Ionicons name="card-outline" size={18} color={colors.primary} />
              <Text style={styles.infoLabel}>UPI ID</Text>
            </View>
            <Text style={styles.infoValue} selectable>
              {settings.upiId}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelRow}>
              <Ionicons name="call-outline" size={18} color={colors.primary} />
              <Text style={styles.infoLabel}>UPI Number</Text>
            </View>
            <Text style={styles.infoValue} selectable>
              {settings.upiNumber}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelRow}>
              <Ionicons name="headset-outline" size={18} color={colors.primary} />
              <Text style={styles.infoLabel}>Support Number</Text>
            </View>
            <Text style={styles.infoValue} selectable>
              {supportNumber}
            </Text>
          </View>
        </Card>

        {/* Hindi Instruction */}
        <Card style={styles.hindiCard}>
          <View style={styles.hindiHeader}>
            <Ionicons name="chatbubbles-outline" size={22} color={colors.primary} />
            <Text style={styles.hindiTitle}>Payment ke baad kya karein?</Text>
          </View>
          <Text style={styles.hindiText}>{hindiText}</Text>
        </Card>
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
  infoValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  hindiCard: {
    backgroundColor: colors.surface,
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
  },
});

export default UPIPaymentScreen;

