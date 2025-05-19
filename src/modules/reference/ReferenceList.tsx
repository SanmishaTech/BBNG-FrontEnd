import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { get } from "@/services/apiService";
import { format } from "date-fns";
import { Pencil, Eye, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from 'sonner';

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
  member?: {
    id: number;
    memberName: string;
    email: string;
  };
  chapter?: {
    id: number;
    name: string;
  };
}

const ReferenceList = () => {
  const navigate = useNavigate();
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  const loadReferences = async () => {
    setLoading(true);
    try {
      const response = await get("/references", {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        sortBy,
        sortOrder,
        status: statusFilter || undefined,
      });
      
      setReferences(response.references);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error loading references:", error);
      toast.error("Failed to load references");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferences();
  }, [currentPage, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);
    setCurrentPage(1);
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "contacted":
        return "bg-blue-100 text-blue-800";
      case "converted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">References</h1>
        <Button onClick={() => navigate("/references/create")}>
          <Plus className="mr-2 h-4 w-4" /> Add Reference
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[280px]">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search references..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
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

      {loading ? (
        <div className="text-center py-10">Loading references...</div>
      ) : references.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg text-gray-500">No references found</p>
          <Button onClick={() => navigate("/references/create")} className="mt-4">
            Add your first reference
          </Button>
        </div>
      ) : (
        <>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort("date")}
                  >
                    Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Chapter</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort("nameOfReferral")}
                  >
                    Name of Referral {sortBy === "nameOfReferral" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {references.map((reference) => (
                  <TableRow key={reference.id}>
                    <TableCell>
                      {format(new Date(reference.date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      {reference.member?.memberName || "N/A"}
                    </TableCell>
                    <TableCell>
                      {reference.chapter?.name || "N/A"}
                    </TableCell>
                    <TableCell>{reference.nameOfReferral}</TableCell>
                    <TableCell>
                      {reference.mobile1}
                      {reference.email && <div className="text-xs text-gray-500">{reference.email}</div>}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(reference.status)}`}>
                        {reference.status.charAt(0).toUpperCase() + reference.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {reference.urgency || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Link to={`/references/${reference.id}`}>
                          <Button variant="outline" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to={`/references/${reference.id}/edit`}>
                          <Button variant="outline" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
};

export default ReferenceList;