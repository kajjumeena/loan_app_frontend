import React, { useState } from 'react';
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
import { adminAPI } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const CreateUserScreen = ({ navigation }) => {
  const [role, setRole] = useState('user'); // 'user' | 'admin'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const err = {};
    const emailTrim = formData.email?.trim() || '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrim) err.email = 'Email is required';
    else if (!emailRegex.test(emailTrim)) err.email = 'Enter a valid email';
    if (!formData.name?.trim()) err.name = 'Name is required';
    if (!formData.mobile?.trim()) err.mobile = 'Mobile number is required';
    else if (formData.mobile.replace(/\D/g, '').length !== 10) err.mobile = 'Enter valid 10-digit mobile number';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await adminAPI.createUser({
        email: formData.email.trim(),
        name: formData.name.trim(),
        mobile: formData.mobile.replace(/\D/g, '').slice(0, 10),
        role,
      });
      Alert.alert('Success', `${role === 'admin' ? 'Admin' : 'User'} created successfully`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card title="Select Type">
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleOption, role === 'user' && styles.roleOptionSelected]}
              onPress={() => setRole('user')}
              activeOpacity={0.8}
            >
              <Ionicons name="person-outline" size={28} color={role === 'user' ? colors.textOnPrimary : colors.textSecondary} />
              <Text style={[styles.roleText, role === 'user' && styles.roleTextSelected]}>User</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleOption, role === 'admin' && styles.roleOptionSelected]}
              onPress={() => setRole('admin')}
              activeOpacity={0.8}
            >
              <Ionicons name="shield-outline" size={28} color={role === 'admin' ? colors.textOnPrimary : colors.textSecondary} />
              <Text style={[styles.roleText, role === 'admin' && styles.roleTextSelected]}>Admin</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card title={role === 'admin' ? 'Admin Details' : 'User Details'}>
          <Input
            label="Name"
            value={formData.name}
            onChangeText={(v) => { setFormData({ ...formData, name: v }); if (errors.name) setErrors({ ...errors, name: '' }); }}
            placeholder="Enter full name"
            error={errors.name}
          />
          <Input
            label="Email"
            value={formData.email}
            onChangeText={(v) => { setFormData({ ...formData, email: v }); if (errors.email) setErrors({ ...errors, email: '' }); }}
            placeholder="e.g. user@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <Input
            label="Mobile Number"
            value={formData.mobile}
            onChangeText={(v) => {
              setFormData({ ...formData, mobile: v.replace(/\D/g, '').slice(0, 10) });
              if (errors.mobile) setErrors({ ...errors, mobile: '' });
            }}
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.mobile}
          />
        </Card>

        <Button title={`Create ${role === 'admin' ? 'Admin' : 'User'}`} onPress={handleSubmit} loading={loading} size="large" style={styles.submitBtn} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  roleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  roleOption: {
    flex: 1,
    marginHorizontal: spacing.xs,
    flexDirection: 'column',
    alignItems: 'center',
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
  },
  roleOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  roleText: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text, marginTop: spacing.sm },
  roleTextSelected: { color: colors.textOnPrimary },
  submitBtn: { marginTop: spacing.xl },
});

export default CreateUserScreen;
