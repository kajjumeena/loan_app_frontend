import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const ProfileScreen = ({ navigation }) => {
  const { user } = useAuth();

  const maskAadhaar = (str) => {
    if (!str || str.length < 4) return str || '-';
    return 'XXXX XXXX ' + str.slice(-4);
  };

  const maskPan = (str) => {
    if (!str || str.length < 4) return str || '-';
    return str.slice(0, 2) + '*****' + str.slice(-4);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U')}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'No Name'}</Text>
          <Text style={styles.userEmail}>{user?.email || '-'}</Text>
        </View>

        <Card title="Profile Information">
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{user?.name || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Mobile</Text>
            <Text style={styles.value}>{user?.mobile ? `+91 ${user.mobile}` : '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Aadhaar Number</Text>
            <Text style={styles.value}>{maskAadhaar(user?.aadhaarNumber)}</Text>
          </View>
          {user?.aadhaarImage ? (
            <View style={styles.imageRow}>
              <Text style={styles.label}>Aadhaar Image</Text>
              <Image source={{ uri: user.aadhaarImage }} style={styles.docImage} resizeMode="cover" />
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.label}>PAN Number</Text>
            <Text style={styles.value}>{maskPan(user?.panNumber)}</Text>
          </View>
          {user?.panImage ? (
            <View style={styles.imageRow}>
              <Text style={styles.label}>PAN Card Image</Text>
              <Image source={{ uri: user.panImage }} style={styles.docImage} resizeMode="cover" />
            </View>
          ) : null}
        </Card>

        <Button
          title="Edit Profile"
          onPress={() => navigation.navigate('EditProfile')}
          variant="outline"
          size="large"
          style={styles.editButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: fontWeight.bold, color: colors.textOnPrimary },
  userName: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text, marginTop: spacing.sm },
  userEmail: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  imageRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  label: { fontSize: fontSize.sm, color: colors.textSecondary },
  value: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text },
  docImage: { width: '100%', height: 150, borderRadius: borderRadius.md, marginTop: spacing.sm },
  editButton: { marginTop: spacing.lg },
});

export default ProfileScreen;
