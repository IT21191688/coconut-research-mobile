import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';

// Import screens
import CoconutYieldScreen from '../components/screens/CoconutYield/CoconutYieldScreen';

const Stack = createNativeStackNavigator();

const CoconutYieldNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTitleStyle: {
          color: colors.textPrimary,
          fontWeight: 'bold',
        },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        headerLeft: ({ canGoBack }) =>
          canGoBack ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginRight: 8 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.black} />
            </TouchableOpacity>
          ) : null,
      })}
    >
      <Stack.Screen
        name="CoconutYieldMain"
        component={CoconutYieldScreen}
        options={({ navigation }) => ({
          title: 'Coconut Yield',
          headerRight: () => (
            <TouchableOpacity>
              <Ionicons name="calendar-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
};

export default CoconutYieldNavigator;