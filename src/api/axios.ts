// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useAuth } from '../context/AuthContext';

// // Update this with your actual backend URL
// const BASE_URL = 'http://192.168.43.37:7000/api/v1'; // Replace with your computer's IP

// const axiosInstance = axios.create({
//   baseURL: BASE_URL,
//   timeout: 10000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });
// const { user, logout } = useAuth();

// axiosInstance.interceptors.request.use(
//   async (config) => {
//     try {
//       const token = await AsyncStorage.getItem('token');
//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//       return config;
//     } catch (error) {
//       return Promise.reject(error);
//     }
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Response interceptor for handling errors
// axiosInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     // Handle 401 errors (unauthorized)
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       try {
//         const refreshToken = await AsyncStorage.getItem('refreshToken');
//         if (!refreshToken) {
//           // Clear storage and force re-login
//           await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
//           // You might want to trigger a navigation to login here
//           return Promise.reject(error);
//         }

//         // Call your refresh token endpoint here if implemented
//         // const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
//         //   refreshToken,
//         // });
//         // const { token } = response.data;
//         // await AsyncStorage.setItem('token', token);
//         // originalRequest.headers.Authorization = `Bearer ${token}`;
//         // return axiosInstance(originalRequest);
//       } catch (refreshError) {
//         // Clear storage and force re-login
//         await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventRegister } from 'react-native-event-listeners';

const BASE_URL = 'http://192.168.43.37:7000/api/v1';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let logoutFunction: (() => Promise<void>) | null = null;

export const setLogoutFunction = (logout: () => Promise<void>) => {
  logoutFunction = logout;
};

axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      // Clear storage
      await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
      
      // Emit a logout event that can be listened to by components
      EventRegister.emit('userLogout', true);
      
      // Return the error for further handling
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;