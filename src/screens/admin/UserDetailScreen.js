import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminAPI } from '../../services/api';
import Card from '../../components/Card';
import LoanCard from '../../components/LoanCard';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const UserDetailScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [user, setUser] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserDetails = async () => {
    try {
      const response = await adminAPI.getUserDetails(userId);
      setUser(response.data.user);
      setLoans(response.data.loans);
    } catch (error) {
      console.error('Error fetching user details:', error);
      Alert.alert('Error', 'Failed to load user details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserDetails();
  };

  const handleLoanPress = (loan) => {
    if (loan.status === 'pending') {
      navigation.navigate('LoanReview', { loan });
    } else {
      navigation.navigate('AdminLoanDetail', { loanId: loan._id });
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate totals
  const totalLoans = loans.length;
  const activeLoans = loans.filter((l) => l.status === 'approved').length;
  const totalDisbursed = loans
    .filter((l) => l.status === 'approved' || l.status === 'completed')
    .reduce((sum, l) => sum + l.amount, 0);
  const totalPaid = loans.reduce((sum, l) => sum + (l.totalPaid || 0), 0);
  const totalPending = loans.reduce((sum, l) => sum + (l.remainingBalance || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* User Profile Card */}
        <Card>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{user.name || 'No Name'}</Text>
                {user.role === 'admin' && (
                  <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>Admin</Text></View>
                )}
              </View>
              <Text style={styles.userMobile}>{user.email || '-'}</Text>
              {user.mobile ? <Text style={styles.userMobile}>{user.mobile}</Text> : null}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Joined:</Text>
              <Text style={styles.detailValue}>{formatDate(user.createdAt)}</Text>
            </View>
            {user.address && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address:</Text>
                <Text style={styles.detailValue}>{user.address}</Text>
              </View>
            )}
            {user.aadhaarNumber && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Aadhaar:</Text>
                <Text style={styles.detailValue}>
                  XXXX XXXX {user.aadhaarNumber.slice(-4)}
                </Text>
              </View>
            )}
            {user.panNumber && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>PAN:</Text>
                <Text style={styles.detailValue}>{user.panNumber}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Summary Stats */}
        <Card title="Loan Summary">
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalLoans}</Text>
              <Text style={styles.statLabel}>Total Loans</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.activeValue]}>{activeLoans}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.amountStats}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Total Disbursed:</Text>
              <Text style={styles.amountValue}>{formatCurrency(totalDisbursed)}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Total Paid:</Text>
              <Text style={[styles.amountValue, styles.paidValue]}>
                {formatCurrency(totalPaid)}
              </Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Total Pending:</Text>
              <Text style={[styles.amountValue, styles.pendingValue]}>
                {formatCurrency(totalPending)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Loans List */}
        <View style={styles.loansSection}>
          <Text style={styles.sectionTitle}>Loan History</Text>
          {loans.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>No loans found for this user</Text>
            </Card>
          ) : (
            loans.map((loan) => (
              <LoanCard
                key={loan._id}
                loan={loan}
                onPress={() => handleLoanPress(loan)}
              />
            ))
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  adminBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  adminBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textOnPrimary,
  },
  userMobile: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  detailsSection: {},
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    width: 80,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  detailValue: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  activeValue: {
    color: colors.success,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  amountStats: {},
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  amountLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  amountValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  paidValue: {
    color: colors.success,
  },
  pendingValue: {
    color: colors.warning,
  },
  loansSection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default UserDetailScreen;
