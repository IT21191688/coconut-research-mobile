import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CreateReadingScreen } from '../components/screens/copra/CreateReadingScreen';
import { BatchHistoryScreen } from '../components/screens/copra/BatchHistoryScreen';

const Stack = createNativeStackNavigator();


export const CopraNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="CreateReading"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="CreateReading"
        component={CreateReadingScreen}
        options={{
          title: 'Create Reading',
        }}
      />
      <Stack.Screen
        name="BatchHistory"
        component={BatchHistoryScreen}
        options={{
          title: 'Batch History',
        }}
      />
      
      
    </Stack.Navigator>
  );
};

export default CopraNavigator;

