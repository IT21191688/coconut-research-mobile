import api from './axios';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
}

interface UserResponse {
  status: string;
  data: {
    user: User;
  };
}

export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await api.get<UserResponse>('/users/me');
    return response.data.data.user;
  } catch (error) {
    throw error;
  }
};

export const updateProfile = async (userData: UpdateUserData): Promise<User> => {
  try {
    const response = await api.put<UserResponse>('/users/profile', userData);
    return response.data.data.user;
  } catch (error) {
    throw error;
  }
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  try {
    await api.post('/users/change-password', {
      currentPassword,
      newPassword,
    });
  } catch (error) {
    throw error;
  }
};

// Admin only endpoints
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await api.get<{ status: string; data: { users: User[] } }>(
      '/users'
    );
    return response.data.data.users;
  } catch (error) {
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<User> => {
  try {
    const response = await api.get<UserResponse>(`/users/${userId}`);
    return response.data.data.user;
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (
  userId: string,
  userData: UpdateUserData
): Promise<User> => {
  try {
    const response = await api.put<UserResponse>(`/users/${userId}`, userData);
    return response.data.data.user;
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await api.delete(`/users/${userId}`);
  } catch (error) {
    throw error;
  }
};