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

// Define interfaces for API responses
interface CategoryData {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

const categoryFormSchema = z.object({
  name: z.string()
    .min(1, "Category name is required")
    .max(255, "Category name must not exceed 255 characters"),
  description: z.string()
    .min(1, "Description is required")
    .max(1000, "Description must not exceed 1000 characters"),
});

type CategoryFormInputs = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  mode: "create" | "edit";
  categoryId?: string;
  onSuccess?: () => void;
  className?: string;
}

const CategoryForm = ({
  mode,
  categoryId,
  onSuccess,
  className,
}: CategoryFormProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    setError,
    formState: { errors },
  } = useForm<CategoryFormInputs>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Query for fetching category data in edit mode
  const { isLoading: isFetchingCategory } = useQuery({
    queryKey: ["category", categoryId],
    queryFn: async (): Promise<CategoryData> => {
      if (!categoryId) throw new Error("Category ID is required");
      return get(`/categories/${categoryId}`);
    },
    enabled: mode === "edit" && !!categoryId,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Handle successful category fetch
  useEffect(() => {
    if (mode === "edit" && categoryId) {
      queryClient.fetchQuery({
        queryKey: ["category", categoryId],
        queryFn: async (): Promise<CategoryData> => {
          return get(`/categories/${categoryId}`);
        },
      }).then((data) => {
        setValue("name", data.name);
        setValue("description", data.description);
      }).catch((error) => {
        toast.error(error.message || "Failed to fetch category details");
        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/categories");
        }
      });
    }
  }, [categoryId, mode, setValue, queryClient, navigate, onSuccess]);

  // Mutation for creating a category
  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryFormInputs) => {
      return post("/categories", data, {});
    },
    onSuccess: () => {
      toast.success("Category created successfully");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/categories");
      }
    },
    onError: (error: any) => {
      Validate(error, setError);
      if (error.errors?.message) {
        toast.error(error.errors.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create category");
      }
    },
  });

  // Mutation for updating a category
  const updateCategoryMutation = useMutation({
    mutationFn: (data: CategoryFormInputs) => {
      return put(`/categories/${categoryId}`, data, {});
    },
    onSuccess: () => {
      toast.success("Category updated successfully");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category", categoryId] });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/categories");
      }
    },
    onError: (error: any) => {
      Validate(error, setError);
      if (error.errors?.message) {
        toast.error(error.errors.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update category");
      }
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<CategoryFormInputs> = (data) => {
    if (mode === "create") {
      createCategoryMutation.mutate(data);
    } else {
      updateCategoryMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      navigate("/categories");
    }
  };

  // Combined loading state from fetch and mutations
  const isFormLoading = isLoading || isFetchingCategory || createCategoryMutation.isPending || updateCategoryMutation.isPending;

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        {/* Category Name Field */}
        <div className="grid gap-2 relative">
          <Label htmlFor="name">Category Name</Label>
          <Input
            id="name"
            placeholder="Enter category name"
            {...register("name")}
            disabled={isFormLoading}
          />
          {errors.name && (
            <span className="text-red-500 text-[10px] absolute bottom-0 translate-y-[105%]">
              {errors.name.message}
            </span>
          )}
        </div>

        {/* Description Field */}
        <div className="grid gap-2 relative">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Enter category description"
            {...register("description")}
            disabled={isFormLoading}
            rows={4}
          />
          {errors.description && (
            <span className="text-red-500 text-[10px] absolute bottom-0 translate-y-[105%]">
              {errors.description.message}
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
              "Create"
            ) : (
              "Update"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm; 