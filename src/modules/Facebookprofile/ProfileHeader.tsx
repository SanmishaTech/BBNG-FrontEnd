import { Button } from "@/components/ui/button";
import { Camera, Edit, MoreHorizontal, Plus } from "lucide-react";
import { MemberData } from "@/types/member";
import { useState, useEffect } from "react";
import { get } from "@/services/apiService";
import { useNavigate } from "react-router-dom";   

// Define the base URL for your API.
const API_BASE_URL = "http://localhost:3000";

interface ActivitySummary {
  testimonials: number;
  businessGiven: number;
  businessReceived: number;
  referencesGiven: number;
  referencesReceived: number;
  oneToOnes: number;
}

interface ProfileHeaderProps {
  memberData: MemberData | null;
}

const ProfileHeader = ({ memberData }: ProfileHeaderProps) => {
  const navigate = useNavigate();
  // State to track image loading errors
  const [imageError, setImageError] = useState({
    profile: false,
    cover: false,
  });

  const [activitySummary, setActivitySummary] =
    useState<ActivitySummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Reset imageError state when the memberData or its image paths change
  useEffect(() => {
    setImageError({ profile: false, cover: false });
  }, [memberData?.profilePicture, memberData?.coverPhoto]);

  useEffect(() => {
    if (memberData?.id) {
      const fetchActivitySummary = async () => {
        setIsLoadingSummary(true);
        setSummaryError(null);
        try {
          const response = await get(
            `/members/${memberData.id}/activity-summary`
          );
          // if (!response.ok) {
          //   throw new Error(`Failed to fetch activity summary: ${response.statusText}`);
          // }
          console.log(response);
          setActivitySummary(response);
        } catch (error) {
          console.error("Error fetching activity summary:", error);
          setSummaryError(
            error instanceof Error ? error.message : "An unknown error occurred"
          );
          setActivitySummary(null); // Reset on error
        }
        setIsLoadingSummary(false);
      };
      fetchActivitySummary();
    } else {
      // Clear summary if memberData or id is not available
      setActivitySummary(null);
    }
  }, [memberData?.id]);

  console.log(memberData);
  useEffect(() => {
    console.log("Activity", activitySummary);
  }, [activitySummary]);

  // TODO: Replace hardcoded stats with data from memberData props
  const formatCurrency = (amount: number | undefined) => {
    return amount ? `₹ ${amount.toLocaleString("en-IN")}` : "₹ 0";
  };

  console.log("Activity", activitySummary);
  const statsData = [
    {
      value: activitySummary?.testimonials?.toString() || "0",
      label: "Testimonials",
    },
    {
      value: formatCurrency(activitySummary?.businessGiven),
      label: "Business Given",
    },
    {
      value: formatCurrency(activitySummary?.businessReceived),
      label: "Business Received",
    },
    {
      value: activitySummary?.referencesGiven?.toString() || "0",
      label: "References Given",
    },
    {
      value: activitySummary?.referencesReceived?.toString() || "0",
      label: "References Received",
    },
    {
      value: activitySummary?.oneToOnes?.toString() || "0",
      label: "One To Ones",
    },
  ];

  // Default local placeholder images (used as fallbacks)
  const defaultCoverUrl = "https://picsum.photos/1200/300";
  const defaultProfileUrl = "https://picsum.photos/200";
  console.log("Member Data", memberData);
  const displayName = memberData?.name || "Member Name"; // Use memberName from JSON

  const lastLoginDate = memberData?.users?.lastLogin;
  const lastActiveDisplay = lastLoginDate
    ? new Date(lastLoginDate).toLocaleDateString()
    : "Recently";

  const getImageUrl = (path: string | undefined, isCover: boolean): string => {
    const currentError = isCover ? imageError.cover : imageError.profile;

    if (currentError || !path) {
      if (memberData?.id) {
        const seed = memberData.id;
        return isCover
          ? `https://picsum.photos/seed/${seed}/1200/300`
          : `https://picsum.photos/seed/${seed}/200`;
      } else {
        // Fallback to non-seeded if memberData.id is not available
        return isCover ? defaultCoverUrl : defaultProfileUrl;
      }
    }

    // If path looks like an absolute URL (starts with http://, https://, or //), use it directly
    if (/^(?:[a-z]+:)?\/\//i.test(path)) {
      return path;
    }

    // Otherwise, assume it's relative and prepend API_BASE_URL
    return `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  };

  const actualProfilePictureSrc = getImageUrl(
    memberData?.profilePicture,
    false
  );
  const actualCoverPhotoSrc = getImageUrl(memberData?.coverPhoto, true);

  return (
    <div className="min-w-full">
      {/* Cover Photo */}
      <div className="relative w-full h-[1800px] md:h-[350px] min-w-full rounded-lg">
        <img
          src={actualCoverPhotoSrc} // Use the determined source
          alt="Cover"
          className="w-full h-full object-cover"
          onError={() => setImageError((prev) => ({ ...prev, cover: true }))}
        />
        <div
 
        className="absolute bottom-4 right-4 flex gap-2 z-10">
          <Button 
                      onClick={() => navigate(`/profile`)}

          variant="secondary" size="sm" className="bg-white">
            <Camera className="h-4 w-4 mr-2" />
            Edit cover photo
          </Button>
        </div>
      </div>

      {/* Profile Picture and Name */}
      <div className="flex flex-col md:flex-row px-4 relative -mt-8 md:-mt-16">
        <div className="relative z-10">
          <div className="relative z-[-1] rounded-full border-4 border-white w-[168px] h-[168px] overflow-hidden bg-white">
            <img
              src={actualProfilePictureSrc} // Use the determined source
              alt="Profile"
              className="w-full h-full object-cover"
              onError={() =>
                setImageError((prev) => ({ ...prev, profile: true }))
              }
            />
          </div>
          <div className="absolute bottom-3 right-3 bg-gray-200 rounded-full p-2 border-2 border-white">
            <Camera className="h-5 w-5 text-black" />
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end w-full pt-4 md:pt-0 px-0 md:px-6 mb-4">
          <div className="mb-4 md:mb-6">
            <h1 className="text-3xl font-bold">{displayName}</h1>
            {memberData?.category && (
              <p className="text-gray-500">
                {memberData.organizationName
                  ? `${memberData.category} at ${memberData.organizationName}`
                  : memberData.category}
              </p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              Organization Name: {memberData?.businessDetails?.organizationName}
            </p>
          </div>
          <div className="flex gap-2 mb-4 md:mb-6">
            <Button 
              onClick={() => navigate(`/references/given`)}
            className="bg-blue-600 hover:bg-blue-700 flex items-center">
              <Plus className="h-4 w-4 mr-2" /> Connect
            </Button>
            {/* <Button
              variant="secondary"
              className="bg-gray-200 flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" /> Message
            </Button> */}
            {/* <Button variant="secondary" className="bg-gray-200">
              <MoreHorizontal className="h-4 w-4" />
            </Button> */}
          </div>
        </div>
      </div>

      {/* Stats Bar - Exact match to UI in the screenshot */}
      <div className=" w-full mt-4 rounded-5xl">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 border-t border-gray-200 bg-white max-w-[98%] ml-3 flex justify-center items-center rounded-lg">
          {statsData.map((stat, index) => (
            <div
              key={stat.label}
              className={`py-4 flex flex-col items-center justify-center text-center ${
                index < statsData.length - 1 ? "border-r border-gray-200" : ""
              }`}
            >
              <p className="text-base font-medium text-gray-800">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
