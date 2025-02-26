import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useWateringSchedule from '../../../hooks/useWateringSchedule';
import { HISTORY_PERIOD } from '../../../constants/wateringConstants';
import ScheduleCard from '../../../components/watering/ScheduleCard';
import ScheduleCalendarView from '../../../components/watering/ScheduleCalendarView';
import Button from '../../../components/common/Button';
import { colors } from '../../../constants/colors';

const ScheduleHistoryScreen: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const navigation = useNavigation();
  
  const {
    schedules,
    isLoading,
    isRefreshing,
    period,
    setPeriod,
    refreshSchedules,
    setCustomDateRange,
  } = useWateringSchedule();

  const handleSchedulePress = (schedule: any) => {
    navigation.navigate('ScheduleDetail', { scheduleId: schedule._id });
  };

  const renderFilterPill = (periodKey: keyof typeof HISTORY_PERIOD, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterPill,
        period === periodKey && styles.activeFilterPill,
      ]}
      onPress={() => setPeriod(periodKey)}
    >
      <Text
        style={[
          styles.filterPillText,
          period === periodKey && styles.activeFilterPillText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading schedules...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="calendar-outline"
          size={64}
          color={colors.gray300}
          style={styles.emptyIcon}
        />
        <Text style={styles.emptyTitle}>No Schedules Found</Text>
        <Text style={styles.emptyText}>
          {period === HISTORY_PERIOD.TODAY
            ? "You don't have any watering schedules for today."
            : period === HISTORY_PERIOD.WEEK
            ? "You don't have any watering schedules for this week."
            : period === HISTORY_PERIOD.MONTH
            ? "You don't have any watering schedules for this month."
            : "No watering schedules found for the selected period."}
        </Text>
        <Button
          title="Create New Schedule"
          variant="primary"
          leftIcon={
            <Ionicons name="add-circle-outline" size={18} color={colors.white} />
          }
          onPress={() => navigation.navigate('CreateSchedule')}
          style={styles.createButton}
        />
      </View>
    );
  };

  const getScheduleStatusSummary = () => {
    if (schedules.length === 0) return null;

    const completed = schedules.filter((s: { status: string; }) => s.status === 'completed').length;
    const pending = schedules.filter((s: { status: string; }) => s.status === 'pending').length;
    const skipped = schedules.filter((s: { status: string; }) => s.status === 'skipped').length;

    return (
      <View style={styles.statusSummary}>
        <View style={styles.statusItem}>
          <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
          <Text style={styles.statusText}>{completed} completed</Text>
        </View>
        <View style={styles.statusItem}>
          <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.statusText}>{pending} pending</Text>
        </View>
        <View style={styles.statusItem}>
          <View style={[styles.statusDot, { backgroundColor: colors.gray400 }]} />
          <Text style={styles.statusText}>{skipped} skipped</Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.periodFilterContainer}>
        {renderFilterPill(HISTORY_PERIOD.TODAY, 'Today')}
        {renderFilterPill(HISTORY_PERIOD.WEEK, 'This Week')}
        {renderFilterPill(HISTORY_PERIOD.MONTH, 'This Month')}
        {renderFilterPill(HISTORY_PERIOD.CUSTOM, 'Custom Range')}
      </View>

      {getScheduleStatusSummary()}

      <View style={styles.viewToggleContainer}>
        <TouchableOpacity
          style={[
            styles.viewToggleButton,
            viewMode === 'list' && styles.activeViewToggleButton,
          ]}
          onPress={() => setViewMode('list')}
        >
          <Ionicons
            name="list"
            size={20}
            color={viewMode === 'list' ? colors.primary : colors.gray500}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewToggleButton,
            viewMode === 'calendar' && styles.activeViewToggleButton,
          ]}
          onPress={() => setViewMode('calendar')}
        >
          <Ionicons
            name="calendar"
            size={20}
            color={viewMode === 'calendar' ? colors.primary : colors.gray500}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      {viewMode === 'list' ? (
        <FlatList
          data={schedules}
          renderItem={({ item }) => (
            <ScheduleCard
              schedule={item}
              onPress={() => handleSchedulePress(item)}
              style={styles.scheduleCard}
            />
          )}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshSchedules}
              colors={[colors.primary]}
            />
          }
        />
      ) : (
        <ScheduleCalendarView
          schedules={schedules}
          onSchedulePress={handleSchedulePress}
          containerStyle={styles.calendarContainer}
        />
      )}

      {period === HISTORY_PERIOD.CUSTOM && (
        <TouchableOpacity
          style={styles.dateRangeButton}
          onPress={() => {
            // This would normally open a date range picker
            Alert.alert('Custom Date Range', 'Date range picker would open here');
          }}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.white} />
          <Text style={styles.dateRangeButtonText}>Set Date Range</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  headerContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  periodFilterContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    marginRight: 8,
  },
  activeFilterPill: {
    backgroundColor: colors.primary + '20',
  },
  filterPillText: {
    fontSize: 14,
    color: colors.gray700,
  },
  activeFilterPillText: {
    fontWeight: '600',
    color: colors.primary,
  },
  statusSummary: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: colors.gray600,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    backgroundColor: colors.gray100,
    borderRadius: 8,
    padding: 2,
  },
  viewToggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeViewToggleButton: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  calendarContainer: {
    flex: 1,
    padding: 16,
  },
  scheduleCard: {
    marginBottom: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.gray600,
  },
  createButton: {
    minWidth: 200,
  },
  dateRangeButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  dateRangeButtonText: {
    color: colors.white,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ScheduleHistoryScreen;