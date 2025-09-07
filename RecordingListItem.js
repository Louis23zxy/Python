// src/components/SnoringListItem.js
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

const { width: screenWidth } = Dimensions.get('window');

const formatDuration = (millis) => {
  if (millis === null || isNaN(millis)) {
    return "00:00";
  }
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const pad = (num) => num.toString().padStart(2, '0');

  return `${pad(minutes)}:${pad(seconds)}`;
};

export default function SnoringListItem({
  item,
  isPlaying,
  isCurrentItem,
  isExpanded,
  onToggleExpand,
  onPlayPause,
  onSeek,
  currentPosition,
}) {
  const displayTime = item.timestamp && !isNaN(new Date(item.timestamp))
    ? new Date(item.timestamp).toLocaleTimeString()
    : 'เวลาไม่ถูกต้อง';

  return (
    <View style={styles.listItemContainer}>
      <TouchableOpacity onPress={() => onToggleExpand(item)}>
        <View style={styles.listItemRow}>
          <Text style={styles.listItemTime}>
            {`บันทึกเมื่อ: ${displayTime}`}
          </Text>
          <MaterialIcons name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={24} color="#556B2F" />
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>ระยะเวลา:</Text>
          <Text style={styles.detailValue}>{formatDuration(item.duration)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>กรนทั้งหมด:</Text>
          <Text style={styles.detailValue}>{item.snoringEventsCount} ครั้ง</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>หยุดหายใจ:</Text>
          <Text style={styles.detailValue}>{item.apneaEventsCount} ครั้ง</Text>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.playerContainer}>
          <View style={styles.playerControls}>
            <TouchableOpacity onPress={() => onPlayPause(item)}>
              <MaterialIcons
                name={isCurrentItem && isPlaying ? "pause-circle-filled" : "play-circle-filled"}
                size={60}
                color="#556B2F"
              />
            </TouchableOpacity>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={item.duration || 1}
            value={isCurrentItem ? currentPosition : 0}
            onSlidingComplete={onSeek}
            minimumTrackTintColor="#556B2F"
            maximumTrackTintColor="#aaa"
            thumbTintColor="#556B2F"
          />
          <View style={styles.playerTime}>
            <Text style={styles.playerTimeText}>{formatDuration(isCurrentItem ? currentPosition : 0)}</Text>
            <Text style={styles.playerTimeText}>{formatDuration(item.duration)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  listItemContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginVertical: 8,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  listItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 10,
  },
  listItemTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#777',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  playerContainer: {
    width: '100%',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  playerTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '95%',
    alignSelf: 'center',
  },
  playerTimeText: {
    fontSize: 12,
    color: '#888',
  },
  slider: {
    width: '100%',
    height: 40,
  },
});