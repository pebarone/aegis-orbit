import { Link, useLocation } from 'react-router-dom';

export const Sidebar = () => {
    const location = useLocation();
    
    const NavItem = ({ to, icon, label }: { to: string, icon: string, label: string }) => {
        const isActive = location.pathname === to;
        const baseClass = "flex items-center gap-3 px-3 py-2 rounded-sm transition-all";
        const activeClass = isActive 
            ? "bg-primary-container text-on-primary-container border-l-4 border-secondary translate-x-1 duration-150" 
            : "text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest";
        
        return (
            <Link to={to} className={`${baseClass} ${activeClass}`}>
                <span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}>{icon}</span>
                <span className="font-label-sm text-label-sm uppercase tracking-widest">{label}</span>
            </Link>
        );
    };

    return (
        <nav className="bg-surface-container-low border-r border-surface-border hidden md:flex flex-col py-gutter fixed left-0 top-16 bottom-0 w-64 z-40">
            <div className="px-gutter mb-6">
                <h2 className="font-headline-md text-headline-md font-black text-on-surface uppercase">OPERATIONS</h2>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mt-1">Sector-7G Node</p>
            </div>
            <div className="flex flex-col flex-1 gap-1 px-unit">
                <NavItem to="/" icon="dashboard" label="Dashboard" />
                <NavItem to="/conjunctions" icon="radar" label="Conjunctions" />
                <NavItem to="/evasion" icon="timeline" label="Evasion Routing" />
                <NavItem to="/status" icon="terminal" label="System Status" />
            </div>
            <div className="flex flex-col gap-1 px-unit mt-auto border-t border-surface-border pt-4">
                <div className="px-3 py-2 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                    Same-origin API
                </div>
            </div>
        </nav>
    );
};
