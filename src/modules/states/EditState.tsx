
import StateForm from "./StateForm";

interface EditStateProps {
  stateId: string;
  onSuccess?: () => void;
  className?: string;
}

const EditState = ({ stateId, onSuccess, className }: EditStateProps) => {
  return (
    <StateForm 
      mode="edit" 
      stateId={stateId}
      onSuccess={onSuccess}
      className={className}
    />
  );
};

export default EditState;
