import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { priceApi, PricePredictionResponse } from '../../../api/priceApi';
import { colors } from '../../../constants/colors';

interface CoconutPricePredictScreenProps {
    navigation: NavigationProp<any>;
}

const CoconutPricePredictScreen: React.FC<CoconutPricePredictScreenProps> = ({ navigation }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PricePredictionResponse | null>(null);

    // Form inputs
    const [yieldNuts, setYieldNuts] = useState('');
    const [exportVolume, setExportVolume] = useState('');
    const [domesticConsumption, setDomesticConsumption] = useState('');
    const [inflationRate, setInflationRate] = useState('');
    const [predictionDate, setPredictionDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Previous prices
    const [previousPrice1, setPreviousPrice1] = useState('');
    const [previousPrice3, setPreviousPrice3] = useState('');
    const [previousPrice6, setPreviousPrice6] = useState('');
    const [previousPrice12, setPreviousPrice12] = useState('');

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setPredictionDate(selectedDate);
        }
    };

    // Add this new handler function to auto-fill export and domestic values
    const handleYieldChange = (value: string) => {
        setYieldNuts(value);

        // Auto-calculate export and domestic values when yield changes
        const yieldValue = parseFloat(value);
        if (!isNaN(yieldValue)) {
            // Calculate export (1/3) and domestic (2/3)
            const exportVal = (yieldValue / 3).toFixed(1);
            const domesticVal = (yieldValue * 2 / 3).toFixed(1);

            // Update the state variables
            setExportVolume(exportVal);
            setDomesticConsumption(domesticVal);
        }
    };

    const validateForm = () => {
        // Check if required fields have values
        if (
            !yieldNuts ||
            !exportVolume ||
            !domesticConsumption ||
            !inflationRate
        ) {
            Alert.alert(
                t('price.validationError'),
                t('price.fillRequiredFields')
            );
            return false;
        }

        // Check if export + domestic = yield
        const totalYield = parseFloat(yieldNuts);
        const totalExport = parseFloat(exportVolume);
        const totalDomestic = parseFloat(domesticConsumption);

        if (totalExport + totalDomestic !== totalYield) {
            Alert.alert(
                t('price.validationError'),
                t('price.exportPlusDomestic')
            );
            return false;
        }

        return true;
    };

    const handlePredict = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);

            // Previous prices object with only values that were provided
            const previousPrices = {
                '1': previousPrice1 ? parseFloat(previousPrice1) : 0,
                '3': previousPrice3 ? parseFloat(previousPrice3) : 0,
                '6': previousPrice6 ? parseFloat(previousPrice6) : 0,
                '12': previousPrice12 ? parseFloat(previousPrice12) : 0,
            };
            
            // Check if at least one value in previousPrices is greater than 0
            const hasPreviousPrices = Object.values(previousPrices).some(price => price > 0);
            
            const data: {
                yield_nuts: number;
                export_volume: number;
                domestic_consumption: number;
                inflation_rate: number;
                prediction_date: string;
                previous_prices?: {
                    '1': number;
                    '3': number;
                    '6': number;
                    '12': number;
                };
            } = {
                yield_nuts: parseFloat(yieldNuts),
                export_volume: parseFloat(exportVolume),
                domestic_consumption: parseFloat(domesticConsumption),
                inflation_rate: parseFloat(inflationRate),
                prediction_date: predictionDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
            };
            
            // Conditionally add previous_prices if at least one value is greater than 0
            if (hasPreviousPrices) {
                data.previous_prices = previousPrices;
            }
            

            const response = await priceApi.predictPrice(data);
            setResult(response);

        } catch (error) {
            console.error('Error predicting coconut price:', error);
            Alert.alert(
                t('price.predictionError'),
                t('price.tryAgainLater')
            );
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setResult(null);
        setYieldNuts('');
        setExportVolume('');
        setDomesticConsumption('');
        setInflationRate('');
        setPredictionDate(new Date());
        setPreviousPrice1('');
        setPreviousPrice3('');
        setPreviousPrice6('');
        setPreviousPrice12('');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoid}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {!result ? (
                        <>
                            <View style={styles.infoCard}>
                                <Ionicons name="information-circle-outline" size={24} color="#3B82F6" />
                                <Text style={styles.infoText}>
                                    {t('price.infoMessage')}
                                </Text>
                            </View>

                            <View style={styles.formSection}>
                                <Text style={styles.sectionTitle}>{t('price.marketConditions')}</Text>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>{t('price.yieldNuts')}</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={yieldNuts}
                                        onChangeText={handleYieldChange}
                                        keyboardType="numeric"
                                        placeholder={t('price.enterValue')}
                                    />
                                    {yieldNuts && !isNaN(parseFloat(yieldNuts)) && (
                                        <Text style={styles.helperText}>
                                            {t('price.autoFillMessage')}
                                        </Text>
                                    )}
                                </View>

                                <View style={styles.rowInputs}>
                                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                        <Text style={styles.label}>{t('price.exportVolume')}</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={exportVolume}
                                            onChangeText={setExportVolume}
                                            keyboardType="numeric"
                                            placeholder={t('price.enterValue')}
                                        />
                                    </View>

                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <Text style={styles.label}>{t('price.domesticConsumption')}</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={domesticConsumption}
                                            onChangeText={setDomesticConsumption}
                                            keyboardType="numeric"
                                            placeholder={t('price.enterValue')}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>{t('price.inflationRate')}</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={inflationRate}
                                        onChangeText={setInflationRate}
                                        keyboardType="numeric"
                                        placeholder={t('price.enterPercentage')}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>{t('price.predictionDate')}</Text>
                                    <TouchableOpacity
                                        style={styles.datePickerButton}
                                        onPress={() => setShowDatePicker(true)}
                                    >
                                        <Text style={styles.datePickerText}>
                                            {predictionDate.toISOString().split('T')[0]}
                                        </Text>
                                        <Ionicons name="calendar" size={20} color="#6B7280" />
                                    </TouchableOpacity>
                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={predictionDate}
                                            mode="date"
                                            display="default"
                                            minimumDate={new Date()}
                                            onChange={handleDateChange}
                                        />
                                    )}
                                </View>
                            </View>

                            <View style={styles.formSection}>
                                <Text style={styles.sectionTitle}>{t('price.previousPrices')} ({t('common.optional')})</Text>

                                <View style={styles.rowInputs}>
                                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                        <Text style={styles.label}>{t('price.lastMonth')} ({t('common.optional')})</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={previousPrice1}
                                            onChangeText={setPreviousPrice1}
                                            keyboardType="numeric"
                                            placeholder={t('price.enterPrice')}
                                        />
                                    </View>

                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <Text style={styles.label}>{t('price.threeMonthsAgo')} ({t('common.optional')})</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={previousPrice3}
                                            onChangeText={setPreviousPrice3}
                                            keyboardType="numeric"
                                            placeholder={t('price.enterPrice')}
                                        />
                                    </View>
                                </View>

                                <View style={styles.rowInputs}>
                                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                        <Text style={styles.label}>{t('price.sixMonthsAgo')} ({t('common.optional')})</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={previousPrice6}
                                            onChangeText={setPreviousPrice6}
                                            keyboardType="numeric"
                                            placeholder={t('price.enterPrice')}
                                        />
                                    </View>

                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <Text style={styles.label}>{t('price.twelveMonthsAgo')} ({t('common.optional')})</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={previousPrice12}
                                            onChangeText={setPreviousPrice12}
                                            keyboardType="numeric"
                                            placeholder={t('price.enterPrice')}
                                        />
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.predictButton}
                                onPress={handlePredict}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons name="analytics" size={20} color="#FFFFFF" />
                                        <Text style={styles.predictButtonText}>{t('price.predict')}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </>
                    ) : (
                        // Results view
                        <View style={styles.resultContainer}>
                            <View style={styles.resultHeader}>
                                <Text style={styles.resultTitle}>{t('price.predictionResult')}</Text>
                                <Text style={styles.resultDate}>
                                    {result.month} {result.year}
                                </Text>
                            </View>

                            <View style={styles.priceContainer}>
                                <Text style={styles.priceLabel}>{t('price.predictedPrice')}</Text>
                                <Text style={styles.priceValue}>
                                    Rs. {result.predicted_price.toFixed(2)}
                                </Text>
                                <Text style={styles.priceUnit}>{t('price.perNut')}</Text>
                            </View>

                            <View style={styles.resultInfoCard}>
                                <Text style={styles.resultInfoTitle}>{t('price.marketFactors')}</Text>

                                <View style={styles.factorRow}>
                                    <View style={styles.factorColumn}>
                                        <Text style={styles.factorLabel}>{t('price.yieldNuts')}</Text>
                                        <Text style={styles.factorValue}>{result.yield_nuts}</Text>
                                    </View>

                                    <View style={styles.factorColumn}>
                                        <Text style={styles.factorLabel}>{t('price.inflationRate')}</Text>
                                        <Text style={styles.factorValue}>{result.inflation_rate}%</Text>
                                    </View>
                                </View>

                                <View style={styles.factorRow}>
                                    <View style={styles.factorColumn}>
                                        <Text style={styles.factorLabel}>{t('price.exportVolume')}</Text>
                                        <Text style={styles.factorValue}>{result.export_volume}</Text>
                                    </View>

                                    <View style={styles.factorColumn}>
                                        <Text style={styles.factorLabel}>{t('price.domesticConsumption')}</Text>
                                        <Text style={styles.factorValue}>{result.domestic_consumption}</Text>
                                    </View>
                                </View>

                                <View style={styles.priceHistorySection}>
                                    <Text style={styles.priceHistoryTitle}>{t('price.priceHistory')}</Text>
                                    
                                    {result.previous_prices ? (
                                        <View style={styles.priceHistoryRow}>
                                            <View style={styles.priceHistoryItem}>
                                                <Text style={styles.priceHistoryMonth}>1 {t('price.month')}</Text>
                                                <Text style={styles.priceHistoryValue}>
                                                    {result.previous_prices['1'] ? `Rs. ${result.previous_prices['1']}` : '-'}
                                                </Text>
                                            </View>
                                            
                                            <View style={styles.priceHistoryItem}>
                                                <Text style={styles.priceHistoryMonth}>3 {t('price.months')}</Text>
                                                <Text style={styles.priceHistoryValue}>
                                                    {result.previous_prices['3'] ? `Rs. ${result.previous_prices['3']}` : '-'}
                                                </Text>
                                            </View>
                                            
                                            <View style={styles.priceHistoryItem}>
                                                <Text style={styles.priceHistoryMonth}>6 {t('price.months')}</Text>
                                                <Text style={styles.priceHistoryValue}>
                                                    {result.previous_prices['6'] ? `Rs. ${result.previous_prices['6']}` : '-'}
                                                </Text>
                                            </View>
                                            
                                            <View style={styles.priceHistoryItem}>
                                                <Text style={styles.priceHistoryMonth}>12 {t('price.months')}</Text>
                                                <Text style={styles.priceHistoryValue}>
                                                    {result.previous_prices['12'] ? `Rs. ${result.previous_prices['12']}` : '-'}
                                                </Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={styles.noPriceHistoryContainer}>
                                            <Text style={styles.noPriceHistoryText}>
                                                {t('price.noPriceHistory')}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            <View style={styles.resultActions}>
                                <TouchableOpacity
                                    style={styles.newPredictionButton}
                                    onPress={resetForm}
                                >
                                    <Ionicons name="refresh" size={20} color="#FFFFFF" />
                                    <Text style={styles.newPredictionText}>{t('price.newPrediction')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    infoCard: {
        backgroundColor: '#EBF8FF',
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#BEE3F8',
    },
    infoText: {
        fontSize: 14,
        color: '#2563EB',
        flex: 1,
        marginLeft: 12,
    },
    formSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1F2937',
    },
    rowInputs: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    datePickerButton: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    datePickerText: {
        fontSize: 16,
        color: '#1F2937',
    },
    predictButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    predictButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    // Results styles
    resultContainer: {
        flex: 1,
    },
    resultHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    resultDate: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 4,
    },
    priceContainer: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    priceLabel: {
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    priceValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginVertical: 8,
    },
    priceUnit: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    resultInfoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    resultInfoTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 16,
    },
    factorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    factorColumn: {
        flex: 1,
    },
    factorLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    factorValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 4,
    },
    priceHistorySection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderColor: '#E5E7EB',
    },
    priceHistoryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    priceHistoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    priceHistoryItem: {
        alignItems: 'center',
    },
    priceHistoryMonth: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    priceHistoryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    resultActions: {
        marginTop: 20,
    },
    newPredictionButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    newPredictionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    helperText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
        marginBottom: 8,
        fontStyle: 'italic',
    },
    noPriceHistoryContainer: {
        padding: 12,
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    noPriceHistoryText: {
        fontSize: 14,
        color: '#6B7280',
        fontStyle: 'italic',
    },
});

export default CoconutPricePredictScreen;