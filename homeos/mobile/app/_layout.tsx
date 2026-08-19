import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';
import { View } from 'react-native';
import JudgePanel from '../components/JudgePanel';

import { AppProvider } from '../context/AppContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AppProvider>
      <RootLayoutNav />
    </AppProvider>
  );
}

function RootLayoutNav() {
  return (
    <ThemeProvider value={DarkTheme}>
      <View style={{ flex: 1, backgroundColor: '#070a13' }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#070a13' } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="scanner" options={{ presentation: 'modal' }} />
          <Stack.Screen name="day/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
          <Stack.Screen name="shopping-list" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        </Stack>
        <JudgePanel />
      </View>
    </ThemeProvider>
  );
}
