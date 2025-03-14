import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CreateReadingScreen } from '../components/screens/copra/CreateReadingScreen';
import { BatchHistoryScreen } from '../components/screens/copra/BatchHistoryScreen';
import { AllBatchesScreen } from '../components/screens/copra/AllBatchesScreen';
import { UpdateReadingScreen } from '../components/screens/copra/UpdateReadingScreen';
import { MoistureGraphScreen } from '../components/screens/copra/MoistureGraphScreen';
import { DryingRecommendationsScreen } from '../components/screens/copra/DryingRecommendationsScreen';

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
      <Stack.Screen
        name="AllBatches"
        component={AllBatchesScreen}
        options={{
          title: 'All Batches',
        }}
      />
      <Stack.Screen
        name="UpdateReading"
        component={UpdateReadingScreen}
        options={{
          title: 'Update Reading',
        }}
      />
      <Stack.Screen
        name="MoistureGraph"
        component={MoistureGraphScreen}
        options={{
          title: 'Moisture Graph',
        }}
      />
       <Stack.Screen
        name="DryingRecommendations"
        component={DryingRecommendationsScreen}
        options={{
          title: 'Drying Recommendations',
        }}
      />
      
      
    </Stack.Navigator>
  );
};

export default CopraNavigator;

