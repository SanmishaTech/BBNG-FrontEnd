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
  Calendar,
  CalendarRange,
  Filter,
  Users,
  UserCheck,
} from "lucide-react";
import CustomPagination from "@/components/common/custom-pagination";
import ConfirmDialog from "@/components/common/confirm-dialog";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ChapterVisitorList = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [visitorToDelete, setVisitorToDelete] = useState<number | null>(null);
  const [chapterId, setChapterId] = useState<number | null>(null);
  const [chapterName, setChapterName] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("visitors");

  useEffect(() => {
    // Get user from localStorage
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user.member && user.member.chapterId) {
          setChapterId(user.member.chapterId);
          setChapterName(user.member.chapterName || "Your Chapter");
        } else {
          toast.error("Unable to determine your chapter");
        }
      } catch (error) {
        console.error("Error parsing user data", error);
        toast.error("Error loading user data");
      }
    }
  }, []);

  // Fetch visitors with react-query
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "chapter-visitors",
      chapterId,
      currentPage,
      recordsPerPage,
      sortBy,
      sortOrder,
      search,
      statusFilter,
      fromDate,
      toDate,
      activeTab,
    ],
    queryFn: () => {
      let url = `/visitors?chapterId=${chapterId}&page=${currentPage}&limit=${recordsPerPage}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${search}`;

      // Add isCrossChapter filter based on active tab
      if (activeTab === "visitors") {
        url += `&isCrossChapter=false`;
      } else if (activeTab === "cross-chapter") {
        url += `&isCrossChapter=true`;
      }

      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }

      if (fromDate) {
        url += `&fromDate=${fromDate}`;
      }

      if (toDate) {
        url += `&toDate=${toDate}`;
      }

      return get(url);
    },
    enabled: !!chapterId,
  });

  const visitors = data?.visitors || [];
  const totalPages = data?.totalPages || 1;
  const totalVisitors = data?.totalVisitors || 0;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => del(`/visitors/${id}`),
    onSuccess: () => {
      toast.success("Visitor deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["chapter-visitors"] });
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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
  };

  const convertToMember = (visitor: any) => {
    // Prepare visitor data for member form
    const memberData = {
      memberName: visitor.name || "",
      chapterId: visitor.chapterId || null,
      email: visitor.email || "",
      mobile1: visitor.mobile1 || "",
      mobile2: visitor.mobile2 || null,
      gender: visitor.gender || "",
      addressLine1: visitor.addressLine1 || "",
      addressLine2: visitor.addressLine2 || "",
      location: visitor.city || "",
      pincode: visitor.pincode || "",
      category: visitor.category || "",
    };

    // Store data in localStorage to be accessed by the member creation form
    localStorage.setItem("visitorToMember", JSON.stringify(memberData));

    // Redirect to member creation page
    toast.success(
      "Redirecting to member creation with pre-filled visitor data"
    );
    navigate("/members/create");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
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

  if (!chapterId) {
    return (
      <div className="mt-2 p-4 sm:p-6">
        <div className="flex justify-center items-center h-32">
          <div className="text-center">
            <p className="text-lg text-gray-700">
              Unable to determine your chapter. Please check your profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        {chapterName} Visitors
      </h1>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="visitors" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Visitors
          </TabsTrigger>
          <TabsTrigger value="cross-chapter" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Cross Chapter Visitors
          </TabsTrigger>
        </TabsList>

                <Card className="w-full mt-6">
          <CardContent className="w-full">
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

            {/* Filter Toggle Button */}
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
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

            {/* Date Filters */}
            {showFilters && (
              <div className="w-full flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">
                    From Date
                  </label>
                  <div className="relative">
                    <CalendarRange className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-8 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">
                    To Date
                  </label>
                  <div className="relative">
                    <CalendarRange className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => {
                        setToDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-8 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setFromDate("");
                      setToDate("");
                      setCurrentPage(1);
                    }}
                  >
                    Clear Dates
                  </Button>
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader className="mr-2 h-8 w-8 animate-spin" />
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-red-500">Error loading visitors</p>
            </div>
          ) : visitors.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-32">
              <p className="text-gray-500 mb-4">No visitors found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("name")}
                      >
                        Name
                        {sortBy === "name" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="inline h-4 w-4 ml-1" />
                          ) : (
                            <ChevronDown className="inline h-4 w-4 ml-1" />
                          ))}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("meeting.meetingTitle")}
                      >
                        Meeting
                        {sortBy === "meeting.meetingTitle" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="inline h-4 w-4 ml-1" />
                          ) : (
                            <ChevronDown className="inline h-4 w-4 ml-1" />
                          ))}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("mobile1")}
                      >
                        Mobile
                        {sortBy === "mobile1" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="inline h-4 w-4 ml-1" />
                          ) : (
                            <ChevronDown className="inline h-4 w-4 ml-1" />
                          ))}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("email")}
                      >
                        Email
                        {sortBy === "email" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="inline h-4 w-4 ml-1" />
                          ) : (
                            <ChevronDown className="inline h-4 w-4 ml-1" />
                          ))}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("status")}
                      >
                        Status
                        {sortBy === "status" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="inline h-4 w-4 ml-1" />
                          ) : (
                            <ChevronDown className="inline h-4 w-4 ml-1" />
                          ))}
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitors.map((visitor: any) => (
                      <TableRow key={visitor.id}>
                        <TableCell className="font-medium">
                          {visitor.isCrossChapter && visitor.invitedBy ? (
                            <div>
                              <div>{visitor.invitedBy.memberName || "N/A"}</div>
                              <div className="text-xs text-gray-500">
                                From: {visitor.invitedBy.homeChapter?.name || visitor.chapter || "N/A"}
                              </div>
                            </div>
                          ) : (
                            visitor.name || "N/A"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 mr-1" />
                            {visitor.meeting?.meetingTitle || "N/A"}
                            <span className="text-xs text-gray-500 ml-1">
                              ({formatDate(visitor.meeting?.date)})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {visitor.isCrossChapter && visitor.invitedBy
                            ? visitor.invitedBy.mobile1 || "N/A"
                            : visitor.mobile1 || "N/A"}
                        </TableCell>
                        <TableCell>
                          {visitor.isCrossChapter && visitor.invitedBy
                            ? visitor.invitedBy.email || "N/A"
                            : visitor.email || "N/A"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(visitor.status || "Unknown")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/chaptermeetings/${visitor.meetingId}/visitors/${visitor.id}/edit`
                                )
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!visitor.isCrossChapter && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => convertToMember(visitor)}
                                title="Convert to Member"
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDelete(visitor.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-500">
                  Showing {visitors.length} of {totalVisitors} visitors
                </div>
                <CustomPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
          </CardContent>
        </Card>
      </Tabs>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        title="Confirm Delete"
        description="Are you sure you want to delete this visitor? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ChapterVisitorList;
