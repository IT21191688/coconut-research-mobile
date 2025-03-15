import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';

// Import screens
import WateringScheduleScreen from '../components/screens/watering/WateringScheduleScreen';
import ScheduleDetailScreen from '../components/screens/watering/ScheduleDetailScreen';
import CreateScheduleScreen from '../components/screens/watering/CreateScheduleScreen';
import ScheduleHistoryScreen from '../components/screens/watering/ScheduleHistoryScreen';

const Stack = createNativeStackNavigator();

const WateringNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="WateringSchedule"
        component={WateringScheduleScreen}
        options={({ navigation }) => ({
          title: 'Watering Schedules',
          headerStyle: {
            backgroundColor: colors.white,
          },
          headerTitleStyle: {
            color: colors.textPrimary,
            fontWeight: 'bold',
          },
          headerTintColor: colors.black,
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('ScheduleHistory')}
            >
              <Ionicons name="calendar-outline" size={24} color={colors.black} />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="ScheduleDetail"
        component={ScheduleDetailScreen}
        options={({ navigation }) => ({
          title: 'Schedule Details',
          headerStyle: {
            backgroundColor: colors.white,
          },
          headerTitleStyle: {
            color: colors.textPrimary,
            fontWeight: 'bold',
          },
          headerTintColor: colors.black,
          headerShadowVisible: false,
        })}
      />
      <Stack.Screen
        name="CreateSchedule"
        component={CreateScheduleScreen}
        options={({ navigation }) => ({
          title: 'Create Schedule',
          headerStyle: {
            backgroundColor: colors.white,
          },
          headerTitleStyle: {
            color: colors.textPrimary,
            fontWeight: 'bold',
          },
          headerTintColor: colors.black,
          headerShadowVisible: false,
        })}
      />
      <Stack.Screen
        name="ScheduleHistory"
        component={ScheduleHistoryScreen}
        options={({ navigation }) => ({
          title: 'Schedule Details',
          headerStyle: {
            backgroundColor: colors.white,
          },
          headerTitleStyle: {
            color: colors.textPrimary,
            fontWeight: 'bold',
          },
          headerTintColor: colors.black,
          headerShadowVisible: false,
        })}
      />
    </Stack.Navigator>
  );
};

export default WateringNavigator;