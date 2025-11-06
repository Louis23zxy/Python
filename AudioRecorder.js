import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity,Image } from "react-native"; 
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { auth } from './firebase';
import AsyncStorage from "@react-native-async-storage/async-storage";
const LogoImage = require('../assets/Logo.jpg'); 

export default function AudioRecorder() {
  const [recording, setRecording] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [timer, setTimer] = useState(null);
  
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

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

      const newTimer = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
      setTimer(newTimer);

      setStatusMessage("Recording started");
    } catch (err) {
      console.error("Failed to start recording", err);
      setStatusMessage("Failed to start recording.");
    }
  }

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

  async function uploadFile(uri, duration) {
    try {
      setStatusMessage("Uploading and analyzing audio...");
      
      const fileBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const user = auth.currentUser;
        if (!user) {
         Alert.alert("Error", "User not logged in. Cannot save data.");
         setStatusMessage("Error: User not logged in.");
         return;
        }
      const FLASK_SERVER_URL = "http://172.16.16.12:5000"; 

      const response = await fetch(`${FLASK_SERVER_URL}/analyze-audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
      }setStatusMessage("Upload complete! Refreshing your profile data...");   
      let existingData = await AsyncStorage.getItem("snoring_analysis");
      existingData = existingData ? JSON.parse(existingData) : [];

      const today = new Date(result.created_at || Date.now());
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
        duration: duration,
        fileUri: uri, 
        snoringCount: result.snoring_count, 
        loudestSnoreDb: result.loudest_snore_db, 
        serverFileUrl: result.file_url, 
        snoringAbsoluteTimestamps: result.snoring_absolute_timestamps || [],
        duration_millis: duration * 1000,
      });

      await AsyncStorage.setItem("snoring_analysis", JSON.stringify(existingData));

    } catch (error) {
      console.error("Upload error:", error);
      setStatusMessage(" Upload failed. Check server IP/Firewall or network connection.");
    }
  }

  return (
    <View style={styles.container}>
       <View style={styles.logoContainer}>
                      <Image 
                            source={LogoImage} 
                            style={styles.logo}
                      />
                  </View>
      <TouchableOpacity
        style={[recording ? styles.stopButton : styles.startButton,styles.floatingButton]}
         onPress={recording ? stopRecording : startRecording}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {recording ? "หยุดอัดเสียง" : "เริ่มอัดเสียง"}
        </Text>
      </TouchableOpacity>     
      <Text style={styles.status}>{statusMessage}</Text>
      {recording && <Text style={styles.timer}>Recording: {formatTime(recordingDuration)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  // สีหลักของแอป
  primaryColor: "#007AFF", 
  
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#7db3ecff", 
    padding: 20,
  },
  startButton: {
    backgroundColor: "#007AFF", 
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8, 
  },
  stopButton: {
    backgroundColor: "#FF3B30", 
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: {
    color: "#FFFFFF", 
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  status: {
    marginTop: 30,
    fontSize: 18,
    fontWeight: "600",
    color: "#1F4E79", 
    textAlign: "center",
  },
  timer: {
    marginTop: 15,
    fontSize: 16,
    color: "#5E5E5E", 
    fontWeight: "500",
  },
  floatingButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width:  300, 
    height: 300,
    borderRadius: 50,
    borderWidth: 4, 
    borderColor: '#FFFFFF', 
    opacity: 0.3,
  },
});