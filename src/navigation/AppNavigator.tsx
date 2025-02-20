// import React from 'react';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { useAuth } from '../context/AuthContext';
// import AuthNavigator from './AuthNavigator';
// import HomeScreen from '../components/screens/home/HomeScreen';
// import Loading from '../components/common/Loading';

// const Stack = createNativeStackNavigator();

// const AppNavigator = () => {
//   const { user, isLoading } = useAuth();

//   if (isLoading) {
//     return <Loading fullScreen message="Loading..." />;
//   }

//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       {user ? (
//         // App Stack
//         <Stack.Screen name="HomeScreen" component={HomeScreen} />
//       ) : (
//         // Auth Stack
//         <Stack.Screen name="Auth" component={AuthNavigator} />
//       )}
//     </Stack.Navigator>
//   );
// };

// export default AppNavigator;

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { WateringProvider } from '../context/WateringContext';
import AuthNavigator from './AuthNavigator';
import WateringNavigator from './WateringNavigator';
import HomeScreen from '../components/screens/home/HomeScreen';
import Loading from '../components/common/Loading';
import { colors } from '../constants/colors';

// Import navigation for Locations and Devices
// These would be created following similar patterns to WateringNavigator
// import LocationNavigator from './LocationNavigator';
// import DeviceNavigator from './DeviceNavigator';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator when logged in
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Watering') {
            iconName = focused ? 'water' : 'water-outline';
          } else if (route.name === 'Locations') {
            iconName = focused ? 'location' : 'location-outline';
          } else if (route.name === 'Devices') {
            iconName = focused ? 'hardware-chip' : 'hardware-chip-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray500,
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.gray200,
          paddingTop: 5,
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Watering" component={WateringNavigator} />
      
      {/* These would be uncommented once the navigators are created */}
      {/* <Tab.Screen name="Locations" component={LocationNavigator} /> */}
      {/* <Tab.Screen name="Devices" component={DeviceNavigator} /> */}
      
      {/* For now, navigate directly to the HomeScreen with specific handling */}
      <Tab.Screen 
        name="Locations" 
        component={HomeScreen} 
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent default behavior
            e.preventDefault();
            
            // Show alert about future implementation
            alert('Location management will be available in the next update.');
            
            // Or navigate to HomeScreen with a param
            // navigation.navigate('Home', { showLocationInfo: true });
          },
        })}
      />
      
      <Tab.Screen 
        name="Devices" 
        component={HomeScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent default behavior
            e.preventDefault();
            
            // Show alert about future implementation
            alert('Device management will be available in the next update.');
            
            // Or navigate to HomeScreen with a param
            // navigation.navigate('Home', { showDeviceInfo: true });
          },
        })}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loading fullScreen message="Loading..." />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // Wrap the main navigator with the WateringProvider
        <Stack.Screen name="Main">
          {() => (
            <WateringProvider>
              <MainTabNavigator />
            </WateringProvider>
          )}
        </Stack.Screen>
      ) : (
        // Auth Stack
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;