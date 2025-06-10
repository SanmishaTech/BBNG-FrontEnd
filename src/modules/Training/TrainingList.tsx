import React, { useState } from "react";
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
import {
  Loader,
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  Search,
  PlusCircle,
  Calendar,
} from "lucide-react"; 
import { toast } from "sonner"; 
import { Separator } from "@/components/ui/separator";
import CustomPagination from "@/components/common/custom-pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import EditTraining from "./EditTraining";
import CreateTraining from "./CreateTraining";

// Define the Training interface for type-safety
interface Training {
  id: number;
  date: string;
  title: string;
  time: string;
  venue: string;
  createdAt: string;
  updatedAt: string;
}

interface TrainingResponse {
  trainings: Training[];
  page: number;
  totalPages: number;
  totalTrainings: number;
}

const fetchTrainings = async (
  page: number,
  sortBy: string,
  sortOrder: string,
  search: string,
  recordsPerPage: number
): Promise<TrainingResponse> => {
  const response = await get(
    `/trainings?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${search}&limit=${recordsPerPage}`
  );
  return response;
};

const TrainingList = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [search, setSearch] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [trainingToDelete, setTrainingToDelete] = useState<number | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(null);

  // Fetch trainings using react-query
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "trainings",
      currentPage,
      sortBy,
      sortOrder,
      search,
      recordsPerPage,
    ],
    queryFn: () =>
      fetchTrainings(
        currentPage,
        sortBy,
        sortOrder,
        search,
        recordsPerPage
      ),
  });

  const trainings = data?.trainings || [];
  const totalPages = data?.totalPages || 1;
  const totalTrainings = data?.totalTrainings || 0;

  // Mutation for deleting a training
  const deleteTrainingMutation = useMutation({
    mutationFn: (id: number) => del(`/trainings/${id}`),
    onSuccess: () => {
      toast.success("Training deleted successfully"); 
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete training"); 
    },
  });

  const confirmDelete = (id: number) => {
    setTrainingToDelete(id);
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    if (trainingToDelete) {
      deleteTrainingMutation.mutate(trainingToDelete);
      setShowConfirmation(false);
      setTrainingToDelete(null);
    }
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

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle records per page change
  const handleRecordsPerPageChange = (value: number) => {
    setRecordsPerPage(value);
    setCurrentPage(1); // Reset to first page
  };

  const handleEdit = (trainingId: string) => {
    setSelectedTrainingId(trainingId);
    setShowEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setSelectedTrainingId(null);
  };

  const handleCreate = () => {
    setShowCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setShowCreateDialog(false);
  };

  return (
    <div className="mt-2 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Training Schedule Management
      </h1>
      <Card className="mx-auto mt-6 sm:mt-10">
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-grow relative">
              <Input
                placeholder="Search by topic..."
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-9"
              />
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleCreate}
                className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Training
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
              Failed to load trainings.
            </div>
          ) : trainings.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      onClick={() => handleSort("date")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Date</span>
                        {sortBy === "date" && (
                          <span className="ml-2">
                            {sortOrder === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("title")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Title</span>
                        {sortBy === "title" && (
                          <span className="ml-2">
                            {sortOrder === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("time")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Time</span>
                        {sortBy === "time" && (
                          <span className="ml-2">
                            {sortOrder === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("venue")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Venue</span>
                        {sortBy === "venue" && (
                          <span className="ml-2">
                            {sortOrder === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainings.map((training: Training) => (
                    <TableRow key={training.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {format(new Date(training.date), "ddMMyy")}
                        </div>
                      </TableCell>
                      <TableCell>{training.title}</TableCell>
                      <TableCell>{training.time}</TableCell>
                      <TableCell>{training.venue}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(training.id.toString())}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => confirmDelete(training.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-6">
                <CustomPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalRecords={totalTrainings}
                  recordsPerPage={recordsPerPage}
                  onPageChange={handlePageChange}
                  onRecordsPerPageChange={handleRecordsPerPageChange}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No trainings found. Please add a new training.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Dialog for Delete */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Training</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this training? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      {showEditDialog && selectedTrainingId && (
        <EditTraining
          id={selectedTrainingId}
          onClose={handleCloseEditDialog}
          open={showEditDialog}
        />
      )}

      {/* Create Dialog */}
      {showCreateDialog && (
        <CreateTraining
          onClose={handleCloseCreateDialog}
          open={showCreateDialog}
        />
      )}
    </div>
  );
};

export default TrainingList;