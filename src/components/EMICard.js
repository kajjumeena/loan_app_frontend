import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../styles/theme';

// Penalty per day = 50% of principalAmount
const getPenaltyBreakdown = (emi) => {
  if (!emi.penaltyAmount || emi.penaltyAmount <= 0) return null;
  const penaltyPerDay = Math.ceil((emi.principalAmount || 0) / 2);
  const daysOverdue = penaltyPerDay > 0 ? Math.round(emi.penaltyAmount / penaltyPerDay) : 0;
  const baseAmount = (emi.principalAmount || 0) + (emi.interestAmount || 0);
  return { penaltyPerDay, daysOverdue, baseAmount };
};

const EMICard = ({ emi, onPay, showLoanInfo = false, showPaidAt = false }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString('en-IN') || 0}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return colors.success;
      case 'overdue':
        return colors.error;
      default:
        return colors.warning;
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'paid':
        return colors.successLight;
      case 'overdue':
        return colors.errorLight;
      default:
        return colors.warningLight;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.dayText}>Day {emi.dayNumber}</Text>
          <Text style={styles.dateText}>{formatDate(emi.dueDate)}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusBgColor(emi.status) },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(emi.status) }]}>
            {emi.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {showLoanInfo && emi.loanId && (
        <View style={styles.loanInfo}>
          <Text style={styles.loanInfoText}>
            Loan: {formatCurrency(emi.loanId.amount)}
          </Text>
        </View>
      )}

      <View style={styles.amountContainer}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Principal:</Text>
          <Text style={styles.amountValue}>{formatCurrency(emi.principalAmount)}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Interest:</Text>
          <Text style={styles.amountValue}>{formatCurrency(emi.interestAmount)}</Text>
        </View>
        {emi.penaltyAmount > 0 && (() => {
          const bd = getPenaltyBreakdown(emi);
          return bd && (
            <View style={styles.amountRow}>
              <Text style={[styles.amountLabel, styles.penaltyLabel]}>Penalty ({bd.penaltyPerDay} × {bd.daysOverdue} days):</Text>
              <Text style={[styles.amountValue, styles.penaltyValue]}>
                {formatCurrency(emi.penaltyAmount)}
              </Text>
            </View>
          );
        })()}
        <View style={[styles.amountRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{formatCurrency(emi.totalAmount)}</Text>
        </View>
      </View>

      {emi.status !== 'paid' && onPay && (
        <TouchableOpacity style={styles.payButton} onPress={() => onPay(emi)}>
          <Text style={styles.payButtonText}>Pay Now</Text>
        </TouchableOpacity>
      )}

      {emi.status === 'paid' && emi.paidAt && (
        <Text style={styles.paidText}>Paid on {showPaidAt ? formatDateTime(emi.paidAt) : formatDate(emi.paidAt)}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  dayText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  dateText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  loanInfo: {
    backgroundColor: colors.accentLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  loanInfoText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  amountContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  amountLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  amountValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  penaltyLabel: {
    color: colors.error,
  },
  penaltyValue: {
    color: colors.error,
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  totalValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  payButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  payButtonText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  paidText: {
    fontSize: fontSize.sm,
    color: colors.success,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default EMICard;
