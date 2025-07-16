import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Users,
  Building2,
  TrendingUp,
  ArrowUpRight,
  MessageSquare,
  HandHeart,
  Filter,
} from "lucide-react";
import {
  performanceDashboardService,
  type PerformanceData,
  type RoleInfo,
} from "@/services/performanceDashboardService";
import { format } from "date-fns";

const PerformanceDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [selectedZoneChapters, setSelectedZoneChapters] = useState<any[]>([]);
  const [selectedChapterInZone, setSelectedChapterInZone] = useState<
    number | null
  >(null);
  const [showFilters, setShowFilters] = useState(false);

  // Get user role info
  const { data: roleInfo, isLoading: roleLoading } = useQuery<RoleInfo>({
    queryKey: ["userRoleInfo"],
    queryFn: performanceDashboardService.getUserRoleInfo,
  });

  // Get performance data for current chapter only
  const currentScope = roleInfo?.accessScope[currentChapterIndex];
  const isZoneSelected =
    currentScope?.accessType === "zone" && selectedChapterInZone === null;
  const currentChapterId = isZoneSelected
    ? null
    : selectedChapterInZone ||
      roleInfo?.accessScope[currentChapterIndex]?.chapterId;

  const {
    data: performanceData,
    isLoading: dataLoading,
    refetch,
  } = useQuery<PerformanceData>({
    queryKey: ["performanceData", dateRange, currentChapterId],
    queryFn: () =>
      performanceDashboardService.getPerformanceData({
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
        chapterId: currentChapterId,
      }),
    enabled: !!roleInfo && !!currentChapterId && !isZoneSelected,
  });

  const handleDateRangeChange = (
    field: "startDate" | "endDate",
    value: string
  ) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      regional_director: "Regional Director",
      joint_secretary: "Joint Secretary",
      guardian: "Guardian",
      development_coordinator: "Development Coordinator",
      office_bearer: "Office Bearer",
      member: "Member",
    };
    return roleMap[role] || role;
  };

  // Helper function to get chapters in a zone
  const getChaptersInZone = async (zoneName: string) => {
    try {
      const chapters = await performanceDashboardService.getChaptersInZone(
        zoneName
      );
      return chapters || [];
    } catch (error) {
      console.error("Error fetching chapters in zone:", error);
      return [];
    }
  };

  // Handle zone/chapter selection
  const handleScopeSelection = async (scope: any, index: number) => {
    if (scope.accessType === "zone") {
      // Zone selected - show chapters in this zone
      const chaptersInZone = await getChaptersInZone(scope.zoneName);
      setSelectedZoneChapters(chaptersInZone);
      setSelectedChapterInZone(null);
      setCurrentChapterIndex(index);
    } else {
      // Regular chapter selected
      setSelectedZoneChapters([]);
      setSelectedChapterInZone(null);
      setCurrentChapterIndex(index);
    }
  };

  const exportData = () => {
    if (!performanceData || !performanceData.chapters[0]) return;

    const chapter = performanceData.chapters[0];
    const csvData = chapter.members.map((member) => ({
      "Member Name": member.memberName,
      Organization: member.organizationName,
      Category: member.category,
      "Business Generated": member.businessGenerated.amount,
      "Business Received": member.businessReceived.amount,
      "One-to-One Meetings": member.oneToOneMeetings,
      "References Given": member.referencesGiven,
      "References Received": member.referencesReceived,
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers
          .map((header) => `"${row[header as keyof typeof row]}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${chapter.chapterName}-performance-${format(
      new Date(),
      "yyyy-MM-dd"
    )}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!roleInfo) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Unable to load role information</p>
      </div>
    );
  }

  const currentChapter = performanceData?.chapters?.[0];
  const showPerformanceData = !isZoneSelected && currentChapter;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Performance Dashboard
            </h1>
            <div className="flex items-center gap-3 mt-2">
              {currentScope?.accessType === "zone" && (
                <Badge variant="outline" className="px-3 py-1">
                  Zone: {currentScope.zoneName}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-slate-700">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      handleDateRangeChange("startDate", e.target.value)
                    }
                    className="border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-slate-700">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      handleDateRangeChange("endDate", e.target.value)
                    }
                    className="border-slate-300"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={() => refetch()} className="w-full">
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chapter Selection Tabs */}
        {roleInfo.accessScope.length > 1 && (
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-medium text-slate-700">
                  {roleInfo.accessScope.some(
                    (scope) => scope.accessType === "zone"
                  )
                    ? "Select Zone or Chapter"
                    : "Select Chapter"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {roleInfo.accessScope.map((scope, index) => (
                    <button
                      key={scope.chapterId}
                      onClick={() => handleScopeSelection(scope, index)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentChapterIndex === index
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>
                          {scope.accessType === "zone"
                            ? scope.zoneName
                            : scope.chapterName}
                        </span>
                        {scope.accessType === "zone" && (
                          <Badge
                            variant="secondary"
                            className={`text-xs px-1 py-0 ${
                              currentChapterIndex === index
                                ? "bg-blue-500 text-white border-blue-400"
                                : ""
                            }`}
                          >
                            Zone
                          </Badge>
                        )}
                        {scope.accessType === "chapter_guardian" && (
                          <Badge
                            variant="outline"
                            className={`text-xs px-1 py-0 ${
                              currentChapterIndex === index
                                ? "border-blue-300 text-white"
                                : ""
                            }`}
                          >
                            Guardian
                          </Badge>
                        )}
                        {scope.accessType === "development_coordinator" && (
                          <Badge
                            variant="outline"
                            className={`text-xs px-1 py-0 ${
                              currentChapterIndex === index
                                ? "border-blue-300 text-white"
                                : ""
                            }`}
                          >
                            DC
                          </Badge>
                        )}
                        {scope.accessType === "office_bearer" && (
                          <Badge
                            variant="outline"
                            className={`text-xs px-1 py-0 ${
                              currentChapterIndex === index
                                ? "border-blue-300 text-white"
                                : ""
                            }`}
                          >
                            OB
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Zone Chapter Selection - Shows when a zone is selected */}
        {currentScope?.accessType === "zone" &&
          selectedZoneChapters.length > 0 && (
            <Card className="border-slate-200 bg-gradient-to-r from-green-50 to-green-100">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-medium text-slate-700">
                    Select Chapter in {currentScope?.zoneName}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedZoneChapters.map((chapter, index) => (
                      <button
                        key={chapter.chapterId}
                        onClick={() =>
                          setSelectedChapterInZone(chapter.chapterId)
                        }
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedChapterInZone === chapter.chapterId
                            ? "bg-green-600 text-white shadow-md"
                            : "bg-white text-slate-700 hover:bg-green-50 hover:shadow-sm border border-green-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>{chapter.chapterName}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Zone Selection Message */}
        {isZoneSelected && (
          <div className="text-center py-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-2">
                Zone Selected: {currentScope?.zoneName}
              </h2>
              <p className="text-blue-700">
                {selectedZoneChapters.length === 0
                  ? "Loading chapters in this zone..."
                  : "Please select a chapter from the zone above to view its performance data."}
              </p>
            </div>
          </div>
        )}

        {/* Current Chapter Header */}
        {showPerformanceData && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900">
              {currentChapter.chapterName}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              {currentScope?.zoneName && (
                <Badge variant="secondary" className="px-3 py-1">
                  {currentScope.zoneName}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Chapter Overview */}
        {showPerformanceData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-200 bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">
                      Business Given
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      ₹
                      {currentChapter.summary.totalBusinessGenerated.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      Business Received
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      ₹
                      {currentChapter.summary.totalBusinessReceived.toLocaleString()}
                    </p>
                  </div>
                  <ArrowUpRight className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">
                      One-to-Ones
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {currentChapter.summary.totalOneToOnes}
                    </p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">
                      Total References
                    </p>
                    <p className="text-2xl font-bold text-orange-900">
                      {currentChapter.summary.totalReferencesGiven +
                        currentChapter.summary.totalReferencesReceived}
                    </p>
                  </div>
                  <HandHeart className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Members Performance */}
        {showPerformanceData && (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Users className="h-5 w-5" />
                Member Performance ({currentChapter.members.length} members)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentChapter.members.map((member, index) => (
                  <div
                    key={member.memberId}
                    className="p-4 rounded-lg border border-slate-200 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-700">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {member.memberName}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {member.organizationName}
                          </p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {member.category}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold text-green-600">
                            ₹{member.businessGenerated.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-500">
                            Given ({member.businessGenerated.count})
                          </p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-blue-600">
                            ₹{member.businessReceived.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-500">
                            Received ({member.businessReceived.count})
                          </p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-purple-600">
                            {member.oneToOneMeetings}
                          </p>
                          <p className="text-xs text-slate-500">One-to-Ones</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-orange-600">
                            {member.referencesGiven}
                          </p>
                          <p className="text-xs text-slate-500">Refs Given</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-red-600">
                            {member.referencesReceived}
                          </p>
                          <p className="text-xs text-slate-500">
                            Refs Received
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PerformanceDashboard;
