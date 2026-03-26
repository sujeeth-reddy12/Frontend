import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { extractError } from "../api";
import { clearUserSession, getStoredUser } from "../utils/authStorage";

function StaffDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [notification, setNotification] = useState("");
  const [error, setError] = useState("");

  const loadComplaints = useCallback(async () => {
    if (!user) {
      setError("Invalid session. Please login again.");
      return;
    }

    try {
      const response = await api.get("/staff/complaints");
      setComplaints(response.data);
      setError("");
    } catch (err) {
      setError(extractError(err, "Failed to load assigned complaints."));
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

  const updateComplaint = async (complaint, status, remarks) => {
    if (!user) {
      return;
    }

    try {
      const response = await api.post("/staff/status", {
        complaintId: complaint.id,
        staffId: user.id,
        status,
        remarks,
      });

      setNotification(response.data.notification);
      setError("");
      await loadComplaints();
    } catch (err) {
      setError(extractError(err, "Failed to update complaint status."));
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
        <h2>Staff Dashboard</h2>
        <button onClick={logout}>Logout</button>
      </header>

      {notification && <p className="success-text">{notification}</p>}
      {error && <p className="error-text">{error}</p>}

      <section className="panel">
        <h3>Assigned Complaints</h3>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Status</th>
              <th>Remarks</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((complaint) => (
              <StaffRow
                key={complaint.id}
                complaint={complaint}
                onUpdate={updateComplaint}
              />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function StaffRow({ complaint, onUpdate }) {
  const [status, setStatus] = useState(complaint.status);
  const [remarks, setRemarks] = useState(complaint.remarks || "");

  return (
    <tr>
      <td>{complaint.title}</td>
      <td>{complaint.description}</td>
      <td>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </td>
      <td>
        <input
          type="text"
          value={remarks}
          onChange={(event) => setRemarks(event.target.value)}
          placeholder="Remarks"
        />
      </td>
      <td>
        <button onClick={() => onUpdate(complaint, status, remarks)}>Save</button>
      </td>
    </tr>
  );
}

export default StaffDashboard;
