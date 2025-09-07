// SnoringAnalyzer.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import SnoringListItem from './components/RecordingListItem';

export default function SnoringAnalyzer() {
  const [analysisData, setAnalysisData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  // Audio Player State
  const [currentSound, setCurrentSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expandedItem, setExpandedItem] = useState(null);
  const soundRef = useRef(null);

  // Function to generate the list of days for the horizontal filter
  const generateDayList = () => {
    const days = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];
    const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const dayList = [{ dayAbbr: 'All', dayFull: 'All', date: 'All' }];

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dayAbbr = days[date.getDay()];
      const dayFull = fullDayNames[date.getDay()];
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      dayList.push({ dayAbbr, dayFull, date: formattedDate });
    }
    return dayList;
  };
  const dayList = generateDayList();
  const todayFormattedDate = dayList[1].date;

  useFocusEffect(
    useCallback(() => {
      const loadAnalysisData = async () => {
        setIsLoading(true);
        try {
          const data = await AsyncStorage.getItem('snoring_analysis');
          if (data) {
            const parsedData = JSON.parse(data);
            setAnalysisData(parsedData);
            
            const todayData = parsedData.filter(item => item.date === todayFormattedDate);
            if (todayData.length === 0) {
              setSelectedDate('All');
            } else {
              setSelectedDate(todayFormattedDate);
            }
          } else {
            setAnalysisData([]);
            setSelectedDate('All');
          }
        } catch (e) {
          console.error("Failed to load analysis data", e);
          Alert.alert('Error', 'ไม่สามารถโหลดข้อมูลการวิเคราะห์ได้');
        } finally {
          setIsLoading(false);
        }
      };
      loadAnalysisData();
    }, [todayFormattedDate])
  );

  // Audio Playback functions
  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis);
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
        soundRef.current = null;
      }
    }
  };

  const onPlayPause = async (item) => {
    if (!item.fileUri) {
        Alert.alert('ไฟล์เสียงไม่พบ', 'ไม่พบไฟล์เสียงสำหรับรายการนี้');
        return;
    }

    if (soundRef.current === item.fileUri) {
      if (isPlaying) {
        await currentSound.pauseAsync();
      } else {
        await currentSound.playAsync();
      }
    } else {
      if (currentSound) {
        await currentSound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: item.fileUri },
        { shouldPlay: true }
      );
      sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      soundRef.current = item.fileUri;
      setCurrentSound(sound);
    }
  };

  const onSeek = async (value) => {
    if (currentSound) {
      await currentSound.setPositionAsync(value);
    }
  };

  const onToggleExpand = (item) => {
    if (expandedItem && expandedItem.fileUri !== item.fileUri) {
      if (currentSound) {
        currentSound.unloadAsync();
        setCurrentSound(null);
      }
    }
    
    if (expandedItem && expandedItem.fileUri === item.fileUri) {
        setExpandedItem(null);
        if (currentSound) {
          currentSound.unloadAsync();
          setCurrentSound(null);
        }
    } else {
        setExpandedItem(item);
    }
  };

  useEffect(() => {
    return currentSound
      ? () => {
          currentSound.unloadAsync();
        }
      : undefined;
  }, [currentSound]);
  
  const filteredData = analysisData.filter(item => {
    if (selectedDate === 'All') {
      return true;
    }
    return item.date === selectedDate;
  });

  const selectedDayInfo = dayList.find(day => day.date === selectedDate) || {};

  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#556B2F" />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  const renderContent = () => {
    if (filteredData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="analytics" size={100} color="#ccc" />
          <Text style={styles.emptyText}>
            {selectedDate === 'All' ? 'ยังไม่มีข้อมูลการวิเคราะห์' : 'ไม่พบข้อมูลการบันทึกสำหรับวันนี้'}
          </Text>
          {selectedDate !== 'All' && (
            <Text style={styles.emptySubText}>ลองกด 'All' เพื่อดูข้อมูลทั้งหมด</Text>
          )}
        </View>
      );
    }

    return (
      <FlatList
        data={filteredData.reverse()}
        keyExtractor={(item, index) => item.timestamp || index.toString()}
        renderItem={({ item }) => (
          <SnoringListItem
            item={item}
            isPlaying={isPlaying}
            isCurrentItem={soundRef.current === item.fileUri}
            isExpanded={expandedItem && expandedItem.fileUri === item.fileUri}
            onToggleExpand={onToggleExpand}
            onPlayPause={onPlayPause}
            onSeek={onSeek}
            currentPosition={position}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* เพิ่ม View นี้กลับเข้ามาเพื่อสร้างพื้นที่ว่าง */}
      <View style={styles.headerSpacer}></View>

      <View style={styles.dayFilterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={dayList}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.dayCircle,
                selectedDate === item.date && styles.selectedDayCircle,
              ]}
              onPress={() => setSelectedDate(item.date)}
            >
              <Text
                style={[
                  styles.dayText,
                  selectedDate === item.date && styles.selectedDayText,
                ]}
              >
                {item.dayAbbr}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.dayFilterList}
        />
      </View>

      <View style={styles.dayHeaderContainer}>
        <Text style={styles.dayHeader}>{selectedDayInfo.dayFull || 'All'}</Text>
        {selectedDate !== 'All' && (
          <Text style={styles.dateSubtext}>{selectedDate}</Text>
        )}
      </View>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  headerSpacer: {
    height: 40, // ปรับความสูงของพื้นที่ว่างให้เหมาะสม
  },
  dayFilterContainer: {
    height: 60,
    marginBottom: 10,
  },
  dayFilterList: {
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  dayCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  selectedDayCircle: {
    backgroundColor: '#556B2F',
  },
  dayText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
  },
  selectedDayText: {
    color: 'white',
  },
  dayHeaderContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  dayHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  dateSubtext: {
    fontSize: 16,
    color: '#888',
    marginTop: 5,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ccc',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 5,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
});