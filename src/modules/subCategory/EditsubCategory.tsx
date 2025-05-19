import React from "react";
import CategoryForm from "./subCategoryForm";

interface EditCategoryProps {
  categoryId: string;
  onSuccess?: () => void;
  className?: string;
}

const EditCategory: React.FC<EditCategoryProps> = ({ categoryId, onSuccess, className }) => {
  return (
    <CategoryForm 
      mode="edit" 
      subCategoryId={categoryId}
      onSuccess={onSuccess}
      className={className}
    />
  );
};

export default EditCategory; 