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
import { cleanMarkdownText } from "../../lib/gemini";

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showIssueDetails, setShowIssueDetails] = useState(false);

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
      case "pending":
        return "#9b59b6";
      case "cancelled":
        return "#e74c3c";
      default:
        return "#95a5a6";
    }
  };

  const handleCardPress = (issue: Issue) => {
    // Show custom issue details modal
    setSelectedIssue(issue);
    setShowIssueDetails(true);
  };

  const renderIssueCard = ({ item }: { item: Issue }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleCardPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardTopAccent} />
      <View style={styles.cardContent}>
        {/* Card Header with Issue Type and Status */}
        <View style={styles.cardHeader}>
          <View style={styles.issueTypeContainer}>
            <View style={styles.issueInfo}>
              <Text style={styles.issueType}>
                {cleanMarkdownText(item.issue_type)}
              </Text>
              <Text style={styles.issueDate}>
                {new Date(item.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
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
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {cleanMarkdownText(item.status)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteIssue(item.id)}
            >
              <Ionicons name="trash-outline" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Issue Image Thumbnail */}
        {item.image_url && (
          <View style={styles.imageThumbnailContainer}>
            <Image
              source={{ uri: item.image_url }}
              style={styles.imageThumbnail}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </View>
        )}

        {/* Issue Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.description} numberOfLines={3}>
            {cleanMarkdownText(item.user_description)}
          </Text>
        </View>

        {/* Card Footer with Location and Time */}
        <View style={styles.cardFooter}>
          <View style={styles.locationInfo}>
            <Ionicons name="location-outline" size={16} color="#3498db" />
            <Text style={styles.locationText}>
              {item.latitude && item.longitude
                ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`
                : "Location recorded"}
            </Text>
          </View>
          <View style={styles.timeInfo}>
            <Ionicons name="time-outline" size={14} color="#7f8c8d" />
            <Text style={styles.timestamp}>
              {new Date(item.created_at).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIconContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
        <Text style={styles.loadingText}>Loading your reports...</Text>
        <Text style={styles.loadingSubtext}>
          Please wait while we fetch your data
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Issue Count Header */}
      <View style={styles.countHeader}>
        <View style={styles.countContent}>
          <Ionicons name="document-text-outline" size={24} color="#3498db" />
          <Text style={styles.countText}>
            {issues.length === 1
              ? "1 issue reported"
              : `${issues.length} issues reported`}
          </Text>
        </View>
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
            <View style={styles.emptyIconContainer}>
              <Ionicons name="document-outline" size={80} color="white" />
            </View>
            <Text style={styles.emptyText}>No reports found</Text>
            <Text style={styles.emptySubtext}>
              You haven't reported any issues yet. Start by reporting your first
              issue!
            </Text>
          </View>
        }
      />

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <View style={styles.imageModal}>
          <TouchableOpacity
            style={styles.imageModalBackground}
            activeOpacity={1}
            onPress={() => {
              setShowImageModal(false);
              setSelectedImage(null);
              setImageLoading(false);
            }}
          >
            <TouchableOpacity
              style={styles.imageModalContent}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.imageModalHeader}>
                <Text style={styles.imageModalTitle}>Issue Photo</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setShowImageModal(false);
                    setSelectedImage(null);
                    setImageLoading(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
              <View style={styles.imageContainer}>
                {imageLoading && (
                  <View style={styles.imageLoadingContainer}>
                    <ActivityIndicator size="large" color="#3498db" />
                    <Text style={styles.imageLoadingText}>
                      Loading image...
                    </Text>
                  </View>
                )}
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.fullImage}
                  resizeMode="contain"
                  onError={() => {
                    setImageLoading(false);
                    Alert.alert("Error", "Failed to load image");
                  }}
                  onLoad={() => {
                    setImageLoading(false);
                    console.log("Image loaded successfully:", selectedImage);
                  }}
                />
                {!selectedImage && (
                  <Text style={styles.imageErrorText}>No image available</Text>
                )}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}

      {/* Issue Details Modal */}
      {showIssueDetails && selectedIssue && (
        <View style={styles.issueDetailsModal}>
          <TouchableOpacity
            style={styles.issueDetailsBackground}
            activeOpacity={1}
            onPress={() => {
              setShowIssueDetails(false);
              setSelectedIssue(null);
            }}
          >
            <TouchableOpacity
              style={styles.issueDetailsContent}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.issueDetailsHeader}>
                <Text style={styles.issueDetailsTitle}>Issue Details</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setShowIssueDetails(false);
                    setSelectedIssue(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>

              <View style={styles.issueDetailsBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>
                    {cleanMarkdownText(selectedIssue.issue_type)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={styles.detailValue}>
                    {cleanMarkdownText(selectedIssue.status)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.detailValue}>
                    {cleanMarkdownText(selectedIssue.user_description)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>AI Analysis:</Text>
                  <Text style={styles.detailValue}>
                    {cleanMarkdownText(selectedIssue.ai_description)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedIssue.created_at).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedIssue.created_at).toLocaleTimeString()}
                  </Text>
                </View>
              </View>

              <View style={styles.issueDetailsFooter}>
                <TouchableOpacity
                  style={styles.viewPhotoButton}
                  onPress={() => {
                    if (selectedIssue.image_url) {
                      setShowIssueDetails(false);
                      setSelectedIssue(null);
                      setImageLoading(true);
                      setSelectedImage(selectedIssue.image_url);
                      setShowImageModal(true);
                    } else {
                      Alert.alert(
                        "No Photo",
                        "No image was uploaded with this report."
                      );
                    }
                  }}
                >
                  <Text style={styles.viewPhotoButtonText}>View Photo</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },

  // Simple Count Header
  countHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#2a2a2a",
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  countContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
    marginLeft: 8,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  loadingIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999",
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  listContainer: {
    padding: 20,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#2a2a2a",
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#3a3a3a",
    position: "relative",
  },
  cardContent: {
    padding: 20,
    position: "relative",
  },
  cardTopAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#3498db",
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  issueTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  issueInfo: {
    flex: 1,
  },
  issueType: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  issueDate: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "white",
    marginRight: 6,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
    letterSpacing: 0.5,
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: "#ddd",
    lineHeight: 22,
    fontWeight: "400",
    letterSpacing: 0.3,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#444",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#444",
  },
  locationText: {
    fontSize: 13,
    color: "#ccc",
    marginLeft: 8,
    maxWidth: 140,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#444",
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
    marginLeft: 6,
    letterSpacing: 0.2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deleteButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#e74c3c",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#999",
    marginTop: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },

  // Image Modal
  imageModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  imageModalBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: "90%",
    height: "auto",
    minHeight: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  imageModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  imageModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#e74c3c",
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  imageContainer: {
    width: "100%",
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    overflow: "hidden",
  },
  fullImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  imageErrorText: {
    color: "#999",
    fontSize: 16,
    textAlign: "center",
  },
  imageLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    zIndex: 1,
  },
  imageLoadingText: {
    color: "#999",
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
  imageThumbnailContainer: {
    width: "100%",
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
    backgroundColor: "#333",
    borderWidth: 1,
    borderColor: "#444",
  },
  imageThumbnail: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  // Issue Details Modal
  issueDetailsModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  issueDetailsBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  issueDetailsContent: {
    backgroundColor: "#000000",
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  issueDetailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  issueDetailsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  issueDetailsBody: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3498db",
    width: 80,
    marginRight: 12,
  },
  detailValue: {
    fontSize: 14,
    color: "white",
    flex: 1,
    lineHeight: 20,
  },
  issueDetailsFooter: {
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  viewPhotoButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  viewPhotoButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
