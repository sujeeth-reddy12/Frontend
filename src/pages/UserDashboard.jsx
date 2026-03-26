import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { extractError } from "../api";
import { clearUserSession, getStoredUser } from "../utils/authStorage";

const categories = [
  "Room Cleanliness",
  "Food Quality",
  "Service Delay",
  "Maintenance Issue",
  "Billing Issue",
  "Noise Complaint",
  "Amenities Request",
  "Safety Concern",
  "Other",
];

function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: categories[0],
  });

  const loadComplaints = useCallback(async () => {
    if (!user) {
      setError("Invalid session. Please login again.");
      return;
    }

    try {
      const response = await api.get("/complaints/my");
      setComplaints(response.data);
      setError("");
    } catch (err) {
      setError(extractError(err, "Failed to load complaints."));
    }
  }, [user]);

  useEffect(() => {
    const savedUser = getStoredUser();
    if (!savedUser) {
      return;
    }

    setUser(savedUser);
  }, []);

  useEffect(() => {
    if (user) {
      loadComplaints();
    }
  }, [user, loadComplaints]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user) {
      return;
    }

    try {
      await api.post("/complaints", {
        ...form,
        userId: user.id,
      });

      setMessage("Complaint submitted successfully");
      setError("");
      setForm({ title: "", description: "", category: categories[0] });
      await loadComplaints();
    } catch (err) {
      setError(extractError(err, "Failed to submit complaint."));
    }
  };

  const logout = () => {
    clearUserSession();
    navigate("/login", { replace: true });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-wrap">
      <header className="top-bar">
        <h2>User Dashboard</h2>
        <button onClick={logout}>Logout</button>
      </header>

      <section className="panel">
        <h3>Submit Complaint</h3>
        <form className="grid-form" onSubmit={handleSubmit}>
          <input
            name="title"
            placeholder="Title"
            value={form.title}
            onChange={handleChange}
            required
          />
          <select name="category" value={form.category} onChange={handleChange}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            required
          />
          <button type="submit">Submit</button>
        </form>
        {message && <p className="success-text">{message}</p>}
        {error && <p className="error-text">{error}</p>}
      </section>

      <section className="panel">
        <h3>My Complaints</h3>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((complaint) => (
              <tr key={complaint.id}>
                <td>{complaint.title}</td>
                <td>{complaint.category}</td>
                <td>{complaint.status}</td>
                <td>{complaint.remarks || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default UserDashboard;
