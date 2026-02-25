import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { adminAPI } from '../../services/api';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const TABS = [
  { id: 'active', label: 'Active', icon: 'checkmark-circle', color: colors.success },
  { id: 'pending', label: 'Pending', icon: 'time', color: colors.warning },
  { id: 'rejected', label: 'Rejected', icon: 'close-circle', color: colors.error },
];

const AdminLoansScreen = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState(route.params?.initialTab || 'active');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await adminAPI.getDashboard();
      setDashboard(res.data);
    } catch (e) {
      console.error('Error fetching loans:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchData();
  }, []));

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getLoans = () => {
    if (!dashboard) return [];
    if (activeTab === 'active') return dashboard.activeLoans || [];
    if (activeTab === 'pending') return dashboard.pendingApplications || [];
    if (activeTab === 'rejected') return dashboard.rejectedApplications || [];
    return [];
  };

  const formatCurrency = (amount) => `₹${amount?.toLocaleString('en-IN') || 0}`;

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleLoanPress = (loan) => {
    if (activeTab === 'pending') {
      navigation.navigate('LoanReview', { loan, loanId: loan._id });
    } else {
      navigation.navigate('AdminLoanDetail', { loanId: loan._id });
    }
  };

  const getStatusConfig = () => {
    if (activeTab === 'active') return { color: colors.success, bg: colors.successLight, label: 'ACTIVE' };
    if (activeTab === 'pending') return { color: colors.warning, bg: colors.warningLight, label: 'PENDING' };
    return { color: colors.error, bg: colors.errorLight, label: 'REJECTED' };
  };

  const renderLoanItem = ({ item }) => {
    const status = getStatusConfig();
    return (
      <TouchableOpacity
        style={[styles.loanCard, { borderLeftColor: status.color }]}
        onPress={() => handleLoanPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.loanHeader}>
          <Text style={[styles.loanAmount, { color: status.color }]}>
            {formatCurrency(item.amount)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.loanInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.loanName}>{item.applicantName || item.userId?.name || 'Unknown'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.loanDetail}>{item.applicantMobile || item.userId?.mobile || 'N/A'}</Text>
          </View>
          {activeTab === 'active' && (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.loanDetail}>{item.totalDays} days plan</Text>
              </View>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Balance:</Text>
                <Text style={styles.progressValue}>{formatCurrency(item.remainingBalance)}</Text>
              </View>
            </>
          )}
          {activeTab === 'pending' && (
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.loanDetail}>Applied {formatDate(item.createdAt)}</Text>
            </View>
          )}
          {activeTab === 'rejected' && (
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={14} color={colors.error} />
              <Text style={[styles.loanDetail, { color: colors.error }]}>
                {item.rejectionReason || 'No reason specified'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.loanFooter}>
          <Text style={styles.tapHint}>
            {activeTab === 'pending' ? 'Tap to Review →' : 'View Details →'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const loans = getLoans();
  const counts = {
    active: dashboard?.activeLoans?.length || 0,
    pending: dashboard?.pendingApplications?.length || 0,
    rejected: dashboard?.rejectedApplications?.length || 0,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Loans</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && { borderBottomColor: tab.color }]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons name={tab.icon} size={16} color={isActive ? tab.color : colors.textLight} />
              <Text style={[styles.tabLabel, isActive && { color: tab.color, fontWeight: fontWeight.bold }]}>
                {tab.label}
              </Text>
              <View style={[styles.countBadge, { backgroundColor: isActive ? tab.color : colors.borderLight }]}>
                <Text style={[styles.countText, { color: isActive ? '#FFF' : colors.textSecondary }]}>
                  {counts[tab.id]}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item._id}
          renderItem={renderLoanItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color={colors.borderLight} />
              <Text style={styles.emptyText}>
                No {activeTab} loans
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    fontWeight: fontWeight.medium,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  loanCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  loanAmount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  loanInfo: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  loanName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  loanDetail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  progressLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  progressValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  loanFooter: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
    alignItems: 'flex-end',
  },
  tapHint: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
});

export default AdminLoansScreen;
