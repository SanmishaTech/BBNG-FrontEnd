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

const ReferencesDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("given");
  const [givenReferences, setGivenReferences] = useState<Reference[]>([]);
  const [receivedReferences, setReceivedReferences] = useState<Reference[]>([]);
  const [givenLoading, setGivenLoading] = useState(true);
  const [receivedLoading, setReceivedLoading] = useState(true);
  const [givenCurrentPage, setGivenCurrentPage] = useState(1);
  const [receivedCurrentPage, setReceivedCurrentPage] = useState(1);
  const [givenTotalPages, setGivenTotalPages] = useState(1);
  const [receivedTotalPages, setReceivedTotalPages] = useState(1);
  const [givenSearchTerm, setGivenSearchTerm] = useState("");
  const [receivedSearchTerm, setReceivedSearchTerm] = useState("");
  const [givenStatusFilter, setGivenStatusFilter] = useState("");
  const [receivedStatusFilter, setReceivedStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Get current member ID from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentMemberId = currentUser.member.id;
  const memberName = currentUser?.member?.memberName || currentUser?.memberName || currentUser?.name || "";
  const memberEmail = currentUser?.member?.email || currentUser?.email || "";
  const memberMobile = currentUser?.member?.mobile1 || "";

  // Load given references (where current member is the giver)
  const loadGivenReferences = async () => {
    if (!currentMemberId) return;
    
    setGivenLoading(true);
    try {
      const response = await get("/references", {
        giverId: currentMemberId,
        self: false,
        page: givenCurrentPage,
        limit: 6,
        search: givenSearchTerm,
        status: givenStatusFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      
      setGivenReferences(response.references);
      setGivenTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error loading given references:", error);
      toast.error("Failed to load given references");
    } finally {
      setGivenLoading(false);
    }
  };

  // Load received references (where current member is the recipient)
  const loadReceivedReferences = async () => {
    if (!currentMemberId) {
      toast.error("User information not found. Please login again.");
      setReceivedLoading(false);
      return;
    }
    
    setReceivedLoading(true);
    try {
      // Use the endpoint for received references, passing the current member ID
      const response = await get("/references/received", {
        memberId: currentMemberId,
        page: receivedCurrentPage,
        limit: 6,
        search: receivedSearchTerm,
        status: receivedStatusFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      
      console.log("Received references:", response);
      setReceivedReferences(response.references || []);
      setReceivedTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error("Error loading received references:", error);
      toast.error("Failed to load received references");
      setReceivedReferences([]);
    } finally {
      setReceivedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "given") {
      loadGivenReferences();
    } else {
      loadReceivedReferences();
    }
  }, [
    activeTab, 
    givenCurrentPage, 
    receivedCurrentPage, 
    givenSearchTerm, 
    receivedSearchTerm, 
    givenStatusFilter, 
    receivedStatusFilter,
    fromDate,
    toDate
  ]);

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
      
      // Reload appropriate references list
      if (activeTab === "given") {
        loadGivenReferences();
      } else {
        loadReceivedReferences();
      }
    } catch (error) {
      console.error("Error updating reference status:", error);
      toast.error("Failed to update reference status");
    }
  };

  const handleAddTestimonial = (referenceId: number) => {
    // Navigate to testimonial form or open modal
    navigate(`/references/${referenceId}/testimonial/add`);
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
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (error) {
      return "Invalid date";
    }
  };

  const ReferenceCard = ({ reference }: { reference: Reference }) => {
    const isGivenTab = activeTab === "given";
    
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{reference.nameOfReferral}</CardTitle>
              <CardDescription>
                {reference.chapter?.name || "No Chapter"} • {formatDate(reference.date)}
              </CardDescription>
            </div>
            <div className="flex gap-1">
              {reference.urgency && (
                <Badge variant="outline" className={getUrgencyBadgeClass(reference.urgency)}>
                  {reference.urgency}
                </Badge>
              )}
              <Badge variant="outline" className={getStatusBadgeClass(reference.status)}>
                {reference.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="space-y-3">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Contact:</span>
              <span className="font-medium">{reference.mobile1}</span>
            </div>
            
            {reference.email && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{reference.email}</span>
              </div>
            )}
            
            <div className="mt-4 p-2 bg-slate-50 rounded-md text-sm">
              {isGivenTab ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground font-medium">Given by:</span>
                    <span>{memberName} (you)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground font-medium">Given to:</span>
                    <span>{reference.nameOfReferral}</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground font-medium">Given to:</span>
                    <span>{reference.nameOfReferral}</span>
                    {reference.nameOfReferral.toLowerCase() === memberName.toLowerCase() && (
                      <span className="text-gray-500 text-xs">(you)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground font-medium">Given by:</span>
                    <span>{reference.member?.memberName || "Unknown member"}</span>
                  </div>
                  {reference.member?.email && (
                    <div className="text-gray-500 text-xs mt-1">
                      Contact: {reference.member.email}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {reference.location && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium">{reference.location}</span>
              </div>
            )}
            
            {reference.remarks && (
              <div>
                <span className="text-muted-foreground">Remarks:</span>
                <p className="mt-1 text-sm line-clamp-2">{reference.remarks}</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-between pt-3 border-t">
          <div className="flex gap-2 mb-2 sm:mb-0">
            <Link to={`/references/${reference.id}`}>
              <Button size="sm" variant="outline">View</Button>
            </Link>
            <Link to={`/references/${reference.id}/edit`}>
              <Button size="sm" variant="outline">
                <Pencil className="mr-1 h-3 w-3" /> Edit
              </Button>
            </Link>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="default" 
              onClick={() => handleAddTestimonial(reference.id)}
            >
              <Star className="mr-1 h-3 w-3" /> Add Testimonial
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <Trash className="mr-1 h-3 w-3" /> Delete
                </Button>
              </AlertDialogTrigger>
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

  const FilterSection = ({ 
    searchTerm, 
    setSearchTerm, 
    statusFilter, 
    setStatusFilter 
  }: { 
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    statusFilter: string;
    setStatusFilter: (value: string) => void;
  }) => {
    return (
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[260px]">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search references..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Select 
            value={statusFilter} 
            onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="businessdone">Business Done</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => navigate("/references/create")}>
            <Plus className="mr-2 h-4 w-4" /> Add Reference
          </Button>
        </div>
      </div>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-10 border rounded-md bg-gray-50">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
        <Award className="h-8 w-8 text-gray-400" />
      </div>
      <p className="text-lg text-gray-500 mb-4">{message}</p>
      <Button onClick={() => navigate("/references/create")}>
        <Plus className="mr-2 h-4 w-4" /> Add Your First Reference
      </Button>
    </div>
  );

  const LoadingState = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Card key={item} className="h-[280px]">
          <CardHeader className="pb-2">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
            </div>
          </CardContent>
          <CardFooter className="pt-2 border-t">
            <div className="flex justify-between w-full">
              <div className="h-8 bg-gray-200 rounded animate-pulse w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-1/4"></div>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My References</h1>
        <p className="text-muted-foreground mt-1">
          Manage all your business references and track their progress
        </p>
      </div>
      
      <Tabs defaultValue="given" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="given" className="px-6">
              <ArrowLeftRight className="mr-2 h-4 w-4 rotate-45" />
              Given References
            </TabsTrigger>
            <TabsTrigger value="received" className="px-6">
              <ArrowLeftRight className="mr-2 h-4 w-4 rotate-[225deg]" />
              Received References
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="given" className="space-y-6">
          <FilterSection 
            searchTerm={givenSearchTerm}
            setSearchTerm={setGivenSearchTerm}
            statusFilter={givenStatusFilter}
            setStatusFilter={setGivenStatusFilter}
          />
          
          {givenLoading ? (
            <LoadingState />
          ) : givenReferences.length === 0 ? (
            <EmptyState message="You haven't given any references yet" />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {givenReferences.map((reference) => (
                  <ReferenceCard key={reference.id} reference={reference} />
                ))}
              </div>
              
              {givenTotalPages > 1 && (
                <Pagination className="mt-6">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setGivenCurrentPage((prev) => Math.max(prev - 1, 1))}
                        className={givenCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: givenTotalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setGivenCurrentPage(page)}
                          isActive={givenCurrentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setGivenCurrentPage((prev) => Math.min(prev + 1, givenTotalPages))}
                        className={givenCurrentPage === givenTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="received" className="space-y-6">
          <FilterSection 
            searchTerm={receivedSearchTerm}
            setSearchTerm={setReceivedSearchTerm}
            statusFilter={receivedStatusFilter}
            setStatusFilter={setReceivedStatusFilter}
          />
          
          {receivedLoading ? (
            <LoadingState />
          ) : receivedReferences.length === 0 ? (
            <EmptyState message="You haven't received any references yet" />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {receivedReferences.map((reference) => (
                  <ReferenceCard key={reference.id} reference={reference} />
                ))}
              </div>
              
              {receivedTotalPages > 1 && (
                <Pagination className="mt-6">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setReceivedCurrentPage((prev) => Math.max(prev - 1, 1))}
                        className={receivedCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: receivedTotalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setReceivedCurrentPage(page)}
                          isActive={receivedCurrentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setReceivedCurrentPage((prev) => Math.min(prev + 1, receivedTotalPages))}
                        className={receivedCurrentPage === receivedTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReferencesDashboard; 