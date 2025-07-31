import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ArrowUpDown, Eye } from "lucide-react";
import type {
  ChapterPerformance,
  MemberPerformance,
} from "@/services/performanceDashboardService";

interface PerformanceTableProps {
  chapters: ChapterPerformance[];
}

type SortField =
  | "memberName"
  | "businessGenerated"
  | "businessReceived"
  | "oneToOneMeetings"
  | "referencesGiven"
  | "referencesReceived";
type SortDirection = "asc" | "desc";

export const PerformanceTable: React.FC<PerformanceTableProps> = ({
  chapters,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("businessGenerated");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Flatten all members from all chapters
  const allMembers = chapters.flatMap((chapter) =>
    chapter.members.map((member) => ({
      ...member,
      chapterName: chapter.chapterName,
      chapterId: chapter.chapterId,
    }))
  );

  // Filter members based on search term
  const filteredMembers = allMembers.filter(
    (member) =>
      member.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.organizationName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      member.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.chapterName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort members
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (sortField) {
      case "memberName":
        aValue = a.memberName;
        bValue = b.memberName;
        break;
      case "businessGenerated":
        aValue = a.businessGenerated.amount;
        bValue = b.businessGenerated.amount;
        break;
      case "businessReceived":
        aValue = a.businessReceived.amount;
        bValue = b.businessReceived.amount;
        break;
      case "oneToOneMeetings":
        aValue = a.oneToOneMeetings;
        bValue = b.oneToOneMeetings;
        break;
      case "referencesGiven":
        aValue = a.referencesGiven;
        bValue = b.referencesGiven;
        break;
      case "referencesReceived":
        aValue = a.referencesReceived;
        bValue = b.referencesReceived;
        break;
      default:
        aValue = 0;
        bValue = 0;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === "asc"
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortableHeader: React.FC<{
    field: SortField;
    children: React.ReactNode;
  }> = ({ field, children }) => (
    <TableHead>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleSort(field)}
        className="h-auto p-0 font-medium hover:bg-transparent"
      >
        {children}
        <ArrowUpDown className="ml-2 h-3 w-3" />
      </Button>
    </TableHead>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Member Performance</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Badge variant="secondary">{sortedMembers.length} members</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader field="memberName">Member</SortableHeader>
                <TableHead>Chapter</TableHead>
                <TableHead>Category</TableHead>
                <SortableHeader field="businessGenerated">
                  Business Generated
                </SortableHeader>
                <SortableHeader field="businessReceived">
                  Business Received
                </SortableHeader>
                <SortableHeader field="oneToOneMeetings">
                  One-to-Ones
                </SortableHeader>
                <SortableHeader field="referencesGiven">
                  Refs Given
                </SortableHeader>
                <SortableHeader field="referencesReceived">
                  Refs Received
                </SortableHeader>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                sortedMembers.map((member) => (
                  <TableRow key={`${member.chapterId}-${member.memberId}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{member.memberName}</div>
                        <div className="text-sm text-muted-foreground">
                          {member.organizationName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.chapterName}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{member.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-right">
                        <div className="font-medium text-green-600">
                          ₹{member.businessGenerated.amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.businessGenerated.count} transactions
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-right">
                        <div className="font-medium text-blue-600">
                          ₹{member.businessReceived.amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.businessReceived.count} transactions
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-purple-600">
                        {member.oneToOneMeetings}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-orange-600">
                        {member.referencesGiven}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-red-600">
                        {member.referencesReceived}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
