import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import './src/i18n';
import messaging from '@react-native-firebase/messaging';
import {getApp} from '@react-native-firebase/app';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);



async function requestUserPermission() {
try{

  const message = await messaging().onMessage(async remoteMessage => {
    console.log('A new FCM message arrived!', remoteMessage);
    console.log('Notification caused app to open from quit state:', remoteMessage.notification);
    console.log('Notification caused app to open from background state:', remoteMessage.notification);
    console.log('Notification caused app to open from background state:', remoteMessage.data);
    console.log('Notification caused app to open from background state:', remoteMessage.data);
  } );
  if (message) {
    console.log('Notification caused app to open from quit state:', message);
  } else {
    console.log('Notification caused app to open from background state:', message);
  }

  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
  }
}
catch (error) {
  console.error('Error getting initial notification:', error);
}  

}


  useEffect(() => {
    async function prepare() {
      try {
        requestUserPermission();
        console.log('Requesting user permission for notifications...');
        await new Promise(resolve => setTimeout(resolve, 2000));
   
        
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
          <NavigationContainer>
            <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
              <StatusBar style="dark" />
              <AppNavigator />
            </View>
          </NavigationContainer>
        </AuthProvider>
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}