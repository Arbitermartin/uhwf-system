

// // import { Routes, Route, Navigate } from 'react-router-dom'
// // import MainLayout from './layouts/MainLayout'
// // import DashboardLayout from './layouts/DashboardLayout'
// // import ProtectedRoute from './components/ProtectedRoute'
// // import ApprovedOnly from './components/ApprovedOnly'
// // import { ApplicationProvider } from './context/ApplicationProvider'
// // import Home from './pages/public/Home'
// // import About from './pages/public/About'
// // import Contact from './pages/public/Contact'
// // import Career from './pages/public/Career'
// // import Team from './pages/public/Team'
// // import Admission from './pages/public/Admission'
// // import VideoGallery from './pages/public/VideoGallery'
// // import ComingSoon from './pages/public/ComingSoon'
// // import Login from './pages/auth/Login'
// // import ChangePassword from './pages/auth/ChangePassword'
// // import AdminDashboard from './pages/admin/AdminDashboard'
// // import UsersPage from './pages/admin/UsersPage'
// // import ApplicationsPage from './pages/admin/ApplicationsPage'
// // import CoursesPage from './pages/admin/CoursesPage'
// // import SettingsPage from './pages/admin/SettingsPage'
// // import MessagesPage from './pages/admin/MessagesPage'
// // import StudentHome from './pages/student/StudentHome'
// // import StudentApplication from './pages/student/StudentApplication'
// // import LecturerDashboard from './pages/lecturer/LecturerDashboard'
// // import {
// //   LecturerAnnouncementsPage,
// //   LecturerAssignmentsPage,
// //   LecturerAttendancePage,
// //   LecturerGradesPage,
// // } from './pages/lecturer/LecturerPages'
// // import IctDashboard from './pages/ict/IctDashboard'
// // import { IctBackupsPage, IctLogsPage, IctTicketsPage } from './pages/ict/IctPages'
// // import ReportProblem from './pages/shared/ReportProblem'
// // import ProfilePage from './pages/shared/ProfilePage'
// // import EmployeeDashboard from './pages/employee/EmployeeDashboard'

// // const publicPlaceholders = [
// //   '/land',
// //   '/wildlife',
// //   '/network',
// //   '/services/community',
// //   '/services/innovations',
// //   '/career/apply/:id',
// //   '/news/:id',
// //   '/forgot-password',
// //   '/help',
// // ]

// // // "password" is not listed here any more: every dashboard has a real Change password page.
// // const adminPlaceholders = [
// //   'enrollments', 'news', 'videos',
// //   'account', 'activity', 'help',
// // ]
// // const studentPlaceholders = ['notifications', 'account', 'activity', 'help']
// // const studentApprovedPlaceholders = ['courses', 'timetable', 'results']
// // const lecturerPlaceholders = [
// //   'courses', 'messages', 'timetable', 'account', 'activity', 'help',
// // ]
// // const ictPlaceholders = [
// //   'accounts', 'security', 'server', 'database',
// //   'maintenance', 'settings', 'account', 'activity', 'help',
// // ]
// // const employeePlaceholders = [
// //   'tasks', 'attendance', 'leave', 'announcements', 'messages',
// //   'account', 'activity', 'help',
// // ]

// // function App() {
// //   return (
// //     <Routes>
// //       {/* 1. Auth pages: no navbar, no footer */}
// //       <Route path="/login" element={<Login />} />
// //       <Route path="/register" element={<Navigate to="/admission" replace />} />

// //       {/* 2. Forced password change: any signed-in user, no navbar, no footer */}
// //       <Route element={<ProtectedRoute />}>
// //         <Route path="/change-password" element={<ChangePassword standalone />} />
// //       </Route>

// //       {/* 3. Public website: navbar + footer only here */}
// //       <Route element={<MainLayout />}>
// //         <Route path="/" element={<Home />} />
// //         <Route path="/about" element={<About />} />
// //         <Route path="/contact" element={<Contact />} />
// //         <Route path="/career" element={<Career />} />
// //         <Route path="/team" element={<Team />} />
// //         <Route path="/admission" element={<Admission />} />
// //         <Route path="/video-gallery" element={<VideoGallery />} />
// //         {publicPlaceholders.map((path) => (
// //           <Route key={path} path={path} element={<ComingSoon />} />
// //         ))}
// //       </Route>

// //       {/* 4. Admin dashboard */}
// //       <Route path="/admin" element={<ProtectedRoute roles={['admin']} />}>
// //         <Route element={<DashboardLayout />}>
// //           <Route index element={<AdminDashboard />} />
// //           <Route path="users" element={<UsersPage key="all" />} />
// //           <Route path="students" element={<UsersPage key="student" fixedRole="student" />} />
// //           <Route path="lecturers" element={<UsersPage key="lecturer" fixedRole="lecturer" />} />
// //           <Route path="employees" element={<UsersPage key="employee" fixedRole="employee" />} />
// //           <Route path="applications" element={<ApplicationsPage />} />
// //           <Route path="courses" element={<CoursesPage />} />
// //           <Route path="settings" element={<SettingsPage />} />
// //           <Route path="messages" element={<MessagesPage />} />
// //           <Route path="password" element={<ChangePassword />} />
// //           <Route path="support" element={<ReportProblem />} />
// //           <Route path="profile" element={<ProfilePage />} />
// //           {adminPlaceholders.map((path) => (
// //             <Route key={path} path={path} element={<ComingSoon />} />
// //           ))}
// //         </Route>
// //       </Route>

// //       {/* 5. Student dashboard */}
// //       <Route path="/student" element={<ProtectedRoute roles={['student']} />}>
// //         <Route element={<ApplicationProvider />}>
// //           <Route element={<DashboardLayout />}>
// //             <Route index element={<StudentHome />} />
// //             <Route path="application" element={<StudentApplication />} />
// //             <Route path="password" element={<ChangePassword />} />
// //             <Route path="support" element={<ReportProblem />} />
// //             <Route path="profile" element={<ProfilePage />} />
// //             {studentPlaceholders.map((path) => (
// //               <Route key={path} path={path} element={<ComingSoon />} />
// //             ))}
// //             <Route element={<ApprovedOnly />}>
// //               {studentApprovedPlaceholders.map((path) => (
// //                 <Route key={path} path={path} element={<ComingSoon />} />
// //               ))}
// //             </Route>
// //           </Route>
// //         </Route>
// //       </Route>

// //       {/* 6. Lecturer dashboard */}
// //       <Route path="/lecturer" element={<ProtectedRoute roles={['lecturer']} />}>
// //         <Route element={<DashboardLayout />}>
// //           <Route index element={<LecturerDashboard />} />
// //           <Route path="attendance" element={<LecturerAttendancePage />} />
// //           <Route path="grades" element={<LecturerGradesPage />} />
// //           <Route path="assignments" element={<LecturerAssignmentsPage />} />
// //           <Route path="announcements" element={<LecturerAnnouncementsPage />} />
// //           <Route path="password" element={<ChangePassword />} />
// //           <Route path="support" element={<ReportProblem />} />
// //           <Route path="profile" element={<ProfilePage />} />
// //           {lecturerPlaceholders.map((path) => (
// //             <Route key={path} path={path} element={<ComingSoon />} />
// //           ))}
// //         </Route>
// //       </Route>

// //       {/* 7. ICT dashboard */}
// //       <Route path="/ict" element={<ProtectedRoute roles={['ict']} />}>
// //         <Route element={<DashboardLayout />}>
// //           <Route index element={<IctDashboard />} />
// //           <Route path="tickets" element={<IctTicketsPage />} />
// //           <Route path="logs" element={<IctLogsPage />} />
// //           <Route path="backups" element={<IctBackupsPage />} />
// //           <Route path="password" element={<ChangePassword />} />
// //           <Route path="support" element={<ReportProblem />} />
// //           <Route path="profile" element={<ProfilePage />} />
// //           {ictPlaceholders.map((path) => (
// //             <Route key={path} path={path} element={<ComingSoon />} />
// //           ))}
// //         </Route>
// //       </Route>

// //       {/* 8. Employee dashboard */}
// //       <Route path="/employee" element={<ProtectedRoute roles={['employee']} />}>
// //         <Route element={<DashboardLayout />}>
// //           <Route index element={<EmployeeDashboard />} />
// //           <Route path="password" element={<ChangePassword />} />
// //           <Route path="support" element={<ReportProblem />} />
// //           <Route path="profile" element={<ProfilePage />} />
// //           {employeePlaceholders.map((path) => (
// //             <Route key={path} path={path} element={<ComingSoon />} />
// //           ))}
// //         </Route>
// //       </Route>
// //     </Routes>
// //   )
// // }

// // export default App

// import { Routes, Route, Navigate } from 'react-router-dom'
// import MainLayout from './layouts/MainLayout'
// import DashboardLayout from './layouts/DashboardLayout'
// import ProtectedRoute from './components/ProtectedRoute'
// import ApprovedOnly from './components/ApprovedOnly'
// import { ApplicationProvider } from './context/ApplicationProvider'
// import Home from './pages/public/Home'
// import About from './pages/public/About'
// import Contact from './pages/public/Contact'
// import Career from './pages/public/Career'
// import Team from './pages/public/Team'
// import Admission from './pages/public/Admission'
// import VideoGallery from './pages/public/VideoGallery'
// import ComingSoon from './pages/public/ComingSoon'
// import Login from './pages/auth/Login'
// import ChangePassword from './pages/auth/ChangePassword'
// import AdminDashboard from './pages/admin/AdminDashboard'
// import UsersPage from './pages/admin/UsersPage'
// import ApplicationsPage from './pages/admin/ApplicationsPage'
// import CoursesPage from './pages/admin/CoursesPage'
// import SettingsPage from './pages/admin/SettingsPage'
// import MessagesPage from './pages/admin/MessagesPage'
// import StudentHome from './pages/student/StudentHome'
// import StudentApplication from './pages/student/StudentApplication'
// import LecturerDashboard from './pages/lecturer/LecturerDashboard'
// import {
//   LecturerAnnouncementsPage,
//   LecturerAssignmentsPage,
//   LecturerAttendancePage,
//   LecturerGradesPage,
// } from './pages/lecturer/LecturerPages'
// import IctDashboard from './pages/ict/IctDashboard'
// import { IctBackupsPage, IctLogsPage, IctTicketsPage } from './pages/ict/IctPages'
// import ReportProblem from './pages/shared/ReportProblem'
// import ProfilePage from './pages/shared/ProfilePage'
// import NotificationsPage from './pages/shared/NotificationsPage'
// import StudentCourses from './pages/student/StudentCourses'
// import StudentResults from './pages/student/StudentResults'
// import StudentTimetable from './pages/student/StudentTimetable'
// import LecturerTimetable from './pages/lecturer/LecturerTimetable'
// import EmployeeDashboard from './pages/employee/EmployeeDashboard'
// import ForgotPasswordForm from './pages/auth/ForgotPassword'

// const publicPlaceholders = [
//   '/land',
//   '/wildlife',
//   '/network',
//   '/services/community',
//   '/services/innovations',
//   '/career/apply/:id',
//   '/news/:id',
//   '/help',
//   '/careerconnect',
//   '/e-learning',
// ]

// // "password" is not listed here any more: every dashboard has a real Change password page.
// const adminPlaceholders = [
//   'enrollments', 'news', 'videos',
//   'account', 'activity', 'help',
// ]
// const studentPlaceholders = ['account', 'activity', 'help']
// const lecturerPlaceholders = [
//   'courses', 'messages', 'account', 'activity', 'help',
// ]
// const ictPlaceholders = [
//   'accounts', 'security', 'server', 'database',
//   'maintenance', 'settings', 'account', 'activity', 'help',
// ]
// const employeePlaceholders = [
//   'tasks', 'attendance', 'leave', 'announcements', 'messages',
//   'account', 'activity', 'help',
// ]

// function App() {
//   return (
//     <Routes>
//       {/* 1. Auth pages: no navbar, no footer */}
//       <Route path="/login" element={<Login />} />
//       <Route path="/register" element={<Navigate to="/admission" replace />} />
//       <Route path="/forgot-password" element={<ForgotPasswordForm />} />

//       {/* 2. Forced password change: any signed-in user, no navbar, no footer */}
//       <Route element={<ProtectedRoute />}>
//         <Route path="/change-password" element={<ChangePassword standalone />} />
//       </Route>

//       {/* 3. Public website: navbar + footer only here */}
//       <Route element={<MainLayout />}>
//         <Route path="/" element={<Home />} />
//         <Route path="/about" element={<About />} />
//         <Route path="/contact" element={<Contact />} />
//         <Route path="/career" element={<Career />} />
//         <Route path="/team" element={<Team />} />
//         <Route path="/admission" element={<Admission />} />
//         <Route path="/video-gallery" element={<VideoGallery />} />
//         {publicPlaceholders.map((path) => (
//           <Route key={path} path={path} element={<ComingSoon />} />
//         ))}
//       </Route>

//       {/* 4. Admin dashboard */}
//       <Route path="/admin" element={<ProtectedRoute roles={['admin']} />}>
//         <Route element={<DashboardLayout />}>
//           <Route index element={<AdminDashboard />} />
//           <Route path="users" element={<UsersPage key="all" />} />
//           <Route path="students" element={<UsersPage key="student" fixedRole="student" />} />
//           <Route path="lecturers" element={<UsersPage key="lecturer" fixedRole="lecturer" />} />
//           <Route path="employees" element={<UsersPage key="employee" fixedRole="employee" />} />
//           <Route path="applications" element={<ApplicationsPage />} />
//           <Route path="courses" element={<CoursesPage />} />
//           <Route path="settings" element={<SettingsPage />} />
//           <Route path="messages" element={<MessagesPage />} />
//           <Route path="password" element={<ChangePassword />} />
//           <Route path="support" element={<ReportProblem />} />
//           <Route path="profile" element={<ProfilePage />} />
//           <Route path="notifications" element={<NotificationsPage />} />
//           {adminPlaceholders.map((path) => (
//             <Route key={path} path={path} element={<ComingSoon />} />
//           ))}
//         </Route>
//       </Route>

//       {/* 5. Student dashboard */}
//       <Route path="/student" element={<ProtectedRoute roles={['student']} />}>
//         <Route element={<ApplicationProvider />}>
//           <Route element={<DashboardLayout />}>
//             <Route index element={<StudentHome />} />
//             <Route path="application" element={<StudentApplication />} />
//             <Route path="password" element={<ChangePassword />} />
//             <Route path="support" element={<ReportProblem />} />
//             <Route path="profile" element={<ProfilePage />} />
//             <Route path="notifications" element={<NotificationsPage />} />
//             {studentPlaceholders.map((path) => (
//               <Route key={path} path={path} element={<ComingSoon />} />
//             ))}
//             <Route element={<ApprovedOnly />}>
//               <Route path="courses" element={<StudentCourses />} />
//               <Route path="results" element={<StudentResults />} />
//               <Route path="timetable" element={<StudentTimetable />} />
//             </Route>
//           </Route>
//         </Route>
//       </Route>

//       {/* 6. Lecturer dashboard */}
//       <Route path="/lecturer" element={<ProtectedRoute roles={['lecturer']} />}>
//         <Route element={<DashboardLayout />}>
//           <Route index element={<LecturerDashboard />} />
//           <Route path="attendance" element={<LecturerAttendancePage />} />
//           <Route path="grades" element={<LecturerGradesPage />} />
//           <Route path="assignments" element={<LecturerAssignmentsPage />} />
//           <Route path="announcements" element={<LecturerAnnouncementsPage />} />
//           <Route path="timetable" element={<LecturerTimetable />} />
//           <Route path="password" element={<ChangePassword />} />
//           <Route path="support" element={<ReportProblem />} />
//           <Route path="profile" element={<ProfilePage />} />
//           <Route path="notifications" element={<NotificationsPage />} />
//           {lecturerPlaceholders.map((path) => (
//             <Route key={path} path={path} element={<ComingSoon />} />
//           ))}
//         </Route>
//       </Route>

//       {/* 7. ICT dashboard */}
//       <Route path="/ict" element={<ProtectedRoute roles={['ict']} />}>
//         <Route element={<DashboardLayout />}>
//           <Route index element={<IctDashboard />} />
//           <Route path="tickets" element={<IctTicketsPage />} />
//           <Route path="logs" element={<IctLogsPage />} />
//           <Route path="backups" element={<IctBackupsPage />} />
//           <Route path="password" element={<ChangePassword />} />
//           <Route path="support" element={<ReportProblem />} />
//           <Route path="profile" element={<ProfilePage />} />
//           <Route path="notifications" element={<NotificationsPage />} />
//           {ictPlaceholders.map((path) => (
//             <Route key={path} path={path} element={<ComingSoon />} />
//           ))}
//         </Route>
//       </Route>

//       {/* 8. Employee dashboard */}
//       <Route path="/employee" element={<ProtectedRoute roles={['employee']} />}>
//         <Route element={<DashboardLayout />}>
//           <Route index element={<EmployeeDashboard />} />
//           <Route path="password" element={<ChangePassword />} />
//           <Route path="support" element={<ReportProblem />} />
//           <Route path="profile" element={<ProfilePage />} />
//           <Route path="notifications" element={<NotificationsPage />} />
//           {employeePlaceholders.map((path) => (
//             <Route key={path} path={path} element={<ComingSoon />} />
//           ))}
//         </Route>
//       </Route>
//     </Routes>
//   )
// }

// export default App

import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import ApprovedOnly from './components/ApprovedOnly'
import { ApplicationProvider } from './context/ApplicationProvider'
import Home from './pages/public/Home'
import About from './pages/public/About'
import Contact from './pages/public/Contact'
import Career from './pages/public/Career'
import Team from './pages/public/Team'
import Admission from './pages/public/Admission'
import VideoGallery from './pages/public/VideoGallery'
import ComingSoon from './pages/public/ComingSoon'
import Login from './pages/auth/Login'
import ChangePassword from './pages/auth/ChangePassword'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import AdminDashboard from './pages/admin/AdminDashboard'
import UsersPage from './pages/admin/UsersPage'
import ApplicationsPage from './pages/admin/ApplicationsPage'
import CoursesPage from './pages/admin/CoursesPage'
import SettingsPage from './pages/admin/SettingsPage'
import MessagesPage from './pages/admin/MessagesPage'
import StudentHome from './pages/student/StudentHome'
import StudentApplication from './pages/student/StudentApplication'
import LecturerDashboard from './pages/lecturer/LecturerDashboard'
import {
  LecturerAnnouncementsPage,
  LecturerAssignmentsPage,
  LecturerAttendancePage,
  LecturerGradesPage,
} from './pages/lecturer/LecturerPages'
import IctDashboard from './pages/ict/IctDashboard'
import { IctBackupsPage, IctLogsPage, IctTicketsPage } from './pages/ict/IctPages'
import ReportProblem from './pages/shared/ReportProblem'
import ProfilePage from './pages/shared/ProfilePage'
import NotificationsPage from './pages/shared/NotificationsPage'
import StudentCourses from './pages/student/StudentCourses'
import StudentResults from './pages/student/StudentResults'
import StudentTimetable from './pages/student/StudentTimetable'
import LecturerTimetable from './pages/lecturer/LecturerTimetable'
import EmployeeDashboard from './pages/employee/EmployeeDashboard'

const publicPlaceholders = [
  '/land',
  '/wildlife',
  '/network',
  '/services/community',
  '/services/innovations',
  '/career/apply/:id',
  '/news/:id',
  '/help',
]

// "password" is not listed here any more: every dashboard has a real Change password page.
const adminPlaceholders = [
  'enrollments', 'news', 'videos',
  'account', 'activity', 'help',
]
const studentPlaceholders = ['account', 'activity', 'help']
const lecturerPlaceholders = [
  'courses', 'messages', 'account', 'activity', 'help',
]
const ictPlaceholders = [
  'accounts', 'security', 'server', 'database',
  'maintenance', 'settings', 'account', 'activity', 'help',
]
const employeePlaceholders = [
  'tasks', 'attendance', 'leave', 'announcements', 'messages',
  'account', 'activity', 'help',
]

function App() {
  return (
    <Routes>
      {/* 1. Auth pages: no navbar, no footer */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/register" element={<Navigate to="/admission" replace />} />

      {/* 2. Forced password change: any signed-in user, no navbar, no footer */}
      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangePassword standalone />} />
      </Route>

      {/* 3. Public website: navbar + footer only here */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/career" element={<Career />} />
        <Route path="/team" element={<Team />} />
        <Route path="/admission" element={<Admission />} />
        <Route path="/video-gallery" element={<VideoGallery />} />
        {publicPlaceholders.map((path) => (
          <Route key={path} path={path} element={<ComingSoon />} />
        ))}
      </Route>

      {/* 4. Admin dashboard */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersPage key="all" />} />
          <Route path="students" element={<UsersPage key="student" fixedRole="student" />} />
          <Route path="lecturers" element={<UsersPage key="lecturer" fixedRole="lecturer" />} />
          <Route path="employees" element={<UsersPage key="employee" fixedRole="employee" />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="password" element={<ChangePassword />} />
          <Route path="support" element={<ReportProblem />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          {adminPlaceholders.map((path) => (
            <Route key={path} path={path} element={<ComingSoon />} />
          ))}
        </Route>
      </Route>

      {/* 5. Student dashboard */}
      <Route path="/student" element={<ProtectedRoute roles={['student']} />}>
        <Route element={<ApplicationProvider />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<StudentHome />} />
            <Route path="application" element={<StudentApplication />} />
            <Route path="password" element={<ChangePassword />} />
            <Route path="support" element={<ReportProblem />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            {studentPlaceholders.map((path) => (
              <Route key={path} path={path} element={<ComingSoon />} />
            ))}
            <Route element={<ApprovedOnly />}>
              <Route path="courses" element={<StudentCourses />} />
              <Route path="results" element={<StudentResults />} />
              <Route path="timetable" element={<StudentTimetable />} />
            </Route>
          </Route>
        </Route>
      </Route>

      {/* 6. Lecturer dashboard */}
      <Route path="/lecturer" element={<ProtectedRoute roles={['lecturer']} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<LecturerDashboard />} />
          <Route path="attendance" element={<LecturerAttendancePage />} />
          <Route path="grades" element={<LecturerGradesPage />} />
          <Route path="assignments" element={<LecturerAssignmentsPage />} />
          <Route path="announcements" element={<LecturerAnnouncementsPage />} />
          <Route path="timetable" element={<LecturerTimetable />} />
          <Route path="password" element={<ChangePassword />} />
          <Route path="support" element={<ReportProblem />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          {lecturerPlaceholders.map((path) => (
            <Route key={path} path={path} element={<ComingSoon />} />
          ))}
        </Route>
      </Route>

      {/* 7. ICT dashboard */}
      <Route path="/ict" element={<ProtectedRoute roles={['ict']} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<IctDashboard />} />
          <Route path="tickets" element={<IctTicketsPage />} />
          <Route path="logs" element={<IctLogsPage />} />
          <Route path="backups" element={<IctBackupsPage />} />
          <Route path="password" element={<ChangePassword />} />
          <Route path="support" element={<ReportProblem />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          {ictPlaceholders.map((path) => (
            <Route key={path} path={path} element={<ComingSoon />} />
          ))}
        </Route>
      </Route>

      {/* 8. Employee dashboard */}
      <Route path="/employee" element={<ProtectedRoute roles={['employee']} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<EmployeeDashboard />} />
          <Route path="password" element={<ChangePassword />} />
          <Route path="support" element={<ReportProblem />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          {employeePlaceholders.map((path) => (
            <Route key={path} path={path} element={<ComingSoon />} />
          ))}
        </Route>
      </Route>
    </Routes>
  )
}

export default App
