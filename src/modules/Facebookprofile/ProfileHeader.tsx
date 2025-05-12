import { Button } from "@/components/ui/button";
import { Camera, Edit, MoreHorizontal, Plus } from "lucide-react";
import { MemberData } from "@/types/member";

interface ProfileHeaderProps {
  memberData: MemberData | null;
}

const ProfileHeader = ({ memberData }: ProfileHeaderProps) => {
  // Default values if no member data is provided
  const name = memberData?.name || "Member Name";
  const coverPhoto = memberData?.coverPhoto || "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200";
  const profilePicture = memberData?.profilePicture || "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=150&h=150";
  
  return (
    <div className="w-full">
      {/* Cover Photo */}
      <div className="relative w-full h-[300px] md:h-[350px] overflow-hidden rounded-b-lg">
        <img
          src={coverPhoto}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button variant="secondary" size="sm" className="bg-white">
            <Camera className="h-4 w-4 mr-2" />
            Edit cover photo
          </Button>
        </div>
      </div>

      {/* Profile Picture and Name */}
      <div className="flex flex-col md:flex-row px-4 relative -mt-8 md:-mt-16">
        <div className="relative z-10">
          <div className="rounded-full border-4 border-white w-[168px] h-[168px] overflow-hidden bg-white">
            <img
              src={profilePicture}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute bottom-3 right-3 bg-gray-200 rounded-full p-2 border-2 border-white">
            <Camera className="h-5 w-5 text-black" />
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end w-full pt-4 md:pt-0 px-0 md:px-6 mb-4">
          <div className="mb-4 md:mb-6">
            <h1 className="text-3xl font-bold">{name}</h1>
            {memberData?.designation && memberData?.department && (
              <p className="text-gray-500">{memberData.designation} at {memberData.department}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">Last active: {memberData?.lastActive || "Recently"}</p>
          </div>
          <div className="flex gap-2 mb-4 md:mb-6">
            <Button className="bg-blue-600 hover:bg-blue-700 flex items-center">
              <Plus className="h-4 w-4 mr-2" /> Connect
            </Button>
            <Button variant="secondary" className="bg-gray-200 flex items-center">
              <Edit className="h-4 w-4 mr-2" /> Message
            </Button>
            <Button variant="secondary" className="bg-gray-200">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-t border-gray-300 mt-2">
        <div className="flex overflow-x-auto scrollbar-hide">
          <NavItem active>Overview</NavItem>
          <NavItem>Activity</NavItem>
          <NavItem>Meetings</NavItem>
          <NavItem>Projects</NavItem>
          <NavItem>Skills</NavItem>
          <NavItem>Achievements</NavItem>
          <NavItem>More</NavItem>
        </div>
      </div>
    </div>
  );
};

interface NavItemProps {
  children: React.ReactNode;
  active?: boolean;
}

const NavItem = ({ children, active }: NavItemProps) => {
  return (
    <div
      className={`px-4 py-3 font-medium text-sm relative whitespace-nowrap
        ${active 
          ? "text-blue-600 border-b-2 border-blue-600" 
          : "text-gray-600 hover:bg-gray-100 rounded-md"
        }`}
    >
      {children}
    </div>
  );
};

export default ProfileHeader;
