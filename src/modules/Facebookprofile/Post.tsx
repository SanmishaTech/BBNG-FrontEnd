
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

interface PostProps {
  user: {
    name: string;
    avatar: string;
    isVerified?: boolean;
  };
  time: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
}

const Post = ({ user, time, content, image, likes, comments, shares }: PostProps) => {
  return (
    <div className="bg-white rounded-lg shadow mb-4">
      {/* Header */}
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img 
            src={user.avatar} 
            alt={user.name} 
            className="w-10 h-10 rounded-full" 
          />
          <div>
            <div className="flex items-center">
              <h3 className="font-semibold text-sm">{user.name}</h3>
              {user.isVerified && (
                <span className="ml-1 bg-blue-500 text-white rounded-full p-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">{time}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="px-4 pb-2">
        <p className="text-sm">{content}</p>
      </div>

      {/* Image */}
      {image && (
        <div>
          <img 
            src={image} 
            alt="Post" 
            className="w-full" 
          />
        </div>
      )}

      {/* Stats */}
      <div className="px-4 py-2 flex justify-between text-xs text-gray-500">
        <div>
          <span>❤️ {likes}</span>
        </div>
        <div className="flex gap-2">
          <span>{comments} comments</span>
          <span>{shares} shares</span>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4">
        <div className="fb-divider" />
      </div>

      {/* Actions */}
      <div className="flex px-2">
        <Button variant="ghost" className="flex-1 py-1.5">
          <span className="text-gray-600 text-sm">Like</span>
        </Button>
        <Button variant="ghost" className="flex-1 py-1.5">
          <span className="text-gray-600 text-sm">Comment</span>
        </Button>
        <Button variant="ghost" className="flex-1 py-1.5">
          <span className="text-gray-600 text-sm">Share</span>
        </Button>
      </div>

      {/* Comment box */}
      <div className="p-4 flex items-center gap-2">
        <img
          src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=40&h=40"
          alt="User"
          className="w-8 h-8 rounded-full"
        />
        <div className="bg-gray-100 rounded-full flex-1 px-3 py-1.5 text-sm text-gray-500">
          Comment as Yash Chaudhari
        </div>
      </div>
    </div>
  );
};

export default Post;
