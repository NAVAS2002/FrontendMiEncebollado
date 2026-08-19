import { useEffect, useState } from "react";
import { createUser, deactivateUser, listUsers, setUserPin } from "../../../api/auth";
import { ApiError } from "../../../api/client";
import type { Role, UserOut } from "../../../api/types";
import { CashierShell } from "../../../components/CashierShell";
import { Icon } from "../../../components/Icon";
import { Loading } from "../../../components/Loading";

const ROLES: Role[] = ["WAITER", "CASHIER", "KITCHEN", "ADMIN"];

export default function Users() {
  const [users, setUsers] = useState<UserOut[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    listUsers()
      .then(setUsers)
      .catch(() => setError("No se pudieron cargar los usuarios."));
  }

  useEffect(load, []);

  async function deactivate(id: string) {
    if (!confirm("¿Desactivar este usuario?")) return;
    await deactivateUser(id);
    load();
  }

  return (
    <CashierShell title="Usuarios">
      <div className="max-w-2xl mx-auto p-margin-mobile flex flex-col gap-stack-lg">
        <div className="flex justify-between items-center">
          <h2 className="font-headline-md text-headline-md">Personal</h2>
          <button
            onClick={() => setCreating((v) => !v)}
            className="h-11 px-4 rounded-full bg-tertiary text-on-tertiary font-label-caps text-label-caps flex items-center gap-1"
          >
            <Icon name="add" className="text-[18px]" /> Nuevo usuario
          </button>
        </div>

        {creating && <CreateUserForm onCreated={() => { setCreating(false); load(); }} />}

        {error && <p className="text-error font-body-md text-center">{error}</p>}
        {!users && !error && <Loading label="Cargando usuarios…" />}
        {users && (
          <div className="flex flex-col gap-stack-sm">
            {users.map((u) => (
              <UserRow key={u.id} user={u} onChanged={load} onDeactivate={() => deactivate(u.id)} />
            ))}
          </div>
        )}
      </div>
    </CashierShell>
  );
}

function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("WAITER");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsPassword = role === "ADMIN" || role === "CASHIER";

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await createUser({
        username: username.trim(),
        full_name: fullName.trim(),
        role,
        password: needsPassword ? password : undefined,
        pin: pin.trim() || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el usuario.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-sm">
      <div className="grid grid-cols-2 gap-stack-sm">
        <Field label="Usuario" value={username} onChange={setUsername} />
        <Field label="Nombre completo" value={fullName} onChange={setFullName} />
      </div>
      <div>
        <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Rol</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="w-full h-12 rounded-lg border border-outline-variant bg-surface px-4 font-body-md text-body-md outline-none focus:ring-2 focus:ring-tertiary"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-stack-sm">
        {needsPassword && (
          <Field label="Contraseña" value={password} onChange={setPassword} type="password" />
        )}
        <Field label="PIN (opcional, 4-6 dígitos)" value={pin} onChange={setPin} />
      </div>
      {error && <p className="text-error font-body-md text-sm">{error}</p>}
      <button
        onClick={submit}
        disabled={busy || !username.trim() || !fullName.trim() || (needsPassword && !password)}
        className="h-12 rounded-full bg-tertiary text-on-tertiary font-headline-md text-headline-md disabled:opacity-50"
      >
        {busy ? "Creando…" : "Crear usuario"}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 rounded-lg border border-outline-variant bg-surface px-4 font-body-md text-body-md outline-none focus:ring-2 focus:ring-tertiary"
      />
    </div>
  );
}

function UserRow({
  user,
  onChanged,
  onDeactivate,
}: {
  user: UserOut;
  onChanged: () => void;
  onDeactivate: () => void;
}) {
  const [editingPin, setEditingPin] = useState(false);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  async function savePin() {
    if (pin.length < 4) return;
    setBusy(true);
    try {
      await setUserPin(user.id, pin);
      setEditingPin(false);
      setPin("");
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-body-md text-body-md font-medium">{user.full_name}</p>
          <p className="font-label-caps text-label-caps text-on-surface-variant">
            {user.username} · {user.role} {!user.is_active && "· inactivo"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditingPin((v) => !v)} className="text-on-surface-variant">
            <Icon name="pin" />
          </button>
          {user.is_active && (
            <button onClick={onDeactivate} className="text-error">
              <Icon name="person_off" />
            </button>
          )}
        </div>
      </div>
      {editingPin && (
        <div className="flex gap-stack-sm">
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            maxLength={6}
            placeholder="Nuevo PIN"
            className="flex-1 h-10 rounded-lg border border-outline-variant bg-surface px-3 font-numeric-pin text-[16px] outline-none"
          />
          <button
            onClick={savePin}
            disabled={busy || pin.length < 4}
            className="h-10 px-4 rounded-full bg-tertiary text-on-tertiary font-label-caps text-label-caps disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}
