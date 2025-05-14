import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { get } from "@/services/apiService";
import { format } from "date-fns";
import { Eye, PlusCircle, RefreshCcw, Send, Inbox, FileText } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ThankYouSlip {
  id: number;
  date: string;
  amount: string;
  toWhom: string;
  narration: string;
  testimony: string;
  reference?: {
    id: number;
    nameOfReferral: string;
    status: string;
    giver: {
      id: number;
      memberName: string;
    };
    receiver: {
      id: number;
      memberName: string;
    };
  };
  chapter: {
    id: number;
    name: string;
  };
  fromMember?: {
    id: number;
    memberName: string;
    organizationName?: string;
  };
  createdAt: string;
}

interface PaginationData {
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

const ThankYouSlipList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [thankYouSlips, setThankYouSlips] = useState<ThankYouSlip[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
  });
  const [activeTab, setActiveTab] = useState<string>("given");

  // Load thank you slips based on the active tab
  const loadThankYouSlips = async (page: number, tab = activeTab) => {
    try {
      setLoading(true);
      // Choose the endpoint based on the active tab
      const endpoint = tab === "given" 
        ? `/thankyou-slips/given?page=${page}&limit=10`
        : `/thankyou-slips/received?page=${page}&limit=10`;
        
      const response = await get(endpoint);
      
      if (response && response.thankYouSlips) {
        setThankYouSlips(response.thankYouSlips);
        setPagination({
          totalCount: response.pagination.totalCount,
          totalPages: response.pagination.totalPages,
          currentPage: response.pagination.currentPage,
        });
      } else {
        toast.error(`Failed to load ${tab} thank you slips`);
      }
    } catch (error) {
      console.error(`Error loading ${tab} thank you slips:`, error);
      toast.error(`Failed to load ${tab} thank you slips`);
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    loadThankYouSlips(1, tab);
  };

  // Load slips on initial render
  useEffect(() => {
    loadThankYouSlips(1);
  }, []);

  // Navigate to thank you slip details with tab context
  const viewThankYouSlip = (id: number) => {
    navigate(`/dashboard/thankyou-slips/${id}?type=${activeTab}`);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    loadThankYouSlips(page);
  };



  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Thank You Slips</CardTitle>
            <CardDescription>
              View and manage thank you slips sent and received by you
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => loadThankYouSlips(pagination.currentPage)}
              variant="outline"
              size="icon"
              title="Refresh"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button onClick={() => navigate("/dashboard/thankyou-slips/create")}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Thank You Slip
            </Button>
          </div>
        </CardHeader>
        
        <div className="px-6 mb-4">
          <Tabs defaultValue="given" value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="given" className="flex items-center">
                <Send className="h-4 w-4 mr-2" />
                Given
              </TabsTrigger>
              <TabsTrigger value="received" className="flex items-center">
                <Inbox className="h-4 w-4 mr-2" />
                Received
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">Loading thank you slips...</div>
          ) : thankYouSlips.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-4">No thank you slips found</p>
              <Button onClick={() => navigate("/dashboard/thankyou-slips/create")}>
                Create Your First Thank You Slip
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    {activeTab === "given" ? (
                      <TableHead>To Whom</TableHead>
                    ) : (
                      <TableHead>From</TableHead>
                    )}
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {thankYouSlips.map((slip) => (
                    <TableRow key={slip.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell onClick={() => viewThankYouSlip(slip.id)}>
                        {format(new Date(slip.date), "PP")}
                      </TableCell>
                      <TableCell onClick={() => viewThankYouSlip(slip.id)}>
                        {activeTab === "given" ? 
                          slip.toWhom : 
                          (slip.fromMember?.memberName || slip.chapter.name)
                        }
                      </TableCell>
                      <TableCell onClick={() => viewThankYouSlip(slip.id)}>
                        {slip.amount}
                      </TableCell>
                      <TableCell onClick={() => viewThankYouSlip(slip.id)}>
                        <Badge variant={slip.reference ? "outline" : "default"}>
                          {slip.reference ? "Reference" : "Direct"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => viewThankYouSlip(slip.id)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Details</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {thankYouSlips.length > 0 && (
          <CardFooter className="flex justify-between items-center border-t px-6 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.currentPage - 1) * 10) + 1} to{" "}
              {Math.min(pagination.currentPage * 10, pagination.totalCount)} of{" "}
              {pagination.totalCount} thank you slips
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.currentPage === 1}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
              >
                Previous
              </Button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={pagination.currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="w-8"
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ThankYouSlipList;
