import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, put } from "@/services/apiService";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

// Define form schema with Zod
const formSchema = z
  .object({
    isCrossChapter: z.boolean().default(false),
    meetingId: z.number().int("Meeting ID is required"),

    // Fields required for cross-chapter visitors
    chapterId: z.number().int("Chapter ID is required").nullable().optional(),
    invitedById: z
      .number()
      .int("Invited by member ID is required")
      .nullable()
      .optional(),

    // Fields required for non-cross-chapter visitors
    name: z.string().optional(),
    email: z.string().optional().nullable(), // Removed email validation
    gender: z.string().optional(),
    dateOfBirth: z.date().optional().nullable(),
    mobile1: z.string().optional(),
    mobile2: z.string().optional().nullable(),
    chapter: z.string().optional(),
    category: z.string().optional(),
    businessDetails: z.string().optional().nullable(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional().nullable(),
    city: z.string().optional(),
    pincode: z.string().optional(),
    status: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Different validation rules based on cross-chapter flag
    if (data.isCrossChapter) {
      // For cross-chapter visitors, only need chapter ID and invited by
      if (!data.chapterId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Home Chapter is required for cross-chapter visitors",
          path: ["chapterId"],
        });
      }
      if (!data.invitedById) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invited By is required for cross-chapter visitors",
          path: ["invitedById"],
        });
      }
    } else {
      // For non-cross-chapter visitors, validate all required fields
      if (!data.name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Name is required",
          path: ["name"],
        });
      }
      if (!data.gender) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Gender is required",
          path: ["gender"],
        });
      }
      if (!data.mobile1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Primary mobile number is required",
          path: ["mobile1"],
        });
      }
      if (!data.chapter) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Chapter name is required",
          path: ["chapter"],
        });
      }
      if (!data.category) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Category is required",
          path: ["category"],
        });
      }
      if (!data.addressLine1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Address line 1 is required",
          path: ["addressLine1"],
        });
      }
      if (!data.city) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "City is required",
          path: ["city"],
        });
      }
      if (!data.pincode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pincode is required",
          path: ["pincode"],
        });
      }
      if (!data.status) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Status is required",
          path: ["status"],
        });
      }
    }
  });

type FormData = z.infer<typeof formSchema>;

interface VisitorFormProps {
  isEditing?: boolean;
}

const VisitorForm: React.FC<VisitorFormProps> = ({ isEditing = false }) => {
  const { meetingId, visitorId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      gender: "",
      dateOfBirth: null,
      mobile1: "",
      mobile2: "",
      isCrossChapter: false,
      meetingId: meetingId ? parseInt(meetingId) : undefined,
      chapterId: null,
      chapter: "",
      invitedById: null,
      category: "",
      businessDetails: "",
      addressLine1: "",
      city: "",
      addressLine2: "",
      pincode: "",
      status: "Invited",
    },
    mode: "onChange",
  });

  // Get logged in user data
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setLoggedInUser(userData);
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  // Fetch meeting details
  const { data: meetingData } = useQuery({
    queryKey: ["chaptermeeting", meetingId],
    queryFn: () => get(`/chapter-meetings/${meetingId}`),
    enabled: !!meetingId,
    onSuccess: (data) => {
      console.log("Meeting Data Loaded:", data);
      console.log("Meeting Chapter ID:", data.chapterId);
      console.log("Meeting Chapter Name:", data.chapter?.name);
    },
  });

  // Fetch all members for the invited by dropdown
  const { data: membersData } = useQuery({
    queryKey: ["members"],
    queryFn: () => get(`/api/members?active=true`),
  });

  // Fetch chapters for the chapter dropdown
  const { data: chaptersData } = useQuery({
    queryKey: ["chapters"],
    queryFn: () => get(`/chapters`),
  });

  // Filter out the meeting's chapter from available chapters for cross-chapter selection
  const filteredChapters = React.useMemo(() => {
    if (!chaptersData?.chapters || !meetingData) {
      console.log("Missing data for filtering:", {
        hasChaptersData: !!chaptersData?.chapters,
        hasMeetingData: !!meetingData,
      });
      return [];
    }

    // Explicitly exclude the chapter that the meeting belongs to
    console.log("Meeting Chapter ID:", meetingData.chapterId);
    console.log("Meeting Chapter:", meetingData.chapter);
    console.log("All Chapters:", chaptersData.chapters);
    console.log(
      "All Chapter IDs:",
      chaptersData.chapters.map((c) => c.id)
    );

    // Convert IDs to numbers for proper comparison
    const meetingChapterId = Number(meetingData.chapterId);

    const filtered = chaptersData.chapters.filter((chapter: any) => {
      const chapterId = Number(chapter.id);
      console.log(
        `Comparing chapter ${chapter.name} (ID: ${chapterId}) with meeting chapter ID: ${meetingChapterId}`
      );
      return chapterId !== meetingChapterId;
    });

    console.log("Filtered Chapters:", filtered);
    console.log(
      "Filtered Chapter IDs:",
      filtered.map((c) => c.id)
    );
    return filtered;
  }, [chaptersData, meetingData]);

  // Fetch categories for the category dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => get(`/categories`),
  });

  // Fetch visitor data if editing
  const { data: visitorData, isLoading: isVisitorLoading } = useQuery({
    queryKey: ["visitor", visitorId],
    queryFn: () => get(`/visitors/${visitorId}`),
    enabled: isEditing && !!visitorId,
  });

  // Add an effect to watch for changes to invitedById
  useEffect(() => {
    // Watch the invitedById field
    const subscription = form.watch((value, { name }) => {
      if (name === 'invitedById' && value.invitedById) {
        console.log("invitedById changed:", value.invitedById, typeof value.invitedById);
        
        // Ensure it's a number to guarantee consistency
        if (typeof value.invitedById === 'string') {
          form.setValue('invitedById', parseInt(value.invitedById));
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (isEditing && visitorData) {
      // Format the data before setting form values
      const formattedData = {
        ...visitorData,
        dateOfBirth: visitorData.dateOfBirth
          ? new Date(visitorData.dateOfBirth)
          : null,
        meetingId: visitorData.meetingId,
        chapterId: visitorData.chapterId,
        // Ensure invitedById is a proper number or null
        invitedById: visitorData.invitedById !== undefined && 
                     visitorData.invitedById !== null && 
                     !isNaN(Number(visitorData.invitedById))
          ? Number(visitorData.invitedById)
          : null,
        isCrossChapter: !!visitorData.isCrossChapter,
      };

      console.log("Setting visitor data:", formattedData);
      console.log("invitedById type:", typeof formattedData.invitedById);
      console.log("invitedById value:", formattedData.invitedById);
      
      // Reset the form with the formatted data
      form.reset(formattedData);
      
      // If this is a cross-chapter visitor, ensure invitedById is set correctly after reset
      if (formattedData.isCrossChapter) {
        setTimeout(() => {
          // Only set the value if it's a valid number
          if (formattedData.invitedById !== null && !isNaN(formattedData.invitedById)) {
            form.setValue('invitedById', formattedData.invitedById);
            console.log("Form values after explicit setValue:", form.getValues());
          }
        }, 100);
      }
      
      // Log form value after reset
      setTimeout(() => {
        console.log("Form values after reset:", form.getValues());
        console.log("invitedById in form:", form.getValues()?.invitedByMember?.id);
      }, 200);
    } else if (!isEditing && meetingData && !form.formState.isDirty) {
      // For new visitors, pre-populate the meeting's chapter
      form.setValue("chapter", meetingData.chapter?.name || "");
      form.setValue("chapterId", meetingData.chapterId);
    }
  }, [visitorData, meetingData, form, isEditing]);

  // Create visitor mutation
  const createMutation = useMutation({
    mutationFn: (data: FormData) => post(`/visitors`, data),
    onSuccess: () => {
      toast.success("Visitor created successfully");
      queryClient.invalidateQueries({ queryKey: ["visitors"] });
      navigate(`/chaptermeetings/${meetingId}/visitors`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create visitor");
    },
  });

  // Update visitor mutation
  const updateMutation = useMutation({
    mutationFn: (data: FormData) => put(`/visitors/${visitorId}`, data),
    onSuccess: () => {
      toast.success("Visitor updated successfully");
      queryClient.invalidateQueries({ queryKey: ["visitors"] });
      queryClient.invalidateQueries({ queryKey: ["visitor", visitorId] });
      navigate(`/chaptermeetings/${meetingId}/visitors`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update visitor");
    },
  });

  // Form submission
  const onSubmit = (data: FormData) => {
    setIsLoading(true);

    // Ensure meetingId is set from URL params
    if (meetingId && !data.meetingId) {
      data.meetingId = parseInt(meetingId);
    }

    // For non-cross-chapter visitors, set the chapter to the meeting's chapter
    if (!data.isCrossChapter && meetingData) {
      data.chapter = meetingData.chapter?.name || "";
      data.chapterId = meetingData.chapterId;
    }

    try {
      if (isEditing) {
        updateMutation.mutate(data);
      } else {
        createMutation.mutate(data);
      }
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading states
  if ((isEditing && isVisitorLoading) || (!meetingData && meetingId)) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="mr-2 h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-2 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        {isEditing ? "Edit Visitor" : "Add New Visitor"}
      </h1>

      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle>
            {isEditing ? "Update Visitor Information" : "Visitor Information"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Details Section */}
              <div>
                <h3 className="text-lg font-medium">Basic Details</h3>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="meetingId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chapter Meeting Date</FormLabel>
                        <Select
                          disabled={true}
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select meeting date" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {meetingData && (
                              <SelectItem value={meetingData.id.toString()}>
                                {format(new Date(meetingData.date), "PPP")} -{" "}
                                {meetingData.meetingTitle}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isCrossChapter"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-end space-x-2 space-y-0 mt-8">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked) {
                                // Clear fields not needed for cross-chapter
                                form.setValue("name", "");
                                form.setValue("email", "");
                                form.setValue("gender", "");
                                form.setValue("dateOfBirth", null);
                                form.setValue("mobile1", "");
                                form.setValue("mobile2", "");
                                form.setValue("category", "");
                                form.setValue("businessDetails", "");
                                form.setValue("addressLine1", "");
                                form.setValue("addressLine2", "");
                                form.setValue("city", "");
                                form.setValue("pincode", "");
                                form.setValue("status", "");
                              } else {
                                // Clear chapter ID when switching back and set to meeting's chapter
                                form.setValue(
                                  "chapterId",
                                  meetingData?.chapterId || null
                                );
                                form.setValue(
                                  "chapter",
                                  meetingData?.chapter?.name || ""
                                );
                                form.setValue("invitedById", null);
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel>Cross Chapter Visitor</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* When Cross Chapter Visitor is toggled, only show Chapter and Member fields */}
                  {form.watch("isCrossChapter") ? (
                    <>
                      <FormField
                        control={form.control}
                        name="chapterId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Chapter</FormLabel>
                            <Select
                              onValueChange={(value) =>
                                field.onChange(parseInt(value))
                              }
                              value={field.value?.toString() || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select home chapter" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredChapters.length > 0 ? (
                                  filteredChapters.map((chapter: any) => {
                                    console.log(
                                      `Rendering chapter option: ${chapter.name} (ID: ${chapter.id})`
                                    );
                                    return (
                                      <SelectItem
                                        key={chapter.id}
                                        value={chapter.id.toString()}
                                      >
                                        {chapter.name}
                                      </SelectItem>
                                    );
                                  })
                                ) : (
                                  <SelectItem value="no-chapters" disabled>
                                    No other chapters available
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
              
                      <FormField
                        control={form.control}
                        name="invitedById"
                        render={({ field }) => {
                          console.log("Cross-chapter invitedById field:", field.value, typeof field.value);
                          
                          // Ensure field.value is properly normalized for comparison
                          let normalizedFieldValue = null;
                          if (field.value !== null && field.value !== undefined) {
                            const parsedValue = Number(field.value);
                            normalizedFieldValue = !isNaN(parsedValue) ? parsedValue : null;
                          }
                          
                          // Find selected member
                          const selectedMember = membersData?.members?.find(
                            (m: any) => normalizedFieldValue !== null && (
                              Number(m.id) === normalizedFieldValue
                            )
                          );
                          console.log("Selected member:", selectedMember);
                          console.log("Selected member ID:", selectedMember?.id);
                          
                          return (
                          <FormItem>
                            <FormLabel>Invited By</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                console.log("Selected value:", value, typeof value);
                                field.onChange(parseInt(value));
                              }}
                              value={normalizedFieldValue !== null ? normalizedFieldValue.toString() : ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select member" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {membersData?.members?.map((member: any) => {
                                  console.log("Member option:", member.id, member.memberName);
                                  return (
                                  <SelectItem
                                    key={member.id}
                                    value={member.id.toString()}
                                  >
                                    {member.memberName}
                                  </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                          );
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="chapter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chapter</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Chapter name"
                                value={meetingData?.chapter?.name || ""}
                                disabled
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="invitedById"
                        render={({ field }) => {
                          console.log("Regular invitedById field:", field.value, typeof field.value);
                          
                          // Find selected member
                          const selectedMember = membersData?.members?.find(
                            (m: any) => m.id === field.value || m.id.toString() === field.value?.toString()
                          );
                          console.log("Selected member:", selectedMember);
                          
                          return (
                          <FormItem>
                            <FormLabel>Invited By</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                console.log("Selected value:", value, typeof value);
                                field.onChange(parseInt(value));
                              }}
                              value={field.value?.toString() || ""}
                              defaultValue={field.value?.toString() || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select member">
                                    {selectedMember?.memberName || "Select member"}
                                  </SelectValue>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {membersData?.members?.map((member: any) => {
                                  console.log("Member option:", member.id, member.memberName);
                                  return (
                                  <SelectItem
                                    key={member.id}
                                    value={member.id.toString()}
                                  >
                                    {member.memberName}
                                  </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                          );
                        }}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter email address"
                                {...field}
                                value={field.value || ""}
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
                            <FormLabel>Gender</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date of Birth</FormLabel>
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
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={field.value || undefined}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() ||
                                    date < new Date("1900-01-01")
                                  }
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
                        name="mobile1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile 1</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter primary mobile number"
                                {...field}
                              />
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
                                placeholder="Enter secondary mobile number"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Business Details Section - Only visible when cross chapter is OFF */}
              {!form.watch("isCrossChapter") && (
                <div>
                  <h3 className="text-lg font-medium">Business Details</h3>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select business category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {/* Show categories from API first */}
                              {categoriesData?.categories?.map(
                                (category: any) => (
                                  <SelectItem
                                    key={category.id}
                                    value={category.name}
                                  >
                                    {category.name}
                                  </SelectItem>
                                )
                              )}
                              {/* Show sample categories if no API data */}
                              {(!categoriesData?.categories ||
                                categoriesData.categories.length === 0) &&
                                [
                                  "Electrical Contractor",
                                  "Behavioural Training",
                                  "Fashion Designer",
                                  "Medical Device Distributor",
                                  "Process Equipment Manufacturers",
                                  "3D Modelling",
                                  "Abacus and Vedic Maths",
                                  "AC Servicing",
                                  "Accounts Writing",
                                  "Adventure Tourism",
                                  "Advertising Agency",
                                  "Agricultural Products And Consultancy",
                                  "Agro Food Products",
                                ].map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
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
                      name="businessDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Details</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter business details"
                              className="min-h-24"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Address Details Section - Only visible when cross chapter is OFF */}
              {!form.watch("isCrossChapter") && (
                <div>
                  <h3 className="text-lg font-medium">Address Details</h3>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="addressLine1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 1</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter address line 1"
                              {...field}
                            />
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
                              placeholder="Enter address line 2"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter city" {...field} />
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
                          <FormLabel>Pincode</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter pincode" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Status Section - Only visible when cross chapter is OFF */}
              {!form.watch("isCrossChapter") && (
                <div>
                  <h3 className="text-lg font-medium">Status</h3>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Invited">Invited</SelectItem>
                              <SelectItem value="Confirmed">
                                Confirmed
                              </SelectItem>
                              <SelectItem value="Attended">Attended</SelectItem>
                              <SelectItem value="No-Show">No-Show</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    navigate(`/chaptermeetings/${meetingId}/visitors`)
                  }
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditing ? "Update Visitor" : "Add Visitor"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisitorForm;
