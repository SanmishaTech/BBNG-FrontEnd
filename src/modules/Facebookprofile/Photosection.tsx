import { MemberData } from "@/types/member";
import { getAllMemberPhotos } from "@/utils/photoUtils";

interface PhotosectionProps {
  memberData: MemberData | null;
}

const Photosection = ({ memberData }: PhotosectionProps) => {
  // Mockup project images if real images not available
  const defaultImages = [
    "https://images.unsplash.com/photo-1573495804683-641188f1674d?auto=format&fit=crop&w=100&h=100", // Project
    "https://images.unsplash.com/photo-1629429407756-446d68689c2e?auto=format&fit=crop&w=100&h=100", // Coding
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=100&h=100", // Office
    "https://images.unsplash.com/photo-1531548731165-c6ae86ff6491?auto=format&fit=crop&w=100&h=100", // Meeting
    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=100&h=100", // Presentation
    "https://images.unsplash.com/photo-1607827448387-a6850027de60?auto=format&fit=crop&w=100&h=100", // Document
  ];

  // Get all the member's available photos using our utility function
  const memberPhotos = memberData
    ? getAllMemberPhotos({
        profilePicture: memberData.profilePicture
          ? memberData.profilePicture.split("/").pop()
          : null,
        coverPhoto: memberData.coverPhoto
          ? memberData.coverPhoto.split("/").pop()
          : null,
        logo: null,
      })
    : [];

  // Use member photos if available, otherwise use default images
  const photoImages = memberPhotos.length > 0 ? memberPhotos : defaultImages;

  // If member has projects, use a visual of projects, otherwise use member photos
  const projects = memberData?.projects || [];
  const hasProjects = projects.length > 0 && memberPhotos.length === 0;

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold text-lg">
          {hasProjects ? "Projects" : "Photos"}
        </h2>
        <a href="#" className="text-blue-600 text-sm">
          See all {hasProjects ? "projects" : "photos"}
        </a>
      </div>

      {hasProjects ? (
        <div className="space-y-3">
          {projects.slice(0, 3).map((project, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="relative w-12 h-12 flex-shrink-0">
                <img
                  src={defaultImages[index % defaultImages.length]}
                  alt={project.name}
                  className="rounded-md w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">{project.name}</h3>
                <p className="text-xs text-gray-600">Role: {project.role}</p>
                <div
                  className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${
                    project.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : project.status === "Completed"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {project.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {photoImages.slice(0, 6).map((url, index) => (
            <div key={index} className="relative aspect-square">
              <img
                src={url}
                alt={`Photo ${index}`}
                className="rounded-md w-full h-full object-cover"
                onError={(e) => {
                  // If member photo fails to load, replace with a default image
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; // Prevent infinite error loop
                  target.src = defaultImages[index % defaultImages.length];
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Photosection;
