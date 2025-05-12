import { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, put } from "@/services/apiService";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
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
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

// Schema Definition
const numberOptional = () =>
  z
    .preprocess((v) => (v === "" || v === null ? undefined : Number(v)), z.number().nonnegative())
    .optional();

const transactionSchema = z.object({
  date: z.date({ required_error: "Date is required" }),
  accountType: z.enum(["cash", "bank"], {
    required_error: "Account type is required",
  }),
  transactionType: z.enum(["credit", "debit"], {
    required_error: "Transaction type is required",
  }),
  amount: z
    .number({ required_error: "Amount is required" })
    .positive("Amount must be positive"),
  transactionHead: z.string().optional(),
  narration: z.string().optional(),
  transactionDetails: z.string().optional(),
  description: z.string().optional(),
  reference: z.string().optional(),
  hasInvoice: z.boolean().default(false),
  gstRate: numberOptional(),
  gstAmount: numberOptional(),
  invoiceNumber: z.string().optional(),
  partyName: z.string().optional(),
  partyGSTNo: z.string().optional(),
  partyAddress: z.string().optional(),
});

type TransactionFormInputs = z.infer<typeof transactionSchema>;

// Main Component
export default function TransactionForm({ mode }: { mode: "create" | "edit" }) {
  const { chapterId, id } = useParams<{ chapterId: string; id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Initialize react-hook-form
  const form = useForm<TransactionFormInputs>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date(),
      accountType: "cash",
      transactionType: "credit",
      amount: 0,
      transactionHead: "",
      narration: "",
      transactionDetails: "",
      description: "",
      reference: "",
      hasInvoice: false,
      gstRate: undefined,
      gstAmount: undefined,
      invoiceNumber: "",
      partyName: "",
      partyGSTNo: "",
      partyAddress: "",
    },
  });

  const { reset } = form;
  const hasInvoice = form.watch("hasInvoice");
  const isCredit = form.watch("transactionType") === "credit";
  const isBankAccount = form.watch("accountType") === "bank";

  // Fetch transaction data if in edit mode
  const { data: transaction, isLoading: loadingTransaction } = useQuery({
    queryKey: ["transaction", id],
    queryFn: () => get(`/transactionRoutes/transactions/${id}`),
    enabled: mode === "edit" && !!id,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: TransactionFormInputs) => {
      return post(`/transactionRoutes/chapters/${chapterId}/transactions`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", chapterId] });
      toast.success("Transaction created successfully");
      navigate(`/chapters/${chapterId}/transactions`);
    },
    onError: (error: any) => {
      // Check for negative balance errors
      if (error.response?.data?.errors?.message?.includes("negative")) {
        // Redirect with error message in state
        navigate(`/chapters/${chapterId}/transactions`, { 
          state: { error: error.response.data.errors.message } 
        });
      } else {
        toast.error(error.message || "Failed to create transaction");
      }
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: TransactionFormInputs) => {
      return put(`/transactionRoutes/transactions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", chapterId] });
      toast.success("Transaction updated successfully");
      navigate(`/chapters/${chapterId}/transactions`);
    },
    onError: (error: any) => {
      // Check for negative balance errors
      if (error.response?.data?.errors?.message?.includes("negative")) {
        // Redirect with error message in state
        navigate(`/chapters/${chapterId}/transactions`, { 
          state: { error: error.response.data.errors.message } 
        });
      } else {
        toast.error(error.message || "Failed to update transaction");
      }
    },
  });

  // Set form values when transaction data is loaded
  useEffect(() => {
    if (transaction && mode === "edit") {
      reset({
        ...transaction,
        date: new Date(transaction.date),
        amount: Number(transaction.amount),
        gstRate: transaction.gstRate ? Number(transaction.gstRate) : undefined,
        gstAmount: transaction.gstAmount
          ? Number(transaction.gstAmount)
          : undefined,
      });

    }
  }, [transaction, reset, mode]);

  // When transaction type switches to debit, automatically disable invoice fields
  useEffect(() => {
    if (!isCredit) {
      form.setValue("hasInvoice", false);
    }
  }, [isCredit, form]);

  // Submit handler
  const onSubmit: SubmitHandler<TransactionFormInputs> = (data) => {
    if (mode === "create") {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  return (
    <Card className="max-w-6xl mx-auto my-8">
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Add New Transaction" : "Edit Transaction"}
        </CardTitle>
        <CardDescription>
          {mode === "create"
            ? "Create a new transaction for this chapter"
            : "Update transaction details"}
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
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
                          variant={"outline"}
                          className={`w-full pl-3 text-left font-normal ${
                            !field.value && "text-muted-foreground"
                          }`}
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

           
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <FormField
      control={form.control}
      name="accountType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Account Type</FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
          >
            <FormControl>
              <SelectTrigger className="w-[350px]">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank">Bank</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />

    <FormField
      control={form.control}
      name="transactionType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Transaction Type</FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
          >
            <FormControl>
            <SelectTrigger className="w-[350px]">
            <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="credit">Receipt</SelectItem>
              <SelectItem value="debit">Payment</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />

    {isCredit && (
      <FormField
        control={form.control}
        name="hasInvoice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Invoice?</FormLabel>
            <Select
              onValueChange={(val) => field.onChange(val === "true")}
              defaultValue={field.value ? "true" : "false"}
            >
              <FormControl>
              <SelectTrigger className="w-[350px]">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    )}
  </div>

  <FormField
    control={form.control}
    name="amount"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Amount</FormLabel>
        <FormControl>
          <Input
            type="number"
            step="0.01"
            placeholder="Enter amount"
            {...field}
            onChange={(e) => {
              const value = e.target.value
                ? parseFloat(e.target.value)
                : 0;
              field.onChange(value);
            }}
            value={field.value || ""}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormField
      control={form.control}
      name="transactionHead"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Transaction Head</FormLabel>
          <FormControl>
            <Input
              placeholder="Enter transaction head"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    <FormField
      control={form.control}
      name="narration"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Narration</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Enter narration"
              className="resize-none"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Description (Optional)</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Enter transaction description"
              className="resize-none"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    {isBankAccount && (
      <FormField
        control={form.control}
        name="transactionDetails"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Transaction Details</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter transaction details"
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )}

    {isBankAccount && (
      <FormField
        control={form.control}
        name="reference"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Reference Number</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter reference number"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )}
  </div>



  {isCredit && hasInvoice && (
    <div className="space-y-4 border-t pt-4">
      <h1 className="text-lg font-semibold">Invoice Details</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="gstRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>GST Rate (%)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="e.g., 18" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gstAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>GST Amount</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="GST amount" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="invoiceNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invoice Number</FormLabel>
              <FormControl>
                <Input placeholder="Invoice no." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="partyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Party Name</FormLabel>
              <FormControl>
                <Input placeholder="Party name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="partyGSTNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Party GST No</FormLabel>
              <FormControl>
                <Input placeholder="GSTIN" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="partyAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Party Address</FormLabel>
              <FormControl>
                <Textarea placeholder="Address" className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )}
          </CardContent>

          <CardFooter className="flex justify-end space-x-4 pt-6">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate(`/chapters/${chapterId}/transactions`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                loadingTransaction
              }
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : mode === "create"
                ? "Create Transaction"
                : "Update Transaction"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
