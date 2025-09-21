
import { useState } from 'react';
import how_we_work_bg_image from '../assets/how_we_work_bg_image.jpg';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  return (
    <div className="w-full min-h-screen flex flex-col">
      {/* Header / Hero Section */}
      <section className="relative w-full h-[300px] md:h-[400px] bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: `url(${how_we_work_bg_image})`, backgroundPosition: 'center bottom' }}>
        {/* Overlay */}
        <div className="absolute inset-0 bg-black opacity-40"></div>

        
{/* Centered Box with dark background */}
<div className="absolute inset-0 ">
  <div className="bg-[#201E43] w-[1000px] px-10 py-18 shadow-xl relative mx-auto mt-[200px]">
    {/* Top white line */}
    <div className="absolute top-12 left-18 right-18 h-[1px] bg-white px-10"></div>
    
    {/* Bottom white line */}
    <div className="absolute bottom-12 left-18 right-18 h-[1px] bg-white"></div>

    <h1
      className="text-white text-[32px] relative z-10 px-8"
      style={{ 
        fontFamily: "Playfair Display", 
        fontWeight: 400,
        letterSpacing: "0.05em",
        lineHeight: "42.67px"
      }}
    >
      Contact Us
    </h1>
  </div>
</div>
      </section>

      {/* Contact Form Section */}
      <section className="max-w-4xl w-full mx-auto mt-8 flex-1 space-y-6 py-25">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name & Phone in one row */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Name */}
            <div className="flex flex-col flex-1">
              <label className="font-medium mb-1" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#201E43]"
              />
            </div>

            {/* Phone Number */}
            <div className="flex flex-col flex-1">
              <label className="font-medium mb-1" htmlFor="phone">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="+91"
                value={formData.phone}
                onChange={handleChange}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#201E43]"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col">
            <label className="font-medium mb-1" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              placeholder="E-mail address"
              value={formData.email}
              onChange={handleChange}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#201E43]"
            />
          </div>

          {/* Message */}
          <div className="flex flex-col">
            <label className="font-medium mb-1" htmlFor="message">
              Message
            </label>
            <textarea
              id="message"
              placeholder="Enter your message here"
              rows="5"
              value={formData.message}
              onChange={handleChange}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#201E43] resize-none"
            ></textarea>
          </div>

          {/* Submit button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-[#508C9B] text-white font-semibold px-6 py-3 rounded-full hover:bg-opacity-90 transition-colors"
            >
              SUBMIT
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ContactUs;