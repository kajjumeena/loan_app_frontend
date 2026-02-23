import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const EditDocumentScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    aadhaarNumber: '',
    panNumber: '',
  });
  const [aadhaarImage, setAadhaarImage] = useState(null);
  const [panImage, setPanImage] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        aadhaarNumber: user.aadhaarNumber || '',
        panNumber: user.panNumber || '',
      });
      setAadhaarImage(user.aadhaarImage || null);
      setPanImage(user.panImage || null);
    }
  }, [user]);

  const pickImage = async (type) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const data = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        if (type === 'aadhaar') setAadhaarImage(data);
        else setPanImage(data);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        name: user?.name || '',
        mobile: user?.mobile || '',
        aadhaarNumber: formData.aadhaarNumber.trim(),
        panNumber: formData.panNumber.trim().toUpperCase(),
        aadhaarImage: aadhaarImage || '',
        panImage: panImage || '',
      };
      await userAPI.updateProfile(payload);
      await refreshUser();
      Alert.alert('Success', 'Document details updated successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update documents');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card title="Identity Documents">
          <Input
            label="Aadhaar Number"
            value={formData.aadhaarNumber}
            onChangeText={(v) => setFormData({ ...formData, aadhaarNumber: v.replace(/\D/g, '').slice(0, 12) })}
            placeholder="12-digit Aadhaar number"
            keyboardType="number-pad"
            maxLength={12}
          />
          <Text style={styles.imageLabel}>Aadhaar Card Image</Text>
          <TouchableOpacity style={styles.imageButton} onPress={() => pickImage('aadhaar')}>
            {aadhaarImage ? (
              <Image source={{ uri: aadhaarImage }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <Text style={styles.imageButtonText}>+ Attach Aadhaar Image</Text>
            )}
          </TouchableOpacity>

          <Input
            label="PAN Number"
            value={formData.panNumber}
            onChangeText={(v) => setFormData({ ...formData, panNumber: v.replace(/[^A-Z0-9]/gi, '').slice(0, 10).toUpperCase() })}
            placeholder="PAN card number"
            maxLength={10}
          />
          <Text style={styles.imageLabel}>PAN Card Image</Text>
          <TouchableOpacity style={styles.imageButton} onPress={() => pickImage('pan')}>
            {panImage ? (
              <Image source={{ uri: panImage }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <Text style={styles.imageButtonText}>+ Attach PAN Card Image</Text>
            )}
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
  imageLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.text, marginTop: spacing.md, marginBottom: spacing.xs },
  imageButton: {
    height: 120,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageButtonText: { fontSize: fontSize.md, color: colors.primary, fontWeight: fontWeight.medium },
  thumb: { width: '100%', height: '100%', borderRadius: borderRadius.lg },
  saveButton: { marginTop: spacing.xl },
});

export default EditDocumentScreen;
