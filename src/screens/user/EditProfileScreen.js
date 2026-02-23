import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { colors, spacing, fontSize, fontWeight } from '../../styles/theme';

const EditProfileScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        mobile: user.mobile || '',
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!formData.name?.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
      };
      await userAPI.updateProfile(payload);
      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card title="Personal Details">
          <Input
            label="Full Name"
            value={formData.name}
            onChangeText={(v) => setFormData({ ...formData, name: v })}
            placeholder="Enter your full name"
          />
          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Email</Text>
            <Text style={styles.readOnlyValue}>{user?.email || '-'}</Text>
          </View>
          <Input
            label="Mobile Number"
            value={formData.mobile}
            onChangeText={(v) => setFormData({ ...formData, mobile: v.replace(/\D/g, '').slice(0, 10) })}
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
          />

          <TouchableOpacity
            style={styles.editDocLink}
            onPress={() => navigation.navigate('EditDocument')}
            activeOpacity={0.7}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <Text style={styles.editDocLinkText}>Edit Document Details (Aadhaar & PAN)</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        <Button title="Save Changes" onPress={handleSubmit} loading={loading} size="large" style={styles.saveButton} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  readOnlyLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  readOnlyValue: { fontSize: fontSize.md, color: colors.textSecondary, flex: 1, textAlign: 'right', marginLeft: spacing.sm },
  editDocLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  editDocLinkText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    marginLeft: spacing.sm,
  },
  saveButton: { marginTop: spacing.xl },
});

export default EditProfileScreen;
