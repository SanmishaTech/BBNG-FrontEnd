import React, { useEffect, useState, useRef } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle, Upload, X, FileText, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { getMessage, createMessage, updateMessage } from "@/services/messageService";
import Validate from "@/lib/Handlevalidation";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "text/plain",
];

const messageFormSchema = z.object({
  heading: z.string()
    .min(1, "Heading is required")
    .max(255, "Heading must not exceed 255 characters"),
  powerteam: z.string()
    .min(1, "Power team is required")
    .max(100, "Power team must not exceed 100 characters"),
  message: z.string()
    .min(1, "Message is required")
    .max(5000, "Message must not exceed 5000 characters"),
  attachment: z
    .any()
    .optional()
    .refine(
      (files) => {
        if (!files || files.length === 0) return true;
        return files[0]?.size <= MAX_FILE_SIZE;
      },
      { message: `Max file size is 10MB.` }
    )
    .refine(
      (files) => {
        if (!files || files.length === 0) return true;
        return ACCEPTED_FILE_TYPES.includes(files[0]?.type);
      },
      { message: "Unsupported file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TXT" }
    ),
  removeAttachment: z.boolean().optional(),
});

type MessageFormInputs = z.infer<typeof messageFormSchema>;

interface MessageFormProps {
  mode: "create" | "edit";
  messageId?: string;
  onSuccess?: () => void;
  className?: string;
}

interface AttachmentInfo {
  originalname: string;
  mimetype: string;
  size: number;
}

const MessageForm = ({
  mode,
  messageId,
  onSuccess,
  className,
}: MessageFormProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [currentAttachment, setCurrentAttachment] = useState<AttachmentInfo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
    formState: { errors },
  } = useForm<MessageFormInputs>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      heading: "",
      powerteam: "",
      message: "",
      removeAttachment: false,
    },
  });

  const selectedFile = watch("attachment");
  const removeAttachment = watch("removeAttachment");

  // Query for fetching message data in edit mode
  const { isLoading: isFetchingMessage } = useQuery({
    queryKey: ["message", messageId],
    queryFn: async () => {
      if (!messageId) throw new Error("Message ID is required");
      return getMessage(messageId);
    },
    enabled: mode === "edit" && !!messageId,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Handle successful message fetch
  useEffect(() => {
    if (mode === "edit" && messageId) {
      queryClient.fetchQuery({
        queryKey: ["message", messageId],
        queryFn: async () => {
          return getMessage(messageId);
        },
      }).then((data) => {
        setValue("heading", data.heading);
        setValue("powerteam", data.powerteam);
        setValue("message", data.message);

        // Parse attachment info
        if (data.attachment) {
          try {
            const attachmentInfo = JSON.parse(data.attachment);
            setCurrentAttachment({
              originalname: attachmentInfo.originalname,
              mimetype: attachmentInfo.mimetype,
              size: attachmentInfo.size,
            });
          } catch (e) {
            console.error("Error parsing attachment data:", e);
          }
        }
      }).catch((error) => {
        toast.error(error.message || "Failed to fetch message details");
        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/messages");
        }
      });
    }
  }, [messageId, mode, setValue, queryClient, navigate, onSuccess]);

  // Handle form submission
  const onSubmit: SubmitHandler<MessageFormInputs> = (data) => {
    const formData = new FormData();
    formData.append("heading", data.heading);
    formData.append("powerteam", data.powerteam);
    formData.append("message", data.message);
    
    // Handle file attachment
    if (data.attachment && data.attachment[0]) {
      formData.append("attachment", data.attachment[0]);
      console.log("Adding attachment to form data:", data.attachment[0].name);
    }
    
    // Handle attachment removal in edit mode
    if (mode === "edit" && data.removeAttachment) {
      formData.append("removeAttachment", "true");
    }

    // Log form data entries for debugging
    console.log("Form data entries:");
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1] instanceof File ? `${pair[1].name} (${pair[1].size} bytes)` : pair[1]);
    }

    if (mode === "create") {
      createMessageMutation.mutate(formData);
    } else {
      updateMessageMutation.mutate({ id: messageId!, formData });
    }
  };

  // Mutation for creating a message
  const createMessageMutation = useMutation({
    mutationFn: (formData: FormData) => {
      return createMessage(formData);
    },
    onSuccess: () => {
      toast.success("Message created successfully");
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      reset();
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/messages");
      }
    },
    onError: (error: any) => {
      Validate(error, setError);
      if (error.errors?.message) {
        toast.error(error.errors.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create message");
      }
    },
  });

  // Mutation for updating a message
  const updateMessageMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) => {
      return updateMessage(id, formData);
    },
    onSuccess: () => {
      toast.success("Message updated successfully");
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      if (messageId) {
        queryClient.invalidateQueries({ queryKey: ["message", messageId] });
      }
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/messages");
      }
    },
    onError: (error: any) => {
      Validate(error, setError);
      if (error.errors?.message) {
        toast.error(error.errors.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update message");
      }
    },
  });

  const handleCancel = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      navigate("/messages");
    }
  };

  const handleRemoveAttachment = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setValue("attachment", undefined);
    setValue("removeAttachment", true);
    setCurrentAttachment(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("removeAttachment", false);
    
    // Log file selection for debugging
    if (e.target.files && e.target.files.length > 0) {
      console.log("File selected:", e.target.files[0].name);
    }
  };

  // Combined loading state from fetch and mutations
  const isFormLoading = isLoading || isFetchingMessage || createMessageMutation.isPending || updateMessageMutation.isPending;

  // Register the file input with react-hook-form but also keep our local ref
  const attachmentRegister = register("attachment", { onChange: handleFileChange });

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        {/* Heading Field */}
        <div className="grid gap-2 relative">
          <Label htmlFor="heading">Heading</Label>
          <Input
            id="heading"
            placeholder="Enter message heading"
            {...register("heading")}
            disabled={isFormLoading}
          />
          {errors.heading && (
            <span className="text-red-500 text-[10px] absolute bottom-0 translate-y-[105%]">
              {errors.heading.message}
            </span>
          )}
        </div>

        {/* Power Team Field */}
        <div className="grid gap-2 relative">
          <Label htmlFor="powerteam">Power Team</Label>
          <Input
            id="powerteam"
            placeholder="Enter power team name"
            {...register("powerteam")}
            disabled={isFormLoading}
          />
          {errors.powerteam && (
            <span className="text-red-500 text-[10px] absolute bottom-0 translate-y-[105%]">
              {errors.powerteam.message}
            </span>
          )}
        </div>

        {/* Message Field */}
        <div className="grid gap-2 relative">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            placeholder="Enter your message"
            {...register("message")}
            disabled={isFormLoading}
            rows={6}
          />
          {errors.message && (
            <span className="text-red-500 text-[10px] absolute bottom-0 translate-y-[105%]">
              {errors.message.message}
            </span>
          )}
        </div>

        {/* Attachment Field */}
        <div className="grid gap-2 relative">
          <Label htmlFor="attachment">Attachment</Label>
          
          {/* Current attachment (edit mode) */}
          {mode === "edit" && currentAttachment && !removeAttachment && (
            <div className="flex items-center gap-2 p-2 border rounded-md mb-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="flex-1 text-sm truncate">{currentAttachment.originalname}</span>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={handleRemoveAttachment}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* File input */}
          {(!currentAttachment || removeAttachment || mode === "create") && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Input
                  id="attachment"
                  type="file"
                  className="flex-1"
                  disabled={isFormLoading}
                  {...attachmentRegister}
                  ref={(e) => {
                    attachmentRegister.ref(e);
                    fileInputRef.current = e;
                  }}
                />
                {selectedFile?.[0] && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                      setValue("attachment", undefined);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Accepted: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TXT (Max size: 10MB)
              </p>
            </div>
          )}
          
          {errors.attachment && (
            <span className="text-red-500 text-[10px] absolute bottom-0 translate-y-[105%]">
              {errors.attachment.message as string}
            </span>
          )}
        </div>

        {/* Submit and Cancel Buttons */}
        <div className="justify-end flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            disabled={isFormLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isFormLoading}
            className="flex items-center justify-center gap-2"
          >
            {isFormLoading ? (
              <>
                <LoaderCircle className="animate-spin h-4 w-4" />
                Saving...
              </>
            ) : mode === "create" ? (
              <>
                <Upload className="h-4 w-4" />
                Create
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Update
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MessageForm; 