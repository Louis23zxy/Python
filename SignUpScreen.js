import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth'; 
import { auth } from './firebase'; 
import { Ionicons } from '@expo/vector-icons';

const PROFILE_API_URL = 'http://172.16.16.12:5000/save-user-profile'; 
const validatePassword = (password) => {
    if (password.length < 8) {
        return "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร";
    }
    if (!/[A-Z]/.test(password)) {
        return "รหัสผ่านต้องมีอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว";
    }
    if (!/[a-z]/.test(password)) {
        return "รหัสผ่านต้องมีอักษรพิมพ์เล็กอย่างน้อย 1 ตัว";
    }
    if (!/[0-9]/.test(password)) {
        return "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว";
    }
    return true;
};

const SignUpScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [gender, setGender] = useState(null); 
    const [loading, setLoading] = useState(false);
    
    // 💡 State สำหรับข้อผิดพลาดทั่วไป (เช่น Firebase Errors)
    const [generalError, setGeneralError] = useState(''); 
    
    // 💡 State สำหรับข้อผิดพลาดเฉพาะช่อง (Inline Validation)
    const [validationErrors, setValidationErrors] = useState({});

    const navigation = useNavigation();

    const GenderButton = ({ label, value }) => {
        const isActive = gender === value;
        return (
            <TouchableOpacity 
                style={[styles.genderButton, isActive && styles.genderButtonActive]}
                onPress={() => {setGender(value); setValidationErrors({}); setGeneralError('');}}
                disabled={loading}
            >
                <Text style={[styles.genderText, isActive && styles.genderTextActive]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    const saveUserProfile = async (uid) => {
        // ... (โค้ดเดิม)
        try {
            const response = await fetch(PROFILE_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid: uid,
                    firstName: firstName,
                    lastName: lastName,
                    gender: gender,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Server Error saving profile:", errorData);
                throw new Error(`Server responded with: ${errorData.message || 'Unknown error'}`);
            }
            return true;
        } catch (error) {
            console.error("Error saving user profile:", error);
            return false;
        }
    };

    const handleSignUp = async () => {
        setGeneralError(''); 
        setValidationErrors({}); // 💡 ล้างข้อผิดพลาดทั้งหมดก่อนเริ่ม
        if (loading) return;

        let errors = {};
        let hasErrors = false;

        // 1. Validation Logic: ตรวจสอบทุกช่องและบันทึกข้อผิดพลาด
        if (!firstName) { errors.firstName = "กรุณากรอกชื่อจริง"; hasErrors = true; }
        if (!lastName) { errors.lastName = "กรุณากรอกนามสกุล"; hasErrors = true; }
        if (!gender) { errors.gender = "กรุณาเลือกเพศ"; hasErrors = true; }
        if (!email) { errors.email = "กรุณากรอกอีเมล"; hasErrors = true; }
        if (!password) { errors.password = "กรุณากรอกรหัสผ่าน"; hasErrors = true; }
        if (!confirmPassword) { errors.confirmPassword = "กรุณายืนยันรหัสผ่าน"; hasErrors = true; }

        if (password && confirmPassword && password !== confirmPassword) {
            errors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
            hasErrors = true;
        }
      
        const passwordValidationResult = validatePassword(password);
        if (password !== '' && passwordValidationResult !== true) {
            errors.password = passwordValidationResult;
            hasErrors = true;
        }

        // 2. ถ้ามีข้อผิดพลาดใด ๆ ให้อัปเดต State และหยุด
        if (hasErrors) {
            setValidationErrors(errors);
            return;
        }
        
        // 3. เริ่มกระบวนการลงทะเบียน
        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const profileSaved = await saveUserProfile(user.uid);

            if (profileSaved) {
                navigation.replace('Home');
            } else {
                setGeneralError("ลงทะเบียนสำเร็จแล้ว แต่ไม่สามารถบันทึกข้อมูลส่วนตัวได้ กรุณาลองเข้าสู่ระบบ"); 
                navigation.navigate('Login');
            }

        } catch (error) {
            let message = "เกิดข้อผิดพลาดในการลงทะเบียน";
            if (error.code === 'auth/email-already-in-use') {
                message = "อีเมลนี้ถูกใช้งานแล้ว";
            } else if (error.code === 'auth/invalid-email') {
                message = "รูปแบบอีเมลไม่ถูกต้อง";
            } else {
                 console.error("Firebase Sign Up Error:", error.message);
            }
             setGeneralError(message);
        } finally {
            setLoading(false);
        }
    };

    // 💡 HELPER Component สำหรับแสดง Error ใต้ Input
    const ErrorText = ({ field }) => (
        validationErrors[field] ? (
            <Text style={styles.errorTextInline}>{validationErrors[field]}</Text>
        ) : null
    );

    return (
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.iconContainer}>
                 <Ionicons name="body-outline" size={70} color="#388E3C" />
            </View>
            <Text style={styles.title}>สร้างบัญชีใหม่</Text>

            {/* 💡 แสดงข้อผิดพลาดทั่วไป (Firebase / Profile Save Fail) */}
            {generalError ? <Text style={styles.errorTextGeneral}>{generalError}</Text> : null}

            {/* 🔑 ส่วนกรอกข้อมูล */}
            <TextInput
                style={[styles.input, validationErrors.firstName && styles.inputError]} // 💡 เพิ่มสไตล์ Input Error
                placeholder="ชื่อจริง (First Name)"
                value={firstName}
                onChangeText={(text) => {setFirstName(text); setGeneralError('');}} 
                editable={!loading}
            />
            <ErrorText field="firstName" /> {/* 💡 แสดง Error Inline */}

            <TextInput
                style={[styles.input, validationErrors.lastName && styles.inputError]}
                placeholder="นามสกุล (Last Name)"
                value={lastName}
                onChangeText={(text) => {setLastName(text); setGeneralError('');}} 
                editable={!loading}
            />
            <ErrorText field="lastName" />

            {/* 🔑 ส่วนเลือกเพศ (Gender Selection) */}
            <View style={{width: '100%'}}>
                 <Text style={styles.label}>เพศ</Text>
                 <View style={styles.genderContainer}>
                    <GenderButton label="ชาย" value="Male" />
                    <GenderButton label="หญิง" value="Female" />
                </View>
                <ErrorText field="gender" /> {/* 💡 แสดง Error Inline */}
            </View>

            <TextInput
                style={[styles.input, validationErrors.email && styles.inputError]}
                placeholder="อีเมล (Email)"
                value={email}
                onChangeText={(text) => {setEmail(text); setGeneralError('');}}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
            />
            <ErrorText field="email" />

            <TextInput
                style={[styles.input, validationErrors.password && styles.inputError]}
                placeholder="รหัสผ่าน (Password)"
                value={password}
                onChangeText={(text) => {setPassword(text); setGeneralError('');}}
                secureTextEntry
                editable={!loading}
            />
            <ErrorText field="password" />

            <TextInput
                style={[styles.input, validationErrors.confirmPassword && styles.inputError]}
                placeholder="ยืนยันรหัสผ่าน"
                value={confirmPassword}
                onChangeText={(text) => {setConfirmPassword(text); setGeneralError('');}}
                secureTextEntry
                editable={!loading}
            />
            <ErrorText field="confirmPassword" />


            {/* 🔑 ปุ่มลงทะเบียน */}
            <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSignUp} 
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.buttonText}>ลงทะเบียน</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('SignIn')} disabled={loading}>
                <Text style={styles.loginText}>มีบัญชีอยู่แล้ว? <Text style={{fontWeight: 'bold', color: '#388E3C'}}>เข้าสู่ระบบ</Text></Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 25,
        backgroundColor: '#f4f4f4ff',
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 10,
        backgroundColor: '#DCEDC8', // Lightest green background
        borderRadius: 50,
        padding: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000000ff', // Dark green color
        marginBottom: 30,
    },
    // 💡 [สไตล์ใหม่] สำหรับข้อความผิดพลาดทั่วไป (General Error)
    errorTextGeneral: { 
        color: '#D32F2F', 
        marginBottom: 15,
        textAlign: 'center',
        fontWeight: 'bold',
        width: '100%',
        paddingHorizontal: 10
    },
    // 💡 [สไตล์ใหม่] สำหรับข้อความผิดพลาดใต้ Input (Inline Error)
    errorTextInline: { 
        color: '#D32F2F', 
        fontSize: 12,
        marginBottom: 15,
        alignSelf: 'flex-start',
        paddingLeft: 5,
        marginTop: -10, // เลื่อนขึ้นให้ใกล้ input มากขึ้น
    },
    input: {
        width: '100%',
        padding: 15,
        backgroundColor: '#F1F8E9', // Light green background
        borderRadius: 10,
        marginBottom: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    // 💡 [สไตล์ใหม่] Input เมื่อเกิด Error
    inputError: {
        borderColor: '#D32F2F', // สีแดงเมื่อมี Error
        borderWidth: 2,
    },
    label: {
        width: '100%',
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
        fontWeight: '500',
        paddingLeft: 5,
    },
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        marginTop: 5,
    },
    genderButton: {
        flex: 1,
        padding: 15,
        borderRadius: 10,
        backgroundColor: '#F1F8E9', 
        marginHorizontal: 5,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    genderButtonActive: {
        backgroundColor: '#8BC34A', 
        borderColor: '#388E3C',
    },
    genderText: {
        color: '#333',
        fontWeight: 'normal',
        fontSize: 16,
    },
    genderTextActive: {
        color: '#FFFFFF', 
        fontWeight: 'bold',
    },
    button: {
        width: '100%',
        backgroundColor: '#388E3C', 
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonDisabled: {
        backgroundColor: '#A5D6A7', 
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginLink: {
        marginTop: 20,
    },
    loginText: {
        fontSize: 16,
        color: '#666',
    },
});

export default SignUpScreen;
