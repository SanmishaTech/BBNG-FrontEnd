import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/services/apiService";
import { toast } from "sonner";
import {
  Loader,
  ChevronUp,
  ChevronDown,
  Search,
  Save,
  Check,
  X,
  UserCheck,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface AttendanceData {
  meeting: any;
  memberAttendance: any[];
  totalMembers: number;
  presentCount: number;
}

const EditAttendance = () => {
  const { meetingId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("memberName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const [attendanceMap, setAttendanceMap] = useState<Record<number, boolean>>({});
  const [substituteMap, setSubstituteMap] = useState<Record<number, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch meeting attendance data
  const { data, isLoading, isError } = useQuery<AttendanceData>({
    queryKey: ["meetingAttendance", meetingId],
    queryFn: () => get(`/meeting-attendance?meetingId=${meetingId}`),
    enabled: !!meetingId,
  });

  // Initialize attendance and substitute maps when data is loaded
  useEffect(() => {
    if (data) {
      // Initialize the attendance map from the API response - all members present by default
      const initialAttendanceMap: Record<number, boolean> = {};
      const initialSubstituteMap: Record<number, boolean> = {};
      
      console.log("API response data:", data);
      
      data.memberAttendance.forEach((item: any) => {
        // Set all members to present by default
        initialAttendanceMap[item.member.id] = true;
        // Initialize substitute status from API or default to false
        initialSubstituteMap[item.member.id] = item.isSubstitute || false;
        
        console.log(`Setting initial attendance for member ${item.member.id} (${item.member.memberName}): Present, Substitute: ${initialSubstituteMap[item.member.id]}`);
      });
      
      console.log("Initial attendance map:", initialAttendanceMap);
      console.log("Initial substitute map:", initialSubstituteMap);
      
      setAttendanceMap(initialAttendanceMap);
      setSubstituteMap(initialSubstituteMap);
    }
  }, [data]);

  const meeting = data?.meeting;
  const memberAttendance = data?.memberAttendance || [];
  const totalMembers = data?.totalMembers || 0;
  const presentCount = data?.presentCount || 0;

  // Update attendance mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: (data: any) => post(`/meeting-attendance/bulk`, data),
    onSuccess: (response) => {
      console.log("Attendance update response:", response);
      toast.success("Attendance updated successfully");
      // Force refetch attendance data to ensure we have the latest state
      queryClient.invalidateQueries({ queryKey: ["meetingAttendance", meetingId] });
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      console.error("Attendance update error:", error);
      toast.error("Failed to update attendance");
      setIsSubmitting(false);
    },
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleAttendanceChange = (memberId: number, isPresent: boolean) => {
    console.log(`Changing attendance for member ${memberId} to ${isPresent ? 'Present' : 'Absent'}`);
    setAttendanceMap((prev) => {
      const newMap = {
        ...prev,
        [memberId]: isPresent,
      };
      console.log("Updated attendance map:", newMap);
      return newMap;
    });
  };

  const handleSubstituteChange = (memberId: number, isSubstitute: boolean) => {
    console.log(`Changing substitute status for member ${memberId} to ${isSubstitute ? 'Yes' : 'No'}`);
    setSubstituteMap((prev) => {
      const newMap = {
        ...prev,
        [memberId]: isSubstitute,
      };
      console.log("Updated substitute map:", newMap);
      return newMap;
    });
  };

  const saveAttendance = () => {
    if (!meetingId) return;
    
    setIsSubmitting(true);
    
    // Convert attendance map to array format for API, including substitute status
    const attendanceData = Object.entries(attendanceMap).map(([memberId, isPresent]) => {
      const memberIdNum = parseInt(memberId);
      const isSubstitute = isPresent ? substituteMap[memberIdNum] || false : false;
      
      console.log(`Saving member ${memberId} attendance: ${isPresent ? 'Present' : 'Absent'}, Substitute: ${isSubstitute}`);
      
      return {
        memberId: memberIdNum,
        isPresent,
        isSubstitute,
      };
    });
    
    console.log("Sending attendance data to server:", {
      meetingId: parseInt(meetingId),
      attendance: attendanceData,
    });
    
    updateAttendanceMutation.mutate({
      meetingId: parseInt(meetingId),
      attendance: attendanceData,
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch (e) {
      return dateString;
    }
  };

  // Filter members based on search
  const filteredMembers = search.trim() === ""
    ? memberAttendance
    : memberAttendance.filter((item: any) => 
        item.member.memberName.toLowerCase().includes(search.toLowerCase()) ||
        item.member.category.toLowerCase().includes(search.toLowerCase()) ||
        item.member.businessCategory.toLowerCase().includes(search.toLowerCase())
      );

  // Sort members based on sortBy and sortOrder
  const sortedMembers = [...filteredMembers].sort((a: any, b: any) => {
    let aValue, bValue;
    
    // Determine which property to sort by
    if (sortBy === "memberName") {
      aValue = a.member.memberName;
      bValue = b.member.memberName;
    } else if (sortBy === "category") {
      aValue = a.member.category;
      bValue = b.member.category;
    } else if (sortBy === "businessCategory") {
      aValue = a.member.businessCategory;
      bValue = b.member.businessCategory;
    } else {
      aValue = a.member[sortBy];
      bValue = b.member[sortBy];
    }
    
    // Handle string comparison
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    // Handle numeric comparison
    return sortOrder === "asc" ? (aValue - bValue) : (bValue - aValue);
  });

  return (
    <div className="mt-2 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Edit Meeting Attendance
      </h1>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <Loader className="mr-2 h-8 w-8 animate-spin" />
        </div>
      ) : meeting ? (
        <div className="mb-6">
          <h2 className="text-lg font-medium">
            Meeting: {meeting.meetingTitle}
          </h2>
          <p className="text-gray-600">
            Date: {formatDate(meeting.date)} | Time: {meeting.meetingTime} | 
            Venue: {meeting.meetingVenue}
          </p>
          <div className="mt-2 flex gap-2">
            <Badge className="bg-blue-500">Total Members: {totalMembers}</Badge>
            <Badge className="bg-green-500">Present: {presentCount}</Badge>
            <Badge className="bg-red-500">Absent: {totalMembers - presentCount}</Badge>
          </div>
        </div>
      ) : null}

      <Card className="mx-auto mt-6 sm:mt-10">
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-4 mb-6 mt-6">
            {/* Search Input */}
            <div className="flex-grow">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search members..."
                  value={search}
                  onChange={handleSearchChange}
                  className="w-full pl-8"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => navigate(`/chaptermeetings`)}
                variant="outline"
              >
                Back to Meetings
              </Button>
              <Button
                onClick={saveAttendance}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" />
                )}
                Save Attendance
              </Button>
            </div>
          </div>

          <Separator className="mb-4" />

          {/* Table Section */}
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader className="mr-2 h-8 w-8 animate-spin" />
            </div>
          ) : isError ? (
            <div className="text-center text-red-500">
              Failed to load attendance data.
            </div>
          ) : filteredMembers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      onClick={() => handleSort("memberName")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Member Name</span>
                        {sortBy === "memberName" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("category")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Member Category</span>
                        {sortBy === "category" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("businessCategory")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Business Category</span>
                        {sortBy === "businessCategory" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-center">Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMembers.map((item: any) => (
                    <TableRow key={item.member.id}>
                      <TableCell>
                        <div className="font-medium">{item.member.memberName}</div>
                      </TableCell>
                      <TableCell>{item.member.category}</TableCell>
                      <TableCell>{item.member.businessCategory}</TableCell>
                      <TableCell>
                        <div className="flex justify-center space-x-4">
                          <div className="flex items-center flex-wrap gap-2">
                            <Button
                              variant={attendanceMap[item.member.id] ? "default" : "outline"}
                              size="sm"
                              className={`mr-2 px-3 ${
                                attendanceMap[item.member.id] ? "bg-green-600" : ""
                              }`}
                              onClick={() => handleAttendanceChange(item.member.id, true)}
                            >
                              <Check size={16} />
                              <span className="ml-1">Present</span>
                            </Button>
                            <Button
                              variant={!attendanceMap[item.member.id] ? "default" : "outline"}
                              size="sm"
                              className={`px-3 ${
                                !attendanceMap[item.member.id] ? "bg-red-600" : ""
                              }`}
                              onClick={() => handleAttendanceChange(item.member.id, false)}
                            >
                              <X size={16} />
                              <span className="ml-1">Absent</span>
                            </Button>
                            
                            {/* Substitute toggle button - only shown when member is present */}
                            {attendanceMap[item.member.id] && (
                              <Button
                                variant={substituteMap[item.member.id] ? "default" : "outline"}
                                size="sm"
                                className={`px-3 ml-2 ${
                                  substituteMap[item.member.id] ? "bg-blue-600" : ""
                                }`}
                                onClick={() => handleSubstituteChange(item.member.id, !substituteMap[item.member.id])}
                              >
                                <UserCheck size={16} />
                                <span className="ml-1">Substitute</span>
                              </Button>
                            )}
                            
                            <div className="ml-3 text-sm text-gray-500 min-w-[150px]">
                              <div>
                                Status: {attendanceMap[item.member.id] ? 'Present' : 'Absent'}
                              </div>
                              <div>
                                {attendanceMap[item.member.id] && 
                                 <span className="opacity-80">{substituteMap[item.member.id] ? 'Substitute: Yes' : 'Substitute: No'}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No members found</h3>
              <p className="text-gray-500 mb-4">
                There are no members in this chapter or your search returned no results.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EditAttendance;