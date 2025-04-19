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

const zonesSchema = z.object({
  name: z.string().min(1, "Country name is required"),
});

type CountryFormData = z.infer<typeof zonesSchema>;

interface CreateCountryProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateCountry: React.FC<CreateCountryProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CountryFormData>({
    resolver: zodResolver(zonesSchema),
    defaultValues: {
      name: "",
    },
  });

  const createCountryMutation = useMutation({
    mutationFn: (newCountry: CountryFormData) => post("/zones", newCountry),
    onSuccess: () => {
      toast.success("Country created successfully");
      queryClient.invalidateQueries(["zones"]);
      reset();
      onClose();
    },
    onError: () => {
      toast.error("Failed to create zones");
    },
  });

  const onSubmit = (data: CountryFormData) => {
    createCountryMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-2 relative">
            <Label htmlFor="name">Country Name</Label>
            <Input
              id="name"
              placeholder="Enter Country Name..."
              {...register("name")}
            />
            {errors.name && (
              <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
                {errors.name.message}
              </span>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="ml-2"
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

export default CreateCountry;
