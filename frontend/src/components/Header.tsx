

export const Header = () => (
    <header className="bg-background border-b border-surface-border flex justify-between items-center w-full px-margin-desktop h-16 z-50 fixed top-0 flex-shrink-0">
        <div className="flex items-center gap-6">
            <h1 className="font-headline-md text-headline-md font-bold tracking-tighter text-primary">OrbitGuard SSA CONTROL</h1>
            <div className="hidden md:flex items-center gap-6 border-l border-surface-border pl-6">
                <span className="font-data-label text-data-label text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">schedule</span> MISSION CLOCK: 14:22:05 UTC
                </span>
                <span className="font-data-label text-data-label text-status-nominal flex items-center gap-2">
                    [!] AZURE API: CONNECTED
                </span>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <a
                href="/docs"
                className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors p-2 rounded-sm active:scale-[0.99]"
                title="Open Swagger API docs"
            >
                <span className="material-symbols-outlined">api</span>
            </a>
            <button className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors p-2 rounded-sm active:scale-[0.99] relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-status-critical rounded-full glowing-dot"></span>
            </button>
            <button className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors p-2 rounded-sm active:scale-[0.99]">
                <span className="material-symbols-outlined">account_circle</span>
            </button>
        </div>
    </header>
);
