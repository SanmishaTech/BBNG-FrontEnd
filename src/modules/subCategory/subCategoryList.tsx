import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  LoaderCircle,
  PenSquare,
  Plus,
  Search,
  Trash2,
  ChevronUp,
  ChevronDown,
  PlusCircle
} from "lucide-react";
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
import CustomPagination from "@/components/common/custom-pagination";
import { getSubCategories, deleteSubCategory } from "@/services/subCategoryService";
import { get } from "@/services/apiService";
import CreateCategory from "./CreatesubCategory";
import EditCategory from "./EditsubCategory";

// Define interfaces for the subcategory and category data
interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: number;
  name: string;
}

interface CategoryWithName extends SubCategory {
  categoryName?: string;
}

interface CategoryListResponse {
  categories: Category[];
  page: number;
  totalPages: number;
  totalCategories: number;
}

interface SubCategoryListResponse {
  categories: SubCategory[];
  page: number;
  totalPages: number;
  totalCategories: number;
}

const CategoryList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [subCategoriesWithNames, setSubCategoriesWithNames] = useState<CategoryWithName[]>([]);
  const queryClient = useQueryClient();

  // Fetch categories for name mapping
  const { data: categoryData } = useQuery<CategoryListResponse>({
    queryKey: ["categoriesList"],
    queryFn: async () => {
      const response = await get("/categories");
      return response as CategoryListResponse;
    },
  });

  // Fetch subcategories
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<SubCategoryListResponse>({
    queryKey: ["subcategories", page, limit, search, sortBy, sortOrder],
    queryFn: async () => {
      const response = await getSubCategories(page, limit, search, sortBy, sortOrder);
      return response as unknown as SubCategoryListResponse;
    },
  });

  // Update subcategories with category names when data or category data changes
  useEffect(() => {
    if (data?.categories && categoryData?.categories) {
      const categoryMap = new Map(categoryData.categories.map(cat => [cat.id, cat.name]));
      
      const updatedCategories = data.categories.map((subCat: SubCategory) => ({
        ...subCat,
        categoryName: categoryMap.get(subCat.categoryId) || `Unknown (ID: ${subCat.categoryId})`
      }));
      
      setSubCategoriesWithNames(updatedCategories);
    }
  }, [data, categoryData]);

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSubCategory(id),
    onSuccess: () => {
      toast.success("Category deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
    },
    onError: (error: any) => {
      toast.error(error.errors?.message || error.message || "Failed to delete category");
    },
  });

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page when search changes
  };

  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1); // Reset to first page when sort changes
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && (!data || newPage <= data.totalPages)) {
      setPage(newPage);
    }
  };

  // Handle records per page change
  const handleRecordsPerPageChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when limit changes
  };

  // Handle edit category
  const handleEdit = (id: string) => {
    setEditCategoryId(id);
    setIsEditDialogOpen(true);
  };

  // Handle dialog close
  const handleCreateDialogClose = () => {
    setIsCreateDialogOpen(false);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditCategoryId(null);
  };

  // Handle error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Categories</h2>
        <p>{(error as any)?.message || "Failed to load categories"}</p>
        <Button className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ["categories"] })}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Business Sub-Categories</h1>
      </div>
      
      <Card className="border border-border">
        <CardContent className="p-6">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            {/* Search Input */}
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sub-categories..."
                value={search}
                onChange={handleSearchChange}
                className="pl-8 w-full"
              />
            </div>

            {/* Action Buttons */}
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              size="sm"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Sub-Category
            </Button>
          </div>

          <Separator className="mb-6" />

          {/* Categories Table */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-auto cursor-pointer" onClick={() => handleSort("id")}>
                    ID
                    {sortBy === "id" && (
                      <span className="ml-2 inline-block">
                        {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    )}
                  </TableHead>
                  <TableHead className="w-auto cursor-pointer" onClick={() => handleSort("name")}>
                    Name
                    {sortBy === "name" && (
                      <span className="ml-2 inline-block">
                        {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    )}
                  </TableHead>
                  <TableHead className="w-auto cursor-pointer" onClick={() => handleSort("categoryId")}>
                    Category Name
                    {sortBy === "categoryId" && (
                      <span className="ml-2 inline-block">
                        {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    )}
                  </TableHead>
                 
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <LoaderCircle className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : !subCategoriesWithNames || subCategoriesWithNames.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No sub-categories found
                    </TableCell>
                  </TableRow>
                ) : (
                  subCategoriesWithNames.map((category) => (
                    <TableRow key={category.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{category.id}</TableCell>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{category.categoryName}</TableCell>                   
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(category.id.toString())}
                            className="h-8 w-8"
                          >
                            <PenSquare className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the category
                                  and remove its data from our servers.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => deleteMutation.mutate(category.id)}
                                >
                                  {deleteMutation.isPending ? (
                                    <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                                  ) : null}
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 0 && (
            <div className="mt-6">
              <CustomPagination 
                currentPage={page}
                totalPages={data.totalPages}
                totalRecords={data.totalCategories}
                recordsPerPage={limit}
                onPageChange={handlePageChange}
                onRecordsPerPageChange={handleRecordsPerPageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Category Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new business sub-category to the system.
            </DialogDescription>
          </DialogHeader>
          <CreateCategory onSuccess={handleCreateDialogClose} />
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Modify the selected business sub-category.
            </DialogDescription>
          </DialogHeader>
          {editCategoryId && (
            <EditCategory 
              categoryId={editCategoryId} 
              onSuccess={handleEditDialogClose} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryList; 