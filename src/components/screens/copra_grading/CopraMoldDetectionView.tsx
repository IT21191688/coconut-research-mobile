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
import * as ImagePicker from "expo-image-picker";
import axios from "axios";

const CopraMoldDetectionView: React.FC = () => {
  const navigation = useNavigation();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [moldResult, setMoldResult] = useState<{
    class: string;
    confidence: number;
  } | null>(null);

  const handleImageCapture = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Camera access is needed to take photos"
      );
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
        setMoldResult(null); // Reset previous result
      }
    } catch (error) {
      Alert.alert("Error", "Failed to capture image");
    }
  };

  const handleImageUpload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Gallery access is needed to select photos"
      );
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
        setMoldResult(null); // Reset previous result
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select image");
    }
  };

  const handleSubmit = async () => {
    if (!imageUri) {
      Alert.alert("Error", "Please select an image first");
      return;
    }

    setLoading(true);
    setMoldResult(null); // Reset result before new request

    try {
      const apiUrl = "http://192.168.43.217:5000/predict_mold";

      const formData: any = new FormData();
      formData.append("file", {
        uri: imageUri,
        name: "image.jpg",
        type: "image/jpeg",
      });

      const response = await axios.post(apiUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMoldResult(response.data); // Save response
    } catch (error) {
      Alert.alert("Error", "Failed to detect mold. Please try again.");
      console.error("Error uploading image:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mold Detection</Text>
          <Text style={styles.headerSubtitle}>
            Check your copra sample for any signs of mold contamination
          </Text>
        </View>

        <View style={styles.resourceButtonsContainer}>
          <View style={styles.resourceButtons}>
            <TouchableOpacity
              style={styles.resourceButton}
              onPress={handleImageCapture}
            >
              <View
                style={[
                  styles.resourceIcon,
                  { backgroundColor: colors.error + "15" },
                ]}
              >
                <Ionicons name="camera" size={28} color={colors.error} />
              </View>
              <Text style={styles.resourceText}>Capture Image</Text>
              <Text style={styles.resourceSubtext}>Use camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resourceButton}
              onPress={handleImageUpload}
            >
              <View
                style={[
                  styles.resourceIcon,
                  { backgroundColor: colors.warning + "15" },
                ]}
              >
                <Ionicons name="images" size={28} color={colors.warning} />
              </View>
              <Text style={styles.resourceText}>Upload Image</Text>
              <Text style={styles.resourceSubtext}>From gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {imageUri && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.selectedImage}
              resizeMode="contain"
            />
            <Text style={styles.imageHint}>
              Selected image ready for mold analysis
            </Text>
          </View>
        )}

        {imageUri && !moldResult && (
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.white} />
                <Text style={styles.loadingText}>Analyzing...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="scan-outline" size={24} color={colors.white} />
                <Text style={styles.submitButtonText}>Detect Mold</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {moldResult && (
          <View
            style={[
              styles.resultContainer,
              {
                backgroundColor:
                  moldResult.class === "Healthy"
                    ? colors.success + "10"
                    : colors.error + "10",
              },
            ]}
          >
            <Text style={styles.resultTitle}>Analysis Result</Text>
            <View style={styles.resultContent}>
              <View
                style={[
                  styles.statusIndicator,
                  {
                    backgroundColor:
                      moldResult.class === "Healthy"
                        ? colors.success
                        : colors.error,
                  },
                ]}
              >
                <Ionicons
                  name={
                    moldResult.class === "Healthy"
                      ? "checkmark-circle"
                      : "warning"
                  }
                  size={32}
                  color={colors.white}
                />
              </View>
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      moldResult.class === "Healthy"
                        ? colors.success
                        : colors.error,
                  },
                ]}
              >
                {moldResult.class}
              </Text>
              <Text style={styles.confidenceText}>
                Confidence: {(moldResult.confidence * 100).toFixed(1)}%
              </Text>
            </View>
            <TouchableOpacity
              style={styles.newAnalysisButton}
              onPress={() => {
                setImageUri(null);
                setMoldResult(null);
              }}
            >
              <Text style={styles.newAnalysisText}>New Analysis</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  resourceButtonsContainer: {
    marginBottom: 24,
  },
  resourceButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  resourceButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resourceIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  resourceText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  resourceSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  imageContainer: {
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 16,
    marginBottom: 24,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedImage: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    backgroundColor: colors.light,
  },
  imageHint: {
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: colors.white,
    fontSize: 16,
  },
  resultContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultContent: {
    alignItems: "center",
    marginVertical: 20,
  },
  statusIndicator: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  statusText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  newAnalysisButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: colors.error + "15",
  },
  newAnalysisText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default CopraMoldDetectionView;
