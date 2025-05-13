import { get, post, put, del as deleteRequest } from './apiService';
import { getSubCategories } from './subCategoryService';

export interface Category {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListResponse {
  categories: Category[];
  page: number;
  totalPages: number;
  totalCategories: number;
}

export const getSubCategories = async (
  page = 1,
  limit = 10,
  search = '',
  sortBy = 'name',
  sortOrder = 'asc'
): Promise<CategoryListResponse> => {
  return await get('/subcategories', { page, limit, search, sortBy, sortOrder });
};

export const getSubCategoryById = async (id: number): Promise<Category> => {
  return await get(`/subcategories/${id}`);
};

export const createSubCategory = async (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> => {
  return await post('/subcategories', data, {});
};

export const updateSubCategory = async (
  id: number,
  data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Category> => {
  return await put(`/subcategories/${id}`, data, {});
};

export const deleteSubCategory = async (id: number): Promise<{ message: string }> => {
  return await deleteRequest(`/subcategories/${id}`);
};

export default {
  getSubCategories,
  getSubCategoryById,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
}; 