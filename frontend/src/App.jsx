import './tailwind.css'
import Navbar from './components/navbar/MainNavbar'
import LoginRegister from './pages/LoginRegister'
import MainLandingPage from './pages/MainLandingPage'
import Footer from './components/Footer'
import ContactUs from './pages/ContactUs'
import HowDoWeWork from './pages/HowDoWeWork'

import {createBrowserRouter, RouterProvider} from 'react-router-dom'
import Projects from './pages/Projects'
import StartAProject from './pages/StartAProject'
import NewProjectDetails from './pages/NewProjectDetails'
import MyProjects from './components/MyProject'
//import Profile from './pages/Profile'
import Network from './pages/Network'
import BrowseProjects from './pages/BrowseProjects'
// import BrowseProjectsStatic from './pages/BrowseProjectsStatic'
import MemberNavbar from './components/navbar/MemberNavbar'
import MyInvestments from './pages/MyInvestments'
import ProjectDescription from './pages/ProjectDescription'
import Wallet from './pages/Wallet'
import ViewMyCampaigns from './pages/ViewMyCampaigns'
//import SelectAmount from './pages/SelectAmount'
//import ConfirmAmount from './pages/ConfirmAmount'
//import PaymentFailed from './pages/PaymentFailed'
//import MessageBar from './pages/MessageBar'


const router = createBrowserRouter([
  {
    path: '/',
    element: <><Navbar /><MainLandingPage /><Footer/></>
  },
  {
    path: '/login',
    element: <><Navbar /><LoginRegister /><Footer/></>
  },
  {
    path: '/howdowework',
    element: <><Navbar /><HowDoWeWork/><Footer/></>
  },
  {
    path: '/contactus',
    element: <><Navbar /><ContactUs /><Footer/></>
  },



  {/*Member pages*/},
  {
    path: '/member/home',
    element: <><MemberNavbar /><MainLandingPage /><Footer /></>
  },
  {
    path: '/member/browseprojects',
    element: <><MemberNavbar /><BrowseProjects /><Footer /></>
  },
  {
    path: '/member/myinvestments',
    element: <><MemberNavbar /><MyInvestments /><Footer /></>
  },
  // {
  //   path: '/member/browseprojectsstatic',
  //   element: <><MemberNavbar /><BrowseProjectsStatic /><Footer /></>
  // },
  {
    path: '/member/projectdescription',
    element: <><MemberNavbar /><ProjectDescription /><Footer /></>
  },
  // {
  //   path: '/member/selectamount',
  //   element: <><MemberNavbar /><SelectAmount /><Footer /></>
  // },
  // {
  //   path: '/member/confirmamount',
  //   element: <><MemberNavbar /><ConfirmAmount /><Footer /></>
  // },
  {
    path: '/member/startaproject',
    element: <><MemberNavbar /><StartAProject /><Footer /></>
  },
  {
    path: '/member/newprojectdetails',
    element: <><MemberNavbar /><NewProjectDetails /><Footer /></>
  },
  {
    path: '/member/myprojects',
    element: <><MemberNavbar /><MyProjects /><Footer /></>
  },
  {
    path: '/member/projects',
    element: <><MemberNavbar /><Projects /><Footer /></>
  },
  {
    path: '/member/viewmycampaigns',
    element: <><MemberNavbar /><ViewMyCampaigns /><Footer /></>
  },
  // {
  //   path: '/member/profile',
  //   element: <><MemberNavbar /><Profile /><Footer /></>
  // },
  {
    path: '/member/network',
    element: <><MemberNavbar /><Network /><Footer /></>
  },
  {
    path: '/member/wallet',
    element: <><MemberNavbar /><Wallet /><Footer /></>
  },
])



function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;