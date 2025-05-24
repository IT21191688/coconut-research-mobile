import api from "./axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface LoginCredentials {
  email: string;
  password: string;
  fcmToken?: string; // Optional FCM token
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  fcmToken?: string; // Optional FCM token
}

interface AuthResponse {
  status: string;
  data: {
    user: {
      _id: string;
      name: string;
      email: string;
      role: string;
      fcmToken?: string;
    };
    token: string;
    refreshToken: string;
  };
}

export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  try {
    // Get FCM token from device if not provided
    if (!credentials.fcmToken) {
      const storedFcmToken = await AsyncStorage.getItem("fcmToken");
      if (storedFcmToken) {
        credentials.fcmToken = storedFcmToken;
      }
    }

    const response = await api.post<AuthResponse>("/auth/login", credentials);

    // Store auth data
    await AsyncStorage.setItem("token", response.data.data.token);
    await AsyncStorage.setItem("refreshToken", response.data.data.refreshToken);
    await AsyncStorage.setItem("user", JSON.stringify(response.data.data.user));

    // Store FCM token if returned
    if (response.data.data.user.fcmToken) {
      await AsyncStorage.setItem("fcmToken", response.data.data.user.fcmToken);
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const register = async (
  userData: RegisterData
): Promise<AuthResponse> => {
  try {
    if (!userData.fcmToken) {
      const storedFcmToken = await AsyncStorage.getItem("fcmToken");
      if (storedFcmToken) {
        userData.fcmToken = storedFcmToken;
      }
    }

    const response = await api.post<AuthResponse>("/auth/register", userData);

    await AsyncStorage.setItem("token", response.data.data.token);
    await AsyncStorage.setItem("refreshToken", response.data.data.refreshToken);
    await AsyncStorage.setItem("user", JSON.stringify(response.data.data.user));

    if (response.data.data.user.fcmToken) {
      await AsyncStorage.setItem("fcmToken", response.data.data.user.fcmToken);
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    // Call logout endpoint if your backend has one
    // await api.post('/auth/logout');

    // Clear stored auth data
    await AsyncStorage.multiRemove(["token", "refreshToken", "user"]);
  } catch (error) {
    throw error;
  }
};

export const forgotPassword = async (email: string): Promise<void> => {
  try {
    await api.post("/auth/forgot-password", { email });
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (
  token: string,
  password: string
): Promise<void> => {
  try {
    await api.post(`/auth/reset-password/${token}`, { password });
  } catch (error) {
    throw error;
  }
};

export const verifyAuthState = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem("token");
    const user = await AsyncStorage.getItem("user");

    return !!(token && user);
  } catch (error) {
    return false;
  }
};
