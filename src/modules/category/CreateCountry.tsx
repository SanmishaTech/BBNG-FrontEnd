import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { post } from "@/services/apiService";
import { Button, Input } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Validation schema for creating a category
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().min(1, "Category description is required"),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CreateCategoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateCategory: React.FC<CreateCategoryProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "" },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (newCategory: CategoryFormData) =>
      post("/categories", newCategory),
    onSuccess: () => {
      toast.success("Category created successfully");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      reset();
      onClose();
    },
    onError: () => {
      toast.error("Failed to create category");
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    createCategoryMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
        </DialogHeader>
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
            <Button type="submit" className="bg-primary text-white">
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCategory;
