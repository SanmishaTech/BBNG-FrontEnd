import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronsUpDown, Check, Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { get, post, put } from "@/services/apiService";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { DatetimePicker } from "@/components/ui/datetime-picker";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRoleAccess } from "@/hooks/useRoleAccess";

// Helper functions for GST validation
const MAHARASHTRA_KEYWORDS = ['maharashtra', 'mumbai', 'pune', 'nagpur', 'thane', 'nashik', 'aurangabad', 'solapur', 'navi mumbai'];

/**
 * Determines if a member is from Maharashtra based on GST number, state, or location data
 */
const isMemberFromMaharashtra = (memberData: any): boolean => {
  if (!memberData) return false;
  
  // First priority: Check GST number - if it starts with 27, it's Maharashtra
  if (memberData.gstNo) {
    const gstNumber = memberData.gstNo.trim();
    if (gstNumber.length >= 2) {
      const stateCode = gstNumber.substring(0, 2);
      if (stateCode === "27") {
        return true;
      } else {
        // If GST number exists and doesn't start with 27, they're not from Maharashtra
        return false;
      }
    }
  }
  
  // Second priority: Check stateName field if GST is not provided
  if (memberData.stateName) {
    const state = memberData.stateName.toLowerCase();
    return state.includes('maharashtra') || MAHARASHTRA_KEYWORDS.some(keyword => state.includes(keyword));
  }
  
  // Fall back to location-based checks if neither GST nor state is available
  const locationStrings = [
    memberData.location,
    memberData.orgLocation
  ].filter(Boolean).map(loc => loc.toLowerCase());
  
  return locationStrings.some(location => 
    MAHARASHTRA_KEYWORDS.some(keyword => location.includes(keyword))
  );
};

// Form Schema Definition
const membershipSchema = z.object({
  memberId: z.number({
    required_error: "Member is required",
  }),
  invoiceDate: z.date({
    required_error: "Invoice date is required",
  }),
  packageId: z.number({
    required_error: "Package is required",
  }),
  basicFees: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().positive("Basic fees must be positive")
  ),
  cgstRate: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().min(0, "CGST rate cannot be negative").nullable().optional()
  ),
  sgstRate: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().min(0, "SGST rate cannot be negative").nullable().optional()
  ),
  igstRate: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().min(0, "IGST rate cannot be negative").nullable().optional()
  ),
  paymentDate: z.date({
    required_error: "Payment date is required",
  }),
  paymentMode: z.string({
    required_error: "Payment mode is required",
  }).min(1, "Payment mode is required"),
  
  // Cheque details
  chequeNumber: z.string()
    .optional()
    .nullable(),
  chequeDate: z.preprocess(
    (val) => (val ? new Date(val as any) : null),
    z.date().optional().nullable()
  ),
  bankName: z.string()
    .optional()
    .nullable(),
  
  // Bank transfer details
  neftNumber: z.string()
    .optional()
    .nullable(),
  
  // UPI details
  utrNumber: z.string()
    .optional()
    .nullable(),
    
  // Active status
  active: z.boolean().default(true),
});

// Apply conditional validation for each payment method
const conditionalMembershipSchema = membershipSchema
  // Cheque payment validations
  .refine((data) => {
    // If payment mode is not cheque, validation passes
    if (data.paymentMode !== 'cheque') return true;
    // For cheque payments, these fields are required
    return !!data.chequeNumber && !!data.chequeDate && !!data.bankName;
  }, {
    message: "Cheque number, date, and bank name are required for cheque payments",
    path: ["chequeNumber"]
  })
  // Cheque number format validation
  .refine((data) => {
    // Only validate cheque number format if payment mode is cheque and value exists
    if (data.paymentMode !== 'cheque' || !data.chequeNumber) return true;
    return /^\d{6,12}$/.test(data.chequeNumber);
  }, {
    message: "Cheque number must be 6-12 digits",
    path: ["chequeNumber"]
  })
  // Bank name validations
  .refine((data) => {
    // Only validate bank name if payment mode is cheque and value exists
    if (data.paymentMode !== 'cheque' || !data.bankName) return true;
    return data.bankName.length >= 3;
  }, {
    message: "Bank name must be at least 3 characters",
    path: ["bankName"]
  })
  .refine((data) => {
    // Only validate bank name format if payment mode is cheque and value exists
    if (data.paymentMode !== 'cheque' || !data.bankName) return true;
    return /^[A-Za-z\s\-&.]+$/.test(data.bankName);
  }, {
    message: "Bank name should only contain letters, spaces, hyphens, ampersands and periods",
    path: ["bankName"]
  })
  .refine((data) => {
    // Check for consecutive spaces in bank name
    if (data.paymentMode !== 'cheque' || !data.bankName) return true;
    return !(/\s{2,}/.test(data.bankName));
  }, {
    message: "Bank name should not contain consecutive spaces",
    path: ["bankName"]
  })
  
  // Net banking validations
  .refine((data) => {
    // If payment mode is not netbanking, validation passes
    if (data.paymentMode !== 'netbanking') return true;
    // For netbanking payments, NEFT number is required
    return !!data.neftNumber;
  }, {
    message: "NEFT/IMPS number is required for netbanking payments",
    path: ["neftNumber"]
  })
  .refine((data) => {
    // Only validate NEFT number format if payment mode is netbanking and value exists
    if (data.paymentMode !== 'netbanking' || !data.neftNumber) return true;
    return /^[A-Za-z0-9]{11,18}$/.test(data.neftNumber);
  }, {
    message: "NEFT/IMPS number must be 11-18 alphanumeric characters",
    path: ["neftNumber"]
  })
  .refine((data) => {
    // Validate that NEFT number contains both letters and numbers
    if (data.paymentMode !== 'netbanking' || !data.neftNumber) return true;
    return /^(?=.*[A-Za-z])(?=.*\d)/.test(data.neftNumber);
  }, {
    message: "NEFT/IMPS number should contain both letters and numbers",
    path: ["neftNumber"]
  })
  
  // UPI validations
  .refine((data) => {
    // If payment mode is not UPI, validation passes
    if (data.paymentMode !== 'upi') return true;
    // For UPI payments, UTR number is required
    return !!data.utrNumber;
  }, {
    message: "UTR number is required for UPI payments",
    path: ["utrNumber"]
  })
  .refine((data) => {
    // Only validate UTR number format if payment mode is UPI and value exists
    if (data.paymentMode !== 'upi' || !data.utrNumber) return true;
    return /^[A-Za-z0-9]{16,22}$/.test(data.utrNumber);
  }, {
    message: "UTR number must be 16-22 characters long",
    path: ["utrNumber"]
  })
  .refine((data) => {
    // Validate that UTR number contains both letters and numbers
    if (data.paymentMode !== 'upi' || !data.utrNumber) return true;
    return /^(?=.*[A-Za-z])(?=.*\d)/.test(data.utrNumber);
  }, {
    message: "UTR number should contain both letters and numbers",
    path: ["utrNumber"]
  });

type MembershipFormInputs = z.infer<typeof conditionalMembershipSchema>;

// Types
interface MemberData {
  id: string;
  memberName: string;
  organizationName: string;
  location: string;
  gstNo: string;
  [key: string]: any;
}

export default function Membershipform({ mode }: { mode: "create" | "edit" }) {
  const { isAdmin } = useRoleAccess();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      toast.error("You don't have permission to access this page");
      navigate("/memberships");
    }
  }, [isAdmin, navigate]);

  const [packagePopoverOpen, setPackagePopoverOpen] = useState(false);
  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false);
  
  const { id } = useParams<{ id: string }>();
  
  // Initialize form
  const form = useForm<MembershipFormInputs>({
    resolver: zodResolver(conditionalMembershipSchema),
    defaultValues: {
      memberId: undefined,
      invoiceDate: undefined,  
      packageId: undefined,
      basicFees: 0,
      cgstRate: null,
      sgstRate: null,
      igstRate: null,
      paymentDate: new Date(),
      paymentMode: "cash",
      chequeNumber: "",
      chequeDate: null,
      bankName: "",
      neftNumber: "",
      utrNumber: "",
      active: true,
    },
  });

  // Computed state values
  const selectedMemberId = form.watch("memberId");
  const selectedPackageId = form.watch("packageId");
  const basicFees = form.watch("basicFees");
  const cgstRate = form.watch("cgstRate");
  const sgstRate = form.watch("sgstRate");
  const igstRate = form.watch("igstRate");
  const paymentMode = form.watch("paymentMode");
  
  // Fetch members data
  const { data: members = [], isLoading: isMembersLoading } = useQuery({
    queryKey: ["members", "dropdown"],
    queryFn: async () => {
      const response = await get("/api/members?limit=100&active=true");
      return response.members || [];
    },
  });

  // Fetch packages for dropdown
  const { data: packages = [], isLoading: isPackagesLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const response = await get("/packages?limit=100&active=true");
      return response.packages || [];
    },
  });

  // Fetch selected member details
  const {
    data: memberData,
    isLoading: isMemberLoading,
  } = useQuery({
    queryKey: ["member", selectedMemberId],
    queryFn: async () => {
      const response = await get(`/api/members/${selectedMemberId}`);
      return response as MemberData;
    },
    enabled: !!selectedMemberId,
  });

  // Watch for member data changes to update GST rates
  useEffect(() => {
    if (memberData) {
      const isFromMaha = isMemberFromMaharashtra(memberData);
      if (isFromMaha) {
        form.setValue("cgstRate", 9);
        form.setValue("sgstRate", 9);
        form.setValue("igstRate", null);
      } else {
        form.setValue("cgstRate", null);
        form.setValue("sgstRate", null);
        form.setValue("igstRate", 18);
      }
    }
  }, [memberData, form]);

  // Calculate totals
  const watchPackage = form.watch("packageId");
  const watchBasicFees = form.watch("basicFees");
  const watchCgstRate = form.watch("cgstRate");
  const watchSgstRate = form.watch("sgstRate");
  const watchIgstRate = form.watch("igstRate");

  // Calculate tax amounts
  const cgstAmount = watchCgstRate && watchBasicFees ? (Number(watchBasicFees) * Number(watchCgstRate)) / 100 : 0;
  const sgstAmount = watchSgstRate && watchBasicFees ? (Number(watchBasicFees) * Number(watchSgstRate)) / 100 : 0;
  const igstAmount = watchIgstRate && watchBasicFees ? (Number(watchBasicFees) * Number(watchIgstRate)) / 100 : 0;
  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const totalAmount = (Number(watchBasicFees) || 0) + totalTax;

  const [calculatedValues, setCalculatedValues] = useState({
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    totalTax: 0,
    totalAmount: 0
  });

  // Update calculated values when rates or fee changes
  useEffect(() => {
    setCalculatedValues({
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTax,
      totalAmount,
    });
  }, [cgstAmount, sgstAmount, igstAmount, totalTax, totalAmount]);

  // Edit mode - fetch existing membership data
  const { isLoading: loadingMembership } = useQuery({
    queryKey: ["membership", id],
    queryFn: async () => {
      const membershipData = await get(`/memberships/${id}`);
      form.reset({
        ...membershipData,
        // Ensure proper type conversion
        memberId: Number(membershipData.memberId),
        packageId: Number(membershipData.packageId),
        basicFees: Number(membershipData.basicFees),
        cgstRate: membershipData.cgstRate ? Number(membershipData.cgstRate) : null,
        sgstRate: membershipData.sgstRate ? Number(membershipData.sgstRate) : null,
        igstRate: membershipData.igstRate ? Number(membershipData.igstRate) : null,
        invoiceDate: new Date(membershipData.invoiceDate),
        paymentDate: membershipData.paymentDate ? new Date(membershipData.paymentDate) : null,
        chequeDate: membershipData.chequeDate ? new Date(membershipData.chequeDate) : null,
        active: Boolean(membershipData.active),
      });
      return membershipData;
    },
    enabled: mode === "edit" && !!id,
  });

  // Mutations for create/update
  const createMutation = useMutation({
    mutationFn: (data: MembershipFormInputs) => post("/memberships", data),
    onSuccess: () => {
      toast.success("Membership created successfully");
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      navigate("/memberships");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create membership");
      console.error("Error creating membership:", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: MembershipFormInputs) => put(`/memberships/${id}`, data),
    onSuccess: () => {
      toast.success("Membership updated successfully");
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      navigate("/memberships");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update membership");
      console.error("Error updating membership:", error);
    },
  });

  // Add state for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update onSubmit function to include calculated tax values
  const onSubmit: SubmitHandler<MembershipFormInputs> = (values) => {
    // Add calculated tax values before saving
    const formData = {
      ...values,
      // Add calculated tax amounts
      cgstAmount: cgstAmount,
      sgstAmount: sgstAmount,
      igstAmount: igstAmount,
      totalTax: totalTax,
      totalAmount: totalAmount,
    };

    setIsSubmitting(true);
    
    if (mode === "edit" && id) {
      updateMutation.mutate(formData, {
        onSettled: () => setIsSubmitting(false)
      });
    } else {
      createMutation.mutate(formData, {
        onSettled: () => setIsSubmitting(false)
      });
    }
  };

  // Helper formatting functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Loading state
  const isLoading = isMembersLoading || isPackagesLoading || loadingMembership || isMemberLoading;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">
          {mode === "create" ? "Add Membership" : "Edit Membership"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Member Selection Card */}
          <Card>
            <CardHeader>
              <CardTitle>Select Member</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="memberId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Member</FormLabel>
                    <Popover
                      open={memberPopoverOpen}
                      onOpenChange={setMemberPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={mode === "edit"}
                          >
                            {field.value
                              ? members.find(
                                  (member: any) => member.id === field.value
                                )?.memberName || "Select member..."
                              : "Select member..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Search members..." />
                          <CommandEmpty>No member found.</CommandEmpty>
                          <CommandGroup>
                            {members.map((member: any) => (
                              <CommandItem
                                key={member.id}
                                value={member.memberName}
                                onSelect={() => {
                                  form.setValue("memberId", member.id);
                                  setMemberPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === member.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {member.memberName} - {member.organizationName || "No Business"}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Rest of the form will be implemented later */}
          {selectedMemberId && (
            <>
              {/* Member Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Member Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-2 border rounded bg-muted text-sm">
                    {isMemberLoading ? (
                      "Loading member details..."
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div>
                          <strong>Name:</strong> {memberData?.memberName || "N/A"}
                        </div>
                        <div>
                          <strong>Business:</strong> {memberData?.organizationName || "N/A"}
                        </div>
                        <div>
                          <strong>Location:</strong>{" "}
                          {memberData?.location || "N/A"}
                        </div>
                        <div>
                          <strong>GST Number:</strong>{" "}
                          {memberData?.gstNo || "Not provided"}
                          {memberData?.gstNo && (
                            <span className="ml-2 text-xs text-gray-600">
                              (State Code: {memberData.gstNo.substring(0, 2)})
                            </span>
                          )}
                        </div>
                        <div>
                          <strong>GST Type:</strong>{" "}
                          {cgstRate && sgstRate
                            ? "Maharashtra GST (CGST + SGST)"
                            : igstRate
                            ? "Outside Maharashtra (IGST)"
                            : "Not determined"}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Invoice & Package Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Invoice & Package Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Invoice Date */}
                    <FormField
                      control={form.control}
                      name="invoiceDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Invoice Date</FormLabel>
                          <DatetimePicker
                            value={field.value}
                            className="w-full"
                            onChange={field.onChange}
                            format={[
                              ["days", "months", "years"],
                             
                             ]}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Package Selection */}
                    <FormField
                      control={form.control}
                      name="packageId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Package</FormLabel>
                          <Popover
                            open={packagePopoverOpen}
                            onOpenChange={setPackagePopoverOpen}
                          >
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value
                                    ? packages.find(
                                        (pkg: any) => pkg.id === field.value
                                      )?.packageName || "Select package..."
                                    : "Select package..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                              <Command>
                                <CommandInput placeholder="Search packages..." />
                                <CommandEmpty>No package found.</CommandEmpty>
                                <CommandGroup>
                                  {packages.map((pkg: any, index: number) => (
                                    <CommandItem
                                      key={index}
                                      value={pkg.packageName}
                                      onSelect={() => {
                                        form.setValue("packageId", pkg.id);
                                        form.setValue("basicFees", pkg.basicFees);
                                        setPackagePopoverOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === pkg.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {pkg.packageName} ({pkg.periodMonths} month
                                      {pkg.periodMonths > 1 ? "s" : ""})
                                      {pkg.isVenueFee ? " - Venue Fee" : ""}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                              disabled
                              min={0}
                              step="0.01"
                              placeholder="Basic fees"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.valueAsNumber || 0);
                              }}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Preview Section */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-md border">
                    <h3 className="text-md font-medium mb-2">Preview</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Basic Fees:</span>
                        <span className="font-medium">{formatCurrency(Number(watchBasicFees) || 0)}</span>
                      </div>
                      {watchCgstRate && watchCgstRate > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">CGST ({watchCgstRate}%):</span>
                          <span className="font-medium">{formatCurrency(cgstAmount)}</span>
                        </div>
                      )}
                      {watchSgstRate && watchSgstRate > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">SGST ({watchSgstRate}%):</span>
                          <span className="font-medium">{formatCurrency(sgstAmount)}</span>
                        </div>
                      )}
                      {watchIgstRate && watchIgstRate > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">IGST ({watchIgstRate}%):</span>
                          <span className="font-medium">{formatCurrency(igstAmount)}</span>
                        </div>
                      )}
                      <div className="h-px bg-gray-200 my-2"></div>
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span className="text-primary">{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Details Card */}
               <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Payment Mode */}
                    <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="paymentMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Mode</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select payment mode" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="netbanking">Net Banking</SelectItem>
                              <SelectItem value="upi">UPI</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Payment Date */}
                    <FormField
                      control={form.control}
                      name="paymentDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Payment Date</FormLabel>
                          <DatetimePicker
                            value={field.value}
                            className="w-full"  
                            onChange={field.onChange}
                            format={[
                              ["days", "months", "years"],
                             
                             ]}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    </div>
 
                    {/* Conditional Payment Method Fields */}
                    {paymentMode === "cheque" && (
                      <div className="p-4 border rounded-md space-y-3">
                        <h3 className="text-lg font-medium">Cheque Details</h3>
                        <p className="text-sm text-muted-foreground mb-2">All fields are required for cheque payments</p>
                      <div className="grid grid-cols-3 gap-4 ">
                        
                        {/* Cheque Number */}
                        <FormField
                          control={form.control}
                          name="chequeNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cheque Number</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter 6-12 digit number" 
                                  {...field} 
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <p className="text-xs text-muted-foreground">Must be 6-12 digits</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Cheque Date */}
                        <FormField
                          control={form.control}
                          name="chequeDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cheque Date</FormLabel>
                              <DatetimePicker
                                value={field.value || new Date()}
                                className="w-full"
                                onChange={field.onChange}
                                format={[
                                  ["days", "months", "years"],
                                 
                                ]}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Bank Name */}
                        <FormField
                          control={form.control}
                          name="bankName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bank Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter bank name" 
                                  {...field} 
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <p className="text-xs text-muted-foreground">Must be at least 3 characters</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      </div>
                    )}
                    
                    {paymentMode === "netbanking" && (
                      <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="text-lg font-medium">Bank Transfer Details</h3>
                        <p className="text-sm text-muted-foreground mb-2">NEFT/IMPS number is required for bank transfer payments</p>
                        
                        {/* NEFT Number */}
                        <FormField
                          control={form.control}
                          name="neftNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>NEFT/IMPS Number</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter NEFT/IMPS reference number" 
                                  {...field} 
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <p className="text-xs text-muted-foreground">Must be 11-18 alphanumeric characters</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                    
                    {paymentMode === "upi" && (
                      <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="text-lg font-medium">UPI Details</h3>
                        <p className="text-sm text-muted-foreground mb-2">UTR number is required for UPI payments</p>
                        
                        {/* UTR Number */}
                        <FormField
                          control={form.control}
                          name="utrNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>UTR Number</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter UPI transaction reference" 
                                  {...field} 
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <p className="text-xs text-muted-foreground">Must be 12-22 alphanumeric characters</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                    
                    {/* Active Status */}
                   
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Submit Buttons */}
          <CardFooter className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                ? "Create Membership"
                : "Update Membership"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </div>
  );
}