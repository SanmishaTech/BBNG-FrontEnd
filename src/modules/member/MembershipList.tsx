import React from "react";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/services/apiService";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader } from "lucide-react";
import AddMembership from "./AddMembership";

interface MembershipListProps {
  memberId: number;
}

const MembershipList: React.FC<MembershipListProps> = ({ memberId }) => {
  const {
    data: memberships = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["memberships", memberId],
    queryFn: async () => {
      const response = await get(`/memberships/member/${memberId}`);
      return response || [];
    },
    enabled: !!memberId,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "dd MMM yyyy");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader className="mr-2 h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-500">
        Failed to load membership data.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Memberships</CardTitle>
            <CardDescription>
              Membership and subscription history for this member
            </CardDescription>
          </div>
          <AddMembership memberId={memberId} onSuccess={refetch} />
        </div>
      </CardHeader>
      <CardContent>
        {memberships.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No membership records found for this member.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberships.map((membership: any) => {
                  const isActive = new Date(membership.packageEndDate) >= new Date();
                  const packageType = membership.package.isVenueFee
                    ? "Venue Fee"
                    : "Membership";

                  return (
                    <TableRow key={membership.id}>
                      <TableCell>{membership.invoiceNumber}</TableCell>
                      <TableCell>{formatDate(membership.invoiceDate)}</TableCell>
                      <TableCell>{membership.package.packageName}</TableCell>
                      <TableCell>
                        <Badge variant={membership.package.isVenueFee ? "secondary" : "default"}>
                          {packageType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(membership.packageStartDate)} to{" "}
                        {formatDate(membership.packageEndDate)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(membership.totalFees)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {isActive ? "Active" : "Expired"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MembershipList; 