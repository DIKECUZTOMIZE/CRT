import { useEffect, useMemo, useState } from "react";
import { Eye, Loader2, PencilLine, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const emptyOrganizerForm = {
  username: "",
  email: "",
  fullName: "",
  roleTitle: "",
  role: "ORGANIZER",
  phone: "",
  organizationName: "",
  organizationType: "",
  website: "",
  address: "",
  bio: "",
  avatar: "",
  password: "",
  isVerified: false,
  socials: {
    instagram: "",
    twitter: "",
    linkedin: "",
  },
};

const normalizeOrganizer = (user = {}) => {
  const userId = user.id || user._id || "";
  const status = user.status || (user.isVerified ? "Verified" : "Review");

  return {
    id: String(userId),
    _id: user._id ? String(user._id) : String(userId),
    username: user.username || "",
    email: user.email || "",
    fullName: user.fullName || user.organizationName || user.username || "Unknown organizer",
    role: user.role || "ORGANIZER",
    roleTitle: user.roleTitle || "",
    phone: user.phone || "",
    organizationName: user.organizationName || "",
    organizationType: user.organizationType || "",
    website: user.website || "",
    address: user.address || "",
    bio: user.bio || "",
    avatar: user.avatar || "",
    socials: user.socials || { instagram: "", twitter: "", linkedin: "" },
    isVerified: Boolean(user.isVerified),
    status,
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  };
};

const organizerBadgeClasses = {
  Verified: "bg-emerald-500/10 text-emerald-400",
  Review: "bg-amber-500/10 text-amber-400",
  Suspended: "bg-rose-500/10 text-rose-400",
  Blocked: "bg-rose-500/10 text-rose-400",
};

const formatOrganizerDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
};

const toFormValues = (organizer, mode = "edit") => {
  if (!organizer || mode === "create") {
    return { ...emptyOrganizerForm };
  }

  return {
    username: organizer.username || "",
    email: organizer.email || "",
    fullName: organizer.fullName || "",
    roleTitle: organizer.roleTitle || "",
    role: organizer.role || "ORGANIZER",
    phone: organizer.phone || "",
    organizationName: organizer.organizationName || "",
    organizationType: organizer.organizationType || "",
    website: organizer.website || "",
    address: organizer.address || "",
    bio: organizer.bio || "",
    avatar: organizer.avatar || "",
    socials: organizer.socials || { instagram: "", twitter: "", linkedin: "" },
    password: "",
    isVerified: Boolean(organizer.isVerified),
  };
};

export const OrganizerList = () => {
  const [organizers, setOrganizers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formData, setFormData] = useState(emptyOrganizerForm);
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const uploadOrganizerAvatar = async (file) => {
    if (!file) return "";

    const form = new FormData();
    form.append("image", file);

    setUploadingAvatar(true);

    try {
      const response = await fetch("http://localhost:3000/api/upload/image", {
        method: "POST",
        credentials: "include",
        body: form,
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

  const fetchOrganizers = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/admin/users?role=ORGANIZER", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Unable to load organizers.");
      }

      const next = Array.isArray(payload?.data) ? payload.data : [];
      setOrganizers(next.map(normalizeOrganizer));
    } catch (error) {
      toast.error(error?.message || "Unable to load organizers.");
      setOrganizers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const filteredOrganizers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return organizers;

    return organizers.filter((organizer) =>
      [organizer.fullName, organizer.username, organizer.email, organizer.role, organizer.status, organizer.organizationName]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [organizers, searchTerm]);

  const openCreateModal = () => {
    setFormMode("create");
    setSelectedOrganizer(null);
    setFormData({ ...emptyOrganizerForm });
    setShowFormModal(true);
  };

  const openEditModal = (organizer) => {
    setFormMode("edit");
    setSelectedOrganizer(organizer);
    setFormData(toFormValues(organizer, "edit"));
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setSelectedOrganizer(null);
    setFormData({ ...emptyOrganizerForm });
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploadedUrl = await uploadOrganizerAvatar(file);
    if (uploadedUrl) {
      handleFormChange("avatar", uploadedUrl);
      toast.success("Organizer image updated successfully.");
    }
  };

  const handleSubmit = async () => {
    const nextPayload = {
      ...formData,
      fullName: formData.fullName?.trim() || formData.username?.trim() || "",
      roleTitle: formData.roleTitle?.trim() || "",
      username: formData.username?.trim(),
      email: formData.email?.trim(),
      phone: formData.phone?.trim(),
      organizationName: formData.organizationName?.trim(),
      organizationType: formData.organizationType?.trim() || "",
      website: formData.website?.trim() || "",
      address: formData.address?.trim(),
      bio: formData.bio?.trim(),
      avatar: formData.avatar?.trim() || "",
      socials: {
        instagram: formData.socials?.instagram?.trim() || "",
        twitter: formData.socials?.twitter?.trim() || "",
        linkedin: formData.socials?.linkedin?.trim() || "",
      },
      role: "ORGANIZER",
    };

    if (!nextPayload.username || !nextPayload.email) {
      toast.error("Username and email are required.");
      return;
    }

    if (formMode === "create" && !nextPayload.password) {
      toast.error("Password is required to create an organizer.");
      return;
    }

    setSaving(true);

    try {
      const isEdit = formMode === "edit" && selectedOrganizer;
      const endpoint = isEdit ? `http://localhost:3000/api/admin/organizers/${selectedOrganizer.id || selectedOrganizer._id}` : "http://localhost:3000/api/admin/organizers";
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
        throw new Error(payload?.message || "Failed to save organizer.");
      }

      const savedOrganizer = normalizeOrganizer(payload?.data?.organizer || payload?.organizer || body);

      setOrganizers((prev) => {
        if (isEdit) {
          return prev.map((organizer) => {
            const organizerId = organizer.id || organizer._id;
            const targetId = savedOrganizer.id || savedOrganizer._id;
            return organizerId === targetId ? { ...organizer, ...savedOrganizer } : organizer;
          });
        }

        return [savedOrganizer, ...prev];
      });

      toast.success(isEdit ? "Organizer updated successfully." : "Organizer created successfully.");
      closeFormModal();
    } catch (error) {
      toast.error(error?.message || "Unable to save organizer.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (organizer) => {
    const id = organizer.id || organizer._id;
    if (!id) return;

    const confirmed = window.confirm(`Delete ${organizer.fullName || organizer.username || "this organizer"}?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:3000/api/admin/organizers/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Unable to delete organizer.");
      }

      setOrganizers((prev) => prev.filter((item) => (item.id || item._id) !== id));
      toast.success("Organizer deleted successfully.");
      if (selectedOrganizer && (selectedOrganizer.id || selectedOrganizer._id) === id) {
        setSelectedOrganizer(null);
      }
    } catch (error) {
      toast.error(error?.message || "Unable to delete organizer.");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Organizer list</h2>
          <p className="mt-1 text-sm text-slate-400">Review and manage organizer accounts, verification, and organization data.</p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" />
          Add Organizer
        </button>
      </div>

      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search organizers by name, email, organization..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
          />
        </div>

        <div className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-slate-300">
          {filteredOrganizers.length} organizers
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
                        Loading organizer data...
                      </div>
                    </td>
                  </tr>
                ) : filteredOrganizers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      No organizers match the current search.
                    </td>
                  </tr>
                ) : (
                  filteredOrganizers.map((organizer, index) => (
                    <tr key={organizer.id || organizer._id || organizer.email} className={`cursor-pointer border-b border-slate-800 last:border-b-0 transition hover:bg-slate-800/60 ${index % 2 === 0 ? "bg-slate-900/30" : "bg-slate-900/60"}`} onClick={() => setSelectedOrganizer(organizer)}>
                      <td className="max-w-0 truncate px-4 py-3 font-medium text-white" title={organizer.fullName || organizer.username}>{organizer.fullName || organizer.username}</td>
                      <td className="max-w-0 truncate px-4 py-3 text-slate-300" title={organizer.email}>{organizer.email}</td>
                      <td className="max-w-0 truncate px-4 py-3 text-slate-300" title={organizer.role || "ORGANIZER"}>{organizer.role || "ORGANIZER"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${organizerBadgeClasses[organizer.status] || "bg-slate-700 text-slate-200"}`}>
                          {organizer.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedOrganizer(organizer); }} className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 transition hover:border-emerald-500/40 hover:text-emerald-400" title="View details">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={(event) => { event.stopPropagation(); openEditModal(organizer); }} className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 transition hover:border-sky-500/40 hover:text-sky-400" title="Edit organizer">
                            <PencilLine className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={(event) => { event.stopPropagation(); handleDelete(organizer); }} className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 transition hover:border-rose-500/40 hover:text-rose-400" title="Delete organizer">
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
          {selectedOrganizer ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Organizer details</h3>
                <button type="button" onClick={() => setSelectedOrganizer(null)} className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300" aria-label="Close details">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-4 flex items-center gap-3">
                {selectedOrganizer.avatar ? (
                  <img src={selectedOrganizer.avatar} alt={selectedOrganizer.fullName || selectedOrganizer.username} className="h-12 w-12 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-base font-black text-slate-950">
                    {(selectedOrganizer.fullName || selectedOrganizer.username || "O").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-bold text-white">{selectedOrganizer.fullName || selectedOrganizer.username}</div>
                  <div className="text-sm text-slate-400">@{selectedOrganizer.username || "organizer"}</div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <span className="text-slate-400">Status</span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${organizerBadgeClasses[selectedOrganizer.status] || "bg-slate-700 text-slate-200"}`}>
                    {selectedOrganizer.status}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="text-slate-400">Full Name</div>
                  <div className="mt-1 font-medium text-white">{selectedOrganizer.fullName || "Not provided"}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="text-slate-400">Role Title</div>
                  <div className="mt-1 font-medium text-white">{selectedOrganizer.roleTitle || "Not provided"}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="text-slate-400">Email</div>
                  <div className="mt-1 font-medium text-white break-all">{selectedOrganizer.email}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="text-slate-400">Phone</div>
                  <div className="mt-1 font-medium text-white">{selectedOrganizer.phone || "Not provided"}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="text-slate-400">Organization</div>
                  <div className="mt-1 font-medium text-white">{selectedOrganizer.organizationName || "Not provided"}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="text-slate-400">Website</div>
                  <div className="mt-1 font-medium text-white break-all">{selectedOrganizer.website || "Not provided"}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="text-slate-400">Organization Type</div>
                  <div className="mt-1 font-medium text-white">{selectedOrganizer.organizationType || "Not provided"}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="text-slate-400">Address</div>
                  <div className="mt-1 font-medium text-white">{selectedOrganizer.address || "Not provided"}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="text-slate-400">Bio</div>
                  <div className="mt-1 font-medium text-white">{selectedOrganizer.bio || "No bio added."}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="text-slate-400">Social Links</div>
                  <div className="mt-2 space-y-1 text-white">
                    <div>Instagram: {selectedOrganizer.socials?.instagram || "Not provided"}</div>
                    <div>Twitter: {selectedOrganizer.socials?.twitter || "Not provided"}</div>
                    <div>LinkedIn: {selectedOrganizer.socials?.linkedin || "Not provided"}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="text-slate-400">Created</div>
                  <div className="mt-1 font-medium text-white">{formatOrganizerDate(selectedOrganizer.createdAt)}</div>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button type="button" onClick={() => openEditModal(selectedOrganizer)} className="flex-1 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-400">Edit</button>
                <button type="button" onClick={() => handleDelete(selectedOrganizer)} className="flex-1 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-400">Delete</button>
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-[220px] items-center justify-center text-center text-sm text-slate-400">
              Select an organizer to review the account details.
            </div>
          )}
        </aside>
      </div>

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-slate-950/60">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-black text-white">{formMode === "create" ? "Add organizer" : "Edit organizer"}</h3>
              <button type="button" onClick={closeFormModal} className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-300">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-5 flex items-center gap-4 rounded-2xl border border-slate-700 bg-slate-950 p-3">
              <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Organizer avatar preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-black text-slate-300">
                    {(formData.fullName || formData.username || "O").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="text-sm text-slate-300">Change Avatar</div>
                <div className="mt-1 text-xs text-slate-400">JPG, PNG or WEBP (Max 2MB)</div>
                <label className="mt-2 inline-flex cursor-pointer items-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-400">
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarUpload} className="hidden" />
                  {uploadingAvatar ? "Uploading..." : "Upload image"}
                </label>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Personal Info</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Full Name</span>
                    <input value={formData.fullName} onChange={(event) => handleFormChange("fullName", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                  </label>

                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Role Title</span>
                    <input value={formData.roleTitle} onChange={(event) => handleFormChange("roleTitle", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                  </label>

                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Email Address</span>
                    <input type="email" value={formData.email} onChange={(event) => handleFormChange("email", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                  </label>

                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Phone</span>
                    <input value={formData.phone} onChange={(event) => handleFormChange("phone", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                  </label>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Organization Info</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                    <span>Organization Name</span>
                    <input value={formData.organizationName} onChange={(event) => handleFormChange("organizationName", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                  </label>

                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Website</span>
                    <input value={formData.website} onChange={(event) => handleFormChange("website", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                  </label>

                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Organization Type</span>
                    <input value={formData.organizationType} onChange={(event) => handleFormChange("organizationType", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                  </label>

                  <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                    <span>Address</span>
                    <input value={formData.address} onChange={(event) => handleFormChange("address", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                  </label>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">About / Bio</h4>
                <label className="space-y-2 text-sm text-slate-300">
                  <textarea rows={4} value={formData.bio} onChange={(event) => handleFormChange("bio", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                </label>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Social Links</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Instagram</span>
                    <input value={formData.socials?.instagram || ""} onChange={(event) => handleFormChange("socials", { ...formData.socials, instagram: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                  </label>
                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Twitter</span>
                    <input value={formData.socials?.twitter || ""} onChange={(event) => handleFormChange("socials", { ...formData.socials, twitter: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                  </label>
                  <label className="space-y-2 text-sm text-slate-300">
                    <span>LinkedIn</span>
                    <input value={formData.socials?.linkedin || ""} onChange={(event) => handleFormChange("socials", { ...formData.socials, linkedin: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                  </label>
                </div>
              </div>

              {formMode === "create" && (
                <label className="space-y-2 text-sm text-slate-300">
                  <span>Password</span>
                  <input type="password" value={formData.password} onChange={(event) => handleFormChange("password", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                </label>
              )}

              <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-300">
                <input type="checkbox" checked={formData.isVerified} onChange={(event) => handleFormChange("isVerified", event.target.checked)} className="h-4 w-4 accent-emerald-500" />
                Verified organizer
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={closeFormModal} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-200">Cancel</button>
              <button type="button" onClick={handleSubmit} disabled={saving} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70">{saving ? "Saving..." : formMode === "create" ? "Create organizer" : "Save changes"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
