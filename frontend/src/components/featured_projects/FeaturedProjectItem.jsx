import Featured from "../../assets/featured.js";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";



const FeaturedProjectItem = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1
  };
  return (
    <>
    <Slider {...settings}>
      {Featured.map((item) => (
        <div key={item.id} className="bg-[#201E43] text-white">

          <div className="flex justify-end"><span className="bg-[#24A232] py-4 px-15 font-bold font-[inter] italic tracking-wider text-lg">IMPACT SCORE: {item.impactScore}</span></div> 

          <div className="flex justify-between px-30 py-5 pb-20">
          <div>
            <p className="font-medium text-3xl py-7 font-[inter]">{item.title}</p>
            <p>{item.projectInfo}</p>
            <button className="bg-[#508C9B] my-5 py-1 px-8 rounded-3xl text-lg">View Details</button>
          </div>

          <div>
            <img src={item.image} className=" h-48 w-96 object-scale-down rounded-t-2xl" alt="project-image" />
          </div>
          </div>
          
        </div>
      ))}
      </Slider>
    </>
  );
};

export default FeaturedProjectItem;