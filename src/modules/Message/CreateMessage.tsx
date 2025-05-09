import React from "react";
import MessageForm from "./MessageForm";

interface CreateMessageProps {
  onSuccess?: () => void;
  className?: string;
}

const CreateMessage: React.FC<CreateMessageProps> = ({ onSuccess, className }) => {
  return (
    <MessageForm 
      mode="create" 
      onSuccess={onSuccess}
      className={className}
    />
  );
};

export default CreateMessage; 