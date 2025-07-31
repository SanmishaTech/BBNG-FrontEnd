import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, TrendingUp, Users } from "lucide-react";
import type { ChapterPerformance } from "@/services/performanceDashboardService";

interface ChapterSummaryCardProps {
  chapter: ChapterPerformance;
  onViewDetails: () => void;
}

export const ChapterSummaryCard: React.FC<ChapterSummaryCardProps> = ({
  chapter,
  onViewDetails,
}) => {
  const topPerformers = chapter.members
    .sort((a, b) => b.businessGenerated.amount - a.businessGenerated.amount)
    .slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{chapter.chapterName}</CardTitle>
          <Badge variant="outline">
            <Users className="h-3 w-3 mr-1" />
            {chapter.members.length} members
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">
              ₹{chapter.summary.totalBusinessGenerated.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Business Generated
            </div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">
              ₹{chapter.summary.totalBusinessReceived.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Business Received
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-sm font-semibold text-purple-600">
              {chapter.summary.totalOneToOnes}
            </div>
            <div className="text-xs text-muted-foreground">One-to-Ones</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-orange-600">
              {chapter.summary.totalReferencesGiven}
            </div>
            <div className="text-xs text-muted-foreground">Refs Given</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-red-600">
              {chapter.summary.totalReferencesReceived}
            </div>
            <div className="text-xs text-muted-foreground">Refs Received</div>
          </div>
        </div>

        {/* Top Performers */}
        {topPerformers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Top Performers
            </h4>
            <div className="space-y-1">
              {topPerformers.map((member, index) => (
                <div
                  key={member.memberId}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="w-4 h-4 p-0 text-xs">
                      {index + 1}
                    </Badge>
                    <span className="truncate max-w-[120px]">
                      {member.memberName}
                    </span>
                  </div>
                  <span className="font-medium text-green-600">
                    ₹{member.businessGenerated.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onViewDetails}
          className="w-full"
        >
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};
