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
  member?: {
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
      const response = await get("/references", {
        giverId: currentMemberId,
        self: false,
        page: currentPage,
        limit: 6,
        search: searchTerm,
        status: statusFilter === "all" ? undefined : statusFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      
      setReferences(response.references);
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

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await patch(`/references/${id}/status`, { status: newStatus });
      toast.success(`Reference status updated to ${newStatus}`);
      loadGivenReferences();
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
      case "converted":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
      return format(new Date(dateString), "MMM dd, yyyy");
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
            <div className="flex justify-between items-center">
              <div className="font-medium text-sm">Contact:</div>
              <div className="text-sm">{reference.mobile1}</div>
            </div>
            
            {reference.email && (
              <div className="flex justify-between items-center">
                <div className="font-medium text-sm">Email:</div>
                <div className="text-sm truncate max-w-[180px]">{reference.email}</div>
              </div>
            )}
            
            {reference.chapter && (
              <div className="flex justify-between items-center">
                <div className="font-medium text-sm">Chapter:</div>
                <div className="text-sm">{reference.chapter.name}</div>
              </div>
            )}
            
            {reference.urgency && (
              <div className="flex justify-between items-center">
                <div className="font-medium text-sm">Urgency:</div>
                <Badge variant="outline" className={getUrgencyBadgeClass(reference.urgency)}>
                  {reference.urgency}
                </Badge>
              </div>
            )}
            
            {reference.remarks && (
              <div className="mt-3">
                <div className="font-medium text-sm mb-1">Remarks:</div>
                <div className="text-sm text-muted-foreground line-clamp-3">{reference.remarks}</div>
              </div>
            )}
          </div>
        </CardContent>
        <Separator />
        <CardFooter className="flex justify-between p-4">
          <div className="flex space-x-2">
            <Link to={`/references/${reference.id}`}>
              <Button variant="outline" size="sm">
                View
              </Button>
            </Link>
            <Link to={`/references/${reference.id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
          </div>
          <div className="flex space-x-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                  <Trash className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this reference.
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
    <div className="container px-4 py-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">References Given</h1>
        <div className="flex gap-4">
          <Link to="/dashboard/references/received">
            <Button variant="outline">
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              View Received
            </Button>
          </Link>
          <Link to="/references/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Reference
            </Button>
          </Link>
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