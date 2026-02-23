import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { notificationAPI } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import Card from '../../components/Card';
import { colors, spacing, fontSize } from '../../styles/theme';

const NotificationScreen = ({ navigation }) => {
  const { refreshUnreadCount } = useNotifications();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(null); // 'paid' | 'pending' | null

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getMy(filter);
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
  }, [filter, refreshUnreadCount]));

  const onNotificationPress = (item) => {
    const lid = item.loanId?._id || item.loanId;
    if (lid) {
      navigation.navigate('LoanDetails', { loanId: lid });
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => onNotificationPress(item)} activeOpacity={0.7}>
      <Card style={[styles.item, !item.read && styles.unread]}>
        <Text style={styles.title}>{item.title || item.type}</Text>
        <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleString('en-IN')}</Text>
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
      <FlatList
        data={list}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Card><Text style={styles.empty}>No notifications</Text></Card>}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchNotifications} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterRow: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm },
  filterBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8, backgroundColor: colors.surface },
  filterActive: { backgroundColor: colors.primary },
  filterText: { fontSize: fontSize.sm, color: colors.text },
  filterTextActive: { color: colors.textOnPrimary },
  list: { padding: spacing.md },
  item: { marginBottom: spacing.sm },
  unread: { borderLeftWidth: 4, borderLeftColor: colors.primary },
  title: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  body: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4 },
  date: { fontSize: fontSize.xs, color: colors.textLight, marginTop: 4 },
  empty: { textAlign: 'center', color: colors.textSecondary },
});

export default NotificationScreen;
