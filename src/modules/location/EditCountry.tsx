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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader } from "lucide-react";
import Validate from "@/lib/Handlevalidation";

const countrySchema = z.object({
  zoneId: z.string().min(1, "Region is required"),
  location: z.string().min(1, "Location name is required"),
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
    queryKey: ["name", countryId],
    queryFn: async () => {
      const response = await get(`/name/${countryId}`);
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
    mutationFn: (data: CountryFormData) => put(`/location/${countryId}`, data),
    onSuccess: () => {
      toast.success("name updated successfully");
      queryClient.invalidateQueries(["name"]);
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
          <DialogTitle>Edit Location</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-2 relative">
              <Label htmlFor="name">Location Name</Label>
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

const locationSchema = z.object({
  zoneId: z.string().min(1, "Region is required"),
  location: z.string().min(1, "Location name is required"),
});

type LocationFormData = z.infer<typeof locationSchema>;

interface EditLocationProps {
  locationId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditLocation = ({ locationId, isOpen, onClose }: EditLocationProps) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
    setValue,
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      zoneId: "",
      location: "",
    },
  });

  // Fetch locations for the dropdown
  const { data: zonesData } = useQuery({
    queryKey: ["zones"],
    queryFn: () => get("/zones"),
  });

  const { data: locationData, isLoading } = useQuery({
    queryKey: ["locations", locationId],
    queryFn: async () => {
      const response = await get(`/locations/${locationId}`);
      return response;
    },
    enabled: !!locationId && isOpen,
  });

  useEffect(() => {
    if (locationData) {
      reset({
        zoneId: locationData.zoneId.toString(),
        location: locationData.location,
      });
    }
  }, [locationData, reset]);

  const updateLocationMutation = useMutation({
    mutationFn: (data: LocationFormData) =>
      put(`/locations/${locationId}`, {
        ...data,
        zoneId: parseInt(data.zoneId),
      }),
    onSuccess: () => {
      toast.success("Location updated successfully");
      queryClient.invalidateQueries(["locations"]);
      onClose();
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to update location");
    },
  });

  const onSubmit = (data: LocationFormData) => {
    updateLocationMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Location</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Label className="mb-2" htmlFor="zoneId">Region <span className="text-red-500">*</span></Label>
                <Select
                  defaultValue={locationData?.zoneId?.toString()}
                  onValueChange={(value) => setValue("zoneId", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a Region" />
                  </SelectTrigger>
                  <SelectContent>
                    {zonesData?.zones?.map((zone: any) => (
                      <SelectItem key={zone.id} value={zone.id.toString()}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.zoneId && (
                  <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
                    {errors.zoneId.message}
                  </span>
                )}
              </div>

              <div className="relative">
                <Label className="mb-2" htmlFor="location">Location Name <span className="text-red-500">*</span></Label>
                <Input
                  id="location"
                  placeholder="Enter location name"
                  {...register("location")}
                />
                {errors.location && (
                  <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
                    {errors.location.message}
                  </span>
                )}
              </div>
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
                disabled={updateLocationMutation.isLoading}
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

export default EditLocation;
