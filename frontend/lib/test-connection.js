// Simple test script to debug Supabase connection
// Run this with: node test-connection.js

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log("🔍 Testing Supabase Connection...");
console.log("URL:", supabaseUrl ? "✅ Set" : "❌ Missing");
console.log("Key:", supabaseAnonKey ? "✅ Set" : "❌ Missing");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing environment variables!");
  process.exit(1);
}

// Create client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log("\n📡 Testing basic connection...");

    // Test storage bucket access
    const { data, error } = await supabase.storage
      .from("urbaneye-issues")
      .list("", { limit: 1 });

    if (error) {
      console.error("❌ Storage error:", error.message);
      return false;
    }

    console.log("✅ Storage connection successful!");
    console.log("📁 Bucket contents:", data);

    return true;
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    return false;
  }
}

// Run test
testConnection().then((success) => {
  if (success) {
    console.log("\n🎉 All tests passed! Your Supabase connection is working.");
  } else {
    console.log("\n💥 Tests failed. Check your configuration and try again.");
  }
  process.exit(success ? 0 : 1);
});
