import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/super-admin/audit-logs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const getActionLabel = (action) => {
        const map = {
            'CREATE_ADMIN': 'Criou Admin',
            'UPDATE_ADMIN': 'Atualizou Admin',
            'DELETE_ADMIN': 'Removeu Admin',
            'RESET_PASSWORD': 'Redefiniu Senha',
            'TOGGLE_STATUS': 'Alterou Status'
        };
        return map[action] || action;
    };

    const getActionColor = (action) => {
        switch(action) {
            case 'CREATE_ADMIN': return 'text-green-600 bg-green-50';
            case 'DELETE_ADMIN': return 'text-red-600 bg-red-50';
            case 'UPDATE_ADMIN': return 'text-blue-600 bg-blue-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando logs...</div>;

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Activity className="text-blue-600" />
                Logs de Auditoria
            </h2>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Data/Hora</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Ação</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Realizado Por</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Alvo</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Detalhes</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">IP</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {logs.map((log) => (
                            <tr key={log._id} className="hover:bg-gray-50">
                                <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} />
                                        {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                        {getActionLabel(log.action)}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-gray-700 font-medium">
                                    {log.performedBy?.name || 'Sistema'}
                                    <div className="text-xs text-gray-400 font-normal">{log.performedBy?.email}</div>
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                    {log.targetName || '-'}
                                </td>
                                <td className="p-4 text-xs text-gray-500 font-mono max-w-xs truncate" title={JSON.stringify(log.details, null, 2)}>
                                    {JSON.stringify(log.details)}
                                </td>
                                <td className="p-4 text-xs text-gray-500">
                                    {log.ipAddress || '-'}
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-500">
                                    Nenhum registro encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogs;
