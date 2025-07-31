import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  Users,
  HandHeart,
  MessageSquare,
  ArrowUpRight,
} from "lucide-react";

interface MetricsOverviewProps {
  summary: {
    totalChapters: number;
    totalMembers: number;
    totalBusinessGenerated: number;
    totalBusinessReceived: number;
    totalOneToOnes: number;
    totalReferencesGiven: number;
    totalReferencesReceived: number;
  };
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  summary,
}) => {
  const metrics = [
    {
      title: "Total Chapters",
      value: summary.totalChapters,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Members",
      value: summary.totalMembers,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Business Generated",
      value: `₹${summary.totalBusinessGenerated.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Business Received",
      value: `₹${summary.totalBusinessReceived.toLocaleString()}`,
      icon: ArrowUpRight,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "One-to-One Meetings",
      value: summary.totalOneToOnes,
      icon: MessageSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "References Given",
      value: summary.totalReferencesGiven,
      icon: HandHeart,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "References Received",
      value: summary.totalReferencesReceived,
      icon: HandHeart,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                </div>
                <div className={`p-3 rounded-full ${metric.bgColor}`}>
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
