import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Alert, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

export default function AudioPlayerList() {
  const [recordings, setRecordings] = useState([]);
  const [currentSound, setCurrentSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoadingSound, setIsLoadingSound] = useState(false);
  const [expandedUri, setExpandedUri] = useState(null);
  const soundRef = useRef(null);

  function formatTime(millis) {
    if (millis === null || isNaN(millis)) {
      return "0:00";
    }
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  const loadRecordings = async () => {
    try {
      const storedRecordings = await AsyncStorage.getItem('@audio_recordings');
      if (storedRecordings !== null) {
        setRecordings(JSON.parse(storedRecordings));
      } else {
        setRecordings([]);
      }
    } catch (error) {
      console.error('Failed to load recordings from AsyncStorage', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRecordings();
      return () => {
        if (soundRef.current) {
          soundRef.current.unloadAsync();
          soundRef.current = null;
          setIsPlaying(false);
          setCurrentSound(null);
          setPosition(0);
          setDuration(0);
        }
        setExpandedUri(null);
      };
    }, [])
  );

  const toggleExpand = async (uri) => {
    if (expandedUri === uri) {
      setExpandedUri(null);
      if (currentSound === uri && isPlaying) {
        await stopSound();
      }
    } else {
      setExpandedUri(uri);
      if (currentSound && currentSound !== uri && isPlaying) {
        await stopSound();
      }
      if (currentSound !== uri || !isPlaying) {
        await playSound(uri);
      }
    }
  };

  async function playSound(uri) {
    try {
      setIsLoadingSound(true);
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      }

      console.log('Loading Sound');
      const { sound, status } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      setCurrentSound(uri);
      setIsPlaying(true);
      setIsLoadingSound(false);

      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setDuration(status.durationMillis);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setCurrentSound(null);
            setPosition(0);
            setExpandedUri(null);
          }
        }
      });

      console.log('Playing Sound');
      await sound.playAsync();
    } catch (error) {
      console.error('Failed to play sound', error);
      setIsLoadingSound(false);
      Alert.alert('Error', 'Failed to play sound. The file might be corrupted or missing.');
    }
  }

  async function stopSound() {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      setIsPlaying(false);
      setCurrentSound(null);
      setPosition(0);
      setExpandedUri(null);
    }
  }

  async function pauseSound() {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    }
  }

  async function resumeSound() {
    if (soundRef.current) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  }

  async function seekSound(value) {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(value);
      setPosition(value);
    }
  }

  const deleteRecording = async (uriToDelete) => {
    Alert.alert(
      "ยืนยันการลบ",
      "คุณแน่ใจหรือไม่ว่าต้องการลบบันทึกเสียงนี้?",
      [
        {
          text: "ยกเลิก",
          style: "cancel"
        },
        {
          text: "ลบ",
          onPress: async () => {
            try {
              if (currentSound === uriToDelete && soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                setCurrentSound(null);
                setIsPlaying(false);
                setPosition(0);
                setDuration(0);
              }
              if (expandedUri === uriToDelete) {
                setExpandedUri(null);
              }

              const updatedRecordings = recordings.filter(rec => rec.uri !== uriToDelete);
              setRecordings(updatedRecordings);
              await AsyncStorage.setItem('@audio_recordings', JSON.stringify(updatedRecordings));
              Alert.alert("ลบสำเร็จ", "ไฟล์เสียงถูกลบออกจากรายการแล้ว");
            } catch (error) {
              console.error('Failed to delete recording', error);
              Alert.alert('Error', 'Failed to delete recording. Please try again.');
            }
          }
        }
      ]
    );
  };

  // ฟังก์ชันสำหรับล้างข้อมูลทั้งหมดใน AsyncStorage
  const clearAllRecordings = async () => {
    Alert.alert(
      "ล้างไฟล์เสียงทั้งหมด",
      "คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์เสียงทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้",
      [
        {
          text: "ยกเลิก",
          style: "cancel"
        },
        {
          text: "ล้างทั้งหมด",
          onPress: async () => {
            try {
              await AsyncStorage.clear(); // ล้างข้อมูลทั้งหมดใน AsyncStorage
              setRecordings([]); // ล้างรายการบันทึกใน state
              if (soundRef.current) { // หยุดเสียงที่กำลังเล่นอยู่
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                setCurrentSound(null);
                setIsPlaying(false);
                setPosition(0);
                setDuration(0);
              }
              setExpandedUri(null); // ยุบรายการทั้งหมด
              Alert.alert("ล้างสำเร็จ", "ไฟล์เสียงทั้งหมดถูกลบแล้ว");
            } catch (error) {
              console.error('Failed to clear AsyncStorage', error);
              Alert.alert('Error', 'ไม่สามารถล้างไฟล์เสียงได้');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}> {/* เพิ่ม View สำหรับจัดวางหัวข้อและปุ่ม */}
        <Text style={styles.headerTitle}>ไฟล์เสียง</Text>
        <TouchableOpacity style={styles.clearButton} onPress={clearAllRecordings}>
          <MaterialIcons name="clear-all" size={24} color="#dc3545" />
          <Text style={styles.clearButtonText}>ล้างทั้งหมด</Text>
        </TouchableOpacity>
      </View>

      {recordings.length === 0 ? (
        <View style={styles.noRecordingsContainer}>
          <MaterialIcons name="audiotrack" size={60} color="#ccc" />
          <Text style={styles.noRecordingsText}>
            ยังไม่มีไฟล์เสียงที่บันทึกไว้
          </Text>
          <Text style={styles.noRecordingsSubText}>
            ไปที่หน้า "หน้าหลัก" เพื่อบันทึกเสียงแรกของคุณ
          </Text>
        </View>
      ) : (
        <FlatList
          data={recordings}
          keyExtractor={(item, index) => item.uri || index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.recordingItem,
                expandedUri === item.uri && styles.recordingItemExpanded
              ]}
              onPress={() => toggleExpand(item.uri)}
              activeOpacity={0.8}
            >
              <View style={styles.recordingHeader}>
                <Text style={styles.recordingText}>{item.name}</Text>
                <Text style={styles.recordingDurationText}>
                  {item.durationMillis ? formatTime(item.durationMillis) : '0:00'}
                </Text>
              </View>

              {expandedUri === item.uri && (
                <>
                  <View style={styles.controls}>
                    {isLoadingSound && currentSound === item.uri ? (
                      <ActivityIndicator size="small" color="#6200ee" />
                    ) : (
                      <TouchableOpacity
                        style={styles.controlButton}
                        onPress={() => {
                          if (currentSound === item.uri && isPlaying) {
                            pauseSound();
                          } else {
                            playSound(item.uri);
                          }
                        }}
                      >
                        <MaterialIcons
                          name={currentSound === item.uri && isPlaying ? 'pause' : 'play-arrow'}
                          size={24}
                          color="#6200ee"
                        />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.controlButton} onPress={stopSound}>
                      <MaterialIcons name="stop" size={24} color="#6200ee" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.controlButton, styles.deleteButton]}
                      onPress={() => deleteRecording(item.uri)}
                    >
                      <MaterialIcons name="delete" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                  {currentSound === item.uri && (
                    <>
                      <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={duration}
                        value={position}
                        onSlidingComplete={seekSound}
                        minimumTrackTintColor="#6200ee"
                        maximumTrackTintColor="#ccc"
                        thumbTintColor="#6200ee"
                      />
                      <Text style={styles.timeText}>
                        {formatTime(position)} / {formatTime(duration)}
                      </Text>
                    </>
                  )}
                </>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.flatListContentContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 10,
  },
  headerContainer: { // New style for header and clear button
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10, // Match FlatList item padding
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    // Removed alignSelf and paddingLeft as it's now in headerContainer
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#ffebee', // Light red background
    borderWidth: 1,
    borderColor: '#dc3545', // Red border
  },
  clearButtonText: {
    color: '#dc3545',
    fontSize: 14,
    marginLeft: 5,
    fontWeight: 'bold',
  },
  flatListContentContainer: {
    paddingBottom: 20,
    paddingTop: 5,
  },
  noRecordingsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noRecordingsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
  },
  noRecordingsSubText: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
    textAlign: 'center',
  },
  recordingItem: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 15,
    marginVertical: 8,
    backgroundColor: 'white',
    borderRadius: 15,
    width: screenWidth * 0.9,
    alignSelf: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  recordingItemExpanded: {
    paddingBottom: 20,
  },
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 5,
  },
  recordingText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    flexShrink: 1,
    marginRight: 10,
  },
  recordingDurationText: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'normal',
  },
  slider: {
    width: '95%',
    height: 40,
    marginVertical: 10,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '95%',
    marginTop: 10,
    marginBottom: 5,
  },
  controlButton: {
    padding: 10,
    borderRadius: 30,
    backgroundColor: '#e0e0e0',
    elevation: 4,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});
