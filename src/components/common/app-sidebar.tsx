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
        { title: "Chapter Performance", url: "/chapter-performance" },
         { title: "Members", url: "/members" },
        { title: "Visitors", url: "/chapter-visitors" },
        { title: "Meetings", url: "/chaptermeetings" },
 
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
          isActive: false,
          items: [
            { title: "References", url: "/references" },
          ],
        },
        {
          title: "Done Deals",
          url: "/dashboard/done-deal",
          icon: FileText,
          isActive: false,
          items: [
            { title: "Done Deals", url: "/dashboard/done-deal" },
          ],
        },
        {
          title: "One To Ones",
          url: "/one-to-ones",
          icon: BookOpen,
          isActive: false,
          items: [
            { title: "One To Ones", url: "/one-to-ones" },
          ],
        },
        {
          title: "Requirements",
          url: "/requirements",
          icon: BookOpen,
          isActive: false,
          items: [
            { title: "Requirements", url: "/requirements" },
            { title: "View Requirements", url: "/viewrequirements" },
          ],
        }
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
          title: "Master",
          url: "#",
          icon: SquareTerminal,
          isActive: false,
          items: [
            { title: "Zone", url: "/zones" },
            { title: "Location", url: "/location" },
            { title: "Business Category", url: "/categories" },
            { title: "Power Teams", url: "/powerteams" },
            { title: "Messages", url: "/messages" },
            { title: "Chapters", url: "/chapters" },  
            { title: "Members", url: "/members" },
            
            { title: "Site Settings", url: "/site" },
            { title: "Meetings", url: "/chaptermeetings" },
            { title: "Trainings", url: "/trainings" },
           ],
        },
        {
          title: "References",
          url: "/references",
          icon: BookOpen,
          isActive: false,
          items: [
            { title: "References", url: "/references" },
          ],
        },
        {
          title: "Done Deals",
          url: "/dashboard/done-deal",
          icon: FileText,
          isActive: false,
          items: [
            { title: "Done Deals", url: "/dashboard/done-deal" },
          ],
        },
        {
          title: "One To Ones",
          url: "/one-to-ones",
          icon: BookOpen,
          isActive: false,
          items: [
            { title: "One To Ones", url: "/one-to-ones" },
          ],
        },
        {
          title: "Requirements",
          url: "/requirements",
          icon: BookOpen,
          isActive: false,
          items: [
            { title: "Requirements", url: "/requirements" },
            { title: "View Requirements", url: "/viewrequirements" },
          ],
        }
      ],

      // navMain: [
      //   {
      //     title: "Masters",
      //     url: "#",
      //     icon: SquareTerminal,
      //     isActive: false,
      //     items: [
           
         
             
      //     ],
      //   },
      // ],
    },
    member: {
      projects: [],
      navMain: [
        {
          title: "My Information",
          url: "#", 
          icon: User,
          isActive: false,
          items: [
            {
              title: "My Profile",
              url: "/profile",
              icon: UserCircle,
            },
            {
              title: "My Memberships",
              url: "/memberships",
              icon: CreditCard,
            }
          ],
        }
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
    isOB: false,
  });

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedRoles = localStorage.getItem("roles");
    let isUserOB = false;
    
    // Check if user is an OB from the roles data
    if (storedRoles) {
      try {
        const parsedRoles = JSON.parse(storedRoles);
        // Check if any role is "OB"
        isUserOB = parsedRoles.some((roleObj: { role: string, chapters: number[] }) => 
          roleObj.role === "OB" && roleObj.chapters && roleObj.chapters.length > 0
        );
      } catch (error) {
        console.error("Failed to parse roles from localStorage", error);
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
          isOB: isUserOB
        }));
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        // If there's an error, set default projects for navigation
        setData((prevData) => ({
          ...prevData,
          projects: initialData.roles.super_admin.projects,
          navMain: initialData.roles.super_admin.navMain,
          obNav: [],
          isOB: false
        }));
      }
    } else {
      // No user in localStorage, show default navigation
      setData((prevData) => ({
        ...prevData,
        projects: initialData.roles.super_admin.projects,
        navMain: initialData.roles.super_admin.navMain,
        obNav: [],
        isOB: false
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
             <a
              className="flex items-center gap-2"
              >
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">{appName}</span>
              </a>
              <a
              className="flex items-center gap-2"
              href="/member/search">
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
            <div className="px-4 py-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Office Bearer Menu</h3>
            </div>
            <NavMain items={data.obNav || []} />
          </div>
        )}
        <NavMain items={data.projects || []} />
        <NavMain items={data.navMain || []} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export { AppSidebar };
