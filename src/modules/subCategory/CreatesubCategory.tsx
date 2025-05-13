import React from "react";
import CategoryForm from "./subCategoryForm";

interface CreateCategoryProps {
  onSuccess?: () => void;
  className?: string;
}

const CreateCategory: React.FC<CreateCategoryProps> = ({ onSuccess, className }) => {
  return (
    <CategoryForm 
      mode="create" 
      onSuccess={onSuccess}
      className={className}
    />
  );
};

export default CreateCategory; 