import {
    Calendar as CalendarIcon,
    LayoutDashboard,
    Users,
    Scissors,
    Package,
    Settings,
    LogOut,
    Sparkles,
    Banknote,
    ShoppingCart,
    Menu,
    Clock,
    Shield
} from 'lucide-react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { useState } from 'react';

export function MainLayout() {
    // SECURITY HELPER: Fetch user data reliably
    const getUserData = () => {
        try {
            return JSON.parse(localStorage.getItem('salao_user') || '{}');
        } catch (e) {
            return {};
        }
    };

    const user = getUserData();
    const license = user?.salon?.License || user?.salon?.license || {};
    const isSuper = user.role?.startsWith('super_');
    const isTrial = license.type === 'trial';
    const isStandardOrGold = license.type?.includes('standard') || license.type?.includes('gold') || license.type?.includes('premium');
    const salonName = user?.salon?.name || 'Seu Salão';

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden flex-col md:flex-row">

            {/* --- Desktop Sidebar (Hidden on Mobile) --- */}
            <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col shadow-sm z-10">
                <div className="p-6 flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-600/20">
                            X
                        </div>
                        <span className="font-bold text-xl tracking-tight text-gray-800">Xonguile<span className="text-purple-600">App</span></span>
                    </div>
                    <div className="pl-11 text-xs font-semibold text-gray-500 uppercase tracking-wider truncate max-w-[200px]" title={salonName}>
                        {isSuper ? 'GESTÃO GLOBAL' : salonName}
                    </div>
                    {/* License Badge */}
                    {!isSuper && (
                        <div className="pl-11 mt-1">
                            <LicenseBadge user={user} />
                        </div>
                    )}
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {isSuper ? (
                        <>
                            <NavItem to="/admin/super" icon={<Shield size={20} />} label="Painel Super Admin" />
                            <NavItem to="/admin/financeiro" icon={<Banknote size={20} />} label="Receitas Globais" />
                        </>
                    ) : (
                        <>
                            <NavItem to="/admin" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                            <NavItem to="/admin/caixa" icon={<ShoppingCart size={20} />} label="Caixa / PDV" />
                            <NavItem to="/admin/agenda" icon={<CalendarIcon size={20} />} label="Agenda" />
                            <NavItem to="/admin/fila" icon={<Clock size={20} />} label="Fila de Atendimento" />
                            <NavItem to="/admin/clientes" icon={<Users size={20} />} label="Clientes" />
                            <NavItem to="/admin/profissionais" icon={<Scissors size={20} />} label="Profissionais" />
                            <NavItem to="/admin/servicos" icon={<Sparkles size={20} />} label="Serviços" />
                            <NavItem to="/admin/estoque" icon={<Package size={20} />} label="Estoque" />
                            <NavItem to="/admin/financeiro" icon={<Banknote size={20} />} label="Financeiro" />
                        </>
                    )}
                    <div className="pt-4 mt-4 border-t border-gray-100">
                        <NavItem
                            to={isSuper ? "/admin/super" : "/admin/configuracoes"}
                            icon={<Settings size={20} />}
                            label="Configurações"
                        />
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={() => {
                            localStorage.removeItem('salao_user');
                            window.location.href = '/login';
                        }}
                        className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors text-sm font-medium"
                    >
                        <LogOut size={18} />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>

            {/* --- Mobile Header --- */}
            <header className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm relative z-20">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-600 rounded-md flex items-center justify-center text-white font-bold text-sm">X</div>
                    <span className="font-bold text-lg text-gray-800">Xonguile<span className="text-purple-600">App</span></span>
                </div>
                {!isSuper && <LicenseBadge user={user} />}
            </header>

            {/* --- Main Area --- */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50 relative pb-16 md:pb-0">
                {!isSuper && isTrial && (
                    <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-3 text-center text-xs font-bold shadow-lg flex items-center justify-center gap-3 animate-pulse">
                        <Sparkles size={16} className="text-yellow-300" />
                        VOCÊ ESTÁ EM MODO DE TESTE. SEU ACESSO É TEMPORÁRIO.
                        <Link to="/admin/configuracoes" className="bg-white text-orange-600 px-3 py-1 rounded-full hover:bg-orange-50 transition-colors ml-2">ASSINAR AGORA</Link>
                    </div>
                )}
                <Outlet />
            </main>

            {/* --- Mobile Footer --- */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 px-2 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <MobileNavItem to="/admin" icon={<LayoutDashboard size={20} />} label="Início" />
                <MobileNavItem to="/admin/agenda" icon={<CalendarIcon size={20} />} label="Agenda" />
                <NavLink to="/admin/caixa" className="flex flex-col items-center justify-center -mt-8">
                    <div className="w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 border-4 border-gray-50">
                        <ShoppingCart size={24} />
                    </div>
                    <span className="text-[10px] font-medium text-gray-600 mt-1">Caixa</span>
                </NavLink>
                <MobileNavItem to="/admin/financeiro" icon={<Banknote size={20} />} label="Finanças" />
                <MobileNavItem to={isSuper ? "/admin/super" : "/admin/configuracoes"} icon={<Menu size={20} />} label="Mais" />
            </nav>
        </div>
    );
}

function NavItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
    return (
        <NavLink to={to} className={({ isActive }) => clsx(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all text-sm font-medium group",
            isActive ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}>
            <span className="group-[.active]:text-purple-600 text-gray-400 group-hover:text-gray-600 transition-colors">{icon}</span>
            <span>{label}</span>
        </NavLink>
    );
}

function MobileNavItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
    return (
        <NavLink to={to} className={({ isActive }) => clsx(
            "flex flex-col items-center justify-center w-full h-full gap-1",
            isActive ? "text-purple-600" : "text-gray-400"
        )}>
            {icon}
            <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
    );
}

function LicenseBadge({ user }: any) {
    const license = user?.salon?.License || user?.salon?.license;
    if (!license) return null;

    const daysLeft = Math.ceil((new Date(license.validUntil).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    const label = license.type?.includes('trial') ? 'Teste' : license.type?.split('_')[0].toUpperCase();

    return (
        <div className={clsx(
            "px-2 py-0.5 rounded text-[9px] font-black tracking-tighter uppercase",
            license.type === 'trial' ? "bg-orange-600 text-white" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
        )}>
            {label} • {daysLeft > 0 ? daysLeft : 0}D
        </div>
    );
}
