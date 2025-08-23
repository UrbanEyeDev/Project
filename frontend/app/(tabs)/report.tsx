import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { uploadImage, generateUniqueFileName } from "../../utils/uploadImage";
import {
  analyzeImageWithGemini,
  imageUriToBase64,
  AIAnalysisResult,
  cleanMarkdownText,
} from "../../lib/gemini";

import ImageWithLoader from "../../components/ImageWithLoader";

export default function ReportScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationPermission, setLocationPermission] =
    useState<Location.PermissionStatus | null>(null);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setLocationPermission(status);
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status);
    return status;
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      if (locationPermission !== Location.PermissionStatus.GRANTED) {
        const permissionStatus = await requestLocationPermission();
        if (permissionStatus !== Location.PermissionStatus.GRANTED) {
          Alert.alert(
            "Location Permission Required",
            "UrbanEye needs access to your location to accurately report civic issues."
          );
          return;
        }
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(currentLocation);
      Alert.alert(
        "Location Captured",
        `Location captured successfully!\nLatitude: ${currentLocation.coords.latitude.toFixed(
          6
        )}\nLongitude: ${currentLocation.coords.longitude.toFixed(6)}`
      );
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert(
        "Location Error",
        "Could not get your current location. Please check your GPS settings."
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const compressImage = async (uri: string): Promise<string> => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return result.uri;
    } catch (error) {
      console.error("Image compression failed:", error);
      return uri;
    }
  };

  const uploadImageToStorage = async (uri: string): Promise<string> => {
    try {
      if (!uri.startsWith("file://") && !uri.startsWith("content://")) {
        throw new Error("Invalid image URI format. Please take a new photo.");
      }

      const compressedUri = await compressImage(uri);
      const fileName = generateUniqueFileName(compressedUri);
      const result = await uploadImage(compressedUri, fileName);

      if (!result.success || !result.publicUrl) {
        throw new Error(result.error || "Upload failed");
      }

      return result.publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const analyzeImageWithAI = async (imageUri: string) => {
    if (!imageUri) return;

    setAnalyzing(true);
    try {
      const base64Image = await imageUriToBase64(imageUri);
      const analysis = await analyzeImageWithGemini(base64Image);
      setAiAnalysis(analysis);

      Alert.alert(
        "AI Analysis Complete",
        `Detected: ${analysis.issueType}\nSeverity: ${analysis.severity}\nConfidence: ${analysis.confidence}%`
      );
    } catch (error) {
      console.error("Error analyzing image with AI:", error);
      Alert.alert(
        "AI Analysis Failed",
        "Could not analyze the image. You can still submit the report manually."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Camera permission is required to take photos"
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1.0,
      exif: false,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      if (imageUri.startsWith("file://") || imageUri.startsWith("content://")) {
        setImage(imageUri);
        setAiAnalysis(null);
      } else {
        Alert.alert("Error", "Invalid image format. Please try again.");
      }
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Gallery permission is required to select images"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1.0,
      exif: false,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      if (imageUri.startsWith("file://") || imageUri.startsWith("content://")) {
        setImage(imageUri);
        setAiAnalysis(null);
      } else {
        Alert.alert("Error", "Invalid image format. Please try again.");
      }
    }
  };

  const submitReport = async () => {
    if (!image) {
      Alert.alert("Error", "Please select or take a photo");
      return;
    }
    if (!aiAnalysis) {
      Alert.alert("Error", "Please analyze the image with AI first");
      return;
    }
    if (!location) {
      Alert.alert(
        "Error",
        "Please capture your location to help authorities locate the issue"
      );
      return;
    }

    setLoading(true);

    try {
      const imageUrl = await uploadImageToStorage(image);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Please log in to submit a report");
      }

      const reportData = {
        user_id: user.id,
        issue_type: aiAnalysis.issueType,
        user_description: aiAnalysis.description,
        ai_description: `AI Analysis: ${aiAnalysis.description}\n\nAI Confidence: ${aiAnalysis.confidence}%`,
        image_url: imageUrl,
        status: "reported",
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      const { error: insertError } = await supabase
        .from("issues")
        .insert(reportData);

      if (insertError) {
        throw insertError;
      }

      Alert.alert("🎉 Success!", "Your issue has been reported successfully!", [
        { text: "OK", onPress: () => router.push("/(tabs)/home") },
      ]);
    } catch (error) {
      console.error("Report submission failed:", error);
      Alert.alert(
        "❌ Error",
        error instanceof Error
          ? error.message
          : "Failed to submit report. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "#e74c3c";
      case "medium":
        return "#f39c12";
      case "low":
        return "#27ae60";
      default:
        return "#95a5a6";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "warning";
      case "medium":
        return "alert-circle";
      case "low":
        return "checkmark-circle";
      default:
        return "help-circle";
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Image Section */}
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Issue Photo</Text>
          {image ? (
            <View style={styles.imagePreviewContainer}>
              <ImageWithLoader
                uri={image}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setImage(null);
                  setAiAnalysis(null);
                }}
              >
                <Ionicons name="close-circle" size={24} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={48} color="#bdc3c7" />
              <Text style={styles.placeholderText}>No image selected</Text>
            </View>
          )}

          <View style={styles.imageButtons}>
            <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
              <Ionicons name="camera" size={20} color="white" />
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Ionicons name="images" size={20} color="white" />
              <Text style={styles.buttonText}>Upload from Gallery</Text>
            </TouchableOpacity>
          </View>

          {/* AI Analysis Button */}
          {image && !aiAnalysis && (
            <TouchableOpacity
              style={[styles.aiButton, analyzing && styles.aiButtonDisabled]}
              onPress={() => analyzeImageWithAI(image)}
              disabled={analyzing}
            >
              {analyzing ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="white" />
                  <Text style={styles.aiButtonText}>
                    Analyze with AI (Required)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* AI Analysis Results */}
          {aiAnalysis && (
            <View style={styles.aiAnalysisContainer}>
              <View style={styles.aiHeader}>
                <Ionicons name="sparkles" size={24} color="#9b59b6" />
                <Text style={styles.aiHeaderText}>AI Analysis Results</Text>
              </View>

              <View style={styles.aiResultRow}>
                <Text style={styles.aiLabel}>Detected Issue:</Text>
                <Text style={styles.aiValue}>{aiAnalysis.issueType}</Text>
              </View>

              <View style={styles.aiResultRow}>
                <Text style={styles.aiLabel}>Severity:</Text>
                <View style={styles.severityContainer}>
                  <Ionicons
                    name={getSeverityIcon(aiAnalysis.severity)}
                    size={16}
                    color={getSeverityColor(aiAnalysis.severity)}
                  />
                  <Text
                    style={[
                      styles.severityText,
                      { color: getSeverityColor(aiAnalysis.severity) },
                    ]}
                  >
                    {aiAnalysis.severity.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.aiResultRow}>
                <Text style={styles.aiLabel}>Confidence:</Text>
                <Text style={styles.aiValue}>{aiAnalysis.confidence}%</Text>
              </View>

              <View style={styles.aiDescriptionContainer}>
                <Text style={styles.aiLabel}>Description:</Text>
                <Text style={styles.aiDescription}>
                  {aiAnalysis.description}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Location Section */}
        <View style={styles.locationSection}>
          <Text style={styles.sectionTitle}>Issue Location</Text>

          {location ? (
            <View style={styles.locationInfo}>
              <View style={styles.locationHeader}>
                <Ionicons name="location" size={18} color="#27ae60" />
                <Text style={styles.locationStatusText}>Location Captured</Text>
              </View>

              <View style={styles.locationDisplay}>
                <View style={styles.locationPin}>
                  <Ionicons name="location" size={24} color="#e74c3c" />
                </View>
                <View style={styles.locationDetails}>
                  <Text style={styles.coordinatesDisplay}>
                    {location.coords.latitude.toFixed(6)},{" "}
                    {location.coords.longitude.toFixed(6)}
                  </Text>
                  <Text style={styles.accuracyDisplay}>
                    Accuracy: ±{Math.round(location.coords.accuracy || 0)}m
                  </Text>
                </View>
              </View>

              <View style={styles.mapActions}>
                <TouchableOpacity
                  style={styles.mapActionButton}
                  onPress={() => {
                    const url = `https://www.google.com/maps/search/?api=1&query=${location.coords.latitude},${location.coords.longitude}`;
                    Linking.openURL(url);
                  }}
                >
                  <Ionicons name="open-outline" size={14} color="#3498db" />
                  <Text style={styles.mapActionText}>View in Maps</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.locationPlaceholder}>
              <Ionicons name="location-outline" size={40} color="#bdc3c7" />
              <Text style={styles.locationPlaceholderText}>
                No location captured
              </Text>
              <Text style={styles.locationPlaceholderSubtext}>
                Capture your current location to help authorities locate the
                issue
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.locationButton,
              locationLoading && styles.locationButtonDisabled,
            ]}
            onPress={getCurrentLocation}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons
                  name={location ? "refresh" : "location"}
                  size={18}
                  color="white"
                />
                <Text style={styles.locationButtonText}>
                  {location ? "Update Location" : "Capture Location"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={submitReport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <View style={styles.submitButtonContent}>
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  scrollContainer: {
    padding: 20,
  },
  imageSection: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 16,
  },
  imagePreviewContainer: {
    position: "relative",
    marginBottom: 16,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    resizeMode: "cover",
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#333",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#444",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  placeholderText: {
    color: "#999",
    marginTop: 8,
    fontSize: 14,
  },
  imageButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  imageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1abc9c",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  buttonText: {
    color: "white",
    marginLeft: 8,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#e74c3c",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#666",
    shadowOpacity: 0.1,
    elevation: 4,
  },
  submitButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },
  aiButton: {
    backgroundColor: "#f39c12",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  aiButtonDisabled: {
    backgroundColor: "#666",
    shadowOpacity: 0.05,
    elevation: 2,
  },
  aiButtonText: {
    color: "white",
    marginLeft: 8,
    fontWeight: "600",
  },
  aiAnalysisContainer: {
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 3,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  aiHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginLeft: 8,
  },
  aiResultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  aiLabel: {
    fontSize: 14,
    color: "#ccc",
    fontWeight: "500",
  },
  aiValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  severityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  severityText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 5,
  },
  aiDescriptionContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  aiDescription: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 20,
  },
  locationSection: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationInfo: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationStatusText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#27ae60",
    marginLeft: 6,
  },
  locationDisplay: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  locationPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#444",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  locationDetails: {
    flex: 1,
  },
  coordinatesDisplay: {
    fontSize: 13,
    color: "white",
    fontWeight: "600",
    marginBottom: 2,
    fontFamily: "monospace",
  },
  accuracyDisplay: {
    fontSize: 11,
    color: "#999",
  },
  locationPlaceholder: {
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
  },
  locationPlaceholderText: {
    fontSize: 15,
    color: "#999",
    marginTop: 6,
    fontWeight: "500",
  },
  locationPlaceholderSubtext: {
    fontSize: 13,
    color: "#666",
    marginTop: 3,
    textAlign: "center",
    lineHeight: 18,
  },
  locationButton: {
    backgroundColor: "#1abc9c",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationButtonDisabled: {
    backgroundColor: "#666",
    shadowOpacity: 0.05,
    elevation: 2,
  },
  locationButtonText: {
    color: "white",
    marginLeft: 8,
    fontWeight: "600",
  },
  mapActions: {
    marginTop: 8,
  },
  mapActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1abc9c",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  mapActionText: {
    color: "#3498db",
    fontSize: 11,
    fontWeight: "500",
  },
});
