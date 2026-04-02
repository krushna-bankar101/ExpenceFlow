import { useState, useMemo } from "react";
import {
  UserPlus, Search, Edit2, Trash2, X, Check, Eye, EyeOff,
  User, Mail, Lock, Briefcase, Users, Shield, UserCheck
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import type { User as UserType } from "../../store/data";
import { toast } from "sonner";

type Role = "admin" | "manager" | "employee";

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: Role;
  managerId: string;
  department: string;
}

const emptyForm: UserFormData = {
  name: "", email: "", password: "", role: "employee", managerId: "", department: ""
};

export function UsersPage() {
  const { currentUser } = useAuth();
  const { users, addUser, updateUser, removeUser } = useApp();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<UserType | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<UserFormData>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.department || "").toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const managers = useMemo(() => users.filter((u) => u.role === "manager" || u.role === "admin"), [users]);

  const openCreate = () => {
    setEditUser(null);
    setForm(emptyForm);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (user: UserType) => {
    setEditUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      managerId: user.managerId || "",
      department: user.department || "",
    });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const e: Partial<UserFormData> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!editUser && !form.password) e.password = "Password is required";
    else if (!editUser && form.password.length < 6) e.password = "Min. 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (editUser) {
      await updateUser(editUser.id, {
        name: form.name,
        email: form.email,
        password: form.password || undefined,
        role: form.role,
        managerId: form.managerId || undefined,
        department: form.department || undefined,
      });
      toast.success("User updated successfully");
    } else {
      const result = await addUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        managerId: form.managerId || undefined,
        department: form.department || undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("User created successfully");
    }
    setShowModal(false);
  };

  const handleToggleActive = async (user: UserType) => {
    if (user.id === currentUser?.id) { toast.error("Cannot deactivate your own account"); return; }
    await updateUser(user.id, { isActive: !user.isActive });
    toast.success(user.isActive ? "User deactivated" : "User activated");
  };

  const handleDelete = async (userId: string) => {
    if (userId === currentUser?.id) { toast.error("Cannot delete your own account"); return; }
    await removeUser(userId);
    setDeleteConfirm(null);
    toast.success("User deleted");
  };

  const roleConfig = {
    admin: { label: "Admin", icon: Shield, color: "#d63384", bg: "#fce4ec" },
    manager: { label: "Manager", icon: UserCheck, color: "#7c3aed", bg: "#ede9fe" },
    employee: { label: "Employee", icon: User, color: "#059669", bg: "#d1fae5" },
  };

  const set = (field: keyof UserFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: undefined }));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-500">{users.length} total users in your organization</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold"
          style={{ background: "#d63384" }}
        >
          <UserPlus size={15} /> Add User
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {(["admin", "manager", "employee"] as Role[]).map((role) => {
          const count = users.filter((u) => u.role === role).length;
          const { label, icon: Icon, color, bg } = roleConfig[role];
          return (
            <div key={role} className="bg-white rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: "#fce7f3" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">{label}s</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 flex flex-col sm:flex-row gap-3" style={{ borderColor: "#fce7f3" }}>
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, department..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none"
            onFocus={(e) => (e.target.style.borderColor = "#d63384")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
        </div>
        <div className="flex gap-2">
          {(["all", "admin", "manager", "employee"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className="px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
              style={{
                background: roleFilter === r ? "#d63384" : "#fdf2f8",
                color: roleFilter === r ? "white" : "#9c4070",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#fce7f3" }}>
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 text-sm">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#fdf2f8" }}>
                  {["User", "Role", "Department", "Manager", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const { label, color, bg } = roleConfig[user.role];
                  const manager = users.find((u) => u.id === user.managerId);
                  return (
                    <tr key={user.id} className="border-t hover:bg-pink-50 transition-colors" style={{ borderColor: "#fce7f3" }}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: color }}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: bg, color }}>
                          {label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">{user.department || "—"}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{manager?.name || "—"}</td>
                      <td className="px-5 py-3">
                        <button onClick={() => handleToggleActive(user)} className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${user.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                          <span className={`text-xs font-medium ${user.isActive ? "text-green-600" : "text-gray-400"}`}>
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(user)} className="p-1.5 rounded hover:bg-pink-100 text-gray-400 hover:text-pink-600 transition-colors">
                            <Edit2 size={14} />
                          </button>
                          {user.id !== currentUser?.id && (
                            <button onClick={() => setDeleteConfirm(user.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">Delete User?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone. The user and their data will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "#fce7f3" }}>
              <h3 className="font-bold text-gray-900">{editUser ? "Edit User" : "Add New User"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={form.name} onChange={set("name")} placeholder="Full name"
                    className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm outline-none" style={{ borderColor: errors.name ? "#dc2626" : "#e5e7eb" }}
                    onFocus={(e) => (e.target.style.borderColor = "#d63384")} onBlur={(e) => (e.target.style.borderColor = errors.name ? "#dc2626" : "#e5e7eb")} />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={form.email} onChange={set("email")} placeholder="user@company.com"
                    className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm outline-none" style={{ borderColor: errors.email ? "#dc2626" : "#e5e7eb" }}
                    onFocus={(e) => (e.target.style.borderColor = "#d63384")} onBlur={(e) => (e.target.style.borderColor = errors.email ? "#dc2626" : "#e5e7eb")} />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password {editUser ? "(leave blank to keep)" : "*"}
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showPassword ? "text" : "password"} value={form.password} onChange={set("password")} placeholder={editUser ? "New password (optional)" : "Min. 6 characters"}
                    className="w-full pl-9 pr-10 py-2.5 border rounded-lg text-sm outline-none" style={{ borderColor: errors.password ? "#dc2626" : "#e5e7eb" }}
                    onFocus={(e) => (e.target.style.borderColor = "#d63384")} onBlur={(e) => (e.target.style.borderColor = errors.password ? "#dc2626" : "#e5e7eb")} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role *</label>
                  <select value={form.role} onChange={set("role")}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none"
                    onFocus={(e) => (e.target.style.borderColor = "#d63384")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Department</label>
                  <div className="relative">
                    <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={form.department} onChange={set("department")} placeholder="e.g., Finance"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none"
                      onFocus={(e) => (e.target.style.borderColor = "#d63384")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
                  </div>
                </div>
              </div>

              {form.role === "employee" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assign Manager</label>
                  <select value={form.managerId} onChange={set("managerId")}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none"
                    onFocus={(e) => (e.target.style.borderColor = "#d63384")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}>
                    <option value="">— No Manager —</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2" style={{ background: "#d63384" }}>
                  <Check size={15} /> {editUser ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
