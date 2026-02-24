import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { loanAPI, adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import DocViewModal from '../../components/DocViewModal';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const PAGE_SIZE = 15;

const AdminLoanDetailScreen = ({ route, navigation }) => {
  const { isAdmin } = useAuth();
  const raw = route.params?.loanId;
  const loanId = raw?._id || raw;
  const [loan, setLoan] = useState(null);
  const [stats, setStats] = useState(null);
  const [emis, setEmis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(null);
  const [clearingOverdue, setClearingOverdue] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [docModal, setDocModal] = useState({ visible: false, uri: null, title: '' });

  const fetchDetails = async () => {
    try {
      const res = await loanAPI.getLoanDetails(loanId);
      setLoan(res.data.loan);
      setStats(res.data.stats);
      setEmis(res.data.emis || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load loan details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
    fetchDetails();
  }, [loanId]);

  const formatCurrency = (a) => `₹${(a || 0).toLocaleString('en-IN')}`;
  const formatDate = (d) => !d ? 'N/A' : new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatDateTime = (d) => !d ? 'N/A' : new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const handleMarkPaid = async (emi) => {
    Alert.alert(
      'Mark as Paid',
      `Mark EMI Day ${emi.dayNumber} (${formatCurrency(emi.totalAmount)}) as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: async () => {
            setMarkingPaid(emi._id);
            try {
              await adminAPI.markEMIPaid(emi._id);
              fetchDetails();
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || 'Failed');
            }
            setMarkingPaid(null);
          },
        },
      ]
    );
  };

  const handleClearOverdue = async (emi) => {
    Alert.alert(
      'Clear Overdue Charges',
      `Remove overdue penalty of ${formatCurrency(emi.penaltyAmount)} for Day ${emi.dayNumber}?\n\nBase EMI (₹${(emi.principalAmount + emi.interestAmount).toLocaleString('en-IN')}) will remain.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            setClearingOverdue(emi._id);
            try {
              await adminAPI.clearOverdue(emi._id);
              // Optimistically update local state immediately
              setEmis(prevEmis => prevEmis.map(e => 
                e._id === emi._id 
                  ? { ...e, penaltyAmount: 0, totalAmount: e.principalAmount + e.interestAmount }
                  : e
              ));
              // Also update stats if needed
              if (stats) {
                setStats(prevStats => ({
                  ...prevStats,
                  totalPenalty: (prevStats.totalPenalty || 0) - (emi.penaltyAmount || 0),
                }));
              }
              // Refresh to ensure consistency
              fetchDetails();
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || 'Failed');
            }
            setClearingOverdue(null);
          },
        },
      ]
    );
  };

  const handleDeleteLoan = () => {
    Alert.alert(
      'Delete Loan',
      `Are you sure you want to delete this loan?\n\nAmount: ${formatCurrency(loan?.amount)}\nApplicant: ${loan?.applicantName}\n\nThis will delete the loan and all EMIs. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await adminAPI.deleteLoan(loanId);
              Alert.alert('Success', 'Loan deleted');
              navigation.goBack();
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || 'Failed');
            }
            setDeleting(false);
          },
        },
      ]
    );
  };

  if (loading || !loan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>{loading ? 'Loading...' : 'Loan not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Today's date for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };

  // Sort: today's EMI first, then Day 1, Day 2, ... in order
  const sortedEmis = [...emis].sort((a, b) => {
    const aToday = isToday(a.dueDate);
    const bToday = isToday(b.dueDate);
    if (aToday && !bToday) return -1;
    if (!aToday && bToday) return 1;
    return a.dayNumber - b.dayNumber;
  });

  const visibleEmis = sortedEmis.slice(0, displayCount);
  const hasMore = displayCount < sortedEmis.length;

  const loadMore = () => setDisplayCount((c) => Math.min(c + PAGE_SIZE, sortedEmis.length));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDetails(); }} />}
      >
        <Card>
          <View style={styles.header}>
            <Text style={styles.amount}>{formatCurrency(loan.amount)}</Text>
            <View style={[styles.badge, { backgroundColor: `${colors.primary}20` }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{loan.status.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.row}><Text style={styles.label}>Applicant:</Text><Text style={styles.value}>{loan.applicantName} - {loan.applicantMobile}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Address:</Text><Text style={styles.value}>{loan.applicantAddress}</Text></View>
          <View style={styles.row}>
            <Text style={styles.label}>Aadhaar:</Text>
            <View style={styles.valueRow}>
              <Text style={styles.value}>{loan.applicantAadhaar}</Text>
              {loan.aadhaarImage ? (
                <TouchableOpacity
                  style={styles.viewDocBtn}
                  onPress={() => setDocModal({ visible: true, uri: loan.aadhaarImage, title: 'Aadhaar Card' })}
                >
                  <Ionicons name="document-outline" size={18} color={colors.primary} />
                  <Text style={styles.viewDocText}>View Doc</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>PAN:</Text>
            <View style={styles.valueRow}>
              <Text style={styles.value}>{loan.applicantPan}</Text>
              {loan.panImage ? (
                <TouchableOpacity
                  style={styles.viewDocBtn}
                  onPress={() => setDocModal({ visible: true, uri: loan.panImage, title: 'PAN Card' })}
                >
                  <Ionicons name="document-outline" size={18} color={colors.primary} />
                  <Text style={styles.viewDocText}>View Doc</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <View style={styles.row}><Text style={styles.label}>Applied:</Text><Text style={styles.value}>{formatDate(loan.createdAt)}</Text></View>
          {stats && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}><Text style={styles.label}>Paid EMIs:</Text><Text style={[styles.value, styles.green]}>{stats.paidEMIs}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Pending:</Text><Text style={[styles.value, styles.orange]}>{stats.pendingEMIs}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Overdue:</Text><Text style={[styles.value, styles.red]}>{stats.overdueEMIs}</Text></View>
              {stats.totalPenalty > 0 && (
                <View style={styles.row}><Text style={[styles.label, styles.red]}>Penalty:</Text><Text style={[styles.value, styles.red]}>{formatCurrency(stats.totalPenalty)}</Text></View>
              )}
            </>
          )}
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EMI Schedule</Text>
          {visibleEmis.map((emi) => (
            <View key={emi._id} style={[styles.emiCard, emi.penaltyAmount > 0 && styles.emiCardPenalty, isToday(emi.dueDate) && styles.emiCardToday]}>
              <View style={styles.emiRow}>
                <View style={styles.emiDayRow}>
                  <Text style={styles.emiDay}>Day {emi.dayNumber}</Text>
                  {isToday(emi.dueDate) && (
                    <View style={[styles.todayBadge, { marginLeft: spacing.sm }]}><Text style={styles.todayBadgeText}>TODAY</Text></View>
                  )}
                </View>
                <View style={[styles.badge, { backgroundColor: emi.status === 'paid' ? `${colors.success}20` : emi.status === 'overdue' ? `${colors.error}20` : `${colors.warning}20` }]}>
                  <Text style={[styles.badgeText, { color: emi.status === 'paid' ? colors.success : emi.status === 'overdue' ? colors.error : colors.warning }]}>{emi.status.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.emiRow}>
                <Text style={styles.label}>Due:</Text>
                <Text style={styles.value}>{formatDate(emi.dueDate)}</Text>
              </View>
              <View style={styles.emiRow}>
                <Text style={styles.label}>Total:</Text>
                <Text style={[styles.value, emi.penaltyAmount > 0 && styles.red]}>{formatCurrency(emi.totalAmount)}</Text>
              </View>
              {emi.penaltyAmount > 0 && (() => {
                const penaltyPerDay = Math.ceil((emi.principalAmount || 0) / 2);
                const daysOverdue = penaltyPerDay > 0 ? Math.round((emi.penaltyAmount || 0) / penaltyPerDay) : 0;
                return (
                  <View style={styles.emiRow}>
                    <Text style={[styles.label, styles.red]}>Penalty ({penaltyPerDay} × {daysOverdue} days):</Text>
                    <Text style={[styles.value, styles.red]}>{formatCurrency(emi.penaltyAmount)}</Text>
                  </View>
                );
              })()}
              {emi.penaltyAmount > 0 && (
                <View style={styles.emiRow}>
                  <Text style={styles.label}>Base EMI:</Text>
                  <Text style={styles.value}>{formatCurrency(emi.principalAmount + emi.interestAmount)}</Text>
                </View>
              )}
              {emi.status === 'paid' && emi.paidAt && (
                <View style={styles.emiRow}>
                  <Text style={styles.label}>Paid at:</Text>
                  <Text style={[styles.value, styles.green]}>{formatDateTime(emi.paidAt)}</Text>
                </View>
              )}
              {emi.status !== 'paid' && (
                <View style={styles.emiActionRow}>
                  {emi.penaltyAmount > 0 && (
                    <Button
                      title={clearingOverdue === emi._id ? '...' : 'Clear Overdue'}
                      onPress={() => handleClearOverdue(emi)}
                      disabled={!!clearingOverdue || !!markingPaid}
                      variant="outline"
                      size="small"
                      style={styles.clearOverdueBtn}
                    />
                  )}
                  <Button
                    title={markingPaid === emi._id ? '...' : 'Mark as Paid'}
                    onPress={() => handleMarkPaid(emi)}
                    disabled={!!markingPaid}
                    size="small"
                    style={styles.markPaidBtn}
                  />
                </View>
              )}
            </View>
          ))}
          {hasMore && (
            <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore}>
              <Text style={styles.loadMoreText}>Load More ({sortedEmis.length - displayCount} remaining)</Text>
            </TouchableOpacity>
          )}
        </View>

        {isAdmin && (
          <Button title="Delete Loan" onPress={handleDeleteLoan} loading={deleting} variant="outline" style={styles.deleteBtn} />
        )}

        <DocViewModal
          visible={docModal.visible}
          imageUri={docModal.uri}
          title={docModal.title}
          onClose={() => setDocModal({ visible: false, uri: null, title: '' })}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: fontSize.lg, color: colors.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  amount: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.primary },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 100 },
  badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  row: { flexDirection: 'row', marginBottom: spacing.sm },
  label: { width: 90, fontSize: fontSize.sm, color: colors.textSecondary },
  value: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  valueRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  viewDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  viewDocText: { fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.semibold },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  green: { color: colors.success },
  orange: { color: colors.warning },
  red: { color: colors.error },
  section: { marginTop: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, marginBottom: spacing.md },
  emiCard: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: 8, marginBottom: spacing.sm },
  emiCardPenalty: { borderLeftWidth: 4, borderLeftColor: colors.error },
  emiCardToday: { borderTopWidth: 2, borderTopColor: colors.primary },
  emiDayRow: { flexDirection: 'row', alignItems: 'center' },
  todayBadge: { backgroundColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 4 },
  todayBadgeText: { fontSize: 10, color: colors.textOnPrimary, fontWeight: fontWeight.semibold },
  emiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  emiDay: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  emiActionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  clearOverdueBtn: { flex: 1, borderColor: colors.warning },
  markPaidBtn: { flex: 1 },
  deleteBtn: { marginTop: spacing.lg, borderColor: colors.error },
  loadMoreBtn: {
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.accentLight,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  loadMoreText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.medium },
});

export default AdminLoanDetailScreen;
