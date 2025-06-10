import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, del } from "@/services/apiService";
import { toast } from "sonner";
import {
  Loader,
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  Search,
  PlusCircle,
  ArrowLeft,
  FileText // Added for invoice button
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CustomPagination from "@/components/common/custom-pagination";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { useRoleAccess } from "@/hooks/useRoleAccess";

interface MembershipListProps {
  memberId?: number; // Optional member ID for filtering
}

// Define the component as a regular named function
function MembershipList({ memberId: propMemberId }: MembershipListProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useRoleAccess();
  
  // Parse memberId from URL query parameters
  const [memberId, setMemberId] = useState<number | undefined>(propMemberId);
  const [memberName, setMemberName] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("invoiceDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [search, setSearch] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [membershipToDelete, setMembershipToDelete] = useState<number | null>(null);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Effect to handle URL memberId parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const memberIdParam = params.get("memberId");
    console.log("memberIdParam", memberIdParam);
    
    if (memberIdParam) {
      const parsedMemberId = parseInt(memberIdParam, 10);
      console.log("parsedMemberId", parsedMemberId);
      
      if (!isNaN(parsedMemberId)) {
        setMemberId(parsedMemberId);
        // Fetch member name for display
        get(`/api/members/${parsedMemberId}`).then((response) => {
          if (response && response.memberName) {
            setMemberName(response.memberName);
          }
        }).catch(error => {
          console.error("Error fetching member details:", error);
        });
      }
    } else {
      // If no memberId in URL and no prop memberId, reset to undefined
      if (!propMemberId) {
        setMemberId(undefined);
        setMemberName("");
      }
    }
  }, [location.search, propMemberId]);

  // Build the API endpoint based on whether we have a memberId
  const apiEndpoint = memberId
    ? `/memberships/member/${memberId}`
    : `/memberships?page=${currentPage}&limit=${recordsPerPage}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${search}`;

  // Fetch memberships with react-query
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "memberships",
      memberId,
      currentPage,
      recordsPerPage,
      sortBy,
      sortOrder,
      search,
    ],
    queryFn: () => get(apiEndpoint),
  });

  // Format data based on whether we have a specific member or general list
  const memberships = memberId ? data || [] : data?.memberships || [];
  const totalPages = memberId
    ? Math.ceil((data?.length || 0) / recordsPerPage)
    : data?.totalPages || 1;
  const totalMemberships = memberId
    ? data?.length || 0
    : data?.totalMemberships || 0;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => del(`/memberships/${id}`),
    onSuccess: (response) => {
      toast.success(response?.message || "Membership deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      if (memberId) {
        queryClient.invalidateQueries({ queryKey: ["memberships", memberId] });
      }
      setShowConfirmation(false);
      setMembershipToDelete(null);
      setIsDeleting(false); // Reset loading state
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete membership"
      );
      console.error("Failed to delete membership:", error);
      setIsDeleting(false); // Reset loading state even on error
    },
  });

  const confirmDelete = (id: number) => {
    setMembershipToDelete(id);
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    if (membershipToDelete) {
      setIsDeleting(true);
      deleteMutation.mutate(membershipToDelete);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "dd MMM yyyy");
  };

  return (
    <div className="mt-2 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Membership Management
      </h1>
      <Card className="mx-auto mt-6 sm:mt-10">
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-4 mb-6 mt-6">
            {/* Search Input */}
           {isAdmin && <div className="flex-grow">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search memberships..."
                  value={search}
                  onChange={handleSearchChange}
                  className="pl-8 w-full"
                />
              </div>
            </div>}

            {/* Action Buttons - Only show for admin users */}
            {isAdmin && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() =>
                    navigate(
                      memberId
                        ? `/members/${memberId}/memberships/add`
                        : "/memberships/add"
                    )
                  }
                  className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add New
                </Button>
              </div>
            )}
          </div>

          <Separator className="mb-4" />

          {/* Table Section */}
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader className="mr-2 h-8 w-8 animate-spin" />
            </div>
          ) : isError ? (
            <div className="text-center text-red-500">
              Failed to load memberships.
            </div>
          ) : memberships.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      onClick={() => handleSort("invoiceNumber")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Invoice #</span>
                        {sortBy === "invoiceNumber" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("invoiceDate")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Date</span>
                        {sortBy === "invoiceDate" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    {!memberId && <TableHead>Member</TableHead>}
                    <TableHead>Package</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="text-end">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberships.map((membership: any) => {
                    const isActive =
                      new Date(membership.packageEndDate) >= new Date();
                    const packageType = membership.package.isVenueFee
                      ? "Venue Fee"
                      : "Membership";

                    return (
                      <TableRow key={membership.id}>
                        <TableCell>{membership.invoiceNumber}</TableCell>
                        <TableCell>
                          {formatDate(membership.invoiceDate)}
                        </TableCell>
                        {!memberId && (
                          <TableCell>{membership.member.memberName}</TableCell>
                        )}
                        <TableCell>{membership.package.packageName}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              membership.package.isVenueFee
                                ? "secondary"
                                : "default"
                            }
                          >
                            {packageType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(membership.packageStartDate)} to{" "}
                          {formatDate(membership.packageEndDate)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(membership.totalFees)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {isActive ? "Active" : "Expired"}
                          </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              {/* <Button
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  navigate(`/memberships/${membership.id}/edit`)
                                }
                                title="Edit Membership"
                              >
                                <Edit className="h-4 w-4" />
                              </Button> */}
                              {membership.invoiceNumber && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={async () => {
                                    if (isDownloadingInvoice === membership.id) return; // Prevent multiple clicks
                                    setIsDownloadingInvoice(membership.id);
                                    try {
                                      const token = localStorage.getItem("authToken"); // Assumes token is stored with key 'token'
                                      if (!token) {
                                        toast.error("Authentication token not found. Please log in again.");
                                        return;
                                      }
                                      const response = await fetch(`/api/memberships/invoice/${membership.invoiceNumber}.pdf`, {
                                        headers: {
                                          Authorization: `Bearer ${token}`,
                                        },
                                      });

                                      if (!response.ok) {
                                        let errorMsgString = `Failed to download invoice. Status: ${response.status}`;
                                        try {
                                          const errorData = await response.json(); // errorData is an object
                                          if (typeof errorData.message === 'string') {
                                            errorMsgString = errorData.message;
                                          } else if (typeof errorData.error === 'string') {
                                            errorMsgString = errorData.error;
                                          } else if (errorData.message) {
                                            errorMsgString = JSON.stringify(errorData.message);
                                          } else if (errorData.error) {
                                            errorMsgString = JSON.stringify(errorData.error);
                                          } // Keep original if no better message found
                                        } catch (e) { /* ignore if error response is not JSON, errorMsgString remains the status message */ }
                                        toast.error(errorMsgString);
                                        throw new Error(errorMsgString);
                                      }

                                      const blob = await response.blob();
                                      // Check if the server responded with an error in JSON format instead of a PDF
                                      if (blob.type === 'application/json') {
                                          try {
                                              const errorText = await blob.text();
                                              const errorData = JSON.parse(errorText);
                                              toast.error(errorData.message || "Failed to download invoice: Server returned an error.");
                                          } catch (e) {
                                              toast.error("Failed to download invoice: Received an unexpected error format from server.");
                                          }
                                          return;
                                      }

                                      const url = window.URL.createObjectURL(blob);
                                      const a = document.createElement("a");
                                      a.href = url;
                                      a.download = `${membership.invoiceNumber}.pdf`;
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a); // Clean up
                                      window.URL.revokeObjectURL(url);
                                    } catch (error) {
                                      console.error("Download invoice error:", error);
                                      // Avoid duplicate generic toasts if a specific one was already shown by response check
                                      const errorMessage = error instanceof Error ? error.message : String(error);
                                      if (!errorMessage.includes("Failed to download invoice")) {
                                         toast.error("An unexpected error occurred while downloading the invoice: " + errorMessage);
                                      }
                                    } finally {
                                      setIsDownloadingInvoice(null);
                                    }
                                  }}
                                  title="View Invoice"
                                  disabled={isDownloadingInvoice === membership.id}
                                >
                                  {isDownloadingInvoice === membership.id ? (
                                    <Loader className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <FileText className="h-4 w-4 text-blue-600 hover:text-blue-800" />
                                  )}
                                </Button>
                              )}
                              <Dialog open={showConfirmation && membershipToDelete === membership.id} onOpenChange={(isOpen) => { if (!isOpen) { setShowConfirmation(false); setMembershipToDelete(null); } }}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => confirmDelete(membership.id)}
                                    title="Delete Membership"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Confirm Deletion</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to delete membership record {membership.invoiceNumber ? `for invoice ${membership.invoiceNumber}` : `ID ${membership.id}`}? This action cannot be undone.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => { setShowConfirmation(false); setMembershipToDelete(null); }} disabled={isDeleting}>
                                      Cancel
                                    </Button>
                                    <Button onClick={handleDelete} variant="destructive" disabled={isDeleting}>
                                      {isDeleting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                                      Delete
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground text-center">
                  Showing{" "}
                  <strong>
                    {memberships.length > 0
                      ? (currentPage - 1) * recordsPerPage + 1
                      : 0}
                  </strong>{" "}
                  to{" "}
                  <strong>
                    {(currentPage - 1) * recordsPerPage + memberships.length}
                  </strong>{" "}
                  of <strong>{totalMemberships}</strong> memberships
                </p>
                <CustomPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalRecords={totalMemberships}
                  recordsPerPage={recordsPerPage}
                  onPageChange={setCurrentPage}
                  onRecordsPerPageChange={setRecordsPerPage}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">
                No memberships found.
              </p>
              {isAdmin && (
                <Button
                  onClick={() =>
                    navigate(
                      memberId
                        ? `/members/${memberId}/memberships/add`
                        : "/memberships/add"
                    )
                  }
                  variant="default"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Membership
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Membership</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this membership? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowConfirmation(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Make sure this is properly exported
export default MembershipList;
