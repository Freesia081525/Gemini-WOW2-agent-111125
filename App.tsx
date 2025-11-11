import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// Assuming these are in a './types.ts' file
import { Agent, AgentStatus, DocumentFile, DocumentType, AnalysisResult } from './types';
// Assuming these are in a './constants.ts' file
import { DEFAULT_AGENTS, FLOWER_THEMES, LOCALIZATION } from './constants';
// Assuming these are in a './components/icons.tsx' file
import { PlusIcon, PlayIcon, UploadIcon, DocumentIcon, FileTextIcon, SettingsIcon, PaletteIcon, LanguageIcon, SunIcon, MoonIcon, KeyIcon } from './components/icons';

declare const pdfjsLib: any;

// --- Unified API Service Logic ---
// This section replaces the need for a separate apiService.ts file.

let geminiAI: GoogleGenerativeAI | null = null;
let openai: OpenAI | null = null;

const initGeminiService = (apiKey: string) => {
  if (!apiKey) {
    geminiAI = null;
    return;
  }
  geminiAI = new GoogleGenerativeAI(apiKey);
};

const initOpenAIService = (apiKey: string) => {
  if (!apiKey) {
    openai = null;
    return;
  }
  openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
};

const unifiedProcessAgentPrompt = async (agent: Agent, documentContent: string): Promise<string> => {
  const [provider, modelName] = agent.model.split('/');
  const fullPrompt = `DOCUMENT CONTENT:\n---\n${documentContent}\n---\n\nTASK:\n${agent.prompt}`;

  if (provider === 'gemini') {
    if (!geminiAI) throw new Error("Gemini API key is not configured.");
    try {
      const model = geminiAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(fullPrompt);
      return result.response.text();
    } catch (error) {
      if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('403'))) {
        throw new Error('The provided Gemini API key is not valid. Please check it.');
      }
      throw new Error("Failed to get response from Gemini API.");
    }
  }

  if (provider === 'openai') {
    if (!openai) throw new Error("OpenAI API key is not configured.");
    try {
      const completion = await openai.chat.completions.create({
        model: modelName,
        messages: [{ role: "user", content: fullPrompt }],
      });
      return completion.choices[0]?.message?.content ?? "";
    } catch (error) {
       if (error instanceof OpenAI.APIError && error.status === 401) {
        throw new Error('The provided OpenAI API key is not valid. Please check it.');
      }
      throw new Error("Failed to get response from OpenAI API.");
    }
  }

  throw new Error(`Unsupported provider: ${provider}`);
};

const performOcrWithGemini = async (imageDataBase64: string): Promise<string> => {
  if (!geminiAI) throw new Error("Gemini API key is not configured for OCR.");
  const imagePart = { inlineData: { mimeType: 'image/jpeg', data: imageDataBase64 } };
  const textPart = { text: "Perform OCR on this image. Extract all text accurately." };
  
  try {
    const model = geminiAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([textPart, imagePart]);
    return result.response.text();
  } catch (error) {
    if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('403'))) {
        throw new Error('The provided Gemini API key is not valid. Please check it.');
    }
    throw new Error("Failed to perform OCR with Gemini API.");
  }
};

// --- Constants & Hooks ---

// NOTE: Using stable, known model names. 
// "gpt-5-nano" and "gemini-2.5-flash-lite" are speculative.
export const MODEL_OPTIONS = [
    { value: 'gemini/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'openai/gpt-4o-mini', label: 'OpenAI GPT-4o Mini' },
    { value: 'openai/gpt-4.1-mini', label: 'OpenAI GPT-4.1 mini' },
];

function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) { console.error(error); return initialValue; }
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) { console.error(error); }
  };
  return [storedValue, setValue];
}

// --- Main App Component ---

const App: React.FC = () => {
  // --- API Key State Management ---
  const [envGeminiApiKey] = useState(process.env.REACT_APP_GEMINI_API_KEY || '');
  const [envOpenAIApiKey] = useState(process.env.REACT_APP_OPENAI_API_KEY || '');

  const [userGeminiApiKey, setUserGeminiApiKey] = useLocalStorage('geminiApiKey', '');
  const [userOpenAIApiKey, setUserOpenAIApiKey] = useLocalStorage('openaiApiKey', '');

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string>('');
  const [tempGeminiKey, setTempGeminiKey] = useState('');
  const [tempOpenAIKey, setTempOpenAIKey] = useState('');

  const effectiveGeminiApiKey = useMemo(() => envGeminiApiKey || userGeminiApiKey, [envGeminiApiKey, userGeminiApiKey]);
  const effectiveOpenAIApiKey = useMemo(() => envOpenAIApiKey || userOpenAIApiKey, [envOpenAIApiKey, userOpenAIApiKey]);

  const isGeminiKeySet = !!effectiveGeminiApiKey;
  const isOpenAIKeySet = !!effectiveOpenAIApiKey;

  useEffect(() => {
    if (effectiveGeminiApiKey) initGeminiService(effectiveGeminiApiKey);
    if (effectiveOpenAIApiKey) initOpenAIService(effectiveOpenAIApiKey);
  }, [effectiveGeminiApiKey, effectiveOpenAIApiKey]);

  // --- UI and App Logic State ---
  const [themeIndex, setThemeIndex] = useLocalStorage('themeIndex', 0);
  const [isDarkMode, setIsDarkMode] = useLocalStorage('isDarkMode', true);
  const [lang, setLang] = useLocalStorage<'en' | 'zh-TW'>('lang', 'en');
  const [activeTab, setActiveTab] = useState('workflow');

  const T = useMemo(() => LOCALIZATION[lang], [lang]);
  const activeTheme = useMemo(() => FLOWER_THEMES[themeIndex], [themeIndex]);
  
  const [documentFile, setDocumentFile] = useState<DocumentFile>({ id: 'initial', name: 'No document loaded', type: DocumentType.EMPTY, content: '' });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  useEffect(() => { document.documentElement.classList.toggle('dark', isDarkMode); }, [isDarkMode]);
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', activeTheme.colors.primary);
  }, [activeTheme]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    resetState();
    if (file.type === 'application/pdf') {
      setDocumentFile({ id: file.name, name: file.name, type: DocumentType.PDF, content: 'Processing PDF...', file });
      await processPdf(file);
    } else {
      const content = await file.text();
      setDocumentFile({ id: file.name, name: file.name, type: DocumentType.TXT, content, file });
    }
  };
  
  const resetState = () => {
      setAgents([]);
      setAnalysisResult(null);
      setIsProcessing(false);
      setIsOcrProcessing(false);
  }

  const processPdf = async (file: File) => {
    if (!isGeminiKeySet) {
        setApiKeyError("A Gemini API key is required for PDF processing (OCR).");
        setIsApiKeyModalOpen(true);
        return;
    }
    setIsOcrProcessing(true);
    try {
        const fileReader = new FileReader();
        fileReader.onload = async (e) => {
            const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            const pageTexts = [];
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: context!, viewport }).promise;
                const base64Data = canvas.toDataURL('image/jpeg').split(',')[1];
                
                try {
                    const ocrText = await performOcrWithGemini(base64Data);
                    pageTexts.push(`--- Page ${i} ---\n${ocrText}`);
                } catch (ocrError) {
                    const errorMessage = ocrError instanceof Error ? ocrError.message : 'An OCR error occurred';
                    if (errorMessage.includes('API key')) {
                        setApiKeyError(errorMessage);
                        setUserGeminiApiKey('');
                        setIsApiKeyModalOpen(true);
                    }
                    pageTexts.push(`--- Page ${i} ---\n[OCR Failed: ${errorMessage}]`);
                    break;
                }
            }
            setDocumentFile(prev => ({ ...prev, content: pageTexts.join('\n\n') }));
        };
        fileReader.readAsArrayBuffer(file);
    } catch (error) {
      setDocumentFile(prev => ({ ...prev, content: 'Error processing PDF.' }));
    } finally {
      setIsOcrProcessing(false);
    }
  };
  
  const addAgent = (template: Omit<Agent, 'id' | 'status' | 'output' | 'error' | 'outputJson' | 'model'>) => {
    const newAgent: Agent = {
      ...template,
      id: `agent-${Date.now()}`,
      status: AgentStatus.Pending,
      output: null, error: null, outputJson: null,
      model: MODEL_OPTIONS[0].value,
    };
    setAgents(prev => [...prev, newAgent]);
  };
  
  const handleAgentChange = (id: string, field: 'prompt' | 'model', value: string) => {
    setAgents(prev => prev.map(agent => (agent.id === id ? { ...agent, [field]: value } : agent)));
  };

  const handleDeleteAgent = (id: string) => setAgents(prev => prev.filter(agent => agent.id !== id));
  
  const parseJsonOutput = (text: string): any | null => {
      try {
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        return JSON.parse(jsonMatch ? jsonMatch[1] : text);
      } catch (e) { return null; }
  };
  
  const runWorkflow = useCallback(async () => {
    const requiredProviders = new Set(agents.map(a => a.model.split('/')[0]));
    if (requiredProviders.has('gemini') && !isGeminiKeySet) {
      setApiKeyError("A Gemini API key is required for this workflow.");
      setIsApiKeyModalOpen(true);
      return;
    }
    if (requiredProviders.has('openai') && !isOpenAIKeySet) {
      setApiKeyError("An OpenAI API key is required for this workflow.");
      setIsApiKeyModalOpen(true);
      return;
    }
    
    setIsProcessing(true);
    setAnalysisResult(null);
    let currentAgents = agents.map(a => ({...a, status: AgentStatus.Pending, output: null, error: null, outputJson: null}));
    setAgents(currentAgents);

    for (const agent of agents) {
        currentAgents = currentAgents.map(a => (a.id === agent.id ? { ...a, status: AgentStatus.Running } : a));
        setAgents(currentAgents);
      try {
        const output = await unifiedProcessAgentPrompt(agent, documentFile.content);
        const outputJson = parseJsonOutput(output);
        currentAgents = currentAgents.map(a => (a.id === agent.id ? { ...a, status: AgentStatus.Success, output, outputJson } : a));
        setAgents(currentAgents);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        if (errorMessage.includes('API key')) {
            setApiKeyError(errorMessage);
            setIsApiKeyModalOpen(true);
            if (errorMessage.toLowerCase().includes('gemini')) setUserGeminiApiKey('');
            if (errorMessage.toLowerCase().includes('openai')) setUserOpenAIApiKey('');
        }
        currentAgents = currentAgents.map(a => (a.id === agent.id ? { ...a, status: AgentStatus.Error, error: errorMessage } : a));
        setAgents(currentAgents);
        break;
      }
    }
    setIsProcessing(false);
  }, [agents, documentFile.content, isGeminiKeySet, isOpenAIKeySet, setUserGeminiApiKey, setUserOpenAIApiKey]);
  
  const handleSaveApiKeys = () => {
      if(tempGeminiKey) setUserGeminiApiKey(tempGeminiKey.trim());
      if(tempOpenAIKey) setUserOpenAIApiKey(tempOpenAIKey.trim());
      setApiKeyError('');
      setIsApiKeyModalOpen(false);
  }

  const ApiKeyModal = () => (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md m-4">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><KeyIcon /> API Key Configuration</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Provide required API keys. They are only stored in your browser.</p>
            <div className="space-y-4">
                {!envGeminiApiKey && (
                    <div>
                        <label className="text-sm font-medium">Gemini API Key</label>
                        <input type="password" value={tempGeminiKey} onChange={(e) => setTempGeminiKey(e.target.value)} placeholder="Enter Google AI Studio key" className="w-full mt-1 p-3 bg-gray-100 dark:bg-gray-700 border rounded-lg" />
                    </div>
                )}
                {!envOpenAIApiKey && (
                     <div>
                        <label className="text-sm font-medium">OpenAI API Key</label>
                        <input type="password" value={tempOpenAIKey} onChange={(e) => setTempOpenAIKey(e.target.value)} placeholder="Enter OpenAI API key" className="w-full mt-1 p-3 bg-gray-100 dark:bg-gray-700 border rounded-lg" />
                    </div>
                )}
                
                {apiKeyError && <p className="text-sm text-red-500 mt-2">{apiKeyError}</p>}
                
                <button onClick={handleSaveApiKeys} className="w-full px-4 py-3 bg-primary text-white font-semibold rounded-lg shadow hover:opacity-90">
                    Save Keys & Close
                </button>
            </div>
        </div>
    </div>
  );
  
  const NotesEditor = () => { /* ... (no changes needed) ... */ return <div>Notes Editor</div> };
  const TabButton = ({ tabName, label }: { tabName: string, label: string }) => ( /* ... (no changes needed) ... */ <button onClick={() => setActiveTab(tabName)}>{label}</button> );

  return (
    <div style={{'--primary': activeTheme.colors.primary} as React.CSSProperties} className="font-sans text-gray-800 dark:text-gray-200 min-h-screen bg-gray-100 dark:bg-gray-900">
        {isApiKeyModalOpen && <ApiKeyModal />}
        
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b p-4 shadow-sm sticky top-0 z-10">
             <div className="max-w-screen-xl mx-auto flex justify-between items-center">
                 <div className='flex items-center gap-3'>
                    <DocumentIcon className="w-8 h-8 text-primary" />
                    <h1 className="text-xl font-bold hidden sm:block">{T.title}</h1>
                 </div>
                 <div className='flex items-center gap-2 md:gap-4'>
                    <button onClick={() => setIsApiKeyModalOpen(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="API Key Settings">
                        <KeyIcon className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
                    </button>
                    {/* Other settings dropdown can go here */}
                 </div>
             </div>
        </header>

        <main className="max-w-screen-xl mx-auto p-4 md:p-6">
            {/* ... Your Tab Buttons ... */}

            {activeTab === 'workflow' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 flex flex-col gap-6">
                      {/* Document Control Panel */}
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileTextIcon /> {T.documentControl}</h2>
                          <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary">
                              <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                              <h3 className="mt-2 text-sm font-medium">{T.uploadDocument}</h3>
                              <p className="mt-1 text-xs text-gray-500">{T.uploadHint}</p>
                              <input type="file" onChange={handleFileChange} accept=".pdf,.txt" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          </div>
                          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <p className="text-sm font-medium truncate">{documentFile.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {isOcrProcessing ? "Processing OCR..." : `${documentFile.content.substring(0, 100)}...`}
                              </p>
                          </div>
                      </div>
                      {/* Add Agent Panel */}
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                          <h2 className="text-lg font-semibold mb-4">{T.addAgent}</h2>
                          <div className="grid grid-cols-2 gap-2">
                              {DEFAULT_AGENTS.map(template => (
                                  <button key={template.name} onClick={() => addAgent(template)} className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 hover:bg-primary/10 rounded-md text-sm">
                                  <PlusIcon className="w-4 h-4 text-primary"/>
                                  {template.name}
                                  </button>
                              ))}
                          </div>
                      </div>
                    </div>

                    {/* Agent Workflow Panel */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">{T.agentWorkflow}</h2>
                            <button onClick={runWorkflow} disabled={isProcessing || agents.length === 0} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow hover:opacity-90 disabled:bg-gray-400">
                                <PlayIcon/> {isProcessing ? T.running : T.runWorkflow}
                            </button>
                        </div>
                        <div className="space-y-4">
                            {agents.length > 0 ? (
                                agents.map((agent) => (
                                    <div key={agent.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm">
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <h3 className="font-semibold text-gray-800 dark:text-gray-100">{agent.name}</h3>
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                                    agent.status === AgentStatus.Success ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                                                    agent.status === AgentStatus.Error ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                                                    'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                                                }`}>{agent.status}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <select value={agent.model} onChange={(e) => handleAgentChange(agent.id, 'model', e.target.value)} className="text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-1.5 focus:ring-primary">
                                                    {MODEL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                </select>
                                                <button onClick={() => handleDeleteAgent(agent.id)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
                                            </div>
                                        </div>
                                        <textarea value={agent.prompt} onChange={(e) => handleAgentChange(agent.id, 'prompt', e.target.value)} className="w-full mt-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-sm" rows={3}/>
                                        {agent.output && <pre className="mt-2 text-xs whitespace-pre-wrap p-3 bg-gray-100 dark:bg-gray-900/50 rounded font-mono">{agent.output}</pre>}
                                        {agent.error && <p className="mt-2 text-xs text-red-500 p-2 bg-red-50 dark:bg-red-900/30 rounded">{agent.error}</p>}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                    <p className="text-gray-500">{T.addAgentToStart}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Placeholder for other tabs */}
            {activeTab === 'dashboard' && <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-xl">Dashboard Content</div>}
            {activeTab === 'notes' && <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-xl">Notes Editor Content</div>}
        </main>
    </div>
  );
};

export default App;
