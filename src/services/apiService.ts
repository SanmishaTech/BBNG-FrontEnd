import axios from "axios";
import { backendUrl } from "../config";

const api = axios.create({
  baseURL: backendUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const get = async (url: string, params?: any, config?: any) => {
  try {
    const finalConfig = {
      params,
      ...config,
    };

    const response = await api.get(url, finalConfig);

    if (config?.responseType === "blob") {
      return response;
    }

    return response.data;
  } catch (error: any) {
    throw {
      status: error.response?.status,
      errors: error.response?.data?.errors,
      message: error.response?.data?.errors?.message || "Request failed",
    };
  }
};

export const post = async (url: string, data: any, params?: any) => {
  try {
    const response = await api.post(url, data);
    if (params?.responseType === "blob") {
      return response;
    }

    return response.data;
  } catch (error: any) {
    throw {
      status: error.response?.status,
      errors: error.response?.data?.errors,
      message: error.response?.data?.errors?.message || "Request failed",
    };
  }
};

export const put = async (url: string, data: any) => {
  try {
    const response = await api.put(url, data);
    return response.data;
  } catch (error: any) {
    throw {
      status: error.response?.status,
      errors: error.response?.data?.errors,
      message: error.response?.data?.errors?.message || "Request failed",
    };
  }
};

export const patch = async (url: string, data: any) => {
  try {
    const response = await api.patch(url, data);
    return response.data;
  } catch (error: any) {
    throw {
      status: error.response?.status,
      errors: error.response?.data?.errors,
      message: error.response?.data?.errors?.message || "Request failed",
    };
  }
};

export const del = async (url: string) => {
  try {
    const response = await api.delete(url);
    return response.data;
  } catch (error: any) {
    throw {
      status: error.response?.status,
      errors: error.response?.data?.errors,
      message: error.response?.data?.errors?.message || "Request failed",
    };
  }
};

export const postupload = async (
  url: string,
  formData: FormData,
  config?: any
) => {
  try {
    // Create a new instance without Content-Type for file uploads
    const uploadInstance = axios.create({
      baseURL: backendUrl,
    });

    // Add authentication token
    uploadInstance.interceptors.request.use((config) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    const response = await uploadInstance.post(url, formData, config);
    return response.data;
  } catch (error: any) {
    throw {
      status: error.response?.status,
      errors: error.response?.data?.errors,
      message: error.response?.data?.errors?.message || "Request failed",
    };
  }
};

export const putupload = async (
  url: string,
  formData: FormData,
  config?: any
) => {
  try {
    // Create a new instance without Content-Type for file uploads
    const uploadInstance = axios.create({
      baseURL: backendUrl,
    });

    // Add authentication token
    uploadInstance.interceptors.request.use((config) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    const response = await uploadInstance.put(url, formData, config);
    return response.data;
  } catch (error: any) {
    throw {
      status: error.response?.status,
      errors: error.response?.data?.errors,
      message: error.response?.data?.errors?.message || "Request failed",
    };
  }
};
