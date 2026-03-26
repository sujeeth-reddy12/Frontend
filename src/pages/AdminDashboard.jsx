import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { clearUserSession, getStoredUser } from "../utils/authStorage";

const statuses = ["ALL", "PENDING", "IN_PROGRESS", "RESOLVED"];
const complaintStatuses = ["PENDING", "IN_PROGRESS", "RESOLVED"];
const roleOptions = ["USER", "STAFF", "ADMIN"];
const hotelCategories = [
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

const extractError = (err, fallback) => {
  const data = err.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  return data.message || fallback;
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [editingComplaintId, setEditingComplaintId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: hotelCategories[0],
    status: "PENDING",
    remarks: "",
    userId: "",
    staffId: "",
  });

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
  });
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserForm, setEditUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
  });

  const loadData = useCallback(async (currentFilter) => {
    const complaintUrl =
      currentFilter === "ALL"
        ? "/admin/complaints"
        : `/admin/complaints?status=${currentFilter}`;

    try {
      const [complaintsRes, staffRes, usersRes, analyticsRes] = await Promise.all([
        api.get(complaintUrl),
        api.get("/admin/staff"),
        api.get("/admin/users"),
        api.get("/admin/analytics"),
      ]);
      setComplaints(complaintsRes.data);
      setStaffMembers(staffRes.data);
      setUsers(usersRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      setError(extractError(err, "Failed to load data."));
    }
  }, []);

  const userOptions = useMemo(() => users.filter((u) => u.role === "USER"), [users]);

  useEffect(() => {
    const savedUser = getStoredUser();
    if (!savedUser) return;
    setUser(savedUser);
    loadData("ALL");
  }, [loadData]);

  useEffect(() => {
    if (user) loadData(statusFilter);
  }, [statusFilter, user, loadData]);

  const staffLookup = useMemo(() => {
    return staffMembers.reduce((acc, s) => { acc[s.id] = s.name; return acc; }, {});
  }, [staffMembers]);

  const assignComplaint = async (complaintId, staffId) => {
    if (!staffId) return;
    try {
      await api.post("/admin/assign", { complaintId, staffId: Number(staffId) });
      setMessage("Complaint assigned successfully.");
      await loadData(statusFilter);
    } catch (err) {
      setError(extractError(err, "Failed to assign complaint."));
    }
  };

  const startEditComplaint = (complaint) => {
    setEditingComplaintId(complaint.id);
    setEditForm({
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      status: complaint.status,
      remarks: complaint.remarks || "",
      userId: String(complaint.userId || ""),
      staffId: complaint.staffId ? String(complaint.staffId) : "",
    });
    setError("");
    setMessage("");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitEditComplaint = async (e) => {
    e.preventDefault();
    if (!editingComplaintId) return;
    setError("");
    setMessage("");
    try {
      await api.put(`/admin/complaints/${editingComplaintId}`, {
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        status: editForm.status,
        remarks: editForm.remarks,
        userId: Number(editForm.userId),
        staffId: editForm.staffId ? Number(editForm.staffId) : null,
      });
      setMessage("Complaint updated successfully.");
      setEditingComplaintId(null);
      await loadData(statusFilter);
    } catch (err) {
      setError(extractError(err, "Failed to update complaint."));
    }
  };

  const deleteComplaint = async (complaintId) => {
    if (!window.confirm("Delete this complaint?")) return;
    setError("");
    setMessage("");
    try {
      await api.delete(`/admin/complaints/${complaintId}`);
      setMessage("Complaint deleted.");
      if (editingComplaintId === complaintId) setEditingComplaintId(null);
      await loadData(statusFilter);
    } catch (err) {
      setError(extractError(err, "Failed to delete complaint."));
    }
  };

  const handleNewUserChange = (event) => {
    const { name, value } = event.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const createUser = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await api.post("/admin/users", {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
      });

      setMessage("User created successfully");
      setNewUser({ name: "", email: "", password: "", role: "USER" });
      await loadData(statusFilter);
    } catch (err) {
      setError(extractError(err, "Failed to create user."));
    }
  };

  const startEditUser = (entry) => {
    setEditingUserId(entry.id);
    setEditUserForm({
      name: entry.name,
      email: entry.email,
      password: "",
      role: entry.role,
    });
  };

  const handleEditUserChange = (event) => {
    const { name, value } = event.target;
    setEditUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateUser = async (event) => {
    event.preventDefault();
    if (!editingUserId) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await api.put(`/admin/users/${editingUserId}`, {
        name: editUserForm.name,
        email: editUserForm.email,
        password: editUserForm.password,
        role: editUserForm.role,
      });

      setMessage("User updated successfully");
      setEditingUserId(null);
      await loadData(statusFilter);
    } catch (err) {
      setError(extractError(err, "Failed to update user."));
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user account?")) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await api.delete(`/admin/users/${userId}`);
      setMessage("User deleted successfully");
      if (editingUserId === userId) {
        setEditingUserId(null);
      }
      await loadData(statusFilter);
    } catch (err) {
      setError(extractError(err, "Failed to delete user."));
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
        <h2>Admin Dashboard</h2>
        <button onClick={logout}>Logout</button>
      </header>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <section className="panel analytics-grid">
        <div><strong>Total:</strong> {analytics.totalComplaints ?? 0}</div>
        <div><strong>Pending:</strong> {analytics.pendingComplaints ?? 0}</div>
        <div><strong>In Progress:</strong> {analytics.inProgressComplaints ?? 0}</div>
        <div><strong>Resolved:</strong> {analytics.resolvedComplaints ?? 0}</div>
      </section>



      {editingComplaintId && (
        <section className="panel">
          <h3>Edit Complaint #{editingComplaintId}</h3>
          <form className="grid-form" onSubmit={submitEditComplaint}>
            <input
              name="title"
              value={editForm.title}
              onChange={handleEditChange}
              required
            />
            <select name="category" value={editForm.category} onChange={handleEditChange}>
              {hotelCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select name="status" value={editForm.status} onChange={handleEditChange}>
              {complaintStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select name="userId" value={editForm.userId} onChange={handleEditChange} required>
              <option value="">Select User</option>
              {userOptions.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name} ({entry.email})
                </option>
              ))}
            </select>
            <select name="staffId" value={editForm.staffId} onChange={handleEditChange}>
              <option value="">Unassigned</option>
              {staffMembers.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </select>
            <textarea
              name="description"
              value={editForm.description}
              onChange={handleEditChange}
              required
            />
            <textarea
              name="remarks"
              placeholder="Remarks"
              value={editForm.remarks}
              onChange={handleEditChange}
            />
            <div className="row-actions">
              <button type="submit">Update</button>
              <button type="button" className="secondary-btn" onClick={() => setEditingComplaintId(null)}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <h3>All Complaints</h3>
        <label>Status Filter: </label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>User ID</th>
              <th>Assigned Staff</th>
              <th>Assign</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((complaint) => (
              <tr key={complaint.id}>
                <td>{complaint.title}</td>
                <td>{complaint.status}</td>
                <td>{complaint.userId}</td>
                <td>{complaint.staffId ? staffLookup[complaint.staffId] || complaint.staffId : "Unassigned"}</td>
                <td>
                  <select
                    defaultValue=""
                    onChange={(event) => assignComplaint(complaint.id, event.target.value)}
                  >
                    <option value="">Select Staff</option>
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <div className="row-actions">
                    <button type="button" className="secondary-btn" onClick={() => startEditComplaint(complaint)}>
                      Edit
                    </button>
                    <button type="button" className="danger-btn" onClick={() => deleteComplaint(complaint.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h3>Manage Users and Staff</h3>

        <form className="grid-form" onSubmit={createUser}>
          <input
            name="name"
            placeholder="Name"
            value={newUser.name}
            onChange={handleNewUserChange}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={handleNewUserChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={newUser.password}
            onChange={handleNewUserChange}
            required
          />
          <select name="role" value={newUser.role} onChange={handleNewUserChange}>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button type="submit">Add User / Staff</button>
        </form>

        {editingUserId && (
          <form className="grid-form" onSubmit={updateUser}>
            <input
              name="name"
              placeholder="Name"
              value={editUserForm.name}
              onChange={handleEditUserChange}
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={editUserForm.email}
              onChange={handleEditUserChange}
              required
            />
            <input
              name="password"
              type="password"
              placeholder="New Password (optional)"
              value={editUserForm.password}
              onChange={handleEditUserChange}
            />
            <select name="role" value={editUserForm.role} onChange={handleEditUserChange}>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <div className="row-actions">
              <button type="submit">Update User</button>
              <button type="button" className="secondary-btn" onClick={() => setEditingUserId(null)}>
                Cancel
              </button>
            </div>
          </form>
        )}

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.name}</td>
                <td>{entry.email}</td>
                <td>{entry.role}</td>
                <td>
                  <div className="row-actions">
                    <button type="button" className="secondary-btn" onClick={() => startEditUser(entry)}>
                      Edit
                    </button>
                    <button type="button" className="danger-btn" onClick={() => deleteUser(entry.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default AdminDashboard;
