import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download } from "lucide-react";
import { get } from "@/services/apiService";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MemberReport: React.FC = () => {
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const handleDownload = async () => {
    try {
      // Build query parameters for date filtering
      const params: Record<string, string> = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      
      // Call backend endpoint with date filters and responseType blob
      const response = await get("/memberreports", params, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, "members.xlsx");
      toast.success("Member report downloaded successfully");
    } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(error);
      toast.error(errorMessage || "Failed to download member report. Please try again.");
    }
  };

  return (
    <Card>
      <CardContent className="p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Member Report</h2>
          <p className="text-sm text-gray-500">
            Download a report of members with details including name, 
            category, gender, date of birth, and creation date.
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

export default MemberReport;
