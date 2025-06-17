import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { post } from "@/services/apiService";
import { Button, Input } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";

const siteSettingSchema = z.object({
  key: z.string().min(1, "Setting key is required"),
  value: z.string(),
});

type SiteSettingFormData = z.infer<typeof siteSettingSchema>;

interface CreateSiteSettingProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateSiteSetting: React.FC<CreateSiteSettingProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<SiteSettingFormData>({
    resolver: zodResolver(siteSettingSchema),
    defaultValues: {
      key: "",
      value: "",
    },
  });

  const createSiteSettingMutation = useMutation({
    mutationFn: (newSetting: SiteSettingFormData) => {
      return post("/sites", newSetting);
    },
    onSuccess: () => {
      toast.success("Setting created successfully");
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create setting");
    },
  });

  const onSubmit = (data: SiteSettingFormData) => {
    createSiteSettingMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Setting</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-2 relative">
            <Label htmlFor="key">Setting Key</Label>
            <Input
              id="key"
              placeholder="Enter setting key..."
              {...register("key")}
            />
            {errors.key && (
              <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
                {errors.key.message}
              </span>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="value">Setting Value</Label>
            <Controller
              name="value"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="value"
                  {...field}
                  className="min-h-[200px] font-mono text-sm"
                  placeholder="Enter setting value (supports HTML tags)"
                />
              )}
            />
            {errors.value && (
              <span className="text-red-500 text-sm">
                {errors.value.message}
              </span>
            )}
            <div className="text-xs text-gray-500 mt-1">
              <p>Supports HTML formatting. Examples:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>&lt;h1&gt;Heading&lt;/h1&gt; - For headings</li>
                <li>&lt;p&gt;Paragraph&lt;/p&gt; - For paragraphs</li>
                <li>&lt;strong&gt;Bold&lt;/strong&gt; - For bold text</li>
                <li>&lt;em&gt;Italic&lt;/em&gt; - For italic text</li>
                <li>&lt;a href="url"&gt;Link&lt;/a&gt; - For links</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="ml-2"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-primary text-white"
              disabled={createSiteSettingMutation.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSiteSetting; 