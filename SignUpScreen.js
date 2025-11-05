import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth'; 
import { auth } from './firebase';

const PROFILE_API_URL = 'http://172.16.16.12:5000/save-user-profile'; 
const validateEmail = (email) => {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*\.(com|net|co\.th)$/i; 
    
    if (!emailRegex.test(email)) {
        return "รูปแบบอีเมลไม่ถูกต้อง หรือต้องเป็นโดเมน .com, .net, .co.th เท่านั้น";
    }
    return true;
};
const specialCharRegex = /[!@#$%]/;
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
    if (!specialCharRegex.test(password)) {
    return "รหัสผ่านต้องมีอักษรพิเศษอย่างน้อย 1 ตัว (เช่น !@#$%)"; 
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
    const [generalError, setGeneralError] = useState(''); 
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
        setValidationErrors({}); 
        if (loading) return;

        let errors = {};
        let hasErrors = false;
        if (!firstName) { errors.firstName = "กรุณากรอกชื่อจริง"; hasErrors = true; }
        if (!lastName) { errors.lastName = "กรุณากรอกนามสกุล"; hasErrors = true; }
        if (!gender) { errors.gender = "กรุณาเลือกเพศ"; hasErrors = true; }
        if (!email) { errors.email = "กรุณากรอกอีเมล"; hasErrors = true; }
        const emailValidationResult = validateEmail(email);
        if (email !== '' && emailValidationResult !== true) {
            errors.email = emailValidationResult;
            hasErrors = true;
        }
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
        if (hasErrors) {
            setValidationErrors(errors);
            return;
        }
        
        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const profileSaved = await saveUserProfile(user.uid);

            if (profileSaved) {
                navigation.replace('SignIn'); 
            } else {
                setGeneralError("ลงทะเบียนสำเร็จแล้ว แต่ไม่สามารถบันทึกข้อมูลส่วนตัวได้ กรุณาลองเข้าสู่ระบบ"); 
                navigation.navigate('SignIn'); 
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
    const ErrorText = ({ field }) => (
        validationErrors[field] ? (
            <Text style={styles.errorTextInline}>{validationErrors[field]}</Text>
        ) : null
    );

    return (
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.iconContainer}>
            </View>
            <Text style={styles.title}>สร้างบัญชีใหม่</Text>
            {generalError ? <Text style={styles.errorTextGeneral}>{generalError}</Text> : null}
            <TextInput
                style={[styles.input, validationErrors.firstName && styles.inputError]} 
                placeholder="ชื่อจริง (First Name)"
                value={firstName}
                onChangeText={(text) => {setFirstName(text); setGeneralError('');}} 
                editable={!loading}
            />
            <ErrorText field="firstName" />

            <TextInput
                style={[styles.input, validationErrors.lastName && styles.inputError]}
                placeholder="นามสกุล (Last Name)"
                value={lastName}
                onChangeText={(text) => {setLastName(text); setGeneralError('');}} 
                editable={!loading}
            />
            <ErrorText field="lastName" />
            <View style={{width: '100%'}}>
                 <Text style={styles.label}>เพศ</Text>
                 <View style={styles.genderContainer}>
                    <GenderButton label="ชาย" value="Male" />
                    <GenderButton label="หญิง" value="Female" />
                </View>
                <ErrorText field="gender" /> 
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
                <Text style={styles.loginText}>มีบัญชีอยู่แล้ว? <Text style={{fontWeight: 'bold', color: '#007AFF'}}>เข้าสู่ระบบ</Text></Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 25,
        backgroundColor: '#afcdedff',
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 10,
        backgroundColor: '#DCEDC8', 
        borderRadius: 50,
        padding: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000000ff', 
        marginBottom: 30,
    },
    errorTextGeneral: { 
        color: '#D32F2F', 
        marginBottom: 15,
        textAlign: 'center',
        fontWeight: 'bold',
        width: '100%',
        paddingHorizontal: 10
    },
    errorTextInline: { 
        color: '#D32F2F', 
        fontSize: 12,
        marginBottom: 15,
        alignSelf: 'flex-start',
        paddingLeft: 5,
        marginTop: -10, 
    },
    input: {
        width: '100%',
        padding: 15,
        backgroundColor: '#F1F8E9',
        borderRadius: 10,
        marginBottom: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    inputError: {
        borderColor: '#D32F2F', 
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
        backgroundColor: '#007AFF', 
        borderColor: '#007AFF',
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
        backgroundColor: '#007AFF', 
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