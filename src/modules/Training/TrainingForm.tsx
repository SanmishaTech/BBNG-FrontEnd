import React, { useEffect } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle, Calendar as CalendarIcon, Clock } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { post, put, get } from "@/services/apiService";
import Validate from "@/lib/Handlevalidation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

// Define interfaces for API responses
interface TrainingData {
  id: number;
  date: string;
  time: string;
  title: string;
  venue: string;
  createdAt: string;
  updatedAt: string;
}

const trainingFormSchema = z.object({
  date: z.date({ required_error: "Date is required" }),
  time: z.string().min(1, "Time is required"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must not exceed 255 characters"),
  venue: z
    .string()
    .min(1, "Venue is required")
    .max(255, "Venue must not exceed 255 characters"),
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

  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors },
  } = useForm<TrainingFormInputs>({
    resolver: zodResolver(trainingFormSchema),
    defaultValues: {
      date: new Date(),
      time: "",
      title: "",
      venue: "",
    },
  });

  // Query for fetching training data in edit mode
  const { isLoading: isFetchingTraining, data: fetchedTrainingData } =
    useQuery<TrainingData>({
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
    if (mode === "edit" && fetchedTrainingData) {
      reset({
        date: new Date(fetchedTrainingData.date),
        time: fetchedTrainingData.time,
        title: fetchedTrainingData.title,
        venue: fetchedTrainingData.venue,
      });
    } else if (
      mode === "edit" &&
      !isFetchingTraining &&
      !fetchedTrainingData &&
      trainingId
    ) {
      // Handle case where fetch might have failed or returned no data, but not loading anymore
      toast.error("Failed to fetch training details or training not found.");
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/trainings");
      }
    }
  }, [
    trainingId,
    mode,
    reset,
    fetchedTrainingData,
    isFetchingTraining,
    navigate,
    onSuccess,
  ]);

  // Generate time options
  type TimeOptionsMap = Record<string, string[]>;
  const generateTimeOptions = (): TimeOptionsMap => {
    const groupedOptions: TimeOptionsMap = {};
    for (let hour = 7; hour < 21; hour++) {
      // 7 AM to 9 PM
      const hourKey =
        hour < 12 ? `${hour} AM` : hour === 12 ? `12 PM` : `${hour - 12} PM`;
      groupedOptions[hourKey] = [];
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        groupedOptions[hourKey].push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return groupedOptions;
  };
  const TIME_OPTIONS = generateTimeOptions();

  // Mutation for creating a training
  const createTrainingMutation = useMutation({
    mutationFn: (data: TrainingFormInputs) => {
      // Format the date for the API
      const formattedData = {
        ...data,
        date: data.date.toISOString(),
        // time, title, venue are already strings
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
        date: data.date.toISOString(),
        // time, title, venue are already strings
      };
      return put(`/trainings/${trainingId}`, formattedData);
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
  const isFormLoading =
    isFetchingTraining ||
    createTrainingMutation.isPending ||
    updateTrainingMutation.isPending;

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date Field */}
          <div className="grid gap-2 relative w-full">
            <Label htmlFor="date">Date</Label>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <Input
                  type="date"
                  id="date"
                  value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    // Create a new Date object in UTC to avoid timezone issues.
                    // The value will be 'YYYY-MM-DD', and new Date() will parse it as UTC midnight.
                    field.onChange(dateValue ? new Date(dateValue + 'T00:00:00') : null);
                  }}
                  className="min-w-full"
                />
              )}
            />
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date.message}</p>
            )}
          </div>

          {/* Time Field */}
          <div className="grid gap-2 relative">
            <Label htmlFor="time">
              Time <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="time"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isFormLoading}
                >
                  <SelectTrigger>
                    <Clock className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {Object.entries(TIME_OPTIONS).map(([hourLabel, times]) => (
                      <React.Fragment key={hourLabel}>
                        <SelectItem
                          value={hourLabel}
                          disabled
                          className="font-semibold bg-muted"
                        >
                          {hourLabel}
                        </SelectItem>
                        {times.map((timeOpt) => (
                          <SelectItem key={timeOpt} value={timeOpt}>
                            {timeOpt}
                          </SelectItem>
                        ))}
                      </React.Fragment>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.time && (
              <span className="text-red-500 text-xs absolute bottom-0 translate-y-full mt-1">
                {errors.time.message}
              </span>
            )}
          </div>
        </div>

        {/* Title Field */}
        <div className="grid gap-2 relative">
          <Label htmlFor="title">
            Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            placeholder="Enter training title"
            {...register("title")}
            disabled={isFormLoading}
          />
          {errors.title && (
            <span className="text-red-500 text-xs absolute bottom-0 translate-y-full mt-1">
              {errors.title.message}
            </span>
          )}
        </div>

        {/* Venue Field */}
        <div className="grid gap-2 relative">
          <Label htmlFor="venue">
            Venue <span className="text-red-500">*</span>
          </Label>
          <Input
            id="venue"
            placeholder="Enter training venue"
            {...register("venue")}
            disabled={isFormLoading}
          />
          {errors.venue && (
            <span className="text-red-500 text-xs absolute bottom-0 translate-y-full mt-1">
              {errors.venue.message}
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
