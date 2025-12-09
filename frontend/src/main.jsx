import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import {Provider} from 'react-redux'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import  store from './store/store.js'
import './App.css'
import Home from './pages/Home.jsx';
import AuthLayout from './components/AuthLayout.jsx';
import Signup from './pages/Signup.jsx';
import LogIn from './pages/Login.jsx';
import ReportIssue from './pages/ReportIssue.jsx';
import Unauthorized from './pages/Unauthorized.jsx';
import LiveIssues from './pages/LiveIssues.jsx';
import RoleGuard from './components/RoleGuard.jsx';
import ManageIssues from './pages/ManageIssues.jsx';
import IssueDetail from './pages/IssueDetail.jsx';
import MyIssues from './pages/MyIssues.jsx';
// New Features
import AnalyticsDashboard from './pages/AnalyticsDashboard.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import WorkerApp from './pages/WorkerApp.jsx';


const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <Home />
      },
      {
        path: '/signup',
        element: <AuthLayout authentication={false}>
          <Signup />
        </AuthLayout>
      },
      {
        path: '/login',
        element: <AuthLayout authentication={false}>
          <LogIn />
        </AuthLayout>
      },
      {
        path: '/unauthorized',
        element: <Unauthorized />
      },
      {
        path: '/repoissue',
        element: <AuthLayout authentication={true}>
          <RoleGuard allowedRoles={['citizen']}>
            <ReportIssue />
          </RoleGuard>
        </AuthLayout>
      },
      {
        path: '/liveissues',
        element: <AuthLayout authentication={true}>
          <RoleGuard allowedRoles={['citizen', 'official']}>
            <LiveIssues />
          </RoleGuard>
        </AuthLayout>
      },
      {
        path: '/manage-issues',
        element: <AuthLayout authentication={true}>
          <RoleGuard allowedRoles={['official']}>
            <ManageIssues />
          </RoleGuard>
        </AuthLayout>
      },
      {
        path: '/my-issues',
        element: <AuthLayout authentication={true}>
          <RoleGuard allowedRoles={['citizen']}>
            <MyIssues />
          </RoleGuard>
        </AuthLayout>
      },
      {
        path: '/issues/:issueId',
        element: <AuthLayout authentication={true}>
          <RoleGuard allowedRoles={['citizen', 'official']}>
            <IssueDetail />
          </RoleGuard>
        </AuthLayout>
      },
      // New Features Routes
      {
        path: '/analytics',
        element: <AuthLayout authentication={true}>
          <RoleGuard allowedRoles={['official']}>
            <AnalyticsDashboard />
          </RoleGuard>
        </AuthLayout>
      },
      {
        path: '/leaderboard',
        element: <AuthLayout authentication={true}>
          <RoleGuard allowedRoles={['citizen', 'official']}>
            <Leaderboard />
          </RoleGuard>
        </AuthLayout>
      },
      {
        path: '/worker-app',
        element: <AuthLayout authentication={true}>
          <RoleGuard allowedRoles={['official']}>
            <WorkerApp />
          </RoleGuard>
        </AuthLayout>
      },
      
    ]
  }
])

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
);
