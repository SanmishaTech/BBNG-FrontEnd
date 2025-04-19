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
import { toast } from "sonner";
import { saveAs } from "file-saver";
import {
  Loader,
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  Download,
  Search,
  PlusCircle,
} from "lucide-react";
import CustomPagination from "@/components/common/custom-pagination";
import ConfirmDialog from "@/components/common/confirm-dialog";
import EditCategory from "./EditCountry";
import CreateCategory from "./CreateCountry";

// Fetch categories with pagination, sorting, searching, and export
const fetchCategories = async (
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  exportData
) => {
  const exportQuery = exportData ? "&export=true" : "";
  const response = await get(
    `/categories?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${encodeURIComponent(
      search
    )}${exportQuery}`
  );
  return response;
};

const CategoryList = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Query categories (TanStack Query v5 object signature)
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "categories",
      currentPage,
      recordsPerPage,
      sortBy,
      sortOrder,
      search,
    ],
    queryFn: () =>
      fetchCategories(
        currentPage,
        recordsPerPage,
        sortBy,
        sortOrder,
        search,
        false
      ),
    keepPreviousData: true,
  });

  const categories = data?.categories || [];
  const totalCategories = data?.totalCategories || 0;
  const totalPages = data?.totalPages || 1;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => del(`/categories/${id}`),
    onSuccess: () => {
      toast.success("Category deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: () => {
      toast.error("Failed to delete category");
    },
  });

  // Handlers
  const confirmDelete = (id) => {
    setCategoryToDelete(id);
    setShowConfirmation(true);
  };
  const handleDelete = () => {
    if (categoryToDelete !== null) {
      deleteMutation.mutate(categoryToDelete);
      setShowConfirmation(false);
      setCategoryToDelete(null);
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleExport = async () => {
    try {
      const exportData = await fetchCategories(
        currentPage,
        recordsPerPage,
        sortBy,
        sortOrder,
        search,
        true
      );
      const blob = new Blob([JSON.stringify(exportData.data)], {
        type: "application/json",
      });
      saveAs(blob, "categories_export.json");
    } catch {
      toast.error("Failed to export categories");
    }
  };

  const openEditDialog = (id) => {
    setSelectedCategoryId(id);
    setShowEditDialog(true);
  };

  const closeEditDialog = () => {
    setSelectedCategoryId(null);
    setShowEditDialog(false);
  };

  const openCreateDialog = () => setShowCreateDialog(true);
  const closeCreateDialog = () => setShowCreateDialog(false);

  return (
    <div className="mt-2 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Category Management
      </h1>
      <Card className="mx-auto mt-6 sm:mt-10">
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Input
              placeholder="Search categories..."
              value={search}
              onChange={handleSearchChange}
              className="w-full max-w-sm"
              icon={<Search className="h-4 w-4" />}
            />
            <div className="flex gap-2">
              <Button
                onClick={openCreateDialog}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Category
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                className="flex items-center"
              >
                <Download className="mr-2 h-5 w-5" />
                Export
              </Button>
            </div>
          </div>

          <div>
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader className="mr-2 h-8 w-8 animate-spin" />
              </div>
            ) : isError ? (
              <div className="text-center text-red-500">
                Failed to load categories.
              </div>
            ) : categories.length > 0 ? (
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
                      <TableHead>Description</TableHead>
                      <TableHead className="text-end">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>{category.description}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(category.id)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => confirmDelete(category.id)}
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
                  totalRecords={totalCategories}
                  recordsPerPage={recordsPerPage}
                  onPageChange={setCurrentPage}
                  onRecordsPerPageChange={(newLimit) => {
                    setRecordsPerPage(newLimit);
                    setCurrentPage(1);
                  }}
                />
              </div>
            ) : (
              <div className="text-center">No categories found.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={showConfirmation}
        title="Confirm Deletion"
        description="Are you sure you want to delete this category? This action cannot be undone."
        onCancel={() => setShowConfirmation(false)}
        onConfirm={handleDelete}
      />

      <EditCategory
        categoryId={selectedCategoryId}
        isOpen={showEditDialog}
        onClose={closeEditDialog}
      />

      <CreateCategory isOpen={showCreateDialog} onClose={closeCreateDialog} />
    </div>
  );
};

export default CategoryList;
