import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR';
import axios from 'axios';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { X, CheckCircle, Trash2, Edit } from 'lucide-react';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CalendarView = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchAppointments = async (start, end) => {
        setLoading(true);
        try {
            // Fetch with range
            const res = await axios.get('/api/admin/appointments', {
                params: {
                    start: start.toISOString(),
                    end: end.toISOString()
                }
            });

            // Map to calendar events
            const mappedEvents = res.data.map(app => ({
                id: app._id,
                title: `${app.customerName} - ${app.services.map(s => s.name).join(', ')}`,
                start: new Date(app.date), // Note: app.date is mostly date part. If we have startTime/endTime use them
                end: new Date(app.endTime),
                resource: app,
                // Adjust start/end if they are separate fields in backend
                // In my schema: date is date part, startTime is Date, endTime is Date.
                // Ideally startTime and endTime are full ISO strings.
            }));

            // Fix start/end using the proper fields if needed
            // Backend sends `date`, `startTime`, `endTime`.
            // Let's assume `startTime` and `endTime` are correct full dates.
            // If `startTime` is just time, we need to combine with `date`.
            // Looking at schema: startTime: Date, endTime: Date. So they should be fine.
            
            const fixedEvents = res.data.map(app => ({
                id: app._id,
                title: `${app.customerName} (${app.professionalId?.name || '?'})`,
                start: new Date(app.startTime),
                end: new Date(app.endTime),
                resource: app,
                status: app.status
            }));

            setEvents(fixedEvents);
        } catch (error) {
            console.error("Erro ao buscar agendamentos", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch (current month)
    useEffect(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        fetchAppointments(start, end);
    }, []);

    const handleRangeChange = (range) => {
        // range can be { start, end } or array of dates
        let start, end;
        if (Array.isArray(range)) {
            start = range[0];
            end = range[range.length - 1];
        } else {
            start = range.start;
            end = range.end;
        }
        fetchAppointments(start, end);
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event.resource);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedEvent(null);
    };

    const handleStatusChange = async (newStatus) => {
        if (!selectedEvent) return;
        try {
            if (newStatus === 'completed') {
                // Use finish endpoint
                await axios.put(`/api/appointments/${selectedEvent._id}/finish`, {
                    finalPrice: selectedEvent.totalPrice // Default to total price
                });
            } else if (newStatus === 'cancelled') {
                // General update
                await axios.put(`/api/appointments/${selectedEvent._id}`, {
                    status: 'cancelled'
                });
            }
            
            handleCloseModal();
            // Refresh
            const now = new Date(); // Simplification: refresh current view. 
            // Better: keep track of current view range.
            window.location.reload(); // Simple refresh for now or trigger fetch
        } catch (error) {
            alert('Erro ao atualizar status');
        }
    };

    const eventStyleGetter = (event) => {
        let backgroundColor = '#3B82F6'; // confirmed (blue)
        if (event.status === 'completed') backgroundColor = '#10B981'; // green
        if (event.status === 'cancelled') backgroundColor = '#EF4444'; // red
        
        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    return (
        <div className="h-[600px] bg-white p-4 rounded-xl shadow-sm">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                messages={{
                    next: "Próximo",
                    previous: "Anterior",
                    today: "Hoje",
                    month: "Mês",
                    week: "Semana",
                    day: "Dia"
                }}
                culture='pt-BR'
                onRangeChange={handleRangeChange}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
            />

            {showModal && selectedEvent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Detalhes do Agendamento</h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                            <p><span className="font-semibold text-gray-600">Cliente:</span> {selectedEvent.customerName}</p>
                            <p><span className="font-semibold text-gray-600">Serviço:</span> {selectedEvent.services.map(s => s.name).join(', ')}</p>
                            <p><span className="font-semibold text-gray-600">Profissional:</span> {selectedEvent.professionalId?.name}</p>
                            <p><span className="font-semibold text-gray-600">Data:</span> {format(new Date(selectedEvent.startTime), 'dd/MM/yyyy HH:mm')}</p>
                            <p><span className="font-semibold text-gray-600">Status:</span> 
                                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold uppercase
                                    ${selectedEvent.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : ''}
                                    ${selectedEvent.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
                                    ${selectedEvent.status === 'cancelled' ? 'bg-red-100 text-red-700' : ''}
                                `}>
                                    {selectedEvent.status === 'confirmed' ? 'Confirmado' : 
                                     selectedEvent.status === 'completed' ? 'Finalizado' : 'Cancelado'}
                                </span>
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {selectedEvent.status === 'confirmed' && (
                                <>
                                    <button 
                                        onClick={() => handleStatusChange('completed')}
                                        className="flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                                    >
                                        <CheckCircle size={18} /> Finalizar
                                    </button>
                                    <button 
                                        onClick={() => handleStatusChange('cancelled')}
                                        className="flex items-center justify-center gap-2 bg-red-100 text-red-600 py-2 rounded-lg hover:bg-red-200"
                                    >
                                        <Trash2 size={18} /> Cancelar
                                    </button>
                                </>
                            )}
                            {/* Can add Edit button here */}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;
