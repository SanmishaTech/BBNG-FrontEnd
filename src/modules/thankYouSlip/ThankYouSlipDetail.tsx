import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { get } from "@/services/apiService";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, User, Banknote, FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ThankYouSlip {
  id: number;
  date: string;
  amount: string;
  toWhom: string;
  toWhomId?: number;
  toWhomMember?: {
    id: number;
    memberName: string;
  };
  narration: string;
  testimony: string;
  fromMember?: {
    id: number;
    memberName: string;
  };
  reference?: {
    id: number;
    nameOfReferral: string;
    status: string;
    giver: {
      id: number;
      memberName: string;
    };
    receiver: {
      id: number;
      memberName: string;
    };
  };
  chapter: {
    id: number;
    name: string;
  };

  createdAt: string;
}

const ThankYouSlipDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [thankYouSlip, setThankYouSlip] = useState<ThankYouSlip | null>(null);
  const [slipType, setSlipType] = useState<string>("given"); // default to given
  
  // Get the slip type from URL query parameter
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const typeParam = queryParams.get("type");
    if (typeParam === "received" || typeParam === "given") {
      setSlipType(typeParam);
    }
  }, []);

  // Load thank you slip details
  useEffect(() => {
    const loadThankYouSlipDetails = async () => {
      if (!id) {
        toast.error("Done deal ID is missing");
        navigate("/dashboard/done-deal");
        return;
      }

      try {
        setLoading(true);
        const response = await get(`/thankyou-slips/${id}`);
        
        // The response comes directly as the thank you slip object
        if (response && response.id) {
          setThankYouSlip(response);
        } else {
          toast.error("Failed to load done deal details");
          navigate("/dashboard/done-deal");
        }
      } catch (error) {
        console.error("Error loading done deal:", error);
        toast.error("Failed to load done deal details");
        navigate("/dashboard/done-deal");
      } finally {
        setLoading(false);
      }
    };

    loadThankYouSlipDetails();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="pt-6">
            <div className="text-center py-4">Loading done deal details...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!thankYouSlip) {
    return (
      <div className="container mx-auto py-6">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <p className="text-red-500">Done deal not found</p>
              <Button 
                className="mt-4" 
                onClick={() => navigate("/dashboard/done-deal")}
              >
                Return to Done Deals
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      
      
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center">
                Done Deal Details
                <Badge variant={thankYouSlip.reference ? "outline" : "default"} className="ml-2">
                  {thankYouSlip.reference ? "Reference-based" : "Direct"}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                Created on {format(new Date(thankYouSlip.createdAt), "PPP")}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate("/dashboard/done-deal")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/20 rounded-md">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Date
              </div>
              <p className="text-lg font-medium">{format(new Date(thankYouSlip.date), "PPP")}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Slip Type
              </div>
              <p className="text-lg font-medium">
                <Badge variant={thankYouSlip.reference ? "outline" : "default"}>
                  {thankYouSlip.reference ? "Reference-based" : "Direct Done Deal"}
                </Badge>
              </p>
            </div>

            {/* <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="h-4 w-4 mr-2" />
                {slipType === "given" ? "From Member" : "Sent By"}
              </div>
              <p className="text-lg font-medium">
                {thankYouSlip.fromMember?.memberName || "Unknown"}
              </p>
            </div> */}

            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="h-4 w-4 mr-2" />
                {slipType === "given" ? "To Whom" : "Received By"}
              </div>
              <p className="text-lg font-medium">{thankYouSlip.toWhomMember?.memberName || thankYouSlip.toWhom}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="h-4 w-4 mr-2" />
                From Chapter
              </div>
              <p className="text-lg font-medium">{thankYouSlip.chapter.name}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Banknote className="h-4 w-4 mr-2" />
                Amount
              </div>
              <p className="text-lg font-medium">{thankYouSlip.amount}</p>
            </div>
          </div>

          {/* Reference Details - Only show if this is a reference-based slip */}
          {thankYouSlip.reference && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Reference Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/20 rounded-md">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="h-4 w-4 mr-2" />
                      Referenced Person
                    </div>
                    <p className="text-lg font-medium">{thankYouSlip.reference.nameOfReferral}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <FileText className="h-4 w-4 mr-2" />
                      Reference Status
                    </div>
                    <Badge variant="outline" className="mt-1">
                      {thankYouSlip.reference.status}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="h-4 w-4 mr-2" />
                      Given By
                    </div>
                    <p className="text-lg font-medium">{thankYouSlip.reference.giver.memberName}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="h-4 w-4 mr-2" />
                      Received By
                    </div>
                    <p className="text-lg font-medium">{thankYouSlip.reference.receiver.memberName}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Narration and Testimony */}
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Details</h3>
            
            <div className="grid grid-cols-1 gap-6 p-4 bg-muted/20 rounded-md">
              <div className="space-y-2 border-b pb-4">
                <div className="flex items-center text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4 mr-2" />
                  Narration
                </div>
                <div className="p-3 bg-card rounded-md border">
                  <p className="whitespace-pre-wrap">{thankYouSlip.narration || "No narration provided"}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4 mr-2" />
                  Testimony
                </div>
                <div className="p-3 bg-card rounded-md border">
                  <p className="whitespace-pre-wrap">{thankYouSlip.testimony || "No testimony provided"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Info */}
          <Separator />
          <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center text-sm text-muted-foreground p-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                <span className="font-medium">From:</span> {thankYouSlip.fromMember?.memberName || "Unknown"} ({thankYouSlip.chapter.name})
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                <span className="font-medium">To:</span> {thankYouSlip.toWhomMember?.memberName || thankYouSlip.toWhom}
              </div>
            </div>
            <div>
              Created: {format(new Date(thankYouSlip.createdAt), "PPP")}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThankYouSlipDetail;
