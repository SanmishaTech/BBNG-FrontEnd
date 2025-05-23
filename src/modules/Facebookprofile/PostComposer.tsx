import { Button } from "@/components/ui/button";
import { Camera, Image, Video } from "lucide-react";
import {Link} from "react-router-dom";

interface Testimonial {
  id: string | number;
  text: string;
  author?: string;
}

interface PostComposerProps {
  thankyouslips?: Testimonial[];
}

const PostComposer: React.FC<PostComposerProps> = ({ thankyouslips = [] }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      {thankyouslips && thankyouslips.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Testimonials</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded-md">
            {thankyouslips.map((testimonial) => (
              <div key={testimonial.id} className="p-3 bg-white rounded shadow-sm border border-gray-200">
                <p className="text-sm text-gray-600 italic">"{testimonial.text}"</p>
                {testimonial.author && (
                  <p className="text-xs text-gray-500 mt-1 text-right">- {testimonial.author}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link href="/dashboard/done-deal" passHref>
            <Button
              variant="outline"
              className="w-full h-20 flex flex-col items-center justify-center text-center p-2 border-2 border-blue-500 hover:bg-blue-50 text-blue-600 rounded-lg shadow-sm"
            >
              <span className="font-semibold">Done Deal</span>
              <span className="text-xs mt-1">Log a new deal</span>
            </Button>
          </Link>
          <Link href="/references/create" passHref>
            <Button
              variant="outline"
              className="w-full h-20 flex flex-col items-center justify-center text-center p-2 border-2 border-green-500 hover:bg-green-50 text-green-600 rounded-lg shadow-sm"
            >
              <span className="font-semibold">References</span>
              <span className="text-xs mt-1">Add a reference</span>
            </Button>
          </Link>
          <Link href="/one-to-ones/create" passHref>
            <Button
              variant="outline"
              className="w-full h-20 flex flex-col items-center justify-center text-center p-2 border-2 border-purple-500 hover:bg-purple-50 text-purple-600 rounded-lg shadow-sm"
            >
              <span className="font-semibold">One to One</span>
              <span className="text-xs mt-1">Schedule a meeting</span>
            </Button>
          </Link>
        </div>
      </div>

    
      
       
      
    </div>
  );
};

export default PostComposer;