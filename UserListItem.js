// UserListItem.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

const UserListItem = ({ user }) => {
  const handleAction = () => {
    // กำหนดข้อความการดำเนินการและคำเตือนตามสถานะ isDeleted
    const action = user.isDeleted ? 'กู้คืน' : 'Soft Delete';
    Alert.alert(
      `${action} บัญชี`,
      `คุณต้องการ${action}บัญชีของ ${user.fullName} หรือไม่?`,
      [
        { text: "ยกเลิก", style: "cancel" },
        // ในสถานการณ์จริง ควรมีการเรียก API/ฟังก์ชันเพื่อดำเนินการ
        { text: action, onPress: () => console.log(`${action} user ID: ${user.id}`) },
      ]
    );
  };

  // กำหนด Styles ตามสถานะ
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

// Styles ที่เกี่ยวข้องกับ UserListItem เท่านั้น
const styles = StyleSheet.create({
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
    backgroundColor: '#fff0f0', // สีแดงอ่อนสำหรับบัญชีที่ถูกลบ
    opacity: 0.8,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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

export default UserListItem;