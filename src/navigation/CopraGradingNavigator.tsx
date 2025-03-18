import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import CopraIdentificationScreen from '../components/screens/copra_grading/CopraIdentificationScreen';
import CopraGradingView from '../components/screens/copra_grading/CopraGradingView';
import CopraMoldDetectionView from '../components/screens/copra_grading/CopraMoldDetectionView';

const Stack = createStackNavigator();

const CopraGradingNavigator: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Stack.Screen 
        name="CopraIdentification"
        component={CopraIdentificationScreen}
        options={{ title: t('copra.identification') }}
      />
      <Stack.Screen 
        name="CopraGradingView"
        component={CopraGradingView}
        options={{ title: t('copra.grading') }}
      />
      <Stack.Screen 
        name="CopraMoldDetectionView"
        component={CopraMoldDetectionView}
        options={{ title: t('copra.moldDetection') }}
      />
    </Stack.Navigator>
  );
};

export default CopraGradingNavigator;