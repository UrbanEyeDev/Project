import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import ImageWithLoader from "../../components/ImageWithLoader";

interface Issue {
  id: number;
  issue_type: string;
  user_description: string;
  ai_description: string;
  image_url: string;
  status: string;
  created_at: string;
  latitude?: number;
  longitude?: number;
}

export default function HomeScreen() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, []);

  async function fetchIssues() {
    try {
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch issues");
      console.error("Error fetching issues:", error);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchIssues();
    setRefreshing(false);
  };

  const renderIssueCard = ({ item }: { item: Issue }) => (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <ImageWithLoader
          uri={item.image_url}
          style={styles.issueImage}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {item.status.replace("_", " ")}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardContent}>
        {/* Header with issue type and AI badge */}
        <View style={styles.cardHeader}>
          <View style={styles.issueTypeContainer}>
            <View style={styles.issueIconContainer}>
              <Ionicons
                name={getIssueIcon(item.issue_type)}
                size={18}
                color="#3498db"
              />
            </View>
            <Text style={styles.issueType}>{item.issue_type}</Text>
            {item.ai_description && (
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={10} color="#27ae60" />
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            )}
          </View>
        </View>

        {/* User description */}
        <Text style={styles.description} numberOfLines={2}>
          {item.user_description}
        </Text>

        {/* AI Analysis section - only show if exists */}
        {item.ai_description && (
          <View style={styles.aiDescriptionContainer}>
            <View style={styles.aiDescriptionHeader}>
              <Ionicons name="analytics" size={12} color="#27ae60" />
              <Text style={styles.aiDescriptionLabel}>AI Analysis</Text>
            </View>
            <Text style={styles.aiDescriptionText} numberOfLines={2}>
              {item.ai_description}
            </Text>
          </View>
        )}

        {/* Footer with timestamp and priority */}
        <View style={styles.cardFooter}>
          <View style={styles.timestampContainer}>
            <Ionicons name="time-outline" size={12} color="#95a5a6" />
            <Text style={styles.timestamp}>
              {new Date(item.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>

          <View style={styles.severityIndicator}>
            <View
              style={[
                styles.severityDot,
                { backgroundColor: getSeverityColor(item.ai_description) },
              ]}
            />
            <Text style={styles.severityText}>Priority</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reported":
        return "#3498db";
      case "in_progress":
        return "#f39c12";
      case "resolved":
        return "#27ae60";
      default:
        return "#95a5a6";
    }
  };

  const getSeverityColor = (aiDescription: string) => {
    if (!aiDescription) return "#95a5a6";
    const lowerDesc = aiDescription.toLowerCase();
    if (lowerDesc.includes("high") || lowerDesc.includes("urgent"))
      return "#e74c3c";
    if (lowerDesc.includes("medium")) return "#f39c12";
    return "#27ae60";
  };

  const getIssueIcon = (issueType: string) => {
    const type = issueType.toLowerCase();
    if (type.includes("garbage") || type.includes("waste"))
      return "trash-outline";
    if (
      type.includes("pothole") ||
      type.includes("road") ||
      type.includes("damage")
    )
      return "car-outline";
    if (type.includes("streetlight") || type.includes("lighting"))
      return "bulb-outline";
    if (type.includes("water") || type.includes("drainage"))
      return "water-outline";
    if (type.includes("traffic") || type.includes("sign")) return "car-sport";
    if (type.includes("sidewalk")) return "walk-outline";
    return "alert-circle-outline";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingSpinner}>
            <Ionicons name="refresh" size={32} color="#3498db" />
          </View>
          <Text style={styles.loadingText}>Loading issues...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Professional Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Ionicons name="eye" size={28} color="#3498db" />
            </View>
            <View>
              <Text style={styles.title}>UrbanEye</Text>
              <Text style={styles.subtitle}>Civic Issue Management</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => router.push("/(tabs)/report")}
        >
          <View style={styles.primaryActionIcon}>
            <Ionicons name="add" size={24} color="white" />
          </View>
          <View style={styles.primaryActionText}>
            <Text style={styles.primaryActionTitle}>Report Issue</Text>
            <Text style={styles.primaryActionSubtitle}>Submit new problem</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#3498db" />
        </TouchableOpacity>
      </View>

      {/* Issues List */}
      <View style={styles.issuesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Issues</Text>
          <Text style={styles.issueCount}>{issues.length} total</Text>
        </View>

        <FlatList
          data={issues}
          renderItem={renderIssueCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="document-outline" size={48} color="#bdc3c7" />
              </View>
              <Text style={styles.emptyText}>No issues reported yet</Text>
              <Text style={styles.emptySubtext}>
                Be the first to report a civic issue in your area
              </Text>
              <TouchableOpacity
                style={styles.emptyActionButton}
                onPress={() => router.push("/(tabs)/report")}
              >
                <Text style={styles.emptyActionText}>Report First Issue</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/(tabs)/report")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  // Header Styles
  header: {
    backgroundColor: "white",
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ebf3fd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: "#7f8c8d",
    fontWeight: "500",
  },

  // Quick Actions
  quickActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  primaryAction: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  primaryActionText: {
    flex: 1,
  },
  primaryActionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  primaryActionSubtitle: {
    fontSize: 14,
    color: "#7f8c8d",
  },

  // Issues Section
  issuesSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2c3e50",
  },
  issueCount: {
    fontSize: 14,
    color: "#7f8c8d",
    fontWeight: "500",
  },

  // List Container
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // Card Styles
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: 160,
    position: "relative",
  },
  issueImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  cardContent: {
    padding: 16,
  },
  cardHeader: {
    marginBottom: 10,
  },
  issueTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  issueIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  issueType: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2c3e50",
    flex: 1,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e8",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 6,
  },
  aiBadgeText: {
    fontSize: 9,
    color: "#27ae60",
    fontWeight: "600",
    marginLeft: 3,
  },

  description: {
    fontSize: 13,
    color: "#34495e",
    lineHeight: 18,
    marginBottom: 12,
  },

  aiDescriptionContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 2,
    borderLeftColor: "#27ae60",
  },
  aiDescriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  aiDescriptionLabel: {
    fontSize: 11,
    color: "#27ae60",
    fontWeight: "600",
    marginLeft: 5,
  },
  aiDescriptionText: {
    fontSize: 12,
    color: "#5a6c7d",
    lineHeight: 16,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timestamp: {
    fontSize: 11,
    color: "#7f8c8d",
    marginLeft: 5,
    fontWeight: "500",
  },
  severityIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  severityText: {
    fontSize: 10,
    color: "#7f8c8d",
    fontWeight: "500",
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingContent: {
    alignItems: "center",
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#7f8c8d",
    fontWeight: "500",
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#7f8c8d",
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#bdc3c7",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyActionButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyActionText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },

  // Floating Action Button
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#3498db",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
