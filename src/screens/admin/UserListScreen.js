import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const TAB_USER = 'user';
const TAB_ADMIN = 'admin';

const UserListScreen = ({ navigation }) => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(TAB_USER);
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await adminAPI.getAdmins();
      setAdmins(response.data);
      setFilteredAdmins(response.data);
    } catch (error) {
      console.error('Error fetching admins:', error);
      Alert.alert('Error', 'Failed to load admins');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([
        adminAPI.getUsers().then((res) => res.data).catch(() => []),
        adminAPI.getAdmins().then((res) => res.data).catch(() => []),
      ]).then(([userList, adminList]) => {
        setUsers(userList);
        setFilteredUsers(userList);
        setAdmins(adminList);
        setFilteredAdmins(adminList);
      }).catch(() => Alert.alert('Error', 'Failed to load data'))
        .finally(() => setLoading(false));
    }, [])
  );

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
      setFilteredAdmins(admins);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredUsers(users.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.mobile?.includes(searchQuery) ||
          u.email?.toLowerCase().includes(q)
      ));
      setFilteredAdmins(admins.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.mobile?.includes(searchQuery) ||
          u.email?.toLowerCase().includes(q)
      ));
    }
  }, [searchQuery, users, admins]);

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([
      adminAPI.getUsers().then((res) => res.data).catch(() => []),
      adminAPI.getAdmins().then((res) => res.data).catch(() => []),
    ]).then(([userList, adminList]) => {
      setUsers(userList);
      setFilteredUsers(userList);
      setAdmins(adminList);
      setFilteredAdmins(adminList);
    }).finally(() => setRefreshing(false));
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleUserPress = (item) => {
    navigation.navigate('UserDetail', { userId: item._id });
  };

  const handleDeleteUser = (item) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete "${item.name || item.email}"?\n\nThis will permanently delete the user along with all their loans, EMIs, and notifications.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminAPI.deleteUser(item._id);
              if (activeTab === TAB_USER) {
                setUsers(prev => prev.filter(u => u._id !== item._id));
                setFilteredUsers(prev => prev.filter(u => u._id !== item._id));
              } else {
                setAdmins(prev => prev.filter(u => u._id !== item._id));
                setFilteredAdmins(prev => prev.filter(u => u._id !== item._id));
              }
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => handleUserPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.avatarText}>
          {item.name ? item.name.charAt(0).toUpperCase() : item.role === 'admin' ? 'A' : item.role === 'manager' ? 'M' : 'U'}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name || 'No Name'}</Text>
        <Text style={styles.userMobile}>{item.email || item.mobile || '-'}</Text>
        <Text style={styles.userDate}>Joined: {formatDate(item.createdAt)}</Text>
        {item.role === 'admin' && (
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Admin</Text>
          </View>
        )}
        {item.role === 'manager' && (
          <View style={[styles.roleBadge, styles.managerBadge]}>
            <Text style={[styles.roleBadgeText, styles.managerBadgeText]}>Manager</Text>
          </View>
        )}
      </View>
      <View style={styles.loanInfo}>
        <View style={styles.loanBadge}>
          <Text style={styles.loanCount}>{item.loanCount ?? 0}</Text>
          <Text style={styles.loanLabel}>Loans</Text>
        </View>
        {(item.activeLoans ?? 0) > 0 && (
          <View style={[styles.loanBadge, styles.activeBadge]}>
            <Text style={styles.activeCount}>{item.activeLoans}</Text>
            <Text style={styles.activeLabel}>Active</Text>
          </View>
        )}
        {isAdmin && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteUser(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error || '#DC2626'} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const listData = activeTab === TAB_USER ? filteredUsers : filteredAdmins;
  const emptyMessage = activeTab === TAB_USER
    ? (searchQuery ? 'No users found matching your search' : 'No users yet')
    : (searchQuery ? 'No admins found matching your search' : 'No admins yet');

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{emptyMessage}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Input
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search by name or email..."
          style={styles.searchInput}
        />
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === TAB_USER && styles.tabActive]}
            onPress={() => setActiveTab(TAB_USER)}
          >
            <Text style={[styles.tabText, activeTab === TAB_USER && styles.tabTextActive]}>User</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === TAB_ADMIN && styles.tabActive]}
            onPress={() => setActiveTab(TAB_ADMIN)}
          >
            <Text style={[styles.tabText, activeTab === TAB_ADMIN && styles.tabTextActive]}>Admin</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {listData.length} {activeTab === TAB_USER
            ? (listData.length === 1 ? 'User' : 'Users')
            : (listData.length === 1 ? 'Admin' : 'Admins')}
        </Text>
      </View>

      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
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
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  searchInput: {
    marginBottom: spacing.sm,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textOnPrimary,
    fontWeight: fontWeight.semibold,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.textOnPrimary,
  },
  managerBadge: {
    backgroundColor: colors.warning,
  },
  managerBadgeText: {
    color: '#FFFFFF',
  },
  statsBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accentLight,
  },
  statsText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  userMobile: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userDate: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  loanInfo: {
    alignItems: 'flex-end',
  },
  loanBadge: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  loanCount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  loanLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  activeBadge: {
    backgroundColor: colors.successLight,
  },
  activeCount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  activeLabel: {
    fontSize: fontSize.xs,
    color: colors.success,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  deleteBtn: {
    marginTop: spacing.xs,
    padding: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default UserListScreen;
