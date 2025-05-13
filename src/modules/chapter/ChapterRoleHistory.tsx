import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  RoleType,
  ROLE_TYPES,
  ROLE_COLORS, 
  getChapterRoleHistory 
} from "@/services/chapterRoleService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ChevronLeft, Filter, CalendarRange, Clock, User } from "lucide-react";
import { format } from "date-fns";

interface ChapterRoleHistoryProps {
  chapterId: number;
  onBack: () => void;
}

export default function ChapterRoleHistory({ chapterId, onBack }: ChapterRoleHistoryProps) {
  const [selectedRoleType, setSelectedRoleType] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"timeline" | "member" | "role">("timeline");
  
  // Fetch role history
  const {
    data: roleHistory = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['chapterRoleHistory', chapterId],
    queryFn: () => getChapterRoleHistory(chapterId),
    enabled: !!chapterId,
  });

  // Filter and sort history data
  const filteredHistory = useMemo(() => {
    let filtered = [...roleHistory];
    
    // Apply role type filter
    if (selectedRoleType !== 'all') {
      filtered = filtered.filter(item => item.roleType === selectedRoleType);
    }
    
    // Apply action filter
    if (selectedAction !== 'all') {
      filtered = filtered.filter(item => item.action === selectedAction);
    }
    
    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    return filtered;
  }, [roleHistory, selectedRoleType, selectedAction, sortOrder]);

  // Group history by different criteria based on view mode
  const groupedHistory = useMemo(() => {
    if (viewMode === 'timeline') {
      // Just return the filtered list for timeline view
      return { "All Events": filteredHistory };
    } else if (viewMode === 'member') {
      // Group by member
      return filteredHistory.reduce((acc, item) => {
        const memberName = item.member.memberName;
        if (!acc[memberName]) {
          acc[memberName] = [];
        }
        acc[memberName].push(item);
        return acc;
      }, {} as Record<string, typeof filteredHistory>);
    } else if (viewMode === 'role') {
      // Group by role type
      return filteredHistory.reduce((acc, item) => {
        const roleType = ROLE_TYPES[item.roleType as RoleType] || item.roleType;
        if (!acc[roleType]) {
          acc[roleType] = [];
        }
        acc[roleType].push(item);
        return acc;
      }, {} as Record<string, typeof filteredHistory>);
    }
    
    return {};
  }, [filteredHistory, viewMode]);

  // Get unique actions for filter
  const actions = useMemo(() => {
    const uniqueActions = new Set(roleHistory.map(item => item.action));
    return Array.from(uniqueActions);
  }, [roleHistory]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP p'); // Example: "Apr 29, 2023, 5:00 PM"
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading role history...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center text-red-500">
          Error loading role history
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2" 
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <CardTitle>Role Assignment History</CardTitle>
          <CardDescription>
            Complete history of role assignments and changes
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <Tabs defaultValue="timeline" onValueChange={(value) => setViewMode(value as any)}>
              <TabsList className="grid grid-cols-3 w-[300px]">
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="member">By Member</TabsTrigger>
                <TabsTrigger value="role">By Role</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter:</span>
              <Select 
                value={selectedRoleType} 
                onValueChange={setSelectedRoleType}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Role Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {Object.entries(ROLE_TYPES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={selectedAction} 
                onValueChange={setSelectedAction}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actions.map(action => (
                    <SelectItem key={action} value={action}>
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={sortOrder} 
                onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredHistory.length === 0 ? (
            <div className="text-center p-8 border rounded-md">
              <p className="text-muted-foreground">No role history found with the selected filters.</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <Accordion 
                type="multiple" 
                className="w-full" 
                defaultValue={Object.keys(groupedHistory)}
              >
                {Object.entries(groupedHistory).map(([group, items]) => (
                  <AccordionItem key={group} value={group}>
                    <AccordionTrigger className="text-lg font-medium">
                      <div className="flex items-center">
                        <span>{group}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({items.length} event{items.length !== 1 ? 's' : ''})
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        {items.map(item => (
                          <div 
                            key={item.id} 
                            className="relative border-l-2 pl-4 ml-2 pb-4"
                            style={{ borderColor: `var(--${ROLE_COLORS[item.roleType as RoleType]?.split(' ')[0] || '--border'})` }}
                          >
                            <div className="absolute w-3 h-3 rounded-full bg-primary left-[-7px] top-1"></div>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[item.roleType as RoleType] || ''}`}>
                                    {ROLE_TYPES[item.roleType as RoleType] || item.roleType}
                                  </span>
                                  <span className="text-sm font-medium capitalize">
                                    {item.action}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2 mt-1">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm font-medium">
                                    {item.member.memberName}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {item.member.email}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex flex-col md:items-end mt-2 md:mt-0">
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <CalendarRange className="h-3 w-3 mr-1" />
                                  <span>{formatDate(item.startDate)}</span>
                                </div>
                                
                                {item.performedByName && (
                                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>By {item.performedByName}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
