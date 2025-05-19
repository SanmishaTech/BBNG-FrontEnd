import React, { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronsUpDown, Check } from "lucide-react";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { get, post } from "@/services/apiService";

interface AddSubscriptionProps {
  agencyId: string; // Change from number to string to match the type coming from params
}

const AddSubscription: React.FC<AddSubscriptionProps> = ({ agencyId }) => {
  const [open, setOpen] = useState(false);
  const [packagePopoverOpen, setPackagePopoverOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  const queryClient = useQueryClient();
  const mode = "create";
  const errors: any = {};

  const setValue = (field: string, value: any) => {
    console.log(`Setting ${field} to ${value}`);
  };

  const { data: packages = [] } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const response = await get("/packages?limit=100");
      return response.packages;
    },
    enabled: mode === "create",
  });

  const {
    data: agencyData,
    isLoading: isAgencyLoading,
    isError: isAgencyError,
    error: agencyError,
  } = useQuery({
    queryKey: ["agency", agencyId],
    queryFn: async () => {
      const response = await get(`/agencies/${agencyId}`);
      return response;
    },
    enabled: !!agencyId,
  });

  if (isAgencyError) {
    console.error("Chapter fetch error:", agencyError);
  }

  const addSubscriptionMutation = useMutation({
    mutationFn: (data: { agencyId: number; packageId: number }) =>
      post("/subscriptions", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["subscriptions", agencyId]);
      setSelectedPackage(null);
      setOpen(false);
      window.location.reload(); // 👈 This will reload the whole page
    },
    onError: (error) => {
      console.error("Failed to add subscription:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;

    addSubscriptionMutation.mutate({
      agencyId: Number(agencyId),
      packageId: selectedPackage.id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Subscription</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Subscription</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {/* Chapter info */}
          <div className="grid gap-1">
            <Label>Chapter</Label>
            <div className="p-2 border rounded bg-muted text-sm">
              <div className="flex items-center gap-4">
                <div>
                  <strong>Name:</strong>{" "}
                  {isAgencyLoading
                    ? "Loading..."
                    : isAgencyError
                    ? "Failed to load agency"
                    : agencyData?.businessName
                    ? agencyData.businessName.charAt(0).toUpperCase() +
                      agencyData.businessName.slice(1)
                    : "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Package selection */}
          <div>
            <Label className="mb-2" htmlFor="subscription.packageId">
              Select Package
            </Label>
            <Popover
              open={packagePopoverOpen}
              onOpenChange={setPackagePopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={packagePopoverOpen}
                  className="w-full justify-between"
                >
                  {selectedPackage?.packageName || "Select package..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Search packages..." />
                  <CommandEmpty>No package found.</CommandEmpty>
                  <CommandGroup>
                    {packages.map((pkg: any) => (
                      <CommandItem
                        key={pkg.id}
                        value={pkg.packageName}
                        onSelect={() => {
                          setValue("subscription.packageId", pkg.id);
                          setSelectedPackage(pkg);
                          setPackagePopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedPackage?.id === pkg.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {pkg.packageName} ({pkg.numberOfBranches} branches,{" "}
                        {pkg.usersPerBranch} users/branch)
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.subscription?.packageId && (
              <span className="text-red-500 text-sm">
                {errors.subscription.packageId.message}
              </span>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="flex justify-end space-x-2">
            <Button
              type="submit"
              disabled={!selectedPackage || addSubscriptionMutation.isLoading}
            >
              {addSubscriptionMutation.isLoading
                ? "Adding..."
                : "Add Supcription"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSubscription;
