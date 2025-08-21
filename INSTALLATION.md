# UrbanEye Complete Installation Guide

## 🎯 Project Overview

UrbanEye is a complete, production-ready mobile application for reporting civic issues. This guide will walk you through setting up the entire project from scratch.

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Expo CLI** - Install with `npm install -g @expo/cli`
- **Supabase Account** - [Sign up here](https://supabase.com/)
- **Mobile Device** or **Emulator** for testing

## 🚀 Quick Installation

### Step 1: Clone and Setup

```bash
# Navigate to your desired directory
cd /path/to/your/projects

# Clone the repository (if using git)
git clone <repository-url>
cd UrbanEye

# Or if you have the files locally, just navigate to the UrbanEye folder
cd UrbanEye
```

### Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 3: Configure Environment Variables

```bash
# Copy the example environment file
cp env.example .env

# Edit the .env file with your actual API keys
# Use your preferred text editor
notepad .env  # Windows
# or
nano .env     # Mac/Linux
```

Fill in your `.env` file:

```env
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### Step 4: Setup Supabase Backend

1. **Create Supabase Project**

   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Name it `urbaneye`
   - Choose a strong database password
   - Select your preferred region
   - Wait for project creation (2-3 minutes)

2. **Get Project Credentials**

   - In your project dashboard, go to **Settings** → **API**
   - Copy the **Project URL** and **anon public key**
   - Update your `.env` file with these values

3. **Setup Database Schema**

   - Go to **SQL Editor** in your Supabase dashboard
   - Create a new query
   - Copy and paste the SQL from `backend/supabase_setup.md`
   - Run the query to create the `issues` table and policies

4. **Create Storage Bucket**

   - Go to **Storage** in your dashboard
   - Click "Create a new bucket"
   - Name: `issue_images`
   - Make it **public**
   - Set file size limit to `10 MB`
   - Allow MIME types: `image/*`

5. **Configure Authentication**
   - Go to **Authentication** → **Settings**
   - Add your app's URL to **Site URL** (use `http://localhost:8081` for development)
   - Add redirect URLs: `http://localhost:8081` and `exp://localhost:8081`

### Step 5: Test the Application

```bash
# Start the development server
npm start
```

You should see:

- Metro bundler starting
- QR code displayed in terminal
- Expo DevTools opening in browser

### Step 6: Run on Device/Simulator

**Option A: Physical Device**

- Install **Expo Go** app from App Store/Play Store
- Scan the QR code with your camera (iOS) or Expo Go app (Android)

**Option B: iOS Simulator**

- Press `i` in the terminal
- iOS Simulator will open automatically

**Option C: Android Emulator**

- Press `a` in the terminal
- Android Emulator will open automatically

## 🧪 Testing the App

### 1. User Registration

- Open the app
- Tap "Don't have an account? Sign Up"
- Enter your email and password
- Check your email for confirmation link
- Confirm your account

### 2. User Login

- Enter your email and password
- Tap "Login"
- You should be redirected to the home screen

### 3. Report an Issue

- Tap the "+" button (FAB) on the home screen
- Take a photo or select from gallery
- Fill in issue type and description
- Tap "Submit Report"
- Verify the issue appears in the home feed

### 4. Check Issue Display

- Look at the issue you just created
- Verify that the description matches what you entered
- Check that the image is displayed correctly

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. "Metro bundler error"

```bash
npx expo start --clear
```

#### 2. "Environment variable not found"

- Ensure `.env` file exists in `frontend/` directory
- Check that variable names match exactly (no spaces around `=`)
- Restart the development server

#### 3. "Supabase connection failed"

- Verify your Supabase URL and API key
- Check that your Supabase project is active
- Ensure you're not hitting rate limits

#### 4. "Camera permission denied"

- Grant camera permissions when prompted
- Go to device settings → Apps → UrbanEye → Permissions
- Enable camera and photo library access

#### 5. "Image upload failed"

- Check Supabase storage bucket exists and is public
- Verify file size is under 10MB
- Check internet connection

### Getting Help

- **Expo Documentation**: [docs.expo.dev](https://docs.expo.dev/)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **React Native Elements**: [reactnativeelements.com](https://reactnativeelements.com/)
- **GitHub Issues**: Report bugs in the project repository

## 📱 Building for Production

### Development Build

```bash
npx expo run:android  # Android
npx expo run:ios      # iOS
```

### Production Build with EAS

```bash
npm install -g @expo/eas-cli
eas build --platform all
```

## 🎉 Success!

If you've reached this point, congratulations! You now have a fully functional UrbanEye application running with:

✅ User authentication and registration  
✅ Photo capture and upload  
✅ Issue reporting and management  
✅ Real-time issue feed  
✅ Secure backend with Supabase  
✅ Cross-platform mobile app

## 🚀 Next Steps

- **Customize the UI**: Modify colors, fonts, and layouts
- **Add features**: Implement location tracking, push notifications
- **Deploy**: Build and distribute to app stores
- **Scale**: Add admin dashboard, issue tracking, analytics

---

**Need help?** Check the troubleshooting section above or refer to the detailed documentation in each component folder.

**Happy coding!** 🎯📱✨
