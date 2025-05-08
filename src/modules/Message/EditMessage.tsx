import React from "react";
import MessageForm from "./MessageForm";

interface EditMessageProps {
  messageId: string;
  onSuccess?: () => void;
  className?: string;
}

const EditMessage: React.FC<EditMessageProps> = ({ messageId, onSuccess, className }) => {
  return (
    <MessageForm 
      mode="edit" 
      messageId={messageId}
      onSuccess={onSuccess}
      className={className}
    />
  );
};

export default EditMessage; 