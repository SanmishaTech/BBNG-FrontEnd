import React from "react";
import TrainingForm from "./TrainingForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CreateTrainingProps {
  onClose: () => void;
  open: boolean;
}

const CreateTraining = ({ onClose, open }: CreateTrainingProps) => {
  const handleSuccess = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Training</DialogTitle>
        </DialogHeader>
        <TrainingForm mode="create" onSuccess={handleSuccess} className="mt-4" />
      </DialogContent>
    </Dialog>
  );
};

export default CreateTraining; 