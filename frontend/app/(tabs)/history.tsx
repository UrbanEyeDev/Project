import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

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

export default function HistoryScreen() {
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

  const handleDeleteIssue = async (issueId: number) => {
    Alert.alert(
      "Delete Report",
      "Are you sure you want to delete this report? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("issues")
                .delete()
                .eq("id", issueId);

              if (error) throw error;

              // Remove the deleted issue from local state
              setIssues((prevIssues) =>
                prevIssues.filter((issue) => issue.id !== issueId)
              );

              Alert.alert("Success", "Report deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete report");
              console.error("Error deleting issue:", error);
            }
          },
        },
      ]
    );
  };

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

  const renderIssueCard = ({ item }: { item: Issue }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image_url }} style={styles.issueImage} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.issueTypeContainer}>
            <View style={styles.issueIconContainer}>
              <Ionicons
                name={getIssueIcon(item.issue_type)}
                size={24}
                color="#3498db"
              />
            </View>
            <View style={styles.issueInfo}>
              <Text style={styles.issueType}>{item.issue_type}</Text>
              <Text style={styles.issueDate}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            >
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteIssue(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.description}>{item.user_description}</Text>

        {item.ai_description && (
          <View style={styles.aiSection}>
            <View style={styles.aiHeader}>
              <Ionicons name="sparkles" size={16} color="#27ae60" />
              <Text style={styles.aiHeaderText}>AI Analysis</Text>
            </View>
            <Text style={styles.aiDescription}>{item.ai_description}</Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.locationInfo}>
            <Ionicons name="location-outline" size={16} color="#7f8c8d" />
            <Text style={styles.locationText}>
              {item.latitude && item.longitude
                ? "Location recorded"
                : "No location"}
            </Text>
          </View>
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleTimeString()}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading your reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Report History</Text>
        <Text style={styles.subtitle}>Track your civic issue reports</Text>
      </View>

      <FlatList
        data={issues}
        renderItem={renderIssueCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#bdc3c7" />
            <Text style={styles.emptyText}>No reports found</Text>
            <Text style={styles.emptySubtext}>
              You haven't reported any issues yet
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "white",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2c3e50",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#7f8c8d",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#7f8c8d",
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  issueImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  issueTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  issueIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  issueInfo: {
    flex: 1,
  },
  issueType: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 2,
  },
  issueDate: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  description: {
    fontSize: 14,
    color: "#34495e",
    lineHeight: 20,
    marginBottom: 12,
  },
  aiSection: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#27ae60",
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  aiHeaderText: {
    fontSize: 12,
    color: "#27ae60",
    fontWeight: "600",
    marginLeft: 6,
  },
  aiDescription: {
    fontSize: 12,
    color: "#7f8c8d",
    fontStyle: "italic",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 12,
    color: "#7f8c8d",
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 11,
    color: "#95a5a6",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButton: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: "#7f8c8d",
    marginTop: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#bdc3c7",
    marginTop: 8,
    textAlign: "center",
  },
});
