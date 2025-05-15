import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { get, patch, del } from "@/services/apiService";
import { format } from "date-fns";
import { 
  Search, 
  Calendar, 
  Clock, 
  User, 
  Users,
  MessageSquare,
  MoreHorizontal,
  Check,
  X,
  RefreshCcw,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";

interface OneToOne {
  id: number;
  date: string;
  status: string;
  remarks?: string;
  createdAt: string;
  requester?: {
    id: number;
    memberName: string;
    email: string;
    organizationName: string;
  };
  requested?: {
    id: number;
    memberName: string;
    email: string;
    organizationName: string;
  };
  chapter?: {
    id: number;
    name: string;
  };
}

const OneToOneList = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("requested");
  const [oneToOnes, setOneToOnes] = useState<OneToOne[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Get current member ID from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentMemberId = currentUser.member?.id;

  // Load one-to-one meetings based on active tab
  const loadOneToOnes = async () => {
    if (!currentMemberId) {
      toast.error("User information not found. Please login again.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const endpoint = activeTab === "received" ? "/one-to-ones/received" : "/one-to-ones/requested";
      
      const response = await get(endpoint, {
        memberId: currentMemberId,
        page: currentPage,
        limit: 6,
        status: statusFilter === "all" ? undefined : statusFilter || undefined,
      });
      
      setOneToOnes(response.oneToOnes || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error("Error loading one-to-one meetings:", error);
      toast.error("Failed to load one-to-one meetings");
      setOneToOnes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOneToOnes();
  }, [activeTab, currentPage, statusFilter, currentMemberId]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await patch(`/one-to-ones/${id}/status`, { status: newStatus });
      toast.success(`Meeting status updated to ${newStatus}`);
      loadOneToOnes();
    } catch (error) {
      console.error("Error updating meeting status:", error);
      toast.error("Failed to update meeting status");
    }
  };

  const handleDeleteMeeting = async () => {
    if (!deleteId) return;
    
    try {
      await del(`/one-to-ones/${deleteId}`);
      toast.success("One-to-One meeting deleted successfully");
      loadOneToOnes();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting meeting:", error);
      toast.error("Failed to delete meeting");
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
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

  const OneToOneCard = ({ oneToOne }: { oneToOne: OneToOne }) => {
    const isReceived = activeTab === "received";
    const otherMember = isReceived ? oneToOne.requester : oneToOne.requested;
    
    return (
      <Card className="overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow">
        <CardHeader className="pb-3 bg-gray-50">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl font-semibold">
              {isReceived ? "From: " : "To: "} 
              {otherMember?.memberName}
            </CardTitle>
            <Badge className={getStatusBadgeClass(oneToOne.status)}>
              {oneToOne.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-grow py-4">
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <Calendar className="mr-2 h-4 w-4 text-gray-500" />
              <span className="font-medium mr-2">Date:</span>
              {formatDate(oneToOne.date)}
            </div>
            
            {oneToOne.chapter?.name && (
              <div className="flex items-center text-sm">
                <Users className="mr-2 h-4 w-4 text-gray-500" />
                <span className="font-medium mr-2">Chapter:</span>
                {oneToOne.chapter.name}
              </div>
            )}
            
            {oneToOne.remarks && (
              <div className="mt-2">
                <div className="flex items-center text-sm">
                  <MessageSquare className="mr-2 h-4 w-4 text-gray-500" />
                  <span className="font-medium">Remarks:</span>
                </div>
                <div className="text-sm text-gray-600 pl-6 mt-1">{oneToOne.remarks}</div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-0 pb-3 px-6 flex justify-between">
          <div className="text-xs text-gray-500">
            {formatDate(oneToOne.createdAt)}
          </div>
          {isReceived && oneToOne.status === "pending" ? (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                onClick={() => handleUpdateStatus(oneToOne.id, "cancelled")}
              >
                <X className="mr-1 h-3 w-3" /> Reject
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                onClick={() => handleUpdateStatus(oneToOne.id, "accepted")}
              >
                <Check className="mr-1 h-3 w-3" /> Accept
              </Button>
            </div>
          ) : oneToOne.status === "accepted" && (
            null
          )}
        </CardFooter>
      </Card>
    );
  };

  const FilterSection = () => {
    return (
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="md:w-[200px]">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Meetings</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              {/* <SelectItem value="completed">Completed</SelectItem> */}
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search one-to-one meetings..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div> */}
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
      <h3 className="mt-2 text-sm font-semibold text-gray-900">Loading one-to-one meetings...</h3>
    </div>
  );

  return (
    <div className="container px-4 py-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">One-to-One Meetings</h1>
        <Link to="/one-to-ones/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Meeting
          </Button>
        </Link>
      </div>
      
      <Tabs defaultValue="requested" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 w-full md:w-auto">
          <TabsTrigger value="requested" className="px-6">
            <Calendar className="mr-2 h-4 w-4" />
            Meetings I Scheduled
          </TabsTrigger>
          <TabsTrigger value="received" className="px-6">
            <User className="mr-2 h-4 w-4" />
            Meetings With Me
          </TabsTrigger>
        </TabsList>
        
        <FilterSection />
        
        <TabsContent value="requested" className="mt-4">
          {loading ? (
            <LoadingState />
          ) : oneToOnes.length === 0 ? (
            <EmptyState 
              message={statusFilter === "all" ? 
                "You haven't scheduled any one-to-one meetings yet." : 
                `No ${statusFilter} meetings found.`} 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {oneToOnes.map((oneToOne) => (
                <OneToOneCard key={oneToOne.id} oneToOne={oneToOne} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="received" className="mt-4">
          {loading ? (
            <LoadingState />
          ) : oneToOnes.length === 0 ? (
            <EmptyState 
              message={statusFilter === "all" ? 
                "No one has scheduled a one-to-one meeting with you yet." : 
                `No ${statusFilter} meetings found.`} 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {oneToOnes.map((oneToOne) => (
                <OneToOneCard key={oneToOne.id} oneToOne={oneToOne} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Pagination */}
      {!loading && oneToOnes.length > 0 && (
        <Pagination className="my-8 flex justify-center">
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
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel One-to-One Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this one-to-one meeting? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMeeting}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OneToOneList; 