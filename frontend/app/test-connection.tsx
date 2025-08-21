import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { supabase } from "../lib/supabase";

export default function TestConnection() {
  const [connectionStatus, setConnectionStatus] = useState("Testing...");
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      // Test basic connection
      const { data, error } = await supabase
        .from("issues")
        .select("count")
        .limit(1);

      if (error) {
        if (error.message.includes('relation "issues" does not exist')) {
          setConnectionStatus(
            "✅ Supabase Connected! ❌ Database table missing"
          );
        } else {
          setConnectionStatus(`❌ Connection Error: ${error.message}`);
        }
      } else {
        setConnectionStatus("✅ Supabase Connected! ✅ Database accessible");
      }
    } catch (err) {
      setConnectionStatus(`❌ Connection Failed: ${err}`);
    }
  };

  const testAuth = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        Alert.alert("Auth Test", `Error: ${error.message}`);
      } else if (user) {
        Alert.alert("Auth Test", `✅ User logged in: ${user.email}`);
      } else {
        Alert.alert("Auth Test", "ℹ️ No user logged in (this is normal)");
      }
    } catch (err) {
      Alert.alert("Auth Test", `Error: ${err}`);
    }
  };

  const testStorage = async () => {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) {
        Alert.alert("Storage Test", `Error: ${error.message}`);
      } else {
        const bucketNames = data.map((bucket) => bucket.name).join(", ");
        Alert.alert(
          "Storage Test",
          `✅ Available buckets: ${bucketNames || "None"}`
        );
      }
    } catch (err) {
      Alert.alert("Storage Test", `Error: ${err}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase Connection Test</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Connection Status:</Text>
        <Text style={styles.statusText}>{connectionStatus}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testConnection}>
          <Text style={styles.buttonText}>Test Connection</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testAuth}>
          <Text style={styles.buttonText}>Test Authentication</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testStorage}>
          <Text style={styles.buttonText}>Test Storage</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>What to check:</Text>
        <Text style={styles.infoText}>
          • .env file exists in frontend/ directory
        </Text>
        <Text style={styles.infoText}>• SUPABASE_URL is correct</Text>
        <Text style={styles.infoText}>• SUPABASE_ANON_KEY is correct</Text>
        <Text style={styles.infoText}>• Database table 'issues' exists</Text>
        <Text style={styles.infoText}>
          • Storage bucket 'issue_images' exists
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#2c3e50",
  },
  statusContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#34495e",
  },
  statusText: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  infoContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#34495e",
  },
  infoText: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 5,
  },
});
