import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// UI components
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoaderCircle, Search } from "lucide-react";
import { User, Calendar } from "lucide-react";

import { getAllRequirements } from "@/services/requirementService";

// -------------------- TYPES --------------------
interface Requirement {
  id: number;
  heading: string;
  requirement: string;
  createdAt: string;
  member?: {
    id: number;
    memberName: string;
  };
}

// -------------------- COMPONENT --------------------
const ViewRequirementList: React.FC = () => {
  const [search, setSearch] = useState("");
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);

  // Fetch all requirements
  const {
    data = [],
    isLoading,
    isError,
  } = useQuery<Requirement[]>({
    queryKey: ["requirements"],
    queryFn: getAllRequirements,
  });

  const filteredRequirements = data.filter((req) =>
    [req.heading, req.requirement, req.member?.memberName || ""].some((field) =>
      field.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <h1 className="text-xl font-bold">All Requirements</h1>

      {/* Search */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by member, heading, requirement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Separator />

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <LoaderCircle className="h-6 w-6 animate-spin" />
        </div>
      ) : isError ? (
        <div className="text-center text-red-500">Failed to load requirements.</div>
      ) : filteredRequirements.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRequirements.map((req) => (
            <Card
              key={req.id}
              className="border rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:-rotate-1 transition-transform duration-300 bg-white cursor-pointer"
              onClick={() => setSelectedReq(req)}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <CardTitle className="line-clamp-1 text-ellipsis overflow-hidden">
                    {req.heading.length > 100 
                      ? req.heading.substring(0, 100) + '...' 
                      : req.heading}
                  </CardTitle>
                  {req.member?.memberName && (
                    <CardDescription className="truncate">
                      Member: {req.member.memberName}
                    </CardDescription>
                  )}
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {new Date(req.createdAt).toLocaleString()}
                </span>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3">
                  {req.requirement.length > 51 
                    ? req.requirement.match(new RegExp(`.{1,51}`, 'g'))?.join('\n') 
                    : req.requirement}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground">No requirements found.</div>
      )}
      {/* Dialog for showing requirement details */}
      <Dialog open={!!selectedReq} onOpenChange={(open) => !open && setSelectedReq(null)}>
        <DialogContent className="sm:max-w-[625px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold whitespace-pre-line">
              {selectedReq?.heading && (selectedReq.heading.length > 65 
                ? selectedReq.heading.match(new RegExp(`.{1,65}`, 'g'))?.join('\n') 
                : selectedReq.heading)}
            </DialogTitle>
            <div className="space-y-1 text-sm">
              {selectedReq?.member?.memberName && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 opacity-70" />
                  <span>Member: {selectedReq.member.memberName}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 opacity-70" />
                <span>{selectedReq && new Date(selectedReq.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4 px-1 whitespace-pre-line text-base">
            {selectedReq?.requirement && (selectedReq.requirement.length > 60 
              ? selectedReq.requirement.match(new RegExp(`.{1,60}`, 'g'))?.join('\n') 
              : selectedReq.requirement)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewRequirementList;
