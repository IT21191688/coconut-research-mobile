import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../../constants/colors";
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const CopraGradingView: React.FC = () => {
  const navigation = useNavigation();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [predictedClass, setPredictedClass] = useState<string | null>(null);

  const handleImageCapture = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Camera access is needed to take photos');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        setPredictedClass(null); // Reset previous result
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const handleImageUpload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Gallery access is needed to select photos');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        setPredictedClass(null); // Reset previous result
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleSubmit = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    setLoading(true);
    setPredictedClass(null); // Reset result before new request

    try {
      const apiUrl = 'https://d076-212-104-231-55.ngrok-free.app/predict_grading';

      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        name: 'image.jpg',
        type: 'image/jpeg',
      });

      const response = await axios.post(apiUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setPredictedClass(response.data.predicted_class); // Save predicted class

    } catch (error) {
      Alert.alert('Error', 'Failed to grade copra. Please try again.');
      console.error('Error uploading image:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.resourceButtonsContainer}>
          <View style={styles.resourceButtons}>
            <TouchableOpacity style={styles.resourceButton} onPress={handleImageCapture}>
              <View style={[styles.resourceIcon, { backgroundColor: colors.primary + "20" }]}>
                <Ionicons name="camera" size={24} color={colors.primary} />
              </View>
              <Text style={styles.resourceText}>Capture Image</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resourceButton} onPress={handleImageUpload}>
              <View style={[styles.resourceIcon, { backgroundColor: colors.secondary + "20" }]}>
                <Ionicons name="cloud-upload-outline" size={24} color={colors.secondary} />
              </View>
              <Text style={styles.resourceText}>Upload Image</Text>
            </TouchableOpacity>
          </View>
        </View>

        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.selectedImage} resizeMode="contain" />
          </View>
        )}

        {/* Show button only if no predicted class */}
        {imageUri && !predictedClass && (
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Copra Grade Identification</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Show predicted class result */}
        {predictedClass && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Predicted Grade</Text>
            <Text style={styles.resultText}>{predictedClass}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  resourceButtonsContainer: {
    marginTop: 8,
  },
  resourceButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  resourceButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resourceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  resourceText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  imageContainer: {
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  submitButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  resultText: {
    fontSize: 16,
    color: colors.primary,
    marginTop: 8,
  },
});

export default CopraGradingView;
