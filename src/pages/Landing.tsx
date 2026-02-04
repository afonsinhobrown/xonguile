import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowRight, Star, Scissors, Calendar, ShieldCheck, CheckCircle2, Menu, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen font-sans bg-white text-gray-900 selection:bg-purple-200 selection:text-purple-900">

            {/* --- Navbar --- */}
            <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-white/10 backdrop-blur-md border-b border-white/20">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/30">
                            X
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-white">Xonguile<span className="text-purple-300">App</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#funcionalidades" className="text-sm font-medium text-gray-200 hover:text-white transition-colors">Funcionalidades</a>
                        <Link to="/explorar" className="text-sm font-medium text-gray-200 hover:text-white transition-colors">Encontrar Salão</Link>
                        <a href="#planos" className="text-sm font-medium text-gray-200 hover:text-white transition-colors">Planos</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="hidden md:block text-sm font-bold text-white hover:text-purple-200 transition-colors"
                        >
                            Entrar
                        </button>
                        <Button
                            onClick={() => navigate('/register')}
                            className="bg-white text-purple-900 hover:bg-gray-100 border-none shadow-xl"
                        >
                            Cadastrar Salão
                        </Button>
                    </div>
                </div>
            </nav>

            {/* --- Hero Section --- */}
            <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-gray-900">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/hero-bg.png"
                        alt="Mulher Moçambicana Beleza"
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-purple-900/30" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8 animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-purple-200 text-sm font-medium">
                            <Star size={14} className="text-yellow-400" fill="currentColor" />
                            <span>Plataforma #1 em Moçambique</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tight">
                            A Beleza da <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                Nossa Cultura
                            </span>
                            <br />Digitalizada.
                        </h1>

                        <p className="text-lg md:text-xl text-gray-300 max-w-xl leading-relaxed">
                            Xonguile App conecta a tradição do mussiro à tecnologia.
                            Gerencie seu salão, atraia clientes e eleve o padrão da beleza moçambicana.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => navigate('/explorar')}
                                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-purple-600/40 flex items-center justify-center gap-2 group"
                            >
                                Agendar um Serviço
                                <Calendar size={20} className="group-hover:scale-110 transition-transform" />
                            </button>
                            <button
                                onClick={() => navigate('/register')}
                                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold text-lg transition-all backdrop-blur-sm"
                            >
                                Cadastrar meu Salão
                            </button>
                        </div>

                        <div className="flex items-center gap-6 pt-4 text-sm font-medium text-gray-400">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-gray-900 bg-gray-700 overflow-hidden">
                                        <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                                    </div>
                                ))}
                            </div>
                            <p>Mais de <span className="text-white">50 Salões</span> confiam na Xonguile.</p>
                        </div>
                    </div>

                    {/* Right Side: Floating App Preview or Abstract Art */}
                    <div className="hidden lg:block relative">
                        <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-700">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-gray-400 text-xs uppercase tracking-wider">Parceiro Destaque</p>
                                    <h3 className="text-white text-2xl font-bold">Angi-Arte Cabeleireiros</h3>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300">
                                    <Scissors />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                    <div className="flex justify-between items-center text-white">
                                        <span>Tratamento Mussiro Real</span>
                                        <span className="font-bold">800 MT</span>
                                    </div>
                                    <p className="text-gray-400 text-xs mt-1">45 min • Facial</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                    <div className="flex justify-between items-center text-white">
                                        <span>Tranças Box Braids</span>
                                        <span className="font-bold">2500 MT</span>
                                    </div>
                                    <p className="text-gray-400 text-xs mt-1">3h • Cabelo</p>
                                </div>
                                <div className="bg-purple-600 p-4 rounded-xl text-center text-white font-bold cursor-pointer hover:bg-purple-500 transition-colors">
                                    Agendar Horário
                                </div>
                            </div>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-500 rounded-full blur-[80px] opacity-40"></div>
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500 rounded-full blur-[80px] opacity-40"></div>
                    </div>
                </div>
            </section>

            {/* --- Features Section --- */}
            <section id="funcionalidades" className="py-24 bg-gray-50 text-gray-900">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-purple-600 font-bold tracking-wide uppercase text-sm mb-2">Para Profissionais</h2>
                        <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Tudo que seu salão precisa para crescer</h3>
                        <p className="text-gray-600 text-lg">Deixe o papel e caneta de lado. Tenha controle total financeiro, estoque e agenda na palma da mão.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Calendar className="text-purple-600" size={24} />}
                            title="Agenda Inteligente"
                            description="Evite conflitos de horário e envie lembretes automáticos para seus clientes via WhatsApp/SMS."
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="text-pink-600" size={24} />}
                            title="Financeiro Completo"
                            description="Controle de caixa, despesas, lucros e comissões dos profissionais em tempo real."
                        />
                        <FeatureCard
                            icon={<Scissors className="text-blue-600" size={24} />}
                            title="Gestão de Estoque"
                            description="Saiba exatamente quando repor seus produtos de beleza e evite desperdícios."
                        />
                    </div>
                </div>
            </section>

            {/* --- Pricing Section --- */}
            <section id="planos" className="py-24 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h3 className="text-4xl font-black text-gray-900 mb-4">Escolha o plano para o seu negócio</h3>
                        <p className="text-gray-600">Preços transparentes para escalar o seu salão.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <LandingPlanCard
                            name="Standard"
                            price="1.800"
                            annual="19.000"
                            features={["Até 50 agendamentos", "Gestão de Equipa", "Controle de Serviços", "Relatórios Diários"]}
                        />
                        <LandingPlanCard
                            name="Gold"
                            price="2.500"
                            annual="22.000"
                            highlight
                            features={["Até 70 agendamentos", "Gestão de Estoque", "Relatórios Estendidos", "Suporte VIP"]}
                        />
                        <LandingPlanCard
                            name="Premium"
                            price="3.000"
                            annual="28.000"
                            features={["Agendamentos Ilimitados", "Fila de Espera Digital", "BI Avançado", "Sem anúncios"]}
                        />
                    </div>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className="bg-gray-900 border-t border-gray-800 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                        <div>
                            <span className="font-bold text-2xl text-white">Xonguile<span className="text-purple-500">App</span></span>
                            <p className="text-gray-400 mt-2 max-w-xs">A revolução digital da beleza moçambicana. Desenvolvido com orgulho pela #EncubadoraDeSoluções.</p>
                        </div>
                        <div className="flex gap-6 text-gray-400">
                            <a href="#" className="hover:text-white transition-colors">Instagram</a>
                            <a href="#" className="hover:text-white transition-colors">Facebook</a>
                            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                        <p>© 2026 Xonguile App. Todos os direitos reservados.</p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-white">Termos</a>
                            <a href="#" className="hover:text-white">Privacidade</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                {icon}
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">{title}</h4>
            <p className="text-gray-500 leading-relaxed">
                {description}
            </p>
        </div>
    )
}

function LandingPlanCard({ name, price, annual, features, highlight }: any) {
    return (
        <div className={clsx(
            "p-10 rounded-[2.5rem] bg-white border-2 flex flex-col justify-between transition-all hover:shadow-2xl",
            highlight ? "border-purple-600 shadow-xl z-10 rotate-1" : "border-gray-100"
        )}>
            <div>
                <h4 className="text-2xl font-black mb-6 text-gray-900">{name}</h4>
                <div className="mb-8">
                    <p className="text-5xl font-black text-gray-900 tracking-tight">
                        <span className="text-xl font-bold">MZN</span> {price}
                    </p>
                    <p className="text-gray-500 font-bold">por mês</p>
                    <p className="text-xs text-gray-400 mt-1 italic">MZN {annual} no plano anual</p>
                </div>
                <ul className="space-y-4 mb-8">
                    {features.map((f: string, i: number) => (
                        <li key={i} className="flex items-center gap-3 text-gray-600 font-medium">
                            <CheckCircle size={18} className="text-emerald-500" />
                            {f}
                        </li>
                    ))}
                </ul>
            </div>
            <Link to="/register" className={clsx(
                "w-full py-5 rounded-2xl font-bold text-center transition-all",
                highlight ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 hover:bg-purple-700" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            )}>
                Assinar Plano
            </Link>
        </div>
    );
}
