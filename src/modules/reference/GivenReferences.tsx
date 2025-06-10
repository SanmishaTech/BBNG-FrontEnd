import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { get, del, patch } from "@/services/apiService";
import { format } from "date-fns";
import { 
  Search, 
  Plus, 
  Pencil, 
  Trash, 
  Calendar, 
  Award, 
  Clock, 
  Star, 
  Check,
  ArrowLeftRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  giverId?: number;
  receiverId?: number;
  member?: {
    id: number;
    memberName: string;
    email: string;
  };
  giver?: {
    id: number;
    memberName: string;
    email: string;
  };
  receiver?: {
    id: number;
    memberName: string;
    email: string;
  };
  chapter?: {
    id: number;
    name: string;
  };
  createdAt: string;
  statusHistory?: Array<{
    id: number;
    date: string;
    status: string;
    comment?: string;
    createdAt: string;
  }>;
}

const GivenReferences = () => {
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

  // Load given references (where current member is the giver)
  const loadGivenReferences = async () => {
    if (!currentMemberId) return;
    
    setLoading(true);
    try {
      const response = await get("/references/given", {
        page: currentPage,
        limit: 6,
        search: searchTerm,
        self: false,
        status: statusFilter === "all" ? undefined : statusFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      
      // Make sure we have all the needed properties
      const processedReferences = response.references.map((ref: Reference) => {
        return {
          ...ref,
          statusHistory: ref.statusHistory || [],
          giver: ref.giver || ref.member, // Fallback to member if giver is not provided
        };
      });
      
      setReferences(processedReferences);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error loading given references:", error);
      toast.error("Failed to load given references");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGivenReferences();
  }, [currentPage, searchTerm, statusFilter, fromDate, toDate]);

  const handleDeleteReference = async (id: number) => {
    try {
      await del(`/references/${id}`);
      toast.success("Reference deleted successfully");
      loadGivenReferences();
    } catch (error) {
      console.error("Error deleting reference:", error);
      toast.error("Failed to delete reference");
    }
  };

  // Note: Reference givers CANNOT update status
  // This function is now disabled and will show a message to the user
  const handleUpdateStatus = async (id: number, newStatus: string) => {
    toast.info("Only the reference receiver can update the status");
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
      case "business done": // Legacy support for existing data
        return "bg-green-100 text-green-800 border-green-200";
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
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="space-y-3">
            {/* Reference flow (who it was given to) */}
            <div className="bg-gray-50 p-2 rounded-md">
              <span className="text-sm font-medium">Reference to:</span>
              <div className="mt-1 text-sm font-semibold text-blue-600">
                {reference.receiver?.memberName || 'Unknown Receiver'}
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
        
        <CardFooter className="pt-4 flex justify-between items-center">
          <Link to={`/references/${reference.id}`}>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </Link>
          
          <div className="flex gap-2">
            <Link to={`/references/${reference.id}/edit`}>
              <Button variant="ghost" size="sm" className="text-blue-500">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
            
            <AlertDialog>
              {/* <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-red-500">
                  <Trash className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger> */}
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Reference</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this reference? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteReference(reference.id)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
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
            <SelectItem value="business done">Business Done</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-10">
      <h3 className="mt-2 text-sm font-semibold text-gray-900">{message}</h3>
      <div className="mt-6">
        <Link to="/references/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Reference
          </Button>
        </Link>
      </div>
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">References Given</h1>
        <p className="text-gray-500">References you have provided to other members.</p>
        <div className="flex gap-4 mt-4 justify-between">
          <div className="flex gap-4">
          <NavLink
          className={({ isActive, isPending }) =>
            isPending ? "pending" : isActive ? "active" : ""
          }
          end
          to="/references/received">
            <Button variant="outline" className="shadow-sm">
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              View Received
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
          
          <div>
          <Link to="/references/create">
            <Button className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Reference
            </Button>
          </Link>
          </div>
          
        </div>
      </div>
      
      <FilterSection />
      
      {loading ? (
        <LoadingState />
      ) : references.length === 0 ? (
        <EmptyState message="No references found. Add your first reference to get started!" />
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

export default GivenReferences; 