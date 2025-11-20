import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LayoutDashboard, PlusCircle } from 'lucide-react-native';

// Screens
import DashboardScreen from './screens/DashboardScreen';
import AddSubscriptionScreen from './screens/AddSubscriptionScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: '#4f46e5',
            tabBarInactiveTintColor: '#94a3b8',
            headerShown: false,
            tabBarStyle: {
              borderTopColor: '#e2e8f0',
              backgroundColor: '#ffffff',
              height: 90,
              paddingTop: 10,
              paddingBottom: 30,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
              marginTop: 4,
            }
          }}
        >
          <Tab.Screen 
            name="Dashboard" 
            component={DashboardScreen} 
            options={{
              tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
              tabBarLabel: 'Home'
            }}
          />
          <Tab.Screen 
            name="Add" 
            component={AddSubscriptionScreen} 
            options={{
              tabBarIcon: ({ color, size }) => <PlusCircle size={size} color={color} />,
              tabBarLabel: 'Add New'
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}