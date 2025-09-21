import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
//import login_register_bg from '../assets/login_register_bg.jpg';

const LoginRegister = () => {
  // state management code
  const navigator = useNavigate()
  const [state, setState] = useState("Login");
  const [formData, setFormdata] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    location: "",
    phone: "",
    interest: [],
    experience: "",
    education: "",
    aadhar: "",
    role: "",
    dob: ""
  });

  // handlers
  const changeHandler = (e) => {
    setFormdata({ ...formData, [e.target.name]: e.target.value });
  };

  // Interest change handlers
  const handleInterestChange = (e) => {
    const value = e.target.value;
    if (!formData.interest.includes(value)) {
      setFormdata({ ...formData, interest: [...formData.interest, value] });
    }
  };

  const removeInterest = (value) => {
    setFormdata({ ...formData, interest: formData.interest.filter((item) => item !== value) });
  };

  const handleSubmit = async () => {
    const url = state === "Login" ? `${import.meta.env.VITE_API_GATEWAY_URL}/users/login` : `${import.meta.env.VITE_API_GATEWAY_URL}/users/register`;

    let responseData;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    }).then((response) => response.json()).then((data) => responseData = data);

    if (responseData.success) {
      localStorage.setItem('token', responseData.token);
      formData.role == 'funder' || responseData.user.role == 'funder'? navigator('/funder/browseprojects') : navigator('/entrepreneur/startaproject') 
    } else {
      alert(responseData.message);
    }
  };

  // Common input styles
  const inputClass = "w-full px-4 py-3 bg-[#EEEEEE] rounded-md font-inter placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#508C9B]";
  const labelClass = "block text-white font-inter text-sm mb-1";


  return (
    // Fixed background container
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Background image with fixed positioning */}
      {/* <div 
        className="fixed inset-0 w-full h-[300px] z-0"
        style={{
          backgroundImage: `url(${login_register_bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      /> */}
      
      {/* Content container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen w-full px-4 my-5">
        {/* Form container - adjusted width for login/register */}
        <div className={`w-full ${state === "Login" ? "max-w-lg" : "max-w-lg"} bg-[#201E43]/95 rounded-lg shadow-xl p-8`}>
          {/* Title */}
          <h1 className='text-3xl font-bold text-white text-center mb-8'>
          {state}
          </h1>

          {/* Form fields */}
          <div className="space-y-6">
            {/* Rest of the form fields remain the same but with adjusted spacing */}
            {state === "Register" && (
              <div className="mb-4">
                <label className={labelClass}>Username</label>
                <input
                  name="username"
                  value={formData.username}
                  onChange={changeHandler}
                  type="text"
                  placeholder="Username"
                  className={inputClass}
                />
              </div>
            )}

            <div className="mb-4">
              <label className={labelClass}>E-mail</label>
              <input
                name="email"
                value={formData.email}
                onChange={changeHandler}
                type="email"
                placeholder="E-mail address"
                className={inputClass}
              />
            </div>

            <div className="mb-6">
              <label className={labelClass}>Password</label>
              <input
                name="password"
                value={formData.password}
                onChange={changeHandler}
                type="password"
                placeholder="Password"
                className={inputClass}
              />
            </div>

            {/* Register-specific fields */}
            {state === "Register" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Date of birth</label>
                  <input
                    name="dob"
                    value={formData.dob}
                    onChange={changeHandler}
                    type="date"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Contact Number</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={changeHandler}
                    type="text"
                    placeholder="Contact Number"
                    className={inputClass}
                  />
                </div>
              </div>


              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Interests</label>
                  <select
                    onChange={handleInterestChange}
                    className={inputClass}
                  >
                    <option value="">Select Interests</option>
                    <option value="Wind">Wind</option>
                    <option value="Hydroelectricity">Hydroelectricity</option>
                    <option value="Solar Energy">Solar Energy</option>
                    <option value="Biomass">Biomass</option>
                    <option value="Geothermal Energy">Geothermal Energy</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Type</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={changeHandler}
                    className={inputClass}
                  >
                    <option value="">Select Type of User</option>
                    <option value="funder">Funder</option>
                    <option value="entrepreneur">Entrepreneur</option>
                  </select>
                </div>
              </div>


              {/* Display selected interests */}
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.interest.map((item) => (
                  <div key={item} className="bg-[#508C9B] text-white px-3 py-1 rounded-full flex items-center">
                    {item}
                    <button
                      onClick={() => removeInterest(item)}
                      className="ml-2 text-white hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

          {/* Terms and conditions */}
          <div className="flex items-center mt-6">
            <input
              type="checkbox"
              className="mr-2 h-4 w-4 rounded border-gray-300 text-[#508C9B] focus:ring-[#508C9B]"
            />
            <p className="text-white text-sm ">
              By Continuing, I agree to the terms and policies.
            </p>
          </div>

          {/* Continue button */}
          <button
              onClick={handleSubmit}
              className="w-full mt-8 bg-[#508C9B] text-white py-3 rounded-md hover:bg-[#134B70] transition-colors duration-300 uppercase tracking-wider"
            >
              Continue
            </button>

          {/* Toggle between Login/Register */}
          <p className="text-center mt-4 text-white">
            {state === "Register" ? "Already have an account? " : "Create an account? "}
            <span
              onClick={() => setState(state === "Login" ? "Register" : "Login")}
              className="text-[#508C9B] cursor-pointer hover:underline"
            >
              {state === "Register" ? "Login here" : "Click here"}
            </span>
          </p>

          
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;
