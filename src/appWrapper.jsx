import React from 'react';
import { Navigate, Route, HashRouter as Router, Routes, useLocation } from 'react-router-dom';
import Aquaculture from './aquaculture';
import Dashboard from './dashboard';
import Do from './do';
import EnterCurrentPassword from './entercurrentpassword';
import Food from './food';
import Harvest from './harvest';
import History from './history';
import Humidity from './humidity';
import Hydro from './hydro';
import Hydrowaterlevel from './hydrowaterlevel';
import Location from './location';
import Login from './login';
import Navbar from './navbar';
import Npk from './npk';
import PasswordChanged from './passwordchanged';
import Pesticide from './pesticide';
import Phlevel from './phlevel';
import PlantRegistration from './plantregistration';
import Plants from './plants';
import Profile from './profile';
import RequestPasswordReset from './requestpasswordreset';
import Reservior from './reservior';
import ResetPassword from './resetpassword';
import Rhydro from './rhydro';
import Rsoil from './rsoil';
import Sensors from './sensors';
import Soil from './soil';
import Soilbased from './soilbased';
import Soilmonitoring from './soilmonitoring';
import Soilmonitoring2 from './soilmonitoring2';
import Users from './users';
import Watertemp from './watertemp';

const AppContent = () => {
  const location = useLocation(); // Get current path

  // Define routes where Navbar should not be shown
  const noNavbarRoutes = [
    '/resetpassword',
    '/requestpasswordreset',
    '/entercurrentpassword',
    '/passwordchanged',
    '/login'
  ];

  return (
    <>
      {/* Render Navbar conditionally based on current route */}
      {!noNavbarRoutes.includes(location.pathname) && <Navbar />}

      <Routes>
        {/* Redirect root ("/") to login */}
        <Route path="/" element={<Navigate replace to = "/login" />} />
        <Route path = "/login" element = {<Login/>} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/sensors" element={<Sensors />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/plantregistration" element={<PlantRegistration />} />
        <Route path="/plants" element={<Plants />} />
        <Route path="/hydro" element={<Hydro />} />
        <Route path="/soil" element={<Soil />} />
        <Route path="/rhydro" element={<Rhydro />} />
        <Route path="/rsoil" element={<Rsoil />} />
        <Route path="/harvest" element={<Harvest />} />
        <Route path="/humidity" element={<Humidity />} />
        <Route path="/aquaculture" element={<Aquaculture />} />
        <Route path="/watertemp" element={<Watertemp />} />
        <Route path="/do" element={<Do />} />
        <Route path="/soilbased" element={<Soilbased />} />
        <Route path="/soilmonitoring" element={<Soilmonitoring />} />
        <Route path="/soilmonitoring2" element={<Soilmonitoring2 />} />
        <Route path="/hydrowaterlevel" element={<Hydrowaterlevel />} />
        <Route path="/reservior" element={<Reservior />} />
        <Route path="/food" element={<Food />} />
        <Route path="/pesticide" element={<Pesticide />} />
        <Route path="/history" element={<History />} />
        <Route path="/phlevel" element={<Phlevel />} />
        <Route path="/npk" element={<Npk />} />
        <Route path="/location" element={<Location />} />
        

        {/* Routes without Navbar */}
        <Route path="/resetpassword" element={<ResetPassword />} />
        <Route path="/requestpasswordreset" element={<RequestPasswordReset />} />
        <Route path="/entercurrentpassword" element={<EnterCurrentPassword />} />
        <Route path="/passwordchanged" element={<PasswordChanged />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
};

const AppWrapper = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default AppWrapper;
