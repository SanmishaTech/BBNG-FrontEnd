import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RoleType,
  ROLE_TYPES,
  ROLE_COLORS,
  getChapterRoles,
  assignChapterRole,
  getMembers,
  Member,
} from "@/services/chapterRoleService";
import { get } from "@/services/apiService";
import ChapterRoleHistory from "./ChapterRoleHistory";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { History, Loader2, UserPlus, Search } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ChapterRoleAssignmentProps {
  chapterId: number;
}

export default function ChapterRoleAssignment({
  chapterId,
}: ChapterRoleAssignmentProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"assignments" | "history">(
    "assignments"
  );
  const [selectedRole, setSelectedRole] = useState<RoleType | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  // For replacement flow
  const [replacingRoleId, setReplacingRoleId] = useState<number | null>(null);
  const [replacingRoleType, setReplacingRoleType] = useState<RoleType | null>(
    null
  );

  // For individual role assignment
  const [individualSearchQuery, setIndividualSearchQuery] = useState("");
  const [debouncedIndividualQuery, setDebouncedIndividualQuery] = useState("");
  const [
    currentIndividualRoleTypeForSearch,
    setCurrentIndividualRoleTypeForSearch,
  ] = useState<RoleType | null>(null);

  // For cross-chapter functionality
  const [crossChapterEnabled, setCrossChapterEnabled] = useState(false);
  const [selectedFromChapterId, setSelectedFromChapterId] = useState<
    number | null
  >(null);
  const [crossChapterSearchQuery, setCrossChapterSearchQuery] = useState("");
  const [debouncedCrossChapterQuery, setDebouncedCrossChapterQuery] =
    useState("");

  // Debounce main search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Debounce individual role search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedIndividualQuery(individualSearchQuery);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [individualSearchQuery]);

  // Debounce cross-chapter search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCrossChapterQuery(crossChapterSearchQuery);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [crossChapterSearchQuery]);

  // Fetch chapter roles
  const {
    data: chapterRoles = [],
    isLoading: loadingRoles,
    error: rolesError,
  } = useQuery({
    queryKey: ["chapterRoles", chapterId],
    queryFn: () => getChapterRoles(chapterId),
    enabled: !!chapterId,
  });

  // We no longer need to fetch history here as it's handled in the ChapterRoleHistory component

  // Fetch chapters for cross-chapter functionality
  const { data: chapters = [], isLoading: loadingChapters } = useQuery({
    queryKey: ["chapters"],
    queryFn: () => get("/chapters").then((r) => r.chapters),
    enabled: crossChapterEnabled,
  });

  // Fetch members for cross-chapter member selection
  const {
    data: crossChapterMembers = [],
    isLoading: loadingCrossChapterMembers,
  } = useQuery({
    queryKey: [
      "crossChapterMembers",
      debouncedCrossChapterQuery,
      selectedFromChapterId,
    ],
    queryFn: () =>
      get(
        `/members?search=${debouncedCrossChapterQuery}${
          selectedFromChapterId ? `&chapterId=${selectedFromChapterId}` : ""
        }`
      ).then((r) => r.members),
    enabled:
      crossChapterEnabled &&
      debouncedCrossChapterQuery.length > 0 &&
      !!selectedFromChapterId,
  });

  // Fetch members for main dropdown
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["members", debouncedQuery, selectedRole, chapterId],
    queryFn: () => {
      const restrictedRoles: RoleType[] = [
        "chapterHead",
        "secretary",
        "treasurer",
      ];
      let effectiveChapterId: number | undefined = undefined;
      if (selectedRole && restrictedRoles.includes(selectedRole as RoleType)) {
        effectiveChapterId = chapterId;
      }
      return getMembers(debouncedQuery, effectiveChapterId);
    },
    enabled: open && debouncedQuery.length > 0 && !!selectedRole,
  });

  // Fetch members for individual role assignment
  const { data: individualMembers = [], isLoading: loadingIndividualMembers } =
    useQuery({
      queryKey: [
        "individualMembers",
        debouncedIndividualQuery,
        currentIndividualRoleTypeForSearch,
        chapterId,
      ],
      queryFn: () => {
        const restrictedRoles: RoleType[] = [
          "chapterHead",
          "secretary",
          "treasurer",
        ];
        let effectiveChapterId: number | undefined = undefined;
        if (
          currentIndividualRoleTypeForSearch &&
          restrictedRoles.includes(currentIndividualRoleTypeForSearch)
        ) {
          effectiveChapterId = chapterId;
        }
        return getMembers(debouncedIndividualQuery, effectiveChapterId);
      },
      enabled:
        debouncedIndividualQuery.length > 0 &&
        !!currentIndividualRoleTypeForSearch,
    });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: (variables: {
      chapterId: number;
      memberId: number;
      roleType: string;
      fromChapterId?: number;
    }) =>
      assignChapterRole(
        variables.chapterId,
        variables.memberId,
        variables.roleType,
        variables.fromChapterId
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chapterRoles", chapterId] });
      queryClient.invalidateQueries({
        queryKey: ["chapterRoleHistory", chapterId],
      });

      // Show different success message based on whether we're replacing or assigning
      if (replacingRoleId) {
        toast.success(
          `${
            ROLE_TYPES[selectedRole as RoleType]
          } has been replaced successfully`
        );
      } else {
        toast.success(
          `${
            ROLE_TYPES[selectedRole as RoleType]
          } has been assigned successfully`
        );
      }

      // Reset all the state
      setOpen(false);
      setSelectedRole("");
      setSelectedMemberId(null);
      setSearchQuery("");
      if (crossChapterEnabled) {
        setCrossChapterSearchQuery("");
        setSelectedFromChapterId(null);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to assign role");
    },
  });

  // We no longer need remove role mutation since we're using the replace approach

  // Handle role assignment from the main dialog
  const handleAssignRole = () => {
    if (!selectedRole || !selectedMemberId) return;

    // If we're replacing an existing role, first close the dialog and show a message
    if (replacingRoleId) {
      // Using the same mutation but with context about replacement
      toast.info("Replacing role assignment...");
    }

    // If cross-chapter is enabled, show appropriate toast
    if (crossChapterEnabled && selectedFromChapterId) {
      toast.info("Assigning cross-chapter role...");
    }

    assignRoleMutation.mutate(
      {
        chapterId,
        roleType: selectedRole,
        memberId: selectedMemberId,
        fromChapterId:
          crossChapterEnabled && selectedFromChapterId
            ? selectedFromChapterId
            : undefined,
      },
      {
        onSuccess: () => {
          // Reset the replacement state
          setReplacingRoleId(null);
          setReplacingRoleType(null);
        },
      }
    );
  };

  // Handle direct role assignment
  const handleDirectAssignment = (memberId: number, roleType: RoleType) => {
    assignRoleMutation.mutate({
      chapterId,
      memberId,
      roleType,
    });
  };

  // Handle initiating role replacement by opening the modal
  const handleReplaceRole = (roleId: number, roleType: RoleType) => {
    // Set the role being replaced and open the main assignment dialog
    setReplacingRoleId(roleId);
    setReplacingRoleType(roleType);
    setSelectedRole(roleType);
    setOpen(true);
  };

  if (rolesError) {
    return <div className="text-red-500">Error loading chapter roles</div>;
  }

  // If in history view mode, show the ChapterRoleHistory component
  if (viewMode === "history") {
    return (
      <ChapterRoleHistory
        chapterId={chapterId}
        onBack={() => setViewMode("assignments")}
      />
    );
  }

  // Otherwise show the role assignment interface
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Chapter Role Assignments</CardTitle>
        <CardDescription>
          Assign leadership and coordination roles to members
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-muted-foreground">
            * Members can have multiple roles in different chapters
          </div>
          <div className="flex space-x-2">
            {/* <div className="flex items-center space-x-2 mr-4">
              <Switch
                id="cross-chapter"
                checked={crossChapterEnabled}
                onCheckedChange={setCrossChapterEnabled}
              />
              <Label htmlFor="cross-chapter">Cross Chapter</Label>
            </div> */}

            <Button variant="outline" onClick={() => setViewMode("history")}>
              <History className="mr-2 h-4 w-4" />
              View History
            </Button>

            <Dialog
              open={open}
              onOpenChange={(isOpen) => {
                setOpen(isOpen);
                // Reset replacement state when closing dialog
                if (!isOpen) {
                  setReplacingRoleId(null);
                  setReplacingRoleType(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign Role
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {replacingRoleType
                      ? `Replace ${ROLE_TYPES[replacingRoleType]}`
                      : crossChapterEnabled
                      ? "Cross-Chapter Role Assignment"
                      : "Assign Chapter Role"}
                  </DialogTitle>
                  {replacingRoleType && (
                    <DialogDescription>
                      Select a new member to replace the current{" "}
                      {ROLE_TYPES[replacingRoleType]}
                    </DialogDescription>
                  )}
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {crossChapterEnabled && (
                    <div className="grid gap-2">
                      <label
                        htmlFor="fromChapter"
                        className="text-sm font-medium"
                      >
                        From Chapter
                      </label>
                      <Select
                        value={selectedFromChapterId?.toString() || ""}
                        onValueChange={(value) =>
                          setSelectedFromChapterId(parseInt(value))
                        }
                      >
                        <SelectTrigger id="fromChapter">
                          <SelectValue placeholder="Select source chapter" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingChapters ? (
                            <div className="p-2 text-center">
                              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                              <span className="text-xs text-muted-foreground">
                                Loading chapters...
                              </span>
                            </div>
                          ) : (
                            chapters.map(
                              (chapter: { id: number; name: string }) => (
                                <SelectItem
                                  key={chapter.id}
                                  value={chapter.id.toString()}
                                >
                                  {chapter.name}
                                </SelectItem>
                              )
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="grid gap-2">
                    <label htmlFor="role" className="text-sm font-medium">
                      Role
                    </label>
                    <Select
                      value={selectedRole}
                      onValueChange={(value: RoleType) =>
                        setSelectedRole(value)
                      }
                      disabled={!!replacingRoleType} // Disable when replacing an existing role
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_TYPES).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="member" className="text-sm font-medium">
                      Member
                    </label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="member"
                        placeholder="Search by name, email, or mobile number..."
                        className="pl-8"
                        value={
                          crossChapterEnabled
                            ? crossChapterSearchQuery
                            : searchQuery
                        }
                        onChange={(e) =>
                          crossChapterEnabled
                            ? setCrossChapterSearchQuery(e.target.value)
                            : setSearchQuery(e.target.value)
                        }
                        autoComplete="off"
                      />
                    </div>

                    {crossChapterEnabled
                      ? crossChapterSearchQuery.length > 0 && (
                          <div className="mt-1 mb-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {loadingCrossChapterMembers
                                  ? "Searching..."
                                  : crossChapterMembers.length === 0
                                  ? "No results"
                                  : `${crossChapterMembers.length} result${
                                      crossChapterMembers.length !== 1
                                        ? "s"
                                        : ""
                                    }`}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => setCrossChapterSearchQuery("")}
                              >
                                Clear
                              </Button>
                            </div>
                          </div>
                        )
                      : searchQuery.length > 0 && (
                          <div className="mt-1 mb-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {loadingMembers
                                  ? "Searching..."
                                  : members.length === 0
                                  ? "No results"
                                  : `${members.length} result${
                                      members.length !== 1 ? "s" : ""
                                    }`}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => setSearchQuery("")}
                              >
                                Clear
                              </Button>
                            </div>
                          </div>
                        )}

                    <div className="max-h-[250px] overflow-y-auto border rounded-md">
                      {crossChapterEnabled ? (
                        loadingCrossChapterMembers ? (
                          <div className="p-4 text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                            <span className="text-sm text-muted-foreground">
                              Searching for members...
                            </span>
                          </div>
                        ) : !selectedFromChapterId ? (
                          <div className="p-6 text-center">
                            <div className="text-muted-foreground mb-2">
                              Please select a source chapter first
                            </div>
                            <div className="text-xs text-muted-foreground">
                              You must select a chapter to search for members
                            </div>
                          </div>
                        ) : crossChapterSearchQuery &&
                          crossChapterMembers.length === 0 ? (
                          <div className="p-6 text-center">
                            <div className="text-muted-foreground mb-2">
                              No members found
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Try different search terms or check the spelling
                            </div>
                          </div>
                        ) : crossChapterSearchQuery.length === 0 ? (
                          <div className="p-6 text-center">
                            <div className="text-muted-foreground mb-2">
                              Search for a member
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Enter a name, email or phone number to find
                              members
                            </div>
                          </div>
                        ) : (
                          <div>
                            {crossChapterMembers.map((member: Member) => (
                              <div
                                key={member.id}
                                className={`p-3 cursor-pointer hover:bg-muted border-b last:border-b-0 transition-colors ${
                                  selectedMemberId === member.id
                                    ? "bg-muted"
                                    : ""
                                }`}
                                onClick={() => setSelectedMemberId(member.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">
                                      {member.memberName}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {member.email}
                                    </div>
                                    {member.mobile1 && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {member.mobile1}
                                      </div>
                                    )}
                                  </div>
                                  {selectedMemberId === member.id && (
                                    <div className="h-4 w-4 rounded-full bg-primary"></div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      ) : // Non-cross-chapter member selection
                      loadingMembers ? (
                        <div className="p-4 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                          <span className="text-sm text-muted-foreground">
                            Searching for members...
                          </span>
                        </div>
                      ) : searchQuery && members.length === 0 ? (
                        <div className="p-6 text-center">
                          <div className="text-muted-foreground mb-2">
                            No members found
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Try different search terms or check the spelling
                          </div>
                        </div>
                      ) : searchQuery.length === 0 ? (
                        <div className="p-6 text-center">
                          <div className="text-muted-foreground mb-2">
                            Search for a member
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Enter a name, email or phone number to find members
                          </div>
                        </div>
                      ) : (
                        <div>
                          {members.map((member) => (
                            <div
                              key={member.id}
                              className={`p-3 cursor-pointer hover:bg-muted border-b last:border-b-0 transition-colors ${
                                selectedMemberId === member.id ? "bg-muted" : ""
                              }`}
                              onClick={() => setSelectedMemberId(member.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">
                                    {member.memberName}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {member.email}
                                  </div>
                                  {member.mobile1 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {member.mobile1}
                                    </div>
                                  )}
                                </div>
                                {selectedMemberId === member.id && (
                                  <div className="h-4 w-4 rounded-full bg-primary"></div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssignRole}
                    disabled={
                      !selectedRole ||
                      !selectedMemberId ||
                      assignRoleMutation.isPending
                    }
                  >
                    {assignRoleMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {replacingRoleId ? "Replacing..." : "Assigning..."}
                      </>
                    ) : replacingRoleId ? (
                      "Replace Role"
                    ) : crossChapterEnabled ? (
                      "Assign Cross-Chapter Role"
                    ) : (
                      "Assign Role"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loadingRoles ? (
          <div className="text-center p-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2 text-muted-foreground">
              Loading role assignments...
            </p>
          </div>
        ) : chapterRoles.length === 0 ? (
          <div className="text-center p-6 border rounded-md">
            <p className="text-muted-foreground">
              No roles have been assigned yet.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Click "Assign Role" to assign members to leadership positions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(ROLE_TYPES).map(([roleKey, roleName]) => {
              const role = chapterRoles.find((r) => r.roleType === roleKey);
              const colorClass = ROLE_COLORS[roleKey as RoleType] || "";

              return (
                <div key={roleKey} className="border rounded-lg p-4 relative">
                  <div
                    className={`absolute right-2 top-2 text-xs font-medium rounded-full px-2.5 py-0.5 ${colorClass}`}
                  >
                    {roleName}
                  </div>

                  {role ? (
                    <div className="pt-6">
                      <div className="font-medium text-lg">
                        {role.member.memberName}
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        <div>{role.member.email}</div>
                        <div>{role.member.mobile1}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">
                        Assigned on{" "}
                        {new Date(role.assignedAt).toLocaleDateString()}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault(); // Prevent form submission
                          e.stopPropagation(); // Stop event bubbling
                          handleReplaceRole(role.id, role.roleType as RoleType);
                        }}
                        disabled={assignRoleMutation.isPending}
                        className="w-full"
                      >
                        {assignRoleMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Replace Assignment"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Dialog
                      onOpenChange={(openState) => {
                        if (openState) {
                          setIndividualSearchQuery("");
                          setCurrentIndividualRoleTypeForSearch(
                            roleKey as RoleType
                          );
                        } else {
                          setCurrentIndividualRoleTypeForSearch(null);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-24 border-dashed"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <UserPlus className="h-8 w-8 mb-2 text-muted-foreground" />
                            <span>Assign {roleName}</span>
                          </div>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign {roleName}</DialogTitle>
                          <DialogDescription>
                            Select a member to assign as {roleName}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by name, email, or mobile number..."
                            className="pl-8"
                            value={individualSearchQuery}
                            onChange={(e) =>
                              setIndividualSearchQuery(e.target.value)
                            }
                            autoComplete="off"
                          />
                        </div>

                        {individualSearchQuery.length > 0 && (
                          <div className="mt-1 mb-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {loadingIndividualMembers
                                  ? "Searching..."
                                  : individualMembers.length === 0
                                  ? "No results"
                                  : `${individualMembers.length} result${
                                      individualMembers.length !== 1 ? "s" : ""
                                    }`}
                              </span>
                              {individualSearchQuery.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => setIndividualSearchQuery("")}
                                >
                                  Clear
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="max-h-[250px] overflow-y-auto border rounded-md">
                          {loadingIndividualMembers ? (
                            <div className="p-4 text-center">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                              <span className="text-sm text-muted-foreground">
                                Searching for members...
                              </span>
                            </div>
                          ) : individualSearchQuery &&
                            individualMembers.length === 0 ? (
                            <div className="p-6 text-center">
                              <div className="text-muted-foreground mb-2">
                                No members found
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Try different search terms or check the spelling
                              </div>
                            </div>
                          ) : individualSearchQuery.length === 0 ? (
                            <div className="p-6 text-center">
                              <div className="text-muted-foreground mb-2">
                                Search for a member
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Enter a name, email or phone number to find
                                members
                              </div>
                            </div>
                          ) : (
                            <div>
                              {individualMembers.map((member) => (
                                <div
                                  key={member.id}
                                  className="p-3 cursor-pointer hover:bg-muted border-b last:border-b-0 transition-colors"
                                  onClick={() =>
                                    handleDirectAssignment(
                                      member.id,
                                      roleKey as RoleType
                                    )
                                  }
                                >
                                  <div className="flex items-center">
                                    <div className="flex-1">
                                      <div className="font-medium">
                                        {member.memberName}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {member.email}
                                      </div>
                                      {member.mobile1 && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {member.mobile1}
                                        </div>
                                      )}
                                    </div>
                                    <Button size="sm" className="ml-2">
                                      Assign
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
