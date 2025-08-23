import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "react-native";

export default function HomeScreen() {
  const openMumbaiMap = async () => {
    try {
      // Search for Mumbai city in general view
      const url = `https://www.google.com/maps/search/Mumbai,+Maharashtra,+India`;

      // Check if Google Maps app is available
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback to web browser if app is not available
        await Linking.openURL(url);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Unable to open Google Maps. Please make sure Google Maps is installed on your device.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      {/* Logo Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
          />
        </View>
      </View>

      <View style={styles.content}>
        {/* Quick Actions Section */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/(tabs)/report")}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#e74c3c" }]}>
                <Ionicons name="camera" size={24} color="white" />
              </View>
              <Text style={styles.actionText}>Report Issue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/(tabs)/history")}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#1abc9c" }]}>
                <Ionicons name="list" size={24} color="white" />
              </View>
              <Text style={styles.actionText}>My Complaints</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={openMumbaiMap}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#3498db" }]}>
                <Ionicons name="map" size={24} color="white" />
              </View>
              <Text style={styles.actionText}>City Map</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* City Overview Section */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>City Overview</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: "#e74c3c" }]}>
                1,247
              </Text>
              <Text style={styles.statLabel}>Total Issues</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: "#1abc9c" }]}>892</Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: "#3498db" }]}>234</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: "#f39c12" }]}>
                2.3h
              </Text>
              <Text style={styles.statLabel}>Response Time</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },

  // Header
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },

  // Content
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    flex: 1,
    justifyContent: "flex-start",
  },

  // Quick Actions Section
  quickActionsSection: {
    marginBottom: 10,
    backgroundColor: "#2a2a2a",
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  actionButton: {
    width: "30%",
    alignItems: "center",
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },

  // Overview Section
  overviewSection: {
    backgroundColor: "#2a2a2a",
    padding: 16,
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: "white",
    textAlign: "center",
    fontWeight: "500",
  },
});
