// import React, { useCallback, useEffect, useState } from 'react';
// import { View } from 'react-native';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import { NavigationContainer } from '@react-navigation/native';
// import { StatusBar } from 'expo-status-bar';
// import { AuthProvider, useAuth } from './src/context/AuthContext';
// import AppNavigator from './src/navigation/AppNavigator';
// import Toast from 'react-native-toast-message';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import * as SplashScreen from 'expo-splash-screen';
// import './src/i18n';

// // Keep the splash screen visible while we fetch resources
// SplashScreen.preventAutoHideAsync();

// export default function App() {
//   const [appIsReady, setAppIsReady] = useState(false);

//   useEffect(() => {
//     async function prepare() {
//       try {
//         await new Promise(resolve => setTimeout(resolve, 2000));
//       } catch (e) {
//         console.warn(e);
//       } finally {
//         setAppIsReady(true);
//       }
//     }

//     prepare();
//   }, []);

//   const onLayoutRootView = useCallback(async () => {
//     if (appIsReady) {
//       await SplashScreen.hideAsync();
//     }
//   }, [appIsReady]);

//   if (!appIsReady) {
//     return null;
//   }

//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <SafeAreaProvider>
//         <AuthProvider>
//           <NavigationContainer>
//             <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
//               <StatusBar style="dark" />
//               <AppNavigator />
//             </View>
//           </NavigationContainer>
//         </AuthProvider>
//         <Toast />
//       </SafeAreaProvider>
//     </GestureHandlerRootView>
//   );
// }

import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import {
  initializeFirebaseMessaging,
  setupFCMListeners,
} from "./src/firebaseConfig";
import "./src/i18n";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const MainApp = () => {
  const { user } = useAuth();

  useEffect(() => {
    let unsubscribeFCM: (() => void) | undefined;

    const setupMessaging = async () => {
      if (user) {
        // Initialize Firebase messaging and register token
        const initialized = await initializeFirebaseMessaging();
        if (initialized) {
          // Set up notification listeners
          unsubscribeFCM = setupFCMListeners();
        }
      }
    };

    setupMessaging();

    // Clean up on unmount or when user logs out
    return () => {
      if (unsubscribeFCM) {
        unsubscribeFCM();
      }
    };
  }, [user]);

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <AppNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <MainApp />
          </View>
        </AuthProvider>
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
