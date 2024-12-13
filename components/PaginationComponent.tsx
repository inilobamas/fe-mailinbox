import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationEllipsis } from "@/components/ui/pagination";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationComponentProps {
  totalCount: number;
  activeCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaginationComponent: React.FC<PaginationComponentProps> = ({
  pageSize,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pageInput, setPageInput] = useState("");

  const renderPaginationItems = () => {
    const pages = [];
    let startPage = Math.max(2, currentPage - 2);
    let endPage = Math.min(totalPages - 1, currentPage + 2);

    if (currentPage <= 3) {
      startPage = 2;
      endPage = Math.min(5, totalPages - 1);
    }

    if (currentPage >= totalPages - 2) {
      startPage = Math.max(totalPages - 4, 2);
      endPage = totalPages - 1;
    }

    pages.push(
      <PaginationItem key={1}>
        <PaginationLink
          onClick={() => onPageChange(1)}
          isActive={1 === currentPage}
          className="hover:bg-gray-100 cursor-pointer"
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    if (startPage > 2) {
      pages.push(
        <PaginationItem key="start-ellipsis">
          <PaginationEllipsis onClick={() => setIsDialogOpen(true)} className="cursor-pointer" />
        </PaginationItem>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => onPageChange(i)}
            isActive={i === currentPage}
            className="hover:bg-gray-100 cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages - 1) {
      pages.push(
        <PaginationItem key="end-ellipsis">
          <PaginationEllipsis onClick={() => setIsDialogOpen(true)} className="cursor-pointer" />
        </PaginationItem>
      );
    }

    if (totalPages > 1) {
      pages.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => onPageChange(totalPages)}
            isActive={totalPages === currentPage}
            className="hover:bg-gray-100 cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return pages;
  };

  useEffect(() => {
    setPageInput("");
  }, [currentPage]);

  const handlePageInputSubmit = () => {
    const page = parseInt(pageInput);
    if (page && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
    setIsDialogOpen(false);
    setPageInput("");
  };

  return (
    <div className="pagination-container gap-4 px-4">
      <div className="pagination-info text-sm text-gray-500">
        Showing{" "}
        {totalCount === 0
          ? "0"
          : `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalCount)}`}{" "}
        of {totalCount}
      </div>

      <div className="pagination-controls flex space-x-2">
        <Pagination>
          <PaginationContent className="flex">
            {currentPage > 1 && (
              <>
                <PaginationItem>
                  <PaginationLink
                    onClick={() => onPageChange(1)}
                    aria-label="Go to first page"
                    className="hover:bg-gray-100 cursor-pointer"
                  >
                    <ChevronFirst className="h-4 w-4 cursor-pointer" />
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    onClick={() => onPageChange(currentPage - 1)}
                    aria-label="Go to previous page"
                    className="hover:bg-gray-100 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4 cursor-pointer" />
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
            {renderPaginationItems()}
            {currentPage < totalPages && (
              <>
                <PaginationItem>
                  <PaginationLink
                    onClick={() => onPageChange(currentPage + 1)}
                    aria-label="Go to next page"
                    className="hover:bg-gray-100 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4 cursor-pointer" />
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    onClick={() => onPageChange(totalPages)}
                    aria-label="Go to last page"
                    className="hover:bg-gray-100 cursor-pointer"
                  >
                    <ChevronLast className="h-4 w-4 cursor-pointer" />
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
          </PaginationContent>
        </Pagination>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Go to Page</DialogTitle>
          </DialogHeader>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            placeholder="Enter page number"
          />
          <DialogFooter>
            <Button onClick={handlePageInputSubmit}>Go</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaginationComponent;