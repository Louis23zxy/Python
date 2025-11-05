import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

const UserListItem = ({ user, onAction }) => {
  const { fullName, user_uid, lastUsed, daysUsed, totalDurationFormatted, isDeleted, createdAt } = user;
  const actionButtonText = isDeleted ? 'กู้คืน' : 'ระงับ';
  const actionButtonStyle = isDeleted ? styles.buttonRestore : styles.buttonDelete;

  const handleAction = () => {
    Alert.alert(
      `${actionButtonText} บัญชี`,
      `คุณต้องการ${actionButtonText}บัญชีของ ${fullName} (${user_uid}) หรือไม่?`,
      [
        { text: "ยกเลิก", style: "cancel" },
        { text: actionButtonText, onPress: () => onAction(user_uid, isDeleted) },
      ]
    );
  };

  const statusStyle = isDeleted ? styles.statusDeleted : styles.statusActive;
  return (
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
        {createdAt && createdAt !== 'N/A' && (
             <Text style={styles.textCreatedAt}>
                สร้างเมื่อ: {createdAt} 
            </Text>
        )}
        <Text style={styles.textStatsLastUsed}>ใช้งานล่าสุด: {lastUsed}</Text>
        <Text style={styles.textStats}>ใช้งาน: {daysUsed} วัน ({totalDurationFormatted})</Text>
      </View>

      <View style={styles.cellAction}>
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
    color: '#28a745',
  },
  statusDeleted: {
    color: '#dc3545',
  },
  textStatsLastUsed: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  textStats: {
    fontSize: 13,
    color: '#666',
  },
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
  buttonDelete: {
    backgroundColor: '#dc3545', 
  },
  buttonRestore: {
    backgroundColor: '#ffc107', 
  },
  textCreatedAt: {
    fontSize: 12,
    color: '#007AFF', 
    marginTop: 2,
    fontWeight: '500',
  },
});

export default UserListItem;
