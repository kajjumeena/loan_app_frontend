import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import AnimatedSplash from './src/components/AnimatedSplash';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <StatusBar style="auto" />
          <AppNavigator />
          {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
