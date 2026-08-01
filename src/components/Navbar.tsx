import { Link } from "react-router-dom";
import { useState } from "react";

type SubmenuVoice = {
  label: string;
  path: string;
};

type TreniSubItem = {
  label: string;
  path?: string; // Il punto di domanda rende la proprietà opzionale
  submenu?: SubmenuVoice[];
};

const TRENI_SUBMENU: TreniSubItem[] = [
  { label: "Ricerca", path: "/treni/ricerca" },
  { 
    label: "Milano-Berna", 
    submenu: [
      { label: "Partenze", path: "/treni/milano-berna/partenze" },
      { label: "Percorso", path: "/treni/milano-berna/percorso" },
      { label: "Tempo reale", path: "/treni/milano-berna/tempo-reale" }
    ] 
  },
  { label: "Help", path: "/treni/help" },
];

function ArrowIcon() {
  return (
    <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export default function Navbar() {
  const [isHoveringTrigger, setIsHoveringTrigger] = useState(false);
  const [isHoveringPanel, setIsHoveringPanel] = useState(false);
  const isTreniOpen = isHoveringTrigger || isHoveringPanel;

  return (
    <div className="sticky top-0 z-50">
      <nav className="bg-black text-white flex items-center px-8 py-4">
        <Link to="/" className="text-xl font-bold">
          Gaby React
        </Link>

        <div className="flex-1 flex justify-center items-center gap-16">
          <Link to="/" className="hover:text-gray-300">
            Home
          </Link>

          <div
            className="pb-6 -mb-6"
            onMouseEnter={() => setIsHoveringTrigger(true)}
            onMouseLeave={() => setIsHoveringTrigger(false)}
          >
            <Link to="/treni" className="hover:text-gray-300">
              Treni
            </Link>
          </div>

          <Link to="/db" className="hover:text-gray-300">
            DB
          </Link>
          <Link to="/ai" className="hover:text-gray-300">
            AI
          </Link>
        </div>

        <button aria-label="Cerca" className="hover:text-gray-300">
          <SearchIcon />
        </button>
      </nav>

      {isTreniOpen && (
        <div
          onMouseEnter={() => setIsHoveringPanel(true)}
          onMouseLeave={() => setIsHoveringPanel(false)}
          className="absolute top-full left-0 w-full bg-white text-black px-8 py-6 shadow-lg z-20 flex gap-16"
        >
          {TRENI_SUBMENU.map((item) => (
            <div key={item.label} className="group cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-wide">{item.label}</span>
                <ArrowIcon />
              </div>
              {item.submenu && (
                <div className="flex flex-col mt-3 gap-2">
                  {item.submenu.map((voice) => (
                    <Link 
                      key={voice.label} 
                      to={voice.path}
                      className="relative group/voice flex items-center cursor-pointer select-none text-black no-underline"
                    >
                      {/* IL BULLET */}
                      <span className="absolute left-0 w-1.5 h-1.5 rounded-full bg-black opacity-0 transition-opacity duration-100 group-hover/voice:opacity-100 group-hover/voice:duration-[750ms]" />
                      
                      {/* IL TESTO */}
                      <span className="ml-0 transition-all duration-100 group-hover/voice:ml-[13px] group-hover/voice:duration-[750ms]">
                        {voice.label}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}