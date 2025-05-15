import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { get, post } from "@/services/apiService";
import { format } from "date-fns";
import { ArrowLeft, Calendar, User, Users, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatetimePicker } from "@/components/ui/datetime-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Member {
  id: number;
  memberName: string;
  email: string;
  organizationName: string;
}

interface Chapter {
  id: number;
  name: string;
}

interface OneToOneFormData {
  date: string;
  requestedId: string;
  chapterId: string;
  remarks: string;
}

const OneToOneForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<OneToOneFormData>({
    date: format(new Date(), "yyyy-MM-dd"),
    requestedId: "",
    chapterId: "",
    remarks: "",
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterMembers, setChapterMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load chapters for the form
  useEffect(() => {
    const loadFormData = async () => {
      setLoading(true);
      try {
        // Load chapters
        const chaptersResponse = await get("/chapters");
        setChapters(chaptersResponse.chapters || []);
      } catch (error) {
        console.error("Error loading form data:", error);
        toast.error("Failed to load form data");
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, []);

  // Load members based on selected chapter
  useEffect(() => {
    if (!formData.chapterId) return;
    
    const loadChapterMembers = async () => {
      setLoadingMembers(true);
      try {
        // Load members by chapter
        const membersResponse = await get(`/members?chapterId=${formData.chapterId}`);
        setChapterMembers(membersResponse.members || []);
      } catch (error) {
        console.error("Error loading chapter members:", error);
        toast.error("Failed to load members for this chapter");
      } finally {
        setLoadingMembers(false);
      }
    };

    loadChapterMembers();
  }, [formData.chapterId]);

  const handleChange = (
    key: keyof OneToOneFormData,
    value: string
  ) => {
    setFormData((prev) => {
      // If changing chapter, reset requestedId
      if (key === "chapterId") {
        return { ...prev, [key]: value, requestedId: "" };
      }
      return { ...prev, [key]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.requestedId || !formData.chapterId) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await post("/one-to-ones", formData);
      toast.success("One-to-One meeting scheduled successfully");
      navigate("/one-to-ones");
    } catch (error) {
      console.error("Error creating One-to-One meeting:", error);
      toast.error("Failed to schedule One-to-One meeting");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-10">Loading form data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-center items-center mb-6">
        
        <h1 className="text-2xl  font-bold">Schedule a One-to-One Meeting</h1>
      </div>

      <Card className="max-w-2xl mx-auto shadow-sm">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="text-xl">Meeting Details</CardTitle>
          <CardDescription>
            Fill out the details to schedule a one-to-one meeting
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 gap-6">
              <h1> Who would you like to meet with?</h1>
              <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
                <Label htmlFor="chapter" className="text-base font-medium">
               Chapter  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.chapterId}
                  onValueChange={(value) => handleChange("chapterId", value)}
                  required
                >
                  <SelectTrigger id="chapter" className="h-10 w-full">
                    <SelectValue placeholder="Select a chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Chapters</SelectLabel>
                      {chapters.map((chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id.toString()}>
                          {chapter.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="member" className="text-base font-medium">
                  Member <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.requestedId}
                  onValueChange={(value) => handleChange("requestedId", value)}
                  required
                  disabled={!formData.chapterId || loadingMembers}
                >
                  <SelectTrigger id="member" className="h-10 w-full">
                    <SelectValue placeholder={loadingMembers ? "Loading members..." : formData.chapterId ? "Select a member" : "First select a chapter"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Members</SelectLabel>
                      {loadingMembers ? (
                        <SelectItem value="loading" disabled>Loading members...</SelectItem>
                      ) : chapterMembers.length > 0 ? (
                        chapterMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id.toString()}>
                            {member.memberName} - {member.organizationName}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No members found in this chapter</SelectItem>
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              

              <div className="space-y-2">
                <Label htmlFor="date" className="text-base font-medium">
                  Meeting Date <span className="text-red-500">*</span>
                </Label>
                <DatetimePicker
                  value={formData.date ? new Date(formData.date) : new Date()}
                  className="w-full"
                  onChange={(date) => handleChange("date", format(date as Date, "yyyy-MM-dd"))}
                  format={[
                    ["months", "days", "years"]
                  ]}
                />
              </div>
              </div>

             

              <div className="space-y-2">
                <Label htmlFor="remarks" className="text-base font-medium">
                  Discussion Topics
                </Label>
                <Textarea
                  id="remarks"
                  placeholder="What would you like to discuss in this meeting?"
                  value={formData.remarks}
                  onChange={(e) => handleChange("remarks", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t p-4 bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/one-to-ones")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Scheduling..." : "Meeting"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default OneToOneForm; 