import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { get, post } from "@/services/apiService";
import { format } from "date-fns";
import { CalendarIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Form schema validation
const formSchema = z.object({
  date: z.date(),
  chapterId: z.number(),
  toWhom: z.string().min(1, "Recipient is required"),
  toWhomId: z.number().optional(),
  amount: z.string().min(1, "Amount is required"),
  narration: z.string().min(1, "Narration is required"),
  testimony: z.string().min(1, "Testimony is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface Chapter {
  id: number;
  name: string;
}

interface Member {
  id: number;
  memberName: string;
  organizationName?: string;
}

const DirectThankYouSlipForm = () => {
  const navigate = useNavigate();

  const userData = (() => {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error("Error parsing user data from localStorage:", e);
      return null;
    }
  })();
  const loggedInUserMemberId = userData?.member?.id;

  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [open, setOpen] = useState(false);
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      chapterId: 0,
      toWhom: "",
      toWhomId: undefined,
      amount: "",
      narration: "",
      testimony: "",
    },
  });

  // Load all chapters
  useEffect(() => {
    const loadChapters = async () => {
      try {
        setLoading(true);
        const response = await get("/thankyou-slips/chapters");
        
        if (response && response.chapters) {
          setChapters(response.chapters);
          // Default to the first chapter
          if (response.chapters.length > 0) {
            form.setValue("chapterId", response.chapters[0].id);
            loadMembersForChapter(response.chapters[0].id);
          }
        } else {
          toast.error("Failed to load chapter data");
        }
      } catch (error) {
        console.error("Error loading chapter data:", error);
        toast.error("Failed to load chapter data");
      } finally {
        setLoading(false);
      }
    };

    loadChapters();
  }, [form]);
  
  // Function to load members for a specific chapter
  const loadMembersForChapter = async (chapterId: number) => {
    try {
      setLoadingMembers(true);
      const response = await get(`/thankyou-slips/members/chapter/${chapterId}`);
      
      if (response && Array.isArray(response.members)) {
        let fetchedMembers = response.members;
        if (loggedInUserMemberId) {
          fetchedMembers = fetchedMembers.filter(
            (member: Member) => member.id !== loggedInUserMemberId
          );
        }
        setMembers(fetchedMembers);
      } else {
        setMembers([]); // Clear members if response is not as expected
        toast.error("Failed to load members or unexpected format");
      }
    } catch (error) {
      console.error("Error loading members:", error);
      setMembers([]); // Clear members on error
      toast.error("Failed to load members");
    } finally {
      setLoadingMembers(false);
    }
  };
  
  // Handle chapter change
  const handleChapterChange = (chapterId: string) => {
    const id = parseInt(chapterId);
    form.setValue("chapterId", id);
    form.setValue("toWhom", "");
    form.setValue("toWhomId", undefined);
    loadMembersForChapter(id);
  };

  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    try {
      // Submit thank you slip data to backend with fromMemberId and toWhomId
      const submissionData = {
        ...data,
        // The backend will get the current user's member ID if fromMemberId is not provided
      };
      
      const response = await post("/thankyou-slips", submissionData);
      
      if (response && response.thankYouSlip) {
        toast.success("Thank you slip submitted successfully");
        navigate("/dashboard/thankyou-slips");
      } else {
        toast.error("Failed to submit thank you slip");
      }
    } catch (error: any) {
      console.error("Error submitting thank you slip:", error);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        for (const field in validationErrors) {
          form.setError(field as any, {
            type: "manual",
            message: validationErrors[field].message,
          });
        }
        toast.error("Please correct the errors in the form");
      } else {
        toast.error("Failed to submit thank you slip");
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card className="max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <div className="text-center py-4">Loading chapter data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (chapters.length === 0 && !loading) {
    return (
      <div className="container mx-auto py-6">
        <Card className="max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <p className="text-red-500">No chapters found in the system.</p>
              <p>Please contact an administrator to set up chapters before creating thank you slips.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl">Create Direct Thank You Slip</CardTitle>
          <CardDescription>
            Send a thank you slip directly to a member from a specific chapter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Date Field */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
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
                              <span>Select a date</span>
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

              {/* Chapter Selection */}
              <FormField
                control={form.control}
                name="chapterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Chapter</FormLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={handleChapterChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a chapter" />
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

              {/* To Whom Field with Member Selection */}
              <FormField
                control={form.control}
                name="toWhom"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>To Whom</FormLabel>
                    <Dialog open={open} onOpenChange={setOpen}>
                      <DialogTrigger asChild>
                        <FormControl>
                          <div className="flex w-full items-center space-x-2">
                            <Input
                              placeholder="Select a member"
                              value={field.value}
                              readOnly
                              className="flex-grow"
                            />
                            <Button type="button" variant="outline" size="icon">
                              <Search className="h-4 w-4" />
                            </Button>
                          </div>
                        </FormControl>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Select Member</DialogTitle>
                        </DialogHeader>
                        <Command className="rounded-lg border shadow-md">
                          <CommandInput placeholder="Search member..." />
                          <CommandEmpty>{loadingMembers ? "Loading..." : "No members found."}</CommandEmpty>
                          <CommandGroup>
                            {members.map((member) => (
                              <CommandItem
                                key={member.id}
                                onSelect={() => {
                                  field.onChange(member.memberName);
                                  form.setValue("toWhomId", member.id);
                                  setOpen(false);
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{member.memberName}</span>
                                  {member.organizationName && (
                                    <span className="text-xs text-muted-foreground">
                                      {member.organizationName}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </DialogContent>
                    </Dialog>
                    <FormDescription>
                      Select a member from the chapter who will receive this thank you slip
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount Field */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input placeholder="Amount" {...field} />
                    </FormControl>
                    <FormDescription>
                      The value received or given (can be monetary or descriptive)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Narration Field */}
              <FormField
                control={form.control}
                name="narration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Narration</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the interaction or transaction"
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide details about the thank you
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Testimony Field */}
              <FormField
                control={form.control}
                name="testimony"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Testimony</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share your testimony about this experience"
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Share how this experience impacted you or your business
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard/thankyou-slips")}
                >
                  Cancel
                </Button>
                <Button type="submit">Submit Thank You Slip</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectThankYouSlipForm;
