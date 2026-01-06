import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format, addDays, startOfToday, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, User, Users, Calendar, Clock, Scissors, CheckCircle, Store, Briefcase, Lock, Trash2, ArrowLeft, History } from 'lucide-react';
import clsx from 'clsx';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { defaultTheme } from './config/theme';
import { formatMessage } from './config/language';

function App() {
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState('INIT'); // INIT, IDENTIFY_PHONE, IDENTIFY_NAME, SALON, SERVICE, PROFESSIONAL, DATE, TIME, CONFIRM, SUCCESS, MY_APPOINTMENTS
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const [history, setHistory] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);

  const goToStep = (nextStep) => {
      // Don't push INIT to history to avoid going back to a non-interactive state
      if (step !== 'INIT') {
        setHistory(prev => [...prev, step]);
      }
      setStep(nextStep);
  };

  const handleBack = () => {
      if (history.length === 0) return;
      const prev = history[history.length - 1];
      setHistory(prevHist => prevHist.slice(0, -1));
      setStep(prev);
  };

  // Data
  const [salons, setSalons] = useState([]);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  // Admin State
  const [adminUser, setAdminUser] = useState(null);
  const [view, setView] = useState('CHAT'); // CHAT, LOGIN, ADMIN

  // Selection
  const [booking, setBooking] = useState({
    salon: null,
    service: null,
    professional: null,
    date: null,
    time: null,
    clientName: '',
    clientPhone: ''
  });

  const [chatConfig, setChatConfig] = useState(defaultTheme);

  // Helper to intelligently merge configs, preferring feminine defaults over legacy blue backend defaults
  const getIntelligentConfig = (incoming) => {
      if (!incoming) return {};
      
      const legacyDefaults = {
          botBubbleColor: '#F3F4F6',
          botTextColor: '#1F2937',
          userBubbleColor: '#3B82F6',
          userTextColor: '#FFFFFF',
          buttonColor: '#3B82F6',
          backgroundColor: '#F9FAFB',
          headerColor: '#FFFFFF',
          headerTextColor: '#1F2937',
          assistantName: 'Assistente'
      };

      const isLegacy = (key) => incoming[key] && incoming[key].toUpperCase() === legacyDefaults[key].toUpperCase();

      const newConfig = { ...incoming };

      // If strictly legacy blue, override with new feminine default
      if (isLegacy('buttonColor')) newConfig.buttonColor = defaultTheme.buttonColor;
      if (isLegacy('userBubbleColor')) newConfig.userBubbleColor = defaultTheme.userBubbleColor;
      if (isLegacy('botBubbleColor')) newConfig.botBubbleColor = defaultTheme.botBubbleColor;
      if (isLegacy('backgroundColor')) newConfig.backgroundColor = defaultTheme.backgroundColor;
      if (isLegacy('botTextColor')) newConfig.botTextColor = defaultTheme.botTextColor;
      if (isLegacy('headerTextColor')) newConfig.headerTextColor = defaultTheme.headerTextColor;
      
      // Name update
      if (incoming.assistantName === 'Assistente') newConfig.assistantName = defaultTheme.assistantName;

      return newConfig;
  };

   useEffect(() => {
    const fetchChatConfig = async () => {
        try {
            const res = await axios.get('/api/public/config');
            if (res.data && Object.keys(res.data).length > 0) {
                const smartConfig = getIntelligentConfig(res.data);
                setChatConfig(prev => ({ ...prev, ...smartConfig }));
            }
        } catch (error) {
            console.error("Erro ao carregar config do chat:", error);
        }
    };
    fetchChatConfig();
  }, []);
 
   useEffect(() => {
     document.documentElement.style.setProperty('--accent-color', chatConfig.buttonColor);
   }, [chatConfig.buttonColor]);

   const addMessage = (text, sender = 'bot', type = 'text', data = null) => {
    setMessages(prev => [...prev, { text, sender, type, data, id: Date.now() + Math.random() }]);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initialized = useRef(false);

  const handleAdminClick = () => {
    console.log("Admin click detected, current user:", adminUser);
    if (adminUser) {
        setView('ADMIN');
    } else {
        setView('LOGIN');
    }
  };

  const handleLoginSuccess = (user) => {
    console.log("Login successful! User:", user);
    setAdminUser(user);
    setView('ADMIN');
    window.history.pushState({}, '', '/admin');
  };

  const handleLogout = () => {
    setAdminUser(null);
    setView('LOGIN');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.history.pushState({}, '', '/login');
  };

  // ----------------------------------------------------------------------
  // FLOW HANDLERS
  // ----------------------------------------------------------------------

  const handleMyHistoryClick = async () => {
    if (!booking.clientPhone) {
        addMessage(formatMessage('identify_first'), 'bot');
        goToStep('IDENTIFY_PHONE');
        return;
    }
    
    setLoading(true);
    try {
        const res = await axios.get(`/api/my-appointments?phone=${booking.clientPhone}`);
        setMyAppointments(res.data);
        if (res.data.length === 0) {
            addMessage(formatMessage('my_appointments_empty'));
        } else {
            addMessage(formatMessage('my_appointments_found', { count: res.data.length }));
            goToStep('MY_APPOINTMENTS');
        }
    } catch (err) {
        addMessage(formatMessage('error_loading_salons'));
    } finally {
        setLoading(false);
    }
  };

  const handleCancelAppointment = async (apptId) => {
    if (!window.confirm("Tem certeza que deseja cancelar este agendamento?")) return;
    
    setLoading(true);
    try {
        await axios.delete(`/api/my-appointments/${apptId}`, {
            data: { phone: booking.clientPhone } // Axios delete body requires 'data' key
        });
        
        // Refresh
        const res = await axios.get(`/api/my-appointments?phone=${booking.clientPhone}`);
        setMyAppointments(res.data);
        addMessage(formatMessage('cancel_success'));
        
        if (res.data.length === 0) {
            handleBack(); 
        }
    } catch (err) {
        addMessage(formatMessage('cancel_error'));
    } finally {
        setLoading(false);
    }
  };

  const handleInputSubmit = async (e) => {
    e.preventDefault();
    const val = e.target.elements.input.value.trim();
    if (!val) return;
    e.target.elements.input.value = '';

    // 1. Identify Phone
    if (step === 'IDENTIFY_PHONE') {
        addMessage(val, 'user');
        setBooking(prev => ({ ...prev, clientPhone: val }));
        
        // Check backend for existing customer
        setLoading(true);
        try {
            const res = await axios.get(`/api/customers/check?phone=${val}`);
            if (res.data.found) {
                // Save to cache
                localStorage.setItem('customer_phone', val);
                
                setBooking(prev => ({ ...prev, clientName: res.data.name }));
                addMessage(formatMessage('welcome_back', { name: res.data.name }));
                loadSalons();
            } else {
                addMessage(formatMessage('ask_name'));
                goToStep('IDENTIFY_NAME');
            }
        } catch (err) {
            // Fallback if backend fails or offline
            addMessage(formatMessage('ask_name'));
            goToStep('IDENTIFY_NAME');
        } finally {
            setLoading(false);
        }
    } 
    // 2. Identify Name (if new)
    else if (step === 'IDENTIFY_NAME') {
        addMessage(val, 'user');
        setBooking(prev => ({ ...prev, clientName: val }));
        addMessage(formatMessage('nice_to_meet', { name: val }));
        loadSalons();
    }
  };

  const loadSalons = async () => {
    // If we already have salons loaded (from init), just use them
    if (salons.length > 0) {
        handleSalonSelect(salons[0], true);
        return;
    }

    setLoading(true);
    try {
        const res = await axios.get('/api/salons');
        setSalons(res.data);
        if (res.data.length > 0) {
             handleSalonSelect(res.data[0], true);
        } else {
             addMessage(formatMessage('no_salon'));
        }
    } catch (err) {
        addMessage(formatMessage('error_loading_salons'));
    } finally {
        setLoading(false);
    }
  };

  const handleSalonSelect = async (salon, autoSelected = false) => {
    if (!autoSelected) {
        addMessage(salon.name, 'user');
    }
    setBooking(prev => ({ ...prev, salon }));

    // Apply Chat Config if available
    if (salon.chatConfig) {
        const smartConfig = getIntelligentConfig(salon.chatConfig);
        setChatConfig(prev => ({ ...prev, ...smartConfig }));
    }
    
    setLoading(true);
    try {
      const srvRes = await axios.get(`/api/services?salao_id=${salon._id}`);
      setServices(srvRes.data);
      // Professionals will be loaded after service selection
      setProfessionals([]);
      
      addMessage(formatMessage('select_service'));
      goToStep('SERVICE');
    } catch (err) {
      addMessage(formatMessage('error_loading_services'));
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = async (service) => {
    addMessage(service.name, 'user');
    setBooking(prev => ({ ...prev, service }));
    
    setLoading(true);
    try {
        const res = await axios.get(`/api/professionals?salao_id=${booking.salon._id}&service_id=${service._id}`);
        setProfessionals(res.data);
        
        if (res.data.length > 0) {
            addMessage(formatMessage('ask_professional'));
            goToStep('PROFESSIONAL');
        } else {
            const allRes = await axios.get(`/api/professionals?salao_id=${booking.salon._id}`);
            if (allRes.data.length > 0) {
                console.warn("No professionals matched service, falling back to all.");
                setProfessionals(allRes.data);
                addMessage(formatMessage('ask_professional'));
                goToStep('PROFESSIONAL');
            } else {
                addMessage(formatMessage('no_professionals_service'));
            }
        }
    } catch (err) {
        addMessage(formatMessage('error_loading_professionals'));
    } finally {
        setLoading(false);
    }
  };

  const handleProfessionalSelect = (prof) => {
    if (prof) {
        addMessage(prof.name, 'user');
        setBooking(prev => ({ ...prev, professional: prof }));
    } else {
        addMessage(formatMessage('any_professional'), 'user');
        setBooking(prev => ({ ...prev, professional: professionals[0] }));
    }
    
    addMessage(formatMessage('ask_date'));
    goToStep('DATE');
  };

  const handleDateSelect = async (dateStr) => {
    const dateObj = parse(dateStr, 'yyyy-MM-dd', new Date());
    const formattedDate = format(dateObj, 'dd/MM/yyyy');
    
    addMessage(formattedDate, 'user');
    setBooking(prev => ({ ...prev, date: dateStr }));
    
    addMessage(formatMessage('checking_schedule'), 'bot');
    setLoading(true);
    
    try {
      const { salon, professional, service } = booking;
      
      const res = await axios.get('/api/disponibilidade/horarios', {
        params: {
          salao_id: salon._id,
          profissional_id: booking.professional?._id || professional._id,
          servicos: booking.service?._id || service._id,
          data: dateStr
        }
      });
      
      setAvailableSlots(res.data);

      // Check for Arrival Order header
      if (res.headers['x-arrival-order'] === 'true') {
        addMessage(formatMessage('arrival_order_warning'));
        addMessage(formatMessage('ask_another_date'));
        goToStep('ARRIVAL_WARNING');
        return;
      }

      if (res.data.length > 0) {
        addMessage(formatMessage('found_slots', { date: formattedDate }));
        goToStep('TIME');
      } else {
        addMessage(formatMessage('no_slots', { date: formattedDate }));
        goToStep('DATE');
      }
    } catch (err) {
      console.error(err);
      addMessage(formatMessage('error_checking_schedule'));
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSelect = (time) => {
    addMessage(time, 'user');
    setBooking(prev => ({ ...prev, time }));
    
    addMessage(formatMessage('confirm_data'));
    goToStep('CONFIRM');
  };

  const [calendarLinks, setCalendarLinks] = useState(null);

  const handleConfirm = async () => {
    addMessage('Confirmar', 'user');
    setLoading(true);
    try {
      const res = await axios.post('/api/agendamentos', {
        salao_id: booking.salon._id,
        profissional_id: booking.professional._id,
        data: booking.date,
        hora_inicio: booking.time,
        servicos: [booking.service._id],
        cliente: booking.clientName,
        telefone: booking.clientPhone
      });
      
      // Save phone to cache on success
      localStorage.setItem('customer_phone', booking.clientPhone);

      if (res.data.links) {
        setCalendarLinks(res.data.links);
      }

      addMessage(formatMessage('success_title'));
      addMessage(formatMessage('success_details', {
        service: booking.service.name,
        professional: booking.professional.name,
        date: format(parse(booking.date, 'yyyy-MM-dd', new Date()), 'dd/MM'),
        time: booking.time
      }));
      goToStep('SUCCESS');
    } catch (err) {
      addMessage(formatMessage('error_finalizing'));
    } finally {
      setLoading(false);
    }
  };

  // Helper for dynamic styles
  const getButtonStyle = () => ({
    borderColor: chatConfig.buttonColor,
    '--accent-color': chatConfig.buttonColor // Used for hover/text via CSS variable if needed, but we'll use inline styles for specifics
  });

  // Renderers
  const renderContent = () => {
    switch(step) {
      case 'SALON':
        return (
          <div className="grid gap-2">
            {salons.map(s => (
              <button 
                key={s._id} 
                onClick={() => handleSalonSelect(s)} 
                className="card hover:opacity-90 text-left flex items-center gap-3 transition-all border border-transparent hover:border-current"
                style={{ 
                    backgroundColor: chatConfig.buttonColor, 
                    color: '#fff' 
                }}
              >
                <div className="bg-white/20 p-2 rounded-full text-white"><Store size={20} /></div>
                <div className="">
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs opacity-90">{s.phone}</div>
                </div>
              </button>
            ))}
          </div>
        );
      case 'SERVICE':
        return (
          <div className="grid gap-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {services.map(s => (
              <button 
                key={s._id} 
                onClick={() => handleServiceSelect(s)} 
                className="card hover:opacity-90 text-left flex justify-between items-center transition-all border border-transparent hover:border-current"
                style={{ 
                    backgroundColor: chatConfig.buttonColor, 
                    color: '#fff' 
                }}
              >
                <div className="flex items-center gap-3">
                    <div className={`bg-white/20 ${s.image ? 'p-0' : 'p-2'} rounded-full text-white flex items-center justify-center w-12 h-12 overflow-hidden flex-shrink-0`}>
                        {s.image ? (
                            <img src={s.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                            s.icon ? <i className={`${s.icon} text-lg`} /> : <Scissors size={20} />
                        )}
                    </div>
                    <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs opacity-80">{s.duration} min</div>
                    </div>
                </div>
                <div className="font-bold">R$ {s.price.toFixed(2)}</div>
              </button>
            ))}
          </div>
        );
      case 'PROFESSIONAL':
        return (
          <div className="grid gap-2">
            <button 
                onClick={() => handleProfessionalSelect(null)} 
                className="card hover:opacity-90 text-left flex items-center gap-3 transition-all"
                style={{ 
                    borderColor: chatConfig.buttonColor, 
                    borderWidth: '2px',
                    color: chatConfig.buttonColor
                }}
            >
                <div 
                    className="p-2 rounded-full flex items-center justify-center"
                    style={{
                        backgroundColor: chatConfig.buttonColor,
                        color: '#fff'
                    }}
                >
                    <Users size={20} />
                </div>
                <div className="font-bold">{formatMessage('any_professional')}</div>
            </button>
            {professionals.map(p => (
              <button 
                key={p._id} 
                onClick={() => handleProfessionalSelect(p)} 
                className="card hover:opacity-90 text-left flex items-center gap-3 transition-all"
                style={{ 
                    backgroundColor: chatConfig.buttonColor, 
                    color: '#fff' 
                }}
              >
                <div className="bg-white/20 p-2 rounded-full text-white"><Briefcase size={20} /></div>
                <div className="font-medium">{p.name}</div>
              </button>
            ))}
          </div>
        );
      case 'DATE':
        const dates = [];
        const today = startOfToday();
        for(let i=0; i<7; i++) {
            dates.push(addDays(today, i));
        }
        return (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map(d => {
                const dateStr = format(d, 'yyyy-MM-dd');
                const isSelected = booking.date === dateStr;
                return (
                  <button 
                    key={d.toString()} 
                    onClick={() => handleDateSelect(dateStr)}
                    className={clsx(
                        "flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center border transition-all"
                    )}
                    style={{
                        backgroundColor: isSelected ? chatConfig.buttonColor : '#fff',
                        borderColor: isSelected ? chatConfig.buttonColor : '#e2e8f0',
                        color: isSelected ? '#fff' : '#1e293b'
                    }}
                  >
                    <span className="text-xs uppercase">{format(d, 'EEE', { locale: ptBR })}</span>
                    <span className="text-xl font-bold">{format(d, 'dd')}</span>
                  </button>
                );
            })}
          </div>
        );
      case 'TIME':
        return (
          <div className="grid grid-cols-4 gap-2">
            {availableSlots.map(t => (
              <button 
                key={t} 
                onClick={() => handleTimeSelect(t)}
                className="py-2 px-1 bg-white border border-slate-200 rounded-lg text-sm hover:opacity-80 transition-all"
                style={{
                    color: '#1e293b'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = chatConfig.buttonColor;
                    e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.color = '#1e293b';
                }}
              >
                {t}
              </button>
            ))}
          </div>
        );
      case 'ARRIVAL_WARNING':
        return (
          <div className="grid gap-2">
            <button 
              onClick={() => {
                addMessage(formatMessage('yes_another_date'), 'user');
                goToStep('DATE');
              }} 
              className="card hover:opacity-90 text-left flex items-center gap-3 transition-all"
              style={{ 
                  backgroundColor: chatConfig.buttonColor, 
                  color: '#fff' 
              }}
            >
              <div className="bg-white/20 p-2 rounded-full text-white"><Calendar size={20} /></div>
              <div className="font-medium">{formatMessage('yes_another_date')}</div>
            </button>
            <button 
              onClick={() => {
                addMessage(formatMessage('no_end_chat'), 'user');
                addMessage(formatMessage('end_chat_message'), 'bot');
                // Reset flow after a delay or just leave it
                setTimeout(() => {
                    setStep('INIT');
                    setMessages([]);
                    setBooking({
                        salon: null,
                        service: null,
                        professional: null,
                        date: null,
                        time: null,
                        clientName: '',
                        clientPhone: ''
                    });
                }, 3000);
              }} 
              className="card hover:opacity-90 text-left flex items-center gap-3 transition-all bg-white border border-slate-200"
              style={{ color: '#ef4444' }} // Red for cancel
            >
              <div className="bg-red-50 p-2 rounded-full text-red-500"><Trash2 size={20} /></div>
              <div className="font-medium">{formatMessage('no_end_chat')}</div>
            </button>
          </div>
        );
      case 'CONFIRM':
        return (
            <div className="card bg-slate-50">
                <h3 className="font-bold mb-2">Resumo</h3>
                <div className="text-sm space-y-1 mb-4">
                    <p><span className="text-gray-500">Cliente:</span> {booking.clientName}</p>
                    <p><span className="text-gray-500">Telefone:</span> {booking.clientPhone}</p>
                    <p><span className="text-gray-500">Serviço:</span> {booking.service?.name}</p>
                    <p><span className="text-gray-500">Profissional:</span> {booking.professional?.name}</p>
                    <p><span className="text-gray-500">Data:</span> {booking.date && format(parse(booking.date, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')} às {booking.time}</p>
                    <p><span className="text-gray-500">Total:</span> R$ {booking.service?.price.toFixed(2)}</p>
                </div>
                <button 
                    onClick={handleConfirm} 
                    className="w-full btn-primary flex justify-center items-center gap-2"
                    style={{ backgroundColor: chatConfig.buttonColor }}
                >
                    <CheckCircle size={18} /> {formatMessage('confirm_button')}
                </button>
            </div>
        );
      case 'SUCCESS':
        return (
            <div className="space-y-3">
                {calendarLinks && (
                    <div className="card bg-white border border-slate-200 p-4 rounded-xl shadow-sm mb-3">
                        <p className="font-medium text-slate-700 mb-3 text-center">Deseja adicionar à sua agenda?</p>
                        <div className="grid grid-cols-1 gap-2">
                            <a 
                                href={calendarLinks.google} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
                            >
                                <Calendar size={16} className="text-blue-500" /> Google Agenda
                            </a>
                            <a 
                                href={calendarLinks.ics} 
                                download="agendamento.ics"
                                className="flex items-center justify-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
                            >
                                <Calendar size={16} className="text-slate-500" /> Apple Calendar / Outros (.ics)
                            </a>
                        </div>
                    </div>
                )}

                <button 
                    onClick={() => {
                        setStep('INIT');
                        setMessages([]);
                        setBooking({
                            salon: null,
                            service: null,
                            professional: null,
                            date: null,
                            time: null,
                            clientName: booking.clientName, // Keep name/phone
                            clientPhone: booking.clientPhone
                        });
                        setCalendarLinks(null); // Reset links
                        handleMyHistoryClick(); // Go to my appointments or just reset
                    }}
                    className="w-full btn-primary"
                    style={{ backgroundColor: chatConfig.buttonColor }}
                >
                    Novo Agendamento
                </button>
            </div>
        );
      case 'MY_APPOINTMENTS':
        return (
            <div className="space-y-3">
                {myAppointments.map(appt => (
                    <div key={appt._id} className="card bg-white border p-3 rounded-xl shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="font-bold text-slate-800">{appt.services.map(s => s.name).join(', ')}</div>
                                <div className="text-sm text-slate-500">{appt.salonId.name}</div>
                            </div>
                            <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                                Agendado
                            </div>
                        </div>
                        
                        <div className="text-sm space-y-1 mb-3">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Calendar size={14} />
                                {format(parse(appt.date.split('T')[0], 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')}
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <Clock size={14} />
                                {(() => {
                                    try {
                                        // If we have the raw input string 'hora_inicio' (some backends might send it), prefer it
                                        if (appt.hora_inicio && typeof appt.hora_inicio === 'string' && appt.hora_inicio.includes(':')) {
                                            return appt.hora_inicio;
                                        }

                                        // Otherwise parse the ISO startTime
                                        // We use new Date() to ensure the browser converts UTC back to Local Time
                                        if (appt.startTime) {
                                            const date = new Date(appt.startTime);
                                            if (!isNaN(date.getTime())) {
                                                return format(date, 'HH:mm');
                                            }
                                        }

                                        return '00:00';
                                    } catch (e) {
                                        return '00:00';
                                    }
                                })()}
                            </div>
                            {appt.professionalId && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <User size={14} />
                                    {appt.professionalId.name}
                                </div>
                            )}
                        </div>
                        
                        <button 
                            onClick={() => handleCancelAppointment(appt._id)}
                            className="w-full py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 size={16} /> Cancelar Agendamento
                        </button>
                    </div>
                ))}
                <button 
                    onClick={handleBack}
                    className="w-full py-3 text-slate-500 text-sm hover:underline"
                >
                    Voltar
                </button>
            </div>
        );
      default:
        return null;
    }
  };

  // Init
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      setLoading(true);

      const path = window.location.pathname;
      const hostname = window.location.hostname;
      
      if (path === '/login') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setAdminUser(null);
          setView('LOGIN');
          setLoading(false);
          return;
      }

      if (path === '/admin' || hostname.startsWith('admin.')) {
          setView('LOGIN');
      }

      const token = localStorage.getItem('token');
      // Always try to validate token and get fresh user data
      if (token) {
          try {
              axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
              const meRes = await axios.get('/api/me');
              const user = meRes.data;
              
              setAdminUser(user);
              localStorage.setItem('user', JSON.stringify(user));

              if (path === '/admin') {
                  setView('ADMIN');
              }
          } catch (e) {
              console.error("Token validation failed", e);
              // Only clear if it's an auth error, not network error
              if (e.response && (e.response.status === 401 || e.response.status === 403)) {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  setAdminUser(null);
                  if (path === '/admin') setView('LOGIN');
              } else {
                  // Fallback to local storage if network error
                  const userStr = localStorage.getItem('user');
                  if (userStr) {
                      setAdminUser(JSON.parse(userStr));
                      if (path === '/admin') setView('ADMIN');
                  }
              }
          }
      }
      
      // Load Salons & Check Cache
      try {
        const salonsRes = await axios.get('/api/salons');
        setSalons(salonsRes.data);
        
        if (salonsRes.data.length === 1 && salonsRes.data[0].chatConfig) {
            setChatConfig(prev => ({ ...prev, ...salonsRes.data[0].chatConfig }));
        }

        // CACHE CHECK
        const cachedPhone = localStorage.getItem('customer_phone');
        let customerFound = false;

        if (cachedPhone) {
            try {
                const res = await axios.get(`/api/customers/check?phone=${cachedPhone}`);
                if (res.data.found) {
                    customerFound = true;
                    setBooking(prev => ({ ...prev, clientPhone: cachedPhone, clientName: res.data.name }));
                    addMessage(formatMessage('welcome_back', { name: res.data.name }));
                    
                    // Skip to Salon selection
                    if (salonsRes.data.length > 0) {
                        if (salonsRes.data.length === 1) {
                            handleSalonSelect(salonsRes.data[0], true);
                        } else {
                            setStep('SALON');
                            addMessage(formatMessage('select_salon'));
                        }
                    } else {
                        addMessage(formatMessage('no_salon'));
                    }
                }
            } catch (e) {
                console.error("Cache check failed", e);
            }
        }

        if (!customerFound) {
            addMessage(formatMessage('welcome', { name: chatConfig.assistantName }));
            addMessage(formatMessage('ask_phone_init'));
            setStep('IDENTIFY_PHONE');
        }

      } catch (err) {
        console.error("Erro ao carregar inicial", err);
        addMessage(formatMessage('error_loading_salons'));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (view === 'LOGIN') {
    return <AdminLogin onLogin={handleLoginSuccess} />;
  }

  if (view === 'ADMIN') {
    return <AdminDashboard user={adminUser} onLogout={handleLogout} />;
  }

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[80vh]">
        {/* Header */}
        <div 
            className="border-b p-4 flex items-center gap-3 sticky top-0 z-10"
            style={{ backgroundColor: chatConfig.headerColor }}
        >
          {history.length > 0 ? (
            <button onClick={handleBack} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                <ArrowLeft size={20} style={{ color: chatConfig.headerTextColor }} />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-gray-100 text-gray-500">
                {chatConfig.showAvatar && chatConfig.avatarUrl ? (
                    <img src={chatConfig.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <Store size={20} />
                )}
            </div>
          )}
          
          <div className="flex-1">
            <h1 className="font-bold text-lg" style={{ color: chatConfig.headerTextColor }}>{chatConfig.assistantName}</h1>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online agora
            </p>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={handleMyHistoryClick} 
                className="text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all"
                title="Ver meus agendamentos"
            >
                <Calendar size={14} /> 
                Meus Agendamentos
            </button>
            {/* Admin button removed as per request */}
          </div>
        </div>

        {/* Chat Area */}
        <div 
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{ backgroundColor: chatConfig.backgroundColor }}
        >
          {messages.map((msg) => (
            <div key={msg.id} className={clsx(
              "flex w-full items-end gap-2",
              msg.sender === 'user' ? "justify-end" : "justify-start"
            )}>
              {msg.sender === 'bot' && chatConfig.showAvatar && (
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                   {chatConfig.avatarUrl ? (
                     <img src={chatConfig.avatarUrl} alt="Bot" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100">
                       <Store size={14} />
                     </div>
                   )}
                </div>
              )}

              <div 
                className={clsx(
                    "max-w-[75%] p-3 rounded-2xl text-sm whitespace-pre-line shadow-sm",
                    msg.sender === 'user' ? "rounded-tr-none" : "rounded-tl-none border border-slate-100"
                )}
                style={{
                    backgroundColor: msg.sender === 'user' ? chatConfig.userBubbleColor : chatConfig.botBubbleColor,
                    color: msg.sender === 'user' ? chatConfig.userTextColor : chatConfig.botTextColor
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex w-full justify-start items-end gap-2">
               {chatConfig.showAvatar && (
                 <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    {chatConfig.avatarUrl ? (
                      <img src={chatConfig.avatarUrl} alt="Bot" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100">
                        <Store size={14} />
                      </div>
                    )}
                 </div>
               )}
               <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-none p-3">
                 <div className="flex gap-1">
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                 </div>
               </div>
             </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t">
          {['IDENTIFY_PHONE', 'IDENTIFY_NAME'].includes(step) ? (
            <form onSubmit={handleInputSubmit} className="flex gap-2">
              <input 
                name="input"
                type={step === 'IDENTIFY_PHONE' ? "tel" : "text"}
                className="flex-1 bg-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/50"
                placeholder={step === 'IDENTIFY_PHONE' ? "Digite seu celular..." : "Digite seu nome..."}
                autoFocus
              />
              <button type="submit" style={{ backgroundColor: chatConfig.buttonColor }} className="text-white p-3 rounded-xl hover:opacity-90 transition-opacity">
                <Send size={20} />
              </button>
            </form>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
