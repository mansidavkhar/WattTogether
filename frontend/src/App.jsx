import './tailwind.css'
import Navbar from './components/navbar/MainNavbar'
import LoginRegister from './pages/LoginRegister'
import MainLandingPage from './pages/MainLandingPage'
import Footer from './components/Footer'
import ContactUs from './pages/ContactUs'
import HowDoWeWork from './pages/HowDoWeWork'

import {createBrowserRouter, RouterProvider} from 'react-router-dom'
import Projects from './pages/Projects'
import StartACampaign from './pages/StartACampaign'
import NewCampaignDetails from './pages/NewCampaignDetails'
import MyProjects from './components/MyProject'
// import Network from './pages/Network' // 🚫 Hidden - Network feature disabled for V2
import BrowseCampaigns from './pages/BrowseCampaigns'
import MemberNavbar from './components/navbar/MemberNavbar'
import MyInvestments from './pages/MyInvestments'
import ProjectDescription from './pages/ProjectDescription'
import CampaignDescription from './pages/CampaignDescription'
import Wallet from './pages/Wallet'
import ViewMyCampaigns from './pages/ViewMyCampaigns'
import KYCSubmission from './pages/KYCSubmission'
import AdminKYCPanel from './pages/AdminKYCPanel'
import AdminPanel from './pages/AdminPanel'


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

  /*Member pages*/
  {
    path: '/member/home',
    element: <><MemberNavbar /><MainLandingPage /><Footer /></>
  },
  {
    path: '/member/browsecampaigns',
    element: <><MemberNavbar /><BrowseCampaigns /><Footer /></>
  },
  {
    path: '/member/myinvestments',
    element: <><MemberNavbar /><MyInvestments /><Footer /></>
  },
  // --- NEW DYNAMIC ROUTES ---
  {
    // This route handles URLs like /member/project/68e666b2185ea7812e197e33
    path: '/member/project/:id',
    element: <><MemberNavbar /><ProjectDescription /><Footer /></>
  },
  {
    // This route handles URLs like /member/campaign/someOtherId12345
    path: '/member/campaign/:id',
    element: <><MemberNavbar /><CampaignDescription /><Footer /></>
  },
  // --- END NEW DYNAMIC ROUTES ---
  {
    path: '/member/startacampaign',
    element: <><MemberNavbar /><StartACampaign /><Footer /></>
  },
  {
    path: '/member/newcampaigndetails',
    element: <><MemberNavbar /><NewCampaignDetails /><Footer /></>
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
  // 🚫 Network route hidden for V2 - Using USDC governance instead
  // {
  //   path: '/member/network',
  //   element: <><MemberNavbar /><Network /><Footer /></>
  // },
  {
    path: '/member/wallet',
    element: <><MemberNavbar /><Wallet /><Footer /></>
  },
  {
    path: '/member/kyc-submission',
    element: <><MemberNavbar /><KYCSubmission /><Footer /></>
  },
  {
    path: '/admin/kyc',
    element: <><MemberNavbar /><AdminKYCPanel /><Footer /></>
  },
  {
    path: '/admin/disputes',
    element: <><MemberNavbar /><AdminPanel /><Footer /></>
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

