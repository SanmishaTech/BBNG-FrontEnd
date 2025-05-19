import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoaderCircle } from 'lucide-react';

// Validation Schema (similar to backend, but no async checks needed here usually)
const siteSettingFormSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string(), // Allow empty string
});

export type SiteSettingFormData = z.infer<typeof siteSettingFormSchema>;

interface SiteSettingFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<SiteSettingFormData>; // For edit mode
  onSubmit: (data: SiteSettingFormData) => void;
  onCancel: () => void;
  isLoading?: boolean; // To show loading state on submit button
  className?: string;
  // Add setError if backend validation errors need to be mapped manually
  // setError: UseFormSetError<SiteSettingFormData>;
}

const SiteSettingForm: React.FC<SiteSettingFormProps> = ({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  className = '',
  // setError
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SiteSettingFormData>({
    resolver: zodResolver(siteSettingFormSchema),
    defaultValues: initialData || { key: '', value: '' },
  });

  // Reset form if initialData changes (e.g., when opening edit dialog)
  React.useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-8 ${className}`}>
      {/* Key Field */}
      <div className="grid gap-2 relative">
        <Label htmlFor="key">Setting Key <span className="text-red-500">*</span></Label>
        <Input
          id="key"
          type="text"
          placeholder="e.g., siteTitle"
          {...register('key')}
          // Disable key editing in 'edit' mode if desired
          // disabled={mode === 'edit'}
          // className={mode === 'edit' ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}
        />
        {errors.key && (
           // Consistent error style with UserForm
          <span className="text-red-500 text-[10px] absolute bottom-0 translate-y-[105%]" >
            {errors.key.message}
          </span>
        )}
      </div>

      {/* Value Field */}
      <div className="grid gap-2 relative">
        <Label htmlFor="value">Setting Value</Label>
        <Textarea
          id="value"
          placeholder="Enter setting value"
          className="min-h-[150px] font-mono text-sm" // Adjusted height slightly
          {...register('value')}
        />
        {errors.value && (
          <span className="text-red-500 text-[10px] absolute bottom-0 translate-y-[105%]" >
            {errors.value.message}
          </span>
        )}
      </div>

      {/* Submit and Cancel Buttons */}
      <div className="justify-end flex gap-4 pt-4"> {/* Added padding-top */}
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground" // Use theme colors
        >
          {isLoading ? (
            <>
              <LoaderCircle className="animate-spin h-4 w-4" />
              Saving...
            </>
          ) : mode === 'create' ? (
            'Create Setting'
          ) : (
            'Update Setting'
          )}
        </Button>
      </div>
    </form>
  );
};

export default SiteSettingForm; 