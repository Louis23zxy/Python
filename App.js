import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth'; 
import { auth } from './src/firebase'; 
import SignInScreen from './src/SignInScreen'; 
import SignUpScreen from './src/SignUpScreen'; 
import AudioRecorder from './src/AudioRecorder';
import SnoringAnalyzer from './src/SnoringAnalyzer';
import ProfileScreen from './src/ProfileScreen';
import AdminDashboardScreen from './src/AdminDashboardScreen';

const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();

function HomeScreen() {
  return (
    <View style={styles.homeContainer}>
      <Text style={styles.homeText}>บันทึกเสียง</Text>
      <Text style={styles.homeSubText}>เพื่อเก็บไฟล์เสียง</Text>
      <AudioRecorder />
    </View>
  );
}

function RealtimeAnalysisScreen() {
  return <SnoringAnalyzer />;
}

function ProfileTabScreen() {
    return <ProfileScreen />;
}

function AppTabs() {
 
  const PRIMARY_COLOR = '#007AFF'; 
  const INACTIVE_COLOR = '#8E8E93';

  return (
    <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;

            if (route.name === 'หน้าหลัก') {
              iconName = 'home';
            } else if (route.name === 'โปรไฟล์') { 
              iconName = 'person';
            } else if (route.name === 'วิเคราะห์เรียลไทม์') {
              iconName = 'analytics';
            }
            return <MaterialIcons name={iconName} size={size} color={color} />;
          },
         
          tabBarActiveTintColor: PRIMARY_COLOR, 
          tabBarInactiveTintColor: INACTIVE_COLOR, 
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
  );
}

function AuthStackScreen() {
    return (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="SignIn" component={SignInScreen} /> 
            <AuthStack.Screen name="SignUp" component={SignUpScreen} />
            <AuthStack.Screen 
                name="แอดมิน" 
                component={AdminDashboardScreen}
                options={{ headerShown: true, title: 'แผงควบคุมผู้ดูแลระบบ' }} 
            />
        </AuthStack.Navigator>
    );
}

// *** โค้ดที่ถูกเพิ่ม ***
const ADMIN_EMAIL = 'admin@mysnore.com'; // อีเมล Admin ต้องตรงกับใน SignInScreen.js

export default function App() {
    const [user, setUser] = useState(undefined); 
    const [isLoading, setIsLoading] = useState(true);
    const LOADING_COLOR = '#007AFF'; 

    // *** โค้ดที่ถูกเพิ่ม ***
    const isAdmin = user && user.email === ADMIN_EMAIL;
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setIsLoading(false);
        });
        return unsubscribe;
    }, []);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={LOADING_COLOR} />
                <Text style={styles.loadingText}>กำลังตรวจสอบการเข้าสู่ระบบ...</Text>
            </View>
        );
    }
    return (
        <NavigationContainer>
            {/* ตรรกะใหม่: ป้องกันไม่ให้ Admin ถูกส่งไปหน้า User */}
            {isAdmin 
                ? <AuthStackScreen /> // ถ้าเป็น Admin: ให้แสดง AuthStack (เพื่อให้ navigation.reset ทำงาน)
                : user 
                    ? <AppTabs />     
                    : <AuthStackScreen /> 
            }
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5ff'
  },
  loadingText: { 
    marginTop: 10, 
    color: '#007AFF' // 🔵 สีน้ำเงิน
  },
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
    color: '#1F4E79', // 🔵 สีน้ำเงินเข้ม
  },
  homeSubText: {
    fontSize: 16,
    color: '#6699CC', // 🔵 สีน้ำเงินอมเทา
    marginBottom: 20,
  }
});