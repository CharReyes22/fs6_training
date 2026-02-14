import { useEffect, useState, useCallback } from "react";
import { FaTimes } from "react-icons/fa";
import { authRequest } from "../api/Auth_refresh";
import { BASE_URL } from "../api/base";
import Loading from "../components/Loading";
export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shipping, setShipping] = useState({
    fullName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });

  const handleCheckout = async () => {
    try {
      const res = await authRequest("post", "/checkout/gcash/", shipping);

      const checkoutUrl = res.data.checkout_url;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    }
  };

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authRequest("get", "/cart/");
      setCartItems(res.data || []);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleUpdateQty = async (item, newQty) => {
    if (newQty <= 0) return handleRemove(item.id);
    try {
      const payload = { product_id: item.product.id, qty: newQty };
      const res = await authRequest("put", `/cart/update/${item.id}/`, payload);
      const updated = res.data;
      setCartItems((prev) =>
        prev.map((ci) => (ci.id === updated.id ? updated : ci)),
      );
    } catch (error) {
      console.error("Error updating cart item:", error);
    }
  };

  const handleRemove = async (id) => {
    try {
      await authRequest("delete", `/cart/delete/${id}/`);
      setCartItems((prev) => prev.filter((ci) => ci.id !== id));
    } catch (error) {
      console.error("Error deleting cart item:", error);
    }
  };

  const subtotal = cartItems.reduce((acc, item) => {
    const price = parseFloat(item.product.product_price || 0);
    return acc + item.qty * price;
  }, 0);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-6 flex justify-center">
      <div className="w-full max-w-5xl space-y-10">
        <div className="bg-white shadow-md rounded-md p-8">
          <h2 className="text-2xl font-semibold mb-8">Shopping Cart</h2>

          {cartItems.length === 0 && (
            <p className="text-sm">Your cart is empty.</p>
          )}

          {cartItems.map((item) => {
            const img = item.product.image
              ? item.product.image.startsWith("http")
                ? item.product.image
                : `${BASE_URL}${item.product.image}`
              : "";

            return (
              <div className="border-b py-6" key={item.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <img
                      src={img}
                      alt={item.product.product_name}
                      className="w-24 h-16 object-contain"
                    />

                    <div>
                      <h3 className="font-medium">
                        {item.product.product_name}
                      </h3>

                      <div className="flex items-center gap-3 mt-3 text-sm">
                        <span>Qty:</span>

                        <div className="flex items-center border rounded-md">
                          <button
                            onClick={() => handleUpdateQty(item, item.qty - 1)}
                            className="px-3 py-1 hover:bg-gray-100"
                          >
                            −
                          </button>

                          <span className="px-4 py-1 border-x">{item.qty}</span>

                          <button
                            onClick={() => handleUpdateQty(item, item.qty + 1)}
                            className="px-3 py-1 hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <p className="text-sm mt-3">
                        Price: $
                        {parseFloat(item.product.product_price).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-gray-500 hover:text-red-600 transition"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white shadow-md rounded-md p-8">
          <h2 className="text-xl font-semibold mb-6">Shipping Information</h2>

          <div className="grid grid-cols-1 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={shipping.fullName}
              onChange={(e) =>
                setShipping({ ...shipping, fullName: e.target.value })
              }
              className="border p-2 rounded"
            />

            <input
              type="text"
              placeholder="Address"
              value={shipping.address}
              onChange={(e) =>
                setShipping({ ...shipping, address: e.target.value })
              }
              className="border p-2 rounded"
            />

            <input
              type="text"
              placeholder="City"
              value={shipping.city}
              onChange={(e) =>
                setShipping({ ...shipping, city: e.target.value })
              }
              className="border p-2 rounded"
            />

            <input
              type="text"
              placeholder="Postal Code"
              value={shipping.postalCode}
              onChange={(e) =>
                setShipping({ ...shipping, postalCode: e.target.value })
              }
              className="border p-2 rounded"
            />

            <input
              type="text"
              placeholder="Country"
              value={shipping.country}
              onChange={(e) =>
                setShipping({ ...shipping, country: e.target.value })
              }
              className="border p-2 rounded"
            />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-md p-8">
          <h2 className="text-xl font-semibold text-center mb-6">
            Order Summary
          </h2>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b pb-4">
              <span>Sub Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0}
            className="mt-6 w-full bg-blue-900 text-white py-2 rounded-md hover:bg-blue-800 transition disabled:opacity-50"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
