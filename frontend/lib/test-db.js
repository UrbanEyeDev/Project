// Simple database test script
import { supabase } from "./supabase";

export const testDatabaseConnection = async () => {
  try {
    console.log("Testing database connection...");

    // Test basic connection
    const { data, error } = await supabase.from("issues").select("*").limit(1);

    if (error) {
      console.error("Database error:", error);
      return { success: false, error: error.message };
    }

    console.log("Database connection successful");
    return { success: true, data };
  } catch (error) {
    console.error("Test failed:", error);
    return { success: false, error: error.message };
  }
};
