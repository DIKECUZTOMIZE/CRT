import { useEffect, useMemo, useState } from "react";
import { Eye, Loader2, PencilLine, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const emptyUserForm = {
  username: "",
  email: "",
  fullName: "",
  role: "USER",
  phone: "",
  organizationName: "",
  address: "",
  bio: "",
  avatar: "",
  password: "",
  isVerified: false,
};

const normalizeUser = (user = {}) => {
  const userId = user.id || user._id || "";
  const status = user.status || (user.role === "ORGANIZER" ? (user.isVerified ? "Verified" : "Review") : user.isVerified ? "Active" : "Pending");

  return {
    id: String(userId),
    _id: user._id ? String(user._id) : String(userId),
    username: user.username || "",
    email: user.email || "",
    fullName: user.fullName || user.username || "Unknown user",
    role: user.role || "USER",
    phone: user.phone || "",
    organizationName: user.organizationName || "",
    address: user.address || "",
    bio: user.bio || "",
    avatar: user.avatar || "",
    isVerified: Boolean(user.isVerified),
    status,
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  };
};

const userBadgeClasses = {
  Active: "bg-emerald-500/10 text-emerald-400",
  Pending: "bg-amber-500/10 text-amber-400",
  Verified: "bg-emerald-500/10 text-emerald-400",
  Review: "bg-amber-500/10 text-amber-400",
  Suspended: "bg-rose-500/10 text-rose-400",
  Blocked: "bg-rose-500/10 text-rose-400",
};

const formatUserDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
};

const toFormValues = (user, mode = "edit") => {
  if (!user || mode === "create") {
    return { ...emptyUserForm };
  }

  return {
    username: user.username || "",
    email: user.email || "",
    fullName: user.fullName || "",
    role: user.role || "USER",
    phone: user.phone || "",
    organizationName: user.organizationName || "",
    address: user.address || "",
    bio: user.bio || "",
    avatar: user.avatar || "",
    password: "",
    isVerified: Boolean(user.isVerified),
  };
};

export const UserList = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formData, setFormData] = useState(emptyUserForm);
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const uploadUserAvatar = async (file) => {
    if (!file) return "";

    const formData = new FormData();
    formData.append("image", file);

    setUploadingAvatar(true);

    try {
      const response = await fetch("http://localhost:3000/api/upload/image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Image upload failed.");
      }

      const uploadedUrl = payload?.data?.url || payload?.url || "";
      if (!uploadedUrl) {
        throw new Error("No image URL returned by the server.");
      }

      return uploadedUrl;
    } catch (error) {
      toast.error(error?.message || "Unable to upload image.");
      return "";
    } finally {
      setUploadingAvatar(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/admin/users?role=USER", {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || "Unable to load users.");
      }

      const nextUsers = Array.isArray(payload?.data) ? payload.data : [];
      setUsers(nextUsers.map(normalizeUser));
    } catch (error) {
      toast.error(error?.message || "Unable to load users.");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return users;

    return users.filter((user) =>
      [user.fullName, user.username, user.email, user.role, user.status, user.organizationName]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [searchTerm, users]);

  const openCreateModal = () => {
    setFormMode("create");
    setSelectedUser(null);
    setFormData({ ...emptyUserForm });
    setShowFormModal(true);
  };

  const openEditModal = (user) => {
    setFormMode("edit");
    setSelectedUser(user);
    setFormData(toFormValues(user, "edit"));
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setSelectedUser(null);
    setFormData({ ...emptyUserForm });
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploadedUrl = await uploadUserAvatar(file);
    if (uploadedUrl) {
      handleFormChange("avatar", uploadedUrl);
      toast.success("Profile image updated successfully.");
    }
  };

  const handleSubmit = async () => {
    const nextPayload = {
      ...formData,
      fullName: formData.fullName?.trim() || formData.username?.trim() || "",
      username: formData.username?.trim(),
      email: formData.email?.trim(),
      phone: formData.phone?.trim(),
      organizationName: formData.organizationName?.trim(),
      address: formData.address?.trim(),
      bio: formData.bio?.trim(),
      avatar: formData.avatar?.trim() || "",
    };

    if (!nextPayload.username || !nextPayload.email) {
      toast.error("Username and email are required.");
      return;
    }

    if (formMode === "create" && !nextPayload.password) {
      toast.error("Password is required to create a user.");
      return;
    }

    setSaving(true);

    try {
      const isEdit = formMode === "edit" && selectedUser;
      const endpoint = isEdit ? `http://localhost:3000/api/admin/users/${selectedUser.id || selectedUser._id}` : "http://localhost:3000/api/admin/users";
      const method = isEdit ? "PUT" : "POST";

      const body = { ...nextPayload };
      if (!body.password) delete body.password;
      if (!isEdit) {
        body.password = nextPayload.password.trim();
      }

      const response = await fetch(endpoint, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to save user.");
      }

      const savedUser = normalizeUser(payload?.data?.user || payload?.user || body);

      setUsers((prev) => {
        if (isEdit) {
          return prev.map((user) => {
            const userId = user.id || user._id;
            const targetId = savedUser.id || savedUser._id;
            return userId === targetId ? { ...user, ...savedUser } : user;
          });
        }

        return [savedUser, ...prev];
      });

      toast.success(isEdit ? "User updated successfully." : "User created successfully.");
      closeFormModal();
    } catch (error) {
      toast.error(error?.message || "Unable to save user.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    const id = user.id || user._id;
    if (!id) return;

    const confirmed = window.confirm(`Delete ${user.fullName || user.username || "this user"}?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:3000/api/admin/users/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Unable to delete user.");
      }

      setUsers((prev) => prev.filter((item) => (item.id || item._id) !== id));
      toast.success("User deleted successfully.");
      if (selectedUser && (selectedUser.id || selectedUser._id) === id) {
        setSelectedUser(null);
      }
    } catch (error) {
      toast.error(error?.message || "Unable to delete user.");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">User list</h2>
          <p className="mt-1 text-sm text-slate-400">Search, inspect, and manage user accounts from the platform.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search users by name, email, role, status..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
          />
        </div>

        <div className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-slate-300">
          {filteredUsers.length} users
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_0.45fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-800">
          <div className="max-h-[540px] overflow-auto">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-sm">
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="w-[24%] px-4 py-3 font-medium">Name</th>
                  <th className="w-[26%] px-4 py-3 font-medium">Email</th>
                  <th className="w-[14%] px-4 py-3 font-medium">Role</th>
                  <th className="w-[16%] px-4 py-3 font-medium">Status</th>
                  <th className="w-[20%] px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading user data...
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      No users match the current search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr key={user.id || user._id || user.email} className={`cursor-pointer border-b border-slate-800 last:border-b-0 transition hover:bg-slate-800/60 ${index % 2 === 0 ? "bg-slate-900/30" : "bg-slate-900/60"}`} onClick={() => setSelectedUser(user)}>
                      <td className="max-w-0 truncate px-4 py-3 font-medium text-white" title={user.fullName || user.username}>
                        {user.fullName || user.username}
                      </td>
                      <td className="max-w-0 truncate px-4 py-3 text-slate-300" title={user.email}>{user.email}</td>
                      <td className="max-w-0 truncate px-4 py-3 text-slate-300" title={user.role}>{user.role}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${userBadgeClasses[user.status] || "bg-slate-700 text-slate-200"}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedUser(user);
                            }}
                            className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 transition hover:border-emerald-500/40 hover:text-emerald-400"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditModal(user);
                            }}
                            className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 transition hover:border-sky-500/40 hover:text-sky-400"
                            title="Edit user"
                          >
                            <PencilLine className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(user);
                            }}
                            className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 transition hover:border-rose-500/40 hover:text-rose-400"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          {selectedUser ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">User details</h3>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300"
                  aria-label="Close details"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-4 flex items-center gap-3">
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt={selectedUser.fullName || selectedUser.username} className="h-12 w-12 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-base font-black text-slate-950">
                    {(selectedUser.fullName || selectedUser.username || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-bold text-white">{selectedUser.fullName || selectedUser.username}</div>
                  <div className="text-sm text-slate-400">@{selectedUser.username || "username"}</div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <span className="text-slate-400">Role</span>
                  <span className="font-medium text-white">{selectedUser.role}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <span className="text-slate-400">Status</span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${userBadgeClasses[selectedUser.status] || "bg-slate-700 text-slate-200"}`}>
                    {selectedUser.status}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="text-slate-400">Email</div>
                  <div className="mt-1 font-medium text-white break-all">{selectedUser.email}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="text-slate-400">Phone</div>
                  <div className="mt-1 font-medium text-white">{selectedUser.phone || "Not provided"}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="text-slate-400">Organization</div>
                  <div className="mt-1 font-medium text-white">{selectedUser.organizationName || "Not provided"}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="text-slate-400">Address</div>
                  <div className="mt-1 font-medium text-white">{selectedUser.address || "Not provided"}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="text-slate-400">Bio</div>
                  <div className="mt-1 font-medium text-white">{selectedUser.bio || "No bio added."}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="text-slate-400">Created</div>
                  <div className="mt-1 font-medium text-white">{formatUserDate(selectedUser.createdAt)}</div>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(selectedUser)}
                  className="flex-1 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-400"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(selectedUser)}
                  className="flex-1 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-400"
                >
                  Delete
                </button>
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-[220px] items-center justify-center text-center text-sm text-slate-400">
              Select a user to view the full API profile details.
            </div>
          )}
        </aside>
      </div>

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-slate-950/60">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-black text-white">{formMode === "create" ? "Add user" : "Edit user"}</h3>
              <button type="button" onClick={closeFormModal} className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-300">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-5 flex items-center gap-4 rounded-2xl border border-slate-700 bg-slate-950 p-3">
              <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Profile avatar preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-black text-slate-300">
                    { (formData.fullName || formData.username || "U").charAt(0).toUpperCase() }
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="text-sm text-slate-300">Profile image</div>
                <label className="mt-2 inline-flex cursor-pointer items-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-400">
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  {uploadingAvatar ? "Uploading..." : "Upload image"}
                </label>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-300">
                <span>Full name</span>
                <input value={formData.fullName} onChange={(event) => handleFormChange("fullName", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
              </label>

              <label className="space-y-2 text-sm text-slate-300">
                <span>Username</span>
                <input value={formData.username} onChange={(event) => handleFormChange("username", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
              </label>

              <label className="space-y-2 text-sm text-slate-300">
                <span>Email</span>
                <input type="email" value={formData.email} onChange={(event) => handleFormChange("email", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
              </label>

              <label className="space-y-2 text-sm text-slate-300">
                <span>Phone</span>
                <input value={formData.phone} onChange={(event) => handleFormChange("phone", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
              </label>

              <label className="space-y-2 text-sm text-slate-300">
                <span>Role</span>
                <select value={formData.role} onChange={(event) => handleFormChange("role", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500">
                  <option value="USER">USER</option>
                  <option value="ORGANIZER">ORGANIZER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>

              <label className="space-y-2 text-sm text-slate-300">
                <span>Organization</span>
                <input value={formData.organizationName} onChange={(event) => handleFormChange("organizationName", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
              </label>

              {formMode === "create" && (
                <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                  <span>Password</span>
                  <input type="password" value={formData.password} onChange={(event) => handleFormChange("password", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                </label>
              )}

              <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                <span>Address</span>
                <input value={formData.address} onChange={(event) => handleFormChange("address", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
              </label>

              <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                <span>Bio</span>
                <textarea rows={4} value={formData.bio} onChange={(event) => handleFormChange("bio", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 md:col-span-2">
                <input type="checkbox" checked={formData.isVerified} onChange={(event) => handleFormChange("isVerified", event.target.checked)} className="h-4 w-4 accent-emerald-500" />
                Verified user
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={closeFormModal} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-200">
                Cancel
              </button>
              <button type="button" onClick={handleSubmit} disabled={saving} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70">
                {saving ? "Saving..." : formMode === "create" ? "Create user" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
