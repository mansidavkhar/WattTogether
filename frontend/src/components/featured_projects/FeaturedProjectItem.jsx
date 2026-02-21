import Featured from "../../assets/featured.js";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Custom arrow components for better visibility
const NextArrow = (props) => {
  const { onClick } = props;
  return (
    <div
      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 cursor-pointer bg-[#508C9B] hover:bg-[#3d6f7a] text-white rounded-full p-3 shadow-lg transition-all"
      onClick={onClick}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
};

const PrevArrow = (props) => {
  const { onClick } = props;
  return (
    <div
      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 cursor-pointer bg-[#508C9B] hover:bg-[#3d6f7a] text-white rounded-full p-3 shadow-lg transition-all"
      onClick={onClick}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </div>
  );
};

const FeaturedProjectItem = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    autoplay: true,
    autoplaySpeed: 8000,
    pauseOnHover: true
  };
  
  return (
    <div className="relative">
      <Slider {...settings}>
        {Featured.map((item) => (
          <div key={item.id} className="bg-[#201E43] text-white rounded-xl overflow-hidden">
            <div className="flex justify-between items-center gap-4 px-24 py-10">
              <div className="flex-1 max-w-md">
                <p className="font-medium text-3xl mb-4 font-[inter]">{item.title}</p>
                <p className="mb-4 text-gray-200">{item.projectInfo}</p>
                <button className="bg-[#508C9B] hover:bg-[#3d6f7a] py-2 px-8 rounded-3xl text-lg transition-colors">
                  View Details
                </button>
              </div>

              <div className="flex-shrink-0">
                <img src={item.image} className="h-52 w-80 object-cover rounded-lg" alt="project-image" />
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default FeaturedProjectItem;