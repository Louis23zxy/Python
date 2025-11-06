import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import Svg, { Rect, G as Group, Line, Text as SvgText } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');
const GRAPH_HEIGHT = 140; 
const GRAPH_MARGIN_HORIZONTAL = 20;
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
const SnoringGraph = ({ item }) => {

  const [tooltip, setTooltip] = useState(null);

  const totalDurationMillis = item.duration_millis ?? 0;
  const timestamps = item.snoringAbsoluteTimestamps || item.snoring_absolute_timestamps;
  const graphWidth = screenWidth - (2 * GRAPH_MARGIN_HORIZONTAL);

  if (!timestamps || timestamps.length === 0 || totalDurationMillis === 0 || item.snoringCount === 0) {
    return (
      <View style={styles.graphPlaceholder}>
        <Text style={styles.detailLabel}>ไม่มีข้อมูลการกรนสำหรับแสดงกราฟ</Text>
      </View>
    );
  }

  const startTime = new Date(timestamps[0]).getTime();
  const endTime   = startTime + totalDurationMillis;

  return (
    <View style={[styles.graphContainer, { height: GRAPH_HEIGHT + 40 }]}>

  <Svg height={GRAPH_HEIGHT} width={graphWidth}>

    {/* เส้นแกน X */}
    <Line
      x1="0"
      y1={GRAPH_HEIGHT - 10}
      x2={graphWidth}
      y2={GRAPH_HEIGHT - 10}
      stroke="#ccc"
      strokeWidth="1"
    />

    <Group>
      {timestamps.map((iso, index) => {
        const t = new Date(iso).getTime();
        const ratio = (t - startTime) / (endTime - startTime);
        const xPos = ratio * graphWidth;
        return (
          <Rect
            key={index}
            x={xPos}
            y={10}
            width={3}
            height={GRAPH_HEIGHT - 25}
            fill="#FF6347"
            onPressIn={() => setTooltip({ x: xPos, time: iso })}
          />
        );
      })}
    </Group>

  </Svg>

  {/* เวลาเริ่ม - เวลาจบ */}
  <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:4 }}>
    <Text style={{ fontSize:11, color:'#666' }}>
      {new Date(timestamps[0]).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}
    </Text>
    <Text style={{ fontSize:11, color:'#666' }}>
      {new Date(timestamps[timestamps.length - 1]).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}
    </Text>
  </View>

  {/* Tooltip เวลา */}
  {tooltip && (
    <View style={{
      position:'absolute',
      left: GRAPH_MARGIN_HORIZONTAL + tooltip.x - 25,
      top:0,
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: 'white',
      borderWidth: 1,
      borderColor: '#666',
      borderRadius: 4
    }}>
      <Text style={{ fontSize: 12, color: '#000' }}>
        {new Date(tooltip.time).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true})}
      </Text>
    </View>
  )}

</View>
  );
}

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
  ? (() => {
      const date = new Date(item.timestamp);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const time = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      return `บันทึกเมื่อ ${day}/${month}/${year} เวลา ${time}`;
    })()
  : 'เวลาไม่ถูกต้อง';
  const durationInSeconds = (item.duration_millis ?? 0) / 1000;
  return (
    <View style={styles.listItemContainer}>
      <TouchableOpacity onPress={() => onToggleExpand(item)}>
        <View style={styles.listItemRow}>
          <Text style={styles.listItemTime}>{displayTime}</Text>
          <MaterialIcons name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={24} color="#556B2F" />
        </View>
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ระยะเวลา:</Text>
            <Text style={styles.detailValue}>
             {formatDuration(item.duration_millis ?? 0)}
            </Text>
        </View>     
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>หยุดหายใจ:</Text>
          <Text style={styles.detailValue}>{item.apneaEventsCount ?? "0"} ครั้ง</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>กรนที่ตรวจพบ:</Text>
          <Text
            style={[
            styles.detailValue,
            item.snoringCount > 0 ? { color: "orange", fontWeight: "bold" } : { color: "#666" }]}>{item.snoringCount ?? "N/A"} ครั้ง</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>ความดังสูงสุด:</Text>
          <Text
            style={[
            styles.detailValue,
            item.loudestSnoreDb === -100
            ? { color: "#666" } 
            : item.loudestSnoreDb >= 40
            ? { color: "red", fontWeight: "bold" } 
            : { color: "green" } ]}>{item.loudestSnoreDb === -100 ? "ไม่มีข้อมูล" : item.loudestSnoreDb.toFixed(2) + " dB"}
          </Text>          
        </View>   
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.playerContainer}>
          <View style={styles.playerTime}>
            <Text style={styles.playerTimeText}>
             {formatDuration((isCurrentItem ? currentPosition : 0) * 1000)} 
            </Text>
            <Text style={styles.playerTimeText}>
             {formatDuration(item.duration_millis ?? 0)} 
            </Text>
          </View>          
          <SnoringGraph item={item} />
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  listItemContainer: {
    backgroundColor: '#ffffffff',
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
  graphContainer: {
    marginTop: 15,
    paddingHorizontal: GRAPH_MARGIN_HORIZONTAL,
    paddingVertical: 10,         
    borderWidth: 2,              
    borderColor: '#007AFF',         
    borderRadius: 8,             
    backgroundColor: '#fff', 
    overflow: 'hidden',
  },
  graphTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    alignSelf: 'center',
  },
  graphTimeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 0,
    marginTop: 2,
  },
  graphPlaceholder: {
    height: GRAPH_HEIGHT + 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginVertical: 15,
    paddingHorizontal: 20,
  }
});