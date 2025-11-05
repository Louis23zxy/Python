import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import UserListItem from './components/UserListItem';
const BASE_URL = "http://172.16.16.12:5000";
const ADMIN_EMAIL = 'admin@mysnore.com'; 
const formatDisplayDate = (isoDateString) => {
    if (!isoDateString || isoDateString === 'N/A') {
        return 'N/A';
    }
    
    try {
        const date = new Date(isoDateString);

        if (isNaN(date.getTime())) {
            return 'N/A';
        }

        // จัดรูปแบบเป็น DD Mon YYYY (พ.ศ.)
        const day = date.getDate();
        // ใช้ th-TH เพื่อดึงชื่อเดือนแบบย่อ (e.g., ต.ค., พ.ย.)
        const month = date.toLocaleDateString('th-TH', { month: 'short' }); 
        const year = date.getFullYear() + 543; // แปลง ค.ศ. เป็น พ.ศ.
        
        return `${day} ${month}. ${year}`; // เช่น 12 ต.ค. 2568

    } catch (e) {
        return 'N/A';
    }
};
const AdminDashboardScreen = () => {
    const navigation = useNavigation();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const formatDuration = (ms) => {
        if (!ms || ms === 0) return '00:00:00';
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const pad = (num) => String(num).padStart(2, '0');
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const response = await fetch(`${BASE_URL}/admin/get-all-user-stats`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const formattedUsers = data.map(user => ({
                ...user,
                createdAt: formatDisplayDate(user.createdAt),
                lastUsed: user.lastUsed !== 'N/A' 
                    ? new Date(user.lastUsed).toLocaleDateString('th-TH', { 
                        year: 'numeric', month: 'short', day: 'numeric', 
                        hour: '2-digit', minute: '2-digit' 
                    })
                    : 'N/A',
                totalDurationFormatted: formatDuration(user.totalDurationMillis),
            }));
            setUsers(formattedUsers);
        } catch (error) {
            console.error("Error fetching users:", error);
            setErrorMessage('ไม่สามารถโหลดข้อมูลผู้ใช้ได้: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    }, []);
    const handleLogout = () => {
        Alert.alert(
            'ออกจากระบบ',
            'คุณต้องการออกจากระบบหรือไม่?',
            [
                { text: 'ยกเลิก', style: 'cancel' },
                {
                    text: 'ออกจากระบบ',
                    style: 'destructive',
                    onPress: () => {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'SignIn' }], 
                        });
                    },
                },
            ]
        );
    };

    const toggleSoftDelete = async (userUid, isCurrentlyDeleted) => {
        const newStatus = !isCurrentlyDeleted;
        const action = newStatus ? 'ระงับ' : 'กู้คืน';

        try {
            const response = await fetch(`${BASE_URL}/admin/user-profile/${userUid}`, {
                method: 'PUT',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ is_deleted: newStatus }),
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                throw new Error(`Invalid JSON response: ${text}`);
            }

            if (!response.ok) throw new Error(data.message || 'เกิดข้อผิดพลาด');

            Alert.alert('สำเร็จ', data.message);
            fetchUsers();
        } catch (error) {
            console.error(`Error toggling status for ${userUid}:`, error);
            Alert.alert('ข้อผิดพลาด', `ไม่สามารถ${action}บัญชีได้: ${error.message}`);
        }
    };
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const renderUserItem = ({ item }) => (
        <UserListItem user={item} onAction={toggleSoftDelete} />
    );
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1F4E79" />
                <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
            </View>
        );
    }
    if (errorMessage) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
                    <Text style={styles.retryButtonText}>ลองใหม่</Text>
                </TouchableOpacity>
            </View>
        );
    }
    return (
    <View style={styles.container}>
        
        <Text style={styles.header}>Admin Dashboard: User Statistics</Text>

        <FlatList
            data={users}
            keyExtractor={(item) => item.user_uid}
            renderItem={renderUserItem}
            contentContainerStyle={{ paddingBottom:100 }} // สำคัญ
        />

        <TouchableOpacity style={styles.floatingLogoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </TouchableOpacity>

    </View>
);

};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F5F5F5',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F4E79',
    },
    logoutButton: {
        backgroundColor: '#dc3545',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    logoutText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    listContainer: {
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#1F4E79',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#1F4E79',
        padding: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    floatingLogoutButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 30,
    elevation: 4, // android shadow
    shadowColor: '#000', // ios
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
},
});

export default AdminDashboardScreen;