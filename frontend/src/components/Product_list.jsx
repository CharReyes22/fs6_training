import React, { useState, useEffect } from "react";
import axios from "axios";
import Loading from "./Loading";
import { useLocation, Link } from "react-router-dom";
import { BASE_URL } from "../api/base";

const Product_list = () => {
  const [products, SetProducts] = useState([]);
  const [isLoading, SetLoading] = useState(true);
  const location = useLocation().pathname;

  const ProductData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/products/`);
      SetProducts(response.data);
      SetLoading(false);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    ProductData();
  });

  if (isLoading) return <Loading />;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Customers also purchased
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {(location === "/" ? products.slice(0, 8) : products).map(
            (product) => (
              <Link to={`/product/${product.id}`} key={product.id}>
                <div key={product.id} className="group relative">
                  <img
                    alt={product.image}
                    src={`${BASE_URL}${product.image}`}
                    className="aspect-square w-full rounded-md bg-gray-200 object-cover group-hover:opacity-75 lg:aspect-auto lg:h-80"
                  />
                  <div className="mt-4 flex justify-between">
                    <div>
                      <h3 className="text-sm text-gray-700">
                        <a href="#">
                          <span
                            aria-hidden="true"
                            className="absolute inset-0"
                          />
                          {product.product_name}
                        </a>
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">test</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {product.product_price}
                    </p>
                  </div>
                </div>
              </Link>
            ),
          )}
        </div>
      </div>
    </div>
  );
};

export default Product_list;
