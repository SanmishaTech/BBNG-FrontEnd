import React, { useState } from "react";
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
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  LoaderCircle,
  PenSquare,
  Search,
  Trash2,
  ChevronUp,
  ChevronDown,
  PlusCircle,
  FileText,
  Download
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CustomPagination from "@/components/common/custom-pagination";
import { getMessages, deleteMessage, getAttachmentUrl } from "@/services/messageService";
import CreateMessage from "./CreateMessage";
import EditMessage from "./EditMessage";
import { formatDate } from "@/lib/formatter";

const MessageList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [powerteam, setPowerteam] = useState("all");
  const [powerteamFilter, setPowerteamFilter] = useState("");
  const [editMessageId, setEditMessageId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch messages
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["messages", page, limit, search, sortBy, sortOrder, powerteamFilter],
    queryFn: () => getMessages(page, limit, search, sortBy, sortOrder, powerteamFilter),
  });

  // Delete message mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMessage(id),
    onSuccess: () => {
      toast.success("Message deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (error: any) => {
      toast.error(error.errors?.message || error.message || "Failed to delete message");
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
      setSortOrder("desc"); // Default to descending for dates
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

  // Handle power team filter change
  const handlePowerteamChange = (value: string) => {
    setPowerteam(value);
    setPage(1);
    // If "all" is selected, we want to clear the filter
    const filterValue = value === "all" ? "" : value;
    setPowerteamFilter(filterValue);
  };

  // Handle edit message
  const handleEdit = (id: string) => {
    setEditMessageId(id);
    setIsEditDialogOpen(true);
  };

  // Handle dialog close
  const handleCreateDialogClose = () => {
    setIsCreateDialogOpen(false);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditMessageId(null);
  };

  // Download attachment
  const handleDownloadAttachment = (id: string) => {
    const attachmentUrl = getAttachmentUrl(id);
    window.open(attachmentUrl, "_blank");
  };

  // Format attachment information
  const formatAttachment = (attachmentJson: string | null) => {
    if (!attachmentJson) return null;
    
    try {
      const attachment = JSON.parse(attachmentJson);
      return {
        originalname: attachment.originalname,
        size: attachment.size,
      };
    } catch (e) {
      console.error("Error parsing attachment JSON:", e);
      return null;
    }
  };

  // Handle error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Messages</h2>
        <p>{(error as any)?.message || "Failed to load messages"}</p>
        <Button className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ["messages"] })}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Messages</h1>
      </div>
      
      <Card className="border border-border">
        <CardContent className="p-6">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Search Input */}
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={search}
                  onChange={handleSearchChange}
                  className="pl-8 w-full"
                />
              </div>

              {/* Power Team Filter */}
              <div className="w-48">
                <Select
                  value={powerteam}
                  onValueChange={handlePowerteamChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Power Teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Power Teams</SelectItem>
                    <SelectItem value="Team A">Team A</SelectItem>
                    <SelectItem value="Team B">Team B</SelectItem>
                    <SelectItem value="Team C">Team C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              size="sm"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Message
            </Button>
          </div>

          <Separator className="mb-6" />

          {/* Messages Table */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-auto cursor-pointer" onClick={() => handleSort("heading")}>
                    Heading
                    {sortBy === "heading" && (
                      <span className="ml-2 inline-block">
                        {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    )}
                  </TableHead>
                  <TableHead className="w-auto cursor-pointer" onClick={() => handleSort("powerteam")}>
                    Power Team
                    {sortBy === "powerteam" && (
                      <span className="ml-2 inline-block">
                        {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    )}
                  </TableHead>
                  <TableHead className="w-auto cursor-pointer">
                    Message
                  </TableHead>
                  <TableHead className="w-auto cursor-pointer">
                    Attachment
                  </TableHead>
                  <TableHead className="w-auto cursor-pointer" onClick={() => handleSort("createdAt")}>
                    Created At
                    {sortBy === "createdAt" && (
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
                    <TableCell colSpan={6} className="h-24 text-center">
                      <LoaderCircle className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : !data || data.messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No messages found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.messages.map((message) => {
                    const attachment = formatAttachment(message.attachment);
                    
                    return (
                      <TableRow key={message.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{message.heading}</TableCell>
                        <TableCell>{message.powerteam}</TableCell>
                        <TableCell className="max-w-md truncate">
                          {message.message.length > 100
                            ? `${message.message.substring(0, 100)}...`
                            : message.message}
                        </TableCell>
                        <TableCell>
                          {attachment ? (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-500" />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-blue-500"
                                onClick={() => handleDownloadAttachment(message.id.toString())}
                              >
                                <span className="truncate max-w-[100px]">{attachment.originalname}</span>
                                <Download className="ml-1 h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No attachment</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(message.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(message.id.toString())}
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
                                    This action cannot be undone. This will permanently delete the message
                                    and remove its data from our servers.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-destructive hover:bg-destructive/90"
                                    onClick={() => deleteMutation.mutate(message.id)}
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
                    );
                  })
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
                totalRecords={data.totalMessages}
                recordsPerPage={limit}
                onPageChange={handlePageChange}
                onRecordsPerPageChange={handleRecordsPerPageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Message Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Message</DialogTitle>
            <DialogDescription>
              Add a new message with optional file attachment.
            </DialogDescription>
          </DialogHeader>
          <CreateMessage onSuccess={handleCreateDialogClose} />
        </DialogContent>
      </Dialog>

      {/* Edit Message Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
            <DialogDescription>
              Modify the selected message.
            </DialogDescription>
          </DialogHeader>
          {editMessageId && (
            <EditMessage 
              messageId={editMessageId} 
              onSuccess={handleEditDialogClose} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessageList; 