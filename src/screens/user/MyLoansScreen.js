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
import { useFocusEffect } from '@react-navigation/native';
import { loanAPI } from '../../services/api';
import LoanCard from '../../components/LoanCard';
import Card from '../../components/Card';
import { colors, spacing, fontSize } from '../../styles/theme';

const MyLoansScreen = ({ navigation }) => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLoans = async () => {
    try {
      const res = await loanAPI.getMyLoans();
      const list = res.data || [];
      // Pending/approved first, then completed
      const pending = list.filter(l => l.status === 'pending' || l.status === 'approved');
      const completed = list.filter(l => l.status === 'completed' || l.status === 'rejected');
      setLoans([...pending, ...completed]);
    } catch (e) {
      Alert.alert('Error', 'Failed to load loans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLoans();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchLoans();
  };

  const handleLoanPress = (loan) => {
    navigation.navigate('LoanDetails', { loanId: loan._id });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pendingLoans = loans.filter(l => l.status === 'pending' || l.status === 'approved');
  const completedLoans = loans.filter(l => l.status === 'completed' || l.status === 'rejected');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {pendingLoans.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending / Active Loans</Text>
            {pendingLoans.map((loan) => (
              <LoanCard key={loan._id} loan={loan} onPress={handleLoanPress} />
            ))}
          </View>
        )}
        {completedLoans.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed Loans</Text>
            {completedLoans.map((loan) => (
              <LoanCard key={loan._id} loan={loan} onPress={handleLoanPress} />
            ))}
          </View>
        )}
        {loans.length === 0 && (
          <Card>
            <Text style={styles.emptyText}>No loans yet. Apply for your first loan!</Text>
            <TouchableOpacity style={styles.applyBtn} onPress={() => navigation.navigate('ApplyLoan')}>
              <Text style={styles.applyBtnText}>Apply for Loan</Text>
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: fontSize.lg, color: colors.primary },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  applyBtn: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: 8, alignItems: 'center' },
  applyBtnText: { color: colors.textOnPrimary, fontWeight: '600' },
});

export default MyLoansScreen;
