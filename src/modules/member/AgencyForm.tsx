import { useMemo, useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

import { get, postupload, putupload } from "@/services/apiService"; // Assuming these are correctly implemented
import { getStates } from "@/services/stateService";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DatetimePicker } from "@/components/ui/date-time-picker";
import { getCategories } from "@/services/categoryService";

import { getSubCategoriesByCategoryId } from "@/services/subCategoryService";
import { cn } from "@/lib/utils";
// import MembershipStatusAlert from "@/components/common/membership-status-alert";
import { Info, Check, ChevronsUpDown, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
// Removed Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList imports
// Removed Popover, PopoverContent, PopoverTrigger imports
// Removed Badge import
import MultipleSelector, { Option } from "@/components/ui/multiselect"; // Added import
import Validate from "@/lib/Handlevalidation";

interface Chapter {
  id: number;
  name: string;
  location: {
    id: number;
    location: string;
  };
  zones: Array<{
    id: number;
    name: string;
  }>;
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
}

interface State {
  id: number;
  name: string;
}

export type MemberFormProps = {
  mode: "create" | "edit";
};

type BaseMemberFormValues = {
  memberName: string;
  chapterId: number;
  category: string;
  businessCategory: number[];
  gender: string;
  dateOfBirth: Date | null;
  mobile1: string;
  mobile2: string | null;
  gstNo?: string;
  organizationName: string;
  businessTagline?: string;
  organizationMobileNo: string;
  organizationLandlineNo?: string;
  organizationEmail?: string;
  orgAddressLine1: string;
  orgAddressLine2?: string;
  orgLocation: string;
  orgPincode: string;
  organizationWebsite?: string;
  organizationDescription?: string;
  addressLine1: string;
  location: string;
  addressLine2?: string;
  pincode: string;
  specificAsk?: string;
  specificGive?: string;
  clients?: string;
  profilePicture?: File;
  coverPhoto?: File;
  logo?: File;
  email: string;
  stateId?: number;
};

type CreateMemberFormValues = BaseMemberFormValues & {
  password: string;
  verifyPassword: string;
};

type EditMemberFormValues = BaseMemberFormValues;

type MemberFormValues = CreateMemberFormValues | EditMemberFormValues;

const createMemberSchema = (mode: "create" | "edit") => {
  const baseSchema = z.object({
    // Date of birth is required for new members but optional for edits
    memberName: z.string().min(1, "Name is required"),
    chapterId: z
      .number({ required_error: "Chapter is required" })
      .int()
      .min(1, "Chapter is required"),
    category: z.string().min(1, "Business category is required"),
    businessCategory: z.any().optional(), // Revert to standard optional array
    gender: z.string().min(1, "Gender is required"),
    dateOfBirth: z.preprocess(
      (arg) => {
        if (!arg || arg === "") return null; // Handle empty string or falsy to null
        if (typeof arg === "string") {
          const d = new Date(arg);
          return Number.isNaN(d.getTime()) ? null : d; // Ensure valid date, else null
        }
        return arg;
      },
      z
        .date({ invalid_type_error: "Invalid date format for Date of Birth" })
        .nullable() // Allows null
        .refine(
          (date) => {
            if (mode === "create") {
              return date !== null; // Required in create mode
            }
            return true; // Optional in edit mode (already nullable)
          },
          {
            message: "Date of birth is required",
          }
        )
        .refine(
          (date) => {
            if (!date) return true; // Skip age validation if null
            const today = new Date();
            const eighteenYearsAgo = new Date(
              today.getFullYear() - 18,
              today.getMonth(),
              today.getDate()
            );
            return date <= eighteenYearsAgo;
          },
          { message: "Must be at least 18 years old" }
        )
    ),
    mobile1: z
      .string()
      .min(10, "Mobile number must be 10 digits")
      .max(10, "Mobile number must be 10 digits"),
    mobile2: z // Type: string | null
      .string()
      .min(10, "Mobile number must be 10 digits")
      .max(10, "Mobile number must be 10 digits")
      .nullable()
      .or(z.literal("")), // Allows empty string, effectively making it nullable
    gstNo: z.preprocess(
      // Type: string | undefined
      (val) => (val === "" || val === null ? undefined : val),
      z
        .string()
        .regex(
          /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/,
          "Invalid GST number format. Example: 27AAPFU0939F1ZV"
        )
        .optional()
    ),
    organizationName: z.string().min(1, "Organization name is required"),
    businessTagline: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.string().optional()
    ),
    organizationMobileNo: z
      .string()
      .min(10, "Mobile number must be 10 digits")
      .max(10, "Mobile number must be 10 digits"),
    organizationLandlineNo: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.string().optional()
    ),
    organizationEmail: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.string().email("Invalid email address").optional()
    ),
    orgAddressLine1: z.string().min(1, "Address is required"),
    orgAddressLine2: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.string().optional()
    ),
    orgLocation: z.string().min(1, "Location is required"),
    orgPincode: z
      .string()
      .length(6, "Pincode must be 6 digits")
      .regex(/^\d{6}$/, "Invalid pincode format"),
    organizationWebsite: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.string().url("Invalid URL").optional()
    ),
    organizationDescription: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.string().optional()
    ),
    addressLine1: z.string().min(1, "Address is required"),
    location: z.string().min(1, "Location is required"),
    addressLine2: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.string().optional()
    ),
    pincode: z
      .string()
      .length(6, "Pincode must be 6 digits")
      .regex(/^\d{6}$/, "Invalid pincode format"),
    specificAsk: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.string().optional()
    ),
    specificGive: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.string().optional()
    ),
    clients: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.string().optional()
    ),
    profilePicture: z.preprocess(
      (val) => (val === null ? undefined : val),
      z.instanceof(File).optional()
    ),
    coverPhoto: z.preprocess(
      (val) => (val === null ? undefined : val),
      z.instanceof(File).optional()
    ),
    logo: z.preprocess(
      (val) => (val === null ? undefined : val),
      z.instanceof(File).optional()
    ),
    email: z.string().email("Invalid email format"),
    stateId: z.preprocess(
      (val) =>
        val === null ||
        val === "" ||
        Number.isNaN(Number(val)) ||
        Number(val) === 0
          ? undefined
          : Number(val),
      z.number().int().positive().optional()
    ),
  });

  if (mode === "create") {
    return baseSchema
      .extend({
        password: z.string().min(6, "Password must be at least 6 characters"),
        verifyPassword: z
          .string()
          .min(6, "Password must be at least 6 characters"),
      })
      .refine((data) => data.password === data.verifyPassword, {
        message: "Passwords must match",
        path: ["verifyPassword"],
      });
  }
  return baseSchema;
};

// Environment variable for the API base URL (recommended)
// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://15.207.30.113
// For this example, we'll use the hardcoded one if not available.
const IMAGE_BASE_URL = "http://15.207.30.113"; // Replace with your actual image base URL

export default function MemberForm({ mode }: MemberFormProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [existingProfilePics, setExistingProfilePics] = useState<{
    profilePicture?: string;
    coverPhoto?: string;
    logo?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [, setFormattedPhone] = useState<string | undefined>();
  const [visitorId, setVisitorId] = useState<string>("");

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );

  const { data: categoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await getCategories();
      return response.categories || ([] as Category[]);
    },
  });

  // Fetch states from the API
  const { data: states = [], isLoading: loadingStates } = useQuery({
    queryKey: ["states"],
    queryFn: async () => {
      const response = await getStates();
      return response.states || ([] as State[]);
    },
  });

  const { data: subcategories = [], isLoading: loadingSubcategories } =
    useQuery({
      queryKey: ["subcategories", selectedCategoryId],
      queryFn: async () => {
        if (!selectedCategoryId) return [] as SubCategory[];
        return await getSubCategoriesByCategoryId(selectedCategoryId);
      },
      enabled: !!selectedCategoryId,
    });

  useEffect(() => {
    console.log("Passs", subcategories);
  }, [subcategories]);

  const memberSchema = useMemo(() => createMemberSchema(mode), [mode]);
  type FormValues = z.infer<typeof memberSchema>;

  const [existingImageUrls, setExistingImageUrls] = useState<(string | null)[]>(
    [null, null, null]
  );

  const { data: chapters = [], isLoading: loadingChapters } = useQuery<
    Chapter[]
  >({
    queryKey: ["chapters"],
    queryFn: () =>
      get("/chapters").then((response) => {
        // Ensure response and response.chapters are as expected
        const rawChapters = response?.chapters;
        if (Array.isArray(rawChapters)) {
          return rawChapters.map((chapter) => ({
            ...chapter,
            // Ensure chapter.zones is always an array
            zones: Array.isArray(chapter.zones) ? chapter.zones : [],
          }));
        }
        return []; // Return empty array if data is not in expected format
      }),
  });

  const visitorData = useMemo(() => {
    if (mode === "create") {
      try {
        const savedData = localStorage.getItem("visitorToMember");
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          localStorage.removeItem("visitorToMember");
          return parsedData;
        }
      } catch (error) {
        console.error("Error parsing visitor data:", error);
      }
    }
    return null;
  }, [mode]);

  const form = useForm<FormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      memberName: visitorData?.memberName || "",
      chapterId: visitorData?.chapterId || undefined,
      category: visitorData?.category || "",
      businessCategory: visitorData?.businessCategory
        ? Array.isArray(visitorData.businessCategory)
          ? visitorData.businessCategory
          : typeof visitorData.businessCategory === "string" &&
            visitorData.businessCategory.includes(",")
          ? visitorData.businessCategory.split(",").map(Number)
          : visitorData.businessCategory
          ? [Number(visitorData.businessCategory)]
          : []
        : [],
      gender: visitorData?.gender || "",
      dateOfBirth: visitorData?.dateOfBirth
        ? new Date(visitorData.dateOfBirth)
        : null,
      mobile1: visitorData?.mobile1 || "",
      mobile2: visitorData?.mobile2 || null,
      gstNo: "",
      organizationName: "",
      businessTagline: "",
      organizationMobileNo: visitorData?.mobile1 || "",
      organizationLandlineNo: "",
      organizationEmail: "",
      orgAddressLine1: visitorData?.addressLine1 || "",
      orgAddressLine2: visitorData?.addressLine2 || "",
      orgLocation: visitorData?.location || "",
      orgPincode: visitorData?.pincode || "",
      stateId: 0,
      organizationWebsite: "",
      organizationDescription: "",
      addressLine1: visitorData?.addressLine1 || "",
      location: visitorData?.location || "",
      addressLine2: visitorData?.addressLine2 || "",
      pincode: visitorData?.pincode || "",
      specificAsk: "",
      specificGive: "",
      clients: "",
      profilePicture: undefined,
      coverPhoto: undefined,
      logo: undefined,
      email: visitorData?.email || "",
      ...(mode === "create" ? { password: "", verifyPassword: "" } : {}),
    } as FormValues,
  });

  const { reset } = form;

  const { data: membershipStatus } = useQuery({
    queryKey: ["membershipStatus", id],
    queryFn: async () => {
      const data = await get(`/api/members/${id}/membership-status`);
      return data;
    },
    enabled: mode === "edit" && !!id,
  });

  const { isLoading: loadingMember } = useQuery({
    queryKey: ["member", id],
    queryFn: async () => {
      const apiData = await get(`/api/members/${id}`);
      const { profilePicture, coverPhoto, logo, chapter, ...restApiData } =
        apiData;

      const apiImagePaths = [profilePicture, coverPhoto, logo];
      const processedImagePaths = apiImagePaths.map((path) => {
        if (
          path &&
          typeof path === "string" &&
          (path.startsWith("uploads/") || path.startsWith("/uploads/"))
        ) {
          if (/\.(jpeg|jpg|gif|png|webp)$/i.test(path)) {
            return path;
          }
        }
        return null;
      });
      setExistingImageUrls(processedImagePaths);

      if (categoriesData && apiData.category) {
        const categoryObj = categoriesData.find(
          (cat) => cat.name === apiData.category
        );
        if (categoryObj) {
          setSelectedCategoryId(categoryObj.id);
        }
      }

      const chapterId = chapter?.id || apiData.chapterId;
      if (chapterId) {
        setSelectedChapterId(chapterId);
      }

      reset({
        ...restApiData,
        chapterId: chapterId,
        category: apiData.category || "",
        businessCategory: apiData.businessCategory
          ? Array.isArray(apiData.businessCategory)
            ? apiData.businessCategory
            : typeof apiData.businessCategory === "string" &&
              apiData.businessCategory.includes(",")
            ? apiData.businessCategory.split(",").map(Number)
            : apiData.businessCategory
            ? [Number(apiData.businessCategory)]
            : []
          : [],
        dateOfBirth: apiData.dateOfBirth ? new Date(apiData.dateOfBirth) : null,
        profilePicture: undefined,
        coverPhoto: undefined,
        logo: undefined,
        mobile2: apiData.mobile2 || null,
        organizationEmail: apiData.organizationEmail || "",
        organizationWebsite: apiData.organizationWebsite || "",
      } as FormValues);

      return apiData;
    },
    enabled: mode === "edit" && !!id,
  });

  const createMutation = useMutation<any, Error, MemberFormValues>({
    mutationFn: async (data: MemberFormValues) => {
      const formData = new FormData();

      Object.keys(data).forEach((key) => {
        const value = data[key as keyof MemberFormValues];
        if (key === "businessCategory" && Array.isArray(value)) {
          formData.append(key, value.join(","));
        } else if (value instanceof File) {
          formData.append(key, value);
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      return postupload("/api/members", formData);
    },
    onSuccess: (responseData) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member created successfully!");
      const memberId = responseData?.data?.id || responseData?.id;

      if (memberId) {
        navigate(`/memberships/add?memberId=${memberId}`);
      } else {
        console.error(
          "Created member ID not found in response, navigating to members list.",
          responseData
        );
        toast.error(
          "Could not retrieve new member ID. Please add membership manually."
        );
        navigate("/members");
      }
    },
    onError: (error: any) => {
      Validate(error, form.setError);
      toast.error(error.response?.data?.message || "Failed to create member");
    },
  });

  const updateMutation = useMutation<any, Error, MemberFormValues>({
    mutationFn: (data: MemberFormValues) => {
      const formData = new FormData();
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = (data as any)[key];
          if (value instanceof File) {
            formData.append(key, value);
          } else if (value instanceof Date) {
            formData.append(key, value.toISOString().split("T")[0]);
          } else if (Array.isArray(value)) {
            // Handle arrays specially
            if (key === "businessCategory") {
              // Backend expects businessCategory as a comma-separated string
              formData.append(key, value.join(","));
            } else {
              // For other arrays, use JSON stringify
              formData.append(key, JSON.stringify(value));
            }
          } else if (value !== null && value !== undefined) {
            formData.append(key, String(value));
          }
        }
      }
      return putupload(`/api/members/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["member", id] });
      toast.success("Member updated successfully");
      navigate("/members");
    },
    onError: (error: any) => {
      Validate(error, form.setError);
      toast.error(error.response?.data?.message || "Failed to update member");
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    console.log("Form errors:", form.formState.errors);
    if (Object.keys(form.formState.errors).length > 0) {
      toast.error("Please correct the form errors before submitting.");
      return;
    }
    if (mode === "create") {
      createMutation.mutate(data as CreateMemberFormValues);
    } else {
      updateMutation.mutate(data as EditMemberFormValues);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(
    null
  );

  const { data: chapterRoles, isLoading: loadingChapterRoles } = useQuery({
    queryKey: ["chapterRoles", selectedChapterId],
    queryFn: async () => {
      if (!selectedChapterId) return null;
      const data = await get(`/api/chapter-roles/chapter/${selectedChapterId}`);
      return data;
    },
    enabled: !!selectedChapterId,
  });

  return (
    <Card className="mx-auto my-8 ">
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Create New Member" : "Edit Member"}
        </CardTitle>
        <CardDescription>
          {mode === "create"
            ? "Fill out the form to create a member profile."
            : "Update the member details below."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* {mode === "edit" && membershipStatus && (
            <div className="mb-6">
              <MembershipStatusAlert
                isActive={membershipStatus.active}
                expiryDate={membershipStatus.earlierExpiryDate}
                expiryType={membershipStatus.expiryType}
                daysUntilExpiry={membershipStatus.daysUntilExpiry}
              />
            </div>
          )} */}

          <Card className="mb-6 shadow-none border-0">
            <CardHeader>
              <CardTitle className="text-lg">Basic Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <FormField
                  control={form.control}
                  name="memberName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Member Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter member's full name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Gender <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value} // Ensure value is controlled
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="chapterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Chapter <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(v) => {
                          const chapterId = Number(v);
                          field.onChange(chapterId);
                          setSelectedChapterId(chapterId);
                        }}
                        disabled={loadingChapters}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a chapter" />
                        </SelectTrigger>
                        <SelectContent>
                          {chapters.map((chapter) => (
                            <SelectItem
                              key={chapter.id}
                              value={String(chapter.id)}
                            >
                              {chapter.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      {!loadingChapterRoles &&
                        chapterRoles &&
                        chapterRoles.length > 0 && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center cursor-help">
                                    <Info className="h-4 w-4 mr-1" />
                                    <span>Chapter Leadership Info</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="w-80 p-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-center mb-2">
                                      Chapter Leadership
                                    </h4>
                                    {(() => {
                                      const leadershipRoles =
                                        chapterRoles.filter(
                                          (role: any) =>
                                            role.role
                                              .toLowerCase()
                                              .includes("director") ||
                                            role.role
                                              .toLowerCase()
                                              .includes("secretary") ||
                                            role.role
                                              .toLowerCase()
                                              .includes("president")
                                        );

                                      if (leadershipRoles.length === 0) {
                                        return (
                                          <div className="text-center text-sm text-muted-foreground">
                                            No leadership roles assigned
                                          </div>
                                        );
                                      }

                                      return leadershipRoles.map(
                                        (role: any) => (
                                          <div
                                            key={role.id}
                                            className="flex justify-between"
                                          >
                                            <span className="font-medium">
                                              {role.role}:
                                            </span>
                                            <span>
                                              {role.member?.memberName ||
                                                "Unassigned"}
                                            </span>
                                          </div>
                                        )
                                      );
                                    })()}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Business Category{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          const category = categoriesData?.find(
                            (cat) => cat.name === value
                          );
                          setSelectedCategoryId(category?.id || null);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select business category" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingCategories ? (
                            <SelectItem value="loading">
                              Loading categories...
                            </SelectItem>
                          ) : (
                            Array.isArray(categoriesData) &&
                            categoriesData.map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.name}
                              >
                                {category.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="businessCategory"
                  render={({ field }) => {
                    const subCategoryOptions: Option[] = useMemo(() => {
                      if (!Array.isArray(subcategories)) return [];
                      return subcategories.map((sub) => ({
                        value: String(sub.id),
                        label: sub.name,
                      }));
                    }, [subcategories]);

                    const selectedOptions: Option[] = useMemo(() => {
                      if (!field.value) return [];
                      return subCategoryOptions.filter((option) =>
                        field.value.includes(Number(option.value))
                      );
                    }, [field.value, subCategoryOptions]);

                    return (
                      <FormItem>
                        <FormLabel>Business Subcategories</FormLabel>
                        <MultipleSelector
                          className="min-w-full"
                          options={subCategoryOptions}
                          value={selectedOptions}
                          placeholder={
                            loadingSubcategories
                              ? "Loading subcategories..."
                              : selectedCategoryId
                              ? "Select business subcategories"
                              : "Select main category first"
                          }
                          emptyIndicator={
                            <p className="text-center text-sm">
                              {selectedCategoryId && !loadingSubcategories
                                ? "No subcategories found for the selected main category."
                                : !selectedCategoryId
                                ? "Please select a main category to see subcategories."
                                : "Searching..."}
                            </p>
                          }
                          onChange={(selectedOpts: Option[]) => {
                            const selectedIds = selectedOpts
                              .map((opt) => Number(opt.value))
                              .filter((id) => !Number.isNaN(id));
                            field.onChange(selectedIds);
                          }}
                          disabled={!selectedCategoryId || loadingSubcategories}
                          hidePlaceholderWhenSelected={false}
                        />
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => {
                    // Calculate max date (18 years ago from today)
                    const today = new Date();
                    const maxDate = new Date(
                      today.getFullYear() - 18,
                      today.getMonth(),
                      today.getDate()
                    )
                      .toISOString()
                      .split("T")[0];

                    return (
                      <FormItem className="flex flex-col">
                        <FormLabel>
                          Date of Birth <span className="text-red-500">*</span>
                        </FormLabel>
                        <Input
                          type="date"
                          value={
                            field.value
                              ? new Date(field.value)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) => {
                            field.onChange(
                              e.target.value ? new Date(e.target.value) : null
                            );
                          }}
                          max={maxDate}
                          className="w-full"
                        />
                        <FormMessage />
                        <FormDescription>
                          Member must be at least 18 years old. If you wish to
                          Not Provide a Dob enter DOB as 01-01-0001
                        </FormDescription>
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="mobile1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Mobile 1 <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="10-digit mobile" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobile2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile 2 (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Optional 10-digit mobile"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 shadow-none border-0">
            <CardHeader>
              <CardTitle className="text-lg">Business Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Organization Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter organization name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gstNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Number (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="e.g., 27AAPFU0939F1ZV"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessTagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Tagline (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="e.g., Quality Solutions Delivered"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                <FormField
                  control={form.control}
                  name="organizationMobileNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Organization Mobile{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="10-digit mobile" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organizationLandlineNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Landline (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Include STD code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organizationEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          type="email"
                          placeholder="org@example.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                <FormField
                  control={form.control}
                  name="orgAddressLine1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Address Line 1 <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Building, Street" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="orgAddressLine2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2 (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Area, Landmark"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        State <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                          value={field.value?.toString()}
                          disabled={loading || loadingStates}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a state" />
                          </SelectTrigger>
                          <SelectContent>
                            {states?.map((state: State) => (
                              <SelectItem
                                key={state.id}
                                value={state.id.toString()}
                              >
                                {state.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                <FormField
                  control={form.control}
                  name="orgLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Organization Location{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="City/Town" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="orgPincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Organization Pincode{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="6-digit pincode" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organizationWebsite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          type="text"
                          placeholder="www.example.com / https://example.com"
                          onChange={(e) => {
                            let value = e.target.value;
                            if (
                              value.startsWith("www.") &&
                              !value.startsWith("http")
                            ) {
                              value = "https://" + value;
                            }
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="organizationDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        max={500}
                        maxLength={500}
                        value={field.value || ""}
                        placeholder="Briefly describe the organization"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="mb-6 shadow-none border-0">
            <CardHeader>
              <CardTitle className="text-lg">Member Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <FormField
                control={form.control}
                name="addressLine1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Address Line 1 <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="House No, Street" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="addressLine2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 2 (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="Area, Landmark"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Location <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="City/Town" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Pincode <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="6-digit pincode" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 shadow-none border-0">
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <FormField
                control={form.control}
                name="specificAsk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Ask (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="What are you looking for?"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="specificGive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Give (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="What can you offer?"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Clients (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="e.g., ABC Corp, XYZ Ltd."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="mb-6 shadow-none border-0">
            <CardHeader>
              <CardTitle className="text-lg">Profile Pictures</CardTitle>
              <p className="text-xs text-muted-foreground">
                Compatible: JPEG, PNG | Max: 5MB | Recommended: 1000x1000px (1:1
                ratio)
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  // Define an array for image field configuration
                  { name: "profilePicture", label: "Profile Picture" },
                  { name: "coverPhoto", label: "Cover Photo" },
                  { name: "logo", label: "Logo" },
                ].map((imageField, index) => {
                  const fieldName = imageField.name as keyof FormValues;
                  const relativeImagePath = existingImageUrls[index]; // Assuming existingImageUrls aligns with this order
                  console.log("Relative path", relativeImagePath);
                  const displayUrl = relativeImagePath
                    ? relativeImagePath.startsWith("http")
                      ? relativeImagePath
                      : `${IMAGE_BASE_URL}/${relativeImagePath.replace(
                          /^\/+/,
                          ""
                        )}`
                    : null;
                  console.log("display url", displayUrl);
                  const currentFile = form.watch(fieldName) as File | undefined;
                  console.log("Current file for", fieldName, ":", currentFile); // Added log for currentFile

                  return (
                    <FormField
                      control={form.control}
                      name={fieldName}
                      key={fieldName}
                      render={({ field }) => (
                        <FormItem className="flex flex-col items-center">
                          <FormLabel className="mb-2">
                            {imageField.label}
                          </FormLabel>
                          <FormControl>
                            <div className="w-40 h-40 border rounded-md flex items-center justify-center overflow-hidden relative group">
                              <Input
                                type="file"
                                accept="image/jpeg,image/png"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.size > 5 * 1024 * 1024) {
                                      // 5MB limit
                                      form.setError(fieldName, {
                                        type: "manual",
                                        message: "File size exceeds 5MB.",
                                      });
                                      e.target.value = ""; // Clear the input
                                    } else {
                                      field.onChange(file);
                                    }
                                  } else {
                                    field.onChange(undefined); // Handle case where selection is cancelled
                                  }
                                }}
                              />
                              {currentFile || displayUrl ? (
                                <img
                                  src={displayUrl}
                                  alt={imageField.label}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-xs text-muted-foreground">
                                  Click to upload
                                </div>
                              )}
                              {(currentFile || displayUrl) && (
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 w-6 h-6"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    field.onChange(undefined); // Clear the file
                                    // If there was an existing image, we might need to tell the backend to remove it
                                    // This depends on your backend API design for updates
                                    if (relativeImagePath) {
                                      // Potentially set a flag like form.setValue(`remove_${fieldName}`, true);
                                      // Or handle this in the FormData preparation
                                      setExistingImageUrls((prev) => {
                                        const newUrls = [...prev];
                                        newUrls[index] = null;
                                        return newUrls;
                                      });
                                    }
                                    const fileInput =
                                      e.currentTarget.parentElement?.querySelector(
                                        'input[type="file"]'
                                      ) as HTMLInputElement;
                                    if (fileInput) fileInput.value = "";
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage className="mt-1" />
                          {form.formState.errors[fieldName] && (
                            <p className="text-xs text-red-500 mt-1">
                              {form.formState.errors[
                                fieldName
                              ]?.message?.toString()}
                            </p>
                          )}
                        </FormItem>
                      )}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 shadow-none border-0">
            <CardHeader>
              <CardTitle className="text-lg">Login Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Email <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="user@example.com"
                        disabled={mode === "edit"}
                        className={mode === "edit" ? "bg-muted" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {mode === "create" && (
                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Password <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            placeholder="Min. 6 characters"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="verifyPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Confirm Password{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            placeholder="Retype password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <CardFooter className="flex justify-end space-x-4 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/members")}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || (mode === "edit" && loadingMember)}
            >
              {isLoading
                ? "Saving..."
                : mode === "create"
                ? "Create Member"
                : "Update Member"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

export const DatetimePickerExample = () => {
  return (
    <DatetimePicker
      format={[
        ["months", "days", "years"],
        ["hours", "minutes", "am/pm"],
      ]}
    />
  );
};
