import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import { getSubCategoriesByCategoryId } from '@/services/powerTeamService';
import { SubCategory } from '@/types/powerTeam.types'; // Ensure SubCategory type is imported

interface SubCategoryMultiSelectProps {
  categoryId: number;
  selectedSubCategoryIds: number[];
  onChange: (selectedIds: number[]) => void;
  disabled?: boolean;
}

const SubCategoryMultiSelect: React.FC<SubCategoryMultiSelectProps> = ({ 
  categoryId, 
  selectedSubCategoryIds, 
  onChange,
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentlySelected, setCurrentlySelected] = useState<SubCategory[]>([]);

  const { data, isLoading, error } = useQuery<SubCategory[], Error>({
    queryKey: ['subCategories', categoryId],
    queryFn: () => getSubCategoriesByCategoryId(categoryId),
    enabled: !!categoryId, // Only fetch if categoryId is provided
  });
  // Ensure data is treated as SubCategory[] or an empty array if undefined/null or not an array
  const subCategories: SubCategory[] = Array.isArray(data) ? data : [];

  useEffect(() => {
    // When the prop selectedSubCategoryIds changes (e.g., on form reset or initial load),
    // update the internal 'currentlySelected' state.
    const preselected = subCategories.filter(sc => selectedSubCategoryIds.includes(sc.id));
    setCurrentlySelected(preselected);
  }, [selectedSubCategoryIds, subCategories]);

  const handleSelect = (subCategory: SubCategory) => {
    let newSelectedSubCategories: SubCategory[];
    if (currentlySelected.some(sc => sc.id === subCategory.id)) {
      newSelectedSubCategories = currentlySelected.filter(sc => sc.id !== subCategory.id);
    } else {
      newSelectedSubCategories = [...currentlySelected, subCategory];
    }
    setCurrentlySelected(newSelectedSubCategories);
    onChange(newSelectedSubCategories.map(sc => sc.id));
  };

  if (isLoading) return <p>Loading subcategories...</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;
  if (!subCategories.length && !isLoading) return <p className="text-sm text-muted-foreground">No subcategories available.</p>;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={cn(
            'w-full justify-between',
            !currentlySelected.length && 'text-muted-foreground'
          )}
          disabled={disabled || isLoading || !subCategories.length}
        >
          {currentlySelected.length > 0
            ? currentlySelected.map(sc => sc.name).join(', ')
            : 'Select subcategories...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search subcategories..." />
          <CommandList>
            <CommandEmpty>No subcategories found.</CommandEmpty>
            <CommandGroup>
              {subCategories.map((subCategory) => (
                <CommandItem
                  key={subCategory.id}
                  value={subCategory.name} // CommandItem value should be unique string
                  onSelect={() => handleSelect(subCategory)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      currentlySelected.some(sc => sc.id === subCategory.id) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {subCategory.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SubCategoryMultiSelect;
