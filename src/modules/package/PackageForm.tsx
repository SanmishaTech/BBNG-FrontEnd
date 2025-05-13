import { useEffect, useState } from "react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// ----------------------
// 1) Schema Definition
// ----------------------
const packageSchema = z.object({
  packageName: z.string().min(1, "Package name is required"),
  periodMonths: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().int().min(1, "Period must be at least 1 month")
  ),
  isVenueFee: z.boolean().default(false),
  chapterId: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().nullable()
  ),
  basicFees: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().positive("Basic fees must be positive")
  ),
  gstRate: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, "GST rate cannot be negative")
  ),
  active: z.boolean().default(true),
});

type PackageFormInputs = z.infer<typeof packageSchema>;

// ----------------------
// 3) Main Component
// ----------------------
export default function PackageForm({ mode }: { mode: "create" | "edit" }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch chapters for venue fee packages
  const { data: chapters = [], isLoading: loadingChapters } = useQuery({
    queryKey: ["chapters"],
    queryFn: async () => {
      const response = await get("/chapters?limit=100");
      return response.chapters || [];
    },
  });

  // Initialize react-hook-form
  const form = useForm<PackageFormInputs>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      packageName: "",
      periodMonths: 1,
      isVenueFee: false,
      chapterId: null,
      basicFees: 0,
      gstRate: 18, // Default GST rate in India
      active: true,
    },
  });

  const { reset, watch, setValue, getValues } = form;
  const isVenueFee = watch("isVenueFee");
  const basicFees = watch("basicFees");
  const gstRate = watch("gstRate");

  // Calculate GST amount and total fees
  const [calculatedValues, setCalculatedValues] = useState({
    gstAmount: 0,
    totalFees: 0,
  });

  // Update calculations when form values change
  useEffect(() => {
    if (basicFees && gstRate) {
      const basicFeesNum = Number(basicFees);
      const gstRateNum = Number(gstRate);
      const gstAmount = (basicFeesNum * gstRateNum) / 100;
      const totalFees = basicFeesNum + gstAmount;

      setCalculatedValues({
        gstAmount,
        totalFees,
      });
    } else {
      setCalculatedValues({
        gstAmount: 0,
        totalFees: 0,
      });
    }
  }, [basicFees, gstRate]);

  // ----------------------
  // 4) Edit Mode Prefill
  // ----------------------
  const { isLoading: loadingPackage } = useQuery({
    queryKey: ["package", id],
    queryFn: async () => {
      const packageData = await get(`/packages/${id}`);
      reset({
        ...packageData,
        // Ensure proper type conversion
        periodMonths: Number(packageData.periodMonths),
        basicFees: Number(packageData.basicFees),
        gstRate: Number(packageData.gstRate),
        isVenueFee: Boolean(packageData.isVenueFee),
        active: Boolean(packageData.active),
      });
      return packageData;
    },
    enabled: mode === "edit" && !!id,
  });

  // ----------------------
  // 5) Form Submission
  // ----------------------
  const createMutation = useMutation({
    mutationFn: (data: PackageFormInputs) => post("/packages", data),
    onSuccess: () => {
      toast.success("Package created successfully");
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      navigate("/packages");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create package");
      console.error("Error creating package:", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: PackageFormInputs) => put(`/packages/${id}`, data),
    onSuccess: () => {
      toast.success("Package updated successfully");
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      navigate("/packages");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update package");
      console.error("Error updating package:", error);
    },
  });

  const onSubmit: SubmitHandler<PackageFormInputs> = (data) => {
    // If isVenueFee is false, ensure chapterId is null
    if (!data.isVenueFee) {
      data.chapterId = null;
    }

    if (mode === "create") {
      createMutation.mutate(data);
    } else if (mode === "edit" && id) {
      updateMutation.mutate(data);
    }
  };

  // ----------------------
  // 6) Render Form
  // ----------------------
  const isLoading = loadingPackage || loadingChapters;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Create New Package" : "Edit Package"}
          </CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Add a new membership package to the system"
              : "Update the existing membership package details"}
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Package Name */}
              <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="packageName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter package name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Period in Months */}
              <FormField
                control={form.control}
                name="periodMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period (Months)</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value?.toString() || "1"}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="12">12</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>

              {/* Is Venue Fee */}
              <FormField
                control={form.control}
                name="isVenueFee"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Is Venue Fee</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Enable if this package is for venue fees
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {/* Chapter Selection (only if isVenueFee is true) */}
              {isVenueFee && (
                <FormField
                  control={form.control}
                  name="chapterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chapter</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value ? parseInt(value) : null)
                        }
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a chapter" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {chapters.map((chapter: any) => (
                            <SelectItem
                              key={chapter.id}
                              value={chapter.id.toString()}
                            >
                              {chapter.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Basic Fees */}
              <FormField
                control={form.control}
                name="basicFees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Basic Fees</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="Enter basic fees"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* GST Rate */}
              <FormField
                control={form.control}
                name="gstRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="Enter GST rate"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Preview */}
              <div className="mt-4 p-4 bg-gray-50 rounded-md border">
                <h3 className="text-md font-medium mb-2">Preview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Basic Fees:</span>
                    <span className="font-medium">
                      ₹
                      {Number(basicFees || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">
                      GST ({gstRate || 0}%):
                    </span>
                    <span className="font-medium">
                      ₹
                      {calculatedValues.gstAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="h-px bg-gray-200 my-2"></div>
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span className="text-primary">
                      ₹
                      {calculatedValues.totalFees.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Status */}
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Enable to make this package available
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/packages")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : mode === "create"
                  ? "Create Package"
                  : "Update Package"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
