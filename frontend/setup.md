# UrbanEye Frontend Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

1. Copy the example environment file:

   ```bash
   cp env.example .env
   ```

2. Edit `.env` with your actual API keys:
   ```env
   SUPABASE_URL="https://your-project-id.supabase.co"
   SUPABASE_ANON_KEY="your-supabase-anon-key"
   ```

### 3. Supabase Backend Setup

Follow the instructions in `../backend/supabase_setup.md` to:

- Create a Supabase project
- Set up the database schema
- Create the storage bucket
- Configure authentication

### 4. Start Development Server

```bash
npm start
```

### 5. Run on Device/Simulator

- **iOS Simulator**: Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal
- **Physical Device**: Scan the QR code with Expo Go app

## Project Structure

```
frontend/
├── app/                   # Expo Router screens
│   ├── (tabs)/          # Tab navigation
│   │   ├── home.tsx     # Issue feed
│   │   ├── report.tsx   # Report new issue
│   │   └── profile.tsx  # User profile
│   ├── _layout.tsx      # Root layout
│   └── index.tsx        # Authentication
├── lib/                  # Client configurations
│   └── supabase.ts      # Database client
├── assets/              # App icons and images
├── package.json         # Dependencies
├── app.json            # Expo configuration
├── babel.config.js     # Babel configuration
├── metro.config.js     # Metro bundler config
├── tsconfig.json       # TypeScript configuration
└── .env                # Environment variables
```

## Available Scripts

- `npm start` - Start the development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser

## Troubleshooting

### Common Issues

1. **Metro bundler errors**: Clear cache with `npx expo start --clear`
2. **Environment variable errors**: Ensure `.env` file exists and has correct values
3. **Supabase connection errors**: Verify URL and API key in `.env`
4. **Permission errors**: Grant camera and photo library permissions when prompted

### Getting Help

- Check the [Expo Documentation](https://docs.expo.dev/)
- Review [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- Check the main [README.md](../README.md) for more details

## Next Steps

After successful setup:

1. Test user registration and login
2. Try reporting a test issue
3. Check image upload functionality
4. Test the issue feed display

Happy coding! 🚀
