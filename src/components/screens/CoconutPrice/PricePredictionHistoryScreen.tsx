import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Dimensions,
    TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { priceApi, PricePredictionHistory } from '../../../api/priceApi';
import { colors } from '../../../constants/colors';
import { LineChart } from 'react-native-chart-kit';
import moment from 'moment';

interface PricePredictionHistoryScreenProps {
    navigation: NavigationProp<any>;
}

const PricePredictionHistoryScreen: React.FC<PricePredictionHistoryScreenProps> = ({ navigation }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<PricePredictionHistory[]>([]);
    const [filteredHistory, setFilteredHistory] = useState<PricePredictionHistory[]>([]);
    const [showChart, setShowChart] = useState(false);
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true);
            const data = await priceApi.getPricePredictionHistory();
            setHistory(data);
        } catch (error) {
            console.error('Error fetching history:', error);
            Alert.alert(t('common.error'), t('price.fetchError'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        applyFilters();
    }, [history, filterMonth, filterYear]);

    const applyFilters = useCallback(() => {
        let filtered = [...history];

        if (filterMonth) {
            filtered = filtered.filter(item =>
                item.month.toLowerCase().includes(filterMonth.toLowerCase())
            );
        }

        if (filterYear) {
            filtered = filtered.filter(item =>
                String(item.year).includes(filterYear)
            );
        }

        setFilteredHistory(filtered);
    }, [history, filterMonth, filterYear]);

    const handleDelete = async (predictionId: string) => {
        Alert.alert(
            t('common.confirm'),
            t('price.deleteConfirmation'),
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
                            setLoading(true);
                            await priceApi.deletePricePrediction(predictionId);
                            await fetchHistory();
                        } catch (error) {
                            console.error('Error deleting prediction:', error);
                            Alert.alert(t('common.error'), t('price.deleteError'));
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const toggleChart = () => setShowChart(!showChart);

    const toggleFilters = () => setShowFilters(!showFilters);

    const renderPriceChart = () => {
        const recentPredictions = [...filteredHistory]
            .sort((a, b) => new Date(b.prediction_date).getTime() - new Date(a.prediction_date).getTime())
            .slice(0, 6)
            .reverse();

        // Calculate the available width for the chart accounting for padding
        const chartWidth = Dimensions.get('window').width - 64;

        // Calculate min and max values for Y-axis with some padding
        const prices = recentPredictions.map(p => p.predicted_price);
        const minValue = Math.floor(Math.min(...prices) * 0.95); // 5% below min
        const maxValue = Math.ceil(Math.max(...prices) * 1.05); // 5% above max

        const chartData = {
            labels: recentPredictions.map(p => moment(`${p.month} ${p.year}`, 'MMMM YYYY').format('MMM')),
            datasets: [
                {
                    data: recentPredictions.map(p => p.predicted_price),
                    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                    strokeWidth: 3,
                },
            ],
        };

        const chartConfig = {
            backgroundColor: colors.white,
            backgroundGradientFrom: colors.white,
            backgroundGradientTo: colors.white,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            labelColor: (opacity = 1) => colors.textSecondary,
            style: {
                borderRadius: 16,
            },
            propsForDots: {
                r: '5',
                strokeWidth: '2',
                stroke: colors.primary,
            },
            formatYLabel: (y: string | number) => `${y}`,
            horizontalLabelRotation: -45,
            xLabelsOffset: -10,
            bezier: true,
            // Set min and max values for Y-axis
            min: minValue,
            max: maxValue,
        };

        return (
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>{t('price.priceChart')}</Text>
                <View style={styles.chartWrapper}>
                    <LineChart
                        data={chartData}
                        width={chartWidth}
                        height={220}
                        chartConfig={chartConfig}
                        style={styles.chart}
                        yAxisLabel="Rs "
                        yAxisSuffix=""
                        withVerticalLines={false}
                        withHorizontalLines={true}
                        withVerticalLabels={true}
                        withHorizontalLabels={true}
                        withInnerLines={false}
                        segments={4}
                    />
                </View>
                <View style={styles.legendContainer}>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <TouchableOpacity style={styles.filterIconContainer} onPress={toggleFilters}>
                    <Ionicons name="options-outline" size={24} color={colors.primary} />
                </TouchableOpacity>

                {showFilters && (
                    <View style={styles.filterContainer}>
                        <View style={styles.filterInputContainer}>
                            <TextInput
                                style={styles.filterInput}
                                placeholder={t('price.month')}
                                value={filterMonth}
                                onChangeText={setFilterMonth}
                            />
                        </View>
                        <View style={styles.filterInputContainer}>
                            <TextInput
                                style={styles.filterInput}
                                placeholder={t('prediction.year')}
                                value={filterYear}
                                onChangeText={setFilterYear}
                                keyboardType="number-pad"
                            />
                        </View>
                    </View>
                )}

                <View style={styles.chartToggleContainer}>
                    <TouchableOpacity
                        style={[styles.chartToggleButton, showChart && styles.chartToggleButtonActive]}
                        onPress={toggleChart}
                    >
                        <Ionicons
                            name={showChart ? "stats-chart" : "stats-chart-outline"}
                            size={20}
                            color={showChart ? "#FFFFFF" : colors.primary}
                        />
                        <Text style={[
                            styles.chartToggleText,
                            showChart && styles.chartToggleTextActive
                        ]}>
                            {t('price.viewTrend')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {showChart && filteredHistory.length > 0 && renderPriceChart()}

                {filteredHistory.map((prediction, index) => (
                    <View key={prediction._id} style={styles.predictionCard}>
                        <View style={styles.cardHeader}>
                            <View style={styles.dateContainer}>
                                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                                <Text style={styles.dateText}>
                                    {prediction.month} {prediction.year}
                                </Text>
                            </View>
                            <View style={styles.cardActions}>
                                {prediction.isLatest && (
                                    <View style={styles.latestBadge}>
                                        <Text style={styles.latestText}>{t('price.latest')}</Text>
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDelete(prediction._id)}
                                >
                                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.priceContainer}>
                            <Text style={styles.priceLabel}>{t('price.predictedPrice')}</Text>
                            <Text style={styles.priceValue}>
                                Rs. {prediction.predicted_price.toFixed(2)}
                            </Text>
                        </View>

                        <View style={styles.detailsGrid}>
                            <View style={styles.detailItem}>
                                <Ionicons name="leaf-outline" size={20} color={colors.success} />
                                <Text style={styles.detailLabel}>{t('price.yieldNuts')}</Text>
                                <Text style={styles.detailValue}>{prediction.yield_nuts}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Ionicons name="trending-up-outline" size={20} color="#ff6b6b" />
                                <Text style={styles.detailLabel}>{t('price.inflationRate')}</Text>
                                <Text style={styles.detailValue}>{prediction.inflation_rate}%</Text>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        marginTop: -36,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 16,
    },
    backButton: {
        padding: 10,
        marginRight: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    filterInputContainer: {
        flex: 1,
        marginRight: 12,
    },
    filterInput: {
        height: 48,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        backgroundColor: colors.white,
        color: colors.textPrimary,
        fontSize: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    predictionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        padding: 8,
        borderRadius: 12,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.primary,
        marginLeft: 8,
    },
    latestBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },
    latestText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    priceContainer: {
        marginBottom: 24,
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderRadius: 16,
    },
    priceLabel: {
        fontSize: 15,
        color: colors.textSecondary,
        marginBottom: 8,
        fontWeight: '500',
    },
    priceValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.primary,
        letterSpacing: -0.5,
    },
    detailsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 16,
    },
    detailItem: {
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: 12,
    },
    detailLabel: {
        fontSize: 13,
        color: colors.textSecondary,
        marginVertical: 6,
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    deleteButton: {
        padding: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
    },
    chartContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 16,
        textAlign: 'center',
    },
    chartWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    chart: {
        marginVertical: 8,
        marginHorizontal: 0,
        borderRadius: 16,
    },
    chartToggleContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    chartToggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    chartToggleButtonActive: {
        backgroundColor: colors.primary,
    },
    chartToggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    chartToggleTextActive: {
        color: '#FFFFFF',
    },
    filterIconContainer: {
        padding: 10,
        alignItems: 'flex-end',
        
    },
    legendContainer: {
        marginTop: 16,
        alignItems: 'center',
    },
    legendText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
});

export default PricePredictionHistoryScreen;