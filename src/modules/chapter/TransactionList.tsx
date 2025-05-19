import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/services/apiService";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Loader2, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

type Transaction = {
  id: number;
  chapterId: number;
  date: string;
  accountType: "cash" | "bank";
  transactionType: "credit" | "debit";
  amount: number;
  description?: string;
  reference?: string;
  createdAt: string;
  updatedAt: string;
};

type Chapter = {
  bankopeningbalance: number | null;
  bankclosingbalance: number | null;
  cashopeningbalance: number | null;
  cashclosingbalance: number | null;
};

export default function TransactionList() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [accountType, setAccountType] = useState<string>("all");
  const [transactionType, setTransactionType] = useState<string>("all");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch transactions
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      "transactions",
      chapterId,
      page,
      limit,
      search,
      accountType,
      transactionType,
    ],
    queryFn: () => {
      const acct = accountType === "all" ? "" : accountType;
      const type = transactionType === "all" ? "" : transactionType;
      return get(
        `/api/transactionRoutes/chapters/${chapterId}/transactions?page=${page}&limit=${limit}&search=${search}&accountType=${acct}&transactionType=${type}`
      );
    },
  });

  const transactions = data?.transactions || [];
  const chapter: Chapter = data?.chapter || {
    bankopeningbalance: null,
    bankclosingbalance: null,
    cashopeningbalance: null,
    cashclosingbalance: null,
  };
  const totalPages = data?.totalPages || 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  // Check for error messages in the location state (from redirects after failed transactions)
  useEffect(() => {
    if (location.state?.error) {
      setErrorMessage(location.state.error);
      // Clear the error from location state after displaying it
      window.history.replaceState({}, document.title);
      
      // Auto-dismiss error after 5 seconds
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location]);

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chapter Transactions</h1>
        <Button asChild>
          <Link to={`/chapters/${chapterId}/transactions/add`}>
            <Plus className="mr-2 h-4 w-4" /> Add Transaction
          </Link>
        </Button>
      </div>
      
      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bank Closing Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatCurrency(chapter.bankclosingbalance)
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cash Closing Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatCurrency(chapter.cashclosingbalance)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter transactions by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by description or reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={accountType} onValueChange={setAccountType}>
                <SelectTrigger>
                  <SelectValue placeholder="Account Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="credit">Receipt</SelectItem>
                  <SelectItem value="debit">Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full md:w-auto">
              <Search className="h-4 w-4 mr-2" /> Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            Showing {transactions.length} of {data?.totalTransactions || 0} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-destructive">
              Error loading transactions. Please try again.
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found. Add a new transaction to get started.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction: Transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(new Date(transaction.date), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.accountType === "cash" ? "outline" : "secondary"}>
                          {transaction.accountType === "cash" ? "Cash" : "Bank"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.transactionType === "credit" ? "secondary" : "destructive"}>
                          {transaction.transactionType === "credit" ? "Credit" : "Debit"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>{transaction.description || "-"}</TableCell>
                      <TableCell>{transaction.reference || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {(() => {
                            // Check if transaction is older than a month
                            const transactionDate = new Date(transaction.date);
                            const oneMonthAgo = new Date();
                            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                            const isOlderThanMonth = transactionDate < oneMonthAgo;
                            
                            if (isOlderThanMonth) {
                              return (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled
                                  title="Transactions older than a month cannot be edited"
                                >
                                  Edit
                                </Button>
                              );
                            } else {
                              return (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <Link to={`/chapters/${chapterId}/transactions/${transaction.id}/edit`}>
                                    Edit
                                  </Link>
                                </Button>
                              );
                            }
                          })()} 
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav>
                <ul className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                    <li key={pageNumber}>
                      <Button
                        variant={pageNumber === page ? "default" : "outline"}
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
