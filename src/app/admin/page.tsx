"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNavProvider, MobileHeader } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Building2,
  Plus,
  Search,
  Trash2,
  Edit2,
  Mail,
  Phone,
  Shield,
  UserCircle,
  RefreshCw,
  Copy,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { User, Client, UserRole } from "@/types";
import { formatRelativeDate } from "@/lib/date-utils";
import { toast } from "@/hooks/useToast";
import { AdminCardSkeletonGrid } from "@/components/skeletons";

type TabType = "team" | "clients";

interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
}

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>("team");
  const [searchQuery, setSearchQuery] = useState("");

  // Users state
  const [users, setUsers] = useState<(User & { id: string })[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<(User & { id: string }) | null>(null);
  const [userForm, setUserForm] = useState<UserFormData>({ name: "", email: "", role: "team" });
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Clients state
  const [clients, setClients] = useState<(Client & { id: string })[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<(Client & { id: string }) | null>(null);
  const [clientForm, setClientForm] = useState<ClientFormData>({ name: "", email: "", phone: "", company: "" });
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Load users
  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // Load clients
  const loadClients = useCallback(async () => {
    setIsLoadingClients(true);
    try {
      const response = await fetch("/api/clients");
      const data = await response.json();
      if (data.success) {
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setIsLoadingClients(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadClients();
  }, [loadUsers, loadClients]);

  // Filter users based on search
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter clients based on search
  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle user form submit
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingUser(true);

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });

      const data = await response.json();
      if (data.success) {
        setShowUserModal(false);
        setEditingUser(null);
        setUserForm({ name: "", email: "", role: "team" });
        loadUsers();
        toast.success(editingUser ? "Usuário atualizado!" : "Usuário criado!");
      } else {
        toast.error(data.error || "Erro ao salvar usuário");
      }
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("Erro ao salvar usuário");
    } finally {
      setIsSavingUser(false);
    }
  };

  // Handle client form submit
  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingClient(true);

    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : "/api/clients";
      const method = editingClient ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientForm),
      });

      const data = await response.json();
      if (data.success) {
        setShowClientModal(false);
        setEditingClient(null);
        setClientForm({ name: "", email: "", phone: "", company: "" });
        loadClients();
        toast.success(editingClient ? "Cliente atualizado!" : "Cliente criado!");
      } else {
        toast.error(data.error || "Erro ao salvar cliente");
      }
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error("Erro ao salvar cliente");
    } finally {
      setIsSavingClient(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário?")) return;

    try {
      const response = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        loadUsers();
        toast.success("Usuário removido!");
      } else {
        toast.error(data.error || "Erro ao remover usuário");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Erro ao remover usuário");
    }
  };

  // Delete client
  const handleDeleteClient = async (clientId: string) => {
    if (!confirm("Tem certeza que deseja remover este cliente?")) return;

    try {
      const response = await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        loadClients();
        toast.success("Cliente removido!");
      } else {
        toast.error(data.error || "Erro ao remover cliente");
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Erro ao remover cliente");
    }
  };

  // Copy access token
  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Regenerate client token
  const regenerateToken = async (clientId: string) => {
    if (!confirm("Tem certeza? Links públicos existentes deixarão de funcionar.")) return;

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerateToken: true }),
      });
      const data = await response.json();
      if (data.success) {
        loadClients();
        if (data.newAccessToken) {
          copyToken(data.newAccessToken);
        }
      }
    } catch (error) {
      console.error("Error regenerating token:", error);
    }
  };

  // Role badge
  const getRoleBadge = (role: UserRole) => {
    const colors = {
      admin: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      team: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      client: "bg-green-500/20 text-green-300 border-green-500/30",
    };
    const labels = { admin: "Admin", team: "Equipe", client: "Cliente" };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[role]}`}>
        {labels[role]}
      </span>
    );
  };

  return (
    <MobileNavProvider>
      <div className="min-h-screen bg-[#09090B] flex flex-col lg:flex-row">
        <MobileHeader />
        <Sidebar />

        <main className="flex-1 overflow-auto">
          {/* Header */}
          <div className="border-b border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-10">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">Administração</h1>
                  <p className="text-sm text-white/50 mt-1">Gerencie equipe e clientes</p>
                </div>

                <Button
                  onClick={() => {
                    if (activeTab === "team") {
                      setEditingUser(null);
                      setUserForm({ name: "", email: "", role: "team" });
                      setShowUserModal(true);
                    } else {
                      setEditingClient(null);
                      setClientForm({ name: "", email: "", phone: "", company: "" });
                      setShowClientModal(true);
                    }
                  }}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {activeTab === "team" ? "Novo Usuário" : "Novo Cliente"}
                </Button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setActiveTab("team")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "team"
                      ? "bg-white/10 text-white"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Equipe ({users.length})
                </button>
                <button
                  onClick={() => setActiveTab("clients")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "clients"
                      ? "bg-white/10 text-white"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Clientes ({clients.length})
                </button>
              </div>

              {/* Search */}
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder={activeTab === "team" ? "Buscar usuários..." : "Buscar clientes..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 lg:p-8">
            {activeTab === "team" ? (
              // Users Grid
              isLoadingUsers ? (
                <AdminCardSkeletonGrid count={6} />
              ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredUsers.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <UserCircle className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/50">Nenhum usuário encontrado</p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="bg-white/[0.02] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-white">{user.name}</h3>
                            <p className="text-sm text-white/50">{user.email}</p>
                          </div>
                        </div>
                        {getRoleBadge(user.role)}
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-xs text-white/40">
                          Criado {formatRelativeDate(user.createdAt)}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 text-white/50 hover:text-white"
                            onClick={() => {
                              setEditingUser(user);
                              setUserForm({ name: user.name, email: user.email, role: user.role });
                              setShowUserModal(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 text-white/50 hover:text-red-400"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              )
            ) : (
              // Clients Grid
              isLoadingClients ? (
                <AdminCardSkeletonGrid count={6} />
              ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredClients.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Building2 className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/50">Nenhum cliente encontrado</p>
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className="bg-white/[0.02] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-white">{client.name}</h3>
                          {client.company && (
                            <p className="text-sm text-white/50">{client.company}</p>
                          )}
                        </div>
                        {client.logo && (
                          <img
                            src={client.logo}
                            alt={client.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        )}
                      </div>

                      <div className="mt-3 space-y-1">
                        <div className="flex items-center gap-2 text-sm text-white/60">
                          <Mail className="w-4 h-4" />
                          {client.email}
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2 text-sm text-white/60">
                            <Phone className="w-4 h-4" />
                            {client.phone}
                          </div>
                        )}
                      </div>

                      {/* Access Token */}
                      <div className="mt-3 p-2 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/40">Token de acesso</span>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-6 h-6 text-white/50 hover:text-white"
                              onClick={() => copyToken(client.accessToken)}
                              title="Copiar token"
                            >
                              {copiedToken === client.accessToken ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-6 h-6 text-white/50 hover:text-yellow-400"
                              onClick={() => regenerateToken(client.id)}
                              title="Regenerar token"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-white/30 font-mono truncate mt-1">
                          {client.accessToken.substring(0, 20)}...
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-xs text-white/40">
                          Criado {formatRelativeDate(client.createdAt)}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 text-white/50 hover:text-white"
                            onClick={() => {
                              setEditingClient(client);
                              setClientForm({
                                name: client.name,
                                email: client.email,
                                phone: client.phone || "",
                                company: client.company || "",
                              });
                              setShowClientModal(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 text-white/50 hover:text-red-400"
                            onClick={() => handleDeleteClient(client.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              )
            )}
          </div>
        </main>

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md m-4 bg-[#0A0A0A] rounded-2xl border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">
                    {editingUser ? "Editar Usuário" : "Novo Usuário"}
                  </h2>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowUserModal(false)}
                  className="text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleUserSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Nome</label>
                  <Input
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="Nome completo"
                    className="bg-white/5 border-white/10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Email</label>
                  <Input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className="bg-white/5 border-white/10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Função</label>
                  <div className="flex gap-2">
                    {(["admin", "team"] as UserRole[]).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setUserForm({ ...userForm, role })}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                          userForm.role === role
                            ? "bg-purple-500/20 border-purple-500/50 text-white"
                            : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                        {role === "admin" ? "Admin" : "Equipe"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowUserModal(false)}
                    className="flex-1 border border-white/10"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingUser}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500"
                  >
                    {isSavingUser ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      editingUser ? "Salvar" : "Criar"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Client Modal */}
        {showClientModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md m-4 bg-[#0A0A0A] rounded-2xl border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">
                    {editingClient ? "Editar Cliente" : "Novo Cliente"}
                  </h2>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowClientModal(false)}
                  className="text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleClientSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Nome</label>
                  <Input
                    value={clientForm.name}
                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                    placeholder="Nome do cliente"
                    className="bg-white/5 border-white/10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Email</label>
                  <Input
                    type="email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    placeholder="email@cliente.com"
                    className="bg-white/5 border-white/10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Telefone</label>
                  <Input
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Empresa</label>
                  <Input
                    value={clientForm.company}
                    onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                    placeholder="Nome da empresa"
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowClientModal(false)}
                    className="flex-1 border border-white/10"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingClient}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500"
                  >
                    {isSavingClient ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      editingClient ? "Salvar" : "Criar"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MobileNavProvider>
  );
}
