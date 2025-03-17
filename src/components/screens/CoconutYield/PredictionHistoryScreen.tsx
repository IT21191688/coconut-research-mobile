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
  Modal,
  TextInput,
  ScrollView
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
  const [locationNames, setLocationNames] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [deletingPredictions, setDeletingPredictions] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filteredHistory, setFilteredHistory] = useState<YieldPredictionHistory[]>([]);

  // Existing states for modals and other functionality
  const [comparisonModalVisible, setComparisonModalVisible] = useState(false);
  const [comparisonData, setComparisonData] = useState<{
    labels: string[];
    datasets: { data: number[], color: () => string }[];
    location: string;
    hasLastYear?: boolean;
    hasActualYield?: boolean;
    currentYear?: number;
    predictionYear?: number;
    lastYearValue?: number;
    actualYield?: number;
    predictedYield?: number;
    percentChange?: number;
    percentDifference?: number;
  } | null>(null);
  const [actualYieldModalVisible, setActualYieldModalVisible] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<YieldPredictionHistory | null>(null);
  const [actualYieldValue, setActualYieldValue] = useState('');
  const [submittingActualYield, setSubmittingActualYield] = useState(false);

  // Update the fetchPredictionHistory function to properly handle pagination and duplicates

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
        setFilteredHistory(history); // Also update filtered history
        setHasMore(history.length >= ITEMS_PER_PAGE);
      } else {
        // Filter out duplicates based on _id
        const existingIds = new Set(predictionHistory.map(pred => pred._id));
        const newItems = history.filter((item: YieldPredictionHistory) => !existingIds.has(item._id));

        // If no new items, we've reached the end
        if (newItems.length === 0) {
          setHasMore(false);
          return;
        }

        // Otherwise append unique new items
        const updatedHistory = [...predictionHistory, ...newItems];
        setPredictionHistory(updatedHistory);

        // Apply current filters to the updated history
        applyFiltersToHistory(updatedHistory);

        setHasMore(newItems.length >= ITEMS_PER_PAGE);
      }

      // Set the current page
      setPage(pageNum);

      // Fetch location names for all predictions
      await fetchLocationNames(isFirstPage ? history : predictionHistory);
    } catch (error) {
      console.error('Error fetching prediction history:', error);
      setError(t('prediction.errorLoadingHistory'));
    } finally {
      setLoading(false);
    }
  };

  // Create a separate function to apply filters to any history array
  const applyFiltersToHistory = (historyArray: YieldPredictionHistory[]) => {
    let filtered = [...historyArray];

    // Apply name filter if it exists
    if (nameFilter) {
      filtered = filtered.filter(prediction => {
        const locationName = locationNames[prediction.location] || '';
        return locationName.toLowerCase().includes(nameFilter.toLowerCase());
      });
    }

    // Apply year filter if it exists
    if (yearFilter) {
      const yearNum = parseInt(yearFilter);
      if (!isNaN(yearNum)) {
        filtered = filtered.filter(prediction => prediction.year === yearNum);
      }
    }

    // Apply month filter if it exists
    if (monthFilter) {
      filtered = filtered.filter(prediction => {
        if (!prediction.monthly_predictions || prediction.monthly_predictions.length === 0) return false;

        // Check if any month name contains the filter string
        return prediction.monthly_predictions.some(monthPrediction =>
          monthPrediction.month_name.toLowerCase().includes(monthFilter.toLowerCase())
        );
      });
    }

    setFilteredHistory(filtered);
  };

  // Updated applyFilters to use the shared function
  const applyFilters = () => {
    applyFiltersToHistory(predictionHistory);
  };

  // Update loadMorePredictions to prevent loading when already loading
  const loadMorePredictions = async () => {
    if (!hasMore || loading || refreshing) return;

    const nextPage = page + 1;
    await fetchPredictionHistory(nextPage);
  };

  // Apply filters whenever filter values or prediction history changes
  useEffect(() => {
    applyFiltersToHistory(predictionHistory);
  }, [nameFilter, yearFilter, monthFilter, predictionHistory, locationNames]);

  // Clear all filters
  const clearFilters = () => {
    setNameFilter('');
    setYearFilter('');
    setMonthFilter('');
    setShowFilterModal(false);
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
    const newLocationNames = { ...locationNames };

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

  // Handle comparison with last year
  const handleCompareWithLastYear = (prediction: YieldPredictionHistory) => {
    // Implement the comparison logic here
    console.log('Comparing with last year:', prediction);
  };

  // Handle submitting actual yield
  const submitActualYield = async () => {
    if (!selectedPrediction || !actualYieldValue) return;

    setSubmittingActualYield(true);
    try {
      // Get month from first monthly prediction or default to 1
      const firstMonthData = selectedPrediction.monthly_predictions &&
        selectedPrediction.monthly_predictions.length > 0 ?
        selectedPrediction.monthly_predictions[0] : null;

      await yieldApi.submitActualYield({
        yieldPredictionId: selectedPrediction._id,
        actual_yield: parseFloat(actualYieldValue),
        year: selectedPrediction.year,
        month: firstMonthData?.month || 1,
        locationId: selectedPrediction.location
      });
      Alert.alert(t('prediction.actualYieldSuccessTitle'), t('prediction.actualYieldSuccessMessage'));
      setActualYieldModalVisible(false);
      setActualYieldValue('');
      onRefresh();
    } catch (error) {
      console.error('Error submitting actual yield:', error);
      Alert.alert(t('prediction.actualYieldErrorTitle'), t('prediction.actualYieldErrorMessage'));
    } finally {
      setSubmittingActualYield(false);
    }
  };

  // Handle entering actual yield
  const handleEnterActualYield = (prediction: YieldPredictionHistory) => {
    setSelectedPrediction(prediction);
    setActualYieldModalVisible(true);
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

  // Function already defined below - removing this duplicate declaration

  // Initial data fetch
  useEffect(() => {
    fetchPredictionHistory();
  }, [locationIdParam]);

  // Render Filter Button
  const renderFilterButton = () => (
    <TouchableOpacity
      style={styles.filterButton}
      onPress={() => setShowFilterModal(true)}
    >
      <Ionicons name="filter" size={20} color={colors.primary} />
      <Text style={styles.filterButtonText}>{t('common.filter')}</Text>
      {(nameFilter || yearFilter || monthFilter) ? (
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>
            {[nameFilter, yearFilter, monthFilter].filter(Boolean).length}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );

  // Render Filter Chips
  const renderFilterChips = () => {
    if (!nameFilter && !yearFilter && !monthFilter) return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {nameFilter ? (
          <View style={styles.filterChip}>
            <Text style={styles.filterChipText}>{t('prediction.location')}: {nameFilter}</Text>
            <TouchableOpacity onPress={() => setNameFilter('')}>
              <Ionicons name="close-circle" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : null}

        {yearFilter ? (
          <View style={styles.filterChip}>
            <Text style={styles.filterChipText}>{t('prediction.year')}: {yearFilter}</Text>
            <TouchableOpacity onPress={() => setYearFilter('')}>
              <Ionicons name="close-circle" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : null}

        {monthFilter ? (
          <View style={styles.filterChip}>
            <Text style={styles.filterChipText}>{t('prediction.month')}: {monthFilter}</Text>
            <TouchableOpacity onPress={() => setMonthFilter('')}>
              <Ionicons name="close-circle" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity style={styles.clearAllChip} onPress={clearFilters}>
          <Text style={styles.clearAllChipText}>{t('common.clearAll')}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
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

            {/* Add the new button for entering actual yield */}
            <TouchableOpacity
              style={styles.actualYieldButton}
              onPress={() => handleEnterActualYield(item)}
            >
              <Ionicons name="clipboard-outline" size={16} color="#3B82F6" />
              <Text style={styles.actualYieldButtonText}>
                {t('prediction.enterActualYield')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.compareButton}
              onPress={() => handleCompareWithLastYear(item)}
            >
              <Ionicons name="analytics-outline" size={16} color={colors.primary} />
              <Text style={styles.compareButtonText}>{t('prediction.compareWithActualYield')}</Text>
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
      {/* Page Header with Filter Button */}
      <View style={styles.header}>
        {/* <Text style={styles.headerTitle}>{t('prediction.historyTitle')}</Text> */}
        {renderFilterButton()}
      </View>

      {/* Active Filters */}
      {renderFilterChips()}

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
          data={filteredHistory}
          renderItem={renderPredictionItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyComponent}
          ListFooterComponent={renderFooter}
          onEndReached={hasMore && !loading && !refreshing ? loadMorePredictions : null}
          onEndReachedThreshold={0.3}
          // Adding this key will force FlatList to re-render when the data changes
          extraData={[loading, refreshing, nameFilter, yearFilter, monthFilter]}
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

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>{t('common.filterBy')}</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>{t('prediction.location')}</Text>
              <TextInput
                style={styles.filterInput}
                value={nameFilter}
                onChangeText={setNameFilter}
                placeholder={t('prediction.filterLocationPlaceholder')}
              />
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>{t('prediction.year')}</Text>
              <TextInput
                style={styles.filterInput}
                value={yearFilter}
                onChangeText={setYearFilter}
                placeholder={t('prediction.filterYearPlaceholder')}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>{t('prediction.month')}</Text>
              <TextInput
                style={styles.filterInput}
                value={monthFilter}
                onChangeText={setMonthFilter}
                placeholder={t('prediction.filterMonthPlaceholder')}
              />
            </View>

            <View style={styles.filterActions}>
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearFilterText}>{t('common.clearAll')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyFilterButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyFilterText}>{t('common.apply')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Other existing modals remain unchanged */}
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
                {comparisonData.hasActualYield
                  ? t('prediction.actualComparisonTitle')
                  : comparisonData.hasLastYear
                    ? t('prediction.comparisonTitle')
                    : t('prediction.yieldTrendTitle')}
              </Text>
              <Text style={styles.modalSubtitle}>{comparisonData.location}</Text>

              {/* Chart visualization */}
              {comparisonData.hasActualYield ? (
                // Bar chart for actual vs predicted
                <View style={styles.barChartContainer}>
                  <View style={styles.barContainer}>
                    <View style={styles.barLabelContainer}>
                      <Text style={styles.barLabel}>{t('prediction.predicted')}</Text>
                    </View>
                    <View style={styles.barOuterContainer}>
                      <View
                        style={[
                          styles.bar,
                          styles.predictedBar,
                          {
                            width: `${Math.min(90, (comparisonData.predictedYield! / Math.max(comparisonData.predictedYield!, comparisonData.actualYield!) * 90))}%`
                          }
                        ]}
                      >
                        <Text style={styles.barValue}>{comparisonData.predictedYield!.toFixed(1)}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.barContainer}>
                    <View style={styles.barLabelContainer}>
                      <Text style={styles.barLabel}>{t('prediction.actual')}</Text>
                    </View>
                    <View style={styles.barOuterContainer}>
                      <View
                        style={[
                          styles.bar,
                          styles.actualBar,
                          {
                            width: `${Math.min(90, (comparisonData.actualYield! / Math.max(comparisonData.predictedYield!, comparisonData.actualYield!) * 90))}%`
                          }
                        ]}
                      >
                        <Text style={styles.barValue}>{comparisonData.actualYield!.toFixed(1)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                // Line chart for year-over-year comparison
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
              )}

              {/* Show different message based on data availability */}
              {comparisonData.hasActualYield ? (
                <View style={styles.comparisonResult}>
                  <View style={styles.comparisonResultInner}>
                    <Text style={styles.comparisonText}>
                      {t('prediction.accuracyResult', {
                        accuracy: Math.max(0, 100 - Math.abs(comparisonData.percentDifference || 0)).toFixed(1),
                        direction: (comparisonData.percentDifference || 0) > 0
                          ? t('prediction.overestimated')
                          : t('prediction.underestimated'),
                        percent: Math.abs(comparisonData.percentDifference || 0).toFixed(1)
                      })}
                    </Text>
                    <Ionicons
                      name={Math.abs(comparisonData.percentDifference || 0) < 10 ? "checkmark-circle" : "alert-circle"}
                      size={24}
                      color={Math.abs(comparisonData.percentDifference || 0) < 10 ? "#4CD964" : "#FF6B6B"}
                    />
                  </View>
                </View>
              ) : comparisonData.hasLastYear ? (
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
                    <Text style={[styles.comparisonText, { color: '#6B7280' }]}>
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
      <Modal
        visible={actualYieldModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActualYieldModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('prediction.enterActualYield')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('prediction.actualYieldPlaceholder')}
              keyboardType="numeric"
              value={actualYieldValue}
              onChangeText={setActualYieldValue}
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitActualYield}
              disabled={submittingActualYield}
            >
              {submittingActualYield ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>{t('common.submit')}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setActualYieldModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Actual Yield Modal */}
      <Modal
        visible={actualYieldModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setActualYieldModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { padding: 20 }]}>
            <Text style={styles.modalTitle}>{t('prediction.addActualYield')}</Text>

            {selectedPrediction && (
              <>
                <Text style={styles.modalSubtitle}>
                  {locationNames[selectedPrediction.location] || t('common.unknownLocation')} - {selectedPrediction.year}
                </Text>

                <View style={styles.predictedYieldContainer}>
                  <Text style={styles.predictedYieldLabel}>{t('prediction.predictedYield')}:</Text>
                  <Text style={styles.predictedYieldValue}>
                    {selectedPrediction.average_prediction.toFixed(1)} {t('prediction.nutsPerTree')}
                  </Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t('prediction.actualYieldLabel')}:</Text>
                  <TextInput
                    style={styles.input}
                    value={actualYieldValue}
                    onChangeText={setActualYieldValue}
                    keyboardType="numeric"
                    placeholder={t('prediction.enterActualYieldHint')}
                    autoFocus
                  />
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setActualYieldModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={submitActualYield}
                    disabled={submittingActualYield}
                  >
                    {submittingActualYield ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitButtonText}>{t('common.submit')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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

  // New styles for filtering
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  filterButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  filterBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersContent: {
    paddingRight: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 8,
    height: 32,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.primary,
    marginRight: 6,
  },
  clearAllChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    height: 32,
  },
  clearAllChipText: {
    fontSize: 12,
    color: '#EF4444',
  },

  // Filter Modal Styles
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  clearFilterButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  clearFilterText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  applyFilterButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  applyFilterText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },

  // Make sure your existing styles are here too
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
    marginRight: 5,
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
  actualYieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
  },
  actualYieldButtonText: {
    fontSize: 14,
    color: '#3B82F6',
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
  submitButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  inputContainer: {
    width: '100%',
    marginVertical: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: 16,
  },
  cancelButton: {
    padding: 12,
    marginRight: 12,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  predictedYieldContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  predictedYieldLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  predictedYieldValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  barChartContainer: {
    width: '100%',
    padding: 20,
    marginVertical: 10,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  barLabelContainer: {
    width: 80,
  },
  barLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
    marginRight: 10,
  },
  bar: {
    height: 34,
    minWidth: 40,
    borderRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  predictedBar: {
    backgroundColor: colors.primary,
  },
  actualBar: {
    backgroundColor: '#3B82F6',
  },
  barValue: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  barOuterContainer: {
    flex: 1,
    overflow: 'hidden',
  },
});

export default PredictionHistoryScreen;