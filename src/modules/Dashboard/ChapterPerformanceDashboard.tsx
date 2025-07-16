import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { get } from "@/services/apiService";

// Define interfaces
interface Transaction {
  id: number;
  amount: number;
  date: string;
  description: string;
  account?: string;
  type?: string;
  reference?: string;
  memberName?: string;
  transactionType?: string;
}

interface Chapter {
  bankBalance?: number;
  cashBalance?: number;
  id: number;
  name: string;
  revenueGenerated: number;
  referencesShared: number;
  visitors: number;
  oneToOne: number;
  transactions: Transaction[];
}

// Define the UserRole interface 
interface UserRole {
  role: string;
  chapters: number[];
}

export default function ChapterPerformanceDashboard() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchChapterPerformance = async () => {
      try {
        setIsLoading(true);
        
        // Get user roles from localStorage
        const storedRoles = localStorage.getItem("RoleDC");
        if (!storedRoles) {
          setError("No chapter roles found");
          setIsLoading(false);
          return;
        }
        
        // Parse roles and extract chapter IDs
        const userRoles: UserRole[] = JSON.parse(storedRoles);
        
        // Filter to only get chapter IDs where user has DC role
        const dcRoles = userRoles.filter(role => role.role === "DC");
        
        if (dcRoles.length === 0) {
          setError("You do not have Division Coordinator (DC) role for any chapter");
          setIsLoading(false);
          return;
        }
        
        // Get unique chapter IDs where user is a DC
        const uniqueChapterIds = Array.from(
          new Set(
            dcRoles.flatMap(role => role.chapters)
          )
        );
        
        if (uniqueChapterIds.length === 0) {
          setError("No chapters associated with your account");
          setIsLoading(false);
          return;
        }
        
        // Fetch data for each chapter
        const chapterDataPromises = uniqueChapterIds.map(async (chapterId) => {
          // Fetch chapter info using apiService instead of raw fetch
          const chapterInfo = await get(`/chapters/${chapterId}`);
          console.log("Chaptername", chapterInfo)
          
          // Ensure we have a proper name
          // The chapter API returns a chapter object with a name field
          const chapterName = chapterInfo && chapterInfo.name ? chapterInfo.name : `Unknown Chapter`;
          
          // Fetch revenue generated and transactions using apiService
          const revenueData = await get(`/statistics/chapter-business-generated/${chapterId}`);
          console.log("revenueData", revenueData)
          
          // Fetch transactions for the chapter - handle potential 404 errors gracefully
          let transactionsData = { transactions: [] };
          try {
            transactionsData = await get(`/statistics/chapter-transactions/${chapterId}`);
          } catch (error) {
            console.log("No transaction data available for this chapter");
          }
          
          // Fetch bank and cash balances for the chapter - handle potential 404 errors
          let balancesData = { bankBalance: 0, cashBalance: 0 };
          try {
            balancesData = await get(`/statistics/chapter-balances/${chapterId}`);
          } catch (error) {
            console.log("No balance data available for this chapter");
          }
          
          // Fetch references count - handle potential 404 errors
          let referencesData = { total: 0 };
          try {
            referencesData = await get(`/statistics/chapter-references-count/${chapterId}`);
          } catch (error) {
            console.log("No references data available for this chapter");
          }
          
          // Fetch visitors count - handle potential 404 errors
          let visitorsData = { total: 0 };
          try {
            visitorsData = await get(`/statistics/chapter-visitors-count/${chapterId}`);
          } catch (error) {
            console.log("No visitors data available for this chapter");
          }
          
          // Fetch one-to-one count - handle potential 404 errors
          let oneToOneData = { total: 0 };
          try {
            oneToOneData = await get(`/statistics/chapter-one-to-one-count/${chapterId}`);
          } catch (error) {
            console.log("No one-to-one data available for this chapter");
          }
          
          return {
            id: chapterId,
            name: chapterName,
            revenueGenerated: revenueData.total || 0,
            referencesShared: referencesData.total || 0,
            visitors: visitorsData.total || 0,
            oneToOne: oneToOneData.total || 0,
            transactions: transactionsData.transactions || [],
            bankBalance: balancesData.bankBalance || 0,
            cashBalance: balancesData.cashBalance || 0
          };
        });
        
        // Wait for all promises to resolve
        const chaptersData = await Promise.all(chapterDataPromises);
        setChapters(chaptersData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching chapter performance:", error);
        setError("Failed to load chapter performance data");
        setIsLoading(false);
      }
    };
    
    fetchChapterPerformance();
  }, []);
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Get all roles for a specific chapter ID
  const getRolesForChapter = (chapterId: number): string[] => {
    const storedRoles = localStorage.getItem("roles");
    if (!storedRoles) return ["Member"];
    
    const userRoles: UserRole[] = JSON.parse(storedRoles);
    
    // Find all roles that include this chapter
    const rolesForChapter = userRoles
      .filter(role => role.chapters.includes(chapterId))
      .map(role => role.role);
    
    return rolesForChapter.length > 0 ? rolesForChapter : ["Member"];
  };
  
  // Render badges for all roles a user has for a chapter
  const renderRoleBadges = (chapterId: number) => {
    const roles = getRolesForChapter(chapterId);
    
    return (
      <div className="flex flex-wrap gap-1">
        {roles.map((role, index) => (
          <Badge key={index} variant={
            role === "OB" ? "default" :
            role === "RD" ? "secondary" :
            role === "DC" ? "outline" : "destructive"
          }>
            {role}
          </Badge>
        ))}
      </div>
    );
  };
  
  // Set the first chapter as selected when data is loaded
  useEffect(() => {
    if (chapters.length > 0 && !selectedChapterId) {
      setSelectedChapterId(chapters[0].id);
    }
  }, [chapters]);
  
  // Get selected chapter data
  const selectedChapter = chapters.find(chapter => chapter.id === selectedChapterId);
  
  // If still loading or there's an error
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mb-4 mx-auto"></div>
          <p>Loading chapter performance data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
            <p>{error}</p>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-primary text-white rounded-md"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 py-6 container px-4 md:px-6">
        <div className="flex flex-col gap-4 md:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Division Coordinator Chapter Performance</CardTitle>
              <CardDescription>
                Select a chapter to view detailed performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs 
                defaultValue={selectedChapterId?.toString() || ""} 
                value={selectedChapterId?.toString() || ""}
                onValueChange={(value) => setSelectedChapterId(Number(value))}
                className="w-full"
              >
                <TabsList className="mb-4 flex flex-wrap h-auto">
                  {chapters.map(chapter => (
                    <TabsTrigger 
                      key={chapter.id} 
                      value={chapter.id.toString()} 
                      className="m-1 px-4 py-2"
                      title={`View ${chapter.name} details`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="font-medium">{chapter.name}</span>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {chapters.map(chapter => (
                  <TabsContent key={chapter.id} value={chapter.id.toString()} className="p-0">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card className="bg-gradient-to-br from-green-100 to-green-50 shadow-md hover:shadow-lg transition-shadow col-span-1 lg:col-span-4">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-bold">Total Revenue Generated</CardTitle>
                          <CardDescription>
                            Total business generated by this chapter
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">
                            {formatCurrency(chapter.revenueGenerated)}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-br from-amber-100 to-amber-50 shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-bold">References Shared</CardTitle>
                          <CardDescription>
                            Total references by chapter members
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">
                            {chapter.referencesShared}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-br from-blue-100 to-blue-50 shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-bold">Visitors</CardTitle>
                          <CardDescription>
                            Total visitors to chapter
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">
                            {chapter.visitors}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-br from-purple-100 to-purple-50 shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-bold">One-to-Ones</CardTitle>
                          <CardDescription>
                            Total one-to-one meetings
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">
                            {chapter.oneToOne}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Transactions table for the selected chapter */}
          {/* {selectedChapter && (
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  Recent revenue transactions for {selectedChapter.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedChapter.transactions.length > 0 ? (
                        selectedChapter.transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                            <TableCell>{transaction.memberName || 'N/A'}</TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell>{transaction.transactionType || 'Revenue'}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(transaction.amount)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                            No transactions found for this chapter
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
           */}
          {/* Additional chapter information can be added here if needed */}
        </div>
      </main>
    </div>
  );
}
