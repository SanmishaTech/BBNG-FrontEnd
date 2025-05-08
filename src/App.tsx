import { useEffect } from "react";
import { appName } from "./config"; // Import appName from config
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

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

import { Toaster } from "sonner";
import "./App.css";

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
            {/* Add other auth routes here */}
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
          </Route>
        </Routes>
      </Router>
    </>
  );
};

export default App;
