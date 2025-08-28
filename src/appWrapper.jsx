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
import Navbar2 from './navbar2';

import Notifications from './notification';
import Npk from './npk';
import PasswordChanged from './passwordchanged';
import Pesticide from './pesticide';
import Phlevel from './phlevel';
import PlantRegistration from './plantregistration';
import Plants from './plants';
import Profile from './profile';
import ProtectedRoute from './ProtectedRoute';
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

  const noNavbar2Routes = [
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
      {!noNavbar2Routes.includes(location.pathname) && <Navbar2 />}


      <Routes>
        {/* Redirect root ("/") to login */}
       <Route path="/" element={<Navigate replace to="/login" />} />
        <Route path="/login" element={<Login />} />
     
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/sensors" element={<ProtectedRoute><Sensors /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/plantregistration" element={<ProtectedRoute><PlantRegistration /></ProtectedRoute>} />
        <Route path="/plants" element={<ProtectedRoute><Plants /></ProtectedRoute>} />
        <Route path="/hydro" element={<ProtectedRoute><Hydro /></ProtectedRoute>} />
        <Route path="/soil" element={<ProtectedRoute><Soil /></ProtectedRoute>} />
        <Route path="/rhydro" element={<ProtectedRoute><Rhydro /></ProtectedRoute>} />
        <Route path="/rsoil" element={<ProtectedRoute><Rsoil /></ProtectedRoute>} />
        <Route path="/harvest" element={<ProtectedRoute><Harvest /></ProtectedRoute>} />
        <Route path="/humidity" element={<ProtectedRoute><Humidity /></ProtectedRoute>} />
        <Route path="/aquaculture" element={<ProtectedRoute><Aquaculture /></ProtectedRoute>} />
        <Route path="/watertemp" element={<ProtectedRoute><Watertemp /></ProtectedRoute>} />
        <Route path="/do" element={<ProtectedRoute><Do /></ProtectedRoute>} />
        <Route path="/soilbased" element={<ProtectedRoute><Soilbased /></ProtectedRoute>} />
        <Route path="/soilmonitoring" element={<ProtectedRoute><Soilmonitoring /></ProtectedRoute>} />
        <Route path="/soilmonitoring2" element={<ProtectedRoute><Soilmonitoring2 /></ProtectedRoute>} />
        <Route path="/hydrowaterlevel" element={<ProtectedRoute><Hydrowaterlevel /></ProtectedRoute>} />
        <Route path="/reservior" element={<ProtectedRoute><Reservior /></ProtectedRoute>} />
        <Route path="/food" element={<ProtectedRoute><Food /></ProtectedRoute>} />
        <Route path="/pesticide" element={<ProtectedRoute><Pesticide /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/phlevel" element={<ProtectedRoute><Phlevel /></ProtectedRoute>} />
        <Route path="/npk" element={<ProtectedRoute><Npk /></ProtectedRoute>} />
        <Route path="/location" element={<ProtectedRoute><Location /></ProtectedRoute>} />
        <Route path="/notification" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
   

        {/* Routes without Navbar */}
        <Route path="/resetpassword" element={<ResetPassword />} />
        <Route path="/requestpasswordreset" element={<RequestPasswordReset />} />
        <Route path="/entercurrentpassword" element={<EnterCurrentPassword />} />
        <Route path="/passwordchanged" element={<PasswordChanged />} />
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
