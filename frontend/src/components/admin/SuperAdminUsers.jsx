import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Edit, Plus, RotateCcw } from 'lucide-react';

const SuperAdminUsers = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', active: true });
    const [resetPassword, setResetPassword] = useState('');

    const fetchAdmins = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/super-admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAdmins(res.data);
        } catch (error) {
            console.error(error);
            // alert('Erro ao carregar administradores'); // Silently fail or use toast
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            if (selectedAdmin) {
                await axios.put(`/api/super-admin/users/${selectedAdmin._id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/super-admin/users', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setShowModal(false);
            fetchAdmins();
        } catch (error) {
            alert(error.response?.data?.error || 'Erro ao salvar');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza? Esta ação removerá o acesso deste administrador.')) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`/api/super-admin/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAdmins();
        } catch (error) {
            alert('Erro ao remover');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await axios.post(`/api/super-admin/users/${selectedAdmin._id}/reset-password`, { newPassword: resetPassword }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowResetModal(false);
            alert('Senha redefinida com sucesso!');
        } catch (error) {
            alert('Erro ao redefinir senha');
        }
    };

    const openCreate = () => {
        setSelectedAdmin(null);
        setFormData({ name: '', email: '', phone: '', password: '', active: true });
        setShowModal(true);
    };

    const openEdit = (admin) => {
        setSelectedAdmin(admin);
        setFormData({ name: admin.name, email: admin.email, phone: admin.phone || '', active: admin.active });
        setShowModal(true);
    };

    const openReset = (admin) => {
        setSelectedAdmin(admin);
        setResetPassword('');
        setShowResetModal(true);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Gestão de Administradores</h2>
                    <p className="text-gray-500">Gerencie o acesso dos estabelecimentos</p>
                </div>
                <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                    <Plus size={20} /> Novo Administrador
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Nome / Estabelecimento</th>
                            <th className="p-4 font-semibold text-gray-600">Email / Login</th>
                            <th className="p-4 font-semibold text-gray-600">Data Criação</th>
                            <th className="p-4 font-semibold text-gray-600">Status</th>
                            <th className="p-4 font-semibold text-gray-600 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {admins.map(admin => (
                            <tr key={admin._id} className="hover:bg-gray-50">
                                <td className="p-4">
                                    <div className="font-medium text-gray-800">{admin.name}</div>
                                    <div className="text-xs text-gray-500">{admin.phone}</div>
                                </td>
                                <td className="p-4 text-gray-600">{admin.email}</td>
                                <td className="p-4 text-gray-600 text-sm">
                                    {new Date(admin.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${admin.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {admin.active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    <button onClick={() => openReset(admin)} title="Redefinir Senha" className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg">
                                        <RotateCcw size={18} />
                                    </button>
                                    <button onClick={() => openEdit(admin)} title="Editar" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(admin._id)} title="Excluir" className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {admins.length === 0 && !loading && (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-gray-500">Nenhum administrador encontrado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Create/Edit */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">{selectedAdmin ? 'Editar Administrador' : 'Novo Administrador'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Estabelecimento</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail (Login)</label>
                                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border rounded-lg p-2" />
                            </div>
                            {!selectedAdmin && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha Inicial</label>
                                    <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border rounded-lg p-2" />
                                </div>
                            )}
                            {selectedAdmin && (
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="active" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} />
                                    <label htmlFor="active" className="text-sm text-gray-700">Acesso Ativo</label>
                                </div>
                            )}
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Reset Password */}
            {showResetModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Redefinir Senha</h3>
                        <p className="text-sm text-gray-500 mb-4">Defina uma nova senha para <strong>{selectedAdmin?.name}</strong>.</p>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                                <input type="password" required minLength={6} value={resetPassword} onChange={e => setResetPassword(e.target.value)} className="w-full border rounded-lg p-2" placeholder="Mínimo 6 caracteres" />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowResetModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">Redefinir</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminUsers;