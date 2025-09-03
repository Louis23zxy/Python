// AudioRecorder.js

import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system'; // <-- Import ไลบรารีนี้

export default function AudioRecorder() {
  const [recording, setRecording] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingIntervalRef = useRef(null);

  function formatTime(millis) {
    if (millis === null || isNaN(millis)) {
      return "0:00";
    }
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access microphone is required to record audio.');
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    })();
  }, []);

  const saveRecordingToStorage = async (newRecordingItem) => {
    try {
      const storedRecordings = await AsyncStorage.getItem('@audio_recordings');
      let recordingsArray = storedRecordings ? JSON.parse(storedRecordings) : [];
      recordingsArray.push(newRecordingItem);
      await AsyncStorage.setItem('@audio_recordings', JSON.stringify(recordingsArray));
      console.log('Recording saved to AsyncStorage');
    } catch (error) {
      console.error('Failed to save recording to AsyncStorage', error);
      throw error;
    }
  };

  const uploadRecording = async (uri, recordingName, durationMillis) => {
    console.log('Preparing to upload recording...');
    
    // *** แก้ไขตรงนี้: ใช้ FileSystem เพื่ออ่านไฟล์และส่งเป็น Base64 String ***
    try {
        const fileBase64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        const requestBody = {
            name: recordingName,
            durationMillis: durationMillis,
            fileBase64: fileBase64,
        };
        
        console.log('Uploading to backend...');
        const response = await fetch('http://172.16.16.21:5000/upload-recording', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
  
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
  
        const result = await response.json();
        console.log('Upload successful:', result);
        Alert.alert('บันทึกสำเร็จ', `บันทึกเสียง "${recordingName}" ถูกบันทึกบน Server แล้ว`);
        return result;

    } catch (error) {
        console.error('Failed to upload recording', error);
        Alert.alert('Error', 'ไม่สามารถอัปโหลดไฟล์เสียงได้ โปรดลองอีกครั้ง');
        throw error;
    }
  };

  async function startRecording() {
    try {
      console.log('Starting recording..');
      const { status } = await Audio.getPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access microphone is required to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setRecordingDuration(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prevDuration => prevDuration + 1000);
      }, 1000);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  }

  async function stopRecording() {
    console.log('Stopping recording..');
    clearInterval(recordingIntervalRef.current);

    if (recording) {
      let recordingStatus;
      try {
        recordingStatus = await recording.getStatusAsync();
        await recording.stopAndUnloadAsync();

        const uri = recording.getURI();
        const durationMillis = recordingStatus && recordingStatus.durationMillis ? recordingStatus.durationMillis : 0;

        console.log('Recording stopped and stored at', uri);

        const now = new Date();
        const recordingName = `บันทึกเสียง ${now.toLocaleDateString('th-TH')} ${now.toLocaleTimeString('th-TH')}`;
        const newRecordingItem = { uri, name: recordingName, durationMillis: durationMillis };

        await saveRecordingToStorage(newRecordingItem);
        await uploadRecording(uri, recordingName, durationMillis);
        
      } catch (err) {
        console.error('Failed to stop recording', err);
        Alert.alert('Error', 'Failed to stop recording. Please try again.');
      } finally {
        setRecording(null);
      }
    } else {
      console.warn('No active recording to stop.');
      setRecording(null);
    }
  }

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.recordButton}
        onPress={recording ? stopRecording : startRecording}
      >
        <MaterialIcons name={recording ? 'stop' : 'fiber-manual-record'} size={24} color="white" />
        <Text style={styles.recordButtonText}>
          {recording ? 'หยุดบันทึก' : 'เริ่มบันทึก'}
        </Text>
      </TouchableOpacity>

      {recording && (
        <Text style={styles.recordingTimer}>
          กำลังบันทึก: {formatTime(recordingDuration)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6200ee',
    padding: 20,
    borderRadius: 50,
    marginBottom: 30,
    elevation: 5,
    width: 200,
  },
  recordButtonText: {
    color: 'white',
    fontSize: 18,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  recordingTimer: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
});