import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function SettingsScreen() {
  const router = useRouter();
  const [showAboutModal, setShowAboutModal] = React.useState(false);
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const [profileData, setProfileData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [tempProfileData, setTempProfileData] = React.useState({
    ...profileData,
  });

  // Load user profile data when component mounts
  React.useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const userProfile = {
          firstName: user.user_metadata?.first_name || "",
          lastName: user.user_metadata?.last_name || "",
          email: user.email || "",
          phone: user.user_metadata?.phone || "",
        };
        setProfileData(userProfile);
        setTempProfileData(userProfile);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const handleProfileSave = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: tempProfileData.firstName,
          last_name: tempProfileData.lastName,
          phone: tempProfileData.phone,
        },
      });

      if (error) {
        Alert.alert("Error", "Failed to update profile: " + error.message);
        return;
      }

      setProfileData({ ...tempProfileData });
      setIsEditingProfile(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
      console.error("Error updating profile:", error);
    }
  };

  const handleProfileCancel = () => {
    setTempProfileData({ ...profileData });
    setIsEditingProfile(false);
  };

  const handleProfileInputChange = (field: string, value: string) => {
    setTempProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showSwitch = false,
    switchValue = false,
    onSwitchChange = null,
    showArrow = true,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: ((value: boolean) => void) | null;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={showSwitch}
    >
      <View style={styles.settingItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#3498db" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingItemRight}>
        {showSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: "#e0e0e0", true: "#3498db" }}
            thumbColor={switchValue ? "#ffffff" : "#f4f3f4"}
          />
        ) : showArrow ? (
          <Ionicons name="chevron-forward" size={20} color="#c0c0c0" />
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>
          Customize your UrbanEye experience
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="person-circle"
            title="Profile"
            subtitle="Edit your profile information"
            onPress={() => setIsEditingProfile(!isEditingProfile)}
          />

          {/* Profile Editing Form */}
          {isEditingProfile && (
            <View style={styles.profileForm}>
              <View style={styles.profileFormHeader}>
                <Text style={styles.profileFormTitle}>Edit Profile</Text>
                <View style={styles.profileFormActions}>
                  <TouchableOpacity
                    style={styles.profileCancelButton}
                    onPress={handleProfileCancel}
                  >
                    <Text style={styles.profileCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.profileSaveButton}
                    onPress={handleProfileSave}
                  >
                    <Text style={styles.profileSaveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.profileInputGroup}>
                <Text style={styles.profileInputLabel}>First Name</Text>
                <TextInput
                  style={styles.profileInput}
                  value={tempProfileData.firstName}
                  onChangeText={(value) =>
                    handleProfileInputChange("firstName", value)
                  }
                  placeholder="Enter first name"
                />
              </View>

              <View style={styles.profileInputGroup}>
                <Text style={styles.profileInputLabel}>Last Name</Text>
                <TextInput
                  style={styles.profileInput}
                  value={tempProfileData.lastName}
                  onChangeText={(value) =>
                    handleProfileInputChange("lastName", value)
                  }
                  placeholder="Enter last name"
                />
              </View>

              <View style={styles.profileInputGroup}>
                <Text style={styles.profileInputLabel}>Email</Text>
                <TextInput
                  style={styles.profileInput}
                  value={tempProfileData.email}
                  onChangeText={(value) =>
                    handleProfileInputChange("email", value)
                  }
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.profileInputGroup}>
                <Text style={styles.profileInputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.profileInput}
                  value={tempProfileData.phone}
                  onChangeText={(value) =>
                    handleProfileInputChange("phone", value)
                  }
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="information-circle"
            title="About UrbanEye"
            subtitle="Version 1.0.0"
            onPress={() => setShowAboutModal(true)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) {
                Alert.alert("Error", "Failed to sign out: " + error.message);
              } else {
                // Navigate back to login screen
                router.replace("/");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to sign out");
              console.error("Sign out error:", error);
            }
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* About Modal */}
      {showAboutModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About UrbanEye</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAboutModal(false)}
              >
                <Ionicons name="close" size={24} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalDescription}>
                UrbanEye is an AI-powered civic issue mapper designed to make
                cities cleaner, safer, and smarter. With just a photo, citizens
                can report problems such as potholes, broken streetlights,
                garbage dumps, or water leakages. The app automatically detects
                and categorizes these issues using Artificial Intelligence,
                helping authorities respond faster and more efficiently.
              </Text>

              <Text style={styles.modalDescription}>
                Built with React Native and Supabase, UrbanEye combines a
                modern, user-friendly design with real-time data storage and
                AI-powered image recognition to empower citizens and enable
                better governance.
              </Text>

              <Text style={styles.teamTitle}>Our Team</Text>
              <View style={styles.teamMember}>
                <Text style={styles.teamEmoji}>👤</Text>
                <Text style={styles.teamMemberText}>
                  Raj Shirdhankar – Backend Engineer
                </Text>
              </View>
              <View style={styles.teamMember}>
                <Text style={styles.teamEmoji}>👤</Text>
                <Text style={styles.teamMemberText}>
                  Sanchit Dhage – Frontend Developer
                </Text>
              </View>
              <View style={styles.teamMember}>
                <Text style={styles.teamEmoji}>👤</Text>
                <Text style={styles.teamMemberText}>
                  Shourya Gupta – AI Specialist
                </Text>
              </View>

              <Text style={styles.modalDescription}>
                Together, we aim to bridge the gap between citizens and
                authorities by turning everyday observations into smart city
                improvements.
              </Text>
            </ScrollView>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 20,
    backgroundColor: "#3498db",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginLeft: 20,
    marginBottom: 10,
  },
  sectionContent: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2c3e50",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  settingItemRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e74c3c",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e74c3c",
    marginLeft: 10,
  },
  // Modal styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    margin: 20,
    maxHeight: "80%",
    width: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: "#34495e",
    marginBottom: 16,
    textAlign: "justify",
  },
  teamTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginTop: 8,
    marginBottom: 16,
  },
  teamMember: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  teamEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  teamMemberText: {
    fontSize: 16,
    color: "#34495e",
    flex: 1,
  },
  // Profile form styles
  profileForm: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  profileFormHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  profileFormTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  },
  profileFormActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileCancelButton: {
    marginRight: 15,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  profileCancelButtonText: {
    color: "#7f8c8d",
    fontSize: 16,
    fontWeight: "500",
  },
  profileSaveButton: {
    backgroundColor: "#3498db",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  profileSaveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  profileInputGroup: {
    marginBottom: 20,
  },
  profileInputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2c3e50",
    marginBottom: 8,
  },
  profileInput: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2c3e50",
  },
});
