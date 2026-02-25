import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { userAPI, loanAPI, emiAPI } from '../../services/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import LoanCard from '../../components/LoanCard';
import EMICard from '../../components/EMICard';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loans, setLoans] = useState([]);
  const [requestedEMIs, setRequestedEMIs] = useState([]);
  const [recentlyCompleted, setRecentlyCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [dashboardRes, loansRes, requestedRes, completedRes] = await Promise.all([
        userAPI.getDashboard(),
        loanAPI.getMyLoans(),
        emiAPI.getMyRequested().catch(() => ({ data: [] })),
        emiAPI.getMyRecentlyCompleted().catch(() => ({ data: [] })),
      ]);
      setDashboard(dashboardRes.data);
      setLoans(loansRes.data);
      setRequestedEMIs(requestedRes.data || []);
      setRecentlyCompleted(completedRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatCurrency = (amount) => `₹${amount?.toLocaleString('en-IN') || 0}`;
  const handleLoanPress = (loan) => navigation.navigate('LoanDetails', { loanId: loan._id });
  const handlePayEMI = (emi) => {
    const loan = loans.find(l => l._id === emi.loanId || l._id === emi.loanId?._id) || emi.loanId;
    // Temporarily show UPI details screen instead of Razorpay
    navigation.navigate('UPIPayment', { emi, loan });
  };
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Group today's EMIs by loan
  const todayEMIs = dashboard?.todayEMIs || [];
  const todayByLoan = {};
  todayEMIs.forEach(emi => {
    const lid = emi.loanId?._id || emi.loanId;
    if (!lid) return;
    if (!todayByLoan[lid]) todayByLoan[lid] = { loan: emi.loanId || loans.find(l => l._id === lid), emis: [] };
    todayByLoan[lid].emis.push(emi);
  });
  const todayLoanEntries = Object.values(todayByLoan);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* App Logo Header */}
        <View style={styles.logoHeader}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoSymbol}>₹</Text>
          </View>
          <View>
            <Text style={styles.logoLine1}>Loan</Text>
            <Text style={styles.logoLine2}>Snap</Text>
          </View>
        </View>

        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={() => navigation.navigate('Help')} style={styles.helpIconBtn}>
              <Ionicons name="help-circle" size={26} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(dashboard?.stats?.totalLoanAmount)}</Text>
            <Text style={styles.statLabel}>Total Loan</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.paidValue]}>{formatCurrency(dashboard?.stats?.totalPaid)}</Text>
            <Text style={styles.statLabel}>Total Paid</Text>
          </View>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.remainingValue]}>{formatCurrency(dashboard?.stats?.remainingBalance)}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.penaltyValue]}>{formatCurrency(dashboard?.stats?.totalPenalty)}</Text>
            <Text style={styles.statLabel}>Penalty</Text>
          </View>
        </View>

        <Button title="Apply for New Loan" onPress={() => navigation.navigate('ApplyLoan')} size="large" style={styles.applyButton} />

        {/* Pending EMI Requests */}
        {requestedEMIs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="hourglass-outline" size={18} color={colors.warning} />
                <Text style={styles.sectionTitle}>Pending EMI Requests</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{requestedEMIs.length}</Text>
              </View>
            </View>
            {requestedEMIs.map((emi) => (
              <View key={emi._id} style={styles.requestCard}>
                <View style={styles.requestCardHeader}>
                  <Text style={styles.requestCardDay}>Day {emi.dayNumber}</Text>
                  <View style={styles.requestedBadge}>
                    <Text style={styles.requestedBadgeText}>WAITING</Text>
                  </View>
                </View>
                <Text style={styles.requestCardAmount}>{formatCurrency(emi.totalAmount)}</Text>
                {emi.loanId && (
                  <Text style={styles.requestCardLoan}>Loan: {formatCurrency(emi.loanId.amount)}</Text>
                )}
                <Text style={styles.requestCardSub}>Payment request sent to admin for verification</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recently Completed EMI Requests */}
        {recentlyCompleted.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
                <Text style={styles.sectionTitle}>Recently Completed Requests</Text>
              </View>
              <View style={[styles.countBadge, styles.countBadgeGreen]}>
                <Text style={[styles.countBadgeText, styles.countBadgeTextGreen]}>{recentlyCompleted.length}</Text>
              </View>
            </View>
            {recentlyCompleted.slice(0, 5).map((emi) => (
              <View key={emi._id} style={styles.completedCard}>
                <View style={styles.requestCardHeader}>
                  <Text style={styles.requestCardDay}>Day {emi.dayNumber}</Text>
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>APPROVED</Text>
                  </View>
                </View>
                <Text style={[styles.requestCardAmount, { color: colors.success }]}>{formatCurrency(emi.totalAmount)}</Text>
                {emi.loanId && (
                  <Text style={styles.requestCardLoan}>Loan: {formatCurrency(emi.loanId.amount)}</Text>
                )}
                {emi.paidAt && (
                  <Text style={styles.requestCardSub}>Approved on {new Date(emi.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Today's EMIs - grouped by loan with View Detail */}
        {todayLoanEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's EMIs</Text>
            {todayLoanEntries.map(({ loan, emis }) => (
              <View key={loan?._id || 'unknown'} style={styles.loanEmiGroup}>
                <View style={styles.loanEmiHeader}>
                  <Text style={styles.loanEmiTitle}>Loan: {formatCurrency(loan?.amount)}</Text>
                  <TouchableOpacity onPress={() => handleLoanPress(loan)} style={styles.viewDetailBtn}>
                    <Text style={styles.viewDetailText}>View Detail</Text>
                  </TouchableOpacity>
                </View>
                {emis.map((emi) => (
                  <EMICard key={emi._id} emi={emi} onPay={handlePayEMI} showLoanInfo={false} showPaidAt />
                ))}
              </View>
            ))}
          </View>
        )}

        {dashboard?.upcomingEMIs?.length > 0 && todayLoanEntries.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming EMIs</Text>
            {dashboard.upcomingEMIs.map((emi) => (
              <EMICard key={emi._id} emi={emi} onPay={handlePayEMI} />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Loans</Text>
          {loans.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>No loans yet. Apply for your first loan!</Text>
            </Card>
          ) : (
            loans.slice(0, 5).map((loan) => (
              <LoanCard key={loan._id} loan={loan} onPress={handleLoanPress} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.md },
  logoHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.sm, paddingTop: spacing.sm },
  logoCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  logoSymbol: { fontSize: 20, fontWeight: fontWeight.bold, color: '#FFF' },
  logoLine1: { fontSize: 18, fontWeight: fontWeight.bold, color: colors.primary, lineHeight: 20 },
  logoLine2: { fontSize: 18, fontWeight: fontWeight.bold, color: colors.primaryDark, lineHeight: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: fontSize.lg, color: colors.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg, paddingTop: spacing.md },
  greeting: { fontSize: fontSize.md, color: colors.textSecondary },
  userName: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  helpIconBtn: { padding: spacing.sm },
  logoutButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.errorLight, borderRadius: borderRadius.md, marginLeft: spacing.sm },
  logoutText: { fontSize: fontSize.sm, color: colors.error, fontWeight: fontWeight.medium },
  statsContainer: { flexDirection: 'row', marginBottom: spacing.md },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginHorizontal: spacing.xs, alignItems: 'center', shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  statValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.primary },
  paidValue: { color: colors.success },
  remainingValue: { color: colors.warning },
  penaltyValue: { color: colors.error },
  statLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  applyButton: { marginVertical: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text, marginBottom: spacing.md },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  countBadge: { backgroundColor: colors.warningLight, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  countBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.warning },
  countBadgeGreen: { backgroundColor: colors.successLight },
  countBadgeTextGreen: { color: colors.success },
  requestCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, borderLeftWidth: 4, borderLeftColor: colors.warning },
  requestCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  requestCardDay: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  requestedBadge: { backgroundColor: colors.warningLight, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  requestedBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.warning },
  requestCardAmount: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.primary },
  requestCardLoan: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  requestCardSub: { fontSize: fontSize.xs, color: colors.textLight, marginTop: spacing.xs },
  completedCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, borderLeftWidth: 4, borderLeftColor: colors.success },
  completedBadge: { backgroundColor: colors.successLight, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  completedBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.success },
  loanEmiGroup: { marginBottom: spacing.lg },
  loanEmiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  loanEmiTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  viewDetailBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  viewDetailText: { fontSize: fontSize.sm, color: colors.textOnPrimary, fontWeight: fontWeight.medium },
});

export default HomeScreen;
