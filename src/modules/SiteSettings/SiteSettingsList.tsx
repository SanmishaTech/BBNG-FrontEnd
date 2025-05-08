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
import { Separator } from "@/components/ui/separator";
import CustomPagination from "@/components/common/custom-pagination";
import {
  Loader,
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  Search,
  PlusCircle,
} from "lucide-react";
import ConfirmDialog from "@/components/common/confirm-dialog";
import EditSiteSetting from "./EditSiteSetting";
import CreateSiteSetting from "./CreateSiteSetting";

const fetchSiteSettings = async (
  sortBy: string,
  sortOrder: string,
  search: string
) => {
  const response = await get(`/sites`);
  // Sort and filter on client side since the API doesn't support it
  let filteredSettings = [...response];

  // Filter by search term if provided
  if (search) {
    filteredSettings = filteredSettings.filter(
      (setting) =>
        setting.key.toLowerCase().includes(search.toLowerCase()) ||
        setting.value.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Sort the results
  filteredSettings.sort((a, b) => {
    const aValue = a[sortBy as keyof typeof a] || "";
    const bValue = b[sortBy as keyof typeof b] || "";

    if (sortOrder === "asc") {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  return filteredSettings;
};

const SiteSettingsList = () => {
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState("key");
  const [sortOrder, setSortOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState<number | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSettingKey, setSelectedSettingKey] = useState<string | null>(
    null
  );
  const [selectedSetting, setSelectedSetting] = useState<any>(null);

  // Fetch site settings using react-query
  const {
    data: settings,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["siteSettings", sortBy, sortOrder, search],
    queryFn: () => fetchSiteSettings(sortBy, sortOrder, search),
  });

  // Mutation for deleting a setting by ID
  const deleteSettingMutation = useMutation({
    mutationFn: (id: number) => del(`/sites/${id}`),
    onSuccess: () => {
      toast.success("Setting deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete setting");
    },
  });

  const confirmDelete = (id: number) => {
    setSettingToDelete(id);
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    if (settingToDelete !== null) {
      deleteSettingMutation.mutate(settingToDelete);
      setShowConfirmation(false);
      setSettingToDelete(null);
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
  };

  const handleEdit = (key: string) => {
    const settingToEdit = settings?.find((s) => s.key === key) || null;
    if (settingToEdit) {
      setSelectedSetting(settingToEdit);
      setShowEditDialog(true);
    } else {
      toast.error("Setting not found");
    }
  };

  const handleCreate = () => {
    setShowCreateDialog(true);
  };

  return (
    <div className="mt-2 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Site Settings Management
      </h1>
      <Card className="mx-auto mt-6 sm:mt-10">
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-grow relative">
              <Input
                placeholder="Search settings..."
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
              Failed to load site settings.
            </div>
          ) : settings && settings.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      onClick={() => handleSort("key")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Key</span>
                        {sortBy === "key" && (
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
                      onClick={() => handleSort("value")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Value</span>
                        {sortBy === "value" && (
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
                  {settings.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell className="font-medium">
                        {setting.key}
                      </TableCell>
                      <TableCell>{setting.value}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(setting.key)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => confirmDelete(setting.id)}
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
          ) : (
            <div className="text-center">No site settings</div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {showEditDialog && (
        <EditSiteSetting
          settingKey={selectedSetting?.key ?? null}
          isOpen={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedSetting(null);
          }}
        />
      )}

      {/* Create Dialog */}
      <CreateSiteSetting
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmation}
        onCancel={() => setShowConfirmation(false)}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        description="Are you sure you want to delete this site setting? This action cannot be undone."
      />
    </div>
  );
};

export default SiteSettingsList;
