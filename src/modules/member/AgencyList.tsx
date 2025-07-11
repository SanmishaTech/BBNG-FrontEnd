import React, { useState } from "react";
import { Button, Input } from "@/components/ui";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, del, patch } from "@/services/apiService";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import CustomPagination from "@/components/common/custom-pagination";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import membershipicon from "@/images/membership.svg"
import {
  Loader,
  ChevronUp,
  ChevronDown,
  Edit,
  UsersRound,
  Trash2,
  Filter,
  Download,
  Search,
  PlusCircle,
  MoreHorizontal,
  CheckCircle,
  XCircle,
} from "lucide-react";
import ConfirmDialog from "@/components/common/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/formatter";
 
// Fetch members with pagination and filters
const fetchMembers = async (
  page: number,
  sortBy: string,
  sortOrder: string,
  search: string,
  active: string,
  recordsPerPage: number,
  category?: string,
  businessCategory?: string
) => {
  const response = await get(
    `/api/members?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${search}&active=${active}&limit=${recordsPerPage}${
      category ? `&category=${category}` : ""
    }${businessCategory ? `&businessCategory=${businessCategory}` : ""}`
  );
  return response;
};

const MemberList = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("memberName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<number | null>(null);
  const navigate = useNavigate();

  // Fetch members using react-query
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "members",
      currentPage,
      sortBy,
      sortOrder,
      search,
      active,
      recordsPerPage,
    ],
    queryFn: () =>
      fetchMembers(
        currentPage,
        sortBy,
        sortOrder,
        search,
        active,
        recordsPerPage
      ),
  });

  const members = data?.members || [];
  const totalPages = data?.totalPages || 1;
  const totalMembers = data?.totalMembers || 0;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => del(`/api/members/${id}`),
    onSuccess: () => {
      toast.success("Member deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    onError: () => {
      toast.error("Failed to delete member");
    },
  });

  // User status change mutation (only affects user table)
  const changeUserStatusMutation = useMutation({
    mutationFn: (memberId: number) =>
      patch(`/api/members/${memberId}/user-status`, {}),
    onSuccess: (data) => {
      toast.success(`User ${data.active ? 'activated' : 'deactivated'} successfully`);  
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    onError: () => {
      toast.error("Failed to update user status");
    },
  });

  // Handlers
  const confirmDelete = (id: number) => {
    setMemberToDelete(id);
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    if (memberToDelete) {
      deleteMutation.mutate(memberToDelete);
      setShowConfirmation(false);
      setMemberToDelete(null);
    }
  };

  const handleChangeStatus = (memberId: number) => {
    changeUserStatusMutation.mutate(memberId);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleActiveChange = (value: string) => {
    setActive(value);
    setCurrentPage(1);
  };

  const handleCreate = () => {
    navigate("/members/create");
  };

  const handleEdit = (memberId: number) => {
    navigate(`/members/${memberId}/edit`);
  };

  return (
    <div className="mt-2 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Member Management
      </h1>
      <Card className="mx-auto mt-6 sm:mt-10">
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-grow">
              <Input
                placeholder="Search members..."
                value={search}
                onChange={handleSearchChange}
                className="w-full"
                icon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={
                  showFilters || active !== "all" ? "default" : "outline"
                }
                className={`
                  ${
                    showFilters || active !== "all"
                      ? "bg-primary hover:bg-primary/90 text-white shadow-sm"
                      : "hover:bg-accent"
                  }
                  transition-all duration-200
                `}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter
                  className={`mr-2 h-4 w-4 ${showFilters ? "text-white" : ""}`}
                />
                Filters
                {active !== "all" && (
                  <span className="ml-2 bg-white text-primary font-medium rounded-full px-2 py-0.5 text-xs">
                    1
                  </span>
                )}
              </Button>
              <Button
                onClick={handleCreate}
                className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add
              </Button>
            </div>
          </div>

          {/* Collapsible Filters Section */}
          {showFilters && (
            <Card className="p-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Status
                  </label>
                  <Select value={active} onValueChange={handleActiveChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Members</SelectItem>
                      <SelectItem value="true">Active Members</SelectItem>
                      <SelectItem value="false">Inactive Members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters Button */}
                <div className="flex justify-end mt-7">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setActive("all");
                      setCurrentPage(1);
                      setShowFilters(false);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Separator className="mb-4" />

          {/* Table Section */}
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader className="mr-2 h-8 w-8 animate-spin" />
            </div>
          ) : isError ? (
            <div className="text-center text-red-500">
              Failed to load members.
            </div>
          ) : members.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      onClick={() => handleSort("memberName")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Member Name</span>
                        {sortBy === "memberName" && (
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
                      onClick={() => handleSort("email")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Email</span>
                        {sortBy === "email" && (
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
                      onClick={() => handleSort("mobile1")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Mobile</span>
                        {sortBy === "mobile1" && (
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
                      onClick={() => handleSort("organizationName")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Organization</span>
                        {sortBy === "organizationName" && (
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
                      onClick={() => handleSort("active")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Status</span>
                        {sortBy === "active" && (
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
                      onClick={() => handleSort("hoExpiryDate")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>HO Status</span>
                        {sortBy === "hoExpiryDate" && (
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
                      onClick={() => handleSort("venueExpiryDate")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Venue Status</span>
                        {sortBy === "venueExpiryDate" && (
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
                   
                    <TableHead>Actions</TableHead>

                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.memberName}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.mobile1}</TableCell>
                      <TableCell>{member.organizationName}</TableCell>
                      <TableCell>
                        {member.isActive ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      {/* HO Status Column */}
                      <TableCell>
                        {member.hoExpiryDate ? (
                          <Badge
                            className={
                              new Date(member.hoExpiryDate) >= new Date()
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {new Date(member.hoExpiryDate) >= new Date() ? "Active" : "Inactive"}
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800">
                            No Membership
                          </Badge>
                        )}
                      </TableCell>
                      
                      {/* Venue Status Column */}
                      <TableCell>
                        {member.venueExpiryDate ? (
                          <Badge
                            className={
                              new Date(member.venueExpiryDate) >= new Date()
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {new Date(member.venueExpiryDate) >= new Date() ? "Active" : "Inactive"}
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800">
                            No Membership
                          </Badge>
                        )}
                      </TableCell>
                      
                      {/* Overall Status Column */}
                       
                      <TableCell>
                        <div className="flex gap-2">
                        <Button
                          className="cursor-pointer bg-purple-100"
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/memberships?memberId=${member.id}`)}
                            >
                          <UsersRound  size={16}/>
                            
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(member.id)}
                          >
                            <Edit size={16} />
                          </Button>
                           
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDelete(member.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56">
                              <DropdownMenuGroup>
                               
                               
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <CustomPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={totalMembers}
                recordsPerPage={recordsPerPage}
                onPageChange={setCurrentPage}
                onRecordsPerPageChange={(newRecordsPerPage) => {
                  setRecordsPerPage(newRecordsPerPage);
                  setCurrentPage(1);
                }}
              />
            </div>
          ) : (
            <div className="text-center">No members found.</div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={showConfirmation}
        title="Confirm Deletion"
        description="Are you sure you want to delete this member? This action cannot be undone."
        onCancel={() => {
          setShowConfirmation(false);
          setMemberToDelete(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default MemberList;
