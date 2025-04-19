import * as React from "react";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  recordsPerPage: number;
  onPageChange: (page: number) => void;
  onRecordsPerPageChange: (recordsPerPage: number) => void;
}

const CustomPagination: React.FC<CustomPaginationProps> = ({
  currentPage,
  totalPages,
  totalRecords,
  recordsPerPage,
  onPageChange,
  onRecordsPerPageChange,
}) => {
  const startRecord = (currentPage - 1) * recordsPerPage + 1;
  const endRecord = Math.min(currentPage * recordsPerPage, totalRecords);

  return (
    <div className="flex flex-wrap justify-between items-center mt-4 gap-4">
      {/* Number of Records */}
      <div className="text-sm text-gray-600">
        Showing {startRecord} of {totalPages} pages
      </div>

      {/* Records Per Page Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Records per page:</span>
        <Select
          value={recordsPerPage.toString()}
          onValueChange={(value) => onRecordsPerPageChange(Number(value))}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder={`${recordsPerPage}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ShadCN Pagination */}
      <Pagination>
        <PaginationContent>
          {/* Previous Button */}
          <PaginationItem>
            {currentPage !== 1 ? (
              <PaginationPrevious onClick={() => onPageChange(currentPage - 1)}>
                Previous
              </PaginationPrevious>
            ) : (
              <PaginationPrevious isActive={false}>Previous</PaginationPrevious>
            )}
          </PaginationItem>

          {/* Page Numbers */}
          {Array.from({ length: totalPages }, (_, index) => (
            <PaginationItem key={index}>
              <PaginationLink
                isActive={currentPage === index + 1}
                onClick={() => onPageChange(index + 1)}
              >
                {index + 1}
              </PaginationLink>
            </PaginationItem>
          ))}

          {/* Next Button */}
          <PaginationItem>
            {currentPage < totalPages ? (
              <PaginationNext onClick={() => onPageChange(currentPage + 1)}>
                Next
              </PaginationNext>
            ) : (
              <PaginationNext isActive={false}>Next</PaginationNext>
            )}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default CustomPagination;
