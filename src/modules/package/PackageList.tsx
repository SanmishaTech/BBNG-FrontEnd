import React, { useState } from "react";
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
  Check,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CustomPagination from "@/components/common/custom-pagination";
import ConfirmDialog from "@/components/common/confirm-dialog";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";

const PackageList = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("packageName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<number | null>(null);

  // Fetch packages with react-query
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "packages",
      currentPage,
      recordsPerPage,
      sortBy,
      sortOrder,
      search,
    ],
    queryFn: () =>
      get(
        `/packages?page=${currentPage}&limit=${recordsPerPage}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${search}`
      ),
  });

  const packages = data?.packages || [];
  const totalPages = data?.totalPages || 1;
  const totalPackages = data?.totalPackages || 0;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => del(`/packages/${id}`),
    onSuccess: (response) => {
      toast.success(response?.message || "Package deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      setShowConfirmation(false);
      setPackageToDelete(null);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete package"
      );
      console.error("Failed to delete package:", error);
    },
  });

  const confirmDelete = (id: number) => {
    setPackageToDelete(id);
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    if (packageToDelete) {
      deleteMutation.mutate(packageToDelete);
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

  return (
    <div className="mt-2 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Package Management
      </h1>
      <Card className="mx-auto mt-6 sm:mt-10">
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-4 mb-6 mt-6">
            {/* Search Input */}
            <div className="flex-grow">
              <Input
                placeholder="Search packages..."
                value={search}
                onChange={handleSearchChange}
                className="w-full"
                icon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => navigate("/packages/create")}
                className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add New
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
              Failed to load packages.
            </div>
          ) : packages.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      onClick={() => handleSort("packageName")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Package Name</span>
                        {sortBy === "packageName" && (
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
                    <TableHead>Duration</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Basic Fees</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.map((pkg: any) => (
                    <TableRow key={pkg.id}>
                      <TableCell>{pkg.packageName}</TableCell>
                      <TableCell>{pkg.periodMonths} month(s)</TableCell>
                      <TableCell>
                        {pkg.isVenueFee ? (
                          <Badge variant="secondary">Venue Fee</Badge>
                        ) : (
                          <Badge>Membership</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(pkg.basicFees)}</TableCell>
                      <TableCell>
                        {pkg.gstRate}% ({formatCurrency(pkg.gstAmount)})
                      </TableCell>
                      <TableCell>{formatCurrency(pkg.totalFees)}</TableCell>
                      <TableCell>
                        {pkg.active ? (
                          <Badge variant="success" className="bg-green-100 text-green-800">
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-100 text-red-800">
                            <X className="h-3.5 w-3.5 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="justify-end flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/packages/${pkg.id}/edit`)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDelete(pkg.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  <strong>
                    {packages.length > 0
                      ? (currentPage - 1) * recordsPerPage + 1
                      : 0}
                  </strong>{" "}
                  to{" "}
                  <strong>
                    {Math.min(
                      currentPage * recordsPerPage,
                      totalPackages
                    )}
                  </strong>{" "}
                  of <strong>{totalPackages}</strong> packages
                </p>
                
                <CustomPagination
                  currentPage={currentPage || 1}
                  totalPages={totalPages || 1}
                  totalRecords={totalPackages || 0}
                  recordsPerPage={recordsPerPage || 10}
                  onPageChange={setCurrentPage}
                  onRecordsPerPageChange={setRecordsPerPage}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No packages found. Get started by adding your first package.
              </p>
              <Button
                onClick={() => navigate("/packages/create")}
                className="bg-primary"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Package
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        title="Delete Package"
        description="Are you sure you want to delete this package? This action cannot be undone if the package is not in use. If the package is in use, it will be deactivated instead."
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default PackageList; 