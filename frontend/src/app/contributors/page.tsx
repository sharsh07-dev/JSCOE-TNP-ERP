'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, Linkedin, Github, Globe } from 'lucide-react';
interface Mentor {
    name: string;
    role: string;
    title: string;
    quote: string;
    img: string | null;
    linkedin?: string;
    email?: string;
}

interface Member {
    name: string;
    role: string;
    bio: string;
    img: string | null;
    linkedin?: string;
    email?: string;
    github?: string;
    website?: string;
}

interface ModuleData {
    label: string;
    members: Member[];
}

interface ContributorsData {
    mentors: Mentor[];
    modules: ModuleData[];
}

const CONTRIBUTORS: ContributorsData = {
    mentors: [],
    modules: [
        {
            label: 'CORE ENGINEERING TEAM',
            members: [
                {
                    name: 'Harsh Shinde',
                    role: 'FULL STACK DEVELOPER',
                    bio: 'Developed the TNP ERP system end-to-end — frontend, backend, database design and deployment.',
                    img: '/harsh.png',
                    email: 'mailto:shindeharsh.dev@gmail.com',
                    linkedin: 'https://www.linkedin.com/in/harsh-shinde-60046436b/',
                    github: 'https://github.com/sharsh07-dev',
                },
                {
                    name: 'Sham Patil',
                    role: 'FULL STACK DEVELOPER',
                    bio: 'Developed and maintained the robust ERP system architecture, ensuring high performance across the stack.',
                    img: '/sham.png',
                    email: 'mailto:shampatil7275@gmail.com',
                    linkedin: 'https://www.linkedin.com/in/sham-patil-450639333/',
                    website: 'https://shampatil23.github.io/Sham-Patil/',
                },
            ],
        },
    ],
};
export default function ContributorsPage() {
    const visibleModules = CONTRIBUTORS.modules;

    return (
        <div className="min-h-screen bg-white font-sans">

            {/* ── Header ── */}
            <header className="w-full bg-white shadow-sm border-b border-slate-100">
                <img src="/header.png" className="w-full h-auto max-h-[90px] object-fill" alt="JSCOE Header" />
            </header>

            {/* ── Back Nav ── */}
            <div className="max-w-[1100px] mx-auto px-6 pt-8">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-colors mb-8"
                >
                    <ArrowLeft size={16} /> Back to Login
                </Link>

                {/* ── Header text ── */}
                <div className="mb-10">
                    <p className="text-[12px] font-bold text-blue-600 uppercase tracking-widest mb-1">Development Team</p>
                    <h1 className="text-4xl font-black text-slate-900">
                        Our <span className="text-blue-600">Contributors</span>
                    </h1>
                    <p className="text-[15px] text-slate-500 mt-3 max-w-xl">
                        The talented team behind the JSPM JSCOE ERP ecosystem. Collaborative efforts of students and faculty.
                    </p>
                </div>

                {/* ── Mentor cards ── */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {CONTRIBUTORS.mentors.map((m) => (
                        <div key={m.name} className="flex gap-5 p-6 border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            {/* Avatar */}
                            <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {m.img
                                    ? <img src={m.img} alt={m.name} className="w-full h-full object-cover" />
                                    : <span className="text-2xl font-black text-slate-400">{m.name[0]}</span>
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <h3 className="text-[16px] font-bold text-slate-900">{m.name}</h3>
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wide rounded">
                                        {m.role}
                                    </span>
                                </div>
                                <p className="text-[13px] font-semibold text-blue-600 mb-2">{m.title}</p>
                                <p className="text-[13px] text-slate-500 leading-relaxed italic">{m.quote}</p>
                                <div className="flex items-center gap-3 mt-3">
                                    {m.linkedin && (
                                        <a href={m.linkedin} className="text-slate-400 hover:text-blue-600 transition-colors">
                                            <Linkedin size={16} />
                                        </a>
                                    )}
                                    {m.email && (
                                        <a href={m.email} className="text-slate-400 hover:text-blue-600 transition-colors">
                                            <Mail size={16} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>



                {/* ── Module sections ── */}
                {visibleModules.map(mod => (
                    <div key={mod.label} className="mb-12">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4 border-b border-slate-100 pb-3">
                            {mod.label}
                        </p>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {mod.members.map(member => (
                                <div key={member.name} className="p-6 border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                                    {/* Avatar */}
                                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden mb-4 flex items-center justify-center">
                                        {member.img
                                            ? <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                                            : <span className="text-xl font-black text-slate-400">{member.name[0]}</span>
                                        }
                                    </div>
                                    <h3 className="text-[15px] font-bold text-slate-900">{member.name}</h3>
                                    <p className="text-[11px] font-black text-blue-600 uppercase tracking-wide mt-0.5 mb-2">
                                        {member.role}
                                    </p>
                                    <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
                                        {member.bio}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        {member.github && (
                                            <a href={member.github} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
                                                <Github size={16} />
                                            </a>
                                        )}
                                        {member.linkedin && (
                                            <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors">
                                                <Linkedin size={16} />
                                            </a>
                                        )}
                                        {member.website && (
                                            <a href={member.website} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-600 transition-colors">
                                                <Globe size={16} />
                                            </a>
                                        )}
                                        {member.email && (
                                            <a href={member.email} className="text-slate-400 hover:text-red-500 transition-colors">
                                                <Mail size={16} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="pb-16" />
            </div>
        </div>
    );
}
