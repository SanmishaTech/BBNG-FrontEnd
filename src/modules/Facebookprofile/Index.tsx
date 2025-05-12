import ProfileHeader from "./ProfileHeader";
import Infosection from "./Infosection";
import Friendsection from "./Friendsection";
import Photosection from "./Photosection";
import PostComposer from "./PostComposer";
import Post from "./Post";
import { useState, useEffect } from "react";
import { MemberData } from "@/types/member";
import * as apiService from "@/services/apiService";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
      
      if (!response || !response.member) {
        setNotFound(true);
        setMemberData(null);
        return;
      }
      
      const member = response.member;
      
      // Transform API data to match our MemberData type
      const memberData: MemberData = {
        id: member.id.toString(),
        name: member.memberName,
        profilePicture: member.profilePicture1 
          ? `${import.meta.env.VITE_BACKEND_URL}/uploads/members/${member.profilePicture1}`
          : "https://via.placeholder.com/100",
        coverPhoto: member.profilePicture2
          ? `${import.meta.env.VITE_BACKEND_URL}/uploads/members/${member.profilePicture2}`
          : "https://images.unsplash.com/photo-1614850523459-c2f4c699c6b2?auto=format&fit=crop&w=1470&h=400",
        email: member.email,
        phone: member.mobile1,
        designation: member.businessCategory || '',
        department: member.category || '',
        joinDate: new Date(member.createdAt).toLocaleDateString(),
        skills: member.specificGive ? member.specificGive.split(',').map((s: string) => s.trim()) : [],
        meetingsAttended: member.meetingsAttended || 0,
        totalMeetings: member.totalMeetings || 0,
        projects: [
          { 
            name: member.organizationName || 'N/A', 
            role: member.businessTagline || 'N/A', 
            status: 'Active' 
          }
        ],
        achievements: member.specificAsk ? member.specificAsk.split(',').map((s: string) => s.trim()) : [],
        lastActive: member.user?.lastLogin ? new Date(member.user.lastLogin).toLocaleDateString() : 'Never',
        // Additional business data
        businessDetails: {
          gstNo: member.gstNo || 'N/A',
          organizationName: member.organizationName || 'N/A',
          organizationEmail: member.organizationEmail || 'N/A',
          organizationPhone: member.organizationMobileNo || 'N/A',
          organizationLandline: member.organizationLandlineNo || 'N/A',
          organizationWebsite: member.organizationWebsite || 'N/A',
          organizationAddress: `${member.orgAddressLine1} ${member.orgAddressLine2 || ''}, ${member.orgLocation}, ${member.orgPincode}`,
          organizationDescription: member.organizationDescription || 'No description available'
        },
        // Additional personal data
        personalDetails: {
          gender: member.gender || 'Not specified',
          dob: new Date(member.dob).toLocaleDateString(),
          address: `${member.addressLine1} ${member.addressLine2 || ''}, ${member.location}, ${member.pincode}`
        }
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
      // You can fetch recent activities from the API if available
      // For now, we'll use static data
      
      // For actual implementation, would look like:
      // const response = await apiService.get(`/members/${id}/activities`);
      // setRecentActivities(response.activities);
      
      // Fetch real member references as activities
      try {
        const referencesResponse = await apiService.get(`/references`, { memberId: id });
        if (referencesResponse && referencesResponse.references) {
          const referenceActivities = referencesResponse.references.map((ref: any) => ({
            id: ref.id,
            user: {
              name: ref.fromMemberName || ref.toMemberName,
              avatar: "https://via.placeholder.com/100",
            },
            time: new Date(ref.createdAt).toLocaleDateString(),
            content: ref.testimonial || "Provided a reference",
            likes: Math.floor(Math.random() * 20) + 1,
            comments: Math.floor(Math.random() * 5),
            shares: Math.floor(Math.random() * 3),
            type: "reference"
          }));
          
          setRecentActivities(referenceActivities);
          return;
        }
      } catch (error) {
        console.error("Error fetching references:", error);
      }
      
      // Fallback mock data if no references found
      const mockActivities = [
        {
          id: 1,
          user: {
            name: "Recent Activity",
            avatar: "https://via.placeholder.com/100",
          },
          time: new Date().toLocaleDateString(),
          content: "New member joined BBNG Platform",
          likes: 5,
          comments: 2,
          shares: 0,
          type: "activity"
        }
      ];
      
      setRecentActivities(mockActivities);
    } catch (error) {
      console.error("Error fetching member activities:", error);
      setRecentActivities([]);
    }
  };

  const goBackToSearch = () => {
    navigate("/member/search");
  };

  if (loading) {
    return <div className="min-h-screen bg-[hsl(var(--fb-bg))] flex items-center justify-center">Loading...</div>;
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[hsl(var(--fb-bg))] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Member Not Found</h2>
          <p className="text-gray-600 mb-6">Sorry, we couldn't find the member you're looking for.</p>
          <button 
            onClick={goBackToSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition duration-200"
          >
            Back to Member Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--fb-bg))]">
      <div className="w-full max-w-[1200px] mx-auto">
        {/* Back Button */}
        <div className="pt-4 px-4">
          <button 
            onClick={goBackToSearch}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Search
          </button>
        </div>
        
        {/* Profile Header */}
        <ProfileHeader memberData={memberData} />
        
        {/* Main Content */}
        <div className="px-4 mt-4 flex flex-col md:flex-row gap-4">
          {/* Left Sidebar */}
          <div className="md:w-[360px]">
            <Infosection memberData={memberData} />
            <Photosection memberData={memberData} />
            <Friendsection memberData={memberData} />
          </div>
          
          {/* Main Feed */}
          <div className="flex-1">
            <PostComposer />
            {recentActivities.map(activity => (
              <Post key={activity.id} {...activity} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
