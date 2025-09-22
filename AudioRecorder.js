// AudioRecorder.js

import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

// กำหนด URL ของเซิร์ฟเวอร์
// หมายเหตุ: ใช้ IP Address ที่ถูกต้องของคอมพิวเตอร์คุณ
// ถ้าใช้มือถือจริง: ควรเป็น http://<your_local_ip>:5000
// ถ้าใช้ Emulator: http://localhost:5000
const SERVER_URL = 'http://172.16.16.21:5000/upload-and-analyze'; 

export default function AudioRecorder() {
  const [recording, setRecording] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingIntervalRef = useRef(null);
  const audioRecorderRef = useRef(null);

  function formatTime(millis) {
    if (millis === null || isNaN(millis)) {
      return "0:00";
    }
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
  
  // ฟังก์ชันใหม่สำหรับบันทึกข้อมูลการวิเคราะห์
  const saveAnalysisData = async (durationMillis, fileUri, serverUri = null) => {
    try {
      const date = new Date();
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      
      const newAnalysis = {
        id: Date.now().toString(),
        timestamp: date.toISOString(),
        duration: durationMillis,
        fileUri: fileUri,
        serverUri: serverUri,
        date: formattedDate,
        snoringEventsCount: 0,
        apneaEventsCount: 0,
      };

      const existingData = await AsyncStorage.getItem('snoring_analysis');
      const analysisList = existingData ? JSON.parse(existingData) : [];
      
      const updatedList = [...analysisList, newAnalysis];
      await AsyncStorage.setItem('snoring_analysis', JSON.stringify(updatedList));

      Alert.alert(
        'บันทึกสำเร็จ!',
        `บันทึกเสียงและข้อมูลถูกเก็บไว้ในเครื่องแล้ว ${serverUri ? 'และอัปโหลดขึ้นเซิร์ฟเวอร์แล้ว' : ''}`
      );
    } catch (e) {
      console.error("Failed to save analysis data", e);
      Alert.alert('Error', 'ไม่สามารถบันทึกข้อมูลการวิเคราะห์ได้');
    }
  };

  // NEW: แก้ไขฟังก์ชันการอัปโหลดไฟล์ให้ใช้ Base64 และ fetch
  const uploadAudioFile = async (fileUri, durationMillis) => {
    try {
        // 1. อ่านไฟล์เสียงให้เป็น Base64 string
        const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // 2. เตรียมข้อมูลที่จะส่งไปในรูปแบบ JSON
        const requestBody = {
            name: `Recording_${Date.now()}`,
            durationMillis: durationMillis,
            fileBase64: fileBase64,
        };

        // 3. ส่งคำขอ POST ด้วย fetch
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (response.ok) {
            const responseData = await response.json();
            console.log('Upload successful', responseData);
            return responseData.url; // เซิร์ฟเวอร์ควรส่ง URL ของไฟล์ที่บันทึกกลับมา
        } else {
            const errorBody = await response.text();
            console.error('Server responded with an error:', response.status, errorBody);
            Alert.alert('Upload Failed', `ไม่สามารถอัปโหลดไฟล์ไปยังเซิร์ฟเวอร์ได้: ${response.status} ${errorBody}`);
            return null;
        }

    } catch (error) {
        console.error('Error uploading file:', error);
        Alert.alert('Upload Error', `เกิดข้อผิดพลาดในการอัปโหลด: ${error.message}`);
        return null;
    }
  };

  async function startRecording() {
    try {
      if (Platform.OS === 'android') {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: true,
        });
      } else {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      audioRecorderRef.current = recording; // Store ref
      setRecordingDuration(0);
      
      // Start the timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prevDuration => prevDuration + 1000);
      }, 1000);

      Alert.alert('เริ่มบันทึกแล้ว', 'กำลังบันทึกเสียง...', [{ text: 'OK' }]);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Recording Error', 'ไม่สามารถเริ่มการบันทึกได้');
    }
  }

  async function stopRecording() {
    console.log('Stopping recording..');
    
    // Clear the timer
    if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
    }

    if (!recording) {
      console.warn('No active recording to stop.');
      setRecording(null);
      return;
    }
    
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    console.log('Recording stopped and stored at', uri);
    
    const duration = recordingDuration; // Use the state variable for final duration
    setRecording(null);
    audioRecorderRef.current = null;
    
    let serverUri = null;
    if (uri) {
        console.log('Uploading file to server...');
        serverUri = await uploadAudioFile(uri, duration); // Pass duration to the function
    }

    // Pass the server URI to the save function
    await saveAnalysisData(duration, uri, serverUri);
  }

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stopAndUnloadAsync();
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
    marginBottom: 20,
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
    color: '#333',
  },
});