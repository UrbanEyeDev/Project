import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function TabLayout() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        // Redirect to login if not authenticated
        router.replace("/");
      }
    };

    checkAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.replace("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3498db",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          backgroundColor: "#1a1a1a",
          borderTopWidth: 1,
          borderTopColor: "#333",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: "#1a1a1a",
        },
        headerTintColor: "white",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: "Report",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
