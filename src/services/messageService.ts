import { get, post, put, del, postupload, putupload } from './apiService';

export interface MessageData {
  id: number;
  heading: string;
  powerteam: string;
  message: string;
  attachment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageListResponse {
  messages: MessageData[];
  page: number;
  totalPages: number;
  totalMessages: number;
}

/**
 * Fetches messages with pagination, search, and sorting
 */
export const getMessages = async (
  page: number = 1,
  limit: number = 10,
  search: string = '',
  sortBy: string = 'createdAt',
  sortOrder: string = 'desc',
  powerteam: string = ''
): Promise<MessageListResponse> => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
    search,
  });

  if (powerteam) {
    queryParams.append('powerteam', powerteam);
  }

  return get(`/messages?${queryParams.toString()}`);
};

/**
 * Fetches a single message by ID
 */
export const getMessage = async (id: string): Promise<MessageData> => {
  return get(`/messages/${id}`);
};

/**
 * Creates a new message with support for file attachment
 */
export const createMessage = async (formData: FormData): Promise<MessageData> => {
  return postupload('/messages', formData);
};

/**
 * Updates an existing message
 */
export const updateMessage = async (id: string, formData: FormData): Promise<MessageData> => {
  return putupload(`/messages/${id}`, formData);
};

/**
 * Deletes a message
 */
export const deleteMessage = async (id: number): Promise<any> => {
  return del(`/messages/${id}`);
};

/**
 * Returns the URL for downloading an attachment
 */
export const getAttachmentUrl = (id: string): string => {
  return `/messages/${id}/attachment`;
}; 