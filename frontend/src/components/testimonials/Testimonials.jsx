import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
//add people profile pics in asset and fill in the testimonials array


//Individual Testimonial card
const TestimonialCard = ({ name, role, content, rating, image }) => {
    return (
      <div className="mx-2 bg-[#201E43] rounded-lg shadow-lg text-white">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full overflow-hidden mr-4">
              <img 
                src={image} 
                alt={name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{name}</h3>
              <p className="text-gray-400 text-sm">{role}</p>
            </div>
          </div>
          <div className="flex mb-4">
            {[...Array(rating)].map((_, index) => (
              <svg
                key={index}
                className="w-4 h-4 text-yellow-400 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          <p className="text-gray-100">{content}</p>
        </div>
      </div>
    );
  };


const Testimonials = () => {
    const settings = {
      dots: true,
      infinite: true,
      speed: 500,
      slidesToShow: 3,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 3000,
      responsive: [
        {
          breakpoint: 1024,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 1
          }
        },
        {
          breakpoint: 640,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1
          }
        }
      ]
    };
    
    
    //dummy data of testimonials
    const testimonials = [
      {
        name: "John Doe",
        role: "CEO, TechCorp",
        content: "Amazing service! The team went above and beyond our expectations.",
        rating: 5,
        image: "/api/placeholder/40/40"
      },
      {
        name: "Jane Smith",
        role: "Marketing Director",
        content: "Exceptional quality and attention to detail. Highly recommended!",
        rating: 5,
        image: "/api/placeholder/40/40"
      },
      {
        name: "Mike Johnson",
        role: "Product Manager",
        content: "Great experience working with this team. Very professional.",
        rating: 4,
        image: "/api/placeholder/40/40"
      },
      {
        name: "Sarah Williams",
        role: "Designer",
        content: "Incredible results and great communication throughout the project.",
        rating: 5,
        image: "/api/placeholder/40/40"
      }
    ];
  
    return (
      <div className="py-12 mb-10 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-[inter] mb-10 underline underline-offset-8">What Our Clients Say</h2>
            <p className="text-gray-600">Hear from our satisfied customers about their experience</p>
          </div>
          <Slider {...settings} className="testimonials-slider">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </Slider>
        </div>
      </div>
    );
  };
  
  export default Testimonials;