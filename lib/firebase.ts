import { initializeApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';

// Your Firebase configuration - replace with your actual configuration from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyALlDlNghLjj3j8_ZyZvd-ZSDL74TmPYrw",
  authDomain: "roadbro-c4782.firebaseapp.com",
  projectId: "roadbro-c4782",
  storageBucket: "roadbro-c4782.firebasestorage.app",
  messagingSenderId: "979290808822",
  appId: "1:979290808822:android:42382851afafd34e07a7d7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();

// Export the initialized auth instance
export { auth };

// Export a function to get the app instance
export const getApp = () => app;
