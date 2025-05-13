import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { get, post, put } from "@/services/apiService";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Define Zod schema for form validation
const referenceSchema = z.object({
  date: z.date({
    required_error: "Date is required",
  }),
  noOfReferences: z.number().optional().nullable(),
  chapterId: z.number({
    required_error: "Chapter is required",
  }).min(1, "Please select a chapter"),
  memberId: z.number({
    required_error: "Member is required",
  }).min(1, "Please select a member"),
  urgency: z.string().optional(),
  self: z.boolean(),
  nameOfReferral: z.string({
    required_error: "Name of referral is required",
  }).min(1, "Name of referral is required"),
  mobile1: z.string({
    required_error: "Primary mobile number is required",
  }).min(10, "Mobile number must be at least 10 digits"),
  mobile2: z.string().optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal('')),
  remarks: z.string().optional(),
  addressLine1: z.string().optional(),
  location: z.string().optional(),
  addressLine2: z.string().optional(),
  pincode: z.string().optional(),
});

// Infer the type from the schema
type FormData = z.infer<typeof referenceSchema>;

interface Chapter {
  id: number;
  name: string;
}

interface Member {
  id: number;
  memberName: string;
  email?: string;
  mobile1?: string;
  mobile2?: string;
  addressLine1?: string;
  addressLine2?: string;
  location?: string;
  pincode?: string;
  organizationName?: string;
  orgAddressLine1?: string;
  orgAddressLine2?: string;
  orgLocation?: string;
  orgPincode?: string;
}

const ReferenceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(referenceSchema),
    defaultValues: {
      date: new Date(),
      noOfReferences: undefined,
      chapterId: 0,
      memberId: 0,
      urgency: '',
      self: false,
      nameOfReferral: '',
      mobile1: '',
      mobile2: '',
      email: '',
      remarks: '',
      addressLine1: '',
      location: '',
      addressLine2: '',
      pincode: '',
    },
  });

  // Load chapters and members data
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [chaptersRes, membersRes] = await Promise.all([
          get("/chapters", { limit: 100 }),
          get("/api/members", { limit: 100 }),
        ]);
        setChapters(chaptersRes.chapters || []);
        setMembers(membersRes.members || []);
      } catch (error) {
        console.error("Error loading form options:", error);
        toast.error("Failed to load chapters and members");
      }
    };

    fetchOptions();
  }, []);

  // Load reference data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const loadReference = async () => {
        setLoading(true);
        try {
          const reference = await get(`/references/${id}`);

          form.reset({
            date: new Date(reference.date),
            noOfReferences: reference.noOfReferences,
            chapterId: reference.chapterId,
            memberId: reference.receiverId,
            urgency: reference.urgency || '',
            self: reference.self,
            nameOfReferral: reference.nameOfReferral,
            mobile1: reference.mobile1,
            mobile2: reference.mobile2 || '',
            email: reference.email || '',
            remarks: reference.remarks || '',
            addressLine1: reference.addressLine1 || '',
            location: reference.location || '',
            addressLine2: reference.addressLine2 || '',
            pincode: reference.pincode || '',
          });
        } catch (error) {
          console.error("Error loading reference:", error);
          toast.error("Failed to load reference");
          navigate("/dashboard/references/given");
        } finally {
          setLoading(false);
        }
      };

      loadReference();
    }
  }, [isEditMode, id, form, navigate]);



  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Format data to match backend expectations
      // Check the backend schema requirements in referenceController.js
      const formattedData = {
        // Backend expects date as string
        date: data.date instanceof Date ? data.date.toISOString() : new Date().toISOString(),
        // Convert numbers to string where needed
        noOfReferences: data.noOfReferences !== undefined && data.noOfReferences !== null ? data.noOfReferences.toString() : undefined,
        // Keep as numbers for these fields
        chapterId: data.chapterId,
        memberId: data.memberId,
        // Other fields with proper defaults
        urgency: data.urgency || undefined,
        self: data.self,
        nameOfReferral: data.nameOfReferral,
        mobile1: data.mobile1,
        mobile2: data.mobile2 || undefined,
        email: data.email || undefined,
        remarks: data.remarks || undefined,
        addressLine1: data.addressLine1 || undefined,
        addressLine2: data.addressLine2 || undefined,
        location: data.location || undefined,
        pincode: data.pincode || undefined,
      };

      console.log('Submitting data:', formattedData);

      if (isEditMode) {
        await put(`/references/${id}`, formattedData);
        toast.success("Reference updated successfully");
      } else {
        await post("/references", formattedData);
        toast.success("Reference created successfully");
      }
      navigate("/dashboard/references/given");
    } catch (error) {
      console.error("Error saving reference:", error);
      toast.error(isEditMode ? "Failed to update reference" : "Failed to create reference");
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberDetails = async (memberId: number) => {
    try {
      // Use the dedicated endpoint for reference autofill
      const response = await get(`/api/members/${memberId}/reference-details`);
      const memberDetails = response.member;
      
      // Auto-fill form fields using member details
      form.setValue("nameOfReferral", memberDetails.memberName || '');
      form.setValue("email", memberDetails.email || '');
      form.setValue("mobile1", memberDetails.mobile1 || '');
      form.setValue("mobile2", memberDetails.mobile2 || '');
      form.setValue("addressLine1", memberDetails.addressLine1 || '');
      form.setValue("addressLine2", memberDetails.addressLine2 || '');
      form.setValue("location", memberDetails.location || '');
      form.setValue("pincode", memberDetails.pincode || '');
      
      toast.success("Member details loaded successfully");
    } catch (error) {
      console.error("Error fetching member details:", error);
      toast.error("Failed to fetch member details for autofill");
    }
  };

  // Auto-fill form with current user's details from localStorage
  const autoFillCurrentUserDetails = () => {
    try {
      // Get current user data from localStorage
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const memberDetails = currentUser.member;
      
      if (!memberDetails) {
        toast.error("User information not found in localStorage");
        return;
      }
      
      // Auto-fill form fields using current user's details
      form.setValue("nameOfReferral", memberDetails.memberName || '');
      form.setValue("email", memberDetails.email || '');
      form.setValue("mobile1", memberDetails.mobile1 || '');
      form.setValue("mobile2", memberDetails.mobile2 || '');
      form.setValue("addressLine1", memberDetails.addressLine1 || '');
      form.setValue("addressLine2", memberDetails.addressLine2 || '');
      form.setValue("location", memberDetails.location || '');
      form.setValue("pincode", memberDetails.pincode || '');
      
      toast.success("Self referral details loaded");
    } catch (error) {
      console.error("Error loading user details from localStorage:", error);
      toast.error("Failed to load your details for self-referral");
    }
  };

  // Get current user ID to filter from members list
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentMemberId = currentUser?.member?.id;
  
  // Filter out current user from members list
  const filteredMembers = members.filter(member => member.id !== currentMemberId);

  return (
    <div className="container mx-auto py-6 ml-2 mr-2 justify-center items-center flex">
      <Card className="max-w-[95%] w-full">
        <CardHeader>
          <CardTitle>{isEditMode ? "Edit Reference" : "Add New Reference"}</CardTitle>
          <CardDescription>
            {isEditMode 
              ? "Update the reference information below" 
              : "Enter the reference details to add a new reference"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !isEditMode ? (
            <div className="text-center py-4">Loading reference data...</div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date */}
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
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

                  {/* Number of References */}
                  <FormField
                    control={form.control}
                    name="noOfReferences"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>No. of References</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter number of references"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Chapter */}
                  <FormField
                    control={form.control}
                    name="chapterId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chapter *</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value ? field.value.toString() : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select chapter" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {chapters.map((chapter) => (
                              <SelectItem key={chapter.id} value={chapter.id.toString()}>
                                {chapter.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Member */}
                  <FormField
                    control={form.control}
                    name="memberId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Member *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(parseInt(value));
                            // Auto-filling member data is disabled as per requirements
                          }}
                          value={field.value ? field.value.toString() : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select member" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredMembers.map((member) => (
                              <SelectItem key={member.id} value={member.id.toString()}>
                                {member.memberName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Urgency */}
                  <FormField
                    control={form.control}
                    name="urgency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Urgency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select urgency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Self Checkbox */}
                  <FormField
                    control={form.control}
                    name="self"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-6">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              // Auto-fill form with current user's details when checkbox is checked
                              if (checked) {
                                autoFillCurrentUserDetails();
                              }
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Self Referral</FormLabel>
                          <FormDescription>
                            Check this if you are referring yourself
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name of Referral */}
                  <FormField
                    control={form.control}
                    name="nameOfReferral"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name of Referral *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter referral name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Mobile 1 */}
                  <FormField
                    control={form.control}
                    name="mobile1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile 1 *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter primary mobile number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Mobile 2 */}
                  <FormField
                    control={form.control}
                    name="mobile2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile 2</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter secondary mobile number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter email address" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Remarks */}
                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter any additional remarks" 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Address Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Address Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Address Line 1 */}
                    <FormField
                      control={form.control}
                      name="addressLine1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 1</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter address line 1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Location */}
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter location" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Address Line 2 */}
                    <FormField
                      control={form.control}
                      name="addressLine2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 2</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter address line 2" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Pincode */}
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

                <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/dashboard/references/given")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferenceForm; 