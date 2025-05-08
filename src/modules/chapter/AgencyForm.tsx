// src/components/ChapterForm.tsx

import { useEffect, useMemo } from "react";
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
import { Calendar } from "@/components/ui/calendar";
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
    monthlyVenue: z.number().int().nonnegative(),
    quarterlyVenue: z.number().int().nonnegative(),
    halfYearlyVenue: z.number().int().nonnegative(),
    yearlyVenue: z.number().int().nonnegative(),
    earlybirdVenue: z.number().int().nonnegative(),
    quarterlyHo: z.number().int().nonnegative(),
    halfyearlyHo: z.number().int().nonnegative(),
    yearlyHo: z.number().int().nonnegative(),
    earlybirdHo: z.number().int().nonnegative(),
    bankopeningbalance: z.number().int(),
    bankclosingbalance: z.number().int(),
    cashopeningbalance: z.number().int(),
    cashclosingbalance: z.number().int(),
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
      monthlyVenue: 0,
      quarterlyVenue: 0,
      halfYearlyVenue: 0,
      yearlyVenue: 0,
      earlybirdVenue: 0,
      quarterlyHo: 0,
      halfyearlyHo: 0,
      yearlyHo: 0,
      earlybirdHo: 0,
      bankopeningbalance: 0,
      bankclosingbalance: 0,
      cashopeningbalance: 0,
      cashclosingbalance: 0,
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
      reset({
        ...apiData,
        date: apiData.date ? new Date(apiData.date) : new Date(),
        zoneId: apiData.zoneId ?? 0,
        locationId: apiData.locationId ?? null,
      });
      return apiData;
    },
    enabled: mode === "edit",
  });

  // ------------------------------------------
  // 5) Sync + Clear Location When Zone Changes
  // ------------------------------------------
  // ------------------------------------------
  // 5) Sync + Clear Location When Zone Changes
  // ------------------------------------------
  useEffect(() => {
    const currentFormLocationId = getValues("locationId");

    // If no zone is selected, locationId should be null.
    if (!selectedZoneId) {
      if (currentFormLocationId !== null) {
        // Only set if it's not already null
        setValue("locationId", null, { shouldValidate: true });
      }
      return;
    }

    // IMPORTANT: If locations are still loading, or not yet populated,
    // don't try to validate or clear the locationId.
    // This prevents clearing a locationId set by `reset` before locations are ready.
    // This prevents clearing a locationId set by `reset` before locations are ready.
    if (loadingLocations || (locations.length === 0 && selectedZoneId > 0)) {
      // Added loadingLocations check and ensure locations has items if a zone is selected
      // If we have a selectedZoneId but no locations yet, it implies locations are still loading or there are genuinely no locations.
      // We should wait for loadingLocations to be false to make a decision.
      // If currentFormLocationId is already set (e.g., by reset), we don't want to clear it prematurely.
      return;
    }

    // If a zone is selected AND locations are loaded:
    // Check if the current locationId (if any) is valid for the selected zone.
    // This handles:
    // 1. User manually changing the zone (clears incompatible location).
    // 2. Initial load: after `reset` and `locations` are both ready, it re-validates.
    //    If `reset` set a locationId that became invalid due to some other logic or bad data, it would be cleared.
    //    More commonly, it will correctly *keep* the locationId if it's valid.
    if (currentFormLocationId !== null) {
      const isValidLocationForZone = locations.some(
        (loc) =>
          loc.zoneId === selectedZoneId && loc.id === currentFormLocationId
      );
      if (!isValidLocationForZone) {
        setValue("locationId", null, { shouldValidate: true });
      }
    }
    // If currentFormLocationId is null, and selectedZoneId is present,
    // the superRefine in Zod schema will handle the validation message if needed.
    // No need to explicitly set it to null again here if it's already null.
  }, [selectedZoneId, locations, setValue, getValues, loadingLocations]); // Add loadingLocations to dependency array
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
                    <FormLabel>Chapter Name</FormLabel>
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
                      <FormLabel>Zone</FormLabel>
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
                      <FormLabel>Location</FormLabel>
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
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value
                                ? format(field.value, "PPP")
                                : "Pick a date"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meetingday"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Day</FormLabel>
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
                    <FormLabel>Meeting Venue</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter venue address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* --- Venue Contributions --- */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Venue Contributions
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  ["monthlyVenue", "Monthly Venue Fee"],
                  ["quarterlyVenue", "Quarterly Venue Fee"],
                  ["halfYearlyVenue", "Half-Yearly Venue Fee"],
                ].map(([name, label]) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name as keyof ChapterFormInputs}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={String(field.value ?? "")}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? 0
                                  : parseInt(e.target.value, 10)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                {(
                  [
                    ["yearlyVenue", "Yearly Venue Fee"],
                    ["earlybirdVenue", "Early Bird Venue Fee"],
                  ] as const
                ).map(([name, label]) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={String(field.value ?? "")}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? 0
                                  : parseInt(e.target.value, 10)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            {/* --- Head Office Contributions --- */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Head Office Contributions
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(
                  [
                    ["quarterlyHo", "Quarterly HO Share"],
                    ["halfyearlyHo", "Half-Yearly HO Share"],
                    ["yearlyHo", "Yearly HO Share"],
                    ["earlybirdHo", "Early Bird HO Share"],
                  ] as const
                ).map(([name, label]) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={String(field.value ?? "")}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? 0
                                  : parseInt(e.target.value, 10)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            {/* --- Account Balances --- */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Account Balances</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {(
                  [
                    ["bankopeningbalance", "Bank Opening Balance"],
                    ["bankclosingbalance", "Bank Closing Balance"],
                    ["cashopeningbalance", "Cash Opening Balance"],
                    ["cashclosingbalance", "Cash Closing Balance"],
                  ] as const
                ).map(([name, label]) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={String(field.value ?? "")}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? 0
                                  : parseInt(e.target.value, 10)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
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
        </form>
      </Form>
    </Card>
  );
}
