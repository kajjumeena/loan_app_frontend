import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { loanAPI } from '../../services/api';
import Card from '../../components/Card';
import EMICard from '../../components/EMICard';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const LoanDetailsScreen = ({ route, navigation }) => {
  const raw = route.params?.loanId;
  const loanId = raw?._id || raw;
  const [loan, setLoan] = useState(null);
  const [stats, setStats] = useState(null);
  const [emis, setEmis] = useState([]);
  const [paidEmis, setPaidEmis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Paid EMIs Pagination
  const [paidPage, setPaidPage] = useState(1);
  const [hasMorePaid, setHasMorePaid] = useState(false);
  const [loadingMorePaid, setLoadingMorePaid] = useState(false);

  const [visiblePendingCount, setVisiblePendingCount] = useState(5);

  const fetchLoanDetails = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await loanAPI.getLoanDetails(loanId);
      setLoan(response.data.loan);
      setStats(response.data.stats);

      // Separate EMIs
      const allEmis = response.data.emis || [];
      const pending = allEmis.filter(e => e.status !== 'paid');
      setEmis(pending);

      // Initial fetch of paid EMIs (10 at a time)
      fetchPaidEMIs(1, false);
    } catch (error) {
      console.error('Error fetching loan details:', error);
      Alert.alert('Error', 'Failed to load loan details');
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPaidEMIs = async (page = 1, isLoadMore = false) => {
    if (isLoadMore) setLoadingMorePaid(true);
    try {
      const response = await loanAPI.getLoanEMIs(loanId, { status: 'paid', page, limit: 10 });
      if (isLoadMore) {
        setPaidEmis(prev => [...prev, ...response.data.emis]);
      } else {
        setPaidEmis(response.data.emis);
      }
      setHasMorePaid(response.data.pagination.page < response.data.pagination.pages);
      setPaidPage(response.data.pagination.page);
    } catch (e) {
      console.error('Error fetching paid EMIs:', e);
    } finally {
      setLoadingMorePaid(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLoanDetails(loan === null);
    }, [loanId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchLoanDetails();
  };

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString('en-IN') || 0}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'rejected':
        return colors.error;
      case 'completed':
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  const handlePayEMI = (emi) => {
    // Temporarily show UPI details screen instead of Razorpay
    navigation.navigate('UPIPayment', { emi, loan });
  };

  const handleLoadMore = () => {
    setVisiblePendingCount(prev => prev + 5);
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

  if (!loan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loan not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Filter EMIs
  const pendingEmis = emis.sort((a, b) => a.dayNumber - b.dayNumber);
  // paidEmis is now handled by state and paginated fetch

  const displayPending = pendingEmis.slice(0, visiblePendingCount);
  const hasMorePending = pendingEmis.length > visiblePendingCount;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Loan Overview */}
        <Card>
          <View style={styles.loanHeader}>
            <Text style={styles.loanAmount}>{formatCurrency(loan.amount)}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${getStatusColor(loan.status)}20` },
              ]}
            >
              <Text style={[styles.statusText, { color: getStatusColor(loan.status) }]}>
                {loan.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Applied On</Text>
              <Text style={styles.detailValue}>{formatDate(loan.createdAt)}</Text>
            </View>
            {loan.status === 'approved' && (
              <>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Start Date</Text>
                  <Text style={styles.detailValue}>{formatDate(loan.startDate)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>End Date</Text>
                  <Text style={styles.detailValue}>{formatDate(loan.endDate)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Daily EMI</Text>
                  <Text style={styles.detailValue}>{formatCurrency(loan.dailyEMI)}</Text>
                </View>
              </>
            )}
          </View>
        </Card>

        {/* Applicant Details */}
        <Card title="Applicant Details">
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{loan.applicantName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mobile:</Text>
            <Text style={styles.infoValue}>{loan.applicantMobile}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue}>{loan.applicantAddress}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Aadhaar:</Text>
            <Text style={styles.infoValue}>XXXX XXXX {loan.applicantAadhaar?.slice(-4)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>PAN:</Text>
            <Text style={styles.infoValue}>{loan.applicantPan}</Text>
          </View>
        </Card>

        {/* Payment Stats */}
        {stats && (
          <Card title="Payment Summary">
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.paidEMIs}</Text>
                <Text style={styles.statLabel}>Paid EMIs</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, styles.pendingNumber]}>{stats.pendingEMIs}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, styles.overdueNumber]}>{stats.overdueEMIs}</Text>
                <Text style={styles.statLabel}>Overdue</Text>
              </View>
            </View>

            <View style={styles.amountSummary}>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Total Paid:</Text>
                <Text style={[styles.amountValue, styles.paidAmount]}>
                  {formatCurrency(stats.totalPaid)}
                </Text>
              </View>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Total Pending:</Text>
                <Text style={[styles.amountValue, styles.pendingAmount]}>
                  {formatCurrency(stats.totalPending)}
                </Text>
              </View>
              {stats.totalPenalty > 0 && (
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Total Penalty:</Text>
                  <Text style={[styles.amountValue, styles.penaltyAmount]}>
                    {formatCurrency(stats.totalPenalty)}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Upcoming EMIs Section */}
        {pendingEmis.length > 0 && (
          <View style={styles.emisSection}>
            <Text style={styles.sectionTitle}>Upcoming EMIs</Text>
            {displayPending.map((emi) => (
              <EMICard
                key={emi._id}
                emi={emi}
                onPay={handlePayEMI}
              />
            ))}

            {hasMorePending && (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore}>
                <Text style={styles.loadMoreText}>
                  View More ({pendingEmis.length - visiblePendingCount} remaining)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Paid EMIs Section */}
        {paidEmis.length > 0 && (
          <View style={[styles.emisSection, styles.paidEmisSection]}>
            <Text style={styles.sectionTitle}>Paid EMIs ({stats?.totalPaidCount || paidEmis.length})</Text>
            {paidEmis.map((emi) => (
              <EMICard
                key={emi._id}
                emi={emi}
                onPay={null}
                showPaidAt
              />
            ))}

            {hasMorePaid && (
              <TouchableOpacity
                style={[styles.loadMoreBtn, styles.paidLoadMore]}
                onPress={() => fetchPaidEMIs(paidPage + 1, true)}
                disabled={loadingMorePaid}
              >
                <Text style={styles.loadMoreText}>
                  {loadingMorePaid ? 'Fetching...' : 'Fetch More Paid EMIs'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  loanAmount: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    width: '50%',
    marginBottom: spacing.md,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  detailValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    width: 80,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  infoValue: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  pendingNumber: {
    color: colors.warning,
  },
  overdueNumber: {
    color: colors.error,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  amountSummary: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
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
  },
  paidAmount: {
    color: colors.success,
  },
  pendingAmount: {
    color: colors.warning,
  },
  penaltyAmount: {
    color: colors.error,
  },
  emisSection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  paidEmisSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  loadMoreBtn: {
    padding: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  loadMoreText: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.md,
  },
  paidLoadMore: {
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.lg,
  },
});

export default LoanDetailsScreen;
