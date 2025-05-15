import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { get, post } from "@/services/apiService";
import { format } from "date-fns";
import { CalendarIcon, InfoIcon } from "lucide-react";
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
  CardFooter,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
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

// Form schema validation
const formSchema = z.object({
  referenceId: z.number(),
  date: z.date(),
  chapterId: z.number(),
  toWhom: z.string().min(1, "Recipient is required"),
  amount: z.string().min(1, "Amount is required"),
  narration: z.string().min(1, "Narration is required"),
  testimony: z.string().min(1, "Testimony is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface ThankYouSlip {
  id: number;
  date: string;
  amount: string;
  toWhom: string;
  narration: string;
  testimony: string;
  chapter: { id: number; name: string };
  createdAt: string;
}

const ThankYouSlipForm = () => {
  const { referenceId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [referenceData, setReferenceData] = useState<any>(null);
  const [previousSlips, setPreviousSlips] = useState<ThankYouSlip[]>([]);
  const [loadingPreviousSlips, setLoadingPreviousSlips] = useState(false);
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      referenceId: parseInt(referenceId || "0"),
      date: new Date(),
      chapterId: 0,
      toWhom: "",
      amount: "",
      narration: "",
      testimony: "",
    },
  });

  // Load reference data and previous thank you slips
  useEffect(() => {
    const loadReferenceData = async () => {
      if (!referenceId) {
        toast.error("Reference ID is missing");
        navigate("/references/received");
        return;
      }

      try {
        setLoading(true);
        const response = await get(`/references/${referenceId}`);
        
        if (response) {
          setReferenceData(response);
          
          // Pre-fill form with data from reference
          form.setValue("referenceId", parseInt(referenceId));
          form.setValue("chapterId", response.chapter?.id || 0);
          form.setValue("toWhom", response.nameOfReferral || "");

          // Load previous thank you slips for this reference
          setLoadingPreviousSlips(true);
          try {
            const slipsResponse = await get(`/thankyou-slips/reference/${referenceId}`);
            if (slipsResponse && slipsResponse.thankYouSlips) {
              setPreviousSlips(slipsResponse.thankYouSlips);
            }
          } catch (slipError) {
            console.error("Error loading thank you slip history:", slipError);
          } finally {
            setLoadingPreviousSlips(false);
          }
        } else {
          toast.error("Failed to load reference data");
          navigate("/references")
        }
      } catch (error) {
        console.error("Error loading reference:", error);
        toast.error("Failed to load reference data");
        navigate("/references/received");
      } finally {
        setLoading(false);
      }
    };

    loadReferenceData();
  }, [referenceId, navigate, form]);

  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    try {
      // Submit thank you slip data to backend
      const response = await post("/thankyou-slips", data);
      
      if (response && response.thankYouSlip) {
        toast.success("Thank you slip submitted successfully");
        navigate("/references/received");
      } else {
        toast.error("Failed to submit thank you slip");
      }
    } catch (error) {
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
            <div className="text-center py-4">Loading reference data...</div>
          </CardContent>
          {previousSlips.length > 0 && (
            <CardFooter className="flex-col items-start border-t p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <InfoIcon className="h-5 w-5 mr-2" />
                Previous Thank You Slips for this Reference
              </h3>
              <div className="w-full space-y-4">
                {previousSlips.map((slip) => (
                  <Alert key={slip.id} className="bg-gray-50">
                    <AlertTitle className="flex justify-between">
                      <span>Sent on {format(new Date(slip.date), "PPP")}</span>
                      <span className="text-sm font-normal">Amount: {slip.amount}</span>
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                      <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                        <div>
                          <p className="font-semibold">To: {slip.toWhom}</p>
                          <p className="text-gray-500">Chapter: {slip.chapter.name}</p>
                        </div>
                        <div>
                          <p className="font-semibold">Narration:</p>
                          <p className="text-gray-600 line-clamp-2">{slip.narration}</p>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Thank You Slip</CardTitle>
          <CardDescription>
            Create a thank you slip for the reference from {referenceData?.giver?.memberName || "Unknown"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reference Information (Read-only) */}
                <div className="bg-gray-50 p-4 rounded-md col-span-full">
                  <h3 className="font-medium mb-2">Reference Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Reference From:</span>{" "}
                      {referenceData?.giver?.memberName || "Unknown"}
                    </div>
                    <div>
                      <span className="font-medium">Recipient:</span>{" "}
                      {referenceData?.receiver?.memberName || "Unknown"}
                    </div>
                    <div>
                      <span className="font-medium">Chapter:</span>{" "}
                      {referenceData?.chapter?.name || "Unknown"}
                    </div>
                  </div>
                </div>

                {/* Date Field */}
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
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
                      <FormLabel>Amount *</FormLabel>
                      <FormControl>
                        <Input
                        
                          type="number"
                         placeholder="Enter amount" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Narration Field */}
                <div className="col-span-full">
                  <FormField
                    control={form.control}
                    name="narration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Narration *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter narration"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Briefly describe the transaction or service
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Testimony Field */}
                <div className="col-span-full">
                  <FormField
                    control={form.control}
                    name="testimony"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Testimony *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter testimony"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Share your experience or testimonial
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/references/received")}
                >
                  Cancel
                </Button>
                <Button type="submit">Submit Thank You Slip</Button>
              </div>
            </form>
          </Form>
        </CardContent>
        
        {previousSlips.length > 0 && (
          <CardFooter className="flex-col items-start border-t p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <InfoIcon className="h-5 w-5 mr-2" />
              Previous Thank You Slips for this Reference
            </h3>
            <div className="w-full space-y-4">
              {previousSlips.map((slip) => (
                <Alert key={slip.id} className="bg-gray-50">
                  <AlertTitle className="flex justify-between">
                    <span>Sent on {format(new Date(slip.date), "PPP")}</span>
                    <span className="text-sm font-normal">Amount: {slip.amount}</span>
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                      <div>
                        <p className="font-semibold">To: {slip.toWhom}</p>
                        <p className="text-gray-500">Chapter: {slip.chapter.name}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Narration:</p>
                        <p className="text-gray-600 line-clamp-2">{slip.narration}</p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ThankYouSlipForm;
