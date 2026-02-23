import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Clipboard,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../services/api';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const FindEmailScreen = ({ navigation }) => {
    const [mobile, setMobile] = useState('');
    const [loading, setLoading] = useState(false);
    const [foundEmail, setFoundEmail] = useState(null);

    const handleFindEmail = async () => {
        if (!mobile || mobile.length < 10) {
            Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
            return;
        }

        setLoading(true);
        setFoundEmail(null);

        try {
            const response = await authAPI.findEmail(mobile);
            setFoundEmail(response.data.email);
        } catch (err) {
            const msg = err.response?.data?.message || 'Error finding email. Please try again.';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!foundEmail) return;
        Clipboard.setString(foundEmail);
        if (Platform.OS === 'web') {
            window.alert('Email copied to clipboard!');
        } else {
            Alert.alert('Success', 'Email copied to clipboard!');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Find My Email</Text>
            </View>

            <View style={styles.content}>
                {!foundEmail ? (
                    <View style={styles.form}>
                        <Text style={styles.description}>
                            Enter your registered mobile number to find your associated login email.
                        </Text>
                        <Input
                            label="Mobile Number"
                            value={mobile}
                            onChangeText={setMobile}
                            placeholder="7XXXXXXXXX"
                            keyboardType="phone-pad"
                            maxLength={10}
                            leftIcon={<Text style={styles.prefix}>+91 </Text>}
                        />
                        <Button
                            title="Find Email"
                            onPress={handleFindEmail}
                            loading={loading}
                            size="large"
                            style={styles.button}
                        />
                    </View>
                ) : (
                    <View style={styles.resultContainer}>
                        <Text style={styles.resultText}>Found Associated Email:</Text>
                        <Card
                            variant="outlined"
                            style={styles.emailCardContainer}
                            contentStyle={styles.emailCardContent}
                        >
                            <Text style={styles.emailValue} numberOfLines={1} ellipsizeMode="middle">
                                {foundEmail}
                            </Text>
                            <TouchableOpacity onPress={copyToClipboard} style={styles.copyIcon}>
                                <Ionicons name="copy-outline" size={18} color={colors.primary} />
                                <Text style={styles.copyText}>Copy</Text>
                            </TouchableOpacity>
                        </Card>

                        <Button
                            title="Copy & Go to Login"
                            onPress={() => {
                                copyToClipboard();
                                navigation.navigate('Login');
                            }}
                            size="large"
                            style={styles.loginButton}
                        />

                        <TouchableOpacity
                            onPress={() => setFoundEmail(null)}
                            style={styles.searchAgain}
                        >
                            <Text style={styles.searchAgainText}>Search for another number</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity
                    onPress={() => navigation.navigate('Login')}
                    style={styles.footerLink}
                >
                    <Text style={styles.footerLinkText}>Back to Login</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: spacing.sm,
        marginRight: spacing.sm,
    },
    title: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    description: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        marginBottom: spacing.xl,
        lineHeight: 22,
    },
    form: {
        marginTop: spacing.md,
    },
    button: {
        marginTop: spacing.lg,
    },
    resultContainer: {
        marginTop: spacing.xl,
        alignItems: 'center',
    },
    prefix: {
        fontSize: fontSize.md,
        color: colors.text,
        fontWeight: fontWeight.medium,
    },
    resultText: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    emailCardContainer: {
        width: '100%',
        backgroundColor: colors.surface,
        borderColor: colors.primary,
        borderWidth: 1,
    },
    emailCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    emailValue: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.primary,
        flex: 1,
        marginRight: spacing.sm,
    },
    copyIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.accentLight,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    copyText: {
        fontSize: fontSize.xs,
        color: colors.primary,
        fontWeight: fontWeight.bold,
        marginLeft: 4,
    },
    loginButton: {
        width: '100%',
        marginTop: spacing.xxl,
    },
    searchAgain: {
        marginTop: spacing.lg,
    },
    searchAgainText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        textDecorationLine: 'underline',
    },
    footerLink: {
        marginTop: 'auto',
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    footerLinkText: {
        fontSize: fontSize.md,
        color: colors.primary,
        fontWeight: fontWeight.semibold,
    },
});

export default FindEmailScreen;
