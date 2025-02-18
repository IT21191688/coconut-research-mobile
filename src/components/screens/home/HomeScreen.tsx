import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../common/Button';

const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome, {user?.name}!</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Active Locations</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Connected Devices</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <Button
            title="View Locations"
            onPress={() => {/* Navigate to locations */}}
            variant="primary"
            size="large"
            style={styles.button}
          />
          
          <Button
            title="Manage Devices"
            onPress={() => {/* Navigate to devices */}}
            variant="primary"
            size="large"
            style={styles.button}
          />
          
          <Button
            title="View Schedule"
            onPress={() => {/* Navigate to schedule */}}
            variant="primary"
            size="large"
            style={styles.button}
          />
        </View>

        <Button
          title="Sign Out"
          onPress={logout}
          variant="outline"
          size="medium"
          style={styles.signOutButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  actionsContainer: {
    flex: 1,
  },
  button: {
    marginBottom: 16,
  },
  signOutButton: {
    marginTop: 'auto',
  },
});

export default HomeScreen;