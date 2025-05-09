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
const countrySchema = z.object({
  name: z.string().min(1, "zones name is required"),
});

type CountryFormData = z.infer<typeof countrySchema>;

interface EditCountryProps {
  countryId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditCountry = ({ countryId, isOpen, onClose }: EditCountryProps) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<CountryFormData>({
    resolver: zodResolver(countrySchema),
    defaultValues: {
      name: "",
    },
  });

  const { data: countryData, isLoading } = useQuery({
    queryKey: ["zones", countryId],
    queryFn: async () => {
      const response = await get(`/zones/${countryId}`);
      return response; // API returns the country object directly
    },
    enabled: !!countryId && isOpen,
  });

  useEffect(() => {
    if (countryData) {
      reset({
        name: countryData.name, // Access the name directly from response
      });
    }
  }, [countryData, reset]);

  const updateCountryMutation = useMutation({
    mutationFn: (data: CountryFormData) => put(`/zones/${countryId}`, data),
    onSuccess: () => {
      toast.success("zones updated successfully");
      queryClient.invalidateQueries(["zones"]);
      onClose();
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to update country");
    },
  });

  const onSubmit = (data: CountryFormData) => {
    updateCountryMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit zones</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-2 relative">
              <Label htmlFor="name">zones Name</Label>
              <Input
                id="name"
                placeholder="Enter country name"
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
              <Button
                type="submit"
                className="bg-primary text-white"
                disabled={updateCountryMutation.isLoading}
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

export default EditCountry;
