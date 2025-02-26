import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { copraApi } from '../../../api/copraApi';
import { getMoistureStatus } from '../../../utils/moistureHelper';

const { width } = Dimensions.get('window');

export const CreateReadingScreen = () => {
  
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    batchId: '',
    deviceId: '',
    moistureLevel: '',
    startTime: new Date(),
    notes: '',
  });
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [status, setStatus] = useState('');
  const [predictionResult, setPredictionResult] = useState<{
    dryingTime: number;
    success: boolean;
  } | null>(null);

  // Replace useLayoutEffect with direct navigation button
  const navigateToAllBatches = () => {
    navigation.navigate('AllBatches');
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for weather data');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const handleMoistureLevelChange = (value: string) => {
    setFormData(prev => ({ ...prev, moistureLevel: value }));
    const moistureLevel = parseFloat(value);
    if (!isNaN(moistureLevel)) {
      setStatus(getMoistureStatus(moistureLevel));
    }
  };

  const handlePredictDryingTime = async () => {
    if (!formData.batchId || !formData.moistureLevel) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      if (!location) {
        Alert.alert('Error', 'Location data is not available');
        return;
      }

      const params = {
        ...formData,
        moistureLevel: parseFloat(formData.moistureLevel),
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        startTime: formData.startTime,
        status,
      };

      const response = await copraApi.createReading(params);
      setPredictionResult({
        dryingTime: response.data.dryingTime,
        success: true,
      });

      setTimeout(() => {
        navigation.navigate('BatchHistory', {
          batchId: formData.batchId,
          readingData: response.data
        });
      }, 2000);
    } catch (error) {
      setPredictionResult({
        dryingTime: 0,
        success: false,
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <ScrollView style={styles.container}>
      {/* Add View All Batches Button at the top */}
      <TouchableOpacity 
        onPress={navigateToAllBatches}
        style={styles.viewBatchesButton}
      >
        <MaterialIcons name="list" size={24} color="#fff" />
        <Text style={styles.viewBatchesText}>View All Batches</Text>
      </TouchableOpacity>

      <View style={styles.form}>
        <View style={styles.header}>
          <MaterialIcons name="data-usage" size={24} color="#007AFF" />
          <Text style={styles.headerText}>New Copra Reading</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Batch ID *</Text>
          <TextInput
            style={styles.input}
            value={formData.batchId}
            onChangeText={(value) => setFormData(prev => ({ ...prev, batchId: value }))}
            placeholder="Enter Batch ID"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Device ID (Optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.deviceId}
            onChangeText={(value) => setFormData(prev => ({ ...prev, deviceId: value }))}
            placeholder="Enter Device ID"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Moisture Level (%) *</Text>
          <TextInput
            style={styles.input}
            value={formData.moistureLevel}
            onChangeText={handleMoistureLevelChange}
            keyboardType="numeric"
            placeholder="Enter Moisture Level"
          />
        </View>

        {status && (
          <View style={styles.statusCard}>
            <MaterialIcons name="water-drop" size={24} color="#007AFF" />
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Current Status</Text>
              <Text style={styles.statusText}>{status.replace(/_/g, ' ').toUpperCase()}</Text>
            </View>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(value) => setFormData(prev => ({ ...prev, notes: value }))}
            placeholder="Enter Notes"
            multiline
            numberOfLines={4}
          />
        </View>

        {predictionResult && (
          <View style={[
            styles.predictionCard,
            { backgroundColor: predictionResult.success ? '#E8F5E9' : '#FFEBEE' }
          ]}>
            <MaterialIcons
              name={predictionResult.success ? "check-circle" : "error"}
              size={32}
              color={predictionResult.success ? "#4CAF50" : "#F44336"}
            />
            {predictionResult.success ? (
              <View style={styles.predictionInfo}>
                <Text style={styles.predictionTitle}>Predicted Drying Time</Text>
                <Text style={styles.predictionTime}>
                  {predictionResult.dryingTime.toFixed(1)} hours
                </Text>
              </View>
            ) : (
              <Text style={styles.errorText}>Failed to create reading. Please try again.</Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handlePredictDryingTime}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="timeline" size={24} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Predict Drying Time</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  viewBatchesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7393B3',
    padding: 12,
    borderRadius: 8,
    margin: 16,
    justifyContent: 'center',
    gap: 8,
  },
  viewBatchesText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  form: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginLeft: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusInfo: {
    marginLeft: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  predictionCard: {
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  predictionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  predictionTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  predictionTime: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
  },
  errorText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#F44336',
    flex: 1,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});