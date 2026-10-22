// // // // import { Routes, Route, Navigate } from 'react-router-dom'
// // // // import MainLayout from './layouts/MainLayout'
// // // // import DashboardLayout from './layouts/DashboardLayout'
// // // // import ProtectedRoute from './components/ProtectedRoute'
// // // // import ApprovedOnly from './components/ApprovedOnly'
// // // // import { ApplicationProvider } from './context/ApplicationProvider'
// // // // import Home from './pages/public/Home'
// // // // import About from './pages/public/About'
// // // // import Contact from './pages/public/Contact'
// // // // import Career from './pages/public/Career'
// // // // import Team from './pages/public/Team'
// // // // import Admission from './pages/public/Admission'
// // // // import VideoGallery from './pages/public/VideoGallery'
// // // // import ComingSoon from './pages/public/ComingSoon'
// // // // import Login from './pages/auth/Login'
// // // // import AdminDashboard from './pages/admin/AdminDashboard'
// // // // import StudentHome from './pages/student/StudentHome'
// // // // import StudentApplication from './pages/student/StudentApplication'
// // // // import LecturerDashboard from './pages/lecturer/LecturerDashboard'
// // // // import IctDashboard from './pages/ict/IctDashboard'
// // // // import EmployeeDashboard from './pages/employee/EmployeeDashboard'
// // // // import UsersPage from './pages/admin/UsersPage'

// // // // const publicPlaceholders = [
// // // //   '/land',
// // // //   '/wildlife',
// // // //   '/network',
// // // //   '/services/community',
// // // //   '/services/innovations',
// // // //   '/career/apply/:id',
// // // //   '/news/:id',
// // // //   '/forgot-password',
// // // //   '/help',
// // // //   '/ict',
// // // // ]

// // // // const adminPlaceholders = [
// // // //   'courses', 'enrollments',
// // // //   'news', 'videos', 'applications', 'messages', 'settings',
// // // //   'profile', 'account', 'password', 'activity', 'help',
// // // // ]

// // // // const studentPlaceholders = ['notifications', 'profile', 'account', 'password', 'activity', 'help']
// // // // const studentApprovedPlaceholders = ['courses', 'timetable', 'results']

// // // // const lecturerPlaceholders = [
// // // //   'courses', 'attendance', 'assignments', 'grades', 'announcements',
// // // //   'messages', 'timetable', 'profile', 'account', 'password', 'activity', 'help',
// // // // ]
// // // // const ictPlaceholders = [
// // // //   'tickets', 'logs', 'backups', 'accounts', 'security', 'server', 'database',
// // // //   'maintenance', 'settings', 'profile', 'account', 'password', 'activity', 'help',
// // // // ]
// // // // const employeePlaceholders = [
// // // //   'tasks', 'attendance', 'leave', 'announcements', 'messages', 'support',
// // // //   'profile', 'account', 'password', 'activity', 'help',
// // // // ]

// // // // function App() {
// // // //   return (
// // // //     <Routes>
// // // //       {/* 1. Auth pages: no navbar, no footer */}
// // // //       <Route path="/login" element={<Login />} />
// // // //       <Route path="/register" element={<Navigate to="/admission" replace />} />

// // // //       {/* 2. Public website: navbar + footer only here */}
// // // //       <Route element={<MainLayout />}>
// // // //         <Route path="/" element={<Home />} />
// // // //         <Route path="/about" element={<About />} />
// // // //         <Route path="/contact" element={<Contact />} />
// // // //         <Route path="/career" element={<Career />} />
// // // //         <Route path="/team" element={<Team />} />
// // // //         <Route path="/admission" element={<Admission />} />
// // // //         <Route path="/video-gallery" element={<VideoGallery />} />
// // // //         {publicPlaceholders.map((path) => (
// // // //           <Route key={path} path={path} element={<ComingSoon />} />
// // // //         ))}
// // // //       </Route>

// // // //       {/* 3. Admin dashboard */}
// // // //       <Route path="/admin" element={<ProtectedRoute roles={['admin']} />}>
// // // //         <Route element={<DashboardLayout />}>
// // // //           <Route index element={<AdminDashboard />} />
// // // //           <Route path="users" element={<UsersPage key="all" />} />
// // // //           <Route path="students" element={<UsersPage key="student" fixedRole="student" />} />
// // // //           <Route path="lecturers" element={<UsersPage key="lecturer" fixedRole="lecturer" />} />
// // // //           <Route path="employees" element={<UsersPage key="employee" fixedRole="employee" />} />
// // // //           {adminPlaceholders.map((path) => (
// // // //             <Route key={path} path={path} element={<ComingSoon />} />
// // // //           ))}
// // // //         </Route>
// // // //       </Route>

// // // //       {/* 4. Student dashboard */}
// // // //       <Route path="/student" element={<ProtectedRoute roles={['student']} />}>
// // // //         <Route element={<ApplicationProvider />}>
// // // //           <Route element={<DashboardLayout />}>
// // // //             <Route index element={<StudentHome />} />
// // // //             <Route path="application" element={<StudentApplication />} />
// // // //             {studentPlaceholders.map((path) => (
// // // //               <Route key={path} path={path} element={<ComingSoon />} />
// // // //             ))}
// // // //             <Route element={<ApprovedOnly />}>
// // // //               {studentApprovedPlaceholders.map((path) => (
// // // //                 <Route key={path} path={path} element={<ComingSoon />} />
// // // //               ))}
// // // //             </Route>
// // // //           </Route>
// // // //         </Route>
// // // //       </Route>

// // // //       {/* 5. Lecturer dashboard */}
// // // //       <Route path="/lecturer" element={<ProtectedRoute roles={['lecturer']} />}>
// // // //         <Route element={<DashboardLayout />}>
// // // //           <Route index element={<LecturerDashboard />} />
// // // //           {lecturerPlaceholders.map((path) => (
// // // //             <Route key={path} path={path} element={<ComingSoon />} />
// // // //           ))}
// // // //         </Route>
// // // //       </Route>

// // // //       {/* 6. ICT dashboard */}
// // // //       <Route path="/ict" element={<ProtectedRoute roles={['ict']} />}>
// // // //         <Route element={<DashboardLayout />}>
// // // //           <Route index element={<IctDashboard />} />
// // // //           {ictPlaceholders.map((path) => (
// // // //             <Route key={path} path={path} element={<ComingSoon />} />
// // // //           ))}
// // // //         </Route>
// // // //       </Route>
// // // //       {/* 7. Employee dashboard */}
// // // //       <Route path="/employee" element={<ProtectedRoute roles={['employee']} />}>
// // // //         <Route element={<DashboardLayout />}>
// // // //           <Route index element={<EmployeeDashboard />} />
// // // //           {employeePlaceholders.map((path) => (
// // // //             <Route key={path} path={path} element={<ComingSoon />} />
// // // //           ))}
// // // //         </Route>
// // // //       </Route>
// // // //     </Routes>

// // // //   )

// // // // }

// // // // export default App
// // // import { Routes, Route, Navigate } from 'react-router-dom'
// // // import MainLayout from './layouts/MainLayout'
// // // import DashboardLayout from './layouts/DashboardLayout'
// // // import ProtectedRoute from './components/ProtectedRoute'
// // // import ApprovedOnly from './components/ApprovedOnly'
// // // import { ApplicationProvider } from './context/ApplicationProvider'
// // // import Home from './pages/public/Home'
// // // import About from './pages/public/About'
// // // import Contact from './pages/public/Contact'
// // // import Career from './pages/public/Career'
// // // import Team from './pages/public/Team'
// // // import Admission from './pages/public/Admission'
// // // import VideoGallery from './pages/public/VideoGallery'
// // // import ComingSoon from './pages/public/ComingSoon'
// // // import Login from './pages/auth/Login'
// // // import ChangePassword from './pages/auth/ChangePassword'
// // // import AdminDashboard from './pages/admin/AdminDashboard'
// // // import UsersPage from './pages/admin/UsersPage'
// // // import StudentHome from './pages/student/StudentHome'
// // // import StudentApplication from './pages/student/StudentApplication'
// // // import LecturerDashboard from './pages/lecturer/LecturerDashboard'
// // // import IctDashboard from './pages/ict/IctDashboard'
// // // import EmployeeDashboard from './pages/employee/EmployeeDashboard'
// // // import ApplicationsPage from './pages/admin/ApplicationsPage'

// // // const publicPlaceholders = [
// // //   '/land',
// // //   '/wildlife',
// // //   '/network',
// // //   '/services/community',
// // //   '/services/innovations',
// // //   '/career/apply/:id',
// // //   '/news/:id',
// // //   '/forgot-password',
// // //   '/help',
// // // ]

// // // // "password" is not listed here any more: every dashboard has a real Change password page.
// // // const adminPlaceholders = [
// // //   'courses', 'enrollments', 'news', 'videos', 'messages', 'settings',
// // //   'profile', 'account', 'activity', 'help',
// // // ]
// // // const studentPlaceholders = ['notifications', 'profile', 'account', 'activity', 'help']
// // // const studentApprovedPlaceholders = ['courses', 'timetable', 'results']
// // // const lecturerPlaceholders = [
// // //   'courses', 'attendance', 'assignments', 'grades', 'announcements',
// // //   'messages', 'timetable', 'profile', 'account', 'activity', 'help',
// // // ]
// // // const ictPlaceholders = [
// // //   'tickets', 'logs', 'backups', 'accounts', 'security', 'server', 'database',
// // //   'maintenance', 'settings', 'profile', 'account', 'activity', 'help',
// // // ]
// // // const employeePlaceholders = [
// // //   'tasks', 'attendance', 'leave', 'announcements', 'messages', 'support',
// // //   'profile', 'account', 'activity', 'help',
// // // ]

// // // function App() {
// // //   return (
// // //     <Routes>
// // //       {/* 1. Auth pages: no navbar, no footer */}
// // //       <Route path="/login" element={<Login />} />
// // //       <Route path="/register" element={<Navigate to="/admission" replace />} />

// // //       {/* 2. Forced password change: any signed-in user, no navbar, no footer */}
// // //       <Route element={<ProtectedRoute />}>
// // //         <Route path="/change-password" element={<ChangePassword standalone />} />
// // //       </Route>

// // //       {/* 3. Public website: navbar + footer only here */}
// // //       <Route element={<MainLayout />}>
// // //         <Route path="/" element={<Home />} />
// // //         <Route path="/about" element={<About />} />
// // //         <Route path="/contact" element={<Contact />} />
// // //         <Route path="/career" element={<Career />} />
// // //         <Route path="/team" element={<Team />} />
// // //         <Route path="/admission" element={<Admission />} />
// // //         <Route path="/video-gallery" element={<VideoGallery />} />
// // //         {publicPlaceholders.map((path) => (
// // //           <Route key={path} path={path} element={<ComingSoon />} />
// // //         ))}
// // //       </Route>

// // //       {/* 4. Admin dashboard */}
// // //       <Route path="/admin" element={<ProtectedRoute roles={['admin']} />}>
// // //         <Route element={<DashboardLayout />}>
// // //           <Route index element={<AdminDashboard />} />
// // //           <Route path="users" element={<UsersPage key="all" />} />
// // //           <Route path="students" element={<UsersPage key="student" fixedRole="student" />} />
// // //           <Route path="lecturers" element={<UsersPage key="lecturer" fixedRole="lecturer" />} />
// // //           <Route path="employees" element={<UsersPage key="employee" fixedRole="employee" />} />
// // //           <Route path="password" element={<ChangePassword />} />
// // //           <Route path="applications" element={<ApplicationsPage />} />
// // //           {adminPlaceholders.map((path) => (
// // //             <Route key={path} path={path} element={<ComingSoon />} />
// // //           ))}
// // //         </Route>
// // //       </Route>

// // //       {/* 5. Student dashboard */}
// // //       <Route path="/student" element={<ProtectedRoute roles={['student']} />}>
// // //         <Route element={<ApplicationProvider />}>
// // //           <Route element={<DashboardLayout />}>
// // //             <Route index element={<StudentHome />} />
// // //             <Route path="application" element={<StudentApplication />} />
// // //             <Route path="password" element={<ChangePassword />} />
// // //             {studentPlaceholders.map((path) => (
// // //               <Route key={path} path={path} element={<ComingSoon />} />
// // //             ))}
// // //             <Route element={<ApprovedOnly />}>
// // //               {studentApprovedPlaceholders.map((path) => (
// // //                 <Route key={path} path={path} element={<ComingSoon />} />
// // //               ))}
// // //             </Route>
// // //           </Route>
// // //         </Route>
// // //       </Route>

// // //       {/* 6. Lecturer dashboard */}
// // //       <Route path="/lecturer" element={<ProtectedRoute roles={['lecturer']} />}>
// // //         <Route element={<DashboardLayout />}>
// // //           <Route index element={<LecturerDashboard />} />
// // //           <Route path="password" element={<ChangePassword />} />
// // //           {lecturerPlaceholders.map((path) => (
// // //             <Route key={path} path={path} element={<ComingSoon />} />
// // //           ))}
// // //         </Route>
// // //       </Route>

// // //       {/* 7. ICT dashboard */}
// // //       <Route path="/ict" element={<ProtectedRoute roles={['ict']} />}>
// // //         <Route element={<DashboardLayout />}>
// // //           <Route index element={<IctDashboard />} />
// // //           <Route path="password" element={<ChangePassword />} />
// // //           {ictPlaceholders.map((path) => (
// // //             <Route key={path} path={path} element={<ComingSoon />} />
// // //           ))}
// // //         </Route>
// // //       </Route>

// // //       {/* 8. Employee dashboard */}
// // //       <Route path="/employee" element={<ProtectedRoute roles={['employee']} />}>
// // //         <Route element={<DashboardLayout />}>
// // //           <Route index element={<EmployeeDashboard />} />
// // //           <Route path="password" element={<ChangePassword />} />
// // //           {employeePlaceholders.map((path) => (
// // //             <Route key={path} path={path} element={<ComingSoon />} />
// // //           ))}
// // //         </Route>
// // //       </Route>
// // //     </Routes>
// // //   )
// // // }

// // // export default App
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
// // import StudentHome from './pages/student/StudentHome'
// // import StudentApplication from './pages/student/StudentApplication'
// // import LecturerDashboard from './pages/lecturer/LecturerDashboard'
// // import IctDashboard from './pages/ict/IctDashboard'
// // import { IctBackupsPage, IctLogsPage, IctTicketsPage } from './pages/ict/IctPages'
// // import ReportProblem from './pages/shared/ReportProblem'
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
// //   'courses', 'enrollments', 'news', 'videos', 'messages', 'settings',
// //   'profile', 'account', 'activity', 'help',
// // ]
// // const studentPlaceholders = ['notifications', 'profile', 'account', 'activity', 'help']
// // const studentApprovedPlaceholders = ['courses', 'timetable', 'results']
// // const lecturerPlaceholders = [
// //   'courses', 'attendance', 'assignments', 'grades', 'announcements',
// //   'messages', 'timetable', 'profile', 'account', 'activity', 'help',
// // ]
// // const ictPlaceholders = [
// //   'accounts', 'security', 'server', 'database',
// //   'maintenance', 'settings', 'profile', 'account', 'activity', 'help',
// // ]
// // const employeePlaceholders = [
// //   'tasks', 'attendance', 'leave', 'announcements', 'messages',
// //   'profile', 'account', 'activity', 'help',
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
// //           <Route path="password" element={<ChangePassword />} />
// //           <Route path="support" element={<ReportProblem />} />
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
// //           <Route path="password" element={<ChangePassword />} />
// //           <Route path="support" element={<ReportProblem />} />
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
// import StudentHome from './pages/student/StudentHome'
// import StudentApplication from './pages/student/StudentApplication'
// import LecturerDashboard from './pages/lecturer/LecturerDashboard'
// import IctDashboard from './pages/ict/IctDashboard'
// import { IctBackupsPage, IctLogsPage, IctTicketsPage } from './pages/ict/IctPages'
// import ReportProblem from './pages/shared/ReportProblem'
// import EmployeeDashboard from './pages/employee/EmployeeDashboard'

// const publicPlaceholders = [
//   '/land',
//   '/wildlife',
//   '/network',
//   '/services/community',
//   '/services/innovations',
//   '/career/apply/:id',
//   '/news/:id',
//   '/forgot-password',
//   '/help',
// ]

// // "password" is not listed here any more: every dashboard has a real Change password page.
// const adminPlaceholders = [
//   'enrollments', 'news', 'videos', 'messages',
//   'profile', 'account', 'activity', 'help',
// ]
// const studentPlaceholders = ['notifications', 'profile', 'account', 'activity', 'help']
// const studentApprovedPlaceholders = ['courses', 'timetable', 'results']
// const lecturerPlaceholders = [
//   'courses', 'attendance', 'assignments', 'grades', 'announcements',
//   'messages', 'timetable', 'profile', 'account', 'activity', 'help',
// ]
// const ictPlaceholders = [
//   'accounts', 'security', 'server', 'database',
//   'maintenance', 'settings', 'profile', 'account', 'activity', 'help',
// ]
// const employeePlaceholders = [
//   'tasks', 'attendance', 'leave', 'announcements', 'messages',
//   'profile', 'account', 'activity', 'help',
// ]

// function App() {
//   return (
//     <Routes>
//       {/* 1. Auth pages: no navbar, no footer */}
//       <Route path="/login" element={<Login />} />
//       <Route path="/register" element={<Navigate to="/admission" replace />} />

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
//           <Route path="password" element={<ChangePassword />} />
//           <Route path="support" element={<ReportProblem />} />
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
//             {studentPlaceholders.map((path) => (
//               <Route key={path} path={path} element={<ComingSoon />} />
//             ))}
//             <Route element={<ApprovedOnly />}>
//               {studentApprovedPlaceholders.map((path) => (
//                 <Route key={path} path={path} element={<ComingSoon />} />
//               ))}
//             </Route>
//           </Route>
//         </Route>
//       </Route>

//       {/* 6. Lecturer dashboard */}
//       <Route path="/lecturer" element={<ProtectedRoute roles={['lecturer']} />}>
//         <Route element={<DashboardLayout />}>
//           <Route index element={<LecturerDashboard />} />
//           <Route path="password" element={<ChangePassword />} />
//           <Route path="support" element={<ReportProblem />} />
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
import AdminDashboard from './pages/admin/AdminDashboard'
import UsersPage from './pages/admin/UsersPage'
import ApplicationsPage from './pages/admin/ApplicationsPage'
import CoursesPage from './pages/admin/CoursesPage'
import SettingsPage from './pages/admin/SettingsPage'
import MessagesPage from './pages/admin/MessagesPage'
import StudentHome from './pages/student/StudentHome'
import StudentApplication from './pages/student/StudentApplication'
import LecturerDashboard from './pages/lecturer/LecturerDashboard'
import IctDashboard from './pages/ict/IctDashboard'
import { IctBackupsPage, IctLogsPage, IctTicketsPage } from './pages/ict/IctPages'
import ReportProblem from './pages/shared/ReportProblem'
import EmployeeDashboard from './pages/employee/EmployeeDashboard'

const publicPlaceholders = [
  '/land',
  '/wildlife',
  '/network',
  '/services/community',
  '/services/innovations',
  '/career/apply/:id',
  '/news/:id',
  '/forgot-password',
  '/help',
  '/careerconnect',
]

// "password" is not listed here any more: every dashboard has a real Change password page.
const adminPlaceholders = [
  'enrollments', 'news', 'videos',
  'profile', 'account', 'activity', 'help',
]
const studentPlaceholders = ['notifications', 'profile', 'account', 'activity', 'help']
const studentApprovedPlaceholders = ['courses', 'timetable', 'results']
const lecturerPlaceholders = [
  'courses', 'attendance', 'assignments', 'grades', 'announcements',
  'messages', 'timetable', 'profile', 'account', 'activity', 'help',
]
const ictPlaceholders = [
  'accounts', 'security', 'server', 'database',
  'maintenance', 'settings', 'profile', 'account', 'activity', 'help',
]
const employeePlaceholders = [
  'tasks', 'attendance', 'leave', 'announcements', 'messages',
  'profile', 'account', 'activity', 'help',
]

function App() {
  return (
    <Routes>
      {/* 1. Auth pages: no navbar, no footer */}
      <Route path="/login" element={<Login />} />
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
            {studentPlaceholders.map((path) => (
              <Route key={path} path={path} element={<ComingSoon />} />
            ))}
            <Route element={<ApprovedOnly />}>
              {studentApprovedPlaceholders.map((path) => (
                <Route key={path} path={path} element={<ComingSoon />} />
              ))}
            </Route>
          </Route>
        </Route>
      </Route>

      {/* 6. Lecturer dashboard */}
      <Route path="/lecturer" element={<ProtectedRoute roles={['lecturer']} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<LecturerDashboard />} />
          <Route path="password" element={<ChangePassword />} />
          <Route path="support" element={<ReportProblem />} />
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
          {employeePlaceholders.map((path) => (
            <Route key={path} path={path} element={<ComingSoon />} />
          ))}
        </Route>
      </Route>
    </Routes>
  )
}

export default App
