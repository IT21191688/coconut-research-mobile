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

const YEARS = [2024, 2025, 2026]; // Add more years as needed

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
    const soilTypeMap: {[key: string]: number} = {
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
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{location.name}</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="leaf-outline" size={18} color={colors.primary} />
              <Text style={styles.detailText}>{location.totalTrees} trees</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="resize-outline" size={18} color={colors.primary} />
              <Text style={styles.detailText}>{location.area} acres</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
              <View>
                <Text style={styles.detailText}>
                  {new Date(location.plantationDate).toLocaleDateString()}
                </Text>
                <Text style={styles.detailSubtext}>
                  {calculateAge(location.plantationDate)}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="earth-outline" size={18} color={colors.textSecondary} />
              <View>
                <Text style={styles.detailText}>
                  {location.soilType}
                </Text>
                <Text style={styles.detailSubtext}>
                  Soil Type
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={18} color={colors.error} />
              <Text style={styles.detailText}>
                {`${location.coordinates.latitude.toFixed(4)}, ${location.coordinates.longitude.toFixed(4)}`}
              </Text>
            </View>
          </View>

          {location.description && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.detailText}>{location.description}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Weather Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Weather</Text>
          
          {weatherLoading ? (
            <View style={styles.weatherLoadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.weatherLoadingText}>Loading weather data...</Text>
            </View>
          ) : weather ? (
            <>
              <View style={styles.weatherHeader}>
                {weather.icon && (
                  <Image 
                    source={{ uri: `https://openweathermap.org/img/wn/${weather.icon}@2x.png` }} 
                    style={styles.weatherIcon} 
                  />
                )}
                <View style={styles.weatherHeaderText}>
                  <Text style={styles.temperature}>{Math.round(weather.temperature)}°C</Text>
                  <Text style={styles.weatherDescription}>{weather.description}</Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.weatherDetails}>
                <View style={styles.weatherDetail}>
                  <Ionicons name="water-outline" size={24} color={colors.textSecondary} />
                  <View>
                    <Text style={styles.weatherValue}>{weather.humidity}%</Text>
                    <Text style={styles.weatherLabel}>Humidity</Text>
                  </View>
                </View>
                
                <View style={styles.weatherDetail}>
                  <Ionicons name="rainy-outline" size={24} color={colors.textSecondary} />
                  <View>
                    <Text style={styles.weatherValue}>{weather.rainfall} mm</Text>
                    <Text style={styles.weatherLabel}>Rainfall</Text>
                  </View>
                </View>
              </View>
            </>
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

          {/* Debug info */}
          {yieldPrediction === null ? (
            <Text style={{marginTop: 12, color: colors.textSecondary}}>
              No prediction data available yet.
            </Text>
          ) : (
            <Text style={{marginTop: 12, color: colors.success}}>
              Prediction data received: {yieldPrediction.monthly_predictions.length} predictions
            </Text>
          )}
          
          {yieldPrediction && (
            <View style={styles.predictionResults}>
              <View style={styles.predictionHeader}>
                <View style={styles.predictionSummary}>
                  <Text style={styles.predictedYieldText}>
                    {yieldPrediction.average_prediction.toFixed(1)}
                  </Text>
                  <Text style={styles.predictedYieldLabel}>nuts/tree</Text>
                </View>
                {yieldPrediction.monthly_predictions.length > 0 && (
                  <View style={styles.confidenceContainer}>
                    <Text style={styles.confidenceValue}>
                      {Math.round(yieldPrediction.monthly_predictions[0].confidence_score)}%
                    </Text>
                    <Text style={styles.confidenceLabel}>Confidence</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.divider} />
              
              <Text style={styles.monthlyTitle}>Monthly Predictions</Text>
              {yieldPrediction.monthly_predictions.map((prediction, index) => (
                <View key={index} style={styles.monthlyItem}>
                  <Text style={styles.monthName}>{prediction.month_name}</Text>
                  <Text style={styles.monthValue}>{prediction.ensemble_prediction.toFixed(1)} nuts/tree</Text>
                </View>
              ))}
              
              {/* Additional prediction details */}
              {yieldPrediction.monthly_predictions.length > 0 && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.detailSectionTitle}>Prediction Factors</Text>
                  <View style={styles.predictionFactorsContainer}>
                    <View style={styles.predictionFactorRow}>
                      <Text style={styles.factorLabel}>Temperature:</Text>
                      <Text style={styles.factorValue}>
                        {yieldPrediction.monthly_predictions[0].input_data.temperature}°C
                      </Text>
                    </View>
                    <View style={styles.predictionFactorRow}>
                      <Text style={styles.factorLabel}>Humidity:</Text>
                      <Text style={styles.factorValue}>
                        {yieldPrediction.monthly_predictions[0].input_data.humidity}%
                      </Text>
                    </View>
                    <View style={styles.predictionFactorRow}>
                      <Text style={styles.factorLabel}>Rainfall:</Text>
                      <Text style={styles.factorValue}>
                        {yieldPrediction.monthly_predictions[0].input_data.rainfall} mm
                      </Text>
                    </View>
                    <View style={styles.predictionFactorRow}>
                      <Text style={styles.factorLabel}>Plant Age:</Text>
                      <Text style={styles.factorValue}>
                        {yieldPrediction.monthly_predictions[0].input_data.plant_age} years
                      </Text>
                    </View>
                    <View style={styles.predictionFactorRow}>
                      <Text style={styles.factorLabel}>Seasonal Factor:</Text>
                      <Text style={styles.factorValue}>
                        {yieldPrediction.monthly_predictions[0].seasonal_factor.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          )}
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
              <Text style={styles.averagePredictionLabel}>nuts/tree</Text>
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
                <TouchableOpacity 
                  style={styles.factorsButton}
                  onPress={() => {
                    // You could implement a modal or expand this section on press
                    console.log('Prediction factors button pressed');
                  }}
                >
                  <Text style={styles.factorsButtonText}>View Factors</Text>
                  <Ionicons name="chevron-down" size={16} color={colors.primary} />
                </TouchableOpacity>
                
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
  },
  detailSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: 8,
  },
  // Weather styles
  weatherLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  weatherLoadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherHeaderText: {
    flex: 1,
  },
  temperature: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  weatherDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  weatherIcon: {
    width: 80,
    height: 80,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  weatherLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  // Picker styles
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pickerButton: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  pickerLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  pickerValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerValueText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  // Prediction button styles
  predictButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  predictButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Prediction results styles
  predictionResults: {
    marginTop: 24,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  predictionSummary: {
    alignItems: 'center',
  },
  predictedYieldText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  predictedYieldLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  confidenceContainer: {
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confidenceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  confidenceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  monthlyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginVertical: 12,
  },
  monthlyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  monthValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginVertical: 12,
  },
  predictionFactorsContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
  },
  predictionFactorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  factorLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  factorValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  predictionResultsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  predictionHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  predictionResultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  yearBadge: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  yearBadgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  averagePredictionContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  averagePredictionValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
  },
  averagePredictionLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  predictionStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  predictionStatusText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 16,
  },
  monthlyPredictionContainer: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  confidenceBadge: {
    backgroundColor: colors.success + '20', // 20% opacity version of success color
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  confidenceBadgeText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '500',
  },
  predictionValuesContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  predictionValueBox: {
    flex: 1,
    alignItems: 'center',
  },
  predictionValueAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  predictionValueLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  predictionValueDivider: {
    width: 1,
    backgroundColor: colors.gray200,
    marginHorizontal: 16,
  },
  factorsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  factorsButtonText: {
    fontSize: 14,
    color: colors.primary,
    marginRight: 4,
  },
  factorsContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
  },
  factorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  factorLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  factorValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default PredictionScreen;