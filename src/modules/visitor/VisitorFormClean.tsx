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
import { useLocation } from "react-router-dom";
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
    invitedById: z.any().nullable().optional(),

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
  const [formInitialized, setFormInitialized] = useState(false);
  const [valuesSetOnce, setValuesSetOnce] = useState(false);

  const rawDefaults = React.useMemo(() => ({
    meetingId: meetingId ? Number(meetingId) : undefined,
    isCrossChapter: false,
    status: "Invited",
    chapterId: null,
    invitedById: null,
    name: "",
    email: null,
    gender: undefined,
    dateOfBirth: undefined,
    mobile1: "",
    mobile2: null,
    chapter: "",
    category: undefined,
    businessDetails: null,
    addressLine1: "",
    addressLine2: null,
    city: "",
    pincode: "",
  }), [meetingId]);
  const location = useLocation();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: rawDefaults,
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

        // Debug the user data structure to identify the correct ID field
        console.log("Current logged-in user data structure:", {
          id: userData.member.id,
          memberId: userData.member.id,
          userId: userData.userId,
          memberProfile: userData.memberProfile,
          name: userData.name || userData.username,
        });
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  

  // Define interface for meeting data
  interface MeetingData {
    id: number;
    date: string;
    meetingTitle: string;
    chapterId?: number;
    chapter?: { id: number; name: string };
    [key: string]: any; // For other potential properties
  }

  // Fetch meeting details
  const { data: meetingData } = useQuery<MeetingData>({
    queryKey: ["chaptermeeting", meetingId],
    queryFn: () =>
      get(`/chapter-meetings/${meetingId}`).then((res: any) => {
        console.log("Meeting data:", res.data);
         return res;
      }),
    enabled: !!meetingId,
  });

  // Define types for API responses
  interface MemberData {
    members: Array<{
      id: number;
      memberName: string;
      homeChapter?: { id: number; name: string };
      chapter?: string;
      [key: string]: any; // For other potential properties
    }>;
  }

  interface ChapterData {
    chapters: Array<{
      id: number;
      name: string;
      [key: string]: any; // For other potential properties
    }>;
  }

  // Get the currently selected chapter for queries
  const selectedChapter = form.watch("chapter");

  // Watch for changes to the selected chapter in the cross-chapter form
  const selectedCrossChapter = form.watch("chapterId");

  useEffect(() => {
    // only clear when ADDING a new visitor
    if (!isEditing) {
      form.setValue("invitedById", meetingData?.invitedById || null);
    }
  }, [selectedCrossChapter, isEditing, meetingData, form]);

  // Fetch all members for the invited by dropdown, excluding the current user
  const { data: membersData } = useQuery<MemberData>({
    queryKey: ["members", loggedInUser?.id], // Include loggedInUser in the key to refetch when user changes
    queryFn: async () => {
      const response = (await get(`/api/members?active=true`)) as MemberData;

      // Log the structure to understand member data
      if (response?.members?.length > 0) {
        console.log("Member data structure example:", response.members[0]);
      }

      // Filter out the current user from the members list
      if (loggedInUser && response?.members) {
        console.log("Filtering out current user from general members list");

        // Get current user IDs for comparison
        const currentUserId = loggedInUser.member?.id;
        const currentUserMemberId = loggedInUser.member?.id;
        const currentUserProfileId = loggedInUser.memberProfile?.id;

        // Filter out the current user from the members list
        const filteredMembers = response.members.filter((member: any) => {
          const isCurrentUser =
            (currentUserId && Number(currentUserId) === Number(member.id)) ||
            (currentUserMemberId &&
              Number(currentUserMemberId) === Number(member.id)) ||
            (currentUserProfileId &&
              Number(currentUserProfileId) === Number(member.id));

          if (isCurrentUser) {
            console.log(
              `EXCLUDED from general list: Current user ${member.memberName} (ID: ${member.id})`
            );
          }

          // Keep members who are NOT the current user
          return !isCurrentUser;
        });

        return { ...response, members: filteredMembers };
      }

      return response;
    },
    enabled: !!loggedInUser, // Only fetch once we have the logged-in user
  });

  // Fetch members filtered by the selected cross-chapter
  const { data: crossChapterMembersData } = useQuery<MemberData>({
    queryKey: ["crossChapterMembers", selectedCrossChapter],
    queryFn: async () => {
      if (!selectedCrossChapter) {
        return { members: [] } as MemberData;
      }

      try {
        console.log(
          `Fetching members for cross chapter ID: ${selectedCrossChapter}`
        );

        // Direct API call to get members by chapter ID
        let members: Array<MemberData["members"][0]> = [];
        try {
          // Try to get members directly from the API with chapter filter
          const chapResponse = (await get(
            `/api/members?chapterId=${selectedCrossChapter}&active=true`
          )) as MemberData;
          if (chapResponse?.members?.length > 0) {
            console.log(
              `SUCCESS: Found ${chapResponse.members.length} members via direct API call with chapterId=${selectedCrossChapter}`
            );
            members = chapResponse.members;
          }
        } catch (e) {
          console.log(
            "Chapter-specific API call failed, falling back to all members:",
            e
          );
        }

        // If direct chapter query failed, get all members
        if (members.length === 0) {
          const allResponse = (await get(
            `/api/members?active=true`
          )) as MemberData;
          members = allResponse.members || [];
          console.log(
            `Fetched ${members.length} total members, will filter client-side`
          );
        }

        // Log a sample member to understand the data structure
        if (members.length > 0) {
          console.log("Example member data structure:", {
            id: members[0].id,
            name: members[0].memberName,
            homeChapter: members[0].homeChapter,
            memberships: members[0].memberships,
            // Add any other fields that might be relevant
          });

          // Print first 5 members with their chapter info
          console.log("First 5 members with chapter info:");
          members.slice(0, 5).forEach((m: any, i: number) => {
            console.log(`Member ${i + 1}: ${m.memberName} (ID: ${m.id})`, {
              homeChapter: m.homeChapter,
              memberships: m.memberships,
              chapterId: m.chapterId,
            });
          });
        }

        // First identify the current user for exclusion
        const currentUserId = loggedInUser?.member?.id;
        const currentUserMemberId = loggedInUser?.member?.id;
        console.log("Current user info for exclusion:", {
          userId: currentUserId,
          memberId: currentUserMemberId,
          memberProfile: loggedInUser?.member?.id,
        });

        // FIXED APPROACH:
        // 1. Try multiple ways to find chapter membership
        // 2. Exclude the current user
        const filteredMembers = members.filter((member: any) => {
          // FIRST: Always exclude the current user
          const isCurrentUser =
            (currentUserId && Number(currentUserId) === Number(member.id)) ||
            (currentUserMemberId &&
              Number(currentUserMemberId) === Number(member.id)) ||
            (loggedInUser?.member?.id &&
              Number(loggedInUser.member.id) === Number(member.id));

          if (isCurrentUser) {
            console.log(
              `EXCLUDED: Current user ${member.memberName} (ID: ${member.id})`
            );
            return false;
          }

          // SECOND: Check if this member belongs to the selected chapter
          // a) Check homeChapter.id if it exists
          const homeChapterMatch =
            member.homeChapter &&
            Number(member.homeChapter.id) === Number(selectedCrossChapter);

          // b) Check memberships array if it exists
          const membershipMatch =
            member.memberships &&
            Array.isArray(member.memberships) &&
            member.memberships.some(
              (m: any) =>
                Number(m.chapterId) === Number(selectedCrossChapter) ||
                (m.chapter &&
                  Number(m.chapter.id) === Number(selectedCrossChapter))
            );

          // c) Check direct chapterId property
          const directChapterMatch =
            member.chapterId &&
            Number(member.chapterId) === Number(selectedCrossChapter);

          // Check if member belongs to the selected chapter through any method
          const belongsToChapter =
            homeChapterMatch || membershipMatch || directChapterMatch;

          if (!belongsToChapter) {
            // Skip this member as they don't belong to the selected chapter
            return false;
          }

          // Include this member as they belong to the chapter and aren't the current user
          console.log(
            `INCLUDED: Member ${member.memberName} (ID: ${member.id}) from chapter ${selectedCrossChapter}`
          );
          return true;
        });

        console.log(
          `Found ${filteredMembers.length} members after filtering for chapter ID ${selectedCrossChapter}`
        );

        console.log(
          `Filtering complete. Found ${filteredMembers.length} valid members for chapter ID ${selectedCrossChapter}`
        );

        // If we found no members, add a fallback mechanism
        if (filteredMembers.length === 0) {
          console.log(
            "WARNING: No members found for the selected chapter. This might indicate an issue with the data structure."
          );

          // Let's try a simpler approach as a fallback
          const fallbackMembers = members.filter((member: any) => {
            // First exclude current user
            console.log("Loggedin user", loggedInUser);
            const isCurrentUser =
              (currentUserId && Number(currentUserId) === Number(member.id)) ||
              (currentUserMemberId &&
                Number(currentUserMemberId) === Number(member.id)) ||
              (loggedInUser?.member?.id &&
                Number(loggedInUser.member.id) === Number(member.id));

            if (isCurrentUser) return false;

            // Very simple check - just look at homeChapter.id
            return (
              member.homeChapter &&
              Number(member.homeChapter.id) === Number(selectedCrossChapter)
            );
          });

          console.log(
            `Fallback filtering found ${fallbackMembers.length} members`
          );

          if (fallbackMembers.length > 0) {
            // Use the fallback if it found any members
            return { members: fallbackMembers } as MemberData;
          }

          // If both approaches failed, return empty list
          return { members: [] } as MemberData;
        }

        // Return the successfully filtered members
        return { members: filteredMembers } as MemberData;
      } catch (error) {
        console.error(
          `Error fetching members for chapter ID ${selectedCrossChapter}:`,
          error
        );
        return { members: [] } as MemberData;
      }
    },
    enabled: !!selectedCrossChapter,
  });

  // Fetch members by chapter when a regular (non-cross) chapter is selected
  const { refetch: refetchChapterMembers } = useQuery<MemberData>({
    queryKey: ["chapterMembers", selectedChapter],
    queryFn: async () => {
      if (!selectedChapter) {
        return { members: [] } as MemberData;
      }

      // Try to fetch members filtered by chapter from the backend
      try {
        console.log(`Fetching members for chapter: ${selectedChapter}`);

        // Try multiple endpoint patterns - we don't know exactly what the API expects
        let response: MemberData;

        // First try - direct chapter name filter
        try {
          response = (await get(
            `/api/members?chapter=${encodeURIComponent(
              selectedChapter
            )}&active=true`
          )) as MemberData;
          if (response?.members?.length > 0) {
            console.log(
              `Found ${response.members.length} members using /api/members?chapter= endpoint`
            );
            return response;
          }
        } catch (e) {
          console.log("First attempt failed:", e);
        }

        // Second try - homeChapter filter
        try {
          response = (await get(
            `/api/members?homeChapter=${encodeURIComponent(
              selectedChapter
            )}&active=true`
          )) as MemberData;
          if (response?.members?.length > 0) {
            console.log(
              `Found ${response.members.length} members using /api/members?homeChapter= endpoint`
            );
            return response;
          }
        } catch (e) {
          console.log("Second attempt failed:", e);
        }

        // Third try - try a broader endpoint and filter client-side
        response = (await get(`/api/members?active=true`)) as MemberData;
        console.log(
          `Fetched all members, filtering client-side for chapter: ${selectedChapter}`
        );

        // Manually filter members by chapter
        // Add comprehensive logging to debug the filtering issue
        console.log("Filtering members for chapter:", selectedChapter);
        console.log("Total members to filter:", response.members.length);

        // Log some sample members to understand their structure
        if (response.members.length > 0) {
          console.log("Sample member data structures:");
          response.members.slice(0, 3).forEach((m, i) => {
            console.log(`Member ${i + 1}:`, {
              id: m.id,
              name: m.memberName,
              homeChapter: m.homeChapter,
              chapter: m.chapter,
            });
          });
        }

        const filteredMembers = response.members.filter((member) => {
          // Very detailed logging for each member's chapter match
          const homeChapterName = member.homeChapter?.name;
          const directChapter = member.chapter;

          const isHomeChapterMatch = homeChapterName === selectedChapter;
          const isDirectChapterMatch = directChapter === selectedChapter;
          const isMatch = isHomeChapterMatch || isDirectChapterMatch;

          if (isMatch) {
            console.log(
              `MATCH: Member ${member.memberName} matches chapter ${selectedChapter}:`,
              {
                homeChapterName,
                directChapter,
                isHomeChapterMatch,
                isDirectChapterMatch,
              }
            );
          }

          return isMatch;
        });

        console.log(
          `Found ${filteredMembers.length} members after client-side filtering`
        );
        return { members: filteredMembers } as MemberData;
      } catch (error) {
        console.error(
          `Error fetching members for chapter ${selectedChapter}:`,
          error
        );
        return { members: [] } as MemberData;
      }
    },
    enabled: !!selectedChapter,
  });

  // Fetch chapters for the chapter dropdown
  const { data: chaptersData } = useQuery<ChapterData>({
    queryKey: ["chapters"],
    queryFn: () => get(`/chapters`) as Promise<ChapterData>,
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
    // Make sure meetingData.chapterId exists before using it
    const meetingChapterId = meetingData.chapterId
      ? Number(meetingData.chapterId)
      : null;
    console.log("Meeting Chapter ID:", meetingChapterId);
    console.log("Meeting Chapter:", meetingData.chapter);
    console.log("All Chapters:", chaptersData.chapters);

    // Only filter if we have a valid chapterId
    if (meetingChapterId === null) {
      return chaptersData.chapters;
    }

    const filtered = chaptersData.chapters.filter((chapter) => {
      const chapterId = Number(chapter.id);
      return chapterId !== meetingChapterId;
    });

    console.log(`Filtered Chapters: ${filtered.length} remaining`);
    return filtered;
  }, [chaptersData, meetingData]);

  // Define interface for category data
  interface CategoryData {
    categories: Array<{
      id: number;
      name: string;
      [key: string]: any; // For other potential properties
    }>;
  }

  // Fetch categories for the category dropdown
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useQuery<CategoryData>({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const response = (await get(`/categories`)) as CategoryData;
        console.log("Categories loaded:", response);
        return response;
      } catch (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }
    },
  });

  // Fetch visitor data if editing
  const { data: visitorData, isLoading: isVisitorLoading } = useQuery<any>({
    queryKey: ["visitor", visitorId],
    queryFn: () => get(`/visitors/${visitorId}`),
    enabled: isEditing && !!visitorId,
  });
  
  const chapterAndMembersReady = React.useMemo(() => {
    if (!visitorData) return false;
  
    return visitorData.isCrossChapter
      ? !!filteredChapters.length
      : !!chaptersData && !!membersData;
  }, [
    visitorData,
    filteredChapters.length,
    chaptersData,
    membersData,
  ]);

  // Reset initialization flags when visitor changes
  useEffect(() => {
    if (isEditing && visitorId) {
      setFormInitialized(false);
      setValuesSetOnce(false);
    }
  }, [visitorId, isEditing]);

  useEffect(() => {
    if (!isEditing || !visitorData || formInitialized) return;
    form.setValue("isCrossChapter", !!visitorData.isCrossChapter);
    if (
      !chaptersData || 
      !membersData
    ) {
      return; // Wait for data
    }
    form.reset(
      {
        ...rawDefaults,
        ...visitorData,
        isCrossChapter: !!visitorData.isCrossChapter,   // ← makes UI show correct fields
        chapterId: visitorData.chapterId ? Number(visitorData.chapterId) : null,
        invitedById: visitorData.invitedById ? Number(visitorData.invitedById) : null,
        dateOfBirth: visitorData.dateOfBirth
          ? new Date(visitorData.dateOfBirth)
          : undefined,
      },
      { keepDirty: false }
    );
    setFormInitialized(true);
  }, [isEditing, 
visitorData, 
chaptersData, 
membersData, 
formInitialized, 
form]);

  // Second effect for fine-tuning values after form reset (runs only once)
  useEffect(() => {
    if (!isEditing || !visitorData || !chapterAndMembersReady || !formInitialized || valuesSetOnce) return;
  
    if (visitorData.isCrossChapter) {
      // For cross-chapter, ensure proper number conversion for dropdowns
      const currentChapterId = form.getValues("chapterId");
      const currentInvitedById = form.getValues("invitedById");
      
      if (currentChapterId !== Number(visitorData.chapterId)) {
        form.setValue("chapterId", visitorData.chapterId ? Number(visitorData.chapterId) : null);
      }
      form.setValue("chapterId", visitorData.chapterId ? Number(visitorData.chapterId) : null)
      if (currentInvitedById !== Number(visitorData.invitedById)) {
        form.setValue("invitedById", visitorData.invitedById ? Number(visitorData.invitedById) : null);
      }
    } else {
      // For regular visitors, ensure chapter and member selections work
      const chapterName = 
        visitorData.chapter?.name ?? 
        visitorData.chapter ?? 
        meetingData?.chapter?.name ?? 
        "";
    
      if (chapterName && chaptersData.chapters.some(c => c.name === chapterName)) {
        const currentChapter = form.getValues("chapter");
        if (currentChapter !== chapterName) {
          form.setValue("chapter", chapterName);
        }
      }
      form.setValue("gender", visitorData.gender)
      form.setValue("category", visitorData.category)

    
      const members = membersData.members || [];
      if (visitorData.invitedById && members.some(m => m.id === visitorData.invitedById)) {
        const currentInvitedById = form.getValues("invitedById");
        if (currentInvitedById !== Number(visitorData.invitedById)) {
          form.setValue("invitedById", Number(visitorData.invitedById));
        }
      }
    }
    
    setValuesSetOnce(true);
  }, [
    isEditing, 
    visitorData, 
    chaptersData, 
    membersData, 
    meetingData,
    chapterAndMembersReady,
    formInitialized,
    valuesSetOnce,
    form
  ]);

  useEffect(() => {
    // Watch the invitedById field
    const subscription = form.watch((value, { name }) => {
      if (name === "invitedById") {
        console.log("Form values:", value);
        console.log(
          "invitedById changed:",
          value.invitedById,
          typeof value.invitedById
        );
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);



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

    // Create a copy of the data for submission
    const submissionData = { ...data };

    // Ensure meetingId is set from URL params
    if (meetingId && !submissionData.meetingId) {
      submissionData.meetingId = parseInt(meetingId);
    }

    // Convert invitedById to a number if it's a string and not empty
    if (
      submissionData.invitedById &&
      typeof submissionData.invitedById === "string"
    ) {
      submissionData.invitedById = parseInt(submissionData.invitedById);
    }
    console.log("Submitting data:", submissionData?.invitedById)

    // For non-cross-chapter visitors, make sure chapterId is set
    if (!submissionData.isCrossChapter) {
      // Use the selected chapter from the form
      if (submissionData.chapter) {
        // Find the chapter ID from the name
        const selectedChapter = chaptersData?.chapters?.find(
          (c: any) => c.name === submissionData.chapter
        );
        if (selectedChapter) {
          submissionData.chapterId = selectedChapter.id;
        }
      } else if (meetingData) {
        // Fallback to meeting's chapter if none is selected
        submissionData.chapter = meetingData.chapter?.name;
        if (meetingData && typeof meetingData.chapterId === "number") {
          submissionData.chapterId = meetingData.chapterId;
        }
      }
    }

    console.log("Submitting data:", submissionData);

    try {
      if (isEditing) {
        console.log("[DEBUG] Updating visitor with data:", submissionData);
        updateMutation.mutate(submissionData);
      } else {
        console.log("[DEBUG] Creating visitor with data:", submissionData);
        createMutation.mutate(submissionData);
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
                                {format(
                                  new Date(meetingData.date),
                                  "dd/MM/yyyy"
                                )}{" "}
                                - {meetingData.meetingTitle}
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
                              // Only set default values when creating new visitor, not editing
                              if (!isEditing) {
                                form.setValue("invitedById", null);
                                form.setValue("chapter", meetingData?.chapter?.name || "");
                                form.setValue("chapterId", null);
                              }
                              // if (false) {
                              //   // Clear fields not needed for cross-chapter
                              //   form.setValue("name", "");
                              //   form.setValue("email", "");
                              //   form.setValue("gender", "");
                              //   form.setValue("dateOfBirth", null);
                              //   form.setValue("mobile1", "");
                              //   form.setValue("mobile2", "");
                              //   form.setValue("category", "");
                              //   form.setValue("businessDetails", "");
                              //   form.setValue("addressLine1", "");
                              //   form.setValue("addressLine2", "");
                              //   form.setValue("city", "");
                              //   form.setValue("pincode", "");
                              //   form.setValue("status", "");
                              // } else {
                              //   console.log("Meeting data:wewew", meetingData)
                              //   // Clear chapter ID when switching back and set to meeting's chapter
                              //   form.setValue(
                              //     "chapterId",
                              //     meetingData?.chapterId || null
                              //   );
                              //   if (meetingData?.chapter?.name) {
                              //     form.setValue("chapter", meetingData.chapter.name);
                              //   } 
                              //   // Don't set chapter automatically, let users select it
                              //   form.setValue("invitedById", meetingData?.invitedById || null);
                              // }
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
                        render={({ field }) => {
                          const selectedChapter = chaptersData?.chapters?.find(
                            (c: any) => Number(c.id) === Number(field.value)
                          );

                          return (
                            <FormItem>
                              <FormLabel>From Chapter</FormLabel>
                              <Select
                                onValueChange={(val) => {
                                  field.onChange(Number(val));
                                  // Only clear invited by field when creating new visitor, not editing
                                  if (!isEditing) {
                                    form.setValue("invitedById", null);
                                  }
                                }}
                                value={field.value != null ? String(field.value) : ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select home chapter" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {filteredChapters.length > 0 ? (
                                    filteredChapters.map((chapter: any) => (
                                      <SelectItem
                                        key={chapter.id}
                                        value={String(chapter.id)}
                                      >
                                        {chapter.name}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="no-chapters" disabled>
                                      No other chapters available
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        control={form.control}
                        name="invitedById"
                        render={({ field }) => {
                          // Log the field value directly instead of using useEffect
                          console.log(
                            "[DEBUG] invitedById field value:",
                            field.value,
                            typeof field.value
                          );

                          return (
                            <FormItem>
                              <FormLabel>Invited By</FormLabel>
                              <Select
                                onValueChange={(val) => field.onChange(Number(val))}
                                // IMPORTANT - String conversion to ensure the value matches option format
                                value={
                                  field.value !== undefined &&
                                  field.value !== null
                                    ? String(field.value)
                                    : ""
                                }
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select member" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {/* Use the appropriately filtered members list */}
                                  {(selectedCrossChapter
                                    ? crossChapterMembersData?.members || []
                                    : membersData?.members || []
                                  )?.map((member: any) => {
                                    // Add a final safety check to exclude the current user
                                    if (
                                      loggedInUser &&
                                      (Number(loggedInUser.member?.id) ===
                                        Number(member.id) ||
                                        Number(loggedInUser.member?.id) ===
                                          Number(member.id))
                                    ) {
                                      console.log(
                                        "Skipping current user in dropdown render"
                                      );
                                      return null;
                                    }
                                    // as we filter in the query functions
                                    // Debug output for each option to verify the types match
                                    const optionValue = String(member.id);
                                    const isSelected =
                                      optionValue ===
                                      (field.value ? String(field.value) : "");
                                    if (isSelected) {
                                      console.log(
                                        "[DEBUG] Found matching option:",
                                        optionValue,
                                        member.memberName
                                      );
                                    }
                                    return (
                                      <SelectItem
                                        key={member.id}
                                        value={optionValue}
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
                            <Select
                              onValueChange={(value) => {
                                console.log(
                                  "[DEBUG] Selected chapter value:",
                                  value
                                );
                                field.onChange(value);
                                // Only clear invitedById when creating, not editing
                                if (!isEditing) {
                                  form.setValue("invitedById", null);
                                }
                                // Trigger refetch of chapter members
                                refetchChapterMembers();
                              }}
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select chapter" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {chaptersData?.chapters?.map((chapter) => (
                                  <SelectItem
                                    key={chapter.id}
                                    value={chapter.name}
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

                      <FormField
                        control={form.control}
                        name="invitedById"
                        render={({ field }) => {
                          console.log(
                            "Regular invitedById field:",
                            field.value,
                            typeof field.value
                          );

                          // Get the current chapter selection directly inside the render function
                          const selectedChapter = form.watch("chapter");
                          console.log(
                            "Current chapter selection:",
                            selectedChapter
                          );

                          // Manual filtering within the render function for maximum control
                          const allMembers = membersData?.members || [];

                          // Debug - log ALL properties of the first few members to see their structure
                          console.log("DETAILED MEMBER STRUCTURE DEBUGGING:");
                          if (allMembers.length > 0) {
                            const firstMember = allMembers[0];
                            console.log(
                              "First member complete object:",
                              firstMember
                            );
                            console.log(
                              "All member keys:",
                              Object.keys(firstMember)
                            );

                            // Log the first 3 members with their chapter-related properties
                            allMembers.slice(0, 3).forEach((m, i) => {
                              console.log(
                                `Member ${i + 1} (${
                                  m.memberName
                                }) chapter info:`,
                                {
                                  homeChapter: m.homeChapter,
                                  chapter: m.chapter,
                                  chapterId: m.chapterId,
                                  homeChapterName: m.homeChapter?.name,

                                  // Also check nested objects
                                  "homeChapter?.id": m.homeChapter?.id,
                                  "homeChapter?.name": m.homeChapter?.name,
                                }
                              );
                            });
                          }

                          // Try multiple approaches for filtering based on the console debug info
                          const filteredMembers = selectedChapter
                            ? allMembers.filter((member) => {
                                // Try EVERY possible way the chapter might be stored
                                const approaches = [
                                  // Object with name property
                                  member.homeChapter?.name === selectedChapter,
                                  // Direct string property
                                  member.chapter === selectedChapter,
                                  // Check name property on chapter object if it exists
                                  member.chapter?.name === selectedChapter,
                                  // Substring matching (in case chapter is stored in a different format)
                                  typeof member.chapter === "string" &&
                                    member.chapter.includes(selectedChapter),
                                  typeof member.homeChapterName === "string" &&
                                    member.homeChapterName.includes(
                                      selectedChapter
                                    ),
                                  // Check if chapterId matches any chapter with the selected name
                                  chaptersData?.chapters?.some(
                                    (c) =>
                                      c.name === selectedChapter &&
                                      c.id === member.chapterId
                                  ),
                                ];

                                // If ANY approach matches, include this member
                                const matches = approaches.some(
                                  (approach) => approach === true
                                );

                                // Debug specific member matching
                                if (matches) {
                                  console.log(
                                    `MATCH: Member ${member.memberName} matches chapter ${selectedChapter}`
                                  );
                                }

                                return matches;
                              })
                            : [];

                          console.log(
                            `Showing ${filteredMembers.length} of ${
                              allMembers.length
                            } members for chapter "${
                              selectedChapter || "none"
                            }"`
                          );

                          // Find selected member from filtered list
                          const selectedMember = filteredMembers.find(
                            (member) =>
                              member.id === field.value ||
                              member.id.toString() === field.value?.toString()
                          );



                          return (
                            <FormItem>
                              <FormLabel>Invited By</FormLabel>
                              <Select
                                onValueChange={(val) => field.onChange(Number(val))}
                                value={field.value?.toString() || ""}
                                disabled={
                                  !selectedChapter ||
                                  filteredMembers.length === 0
                                }
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select member">
                                      {selectedMember?.memberName ||
                                        "Select member"}
                                    </SelectValue>
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {selectedChapter ? (
                                    filteredMembers.length > 0 ? (
                                      filteredMembers.map((member) => (
                                        <SelectItem
                                          key={member.id}
                                          value={String(member.id)}
                                        >
                                          {member.memberName}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <SelectItem value="no-members" disabled>
                                        No members found in this chapter
                                      </SelectItem>
                                    )
                                  ) : (
                                    <SelectItem value="no-chapter" disabled>
                                      Please select a chapter first
                                    </SelectItem>
                                  )}
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
                        render={({ field }) => {
                          // Debug the current value
                          console.log(
                            "[DEBUG] Gender field value:",
                            field.value,
                            typeof field.value
                          );

                          return (
                            <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <Select
                                onValueChange={(val) => {
                                  console.log(
                                    "[DEBUG] Setting gender to:",
                                    val
                                  );
                                  field.onChange(val);
                                }}
                                value={field.value ?? ""}
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
                          );
                        }}
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
                                      format(field.value, "dd/MM/yyyy")
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
                      render={({ field }) => {
                        // Debug the current value
                        console.log(
                          "[DEBUG] Category field value:",
                          field.value,
                          typeof field.value
                        );

                        return (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                              onValueChange={(val) => {
                                console.log(
                                  "[DEBUG] Setting category to:",
                                  val
                                );
                                field.onChange(val);
                              }}
                              value={field.value ?? ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select business category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {isCategoriesLoading ? (
                                  <SelectItem value="loading" disabled>
                                    Loading categories...
                                  </SelectItem>
                                ) : isCategoriesError ? (
                                  <SelectItem value="error" disabled>
                                    Error loading categories
                                  </SelectItem>
                                ) : categoriesData?.categories?.length ? (
                                  /* Show categories from API */
                                  categoriesData.categories.map((category) => (
                                    <SelectItem
                                      key={category.id}
                                      value={category.name}
                                    >
                                      {category.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  /* If no categories found in API */
                                  <SelectItem value="no-categories" disabled>
                                    No categories available
                                  </SelectItem>
                                )}
                                {/* Always include Other as a fallback option */}
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
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
                            value={field.value ?? ""}
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
