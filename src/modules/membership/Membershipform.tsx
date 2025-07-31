import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  forwardRef,
  useRef,
} from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
import {
  ChevronsUpDown,
  Check,
  Calendar as CalendarIcon,
  ArrowLeft,
  PencilIcon,
} from "lucide-react";
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
import { DatePickerWithInput } from "@/components/ui/date-picker-input";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { DatePicker } from "@/components/ui/date-picker-new";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Helper functions for GST validation
const MAHARASHTRA_KEYWORDS = [
  "maharashtra",
  "mumbai",
  "pune",
  "nagpur",
  "thane",
  "nashik",
  "aurangabad",
  "solapur",
  "navi mumbai",
];

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
    return (
      state.includes("maharashtra") ||
      MAHARASHTRA_KEYWORDS.some((keyword) => state.includes(keyword))
    );
  }

  // Fall back to location-based checks if neither GST nor state is available
  const locationStrings = [memberData.location, memberData.orgLocation]
    .filter(Boolean)
    .map((loc) => loc.toLowerCase());

  return locationStrings.some((location) =>
    MAHARASHTRA_KEYWORDS.some((keyword) => location.includes(keyword)),
  );
};

// Form Schema Definition
const membershipSchema = z.object({
  memberId: z.number({
    required_error: "Member is required",
  }),
  invoiceDate: z.preprocess(
    (arg) => {
      if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    },
    z.date({
      required_error: "Invoice date is required",
    }),
  ),
  packageStartDate: z.preprocess(
    (arg) => {
      if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    },
    z.date({
      required_error: "Package start date is required",
    }),
  ),
  packageId: z.number({
    required_error: "Package is required",
  }),
  basicFees: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().positive("Basic fees must be positive"),
  ),
  cgstRate: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().min(0, "CGST rate cannot be negative").nullable().optional(),
  ),
  sgstRate: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().min(0, "SGST rate cannot be negative").nullable().optional(),
  ),
  igstRate: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().min(0, "IGST rate cannot be negative").nullable().optional(),
  ),
  paymentDate: z.preprocess(
    (arg) => {
      if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    },
    z.date({
      required_error: "Payment date is required",
    }),
  ),
  paymentMode: z
    .string({
      required_error: "Payment mode is required",
    })
    .min(1, "Payment mode is required"),

  // Cheque details
  chequeNumber: z.string().optional().nullable(),
  chequeDate: z.preprocess(
    (val) => (val ? new Date(val as any) : null),
    z.date().optional().nullable(),
  ),
  bankName: z.string().optional().nullable(),

  // Bank transfer details
  neftNumber: z.string().optional().nullable(),

  // UPI details
  utrNumber: z.string().optional().nullable(),

  // Active status
  active: z.boolean().default(true),
});

// Apply conditional validation for each payment method
const conditionalMembershipSchema = membershipSchema
  // Cheque payment validations
  .refine(
    (data) => {
      // If payment mode is not cheque, validation passes
      if (data.paymentMode !== "cheque") return true;
      // For cheque payments, these fields are required
      return !!data.chequeNumber && !!data.chequeDate && !!data.bankName;
    },
    {
      message:
        "Cheque number, date, and bank name are required for cheque payments",
      path: ["chequeNumber"],
    },
  )
  // Cheque number format validation
  .refine(
    (data) => {
      // Only validate cheque number format if payment mode is cheque and value exists
      if (data.paymentMode !== "cheque" || !data.chequeNumber) return true;
      return /^\d{6,12}$/.test(data.chequeNumber);
    },
    {
      message: "Cheque number must be 6-12 digits",
      path: ["chequeNumber"],
    },
  )
  // Bank name validations
  .refine(
    (data) => {
      // Only validate bank name if payment mode is cheque and value exists
      if (data.paymentMode !== "cheque" || !data.bankName) return true;
      return data.bankName.length >= 3;
    },
    {
      message: "Bank name must be at least 3 characters",
      path: ["bankName"],
    },
  )
  .refine(
    (data) => {
      // Only validate bank name format if payment mode is cheque and value exists
      if (data.paymentMode !== "cheque" || !data.bankName) return true;
      return /^[A-Za-z\s\-&.]+$/.test(data.bankName);
    },
    {
      message:
        "Bank name should only contain letters, spaces, hyphens, ampersands and periods",
      path: ["bankName"],
    },
  )
  .refine(
    (data) => {
      // Check for consecutive spaces in bank name
      if (data.paymentMode !== "cheque" || !data.bankName) return true;
      return !/\s{2,}/.test(data.bankName);
    },
    {
      message: "Bank name should not contain consecutive spaces",
      path: ["bankName"],
    },
  )

  // Net banking validations
  .refine(
    (data) => {
      // If payment mode is not netbanking, validation passes
      if (data.paymentMode !== "netbanking") return true;
      // For netbanking payments, NEFT number is required
      return !!data.neftNumber;
    },
    {
      message: "NEFT/IMPS number is required for netbanking payments",
      path: ["neftNumber"],
    },
  )
  .refine(
    (data) => {
      // Only validate NEFT number format if payment mode is netbanking and value exists
      if (data.paymentMode !== "netbanking" || !data.neftNumber) return true;
      return /^[A-Za-z0-9]{11,18}$/.test(data.neftNumber);
    },
    {
      message: "NEFT/IMPS number must be 11-18 alphanumeric characters",
      path: ["neftNumber"],
    },
  )
  .refine(
    (data) => {
      // Validate that NEFT number contains both letters and numbers
      if (data.paymentMode !== "netbanking" || !data.neftNumber) return true;
      return /^(?=.*[A-Za-z])(?=.*\d)/.test(data.neftNumber);
    },
    {
      message: "NEFT/IMPS number should contain both letters and numbers",
      path: ["neftNumber"],
    },
  )

  // UPI validations
  .refine(
    (data) => {
      // If payment mode is not UPI, validation passes
      if (data.paymentMode !== "upi") return true;
      // For UPI payments, UTR number is required
      return !!data.utrNumber;
    },
    {
      message: "UTR number is required for UPI payments",
      path: ["utrNumber"],
    },
  )
  .refine(
    (data) => {
      // Only validate UTR number format if payment mode is UPI and value exists
      if (data.paymentMode !== "upi" || !data.utrNumber) return true;
      return /^[A-Za-z0-9]{16,22}$/.test(data.utrNumber);
    },
    {
      message: "UTR number must be 16-22 characters long",
      path: ["utrNumber"],
    },
  )
  .refine(
    (data) => {
      // Validate that UTR number contains both letters and numbers
      if (data.paymentMode !== "upi" || !data.utrNumber) return true;
      return /^(?=.*[A-Za-z])(?=.*\d)/.test(data.utrNumber);
    },
    {
      message: "UTR number should contain both letters and numbers",
      path: ["utrNumber"],
    },
  );

type MembershipFormInputs = z.infer<typeof conditionalMembershipSchema>;

// Types
interface MemberData {
  id: string;
  memberName: string;
  organizationName: string;
  location: string;
  gstNo: string;
  memberships?: Array<{
    id: number;
    active: boolean;
    package: {
      id: number;
      packageName: string;
      packageType: {
        id: number;
        name: string;
      };
    };
  }>;
  stateName?: string;
  chapterId?: number;
  chapter?: {
    id: number;
    name: string;
  };
  [key: string]: any;
}

interface PackageItem {
  id: number;
  packageName: string;
  basicFees: number;
  periodMonths: number;
  isVenueFee?: boolean;
  packageType: {
    id: number;
    name: string;
  };
  chapterId?: number | null;
  // any other fields packages might have
}

interface MemberDropdownItem {
  id: number;
  memberName: string;
  organizationName?: string;
}

export default function Membershipform({ mode }: { mode: "create" | "edit" }) {
  const { isAdmin } = useRoleAccess();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { memberId: id } = useParams<{ memberId: string }>();

  // Ref to track if default start date has been applied for the current member in create mode
  const hasAppliedDefaultStartDateRef = useRef(false);

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      toast.error("You don't have permission to access this page");
      navigate("/memberships");
    }
  }, [isAdmin, navigate]);

  const [packagePopoverOpen, setPackagePopoverOpen] = useState(false);
  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false);
  const [availablePackages, setAvailablePackages] = useState<PackageItem[]>([]);

  // States for prompting complementary membership
  const [showComplementaryPrompt, setShowComplementaryPrompt] = useState(false);
  const [originalFormData, setOriginalFormData] =
    useState<MembershipFormInputs | null>(null);
  const [selectedComplementaryPackage, setSelectedComplementaryPackage] =
    useState<PackageItem | null>(null);
  const [complementaryPackages, setComplementaryPackages] = useState<
    PackageItem[]
  >([]);
  const [isAddingVenue, setIsAddingVenue] = useState(false); // true if adding VENUE, false if adding HO
  
  // Define type for complementary payment data
  interface ComplementaryPaymentData {
    paymentMode: string;
    paymentDate: Date;
    chequeNumber: string;
    chequeDate: Date | null;
    bankName: string;
    neftNumber: string;
    utrNumber: string;
  }

  // State for complementary membership payment information
  const [complementaryPaymentData, setComplementaryPaymentData] = useState<ComplementaryPaymentData>({
    paymentMode: "cash",
    paymentDate: new Date(),
    chequeNumber: "",
    chequeDate: null,
    bankName: "",
    neftNumber: "",
    utrNumber: ""
  });
  
  // State for validation errors in complementary dialog
  const [complementaryValidationErrors, setComplementaryValidationErrors] = useState<{
    chequeNumber?: string;
    chequeDate?: string;
    bankName?: string;
    neftNumber?: string;
    utrNumber?: string;
  }>({});

  // Initialize form
  const form = useForm<MembershipFormInputs>({
    resolver: zodResolver(conditionalMembershipSchema),
    defaultValues: {
      memberId: Number(id),
      invoiceDate: new Date(), // Initialize with valid date to prevent unintended updates
      packageStartDate: new Date(), // Initialize new package start date
      packageId: 0,
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

  const { setValue, getValues } = form;

  // Computed state values
  const selectedMemberId = form.watch("memberId");
  const cgstRate = form.watch("cgstRate");
  const sgstRate = form.watch("sgstRate");
  const igstRate = form.watch("igstRate");
  const paymentMode = form.watch("paymentMode");

  // Fetch members data
  const { data: members = [], isLoading: isMembersLoading } = useQuery<
    MemberDropdownItem[]
  >({
    queryKey: ["members", "dropdown"],
    queryFn: async () => {
      const response = await get("/api/members?limit=100&active=true");
      return response.members || [];
    },
  });

  // Fetch packages for dropdown
  const { data: packages = [], isLoading: isPackagesLoading } = useQuery<
    PackageItem[]
  >({
    queryKey: ["packages"],
    queryFn: async () => {
      const response = await get("/packages?limit=100&active=true");
      return response.packages || [];
    },
  });

  // Fetch selected member details
  const { data: memberData, isLoading: isMemberLoading } = useQuery({
    queryKey: ["member", selectedMemberId],
    queryFn: async () => {
      if (!selectedMemberId) return null;
      const response = await get(`/api/members/${selectedMemberId}`);
      return response as MemberData;
    },
    enabled: !!selectedMemberId,
  });

  // Create a ref to track the previous filtered packages for comparison
  const prevFilteredPackagesRef = useRef<PackageItem[]>([]);

  // Memoize filtered packages to avoid unnecessary re-renders
  const filteredPackages = useMemo(() => {
    let result = [];
    if (
      !selectedMemberId ||
      !memberData ||
      !packages.length ||
      isMemberLoading ||
      isPackagesLoading
    ) {
      result = isPackagesLoading || isMemberLoading ? [] : packages;
    } else {
      const now = new Date();
      const hasActiveVenue =
        memberData.venueExpiryDate &&
        new Date(memberData.venueExpiryDate) > now;
      const hasActiveHO =
        memberData.hoExpiryDate && new Date(memberData.hoExpiryDate) > now;

      // First filter by chapter
      let chapterFilteredPackages = packages;
      if (memberData.chapterId) {
        // Filter packages to only show those that belong to the member's chapter or are global (chapterId is null)
        chapterFilteredPackages = packages.filter((pkg) => {
          return pkg.chapterId === null || pkg.chapterId === memberData.chapterId;
        });
      }

      // Then apply the membership type filtering
      if (hasActiveVenue && hasActiveHO) {
        // If member has both active Venue and HO memberships, show all chapter-filtered packages
        result = chapterFilteredPackages;
      } else {
        // Otherwise, apply the original filtering logic on chapter-filtered packages
        result = chapterFilteredPackages.filter((pkg) => {
          const packageTypeName = pkg?.isVenueFee ? "VENUE" : "HO";
          if (packageTypeName === "VENUE" && hasActiveVenue) return false;
          if (packageTypeName === "HO" && hasActiveHO) return false;
          return true;
        });
      }
    }
    return result;
  }, [
    selectedMemberId,
    memberData,
    packages,
    isMemberLoading,
    isPackagesLoading,
  ]);

  // Effect to update available packages and reset form fields if necessary
  useEffect(() => {
    // Only update if the filteredPackages have actually changed
    if (JSON.stringify(prevFilteredPackagesRef.current) !== JSON.stringify(filteredPackages)) {
      setAvailablePackages(filteredPackages);
      prevFilteredPackagesRef.current = filteredPackages;
      
      const currentPackageId = getValues("packageId");
      if (currentPackageId && !filteredPackages.find((p) => p.id === currentPackageId)) {
        setTimeout(() => {
          setValue("packageId", 0, { shouldValidate: true });
          setValue("basicFees", 0, { shouldValidate: true });
        }, 0);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPackages]); // Only depend on filteredPackages

  // Watch for member data changes to update GST rates
  useEffect(() => {
    if (memberData) {
      const isFromMaha = isMemberFromMaharashtra(memberData);
      if (isFromMaha) {
        setValue("cgstRate", 9);
        setValue("sgstRate", 9);
        setValue("igstRate", null);
      } else {
        setValue("cgstRate", null);
        setValue("sgstRate", null);
        setValue("igstRate", 18);
      }
    }
  }, [memberData, setValue]);

  // Effect to reset the default start date applied flag when member or mode changes
  useEffect(() => {
    if (mode === "create") {
      hasAppliedDefaultStartDateRef.current = false;
    }
  }, [selectedMemberId, mode]);

  // Effect to set default packageStartDate based on last expiry in 'create' mode
  // useEffect 1: Reacts to memberData change (simplified version of existing)
  useEffect(() => {
    // This effect runs when the selected member changes.
    // It no longer prefills packageStartDate with complex logic.
    if (mode === 'create') {
      // When member changes, reset hasAppliedDefaultStartDateRef.
      // This ref's purpose was to prevent re-applying a complex default if user interacted.
      // With the new direct prefill on package change, it might be less critical or removable.
      hasAppliedDefaultStartDateRef.current = false;

      // If the packageStartDate field is not dirty, and no package is selected, 
      // you might want to clear it or set a very basic default (e.g., null or undefined).
      // For now, this effect primarily resets the flag.
      // The package selection effect will handle the actual prefill.
    }
  }, [memberData, mode, selectedMemberId]); // Removed 'form' to avoid re-runs if only form object ref changes

  // useEffect 2: New effect, reacts to selected package change
  const watchedPackageId = form.watch('packageId'); // <<< --- IMPORTANT: Replace 'packageId' with your actual form field name for selected package ID

  useEffect(() => {
    if (mode === 'create' && memberData && packages && watchedPackageId) {
      const selectedPackage = packages.find(p => p.id === watchedPackageId);

      if (selectedPackage) {
        let expiryDateToPrefill: Date | null = null;
        let rawExpiryString: string | undefined | null = null;

        // <<< --- IMPORTANT: Adjust the logic below to correctly identify package type (HO/Venue)
        // Based on your `selectedPackage` object structure. Example uses `package_type_name`.
        console.log("asdasdasdasdasdasdasdasdasd",selectedPackage)
        if (selectedPackage.isVenueFee === false) { 
          rawExpiryString = memberData.hoExpiryDate;
        } else if (selectedPackage.isVenueFee ===  true) { 
          rawExpiryString = memberData.venueExpiryDate;
        }
        // Add more 'else if' conditions if other package types map to these or different expiries.

        if (rawExpiryString) {
          const parsedDate = new Date(rawExpiryString);
          console.log(parsedDate)
          if (!isNaN(parsedDate.getTime())) {
            expiryDateToPrefill = parsedDate;
          }
        }

        if (expiryDateToPrefill) {
          console.log(`Prefilling packageStartDate with ${selectedPackage.isVenueFee === false ? 'HO' : (selectedPackage.isVenueFee === true ? 'Venue' : 'Unknown Type')} expiry: ${expiryDateToPrefill.toISOString()}`);
          form.setValue("packageStartDate", expiryDateToPrefill, {
            shouldTouch: true,      // Important: So validation errors appear if prefilled date is invalid (e.g., in the past)
            shouldDirty: false,     // Prefilling should not mark the field as dirty
            shouldValidate: true    // Run validation on the prefilled value
          });
          console.log('packageStartDate in form state AFTER setValue:', form.getValues("packageStartDate"));
        } else {
          console.log(`No specific expiry date found in memberData for selected package type ('${selectedPackage.packageType}'), or package type not recognized, or raw expiry date is null/invalid.`);
          // If no relevant expiry date, or if it's invalid, the field won't be set by this block.
          // If you want to clear it or set to a default like 'today' when a package is selected but has no valid/applicable expiry:
          // if (!form.formState.dirtyFields.packageStartDate) {
          //   form.setValue("packageStartDate", null, { shouldTouch: true, shouldValidate: true }); // Example: clear it
          // }
        }
      } else {
         console.log(`Selected package ID ${watchedPackageId} not found in packages.`);
        // If packageId exists but not found in packages, what to do? Currently nothing.
      }
    } else if (mode === 'create' && !watchedPackageId && !form.formState.dirtyFields.packageStartDate) {
        // No package selected yet, and field isn't dirty.
        // According to "No Automatic Date Adjustment", avoid setting to today automatically here.
        // The field will retain its default from schema or be undefined.
        // If an explicit default is desired when no package is selected (e.g. on form load for a member),
        // that could be handled in the first useEffect or initial form values.
    }
  }, [watchedPackageId, memberData, packages, mode, form]); // 'form' is needed for form.watch and form.setValue

  // Effect to set memberId from query params - run once on initial load
  useEffect(() => {
    if (mode === "create" && members && members.length > 0) {
      const queryParams = new URLSearchParams(location.search);
      const memberIdFromQuery = queryParams.get("memberId");
      if (memberIdFromQuery) {
        const parsedMemberId = parseInt(memberIdFromQuery, 10);
        if (
          !isNaN(parsedMemberId) &&
          members.find((m: MemberDropdownItem) => m.id === parsedMemberId)
        ) {
          // Set memberId from URL parameter
          form.setValue("memberId", parsedMemberId, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      }
    }
  }, [location.search, members, mode, form]);

  // Watch form values
  const watchPackage = form.watch("packageId");
  const watchBasicFees = form.watch("basicFees");
  const watchCgstRate = form.watch("cgstRate");
  const watchSgstRate = form.watch("sgstRate");
  const watchIgstRate = form.watch("igstRate");

  // Memoize tax calculations to prevent recalculation on every render
  const { cgstAmount, sgstAmount, igstAmount, totalTax, totalAmount } =
    useMemo(() => {
      const cgst =
        watchCgstRate && watchBasicFees
          ? (Number(watchBasicFees) * Number(watchCgstRate)) / 100
          : 0;
      const sgst =
        watchSgstRate && watchBasicFees
          ? (Number(watchBasicFees) * Number(watchSgstRate)) / 100
          : 0;
      const igst =
        watchIgstRate && watchBasicFees
          ? (Number(watchBasicFees) * Number(watchIgstRate)) / 100
          : 0;
      const tax = cgst + sgst + igst;
      const total = (Number(watchBasicFees) || 0) + tax;

      return {
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        totalTax: tax,
        totalAmount: total,
      };
    }, [watchBasicFees, watchCgstRate, watchSgstRate, watchIgstRate]);

  // Remove state for calculated values and use the memoized values directly
  // This eliminates one source of re-renders

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
        basicFees: parseFloat(membershipData.basicFees) || 0,
        cgstRate: membershipData.cgstRate
          ? parseFloat(membershipData.cgstRate)
          : null,
        sgstRate: membershipData.sgstRate
          ? parseFloat(membershipData.sgstRate)
          : null,
        igstRate: membershipData.igstRate
          ? parseFloat(membershipData.igstRate)
          : null,
        invoiceDate: new Date(membershipData.invoiceDate),
        // packageStartDate: membershipData.packageStartDate 
        //                   ? new Date(membershipData.packageStartDate) 
        //                   : new Date(membershipData.invoiceDate), // Fallback to invoiceDate
        paymentDate: membershipData.paymentDate
          ? new Date(membershipData.paymentDate)
          : null,
        chequeDate: membershipData.chequeDate
          ? new Date(membershipData.chequeDate)
          : null,
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
      navigate(`/memberships?memberId=${id}`);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create membership",
      );
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
      toast.error(
        error?.response?.data?.message || "Failed to update membership",
      );
      console.error("Error updating membership:", error);
    },
  });

  // Add state for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update onSubmit function to include calculated tax values
  const onSubmit: SubmitHandler<MembershipFormInputs> = (values) => {
    // Add calculated tax values before saving - use memoized values
    const formData = {
      ...values,
      // Add calculated tax amounts
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTax,
      totalAmount,
    };
    
    // Debug logging for packageStartDate
    console.log('Form submission data:', formData);
    console.log('packageStartDate:', formData.packageStartDate);
    console.log('packageStartDate type:', typeof formData.packageStartDate);
    console.log('packageStartDate ISO:', formData.packageStartDate instanceof Date ? formData.packageStartDate.toISOString() : 'Not a Date object');

    // Check for complementary membership opportunity in create mode
    if (mode === "create") {
      // Find the selected package
      const selectedPackage = packages.find(
        (pkg) => pkg.id === values.packageId,
      );
      if (selectedPackage) {
        console.log(
          "Full package details:",
          JSON.stringify(selectedPackage, null, 2),
        );

        // Determine if it's a VENUE package with more thorough logic
        let isVenuePackage = false;

        // Check method 1: isVenueFee property
        if (typeof selectedPackage.isVenueFee === "boolean") {
          isVenuePackage = selectedPackage.isVenueFee;
        }
        // Check method 2: packageType.name property
        else if (
          selectedPackage.packageType &&
          selectedPackage.packageType.name
        ) {
          isVenuePackage = selectedPackage.packageType.name === "VENUE";
        }
        // Check method 3: packageName contains "VENUE"
        else if (selectedPackage.packageName) {
          isVenuePackage = selectedPackage.packageName
            .toUpperCase()
            .includes("VENUE");
        }

        console.log("Determined isVenuePackage:", isVenuePackage);
        const now = new Date();

        console.log("Selected package:", selectedPackage);
        console.log("Member data:", memberData);

        // Check active membership status using memberships array if available
        // First, look for explicit expiry dates properties (if they exist)
        let hasActiveVenue = false;
        let hasActiveHO = false;

        // Method 1: Check explicit expiry date properties
        if (memberData?.venueExpiryDate) {
          hasActiveVenue = new Date(memberData.venueExpiryDate) > now;
        }

        if (memberData?.hoExpiryDate) {
          hasActiveHO = new Date(memberData.hoExpiryDate) > now;
        }

        // Method 2: Check memberships array if available
        if (
          !hasActiveVenue &&
          !hasActiveHO &&
          memberData?.memberships &&
          memberData.memberships.length > 0
        ) {
          // Look through memberships for active ones
          memberData.memberships.forEach((membership: any) => {
            if (membership.active) {
              const packageType =
                membership.package?.packageType?.name ||
                (membership.package?.isVenueFee ? "VENUE" : "HO");

              if (
                packageType === "VENUE" ||
                membership.package?.isVenueFee === true
              ) {
                hasActiveVenue = true;
              } else if (
                packageType === "HO" ||
                membership.package?.isVenueFee === false
              ) {
                hasActiveHO = true;
              }
            }
          });
        }

        console.log("Has active VENUE:", hasActiveVenue);
        console.log("Has active HO:", hasActiveHO);

        let shouldPrompt = false;
        let complementaryPackages: PackageItem[] = [];

        // More robust package type check
        const isPackageOfType = (pkg: PackageItem, isVenue: boolean) => {
          if (pkg.packageType?.name) {
            // Check by package type name if available
            return isVenue
              ? pkg.packageType.name === "VENUE"
              : pkg.packageType.name === "HO";
          } else {
            // Fallback to isVenueFee flag
            return isVenue ? pkg.isVenueFee === true : pkg.isVenueFee === false;
          }
        };

        console.log("isVenuePackage:", isVenuePackage);

        // Case 1: Adding VENUE, prompt for HO if not active
        if (isVenuePackage && !hasActiveHO) {
          console.log("Looking for HO packages...");
          // Find ALL available HO packages (don't filter by period)
          // Also apply chapter filtering
          complementaryPackages = packages.filter(
            (pkg) => {
              // Must be HO package
              if (!isPackageOfType(pkg, false)) return false;
              // Must belong to member's chapter or be global
              if (memberData.chapterId) {
                return pkg.chapterId === null || pkg.chapterId === memberData.chapterId;
              }
              return true;
            }
          );
          console.log("Available HO packages:", complementaryPackages);
          shouldPrompt = complementaryPackages.length > 0;
        }

        // Case 2: Adding HO, prompt for VENUE if not active
        else if (!isVenuePackage && !hasActiveVenue) {
          console.log("Looking for VENUE packages...");
          // Find ALL available VENUE packages (don't filter by period)
          // Also apply chapter filtering
          complementaryPackages = packages.filter(
            (pkg) => {
              // Must be VENUE package
              if (!isPackageOfType(pkg, true)) return false;
              // Must belong to member's chapter or be global
              if (memberData.chapterId) {
                return pkg.chapterId === null || pkg.chapterId === memberData.chapterId;
              }
              return true;
            }
          );
          console.log("Available VENUE packages:", complementaryPackages);
          shouldPrompt = complementaryPackages.length > 0;
        }

        if (shouldPrompt) {
          // Save form data and display prompt
          setOriginalFormData(formData);
          setComplementaryPackages(complementaryPackages);
          setSelectedComplementaryPackage(complementaryPackages[0]);
          setIsAddingVenue(isVenuePackage === true); // Track which type we're initially adding (ensure it's boolean)
          setShowComplementaryPrompt(true);
          setIsSubmitting(false);
          return;
        }
      }
    }

    setIsSubmitting(true);

    if (mode === "edit" && id) {
      updateMutation.mutate(formData, {
        onSettled: () => setIsSubmitting(false),
      });
    } else {
      createMutation.mutate(formData, {
        onSettled: () => setIsSubmitting(false),
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
  const isLoading =
    isMembersLoading ||
    isPackagesLoading ||
    loadingMembership ||
    isMemberLoading;

  // Function to handle creating both memberships (original + complementary)
  const createBothMemberships = async () => {
    // Validate payment details based on payment mode
    if (complementaryPaymentData.paymentMode === "cheque") {
      // Check all required fields
      if (!complementaryPaymentData.chequeNumber?.trim()) {
        toast.error("Cheque number is required");
        return;
      }
      if (!complementaryPaymentData.chequeDate) {
        toast.error("Cheque date is required");
        return;
      }
      if (!complementaryPaymentData.bankName?.trim()) {
        toast.error("Bank name is required");
        return;
      }
      
      // Check if cheque number is 6-12 digits
      if (!/^\d{6,12}$/.test(complementaryPaymentData.chequeNumber.trim())) {
        toast.error("Cheque number must be 6-12 digits");
        return;
      }
      
      // Check if bank name is at least 3 characters
      if (complementaryPaymentData.bankName.trim().length < 3) {
        toast.error("Bank name must be at least 3 characters");
        return;
      }
      
      // Check bank name format
      if (!/^[A-Za-z\s\-&.]+$/.test(complementaryPaymentData.bankName.trim())) {
        toast.error("Bank name should only contain letters, spaces, hyphens, ampersands and periods");
        return;
      }
      
      // Check for consecutive spaces in bank name
      if (/\s{2,}/.test(complementaryPaymentData.bankName)) {
        toast.error("Bank name should not contain consecutive spaces");
        return;
      }
    } else if (complementaryPaymentData.paymentMode === "netbanking") {
      if (!complementaryPaymentData.neftNumber?.trim()) {
        toast.error("NEFT/IMPS number is required for net banking");
        return;
      }
      
      // Validate NEFT number format
      if (!/^[A-Za-z0-9]{11,18}$/.test(complementaryPaymentData.neftNumber.trim())) {
        toast.error("NEFT/IMPS number must be 11-18 alphanumeric characters");
        return;
      }
      
      // Check that NEFT number contains both letters and numbers
      if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(complementaryPaymentData.neftNumber.trim())) {
        toast.error("NEFT/IMPS number should contain both letters and numbers");
        return;
      }
    } else if (complementaryPaymentData.paymentMode === "upi") {
      if (!complementaryPaymentData.utrNumber?.trim()) {
        toast.error("UTR number is required for UPI payment");
        return;
      }
      
      // Validate UTR number format
      if (!/^[A-Za-z0-9]{16,22}$/.test(complementaryPaymentData.utrNumber.trim())) {
        toast.error("UTR number must be 16-22 alphanumeric characters");
        return;
      }
      
      // Check that UTR number contains both letters and numbers
      if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(complementaryPaymentData.utrNumber.trim())) {
        toast.error("UTR number should contain both letters and numbers");
        return;
      }
    }

    if (!originalFormData || !selectedComplementaryPackage) return;

    setIsSubmitting(true);

    try {
      // First create the original membership
      await createMutation.mutateAsync(originalFormData);

      // Create the complementary membership with the same details except package
      const complementaryFormData = {
        ...originalFormData, // Spread original form data first
        packageId: selectedComplementaryPackage.id,
        basicFees: selectedComplementaryPackage.basicFees,
        // Recalculate tax amounts for complementary membership
        cgstRate: originalFormData.cgstRate, // Keep original tax rates
        sgstRate: originalFormData.sgstRate,
        igstRate: originalFormData.igstRate,
        cgstAmount: originalFormData.cgstRate
          ? (selectedComplementaryPackage.basicFees *
              originalFormData.cgstRate) /
            100
          : 0,
        sgstAmount: originalFormData.sgstRate
          ? (selectedComplementaryPackage.basicFees *
              originalFormData.sgstRate) /
            100
          : 0,
        igstAmount: originalFormData.igstRate
          ? (selectedComplementaryPackage.basicFees *
              originalFormData.igstRate) /
            100
          : 0,
        totalTax:
          originalFormData.cgstRate && originalFormData.sgstRate
            ? (selectedComplementaryPackage.basicFees *
                originalFormData.cgstRate) /
                100 +
              (selectedComplementaryPackage.basicFees *
                originalFormData.sgstRate) /
                100
            : originalFormData.igstRate
              ? (selectedComplementaryPackage.basicFees *
                  originalFormData.igstRate) /
                100
              : 0,
        totalAmount:
          selectedComplementaryPackage.basicFees +
          (originalFormData.cgstRate && originalFormData.sgstRate
            ? (selectedComplementaryPackage.basicFees *
                originalFormData.cgstRate) /
                100 +
              (selectedComplementaryPackage.basicFees *
                originalFormData.sgstRate) /
                100
            : originalFormData.igstRate
              ? (selectedComplementaryPackage.basicFees *
                  originalFormData.igstRate) /
                100
              : 0),
        // Apply payment details from the dialog for the complementary membership
        paymentDate: complementaryPaymentData.paymentDate,
        paymentMode: complementaryPaymentData.paymentMode,
        chequeNumber: complementaryPaymentData.paymentMode === "cheque" ? complementaryPaymentData.chequeNumber : null,
        chequeDate: complementaryPaymentData.paymentMode === "cheque" ? complementaryPaymentData.chequeDate : null,
        bankName: complementaryPaymentData.paymentMode === "cheque" ? complementaryPaymentData.bankName : null,
        neftNumber: complementaryPaymentData.paymentMode === "netbanking" ? complementaryPaymentData.neftNumber : null,
        utrNumber: complementaryPaymentData.paymentMode === "upi" ? complementaryPaymentData.utrNumber : null,
      };

      await createMutation.mutateAsync(complementaryFormData);

      // Show success message for both
      const originalType = isAddingVenue ? "VENUE" : "HO";
      const complementaryType = isAddingVenue ? "HO" : "VENUE";
      toast.success(
        `Both ${originalType} and ${complementaryType} memberships created successfully`,
      );

      // Navigate to memberships list
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      navigate("/members");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to create memberships",
      );
      console.error("Error creating memberships:", error);
    } finally {
      setIsSubmitting(false);
      setShowComplementaryPrompt(false);
    }
  };

  // Function to handle user declining complementary membership
  const declineComplementaryMembership = () => {
    // Just create the original membership
    if (originalFormData) {
      setIsSubmitting(true);
      createMutation.mutate(originalFormData, {
        onSettled: () => {
          setIsSubmitting(false);
          setShowComplementaryPrompt(false);
        },
      });
    } else {
      setShowComplementaryPrompt(false);
    }
  };

  // Function to handle complementary package selection change
  const handleComplementaryPackageChange = (packageId: number) => {
    const selected = complementaryPackages.find((pkg) => pkg.id === packageId);
    if (selected) {
      setSelectedComplementaryPackage(selected);
    }
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
                              !field.value && "text-muted-foreground",
                            )}
                            disabled={mode === "edit"}
                          >
                            {field.value
                              ? members.find(
                                  (member: MemberDropdownItem) =>
                                    member.id === field.value,
                                )?.memberName || (mode === 'edit' && field.value ? `Member ID: ${field.value}` : "Select member...")
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
                            {members.map((member: MemberDropdownItem) => (
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
                                      : "opacity-0",
                                  )}
                                />
                                {member.memberName} -{" "}
                                {member.organizationName || "No Business"}
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
                          <strong>Name:</strong>{" "}
                          {memberData?.memberName || "N/A"}
                        </div>
                        <div>
                          <strong>Business:</strong>{" "}
                          {memberData?.organizationName || "N/A"}
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
                          <DatePickerWithInput
                            value={field.value}
                            onChange={field.onChange}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Package Start Date */}
                    <FormField
                      control={form.control}
                      name="packageStartDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Package Start Date</FormLabel>
                          <DatePickerWithInput
                            value={field.value}
                            onChange={field.onChange}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {console.log(availablePackages)}
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
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value
                                    ? availablePackages.find(
                                        (pkg) => pkg.id === field.value,
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
                                  {availablePackages.map(
                                    (pkg, index: number) => (
                                      <CommandItem
                                        key={index}
                                        value={pkg.packageName}
                                        onSelect={() => {
                                          form.setValue("packageId", pkg.id);
                                          form.setValue(
                                            "basicFees",
                                            pkg.basicFees,
                                          );
                                          setPackagePopoverOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === pkg.id
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        {pkg.packageName} ({pkg.periodMonths}{" "}
                                        month
                                        {pkg.periodMonths > 1 ? "s" : ""})
                                        {/* Displaying type if useful, e.g. (pkg.packageType.name) */}
                                        {/* {pkg.isVenueFee ? " - Venue Fee" : ""} */}
                                      </CommandItem>
                                    ),
                                  )}
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
                              value={field.value || ""}
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
                        <span className="text-slate-700">Basic Fees:</span>
                        <span className="font-medium">
                          {formatCurrency(Number(watchBasicFees) || 0)}
                        </span>
                      </div>
                      {watchCgstRate && watchCgstRate > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">
                            CGST ({watchCgstRate}%):
                          </span>
                          <span className="font-medium">
                            {formatCurrency(cgstAmount)}
                          </span>
                        </div>
                      )}
                      {watchSgstRate && watchSgstRate > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">
                            SGST ({watchSgstRate}%):
                          </span>
                          <span className="font-medium">
                            {formatCurrency(sgstAmount)}
                          </span>
                        </div>
                      )}
                      {watchIgstRate && watchIgstRate > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">
                            IGST ({watchIgstRate}%):
                          </span>
                          <span className="font-medium">
                            {formatCurrency(igstAmount)}
                          </span>
                        </div>
                      )}
                      <div className="h-px bg-slate-200 my-2"></div>
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span className="text-primary text-lg">
                          {formatCurrency(totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Details Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b pb-2">
                  <CardTitle>Payment Details</CardTitle>
                  {/* <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    type="button"
                    onClick={() => {
                      // Set focus to payment mode field
                      document.getElementById("payment-mode-trigger")?.focus();
                    }}
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </Button> */}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Payment Info Summary Card */}
                    {/* <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Basic Fees:</span>
                          <span className="font-medium">
                            {formatCurrency(Number(watchBasicFees) || 0)}
                          </span>
                        </div>

                        {watchCgstRate && watchCgstRate > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm">
                              CGST ({watchCgstRate}%):
                            </span>
                            <span className="font-medium">
                              {formatCurrency(cgstAmount)}
                            </span>
                          </div>
                        )}

                        {watchSgstRate && watchSgstRate > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm">
                              SGST ({watchSgstRate}%):
                            </span>
                            <span className="font-medium">
                              {formatCurrency(sgstAmount)}
                            </span>
                          </div>
                        )}
                      </div>

                      {watchIgstRate && watchIgstRate > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">
                            IGST ({watchIgstRate}%):
                          </span>
                          <span className="font-medium">
                            {formatCurrency(igstAmount)}
                          </span>
                        </div>
                      )}

                      <div className="h-px bg-slate-200 my-1"></div>

                      <div className="flex items-center justify-between font-bold">
                        <span>Total Amount Due:</span>
                        <span className="text-lg text-primary">
                          {formatCurrency(totalAmount)}
                        </span>
                      </div>
                    </div> */}
                  </div>

                  {/* Payment Details Editing Section */}
                  <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-white">
                    <h3 className="text-base font-medium mb-3">
                      Payment Information
                    </h3>

                    {/* Payment Mode and Date */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="paymentMode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Mode *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger
                                  id="payment-mode-trigger"
                                  className="w-full"
                                >
                                  <SelectValue placeholder="Select payment mode" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                 <SelectItem value="netbanking">
                                  Net Banking
                                </SelectItem>
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
                            <FormLabel>Payment Date *</FormLabel>
                            <DatePickerWithInput
                              value={field.value}
                              onChange={field.onChange}
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
                        <p className="text-sm text-muted-foreground mb-2">
                          All fields are required for cheque payments
                        </p>
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
                                    value={field.value || ""}
                                    onChange={(e) =>
                                      field.onChange(e.target.value)
                                    }
                                  />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">
                                  Must be 6-12 digits
                                </p>
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
                                <DatePickerWithInput
                                  value={field.value}
                                  onChange={field.onChange}
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
                                    value={field.value || ""}
                                    onChange={(e) =>
                                      field.onChange(e.target.value)
                                    }
                                  />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">
                                  Must be at least 3 characters
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {paymentMode === "netbanking" && (
                      <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="text-lg font-medium">
                          Bank Transfer Details
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          NEFT/IMPS number is required for bank transfer
                          payments
                        </p>

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
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <p className="text-xs text-muted-foreground">
                                Must be 11-18 alphanumeric characters
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {paymentMode === "upi" && (
                      <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="text-lg font-medium">UPI Details</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          UTR number is required for UPI payments
                        </p>

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
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <p className="text-xs text-muted-foreground">
                                Must be 12-22 alphanumeric characters
                              </p>
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
          <CardFooter className="flex justify-between pt-4 border-t mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="min-w-[180px]"
            >
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                  ? "Create Membership"
                  : "Update Membership"}
              {/* <span className="ml-1 text-xs opacity-80">
                ({formatCurrency(totalAmount)})
              </span> */}
            </Button>
          </CardFooter>
        </form>
      </Form>

      {/* Complementary Membership Prompt Dialog */}
      <Dialog
        open={showComplementaryPrompt}
        onOpenChange={setShowComplementaryPrompt}
        modal={false}
      >
        <DialogContent className="max-w-[95%] max-h-[95%] overflow-auto" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl">
              Would you like to add {isAddingVenue ?  "an HO": "a VENUE" }{" "}
              membership as well?
            </DialogTitle>
            <DialogDescription className="mt-2">
              We noticed you're adding {isAddingVenue ?   "an HO": "a VENUE"  }{" "}
              membership. Would you like to add a matching{" "}
              {isAddingVenue ? "VENUE" : "HO"} membership with the same details?
            </DialogDescription>
          </DialogHeader>

          <div className="py-5 space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="font-medium text-slate-800 mb-3">
                Selected {isAddingVenue ?  "VENUE": "HO" } membership details:
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">
                    {originalFormData &&
                      packages.find((p) => p.id === originalFormData.packageId)
                        ?.periodMonths}{" "}
                    months
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Basic Fees:</span>
                  <span className="font-medium">
                    {originalFormData &&
                      formatCurrency(originalFormData.basicFees || 0)}
                  </span>
                </div>

                {/* GST Breakdown for Original Form Data */}
                {originalFormData && (() => {
                  const basicFees = originalFormData.basicFees || 0;
                  const effectiveCgstRate = originalFormData.cgstRate;
                  const effectiveSgstRate = originalFormData.sgstRate;
                  const effectiveIgstRate = originalFormData.igstRate;

                  let displayCgstAmount = 0;
                  let displaySgstAmount = 0;
                  let displayIgstAmount = 0;
                  let displayTotalAmount = basicFees;
                  let isIgstScenario = false;

                  if (effectiveIgstRate != null && effectiveIgstRate > 0) {
                    isIgstScenario = true;
                    displayIgstAmount = (basicFees * effectiveIgstRate) / 100;
                    displayTotalAmount += displayIgstAmount;
                  } else if (effectiveCgstRate != null && effectiveSgstRate != null) {
                    // This includes cases where rates might be 0 for CGST/SGST
                    displayCgstAmount = (basicFees * effectiveCgstRate) / 100;
                    displaySgstAmount = (basicFees * effectiveSgstRate) / 100;
                    displayTotalAmount += displayCgstAmount + displaySgstAmount;
                  }
                  // If all rates are null or igst is 0 and cgst/sgst are null, totalAmount remains basicFees

                  return (
                    <>
                      {isIgstScenario ? (
                        <div className="flex justify-between text-sm">
                          <span>IGST ({effectiveIgstRate}%):</span>
                          <span>{formatCurrency(displayIgstAmount)}</span>
                        </div>
                      ) : (
                        effectiveCgstRate != null && effectiveSgstRate != null && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span>CGST ({effectiveCgstRate}%):</span>
                              <span>{formatCurrency(displayCgstAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>SGST ({effectiveSgstRate}%):</span>
                              <span>{formatCurrency(displaySgstAmount)}</span>
                            </div>
                          </>
                        )
                      )}
                      <div className="h-px bg-slate-200 my-1"></div>
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span className="text-primary">
                          {formatCurrency(displayTotalAmount)}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {complementaryPackages.length > 0 && (
              <div className="space-y-2">
                <Label className="text-base font-medium">
                  Select {isAddingVenue ?  "HO": "VENUE" } Package:
                </Label>
                <Select
                  value={selectedComplementaryPackage?.id.toString() || ""}
                  onValueChange={(value) =>
                    handleComplementaryPackageChange(parseInt(value))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={`Select ${isAddingVenue ? "VENUE" : "HO"} package`}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {complementaryPackages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id.toString()}>
                        {pkg.packageName} ({pkg.periodMonths} month
                        {pkg.periodMonths > 1 ? "s" : ""}) -{" "}
                        {formatCurrency(pkg.basicFees)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedComplementaryPackage && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="font-medium text-slate-800 mb-3">
                  {isAddingVenue ?  "HO": "VENUE" } Membership Preview:
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Package:</span>
                    <span className="font-medium">
                      {selectedComplementaryPackage.packageName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">
                      {selectedComplementaryPackage.periodMonths} month
                      {selectedComplementaryPackage.periodMonths > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Basic Fees:</span>
                    <span className="font-medium">
                      {formatCurrency(selectedComplementaryPackage.basicFees)}
                    </span>
                  </div>

                  {/* CGST and SGST (Maharashtra) */}
                  {originalFormData?.cgstRate != null && originalFormData?.sgstRate != null && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>CGST ({originalFormData.cgstRate}%):</span>
                        <span>
                          {formatCurrency(
                            (selectedComplementaryPackage.basicFees *
                              originalFormData.cgstRate) /
                              100,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>SGST ({originalFormData.sgstRate}%):</span>
                        <span>
                          {formatCurrency(
                            (selectedComplementaryPackage.basicFees *
                              originalFormData.sgstRate) /
                              100,
                          )}
                        </span>
                      </div>
                    </>
                  )}

                  {/* IGST (Outside Maharashtra) */}
                  {originalFormData?.igstRate != null && (
                    <div className="flex justify-between text-sm">
                      <span>IGST ({originalFormData.igstRate}%):</span>
                      <span>
                        {formatCurrency(
                          (selectedComplementaryPackage.basicFees *
                            originalFormData.igstRate) /
                            100,
                        )}
                      </span>
                    </div>
                  )}

                  <div className="h-px bg-slate-200 my-2"></div>

                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span className="text-primary">
                      {(() => {
                        // Calculate total based on basic fees and tax rates
                        const basicFees = Number(selectedComplementaryPackage?.basicFees) || 0;
                        let totalTax = 0;
                        
                        // Debug logging
                        console.log('Calculating total for complementary package:');
                        console.log('Basic Fees:', basicFees, 'Type:', typeof basicFees);
                        console.log('CGST Rate:', originalFormData?.cgstRate);
                        console.log('SGST Rate:', originalFormData?.sgstRate);
                        console.log('IGST Rate:', originalFormData?.igstRate);
                        
                        if (originalFormData?.igstRate != null && Number(originalFormData.igstRate) > 0) {
                          // Outside Maharashtra - IGST
                          totalTax = (basicFees * Number(originalFormData.igstRate)) / 100;
                        } else if (originalFormData?.cgstRate != null && originalFormData?.sgstRate != null) {
                          // Maharashtra - CGST + SGST
                          totalTax = (basicFees * Number(originalFormData.cgstRate)) / 100 + 
                                    (basicFees * Number(originalFormData.sgstRate)) / 100;
                        }
                        
                        console.log('Total Tax:', totalTax);
                        const totalAmount = basicFees + totalTax;
                        console.log('Total Amount:', totalAmount);
                        
                        return formatCurrency(totalAmount);
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {/* Payment Information Section */}
            {selectedComplementaryPackage && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-4">
                <h4 className="font-medium text-slate-800 mb-3">
                  Payment Information
                </h4>
                <div className="space-y-4">
                  {/* Payment Mode and Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2">Payment Mode *</Label>
                      <Select 
                        defaultValue={originalFormData?.paymentMode || "cash"}
                        onValueChange={(value) => {
                          setComplementaryPaymentData((prev: ComplementaryPaymentData) => ({
                            ...prev,
                            paymentMode: value,
                            // Reset related fields when payment mode changes
                            chequeNumber: value === "cheque" ? prev.chequeNumber : "",
                            chequeDate: value === "cheque" ? prev.chequeDate : null,
                            bankName: value === "cheque" ? prev.bankName : "",
                            neftNumber: value === "netbanking" ? prev.neftNumber : "",
                            utrNumber: value === "upi" ? prev.utrNumber : ""
                          }))
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select payment mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="netbanking">Net Banking</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Payment Date */}
                    <div>
                      <Label className="mb-2">Payment Date *</Label>
                      <DatePicker
                        value={complementaryPaymentData.paymentDate}
                        onChange={(value) => {
                          if (value) {
                            setComplementaryPaymentData((prev: ComplementaryPaymentData) => ({
                              ...prev,
                              paymentDate: value
                            }))
                          }
                        }}
                        placeholder="Select payment date"
                      />
                    </div>
                  </div>

                  {/* Conditional Payment Method Fields */}
                  {complementaryPaymentData.paymentMode === "cheque" && (
                    <div className="p-4 border rounded-md space-y-3">
                      <h3 className="text-sm font-medium">Cheque Details</h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        All fields are required for cheque payments
                      </p>
                      <div className="grid grid-cols-3 gap-4">
                        {/* Cheque Number */}
                        <div>
                          <Label className="mb-2">Cheque Number</Label>
                          <Input
                            placeholder="Enter 6-12 digit number"
                            value={complementaryPaymentData.chequeNumber || ""}
                            onChange={(e) => {
                              setComplementaryPaymentData((prev: ComplementaryPaymentData) => ({
                                ...prev,
                                chequeNumber: e.target.value
                              }))
                            }}
                          />
                          <p className="text-xs text-muted-foreground">Must be 6-12 digits</p>
                        </div>

                        {/* Cheque Date */}
                        <div>
                          <Label className="mb-2">Cheque Date</Label>
                          <DatePicker
                            value={complementaryPaymentData.chequeDate || new Date()}
                            onChange={(value) => {
                              setComplementaryPaymentData((prev: ComplementaryPaymentData) => ({
                                ...prev,
                                chequeDate: value || null
                              }))
                            }}
                            placeholder="Select cheque date"
                          />
                        </div>

                        {/* Bank Name */}
                        <div>
                          <Label className="mb-2">Bank Name</Label>
                          <Input
                            placeholder="Enter bank name"
                            value={complementaryPaymentData.bankName || ""}
                            onChange={(e) => {
                              setComplementaryPaymentData((prev: ComplementaryPaymentData) => ({
                                ...prev,
                                bankName: e.target.value
                              }))
                            }}
                          />
                          <p className="text-xs text-muted-foreground">Must be at least 3 characters</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {complementaryPaymentData.paymentMode === "netbanking" && (
                    <div className="p-4 border rounded-md space-y-3">
                      <h3 className="text-sm font-medium">Bank Transfer Details</h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        NEFT/IMPS number is required for bank transfer payments
                      </p>

                      {/* NEFT Number */}
                      <div>
                        <Label className="mb-2">NEFT/IMPS Number</Label>
                        <Input
                          placeholder="Enter NEFT/IMPS reference number"
                          value={complementaryPaymentData.neftNumber || ""}
                          onChange={(e) => {
                            setComplementaryPaymentData((prev: ComplementaryPaymentData) => ({
                              ...prev,
                              neftNumber: e.target.value
                            }))
                          }}
                        />
                        <p className="text-xs text-muted-foreground">Must be 11-18 alphanumeric characters</p>
                      </div>
                    </div>
                  )}

                  {complementaryPaymentData.paymentMode === "upi" && (
                    <div className="p-4 border rounded-md space-y-3">
                      <h3 className="text-sm font-medium">UPI Details</h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        UTR number is required for UPI payments
                      </p>

                      {/* UTR Number */}
                      <div>
                        <Label className="mb-2">UTR Number</Label>
                        <Input
                          placeholder="Enter UPI transaction reference"
                          value={complementaryPaymentData.utrNumber || ""}
                          onChange={(e) => {
                            setComplementaryPaymentData((prev: ComplementaryPaymentData) => ({
                              ...prev,
                              utrNumber: e.target.value
                            }))
                          }}
                        />
                        <p className="text-xs text-muted-foreground">Must be 12-22 alphanumeric characters</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button
              variant="outline"
              onClick={declineComplementaryMembership}
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              No, Just {isAddingVenue ? "HO" : "VENUE"}
            </Button>
            <Button
              onClick={createBothMemberships}
              disabled={isSubmitting || !selectedComplementaryPackage}
              className="min-w-[120px]"
            >
              {isSubmitting ? "Creating..." : "Yes, Add Both"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
