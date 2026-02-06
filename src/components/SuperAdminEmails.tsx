import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Mail, Send, AlertCircle, CheckCircle, User } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export default function SuperAdminEmails() {
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClients, setSelectedClients] = useState<number[]>([]);
    const [customEmails, setCustomEmails] = useState<string[]>(['']);
    const [emailType, setEmailType] = useState<'welcome' | 'restore' | 'custom'>('welcome');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [customSubject, setCustomSubject] = useState('');
    const [customBody, setCustomBody] = useState('');

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const data = await api.getSuperAdminClients();
            setClients(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Erro ao carregar clientes:', e);
        }
    };

    const toggleClientSelection = (clientId: number) => {
        setSelectedClients(prev =>
            prev.includes(clientId)
                ? prev.filter(id => id !== clientId)
                : [...prev, clientId]
        );
    };

    const selectAllClients = () => {
        if (selectedClients.length === clients.length) {
            setSelectedClients([]);
        } else {
            setSelectedClients(clients.map(c => c.id));
        }
    };

    const addCustomEmail = () => {
        setCustomEmails([...customEmails, '']);
    };

    const removeCustomEmail = (index: number) => {
        setCustomEmails(customEmails.filter((_, i) => i !== index));
    };

    const updateCustomEmail = (index: number, value: string) => {
        const updated = [...customEmails];
        updated[index] = value;
        setCustomEmails(updated);
    };

    const handleSendEmail = async () => {
        setLoading(true);
        setMessage('');
        try {
            let result;
            const filteredCustomEmails = customEmails.filter(e => e.trim());

            if (emailType === 'welcome') {
                result = await api.sendWelcomeEmail(selectedClients);
            } else if (emailType === 'restore') {
                result = await api.sendRestoreEmail(selectedClients);
            } else {
                result = await api.sendCustomEmail(customSubject, customBody, selectedClients, filteredCustomEmails);
            }

            setMessage(`✅ ${result.sent} email(s) enviado(s) com sucesso!`);
            setSelectedClients([]);
            setCustomEmails(['']);
        } catch (e) {
            setMessage('❌ Erro ao enviar emails');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Email Type Selector */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-black text-gray-900 mb-4">Tipo de Email</h3>
                <div className="flex gap-3 flex-wrap">
                    {[
                        { type: 'welcome', label: '👋 Boas-vindas', desc: 'Automático' },
                        { type: 'restore', label: '🔄 Restauração', desc: 'Automático' },
                        { type: 'custom', label: '✏️ Customizado', desc: 'Escreva sua mensagem' }
                    ].map(opt => (
                        <button
                            key={opt.type}
                            onClick={() => setEmailType(opt.type as any)}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${emailType === opt.type
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <div>{opt.label}</div>
                            <div className="text-xs opacity-75">{opt.desc}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Clients Selection */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black text-gray-900">Destinatários</h3>
                    <button
                        onClick={selectAllClients}
                        className="text-sm px-3 py-1 rounded-lg bg-purple-100 text-purple-700 font-bold hover:bg-purple-200"
                    >
                        {selectedClients.length === clients.length ? 'Desselecionar Todos' : 'Selecionar Todos'}
                    </button>
                </div>

                <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-xl">
                    {clients.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">Nenhum cliente encontrado</div>
                    ) : (
                        clients.map(client => (
                            <label key={client.id} className="flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedClients.includes(client.id)}
                                    onChange={() => toggleClientSelection(client.id)}
                                    className="w-4 h-4 rounded"
                                />
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900">{client.name}</p>
                                    <p className="text-sm text-gray-500">{client.email}</p>
                                    {client.Salon && <p className="text-xs text-purple-600 font-bold">{client.Salon.name}</p>}
                                </div>
                            </label>
                        ))
                    )}
                </div>
                <p className="text-sm text-gray-600 mt-3">
                    {selectedClients.length} cliente(s) selecionado(s)
                </p>
            </div>

            {/* Custom Email Fields */}
            {emailType === 'custom' && (
                <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
                    <h3 className="text-lg font-black text-gray-900">Compose Email</h3>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Assunto</label>
                        <Input
                            type="text"
                            placeholder="Assunto do email"
                            value={customSubject}
                            onChange={e => setCustomSubject(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Mensagem</label>
                        <textarea
                            placeholder="Escreva sua mensagem aqui..."
                            value={customBody}
                            onChange={e => setCustomBody(e.target.value)}
                            className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none resize-none"
                            rows={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Emails Customizados (opcionais)</label>
                        {customEmails.map((email, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                                <Input
                                    type="email"
                                    placeholder="email@exemplo.com"
                                    value={email}
                                    onChange={e => updateCustomEmail(idx, e.target.value)}
                                />
                                {customEmails.length > 1 && (
                                    <button
                                        onClick={() => removeCustomEmail(idx)}
                                        className="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            onClick={addCustomEmail}
                            className="text-sm px-3 py-2 rounded-lg bg-purple-100 text-purple-700 font-bold hover:bg-purple-200"
                        >
                            + Adicionar Email
                        </button>
                    </div>
                </div>
            )}

            {/* Status Message */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.startsWith('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {message.startsWith('✅') ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {message}
                </div>
            )}

            {/* Send Button */}
            <Button
                onClick={handleSendEmail}
                disabled={loading || (emailType !== 'custom' && selectedClients.length === 0)}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2"
            >
                <Send size={20} />
                {loading ? 'Enviando...' : `Enviar Email${selectedClients.length > 0 ? ` para ${selectedClients.length}` : ''}`}
            </Button>
        </div>
    );
}
