import React, { useState, useEffect } from "react";
import { Button, Input } from "@/components/ui";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import MultipleSelector, {
  Option,
} from "@/components/common/multiple-selector"; // Import MultipleSelector from common folder
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
  Loader,
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  Filter,
  Download,
  ShieldEllipsis,
  Search,
  PlusCircle,
  MoreHorizontal,
  CheckCircle,
  XCircle,
} from "lucide-react";
import ConfirmDialog from "@/components/common/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import EditLocation from "./EditCountry";
import CreateCountry from "./CreateCountry";

const fetchLocations = async (
  page: number,
  sortBy: string,
  sortOrder: string,
  search: string,
  active: string,
  recordsPerPage: number
) => {
  const response = await get(
    `/locations?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${search}&active=${active}&limit=${recordsPerPage}`
  );
  return response;
};

const LocationList = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("location"); // Changed from name to location
  const [sortOrder, setSortOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("all");
  const [roles, setRoles] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Option[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<number | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    null
  );
  const navigate = useNavigate();

  // Fetch locations using react-query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      "locations",
      currentPage,
      sortBy,
      sortOrder,
      search,
      active,
      roles,
      recordsPerPage,
    ],
    queryFn: () =>
      fetchLocations(
        currentPage,
        sortBy,
        sortOrder,
        search,
        active,
        roles,
        recordsPerPage
      ),
  });

  const locations = data?.locations || [];
  const totalPages = data?.totalPages || 1;
  const totalLocations = data?.totalLocations || 0;

  // Mutation for deleting a location
  const deleteLocationMutation = useMutation({
    mutationFn: (id: number) => del(`/locations/${id}`),
    onSuccess: () => {
      toast.success("Location deleted successfully");
      queryClient.invalidateQueries(["locations"]);
    },
    onError: (error) => {
      console.log(error);
      toast.error(error?.message || "Failed to delete location");
    },
  });

  // Mutation for changing location status
  const changeStatusMutation = useMutation({
    mutationFn: ({
      locationId,
      active,
    }: {
      locationId: number;
      active: boolean;
    }) => patch(`/locations/${locationId}/status`, { active: !active }),
    onSuccess: () => {
      toast.success("Status updated successfully");
      queryClient.invalidateQueries(["locations"]);
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const confirmDelete = (id: number) => {
    setLocationToDelete(id);
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    if (locationToDelete) {
      deleteLocationMutation.mutate(locationToDelete);
      setShowConfirmation(false);
      setLocationToDelete(null);
    }
  };

  const handleChangeStatus = (locationId: number, currentStatus: boolean) => {
    changeStatusMutation.mutate({ locationId, active: currentStatus });
  };

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if the same column is clicked
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending order
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset to the first page
  };

  // Handle active filter change
  const handleActiveChange = (value: string) => {
    setActive(value);
    setCurrentPage(1); // Reset to the first page
  };

  // Handle role filter change
  const handleRoleChange = (selectedRoles: Option[]) => {
    setRoles(selectedRoles.map((role) => role.value)); // Extract values from selected options
    setCurrentPage(1); // Reset to the first page
  };

  const handleEdit = (locationId: number) => {
    setSelectedLocationId(locationId);
    setShowEditDialog(true);
  };

  const handleCreate = () => {
    setShowCreateDialog(true);
  };

  return (
    <div className="mt-2 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Location Management
      </h1>
      <Card className="mx-auto mt-6 sm:mt-10">
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-grow">
              <Input
                placeholder="Search locations..."
                value={search}
                onChange={handleSearchChange}
                className="w-full"
                icon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleCreate}
                className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add
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
              Failed to load locations.
            </div>
          ) : locations.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      onClick={() => handleSort("location")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Location Name</span>
                        {sortBy === "location" && (
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
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>Region</span>
                        {sortBy === "zone" && (
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
                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location: any) => (
                    <TableRow key={location.id}>
                      <TableCell>{location.location}</TableCell>
                      <TableCell>{location.zone?.name}</TableCell>
                      <TableCell>
                        <div className="justify-end flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(location.id)}
                          >
                            <Edit size={16} />
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDelete(location.id)}
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
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleChangeStatus(
                                      location.id,
                                      location.active
                                    )
                                  }
                                >
                                  <div className="flex items-center gap-2">
                                    {location.active ? (
                                      <XCircle className="h-4 w-4" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                    <span>
                                      Set{" "}
                                      {location.active ? "Inactive" : "Active"}
                                    </span>
                                  </div>
                                </DropdownMenuItem>
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
                totalRecords={totalLocations}
                recordsPerPage={recordsPerPage}
                onPageChange={setCurrentPage} // Pass setCurrentPage directly
                onRecordsPerPageChange={(newRecordsPerPage) => {
                  setRecordsPerPage(newRecordsPerPage);
                  setCurrentPage(1); // Reset to the first page when records per page changes
                }}
              />
            </div>
          ) : (
            <div className="text-center">No locations Found.</div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={showConfirmation}
        title="Confirm Deletion"
        description="Are you sure you want to delete this location? This action cannot be undone."
        onCancel={() => {
          setShowConfirmation(false);
          setLocationToDelete(null);
        }}
        onConfirm={handleDelete}
      />

      <EditLocation
        locationId={selectedLocationId}
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedLocationId(null);
        }}
      />

      <CreateCountry
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </div>
  );
};

export default LocationList;
