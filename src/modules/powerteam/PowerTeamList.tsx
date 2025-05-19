import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'; // Assuming you have shadcn Table components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { getPowerTeams, deletePowerTeam } from '@/services/powerTeamService';
import { PowerTeam, CategorySummary } from '@/types/powerTeam.types';

const PowerTeamList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10); 
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [powerTeamToDelete, setPowerTeamToDelete] = useState<{ id: number; name: string } | null>(null);

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['powerTeams', page, limit],
    queryFn: () => getPowerTeams({ page, limit }),
    placeholderData: (previousData) => previousData, 
  });

  const deleteMutation = useMutation<unknown, Error, number>({
    mutationFn: (id) => deletePowerTeam(id),
    onSuccess: () => {
      toast.success('PowerTeam deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['powerTeams'] });
    },
    onError: (err) => {
      toast.error(`Failed to delete PowerTeam: ${err.message}`);
    },
  });

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const openDeleteConfirmation = (pt: { id: number; name: string }) => {
    setPowerTeamToDelete(pt);
    setShowDeleteDialog(true);
  };

  if (isLoading) return <div>Loading PowerTeams...</div>; 
  if (error) return <div>Error fetching PowerTeams: {error.message}</div>;

  const powerTeams: PowerTeam[] = data?.powerTeams || [];
  const totalPages = data?.totalPages || 1;

  const formatCategories = (categories: CategorySummary[]) => {
    if (!categories || categories.length === 0) return 'N/A';
    return categories.map(cat => cat.name).join(', ');
  };

  return (
    <Card className="m-4 md:m-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>PowerTeam Master</CardTitle>
          <CardDescription>Manage your PowerTeams and their categories.</CardDescription>
        </div>
        <Button onClick={() => navigate('/powerteams/new')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New PowerTeam
        </Button>
      </CardHeader>
      <CardContent>
        {/* TODO: Add Search Input here if needed */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {powerTeams.length > 0 ? (
                powerTeams.map((pt) => (
                  <TableRow key={pt.id}>
                    <TableCell className="font-medium">{pt.id}</TableCell>
                    <TableCell>{pt.name}</TableCell>
                    <TableCell>{formatCategories(pt.categories)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/powerteams/edit/${pt.id}`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 hover:text-red-700 focus:text-red-700"
                            onClick={() => openDeleteConfirmation({ id: pt.id, name: pt.name })}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No PowerTeams found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {/* Pagination Controls */} 
        {totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1 || isFetching}
            >
              <ChevronsLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages || isFetching}
            >
              Next <ChevronsRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>

      {powerTeamToDelete && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the PowerTeam "<strong>{powerTeamToDelete.name}</strong>".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  handleDelete(powerTeamToDelete.id);
                  setShowDeleteDialog(false);
                }}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
              >
                Yes, delete it
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
};

export default PowerTeamList;
