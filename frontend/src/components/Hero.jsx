import React from "react";
import Hero_image from "../assets/hero_image.png";

const Hero = () => {
  return (
    // main div / parent div
    <div className="flex flex-wrap justify-center py-12">
      {/*child 1 */}
      <div className="max-w-lg ">
        <h1 className="text-2xl font-bold mb-4">Sit and shop, we got you!</h1>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat.
        </p>
        <button className="bg-primary text-white px-8 py-2 rounded-full mt-4">
          Shop Now
        </button>
      </div>

      {/* child 2 */}
      <div>
        <img
          src={Hero_image}
          alt="hero_img"
          className="w-full max-w-md object-cover"
        />
      </div>
    </div>
  );
};

export default Hero;
