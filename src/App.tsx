import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Services from './pages/Services';
import Gallery from './pages/Gallery';
import Events from './pages/Events';
import Reviews from './pages/Reviews';
import Affiliate from './pages/Affiliate';
import About from './pages/About';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import StaffInviteClaim from './pages/StaffInviteClaim';
export default function App(){return <Layout><Routes><Route path="/" element={<Home/>}/><Route path="/services" element={<Services/>}/><Route path="/book" element={<Services/>}/><Route path="/gallery" element={<Gallery/>}/><Route path="/events" element={<Events/>}/><Route path="/reviews" element={<Reviews/>}/><Route path="/affiliate" element={<Affiliate/>}/><Route path="/about" element={<About/>}/><Route path="/contact" element={<Contact/>}/><Route path="/admin" element={<Admin/>}/><Route path="/invite" element={<StaffInviteClaim/>}/></Routes></Layout>}
