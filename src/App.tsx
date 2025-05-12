//Vipul
import { useEffect } from "react";
import { appName } from "./config"; // Import appName from config
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
} from "react-router-dom";

import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";
import SiteSettings from "./modules/SiteSettings/SiteSettingsList";
import Login from "./modules/Auth/Login";
import Register from "./modules/Auth/Register";
import ForgotPassword from "./modules/Auth/ForgotPassword";
import ResetPassword from "./modules/Auth/ResetPassword";
import Zones from "./modules/zones/CountryList";
import Categories from "./modules/Category/CategoryList";
import ProtectedRoute from "./components/common/protected-route"; // Correct path
import Location from "./modules/location/CountryList"; // Correct path
import UserList from "@/modules/User/UserList";
import TrainingList from "./modules/Training/TrainingList";
import MessageList from "./modules/Message/MessageList";
import Chapters from "./modules/chapter/AgencyList";
import CreateChapter from "./modules/chapter/CreateAgency";
import EditChapters from "./modules/chapter/EditAgency";
import Members from "./modules/member/AgencyList";
import CreateMembers from "./modules/member/CreateAgency";
import EditMembers from "./modules/member/EditAgency";
import Profile from "./modules/profile/EditAgency";
import MembershipList from "./modules/membership/MembershipList";
import PackageList from "./modules/package/PackageList";
import CreatePackage from "./modules/package/CreatePackage";
import EditPackage from "./modules/package/EditPackage";
import CreateMembership from "./modules/membership/CreatePackage";
import EditMembership from "./modules/membership/EditMembership";
import TransactionList from "./modules/chapter/TransactionList";
import CreateTransaction from "./modules/chapter/CreateTransaction";
import EditTransaction from "./modules/chapter/EditTransaction";
import { 
  ReferenceList, 
  ReferenceForm,
  ReferenceDetail,
  MemberReferences,
  GivenReferences,
  ReceivedReferences
} from "./modules/reference";
import ReferencesDashboard from "./modules/reference/ReferencesDashboard";
import ReferenceRouter from "./modules/reference/ReferenceRouter";
import Chaptermeeting from "./modules/chaptermeeting/ChapterMeetingList";
import ChapterMeetingCreate from "./modules/chaptermeeting/CreateChapterMeeting";
import ChapterMeetingEdit from "./modules/chaptermeeting/EditChapterMeeting";
import VisitorList from "./modules/visitor/VisitorList";
import VisitorForm from "./modules/visitor/VisitorForm";
import EditAttendance from "./modules/attendance/EditAttendance";
 import AddRequirement from "./modules/requirement/AddRequirement";
import ViewRequirementList from "./modules/requirement/ViewRequirementList";
import MemberReport from "./modules/report/MemberReport";
import TransactionReport from "./modules/report/TransactionReport";
import MembershipReport from "./modules/report/MembershipReport";
import Dashboard from "./modules/Dashboard/dashboard";
 import ChapterVisitorList from "./modules/visitor/ChapterVisitorList";
import { OneToOneList, OneToOneForm } from "./modules/oneToOne";
import MemberSearch from "./modules/member/MemberSearch";
import FacebookProfile from "./modules/Facebookprofile/Index";
 import { Toaster } from "sonner";
import "./App.css";

// MembershipList wrapper component to handle showing all memberships
const MembershipListWrapper = () => {
  return <MembershipList />;
};

// MembershipList wrapper for a specific member
const MemberMembershipList = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const memberIdNumber = memberId ? parseInt(memberId) : undefined;

  return <MembershipList memberId={memberIdNumber} />;
};

// Member profile wrapper component
const MemberProfileWrapper = () => {
  const { id } = useParams<{ id: string }>();
  return <FacebookProfile memberId={id} />;
};

const App = () => {
  useEffect(() => {
    document.title = appName; // Set the document title
  }, []);

  return (
    <>
      <Toaster richColors position="top-center" />
      <Router>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Route>
          <Route element={<MainLayout />}>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <UserList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/zones"
              element={
                <ProtectedRoute>
                  <Zones />
                </ProtectedRoute>
              }
            />
            <Route
              path="/location"
              element={
                <ProtectedRoute>
                  <Location />
                </ProtectedRoute>
              }
            />
            <Route
              path="/site"
              element={
                <ProtectedRoute>
                  <SiteSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <Categories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trainings"
              element={
                <ProtectedRoute>
                  <TrainingList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessageList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chapters"
              element={
                <ProtectedRoute>
                  <Chapters />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chapters/create"
              element={
                <ProtectedRoute>
                  <CreateChapter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chapters/:id/edit"
              element={
                <ProtectedRoute>
                  <EditChapters />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chapters/:chapterId/transactions"
              element={
                <ProtectedRoute>
                  <TransactionList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chapters/:chapterId/transactions/add"
              element={
                <ProtectedRoute>
                  <CreateTransaction />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chapters/:chapterId/transactions/:id/edit"
              element={
                <ProtectedRoute>
                  <EditTransaction />
                </ProtectedRoute>
              }
            />
            <Route
              path="/members"
              element={
                <ProtectedRoute>
                  <Members />
                </ProtectedRoute>
              }
            />
            <Route
              path="/members/create"
              element={
                <ProtectedRoute>
                  <CreateMembers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/members/:id/edit"
              element={
                <ProtectedRoute>
                  <EditMembers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reset-password/:token"
              element={
                <ProtectedRoute>
                  <ResetPassword />
                </ProtectedRoute>
              }
            />
            <Route
              path="/memberships"
              element={
                <ProtectedRoute>
                  <MembershipListWrapper />
                </ProtectedRoute>
              }
            />
            <Route
              path="/members/:memberId/memberships"
              element={
                <ProtectedRoute>
                  <MemberMembershipList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/packages"
              element={
                <ProtectedRoute>
                  <PackageList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/packages/create"
              element={
                <ProtectedRoute>
                  <CreatePackage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/packages/:id/edit"
              element={
                <ProtectedRoute>
                  <EditPackage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/memberships/add"
              element={
                <ProtectedRoute>
                  <CreateMembership />
                </ProtectedRoute>
              }
            />
            <Route
              path="/memberships/:id/edit"
              element={
                <ProtectedRoute>
                  <EditMembership />
                </ProtectedRoute>
              }
            />
            <Route
              path="/members/:memberId/memberships/add"
              element={
                <ProtectedRoute>
                  <CreateMembership />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chaptermeetings"
              element={
                <ProtectedRoute>
                  <Chaptermeeting />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chaptermeetings/create"
              element={
                <ProtectedRoute>
                  <ChapterMeetingCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chaptermeetings/:id/edit"
              element={
                <ProtectedRoute>
                  <ChapterMeetingEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chaptermeetings/:meetingId/visitors"
              element={
                <ProtectedRoute>
                  <VisitorList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chaptermeetings/:meetingId/visitors/add"
              element={
                <ProtectedRoute>
                  <VisitorForm isEditing={false} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chaptermeetings/:meetingId/visitors/:visitorId/edit"
              element={
                <ProtectedRoute>
                  <VisitorForm isEditing={true} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chaptermeetings/:meetingId/attendance"
              element={
                <ProtectedRoute>
                  <EditAttendance />
                </ProtectedRoute>
              }
            />
            <Route
               path="/requirements"
              element={
                <ProtectedRoute>
                  <AddRequirement />
                </ProtectedRoute>
              }
            />
            <Route
               path="/references"
              element={
                <ProtectedRoute>
                  <ReferenceList />
                </ProtectedRoute>
              }
            />
            <Route
               path="/viewrequirements"
              element={
                <ProtectedRoute>
                  <ViewRequirementList />
                </ProtectedRoute>
              }
            />
            <Route
               path="/dashboard/references"
              element={
                <ProtectedRoute>
                  <ReferenceRouter />
                </ProtectedRoute>
              }
            />
            <Route
               path="/memberreports"
              element={
                <ProtectedRoute>
                  <MemberReport />
                </ProtectedRoute>
              }
            />
            <Route
               path="/dashboard/references/given"
              element={
                <ProtectedRoute>
                  <GivenReferences />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactionreports"
              element={
                <ProtectedRoute>
                  <TransactionReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/references/received"
              element={
                <ProtectedRoute>
                  <ReceivedReferences />
                </ProtectedRoute>
              }
            />
            <Route
              path="/membershipreports"
              element={
                <ProtectedRoute>
                  <MembershipReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/references/create"
              element={
                <ProtectedRoute>
                  <ReferenceForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/references/:id"
              element={
                <ProtectedRoute>
                  <ReferenceDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chapter-visitors"
              element={
                <ProtectedRoute>
                  <ChapterVisitorList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/references/:id/edit"
              element={
                <ProtectedRoute>
                  <ReferenceForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/members/:memberId/references"
              element={
                <ProtectedRoute>
                  <MemberReferences />
                </ProtectedRoute>
              }
            />
            <Route
              path="/one-to-ones"
              element={
                <ProtectedRoute>
                  <OneToOneList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/one-to-ones/create"
              element={
                <ProtectedRoute>
                  <OneToOneForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/member/search"
              element={
                <ProtectedRoute>
                  <MemberSearch />
                </ProtectedRoute>
              }
            />
            <Route
              path="/member/profile/:id"
              element={
                <ProtectedRoute>
                  <MemberProfileWrapper />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
    </>
  );
};

export default App;
