// src/modules/chapter/ChapterMeetingForm.tsx

import { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { get, post, put } from "@/services/apiService";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Validate from "@/lib/Handlevalidation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ----------------------
// 1) Schema Definition
// ----------------------
const chapterMeetingSchema = z.object({
  date: z.string().min(1, "Meeting date is required"),
  meetingTime: z.string().min(1, "Meeting time is required"),
  meetingTitle: z.string().min(1, "Meeting title is required"),
  meetingVenue: z.string().min(1, "Meeting venue is required"),
  // chapterId removed as it's now determined from the logged-in user
});

type ChapterMeetingFormInputs = z.infer<typeof chapterMeetingSchema>;

// Define type for time options grouped by hour
type TimeOptionsMap = Record<string, string[]>;

// Generate time options in 15-minute intervals, grouped by hour for better performance
const generateTimeOptions = (): TimeOptionsMap => {
  // Group by hour for better performance
  const groupedOptions: TimeOptionsMap = {};

  // Only generate common business hours by default (7 AM to 9 PM)
  // This significantly reduces the number of options loaded at once
  for (let hour = 7; hour < 21; hour++) {
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

// ----------------------
// 3) Main Component
// ----------------------
export default function ChapterMeetingForm({
  mode,
}: {
  mode: "create" | "edit";
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // No need to fetch chapters anymore as chapterId is determined from logged-in user
  const loadingChapters = false;

  // Initialize react-hook-form
  const form = useForm<ChapterMeetingFormInputs>({
    resolver: zodResolver(chapterMeetingSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      meetingTime: "",
      meetingTitle: "",
      meetingVenue: "",
      // chapterId removed as it's determined from logged-in user
    },
  });

  const { reset, setValue, setError } = form;

  // ----------------------
  // 4) Edit Mode Prefill
  // ----------------------
  const { isLoading: loadingMeeting } = useQuery({
    queryKey: ["chapterMeeting", id],
    queryFn: async () => {
      const apiData = await get(`/chapter-meetings/${id}`);
      // No need to wait for chapters as they're no longer needed
      reset({
        ...apiData,
        date: apiData.date ? new Date(apiData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        // chapterId is now determined from the logged-in user
      });
      return apiData;
    },
    enabled: mode === "edit",
  });

  // Re-run form reset when dependencies are loaded
  useEffect(() => {
    if (mode === "edit" && id) {
      get(`/chapter-meetings/${id}`).then((apiData) => {
        reset({
          ...apiData,
          date: apiData.date ? new Date(apiData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          // chapterId is now determined from the logged-in user
        });
      });
    }
  }, [mode, loadingChapters, id, reset]);

  // ----------------------
  // 6) Mutations
  // ----------------------
  const createMutation = useMutation({
    mutationFn: (data: ChapterMeetingFormInputs) => {
      // Chapter ID is now determined from the logged-in user on the server side
      return post("/chapter-meetings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chaptermeetings"] });
      navigate("/chaptermeetings");
      toast.success("Meeting created successfully");
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to create meeting");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ChapterMeetingFormInputs) => {
      // Chapter ID is now determined from the logged-in user on the server side
      return put(`/chapter-meetings/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chaptermeetings"] });
      navigate("/chaptermeetings");
      toast.success("Meeting updated successfully");
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to update meeting");
    },
  });

  // ----------------------
  // 7) Submit Handler
  // ----------------------
  const onSubmit: SubmitHandler<ChapterMeetingFormInputs> = (data) => {
    if (mode === "create") createMutation.mutate(data);
    else updateMutation.mutate(data);
  };

  // ----------------------
  // 8) Global Loading State
  // ----------------------
  const isLoadingFormData =
    (mode === "edit" && (loadingMeeting || loadingChapters)) ||
    (mode === "create" && loadingChapters);

  if (isLoadingFormData) {
    return (
      <Card className="max-w-3xl mx-auto my-8">
        <CardContent>Loading meeting data…</CardContent>
      </Card>
    );
  }

  // ----------------------
  // 9) Render Form UI
  // ----------------------
  return (
    <Card className="mx-auto my-8">
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Create New Meeting" : "Edit Meeting"}
        </CardTitle>
        <CardDescription>
          {mode === "create"
            ? "Fill out the form to create a chapter meeting."
            : "Update the chapter meeting details below."}
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            {/* Basic Info Section */}
            <div className="grid gap-6">
              {/* Chapter field removed as it's now determined from the logged-in user */}

              <FormField
                control={form.control}
                name="meetingTitle"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>
                      Meeting Title <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter meeting title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Meeting Date <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          placeholder="Select meeting date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meetingTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Meeting Time <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select meeting time" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {/* Render options grouped by hour for better performance */}
                          {Object.entries(TIME_OPTIONS).map(
                            ([hourLabel, times]) => (
                              <div key={hourLabel}>
                                <SelectItem
                                  value={hourLabel}
                                  disabled
                                  className="font-semibold bg-muted"
                                >
                                  {hourLabel}
                                </SelectItem>
                                {times.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </div>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="meetingVenue"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>
                      Meeting Venue <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter meeting venue" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end space-x-4 pt-6 mt-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate("/chaptermeetings")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                loadingChapters
              }
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : mode === "create"
                ? "Create Meeting"
                : "Update Meeting"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
