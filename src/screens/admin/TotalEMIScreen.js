import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { adminAPI } from '../../services/api';
import Card from '../../components/Card';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const TotalEMIScreen = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getTotalEMIs();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching EMI stats:', error);
      Alert.alert('Error', 'Failed to load statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
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

  const collectionRate = stats?.totalEMIs > 0 
    ? ((stats.paidEMIs / stats.totalEMIs) * 100).toFixed(1) 
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overview Card */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Total Collection</Text>
          <Text style={styles.overviewAmount}>
            {formatCurrency(stats?.collectedAmount)}
          </Text>
          <Text style={styles.overviewSubtext}>
            out of {formatCurrency(stats?.totalAmount)}
          </Text>
          <View style={styles.collectionRateContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(collectionRate, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.collectionRate}>{collectionRate}% collected</Text>
          </View>
        </View>

        {/* EMI Statistics */}
        <Card title="EMI Statistics">
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.totalEMIs || 0}</Text>
              <Text style={styles.statLabel}>Total EMIs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.paidValue]}>
                {stats?.paidEMIs || 0}
              </Text>
              <Text style={styles.statLabel}>Paid</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.pendingValue]}>
                {stats?.pendingEMIs || 0}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.overdueValue]}>
                {stats?.overdueEMIs || 0}
              </Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
          </View>
        </Card>

        {/* Loan Statistics */}
        <Card title="Loan Statistics">
          <View style={styles.loanStatsGrid}>
            <View style={styles.loanStatItem}>
              <Text style={styles.loanStatValue}>{stats?.totalLoans || 0}</Text>
              <Text style={styles.loanStatLabel}>Total Loans</Text>
            </View>
            <View style={styles.loanStatItem}>
              <Text style={[styles.loanStatValue, styles.approvedValue]}>
                {stats?.approvedLoans || 0}
              </Text>
              <Text style={styles.loanStatLabel}>Approved</Text>
            </View>
            <View style={styles.loanStatItem}>
              <Text style={[styles.loanStatValue, styles.pendingLoanValue]}>
                {stats?.pendingLoans || 0}
              </Text>
              <Text style={styles.loanStatLabel}>Pending</Text>
            </View>
          </View>
        </Card>

        {/* Amount Summary */}
        <Card title="Amount Summary">
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total Disbursed:</Text>
            <Text style={styles.amountValue}>
              {formatCurrency(stats?.totalDisbursed)}
            </Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total Expected:</Text>
            <Text style={styles.amountValue}>
              {formatCurrency(stats?.totalAmount)}
            </Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total Collected:</Text>
            <Text style={[styles.amountValue, styles.collectedAmount]}>
              {formatCurrency(stats?.collectedAmount)}
            </Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Pending Collection:</Text>
            <Text style={[styles.amountValue, styles.pendingAmount]}>
              {formatCurrency(stats?.pendingAmount)}
            </Text>
          </View>
          <View style={[styles.amountRow, styles.penaltyRow]}>
            <Text style={styles.penaltyLabel}>Total Penalty Accrued:</Text>
            <Text style={styles.penaltyValue}>
              {formatCurrency(stats?.totalPenalty)}
            </Text>
          </View>
        </Card>

        {/* Info Note */}
        <Text style={styles.noteText}>
          Statistics are updated in real-time. Pull down to refresh.
        </Text>
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
  overviewCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  overviewTitle: {
    fontSize: fontSize.md,
    color: colors.textOnPrimary,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  overviewAmount: {
    fontSize: 36,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
  overviewSubtext: {
    fontSize: fontSize.sm,
    color: colors.textOnPrimary,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
  collectionRateContainer: {
    width: '100%',
    marginTop: spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  collectionRate: {
    fontSize: fontSize.sm,
    color: colors.textOnPrimary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  paidValue: {
    color: colors.success,
  },
  pendingValue: {
    color: colors.warning,
  },
  overdueValue: {
    color: colors.error,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  loanStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  loanStatItem: {
    alignItems: 'center',
  },
  loanStatValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  approvedValue: {
    color: colors.success,
  },
  pendingLoanValue: {
    color: colors.warning,
  },
  loanStatLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
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
  collectedAmount: {
    color: colors.success,
  },
  pendingAmount: {
    color: colors.warning,
  },
  penaltyRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginBottom: 0,
  },
  penaltyLabel: {
    fontSize: fontSize.md,
    color: colors.error,
  },
  penaltyValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.error,
  },
  noteText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
});

export default TotalEMIScreen;
