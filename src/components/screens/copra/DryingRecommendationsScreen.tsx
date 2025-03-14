import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

interface RouteParams {
  batchId: string;
  currentMoisture: number;
  targetMoisture: number;
  status: string;
  weatherConditions: {
    temperature: number;
    humidity: number;
  };
}

export const DryingRecommendationsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { 
    batchId, 
    currentMoisture, 
    targetMoisture, 
    status, 
    weatherConditions 
  } = route.params as RouteParams;

  // Get recommendations based on current status and conditions
  const getDryingRecommendations = () => {
    const { temperature, humidity } = weatherConditions;
    const isHighHumidity = humidity > 70;
    const isLowTemperature = temperature < 25; // Celsius
    
    if (status === 'newly_harvested') {
      return [
        {
          title: 'Initial Drying Setup',
          icon: 'sun-wireless',
          description: 'Spread the copra evenly on drying mats or platforms in a single layer to maximize exposure.',
          iconColor: '#FF9800',
        },
        {
          title: 'Air Circulation',
          icon: 'fan',
          description: 'Ensure adequate ventilation to accelerate the initial high-moisture evaporation phase.',
          iconColor: '#03A9F4',
        },
        {
          title: 'Sun Exposure',
          icon: 'weather-sunny',
          description: isHighHumidity ? 
            'Due to high humidity, increase drying time and use artificial heat sources if available.' : 
            'Direct sunlight is optimal for newly harvested copra. Aim for 6-8 hours of sun exposure daily.',
          iconColor: '#FF9800',
        },
        {
          title: 'First Turn',
          icon: 'rotate-3d-variant',
          description: 'Turn the copra after 4-5 hours to ensure even drying on all surfaces.',
          iconColor: '#9C27B0',
        },
        {
          title: 'Protection',
          icon: 'weather-night',
          description: 'Cover the copra during night time or unexpected rainfall to prevent moisture reabsorption.',
          iconColor: '#3F51B5',
        },
      ];
    } else if (status === 'Moderate_level') {
      return [
        {
          title: 'Controlled Drying',
          icon: 'thermometer',
          description: isLowTemperature ? 
            'Current temperatures are lower than optimal. Consider using kiln drying to supplement natural drying.' : 
            'Maintain consistent drying conditions. The rate of moisture loss slows at this stage.',
          iconColor: '#E91E63',
        },
        {
          title: 'Regular Turning',
          icon: 'sync',
          description: 'Turn the copra every 2-3 hours to prevent uneven drying and potential mold growth in pockets of higher moisture.',
          iconColor: '#4CAF50',
        },
        {
          title: 'Moisture Monitoring',
          icon: 'water-percent',
          description: 'Check moisture levels twice daily. The optimal target range is 6-8%.',
          iconColor: '#00BCD4',
        },
        {
          title: 'Spatial Arrangement',
          icon: 'grid',
          description: 'Rearrange copra to ensure pieces from the center are moved to the edges and vice versa.',
          iconColor: '#8BC34A',
        },
        {
          title: 'Heat Management',
          icon: 'heat-wave',
          description: isHighHumidity ? 
            'With high humidity conditions, consider extending drying time and using fans to improve air circulation.' : 
            'Optimal drying temperature is between 30-35°C (86-95°F). Higher temperatures may cause quality loss.',
          iconColor: '#FF5722',
        },
      ];
    }
    
    return []; // Default if somehow status isn't recognized
  };

  const recommendations = getDryingRecommendations();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Drying Recommendations</Text>
          <Text style={styles.subtitle}>
            Optimized for batch #{batchId.slice(-6)} based on current conditions
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <MaterialCommunityIcons 
              name="water-percent-alert" 
              size={28} 
              color="#007AFF" 
            />
            <Text style={styles.statusTitle}>Current Status</Text>
          </View>
          <View style={styles.statusDetailsContainer}>
            <View style={styles.statusDetail}>
              <Text style={styles.statusLabel}>Current Moisture:</Text>
              <Text style={styles.statusValue}>{currentMoisture}%</Text>
            </View>
            <View style={styles.statusDetail}>
              <Text style={styles.statusLabel}>Target Moisture:</Text>
              <Text style={styles.statusValue}>{targetMoisture}%</Text>
            </View>
            <View style={styles.statusDetail}>
              <Text style={styles.statusLabel}>Weather:</Text>
              <Text style={styles.statusValue}>
                {weatherConditions.temperature}°C, {weatherConditions.humidity}% humidity
              </Text>
            </View>
            <View style={styles.statusDetailFull}>
              <Text style={styles.statusLabel}>Drying Status:</Text>
              <View style={[styles.statusBadge, getStatusBadgeStyle(status)]}>
                <Text style={styles.statusBadgeText}>{formatStatus(status)}</Text>
              </View>
            </View>
          </View>
        </View>

        {recommendations.map((recommendation, index) => (
          <View key={index} style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <MaterialCommunityIcons 
                name={recommendation.icon} 
                size={24} 
                color={recommendation.iconColor} 
              />
              <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
            </View>
            <Text style={styles.recommendationDescription}>
              {recommendation.description}
            </Text>
          </View>
        ))}

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialCommunityIcons name="information" size={24} color="#007AFF" />
            <Text style={styles.infoTitle}>Quality Reminders</Text>
          </View>
          <Text style={styles.infoText}>
            • Proper drying is critical for oil quality and yield{'\n'}
            • Target moisture 6-8% for optimal oil extraction{'\n'}
            • Avoid over-drying as it can reduce oil yields{'\n'}
            • Protect from contamination during the drying process{'\n'}
            • Monitor for any signs of mold or pests
          </Text>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.doneButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.doneButtonText}>Return to Moisture Graph</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// Helper functions
const formatStatus = (status: string): string => {
  switch (status) {
    case 'newly_harvested':
      return 'Newly Harvested';
    case 'Moderate_level':
      return 'Moderate Moisture';
    case 'dryed':
      return 'Dried';
    case 'over_dryed':
      return 'Over Dried';
    default:
      return status;
  }
};

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'newly_harvested':
      return { backgroundColor: '#FF9800' }; // Orange
    case 'Moderate_level':
      return { backgroundColor: '#2196F3' }; // Blue
    case 'dryed':
      return { backgroundColor: '#4CAF50' }; // Green
    case 'over_dryed':
      return { backgroundColor: '#F44336' }; // Red
    default:
      return { backgroundColor: '#9E9E9E' }; // Grey
  }
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
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  statusDetailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  statusDetail: {
    width: '50%',
    marginBottom: 12,
  },
  statusDetailFull: {
    width: '100%',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  recommendationCard: {
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
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  recommendationDescription: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  infoCard: {
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
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  infoText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  spacer: {
    height: 80,
  },
  doneButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});