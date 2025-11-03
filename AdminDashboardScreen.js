// AdminDashboardScreen.js (ฉบับปรับปรุง)
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
// *** เพิ่มการ Import ที่จำเป็น ***
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth'; 
import { auth } from './firebase'; 
// ------------------------------------
import UserListItem from './components/UserListItem'; 
const mockUsers = [
  {
    id: 1,
    firstName: "สมชาย",
    lastName: "ใจดี",
    isDeleted: false,
    usageLogs: [
      { date: "2025-10-25", duration: 3600 }, // 1 ชม.
      { date: "2025-10-28", duration: 7200 }, // 2 ชม.
      { date: "2025-10-31", duration: 1200 }, // 20 นาที (ล่าสุด)
    ],
  },
  {
    id: 2,
    firstName: "มานี",
    lastName: "มีสุข",
    isDeleted: true, // Soft Delete
    usageLogs: [
      { date: "2025-09-01", duration: 18000 },
      { date: "2025-09-10", duration: 3600 }, 
    ],
  },
  {
    id: 3,
    firstName: "ชูใจ",
    lastName: "มั่นคง",
    isDeleted: false,
    usageLogs: [{ date: "2025-11-01", duration: 600 }], // 10 นาที (ล่าสุด)
  },
];

const calculateDaysUsed = (logs) => {
  if (logs.length === 0) return 0;
  const uniqueDates = new Set(logs.map(log => log.date));
  return uniqueDates.size;
};

const formatTotalDuration = (logs) => {
  if (logs.length === 0) return "0 นาที";
  const totalSeconds = logs.reduce((sum, log) => sum + log.duration, 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  let result = [];
  if (hours > 0) result.push(`${hours} ชม.`);
  if (minutes > 0 || result.length === 0) result.push(`${minutes} น. `);

  return result.join(" ");
};

const processUsersData = (users) => {
  return users.map(user => {
    const totalDurationString = formatTotalDuration(user.usageLogs);
    const daysUsed = calculateDaysUsed(user.usageLogs);
    const lastUsedDate = user.usageLogs.length > 0
      ? user.usageLogs.reduce((latest, log) => (log.date > latest ? log.date : latest), user.usageLogs[0].date)
      : 'N/A';

    return {
      ...user,
      fullName: `${user.firstName} ${user.lastName}`,
      lastUsed: lastUsedDate,
      daysUsed: daysUsed,
      totalDuration: totalDurationString,
    };
  });
};
// UserListItem Component ที่ถูกแยกออกไป (นำออกไปจากไฟล์นี้)
// ...

const AdminDashboardScreen = () => {
  const navigation = useNavigation(); // *** ต้องใช้ useNavigation ***
  const data = processUsersData(mockUsers);

  // *** 🔑 ฟังก์ชันจัดการการออกจากระบบ ***
  const handleLogout = async () => {
    Alert.alert(
      "ออกจากระบบ",
      "คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?",
      [
        { text: "ยกเลิก", style: "cancel" },
        { 
          text: "ออกจากระบบ", 
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              // ใช้ replace เพื่อแทนที่หน้าปัจจุบันด้วย SignInScreen (ป้องกันการกดปุ่ม Back)
              navigation.replace('SignIn'); 
            } catch (error) {
              Alert.alert("ข้อผิดพลาด", "ไม่สามารถออกจากระบบได้: " + error.message);
            }
          }
        },
      ]
    );
  };
  // --------------------------------------

  // ส่วนหัวของแดชบอร์ด
  const renderHeader = () => (
    <View style={styles.headerContainer}>
        <View style={styles.headerTitleRow}>
            <View>
                <Text style={styles.title}>แผงควบคุมผู้ดูแลระบบ</Text>
                <Text style={styles.subtitle}>จัดการบัญชีผู้ใช้และการใช้งาน</Text>
            </View>
            {/* *** ปุ่มออกจากระบบ *** */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>ออกจากระบบ</Text>
            </TouchableOpacity>
        </View>
      <View style={styles.statsBar}>
        <Text style={styles.statText}>รวม: {mockUsers.length} คน</Text>
        <Text style={styles.statText}>Active: {mockUsers.filter(u => !u.isDeleted).length} คน</Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <UserListItem user={item} />}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.listContent}
    />
  );
};
const styles = StyleSheet.create({
  listContent: {
    padding: 15,
    backgroundColor: '#f5f5f5', // พื้นหลังสีเทาอ่อน
  },
  headerContainer: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 10,
  },
  // *** เพิ่ม Style สำหรับปุ่ม Logout ***
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#dc3545', // แดง
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // -----------------------------------
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statsBar: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 20,
  },
  statText: {
    fontSize: 12,
    color: '#007bff',
    backgroundColor: '#e6f2ff',
    padding: 5,
    borderRadius: 3,
    fontWeight: '600',
  },
  // ลบ styles รายการผู้ใช้ (List Item) ออกจากไฟล์นี้แล้ว
});

export default AdminDashboardScreen;