import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getLocations } from '../../../api/locationApi';
import { Location } from '../../../types';
import { colors } from '../../../constants/colors';
import { useTranslation } from 'react-i18next';
import { NavigationProp } from '@react-navigation/native';
import { YieldPredictionHistory, yieldApi, LocationDetails } from '../../../api/yieldApi';

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


const CoconutYieldScreen = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const { t } = useTranslation();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [predictionHistory, setPredictionHistory] = useState<YieldPredictionHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [locationNames, setLocationNames] = useState<{[key: string]: string}>({});
  const [deletingPredictions, setDeletingPredictions] = useState<{[key: string]: boolean}>({});
  const ITEMS_PER_PAGE = 3;

  useEffect(() => {
    fetchLocations();
    fetchPredictionHistory();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await getLocations(1);
      setLocations(response);
      setPage(1);
      setHasMore(response.length >= ITEMS_PER_PAGE);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLoading(false);
    }
  };

  const fetchLocationNames = async (predictions: YieldPredictionHistory[]) => {
    // Extract unique location IDs
    const uniqueLocationIds = [...new Set(predictions.map(p => p.location))];
    
    // Create a map of existing location names to avoid redundant calls
    const newLocationNames = {...locationNames};
    
    // Fetch each location's details
    await Promise.all(
      uniqueLocationIds.map(async (locationId) => {
        // Skip if we already have this location's name
        if (newLocationNames[locationId]) return;
        
        try {
          const locationDetails = await yieldApi.getLocationDetails(locationId);
          newLocationNames[locationId] = locationDetails.location.name;
          console.log(`Fetched location name for ${locationId}:`, locationDetails.location.name);
          
        } catch (error) {
          console.error(`Failed to fetch details for location ${locationId}:`, error);
          // Use a default value if fetch fails
          newLocationNames[locationId] = 'Unknown Location';
        }
      })
    );
    
    // Update state with all the fetched names
    setLocationNames(newLocationNames);
  };

  const fetchPredictionHistory = async () => {
    try {
      setHistoryLoading(true);
      const history = await yieldApi.getPredictionHistory();
      setPredictionHistory(history);
      
      // Fetch location names for all predictions
      await fetchLocationNames(history);
    } catch (error) {
      console.error('Error fetching prediction history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchLocations();
      await fetchPredictionHistory();
    } catch (error) {
      console.error('Error refreshing data:', error);
      // Consider showing an error toast or feedback to user here
    } finally {
      // Always reset refreshing state, even if there was an error
      setRefreshing(false);
    }
  }, []);

  const loadMoreLocations = async () => {
    if (!hasMore || loading) return;

    try {
      const nextPage = page + 1;
      const response = await getLocations(nextPage);

      if (response.length === 0) {
        setHasMore(false);
        return;
      }

      setLocations(prevLocations => [...prevLocations, ...response]);
      setPage(nextPage);
      setHasMore(response.length >= ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error loading more locations:', error);
    }
  };

  const getSoilColor = (soilType: string): string => {
    switch (soilType) {
      case "Lateritic":
        return "#CD7F32"; // Bronze
      case "Sandy Loam":
        return "#DAA520"; // Golden
      case "Cinnamon Sand":
        return "#D2691E"; // Cinnamon
      case "Red Yellow Podzolic":
        return "#A52A2A"; // Brown
      case "Alluvial":
        return "#708090"; // Slate gray
      default:
        return "#8B4513"; // Default brown
    }
  };

  const handleDeletePrediction = (prediction: YieldPredictionHistory) => {
    Alert.alert(
      t('prediction.deleteConfirmTitle'),
      t('prediction.deleteConfirmMessage', {
        year: prediction.year,
        location: locationNames[prediction.location] || t('common.unknownLocation')
      }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel'
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Set deleting state for this prediction
              setDeletingPredictions(prev => ({ ...prev, [prediction._id]: true }));
              
              // Call the API to delete the prediction
              await yieldApi.deletePrediction(prediction._id);
              
              // Remove the deleted prediction from state
              setPredictionHistory(prev => 
                prev.filter(item => item._id !== prediction._id)
              );
              
              // Show success feedback
              Alert.alert(
                t('prediction.deleteSuccessTitle'), 
                t('prediction.deleteSuccessMessage')
              );
            } catch (error) {
              console.error('Error deleting prediction:', error);
              Alert.alert(
                t('prediction.deleteErrorTitle'),
                t('prediction.deleteErrorMessage')
              );
            } finally {
              // Clear deleting state
              setDeletingPredictions(prev => {
                const updated = { ...prev };
                delete updated[prediction._id];
                return updated;
              });
            }
          }
        }
      ]
    );
  };

  const renderLocationItem = ({ item }: { item: Location }) => (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => navigation.navigate('Prediction', { 
        locationId: item._id,
        locationName: item.name
      })}
    >
      <View style={styles.locationHeader}>
        <Text style={styles.locationName}>{item.name}</Text>
        <Text style={styles.locationArea}>{item.area} acres</Text>
      </View>
      <View style={styles.locationDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="leaf-outline" size={20} color="#4CD964" />
            <Text style={styles.detailText}>{item.totalTrees} {t('lands.trees')}</Text>
          </View>
          <View style={styles.statItem}>
            <View
              style={[
                styles.soilIcon,
                { backgroundColor: getSoilColor(item.soilType) },
              ]}
            />
            <Text style={styles.statValue}>{item.soilType}</Text>
            {/* <Text style={styles.statLabel}>{t('lands.soilType')}</Text> */}
          </View>
        </View>
        <View style={[styles.detailRow, styles.marginTop]}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <View style={styles.dateContainer}>
              <Text style={styles.detailText}>
                {new Date(item.plantationDate).toLocaleDateString()}
              </Text>
              <View style={styles.ageContainer}>
                <Text style={styles.ageText}>{t('lands.age')}: </Text>
                <Text style={styles.ageValue}>{calculateAge(item.plantationDate)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={20} color="#FF6B6B" />
            <Text style={styles.detailText}>
              {`${item.coordinates.latitude.toFixed(4)}, ${item.coordinates.longitude.toFixed(4)}`}
            </Text>
          </View>
        </View>
        {item.description && (
          <View style={[styles.detailRow, styles.marginTop]}>
            <View style={styles.detailItem}>
              <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
              <Text style={styles.detailText}>{item.description}</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!hasMore) return null;

    return (
      <TouchableOpacity 
        style={styles.loadMoreButton}
        onPress={loadMoreLocations}
      >
        <Text style={styles.loadMoreText}>{t('lands.loadMore')}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#4CD964" style={styles.loader} />
      ) : locations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t('lands.emptyState')}</Text>
          <TouchableOpacity
            style={styles.addFirstButton}
            onPress={() => navigation.navigate('AddLocation')}
          >
            <Text style={styles.addFirstButtonText}>{t('lands.addFirst')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Instruction text for users */}
          <View style={styles.instructionContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#4CD964" />
            <Text style={styles.instructionText}>
              {t('lands.selectToPredict', 'Please select a location to predict yield')}
            </Text>
          </View>
          
          <FlatList
            data={locations}
            renderItem={renderLocationItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.locationsList}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={hasMore ? renderFooter : null}
            onEndReached={hasMore ? loadMoreLocations : null}
            onEndReachedThreshold={0.2}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4CD964']}
                tintColor="#4CD964"
                title={t('common.refreshing')}
                titleColor={'#4CD964'}
              />
            }
          />
          
          {/* Prediction History Section */}
          <View style={styles.historySection}>
            <Text style={styles.historySectionTitle}>{t('prediction.recentHistory')}</Text>
            
            {historyLoading ? (
              <ActivityIndicator size="small" color="#4CD964" style={styles.historyLoader} />
            ) : predictionHistory.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Text style={styles.emptyHistoryText}>{t('prediction.noHistory')}</Text>
              </View>
            ) : (
              <>
                {predictionHistory.slice(0, 3).map((item) => {
                  // Get the first month from monthly predictions (if it exists)
                  const firstMonth = item.monthly_predictions && item.monthly_predictions.length > 0 
                    ? item.monthly_predictions[0] 
                    : null;
                    
                  return (
                    <View key={item._id} style={styles.historyCard}>
                      <View style={styles.historyCardHeader}>
                        <View style={styles.historyLocationContainer}>
                          <Text style={styles.historyLocationName}>
                            {locationNames[item.location] || t('common.loadingLocation')}
                          </Text>
                          <TouchableOpacity 
                            style={styles.smallDeleteButton}
                            onPress={() => handleDeletePrediction(item)}
                            disabled={deletingPredictions[item._id]}
                          >
                            {deletingPredictions[item._id] ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <Ionicons name="trash-outline" size={14} color="#FFFFFF" />
                            )}
                          </TouchableOpacity>
                        </View>
                        <View style={styles.predictionTimeBadges}>
                          <View style={styles.historyYearBadge}>
                            <Text style={styles.historyYearText}>{item.year}</Text>
                          </View>
                          {firstMonth && (
                            <View style={styles.historyMonthBadge}>
                              <Text style={styles.historyMonthText}>
                                {firstMonth.month_name}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      
                      <View style={styles.historyDetails}>
                        <View style={styles.historyYieldContainer}>
                          <Text style={styles.historyYieldValue}>
                            {item.average_prediction.toFixed(1)}
                          </Text>
                          <Text style={styles.historyYieldLabel}>{t('prediction.nutsPerTree')}</Text>
                        </View>
                        
                        <View style={styles.historyInfoContainer}>
                          <View style={styles.historyDateContainer}>
                            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                            <Text style={styles.historyDate}>
                              {new Date(item.createdAt).toLocaleDateString()}
                            </Text>
                          </View>
                          
                          {firstMonth && (
                            <View style={styles.historyConfidenceContainer}>
                              <Ionicons name="checkmark-circle-outline" size={14} color="#4CD964" />
                              <Text style={styles.historyConfidenceText}>
                                {Math.round(firstMonth.confidence_score)}% {t('prediction.confidence')}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      
                      {/* Show additional prediction details if available */}
                      {firstMonth && (
                        <View style={styles.historyExtraDetails}>
                          <View style={styles.historyFactorRow}>
                            <View style={styles.historyFactor}>
                              <Text style={styles.historyFactorLabel}>{t('prediction.factors.temperature')}</Text>
                              <Text style={styles.historyFactorValue}>{firstMonth.input_data.temperature}°C</Text>
                            </View>
                            <View style={styles.historyFactor}>
                              <Text style={styles.historyFactorLabel}>{t('prediction.factors.humidity')}</Text>
                              <Text style={styles.historyFactorValue}>{firstMonth.input_data.humidity}%</Text>
                            </View>
                          </View>
                          <View style={styles.historyFactorRow}>
                            <View style={styles.historyFactor}>
                              <Text style={styles.historyFactorLabel}>{t('prediction.factors.rainfall')}</Text>
                              <Text style={styles.historyFactorValue}>{firstMonth.input_data.rainfall} mm</Text>
                            </View>
                            <View style={styles.historyFactor}>
                              <Text style={styles.historyFactorLabel}>{t('prediction.factors.plantAge')}</Text>
                              <Text style={styles.historyFactorValue}>{firstMonth.input_data.plant_age} {t('common.years')}</Text>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
                
                {predictionHistory.length > 3 && (
                  <TouchableOpacity 
                    style={styles.viewAllHistoryButton}
                    onPress={() => navigation.navigate('PredictionHistory')}
                  >
                    <Text style={styles.viewAllHistoryText}>
                      {t('prediction.viewAllHistory')}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color="#4CD964" />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  addFirstButton: {
    backgroundColor: '#4CD964',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  locationsList: {
    paddingBottom: 20,
  },
  locationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  locationArea: {
    fontSize: 14,
    color: '#6B7280',
  },
  locationDetails: {
    flexDirection: 'column',
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  soilIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  dateContainer: {
    flex: 1,
    marginLeft: 8,
  },
  ageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 8,
  },
  ageText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  ageValue: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  detailText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  marginTop: {
    marginTop: 8,
  },
  loadMoreButton: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  loadMoreText: {
    color: '#4CD964',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4', // Light green background
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7', // Lighter green border
  },
  instructionText: {
    fontSize: 14,
    color: '#166534', // Dark green text
    marginLeft: 8,
    flex: 1,
  },
  historySection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  historySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  historyLoader: {
    padding: 20,
  },
  emptyHistory: {
    padding: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#6B7280',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyLocationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  historyYearBadge: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyYearText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyYieldContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  historyYieldValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4CD964',
  },
  historyYieldLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 5,
  },
  historyDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  viewAllHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F0FFF4',
    borderRadius: 8,
    marginTop: 8,
  },
  viewAllHistoryText: {
    fontSize: 14,
    color: '#4CD964',
    fontWeight: '600',
    marginRight: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  smallDeleteButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    padding: 4,
    marginLeft: 8,
  },
  predictionTimeBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyMonthBadge: {
    backgroundColor: '#E6F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 6,
  },
  historyMonthText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
  },
  historyInfoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  historyPeriodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  historyPeriodText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
  },
  historyConfidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  historyConfidenceText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
  },
  historyExtraDetails: {
    marginTop: 12,
  },
  historyFactorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyFactor: {
    flex: 1,
    alignItems: 'center',
  },
  historyFactorLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  historyFactorValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
});

export default CoconutYieldScreen;