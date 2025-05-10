import React, { useState, useEffect } from "react";
import { Button, Input } from "@/components/ui";
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
  UserPlus,
} from "lucide-react";
import CustomPagination from "@/components/common/custom-pagination";
import ConfirmDialog from "@/components/common/confirm-dialog";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const VisitorList = () => {
  const { meetingId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [visitorToDelete, setVisitorToDelete] = useState<number | null>(null);

  // Fetch meeting details
  const { data: meetingData, isLoading: isMeetingLoading } = useQuery({
    queryKey: ["meeting", meetingId],
    queryFn: () => get(`/chapter-meetings/${meetingId}`),
    enabled: !!meetingId,
  });

  // Fetch visitors with react-query
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "visitors",
      meetingId,
      currentPage,
      recordsPerPage,
      sortBy,
      sortOrder,
      search,
      statusFilter,
    ],
    queryFn: () =>
      get(
        `/visitors?meetingId=${meetingId}&page=${currentPage}&limit=${recordsPerPage}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${search}${
          statusFilter ? `&status=${statusFilter}` : ""
        }`
      ),
    enabled: !!meetingId,
  });

  const visitors = data?.visitors || [];
  const totalPages = data?.totalPages || 1;
  const totalVisitors = data?.totalVisitors || 0;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => del(`/visitors/${id}`),
    onSuccess: () => {
      toast.success("Visitor deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["visitors"] });
      setShowConfirmation(false);
      setVisitorToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete visitor");
    },
  });

  const confirmDelete = (id: number) => {
    setVisitorToDelete(id);
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    if (visitorToDelete) {
      deleteMutation.mutate(visitorToDelete);
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

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PPP");
    } catch (e) {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Invited":
        return <Badge className="bg-blue-500">Invited</Badge>;
      case "Confirmed":
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case "Attended":
        return <Badge className="bg-violet-500">Attended</Badge>;
      case "No-Show":
        return <Badge className="bg-red-500">No-Show</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  return (
    <div className="mt-2 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Meeting Visitors
      </h1>

      {isMeetingLoading ? (
        <div className="flex justify-center items-center h-32">
          <Loader className="mr-2 h-8 w-8 animate-spin" />
        </div>
      ) : meetingData ? (
        <div className="mb-6">
          <h2 className="text-lg font-medium">
            Meeting: {meetingData.meetingTitle}
          </h2>
          <p className="text-gray-600">
            Date: {formatDate(meetingData.date)} | Time: {meetingData.meetingTime} | 
            Venue: {meetingData.meetingVenue}
          </p>
        </div>
      ) : null}

      <Card className="mx-auto mt-6 sm:mt-10">
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-4 mb-6 mt-6">
            {/* Search Input */}
            <div className="flex-grow">
              <Input
                placeholder="Search visitors..."
                value={search}
                onChange={handleSearchChange}
                className="w-full"
                icon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-64">
              <Select
                value={statusFilter || "all"}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Invited">Invited</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Attended">Attended</SelectItem>
                  <SelectItem value="No-Show">No-Show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => navigate(`/chaptermeetings/${meetingId}/visitors/add`)}
                className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Add Visitor
              </Button>
            </div>
          </div>

          <Separator className="mb-4" />

          {/* Table Section */}
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader className="mr-2 h-8 w-8 animate-spin" />
            </div>
          ) : isError ? (
            <div className="text-center text-red-500">
              Failed to load visitors.
            </div>
          ) : visitors.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      onClick={() => handleSort("name")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Name</span>
                        {sortBy === "name" && (
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
                    <TableHead>Contact</TableHead>
                    <TableHead>Business Category</TableHead>
                    <TableHead>Chapter</TableHead>
                    <TableHead>Invited By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visitors.map((visitor: any) => (
                    <TableRow key={visitor.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{visitor.name}</div>
                          {visitor.isCrossChapter && (
                            <Badge variant="outline" className="mt-1">
                              Cross-Chapter
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{visitor.mobile1}</div>
                          {visitor.email && (
                            <div className="text-xs text-gray-500">{visitor.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{visitor.category}</TableCell>
                      <TableCell>{visitor.chapter}</TableCell>
                      <TableCell>
                        {visitor.invitedByMember?.memberName || "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(visitor.status)}</TableCell>
                      <TableCell>
                        <div className="justify-end flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/chaptermeetings/${meetingId}/visitors/${visitor.id}/edit`)
                            }
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDelete(visitor.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <CustomPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={totalVisitors}
                recordsPerPage={recordsPerPage}
                onPageChange={setCurrentPage}
                onRecordsPerPageChange={(newLimit) => {
                  setRecordsPerPage(newLimit);
                  setCurrentPage(1);
                }}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No visitors found</h3>
              <p className="text-gray-500 mb-4">
                There are no visitors for this meeting yet.
              </p>
              <Button
                onClick={() => navigate(`/chaptermeetings/${meetingId}/visitors/add`)}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Add First Visitor
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={showConfirmation}
        title="Confirm Deletion"
        description="Are you sure you want to delete this visitor? This action cannot be undone."
        onCancel={() => {
          setShowConfirmation(false);
          setVisitorToDelete(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default VisitorList;