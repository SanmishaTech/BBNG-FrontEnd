import { useEffect, useState, useRef } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LoaderCircle, Upload, X, FileText, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { getMessage, createMessage, updateMessage, MessageData } from "@/services/messageService"; 
import { get } from "@/services/apiService"; 

const MAX_FILE_SIZE = 10 * 1024 * 1024; 
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
  targetType: z.enum(['chapter', 'powerTeam']).optional(), 
  selectedChapterId: z.string().optional(), 
  selectedPowerTeamId: z.string().optional(), 
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

interface Chapter {
  id: number | string;
  name: string;
}

interface PowerTeam {
  id: number | string;
  name: string;
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
  
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [powerTeams, setPowerTeams] = useState<PowerTeam[]>([]);
  const [isFetchingDropdownData, setIsFetchingDropdownData] = useState(false);

  const userData = (() => {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error("Error parsing user data from localStorage:", e);
      return null;
    }
  })();
  const userRole = userData?.role;
  const userMemberChapterId = userData?.member?.chapterId;

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
    control, 
    formState: { errors },
  } = useForm<MessageFormInputs>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      heading: "",
      message: "",
      removeAttachment: false,
      targetType: 'chapter',
      selectedChapterId: '',
      selectedPowerTeamId: '',
    },
  });

  const selectedFile = watch("attachment");
  const formTargetType = watch("targetType"); 
  const formSelectedChapterId = watch("selectedChapterId");
  const formSelectedPowerTeamId = watch("selectedPowerTeamId");
  const removeAttachment = watch("removeAttachment");

  useEffect(() => {
    if (userRole === 'admin') {
      const fetchDropdownData = async () => {
        setIsFetchingDropdownData(true);
        try {
          const [chaptersRes, powerTeamsRes] = await Promise.all([
            get('/chapters'), 
            get('/powerteams') 
          ]);

          if (Array.isArray(chaptersRes?.chapters)) {
            setChapters(chaptersRes.chapters);
          } else if (Array.isArray(chaptersRes?.data?.chapters)) { 
            setChapters(chaptersRes.data.chapters);
          } else if (Array.isArray(chaptersRes)) { 
            setChapters(chaptersRes);
          } else {
            setChapters([]);
            console.error("Unexpected format for chapters list or chapters array not found:", chaptersRes);
            toast.error("Failed to load chapters: Unexpected format.");
          }

          if (Array.isArray(powerTeamsRes?.powerTeams)) {
            setPowerTeams(powerTeamsRes.powerTeams);
          } else if (Array.isArray(powerTeamsRes?.data?.powerTeams)) { 
            setPowerTeams(powerTeamsRes.data.powerTeams);
          } else if (Array.isArray(powerTeamsRes)) { 
            setPowerTeams(powerTeamsRes);
          } else {
            setPowerTeams([]);
            console.error("Unexpected format for power teams list or powerTeams array not found:", powerTeamsRes);
            toast.error("Failed to load power teams: Unexpected format.");
          }

        } catch (error) {
          toast.error("Failed to load chapters or power teams.");
          console.error("Error fetching dropdown data:", error);
          setChapters([]); 
          setPowerTeams([]); 
        }
        setIsFetchingDropdownData(false);
      };
      fetchDropdownData();
    }
  }, [userRole]);

  const { data: existingMessageData, isLoading: isFetchingMessage } = useQuery<MessageData, Error>({
    queryKey: ["message", messageId],
    queryFn: async () => {
      if (!messageId) throw new Error("Message ID is required for edit mode.");
      return getMessage(messageId);
    },
    enabled: mode === "edit" && !!messageId,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (mode === "edit" && existingMessageData) {
      setValue("heading", existingMessageData.heading);
      setValue("message", existingMessageData.message);

      if (userRole === 'admin') {
        if (existingMessageData.chapterId) {
          setValue('targetType', 'chapter');
          setValue('selectedChapterId', existingMessageData.chapterId.toString());
        } else if (existingMessageData.powerTeamId) {
          setValue('targetType', 'powerTeam');
          setValue('selectedPowerTeamId', existingMessageData.powerTeamId.toString());
        }
      }

      if (existingMessageData.attachment) {
        try {
          const attachmentInfo = JSON.parse(existingMessageData.attachment);
          setCurrentAttachment({
            originalname: attachmentInfo.originalname,
            mimetype: attachmentInfo.mimetype,
            size: attachmentInfo.size,
          });
        } catch (e) {
          console.error("Error parsing attachment data:", e);
          setCurrentAttachment(null); 
        }
      }
    }
  }, [mode, existingMessageData, setValue, userRole]);
  
  const mutationOptions = {
    onSuccess: (_data: MessageData) => { 
      setIsLoading(false);
      toast.success(`Message ${mode === 'create' ? 'created' : 'updated'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['messages'] }); 
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/messages"); 
      }
      reset(); 
    },
    onError: (error: any) => {
      setIsLoading(false);
      const errorMsg = error.response?.data?.errors?.message || error.response?.data?.message || error.message || "An unexpected error occurred.";
      toast.error(errorMsg);
      if (error.response?.data?.errors) {
        Object.entries(error.response.data.errors).forEach(([key, value]) => {
          setError(key as keyof MessageFormInputs, { type: 'manual', message: value as string });
        });
      }
    },
  };

  const createMessageMutation = useMutation<MessageData, Error, FormData>({
    mutationFn: createMessage, 
    ...mutationOptions
  });
  const updateMessageMutation = useMutation<MessageData, Error, { id: string; formData: FormData }>({
    mutationFn: (payload: { id: string; formData: FormData }) => updateMessage(payload.id, payload.formData),
    ...mutationOptions
  });

  const onSubmit: SubmitHandler<MessageFormInputs> = (data) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("heading", data.heading);
    formData.append("message", data.message);
    
    if (data.attachment && data.attachment[0]) {
      formData.append("attachment", data.attachment[0]);
    }
    
    if (mode === "edit" && data.removeAttachment) {
      formData.append("removeAttachment", "true");
    }

    if (userRole === 'admin') {
      if (formTargetType === 'chapter') {
        if (!formSelectedChapterId) {
          toast.error("Please select a chapter.");
          setError('selectedChapterId', { type: 'manual', message: 'Chapter is required.' });
          setIsLoading(false);
          return;
        }
        formData.append('chapterId', formSelectedChapterId);
      } else if (formTargetType === 'powerTeam') {
        if (!formSelectedPowerTeamId) {
          toast.error("Please select a power team.");
          setError('selectedPowerTeamId', { type: 'manual', message: 'Power team is required.' });
          setIsLoading(false);
          return;
        }
        formData.append('powerTeamId', formSelectedPowerTeamId);
      } else {
        toast.error("Please select a target (chapter or power team).");
        setIsLoading(false);
        return; 
      }
    } else if (userRole === 'member') {
      if (!userMemberChapterId) {
        toast.error("Your chapter information is missing. Cannot send message.");
        setIsLoading(false);
        return;
      }
      formData.append('chapterId', userMemberChapterId.toString());
    } else {
      toast.error("You are not authorized to send messages.");
      setIsLoading(false);
      return;
    }

    if (mode === "create") {
      createMessageMutation.mutate(formData);
    } else if (mode === "edit" && messageId) {
      updateMessageMutation.mutate({ id: messageId, formData });
    }
  };

  const handleFileDeselect = () => {
    setValue("attachment", null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (mode === "edit" && currentAttachment) {
        setValue("removeAttachment", true);
    }
  };

  const handleRemoveCurrentAttachment = () => {
    setCurrentAttachment(null);
    setValue("removeAttachment", true); 
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-6 ${className || ''}`}>
      {/* Heading Field */}
      <div>
        <Label htmlFor="heading">Heading <span className="text-red-500">*</span></Label>
        <Input
        className="mt-2"
        id="heading" {...register("heading")} placeholder="Enter message heading" />
        {errors.heading && <p className="text-sm text-red-500 mt-1">{errors.heading.message}</p>}
      </div>

      {/* Target Selection for Admin */}
      {userRole === 'admin' && (
        <div className="space-y-2">
          <Label>Send To</Label>
          <Controller
            name="targetType"
            control={control}
            render={({ field }) => (
              <RadioGroup
                value={field.value || 'chapter'} 
                onValueChange={(value) => {
                  field.onChange(value as 'chapter' | 'powerTeam');
                  setValue('selectedChapterId', ''); 
                  setValue('selectedPowerTeamId', '');
                }}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="chapter" id="r_chapter" />
                  <Label htmlFor="r_chapter">Chapter</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="powerTeam" id="r_powerTeam" />
                  <Label htmlFor="r_powerTeam">Power Team</Label>
                </div>
              </RadioGroup>
            )}
          />
          {errors.targetType && <p className="text-sm text-red-500 mt-1">{errors.targetType.message}</p>}

          {formTargetType === 'chapter' && (
            <div>
              <Label 
                className="mb-2"
              htmlFor="selectedChapterId">Chapter <span className="text-red-500">*</span></Label>
              <Controller
                name="selectedChapterId"
                control={control}
                rules={{ required: formTargetType === 'chapter' ? 'Chapter is required' : false }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isFetchingDropdownData}>
                    <SelectTrigger>
                      <SelectValue placeholder={isFetchingDropdownData ? "Loading chapters..." : "Select a chapter"} />
                    </SelectTrigger>
                    <SelectContent>
                      {chapters.map((chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id.toString()}>
                          {chapter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.selectedChapterId && <p className="text-sm text-red-500 mt-1">{errors.selectedChapterId.message}</p>}
            </div>
          )}

          {formTargetType === 'powerTeam' && (
            <div>
              <Label
                className="mb-2"
              htmlFor="selectedPowerTeamId">Power Team <span className="text-red-500">*</span></Label>
              <Controller
                name="selectedPowerTeamId"
                control={control}
                rules={{ required: formTargetType === 'powerTeam' ? 'Power Team is required' : false }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isFetchingDropdownData}>
                    <SelectTrigger>
                      <SelectValue placeholder={isFetchingDropdownData ? "Loading power teams..." : "Select a power team"} />
                    </SelectTrigger>
                    <SelectContent>
                      {powerTeams.map((pt) => (
                        <SelectItem key={pt.id} value={pt.id.toString()}>
                          {pt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.selectedPowerTeamId && <p className="text-sm text-red-500 mt-1">{errors.selectedPowerTeamId.message}</p>}
            </div>
          )}
        </div>
      )}
      
      {/* Message Field */}
      <div>
        <Label htmlFor="message">Message <span className="text-red-500">*</span></Label>
        <Textarea
          className="mt-2"
          id="message" {...register("message")} placeholder="Enter your message" rows={6} />
        {errors.message && <p className="text-sm text-red-500 mt-1">{errors.message.message}</p>}
      </div>

      {/* Attachment Field */}
      <div>
        <Label htmlFor="attachment">Attachment (Optional)</Label>
        <div className="mt-1 flex items-center space-x-2">
          <Input
            id="attachment-input"
            type="file"
            {...register("attachment")}
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => {
              setValue("attachment", e.target.files);
              if (mode === 'edit' && currentAttachment) {
                  setCurrentAttachment(null); 
                  setValue("removeAttachment", true); 
              }
            }}
          />
          <Button 
            type="button" 
            variant="outline"
            onClick={() => document.getElementById('attachment-input')?.click()} 
            className="flex items-center"
          >
            <Upload className="mr-2 h-4 w-4" /> Choose File
          </Button>
          {selectedFile && selectedFile[0] && (
            <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
              <FileText className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-700 truncate max-w-xs">{selectedFile[0].name}</span>
              <Button type="button" variant="ghost" size="icon" onClick={handleFileDeselect} className="h-6 w-6">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {!selectedFile && currentAttachment && mode === 'edit' && (
            <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
                <Paperclip className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-700 truncate max-w-xs">{currentAttachment.originalname}</span>
                <Button type="button" variant="ghost" size="icon" onClick={handleRemoveCurrentAttachment} className="h-6 w-6">
                    <X className="h-4 w-4" />
                </Button>
            </div>
          )}
        </div>
        {errors.attachment && <p className="text-sm text-red-500 mt-1">{errors.attachment.message as string}</p>}
        {removeAttachment && mode === 'edit' && currentAttachment && (
            <p className="text-sm text-orange-600 mt-1">Current attachment will be removed upon saving.</p>
        )}
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={isLoading || isFetchingMessage || createMessageMutation.isPending || updateMessageMutation.isPending} className="w-full sm:w-auto">
        {(isLoading || isFetchingMessage || createMessageMutation.isPending || updateMessageMutation.isPending) && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
        {mode === "create" ? "Send Message" : "Update Message"}
      </Button>
    </form>
  );
};

export default MessageForm;