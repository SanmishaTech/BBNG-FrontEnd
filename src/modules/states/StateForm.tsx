import { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { post, put, get } from "@/services/apiService";
import Validate from "@/lib/Handlevalidation";

// Define interfaces for API responses
interface StateData {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const stateFormSchema = z.object({
  name: z.string()
    .min(1, "State name is required")
    .max(255, "State name must not exceed 255 characters"),
});

type StateFormInputs = z.infer<typeof stateFormSchema>;

interface StateFormProps {
  mode: "create" | "edit";
  stateId?: string;
  onSuccess?: () => void;
  className?: string;
}

const StateForm = ({
  mode,
  stateId,
  onSuccess,
  className,
}: StateFormProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Combined loading state will be determined by query and mutation states

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<StateFormInputs>({
    resolver: zodResolver(stateFormSchema),
    defaultValues: {
      name: "",
    },
  });

  // Query for fetching state data in edit mode
  const { isLoading: isFetchingState } = useQuery({
    queryKey: ["state", stateId],
    queryFn: async (): Promise<StateData> => {
      if (!stateId) throw new Error("State ID is required");
      return get(`/states/${stateId}`);
    },
    enabled: mode === "edit" && !!stateId,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Handle successful state fetch
  useEffect(() => {
    if (mode === "edit" && stateId) {
      queryClient.fetchQuery({
        queryKey: ["state", stateId],
        queryFn: async (): Promise<StateData> => {
          return get(`/states/${stateId}`);
        },
      }).then((data) => {
        setValue("name", data.name);
      }).catch((error) => {
        toast.error(error.message || "Failed to fetch state details");
        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/states");
        }
      });
    }
  }, [stateId, mode, setValue, queryClient, navigate, onSuccess]);

  // Mutation for creating a state
  const createStateMutation = useMutation({
    mutationFn: (data: StateFormInputs) => {
      return post("/states", data);
    },
    onSuccess: () => {
      toast.success("State created successfully");
      queryClient.invalidateQueries({ queryKey: ["states"] });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/states");
      }
    },
    onError: (error: any) => {
      Validate(error, setError);
      if (error.errors?.message) {
        toast.error(error.errors.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create state");
      }
    },
  });

  // Mutation for updating a state
  const updateStateMutation = useMutation({
    mutationFn: (data: StateFormInputs) => {
      return put(`/states/${stateId}`, data);
    },
    onSuccess: () => {
      toast.success("State updated successfully");
      queryClient.invalidateQueries({ queryKey: ["states"] });
      queryClient.invalidateQueries({ queryKey: ["state", stateId] });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/states");
      }
    },
    onError: (error: any) => {
      Validate(error, setError);
      if (error.errors?.message) {
        toast.error(error.errors.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update state");
      }
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<StateFormInputs> = (data) => {
    if (mode === "create") {
      createStateMutation.mutate(data);
    } else {
      updateStateMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      navigate("/states");
    }
  };

  // Combined loading state from fetch and mutations
  const isFormLoading = isFetchingState || createStateMutation.isPending || updateStateMutation.isPending;

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        {/* State Name Field */}
        <div className="grid gap-2 relative">
          <Label htmlFor="name">State Name</Label>
          <Input
            id="name"
            placeholder="Enter state name"
            {...register("name")}
            disabled={isFormLoading}
          />
          {errors.name && (
            <span className="text-red-500 text-[10px] absolute bottom-0 translate-y-[105%]">
              {errors.name.message}
            </span>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isFormLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isFormLoading}>
            {isFormLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create" : "Update"} State
          </Button>
        </div>
      </form>
    </div>
  );
};

export default StateForm;
