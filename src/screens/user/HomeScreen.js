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
import { userAPI, loanAPI } from '../../services/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import LoanCard from '../../components/LoanCard';
import EMICard from '../../components/EMICard';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [dashboardRes, loansRes] = await Promise.all([
        userAPI.getDashboard(),
        loanAPI.getMyLoans(),
      ]);
      setDashboard(dashboardRes.data);
      setLoans(loansRes.data);
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
  loanEmiGroup: { marginBottom: spacing.lg },
  loanEmiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  loanEmiTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  viewDetailBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  viewDetailText: { fontSize: fontSize.sm, color: colors.textOnPrimary, fontWeight: fontWeight.medium },
});

export default HomeScreen;
