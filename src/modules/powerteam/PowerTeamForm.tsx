import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

import { createPowerTeam, getPowerTeamById, updatePowerTeam, getAllCategories } from '@/services/powerTeamService';
import { PowerTeamInput, Category, PowerTeam, SubCategorySummary } from '@/types/powerTeam.types';
import SubCategoryMultiSelect from './SubCategoryMultiSelect';

const powerTeamFormSchema = z.object({
  name: z.string().min(1, 'PowerTeam name is required').max(255),
  categoryIds: z.array(z.number()).min(1, 'At least one category must be selected'),
  subCategoryIds: z.array(z.number()).optional(),
});

type PowerTeamFormValues = z.infer<typeof powerTeamFormSchema>;

interface PowerTeamFormProps {
  mode: 'create' | 'edit';
}

const PowerTeamForm: React.FC<PowerTeamFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const [selectedSubCategoriesMap, setSelectedSubCategoriesMap] = useState<Record<number, number[]>>({});

  const form = useForm<PowerTeamFormValues>({
    resolver: zodResolver(powerTeamFormSchema),
    defaultValues: {
      name: '',
      categoryIds: [],
      subCategoryIds: [],
    },
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[], Error>({
    queryKey: ['allCategories'],
    queryFn: getAllCategories,
  });

  const { data: powerTeamData, isLoading: isLoadingPowerTeam } = useQuery<PowerTeam, Error>({
    queryKey: ['powerTeam', id],
    queryFn: async () => {
      if (!id) throw new Error('No ID provided for editing');
      return getPowerTeamById(Number(id));
    },
    enabled: mode === 'edit' && !!id,
  });

  useEffect(() => {
    if (mode === 'edit' && powerTeamData) {
      form.reset({
        name: powerTeamData.name,
        categoryIds: powerTeamData.categories.map(cat => cat.id),
        subCategoryIds: powerTeamData.subCategories?.map(subCat => subCat.id) || [],
      });
      const preselectedMainCategories = categories.filter(cat => 
        powerTeamData.categories.some(pc => pc.id === cat.id)
      );
      setSelectedCategories(preselectedMainCategories);

      const initialSubCategoryMap: Record<number, number[]> = {};
      if (powerTeamData.subCategories) {
        powerTeamData.subCategories.forEach(subCat => {
          if (!initialSubCategoryMap[subCat.categoryId]) {
            initialSubCategoryMap[subCat.categoryId] = [];
          }
          initialSubCategoryMap[subCat.categoryId].push(subCat.id);
        });
      }
      setSelectedSubCategoriesMap(initialSubCategoryMap);
    }
  }, [mode, powerTeamData, categories, form]);

  useEffect(() => {
    const allSelectedSubCategoryIds = Object.values(selectedSubCategoriesMap).flat();
    form.setValue('subCategoryIds', allSelectedSubCategoryIds, { shouldValidate: true });
  }, [selectedSubCategoriesMap, form]);

  const createMutation = useMutation<unknown, Error, PowerTeamFormValues>({
    mutationFn: (data) => createPowerTeam(data),
    onSuccess: () => {
      toast.success('PowerTeam created successfully!');
      queryClient.invalidateQueries({ queryKey: ['powerTeams'] });
      navigate('/powerteams'); // Adjust if your route is different
    },
    onError: (error) => {
      console.log(error)
      toast.error(`Failed to create PowerTeam: ${error?.response?.data?.error?.message}`);
    },
  });

  const updateMutation = useMutation<unknown, Error, PowerTeamFormValues>({
    mutationFn: (data) => {
      if (!id) throw new Error('No ID provided for update');
      return updatePowerTeam(Number(id), data);
    },
    onSuccess: () => {
      toast.success('PowerTeam updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['powerTeams'] });
      queryClient.invalidateQueries({ queryKey: ['powerTeam', id] });
      navigate('/powerteams'); // Adjust if your route is different
    },
    onError: (error) => {
      toast.error(`Failed to update PowerTeam: ${error.message}`);
    },
  });

  const onSubmit = (data: PowerTeamFormValues) => {
    if (mode === 'create') {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const handleCategorySelect = (category: Category) => {
    const isCurrentlySelected = selectedCategories.some(sc => sc.id === category.id);
    let newSelectedCategories: Category[];

    if (isCurrentlySelected) {
      newSelectedCategories = selectedCategories.filter(sc => sc.id !== category.id);
      setSelectedSubCategoriesMap(prevMap => {
        const newMap = { ...prevMap };
        delete newMap[category.id];
        return newMap;
      });
    } else {
      newSelectedCategories = [...selectedCategories, category];
      setSelectedSubCategoriesMap(prevMap => ({
        ...prevMap,
        [category.id]: prevMap[category.id] || [] 
      }));
    }
    setSelectedCategories(newSelectedCategories);
    form.setValue('categoryIds', newSelectedCategories.map(c => c.id), { shouldValidate: true });
  };

  if (isLoadingCategories || (mode === 'edit' && isLoadingPowerTeam)) {
    return <div>Loading...</div>; // Replace with a proper loader/spinner component from shadcn if available
  }

  return (
    <Card className="max-w-2xl mx-auto my-8">
      <CardHeader>
        <Button variant="outline" size="sm" className="mb-4 w-fit" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <CardTitle>{mode === 'create' ? 'Create New PowerTeam' : 'Edit PowerTeam'}</CardTitle>
        <CardDescription>
          Fill in the details below to {mode === 'create' ? 'create a new' : 'update the'} PowerTeam.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PowerTeam Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Enter PowerTeam name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryIds"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Categories <span className="text-red-500">*</span></FormLabel>
                  <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isCategoryPopoverOpen}
                          className={cn(
                            'w-full justify-between',
                            !field.value?.length && 'text-muted-foreground'
                          )}
                        >
                          {selectedCategories.length > 0
                            ? selectedCategories.map(cat => cat.name).join(', ')
                            : 'Select categories...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Search categories..." />
                        <CommandList>
                          <CommandEmpty>No categories found.</CommandEmpty>
                          <CommandGroup>
                            {categories
                              .filter(category => category && category.name && category.id)
                              .map((category) => (
                              <CommandItem
                                value={category.name} // Ensure this value is unique enough for CommandItem behavior or use category.id.toString()
                                key={category.id}
                                onSelect={() => {
                                  handleCategorySelect(category);
                                  // setIsCategoryPopoverOpen(false); // Optionally close on select
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    selectedCategories.some(sc => sc.id === category.id) ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                {category.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dynamic SubCategory Sections */}
            {selectedCategories.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Subcategories Selection</h3>
                {selectedCategories.map((mainCategory) => (
                  <Card key={mainCategory.id} className="p-4">
                    <FormLabel className="font-semibold">{mainCategory.name} - Subcategories</FormLabel>
                    <div className="mt-2">
                      <SubCategoryMultiSelect
                        categoryId={mainCategory.id}
                        selectedSubCategoryIds={selectedSubCategoriesMap[mainCategory.id] || []}
                        onChange={(subCategoryIds) => {
                          setSelectedSubCategoriesMap(prevMap => ({
                            ...prevMap,
                            [mainCategory.id]: subCategoryIds,
                          }));
                        }}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                    Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || isLoadingCategories || isLoadingPowerTeam}>
                    {mode === 'create' ? 'Create PowerTeam' : 'Save Changes'}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default PowerTeamForm;
