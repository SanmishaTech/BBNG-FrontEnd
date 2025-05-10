import { Navigate, RouteObject } from 'react-router-dom';
import AuthLayout from '@/layouts/AuthLayout';
import MainLayout from '@/layouts/MainLayout';
import Login from '@/modules/Auth/Login';
import Register from '@/modules/Auth/Register';
import ForgotPassword from '@/modules/Auth/ForgotPassword';
import ResetPassword from '@/modules/Auth/ResetPassword';
import Zones from '@/modules/zones/CountryList';
import Categories from '@/modules/Category/CategoryList';
import Location from '@/modules/location/CountryList';
import UserList from '@/modules/User/UserList';
import TrainingList from '@/modules/Training/TrainingList';
import MessageList from '@/modules/Message/MessageList';
import Chapters from '@/modules/chapter/AgencyList';
import CreateChapter from '@/modules/chapter/CreateAgency';
import EditChapters from '@/modules/chapter/EditAgency';
import SiteSettings from '@/modules/SiteSettings/SiteSettingsList';
import ProtectedRoute from '@/components/common/protected-route';
import ChapterMeetingList from '@/modules/chaptermeeting/ChapterMeetingList';
import CreateChapterMeeting from '@/modules/chaptermeeting/CreateChapterMeeting';
import EditChapterMeeting from '@/modules/chaptermeeting/EditChapterMeeting';
import VisitorList from '@/modules/visitor/VisitorList';
import VisitorForm from '@/modules/visitor/VisitorForm';
import EditAttendance from '@/modules/attendance/EditAttendance';

// Define route types for better type safety
export type AppRouteObject = RouteObject & {
  auth?: boolean;
  roles?: string[];
};

// Auth routes
const authRoutes: AppRouteObject[] = [
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { index: true, element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password/:token', element: <ResetPassword /> },
    ],
  },
];

// Protected routes
const protectedRoutes: AppRouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: 'users', element: <ProtectedRoute><UserList /></ProtectedRoute>, auth: true },
      { path: 'zones', element: <ProtectedRoute><Zones /></ProtectedRoute>, auth: true },
      { path: 'location', element: <ProtectedRoute><Location /></ProtectedRoute>, auth: true },
      { path: 'site', element: <ProtectedRoute><SiteSettings /></ProtectedRoute>, auth: true },
      { path: 'categories', element: <ProtectedRoute><Categories /></ProtectedRoute>, auth: true },
      { path: 'trainings', element: <ProtectedRoute><TrainingList /></ProtectedRoute>, auth: true },
      { path: 'messages', element: <ProtectedRoute><MessageList /></ProtectedRoute>, auth: true },
      { path: 'chapters', element: <ProtectedRoute><Chapters /></ProtectedRoute>, auth: true },
      { path: 'chapters/create', element: <ProtectedRoute><CreateChapter /></ProtectedRoute>, auth: true },
      { path: 'chapters/:id/edit', element: <ProtectedRoute><EditChapters /></ProtectedRoute>, auth: true },
      { path: 'chaptermeetings', element: <ProtectedRoute><ChapterMeetingList /></ProtectedRoute>, auth: true },
      { path: 'chaptermeetings/create', element: <ProtectedRoute><CreateChapterMeeting /></ProtectedRoute>, auth: true },
      { path: 'chaptermeetings/:id/edit', element: <ProtectedRoute><EditChapterMeeting /></ProtectedRoute>, auth: true },
      { path: 'chaptermeetings/:meetingId/visitors', element: <ProtectedRoute><VisitorList /></ProtectedRoute>, auth: true },
      { path: 'chaptermeetings/:meetingId/visitors/add', element: <ProtectedRoute><VisitorForm isEditing={false} /></ProtectedRoute>, auth: true },
      { path: 'chaptermeetings/:meetingId/visitors/:visitorId/edit', element: <ProtectedRoute><VisitorForm isEditing={true} /></ProtectedRoute>, auth: true },
      { path: 'chaptermeetings/:meetingId/attendance', element: <ProtectedRoute><EditAttendance /></ProtectedRoute>, auth: true },
      // Redirect from root to users page for authenticated users
      { index: true, element: <Navigate to="/users" replace /> },
    ],
  },
];

export const routes: AppRouteObject[] = [...authRoutes, ...protectedRoutes];