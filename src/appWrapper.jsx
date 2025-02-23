import React from 'react';
import { Route, BrowserRouter as Router, Routes, } from 'react-router-dom';

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
import Login from './login';
import Navbar from './navbar';
import PasswordChanged from './passwordchanged';
import Pesticide from './pesticide';
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
import Users from './users';
import Watertemp from './watertemp';

const AppWrapper = () => {

  // Define routes where Navbar should not be shown
  const noNavbarRoutes = [
    '/resetpassword',
    '/requestpasswordreset',
    '/entercurrentpassword',
    '/passwordchanged',
    '/login'
  ];

  return (
    <Router>
      {/* Render Navbar conditionally based on current route */}
      {!noNavbarRoutes.includes(location.pathname) && <Navbar />}

      <Routes>
        {/* Define routes for different pages */}
        <Route path="/" element={<Dashboard />} /> {/* Default dashboard route */}
        <Route path="/users" element={<Users />} /> {/* Users page */}
        <Route path="/sensors" element={<Sensors />} /> {/* Sensors page */}
        <Route path="/profile" element={<Profile />} /> {/* Profile page */}
        <Route path="/plantregistration" element={<PlantRegistration />} /> {/* Plant Registration page */}
        <Route path="/plants" element={< Plants />} /> {/* Plant Registration page */}
        <Route path="/hydro" element={< Hydro />} /> {/* Plant Registration page */}
        <Route path= "/soil" element={< Soil />} />
        <Route path= "/rhydro" element={< Rhydro />} />
        <Route path= "/rsoil" element={< Rsoil />} />
        <Route path="/harvest" element={<Harvest/>} />
        <Route path="/humidity" element={<Humidity/>} />
        <Route path="/aquaculture" element={<Aquaculture/>} />
        <Route path="/watertemp" element={<Watertemp/>} />
        <Route path="/do" element={<Do/>} />
        <Route path="/soilbased" element={<Soilbased/>} />
        <Route path="/soilmonitoring" element={<Soilmonitoring/>} />
        <Route path="/hydrowaterlevel" element={<Hydrowaterlevel/>} />
        <Route path="/reservior" element={<Reservior/>} />
        <Route path="/food" element={<Food/>} />
        <Route path="/pesticide" element={<Pesticide/>} />
        <Route path="/history" element={<History/>} />
   
 
        {/* Routes without Navbar */}
        <Route path="/resetpassword" element={<ResetPassword />} /> {/* Reset Password page */}
        <Route path="/requestpasswordreset" element={<RequestPasswordReset />} /> {/* Request Password Reset page */}
        <Route path="/entercurrentpassword" element={<EnterCurrentPassword />} /> {/* Enter Current Password page */}
        <Route path="/passwordchanged" element={<PasswordChanged />} /> {/* Password Changed page */}
        <Route path="/login" element={<Login />} /> {/* Password Changed page */}
      </Routes>
    </Router>
  );
};

export default AppWrapper;
