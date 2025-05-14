import React, { useState, useEffect } from "react";
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
import ZoneRoleEditor from './ZoneRoleAssignment';

const zonesSchema = z.object({
  name: z.string().min(1, "Country name is required"),
});

type CountryFormData = z.infer<typeof zonesSchema>;

interface CreateCountryProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreatedZoneResponse {
  id: number;
  name: string;
}

const CreateCountry: React.FC<CreateCountryProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [newlyCreatedCountry, setNewlyCreatedCountry] = useState<CreatedZoneResponse | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CountryFormData>({
    resolver: zodResolver(zonesSchema),
    defaultValues: {
      name: "",
    },
  });

  const createCountryMutation = useMutation<CreatedZoneResponse, Error, CountryFormData>({
    mutationFn: (newCountry: CountryFormData) => post("/zones", newCountry),
    onSuccess: (data) => {
      toast.success("Region created successfully! You can now assign roles.");
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      setNewlyCreatedCountry(data);
      setValue("name", data.name);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create Region");
    },
  });

  const onSubmit = (data: CountryFormData) => {
    if (newlyCreatedCountry) {
      toast.info("Roles are managed in the section below. Click 'Done' or 'Cancel' to close.");
      return;
    }
    createCountryMutation.mutate(data);
  };

  const handleCloseDialog = () => {
    reset();
    setNewlyCreatedCountry(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      reset();
      setNewlyCreatedCountry(null);
    }
  }, [isOpen, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{newlyCreatedCountry ? `Manage Roles for ${newlyCreatedCountry.name}` : "Add Region"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Region Name</Label>
            <Input
              id="name"
              placeholder="Enter Region Name..."
              {...register("name")}
              disabled={!!newlyCreatedCountry || createCountryMutation.isPending}
              className="mt-1"
            />
            {errors.name && (
              <span className="text-red-500 text-sm">
                {errors.name.message}
              </span>
            )}
          </div>

          {newlyCreatedCountry && newlyCreatedCountry.id && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid hsl(var(--border))' }}>
              <ZoneRoleEditor zoneId={newlyCreatedCountry.id} zoneName={newlyCreatedCountry.name} />
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDialog}
            >
              {newlyCreatedCountry ? "Done" : "Cancel"}
            </Button>
            {!newlyCreatedCountry && (
              <Button 
                type="submit" 
                className="bg-primary text-white ml-2" 
                disabled={createCountryMutation.isPending}
              >
                {createCountryMutation.isPending ? "Creating..." : "Create Region"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCountry;
