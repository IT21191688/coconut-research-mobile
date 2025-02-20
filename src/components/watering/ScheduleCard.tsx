import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WateringSchedule } from '../../types';
import StatusBadge from '../common/StatusBadge';
import { colors } from '../../constants/colors';

interface ScheduleCardProps {
  schedule: WateringSchedule;
  onPress?: () => void;
  showDetails?: boolean;
  style?: ViewStyle;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
  schedule,
  onPress,
  showDetails = false,
  style,
}) => {
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getWaterNeedCategory = (amount: number): string => {
    if (amount >= 50) return "High";
    if (amount >= 30) return "Moderate";
    if (amount > 0) return "Low";
    return "None";
  };

  const getWaterNeedColor = (amount: number) => {
    if (amount >= 50) return {
      bg: colors.highWater + '20',
      text: colors.highWater
    };
    if (amount >= 30) return {
      bg: colors.moderateWater + '20',
      text: colors.moderateWater
    };
    if (amount > 0) return {
      bg: colors.lowWater + '20',
      text: colors.lowWater
    };
    return {
      bg: colors.noWater + '20',
      text: colors.noWater
    };
  };

  const Container = onPress ? TouchableOpacity : View;
  const containerProps = onPress ? { onPress } : {};

  const waterNeedColor = getWaterNeedColor(schedule.recommendedAmount);
  const waterNeedCategory = getWaterNeedCategory(schedule.recommendedAmount);

  return (
    <Container
      {...containerProps}
      style={[styles.container, style]}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.locationName}>
            {schedule.locationName || 'Location'}
          </Text>
          <Text style={styles.dateTime}>
            {formatDate(schedule.date)}, {formatTime(schedule.date)}
          </Text>
        </View>
        <StatusBadge status={schedule.status as any} size="small" />
      </View>

      <View style={styles.content}>
        <View style={styles.waterInfoContainer}>
          <Ionicons name="water-outline" size={18} color={colors.primary} />
          {schedule.status === 'completed' && schedule.actualAmount ? (
            <Text style={styles.waterInfo}>
              {schedule.actualAmount}/{schedule.recommendedAmount} liters used
            </Text>
          ) : (
            <Text style={styles.waterInfo}>
              {schedule.recommendedAmount} liters
            </Text>
          )}
          <View style={[styles.needCategoryBadge, { backgroundColor: waterNeedColor.bg }]}>
            <Text style={[styles.needCategoryText, { color: waterNeedColor.text }]}>
              {waterNeedCategory}
            </Text>
          </View>
        </View>

        {showDetails && (
          <TouchableOpacity style={styles.detailsButton} onPress={onPress}>
            <Text style={styles.detailsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {schedule.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText}>
            {schedule.notes}
          </Text>
        </View>
      )}

      {!showDetails && onPress && (
        <View style={styles.scheduleFooter}>
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  dateTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waterInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waterInfo: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
    marginLeft: 6,
    marginRight: 8,
  },
  needCategoryBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  needCategoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginRight: 2,
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  notesText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  scheduleFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginRight: 2,
  },
});

export default ScheduleCard;