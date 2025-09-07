// src/ProfileScreen.js

import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // นำเข้า MaterialIcons
import * as ImagePicker from 'expo-image-picker';

const ProfileScreen = () => {
    const [profileImage, setProfileImage] = useState(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [gender, setGender] = useState('');

    // State สำหรับควบคุมการแสดงผลเมนูตั้งค่า
    const [settingsVisible, setSettingsVisible] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('ขออภัย!', 'เราต้องได้รับอนุญาตเพื่อเข้าถึงคลังรูปภาพของคุณ');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: [ImagePicker.MediaType.Images],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
        }
    };

    // ฟังก์ชันสำหรับเปิด/ปิด เมนูตั้งค่า
    const toggleSettings = () => {
        setSettingsVisible(!settingsVisible);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* ส่วน Header ที่มีปุ่มตั้งค่า */}
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>โปรไฟล์</Text>
                <TouchableOpacity onPress={toggleSettings} style={styles.settingsButton}>
                    <MaterialIcons name="settings" size={28} color="#070000ff" />
                </TouchableOpacity>
            </View>

            {/* แสดงเมนูตั้งค่าเมื่อ settingsVisible เป็น true */}
            {settingsVisible && (
                <View style={styles.settingsMenu}>
                    <Text style={styles.settingsText}>เมนูตั้งค่า</Text>
                    {/* สามารถเพิ่มรายการตั้งค่าอื่นๆ ที่นี่ได้ในอนาคต */}
                </View>
            )}

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.profileHeader}>
                    <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.profileImagePlaceholder}>
                                <MaterialIcons name="person" size={100} color="#ccc" />
                                <View style={styles.cameraIconContainer}>
                                    <MaterialIcons name="photo-camera" size={24} color="#fff" />
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>
                
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>ชื่อ</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="กรุณากรอกชื่อ"
                        value={firstName}
                        onChangeText={setFirstName}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>นามสกุล</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="กรุณากรอกนามสกุล"
                        value={lastName}
                        onChangeText={setLastName}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>เพศ</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="กรุณากรอกเพศ"
                        value={gender}
                        onChangeText={setGender}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    headerContainer: {
        position: 'absolute', // ทำให้ Header อยู่ด้านบนสุด
        top: Platform.OS === 'ios' ? 50 : 25, // ปรับตำแหน่งตาม OS
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between', // จัดให้ title ชิดซ้าย, button ชิดขวา
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#ffffffff', // สีม่วงเหมือน Tab bar
        zIndex: 10, // ให้ Header อยู่บนสุด
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'black',
    },
    settingsButton: {
        padding: 8,
    },
    settingsMenu: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 100 : 75, // วางใต้ Header
        right: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        zIndex: 10, // ให้เมนูอยู่บนสุด
        width: 180, // กำหนดความกว้างของเมนู
    },
    settingsText: {
        fontSize: 16,
        color: '#333',
    },
    scrollContainer: {
        paddingTop: Platform.OS === 'ios' ? 120 : 95, // ปรับ padding ด้านบนให้มีที่ว่างสำหรับ Header และ Settings menu
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    headerText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
    },
    imagePicker: {
        position: 'relative',
        width: 150,
        height: 150,
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
    profileImage: {
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 2,
        borderColor: '#ccc',
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 5,
        backgroundColor: '#6200ee',
        borderRadius: 20,
        padding: 8,
        borderWidth: 2,
        borderColor: '#fff',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        color: '#666',
        marginBottom: 5,
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        fontSize: 16,
    },
});

export default ProfileScreen;