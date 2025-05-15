import { get, post, put, del as deleteRequest } from './apiService';

export interface Category {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
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

export const getSubCategoryById = async (id: number): Promise<SubCategory> => {
  return await get(`/subcategories/${id}`);
};

export const createSubCategory = async (data: Omit<SubCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<SubCategory> => {
  return await post('/subcategories', data);
};

export const updateSubCategory = async (id: number, data: Partial<Omit<SubCategory, 'id' | 'createdAt' | 'updatedAt'>>): Promise<SubCategory> => {
  return await put(`/subcategories/${id}`, data);
};

export const deleteSubCategory = async (id: number): Promise<void> => {
  return await deleteRequest(`/subcategories/${id}`);
};

export const getSubCategoriesByCategoryId = async (categoryId: number): Promise<SubCategory[]> => {
  return await get(`/subcategories/category/${categoryId}`);
};

export default {
  getSubCategories,
  getSubCategoryById,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  getSubCategoriesByCategoryId,
}; 