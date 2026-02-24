import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const { width } = Dimensions.get('window');
const actionButtonPadding = width > 400 ? 16 : 14;

const showAlert = (title, message, buttons) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n${message}`);
      if (confirmed && buttons[1]?.onPress) buttons[1].onPress();
    } else {
      window.alert(`${title}: ${message}`);
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

const AdminHomeScreen = ({ navigation }) => {
  const { user, logout, isManager, isAdmin } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setDashboard(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const handleLogout = () => {
    showAlert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleReviewLoan = (loan) => {
    navigation.navigate('LoanReview', { loan });
  };

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString('en-IN') || 0}`;
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

  const stats = dashboard?.stats || {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{isManager ? 'Manager Panel' : 'Admin Panel'}</Text>
            <Text style={styles.userName}>{user?.name || (isManager ? 'Manager' : 'Admin')}</Text>
          </View>
          <View style={styles.headerButtons}>
            {isAdmin && (
              <TouchableOpacity onPress={() => navigation.navigate('AdminSettings')} style={styles.iconButton}>
                <Ionicons name="settings" size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Manager help banner */}
        {isManager && (
          <View style={styles.managerBanner}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={styles.managerBannerText}>
              You can view all data and mark EMIs as paid or clear overdues. Other actions require admin access.
            </Text>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.primaryCard]}>
            <Text style={styles.statValueWhite}>{stats.totalUsers || 0}</Text>
            <Text style={styles.statLabelWhite}>Total Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.warningValue]}>
              {stats.pendingLoans || 0}
            </Text>
            <Text style={styles.statLabel}>Pending Loans</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.successValue]}>
              {stats.activeLoans || 0}
            </Text>
            <Text style={styles.statLabel}>Active Loans</Text>
          </View>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('EMIsTab', { screen: 'TodayEMIs', params: { initialTab: 'overdue' } })}
          >
            <Text style={[styles.statValue, styles.errorValue]}>
              {stats.overdueEMIs || 0}
            </Text>
            <Text style={styles.statLabel}>Overdue EMIs</Text>
            <Text style={styles.tapHint}>Tap to view →</Text>
          </TouchableOpacity>
        </View>

        {/* Today's EMIs */}
        <Card
          title="Today's EMIs"
          onPress={() => navigation.navigate('EMIsTab', { initialTab: 'today' })}
        >
          <View style={styles.todayEmiContainer}>
            <View style={styles.todayEmiStat}>
              <Text style={styles.todayEmiValue}>{stats.todayEMIs || 0}</Text>
              <Text style={styles.todayEmiLabel}>Total</Text>
            </View>
            <View style={styles.todayEmiDivider} />
            <View style={styles.todayEmiStat}>
              <Text style={[styles.todayEmiValue, styles.warningValue]}>
                {stats.todayPendingEMIs || 0}
              </Text>
              <Text style={styles.todayEmiLabel}>Pending</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('EMIsTab', { initialTab: 'today' })}
          >
            <Text style={styles.viewAllText}>View All Today's EMIs →</Text>
          </TouchableOpacity>
        </Card>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Button
            title="View All Users"
            onPress={() => navigation.navigate('UsersTab')}
            variant="secondary"
            style={styles.actionButton}
          />
          <Button
            title="EMI Statistics"
            onPress={() => navigation.navigate('TotalEMIs')}
            variant="outline"
            style={styles.actionButton}
          />
        </View>

        {/* Pending Loan Applications */}
        {dashboard?.pendingApplications?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Applications ({dashboard.pendingApplications.length})</Text>
            {dashboard.pendingApplications.map((loan) => (
              <TouchableOpacity
                key={loan._id}
                style={[styles.applicationCard, styles.pendingBorder]}
                onPress={() => handleReviewLoan(loan)}
              >
                <View style={styles.applicationHeader}>
                  <Text style={styles.applicationAmount}>
                    {formatCurrency(loan.amount)}
                  </Text>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingText}>PENDING</Text>
                  </View>
                </View>
                <Text style={styles.applicationName}>{loan.applicantName || loan.userId?.name}</Text>
                <Text style={styles.applicationMobile}>
                  {loan.applicantMobile || loan.userId?.mobile}
                </Text>
                <Text style={styles.reviewText}>Tap to Review →</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Active Loans */}
        {dashboard?.activeLoans?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Loans ({dashboard.activeLoans.length})</Text>
            {dashboard.activeLoans.map((loan) => (
              <TouchableOpacity
                key={loan._id}
                style={[styles.applicationCard, styles.activeBorder]}
                onPress={() => navigation.navigate('AdminLoanDetail', { loanId: loan._id })}
              >
                <View style={styles.applicationHeader}>
                  <Text style={[styles.applicationAmount, { color: colors.success }]}>
                    {formatCurrency(loan.amount)}
                  </Text>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeText}>ACTIVE</Text>
                  </View>
                </View>
                <Text style={styles.applicationName}>{loan.applicantName || loan.userId?.name}</Text>
                <Text style={styles.applicationMobile}>
                  Balance: {formatCurrency(loan.remainingBalance)}
                </Text>
                <Text style={styles.detailsBtnText}>View Details →</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Rejected Loans */}
        {dashboard?.rejectedApplications?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rejected Applications ({dashboard.rejectedApplications.length})</Text>
            {dashboard.rejectedApplications.map((loan) => (
              <TouchableOpacity
                key={loan._id}
                style={[styles.applicationCard, styles.rejectedBorder]}
                onPress={() => navigation.navigate('AdminLoanDetail', { loanId: loan._id })}
              >
                <View style={styles.applicationHeader}>
                  <Text style={[styles.applicationAmount, { color: colors.error }]}>
                    {formatCurrency(loan.amount)}
                  </Text>
                  <View style={styles.rejectedBadge}>
                    <Text style={styles.rejectedText}>REJECTED</Text>
                  </View>
                </View>
                <Text style={styles.applicationName}>{loan.applicantName || loan.userId?.name}</Text>
                <Text style={styles.applicationMobile}>
                  Reason: {loan.rejectionReason || 'No reason specified'}
                </Text>
                <Text style={styles.detailsBtnText}>View Details →</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.lg,
    color: colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  greeting: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.sm,
  },
  logoutButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.md,
  },
  logoutText: {
    fontSize: fontSize.sm,
    color: colors.error,
    fontWeight: fontWeight.medium,
  },
  managerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  managerBannerText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.primaryDark,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryCard: {
    backgroundColor: colors.primary,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  statValueWhite: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
  successValue: {
    color: colors.success,
  },
  warningValue: {
    color: colors.warning,
  },
  errorValue: {
    color: colors.error,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  tapHint: {
    fontSize: 10,
    color: colors.primary,
    marginTop: 2,
  },
  statLabelWhite: {
    fontSize: fontSize.sm,
    color: colors.textOnPrimary,
    marginTop: spacing.xs,
    opacity: 0.9,
  },
  todayEmiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  todayEmiStat: {
    flex: 1,
    alignItems: 'center',
  },
  todayEmiDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  todayEmiValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  todayEmiLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  viewAllButton: {
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
    paddingHorizontal: actionButtonPadding,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  applicationCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
  },
  pendingBorder: {
    borderLeftColor: colors.warning,
  },
  activeBorder: {
    borderLeftColor: colors.success,
  },
  rejectedBorder: {
    borderLeftColor: colors.error,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  applicationAmount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  pendingBadge: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  pendingText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.warning,
  },
  activeBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  activeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  rejectedBadge: {
    backgroundColor: colors.errorLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  rejectedText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.error,
  },
  applicationName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  applicationMobile: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  reviewText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    marginTop: spacing.md,
    textAlign: 'right',
  },
  detailsBtnText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    marginTop: spacing.md,
    textAlign: 'right',
  },
});

export default AdminHomeScreen;
