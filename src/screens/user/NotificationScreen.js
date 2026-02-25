import React, { useState, useCallback, useRef } from 'react';
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
import { notificationAPI } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const FILTERS = [
  { key: null, label: 'All', icon: 'notifications-outline' },
  { key: 'requests', label: 'Requests', icon: 'send-outline' },
  { key: 'payments', label: 'Payments', icon: 'checkmark-circle-outline' },
  { key: 'loans', label: 'Loans', icon: 'document-text-outline' },
];

const getNotifIcon = (type) => {
  switch (type) {
    case 'emi_paid': return { name: 'checkmark-circle', color: colors.success, bg: colors.successLight };
    case 'emi_payment_request': return { name: 'send', color: colors.primary, bg: colors.accentLight };
    case 'loan_approved': return { name: 'thumbs-up', color: colors.success, bg: colors.successLight };
    case 'loan_rejected': return { name: 'close-circle', color: colors.error, bg: colors.errorLight };
    case 'emi_overdue': return { name: 'warning', color: colors.error, bg: colors.errorLight };
    case 'emi_pending_today': return { name: 'time', color: colors.warning, bg: colors.warningLight };
    default: return { name: 'notifications', color: colors.primary, bg: colors.accentLight };
  }
};

const NotificationScreen = ({ navigation }) => {
  const { refreshUnreadCount } = useNotifications();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const isFetching = useRef(false);

  const fetchNotifications = async (pageNum = 1, append = false) => {
    if (isFetching.current) return;
    isFetching.current = true;
    if (append) setLoadingMore(true);

    try {
      const res = await notificationAPI.getMy(filter, pageNum);
      const { data, hasMore: more } = res.data;
      if (append) {
        setList(prev => [...prev, ...data]);
      } else {
        setList(data || []);
      }
      setPage(pageNum);
      setHasMore(more);
    } catch (e) {
      if (!append) setList([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetching.current = false;
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    setPage(1);
    fetchNotifications(1);
    refreshUnreadCount();
  }, [filter]));

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !isFetching.current) {
      fetchNotifications(page + 1, true);
    }
  };

  const onRefresh = () => {
    setLoading(true);
    setPage(1);
    fetchNotifications(1);
    refreshUnreadCount();
  };

  const onNotificationPress = async (item) => {
    if (!item.read) {
      try {
        await notificationAPI.markRead(item._id);
        setList(prev => prev.map(n => n._id === item._id ? { ...n, read: true } : n));
        refreshUnreadCount();
      } catch (e) {}
    }

    const lid = item.loanId?._id || item.loanId;
    if (lid) {
      navigation.navigate('LoanDetails', { loanId: lid });
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const renderItem = ({ item }) => {
    const icon = getNotifIcon(item.type);
    const isUnread = !item.read;

    return (
      <TouchableOpacity
        onPress={() => onNotificationPress(item)}
        activeOpacity={0.7}
        style={[styles.notifCard, isUnread ? styles.notifCardUnread : styles.notifCardRead]}
      >
        <View style={[styles.notifIconCircle, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <Text style={[styles.notifTitle, isUnread && styles.notifTitleUnread]} numberOfLines={1}>
              {item.title || item.type}
            </Text>
            <Text style={styles.notifTime}>{formatTime(item.createdAt)}</Text>
          </View>
          <Text style={[styles.notifBody, isUnread && styles.notifBodyUnread]} numberOfLines={2}>{item.body}</Text>
        </View>
        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key || 'all'}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Ionicons
              name={f.icon}
              size={14}
              color={filter === f.key ? '#FFFFFF' : colors.textSecondary}
            />
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(i) => i._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.borderLight} />
              <Text style={styles.emptyText}>No notifications</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundSecondary,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  notifCardUnread: {
    backgroundColor: '#EDE5FF',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  notifCardRead: {
    backgroundColor: '#F4F4F5',
  },
  notifIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  notifTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  notifTitleUnread: {
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  notifTime: {
    fontSize: fontSize.xs,
    color: colors.textLight,
  },
  notifBody: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    lineHeight: 18,
  },
  notifBodyUnread: {
    color: colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginLeft: spacing.xs,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
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

export default NotificationScreen;
