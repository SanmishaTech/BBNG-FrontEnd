import React, { useEffect } from "react";
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
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface EditCountryProps {
  countryId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditCountry = ({ countryId, isOpen, onClose }: EditCountryProps) => {
  const navigate = useNavigate();
  // Just need to fetch initial data to check if loading
  const { data: countryData, isLoading } = useQuery({
    queryKey: ["zonese", countryId],
    queryFn: async () => {
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/zones/${countryId}`);
      return data; // return only the data object
    },
  });

    useEffect(() => {
     console.log("COUNTRY DATA", countryData)
  }, [countryData, navigate]);

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
