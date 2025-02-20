import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

import DeviceListScreen from '../components/screens/device/DeviceListScreen';
import DeviceDetailScreen from '../components/screens/device/DeviceDetailScreen';
import DeviceFormScreen from '../components/screens/device/DeviceFormScreen';
import { colors } from '../constants/colors';
import { DEVICE_ROUTES } from '../constants/routes';

const Stack = createNativeStackNavigator();

const DeviceNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        headerLeft: ({ canGoBack }) =>
          canGoBack ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 40, bottom: 20, left: 20, right: 20 }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
          ) : null,
      })}
    >
      <Stack.Screen
        name={DEVICE_ROUTES.DEVICE_LIST}
        component={DeviceListScreen}
        options={({ route }) => ({
          headerShown : false
        })}
      />
      <Stack.Screen
        name={DEVICE_ROUTES.DEVICE_DETAILS}
        component={DeviceDetailScreen}
        options={({ route }) => ({
          title: 'Device Details',
          headerShown : false
        })}
      />
      <Stack.Screen
        name={DEVICE_ROUTES.REGISTER_DEVICE}
        component={DeviceFormScreen}
        options={{
          title: 'Register Device',
          headerShown : false
        }}
      />
      <Stack.Screen
        name={DEVICE_ROUTES.EDIT_DEVICE}
        component={DeviceFormScreen}
        options={{
          title: 'Edit Device',
          headerShown : false
        }}
      />
    </Stack.Navigator>
  );
};

export default DeviceNavigator;