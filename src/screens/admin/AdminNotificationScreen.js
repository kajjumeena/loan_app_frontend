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
import { useFocusEffect } from '@react-navigation/native';
import { notificationAPI } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import Card from '../../components/Card';
import { colors, spacing, fontSize } from '../../styles/theme';

const AdminNotificationScreen = ({ navigation }) => {
  const { unreadCount, refreshUnreadCount } = useNotifications();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(null);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAdmin(filter);
      setList(res.data || []);
    } catch (e) {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchNotifications();
    refreshUnreadCount();
  }, [filter, unreadCount])); // Refresh when unreadCount changes (socket update)

  const onNotificationPress = async (item) => {
    // Mark read locally first for instant feedback
    if (!item.read) {
      try {
        await notificationAPI.markRead(item._id);
        setList(prev => prev.map(n => n._id === item._id ? { ...n, read: true } : n));
        refreshUnreadCount();
      } catch (e) {
        console.error('Error marking read:', e);
      }
    }

    const lid = item.loanId?._id || item.loanId;
    if (!lid) return;
    if (item.type === 'loan_request') {
      navigation.navigate('LoanReview', { loanId: lid });
    } else {
      navigation.navigate('AdminLoanDetail', { loanId: lid });
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => onNotificationPress(item)} activeOpacity={0.7}>
      <Card style={[styles.item, item.read && styles.readItem]}>
        {!item.read && <View style={styles.unreadDot} />}
        <View style={styles.content}>
          <Text style={[styles.title, item.read && styles.readText]}>{item.title || item.type}</Text>
          <Text style={[styles.body, item.read && styles.readText]} numberOfLines={2}>{item.body}</Text>
          {item.userId?.name && <Text style={styles.user}>User: {item.userId.name}</Text>}
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleString('en-IN')}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterBtn, filter === null && styles.filterActive]} onPress={() => setFilter(null)}>
          <Text style={[styles.filterText, filter === null && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, filter === 'paid' && styles.filterActive]} onPress={() => setFilter('paid')}>
          <Text style={[styles.filterText, filter === 'paid' && styles.filterTextActive]}>Paid</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, filter === 'pending' && styles.filterActive]} onPress={() => setFilter('pending')}>
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>Pending</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(i) => i._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.empty}>No notifications</Text></View>}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchNotifications} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterRow: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm },
  filterBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: colors.textOnPrimary },
  list: { padding: spacing.md },
  item: { marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md },
  readItem: { backgroundColor: colors.backgroundSecondary, opacity: 0.8 }, // Light background for read items
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error, marginTop: 6, marginRight: spacing.sm },
  content: { flex: 1 },
  title: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: 2 },
  body: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 4 },
  readText: { color: colors.textLight },
  user: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '500', marginBottom: 2 },
  date: { fontSize: fontSize.xs, color: colors.textLight },
  emptyContainer: { padding: spacing.xl, alignItems: 'center' },
  empty: { color: colors.textSecondary, fontSize: fontSize.md },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: spacing.md, color: colors.textSecondary, fontSize: fontSize.sm },
});

export default AdminNotificationScreen;
