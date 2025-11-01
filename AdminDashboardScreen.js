import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
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

const UserListItem = ({ user }) => {
  const handleAction = () => {
    const action = user.isDeleted ? 'กู้คืน' : 'Soft Delete';
    Alert.alert(
      `${action} บัญชี`,
      `คุณต้องการ${action}บัญชีของ ${user.fullName} หรือไม่?`,
      [
        { text: "ยกเลิก", style: "cancel" },
        { text: action, onPress: () => console.log(`${action} user ID: ${user.id}`) },
      ]
    );
  };

  const statusStyle = user.isDeleted ? styles.statusDeleted : styles.statusActive;
  const actionButtonStyle = user.isDeleted ? styles.buttonRestore : styles.buttonDelete;
  const actionButtonText = user.isDeleted ? 'กู้คืน' : 'ระงับ';

  return (
    <View style={user.isDeleted ? styles.rowDeleted : styles.rowContainer}>
      <View style={styles.cellName}>
        <Text style={styles.textName}>{user.fullName}</Text>
        <Text style={[styles.textStatus, statusStyle]}>
          {user.isDeleted ? 'ระงับ (Soft Delete)' : 'ใช้งานปกติ'}
        </Text>
      </View>
      <View style={styles.cellStats}>
        <Text style={styles.textLabel}>ใช้ล่าสุด: <Text style={styles.textValue}>{user.lastUsed}</Text></Text>
        <Text style={styles.textLabel}>วันใช้งาน: <Text style={styles.textValue}>{user.daysUsed} วัน</Text></Text>
        <Text style={styles.textLabel}>เวลาอัดรวม: <Text style={styles.textValue}>{user.totalDuration}</Text></Text>
      </View>     
      <View style={styles.cellAction}>
        <TouchableOpacity style={[styles.buttonBase, actionButtonStyle]} onPress={handleAction}>
          <Text style={styles.buttonText}>{actionButtonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
const AdminDashboardScreen = () => {
  const data = processUsersData(mockUsers);

  // ส่วนหัวของแดชบอร์ด
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>แผงควบคุมผู้ดูแลระบบ</Text>
      <Text style={styles.subtitle}>จัดการบัญชีผู้ใช้และการใช้งาน</Text>
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
  // --- รายการผู้ใช้ (List Item) ---
  rowContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2, // เงาสำหรับ Android
    shadowColor: '#000', // เงาสำหรับ iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  rowDeleted: {
    ...this.rowContainer,
    backgroundColor: '#fff0f0', // สีแดงอ่อนสำหรับบัญชีที่ถูกลบ
    opacity: 0.8,
  },
  cellName: {
    flex: 2.5,
  },
  cellStats: {
    flex: 3,
    paddingHorizontal: 10,
  },
  cellAction: {
    flex: 1.5,
    alignItems: 'flex-end',
  },
  textName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  textStatus: {
    fontSize: 12,
  },
  statusActive: {
    color: '#28a745', // เขียว
  },
  statusDeleted: {
    color: '#dc3545', // แดง
  },
  textLabel: {
    fontSize: 11,
    color: '#777',
  },
  textValue: {
    fontWeight: '600',
    color: '#555',
  },
  
  buttonBase: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonDelete: {
    backgroundColor: '#dc3545', // แดง
  },
  buttonRestore: {
    backgroundColor: '#007bff', // น้ำเงิน
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default AdminDashboardScreen;