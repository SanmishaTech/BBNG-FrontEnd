// src/components/ChapterForm.tsx

import { useEffect, useMemo } from "react";
import ChapterRoleAssignment from "./ChapterRoleAssignment";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Validate from "@/lib/Handlevalidation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DatePickerWithInput } from "@/components/ui/date-picker-input";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import ZoneRolesInfo from "@/components/common/ZoneRolesInfo";

// ----------------------
// 1) Schema Definition
// ----------------------
const chapterSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    zoneId: z.number().int().min(1, "Zone is required"),
    locationId: z.number().int().nullable(),
    date: z.date({ required_error: "Formation Date is required" }),
    meetingday: z.string().min(1, "Meeting day is required"),
    status: z.boolean(),
    venue: z.string().min(1, "Venue is required"),
    bankopeningbalance: z.number().nullable(),
    bankclosingbalance: z.number().nullable(),
    cashopeningbalance: z.number().nullable(),
    cashclosingbalance: z.number().nullable(),
  })
  .superRefine((data, ctx) => {
    // If a zone is selected, require a location
    if (data.zoneId > 0 && (data.locationId == null || data.locationId < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["locationId"],
        message: "Location is required when a zone is selected",
      });
    }
  });

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

type ChapterFormInputs = z.infer<typeof chapterSchema>;

// ----------------------
// 2) API Data Types
// ----------------------
type Zone = { id: number; name: string };
type Location = { id: number; location: string; zoneId: number };

// Partial API payload (dates as string)
type ChapterApiPayload = Omit<ChapterFormInputs, "date"> & { date?: string };

// ----------------------
// 3) Main Component
// ----------------------
export default function ChapterForm({ mode }: { mode: "create" | "edit" }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch zones + locations
  const { data: zones = [], isLoading: loadingZones } = useQuery({
    queryKey: ["zones"],
    queryFn: () => get("/zones").then((r) => r.zones as Zone[]),
  });

  const { data: locations = [], isLoading: loadingLocations } = useQuery({
    queryKey: ["locations"],
    queryFn: () => get("/locations").then((r) => r.locations as Location[]),
  });

  // Initialize react-hook-form
  const form = useForm<ChapterFormInputs>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      name: "",
      zoneId: 0,
      locationId: null,
      date: new Date(),
      meetingday: "",
      status: true,
      venue: "",
      bankopeningbalance: null,
      bankclosingbalance: null,
      cashopeningbalance: null,
      cashclosingbalance: null,
    },
  });

  const { reset, watch, setValue, getValues, setError } = form;
  const selectedZoneId = watch("zoneId");

  // ----------------------
  // 4) Edit Mode Prefill
  // ----------------------
  const { isLoading: loadingChapter } = useQuery({
    queryKey: ["chapter", id],
    queryFn: async () => {
      const apiData = await get(`/chapters/${id}`);
      // Wait for zones and locations to be loaded before setting form values
      if (!loadingZones && !loadingLocations) {
        reset({
          ...apiData,
          date: apiData.date ? new Date(apiData.date) : new Date(),
          zoneId: apiData.zoneId ?? 0,
          locationId: apiData.locationId ?? null,
          bankopeningbalance: apiData.bankopeningbalance ? Number(apiData.bankopeningbalance) : null,
          bankclosingbalance: apiData.bankclosingbalance ? Number(apiData.bankclosingbalance) : null,
          cashopeningbalance: apiData.cashopeningbalance ? Number(apiData.cashopeningbalance) : null,
          cashclosingbalance: apiData.cashclosingbalance ? Number(apiData.cashclosingbalance) : null,
        });
      }
      return apiData;
    },
    enabled: mode === "edit",
  });

  // Re-run form reset when dependencies are loaded
  useEffect(() => {
    if (mode === "edit" && !loadingZones && !loadingLocations && id) {
      get(`/chapters/${id}`).then((apiData) => {
        reset({
          ...apiData,
          date: apiData.date ? new Date(apiData.date) : new Date(),
          zoneId: apiData.zoneId ?? 0,
          locationId: apiData.locationId ?? null,
          bankopeningbalance: apiData.bankopeningbalance ? Number(apiData.bankopeningbalance) : null,
          bankclosingbalance: apiData.bankclosingbalance ? Number(apiData.bankclosingbalance) : null,
          cashopeningbalance: apiData.cashopeningbalance ? Number(apiData.cashopeningbalance) : null,
          cashclosingbalance: apiData.cashclosingbalance ? Number(apiData.cashclosingbalance) : null,
        });
      });
    }
  }, [mode, loadingZones, loadingLocations, id, reset]);

  // ------------------------------------------
  // 5) Sync + Clear Location When Zone Changes
  // ------------------------------------------
  useEffect(() => {
    const currentFormLocationId = getValues("locationId");

    // Skip all checks if we're still loading locations
    if (loadingLocations) {
      return;
    }

    // If no zone is selected, locationId should be null
    if (!selectedZoneId) {
      if (currentFormLocationId !== null) {
        setValue("locationId", null, { shouldValidate: true });
      }
      return;
    }

    // Skip validation if we have a valid locationId and locations aren't loaded yet
    // This preserves the location during initial load in edit mode
    if (currentFormLocationId && locations.length === 0) {
      return;
    }

    // If we have a locationId, validate it against the selected zone
    if (currentFormLocationId !== null) {
      const isValidLocationForZone = locations.some(
        (loc) =>
          loc.zoneId === selectedZoneId && loc.id === currentFormLocationId
      );
      // Only clear the location if it's invalid for the selected zone
      if (!isValidLocationForZone) {
        setValue("locationId", null, { shouldValidate: true });
      }
    }
  }, [selectedZoneId, locations, setValue, getValues, loadingLocations]);

  // Memoize filtered locations for dropdown
  const filteredLocations = useMemo(
    () => locations.filter((loc) => loc.zoneId === selectedZoneId),
    [locations, selectedZoneId]
  );

  // ----------------------
  // 6) Mutations
  // ----------------------
  const createMutation = useMutation({
    mutationFn: (data: ChapterFormInputs) => post("/chapters", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
      navigate("/chapters");
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to update country");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ChapterFormInputs) => put(`/chapters/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
      navigate("/chapters");
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to update country");
    },
  });

  // ----------------------
  // 7) Submit Handler
  // ----------------------
  const onSubmit: SubmitHandler<ChapterFormInputs> = (data) => {
    if (mode === "create") createMutation.mutate(data);
    else updateMutation.mutate(data);
  };

  // ----------------------
  // 8) Global Loading State
  // ----------------------
  const isLoadingFormData =
    (mode === "edit" && (loadingChapter || loadingZones || loadingLocations)) ||
    (mode === "create" && (loadingZones || loadingLocations));

  if (isLoadingFormData) {
    return (
      <Card className="max-w-3xl mx-auto my-8">
        <CardContent>Loading chapter data…</CardContent>
      </Card>
    );
  }

  // ----------------------
  // 9) Render Form UI
  // ----------------------
  return (
    <Card className=" mx-auto my-8">
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Create New Chapter" : "Edit Chapter"}
        </CardTitle>
        <CardDescription>
          {mode === "create"
            ? "Fill out the form to create a chapter."
            : "Update the chapter details below."}
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            {/* Basic Info Section */}
            <div className="grid gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>Chapter Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter chapter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-6">
                {/* Zone */}
                <FormField
                  control={form.control}
                  name="zoneId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zone <span className="text-red-500">*</span></FormLabel>
                      <div className="flex items-center">
                        <Select
                          value={String(field.value)}
                          onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a zone" />
                          </SelectTrigger>
                          <SelectContent>
                            {zones.map((z) => (
                              <SelectItem key={z.id} value={String(z.id)}>
                                {z.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <ZoneRolesInfo zoneId={field.value > 0 ? field.value : null} />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location */}
                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location <span className="text-red-500">*</span></FormLabel>
                      <Select
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(v) =>
                          field.onChange(v ? Number(v) : null)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a location" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredLocations.length > 0 ? (
                            filteredLocations.map((loc) => (
                              <SelectItem key={loc.id} value={String(loc.id)}>
                                {loc.location}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              {selectedZoneId
                                ? "No locations in this zone"
                                : "Select a zone first"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Formation Date</FormLabel>
                      <DatePickerWithInput
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meetingday"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Day <span className="text-red-500">*</span></FormLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select meeting day" />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <div className="flex items-center pt-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <Label className="ml-2">Active</Label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>Meeting Venue <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter venue address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Balance Information Section */}
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="bankopeningbalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Opening Balance</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter bank opening balance"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value
                              ? parseFloat(e.target.value)
                              : null;
                            field.onChange(value);
                          }}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankclosingbalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Closing Balance</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter bank closing balance"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value
                              ? parseFloat(e.target.value)
                              : null;
                            field.onChange(value);
                          }}
                          value={field.value ?? ""}
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cashopeningbalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cash Opening Balance</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter cash opening balance"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value
                              ? parseFloat(e.target.value)
                              : null;
                            field.onChange(value);
                          }}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cashclosingbalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cash Closing Balance</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter cash closing balance"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value
                              ? parseFloat(e.target.value)
                              : null;
                            field.onChange(value);
                          }}
                          value={field.value ?? ""}
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end space-x-4  pt-6 mt-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate("/chapters")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                loadingZones ||
                loadingLocations
              }
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : mode === "create"
                ? "Create Chapter"
                : "Update Chapter"}
            </Button>
          </CardFooter>
          
          {/* Only show chapter role assignment in edit mode and when we have a chapter ID */}
          {mode === "edit" && id && (
            <ChapterRoleAssignment chapterId={parseInt(id)} />
          )}
        </form>
      </Form>
    </Card>
  );
}
