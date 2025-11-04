import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth'; 
import StatsSection from './components/StatsSection';

const SERVER_URL = 'http://172.16.16.12:5000';
const ProfileInfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
);
const ProfileScreen = () => {
    const [profileImage, setProfileImage] = useState(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [gender, setGender] = useState('');
    const [userUID, setUserUID] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthReady, setIsAuthReady] = useState(false);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserUID(user.uid);
            } else {
                setUserUID(null);
                setFirstName('');
                setLastName('');
                setGender('');
            }
            setIsAuthReady(true);
        });
        return unsubscribe;
    }, []);
    const fetchProfile = useCallback(async (uid) => {
        if (!uid) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`${SERVER_URL}/get-user-profile/${uid}`);
            const data = await response.json();
            if (response.ok) {
                setFirstName(data.first_name || 'ไม่ได้ระบุ');
                setLastName(data.last_name || 'ไม่ได้ระบุ');
                setGender(data.sex || 'ไม่ได้ระบุ');
            } else if (response.status === 404) {
                 setFirstName('ยังไม่ตั้งค่า');
                 setLastName('ยังไม่ตั้งค่า');
                 setGender('ยังไม่ตั้งค่า');
            } else {
                Alert.alert("Error", `ไม่สามารถดึงข้อมูลโปรไฟล์ได้: ${data.message || 'Server Error'}`);
            }
        } catch (error) {
            console.error("Network/Fetch Error:", error);
            Alert.alert("Network Error", "ไม่สามารถเชื่อมต่อ Server เพื่อดึงข้อมูลโปรไฟล์ได้");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthReady && userUID) {
            fetchProfile(userUID);
        } else if (isAuthReady && !userUID) {
             setIsLoading(false);
        }
    }, [isAuthReady, userUID, fetchProfile]);

    const pickImage = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission required', 'Need media library permissions to select an image.');
                return;
            }
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });
        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
            Alert.alert("Image Selected", "รูปภาพพร้อมสำหรับการอัปโหลด (ฟังก์ชันบันทึกยังไม่ได้ถูกเรียกใช้)");
        }
    };
    if (!isAuthReady) {
         return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
                <Text style={styles.loadingText}>กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</Text>
            </View>
        );
    }
    if (!userUID) {
         return (
            <View style={styles.loadingContainer}>
                <Ionicons name="person-circle-outline" size={80} color="#6200ee" />
                <Text style={styles.notLoggedInText}>กรุณาเข้าสู่ระบบเพื่อดูโปรไฟล์</Text>
            </View>
        );
    }
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.fullContainer}
        >  
        <View>
            <ScrollView contentContainerStyle={styles.scrollContainer}>

                <View style={styles.profileHeader}>
                    <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.profileImagePlaceholder}>
                                <MaterialIcons name="person" size={100} color="#aaa" />
                            </View>
                        )}
                        <View style={styles.cameraIconContainer}>
                             <MaterialIcons name="camera-alt" size={20} color="white" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.displayName}>{`${firstName} ${lastName}`}</Text>
                </View>
                <View style={styles.infoCard}>
                    <Text style={styles.cardTitle}>ข้อมูลส่วนตัว</Text>
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#6200ee" style={{marginTop: 20}} />
                    ) : (
                        <View style={styles.infoTable}>
                            <ProfileInfoRow label="ชื่อ" value={firstName} />
                            <ProfileInfoRow label="นามสกุล" value={lastName} />
                            <ProfileInfoRow label="เพศ" value={gender} />
                            <ProfileInfoRow label="อีเมล" value={auth.currentUser?.email || 'ไม่ได้ระบุ'} />
                        </View>
                    )}
                </View>
                <StatsSection userUID={userUID} />
                <TouchableOpacity style={styles.logoutButton} onPress={() => { auth.signOut().then(() => {
                   Alert.alert('ออกจากระบบ', 'คุณได้ออกจากระบบแล้ว');
                  })
                  .catch((error) => {
                  console.error('Logout Error:', error);
                  Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถออกจากระบบได้');
                  });
                 }}>
                 <Text style={styles.logoutButtonText}>ออกจากบัญชี</Text>
                </TouchableOpacity>      
            </ScrollView>
        </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    fullContainer: { flex: 1, 
        backgroundColor: '#7db3ecff' 
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    settingsButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 45 : 15,
        right: 15,
        padding: 5,
    },
    settingsDropdown: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 90 : 60,
        right: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        width: 180,
        zIndex: 10,
        gap: 10,
    },
    settingsText: { 
        fontSize: 16, 
        color: '#333' 
    },
    scrollContainer: {
        paddingTop: Platform.OS === 'ios' ? 120 : 95,
        paddingHorizontal: 20,
        alignItems: 'center',
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f4f7',
    },
    notLoggedInText: {
        marginTop: 15,
        fontSize: 18,
        color: '#6200ee',
        fontWeight: '600',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    profileHeader: { 
        alignItems: 'center', 
        marginBottom: 30, 
        width: '100%',
    },
    imagePicker: { 
        position: 'relative', 
        width: 150, 
        height: 150 
    },
    profileImagePlaceholder: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ccc',
    },
    profileImage: { width: 150, height: 150, borderRadius: 75 },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 5,
        backgroundColor: '#007AFF',
        borderRadius: 20,
        padding: 8,
        borderWidth: 2,
        borderColor: 'white',
    },
    displayName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 15,
        color: '#333',
    },
    infoCard: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    infoTable: {
        width: '100%',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    infoLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
        flex: 1,
    },
    infoValue: {
        fontSize: 16,
        color: '#333',
        flex: 2,
        textAlign: 'right',
        fontWeight: '400',
    },
    statText: {
        fontSize: 16,
        color: '#777',
        marginTop: 10,
        textAlign: 'center',
    },
    logoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    },
    logoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    },

});

export default ProfileScreen;