import { useState, useEffect } from "react";
import { authRequest } from "../api/Auth_refresh";
import axios from "axios";
import { BASE_URL } from "../api/base";

export default function Profile() {
  const [userData, setUserData] = useState({});

  const fetchUserData = async () => {
    try {
      const response = await authRequest("get", "/profile/");
      setUserData(response.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/logout/`, {
        refresh: localStorage.getItem("refresh_token"),
      });

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      console.log("Logout response:", response);
      window.location.href = "/login"; // Redirect to login page after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen py-12 px-6 flex justify-center">
      <div className="w-full max-w-6xl space-y-8">
        {/* Profile Card */}
        <div className="bg-white shadow-md rounded p-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold mb-6">My Profile</h2>

              <p className="text-sm mb-2">
                <span className="font-medium">Username:</span>{" "}
                {userData.username}
              </p>

              <p className="text-sm">
                <span className="font-medium">Email:</span> {userData.email}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="bg-red-600 text-white text-sm px-4 py-1 rounded hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Purchase History */}
        <div className="bg-white shadow-md rounded p-8">
          <h2 className="text-2xl font-semibold mb-6">Purchase History</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b text-gray-600">
                  <th className="py-3">Product Image</th>
                  <th className="py-3">Product Name</th>
                  <th className="py-3">Purchase Date</th>
                  <th className="py-3">Quantity</th>
                  <th className="py-3">Amount</th>
                </tr>
              </thead>

              <tbody>
                {/* Row 1 */}
                <tr className="border-b">
                  <td className="py-4">
                    <img
                      src="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=200&auto=format&fit=crop"
                      alt="product"
                      className="w-16 h-12 object-contain"
                    />
                  </td>
                  <td className="py-4">Cisco Example</td>
                  <td className="py-4">January 15 2025</td>
                  <td className="py-4">2</td>
                  <td className="py-4">$2999</td>
                </tr>

                {/* Row 2 */}
                <tr className="border-b">
                  <td className="py-4">
                    <img
                      src="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=200&auto=format&fit=crop"
                      alt="product"
                      className="w-16 h-12 object-contain"
                    />
                  </td>
                  <td className="py-4">Cisco Example</td>
                  <td className="py-4">January 15 2025</td>
                  <td className="py-4">2</td>
                  <td className="py-4">$2999</td>
                </tr>

                {/* Row 3 */}
                <tr>
                  <td className="py-4">
                    <img
                      src="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=200&auto=format&fit=crop"
                      alt="product"
                      className="w-16 h-12 object-contain"
                    />
                  </td>
                  <td className="py-4">Cisco Example</td>
                  <td className="py-4">January 15 2025</td>
                  <td className="py-4">2</td>
                  <td className="py-4">$2999</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
