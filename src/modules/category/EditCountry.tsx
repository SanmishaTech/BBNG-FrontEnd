import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, put } from "@/services/apiService";
import { z } from "zod";
import { toast } from "sonner";
import { Button, Input } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader } from "lucide-react";
import Validate from "@/lib/Handlevalidation";

// Validation schema for editing a category
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().min(1, "Category description is required"),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface EditCategoryProps {
  categoryId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditCategory: React.FC<EditCategoryProps> = ({
  categoryId,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "" },
  });

  // Fetch category data when dialog opens
  const { data: categoryData, isLoading } = useQuery({
    queryKey: ["categories", categoryId],
    queryFn: async () => {
      const response = await get(`/categories/${categoryId}`);
      return response;
    },
    enabled: !!categoryId && isOpen,
  });

  useEffect(() => {
    if (categoryData) {
      reset({
        name: categoryData.name,
        description: categoryData.description,
      });
    }
  }, [categoryData, reset]);

  // Mutation to update category
  const updateCategoryMutation = useMutation({
    mutationFn: (data: CategoryFormData) =>
      put(`/categories/${categoryId}`, data),
    onSuccess: () => {
      toast.success("Category updated successfully");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onClose();
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to update category");
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    updateCategoryMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2 relative">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                placeholder="Enter category name..."
                {...register("name")}
              />
              {errors.name && (
                <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
                  {errors.name.message}
                </span>
              )}
            </div>
            <div className="grid gap-2 relative">
              <Label htmlFor="description">Category Description</Label>
              <Input
                id="description"
                placeholder="Enter category description..."
                {...register("description")}
              />
              {errors.description && (
                <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
                  {errors.description.message}
                </span>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-white"
                disabled={updateCategoryMutation.isLoading}
              >
                Update
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditCategory;
