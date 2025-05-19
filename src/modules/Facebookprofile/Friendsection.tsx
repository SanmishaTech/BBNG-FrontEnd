import { Award, Star } from "lucide-react";
import { MemberData } from "@/types/member";

interface FriendsectionProps {
  memberData: MemberData | null;
}

const Friendsection = ({ memberData }: FriendsectionProps) => {
  const hasSkills = memberData?.skills && memberData.skills.length > 0;
  const hasAchievements = memberData?.achievements && memberData.achievements.length > 0;

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      {/* Skills Section */}
      {hasSkills && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-lg">Skills</h2>
            <a href="#" className="text-blue-600 text-sm">View all</a>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {memberData?.skills?.map((skill, index) => (
              <div key={index} className="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center">
                <Star className="h-3 w-3 mr-1 text-yellow-500" />
                {skill}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements Section */}
      {hasAchievements && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-lg">Achievements</h2>
            <a href="#" className="text-blue-600 text-sm">View all</a>
          </div>
          
          <div className="space-y-3">
            {memberData?.achievements?.map((achievement, index) => (
              <div key={index} className="flex items-start">
                <Award className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{achievement}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show placeholder if no skills or achievements */}
      {!hasSkills && !hasAchievements && (
        <div>
          <h2 className="font-bold text-lg mb-3">Skills & Achievements</h2>
          <p className="text-sm text-gray-500">No skills or achievements listed yet.</p>
        </div>
      )}
    </div>
  );
};
  
export default Friendsection;
  