import React from "react";
import TrainingForm from "./TrainingForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EditTrainingProps {
  id: string;
  onClose: () => void;
  open: boolean;
}

const EditTraining = ({ id, onClose, open }: EditTrainingProps) => {
  const handleSuccess = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Training</DialogTitle>
        </DialogHeader>
        <TrainingForm mode="edit" trainingId={id} onSuccess={handleSuccess} className="mt-4" />
      </DialogContent>
    </Dialog>
  );
};

export default EditTraining; 