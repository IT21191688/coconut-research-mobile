import React, { useEffect, useState } from "react";
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

const CopraGradingView: React.FC = () => {
  const navigation = useNavigation();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [predictedClass, setPredictedClass] = useState<string | null>(null);

  const [apiUrl, setApiUrl] = useState<string>("");

  // Add this useEffect to fetch URL on component mount
  useEffect(() => {
    fetchApiUrl();
  }, []);

  // Simple fetch function for getting API URL
  const fetchApiUrl = async () => {
    try {
      const response = await fetch(
        "https://node-backend-zjnf.onrender.com/api/v1/auth/get-url",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "success") {
        // Use url1 for prediction API
        setApiUrl(data.data.url1);
        console.log("Fetched API URL:", data.data.url1);
      } else {
        console.error("Failed to fetch URL:", data.message);
        // Use fallback URL
        setApiUrl("https://fallback-url.ngrok-free.app");
      }
    } catch (error) {
      console.error("Error fetching API URL:", error);
      // Use fallback URL
      setApiUrl("https://d6dc-212-104-228-76.ngrok-free.app");
    }
  };

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
        setPredictedClass(null); // Reset previous result
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
        setPredictedClass(null); // Reset previous result
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
    setPredictedClass(null); // Reset result before new request

    try {
      const apiUrls = `${apiUrl}/predict_grading`;

      const formData: any = new FormData();
      formData.append("file", {
        uri: imageUri,
        name: "image.jpg",
        type: "image/jpeg",
      });

      const response = await axios.post(apiUrls, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setPredictedClass(response.data.predicted_class); // Save predicted class
    } catch (error) {
      Alert.alert("Error", "Failed to grade copra. Please try again.");
      console.error("Error uploading image:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Copra Grading</Text>
          <Text style={styles.headerSubtitle}>
            Upload or capture an image for analysis
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
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons name="camera" size={28} color={colors.primary} />
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
                  { backgroundColor: colors.secondary + "15" },
                ]}
              >
                <Ionicons name="images" size={28} color={colors.secondary} />
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
              Selected image ready for analysis
            </Text>
          </View>
        )}

        {imageUri && !predictedClass && (
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
                <Text style={styles.submitButtonText}>Analyze Copra Grade</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {predictedClass && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Analysis Result</Text>
            <View style={styles.gradeContainer}>
              <Text style={styles.gradeLabel}>Grade</Text>
              <Text style={styles.gradeValue}>{predictedClass}</Text>
            </View>
            <TouchableOpacity
              style={styles.newAnalysisButton}
              onPress={() => {
                setImageUri(null);
                setPredictedClass(null);
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
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: colors.primary,
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
    backgroundColor: colors.white,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  gradeContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  gradeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  gradeValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.primary,
  },
  newAnalysisButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: colors.primary + "15",
  },
  newAnalysisText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default CopraGradingView;
