import React from 'react';

export const LoadingSpinner = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={`${className} animate-spin`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export const CheckCircleIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);

export const XCircleIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);

export const PendingIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const PlusIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
  </svg>
);

export const TrashIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export const FileTextIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

export const UploadIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

export const PlayIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const DocumentIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

// "Wow" Status Indicators
export const PendingWowIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <style>{`.pulse-dot{animation:pulse-animation 1.5s infinite}@keyframes pulse-animation{0%{r:4;opacity:1}100%{r:10;opacity:0}}`}</style>
        <circle cx="12" cy="12" r="4" fill="currentColor" />
        <circle className="pulse-dot" cx="12" cy="12" r="4" fill="currentColor" />
    </svg>
);

export const RunningIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <style>{`
            .spinner_z9k8 { transform-origin: center; animation: spinner_StKS 1.5s infinite linear; }
            .spinner_YpZS { stroke-dasharray: 120; stroke-dashoffset: 120; transform-origin: center; animation: spinner_jSqc 1.5s infinite linear; }
            @keyframes spinner_StKS { 100% { transform: rotate(360deg); } }
            @keyframes spinner_jSqc { 0% { stroke-dashoffset: 120; } 50% { stroke-dashoffset: 0; transform: rotate(180deg); } 100% { stroke-dashoffset: -120; transform: rotate(360deg); } }
        `}</style>
        <g className="spinner_z9k8">
            <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-20"></circle>
            <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="3" className="spinner_YpZS"></circle>
        </g>
    </svg>
);

export const SuccessIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <style>{`
            .check-circle { stroke-dasharray: 63; stroke-dashoffset: 63; animation: draw-circle .8s ease-out forwards; }
            .check-mark { stroke-dasharray: 18; stroke-dashoffset: 18; animation: draw-check .5s .3s ease-out forwards; }
            .sparkle { opacity: 0; animation: sparkle .7s .8s ease-in-out forwards; }
            @keyframes draw-circle { to { stroke-dashoffset: 0; } }
            @keyframes draw-check { to { stroke-dashoffset: 0; } }
            @keyframes sparkle { 0% { transform: scale(0.8); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(1.4); opacity: 0; } }
        `}</style>
        <g fill="none" stroke="currentColor" strokeWidth="2">
            <circle className="check-circle" cx="12" cy="12" r="10" />
            <path className="check-mark" d="M8 12l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
            <path className="sparkle" transform="translate(3, 5)" d="M2 0 L2.5 1.5 L4 2 L2.5 2.5 L2 4 L1.5 2.5 L0 2 L1.5 1.5 Z" fill="currentColor"/>
            <path className="sparkle" transform="translate(17, 8)" d="M1.5 0 L2 1 L3 1.5 L2 2 L1.5 3 L1 2 L0 1.5 L1 1 Z" fill="currentColor" style={{animationDelay: '1s'}}/>
            <path className="sparkle" transform="translate(5, 16)" d="M1.5 0 L2 1 L3 1.5 L2 2 L1.5 3 L1 2 L0 1.5 L1 1 Z" fill="currentColor" style={{animationDelay: '1.2s'}}/>
        </g>
    </svg>
);

export const ErrorIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <style>{`
            .error-circle-group { animation: error-shake 0.4s .4s ease-in-out; }
            .cross-1, .cross-2 { stroke-dasharray: 12; stroke-dashoffset: 12; animation: draw-cross 0.3s forwards; }
            .cross-2 { animation-delay: 0.15s; }
            @keyframes draw-cross { to { stroke-dashoffset: 0; } }
            @keyframes error-shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-2px); } 40%, 80% { transform: translateX(2px); } }
        `}</style>
        <g className="error-circle-group" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path className="cross-1" d="M9 9 L15 15" strokeLinecap="round"/>
            <path className="cross-2" d="M15 9 L9 15" strokeLinecap="round"/>
        </g>
    </svg>
);

export const SettingsIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);

export const LanguageIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m4 13-4-4-4 4M19 17v-2a4 4 0 00-4-4H9.5" /></svg>
);

export const PaletteIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
);

export const SunIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
);

export const MoonIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
);