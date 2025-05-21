import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { MemberData } from "@/types/member";
import MemberCard from "@/components/common/MemberCard";
import { useNavigate } from "react-router-dom";
import * as apiService from "@/services/apiService";
import { toast } from "sonner";
import { getBestMemberPhoto } from "@/utils/photoUtils";

const MemberSearch = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<MemberData[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMembers(members);
    } else {
      console.log("members", members[0].member);
      const filtered = members.filter(
        (member) =>
          member?.member.memberName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          member?.member.category
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          member?.member?.chapter?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
      setFilteredMembers(filtered);
    }
  }, [searchQuery, members]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      // Fetch real member data from API with the correct endpoint
      const response = await apiService.get("/members/search");

      // Transform API data to match our MemberData type
      const memberData: MemberData[] = response.members.map((member: any) => {
        // Get the best available profile picture using our utility function
        const profilePicture = getBestMemberPhoto(member);

        // For cover photo, still use the second picture if available
        // If not, fall back to the best available photo (which might be the same as profilePicture)
        const coverPhoto = member.coverPhoto
          ? `${import.meta.env.VITE_BACKEND_URL}/uploads/members/${
              member.coverPhoto
            }`
          : member.profilePicture || member.logo
            ? profilePicture
            : undefined;

        return {
          id: member.id.toString(),
          member: member,
          name: member.memberName,
          profilePicture,
          coverPhoto,
          email: member.email,
          phone: member.mobile1,
          designation: member.businessCategory || "",
          department: member.category || "",
          joinDate: new Date(member.createdAt).toLocaleDateString(),
          skills: member.specificGive
            ? member.specificGive.split(",").map((s: string) => s.trim())
            : [],
          lastActive: member.user?.lastLogin
            ? new Date(member.user.lastLogin).toLocaleDateString()
            : "Never",
        };
      });

      setMembers(memberData);
      setFilteredMembers(memberData);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const viewProfile = (memberId: string) => {
    navigate(`/member/profile/${memberId}`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Member Directory</h1>

      {/* Search Box */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search members by Category, chapter, Name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8   border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onViewProfile={() => viewProfile(member.id)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">
                No members found matching your search criteria.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MemberSearch;
