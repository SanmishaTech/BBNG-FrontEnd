import { toast } from "sonner";

export interface MembershipData {
  id: number;
  active: boolean;
  package?: {
    id: number;
    packageType?: {
      id: number;
      name: string;
    };
  };
}

export interface MemberData {
  id: number;
  memberName: string;
  organizationName?: string;
  location?: string;
  gstNo?: string;
  memberships?: MembershipData[];
  stateName?: string;
}

export interface PackageItem {
  id: number;
  packageName: string;
  basicFees: number;
  periodMonths: number;
  packageType: {
    id: number;
    name: string;
  };
}

/**
 * Filters packages based on the member's current active memberships
 * @param memberData Member data containing memberships
 * @param allPackages All available packages
 * @returns Filtered packages based on what memberships the member already has
 */
export const filterPackagesByExistingMemberships = (
  memberData: MemberData | null,
  allPackages: PackageItem[]
): PackageItem[] => {
  if (!memberData || !allPackages.length) {
    return allPackages;
  }

  const activeMemberMemberships = memberData.memberships?.filter((m) => m.active) || [];
  const hasActiveVenue = activeMemberMemberships.some((m) => m.package?.packageType?.name === 'VENUE');
  const hasActiveHO = activeMemberMemberships.some((m) => m.package?.packageType?.name === 'HO');

  // If member has both primary membership types, don't show any packages
  if (hasActiveVenue && hasActiveHO) {
    toast.info("Member already has all primary membership types");
    return [];
  }

  // Filter packages based on what the member already has
  return allPackages.filter((pkg) => {
    const packageTypeName = pkg.packageType?.name;
    
    // If member has VENUE membership, don't show VENUE packages
    if (packageTypeName === 'VENUE') {
      return !hasActiveVenue;
    }
    
    // If member has HO membership, don't show HO packages
    if (packageTypeName === 'HO') {
      return !hasActiveHO;
    }
    
    // For other package types, show all
    return true;
  });
};

/**
 * Determines if a complementary membership should be offered
 * @param memberData Member data containing memberships
 * @param selectedPackage The package that was just added
 * @returns The type of complementary membership to offer, or null if none
 */
export const getComplementaryMembershipType = (
  memberData: MemberData | null,
  selectedPackage: PackageItem | undefined
): 'VENUE' | 'HO' | null => {
  if (!memberData || !selectedPackage) return null;
  
  // Get active memberships
  const activeMemberships = memberData.memberships?.filter(m => m.active) || [];
  
  // Check if user has either VENUE or HO membership but not both
  const hasVenue = activeMemberships.some(m => m.package?.packageType?.name === 'VENUE');
  const hasHO = activeMemberships.some(m => m.package?.packageType?.name === 'HO');
  
  // If they have exactly one type, suggest the other
  if (hasVenue && !hasHO && selectedPackage?.packageType?.name !== 'HO') {
    return 'HO';
  } else if (!hasVenue && hasHO && selectedPackage?.packageType?.name !== 'VENUE') {
    return 'VENUE';
  }
  
  return null;
};

/**
 * Finds a package of the specified type
 * @param packageType Type of package to find ('VENUE' or 'HO')
 * @param allPackages All available packages
 * @returns A package of the specified type, or undefined if none found
 */
export const findPackageByType = (
  packageType: 'VENUE' | 'HO',
  allPackages: PackageItem[]
): PackageItem | undefined => {
  return allPackages.find(pkg => pkg.packageType?.name === packageType);
};
