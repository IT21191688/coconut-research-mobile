import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NavigationProp } from '@react-navigation/native';
import { colors } from '../../../constants/colors';
import { YieldPredictionHistory, yieldApi } from '../../../api/yieldApi';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const ITEMS_PER_PAGE = 10;

interface PredictionHistoryScreenProps {
  navigation: NavigationProp<any>;
  route: any;
}

const PredictionHistoryScreen: React.FC<PredictionHistoryScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const locationIdParam = route.params?.locationId;
  
  const [predictionHistory, setPredictionHistory] = useState<YieldPredictionHistory[]>([]);
  const [locationNames, setLocationNames] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [deletingPredictions, setDeletingPredictions] = useState<{[key: string]: boolean}>({});
  const [error, setError] = useState<string | null>(null);
  const [comparisonModalVisible, setComparisonModalVisible] = useState(false);
  const [comparisonData, setComparisonData] = useState<{
    labels: string[];
    datasets: { data: number[], color: () => string }[];
    location: string;
    hasLastYear?: boolean;
    currentYear?: number;
    lastYearValue?: number;
    percentChange?: number;
  } | null>(null);

  // Fetch prediction history
  const fetchPredictionHistory = async (pageNum = 1) => {
    try {
      setError(null);
      const isFirstPage = pageNum === 1;
      
      if (isFirstPage) {
        setLoading(true);
      }
      
      // If locationId is provided as a param, filter by that location
      const history = await yieldApi.getPredictionHistory(locationIdParam);
      
      // If it's the first page, replace the data
      if (isFirstPage) {
        setPredictionHistory(history);
      } else {
        // Otherwise append to existing data
        setPredictionHistory(prev => [...prev, ...history]);
      }
      
      // Check if we have more data to load
      setHasMore(history.length >= ITEMS_PER_PAGE);
      
      // Fetch location names for all predictions
      await fetchLocationNames(history);
    } catch (error) {
      console.error('Error fetching prediction history:', error);
      setError(t('prediction.errorLoadingHistory'));
    } finally {
      setLoading(false);
    }
  };

  // Fetch location names for predictions
  const fetchLocationNames = async (predictions: YieldPredictionHistory[]) => {
    // Extract unique location IDs
    const uniqueLocationIds = [...new Set(predictions.map(p => p.location))];
    
    // Skip locations we already have
    const locationsToFetch = uniqueLocationIds.filter(id => !locationNames[id]);
    
    // If no new locations to fetch, skip
    if (locationsToFetch.length === 0) return;
    
    // Create a copy of existing location names
    const newLocationNames = {...locationNames};
    
    // Fetch each location's details
    await Promise.all(
      locationsToFetch.map(async (locationId) => {
        try {
          const locationDetails = await yieldApi.getLocationDetails(locationId);
          newLocationNames[locationId] = locationDetails.location.name;
        } catch (error) {
          console.error(`Failed to fetch details for location ${locationId}:`, error);
          newLocationNames[locationId] = t('common.unknownLocation');
        }
      })
    );
    
    // Update state with all the fetched names
    setLocationNames(newLocationNames);
  };

  // Handle deletion with confirmation
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

  // Refresh data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    try {
      await fetchPredictionHistory(1);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Load more predictions
  const loadMorePredictions = async () => {
    if (!hasMore || loading) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchPredictionHistory(nextPage);
  };

  // Initial data fetch
  useEffect(() => {
    fetchPredictionHistory();
  }, [locationIdParam]);

  const handleCompareWithLastYear = (item: YieldPredictionHistory) => {
    // Find all predictions for the same location
    const locationPredictions = predictionHistory
      .filter(p => p.location === item.location)
      .sort((a, b) => a.year - b.year); // Sort by year
    
    // Find a prediction from last year for the same location
    const lastYearPrediction = predictionHistory.find(
      p => p.location === item.location && p.year === item.year - 1
    );
    
    const locationName = locationNames[item.location] || t('common.unknownLocation');
    
    if (!lastYearPrediction) {
      // No prediction found for last year - show a more informative alert
      Alert.alert(
        t('prediction.noComparisonTitle'),
        t('prediction.noComparisonMessage', {
          year: item.year - 1,
          location: locationName
        }),
        [
          {
            text: t('common.viewAllData'),
            onPress: () => {
              // Still show the chart with available data, but with a message
              if (locationPredictions.length >= 2) {
                // Prepare data for chart
                const labels = locationPredictions.map(p => p.year.toString());
                const data = locationPredictions.map(p => p.average_prediction);
                
                setComparisonData({
                  labels,
                  datasets: [
                    {
                      data,
                      color: () => colors.primary,
                    },
                  ],
                  location: locationName,
                  hasLastYear: false,
                  currentYear: item.year
                });
                
                // Show modal
                setComparisonModalVisible(true);
              } else {
                // Not enough data for any trend
                Alert.alert(
                  t('prediction.insufficientDataTitle'),
                  t('prediction.insufficientDataMessage')
                );
              }
            }
          },
          {
            text: t('common.ok'),
            style: 'cancel'
          }
        ]
      );
      return;
    }
    
    // Proceed with normal comparison since we have last year's data
    // Calculate percentage change
    const currentYield = item.average_prediction;
    const lastYearYield = lastYearPrediction.average_prediction;
    const percentChange = ((currentYield - lastYearYield) / lastYearYield) * 100;
    
    // Prepare data for chart
    const labels = locationPredictions.map(p => p.year.toString());
    const data = locationPredictions.map(p => p.average_prediction);
    
    // Set data for modal
    setComparisonData({
      labels,
      datasets: [
        {
          data,
          color: () => colors.primary,
        },
      ],
      location: locationName,
      hasLastYear: true,
      currentYear: item.year,
      lastYearValue: lastYearYield,
      percentChange: percentChange
    });
    
    // Show modal
    setComparisonModalVisible(true);
  };

  // Add this helper function
  const calculateTrendText = (data: number[]) => {
    if (data.length < 2) return t('prediction.notEnoughData');
    
    // Calculate percentage change from first to last point
    const firstValue = data[0];
    const lastValue = data[data.length - 1];
    const percentChange = ((lastValue - firstValue) / firstValue) * 100;
    
    // Calculate if trend is increasing, decreasing, or stable
    if (Math.abs(percentChange) < 5) {
      return t('prediction.stableTrend');
    } else if (percentChange > 0) {
      return t('prediction.increasingTrend', { percent: Math.abs(percentChange).toFixed(1) });
    } else {
      return t('prediction.decreasingTrend', { percent: Math.abs(percentChange).toFixed(1) });
    }
  };

  // Render individual prediction item
  const renderPredictionItem = ({ item }: { item: YieldPredictionHistory }) => {
    // Get the first month from monthly predictions (if it exists)
    const firstMonth = item.monthly_predictions && item.monthly_predictions.length > 0 
      ? item.monthly_predictions[0] 
      : null;
      
    return (
      <View style={styles.predictionCard}>
        <View style={styles.cardHeader}>
          <View style={styles.locationContainer}>
            <Text style={styles.locationName}>
              {locationNames[item.location] || t('common.loadingLocation')}
            </Text>
            <TouchableOpacity 
              style={styles.deleteButton}
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
          <View style={styles.timeBadges}>
            <View style={styles.yearBadge}>
              <Text style={styles.yearText}>{item.year}</Text>
            </View>
            {firstMonth && (
              <View style={styles.monthBadge}>
                <Text style={styles.monthText}>
                  {firstMonth.month_name}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.cardDivider} />
        
        <View style={styles.cardDetails}>
          <View style={styles.yieldSection}>
            <Text style={styles.yieldValue}>
              {item.average_prediction.toFixed(1)}
            </Text>
            <Text style={styles.yieldLabel}>{t('prediction.nutsPerTree')}</Text>
          </View>
          
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            
            {firstMonth && (
              <View style={styles.infoRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#4CD964" />
                <Text style={styles.confidenceText}>
                  {Math.round(firstMonth.confidence_score)}% {t('prediction.confidence')}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Additional prediction details */}
        {firstMonth && (
          <View style={styles.extraDetails}>
            <View style={styles.factorsGrid}>
              <View style={styles.factorItem}>
                <Text style={styles.factorLabel}>{t('prediction.factors.temperature')}</Text>
                <Text style={styles.factorValue}>{firstMonth.input_data.temperature}°C</Text>
              </View>
              <View style={styles.factorItem}>
                <Text style={styles.factorLabel}>{t('prediction.factors.humidity')}</Text>
                <Text style={styles.factorValue}>{firstMonth.input_data.humidity}%</Text>
              </View>
              <View style={styles.factorItem}>
                <Text style={styles.factorLabel}>{t('prediction.factors.rainfall')}</Text>
                <Text style={styles.factorValue}>{firstMonth.input_data.rainfall} mm</Text>
              </View>
              <View style={styles.factorItem}>
                <Text style={styles.factorLabel}>{t('prediction.factors.plantAge')}</Text>
                <Text style={styles.factorValue}>{firstMonth.input_data.plant_age} {t('common.years')}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.compareButton}
              onPress={() => handleCompareWithLastYear(item)}
            >
              <Ionicons name="analytics-outline" size={16} color={colors.primary} />
              <Text style={styles.compareButtonText}>{t('prediction.compareWithLastYear')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Footer component for loading more
  const renderFooter = () => {
    if (!hasMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.footerText}>{t('common.loadingMore')}</Text>
      </View>
    );
  };

  // Empty state component
  const renderEmptyComponent = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="analytics-outline" size={60} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>{t('prediction.noHistoryTitle')}</Text>
        <Text style={styles.emptyText}>{t('prediction.noHistoryText')}</Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('CoconutYieldMain')}
        >
          <Text style={styles.emptyButtonText}>{t('prediction.makeNewPrediction')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Page Header */}
      <View style={styles.header}>
        {/* <Text style={styles.headerTitle}>{t('prediction.historyTitle')}</Text> */}
        {locationIdParam && (
          <TouchableOpacity 
            style={styles.resetFilterButton}
            onPress={() => navigation.navigate('PredictionHistory')}
          >
            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            <Text style={styles.resetFilterText}>{t('prediction.clearFilter')}</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchPredictionHistory(1)}
          >
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>{t('prediction.loadingHistory')}</Text>
        </View>
      ) : (
        <FlatList
          data={predictionHistory}
          renderItem={renderPredictionItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyComponent}
          ListFooterComponent={renderFooter}
          onEndReached={loadMorePredictions}
          onEndReachedThreshold={0.2}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
              title={t('common.refreshing')}
              titleColor={colors.primary}
            />
          }
        />
      )}
      {comparisonData && (
        <Modal
          visible={comparisonModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setComparisonModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {comparisonData.hasLastYear 
                  ? t('prediction.comparisonTitle') 
                  : t('prediction.yieldTrendTitle')}
              </Text>
              <Text style={styles.modalSubtitle}>{comparisonData.location}</Text>
              
              {/* Chart visualization */}
              <LineChart
                data={{
                  labels: comparisonData.labels,
                  datasets: comparisonData.datasets,
                }}
                width={Dimensions.get('window').width - 60}
                height={220}
                chartConfig={{
                  backgroundColor: '#FFFFFF',
                  backgroundGradientFrom: '#FFFFFF',
                  backgroundGradientTo: '#FFFFFF',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(76, 217, 100, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#4CD964',
                  },
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                bezier
              />
              
              {/* Show different message based on data availability */}
              {comparisonData.hasLastYear ? (
                <View style={styles.comparisonResult}>
                  <View style={styles.comparisonResultInner}>
                    <Text style={styles.comparisonText}>
                      {t('prediction.comparisonResult', {
                        currentYear: comparisonData.currentYear,
                        lastYear: (comparisonData.currentYear ?? 0) - 1,
                        change: Math.abs(comparisonData.percentChange || 0).toFixed(1),
                        direction: (comparisonData.percentChange || 0) > 0 
                          ? t('prediction.increased') 
                          : t('prediction.decreased')
                      })}
                    </Text>
                    <Ionicons 
                      name={(comparisonData.percentChange || 0) > 0 ? "trending-up" : "trending-down"} 
                      size={24} 
                      color={(comparisonData.percentChange || 0) > 0 ? "#4CD964" : "#FF6B6B"} 
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.comparisonResult}>
                  <View style={styles.comparisonResultInner}>
                    <Ionicons name="information-circle-outline" size={24} color="#6B7280" />
                    <Text style={[styles.comparisonText, {color: '#6B7280'}]}>
                      {t('prediction.noLastYearData', {
                        year: (comparisonData.currentYear ?? 0) - 1
                      })}
                    </Text>
                  </View>
                </View>
              )}
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setComparisonModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  resetFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  resetFilterText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  listContainer: {
    paddingBottom: 20,
  },
  predictionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEF0F4',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginRight : 5,
  },
  timeBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yearBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  yearText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  monthBadge: {
    backgroundColor: '#E6F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 6,
  },
  monthText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yieldSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  yieldValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  yieldLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  infoSection: {
    alignItems: 'flex-end',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  confidenceText: {
    fontSize: 12,
    color: '#4CD964',
    fontWeight: '500',
    marginLeft: 4,
  },
  extraDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  factorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  factorItem: {
    width: '48%',
    marginBottom: 8,
  },
  factorLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  factorValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
  },
  compareButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 16,
    width: Dimensions.get('window').width - 32,
    maxHeight: Dimensions.get('window').height - 100,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  modalCloseButton: {
    padding: 4,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  comparisonAnalysis: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  analysisText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 8,
    textAlign: 'center',
  },
  modalCloseFullButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseFullButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  comparisonResult: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    marginTop: 16,
  },
  comparisonResultInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  comparisonText: {
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
    marginRight: 8,
    flex: 1,
  },
});

export default PredictionHistoryScreen;