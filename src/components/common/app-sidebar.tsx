import * as React from "react";
import {
  ArrowUpCircleIcon,
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  UsersRound,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  MessageCircle,
  Icon,
  FileText,
  UserRound,
  User,
  UserCircle,
  CreditCard,
} from "lucide-react";

import { NavMain } from "@/components/common/nav-main";
import { NavProjects } from "@/components/common/nav-projects";
import { NavUser } from "@/components/common/nav-user";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
// import { TeamSwitcher } from "@/components/common/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { appName } from "@/config";

// This is sample data.
const initialData = {
  // Navigation items for Office Bearers (OB)
  obNavigation: [
    {
      title: "Office Bearers",
      url: "#",
      icon: UsersRound,
      isActive: false,
      items: [
        { title: "Performance Dashboard", url: "/performance-dashboard" },
        { title: "Visitors", url: "/chapter-visitors" },
        { title: "Meetings", url: "/chaptermeetings" },
      ],
    },
  ],

  // Navigation items for Development Coordinators and Regional Directors
  coordinatorNavigation: [
    {
      title: "Coordination",
      url: "#",
      icon: PieChart,
      isActive: false,
      items: [
        { title: "Performance Dashboard", url: "/performance-dashboard" },
      ],
    },
  ],
  roles: {
    super_admin: {
      projects: [
        {
          title: "References",
          url: "/references",
          icon: BookOpen,
          groupLabel: "References",
          isActive: false,
          items: [],
        },
        {
          title: "Done Deals",
          url: "/dashboard/done-deal",
          icon: FileText,
          groupLabel: "Done Deals",
          isActive: false,
          items: [],
        },
        {
          title: "One To Ones",
          url: "/one-to-ones",
          groupLabel: "One To Ones",
          icon: BookOpen,
          isActive: false,
          items: [],
        },
        {
          title: "Requirements",
          url: "/requirements",
          icon: BookOpen,
          groupLabel: "Requirements",
          isActive: false,
          items: [
            { title: "Requirements", url: "/requirements" },
            { title: "View Requirements", url: "/viewrequirements" },
          ],
        },
      ],
      navMain: [
        {
          title: "Reports",
          url: "#",
          icon: PieChart,
          isActive: false,
          items: [
            { title: "Member Report", url: "/memberreports" },
            { title: "Transaction Report", url: "/transactionreports" },
            { title: "Membership Report", url: "/membershipreports" },
          ],
        },
      ],
    },
    admin: {
      projects: [
        {
          title: "States",
          url: "/states",
          icon: Map,
          groupLabel: "States",
          isActive: false,
          items: [],
        },
        {
          title: "Region",
          url: "/zones",
          icon: Map,
          groupLabel: "Region",
          isActive: false,
          items: [],
        },
        {
          title: "Location",
          url: "/location",
          icon: Map,
          groupLabel: "Location",
          isActive: false,
          items: [],
        },
        {
          title: "Business Category",
          url: "/categories",
          icon: PieChart,
          groupLabel: "Business Category",
          isActive: false,
          items: [],
        },
        {
          title: "Sub Category",
          url: "/sub-categories",
          icon: PieChart,
          groupLabel: "Sub Category",
          isActive: false,
          items: [],
        },
        {
          title: "Packages",
          url: "/packages",
          icon: CreditCard,
          groupLabel: "Packages",
          isActive: false,
          items: [],
        },
        {
          title: "Chapters",
          url: "/chapters",
          icon: BookOpen,
          groupLabel: "Chapters",
          isActive: false,
          items: [],
        },
        {
          title: "Members",
          url: "/members",
          icon: UsersRound,
          groupLabel: "Members",
          isActive: false,
          items: [],
        },
        {
          title: "Power Teams",
          url: "/powerteams",
          icon: UsersRound,
          groupLabel: "Power Teams",
          isActive: false,
          items: [],
        },
        {
          title: "Trainings",
          url: "/trainings",
          icon: BookOpen,
          groupLabel: "Trainings",
          isActive: false,
          items: [],
        },
        {
          title: "Site Settings",
          url: "/site",
          icon: Settings2,
          groupLabel: "Site Settings",
          isActive: false,
          items: [],
        },
        {
          title: "Messages",
          url: "/messages",
          icon: MessageCircle,
          groupLabel: "Messages",
          isActive: false,
          items: [],
        },
      ],
    },
    member: {
      projects: [
        {
          title: "References",
          url: "/references",
          icon: BookOpen,
          groupLabel: "References",
          isActive: false,
          items: [],
        },
        {
          title: "Done Deals",
          url: "/dashboard/done-deal",
          icon: FileText,
          groupLabel: "Done Deals",
          isActive: false,
          items: [],
        },
        {
          title: "One To Ones",
          url: "/one-to-ones",
          groupLabel: "One To Ones",
          icon: BookOpen,
          isActive: false,
          items: [],
        },
        {
          title: "Requirements",
          url: "/requirements",
          icon: BookOpen,
          groupLabel: "Requirements",
          isActive: false,
          items: [
            { title: "Requirements", url: "/requirements" },
            { title: "View Requirements", url: "/viewrequirements" },
          ],
        },
      ],
      navMain: [
        {
          title: "Reports",
          url: "#",
          icon: PieChart,
          isActive: false,
          items: [
            { title: "Member Report", url: "/memberreports" },
            { title: "Transaction Report", url: "/transactionreports" },
            { title: "Membership Report", url: "/membershipreports" },
          ],
        },
      ],
    },
  },
  user: {
    name: "",
    email: "",
    avatar: "",
    avatarName: "",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
};

function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [data, setData] = React.useState({
    ...initialData,
    projects: [] as typeof initialData.roles.super_admin.projects,
    navMain: [] as typeof initialData.roles.admin.navMain,
    obNav: [] as typeof initialData.obNavigation,
    coordinatorNav: [] as typeof initialData.coordinatorNavigation,
    isOB: false,
    isCoordinator: false,
  });

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedRoles = localStorage.getItem("roles");
    let isUserOB = false;
    let isUserCoordinator = false;

    // Check if user is an OB or Coordinator from the roles data
    if (
      storedRoles &&
      storedRoles !== "undefined" &&
      storedRoles.trim() !== ""
    ) {
      try {
        const parsedRoles = JSON.parse(storedRoles);
        // Check if the user has roles
        if (Array.isArray(parsedRoles)) {
          const obRoles = ["chapterHead", "secretary", "treasurer"];
          const coordinatorRoles = [
            "guardian",
            "districtCoordinator",
            "regionalCoordinator",
            "developmentCoordinator",
          ];
          const zoneRoles = ["Regional Director", "Joint Secretary"];

          // Check for Office Bearer roles (chapter-level)
          isUserOB = parsedRoles.some(
            (roleObj: { roleType: string; chapterId?: number }) =>
              obRoles.includes(roleObj.roleType) && roleObj.chapterId
          );

          // Check for Coordinator roles (chapter-level)
          isUserCoordinator = parsedRoles.some(
            (roleObj: { roleType: string; chapterId?: number }) =>
              coordinatorRoles.includes(roleObj.roleType) && roleObj.chapterId
          );

          // Check for Zone-level roles (Regional Director/Joint Secretary)
          const hasZoneRole = parsedRoles.some(
            (roleObj: { roleType: string; zoneId?: number }) =>
              zoneRoles.includes(roleObj.roleType) && roleObj.zoneId
          );

          // If user has zone role, they should see coordinator menu (unless they're also OB)
          if (hasZoneRole) {
            isUserCoordinator = true;
          }
        }
      } catch (error) {
        console.error("Failed to parse roles from localStorage", error);
        // Clear invalid data from localStorage
        localStorage.removeItem("roles");
      }
    }

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        parsedUser.avatarName = parsedUser.name?.charAt(0).toUpperCase() || "U";

        // Default to admin if no role is specified, then fallback to super_admin for safety
        let role =
          (parsedUser.role as keyof typeof initialData.roles) || "admin";

        // If role doesn't exist in our initialData, default to super_admin
        if (!initialData.roles[role]) {
          role = "super_admin";
        }

        const roleData = initialData.roles[role];

        setData((prevData) => ({
          ...prevData,
          projects: roleData?.projects || [],
          navMain: roleData?.navMain || [],
          user: parsedUser,
          obNav: isUserOB ? initialData.obNavigation : [],
          coordinatorNav: isUserCoordinator
            ? initialData.coordinatorNavigation
            : [],
          isOB: isUserOB,
          isCoordinator: isUserCoordinator,
        }));
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        // If there's an error, set default projects for navigation
        setData((prevData) => ({
          ...prevData,
          projects: initialData.roles.super_admin.projects,
          navMain: initialData.roles.super_admin.navMain,
          obNav: [],
          coordinatorNav: [],
          isOB: false,
          isCoordinator: false,
        }));
      }
    } else {
      // No user in localStorage, show default navigation
      setData((prevData) => ({
        ...prevData,
        projects: initialData.roles.super_admin.projects,
        navMain: initialData.roles.super_admin.navMain,
        obNav: [],
        coordinatorNav: [],
        isOB: false,
        isCoordinator: false,
      }));
    }
  }, []);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={data.teams} /> */}
        <SidebarMenu className="flex  ">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <div className="flex items-center gap-2  justify-between">
                <a href="/dashboard" className="flex items-center gap-2">
                  <ArrowUpCircleIcon className="h-5 w-5" />
                  <span className="text-base font-semibold">{appName}</span>
                </a>
                <a className="flex items-center gap-2" href="/member/search">
                  <Search className="h-5 w-5 mr-2" />
                </a>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1 bg-white"
            >
              <a href="/dashboard">
                <Search className="h-5 w-5 " />
                <Input placeholder="Search" className="border-0 " />
               </a>
              
            </SidebarMenuButton>
            
          </SidebarMenuItem> */}
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.isOB && (
          <div className="mb-4">
            <NavMain items={data.obNav || []} groupLabel="Office Bearer Menu" />
          </div>
        )}
        {data.isCoordinator && !data.isOB && (
          <div className="mb-4">
            <NavMain
              items={data.coordinatorNav || []}
              groupLabel="Coordination Menu"
            />
          </div>
        )}
        <NavMain items={data.projects || []} groupLabel="Services" />
        <NavMain items={data.navMain || []} groupLabel="Management" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export { AppSidebar };
