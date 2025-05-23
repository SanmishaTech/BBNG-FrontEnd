import ProfileHeader from "./ProfileHeader";
import Infosection from "./Infosection";
import Friendsection from "./Friendsection";
import Photosection from "./Photosection";
import Post from "./Post";
import { useState, useEffect } from "react";
import { MemberData } from "@/types/member";
import * as apiService from "@/services/apiService";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getBestMemberPhoto } from "@/utils/photoUtils";
import { Button } from "@/components/ui/button";

const Index = ({ memberId }: { memberId?: string }) => {
  const navigate = useNavigate();
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    if (memberId) {
      fetchMemberData(memberId);
      fetchMemberActivities(memberId);
    }
  }, [memberId]);

  const fetchMemberData = async (id: string) => {
    setLoading(true);
    try {
      // Fetch real member data from API
      const response = await apiService.get(`/members/${id}`);

      // Check if response has needed member data directly
      if (!response || !response.id) {
        setNotFound(true);
        setMemberData(null);
        return;
      }

      const member = response;

      // Transform API data to match our MemberData type
      // Use the best available photo for profile picture
      const memberData: MemberData = {
        id: member.id.toString(),
        name: member.memberName,
        profilePicture: getBestMemberPhoto(member),
        // For cover photo, prefer the second picture but fall back to any available if needed
        coverPhoto: member.coverPhoto
          && `${import.meta.env.VITE_BACKEND_URL}/${member.coverPhoto}`,
         
         email: member.email,
        phone: member.mobile1,
        designation: member.businessCategory || "",
        department: member.category || "",
        joinDate: new Date(member.createdAt).toLocaleDateString(),
        skills: member.specificGive
          ? member.specificGive.split(",").map((s: string) => s.trim())
          : [],
        meetingsAttended: member.meetingsAttended || 0,
        totalMeetings: member.totalMeetings || 0,
        projects: [
          {
            name: member.organizationName || "N/A",
            role: member.businessTagline || "N/A",
            status: "Active",
          },
        ],
        achievements: member.specificAsk
          ? member.specificAsk.split(",").map((s: string) => s.trim())
          : [],
        lastActive: member.user?.lastLogin
          ? new Date(member.user.lastLogin).toLocaleDateString()
          : "Never",
        // Additional business data
        businessDetails: {
          gstNo: member.gstNo || "N/A",
          organizationName: member.organizationName || "N/A",
          organizationEmail: member.organizationEmail || "N/A",
          organizationPhone: member.organizationMobileNo || "N/A",
          organizationLandline: member.organizationLandlineNo || "N/A",
          organizationWebsite: member.organizationWebsite || "N/A",
          organizationAddress: `${member.orgAddressLine1} ${member.orgAddressLine2 || ""}, ${member.orgLocation}, ${member.orgPincode}`,
          organizationDescription:
            member.organizationDescription || "No description available",
        },
        // Additional personal data
        personalDetails: {
          gender: member.gender || "Not specified",
          dob: new Date(member.dob).toLocaleDateString(),
          address: `${member.addressLine1} ${member.addressLine2 || ""}, ${member.location}, ${member.pincode}`,
        },
      };

      setMemberData(memberData);
      setNotFound(false);
    } catch (error) {
      console.error("Error fetching member data:", error);
      toast.error("Failed to load member profile");
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberActivities = async (id: string) => {
    try {
      // Fetch received testimonials using the new dedicated endpoint
      const response = await apiService.get(`/api/members/${id}/received-testimonials`);
      
      if (response && Array.isArray(response)) {
        // The response is already an array of formatted testimonials.
        // Ensure 'time' is usable by the Post component (e.g., convert ISO string to Date string if needed)
        const activities = response.map((testimonial: any) => ({
          ...testimonial,
          time: new Date(testimonial.time).toLocaleDateString(), // Format time for display
        }));
        setRecentActivities(activities);
      } else {
        // Handle cases where response is not as expected (e.g., empty or error)
        setRecentActivities([]); 
        console.warn("Received testimonials response was not an array or was empty:", response);
      }
    } catch (error) {
      console.error("Error fetching received testimonials:", error);
      setRecentActivities([]); // Clear activities on error
      // Optionally, set an error state to display to the user
    }
  };

  const goBackToSearch = () => {
    navigate("/member/search");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--fb-bg))] flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[hsl(var(--fb-bg))] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Member Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            Sorry, we couldn't find the member you're looking for.
          </p>
          <Button
            variant="ghost"
            onClick={goBackToSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition duration-200"
          >
            Back to Member Search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[hsl(var(--fb-bg))]">
      <div className="w-full w-[1200px] mx-auto">
        {/* Back Button */}
        {/* <div className="top-20 left-2 z-50 p-2">
        <Button
             onClick={goBackToSearch}
            className="flex items-center hover:text-blue-800 font-medium"
          >
            ← Back to Search
          </Button>
        </div> */}

        {/* Profile Header */}
        <ProfileHeader memberData={memberData} />

        {/* Main Content */}
        <div className="px-4 mt-4 flex flex-col md:flex-row gap-4">
          {/* Left Sidebar */}
          <div className="md:w-[360px]">
            <Infosection memberData={memberData} />
            {/* <Photosection memberData={memberData} /> */}
            {/* <Friendsection memberData={memberData} /> */}
          </div>

          {/* Main Feed */}
          
          <div className="flex-1">
            {recentActivities.map((activity) => (
              <Post key={activity.id} {...activity} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
