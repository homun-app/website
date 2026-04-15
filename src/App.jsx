import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    Terminal, MessageSquare, Code, Users, Briefcase, Plane,
    Settings, LogOut, Search, Plus, User, Wand2, Shield, Lock, Eye, Server, Zap, Globe, Github, ArrowRight, Check, ChevronDown, Smartphone, BookOpen, Map
} from 'lucide-react';
import roadmapData from './data/roadmap.json';

gsap.registerPlugin(ScrollTrigger);

// ==========================================
// SCROLL REVEAL HOOK
// ==========================================
const useReveal = (threshold = 0.1) => {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const children = el.querySelectorAll('.reveal');
        gsap.set(children, { y: 20, opacity: 0 });

        const ctx = gsap.context(() => {
            const scrollerEl = document.querySelector("#main-scroll-container");
            if (!scrollerEl) return;
            
            ScrollTrigger.create({
                trigger: el,
                scroller: scrollerEl,
                start: 'top 85%',
                onEnter: () => {
                    gsap.to(children, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' });
                }
            });
        }, ref);
        return () => ctx.revert();
    }, [threshold]);
    return ref;
};

// ==========================================
// DATA: SKILLS & HISTORY
// ==========================================
const historyItems = [
    {
        id: 'travel',
        time: '21:31',
        title: 'Plan London trip & monitor flight prices',
        icon: <Plane size={14} />,
        prompt: 'book a train from neaples to milan. 24 april 2026',
        status: 'Searched the web',
        desc: 'Finds itineraries, plans what to see, monitors flight prices 24/7, and alerts you exactly when to leave.',
        steps: [
            'Browser step completed: navigate to Italo website',
            'Browser step completed: click date field to update it'
        ],
        text: "I'll help you book a train from Naples to Milan on April 24, 2026. Let me start by navigating to the Italo website to find available trains.\n\nI'll navigate directly to the Italo website to search for trains on April 24, 2026.\n\nI can see the Italo page with train schedules, but it's showing dates for this week. I need to change the date to April 24, 2026. Let me click on the date field to update it."
    },
    {
        id: 'business',
        time: '14:20',
        title: 'Process pending morning messages',
        icon: <Briefcase size={14} />,
        prompt: 'Check new WhatsApp messages and draft replies',
        status: 'Processed 14 messages',
        desc: 'Manages your calendar, drafts emails, and prepares WhatsApp replies. You approve, or let it run autonomously.',
        steps: [
            'API connection completed: WhatsApp Web Tunnel',
            'Draft generated: Client A (Proposal update)'
        ],
        text: "I've scanned your recent incoming messages across WhatsApp and Outlook.\n\nThere are 14 unread messages, but only 3 require your immediate attention. I've drafted a polite decline for the Marketing Summit next week, which is currently sitting in your Drafts for approval. \n\nI've also autonomously scheduled a Zoom block for Partner B based on your free slots on Thursday."
    },
    {
        id: 'crm',
        time: '09:05',
        title: 'Check upcoming birthdays and gift ideas',
        icon: <Users size={14} />,
        prompt: 'Who has a birthday this week? Suggest gifts.',
        status: 'Vault unlocked (Contacts)',
        desc: 'Define behaviors for contacts. Homun remembers birthdays, tracks past gifts, and searches for new ideas based on tastes.',
        steps: [
            'Memory retrieved: Elena likes Photography',
            'Search completed: Vintage camera straps'
        ],
        text: "Elena's birthday is coming up in 5 days.\n\nLooking at your past Vault interactions, you got her a pair of AirPods last year. Since she recently started a photography course, I've scanned the web for high-quality vintage leather camera straps.\n\nI've sent 3 curated Amazon links directly to your phone."
    },
    {
        id: 'infinite',
        time: '02:00',
        title: 'Deploy high-frequency news scraper',
        icon: <Wand2 size={14} />,
        prompt: 'Deploy custom news-to-notion pipeline',
        status: 'Sandbox execution active',
        desc: 'Combine Workflows, Automations, MCP, and Skills. Build custom flows where the only limit is your imagination.',
        steps: [
            'MCP Plugin Loaded: Browser Base + LLM',
            'Webhook established: Notion Database'
        ],
        text: "Your custom pipeline has been successfully deployed within the isolated Sandbox.\n\nIt will now monitor HackerNews and TechCrunch every 4 hours, summarize the top 5 articles using the local LLM model (Llama3), and push formatted notes directly into your Notion workspace.\n\nThe system runs entirely on your local machine, ensuring complete privacy."
    }
];

const stats = [
    { value: '87K+', label: 'Lines of Rust' },
    { value: '750+', label: 'Tests Passing' },
    { value: '7', label: 'Channels' },
    { value: '20+', label: 'Built-in Tools' },
];

const securityFeatures = [
    { icon: <Lock size={18} />, text: 'AES-256-GCM Vault linked to your OS keychain' },
    { icon: <Shield size={18} />, text: '100% Sandboxed execution for MCP skills' },
    { icon: <Eye size={18} />, text: 'LLM exfiltration guard — intercepts and redacts leaks' },
    { icon: <Server size={18} />, text: 'PBKDF2 auth (600K iterations), HMAC-signed sessions' },
    { icon: <Globe size={18} />, text: 'Trusted device approval, CSRF protection' },
];

const accentColors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#22C55E' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Purple', value: '#A855F7' },
    { name: 'Gray', value: '#6B7280' },
];

const textures = [
    { id: 'none', label: 'None', className: 'pattern-none' },
    { id: 'paper', label: 'Paper', className: 'pattern-paper' },
    { id: 'dots', label: 'Dots', className: 'pattern-dots' },
    { id: 'grid', label: 'Grid', className: 'pattern-grid' },
    { id: 'hatch', label: 'Hatch', className: 'pattern-hatch' },
    { id: 'waves', label: 'Waves', className: 'pattern-waves' },
];

const models = ['local-llm-8b', 'openai-gpt4o', 'anthropic-claude3', 'groq-llama3', 'ollama-registry'];

// ==========================================
// RESTORED LANDING PAGE SECTIONS
// ==========================================
const WhyHomun = () => {
    const ref = useReveal();
    return (
        <section id="why" className="w-full py-32 px-6 md:px-12 lg:px-24">
            <div ref={ref} className="max-w-4xl mx-auto text-center flex flex-col items-center gap-8 reveal">
                <div className="w-16 h-16 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-800 mb-2 shadow-soft">
                    <Smartphone size={24} />
                </div>
                <h1 className="text-4xl md:text-6xl font-sans font-semibold text-gray-900 tracking-tight leading-tight">
                    Homun is your autonomous <br/>
                    <span className="text-accent">Personal Assistant.</span>
                </h1>
                <p className="text-xl text-gray-500 font-light leading-relaxed max-w-2xl mt-4">
                    It proactively manages your life, answers your emails, and executes repetitive workflows entirely on your local machine. Your rules. Your hardware. Total privacy.
                </p>
                <div className="reveal flex flex-wrap justify-center gap-12 pt-8 border-t border-gray-100 mt-4 w-full">
                    {stats.map((s, i) => (
                        <div key={i} className="flex flex-col gap-1 items-center">
                            <div className="text-3xl font-sans font-bold text-gray-800">{s.value}</div>
                            <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// CAPABILITIES BENTO GRID
const Capabilities = () => {
    const ref = useReveal(0.05);

    return (
        <section id="capabilities" className="w-full py-24 px-6 md:px-12 lg:px-24 bg-white/40">
            <div ref={ref} className="max-w-5xl mx-auto flex flex-col gap-12">
                <div className="reveal text-center">
                    <h2 className="text-3xl md:text-5xl font-sans font-semibold text-gray-900 mb-4 tracking-tight">Capabilities</h2>
                    <p className="text-lg text-gray-500 font-light max-w-2xl mx-auto leading-relaxed">
                        Unlike transient chatbots, Homun maintains persistent state. It tracks, monitors, and executes workflows locally based on your explicit behavioral rules.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {historyItems.map((skill, i) => (
                        <div key={i} className="reveal bg-white border border-gray-100 rounded-3xl p-8 hover:border-gray-200 hover:shadow-soft transition-all flex flex-col gap-4">
                            <div className="bg-gray-50 border border-gray-100 w-12 h-12 rounded-[1rem] flex items-center justify-center text-accent mb-2">
                                {skill.icon}
                            </div>
                            <h3 className="text-2xl font-sans font-semibold text-gray-900">{skill.title.split(' ')[0]} {skill.title.split(' ')[1]}...</h3>
                            <p className="text-sm text-gray-500 font-light leading-relaxed">{skill.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Security = () => {
    const ref = useReveal();
    return (
        <section ref={ref} id="security" className="w-full bg-[#07070A] py-32 px-6 md:px-12 lg:px-24 rounded-[3rem] mx-auto w-[90%] max-w-7xl relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 blur-[100px] rounded-full pointer-events-none" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start relative z-10">
                <div className="reveal">
                    <h2 className="text-3xl md:text-5xl font-sans font-semibold text-white mb-6 tracking-tight">An unbreachable Vault.</h2>
                    <p className="text-lg text-white/50 font-light leading-relaxed mb-12 max-w-lg">
                        If an assistant has access to your contacts and emails, security is paramount. Homun relies on a military-grade Vault system, and executes 3rd-party skills inside isolated Sandboxes.
                    </p>

                    <div className="flex flex-col gap-0 border-t border-white/10">
                        {securityFeatures.map((sf, i) => (
                            <div key={i} className="flex items-center gap-4 py-4 border-b border-white/10 text-sm font-sans font-light">
                                <div className="text-accent">{sf.icon}</div>
                                <span className="text-white/80">{sf.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="reveal bg-white/5 border border-white/10 p-8 rounded-2xl h-full flex flex-col justify-center backdrop-blur-md">
                    <div className="font-mono text-xs text-white/40 uppercase tracking-widest mb-6">Security Daemon Output</div>
                    <pre className="font-mono text-sm text-white/80 leading-loose whitespace-pre-wrap">
                        <span className="text-green-400">✓</span> VAULT UNLOCK: AES-256-GCM<br/>
                        <span className="text-green-400">✓</span> SANDBOX: ACTIVE<br/>
                        <span className="text-green-400">✓</span> EXFILTRATION GUARD: ARMED<br/>
                        <span className="text-green-400">✓</span> MCP PROTOCOL: AUTHORIZED<br/>
                        <br/>
                        <span className="text-white/40">STATUS: PERSONAL DATA SECURE.</span>
                    </pre>
                </div>
            </div>
        </section>
    );
};

// UI PREVIEW (Screenshots)
const UIPreview = () => {
    const ref = useReveal();
    const [active, setActive] = useState(0);
    const screens = [
        { name: 'Dashboard Layout', img: '/screenshots/dashboard.png' },
        { name: 'Automation Studio', img: '/screenshots/automations.png' },
        { name: 'Plugin Ecosystem', img: '/screenshots/skills.png' },
    ];

    return (
        <section ref={ref} id="screenshots" className="w-full py-32 px-6 md:px-12 lg:px-24">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 items-start">
                <div className="reveal flex-1 w-full md:w-1/3 pt-12">
                    <h2 className="text-3xl md:text-4xl font-sans font-semibold text-gray-900 mb-4 tracking-tight">Native Web Interface</h2>
                    <p className="text-base text-gray-500 font-light mb-8 leading-relaxed">Optional local-first web UI for monitoring executions, defining visual workflows, and installing marketplace extensions from GitHub.</p>
                    
                    <div className="flex flex-col gap-2">
                        {screens.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => setActive(i)}
                                className={`text-left px-4 py-3 border-l-2 text-sm font-medium transition-colors rounded-r-lg ${active === i ? 'border-accent text-accent bg-gray-50' : 'border-gray-200 text-gray-400 hover:text-gray-900 hover:bg-gray-50/50'}`}
                            >
                                {s.name}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="reveal flex-[2] w-full bg-white border border-gray-100 p-2 rounded-[2rem] shadow-soft overflow-hidden aspect-video">
                    <div className="w-full h-full bg-gray-50 rounded-2xl relative overflow-hidden flex items-center justify-center text-gray-300 text-xs font-mono">
                        <img 
                            src={screens[active].img} 
                            alt={screens[active].name} 
                            className="w-full h-full object-cover object-top rounded-2xl" 
                            onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = 'Screenshot Placeholders'; }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

// ROADMAP & CHANGELOG
const RoadmapAndChangelog = () => {
    const ref = useReveal();
    const changelog = [
        { date: "Mar 20, 2026", version: "v1.2.0 (Stable)", diff: [
            { type: "+", text: "Implemented pure local MCP bridging protocol" },
            { type: "-", text: "Removed default cloud dependency for the Vault proxy" },
            { type: " ", text: "Refactored sandbox startup sequence for 2x faster load" }
        ]},
        { date: "Feb 15, 2026", version: "v1.1.5", diff: [
            { type: "+", text: "Added Apple M3 hardware acceleration natively" },
            { type: "+", text: "Added 12 new core plugins to the registry" }
        ]}
    ];

    return (
        <section ref={ref} id="roadmap" className="w-full py-24 px-6 md:px-12 lg:px-24 bg-gray-50/50 border-t border-b border-gray-100/50">
            <div className="max-w-7xl mx-auto flex flex-col gap-24">
                
                {/* HORIZONTAL ROADMAP */}
                <div className="reveal flex flex-col gap-8">
                    <div className="flex items-center gap-3">
                        <Map size={24} className="text-gray-800" />
                        <h2 className="text-3xl md:text-4xl font-sans font-semibold text-gray-900 tracking-tight">Roadmap</h2>
                    </div>
                    <div className="flex flex-row overflow-x-auto gap-6 pb-6 snap-x snap-mandatory hide-scrollbar">
                        {roadmapData.map((phase, i) => (
                            <div key={i} className="min-w-[320px] w-[320px] bg-white border border-gray-100 rounded-3xl p-8 shadow-sm snap-start flex flex-col gap-4 relative isolate">
                                {phase.status === 'completed' && <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-[100px] -z-10" />}
                                <div className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 w-fit">
                                    <span className={`font-mono text-[9px] uppercase tracking-widest ${phase.status === 'completed' ? 'text-accent font-bold' : 'text-gray-400'}`}>
                                        {phase.status}
                                    </span>
                                </div>
                                <h3 className={`text-xl font-sans font-semibold mt-2 ${phase.status === 'completed' ? 'text-gray-900' : 'text-gray-400'}`}>{phase.name}</h3>
                                <p className="text-sm font-light text-gray-500 leading-relaxed">{phase.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* PR-STYLE CHANGELOG */}
                <div className="reveal flex flex-col gap-8">
                    <div className="flex items-center gap-3">
                        <Code size={24} className="text-gray-800" />
                        <h2 className="text-3xl md:text-4xl font-sans font-semibold text-gray-900 tracking-tight">Changelog</h2>
                    </div>
                    <div className="flex flex-col gap-6 max-w-4xl">
                        {changelog.map((entry, i) => (
                            <div key={i} className="bg-[#0D1117] border border-[#30363D] rounded-2xl overflow-hidden shadow-soft">
                                <div className="flex justify-between items-center px-6 py-3 border-b border-[#30363D] bg-[#161B22]">
                                    <span className="font-mono text-sm font-bold text-[#E6EDF3]">{entry.version}</span>
                                    <span className="font-mono text-xs text-[#8B949E]">{entry.date}</span>
                                </div>
                                <div className="py-4 font-mono text-sm leading-relaxed flex flex-col">
                                    {entry.diff.map((line, j) => (
                                        <div key={j} className={`px-4 py-1 flex gap-4 ${line.type === '+' ? 'bg-[#2EA043]/15 text-[#7EE787]' : line.type === '-' ? 'bg-[#F85149]/15 text-[#FFA198]' : 'text-[#E6EDF3] opacity-70'}`}>
                                            <span className="opacity-50 select-none w-4">{line.type}</span>
                                            <span>{line.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
};

const DownloadSection = () => {
    const ref = useReveal();
    return (
        <section ref={ref} id="download" className="w-full py-32 px-6 md:px-12 lg:px-24">
            <div className="max-w-6xl mx-auto flex flex-col items-center justify-center text-center gap-12">
                <div className="reveal">
                    <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-mono uppercase tracking-widest px-4 py-2 rounded-full mb-6">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        v1.0.0 — Just Shipped
                    </div>
                    <Terminal size={32} className="text-gray-800 mx-auto mb-6" />
                    <h2 className="text-4xl md:text-5xl font-sans font-semibold text-gray-900 tracking-tight mb-4">Deploy Homun</h2>
                    <p className="text-lg text-gray-500 font-light max-w-xl mx-auto">Available for macOS, Linux, and Windows (via WSL). Single binary. Runs entirely on your hardware. No cloud account necessary.</p>
                </div>

                <div className="reveal w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { name: 'macOS', desc: 'Apple Silicon / Intel', cmd: 'brew install homun-app/tap/homun', href: 'https://github.com/homun-app/homun/releases/latest' },
                        { name: 'Ubuntu / Debian', desc: '.deb amd64 / arm64', cmd: 'sudo apt install ./homun_1.0.0-1_amd64.deb', href: 'https://github.com/homun-app/homun/releases/latest/download/homun_1.0.0-1_amd64.deb' },
                        { name: 'Fedora / RHEL', desc: '.rpm x86_64', cmd: 'sudo dnf install ./homun-1.0.0-1.x86_64.rpm', href: 'https://github.com/homun-app/homun/releases/latest/download/homun-1.0.0-1.x86_64.rpm' },
                        { name: 'Windows', desc: 'via WSL2', cmd: 'See install guide', href: 'https://github.com/homun-app/homun/blob/main/docs/INSTALL-WINDOWS-WSL.md' }
                    ].map(btn => (
                        <a key={btn.name} href={btn.href} target="_blank" rel="noopener noreferrer" className="bg-white border border-gray-200 hover:border-accent hover:ring-1 hover:ring-accent p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all flex flex-col items-center justify-center gap-2 group text-center">
                            <span className="text-xl font-sans font-semibold text-gray-900">{btn.name}</span>
                            <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">{btn.desc}</span>
                            <div className="mt-3 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full text-accent text-[10px] flex items-center gap-2 group-hover:bg-accent group-hover:text-white transition-all font-medium">
                                Download <ArrowRight size={12}/>
                            </div>
                        </a>
                    ))}
                </div>

                <div className="reveal bg-gray-50 border border-gray-200 pl-8 pr-2 py-2 rounded-full font-mono text-sm text-gray-800 flex items-center justify-between shadow-sm mt-4 w-full max-w-2xl">
                    <div className="flex items-center gap-3">
                        <span className="text-gray-400">$</span> brew install homun-app/tap/homun
                    </div>
                    <button className="bg-white text-gray-600 px-4 py-2 border border-gray-200 rounded-full text-xs font-sans hover:bg-gray-100 transition-colors">Copy</button>
                </div>

                <div className="reveal flex items-center gap-6 text-sm text-gray-500 mt-2">
                    <a href="https://github.com/homun-app/homun/releases/tag/v1.0.0" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors flex items-center gap-2">
                        <Github size={16} /> v1.0.0 release notes
                    </a>
                    <a href="https://github.com/homun-app/homun/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors flex items-center gap-2">
                        Full changelog
                    </a>
                    <a href="https://github.com/homun-app/homun/releases/latest/download/installers-checksums.sha256" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors flex items-center gap-2">
                        SHA-256 checksums
                    </a>
                </div>
            </div>
        </section>
    );
};

// ==========================================
// THEME & SETTINGS MODAL
// ==========================================
const SettingsModal = ({ isOpen, onClose, accent, setAccent, bgTheme, setBgTheme }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-[2rem] p-8 w-[90%] max-w-lg shadow-2xl relative border border-gray-100" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-sans font-semibold text-gray-900 mb-6">Appearance</h3>
                
                {/* Accent Colors */}
                <div className="mb-8">
                    <p className="text-sm font-medium text-gray-500 mb-4">Accent Color</p>
                    <div className="flex gap-4">
                        {accentColors.map(c => (
                            <button
                                key={c.name}
                                onClick={() => setAccent(c.value)}
                                className={`w-10 h-10 rounded-full border-4 transition-all ${accent === c.value ? 'border-accent/30 scale-110' : 'border-transparent hover:scale-105 shadow-sm'}`}
                                style={{ backgroundColor: c.value }}
                            />
                        ))}
                    </div>
                </div>

                {/* Background Textures */}
                <div className="mb-8">
                    <p className="text-sm font-medium text-gray-500 mb-4">Background Texture</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {textures.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setBgTheme(t.className)}
                                className={`flex flex-col items-center gap-2 group`}
                            >
                                <div className={`w-14 h-14 rounded-xl border-2 transition-all ${bgTheme === t.className ? 'border-accent' : 'border-gray-100 group-hover:border-gray-300'} overflow-hidden relative bg-gray-50`}>
                                    <div className={`absolute inset-0 ${t.className} opacity-50`} />
                                </div>
                                <span className={`text-xs ${bgTheme === t.className ? 'text-accent font-semibold' : 'text-gray-500'}`}>{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
                    <button onClick={onClose} className="bg-accent text-white px-6 py-3 rounded-full font-medium shadow-soft hover:opacity-90 transition-opacity">
                        Save Appearance
                    </button>
                </div>
            </div>
        </div>
    );
};


// ==========================================
// MAIN APP SHELL
// ==========================================
function App() {
    const [accent, setAccent] = useState(accentColors[0].value);
    const [bgTheme, setBgTheme] = useState(textures[4].className); // Default to Hatch
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeHistory, setActiveHistory] = useState(historyItems[0]);
    const [logoError, setLogoError] = useState(false);
    
    // New States for Navigation Refinements
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState(models[0]);
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const chatRef = useRef(null);

    // Apply CSS Variables globally
    useEffect(() => {
        document.documentElement.style.setProperty('--color-accent', accent);
    }, [accent]);

    // Intersection Observer to toggle sidebar automatically
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                setIsSidebarOpen(entry.isIntersecting);
            });
        }, { threshold: 0.1 });

        if (chatRef.current) observer.observe(chatRef.current);
        return () => observer.disconnect();
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex h-screen w-full overflow-hidden text-gray-800 selection:bg-accent/20 bg-[#07070A]">
            
            {/* 1. DARK SIDEBAR (Fixed Nav) */}
            <div className="w-16 md:w-20 flex flex-col items-center py-6 bg-[#07070A] z-20 shrink-0">
                <div className="w-10 h-10 rounded-[14px] bg-white/10 flex items-center justify-center text-white mb-10 shadow-soft">
                    {!logoError ? (
                        <img 
                            src="/homun_white.png" 
                            alt="H" 
                            className="h-4 w-auto drop-shadow-lg" 
                            onError={() => setLogoError(true)} 
                        />
                    ) : (
                        <Terminal size={20} />
                    )}
                </div>

                <div className="flex flex-col gap-6 w-full items-center">
                    <button onClick={() => window.scrollTo({top: 0})} className="w-10 h-10 rounded-[14px] bg-white flex items-center justify-center text-black shadow-soft relative group">
                        <MessageSquare size={18} fill="currentColor" className="opacity-90" />
                        <span className="absolute left-16 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">Capabilities Chat</span>
                    </button>
                    <a href="https://docs.homun.app" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-[14px] hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors relative group">
                        <BookOpen size={20} />
                        <span className="absolute left-16 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">Documentation</span>
                    </a>
                    <a href="#security" className="w-10 h-10 rounded-[14px] hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors relative group">
                        <Shield size={20} />
                        <span className="absolute left-16 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">Vault Security</span>
                    </a>
                    <a href="#roadmap" className="w-10 h-10 rounded-[14px] hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors relative group">
                        <Map size={20} />
                        <span className="absolute left-16 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">Roadmap & Changelog</span>
                    </a>
                    <a href="https://github.com/homun-app/homun" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-[14px] hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors relative group">
                        <Github size={20} />
                        <span className="absolute left-16 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">Repository</span>
                    </a>
                </div>

                <div className="mt-auto flex flex-col gap-6 w-full items-center text-white/40">
                    <button onClick={() => setIsSettingsOpen(true)} className="hover:text-white transition-colors relative group">
                        <Settings size={20} />
                        <span className="absolute left-16 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">Appearance</span>
                    </button>
                </div>
            </div>

            {/* INNER LIGHT CONTAINER (Provides the clean curve layout). Added isolate relative transform-gpu to fix clipping bugs! */}
            <div className="flex-1 flex overflow-hidden isolate relative z-0 transform-gpu bg-white rounded-tl-[2rem] sm:rounded-tl-[2.5rem] shadow-[-10px_0_40px_rgba(0,0,0,0.3)] ring-1 ring-black/5">
                
                {/* 2. HISTORY SIDEBAR (Collapsible) */}
                <div className={`bg-[#F8F9FA] border-r border-gray-100 flex flex-col z-10 shrink-0 relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${isSidebarOpen ? 'w-[280px] opacity-100' : 'w-[0px] opacity-0 pointer-events-none'}`}>
                    <div className="w-[280px] flex flex-col h-full absolute inset-0">
                        <div className="flex items-center justify-between px-6 pt-10 pb-6 shrink-0 relative z-10">
                            <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Storico</span>
                            <div className="flex items-center gap-3 text-gray-400">
                                <Search size={16} />
                                <Plus size={18} />
                            </div>
                        </div>

                        <div className="flex flex-col px-4 gap-1 overflow-y-auto pb-4 relative z-10 flex-1">
                            <span className="text-[10px] font-bold tracking-widest text-gray-300 uppercase px-2 mb-2 mt-4">Capabilities View</span>
                            {historyItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveHistory(item);
                                        // Auto-scroll to chat section when explicitly clicked
                                        if (chatRef.current) {
                                            chatRef.current.scrollIntoView({ behavior: 'smooth' });
                                        }
                                    }}
                                    className={`flex flex-col text-left px-3 py-3 rounded-2xl transition-all ${activeHistory?.id === item.id ? 'bg-white shadow-soft text-accent ring-1 ring-gray-100' : 'hover:bg-gray-100 text-gray-500'}`}
                                >
                                    <div className="flex items-center justify-between w-full mb-1">
                                        <span className={`text-sm font-medium truncate pr-2 ${activeHistory?.id === item.id ? 'text-accent' : 'text-gray-700'}`}>{item.prompt}</span>
                                        <span className="text-[10px] opacity-40 shrink-0">{item.time}</span>
                                    </div>
                                    <div className="text-xs opacity-60 flex items-center gap-1.5">
                                        {item.icon} <span className="truncate">{item.title}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="p-6 border-t border-gray-100 text-[10px] text-gray-400 font-light relative z-10 bg-white/50 shrink-0 leading-relaxed">
                            Homun runs locally. Data stays in your personal vault.
                        </div>
                    </div>
                </div>

                {/* 3. SCROLLABLE MAIN CONTENT AREA */}
                <div id="main-scroll-container" className={`flex-1 flex flex-col relative z-0 overflow-y-auto overflow-x-hidden bg-[var(--color-background)] ${bgTheme}`}>
                    
                    {/* Top Nav (Hamburger + Model Dropdown) */}
                    <div className="sticky top-0 h-20 px-8 flex items-center justify-between shrink-0 z-40 bg-gradient-to-b from-[var(--color-background)] via-[var(--color-background)] to-transparent pointer-events-none">
                        <div className="flex items-center gap-3 pointer-events-auto">
                            <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-900 transition-colors bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-sm border border-gray-100 hover:border-gray-200 group">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                                    <path d="M4 6h16M4 12h12M4 18h8"/>
                                </svg>
                            </button>
                            
                            <div className="relative">
                                <button onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)} className="bg-white/90 backdrop-blur-md border border-gray-100 shadow-sm rounded-full px-4 py-2 text-xs font-medium text-gray-700 flex items-center gap-2 cursor-pointer hover:border-gray-300 transition-colors">
                                    {selectedModel} <ChevronDown size={14} className="text-gray-400"/>
                                </button>
                                
                                {isModelDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsModelDropdownOpen(false)} />
                                        <div className="absolute top-full left-0 mt-2 w-48 bg-white/90 backdrop-blur-3xl border border-gray-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden py-2 z-50">
                                            <div className="px-4 py-2 text-[10px] font-bold tracking-widest text-gray-400 uppercase border-b border-gray-50 mb-1">Providers</div>
                                            {models.map(m => (
                                                <button 
                                                    key={m} 
                                                    onClick={() => {setSelectedModel(m); setIsModelDropdownOpen(false);}} 
                                                    className="w-full text-left px-4 py-2 text-xs font-medium text-gray-600 hover:bg-accent/5 hover:text-accent flex items-center justify-between transition-colors"
                                                >
                                                    {m}
                                                    {selectedModel === m && <Check size={12} className="text-accent" />}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        <div className="bg-white/90 backdrop-blur-md border border-gray-100 shadow-soft rounded-full px-4 py-1.5 text-xs font-medium text-gray-600 flex items-center gap-2 pointer-events-auto">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live
                        </div>
                    </div>

                    {/* NEW SEQUENCE: WhyHomun is now the Hero */}
                    <WhyHomun />

                    {/* HERO CHAT SECTION (Replicates the App UI - Triggers Sidebar) */}
                    <div ref={chatRef} id="chat-section" className="px-6 md:px-12 lg:px-32 py-24 min-h-[85vh] flex flex-col relative z-20">
                        <div className="max-w-4xl mx-auto flex flex-col gap-12 flex-1 w-full bg-white/30 backdrop-blur-3xl p-8 md:p-16 rounded-[3rem] border border-white/40 shadow-2xl">
                            
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent mb-[-2rem]">
                                <Terminal size={14} /> Live Sandbox Execution
                            </div>

                            <div className="text-3xl md:text-5xl lg:text-6xl font-sans font-medium text-gray-900 tracking-tight leading-[1.05]">
                                {activeHistory?.prompt}
                            </div>

                            <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                    {activeHistory?.status}
                                </div>
                                <span className="text-gray-300">|</span>
                                <span className="text-gray-400 text-xs">Sandbox Executed</span>
                            </div>

                            <div className="text-gray-600 font-light leading-relaxed text-xl lg:text-2xl whitespace-pre-wrap max-w-3xl">
                                {activeHistory?.text}
                            </div>

                            <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-100 shadow-soft p-3 flex flex-col gap-2 relative mt-4">
                                <div className="absolute -left-[4.5rem] top-8 hidden md:flex w-16 border-t border-dashed border-gray-300" />
                                <div className="flex items-center justify-between px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                    <span>{activeHistory?.steps?.length} activities completed</span>
                                    <ChevronDown size={14} />
                                </div>
                                <div className="p-4 flex flex-col gap-5">
                                    {activeHistory?.steps?.map((step, i) => (
                                        <div key={i} className="flex items-center gap-4 text-gray-600">
                                            <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center shrink-0 shadow-sm">
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                            <span className={i === 0 ? "opacity-50" : ""}>{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* BOTTOM INPUT BOX */}
                            <div className="mt-12 bg-white/90 backdrop-blur-xl rounded-t-3xl rounded-b-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 p-2 flex flex-col w-full relative z-20">
                                <textarea 
                                    placeholder="Message Homun..."
                                    className="w-full bg-transparent resize-none outline-none px-6 pt-6 pb-4 text-gray-700 placeholder-gray-300 text-xl min-h-[100px]"
                                    readOnly
                                />
                                <div className="flex items-center justify-end gap-3 p-3 pt-0">
                                    <button className="w-12 h-12 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
                                        <Plus size={24} />
                                    </button>
                                    <button className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white shadow-soft hover:opacity-90 transition-opacity">
                                        <ArrowRight size={22} />
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* RESTORED LANDING PAGE IN CONTENT STREAM */}
                    <div className="bg-white/60 backdrop-blur-3xl relative z-10 border-t border-gray-200/50">
                        <Capabilities />
                        <Security />
                        <UIPreview />
                        <RoadmapAndChangelog />
                        <DownloadSection />
                        
                        {/* FOOTER */}
                        <footer className="w-full px-12 lg:px-24 py-16 border-t border-gray-200 bg-white/90 text-gray-500 flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="flex items-center gap-3">
                                <img src="/homun_white.png" alt="Homun" className="h-5 invert opacity-50" />
                                <span className="text-sm">© 2026 Nura Health Inc. / Homun.</span>
                            </div>
                            <div className="flex items-center gap-8 text-sm font-medium">
                                <a href="https://docs.homun.app" className="hover:text-accent transition-colors">Documentation</a>
                                <a href="https://github.com/homun-app/homun" target="_blank" rel="noreferrer" className="hover:text-accent transition-colors">GitHub</a>
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    <span className="text-xs">Operational</span>
                                </div>
                            </div>
                        </footer>
                    </div>

                </div>
            </div>

            <SettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)} 
                accent={accent}
                setAccent={setAccent}
                bgTheme={bgTheme}
                setBgTheme={setBgTheme}
            />
        </div>
    );
}

export default App;
