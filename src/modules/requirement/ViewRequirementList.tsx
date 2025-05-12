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
import { LoaderCircle, Search } from "lucide-react";

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
              className="border rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:-rotate-1 transition-transform duration-300 bg-white"
            >
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{req.heading}</CardTitle>
                  {req.member?.memberName && (
                    <CardDescription>
                      Member: {req.member.memberName}
                    </CardDescription>
                  )}
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                  {new Date(req.createdAt).toLocaleString()}
                </span>
              </CardHeader>
              <CardContent>
                <p>{req.requirement}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground">No requirements found.</div>
      )}
    </div>
  );
};

export default ViewRequirementList;
