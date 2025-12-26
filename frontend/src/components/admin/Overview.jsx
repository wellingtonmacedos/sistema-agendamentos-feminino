import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Overview = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await axios.get('/api/reports');
            setStats(res.data);
        } catch (error) {
            console.error("Erro ao carregar relatórios", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando relatórios...</div>;
    if (!stats) return <div className="p-8 text-center text-gray-500">Sem dados disponíveis.</div>;

    // Use defaults if backend structure differs
    const summary = stats.total || { totalRevenue: 0, totalAppointments: 0 };
    const byService = stats.byService || [];
    const byProfessional = stats.byProfessional || [];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Visão Geral</h2>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Faturamento Total</p>
                    <p className="text-3xl font-bold text-green-600">
                        R$ {summary.totalRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Agendamentos</p>
                    <p className="text-3xl font-bold text-blue-600">{summary.totalAppointments || 0}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Services */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-700 mb-4">Top Serviços</h3>
                    <div className="space-y-3">
                        {byService.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center border-b border-gray-50 last:border-0 pb-2">
                                <span className="text-gray-600">{item._id}</span>
                                <div className="text-right">
                                    <p className="font-medium text-gray-800">R$ {item.revenue}</p>
                                    <p className="text-xs text-gray-400">{item.count} agendamentos</p>
                                </div>
                            </div>
                        ))}
                        {byService.length === 0 && <p className="text-gray-400">Nenhum serviço realizado.</p>}
                    </div>
                </div>

                {/* Top Professionals */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-700 mb-4">Desempenho Profissionais</h3>
                    <div className="space-y-3">
                        {byProfessional.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center border-b border-gray-50 last:border-0 pb-2">
                                <span className="text-gray-600">{item._id}</span>
                                <div className="text-right">
                                    <p className="font-medium text-gray-800">R$ {item.revenue}</p>
                                    <p className="text-xs text-gray-400">{item.count} atendimentos</p>
                                </div>
                            </div>
                        ))}
                        {byProfessional.length === 0 && <p className="text-gray-400">Nenhum dado.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
