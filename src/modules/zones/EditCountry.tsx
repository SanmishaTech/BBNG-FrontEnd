import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui";
import { Loader } from "lucide-react";
import ZoneRoleEditor from "./ZoneRoleAssignment"; // Import the enhanced editor component
import { useQuery } from "@tanstack/react-query";
import { get } from "@/services/apiService";

interface EditCountryProps {
  countryId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditCountry = ({ countryId, isOpen, onClose }: EditCountryProps) => {
  // Just need to fetch initial data to check if loading
  const { data: countryData, isLoading } = useQuery({
    queryKey: ["zones", countryId],
    queryFn: async () => {
      const response = await get(`/zones/${countryId}`);
      return response;
    },
    enabled: !!countryId && isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Region</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Use the enhanced ZoneRoleEditor which now handles both zone editing and role assignment */}
            {countryId && (
              <div style={{ margin: "-16px" }}>
                {" "}
                {/* Negative margin to extend to dialog edges */}
                <ZoneRoleEditor
                  zoneId={countryId}
                  zoneName={countryData?.name}
                />
              </div>
            )}

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditCountry;
