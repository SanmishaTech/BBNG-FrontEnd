
import { Button } from "@/components/ui/button";
import { Camera, Image, Video } from "lucide-react";

const PostComposer = () => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <img
          src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=40&h=40"
          alt="User"
          className="w-10 h-10 rounded-full"
        />
        <div className="bg-gray-100 rounded-full flex-1 px-4 py-2.5 text-gray-500">
          What's on your mind?
        </div>
      </div>
      
      <div className="fb-divider" />
      
      <div className="flex justify-between">
        <Button variant="ghost" className="flex-1 rounded-md hover:bg-gray-100">
          <Video className="h-5 w-5 mr-2 text-red-500" />
          <span className="text-gray-600">Live video</span>
        </Button>
        
        <Button variant="ghost" className="flex-1 rounded-md hover:bg-gray-100">
          <Image className="h-5 w-5 mr-2 text-green-500" />
          <span className="text-gray-600">Photo/Video</span>
        </Button>
        
        <Button variant="ghost" className="flex-1 rounded-md hover:bg-gray-100">
          <span className="text-gray-600">Life event</span>
        </Button>
      </div>
    </div>
  );
};

export default PostComposer;