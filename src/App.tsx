import { useEffect } from "react";
import { appName } from "./config"; // Import appName from config
import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";

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
          </Route>
        </Routes>
      </Router>
    </>
  );
};

export default App;
