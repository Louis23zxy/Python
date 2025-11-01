// src/SignInScreen.js

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native'; 
import { signInWithEmailAndPassword } from 'firebase/auth'; 
import { auth } from './firebase'; 
const LogoImage = require('../assets/Logo.jpg');
const SignInScreen = () => {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const ADMIN_EMAIL = 'admin@mysnore.com';

    const handleSignIn = async () => {
        setErrorMessage('');
        if (!email || !password) {
            setErrorMessage('กรุณากรอกอีเมลและรหัสผ่าน');
            return;
        }

        setIsLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            if (email === ADMIN_EMAIL) {
                // *** 🔑 แก้ไข: ใช้ navigation.reset เพื่อบังคับไปหน้า Admin ***
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'แอดมิน' }], 
                });
        } 
        } catch (error) {
            let message = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบที่ไม่ทราบสาเหตุ';
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    message = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
                    break;
                case 'auth/invalid-email':
                    message = 'รูปแบบอีเมลไม่ถูกต้อง';
                    break;
                case 'auth/too-many-requests':
                    message = 'คุณพยายามเข้าสู่ระบบมากเกินไป โปรดลองอีกครั้งภายหลัง';
                    break;
                default:
                    console.error("Firebase Sign In Error:", error.message);

            }
            setErrorMessage(message);

        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <Image 
                      source={LogoImage} 
                      style={styles.logo} 
                />
            </View>

            <View style={styles.card}>
                <Text style={styles.title}>เข้าสู่ระบบ</Text>

                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                {/* ช่องใส่ EMAIL */}
                <View style={styles.inputWrapper}>
                    <Text style={styles.icon}>✉️</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="EMAIL"
                        placeholderTextColor="#aaa"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        editable={!isLoading}
                    />
                </View>

               
                <View style={styles.inputWrapper}>
                    <Text style={styles.icon}>🔒</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="รหัสผ่าน"
                        placeholderTextColor="#aaa"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        editable={!isLoading}
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.button, isLoading && styles.buttonDisabled]} 
                    onPress={handleSignIn}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
                    )}
                </TouchableOpacity>

                
                <TouchableOpacity onPress={() => navigation.navigate('SignUp')} disabled={isLoading}>
                 <Text style={styles.signUpText}>ยังไม่มีบัญชี? ลงทะเบียน</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0661d1ff',
    },
    logoContainer: {
        marginBottom: 40,
    },
    logo: {
        width: 150, 
        height: 150,
        borderRadius: 50,
        borderWidth: 4, 
        borderColor: '#FFFFFF', 
        
    },
    card: {
        width: '85%',
        maxWidth: 400,
        padding: 30,
        backgroundColor: '#FFFFFF', 
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1F4E79', // 
        marginBottom: 30,
        textAlign: 'center',
    },
    errorText: {
        color: '#D32F2F', 
        marginBottom: 15,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 50,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#333',
        marginLeft: 10,
    },
    icon: {
        fontSize: 20,
        color: '#999',
    },
    button: {
        width: '100%',
        backgroundColor: '#007AFF', 
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonDisabled: {
        backgroundColor: '#A9CCF5', 
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    signUpText: {
        marginTop: 15,
        textAlign: 'center',
        color: '#007AFF', 
        fontSize: 16,
    }
});

export default SignInScreen;