import React, { useCallback, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { colors } from '../constants/colors';
import CoconutYieldScreen from '../components/screens/CoconutYield/CoconutYieldScreen';
import PredictionScreen from '../components/screens/CoconutYield/PredictionScreen';
import PredictionHistoryScreen from '../components/screens/CoconutYield/PredictionHistoryScreen';

// Define supported languages type for better type safety
type SupportedLanguage = 'en' | 'si' | 'ta';

// Add proper typing to the navigator
type CoconutYieldStackParamList = {
  CoconutYieldMain: undefined;
  Prediction: { locationId: string; locationName?: string };
  PredictionHistory: { locationId?: string } | undefined;
};

const Stack = createNativeStackNavigator<CoconutYieldStackParamList>();

const CoconutYieldNavigator = () => {
  const { t, i18n } = useTranslation();
  const [isChangingLang, setIsChangingLang] = useState(false);
  const [currentLangState, setCurrentLangState] = useState<SupportedLanguage>(
    (i18n.language || 'en').split('-')[0] as SupportedLanguage
  );
  
  // Simplified language change function
  const handleLanguageChange = useCallback((lang: SupportedLanguage) => {
    // Only process if it's a different language
    if (lang === currentLangState) {
      return;
    }
    
    // Set loading state immediately
    setIsChangingLang(true);
    
    // Update current language state immediately
    setCurrentLangState(lang);
    
    // Apply the language change to i18n
    i18n.changeLanguage(lang)
      .catch(error => {
        console.error('Language change failed:', error);
      })
      .finally(() => {
        // Always turn off loading state
        setIsChangingLang(false);
      });
  }, [i18n, currentLangState]);
  
  // Language button component
  const LanguageButton = ({ lang, label }: { lang: SupportedLanguage, label: string }) => {
    const isActive = currentLangState === lang;
    
    return (
      <TouchableOpacity 
        style={[styles.langButton, isActive && styles.activeLang]}
        onPress={() => handleLanguageChange(lang)}
        disabled={isChangingLang && isActive}
      >
        <Text style={[styles.langText, isActive && styles.activeText]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  // Header right component with language buttons
  const renderHeaderRight = () => (
    <View style={styles.headerRight}>
      {isChangingLang ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
      ) : (
        <>
          <LanguageButton lang="en" label="EN" />
          <LanguageButton lang="si" label="සිං" />
          <LanguageButton lang="ta" label="த" />
        </>
      )}
    </View>
  );

  return (
    <Stack.Navigator
      key={`coconut-navigator-${currentLangState}`}
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTitleStyle: { color: colors.textPrimary, fontWeight: 'bold' },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        headerRight: renderHeaderRight,
      }}
    >
      <Stack.Screen
        name="CoconutYieldMain"
        component={CoconutYieldScreen}
        options={{ 
          title: t('lands.title'),
        }}
      />
      <Stack.Screen
        name="Prediction"
        component={PredictionScreen}
        options={{ title: t('prediction.title') }}
      />
      <Stack.Screen
        name="PredictionHistory"
        component={PredictionHistoryScreen}
        options={{ title: t('prediction.historyTitle') }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    minWidth: 120, // Ensure consistent width during loading
    justifyContent: 'flex-end',
    height: 36, // Fix height to prevent layout shifts
  },
  langButton: {
    marginHorizontal: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeLang: {
    backgroundColor: colors.primary,
  },
  langText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  activeText: {
    color: colors.white,
  },
  loader: {
    marginHorizontal: 10,
  },
});

export default CoconutYieldNavigator;