import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import AudioRecorder from './src/AudioRecorder';
import SnoringAnalyzer from './src/SnoringAnalyzer';
import ProfileScreen from './src/ProfileScreen'; // <<-- นำเข้าคอมโพเนนต์ใหม่

import { View, Text, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();

// คอมโพเนนต์สำหรับแท็บ "หน้าหลัก"
function HomeScreen() {
  return (
    <View style={styles.homeContainer}>
      <Text style={styles.homeText}>บันทึกเสียง</Text>
      <Text style={styles.homeSubText}>เพื่อเก็บไฟล์เสียง</Text>
      <AudioRecorder />
    </View>
  );
}

// คอมโพเนนต์สำหรับแท็บ "วิเคราะห์เรียลไทม์"
function RealtimeAnalysisScreen() {
  return <SnoringAnalyzer />;
}

// คอมโพเนนต์สำหรับแท็บ "โปรไฟล์"
function ProfileTabScreen() {
    return <ProfileScreen />;
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;

            if (route.name === 'หน้าหลัก') {
              iconName = 'home';
            } else if (route.name === 'โปรไฟล์') { // <<-- เปลี่ยนชื่อและไอคอนสำหรับแท็บนี้
              iconName = 'person';
            } else if (route.name === 'วิเคราะห์เรียลไทม์') {
              iconName = 'analytics';
            }
            return <MaterialIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#6200ee',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopWidth: 0,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 5,
            height: 60,
            paddingBottom: 5,
          },
          tabBarLabelStyle: {
            fontSize: 12,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="หน้าหลัก" component={HomeScreen} />
        <Tab.Screen name="วิเคราะห์เรียลไทม์" component={RealtimeAnalysisScreen} />
        <Tab.Screen name="โปรไฟล์" component={ProfileTabScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  homeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  homeSubText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
});