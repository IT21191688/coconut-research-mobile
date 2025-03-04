import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { colors } from '../../../constants/colors';
import { getLocationById } from '../../../api/locationApi';
import { Location } from '../../../types';
import { Picker } from '@react-native-picker/picker';
import { yieldApi, YieldPredictionRequest, YieldPredictionResponse } from '../../../api/yieldApi';

type PredictionRouteParams = {
  locationId: string;
  locationName?: string;
};

type PredictionScreenProps = {
  route: RouteProp<Record<string, PredictionRouteParams>, string>;
  navigation: any;
};

type WeatherData = {
  temperature: number;
  humidity: number;
  rainfall: number;
  description: string;
  icon: string;
};

// Update the YieldPrediction type to match the actual response format
type YieldPrediction = {
  year: number;
  average_prediction: number;
  monthly_predictions: {
    confidence_score: number;
    ensemble_prediction: number;
    month: number;
    month_name: string;
    seasonal_factor: number;
    seasonal_prediction: number;
    input_data: {
      humidity: number;
      plant_age: number;
      rainfall: number;
      soil_moisture_10cm: number;
      soil_moisture_20cm: number;
      soil_moisture_30cm: number;
      soil_type: number;
      temperature: number;
      weather_description: string;
    };
    weights: number[];
    _id: string;
  }[];
  status: string;
};

const API_KEY = 'cc9c9becda5d2a32f04ec64f3e0b8dd6';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = [2024, 2025, 2026];

const PredictionScreen: React.FC<PredictionScreenProps> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { locationId, locationName } = route.params;
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<Location | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Yield prediction states
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState(2); // February (1-indexed)
  const [isPredicting, setIsPredicting] = useState(false);
  const [yieldPrediction, setYieldPrediction] = useState<YieldPrediction | null>(null);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  useEffect(() => {
    // Set up the header title with the location name if available
    if (locationName) {
      navigation.setOptions({ title: locationName });
    }

    fetchLocationData();
  }, [locationId]);

  // Function to fetch location data
  const fetchLocationData = async () => {
    try {
      setLoading(true);
      // Fetch location data from API
      const locationData = await getLocationById(locationId);
      setLocation(locationData);
      setLoading(false);

      // Once location data is loaded, fetch weather data
      if (locationData.coordinates) {
        fetchWeatherData(locationData.coordinates.latitude, locationData.coordinates.longitude);
      }
    } catch (err) {
      console.error('Error fetching location data:', err);
      setError('Failed to load location data');
      setLoading(false);
    }
  };

  // Function to fetch weather data
  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      setWeatherLoading(true);

      // Fetch current weather data
      const response = await axios.get(
        `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );

      // Extract relevant weather information
      const weatherData: WeatherData = {
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        rainfall: response.data.rain ? response.data.rain['1h'] || 0 : 0,
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon
      };

      setWeather(weatherData);
      setWeatherLoading(false);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setWeatherLoading(false);
      // Non-critical error, we don't set the main error state
    }
  };

  // Update the predictYield function to use the actual API
  const predictYield = async () => {
    try {
      setIsPredicting(true);

      // Calculate age in years from plantation date
      const plantDate = new Date(location?.plantationDate || new Date());
      const today = new Date();
      const ageInYears = Math.floor(
        (today.getTime() - plantDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
      );

      // Map soil type string to number
      const soilTypeMap: { [key: string]: number } = {
        'Lateritic': 1,
        'Sandy Loam': 2,
        'Cinnamon Sand': 3,
        'Red Yellow Podzolic': 4,
        'Alluvial': 5,
      };

      const soilTypeCode = soilTypeMap[location?.soilType || ''] || 2;

      // Prepare request data
      const requestData: YieldPredictionRequest = {
        year: selectedYear,
        locationId: locationId,
        monthly_data: [
          {
            month: selectedMonth,
            sm_10: 19.89,
            sm_20: 41.67,
            sm_30: 34.82,
            age: ageInYears,
            soil_type: soilTypeCode,
            "Temperature (°C)": weather?.temperature || 0,
            "Humidity (%)": weather?.humidity || 0,
            "Rainfall (mm)": weather?.rainfall || 0,
            "Weather Description": weather?.description || "NaN"
          }
        ]
      };

      // Make the actual API call
      console.log('Predicting yield with data:', JSON.stringify(requestData, null, 2));

      try {
        const response = await yieldApi.predictYield(requestData);
        console.log('API Response:', JSON.stringify(response, null, 2));

        // Process the actual API response
        if (response) {
          setYieldPrediction(response);
          console.log('Prediction data set to state');
        } else {
          console.error('API response is invalid:', response);
          alert('Invalid API response. Please try again.');
        }
      } catch (apiError) {
        console.error('API call failed:', apiError);
        alert('API call failed. Please check your connection and try again.');
      } finally {
        setIsPredicting(false);
      }
    } catch (err) {
      console.error('Error in prediction function:', err);
      setIsPredicting(false);
      alert('Failed to predict yield. Please check your connection and try again.');
    }
  };

  const calculateAge = (plantationDate: Date): string => {
    const plantDate = new Date(plantationDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - plantDate.getTime());
    const years = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));

    if (years === 0) {
      return `${months} months old`;
    }
    return years === 1 ? `${years} year old` : `${years} years old`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('prediction.loading')}</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchLocationData}>
          <Text style={styles.retryButtonText}>{t('prediction.retry')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!location) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Location Info Card */}
        <View style={styles.compactCard}>
          <Text style={styles.compactCardTitle}>{location.name}</Text>
          
          <View style={styles.compactDetailsGrid}>
            <View style={styles.compactDetailItem}>
              <Ionicons name="leaf-outline" size={16} color={colors.primary} />
              <Text style={styles.compactDetailText}>{location.totalTrees} trees</Text>
            </View>
            
            <View style={styles.compactDetailItem}>
              <Ionicons name="resize-outline" size={16} color={colors.primary} />
              <Text style={styles.compactDetailText}>{location.area} acres</Text>
            </View>
            
            <View style={styles.compactDetailItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.compactDetailText}>{calculateAge(location.plantationDate)}</Text>
            </View>
            
            <View style={styles.compactDetailItem}>
              <Ionicons name="earth-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.compactDetailText}>{location.soilType}</Text>
            </View>
          </View>
          
          <View style={styles.thinDivider} />
          
          <View style={styles.compactDetailRow}>
            <Ionicons name="location-outline" size={16} color={colors.error} />
            <Text style={styles.smallDetailText}>
              {`${location.coordinates.latitude.toFixed(4)}, ${location.coordinates.longitude.toFixed(4)}`}
            </Text>
          </View>
        </View>

        {/* Weather Information - Compact Version */}
        <View style={styles.compactCard}>
          {weatherLoading ? (
            <View style={styles.weatherLoadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.weatherLoadingText}>Loading weather data...</Text>
            </View>
          ) : weather ? (
            <View style={styles.compactWeatherContainer}>
              <View style={styles.weatherMain}>
                {weather.icon && (
                  <Image
                    source={{ uri: `https://openweathermap.org/img/wn/${weather.icon}@2x.png` }}
                    style={styles.compactWeatherIcon}
                  />
                )}
                <View>
                  <Text style={styles.compactTemperature}>{Math.round(weather.temperature)}°C</Text>
                  <Text style={styles.compactWeatherDescription}>{weather.description}</Text>
                </View>
              </View>
              
              <View style={styles.compactWeatherDetails}>
                <View style={styles.compactWeatherDetail}>
                  <Ionicons name="water-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.compactWeatherValue}>{weather.humidity}%</Text>
                  <Text style={styles.compactWeatherLabel}>Humidity</Text>
                </View>

                <View style={styles.compactWeatherDetail}>
                  <Ionicons name="rainy-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.compactWeatherValue}>{weather.rainfall} mm</Text>
                  <Text style={styles.compactWeatherLabel}>Rainfall</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.weatherLoadingContainer}>
              <Ionicons name="cloud-offline-outline" size={24} color={colors.textSecondary} />
              <Text style={styles.weatherLoadingText}>Weather data unavailable</Text>
            </View>
          )}
        </View>

        {/* Yield Prediction Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Yield Prediction</Text>

          <View style={styles.pickerRow}>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowYearPicker(true)}
            >
              <Text style={styles.pickerLabel}>Year</Text>
              <View style={styles.pickerValue}>
                <Text style={styles.pickerValueText}>{selectedYear}</Text>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowMonthPicker(true)}
            >
              <Text style={styles.pickerLabel}>Starting Month</Text>
              <View style={styles.pickerValue}>
                <Text style={styles.pickerValueText}>{MONTHS[selectedMonth - 1]}</Text>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.predictButton}
            onPress={predictYield}
            disabled={isPredicting}
          >
            {isPredicting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.predictButtonText}>Predict Yield</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Yield Prediction Results Section */}
        {yieldPrediction && (
          <View style={styles.predictionResultsCard}>
            <View style={styles.predictionHeaderSection}>
              <Text style={styles.predictionResultTitle}>Prediction Results</Text>
              <View style={styles.yearBadge}>
                <Text style={styles.yearBadgeText}>{yieldPrediction.year}</Text>
              </View>
            </View>

            <View style={styles.averagePredictionContainer}>
              <Text style={styles.averagePredictionValue}>
                {yieldPrediction.average_prediction.toFixed(1)}
              </Text>
              <Text style={styles.averagePredictionLabel}>nuts/hec.</Text>
            </View>

            <View style={styles.predictionStatusContainer}>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: yieldPrediction.status === 'success' ? colors.success : colors.warning }
              ]} />
              <Text style={styles.predictionStatusText}>
                {yieldPrediction.status === 'success' ? 'Prediction Successful' : 'Status: ' + yieldPrediction.status}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Monthly Predictions */}
            <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
            {yieldPrediction.monthly_predictions.map((prediction, index) => (
              <View key={index} style={styles.monthlyPredictionContainer}>
                <View style={styles.monthHeader}>
                  <Text style={styles.monthName}>{prediction.month_name}</Text>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceBadgeText}>
                      {Math.round(prediction.confidence_score)}% confidence
                    </Text>
                  </View>
                </View>

                <View style={styles.predictionValuesContainer}>
                  <View style={styles.predictionValueBox}>
                    <Text style={styles.predictionValueAmount}>{prediction.ensemble_prediction.toFixed(1)}</Text>
                    <Text style={styles.predictionValueLabel}>Ensemble</Text>
                  </View>
                  <View style={styles.predictionValueDivider} />
                  <View style={styles.predictionValueBox}>
                    <Text style={styles.predictionValueAmount}>{prediction.seasonal_prediction.toFixed(1)}</Text>
                    <Text style={styles.predictionValueLabel}>Seasonal</Text>
                  </View>
                </View>

                {/* Prediction Factors */}

                <View style={styles.factorsContainer}>
                  <View style={styles.factorRow}>
                    <Text style={styles.factorLabel}>Temperature</Text>
                    <Text style={styles.factorValue}>{prediction.input_data.temperature}°C</Text>
                  </View>
                  <View style={styles.factorRow}>
                    <Text style={styles.factorLabel}>Humidity</Text>
                    <Text style={styles.factorValue}>{prediction.input_data.humidity}%</Text>
                  </View>
                  <View style={styles.factorRow}>
                    <Text style={styles.factorLabel}>Rainfall</Text>
                    <Text style={styles.factorValue}>{prediction.input_data.rainfall} mm</Text>
                  </View>
                  <View style={styles.factorRow}>
                    <Text style={styles.factorLabel}>Plant Age</Text>
                    <Text style={styles.factorValue}>{prediction.input_data.plant_age} years</Text>
                  </View>
                  <View style={styles.factorRow}>
                    <Text style={styles.factorLabel}>Soil Type</Text>
                    <Text style={styles.factorValue}>Type {prediction.input_data.soil_type}</Text>
                  </View>
                  <View style={styles.factorRow}>
                    <Text style={styles.factorLabel}>Seasonal Factor</Text>
                    <Text style={styles.factorValue}>{prediction.seasonal_factor.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Year Picker Modal */}
        <Modal
          visible={showYearPicker}
          transparent
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Year</Text>
                <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <Picker
                selectedValue={selectedYear}
                onValueChange={(value) => setSelectedYear(value)}
              >
                {YEARS.map((year) => (
                  <Picker.Item key={year} label={year.toString()} value={year} />
                ))}
              </Picker>
            </View>
          </View>
        </Modal>

        {/* Month Picker Modal */}
        <Modal
          visible={showMonthPicker}
          transparent
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Month</Text>
                <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <Picker
                selectedValue={selectedMonth}
                onValueChange={(value) => setSelectedMonth(value)}
              >
                {MONTHS.map((month, index) => (
                  <Picker.Item key={index} label={month} value={index + 1} />
                ))}
              </Picker>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

// Updated styles for a more professional and attractive look

const styles = StyleSheet.create({
  // Base containers
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc', // Lighter, more professional background
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Card styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // More rounded corners
    padding: 20, // More generous padding
    marginBottom: 20,
    shadowColor: '#1a44b880', // Slightly blue shadow for depth
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderColor: '#f0f2f5', // Subtle border
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 20, // Larger title
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 20,
    letterSpacing: 0.2, // Slight letter spacing for elegance
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 12,
    fontWeight: '500',
  },
  detailSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: '#eef0f5', // Lighter divider for sophistication
    marginVertical: 10,
  },

  // Weather styles - enhanced
  weatherLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  weatherLoadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 10,
    fontWeight: '500',
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherHeaderText: {
    flex: 1,
  },
  temperature: {
    fontSize: 36, // Larger temperature display
    fontWeight: 'bold',
    color: colors.textPrimary,
    letterSpacing: -1, // Tighter spacing for numbers
  },
  weatherDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    marginTop: 4,
  },
  weatherIcon: {
    width: 90, // Larger icon
    height: 90,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#f9f9fc', // Very subtle background
    borderRadius: 12,
    marginTop: 8,
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  weatherValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: 10,
  },
  weatherLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
  },

  // Picker styles - more professional
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pickerButton: {
    flex: 1,
    backgroundColor: '#f7f9fc', // Lighter background
    borderRadius: 10,
    padding: 14, // More padding
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#eaeef2', // Subtle border
  },
  pickerLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  pickerValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerValueText: {
    fontSize: 18, // Larger text
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20, // More rounded corners
    borderTopRightRadius: 20,
    paddingBottom: 30, // More padding
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eef0f5', // Lighter border
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },

  // Prediction button styles - more prominent
  predictButton: {
    backgroundColor: colors.primary,
    borderRadius: 12, // More rounded
    paddingVertical: 16, // More height
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    elevation: 4, // More elevation
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  predictButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5, // Slight letter spacing
  },

  // Prediction results styles - more sophisticated
  predictionResults: {
    marginTop: 30, // More space
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionSummary: {
    alignItems: 'center',
  },
  predictedYieldText: {
    fontSize: 40, // Larger numbers
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: -1, // Tighter spacing for numbers
  },
  predictedYieldLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 4,
  },
  confidenceContainer: {
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  confidenceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  confidenceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  monthlyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginVertical: 16,
  },
  monthlyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eef0f5',
  },
  monthValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginVertical: 16,
  },
  predictionFactorsContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  predictionFactorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f7fa',
  },
  factorLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  factorValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // Enhanced card styles for the detailed prediction results
  predictionResultsCard: {
    backgroundColor: colors.white,
    borderRadius: 20, // More rounded corners
    padding: 24, // More generous padding
    marginTop: 5,
    marginBottom: 24,
    shadowColor: '#1a44b880', // Slightly blue shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f2f5', // Subtle border
  },
  predictionHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  predictionResultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  yearBadge: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  yearBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  averagePredictionContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  averagePredictionValue: {
    fontSize: 54, // Much larger for impact
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1.5,
  },
  averagePredictionLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 6,
  },
  predictionStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignSelf: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  predictionStatusText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 20,
  },
  monthlyPredictionContainer: {
    backgroundColor: '#f9fafd',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#edf0f7',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  confidenceBadge: {
    backgroundColor: '#e6f7ef', // Lighter green background
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d1ebdc', // Subtle border
  },
  confidenceBadgeText: {
    color: '#2c9f6e', // Darker green text
    fontSize: 13,
    fontWeight: '700',
  },
  predictionValuesContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  predictionValueBox: {
    flex: 1,
    alignItems: 'center',
  },
  predictionValueAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  predictionValueLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  predictionValueDivider: {
    width: 1,
    backgroundColor: '#eaeef2',
    marginHorizontal: 16,
  },
  factorsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f4fa',
    borderRadius: 24,
    paddingHorizontal: 16,
  },
  factorsButtonText: {
    fontSize: 14,
    color: colors.primary,
    marginRight: 6,
    fontWeight: '600',
  },
  factorsContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eef2f6',
  },
  factorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f7fa',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#2c9f6e', // Different color for variation
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#2c9f6e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 10,
  },

  // Compact card styles
  compactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#1a44b880',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderColor: '#f0f2f5',
    borderWidth: 1,
  },
  compactCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  compactDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  compactDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%', // Two items per row
    paddingVertical: 6,
  },
  compactDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  compactDetailText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 8,
    fontWeight: '500',
  },
  smallDetailText: {
    fontSize: 13,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  thinDivider: {
    height: 1,
    backgroundColor: '#eef0f5',
    marginVertical: 6,
  },
  compactWeatherContainer: {
    paddingVertical: 2,
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactWeatherIcon: {
    width: 60,
    height: 60,
  },
  compactTemperature: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  compactWeatherDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  compactWeatherDetails: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    backgroundColor: '#f9f9fc',
    borderRadius: 10,
    padding: 8,
    marginTop: 6,
  },
  compactWeatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  compactWeatherValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: 4,
    marginRight: 4,
  },
  compactWeatherLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default PredictionScreen;