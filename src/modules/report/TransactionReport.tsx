import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download } from "lucide-react";
import { get } from "@/services/apiService";

import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TransactionReport: React.FC = () => {
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [accountType, setAccountType] = useState<string>("");
  const [transactionType, setTransactionType] = useState<string>("");
  const [hasInvoice, setHasInvoice] = useState<string>(""); // "", "yes", "no"

  const handleDownload = async () => {
    try {
      // Build query parameters for filtering
      const params: Record<string, string> = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (accountType && accountType !== "all") params.accountType = accountType;
      if (transactionType && transactionType !== "all") params.transactionType = transactionType;
      if (hasInvoice) {
        if (hasInvoice === "yes") params.hasInvoice = "true";
        else if (hasInvoice === "no") params.hasInvoice = "false";
      }
      
      // Call backend endpoint with date filters and responseType blob
      const response = await get("/transactionreports", params, {
        responseType: "blob",
      });

      // Create URL from the response data and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transactions.xlsx');
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success("Transaction report downloaded successfully");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(error);
      toast.error(errorMessage || "Failed to download transaction report. Please try again.");
    }
  };

  return (
    <Card>
      <CardContent className="p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Transaction Report</h2>
          <p className="text-sm text-gray-500">
            Download a report of transactions with details including date, amount, 
            transaction type, and account type, filtered by date range.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fromDate">From Date</Label>
            <Input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="toDate">To Date</Label>
            <Input
              id="toDate"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accountType">Account Type</Label>
            <Select
              value={accountType}
              onValueChange={setAccountType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="transactionType">Transaction Type</Label>
            <Select
              value={transactionType}
              onValueChange={setTransactionType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="hasInvoice">Has Invoice</Label>
            <Select
              value={hasInvoice}
              onValueChange={setHasInvoice}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select invoice status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-center mt-2">
          <Button onClick={handleDownload} className="flex gap-2 items-center">
            <Download size={16} /> Download Excel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionReport;
