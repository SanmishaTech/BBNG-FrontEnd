import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  FormMessage
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronsUpDown, Check, Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { get, post } from "@/services/apiService";
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
import { format } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useParams } from "react-router-dom";

interface AddMembershipProps {
  onSuccess?: () => void;
}

// Helper functions for location-based determinations
const MAHARASHTRA_KEYWORDS = ['maharashtra', 'mumbai', 'pune', 'nagpur', 'thane', 'nashik', 'aurangabad', 'solapur', 'navi mumbai'];

/**
 * Determines if a member is from Maharashtra based on GST number or location data
 */
const isMemberFromMaharashtra = (memberData: any): boolean => {
  if (!memberData) return false;
  
  console.log("Member data for GST check:", {
    hasGstNo: !!memberData.gstNo,
    gstNo: memberData.gstNo,
    memberName: memberData.memberName
  });
  
  // First priority: Check GST number - if it starts with 27, it's Maharashtra
  if (memberData.gstNo) {
    const gstNumber = memberData.gstNo.trim();
    console.log("GST number after trim:", gstNumber, "length:", gstNumber.length);
    if (gstNumber.length >= 2) {
      const stateCode = gstNumber.substring(0, 2);
      console.log("Extracted state code:", stateCode, "Is Maharashtra:", stateCode === "27");
      if (stateCode === "27") {
        return true;
      } else {
        // If GST number exists and doesn't start with 27, they're not from Maharashtra
        return false;
      }
    }
  }
  
  // Fall back to location-based checks if GST number is not available or invalid
  
  // Check the chapter's location
  if (memberData.chapter?.location?.location) {
    const chapterLocationName = memberData.chapter.location.location.toLowerCase();
    if (MAHARASHTRA_KEYWORDS.some(keyword => chapterLocationName.includes(keyword))) {
      return true;
    }
  }
  
  // Then check string fields
  const locationStrings = [
    memberData.location,
    memberData.orgLocation
  ].filter(Boolean).map(loc => loc.toLowerCase());
  
  return locationStrings.some(location => 
    MAHARASHTRA_KEYWORDS.some(keyword => location.includes(keyword))
  );
};

const formSchema = z.object({
  memberId: z.number({
    required_error: "Member is required",
  }),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
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
  paymentDate: z.date().nullable().optional(),
  paymentMode: z.string().nullable().optional(),
  
  // Cheque details
  chequeNumber: z.string().optional().nullable(),
  chequeDate: z.preprocess(
    (val) => (val ? new Date(val as any) : null),
    z.date().optional().nullable()
  ),
  bankName: z.string().optional().nullable(),
  
  // Bank transfer details
  neftNumber: z.string().optional().nullable(),
  
  // UPI details
  utrNumber: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

const AddMembership: React.FC<AddMembershipProps> = ({ onSuccess }) => {
  const [invoiceDateOpen, setInvoiceDateOpen] = useState(false);
  const [paymentDateOpen, setPaymentDateOpen] = useState(false);
  const [packagePopoverOpen, setPackagePopoverOpen] = useState(false);
  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false);
  
  const { memberId: urlMemberId } = useParams<{ memberId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memberId: urlMemberId ? parseInt(urlMemberId) : undefined,
      invoiceNumber: "",
      invoiceDate: new Date(),
      packageId: undefined,
      basicFees: 0,
      cgstRate: null,
      sgstRate: null,
      igstRate: null,
      paymentDate: null,
      paymentMode: null,
      // Payment method specific fields
      chequeNumber: null,
      chequeDate: null,
      bankName: null,
      neftNumber: null,
      utrNumber: null,
    },
  });

  // Fetch all members for the dropdown
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

  // Watch the selected member ID
  const selectedMemberId = form.watch("memberId");

  // Fetch selected member details
  const {
    data: memberData,
    isLoading: isMemberLoading,
    isError: isMemberError,
  } = useQuery({
    queryKey: ["member", selectedMemberId],
    queryFn: async () => {
      try {
        const response = await get(`/api/members/${selectedMemberId}`);
        console.log("Loaded member data:", response);
        
        // Force a recalculation of GST rates based on the loaded data
        setTimeout(() => {
          if (response) {
            const isFromMaha = isMemberFromMaharashtra(response);
            console.log("Member Maharashtra check (on load):", isFromMaha, "GST number:", response.gstNo);
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
        }, 100);
        
        return response;
      } catch (error) {
        console.error("Error loading member data:", error);
        throw error;
      }
    },
    enabled: !!selectedMemberId,
  });

  // Set GST rates based on member location (Maharashtra or outside)
  useEffect(() => {
    if (memberData && !isMemberLoading && !isMemberError) {
      // Force evaluation of the GST number check
      const stateCode = memberData.gstNo?.substring(0, 2);
      const isGSTFromMaha = stateCode === "27";
      
      const isFromMaharashtra = isMemberFromMaharashtra(memberData);
      console.log("GST determination result:", { 
        isFromMaharashtra,
        memberName: memberData.memberName,
        gstNo: memberData.gstNo,
        stateCode,
        isGSTFromMaha,
        fullCheck: isFromMaharashtra
      });
      
      if (isFromMaharashtra) {
        // For Maharashtra members: CGST 9%, SGST 9%, IGST 0%
        form.setValue("cgstRate", 9);
        form.setValue("sgstRate", 9);
        form.setValue("igstRate", null);
        console.log("Applied Maharashtra GST rates (CGST 9%, SGST 9%)");
      } else {
        // For outside Maharashtra: CGST 0%, SGST 0%, IGST 18%
        form.setValue("cgstRate", null);
        form.setValue("sgstRate", null);
        form.setValue("igstRate", 18);
        console.log("Applied Interstate GST rates (IGST 18%)");
      }
    }
  }, [memberData, isMemberLoading, isMemberError, form]);

  // Update form when a package is selected
  const watchPackageId = form.watch("packageId");
  
  useEffect(() => {
    if (watchPackageId) {
      const selectedPackage = packages.find((pkg: any) => pkg.id === watchPackageId);
      if (selectedPackage) {
        form.setValue("basicFees", selectedPackage.basicFees);
      }
    }
  }, [watchPackageId, packages, form]);

  // Watch key fields for changes to recalculate totals
  const watchBasicFees = form.watch("basicFees");
  const watchCgstRate = form.watch("cgstRate");
  const watchSgstRate = form.watch("sgstRate");
  const watchIgstRate = form.watch("igstRate");

  // Force recalculation of totals when any key values change
  useEffect(() => {
    // This triggers a re-render with up-to-date values
    const totals = calculateTotals();
    console.log("Auto-recalculated totals:", totals);
  }, [watchBasicFees, watchCgstRate, watchSgstRate, watchIgstRate]);

  const addMembershipMutation = useMutation({
    mutationFn: (data: FormValues) => post("/memberships", data),
    onSuccess: () => {
      const memberId = form.getValues("memberId");
      queryClient.invalidateQueries({ queryKey: ["memberships", memberId] });
      queryClient.invalidateQueries({ queryKey: ["member", memberId] });
      toast.success("Membership added successfully");
      form.reset();
      if (onSuccess) onSuccess();
      // Navigate back to the members list or member details
      navigate(`/members/${memberId}`);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to add membership"
      );
      console.error("Failed to add membership:", error);
    },
  });

  const handleSubmit = (values: FormValues) => {
    addMembershipMutation.mutate(values);
  };

  // Calculate totals for preview
  const calculateTotals = () => {
    const basicFees = form.getValues("basicFees") || 0;
    const cgstRate = form.getValues("cgstRate") || 0;
    const sgstRate = form.getValues("sgstRate") || 0;
    const igstRate = form.getValues("igstRate") || 0;
    
    const cgstAmount = (basicFees * cgstRate) / 100;
    const sgstAmount = (basicFees * sgstRate) / 100;
    const igstAmount = (basicFees * igstRate) / 100;
    
    const totalGst = cgstAmount + sgstAmount + igstAmount;
    const totalFees = basicFees + totalGst;
    
    console.log("Calculated totals:", {
      basicFees,
      cgstRate,
      sgstRate,
      igstRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalGst,
      totalFees
    });
    
    return {
      basicFees,
      cgstAmount,
      sgstAmount, 
      igstAmount,
      totalGst,
      totalFees
    };
  };

  const totals = calculateTotals();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Helper function to display GST schema
  const getGstSchemaText = () => {
    const cgstRate = form.getValues("cgstRate");
    const sgstRate = form.getValues("sgstRate");
    const igstRate = form.getValues("igstRate");
    
    if (cgstRate && sgstRate) {
      return "Maharashtra GST (CGST + SGST)";
    } else if (igstRate) {
      return "Outside Maharashtra (IGST)";
    }
    return "GST";
  };

  // Get a simple display location for the member's location
  const getDisplayLocation = (memberData: any): string => {
    if (!memberData) return "N/A";
    
    // Check chapter's location first
    if (memberData.chapter?.location?.location) {
      return memberData.chapter.location.location;
    }
    
    // Then fall back to string fields
    if (memberData.orgLocation) {
      return memberData.orgLocation;
    }
    
    if (memberData.location) {
      return memberData.location;
    }
    
    return "N/A";
  };

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
        <h1 className="text-2xl font-bold">Add Membership</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                      <PopoverContent className="w-[400px] p-0 max-h-[300px] overflow-auto">
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

          {/* Only show member info and membership form if a member is selected */}
          {selectedMemberId && (
            <>
              {/* Member info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Member Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-2 border rounded bg-muted text-sm">
                    {isMemberLoading ? (
                      "Loading member details..."
                    ) : isMemberError ? (
                      "Failed to load member details"
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
                          {getDisplayLocation(memberData)}
                          {memberData?.chapter?.zones?.name && (
                            <span className="ml-2 text-xs text-gray-600">
                              (Zone: {memberData.chapter.zones.name})
                            </span>
                          )}
                        </div>
                        <div>
                          <strong>GST Number:</strong>{" "}
                          {memberData?.gstNo || "Not provided"}
                          {memberData?.gstNo && (
                            <span className="ml-2 text-xs text-gray-600">
                              (State Code: {memberData.gstNo.substring(0, 2)})
                            </span>
                          )}
                          <button 
                            type="button"
                            className="ml-2 text-xs text-blue-600 underline"
                            onClick={() => {
                              // This is just for testing - would normally be done through proper API call
                              const testData = {...memberData, gstNo: "27ABCDE1234F1Z8"};
                              console.log("Testing with modified member data:", testData);
                              const result = isMemberFromMaharashtra(testData);
                              console.log("Test result:", result);
                              alert(`Test result: Would a member with GST "27ABCDE1234F1Z8" be from Maharashtra? ${result ? "Yes" : "No"}`);
                            }}
                          >
                            Test with 27ABCDE1234F1Z8
                          </button>
                        </div>
                        <div>
                          <strong>GST Type:</strong>{" "}
                          {isMemberFromMaharashtra(memberData) ? (
                            <span className="ml-2 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                              Maharashtra GST (CGST + SGST)
                            </span>
                          ) : (
                            <span className="ml-2 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              Interstate GST (IGST)
                            </span>
                          )}
                          <div className="mt-1 text-xs text-gray-500">
                            Debug Info: 
                            GST Number: "{memberData?.gstNo || "none"}", 
                            First 2 digits: "{memberData?.gstNo?.substring(0, 2) || "none"}",
                            BasicFees: {form.getValues("basicFees") || 0},
                            CGST: {form.getValues("cgstRate") || 0}%,
                            SGST: {form.getValues("sgstRate") || 0}%,
                            IGST: {form.getValues("igstRate") || 0}%
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            Test: Would "27ABCDE1234F1Z8" be Maharashtra? {
                              (() => {
                                const testGst = "27ABCDE1234F1Z8";
                                return testGst.substring(0, 2) === "27" ? "Yes" : "No" 
                              })()
                            }
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <strong>HO Expiry:</strong>{" "}
                            {memberData?.hoExpiryDate
                              ? format(new Date(memberData.hoExpiryDate), "PPP")
                              : "None"}
                          </div>
                          <div>
                            <strong>Venue Expiry:</strong>{" "}
                            {memberData?.venueExpiryDate
                              ? format(new Date(memberData.venueExpiryDate), "PPP")
                              : "None"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Membership Form Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Membership Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Invoice details section */}
                    <div className="space-y-4">
                      {/* Invoice Number */}
                      <FormField
                        control={form.control}
                        name="invoiceNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Invoice Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter invoice number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Invoice Date */}
                      <FormField
                        control={form.control}
                        name="invoiceDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Invoice Date</FormLabel>
                            <Popover open={invoiceDateOpen} onOpenChange={setInvoiceDateOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Select date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => {
                                    field.onChange(date);
                                    setInvoiceDateOpen(false);
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
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
                                    {packages.map((pkg: any) => (
                                      <CommandItem
                                        key={pkg.id}
                                        value={pkg.packageName}
                                        onSelect={() => {
                                          form.setValue("packageId", pkg.id);
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
                    </div>

                    {/* GST and Payment details section */}
                    <div className="space-y-4">
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
                                placeholder="Enter basic fees"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e.target.valueAsNumber || 0);
                                  form.trigger(["basicFees", "cgstRate", "sgstRate", "igstRate"]);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* GST Section - Display but make readonly */}
                      <div>
                        <Label>{getGstSchemaText()}</Label>
                        <div className="p-2 mb-2 bg-blue-50 text-blue-700 text-sm rounded border border-blue-200">
                          {isMemberFromMaharashtra(memberData) ? (
                            <>
                              <strong>Maharashtra GST Schema:</strong> Based on GST number (starts with 27) or location, 
                              applying split GST with CGST (9%) and SGST (9%) for a total of 18% GST.
                            </>
                          ) : (
                            <>
                              <strong>Interstate GST Schema:</strong> Based on GST number (not starting with 27) or location outside Maharashtra,
                              applying IGST (18%) directly.
                            </>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-2">
                          {/* CGST Rate */}
                          <FormField
                            control={form.control}
                            name="cgstRate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CGST(%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="CGST"
                                    {...field}
                                    value={field.value || ""}
                                    readOnly
                                    className={!field.value ? "bg-gray-100" : ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* SGST Rate */}
                          <FormField
                            control={form.control}
                            name="sgstRate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SGST(%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="SGST"
                                    {...field}
                                    value={field.value || ""}
                                    readOnly
                                    className={!field.value ? "bg-gray-100" : ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* IGST Rate */}
                          <FormField
                            control={form.control}
                            name="igstRate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>IGST(%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="IGST"
                                    {...field}
                                    value={field.value || ""}
                                    readOnly
                                    className={!field.value ? "bg-gray-100" : ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Payment Details */}
                      <div className="space-y-4">
                        {/* Payment Mode */}
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
                                  <SelectTrigger>
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
                              <Popover open={paymentDateOpen} onOpenChange={setPaymentDateOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Select payment date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value || undefined}
                                    onSelect={(date) => {
                                      field.onChange(date);
                                      setPaymentDateOpen(false);
                                    }}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Conditional payment method fields */}
                        {form.watch("paymentMode") === "cheque" && (
                          <div className="space-y-4 p-4 border rounded-md">
                            <h3 className="text-sm font-medium">Cheque Details</h3>
                            
                            {/* Cheque Number */}
                            <FormField
                              control={form.control}
                              name="chequeNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cheque Number</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter cheque number" 
                                      {...field} 
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            {/* Cheque Date */}
                            <FormField
                              control={form.control}
                              name="chequeDate"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Cheque Date</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant={"outline"}
                                          className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                          )}
                                        >
                                          {field.value ? (
                                            format(field.value, "PPP")
                                          ) : (
                                            <span>Select cheque date</span>
                                          )}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={field.value || undefined}
                                        onSelect={(date) => {
                                          field.onChange(date);
                                        }}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
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
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                        
                        {form.watch("paymentMode") === "netbanking" && (
                          <div className="space-y-4 p-4 border rounded-md">
                            <h3 className="text-sm font-medium">Net Banking Details</h3>
                            
                            {/* NEFT Number */}
                            <FormField
                              control={form.control}
                              name="neftNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>NEFT Number</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter NEFT number" 
                                      {...field} 
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                        
                        {form.watch("paymentMode") === "upi" && (
                          <div className="space-y-4 p-4 border rounded-md">
                            <h3 className="text-sm font-medium">UPI Details</h3>
                            
                            {/* UTR Number */}
                            <FormField
                              control={form.control}
                              name="utrNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>UTR Number</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter UTR number" 
                                      {...field} 
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Summary Section */}
                  <div className="mt-5 border rounded-md p-4 bg-gray-50">
                    <h3 className="font-medium text-lg mb-2">Summary</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Basic Fees:</span>
                        <span>{formatCurrency(totals.basicFees)}</span>
                      </div>
                      {totals.cgstAmount > 0 && (
                        <div className="flex justify-between">
                          <span>CGST ({form.getValues("cgstRate")}%):</span>
                          <span>{formatCurrency(totals.cgstAmount)}</span>
                        </div>
                      )}
                      {totals.sgstAmount > 0 && (
                        <div className="flex justify-between">
                          <span>SGST ({form.getValues("sgstRate")}%):</span>
                          <span>{formatCurrency(totals.sgstAmount)}</span>
                        </div>
                      )}
                      {totals.igstAmount > 0 && (
                        <div className="flex justify-between">
                          <span>IGST ({form.getValues("igstRate")}%):</span>
                          <span>{formatCurrency(totals.igstAmount)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Total Amount:</span>
                        <span>{formatCurrency(totals.totalFees)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-end space-x-2 mt-6">
                    <Button
                      type="button" 
                      variant="outline"
                      onClick={() => navigate(-1)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={addMembershipMutation.isPending}
                    >
                      {addMembershipMutation.isPending
                        ? "Adding..."
                        : "Add Membership"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </form>
      </Form>
    </div>
  );
};

export default AddMembership; 