import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const PaymentSuccessScreen = ({ route, navigation }) => {
    const { amount, emiId, loanId } = route.params || {};
    const scaleAnim = new Animated.Value(0);
    const opacityAnim = new Animated.Value(0);

    useEffect(() => {
        // Animation for the checkmark
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();

        // Prevent going back to Payment screen
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            handleDone();
            return true;
        });

        return () => backHandler.remove();
    }, []);

    const handleDone = () => {
        // Navigate home or to loan details, but reset stack so we can't go back to payment
        if (loanId) {
            // Using navigate with a little trick to trigger refresh if we go to LoanDetails
            // However, popToTop or resetting stack is better
            navigation.reset({
                index: 0,
                routes: [
                    { name: 'UserHome' },
                    { name: 'LoanDetails', params: { loanId } }
                ],
            });
        } else {
            navigation.navigate('UserHome');
        }
    };

    const formatCurrency = (val) => `₹${(val || 0).toLocaleString('en-IN')}`;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Animated.View
                    style={[
                        styles.checkCircle,
                        { transform: [{ scale: scaleAnim }], opacity: opacityAnim }
                    ]}
                >
                    <Ionicons name="checkmark-sharp" size={80} color={colors.white} />
                </Animated.View>

                <Text style={styles.successTitle}>Payment Successful!</Text>
                <Text style={styles.successSub}>Your payment has been verified and processed.</Text>

                <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Amount Paid</Text>
                        <Text style={styles.detailValue}>{formatCurrency(amount)}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Status</Text>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>VERIFIED</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
                    <Text style={styles.doneBtnText}>Back to Loan Details</Text>
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
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    checkCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
        // Shadow
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.sm,
    },
    successSub: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xxl,
        paddingHorizontal: spacing.md,
    },
    detailsCard: {
        width: '100%',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.xxl,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: spacing.xs,
    },
    detailLabel: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
    },
    detailValue: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: colors.borderLight,
        marginVertical: spacing.md,
    },
    statusBadge: {
        backgroundColor: colors.successLight,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    statusText: {
        color: colors.success,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
    },
    doneBtn: {
        width: '100%',
        backgroundColor: colors.primary,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    doneBtnText: {
        color: colors.white,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
});

export default PaymentSuccessScreen;
