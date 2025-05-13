import React from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { post, get } from "@/services/apiService";
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
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const locationSchema = z.object({
  zoneId: z.string().min(1, "Zone is required"),
  location: z.string().min(1, "Location name is required"),
});

type LocationFormData = z.infer<typeof locationSchema>;

interface CreateLocationProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateLocation: React.FC<CreateLocationProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      zoneId: "",
      location: "",
    },
  });

  // Fetch zones for the dropdown
  const { data: zonesData } = useQuery({
    queryKey: ["zones"],
    queryFn: () => get("/zones"),
  });

  const createLocationMutation = useMutation({
    mutationFn: (newLocation: LocationFormData) =>
      post("/locations", {
        ...newLocation,
        zoneId: parseInt(newLocation.zoneId),
      }),
    onSuccess: () => {
      toast.success("Location created successfully");
      queryClient.invalidateQueries(["locations"]);
      reset();
      onClose();
    },
    onError: () => {
      toast.error("Failed to create location");
    },
  });

  const onSubmit = (data: LocationFormData) => {
    createLocationMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Location</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-4 grid-cols-2 gap-y-6 mt-4">
            <div className="relative">
              <Label className="mb-2" htmlFor="zoneId">
                Zone
              </Label>
              <Select onValueChange={(value) => setValue("zoneId", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a zone" />
                </SelectTrigger>
                <SelectContent>
                  {zonesData?.zones?.map((zone: any) => (
                    <SelectItem key={zone.id} value={zone.id.toString()}>
                      {zone.name}
                    </SelectItem>
                  )) || (
                    <SelectItem value="no-zones" disabled>
                      No zones available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.zoneId && (
                <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
                  {errors.zoneId.message}
                </span>
              )}
            </div>

            <div className="relative ">
              <Label htmlFor="location" className="mb-2">
                Location Name
              </Label>
              <Input
                id="location"
                placeholder="Enter Location Name..."
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
            <Button type="submit" className="bg-primary text-white">
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLocation;
