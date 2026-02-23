import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { loanAPI, configAPI, userAPI } from '../../services/api';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const LOAN_AMOUNTS = [5000, 10000, 15000, 20000, 25000, 50000];
const MIN_LOAN = 1000;
const MAX_LOAN = 100000;

const ApplyLoanScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [totalDays, setTotalDays] = useState(100);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(-1);
  const [formData, setFormData] = useState({
    amount: '',
    name: '',
    mobile: '',
    address: '',
    aadhaarNumber: '',
    panNumber: '',
  });
  const [profileUser, setProfileUser] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    configAPI.getConfig()
      .then(res => setTotalDays(res.data.totalDays || 100))
      .catch(() => {});
  }, []);

  const loadProfile = async () => {
    try {
      const res = await userAPI.getProfile();
      const data = res.data;
      const addrs = data.addresses || [];
      if (data.address && !addrs.includes(data.address)) {
        addrs.unshift(data.address);
      }
      setSavedAddresses(addrs);
      setProfileUser(data);
      setFormData(f => ({
        ...f,
        name: data.name || '',
        mobile: data.mobile || '',
        address: f.address || data.address || (addrs[0] || ''),
        aadhaarNumber: data.aadhaarNumber || '',
        panNumber: data.panNumber || '',
      }));
      const newAddr = data.address || (addrs[0] || '');
      const idx = addrs.findIndex(a => a === newAddr);
      setSelectedAddressIndex(idx >= 0 ? idx : -1);
    } catch (e) {}
  };

  useEffect(() => {
    loadProfile();
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfile();
      refreshUser();
    });
    return unsubscribe;
  }, [navigation]);

  const handleAmountSelect = (amount) => {
    setFormData({ ...formData, amount: amount.toString() });
    setErrors({ ...errors, amount: '' });
  };

  const handleCustomAmountChange = (value) => {
    const numeric = value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, amount: numeric });
    if (errors.amount) setErrors({ ...errors, amount: '' });
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (field === 'address') setSelectedAddressIndex(-1);
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const selectSavedAddress = (addr, index) => {
    setFormData({ ...formData, address: addr });
    setSelectedAddressIndex(index);
    setErrors({ ...errors, address: '' });
  };

  const validateForm = () => {
    const newErrors = {};
    const amountNum = parseInt(formData.amount);
    if (!formData.amount) newErrors.amount = 'Please select or enter a loan amount';
    else if (isNaN(amountNum) || amountNum < MIN_LOAN || amountNum > MAX_LOAN) {
      newErrors.amount = `Amount must be between ₹${MIN_LOAN.toLocaleString()} and ₹${MAX_LOAN.toLocaleString()}`;
    }
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.mobile || formData.mobile.length !== 10) newErrors.mobile = 'Valid 10-digit mobile number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.aadhaarNumber || formData.aadhaarNumber.length !== 12) newErrors.aadhaarNumber = 'Please add Aadhaar in Edit Document Details';
    if (!formData.panNumber || formData.panNumber.length !== 10) newErrors.panNumber = 'Please add PAN in Edit Document Details';
    if (!profileUser?.aadhaarImage) newErrors.aadhaarImage = 'Please add Aadhaar image in Edit Document Details';
    if (!profileUser?.panImage) newErrors.panImage = 'Please add PAN image in Edit Document Details';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateEMI = () => {
    if (!formData.amount) return null;
    const amount = parseInt(formData.amount);
    if (isNaN(amount) || amount < MIN_LOAN || amount > MAX_LOAN) return null;
    const totalInterest = amount * 0.20;
    const dailyPrincipal = Math.ceil(amount / totalDays);
    const dailyInterest = Math.ceil(totalInterest / totalDays);
    const dailyEMI = dailyPrincipal + dailyInterest;
    const totalPayable = amount + totalInterest;
    return { dailyEMI, totalPayable, dailyPrincipal, dailyInterest, totalInterest };
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await loanAPI.apply(formData);
      await refreshUser();
      Alert.alert('Success', 'Your loan application has been submitted. You will be notified once reviewed.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const emiDetails = calculateEMI();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Card title="Select Loan Amount">
            <View style={styles.amountGrid}>
              {LOAN_AMOUNTS.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[styles.amountOption, formData.amount === amount.toString() && styles.amountOptionSelected]}
                  onPress={() => handleAmountSelect(amount)}
                >
                  <Text style={[styles.amountText, formData.amount === amount.toString() && styles.amountTextSelected]}>
                    ₹{amount.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.customAmountRow}>
              <Text style={styles.customAmountLabel}>Or enter custom amount:</Text>
              <Input value={formData.amount} onChangeText={handleCustomAmountChange} placeholder="e.g. 9000" keyboardType="number-pad" maxLength={6} style={styles.customAmountInput} />
            </View>
            <Text style={styles.amountRangeHint}>Min ₹{MIN_LOAN.toLocaleString()} - Max ₹{MAX_LOAN.toLocaleString()}</Text>
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
          </Card>

          {emiDetails && (
            <Card title="EMI Details" style={styles.emiCard}>
              <View style={styles.emiRow}><Text style={styles.emiLabel}>Loan Amount:</Text><Text style={styles.emiValue}>₹{parseInt(formData.amount).toLocaleString('en-IN')}</Text></View>
              <View style={styles.emiRow}><Text style={styles.emiLabel}>Duration:</Text><Text style={styles.emiValue}>{totalDays} Days</Text></View>
              <View style={styles.emiRow}><Text style={styles.emiLabel}>Daily EMI:</Text><Text style={styles.emiValue}>₹{emiDetails.dailyEMI}</Text></View>
              <View style={[styles.emiRow, styles.emiTotal]}><Text style={styles.emiTotalLabel}>Total Payable:</Text><Text style={styles.emiTotalValue}>₹{emiDetails.totalPayable.toLocaleString('en-IN')}</Text></View>
            </Card>
          )}

          <Card title="Personal Details">
            <Input label="Full Name" value={formData.name} onChangeText={(v) => handleChange('name', v)} placeholder="Enter your full name" error={errors.name} />
            <Input label="Mobile Number" value={formData.mobile} onChangeText={(v) => handleChange('mobile', v)} placeholder="Enter 10-digit mobile number" keyboardType="phone-pad" maxLength={10} error={errors.mobile} />

            {/* Saved Addresses - Flipkart style */}
            {savedAddresses.length > 0 && (
              <View style={styles.addressSection}>
                <Text style={styles.addressSectionTitle}>Saved Addresses</Text>
                {savedAddresses.map((addr, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.addressOption, selectedAddressIndex === idx && styles.addressOptionSelected]}
                    onPress={() => selectSavedAddress(addr, idx)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radio, selectedAddressIndex === idx && styles.radioSelected]}>
                      {selectedAddressIndex === idx && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.addressOptionText} numberOfLines={2}>{addr}</Text>
                  </TouchableOpacity>
                ))}
                <Text style={styles.orNew}>Or add new address:</Text>
              </View>
            )}
            <Input label="Address" value={formData.address} onChangeText={(v) => handleChange('address', v)} placeholder="Enter your full address" multiline numberOfLines={3} error={errors.address} />

            <View style={styles.docSection}>
              <Text style={styles.docSectionTitle}>Identity Documents</Text>
              <Text style={styles.docHint}>From your profile. To change, tap Edit Document Details below.</Text>
              <View style={styles.docRow}>
                <Text style={styles.docLabel}>Aadhaar</Text>
                <Text style={styles.docValue}>{formData.aadhaarNumber ? `XXXX XXXX ${formData.aadhaarNumber.slice(-4)}` : '-'}</Text>
              </View>
              {profileUser?.aadhaarImage ? (
                <Image source={{ uri: profileUser.aadhaarImage }} style={styles.docImage} resizeMode="cover" />
              ) : (
                <Text style={styles.docMissing}>No Aadhaar image</Text>
              )}
              {errors.aadhaarNumber && <Text style={styles.errorText}>{errors.aadhaarNumber}</Text>}
              {errors.aadhaarImage && <Text style={styles.errorText}>{errors.aadhaarImage}</Text>}
              <View style={styles.docRow}>
                <Text style={styles.docLabel}>PAN</Text>
                <Text style={styles.docValue}>{formData.panNumber ? `${formData.panNumber.slice(0, 2)}*****${formData.panNumber.slice(-4)}` : '-'}</Text>
              </View>
              {profileUser?.panImage ? (
                <Image source={{ uri: profileUser.panImage }} style={styles.docImage} resizeMode="cover" />
              ) : (
                <Text style={styles.docMissing}>No PAN image</Text>
              )}
              {errors.panNumber && <Text style={styles.errorText}>{errors.panNumber}</Text>}
              {errors.panImage && <Text style={styles.errorText}>{errors.panImage}</Text>}
              <TouchableOpacity style={styles.editDocLink} onPress={() => navigation.navigate('EditDocument')} activeOpacity={0.7}>
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                <Text style={styles.editDocLinkText}>Edit Document Details</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </Card>

          <Button title="Submit Application" onPress={handleSubmit} loading={loading} size="large" style={styles.submitButton} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.md },
  amountGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs },
  amountOption: { width: '30%', margin: '1.5%', paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderRadius: borderRadius.md, borderWidth: 2, borderColor: colors.border, alignItems: 'center' },
  amountOptionSelected: { borderColor: colors.primary, backgroundColor: colors.accentLight },
  amountText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  amountTextSelected: { color: colors.primary },
  errorText: { fontSize: fontSize.xs, color: colors.error, marginTop: spacing.sm },
  customAmountRow: { marginTop: spacing.md },
  customAmountLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  customAmountInput: { marginBottom: spacing.xs },
  amountRangeHint: { fontSize: fontSize.xs, color: colors.textLight, marginTop: spacing.xs },
  emiCard: { backgroundColor: colors.accentLight },
  emiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  emiLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  emiValue: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  emiTotal: { paddingTop: spacing.sm, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.primary },
  emiTotalLabel: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.primary },
  emiTotalValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.primary },
  addressSection: { marginBottom: spacing.md },
  addressSectionTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text, marginBottom: spacing.sm },
  addressOption: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  addressOptionSelected: { borderColor: colors.primary, backgroundColor: colors.accentLight },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, marginRight: spacing.md, justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  addressOptionText: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  orNew: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  docSection: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  docSectionTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text, marginBottom: spacing.xs },
  docHint: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing.sm },
  docRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  docLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  docValue: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  docImage: { width: '100%', height: 120, borderRadius: borderRadius.md, marginTop: spacing.xs, marginBottom: spacing.sm },
  docMissing: { fontSize: fontSize.xs, color: colors.textSecondary, fontStyle: 'italic', marginBottom: spacing.sm },
  editDocLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  editDocLinkText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    marginLeft: spacing.xs,
  },
  submitButton: { marginTop: spacing.md, marginBottom: spacing.xl },
});

export default ApplyLoanScreen;
