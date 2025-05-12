import { useState, useEffect } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  Bell,
  FlaskConical,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
 import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
 import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axios from "axios";
import userAvatar from "@/images/Profile.jpg";

// Updated data structure based on your requirements
const recentTests = [
  {
    id: "T001",
    contact_person: "John Doe",
    follow_up_remark: "Schedule Meetings",
    status: "Completed",
    follow_up_type: "High",
  },
  {
    id: "T002",
    contact_person: "Jane Smith",
    follow_up_remark: "Maintain Records",
    status: "Completed",
    follow_up_type: "Medium",
  },
  {
    id: "T003",
    contact_person: "Bob Johnson",
    follow_up_remark: "Campus Cleanliness",
    status: "In Progress",
    follow_up_type: "Low",
  },
  {
    id: "T004",
    contact_person: "Alice Brown",
    follow_up_remark: "Assist Students",
    status: "Completed",
    follow_up_type: "Medium",
  },
  {
    id: "T005",
    contact_person: "Charlie Davis",
    follow_up_remark: "Organize Events",
    status: "Completed",
    follow_up_type: "High",
  },
];

const testVolumeData = [
  { name: "Jan", tests: 165 },
  { name: "Feb", tests: 180 },
  { name: "Mar", tests: 200 },
  { name: "Apr", tests: 220 },
  { name: "May", tests: 195 },
  { name: "Jun", tests: 210 },
];

export default function ResponsiveLabDashboard() {
  const [myLeads, setMyLeads] = useState(0);
  const user = localStorage.getItem("user");
  const User = JSON.parse(user);
   const [leads, setLeads] = useState([]);
  const [meetings, setMeetings] = useState([]);

  const [openLeadsCount, setOpenLeadsCount] = useState(0);
  const [followUpLeadsCount, setFollowUpLeadsCount] = useState(0);

  // Fetch staff leads
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/all_staff`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        });
        const leads = response.data.data.Staff;
        setLeads(leads);
        const openLeads = leads.filter((lead) => lead.lead_status === "Open");
        setMyLeads(leads.length);
        setOpenLeadsCount(openLeads.length);
        const followUpLeads = leads.filter(
          (lead) => lead.follow_up_type === "Call"
        );
        setFollowUpLeadsCount(followUpLeads.length);
      } catch (error) {
        console.error("Error fetching dashboard leads data:", error);
      }
    };

    fetchData();
  }, []);

  // Fetch meetings

  const [teachingCount, setTeachingCount] = useState(0);
  const [nonTeachingCount, setNonTeachingCount] = useState(0);
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const response = await axios.get(`/api/all_meetings`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        });
        if (response.data.status) {
          const meetingsData = response.data.data.Meeting;
          setMeetings(meetingsData);
          // Filter based on the staff_type property
          setTeachingCount(
            leads.filter((lead) => lead.staff_type === "Teaching").length
          );
          setNonTeachingCount(
            leads.filter((lead) => lead.staff_type === "Non-Teaching").length
          );
        } else {
          console.error("Failed to fetch meetings:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching meetings:", error);
      }
    };

    fetchMeetings();
  }, []);

  return (
    <div className="flex h-screen ">
      {/* Sidebar for larger screens */}
      {/* <Sidebar className="hidden md:block w-64 shadow-md" /> */}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Welcome</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-accent/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Records
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teachingCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-accent/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
              Records
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{nonTeachingCount}</div>
            </CardContent>
          </Card>

          <Card className="bg-accent/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
              Records
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{followUpLeadsCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-accent/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
              Records
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myLeads && myLeads}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4 ">
          <Card className="col-span-full lg:col-span-4 overflow-x-auto bg-accent/40">
            <CardHeader>
              <CardTitle>My Open Tasks</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto ">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Task ID</TableHead>
                    <TableHead>Contact Name</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell className="font-medium">{test.id}</TableCell>
                      <TableCell>{test.contact_person}</TableCell>
                      <TableCell>{test.follow_up_remark}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            test.status === "Completed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {test.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            test.follow_up_type === "Low"
                              ? "success"
                              : test.follow_up_type === "High"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {test.follow_up_type}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="col-span-full lg:col-span-3 overflow-x-auto bg-accent/40">
            <CardHeader>
              <CardTitle>My Meetings</CardTitle>
              <CardDescription>Meetings with Clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {meetings.slice(0, 5).map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{meeting.venue}</p>
                      <p className="text-sm text-muted-foreground">
                        {meeting.synopsis}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(meeting.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm">{meeting.time}</p>
                    </div>
                  </div>
                ))}
                {meetings.length >= 5 && (
                  <div className="mt-4 text-right">
                    <button
                       className="text-xs hover:text-blue-500"
                    >
                      See More...
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
          <Card className="col-span-full lg:col-span-4 bg-accent/40">
            <CardHeader>
              <CardTitle>Volume Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={testVolumeData}>
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Bar dataKey="tests" fill="#adfa1d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="col-span-full lg:col-span-3 bg-accent/40">
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium">Accuracy</div>
                    <div className="text-sm text-muted-foreground">98.2%</div>
                  </div>
                  <div>+0.2%</div>
                </div>
                <Progress value={98} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium">Turnaround Time</div>
                    <div className="text-sm text-muted-foreground">
                      24.5 hours
                    </div>
                  </div>
                  <div>-1.5h</div>
                </div>
                <Progress value={82} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium">Utilization</div>
                    <div className="text-sm text-muted-foreground">87.3%</div>
                  </div>
                  <div>+3.7%</div>
                </div>
                <Progress value={87} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}