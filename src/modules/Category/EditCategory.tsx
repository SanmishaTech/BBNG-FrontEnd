import React from "react";
import CategoryForm from "./CategoryForm";

interface EditCategoryProps {
  categoryId: string;
  onSuccess?: () => void;
  className?: string;
}

const EditCategory: React.FC<EditCategoryProps> = ({ categoryId, onSuccess, className }) => {
  return (
    <CategoryForm 
      mode="edit" 
      categoryId={categoryId}
      onSuccess={onSuccess}
      className={className}
    />
  );
};

export default EditCategory; 