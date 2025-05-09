import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, put } from "@/services/apiService";
import { z } from "zod";
import { toast } from "sonner";
import { Button, Input } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const siteSettingSchema = z.object({
  key: z.string().min(1, "Setting key is required"),
  value: z.string(),
});

type SiteSettingFormData = z.infer<typeof siteSettingSchema>;

interface EditSiteSettingProps {
  settingKey: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditSiteSetting = ({
  settingKey,
  isOpen,
  onClose,
}: EditSiteSettingProps) => {
  const queryClient = useQueryClient();
  const [settingId, setSettingId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    control,
    reset,
    formState: { errors },
  } = useForm<SiteSettingFormData>({
    resolver: zodResolver(siteSettingSchema),
    defaultValues: {
      key: settingKey || "",
      value: "",
    },
  });

  const { data: settingData, isLoading } = useQuery({
    queryKey: ["siteSettings", settingKey],
    queryFn: async () => {
      if (!settingKey) return null;
      console.log(`[EditSiteSetting] Fetching /sites/${settingKey}`);
      try {
        const response = await get(`/sites/${settingKey}`);
        console.log("[EditSiteSetting] Fetch response:", response);
        return response;
      } catch (error) {
        console.error("[EditSiteSetting] Error fetching setting:", error);
        toast.error(`Failed to load setting '${settingKey}'`);
        return null; // Ensure query resolves even on error
      }
    },
    enabled: !!settingKey && isOpen,
  });

  // Log isLoading status
  console.log(`[EditSiteSetting] isLoading: ${isLoading}`);

  useEffect(() => {
    console.log(
      "[EditSiteSetting] useEffect triggered. settingData:",
      settingData
    );
    if (settingData) {
      reset({
        key: settingData.key,
        value: settingData.value,
      });
      console.log("[EditSiteSetting] Setting ID from data:", settingData.id);
      setSettingId(settingData.id);
    } else {
      console.log(
        "[EditSiteSetting] No settingData, resetting form and settingId."
      );
      reset({ key: settingKey || "", value: "" });
      setSettingId(null);
    }
  }, [settingData, reset, settingKey]);

  // Log settingId state before render
  console.log(`[EditSiteSetting] settingId state: ${settingId}`);

  const updateSiteSettingMutation = useMutation({
    mutationFn: (data: SiteSettingFormData) => {
      if (!settingId) throw new Error("Setting ID is missing");
      return put(
        `/sites/${settingId}`,
        {
          key: data.key,
          value: data.value,
        },
        undefined
      );
    },
    onSuccess: (updatedSetting) => {
      toast.success("Setting updated successfully");
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update setting");
    },
  });

  const onSubmit = (data: SiteSettingFormData) => {
    if (!settingId) {
      toast.error("Cannot save: Setting ID not loaded.");
      return;
    }
    updateSiteSettingMutation.mutate(data);
  };

  const handleClose = () => {
    reset({ key: settingKey || "", value: "" });

    setTimeout(() => setSettingId(null), 0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Edit Setting {settingKey ? `(${settingKey})` : ""}
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-2">
              <Label htmlFor="key">Setting Key</Label>
              <Input id="key" {...register("key")} />
              {errors.key && (
                <span className="text-red-500 text-sm">
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
                    placeholder="Enter setting value"
                  />
                )}
              />
              {errors.value && (
                <span className="text-red-500 text-sm">
                  {errors.value.message}
                </span>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="ml-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-white"
                disabled={
                  updateSiteSettingMutation.isPending || isLoading || !settingId
                }
              >
                {updateSiteSettingMutation.isPending
                  ? "Updating..."
                  : "Update Setting"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditSiteSetting;
