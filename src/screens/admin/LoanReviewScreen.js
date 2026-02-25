import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI, loanAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import DocViewModal from '../../components/DocViewModal';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const LoanReviewScreen = ({ route, navigation }) => {
  const { isAdmin, isManager } = useAuth();
  const params = route.params || {};
  const rawLoanId = params.loanId;
  const loanId = rawLoanId?._id || rawLoanId;
  const initialLoan = params.loan;
  const [loan, setLoan] = useState(initialLoan);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [editAmount, setEditAmount] = useState('');
  const [editDays, setEditDays] = useState('100');
  const [docModal, setDocModal] = useState({ visible: false, uri: null, title: '' });

  useEffect(() => {
    // Always fetch full loan details to get doc images (aadhaarImage, panImage are on User model)
    const id = loanId || initialLoan?._id;
    if (id) {
      loanAPI.getLoanDetails(id)
        .then((res) => setLoan(res.data.loan))
        .catch(() => {
          // If fetch fails, use initial loan if available
          if (initialLoan) setLoan(initialLoan);
        })
        .finally(() => setFetching(false));
    } else if (initialLoan) {
      setLoan(initialLoan);
      setFetching(false);
    } else {
      setFetching(false);
    }
  }, [loanId]);

  useEffect(() => {
    if (loan) {
      setEditAmount(loan.amount?.toString() || '');
      setEditDays(loan.totalDays?.toString() || '100');
    }
  }, [loan?._id]);

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString('en-IN') || 0}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const amt = parseInt(editAmount) || loan?.amount || 0;
  const days = parseInt(editDays) || 100;
  const totalInterest = amt * 0.20;
  const dailyPrincipal = Math.ceil(amt / days);
  const dailyInterest = Math.ceil(totalInterest / days);
  const dailyEMI = dailyPrincipal + dailyInterest;
  const totalPayable = amt + totalInterest;

  const handleApprove = () => {
    if (!editAmount || isNaN(parseInt(editAmount)) || parseInt(editAmount) < 1000 || parseInt(editAmount) > 100000) {
      Alert.alert('Invalid Amount', 'Amount must be between ₹1,000 and ₹1,00,000');
      return;
    }
    if (!editDays || isNaN(parseInt(editDays)) || parseInt(editDays) < 1 || parseInt(editDays) > 365) {
      Alert.alert('Invalid Days', 'Total days must be between 1 and 365');
      return;
    }
    Alert.alert(
      'Approve Loan',
      `Approve loan of ${formatCurrency(amt)} for ${days} days?\n\nDaily EMI: ${formatCurrency(dailyEMI)}\nTotal Payable: ${formatCurrency(totalPayable)}\n\nEMIs will start from tomorrow.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setApproving(true);
            try {
              await adminAPI.approveLoan(loan._id, { amount: amt, totalDays: days });
              Alert.alert('Success', 'Loan has been approved successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to approve loan');
            } finally {
              setApproving(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      'Reject Loan',
      'Are you sure you want to reject this loan application?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setRejecting(true);
            try {
              await adminAPI.rejectLoan(loan._id, 'Application rejected by admin');
              Alert.alert('Rejected', 'Loan application has been rejected.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to reject loan');
            } finally {
              setRejecting(false);
            }
          },
        },
      ]
    );
  };

  if (fetching || !loan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.noteText, { marginTop: spacing.md }]}>Loading loan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Loan Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Loan Amount Requested</Text>
          <Text style={styles.amountValue}>{formatCurrency(loan.amount)}</Text>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>PENDING REVIEW</Text>
          </View>
        </View>

        {/* Applicant Details */}
        <Card title="Applicant Details">
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue}>{loan.applicantName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mobile:</Text>
            <Text style={styles.detailValue}>{loan.applicantMobile}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Address:</Text>
            <Text style={styles.detailValue}>{loan.applicantAddress}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Aadhaar:</Text>
            <View style={styles.detailValueRow}>
              <Text style={styles.detailValue}>{loan.applicantAadhaar}</Text>
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
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>PAN:</Text>
            <View style={styles.detailValueRow}>
              <Text style={styles.detailValue}>{loan.applicantPan}</Text>
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
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Applied On:</Text>
            <Text style={styles.detailValue}>{formatDate(loan.createdAt)}</Text>
          </View>
        </Card>

        {/* EMI Calculation */}
        <Card title={isAdmin ? "EMI Calculation (Admin can edit)" : "EMI Calculation"}>
          {isAdmin ? (
            <>
              <Input
                label="Loan Amount (₹1,000 - ₹1,00,000)"
                value={editAmount}
                onChangeText={setEditAmount}
                placeholder="e.g. 50000"
                keyboardType="number-pad"
              />
              <Input
                label="Total Days (1 - 365)"
                value={editDays}
                onChangeText={setEditDays}
                placeholder="e.g. 90"
                keyboardType="number-pad"
              />
            </>
          ) : (
            <>
              <View style={styles.emiRow}>
                <Text style={styles.emiLabel}>Loan Amount:</Text>
                <Text style={styles.emiValue}>{formatCurrency(amt)}</Text>
              </View>
              <View style={styles.emiRow}>
                <Text style={styles.emiLabel}>Total Days:</Text>
                <Text style={styles.emiValue}>{days}</Text>
              </View>
            </>
          )}
          <View style={styles.divider} />
          <View style={styles.emiRow}>
            <Text style={styles.emiLabel}>Daily Principal:</Text>
            <Text style={styles.emiValue}>{formatCurrency(dailyPrincipal)}</Text>
          </View>
          <View style={styles.emiRow}>
            <Text style={styles.emiLabel}>Daily Interest (5%):</Text>
            <Text style={styles.emiValue}>{formatCurrency(dailyInterest)}</Text>
          </View>
          <View style={styles.emiRow}>
            <Text style={styles.emiTotalLabel}>Daily EMI:</Text>
            <Text style={styles.emiTotalValue}>{formatCurrency(dailyEMI)}</Text>
          </View>
          <View style={styles.emiRow}>
            <Text style={styles.emiTotalLabel}>Total Payable:</Text>
            <Text style={styles.emiTotalValue}>{formatCurrency(totalPayable)}</Text>
          </View>
        </Card>

        {/* Action Buttons - Admin only */}
        {isAdmin ? (
          <View style={styles.actionButtons}>
            <Button
              title="Approve Loan"
              onPress={handleApprove}
              loading={approving}
              disabled={rejecting}
              size="large"
              style={styles.approveButton}
            />
            <Button
              title="Reject Application"
              onPress={handleReject}
              loading={rejecting}
              disabled={approving}
              variant="danger"
              size="large"
              style={styles.rejectButton}
            />
          </View>
        ) : (
          <View style={styles.managerNote}>
            <Ionicons name="information-circle" size={18} color={colors.primary} />
            <Text style={styles.managerNoteText}>Only admins can approve or reject loans.</Text>
          </View>
        )}

        {isAdmin && (
          <Text style={styles.noteText}>
            Note: EMIs will start from the next day. You can edit amount and duration above.
            The borrower will be notified of the approval.
          </Text>
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
  amountCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  amountLabel: {
    fontSize: fontSize.sm,
    color: colors.textOnPrimary,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  amountValue: {
    fontSize: 40,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
    marginBottom: spacing.md,
  },
  pendingBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  pendingText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
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
  detailValueRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  viewDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  viewDocText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  emiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  emiLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  emiValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  emiTotalLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  emiTotalValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  actionButtons: {
    marginTop: spacing.lg,
  },
  approveButton: {
    marginBottom: spacing.md,
    backgroundColor: colors.success,
  },
  rejectButton: {
    marginBottom: spacing.md,
  },
  noteText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  managerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  managerNoteText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.primaryDark,
  },
});

export default LoanReviewScreen;
