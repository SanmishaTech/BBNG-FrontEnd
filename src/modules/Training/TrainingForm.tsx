import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { post, put, get } from "@/services/apiService";
import Validate from "@/lib/Handlevalidation";
import { DateTimePicker } from "@/components/ui/date-time-picker";

// Define interfaces for API responses
interface TrainingData {
  id: number;
  trainingDate: string;
  trainingTopic: string;
  createdAt: string;
  updatedAt: string;
}

const trainingFormSchema = z.object({
  trainingDate: z.date({
    required_error: "Training date is required",
  }),
  trainingTopic: z
    .string()
    .min(1, "Training topic is required")
    .max(255, "Training topic must not exceed 255 characters"),
});

type TrainingFormInputs = z.infer<typeof trainingFormSchema>;

interface TrainingFormProps {
  mode: "create" | "edit";
  trainingId?: string;
  onSuccess?: () => void;
  className?: string;
}

const TrainingForm = ({
  mode,
  trainingId,
  onSuccess,
  className,
}: TrainingFormProps) => {
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
  } = useForm<TrainingFormInputs>({
    resolver: zodResolver(trainingFormSchema),
    defaultValues: {
      trainingDate: new Date(),
      trainingTopic: "",
    },
  });

  // Query for fetching training data in edit mode
  const { isLoading: isFetchingTraining } = useQuery({
    queryKey: ["training", trainingId],
    queryFn: async (): Promise<TrainingData> => {
      if (!trainingId) throw new Error("Training ID is required");
      return get(`/trainings/${trainingId}`);
    },
    enabled: mode === "edit" && !!trainingId,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Handle successful training fetch
  useEffect(() => {
    if (mode === "edit" && trainingId) {
      queryClient.fetchQuery({
        queryKey: ["training", trainingId],
        queryFn: async (): Promise<TrainingData> => {
          return get(`/trainings/${trainingId}`);
        },
      }).then((data) => {
        setValue("trainingDate", new Date(data.trainingDate));
        setValue("trainingTopic", data.trainingTopic);
      }).catch((error) => {
        toast.error(error.message || "Failed to fetch training details");
        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/trainings");
        }
      });
    }
  }, [trainingId, mode, setValue, queryClient, navigate, onSuccess]);

  // Mutation for creating a training
  const createTrainingMutation = useMutation({
    mutationFn: (data: TrainingFormInputs) => {
      // Format the date for the API
      const formattedData = {
        ...data,
        trainingDate: data.trainingDate.toISOString(),
      };
      return post("/trainings", formattedData, {});
    },
    onSuccess: () => {
      toast.success("Training created successfully");
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/trainings");
      }
    },
    onError: (error: any) => {
      Validate(error, setError);
      if (error.errors?.message) {
        toast.error(error.errors.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create training");
      }
    },
  });

  // Mutation for updating a training
  const updateTrainingMutation = useMutation({
    mutationFn: (data: TrainingFormInputs) => {
      // Format the date for the API
      const formattedData = {
        ...data,
        trainingDate: data.trainingDate.toISOString(),
      };
      return put(`/trainings/${trainingId}`, formattedData, {});
    },
    onSuccess: () => {
      toast.success("Training updated successfully");
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
      queryClient.invalidateQueries({ queryKey: ["training", trainingId] });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/trainings");
      }
    },
    onError: (error: any) => {
      Validate(error, setError);
      if (error.errors?.message) {
        toast.error(error.errors.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update training");
      }
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<TrainingFormInputs> = (data) => {
    if (mode === "create") {
      createTrainingMutation.mutate(data);
    } else {
      updateTrainingMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      navigate("/trainings");
    }
  };

  // Combined loading state from fetch and mutations
  const isFormLoading = isLoading || isFetchingTraining || createTrainingMutation.isPending || updateTrainingMutation.isPending;

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        {/* Training Date Field */}
        <div className="grid gap-2 relative">
          <Label htmlFor="trainingDate">Training Date & Time</Label>
          <Controller
            name="trainingDate"
            control={control}
            render={({ field }) => (
              <DateTimePicker
                value={field.value}
                onChange={field.onChange}
                disabled={isFormLoading}
              />
            )}
          />
          {errors.trainingDate && (
            <span className="text-red-500 text-[10px] absolute bottom-0 translate-y-[105%]">
              {errors.trainingDate.message}
            </span>
          )}
        </div>

        {/* Training Topic Field */}
        <div className="grid gap-2 relative">
          <Label htmlFor="trainingTopic">Training Topic</Label>
          <Textarea
            id="trainingTopic"
            placeholder="Enter training topic"
            {...register("trainingTopic")}
            disabled={isFormLoading}
            rows={4}
          />
          {errors.trainingTopic && (
            <span className="text-red-500 text-[10px] absolute bottom-0 translate-y-[105%]">
              {errors.trainingTopic.message}
            </span>
          )}
        </div>

        {/* Submit and Cancel Buttons */}
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
            {isFormLoading ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : mode === "create" ? (
              "Create Training"
            ) : (
              "Update Training"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TrainingForm; 