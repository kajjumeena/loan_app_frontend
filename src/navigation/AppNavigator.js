import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { colors, fontSize, fontWeight } from '../styles/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const iconSize = 24;

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import AddMobileScreen from '../screens/auth/AddMobileScreen';
import FindEmailScreen from '../screens/auth/FindEmailScreen';

// User Screens
import HomeScreen from '../screens/user/HomeScreen';
import ApplyLoanScreen from '../screens/user/ApplyLoanScreen';
import LoanDetailsScreen from '../screens/user/LoanDetailsScreen';
import MyLoansScreen from '../screens/user/MyLoansScreen';
import PaymentScreen from '../screens/user/PaymentScreen';
import PaymentSuccessScreen from '../screens/user/PaymentSuccessScreen';
import NotificationScreen from '../screens/user/NotificationScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import EditProfileScreen from '../screens/user/EditProfileScreen';
import EditDocumentScreen from '../screens/user/EditDocumentScreen';
import UPIPaymentScreen from '../screens/user/UPIPaymentScreen';

// Admin Screens
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import UserListScreen from '../screens/admin/UserListScreen';
import UserDetailScreen from '../screens/admin/UserDetailScreen';
import LoanReviewScreen from '../screens/admin/LoanReviewScreen';
import TodayEMIScreen from '../screens/admin/TodayEMIScreen';
import TotalEMIScreen from '../screens/admin/TotalEMIScreen';
import AdminLoanDetailScreen from '../screens/admin/AdminLoanDetailScreen';
import CreateUserScreen from '../screens/admin/CreateUserScreen';
import AdminNotificationScreen from '../screens/admin/AdminNotificationScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import AdminLoansScreen from '../screens/admin/AdminLoansScreen';
import HelpScreen from '../screens/user/HelpScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Icon Component
const TabIcon = ({ icon, iconOutline, name, focused }) => (
  <View style={styles.tabIcon}>
    <Ionicons name={focused ? icon : iconOutline} size={iconSize} color={focused ? colors.primary : colors.textSecondary} />
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{name}</Text>
  </View>
);

// Alerts Tab Icon with unread badge
const AlertsTabIcon = ({ focused }) => {
  const { hasUnread } = useNotifications();
  return (
    <View style={styles.tabIcon}>
      <View style={styles.badgeWrap}>
        <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={iconSize} color={focused ? colors.primary : colors.textSecondary} />
        {hasUnread && <View style={styles.badgeDot} />}
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>Alerts</Text>
    </View>
  );
};

// User Tab Navigator
const UserTabs = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 60 + (insets.bottom > 0 ? insets.bottom : 10),
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8
          }
        ],
        tabBarShowLabel: false,
        tabBarScrollEnabled: true,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="home" iconOutline="home-outline" name="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="LoansTab"
        component={UserLoansStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="wallet" iconOutline="wallet-outline" name="Loans" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={UserNotificationsStack}
        options={{
          tabBarIcon: ({ focused }) => <AlertsTabIcon focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={UserProfileStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="person" iconOutline="person-outline" name="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

// User Profile Stack
const UserProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: colors.textOnPrimary,
      headerTitleStyle: { fontWeight: fontWeight.semibold },
    }}
  >
    <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
    <Stack.Screen name="EditDocument" component={EditDocumentScreen} options={{ title: 'Edit Document Details' }} />
  </Stack.Navigator>
);

// User Notifications Stack
const UserNotificationsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: colors.textOnPrimary,
      headerTitleStyle: { fontWeight: fontWeight.semibold },
    }}
  >
    <Stack.Screen name="Notifications" component={NotificationScreen} options={{ title: 'Notifications' }} />
    <Stack.Screen name="LoanDetails" component={LoanDetailsScreen} options={{ title: 'Loan Details' }} />
  </Stack.Navigator>
);

// User Loans Stack
const UserLoansStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: colors.textOnPrimary,
      headerTitleStyle: { fontWeight: fontWeight.semibold },
    }}
  >
    <Stack.Screen name="MyLoans" component={MyLoansScreen} options={{ title: 'My Loans' }} />
    <Stack.Screen name="LoanDetails" component={LoanDetailsScreen} options={{ title: 'Loan Details' }} />
    <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Pay EMI (Razorpay)' }} />
    <Stack.Screen name="UPIPayment" component={UPIPaymentScreen} options={{ title: 'Pay EMI' }} />
  </Stack.Navigator>
);

// Admin Tab Navigator
const AdminTabs = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 60 + (insets.bottom > 0 ? insets.bottom : 10),
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8
          }
        ],
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="AdminHomeTab"
        component={AdminHomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="grid" iconOutline="grid-outline" name="Dashboard" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="UsersTab"
        component={AdminUsersStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="people" iconOutline="people-outline" name="Users" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="EMIsTab"
        component={AdminEMIsStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="calculator" iconOutline="calculator-outline" name="EMIs" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AdminNotificationsTab"
        component={AdminNotificationsStack}
        options={{
          tabBarIcon: ({ focused }) => <AlertsTabIcon focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

// Admin Users Stack
const AdminUsersStack = () => {
  const { isAdmin } = useAuth();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textOnPrimary,
        headerTitleStyle: { fontWeight: fontWeight.semibold },
      }}
    >
      <Stack.Screen
        name="UserList"
        component={UserListScreen}
        options={({ navigation: nav }) => ({
          title: 'All Users',
          headerRight: isAdmin ? () => (
            <TouchableOpacity
              onPress={() => nav.navigate('CreateUser')}
              style={{ marginRight: 16, padding: 8 }}
            >
              <Ionicons name="add-circle" size={28} color={colors.textOnPrimary} />
            </TouchableOpacity>
          ) : undefined,
        })}
      />
      {isAdmin && <Stack.Screen name="CreateUser" component={CreateUserScreen} options={{ title: 'Create User' }} />}
      <Stack.Screen name="UserDetail" component={UserDetailScreen} options={{ title: 'User Details' }} />
      <Stack.Screen name="LoanReview" component={LoanReviewScreen} options={{ title: 'Review Loan' }} />
      <Stack.Screen name="AdminLoanDetail" component={AdminLoanDetailScreen} options={{ title: 'Loan Details' }} />
    </Stack.Navigator>
  );
};

// Admin Notifications Stack
const AdminNotificationsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: colors.textOnPrimary,
      headerTitleStyle: { fontWeight: fontWeight.semibold },
    }}
  >
    <Stack.Screen name="AdminNotifications" component={AdminNotificationScreen} options={{ title: 'Notifications' }} />
    <Stack.Screen name="LoanReview" component={LoanReviewScreen} options={{ title: 'Review Loan' }} />
    <Stack.Screen name="AdminLoanDetail" component={AdminLoanDetailScreen} options={{ title: 'Loan Details' }} />
  </Stack.Navigator>
);

// Admin EMIs Stack
const AdminEMIsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: colors.textOnPrimary,
      headerTitleStyle: { fontWeight: fontWeight.semibold },
    }}
  >
    <Stack.Screen name="TodayEMIs" component={TodayEMIScreen} options={{ title: "Today's EMIs" }} />
    <Stack.Screen name="TotalEMIs" component={TotalEMIScreen} options={{ title: 'EMI Statistics' }} />
  </Stack.Navigator>
);

// Auth Stack
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="OTP" component={OTPScreen} />
    <Stack.Screen name="FindEmail" component={FindEmailScreen} />
  </Stack.Navigator>
);

// Main App Stack for User
const UserStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: colors.textOnPrimary,
      headerTitleStyle: { fontWeight: fontWeight.semibold },
    }}
  >
    <Stack.Screen name="UserHome" component={UserTabs} options={{ headerShown: false }} />
    <Stack.Screen name="Help" component={HelpScreen} options={{ title: 'Help' }} />
    <Stack.Screen name="ApplyLoan" component={ApplyLoanScreen} options={{ title: 'Apply for Loan' }} />
    <Stack.Screen name="EditDocument" component={EditDocumentScreen} options={{ title: 'Edit Document Details' }} />
    <Stack.Screen name="LoanDetails" component={LoanDetailsScreen} options={{ title: 'Loan Details' }} />
    <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Pay EMI (Razorpay)' }} />
    <Stack.Screen name="UPIPayment" component={UPIPaymentScreen} options={{ title: 'Pay EMI' }} />
    <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

// Main App Stack for Admin
const AdminStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: colors.textOnPrimary,
      headerTitleStyle: { fontWeight: fontWeight.semibold },
    }}
  >
    <Stack.Screen name="AdminDashboard" component={AdminTabs} options={{ headerShown: false }} />
    <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} options={{ title: 'Settings' }} />
    <Stack.Screen name="AdminLoanDetail" component={AdminLoanDetailScreen} options={{ title: 'Loan Details' }} />
    <Stack.Screen name="UserDetail" component={UserDetailScreen} options={{ title: 'User Details' }} />
    <Stack.Screen name="LoanReview" component={LoanReviewScreen} options={{ title: 'Review Loan' }} />
    <Stack.Screen name="TotalEMIs" component={TotalEMIScreen} options={{ title: 'EMI Statistics' }} />
    <Stack.Screen name="AdminLoans" component={AdminLoansScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

// Main Navigator
const AppNavigator = () => {
  const { isAuthenticated, isStaff, user, loading } = useAuth();
  const needsMobile = isAuthenticated && user && (!user.mobile || String(user.mobile).trim() === '');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack />
      ) : needsMobile ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="AddMobile" component={AddMobileScreen} />
        </Stack.Navigator>
      ) : isStaff ? (
        <AdminStack />
      ) : (
        <UserStack />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: fontSize.lg,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  tabBar: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginTop: 4,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  badgeWrap: {
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e53935',
  },
});

export default AppNavigator;
