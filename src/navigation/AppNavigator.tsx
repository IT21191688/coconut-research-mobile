import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { WateringProvider } from "../context/WateringContext";
import { DeviceProvider } from "../context/DeviceContext";
import { LocationProvider } from "../context/LocationContext";
import AuthNavigator from "./AuthNavigator";
import WateringNavigator from "./WateringNavigator";
import DeviceNavigator from "./DeviceNavigator";
import LocationNavigator from "./LocationNavigator";
import CopraNavigator from './copraNavigator';
import HomeScreen from "../components/screens/home/HomeScreen";
import Loading from "../components/common/Loading";
import { colors } from "../constants/colors";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator when logged in
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Watering") {
            iconName = focused ? "water" : "water-outline";
          } else if (route.name === "CoconutYield") {
            iconName = focused ? "leaf" : "leaf-outline";
          } else if (route.name === "OilYield") {
            iconName = focused ? "flask" : "flask-outline";
          } else if (route.name === "CopraIdentification") {
            iconName = focused ? "scan" : "scan-outline";
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray500,
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.gray200,
          paddingTop: 8,
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Watering" component={WateringNavigator} />
      <Tab.Screen 
        name="CoconutYield" 
        component={HomeScreen} 
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Home', { screen: 'CoconutYield' });
          },
        })}
        options={{ title: 'Coconut Yield' }}
      />
      <Tab.Screen name="OilYield" component={CopraNavigator} />
      <Tab.Screen 
        name="CopraIdentification" 
        component={HomeScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Home', { screen: 'CopraIdentification' });
          },
        })}
        options={{ title: 'Copra ID' }}
      />
    </Tab.Navigator>
  );
};

// Create a separate navigator that includes the tab navigator and other screens
const MainStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabNavigator} />
      <Stack.Screen name="LocationList" component={LocationNavigator} />
      <Stack.Screen name="Devices" component={DeviceNavigator} />
    </Stack.Navigator>
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
        // Wrap the main navigator with the necessary providers
        <Stack.Screen name="Main">
          {() => (
            <WateringProvider>
              <DeviceProvider>
                <LocationProvider>
                  <MainStackNavigator />
                </LocationProvider>
              </DeviceProvider>
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