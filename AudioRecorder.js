import React, { useState, useEffect } from "react";
// เปลี่ยนจาก Button เป็น TouchableOpacity เพื่อให้ปรับแต่งสไตล์ได้
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native"; 
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { auth } from './firebase';
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AudioRecorder() {
  const [recording, setRecording] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [timer, setTimer] = useState(null);
  
  // Helper function to format time
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // ฟังก์ชันเริ่มอัดเสียง
  async function startRecording() {
    try {
      console.log("Requesting permissions..");
      await Audio.requestPermissionsAsync();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log("Starting recording..");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setRecordingDuration(0);

      // เริ่มจับเวลา
      const newTimer = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
      setTimer(newTimer);

      setStatusMessage("Recording started");
      // ไม่ใช้ Alert เพื่อไม่ให้ขัดจังหวะผู้ใช้
      // Alert.alert("Recording", "Recording has started."); 
    } catch (err) {
      console.error("Failed to start recording", err);
      setStatusMessage("Failed to start recording.");
    }
  }

  // ฟังก์ชันหยุดอัดเสียง
  async function stopRecording() {
    console.log("Stopping recording..");
    if (!recording) return;

    clearInterval(timer);
    setTimer(null);

    await recording.stopAndUnloadAsync();
    const status = await recording.getStatusAsync();
    const durationSeconds = Math.floor(status.durationMillis / 1000);

    const uri = recording.getURI();
    console.log("Recording stopped and stored at", uri);

    setRecording(null);
    setStatusMessage("Stopping recording...");

    await uploadFile(uri, durationSeconds);
  }

  // ฟังก์ชันอัปโหลดไฟล์ไป Flask
  async function uploadFile(uri, duration) {
    try {
      setStatusMessage("🚀 Uploading and analyzing audio...");
      
      const fileBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const user = auth.currentUser;
        if (!user) {
         // ใช้ Alert เฉพาะกรณีเกิด Error ร้ายแรง
         Alert.alert("Error", "User not logged in. Cannot save data.");
         setStatusMessage("Error: User not logged in.");
         return;
        }
        
      // ✅ แก้ไข: ใช้ IP Address จริงของคุณ 172.16.16.12
      const FLASK_SERVER_URL = "http://172.16.16.12:5000"; 

      const response = await fetch(`${FLASK_SERVER_URL}/analyze-audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // ใช้ key audio_data ตามที่ Flask คาดหวัง
          audio_data : fileBase64, 
          name: `Recording_${Date.now()}`,
          user_uid: user.uid, 
          duration_millis: duration * 1000
        }),
      });

      const result = await response.json();
      console.log("Analysis result:", result);

      if (response.status !== 200) {
        setStatusMessage(`Server Error: ${result.message || 'Unknown Error'}`);
        return;
      }setStatusMessage("✅ Upload complete! Refreshing your profile data...");
         
      // ✅ เก็บผลการวิเคราะห์ลง AsyncStorage
      let existingData = await AsyncStorage.getItem("snoring_analysis");
      existingData = existingData ? JSON.parse(existingData) : [];

      const today = new Date(result.created_at || Date.now()); // ใช้ created_at จาก server ถ้ามี
      const formattedDate = `${today.getDate().toString().padStart(2, "0")}/${(
        today.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${today.getFullYear()}`;

      existingData.push({
        id: result.id,
        name: result.name || `Recording_${Date.now()}`,
        date: formattedDate,
        timestamp: today.toISOString(),
        duration: duration, // ⏱ ระยะเวลาอัดเสียง (วินาที)
        fileUri: uri, // URI ชั่วคราวบนเครื่อง
        snoringCount: result.snoring_count, // ใช้ key ที่ถูกต้องจาก server
        loudestSnoreDb: result.loudest_snore_db, // ใช้ key ที่ถูกต้องจาก server
        serverFileUrl: result.file_url, // URL ของไฟล์บน server
        snoringAbsoluteTimestamps: result.snoring_absolute_timestamps || [],
      });

      await AsyncStorage.setItem("snoring_analysis", JSON.stringify(existingData));

      setStatusMessage(`✅ Analysis complete! Snore Count: ${result.snoring_count}, Max Loudness: ${result.loudest_snore_db} dB`);
    } catch (error) {
      console.error("Upload error:", error);
      // เปลี่ยนข้อความแจ้งเตือนให้ชัดเจนขึ้น
      setStatusMessage("❌ Upload failed. Check server IP/Firewall or network connection.");
    }
  }

  return (
    <View style={styles.container}>
      {/* 🚀 ใช้ TouchableOpacity แทน Button */}
      <TouchableOpacity
        style={recording ? styles.stopButton : styles.startButton}
        onPress={recording ? stopRecording : startRecording}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {recording ? "หยุดอัดเสียง" : "เริ่มอัดเสียง"}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.status}>{statusMessage}</Text>
      {/* แสดงเวลาในรูปแบบ นาที:วินาที */}
      {recording && <Text style={styles.timer}>Recording: {formatTime(recordingDuration)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  // สีหลักของแอป
  primaryColor: "#007AFF", // สีน้ำเงินมาตรฐาน
  
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F8FF", // พื้นหลังสีฟ้าอ่อน
    padding: 20,
  },
  
  // 🌟 สไตล์ปุ่มหลัก (เริ่มอัดเสียง)
  startButton: {
    backgroundColor: "#007AFF", // พื้นหลังสีน้ำเงิน
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30, // ขอบโค้งมน
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8, // สำหรับ Android
  },
  
  // 🔴 สไตล์ปุ่มหยุดอัดเสียง
  stopButton: {
    backgroundColor: "#FF3B30", // พื้นหลังสีแดง
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30, // ขอบโค้งมน
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },

  // สไตล์ข้อความในปุ่ม
  buttonText: {
    color: "#FFFFFF", // ข้อความสีขาว
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  // สไตล์สำหรับข้อความแสดงสถานะ
  status: {
    marginTop: 30,
    fontSize: 18,
    fontWeight: "600",
    color: "#1F4E79", // สีน้ำเงินเข้มขึ้น
    textAlign: "center",
  },
  
  // สไตล์สำหรับตัวจับเวลา
  timer: {
    marginTop: 15,
    fontSize: 16,
    color: "#5E5E5E", // สีเทาเข้ม
    fontWeight: "500",
  },
});
