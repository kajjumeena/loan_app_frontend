import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
  AppState,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { paymentAPI, emiAPI } from '../../services/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';

const RAZORPAY_KEY_ID = 'rzp_test_SBGqt9CftlP4y9';

const showAlert = (title, message, buttons) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n${message}`);
      if (confirmed && buttons[1]?.onPress) buttons[1].onPress();
      else if (!confirmed && buttons[0]?.onPress) buttons[0].onPress();
    } else {
      window.alert(`${title}: ${message}`);
      if (buttons && buttons[0]?.onPress) buttons[0].onPress();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

const PaymentScreen = ({ route, navigation }) => {
  const { emi, loan } = route.params;
  const [loading, setLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [checkoutHtml, setCheckoutHtml] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const webViewRef = useRef(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active' && showWebView && paymentData) {
        // Reduced delay to match real user return speed
        setTimeout(() => checkPaymentStatus(), 1500);
      }
      appState.current = nextAppState;
    });
    return () => sub?.remove();
  }, [showWebView, paymentData]);

  const checkPaymentStatus = async (showError = false) => {
    if (checkingStatus) return;
    setCheckingStatus(true);
    try {
      const response = await emiAPI.getEMI(emi._id);
      if (response.data.status === 'paid') {
        setShowWebView(false);
        setVerifying(false);
        navigation.navigate('PaymentSuccess', {
          amount: emi.totalAmount,
          emiId: emi._id,
          loanId: loan._id
        });
        return true;
      } else if (showError) {
        showAlert('Status Pending', 'Payment is not yet verified. Please wait a moment or check your history.');
      }
    } catch (e) {
      if (showError) showAlert('Error', 'Could not verify payment status.');
    } finally {
      setCheckingStatus(false);
    }
    return false;
  };

  const formatCurrency = (amount) => `₹${amount?.toLocaleString('en-IN') || 0}`;
  const formatDate = (date) => !date ? 'N/A' : new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const handlePayment = async () => {
    setLoading(true);
    try {
      const orderResponse = await paymentAPI.createOrder(emi._id);
      const data = orderResponse.data;
      if (data.simulationMode) {
        showAlert('Error', 'Razorpay is not configured on the server');
        setLoading(false);
        return;
      }
      setPaymentData({ orderId: data.orderId, amount: data.amount, emiId: emi._id });
      setCheckoutHtml(generateCheckoutHtml(data.orderId, data.amount, emi._id));
      setShowWebView(true);
    } catch (error) {
      showAlert('Error', error.response?.data?.message || 'Failed to create payment order');
    }
    setLoading(false);
  };

  const generateCheckoutHtml = (orderId, amount, emiId) => `
<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://checkout.razorpay.com/v1/checkout.js"></script></head>
<body style="margin:0;padding:20px;font-family:sans-serif;background:linear-gradient(135deg,#667eea,#764ba2);min-height:100vh;display:flex;align-items:center;justify-content:center;">
<div style="background:white;padding:30px;border-radius:20px;text-align:center;max-width:350px;">
<h2 style="color:#333;">EMI Payment</h2><p style="font-size:36px;color:#667eea;font-weight:bold;">₹${(amount / 100).toLocaleString('en-IN')}</p>
<div id="loader" style="border:4px solid #f3f3f3;border-top:4px solid #667eea;border-radius:50%;width:50px;height:50px;animation:spin 1s linear infinite;margin:20px auto;"></div>
<p id="statusText">Opening payment...</p><div id="result"></div>
</div>
<script>
var done=false;
var opts={key:'${RAZORPAY_KEY_ID}',amount:${amount},currency:'INR',name:'Loan App',description:'EMI Day ${emi.dayNumber}',order_id:'${orderId}',
prefill:{contact:'${loan?.applicantMobile || ''}'},theme:{color:'#667eea'},
handler:function(r){done=true;document.getElementById('loader').style.display='none';document.getElementById('statusText').innerHTML='Verifying...';
window.ReactNativeWebView.postMessage(JSON.stringify({type:'PAYMENT_SUCCESS',data:{razorpay_order_id:r.razorpay_order_id,razorpay_payment_id:r.razorpay_payment_id,razorpay_signature:r.razorpay_signature,emiId:'${emiId}'}}));},
modal:{ondismiss:function(){if(!done){document.getElementById('loader').style.display='none';setTimeout(function(){window.ReactNativeWebView.postMessage(JSON.stringify({type:'CHECK_STATUS'}));},1000);}}}
};
var rzp=new Razorpay(opts);
rzp.on('payment.failed',function(r){window.ReactNativeWebView.postMessage(JSON.stringify({type:'PAYMENT_FAILED',error:r.error}));});
setTimeout(function(){rzp.open();},500);
</script>
</body>
</html>`;

  const handleWebViewMessage = async (event) => {
    let msg;
    try { msg = JSON.parse(event.nativeEvent.data); } catch { return; }

    if (msg.type === 'PAYMENT_SUCCESS') {
      setVerifying(true);
      try {
        await paymentAPI.verifyPayment(msg.data);
        setShowWebView(false);
        setVerifying(false);
        navigation.navigate('PaymentSuccess', {
          amount: emi.totalAmount,
          emiId: emi._id,
          loanId: loan._id
        });
      } catch (e) {
        // If API fails, try one last check on status
        const isPaid = await checkPaymentStatus();
        if (!isPaid) {
          setVerifying(false);
          showAlert('Verification Failed', 'We could not verify your payment. If money was deducted, it will be updated shortly.', [{ text: 'OK' }]);
        } else {
          navigation.navigate('PaymentSuccess', {
            amount: emi.totalAmount,
            emiId: emi._id,
            loanId: loan._id
          });
        }
      }
    } else if (msg.type === 'CHECK_STATUS') {
      checkPaymentStatus();
    } else if (msg.type === 'PAYMENT_FAILED') {
      setShowWebView(false);
      showAlert('Payment Failed', msg.error?.description || 'Please try again.');
    }
  };

  const handleCloseWebView = async () => {
    if (verifying) return; // Don't allow closing while verifying

    setCheckingStatus(true);
    try {
      const res = await emiAPI.getEMI(emi._id);
      if (res.data.status === 'paid') {
        setShowWebView(false);
        navigation.navigate('PaymentSuccess', {
          amount: emi.totalAmount,
          emiId: emi._id,
          loanId: loan._id
        });
      } else {
        showAlert('Cancel Payment?', 'If you have already paid, please wait a moment for verification.', [
          { text: 'Wait', style: 'cancel' },
          { text: 'Close Anyway', onPress: () => setShowWebView(false), style: 'destructive' }
        ]);
      }
    } catch {
      setShowWebView(false);
    }
    setCheckingStatus(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card title="EMI Details">
          <View style={styles.emiInfo}>
            <View style={styles.emiHeader}>
              <Text style={styles.dayLabel}>Day {emi.dayNumber}</Text>
              <View style={[styles.statusBadge, { backgroundColor: emi.status === 'overdue' ? colors.errorLight : emi.status === 'paid' ? colors.successLight : colors.warningLight }]}>
                <Text style={[styles.statusText, { color: emi.status === 'overdue' ? colors.error : emi.status === 'paid' ? colors.success : colors.warning }]}>{emi.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.dueDate}>Due: {formatDate(emi.dueDate)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.breakdownSection}>
            <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>Principal</Text><Text style={styles.breakdownValue}>{formatCurrency(emi.principalAmount)}</Text></View>
            <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>Interest</Text><Text style={styles.breakdownValue}>{formatCurrency(emi.interestAmount)}</Text></View>
            {emi.penaltyAmount > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Base EMI (main pay):</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(emi.principalAmount + emi.interestAmount)}</Text>
              </View>
            )}
            {emi.penaltyAmount > 0 && (() => {
              const penaltyPerDay = Math.ceil((emi.principalAmount || 0) / 2);
              const daysOverdue = penaltyPerDay > 0 ? Math.round((emi.penaltyAmount || 0) / penaltyPerDay) : 0;
              return (
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, styles.penaltyLabel]}>
                    Penalty ({penaltyPerDay} × {daysOverdue} days):
                  </Text>
                  <Text style={[styles.breakdownValue, styles.penaltyValue]}>{formatCurrency(emi.penaltyAmount)}</Text>
                </View>
              );
            })()}
            <View style={[styles.breakdownRow, styles.totalRow]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>{formatCurrency(emi.totalAmount)}</Text></View>
          </View>
        </Card>
        <Card title="Payment">
          <Text style={styles.paymentHint}>Pay via UPI (PhonePe, GPay, Paytm) or enter UPI ID. Test: success@razorpay</Text>
        </Card>
        <View style={styles.payAmountContainer}>
          <Text style={styles.payAmountLabel}>Amount to Pay</Text>
          <Text style={styles.payAmount}>{formatCurrency(emi.totalAmount)}</Text>
        </View>
        {emi.status !== 'paid' && <Button title={`Pay ${formatCurrency(emi.totalAmount)}`} onPress={handlePayment} loading={loading} size="large" style={styles.payButton} />}
        {emi.status === 'paid' && <View style={styles.paidBanner}><Text style={styles.paidIcon}>✓</Text><Text style={styles.paidText}>Paid</Text></View>}
      </ScrollView>

      <Modal visible={showWebView} animationType="slide" onRequestClose={handleCloseWebView}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              onPress={handleCloseWebView}
              disabled={verifying}
              style={[styles.closeBtn, verifying && { opacity: 0.5 }]}
            >
              <Text style={styles.closeBtnText}>{verifying ? "Verifying..." : "Cancel"}</Text>
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>Secure Payment</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={{ flex: 1, position: 'relative' }}>
            {checkoutHtml ? (
              <WebView
                ref={webViewRef}
                source={{ html: checkoutHtml }}
                onMessage={handleWebViewMessage}
                javaScriptEnabled
                domStorageEnabled
                mixedContentMode="always"
              />
            ) : (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 10 }}>Loading Checkout...</Text>
              </View>
            )}

            {verifying && (
              <View style={styles.verifyingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.verifyingText}>Verifying Payment...</Text>
                <Text style={styles.verifyingSubtext}>Please do not close or go back</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.md },
  emiInfo: { marginBottom: spacing.md },
  emiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  dayLabel: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  dueDate: { fontSize: fontSize.sm, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.md },
  breakdownSection: { marginTop: spacing.sm },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  breakdownLabel: { fontSize: fontSize.md, color: colors.textSecondary },
  breakdownValue: { fontSize: fontSize.md, color: colors.text, fontWeight: fontWeight.medium },
  penaltyLabel: { color: colors.error },
  penaltyValue: { color: colors.error },
  totalRow: { marginTop: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  totalLabel: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
  totalValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.primary },
  paymentHint: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 22 },
  payAmountContainer: { alignItems: 'center', marginVertical: spacing.lg },
  payAmountLabel: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.xs },
  payAmount: { fontSize: 40, fontWeight: fontWeight.bold, color: colors.primary },
  payButton: { marginBottom: spacing.md },
  paidBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successLight, padding: spacing.md, borderRadius: borderRadius.md },
  paidIcon: { fontSize: 24, color: colors.success, marginRight: spacing.sm },
  paidText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.success },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background
  },
  webViewTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  webViewLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  closeBtn: { padding: spacing.sm },
  closeBtnText: { color: colors.error, fontWeight: fontWeight.semibold, fontSize: fontSize.md },
  verifyingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  verifyingText: {
    color: '#fff',
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginTop: 20,
  },
  verifyingSubtext: {
    color: '#ccc',
    fontSize: fontSize.sm,
    marginTop: 8,
  },
});

export default PaymentScreen;
