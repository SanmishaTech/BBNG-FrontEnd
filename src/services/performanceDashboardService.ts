import { get } from "./apiService";

export interface RoleInfo {
  inferredRole: string;
  accessScope: Array<{
    chapterId: number;
    chapterName: string;
    accessType: string;
    zoneName?: string;
  }>;
  roleDetails: {
    zoneRoles?: Array<{
      roleType: string;
      zoneName: string;
      zoneId: number;
    }>;
    chapterRoles?: Array<{
      roleType: string;
      chapterName: string;
      chapterId: number;
    }>;
  };
  memberId: number;
  memberName: string;
}

export interface MemberPerformance {
  memberId: number;
  memberName: string;
  organizationName: string;
  category: string;
  businessGenerated: {
    amount: number;
    count: number;
  };
  businessReceived: {
    amount: number;
    count: number;
  };
  oneToOneMeetings: number;
  referencesGiven: number;
  referencesReceived: number;
}

export interface ChapterPerformance {
  chapterId: number;
  chapterName: string;
  members: MemberPerformance[];
  summary: {
    totalMembers: number;
    totalBusinessGenerated: number;
    totalBusinessReceived: number;
    totalOneToOnes: number;
    totalReferencesGiven: number;
    totalReferencesReceived: number;
  };
}

export interface PerformanceData {
  roleInfo: RoleInfo;
  chapters: ChapterPerformance[];
  summary: {
    totalChapters: number;
    totalMembers: number;
    totalBusinessGenerated: number;
    totalBusinessReceived: number;
    totalOneToOnes: number;
    totalReferencesGiven: number;
    totalReferencesReceived: number;
  };
  dateRange: {
    startDate?: string;
    endDate?: string;
  };
}

export const performanceDashboardService = {
  // Get user's role information
  getUserRoleInfo: async (): Promise<RoleInfo> => {
    return await get("/performance-dashboard/user-role-info");
  },

  // Get performance data
  getPerformanceData: async (params?: {
    startDate?: string;
    endDate?: string;
    chapterId?: number;
  }): Promise<PerformanceData> => {
    return await get("/performance-dashboard/performance-data", params);
  },

  // Get chapter summary
  getChapterSummary: async (
    chapterId: number,
    params?: {
      startDate?: string;
      endDate?: string;
    }
  ) => {
    return await get(
      `/performance-dashboard/chapter-summary/${chapterId}`,
      params
    );
  },

  // Get member performance
  getMemberPerformance: async (
    memberId: number,
    params?: {
      startDate?: string;
      endDate?: string;
    }
  ) => {
    return await get(
      `/performance-dashboard/member-performance/${memberId}`,
      params
    );
  },

  // Get chapters in a zone
  getChaptersInZone: async (
    zoneName: string
  ): Promise<ChapterPerformance[]> => {
    return await get(`/performance-dashboard/chapters-in-zone`, { zoneName });
  },
};
