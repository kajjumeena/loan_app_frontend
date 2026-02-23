import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../styles/theme';

const LoanCard = ({ loan, onPress }) => {
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

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'approved':
        return colors.successLight;
      case 'pending':
        return colors.warningLight;
      case 'rejected':
        return colors.errorLight;
      case 'completed':
        return colors.accentLight;
      default:
        return colors.backgroundSecondary;
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress && onPress(loan)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.amount}>{formatCurrency(loan.amount)}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusBgColor(loan.status) },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(loan.status) }]}>
            {loan.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Applied On:</Text>
          <Text style={styles.detailValue}>{formatDate(loan.createdAt)}</Text>
        </View>

        {loan.status === 'approved' && (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Daily EMI:</Text>
              <Text style={styles.detailValue}>{formatCurrency(loan.dailyEMI)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>{loan.totalDays} Days</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Start Date:</Text>
              <Text style={styles.detailValue}>{formatDate(loan.startDate)}</Text>
            </View>
          </>
        )}

        {(loan.status === 'approved' || loan.status === 'completed') && (
          <View style={styles.progressContainer}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Paid:</Text>
              <Text style={styles.progressValue}>{formatCurrency(loan.totalPaid)}</Text>
            </View>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Remaining:</Text>
              <Text style={styles.remainingValue}>
                {formatCurrency(loan.remainingBalance)}
              </Text>
            </View>
            {loan.penaltyAmount > 0 && (
              <View style={styles.progressRow}>
                <Text style={styles.penaltyLabel}>Penalty:</Text>
                <Text style={styles.penaltyValue}>
                  {formatCurrency(loan.penaltyAmount)}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.viewText}>View Details →</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.accentLight,
  },
  amount: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
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
  details: {
    padding: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  progressContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  progressValue: {
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: fontWeight.semibold,
  },
  remainingValue: {
    fontSize: fontSize.sm,
    color: colors.warning,
    fontWeight: fontWeight.semibold,
  },
  penaltyLabel: {
    fontSize: fontSize.sm,
    color: colors.error,
  },
  penaltyValue: {
    fontSize: fontSize.sm,
    color: colors.error,
    fontWeight: fontWeight.semibold,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    padding: spacing.md,
    alignItems: 'flex-end',
  },
  viewText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
});

export default LoanCard;
