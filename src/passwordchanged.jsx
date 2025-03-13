import React from 'react';
import qr from "/src/assets/qr.jpg";

const PasswordChanged = () => {
  return (
    <div>
      <h2>Your password has been successfully updated!</h2>
      <p>You can now log in with your new password.</p>
      <p>Download and Sign in to the application</p>
        
       <a href='https://camarote123.github.io/hydroproject/#/login' > LOG IN ON WEB HERE</a>


       <div>
        <br></br>
       <a href='https://drive.google.com/file/d/1VcGaC_AvNMhiS07_jrcJeF0Y5PQpNPJb/view'>Download Mobile App</a>
       </div>
       
       <br></br>
           <div className="qr">
                    <img src={qr} alt="qr" className="qr-img"  width={300}/>
                  </div>
     
       </div>
    
    
  );
};



export default PasswordChanged;
