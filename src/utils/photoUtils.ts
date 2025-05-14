/**
 * Utility functions for handling member photos
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://15.207.30.113";

/**
 * Returns the first available photo URL from a member record
 * Falls back to a placeholder if no photos are available
 */
export const getBestMemberPhoto = (
  member: {
    profilePicture1?: string | null;
    profilePicture2?: string | null;
    profilePicture3?: string | null;
  },
  placeholder = "https://via.placeholder.com/100"
): string => {
  if (member.profilePicture1) {
    return `${BACKEND_URL}/uploads/members/${member.profilePicture1}`;
  }

  if (member.profilePicture2) {
    return `${BACKEND_URL}/uploads/members/${member.profilePicture2}`;
  }

  if (member.profilePicture3) {
    return `${BACKEND_URL}/uploads/members/${member.profilePicture3}`;
  }

  return placeholder;
};

/**
 * Returns an array of all available photo URLs from a member record
 */
export const getAllMemberPhotos = (member: {
  profilePicture1?: string | null;
  profilePicture2?: string | null;
  profilePicture3?: string | null;
}): string[] => {
  const photos: string[] = [];

  if (member.profilePicture1) {
    photos.push(`${BACKEND_URL}/uploads/members/${member.profilePicture1}`);
  }

  if (member.profilePicture2) {
    photos.push(`${BACKEND_URL}/uploads/members/${member.profilePicture2}`);
  }

  if (member.profilePicture3) {
    photos.push(`${BACKEND_URL}/uploads/members/${member.profilePicture3}`);
  }

  return photos;
};
