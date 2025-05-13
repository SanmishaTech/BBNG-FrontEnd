import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { post, put, get } from "@/services/apiService";
import Validate from "@/lib/Handlevalidation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define interfaces for API responses
interface SubCategoryData {
  id: number;
  name: string;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryListItem {
  id: number;
  name: string;
}

interface CategoryListResponse {
  categories: CategoryListItem[];
  page: number;
  totalPages: number;
  totalCategories: number;
}

const subCategoryFormSchema = z.object({
  name: z.string()
    .min(1, "Sub-Category name is required")
    .max(255, "Category name must not exceed 255 characters"),
  categoryId: z.coerce.number({invalid_type_error: "Category is required"}).positive("Category is required"),
});

type SubCategoryFormInputs = z.infer<typeof subCategoryFormSchema>;

interface SubCategoryFormProps {
  mode: "create" | "edit";
  subCategoryId?: string;
  onSuccess?: () => void;
  className?: string;
}

const SubCategoryForm = ({
  mode,
  subCategoryId,
  onSuccess,
  className,
}: SubCategoryFormProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    setError,
    formState: { errors },
  } = useForm<SubCategoryFormInputs>({
    resolver: zodResolver(subCategoryFormSchema),
    defaultValues: {
      name: "",
      categoryId: undefined,
    },
  });

  // Query for fetching categories for the dropdown
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery<CategoryListResponse>({
    queryKey: ["categoriesList"],
    queryFn: async () => {
      const response = await get("/categories");
      // Handle different possible response structures
      if (Array.isArray(response)) {
        return { categories: response, page: 1, totalPages: 1, totalCategories: response.length };
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.categories)) {
          return response as CategoryListResponse;
        } else {
          // If response exists but has no categories array
          console.error("Unexpected categories response format:", response);
          return { categories: [], page: 1, totalPages: 1, totalCategories: 0 };
        }
      }
      // Fallback for any other case
      return { categories: [], page: 1, totalPages: 1, totalCategories: 0 };
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });
  
  // Extract categories array from response
  const categories = categoriesData?.categories || [];

  // Query for fetching subcategory data in edit mode
  const { 
    data: subCategoryData, 
    isLoading: isFetchingSubCategory, 
    isError: isFetchSubCategoryError,
    error: fetchSubCategoryErrorData
  } = useQuery<SubCategoryData, Error>({
    queryKey: ["subcategories", subCategoryId],
    queryFn: async (): Promise<SubCategoryData> => {
      if (!subCategoryId) throw new Error("SubCategory ID is required for editing");
      return get(`/subcategories/${subCategoryId}`);
    },
    enabled: mode === "edit" && !!subCategoryId,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (mode === 'edit' && subCategoryData) {
      setValue("name", subCategoryData.name);
      setValue("categoryId", subCategoryData.categoryId);
    }
  }, [subCategoryData, mode, setValue]);

  useEffect(() => {
    if (mode === 'edit' && isFetchSubCategoryError) {
      const errorMessage = (fetchSubCategoryErrorData as any)?.message || "Failed to fetch subcategory details";
      toast.error(errorMessage);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/sub-categories");
      }
    }
  }, [isFetchSubCategoryError, fetchSubCategoryErrorData, mode, navigate, onSuccess]);

  // Mutation for creating a subcategory
  const createSubCategoryMutation = useMutation({
    mutationFn: (data: SubCategoryFormInputs) => {
      return post("/subcategories", data);
    },
    onSuccess: () => {
      toast.success("Sub-Category created successfully");
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/sub-categories");
      }
    },
    onError: (error: any) => {
      Validate(error, setError);
      if (error.errors?.message) {
        toast.error(error.errors.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create sub-category");
      }
    },
  });

  // Mutation for updating a subcategory
  const updateSubCategoryMutation = useMutation({
    mutationFn: (data: SubCategoryFormInputs) => {
      if (!subCategoryId) throw new Error("SubCategory ID is required for updating");
      return put(`/subcategories/${subCategoryId}`, data);
    },
    onSuccess: () => {
      toast.success("Sub-Category updated successfully");
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      queryClient.invalidateQueries({ queryKey: ["subcategories", subCategoryId] });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/sub-categories");
      }
    },
    onError: (error: any) => {
      Validate(error, setError);
      if (error.errors?.message) {
        toast.error(error.errors.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update sub-category");
      }
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<SubCategoryFormInputs> = (data) => {
    if (mode === "create") {
      createSubCategoryMutation.mutate(data);
    } else {
      updateSubCategoryMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      navigate("/sub-categories");
    }
  };

  // Combined loading state
  const isFormLoading = isLoadingCategories || isFetchingSubCategory || createSubCategoryMutation.isPending || updateSubCategoryMutation.isPending;

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        {/* Category Name Field */}
        <div className="grid gap-2 relative">
          <Label htmlFor="name">Sub-Category Name</Label>
          <Input
            id="name"
            placeholder="Enter sub-category name"
            {...register("name")}
            disabled={isFormLoading}
          />
          {errors.name && (
            <span className="text-red-500 text-[10px] absolute bottom-0 translate-y-[105%]">
              {errors.name.message}
            </span>
          )}
        </div>

        {/* Category Dropdown Field */}
        <div className="grid gap-2 relative">
          <Label htmlFor="categoryId">Category</Label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString()}
                disabled={isFormLoading || isLoadingCategories}
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.categoryId && (
            <span className="text-red-500 text-[10px] absolute bottom-0 translate-y-[105%]">
              {errors.categoryId.message}
            </span>
          )}
        </div>
        

        {/* Submit and Cancel Buttons */}
        <div className="justify-end flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            disabled={isFormLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isFormLoading}
            className="flex items-center justify-center gap-2"
          >
            {isFormLoading ? (
              <>
                <LoaderCircle className="animate-spin h-4 w-4" />
                Saving...
              </>
            ) : mode === "create" ? (
              "Create Sub-Category"
            ) : (
              "Update Sub-Category"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SubCategoryForm; 