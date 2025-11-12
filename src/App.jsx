import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "";

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [me, setMe] = useState(null);
  const authed = !!token;

  async function login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
  }

  async function register(name, email, password, role) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken("");
    setMe(null);
  }

  useEffect(() => {
    if (!token) return;
    (async () => {
      const res = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMe(await res.json());
    })();
  }, [token]);

  return { token, me, authed, login, register, logout };
}

function AuthForm({ onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (mode === "login") await onLogin(email, password);
      else await onRegister(name, email, password, role);
    } catch (err) {
      setError("Authentication failed");
    }
  };

  return (
    <div className="max-w-md w-full bg-white/70 backdrop-blur p-6 rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        {mode === "login" ? "Welcome back" : "Create your account"}
      </h2>
      <form onSubmit={submit} className="space-y-3">
        {mode === "register" && (
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <input
          className="w-full border rounded px-3 py-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full border rounded px-3 py-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {mode === "register" && (
          <select
            className="w-full border rounded px-3 py-2"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">
          {mode === "login" ? "Login" : "Register"}
        </button>
      </form>
      <p className="text-sm text-gray-600 mt-4">
        {mode === "login" ? (
          <>
            Don't have an account?{" "}
            <button className="underline" onClick={() => setMode("register")}>
              Register
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button className="underline" onClick={() => setMode("login")}>
              Login
            </button>
          </>
        )}
      </p>
    </div>
  );
}

function Topbar({ me, onLogout }) {
  return (
    <div className="w-full flex items-center justify-between py-4">
      <h1 className="text-xl font-semibold">Student Portal</h1>
      <div className="flex items-center gap-3">
        <span className="text-gray-700">{me?.name} ({me?.role})</span>
        <button onClick={onLogout} className="px-3 py-1.5 rounded bg-gray-800 text-white">
          Logout
        </button>
      </div>
    </div>
  );
}

function StudentDashboard({ token }) {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    (async () => {
      const c = await fetch(`${API_BASE}/student/courses`, { headers: { Authorization: `Bearer ${token}` } });
      if (c.ok) setCourses(await c.json());
      const a = await fetch(`${API_BASE}/student/assignments`, { headers: { Authorization: `Bearer ${token}` } });
      if (a.ok) setAssignments(await a.json());
      const an = await fetch(`${API_BASE}/announcements`, { headers: { Authorization: `Bearer ${token}` } });
      if (an.ok) setAnnouncements(await an.json());
    })();
  }, [token]);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <section className="bg-white rounded-xl p-4 shadow md:col-span-2">
        <h3 className="font-semibold mb-3">My Courses</h3>
        <ul className="space-y-2">
          {courses.map((c) => (
            <li key={c.id} className="p-3 rounded border">
              <div className="font-medium">{c.title}</div>
              <div className="text-sm text-gray-600">{c.subject}</div>
            </li>
          ))}
          {!courses.length && <p className="text-sm text-gray-500">Not enrolled yet.</p>}
        </ul>
      </section>
      <section className="bg-white rounded-xl p-4 shadow">
        <h3 className="font-semibold mb-3">Announcements</h3>
        <ul className="space-y-2 max-h-72 overflow-auto">
          {announcements.map((a) => (
            <li key={a.id} className="p-3 rounded border">
              <div className="font-medium">{a.title}</div>
              <div className="text-sm text-gray-600">{a.content}</div>
            </li>
          ))}
          {!announcements.length && <p className="text-sm text-gray-500">No announcements.</p>}
        </ul>
      </section>
      <section className="bg-white rounded-xl p-4 shadow md:col-span-3">
        <h3 className="font-semibold mb-3">Assignments</h3>
        <ul className="space-y-2">
          {assignments.map((a) => (
            <li key={a.id} className="p-3 rounded border">
              <div className="font-medium">{a.title}</div>
              <div className="text-sm text-gray-600">Due: {a.due_date ? new Date(a.due_date).toLocaleString() : "-"}</div>
            </li>
          ))}
          {!assignments.length && <p className="text-sm text-gray-500">No assignments yet.</p>}
        </ul>
      </section>
    </div>
  );
}

function TeacherDashboard({ token }) {
  const [courses, setCourses] = useState([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch(`${API_BASE}/teacher/courses`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCourses(await res.json());
    })();
  }, [token]);

  async function createCourse(e) {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/teacher/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, subject }),
    });
    if (res.ok) {
      const c = await res.json();
      setCourses([c, ...courses]);
      setTitle("");
      setSubject("");
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <section className="bg-white rounded-xl p-4 shadow md:col-span-1">
        <h3 className="font-semibold mb-3">Create Course</h3>
        <form onSubmit={createCourse} className="space-y-2">
          <input className="w-full border rounded px-3 py-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="w-full border rounded px-3 py-2" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded">Create</button>
        </form>
      </section>
      <section className="bg-white rounded-xl p-4 shadow md:col-span-2">
        <h3 className="font-semibold mb-3">My Courses</h3>
        <ul className="space-y-2">
          {courses.map((c) => (
            <li key={c.id} className="p-3 rounded border">
              <div className="font-medium">{c.title}</div>
              <div className="text-sm text-gray-600">{c.subject}</div>
            </li>
          ))}
          {!courses.length && <p className="text-sm text-gray-500">No courses yet.</p>}
        </ul>
      </section>
    </div>
  );
}

function AdminDashboard({ token }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      const u = await fetch(`${API_BASE}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      if (u.ok) setUsers(await u.json());
      const s = await fetch(`${API_BASE}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
      if (s.ok) setStats(await s.json());
    })();
  }, [token]);

  async function toggleApprove(user) {
    const res = await fetch(`${API_BASE}/admin/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: user.id, approved: !user.approved }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <section className="bg-white rounded-xl p-4 shadow md:col-span-2">
        <h3 className="font-semibold mb-3">Users</h3>
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id} className="p-3 rounded border flex items-center justify-between">
              <div>
                <div className="font-medium">{u.name} — {u.role}</div>
                <div className="text-sm text-gray-600">{u.email}</div>
              </div>
              <button onClick={() => toggleApprove(u)} className={`px-3 py-1.5 rounded ${u.approved ? "bg-red-600" : "bg-green-600"} text-white`}>
                {u.approved ? "Revoke" : "Approve"}
              </button>
            </li>
          ))}
          {!users.length && <p className="text-sm text-gray-500">No users yet.</p>}
        </ul>
      </section>
      <section className="bg-white rounded-xl p-4 shadow">
        <h3 className="font-semibold mb-3">Analytics</h3>
        {stats ? (
          <ul className="space-y-1 text-sm">
            {Object.entries(stats).map(([k, v]) => (
              <li key={k} className="flex justify-between"><span className="capitalize">{k}</span><span className="font-medium">{v}</span></li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Loading...</p>
        )}
      </section>
    </div>
  );
}

export default function App() {
  const { token, me, authed, login, register, logout } = useAuth();

  if (!authed || !me) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
        <AuthForm onLogin={login} onRegister={register} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Topbar me={me} onLogout={logout} />
      {me.role === "student" && <StudentDashboard token={token} />}
      {me.role === "teacher" && <TeacherDashboard token={token} />}
      {me.role === "admin" && <AdminDashboard token={token} />}
    </div>
  );
}
