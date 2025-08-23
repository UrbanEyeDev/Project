import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Image,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [stayLoggedIn, setStayLoggedIn] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          // User is already logged in, redirect to home
          router.replace("/(tabs)/home");
        }
      } catch (error) {
        console.error("Error checking user session:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    checkUser();
  }, []);

  // Show loading screen while checking authentication
  if (isInitializing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert(error.message);
    else {
      router.replace("/(tabs)/home");
    }
    setLoading(false);
  }

  async function signUpWithEmail() {
    // Validate required fields
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
        },
      },
    });

    if (error) Alert.alert(error.message);
    else {
      Alert.alert("Success", "Check your email for the confirmation link!");
      setIsSignUp(false);
      // Clear form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setPassword("");
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formContainer}>
          {isSignUp && (
            <>
              <TextInput
                style={styles.input}
                placeholder="First Name *"
                placeholderTextColor="#666"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Last Name *"
                placeholderTextColor="#666"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#666"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </>
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {!isSignUp && (
            <View style={styles.stayLoggedInContainer}>
              <Text style={styles.stayLoggedInText}>Stay logged in</Text>
              <Switch
                value={stayLoggedIn}
                onValueChange={setStayLoggedIn}
                trackColor={{ false: "#e0e0e0", true: "#3498db" }}
                thumbColor={stayLoggedIn ? "#ffffff" : "#f4f3f4"}
              />
            </View>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={isSignUp ? signUpWithEmail : signInWithEmail}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Loading..." : isSignUp ? "Sign Up" : "Login"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.switchText}>
              {isSignUp
                ? "Already have an account? Login"
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
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
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 20,
  },
  formContainer: {
    backgroundColor: "#2a2a2a",
    padding: 25,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "#333",
    color: "white",
  },
  button: {
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  switchButton: {
    alignItems: "center",
  },
  switchText: {
    color: "#3498db",
    fontSize: 14,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#999",
    marginTop: 20,
  },
  stayLoggedInContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  stayLoggedInText: {
    fontSize: 14,
    color: "#999",
  },
});
