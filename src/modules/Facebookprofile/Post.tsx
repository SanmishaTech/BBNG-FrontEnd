// import { Button } from "@/components/ui/button"; // Removed unused import
// import { MoreHorizontal } from "lucide-react"; // Removed unused import

interface PostProps {
  user: {
    name: string;
    avatar: string;
  };
  time: string;
  content: string;
}

const Post = ({ user, time, content }: PostProps) => {
  console.log("Actar", user.avatar)
  const construcutedurl = `${import.meta.env.VITE_BACKEND_URL}/${user.avatar}`
  return (
    <div className="bg-white rounded-lg shadow mb-4">
      {/* Header */}
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img 
            src={ construcutedurl} 
            alt={user.name} 
            className="w-10 h-10 rounded-full" 
          />
          <div>
            <div className="flex items-center">
              <h3 className="font-semibold text-sm">{user.name}</h3>
            </div>
            {/* <p className="text-xs text-gray-500">{time}</p> */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <p className="text-sm">{content}</p>
      </div>
    </div>
  );
};

export default Post;
