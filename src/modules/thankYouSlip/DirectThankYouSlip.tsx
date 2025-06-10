import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Service imports
import { getAllChapters } from "../../services/chapterService";
import { createDirectThankYouSlip } from "../../services/thankYouSlipService";

// Form validation schema
const formSchema = z.object({
  date: z.date({
    required_error: "Date is required",
  }),
  chapterId: z.string({
    required_error: "Chapter is required",
  }),
  memberId: z.string({
    required_error: "Member is required",
  }),
  toWhom: z
    .string({
      required_error: "To Whom is required",
    })
    .optional(),
  toWhomId: z.number().optional(),
  amount: z
    .string({
      required_error: "Amount is required",
    })
    .min(1, "Amount is required"),
  narration: z
    .string({
      required_error: "Narration is required",
    })
    .optional(),
  testimony: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const DirectThankYouSlip: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      toWhom: "",
      amount: "",
      narration: "",
      testimony: "",
    },
  });

  // Get all chapters
  const { data: chapters, isLoading: isLoadingChapters } = useQuery(
    "chapters",
    getAllChapters
  );

  // Get members for the selected chapter
  const {
    data: members,
    isLoading: isLoadingMembers,
    refetch: refetchMembers,
  } = useQuery(
    ["members", form.watch("chapterId")],
    () => getMembersByChapter(Number(form.watch("chapterId"))),
    {
      enabled: !!form.watch("chapterId"),
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Create done deal mutation
  const createSlipMutation = useMutation(createDirectThankYouSlip, {
    onSuccess: () => {
      queryClient.invalidateQueries("thankYouSlips");
      toast.success("Done deal created successfully!");
      form.reset({
        date: new Date(),
        chapterId: form.getValues("chapterId"), // Keep the chapter
        memberId: "",
        toWhom: "",
        amount: "",
        narration: "",
        testimony: "",
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create done deal");
    },
  });

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    const thankYouSlipData = {
      date: values.date.toISOString(),
      chapterId: Number(values.chapterId),
      fromMemberId: Number(values.memberId),
      toWhom: values.toWhom,
      toWhomId: values.toWhomId,
      amount: values.amount,
      narration: values.narration,
      testimony: values.testimony || "",
    };

    createSlipMutation.mutate(thankYouSlipData);
  };

  return (
    <div className="p-6">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Create Done Deal</CardTitle>
          <CardDescription>Create a new done deal for a member</CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date picker */}
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
                                format(field.value, "dd/MM/yyyy")
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
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Chapter selection */}
                <FormField
                  control={form.control}
                  name="chapterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chapter</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Reset member selection when chapter changes
                          form.setValue("memberId", "");
                          refetchMembers();
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a chapter" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingChapters ? (
                            <div className="flex items-center justify-center p-2">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span>Loading chapters...</span>
                            </div>
                          ) : (
                            chapters?.chapters.map((chapter: any) => (
                              <SelectItem
                                key={chapter.id}
                                value={String(chapter.id)}
                              >
                                {chapter.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Member selection */}
                <FormField
                  control={form.control}
                  name="memberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Member</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!form.watch("chapterId")}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                form.watch("chapterId")
                                  ? "Select a member"
                                  : "Select a chapter first"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {!form.watch("chapterId") ? (
                            <div className="flex items-center justify-center p-2">
                              <span>Select a chapter first</span>
                            </div>
                          ) : isLoadingMembers ? (
                            <div className="flex items-center justify-center p-2">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span>Loading members...</span>
                            </div>
                          ) : (
                            members?.map((member: any) => (
                              <SelectItem
                                key={member.id}
                                value={String(member.id)}
                              >
                                {member.memberName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* To Whom field */}
                <FormField
                  control={form.control}
                  name="toWhom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Whom</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Recipient name"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            // Clear toWhomId when manual entry
                            form.setValue("toWhomId", undefined);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Amount field */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter amount" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Narration field */}
              <FormField
                control={form.control}
                name="narration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Narration</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter narration"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Testimony field (optional) */}
              <FormField
                control={form.control}
                name="testimony"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Testimony (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter testimony (optional)"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Add any additional testimony or comments (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createSlipMutation.isLoading}>
                  {createSlipMutation.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Done Deal"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectThankYouSlip;
