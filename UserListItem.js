import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

// 💡 แก้ไข: รับ prop onAction เข้ามาด้วย
const UserListItem = ({ user, onAction }) => {
  // 💡 Destructure properties ใหม่ รวมถึง isDeleted
  const { fullName, user_uid, lastUsed, daysUsed, totalDurationFormatted, isDeleted } = user;
  
  // 💡 กำหนดข้อความและ Style ของปุ่มตามสถานะ isDeleted
  const actionButtonText = isDeleted ? 'กู้คืน' : 'ระงับ';
  const actionButtonStyle = isDeleted ? styles.buttonRestore : styles.buttonDelete;

  const handleAction = () => {
    // 💡 ใช้ Alert เพื่อยืนยันการดำเนินการ
    Alert.alert(
      `${actionButtonText} บัญชี`,
      `คุณต้องการ${actionButtonText}บัญชีของ ${fullName} (${user_uid}) หรือไม่?`,
      [
        { text: "ยกเลิก", style: "cancel" },
        // 💡 เรียก onAction ที่ส่งมาจาก AdminDashboardScreen พร้อม user_uid และสถานะปัจจุบัน
        { text: actionButtonText, onPress: () => onAction(user_uid, isDeleted) },
      ]
    );
  };

  // 💡 กำหนด Styles สำหรับข้อความสถานะ
  const statusStyle = isDeleted ? styles.statusDeleted : styles.statusActive;

  return (
    // 💡 กำหนด Style พื้นหลังให้เป็นสีเทาเมื่อถูกระงับ
    <View style={isDeleted ? styles.rowDeleted : styles.rowContainer}>
      <View style={styles.cellName}>
        <Text style={styles.textName}>{fullName}</Text>
        <Text style={styles.textUid}>UID: {user_uid}</Text>
        {isDeleted && (
             <Text style={[styles.textStatus, statusStyle]}>
                ระงับ (Soft Deleted)
            </Text>
        )}
      </View>

      <View style={styles.cellStats}>
        <Text style={styles.textStatsLastUsed}>ใช้งานล่าสุด: {lastUsed}</Text>
        {/* 💡 แสดงสถิติการใช้งานจริงจาก user object */}
        <Text style={styles.textStats}>ใช้งาน: {daysUsed} วัน ({totalDurationFormatted})</Text>
      </View>

      <View style={styles.cellAction}>
        {/* 💡 ใช้ actionButtonStyle และ actionButtonText ที่กำหนดไว้ */}
        <TouchableOpacity 
          style={[styles.button, actionButtonStyle]} 
          onPress={handleAction}
        >
          <Text style={styles.buttonText}>{actionButtonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // --- Container Styles (มีการเปลี่ยนแปลง) ---
  rowContainer: {
    backgroundColor: '#ffffff',
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
  // 💡 Style ใหม่สำหรับบัญชีที่ถูกระงับ (สีพื้นหลังสีเทาอ่อน)
  rowDeleted: {
    backgroundColor: '#f0f0f0', 
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
  // --- Cell Styles (เหมือนเดิม) ---
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
  // --- Text Styles (มีการเปลี่ยนแปลง) ---
  textName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  textUid: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  textStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusActive: {
    color: '#28a745', // เขียว
  },
  // 💡 Style สำหรับสถานะถูกระงับ (ข้อความสีแดง)
  statusDeleted: {
    color: '#dc3545', // แดง
  },
  textStatsLastUsed: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  textStats: {
    fontSize: 13,
    color: '#666',
  },
  // --- Button Styles (มีการเปลี่ยนแปลง) ---
  button: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  // 💡 Style สำหรับปุ่มระงับ (สีแดง)
  buttonDelete: {
    backgroundColor: '#dc3545', 
  },
  // 💡 Style สำหรับปุ่มกู้คืน (สีเหลือง/ส้ม)
  buttonRestore: {
    backgroundColor: '#ffc107', 
  },
});

export default UserListItem;
