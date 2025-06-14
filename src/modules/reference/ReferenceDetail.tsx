import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { get, patch } from "@/services/apiService";
import { format } from "date-fns";
import { Pencil, ArrowLeft, CheckCircle2, History, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StatusHistory {
  id: number;
  date: string;
  status: string;
  comment?: string;
  createdAt: string;
}

interface Reference {
  id: number;
  date: string;
  noOfReferences?: number;
  chapterId: number;
  memberId: number;
  giverId?: number;
  receiverId?: number;
  urgency?: string;
  self: boolean;
  nameOfReferral: string;
  mobile1: string;
  mobile2?: string;
  email?: string;
  remarks?: string;
  addressLine1?: string;
  location?: string;
  addressLine2?: string;
  pincode?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  statusHistory?: StatusHistory[];
  member?: {
    id: number;
    memberName: string;
    email: string;
  };
  giver?: {
    id: number;
    memberName: string;
    email: string;
  };
  receiver?: {
    id: number;
    memberName: string;
    email: string;
  };
  chapter?: {
    id: number;
    name: string;
  };
}

const ReferenceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reference, setReference] = useState<Reference | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusUpdateData, setStatusUpdateData] = useState({
    status: "",
    date: format(new Date(), "yyyy-MM-dd"),
    comment: ""
  });
  
  // Get current member ID from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentMemberId = currentUser.member?.id;
  
  // Check if current user is the receiver of this reference (allowed to update status)
  const [isReceiver, setIsReceiver] = useState(false);

  // Load reference details
  useEffect(() => {
    const loadReference = async () => {
      setLoading(true);
      try {
        const reference = await get(`/references/${id}`);
        // Check if statusHistory exists, if not initialize it as empty array
        if (!reference.statusHistory) {
          reference.statusHistory = [];
        }
        setReference(reference);
        
        // Check if current user is the receiver of this reference
        if (currentMemberId && reference.receiverId === currentMemberId) {
          setIsReceiver(true);
        } else {
          setIsReceiver(false);
        }
      } catch (error) {
        console.error("Error loading reference:", error);
        toast.error("Failed to load reference details");
        navigate("/references");
      } finally {
        setLoading(false);
      }
    };

    loadReference();
  }, [id, navigate]);

  // Open status update dialog
  const openStatusUpdateDialog = () => {
    if (!isReceiver) {
      toast.info("Only the reference receiver can update the status");
      return;
    }
    
    if (reference) {
      setStatusUpdateData({
        status: reference.status,
        date: format(new Date(), "yyyy-MM-dd"),
        comment: ""
      });
      setStatusDialogOpen(true);
    }
  };

  // Update reference status
  const handleStatusUpdate = async () => {
    if (!reference) return;
    
    setStatusUpdating(true);
    try {
      const response = await patch(`/references/${id}/status`, statusUpdateData);
      
      // Create a new status history entry if the API doesn't return one
      const newStatusHistory = response.statusHistory || [...(reference.statusHistory || [])];
      
      // If the API doesn't return updated status history, manually add an entry
      if (!response.statusHistory) {
        newStatusHistory.push({
          id: Date.now(), // Temporary ID
          date: statusUpdateData.date,
          status: statusUpdateData.status,
          comment: statusUpdateData.comment,
          createdAt: new Date().toISOString()
        });
      }
      
      setReference(prev => prev ? { 
        ...prev, 
        status: response.status || statusUpdateData.status,
        statusHistory: newStatusHistory
      } : null);
      
      toast.success(`Reference status updated to ${statusUpdateData.status}`);
      setStatusDialogOpen(false);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update reference status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "contacted":
        return "bg-blue-100 text-blue-800";
      case "converted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgencyBadgeClass = (urgency?: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate("/references")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to References
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading reference details...</div>
      ) : !reference ? (
        <div className="text-center py-10">Reference not found</div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="relative">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">Reference: {reference.nameOfReferral}</CardTitle>
                  <CardDescription>
                    Created on {format(new Date(reference.createdAt), "Mdd/MM/yyyy")}
                    {reference.giver && reference.receiver && (
                      <div className="mt-1 font-medium">
                        <span className="text-blue-600">{reference.giver.memberName}</span> → <span className="text-green-600">{reference.receiver.memberName}</span>
                      </div>
                    )}
                  </CardDescription>
                </div>
              {!isReceiver &&   <Link to={`/references/${id}/edit`}>
                  <Button size="sm">
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Button>
                </Link>}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Reference Status</h3>
                <div className="flex items-center gap-4">
                  <Badge 
                    className={`${getStatusBadgeClass(reference.status)} px-3 py-1`}
                  >
                    {reference.status.charAt(0).toUpperCase() + reference.status.slice(1)}
                  </Badge>
                  {isReceiver ? (
                    <Button onClick={openStatusUpdateDialog} variant="outline" size="sm">
                      <History className="mr-2 h-4 w-4" /> Update Status
                    </Button>
                    ) : null}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Basic Details</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-gray-600">Date</dt>
                      <dd className="font-medium">
                        {format(new Date(reference.date), "Mdd/MM/yyyy")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">Chapter</dt>
                      <dd className="font-medium">{reference.chapter?.name || "N/A"}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">Reference Giver</dt>
                      <dd className="font-medium text-blue-600">{reference.giver?.memberName || reference.member?.memberName || "N/A"}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">Reference Receiver</dt>
                      <dd className="font-medium text-green-600">{reference.receiver?.memberName || (reference.self ? reference.member?.memberName : "N/A")}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">No. of References</dt>
                      <dd className="font-medium">{reference.noOfReferences || "N/A"}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">Urgency</dt>
                      <dd>
                        {reference.urgency ? (
                          <Badge className={getUrgencyBadgeClass(reference.urgency)}>
                            {reference.urgency.charAt(0).toUpperCase() + reference.urgency.slice(1)}
                          </Badge>
                        ) : (
                          "N/A"
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">Self Referral</dt>
                      <dd className="font-medium flex items-center">
                        {reference.self ? (
                          <>
                            <CheckCircle2 className="mr-1 h-4 w-4 text-green-600" /> Yes
                          </>
                        ) : (
                          "No"
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-gray-600">Name</dt>
                      <dd className="font-medium">{reference.nameOfReferral}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">Primary Mobile</dt>
                      <dd className="font-medium">{reference.mobile1}</dd>
                    </div>
                    {reference.mobile2 && (
                      <div>
                        <dt className="text-sm text-gray-600">Secondary Mobile</dt>
                        <dd className="font-medium">{reference.mobile2}</dd>
                      </div>
                    )}
                    {reference.email && (
                      <div>
                        <dt className="text-sm text-gray-600">Email</dt>
                        <dd className="font-medium">{reference.email}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Address Information</h3>
                  <dl className="space-y-2">
                    {reference.addressLine1 && (
                      <div>
                        <dt className="text-sm text-gray-600">Address Line 1</dt>
                        <dd className="font-medium">{reference.addressLine1}</dd>
                      </div>
                    )}
                    {reference.addressLine2 && (
                      <div>
                        <dt className="text-sm text-gray-600">Address Line 2</dt>
                        <dd className="font-medium">{reference.addressLine2}</dd>
                      </div>
                    )}
                    {reference.location && (
                      <div>
                        <dt className="text-sm text-gray-600">Location</dt>
                        <dd className="font-medium">{reference.location}</dd>
                      </div>
                    )}
                    {reference.pincode && (
                      <div>
                        <dt className="text-sm text-gray-600">Pincode</dt>
                        <dd className="font-medium">{reference.pincode}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {reference.remarks && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Remarks</h3>
                    <p className="whitespace-pre-line">{reference.remarks}</p>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <div className="text-sm text-gray-500">
                Last updated: {format(new Date(reference.updatedAt), "Mdd/MM/yyyy")}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/references")}>
                  Back
                </Button>
                {isReceiver ? (
                <Button 
                  variant="outline" 
                  onClick={openStatusUpdateDialog} 
                  className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                >
                  <History className="mr-2 h-4 w-4" /> Update Status
                </Button>
              ) : null}
                {isReceiver && <Link to={`/references/${id}/edit`}>
                  <Button>Edit Reference</Button>
                </Link>}
              </div>
            </CardFooter>
          </Card>

          {/* Status History Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Reference Status History</CardTitle>
              <CardDescription>Tracking changes in status for this reference</CardDescription>
            </CardHeader>
            <CardContent>
              {reference.statusHistory && reference.statusHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No.</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reference.statusHistory
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((history, index) => (
                        <TableRow key={history.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{format(new Date(history.date), "dd/MM/yyyy")}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeClass(history.status)}>
                              {history.status.charAt(0).toUpperCase() + history.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{history.comment || '-'}</TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {format(new Date(history.createdAt), "dd/MM/yyyy HH:mm")}
                          </TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-gray-500">No status updates yet</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Reference Status</DialogTitle>
            <DialogDescription>
              Update the status of this reference and add a comment for tracking.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="updateDate" className="text-right">
                Date
              </label>
              <Input
                id="updateDate"
                type="date"
                value={statusUpdateData.date}
                onChange={(e) => setStatusUpdateData({...statusUpdateData, date: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="updateStatus" className="text-right">
                Status
              </label>
              <Select
                value={statusUpdateData.status}
                onValueChange={(value) => setStatusUpdateData({...statusUpdateData, status: value})}
              >
                <SelectTrigger className="col-span-3" id="updateStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="business done">Business Done</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="updateComment" className="text-right">
                Comment
              </label>
              <Textarea
                id="updateComment"
                value={statusUpdateData.comment}
                onChange={(e) => setStatusUpdateData({...statusUpdateData, comment: e.target.value})}
                placeholder="Add a comment about this status update"
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={statusUpdating}>
              {statusUpdating ? "Updating..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReferenceDetail; 