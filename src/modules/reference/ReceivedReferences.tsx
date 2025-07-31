import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { get, patch } from "@/services/apiService";
import { format } from "date-fns";
import { 
  Search, 
  Calendar, 
  Award, 
  Clock, 
  Star, 
  Check,
  ArrowLeftRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";

interface Reference {
  id: number;
  date: string;
  noOfReferences?: number;
  nameOfReferral: string;
  mobile1: string;
  mobile2?: string;
  email?: string;
  status: string;
  urgency?: string;
  self: boolean;
  remarks?: string;
  addressLine1?: string;
  addressLine2?: string;
  location?: string;
  pincode?: string;
  giver?: {
    id: number;
    memberName: string;
    email: string;
  };
  chapter?: {
    id: number;
    name: string;
  };
  createdAt: string;
}

const ReceivedReferences = () => {
  const navigate = useNavigate();
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Get current member ID from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentMemberId = currentUser.member?.id;

  // Load received references (where current member is the receiver)
  const loadReceivedReferences = async () => {
    if (!currentMemberId) {
      toast.error("User information not found. Please login again.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Use the endpoint for received references, passing the current member ID
      const response = await get("/references/received", {
        memberId: currentMemberId,
        page: currentPage,
        limit: 6,
        search: searchTerm,
        status: statusFilter === "all" ? undefined : statusFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      
      // Process references and ensure all required properties
      const processedReferences = (response.references || []).map((ref: Reference) => {
        return {
          ...ref,
          statusHistory: ref.statusHistory || [],
          receiver: ref.receiver || ref.member, // Fallback to member if receiver is not provided
        };
      });
      
      setReferences(processedReferences);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error("Error loading received references:", error);
      toast.error("Failed to load received references");
      setReferences([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceivedReferences();
  }, [currentPage, searchTerm, statusFilter, fromDate, toDate]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await patch(`/references/${id}/status`, { 
        status: newStatus,
        date: new Date().toISOString(),
        comment: "Status updated from references list"
      });
      toast.success(`Reference status updated to ${newStatus}`);
      loadReceivedReferences();
    } catch (error) {
      console.error("Error updating reference status:", error);
      toast.error("Failed to update reference status");
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "contacted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "business done":
      case "business-done":
      case "businessdone":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "converted": // Legacy support for existing data
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "#f59e0b"; // Yellow
      case "contacted":
        return "#3b82f6"; // Blue
      case "business done":
      case "business-done":
      case "businessdone":
        return "#3b82f6"; // Blue
      case "converted": // Legacy support for existing data
        return "#3b82f6"; // Blue
      case "rejected":
        return "#ef4444"; // Red
      default:
        return "#6b7280"; // Gray
    }
  };

  const getUrgencyBadgeClass = (urgency?: string) => {
    if (!urgency) return "";
    
    switch (urgency.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  const ReferenceCard = ({ reference }: { reference: Reference }) => {
    return (
      <Card className="overflow-hidden h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl font-semibold">{reference.nameOfReferral}</CardTitle>
            <Badge className={getStatusBadgeClass(reference.status)}>
              {reference.status}
            </Badge>
          </div>
          <CardDescription className="text-muted-foreground flex items-center gap-1 mt-1">
            <Calendar className="h-3 w-3" />
            {formatDate(reference.date)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="space-y-3">
            {/* Reference flow (who gave the reference) */}
            <div className="bg-gray-50 p-2 rounded-md">
              <span className="text-sm font-medium">Reference from:</span>
              <div className="mt-1 text-sm font-semibold text-blue-600">
                {reference.giver?.memberName || 'Unknown Giver'}
              </div>
            </div>

            <div>
              <span className="text-sm font-medium">Contact:</span> 
              <div className="mt-1 text-sm">
                {reference.mobile1}
                {reference.email && <div className="text-xs text-gray-500">{reference.email}</div>}
              </div>
            </div>

            {reference.urgency && (
              <div>
                <span className="text-sm font-medium">Urgency:</span>
                <div className="mt-1">
                  <Badge className={getUrgencyBadgeClass(reference.urgency)}>
                    {reference.urgency.charAt(0).toUpperCase() + reference.urgency.slice(1)}
                  </Badge>
                </div>
              </div>
            )}

            {reference.remarks && (
              <div>
                <span className="text-sm font-medium">Remarks:</span>
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                  {reference.remarks}
                </p>
              </div>
            )}
            
            {/* Show the last status update (if any) */}
            {reference.statusHistory && reference.statusHistory.length > 0 && (
              <div>
                <span className="text-sm font-medium">Last update:</span>
                <div className="mt-1 text-sm text-gray-600">
                  {formatDate(reference.statusHistory[0].date)}: 
                  <span className="font-medium">{reference.statusHistory[0].status}</span>
                  {reference.statusHistory[0].comment && (
                    <div className="text-xs italic mt-1">"{reference.statusHistory[0].comment}"</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        
        <Separator />
        
        <CardFooter className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <Link to={`/references/${reference.id}`}>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </Link>
          
          {reference.status.toLowerCase() === "business done" || 
           reference.status.toLowerCase() === "business-done" || 
           reference.status.toLowerCase() === "businessdone" ? (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {/* <Badge className="bg-green-100 text-green-800 border-green-200 py-2 h-9 flex items-center justify-center">
                <Check className="h-4 w-4 mr-1" />
                Business Done
              </Badge> */}
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 whitespace-nowrap"
                onClick={() => {
                  navigate(`/references/${reference.id}/thank-you-slip`);
                }}
              >
                Mark Done Deal
              </Button>
            </div>
          ) : (
            <div>
              <Select
                onValueChange={(value) => handleUpdateStatus(reference.id, value)}
                defaultValue={reference.status}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="business done">Business Done</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardFooter>
      </Card>
    );
  };

  const FilterSection = () => {
    return (
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search references..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-10">
      <h3 className="mt-2 text-sm font-semibold text-gray-900">{message}</h3>
    </div>
  );

  const LoadingState = () => (
    <div className="text-center py-10">
      <h3 className="mt-2 text-sm font-semibold text-gray-900">Loading references...</h3>
    </div>
  );

  return (
    <div className="container px-6 py-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">References Received</h1>
        <p className="text-gray-500">References you have received from other members. You can update their status.</p>
        <div className="flex gap-4 mt-4">
        <NavLink
         className={({ isActive }) =>
          isActive
            ? "bg-blue-100 text-blue-700 shadow-sm"
            : "text-gray-600"
        }
          end
          to="/references/received">

            <Button variant="outline" className="shadow-sm">
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              View Recieved
            </Button>
          </NavLink>
          <NavLink
         className={({ isActive }) =>
          isActive
            ? "bg-blue-100 text-blue-700 shadow-sm"
            : "text-gray-600"
        }
          end
          to="/references/given">

            <Button variant="outline" className="shadow-sm">
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              View Given
            </Button>
          </NavLink>
        </div>
      </div>
      
      <FilterSection />
      
      {loading ? (
        <LoadingState />
      ) : references.length === 0 ? (
        <EmptyState message="No references received yet." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {references.map((reference) => (
            <ReferenceCard key={reference.id} reference={reference} />
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {!loading && references.length > 0 && (
        <Pagination className="my-6">
          <PaginationContent>
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="cursor-pointer"
                />
              </PaginationItem>
            )}
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            {currentPage < totalPages && (
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="cursor-pointer"
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default ReceivedReferences; 