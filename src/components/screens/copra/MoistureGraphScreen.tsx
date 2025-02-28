import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Reading {
  _id: string;
  moistureLevel: number;
  status: string;
  startTime: string;
  endTime: string;
  dryingTime: number;
  weatherConditions: {
    temperature: number;
    humidity: number;
  };
  notes?: string;
}

interface RouteParams {
  batchId: string;
  readings: Reading[];
}

// Constants for optimal moisture range
const OPTIMAL_MIN = 6;
const OPTIMAL_MAX = 8;

export const MoistureGraphScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { batchId, readings } = route.params as RouteParams;
  const [isLoading, setIsLoading] = useState(false);
  const [targetMoisture, setTargetMoisture] = useState(7); // Default optimal moisture

  // Sort readings by date
  const sortedReadings = [...readings].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Prepare data for line chart
  const prepareChartData = () => {
    const labels = sortedReadings.map(reading => formatDate(reading.startTime));
    const moistureData = sortedReadings.map(reading => reading.moistureLevel);
    
    // Add projection line to target moisture
    const lastReading = sortedReadings[sortedReadings.length - 1];
    if (lastReading && lastReading.moistureLevel > targetMoisture) {
      // Add projection point if current moisture is above target
      labels.push('Projected');
      moistureData.push(targetMoisture);
    }

    return {
      labels,
      datasets: [
        {
          data: moistureData,
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          strokeWidth: 2,
        },
        {
          data: Array(labels.length).fill(OPTIMAL_MIN),
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 1,
          withDots: false,
        },
        {
          data: Array(labels.length).fill(OPTIMAL_MAX),
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 1,
          withDots: false,
        },
      ],
      legend: ['Moisture Level', 'Min Optimal', 'Max Optimal'],
    };
  };

  const chartData = prepareChartData();

  // Calculate time to reach target moisture
  const calculateTimeToTarget = () => {
    if (sortedReadings.length < 2) {
      return 'Need more data points to estimate';
    }

    const latestReading = sortedReadings[sortedReadings.length - 1];
    const secondLatestReading = sortedReadings[sortedReadings.length - 2];
    
    // Calculate drying rate per hour
    const moistureDiff = secondLatestReading.moistureLevel - latestReading.moistureLevel;
    const timeDiffMs = new Date(latestReading.startTime).getTime() - 
                        new Date(secondLatestReading.startTime).getTime();
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
    
    if (timeDiffHours <= 0 || moistureDiff <= 0) {
      return 'No consistent drying pattern detected';
    }
    
    const dryingRatePerHour = moistureDiff / timeDiffHours;
    
    // Calculate remaining time
    const moistureToLose = latestReading.moistureLevel - targetMoisture;
    if (moistureToLose <= 0) {
      return 'Target moisture already reached';
    }
    
    const hoursToTarget = moistureToLose / dryingRatePerHour;
    
    if (hoursToTarget < 1) {
      return `Approximately ${Math.round(hoursToTarget * 60)} minutes`;
    } else {
      const hours = Math.floor(hoursToTarget);
      const minutes = Math.round((hoursToTarget - hours) * 60);
      return `Approximately ${hours} hours ${minutes > 0 ? `and ${minutes} minutes` : ''}`;
    }
  };

  // Render chart
  const renderChart = () => {
    return (
      <LineChart
        data={chartData}
        width={width - 32}
        height={220}
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#007AFF',
          },
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
        fromZero={false}
        segments={5}
        formatYLabel={(value) => `${value}%`}
      />
    );
  };

  // Set target moisture functions
  const decreaseTarget = () => {
    if (targetMoisture > 4) {
      setTargetMoisture(targetMoisture - 0.5);
    }
  };

  const increaseTarget = () => {
    if (targetMoisture < 14) {
      setTargetMoisture(targetMoisture + 0.5);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Moisture Trend Analysis</Text>
          <Text style={styles.subtitle}>
            Tracking moisture levels over time for batch #{batchId.slice(-6)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Moisture Level Trend</Text>
          {renderChart()}
          <Text style={styles.chartNote}>
            Green lines indicate optimal moisture range (6-8%)
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Target Moisture Settings</Text>
          <View style={styles.targetContainer}>
            <TouchableOpacity onPress={decreaseTarget} style={styles.targetButton}>
              <Ionicons name="remove" size={24} color="#007AFF" />
            </TouchableOpacity>
            <View style={styles.targetValueContainer}>
              <Text style={styles.targetValue}>{targetMoisture}%</Text>
              <Text style={styles.targetLabel}>Target Moisture</Text>
            </View>
            <TouchableOpacity onPress={increaseTarget} style={styles.targetButton}>
              <Ionicons name="add" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Drying Projections</Text>
          <View style={styles.statRow}>
            <MaterialCommunityIcons name="timer-sand" size={24} color="#FF9800" />
            <View style={styles.statTextContainer}>
              <Text style={styles.statLabel}>Estimated Time to Target:</Text>
              <Text style={styles.statValue}>{calculateTimeToTarget()}</Text>
            </View>
          </View>
          <View style={styles.statRow}>
            <MaterialCommunityIcons name="trending-down" size={24} color="#4CAF50" />
            <View style={styles.statTextContainer}>
              <Text style={styles.statLabel}>Current Moisture:</Text>
              <Text style={styles.statValue}>
                {sortedReadings.length > 0 
                  ? `${sortedReadings[sortedReadings.length - 1].moistureLevel}%` 
                  : 'No readings available'
                }
              </Text>
            </View>
          </View>
          <View style={styles.statRow}>
            <MaterialCommunityIcons name="target" size={24} color="#007AFF" />
            <View style={styles.statTextContainer}>
              <Text style={styles.statLabel}>Moisture to Lose:</Text>
              <Text style={styles.statValue}>
                {sortedReadings.length > 0 
                  ? `${Math.max(0, (sortedReadings[sortedReadings.length - 1].moistureLevel - targetMoisture).toFixed(1))}%` 
                  : 'No readings available'
                }
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 16,
    marginTop: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  chartNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  targetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  targetButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetValueContainer: {
    alignItems: 'center',
  },
  targetValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
  },
  targetLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
