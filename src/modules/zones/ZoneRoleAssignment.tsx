import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from 'react-router-dom'; 
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import {
  getZoneRoles,
  // getChaptersInZone, // Will be replaced for the main chapter dropdown
  fetchAllChapters, // Added for fetching all chapters
  assignZoneRole,
  removeZoneRole,
  searchMembersForZoneAssignment,
  ZoneDetailsWithRoles,
  ZoneRoleAssignment as ZoneRoleAssignmentType,
  MemberSearchResult,
  ChapterOption,
  getZoneDetails,
  updateZoneDetails,
} from "../../services/zoneRoleService";

// Zone editing form schema
const zoneSchema = z.object({
  name: z.string().min(1, "Region name is required"),
});

type ZoneFormData = z.infer<typeof zoneSchema>;

interface ZoneRoleEditorProps {
  zoneId?: number;  // Optional zoneId prop for when component is used in a dialog
  zoneName?: string; // Optional zoneName prop
}

interface ChapterSelectProps {
  zoneId: number;
  onChapterSelect: (chapterId: number | null) => void;
  selectedChapterId: number | null;
  disabled?: boolean;
}

// Chapter selection component
const ChapterSelect: React.FC<ChapterSelectProps> = ({
  zoneId, 
  onChapterSelect, 
  selectedChapterId,
  disabled = false
}) => {
  const { data: chapters, isLoading: isLoadingChapters } = useQuery<ChapterOption[], Error>({
    queryKey: ["allChapters"],
    queryFn: fetchAllChapters,
    enabled: true, // Fetch chapters as soon as the component is ready
  });

  return (
    <div style={{ marginBottom: '20px' }}>
      <label 
        htmlFor={`chapter-select-${zoneId}`}
        style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: 600,
          fontSize: '15px',
          color: '#333'
        }}
      >
        Select Chapter:
      </label>
      <div style={{ position: 'relative' }}>
        <select
          id={`chapter-select-${zoneId}`}
          value={selectedChapterId || ''}
          onChange={(e) => {
            const val = e.target.value;
            onChapterSelect(val ? Number(val) : null);
          }}
          disabled={disabled || isLoadingChapters}
          style={{ 
            padding: '10px 12px',
            borderRadius: '4px',
            border: '1px solid #d9d9d9',
            width: '100%',
            fontSize: '15px',
            backgroundColor: 'white',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.3s',
            cursor: disabled || isLoadingChapters ? 'not-allowed' : 'pointer',
            appearance: 'none', // Remove default arrow
            WebkitAppearance: 'none',
            backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23333\'%3E%3Cpath d=\'M6 9l6 6 6-6\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: '32px',
            opacity: disabled || isLoadingChapters ? 0.7 : 1
          }}
        >
          <option value="" style={{ color: '#666' }}>-- Select a Chapter --</option>
          {chapters?.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>
              {chapter.name}
            </option>
          ))}
        </select>
        {isLoadingChapters && (
          <div style={{ 
            position: 'absolute',
            right: '40px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            border: '2px solid rgba(0,0,0,0.1)',
            borderTopColor: '#333',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}></div>
        )}
      </div>
      <style>
        {`
          @keyframes spin {
            to { transform: translateY(-50%) rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

const ZONE_ROLE_TYPES = {
  REGIONAL_DIRECTOR: "Regional Director",
  JOINT_SECRETARY: "Joint Secretary",
};

const ZoneRoleEditor: React.FC<ZoneRoleEditorProps> = ({ zoneId: propZoneId, zoneName: propZoneName }) => {
  const { zoneId: zoneIdFromUrl } = useParams<{ zoneId: string }>(); 
  const queryClient = useQueryClient();

  // Use zoneId from props if available, otherwise use from URL params
  const zoneId = propZoneId !== undefined ? propZoneId : (zoneIdFromUrl ? parseInt(zoneIdFromUrl, 10) : undefined);
  
  // Zone details form handling
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ZoneFormData>({
    resolver: zodResolver(zoneSchema),
    defaultValues: {
      name: propZoneName || "",
    },
  });

  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null);
  const [selectedRoleType, setSelectedRoleType] = useState<string>("");
  const [memberSearchInput, setMemberSearchInput] = useState<string>("");
  const [searchedMembers, setSearchedMembers] = useState<MemberSearchResult[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [replacingRole, setReplacingRole] = useState<ZoneRoleAssignmentType | null>(null); // Track role being replaced

  // Query to fetch zone roles
  const {
    data: zoneDetails,
    isPending: isPendingZoneRoles,
    error: zoneRolesError,
  } = useQuery<ZoneDetailsWithRoles, Error>({
    queryKey: ["zoneRoles", zoneId],
    queryFn: () => getZoneRoles(zoneId!),
    enabled: typeof zoneId === "number",
  });

  // Query to fetch zone details for editing
  const {
    data: zoneData,
    isPending: isPendingZoneDetails,
  } = useQuery<{ id: number; name: string; active: boolean }, Error>({
    queryKey: ["zoneDetails", zoneId],
    queryFn: () => getZoneDetails(zoneId!),
    enabled: typeof zoneId === "number",
  });
  
  // Set form values when zoneData is available
  useEffect(() => {
    if (zoneData) {
      setValue("name", zoneData.name);
    }
  }, [zoneData, setValue]);

  const { 
    data: memberSearchResults, 
    isPending: isPendingMembers 
  } = useQuery<MemberSearchResult[], Error>({
    queryKey: ["searchMembers", memberSearchInput, selectedChapterId],
    queryFn: () => searchMembersForZoneAssignment(memberSearchInput, selectedChapterId || undefined),
    enabled: typeof zoneId === "number" && selectedChapterId !== null,
  });

  useEffect(() => {
    if (memberSearchResults) {
      setSearchedMembers(memberSearchResults);
    }
  }, [memberSearchResults]);

  useEffect(() => {
    setSelectedMember(null);
    setSelectedRoleType("");
    setMemberSearchInput("");
    setSearchedMembers([]);
    setSelectedChapterId(null);
    if (typeof zoneId === "number") {
      queryClient.prefetchQuery({
        queryKey: ["zoneRoles", zoneId],
        queryFn: () => getZoneRoles(zoneId)
      });
      queryClient.prefetchQuery({
        queryKey: ["zoneDetails", zoneId],
        queryFn: () => getZoneDetails(zoneId)
      });
    }
  }, [zoneId, queryClient]);

  // Mutation for updating zone details
  const updateZoneMutation = useMutation({
    mutationFn: (data: ZoneFormData) => {
      if (!zoneId) throw new Error("Zone ID is required for update");
      return updateZoneDetails(zoneId, data);
    },
    onSuccess: () => {
      toast.success("Region updated successfully");
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      queryClient.invalidateQueries({ queryKey: ["zoneDetails", zoneId] });
      queryClient.invalidateQueries({ queryKey: ["zoneRoles", zoneId] });
    },
    onError: (error: any) => {
      toast.error(`Error updating region: ${error.response?.data?.message || error.message}`);
    },
  });

  // Find existing assignment for a role type
  const findExistingRoleAssignment = (roleType: string): ZoneRoleAssignmentType | undefined => {
    if (!zoneDetails?.roles) return undefined;
    return zoneDetails.roles.find(role => role.roleType === roleType);
  };

  // Mutation for assigning a role (with automatic replacement)
  const assignRoleMutation = useMutation({
    mutationFn: async ({ currentZoneId, memberId, roleType }: { currentZoneId: number; memberId: number; roleType: string }) => {
      // Check if this role is already assigned
      const existingAssignment = findExistingRoleAssignment(roleType);
      
      // If role is already assigned to someone else, remove that assignment first
      if (existingAssignment && existingAssignment.memberId !== memberId) {
        // First remove the existing assignment
        await removeZoneRole(existingAssignment.assignmentId);
      }
      
      // Then create the new assignment
      return assignZoneRole(currentZoneId, memberId, roleType);
    },
    onSuccess: () => {
      toast.success('Role assigned successfully!');
      queryClient.invalidateQueries({ queryKey: ['zoneRoles', zoneId] });
      setSelectedMember(null);
      setSelectedRoleType('');
      setMemberSearchInput('');
      setSearchedMembers([]);
    },
    onError: (error: any) => {
      toast.error(`Error assigning role: ${error.response?.data?.message || error.message}`);
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: (assignmentId: number) => removeZoneRole(assignmentId),
    onSuccess: () => {
      toast.success('Role removed successfully!');
      queryClient.invalidateQueries({ queryKey: ['zoneRoles', zoneId] });
    },
    onError: (error: any) => {
      toast.error(`Error removing role: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleAssignRole = () => {
    if (zoneId && selectedMember && selectedRoleType) {
      assignRoleMutation.mutate({
        currentZoneId: zoneId,
        memberId: selectedMember.id,
        roleType: selectedRoleType,
      });
      
      // Clear replacing role state after assignment
      if (replacingRole) {
        setReplacingRole(null);
      }
    } else {
      if (!selectedChapterId) {
        toast.error("Please select a chapter first.");
      } else if (!selectedMember) {
        toast.error("Please search and select a member.");
      } else if (!selectedRoleType) {
        toast.error("Please select a role type.");
      } else {
        toast.error("Zone ID is missing. Please try again.");
      }
    }
  };

  // Initiate the role replacement workflow when Replace button is clicked
  const handleInitiateReplacement = (role: ZoneRoleAssignmentType) => {
    setReplacingRole(role);
    setSelectedRoleType(role.roleType);
    setSelectedChapterId(null); // Reset chapter selection to force new selection
    
    // Scroll to the assignment form
    const assignmentForm = document.getElementById('role-assignment-form');
    if (assignmentForm) {
      assignmentForm.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Legacy remove role function (keeping for backward compatibility)
  const handleRemoveRole = (assignmentId: number) => {
    if (window.confirm("Are you sure you want to remove this role?")) {
      removeRoleMutation.mutate(assignmentId);
    }
  };

  const handleMemberSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMemberSearchInput(e.target.value);
    setSelectedMember(null);
  };

  const handleSelectMember = (member: MemberSearchResult) => {
    setSelectedMember(member);
    setMemberSearchInput(member.memberName);
    setSearchedMembers([]);
  };

  if (zoneId === undefined || isNaN(zoneId)) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        Invalid Zone ID provided in the URL.
      </div>
    );
  }

  if (typeof zoneId !== "number") { 
    return (
      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          border: "1px dashed #ccc",
          color: "#777",
        }}
      >
        <p>
          Zone roles can be assigned after the zone (country) has been saved.
        </p>
      </div>
    );
  }

  // Handle zone details form submission
  const onSubmitZoneDetails = (data: ZoneFormData) => {
    if (zoneId) {
      updateZoneMutation.mutate(data);
    }
  };

  return (
    <div className="zone-role-management-page" style={{ 
      padding: "20px", 
      maxWidth: "1200px", 
      margin: "0 auto",    
      overflow: "hidden",
      backgroundColor: "#f9f9f9" 
    }}>
      <h1 style={{
        fontSize: "28px",
        fontWeight: 700,
        color: "#2c3e50",
        marginBottom: "20px",
        paddingBottom: "15px",
        borderBottom: "2px solid #e0e0e0"
      }}>
        Manage Region: {zoneDetails?.zoneName || (zoneData && zoneData.name) || (zoneId ? `Zone ID: ${zoneId}` : 'Loading...')}
      </h1>

      {/* Region Details Editing Section */}
      <div className="zone-details-editor" style={{ 
        marginBottom: "30px",
        padding: "24px", 
        border: "1px solid #e0e0e0", 
        borderRadius: "8px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        backgroundColor: "#ffffff"
      }}>
        <h3 style={{
          marginTop: 0, 
          marginBottom: "20px", 
          fontSize: "18px", 
          fontWeight: 600,
          color: "#333",
          borderBottom: "1px solid #eee",
          paddingBottom: "10px"
        }}>Region Details</h3>

        <form onSubmit={handleSubmit(onSubmitZoneDetails)} style={{ marginBottom: "20px" }}>
          <div style={{ marginBottom: "20px" }}>
            <label 
              htmlFor="name"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
                fontSize: "15px",
                color: "#333"
              }}
            >
              Region Name
            </label>
            <input
              type="text"
              id="name"
              {...register("name")}
              style={{ 
                padding: "12px 16px",
                borderRadius: "4px",
                border: "1px solid #d9d9d9",
                width: "100%",
                fontSize: "15px",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
                transition: "all 0.3s",
                outline: "none"
              }}
              disabled={isPendingZoneDetails}
            />
            {errors.name && (
              <p style={{ 
                marginTop: "6px", 
                color: "#e53e3e", 
                fontSize: "14px" 
              }}>
                {errors.name.message}
              </p>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button 
              type="submit" 
              disabled={updateZoneMutation.isPending}
              style={{ 
                padding: "10px 24px",
                backgroundColor: "#1890ff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "15px",
                fontWeight: 500,
                cursor: updateZoneMutation.isPending ? "not-allowed" : "pointer",
                opacity: updateZoneMutation.isPending ? 0.6 : 1,
                boxShadow: "0 2px 0 rgba(0,0,0,0.045)",
                transition: "all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {updateZoneMutation.isPending ? (
                <>
                  <div style={{ 
                    width: "16px",
                    height: "16px",
                    border: "2px solid rgba(255,255,255,0.2)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    marginRight: "8px"
                  }}></div>
                  Updating...
                </>
              ) : (
                <>Update Region Details</>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="zone-role-editor" style={{ 
        marginTop: "20px",
        maxWidth: "100%",
        overflow: "hidden"
      }}>
        <h3>
          Roles for {zoneDetails?.zoneName || zoneId || `Zone ID: ${zoneId}`}
        </h3>
        {isPendingZoneRoles && <p>Loading roles...</p>}
        {zoneRolesError && (
          <p style={{ color: "red" }}>
            Error fetching roles: {zoneRolesError.message}
          </p>
        )}
        {zoneDetails?.roles?.length > 0 ? (
          <div style={{ overflowX: "auto", maxWidth: "100%" }}>
            <table
              style={{
                width: "100%",
                marginTop: "10px",
                borderCollapse: "collapse",
                border: "1px solid #e6e6e6",
                fontSize: "14px"
              }}
            >
            <thead>
                <tr>
                  <th style={{ padding: "8px 12px", backgroundColor: "#f0f0f0", textAlign: "left" }}>Role Type</th>
                  <th style={{ padding: "8px 12px", backgroundColor: "#f0f0f0", textAlign: "left" }}>Member Name</th>
                  <th style={{ padding: "8px 12px", backgroundColor: "#f0f0f0", textAlign: "left" }}>Organization</th>
                  <th style={{ padding: "8px 12px", backgroundColor: "#f0f0f0", textAlign: "left" }}>Assigned At</th>
                  <th style={{ padding: "8px 12px", backgroundColor: "#f0f0f0", textAlign: "left" }}>Actions</th>
                </tr>
            </thead>
            <tbody>
              {zoneDetails?.roles?.map((role: ZoneRoleAssignmentType) => (
                <tr key={role.assignmentId} style={{ borderBottom: "1px solid #e6e6e6" }}>
                  <td style={{ padding: "8px 12px" }}>{role.roleType}</td>
                  <td style={{ padding: "8px 12px" }}>{role.memberName}</td>
                  <td style={{ padding: "8px 12px" }}>{role.organizationName || "N/A"}</td>
                  <td style={{ padding: "8px 12px" }}>{new Date(role.assignedAt).toLocaleDateString()}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <button
                      onClick={() => handleInitiateReplacement(role)}
                      disabled={removeRoleMutation.isPending}
                      style={{ 
                        padding: "6px 10px",
                        backgroundColor: "#1976d2",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        opacity: removeRoleMutation.isPending ? 0.6 : 1,
                        fontSize: "13px"
                      }}
                    >
                      Replace
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : (
          !isPendingZoneRoles && <p>No roles assigned in this zone.</p>
        )}

        <div id="role-assignment-form" className="role-assignment-container" style={{ 
          marginTop: "20px", 
          padding: "24px", 
          border: "1px solid #e0e0e0", 
          borderRadius: "8px", 
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          maxWidth: "100%",
          overflow: "hidden",
          backgroundColor: replacingRole ? "#f8f9ff" : "#ffffff",
          borderColor: replacingRole ? "#3f87f5" : "#e0e0e0"
        }}>
          <h4 style={{ 
            marginTop: 0, 
            marginBottom: "20px", 
            fontSize: "18px", 
            fontWeight: 600,
            color: "#333",
            borderBottom: "1px solid #eee",
            paddingBottom: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            {replacingRole ? (
              <>
                <span>Replace Role: {replacingRole.roleType}</span>
                <button 
                  onClick={() => setReplacingRole(null)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#666",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  <span style={{ marginLeft: "4px" }}>Cancel</span>
                </button>
              </>
            ) : (
              "Assign Role"
            )}
          </h4>
          
          {replacingRole && (
            <div style={{ 
              marginBottom: "20px", 
              padding: "12px 16px", 
              backgroundColor: "#e8f4fd", 
              borderRadius: "6px",
              border: "1px solid #bae0ff",
              fontSize: "14px"
            }}>
              <p style={{ margin: 0 }}>
                <strong>Currently assigned to:</strong> {replacingRole.memberName}
                {replacingRole.organizationName && ` (${replacingRole.organizationName})`}
              </p>
              <p style={{ margin: "8px 0 0 0", color: "#666" }}>
                Select a new member below to replace the current assignment.
              </p>
            </div>
          )}
          
          {/* Chapter Selection */}
          <ChapterSelect 
            zoneId={zoneId as number} 
            onChapterSelect={setSelectedChapterId} 
            selectedChapterId={selectedChapterId}
            disabled={!zoneId}
          />

          {/* Member Search - Only enabled after chapter selection */}
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor={`member-search-${zoneId}`}
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                fontSize: '15px',
                color: '#333'
              }}
            >
              Search Member:
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                id={`member-search-${zoneId}`}
                value={memberSearchInput} 
                onChange={handleMemberSearchChange} 
                placeholder={selectedChapterId ? "Type member name to search..." : "Select a chapter first"}
                disabled={!zoneId || !selectedChapterId}
                style={{ 
                  padding: '12px 16px',
                  paddingLeft: '40px', // Space for the search icon
                  borderRadius: '4px',
                  border: '1px solid #d9d9d9',
                  width: '100%',
                  fontSize: '15px',
                  backgroundColor: !selectedChapterId ? '#f8f9fa' : 'white',
                  boxSizing: 'border-box', // Prevent overflow
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s',
                  outline: 'none'
                }}
              />
              {/* Search icon */}
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#999'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              
              {isPendingMembers && (
                <div style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(0,0,0,0.1)',
                  borderTopColor: '#666',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}></div>
              )}
            </div>
            
            {searchedMembers.length > 0 && !selectedMember && (
              <div style={{ 
                border: '1px solid #e1e4e8', 
                borderRadius: '4px',
                padding: '0', 
                margin: '4px 0 0 0',
                maxHeight: '240px', 
                overflowY: 'auto',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                backgroundColor: 'white',
                zIndex: 10,
                position: 'relative'
              }}>
                {searchedMembers.map(member => (
                  <div 
                    key={member.id} 
                    onClick={() => handleSelectMember(member)} 
                    style={{ 
                      padding: '12px 16px', 
                      cursor: 'pointer', 
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f6f8fa';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ 
                      fontWeight: 600, 
                      fontSize: '15px',
                      color: '#24292e',
                      marginBottom: '4px'
                    }}>
                      {member.memberName}
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#586069',
                      display: 'flex',
                      alignItems: 'center' 
                    }}>
                      <svg style={{ marginRight: '6px' }} xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      {member.organizationName || 'No Organization'}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {selectedMember && (
              <div style={{ 
                marginTop: '12px', 
                padding: '12px 16px', 
                backgroundColor: '#f0f7ff', 
                borderRadius: '6px',
                border: '1px solid #bae0ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: '15px',
                    color: '#0050b3',
                    marginBottom: '4px' 
                  }}>
                    {selectedMember.memberName}
                  </div>
                  {selectedMember.organizationName && (
                    <div style={{ 
                      fontSize: '13px',
                      color: '#444' 
                    }}>
                      {selectedMember.organizationName}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedMember(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#666',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Clear selection"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Role type selection field - disabled during replacement mode */}
          <div style={{ marginBottom: '20px', display: replacingRole ? 'none' : 'block' }}>
            <label 
              htmlFor={`role-type-select-${zoneId}`}
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                fontSize: '15px',
                color: '#333'
              }}
            >
              Role Type:
            </label>
            <div style={{ position: 'relative' }}>
              <select 
                id={`role-type-select-${zoneId}`}
                value={selectedRoleType} 
                onChange={(e) => setSelectedRoleType(e.target.value)}
                disabled={!zoneId || !selectedMember || !!replacingRole}
                style={{ 
                  padding: '10px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d9d9d9',
                  width: '100%',
                  fontSize: '15px',
                  backgroundColor: !selectedMember ? '#f8f9fa' : 'white',
                  boxSizing: 'border-box', // Prevent overflow
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s',
                  cursor: !selectedMember ? 'not-allowed' : 'pointer',
                  appearance: 'none', // Remove default arrow
                  WebkitAppearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23333\'%3E%3Cpath d=\'M6 9l6 6 6-6\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '32px',
                  opacity: !selectedMember ? 0.7 : 1
                }}
              >
                <option value="" style={{ color: '#666' }}>-- Select Role Type --</option>
                {Object.entries(ZONE_ROLE_TYPES).map(([key, value]) => (
                  <option key={key} value={value}>{value}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleAssignRole} 
              disabled={assignRoleMutation.isPending || !selectedMember || !selectedRoleType || !zoneId || !selectedChapterId}
              style={{ 
                padding: '10px 24px',
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '15px',
                fontWeight: 500,
                cursor: assignRoleMutation.isPending || !selectedMember || !selectedRoleType || !zoneId || !selectedChapterId ? 'not-allowed' : 'pointer',
                opacity: assignRoleMutation.isPending || !selectedMember || !selectedRoleType || !zoneId || !selectedChapterId ? 0.6 : 1,
                boxShadow: '0 2px 0 rgba(0,0,0,0.045)',
                transition: 'all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {assignRoleMutation.isPending ? (
                <>
                  <div style={{ 
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    marginRight: '8px'
                  }}></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg 
                    style={{ marginRight: '8px' }} 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  Assign/Update Role
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneRoleEditor;
