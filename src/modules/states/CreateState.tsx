
import StateForm from "./StateForm";

interface CreateStateProps {
  onSuccess?: () => void;
  className?: string;
}

const CreateState = ({ onSuccess, className }: CreateStateProps) => {
  return (
    <StateForm 
      mode="create" 
      onSuccess={onSuccess}
      className={className}
    />
  );
};

export default CreateState;
