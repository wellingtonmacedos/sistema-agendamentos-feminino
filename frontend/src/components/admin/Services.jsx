import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Services = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null); // null = list, {} = create, {id...} = edit
    const [iconPreview, setIconPreview] = useState('');

    useEffect(() => {
        fetchServices();
    }, []);

    useEffect(() => {
        if (editing) {
            setIconPreview(editing.icon || '');
        }
    }, [editing]);

    const fetchServices = async () => {
        try {
            // Need salon ID, usually in user context or just fetch all allowed (since token handles scope)
            // Using public route filtered by salon logic on backend or just admin specific route
            // Since public route requires salon_id param, let's use the one that adminController probably should have provided or we use token context.
            // Wait, getServices is public but requires query param.
            // Let's use the token to get "me" then fetch services, or simply assume the backend has a GET /services that works for admin?
            // Current backend: router.get('/services', appointmentController.getServices); -> requires salao_id query.
            // Let's fetch 'me' first or store salonId in localStorage on login.
            
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.id) {
                const res = await axios.get(`/api/services?salao_id=${user.id}`);
                setServices(res.data);
            }
        } catch (error) {
            console.error("Erro ao carregar serviços", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            price: Number(formData.get('price')),
            duration: Number(formData.get('duration')),
        };

        try {
            if (editing._id) {
                await axios.put(`/api/services/${editing._id}`, data);
            } else {
                await axios.post('/api/services', data);
            }
            setEditing(null);
            fetchServices();
        } catch (error) {
            alert('Erro ao salvar serviço');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza?')) return;
        try {
            await axios.delete(`/api/services/${id}`);
            fetchServices();
        } catch (error) {
            alert('Erro ao deletar');
        }
    };

    if (loading) return <div>Carregando...</div>;

    if (editing) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm max-w-lg">
                <h3 className="text-xl font-bold mb-4">{editing._id ? 'Editar Serviço' : 'Novo Serviço'}</h3>
                <form key={editing._id || 'new'} onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome do Serviço</label>
                        <input name="name" defaultValue={editing.name || ''} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Preço (R$)</label>
                            <input name="price" type="number" step="0.01" defaultValue={editing.price || ''} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Duração (min)</label>
                            <input name="duration" type="number" defaultValue={editing.duration || ''} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Ícone (Font Awesome)</label>
                        <div className="flex gap-2 items-center">
                            <input 
                                name="icon" 
                                defaultValue={editing.icon || ''} 
                                onChange={(e) => setIconPreview(e.target.value)}
                                placeholder="ex: fa-solid fa-scissors"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" 
                            />
                            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded border flex-shrink-0">
                                {iconPreview ? <i className={`${iconPreview} text-gray-700 text-lg`}></i> : <span className="text-xs text-gray-400">N/A</span>}
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            <a href="https://fontawesome.com/search?o=r&m=free" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Buscar ícones</a> (ex: fa-solid fa-spa)
                        </p>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border rounded text-gray-600">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Serviços</h2>
                <button onClick={() => setEditing({})} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    + Novo Serviço
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duração</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {services.map(s => (
                            <tr key={s._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{s.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">R$ {s.price.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{s.duration} min</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => setEditing(s)} className="text-blue-600 hover:text-blue-900 mr-4">Editar</button>
                                    <button onClick={() => handleDelete(s._id)} className="text-red-600 hover:text-red-900">Excluir</button>
                                </td>
                            </tr>
                        ))}
                        {services.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">Nenhum serviço cadastrado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Services;
