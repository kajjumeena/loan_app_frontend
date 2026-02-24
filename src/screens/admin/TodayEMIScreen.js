import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const TABS = [
  { id: 'collections', label: 'Collections' },
  { id: 'today', label: "Today's EMIs" },
  { id: 'overdue', label: 'Overdue' },
];

const TodayEMIScreen = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState(route.params?.initialTab || 'collections');

  // Update activeTab if route params change
  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);

  const [emis, setEmis] = useState([]);
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // UI States
  const [markingPaid, setMarkingPaid] = useState(null);
  const [clearingOverdue, setClearingOverdue] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [tempDate, setTempDate] = useState('');
  const [pickingDateFor, setPickingDateFor] = useState(''); // 'start' or 'end'

  const fetchUsers = async () => {
    try {
      const res = await adminAPI.getUsers();
      setUsers(res.data);
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  const fetchData = async (pageNum = 1, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else if (pageNum === 1) setLoading(true);

    try {
      let statusParams = [];
      if (activeTab === 'collections') statusParams = ['paid'];
      else if (activeTab === 'today') statusParams = ['pending', 'overdue', 'paid']; // Show all for today
      else if (activeTab === 'overdue') statusParams = ['overdue'];

      const params = {
        status: statusParams,
        userIds: selectedUserIds.join(','),
        page: pageNum,
        limit: 20
      };

      if (activeTab === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        params.startDate = today.toISOString();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        params.endDate = tomorrow.toISOString();
      } else {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      const res = await adminAPI.getEMIs(params);

      if (isLoadMore) {
        setEmis(prev => [...prev, ...res.data.emis]);
      } else {
        setEmis(res.data.emis);
      }

      setSummary(res.data.summary);
      setHasMore(res.data.pagination.page < res.data.pagination.pages);
      setPage(res.data.pagination.page);

    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load EMIs');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setPage(1);
      fetchData(1);
      fetchUsers();
    }, [activeTab, startDate, endDate, selectedUserIds])
  );

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchData(1);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchData(page + 1, true);
    }
  };

  const handleMarkPaid = (emiId) => {
    Alert.alert(
      'Mark as Paid',
      'Are you sure you want to manually mark this EMI as paid?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setMarkingPaid(emiId);
            try {
              await adminAPI.markEMIPaid(emiId);
              Alert.alert('Success', 'EMI marked as paid');
              fetchData(1);
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || 'Failed to update');
            } finally {
              setMarkingPaid(null);
            }
          }
        }
      ]
    );
  };

  const handleClearOverdue = async (item) => {
    Alert.alert(
      'Clear Overdue',
      `Remove ₹${(item.penaltyAmount || 0).toLocaleString('en-IN')} overdue charges? Payable will be base EMI only.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            setClearingOverdue(item._id);
            try {
              await adminAPI.clearOverdue(item._id);
              // Optimistically update local state immediately
              setEmis(prevEmis => prevEmis.map(e => 
                e._id === item._id 
                  ? { ...e, penaltyAmount: 0, totalAmount: (e.principalAmount || 0) + (e.interestAmount || 0) }
                  : e
              ));
              Alert.alert('Success', 'Overdue charges cleared');
              // Refresh to ensure consistency
              fetchData(1);
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || 'Failed to clear overdue');
            } finally {
              setClearingOverdue(null);
            }
          }
        }
      ]
    );
  };

  const toggleUserSelection = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const openDatePicker = (type) => {
    setPickingDateFor(type);
    setTempDate(type === 'start' ? startDate : endDate);
    setShowDatePickerModal(true);
  };

  const saveDate = () => {
    if (pickingDateFor === 'start') setStartDate(tempDate);
    else setEndDate(tempDate);
    setShowDatePickerModal(false);
  };

  const formatCurrency = (amount) => `₹${amount?.toLocaleString('en-IN') || 0}`;

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const renderEMIItem = ({ item }) => (
    <Card style={[styles.emiCard, item.penaltyAmount > 0 && styles.emiCardPenalty]}>
      <View style={styles.emiHeader}>
        <View style={styles.userSection}>
          <Text style={styles.userName}>{item.userId?.name || 'Unknown'}</Text>
          <Text style={styles.userMobile}>{item.userId?.mobile || 'No Mobile'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'paid' ? colors.successLight : (item.status === 'overdue' ? colors.errorLight : colors.warningLight) }]}>
          <Text style={[styles.statusText, { color: item.status === 'paid' ? colors.success : (item.status === 'overdue' ? colors.error : colors.warning) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.emiInfo}>
        <View style={styles.emiRow}>
          <Text style={styles.emiLabel}>Amount:</Text>
          <Text style={[styles.emiValue, item.penaltyAmount > 0 && styles.penaltyValue]}>{formatCurrency(item.totalAmount)}</Text>
        </View>
        {item.penaltyAmount > 0 && (
          <>
            <View style={styles.emiRow}>
              <Text style={styles.emiLabel}>Base EMI:</Text>
              <Text style={styles.emiValue}>{formatCurrency((item.principalAmount || 0) + (item.interestAmount || 0))}</Text>
            </View>
            {(() => {
              const penaltyPerDay = Math.ceil((item.principalAmount || 0) / 2);
              const daysOverdue = penaltyPerDay > 0 ? Math.round((item.penaltyAmount || 0) / penaltyPerDay) : 0;
              return (
                <View style={styles.emiRow}>
                  <Text style={[styles.emiLabel, styles.penaltyText]}>Penalty ({penaltyPerDay} × {daysOverdue} days):</Text>
                  <Text style={[styles.emiValue, styles.penaltyText]}>{formatCurrency(item.penaltyAmount)}</Text>
                </View>
              );
            })()}
          </>
        )}
        <View style={styles.emiRow}>
          <Text style={styles.emiLabel}>Due Date:</Text>
          <Text style={styles.emiValue}>{formatDate(item.dueDate)}</Text>
        </View>
        {item.status === 'paid' && item.paidAt && (
          <View style={styles.emiRow}>
            <Text style={styles.emiLabel}>Paid At:</Text>
            <Text style={styles.emiValue}>{formatDate(item.paidAt)}</Text>
          </View>
        )}
      </View>

      {item.status !== 'paid' && (
        <View style={styles.emiActionRow}>
          {item.penaltyAmount > 0 && (
            <TouchableOpacity
              style={[
                styles.clearOverdueBtn,
                (clearingOverdue === item._id || markingPaid) && styles.clearOverdueBtnDisabled
              ]}
              onPress={() => handleClearOverdue(item)}
              disabled={!!clearingOverdue || !!markingPaid}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="remove-circle-outline" 
                size={18} 
                color={clearingOverdue === item._id ? colors.textLight : colors.warning} 
                style={styles.clearOverdueIcon}
              />
              <Text style={styles.clearOverdueBtnText}>
                {clearingOverdue === item._id ? 'Clearing...' : 'Clear Overdue'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.payBtn,
              (markingPaid === item._id || clearingOverdue) && styles.payBtnDisabled
            ]}
            onPress={() => handleMarkPaid(item._id)}
            disabled={!!clearingOverdue || !!markingPaid}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.white} style={styles.payBtnIcon} />
            <Text style={styles.payBtnText}>
              {markingPaid === item._id ? 'Processing...' : 'Receive Payment'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Summary Header - Only Collected */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>EMI Management</Text>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterToggle}>
            <Ionicons name="filter" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.collectedCard}>
          <Text style={styles.collectedLabel}>{activeTab === 'collections' ? 'Total Collected' : 'Filtered Collection'}</Text>
          <Text style={styles.collectedValue}>{formatCurrency(summary?.collectedAmount)}</Text>
          <Text style={styles.countLabel}>{summary?.paid || 0} Successful Transactions</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filters Overlay */}
      {showFilters && (
        <View style={styles.filtersOverlay}>
          <Card style={styles.filtersContainer}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filter Options</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>Date Range</Text>
            <View style={styles.filterRow}>
              <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('start')}>
                <Text style={styles.dateInputLabel}>From</Text>
                <Text style={styles.dateInputValue}>{startDate || 'Any Time'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('end')}>
                <Text style={styles.dateInputLabel}>To</Text>
                <Text style={styles.dateInputValue}>{endDate || 'Any Time'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>User Selection</Text>
            <TouchableOpacity
              style={[
                styles.userPicker,
                showUserDropdown && styles.userPickerActive
              ]}
              onPress={() => setShowUserDropdown(!showUserDropdown)}
              activeOpacity={0.7}
            >
              <View style={styles.userPickerContent}>
                <Ionicons name="people-outline" size={18} color={colors.primary} />
                <Text style={styles.userPickerValue}>
                  {selectedUserIds.length === 0 ? 'All Customers' : `${selectedUserIds.length} Customer${selectedUserIds.length > 1 ? 's' : ''} Selected`}
                </Text>
              </View>
              <Ionicons 
                name={showUserDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.primary} 
              />
            </TouchableOpacity>

            {showUserDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView 
                  nestedScrollEnabled 
                  style={{ maxHeight: 200 }}
                  showsVerticalScrollIndicator={true}
                >
                  {users.length === 0 ? (
                    <View style={styles.dropdownEmpty}>
                      <Text style={styles.dropdownEmptyText}>No users available</Text>
                    </View>
                  ) : (
                    users.map(u => {
                      const isSelected = selectedUserIds.includes(u._id);
                      return (
                        <TouchableOpacity
                          key={u._id}
                          style={[
                            styles.dropdownItem,
                            isSelected && styles.dropdownItemSelected
                          ]}
                          onPress={() => toggleUserSelection(u._id)}
                          activeOpacity={0.7}
                        >
                          <View style={[
                            styles.checkboxContainer,
                            isSelected && styles.checkboxContainerSelected
                          ]}>
                            {isSelected && (
                              <Ionicons name="checkmark" size={14} color={colors.white} />
                            )}
                          </View>
                          <View style={styles.dropdownItemContent}>
                            <Text style={[
                              styles.dropdownText,
                              isSelected && styles.dropdownTextSelected
                            ]}>{u.name}</Text>
                            {u.mobile && (
                              <Text style={styles.dropdownSubtext}>{u.mobile}</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}

            <View style={styles.filterActions}>
              <Button
                title="Reset"
                variant="outline"
                size="small"
                onPress={() => {
                  setStartDate('');
                  setEndDate('');
                  setSelectedUserIds([]);
                }}
                style={{ flex: 1 }}
              />
              <Button
                title="Apply Filters"
                size="small"
                onPress={() => setShowFilters(false)}
                style={{ flex: 2 }}
              />
            </View>
          </Card>
        </View>
      )}

      {/* Custom Calendar Date Picker Modal */}
      <Modal 
        visible={showDatePickerModal} 
        transparent 
        animationType="slide"
        onRequestClose={() => setShowDatePickerModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalBg} 
          activeOpacity={1}
          onPress={() => setShowDatePickerModal(false)}
        >
          <TouchableOpacity 
            style={styles.calendarCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>
                {pickingDateFor === 'start' ? 'Start Date' : 'End Date'}
              </Text>
              <TouchableOpacity onPress={() => setShowDatePickerModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Month/Year Selector */}
            <View style={styles.monthSelector}>
              <TouchableOpacity
                onPress={() => {
                  const d = new Date(tempDate || new Date());
                  d.setMonth(d.getMonth() - 1);
                  setTempDate(d.toISOString().split('T')[0]);
                }}
              >
                <Ionicons name="chevron-back" size={24} color={colors.primary} />
              </TouchableOpacity>

              <Text style={styles.currentMonth}>
                {new Date(tempDate || new Date()).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  const d = new Date(tempDate || new Date());
                  d.setMonth(d.getMonth() + 1);
                  setTempDate(d.toISOString().split('T')[0]);
                }}
              >
                <Ionicons name="chevron-forward" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Day Headers */}
            <View style={styles.daysHeader}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <Text key={day} style={styles.dayHeadText}>{day}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {(() => {
                const date = new Date(tempDate || new Date());
                const year = date.getFullYear();
                const month = date.getMonth();
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const days = [];

                // Empty slots for previous month
                for (let i = 0; i < firstDay; i++) {
                  days.push(<View key={`empty-${i}`} style={styles.emptyDaySlot} />);
                }

                // Days of current month
                for (let i = 1; i <= daysInMonth; i++) {
                  const currentDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                  const isSelected = tempDate === currentDayStr;
                  const isToday = new Date().toISOString().split('T')[0] === currentDayStr;

                  days.push(
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.daySlot,
                        isSelected && styles.selectedDaySlot,
                        isToday && !isSelected && styles.todaySlot
                      ]}
                      onPress={() => setTempDate(currentDayStr)}
                    >
                      <Text style={[
                        styles.dayText,
                        isSelected && styles.selectedDayText,
                        isToday && !isSelected && styles.todayText
                      ]}>{i}</Text>
                    </TouchableOpacity>
                  );
                }

                return days;
              })()}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimaryFull]}
                onPress={saveDate}
              >
                <Text style={styles.modalBtnTextPrimary}>Confirm Date</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={emis}
          renderItem={renderEMIItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListFooterComponent={() => (
            hasMore ? (
              <View style={styles.footerLoader}>
                <Button
                  title={loadingMore ? "Loading..." : "Load More (20)"}
                  onPress={handleLoadMore}
                  loading={loadingMore}
                  variant="outline"
                />
              </View>
            ) : null
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color={colors.border} />
              <Text style={styles.emptyText}>No matching EMIs records</Text>
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
    backgroundColor: colors.white,
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  filterToggle: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  collectedCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  collectedLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  collectedValue: {
    color: colors.white,
    fontSize: 32,
    fontWeight: fontWeight.bold,
  },
  countLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: fontSize.xs,
    marginTop: spacing.sm,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  filtersOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    padding: spacing.md,
    justifyContent: 'center',
  },
  filtersContainer: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  filterTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInput: {
    flex: 0.48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
  },
  dateInputLabel: {
    fontSize: 10,
    color: colors.textLight,
    marginBottom: 2,
  },
  dateInputValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  userPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    backgroundColor: colors.white,
    minHeight: 48,
  },
  userPickerActive: {
    borderColor: colors.primary,
    backgroundColor: colors.accentLight,
  },
  userPickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  userPickerValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  dropdownList: {
    marginTop: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  dropdownItemSelected: {
    backgroundColor: colors.accentLight,
  },
  dropdownItemContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  checkboxContainer: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxContainerSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dropdownText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  dropdownTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  dropdownSubtext: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dropdownEmpty: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  filterActions: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emiCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  emiCardPenalty: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  penaltyValue: { color: colors.error },
  penaltyText: { color: colors.error },
  emiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  userName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  userMobile: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  emiInfo: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  emiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  emiLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  emiValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  emiActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  payBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  payBtnDisabled: {
    opacity: 0.6,
  },
  payBtnIcon: {
    marginRight: 2,
  },
  payBtnText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
  },
  clearOverdueBtn: {
    flex: 1,
    backgroundColor: colors.warningLight,
    borderWidth: 1.5,
    borderColor: colors.warning,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  clearOverdueBtnDisabled: {
    opacity: 0.6,
    backgroundColor: colors.backgroundSecondary,
  },
  clearOverdueIcon: {
    marginRight: 2,
  },
  clearOverdueBtnText: {
    color: colors.warning,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
    opacity: 0.5,
  },
  emptyText: {
    color: colors.textLight,
    marginTop: spacing.md,
    fontSize: fontSize.md,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  calendarCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 400,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  calendarTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  currentMonth: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  dayHeadText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.textLight,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  daySlot: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.accentLight,
    margin: 2,
  },
  emptyDaySlot: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    margin: 2,
  },
  selectedDaySlot: {
    backgroundColor: colors.primary,
  },
  todaySlot: {
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: fontSize.sm,
    color: colors.primaryDark,
    fontWeight: fontWeight.semibold,
  },
  selectedDayText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  todayText: {
    color: colors.primaryDark,
    fontWeight: fontWeight.bold,
  },
  modalBtnPrimaryFull: {
    backgroundColor: colors.primary,
    width: '100%',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  modalActions: {
    marginTop: spacing.md,
  },
  modalBtnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  modalBtnTextPrimary: {
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  footerLoader: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
});

export default TodayEMIScreen;
