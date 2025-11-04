// src/components/StatsSection.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; 

const SERVER_URL = 'http://172.16.16.12:5000'; // 🔹 Flask server

const StatsSection = ({ userUID }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalDays: 0, avgDuration: 0,avgApneaCount: 0, maxSnoreDb: 0 });

  const fetchStats = async () => {
    if (!userUID) return;
    try {
      const res = await fetch(`${SERVER_URL}/get-recording-stats/${userUID}`);
      const data = await res.json();

      if (res.ok) {
        setStats({
          totalDays: data.total_days || 0,
          avgDuration: Number(data.avg_duration) || 0,
          avgApneaCount: Number(data.avg_apnea_count) || 0, 
          maxSnoreDb: Number(data.max_snore_db) || 0,
        });
      } else {
        console.error('Server error:', data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchStats();
    }, [userUID])
  );

  if (isLoading) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>สถิติ</Text>
        <ActivityIndicator color="#007AFF" style={{ marginTop: 10 }} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>สถิติ</Text>
      <View style={styles.row}>
        <Text style={styles.label}>จำนวนวันที่ใช้:</Text>
        <Text style={styles.value}>{stats.totalDays} วัน</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>เวลาเฉลี่ย:</Text>
        <Text style={styles.value}>{stats.avgDuration.toFixed(2)} นาที</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>จำนวนหยุดหายใจเฉลี่ย</Text>
        <Text style={styles.value}>{stats.avgApneaCount.toFixed(2)} ครั้ง</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>เสียงกรนที่ดังที่สุด:</Text>
        <Text
          style={[
            styles.value, 
            stats.maxSnoreDb === 0 
            ? { color: "#666" } 
            : stats.maxSnoreDb >= 40 
            ? { color: "red", fontWeight: "bold" } 
            : { color: "green" }
          ]}
        >
          {stats.maxSnoreDb === 0 ? "ไม่มีข้อมูล" : stats.maxSnoreDb.toFixed(2) + " dB"}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: '#555',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default StatsSection;