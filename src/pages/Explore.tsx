import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Search, Store, ArrowRight, Sparkles, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ExplorePage() {
    const [salons, setSalons] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const loadSalons = async () => {
        setLoading(true);
        try {
            const data = await api.publicListSalons();
            setSalons(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            loadSalons();
            return;
        }
        setLoading(true);
        try {
            const data = await api.publicSearchServices(searchQuery);
            setSalons(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSalons();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">X</div>
                        <span className="font-bold text-xl text-gray-800">Xonguile<span className="text-purple-600">App</span></span>
                    </Link>
                    <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-purple-600">Sou um Salão</Link>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8">
                {/* Search Section */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Encontre o melhor cuidado para você</h1>
                    <p className="text-gray-600 mb-8">Pesquise por salões ou serviços específicos em Moçambique</p>

                    <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Pesquise por serviço (ex: Tranças, Barba...)"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-none shadow-lg focus:ring-2 focus:ring-purple-400 text-lg outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-purple-700 transition-colors">
                            Buscar
                        </button>
                    </form>
                </div>

                {/* Results Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 text-center">
                            <div className="animate-spin w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-500">Buscando salões incríveis...</p>
                        </div>
                    ) : salons.length > 0 ? (
                        salons.map(salon => (
                            <SalonCard key={salon.id} salon={salon} />
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                            <Store className="mx-auto text-gray-300 mb-4" size={48} />
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Nenhum salão encontrado</h3>
                            <p className="text-gray-500">Tente buscar por outro termo ou explore todos os salões.</p>
                            <button onClick={loadSalons} className="mt-4 text-purple-600 font-bold hover:underline">Ver todos os salões</button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function SalonCard({ salon }: { salon: any }) {
    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
                <div className="flex gap-4">
                    <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                        <Store size={32} />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-gray-800 group-hover:text-purple-600 transition-colors">{salon.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin size={14} />
                            {salon.address || 'Moçambique'}
                        </p>
                    </div>
                </div>
                <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Ativo</div>
            </div>

            <div className="space-y-3">
                <p className="text-sm text-gray-600 line-clamp-2">Especialistas em beleza e bem-estar prontos para atendê-lo com excelência.</p>
                <Link
                    to={`/agendar/${salon.id}`}
                    className="flex items-center justify-between w-full bg-gray-50 group-hover:bg-purple-600 group-hover:text-white p-4 rounded-2xl font-bold transition-all text-gray-800"
                >
                    <span>Ver Serviços e Agendar</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
