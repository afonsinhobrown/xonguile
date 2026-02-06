import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { MessageCircle, Send, Phone, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';

export default function ClientTicketView() {
    const user = JSON.parse(localStorage.getItem('salao_user') || '{}');
    const [tickets, setTickets] = useState<any[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (user.id) loadTickets();
    }, [user.id]);

    // Auto-refresh de tickets a cada 5 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            if (user.id) loadTickets();
        }, 5000);
        return () => clearInterval(interval);
    }, [user.id]);

    // Auto-refresh do ticket selecionado a cada 2 segundos
    useEffect(() => {
        if (!selectedTicket) return;
        const interval = setInterval(async () => {
            const data = await api.publicClientAppointments?.(user.id) || [];
            // Aqui você precisaria buscar tickets do cliente, não agendamentos
        }, 2000);
        return () => clearInterval(interval);
    }, [selectedTicket?.id]);

    const loadTickets = async () => {
        setLoading(true);
        try {
            // Aqui você precisa adicionar um endpoint para buscar tickets do cliente
            // Por enquanto vou usar um mock
            setTickets([]);
        } catch (e) {
            console.error('Erro ao carregar tickets:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedTicket) return;
        setSending(true);
        try {
            // Enviar mensagem para o ticket
            // await api.addClientTicketMessage?.(selectedTicket.id, { message: messageText });
            setMessageText('');
            loadTickets();
        } catch (e) {
            alert('Erro ao enviar mensagem');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 bg-gray-50 min-h-screen">
            {/* Chamadas/Tickets List */}
            <div className="lg:col-span-1 space-y-3">
                <h2 className="text-2xl font-black text-gray-900 mb-4">Minhas Chamadas</h2>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">Carregando...</div>
                    ) : tickets.length === 0 ? (
                        <div className="p-6 text-center bg-white rounded-xl border border-gray-200">
                            <Phone size={32} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-bold">Nenhuma chamada</p>
                            <p className="text-xs text-gray-400 mt-1">Suas comunicações aparecerão aqui</p>
                        </div>
                    ) : (
                        tickets.map(ticket => (
                            <button
                                key={ticket.id}
                                onClick={() => setSelectedTicket(ticket)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                    selectedTicket?.id === ticket.id
                                        ? 'border-purple-600 bg-purple-50'
                                        : 'border-gray-200 hover:border-purple-300 bg-white'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900">{ticket.subject}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(ticket.createdAt).toLocaleDateString('pt-PT')}
                                        </p>
                                    </div>
                                    {ticket.status === 'open' && (
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat View */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-lg flex flex-col">
                {selectedTicket ? (
                    <>
                        <div className="mb-4 pb-4 border-b border-gray-200">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                <Phone size={20} className="text-purple-600" />
                                {selectedTicket.subject}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Criado em {new Date(selectedTicket.createdAt).toLocaleDateString('pt-PT')}
                            </p>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 space-y-3 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200 max-h-[400px]">
                            {selectedTicket.Messages && selectedTicket.Messages.length > 0 ? (
                                selectedTicket.Messages.map((msg: any, idx: number) => (
                                    <div key={idx} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-xs p-3 rounded-lg ${
                                            msg.isAdmin
                                                ? 'bg-purple-100 text-gray-900 rounded-tl-none'
                                                : 'bg-gray-200 text-gray-900 rounded-tr-none'
                                        }`}>
                                            <p className="text-xs font-bold text-gray-600 mb-1">
                                                {msg.isAdmin ? '🏢 Salão' : '👤 Você'}
                                            </p>
                                            <p className="text-sm">{msg.message}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <MessageCircle size={32} className="mx-auto text-gray-300 mb-2" />
                                    <p className="text-sm text-gray-500">Nenhuma mensagem ainda</p>
                                </div>
                            )}
                        </div>

                        {/* Reply Input */}
                        {selectedTicket.status === 'open' && (
                            <div className="space-y-2 border-t border-gray-200 pt-4">
                                <textarea
                                    value={messageText}
                                    onChange={e => setMessageText(e.target.value)}
                                    placeholder="Digite sua mensagem..."
                                    className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none resize-none"
                                    rows={3}
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!messageText.trim() || sending}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center gap-2"
                                >
                                    <Send size={18} />
                                    {sending ? 'Enviando...' : 'Enviar Mensagem'}
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-96 text-center">
                        <Phone size={48} className="text-gray-300 mb-4" />
                        <p className="text-gray-500 font-bold">Selecione uma chamada para conversar</p>
                    </div>
                )}
            </div>
        </div>
    );
}
