import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Agent, AgentStatus, DocumentFile, DocumentType, AnalysisResult } from './types';
import { DEFAULT_AGENTS, FLOWER_THEMES, LOCALIZATION } from './constants';
import AgentStep from './components/AgentStep';
import { PlusIcon, PlayIcon, UploadIcon, DocumentIcon, FileTextIcon, SettingsIcon, PaletteIcon, LanguageIcon, SunIcon, MoonIcon } from './components/icons';

declare const pdfjsLib: any;

// --- Gemini Service Logic ---
let ai: GoogleGenerativeAI | null = null;

/**
 * Initializes the Gemini Service with an API key.
 * @param apiKey The Google AI Studio API key.
 */
const initGeminiService = (apiKey: string) => {
  if (!apiKey) {
    console.error("Attempted to initialize Gemini Service with an empty API key.");
    ai = null;
    return;
  }
  ai = new GoogleGenerativeAI(apiKey);
};

const processAgentPrompt = async (prompt: string, documentContent: string): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini API key is not configured. Please set it first.");
  }
  
  const fullPrompt = `DOCUMENT CONTENT:\n---\n${documentContent}\n---\n\nTASK:\n${prompt}`;

  try {
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error processing agent prompt:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
        throw new Error('The provided API key is not valid. Please check it and try again.');
    }
    throw new Error("Failed to get response from Gemini API.");
  }
};

const performOcr = async (imageDataBase64: string): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini API key is not configured. Please set it first.");
  }

  const imagePart = { inlineData: { mimeType: 'image/jpeg', data: imageDataBase64 } };
  const textPart = { text: "Perform OCR on this image. Extract all text accurately, preserving the original line breaks and structure as much as possible. Do not describe the image, only return the transcribed text." };
  
  try {
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([textPart, imagePart]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error performing OCR:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
        throw new Error('The provided API key is not valid. Please check it and try again.');
    }
    throw new Error("Failed to perform OCR with Gemini API.");
  }
};
// --- End of Gemini Service Logic ---


// A custom hook to persist state in localStorage
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

const App: React.FC = () => {
  // API Key State
  const [envApiKey] = useState(process.env.REACT_APP_GEMINI_API_KEY || '');
  const [userApiKey, setUserApiKey] = useLocalStorage('geminiApiKey', '');
  const [apiKeyError, setApiKeyError] = useState<string>('');
  const [tempApiKey, setTempApiKey] = useState<string>('');
  
  const effectiveApiKey = useMemo(() => envApiKey || userApiKey, [envApiKey, userApiKey]);
  const isApiKeySet = useMemo(() => !!effectiveApiKey, [effectiveApiKey]);

  // Initialize service when key becomes available
  useEffect(() => {
    if (effectiveApiKey) {
      initGeminiService(effectiveApiKey);
      if (apiKeyError) setApiKeyError(''); // Clear previous errors on new key
    }
  }, [effectiveApiKey, apiKeyError]);

  // UI State
  const [themeIndex, setThemeIndex] = useLocalStorage('themeIndex', 0);
  const [isDarkMode, setIsDarkMode] = useLocalStorage('isDarkMode', true);
  const [lang, setLang] = useLocalStorage<'en' | 'zh-TW'>('lang', 'en');
  const [activeTab, setActiveTab] = useState('workflow');

  const T = useMemo(() => LOCALIZATION[lang], [lang]);
  const activeTheme = useMemo(() => FLOWER_THEMES[themeIndex], [themeIndex]);

  // App Logic State
  const [documentFile, setDocumentFile] = useState<DocumentFile>({ id: 'initial', name: 'No document loaded', type: DocumentType.EMPTY, content: '' });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // Apply theme and dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const root = document.documentElement;
    const colors = activeTheme.colors;
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-bg-light', colors.bg);
    root.style.setProperty('--color-text-light', colors.text);
  }, [activeTheme]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    resetState();
    if (file.type === 'application/pdf') {
      setDocumentFile({ id: file.name, name: file.name, type: DocumentType.PDF, content: 'Processing PDF...', file });
      await processPdf(file);
    } else if (file.type === 'text/plain') {
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
    if (!isApiKeySet) {
        setApiKeyError("Please set your API key before processing a PDF.");
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
          const canvas = window.document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context!, viewport }).promise;
          const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          const base64Data = imageDataUrl.split(',')[1];
          try {
            const ocrText = await performOcr(base64Data);
            pageTexts.push(`--- Page ${i} ---\n${ocrText}`);
          } catch (ocrError) {
             const errorMessage = ocrError instanceof Error ? ocrError.message : 'An OCR error occurred';
             if (errorMessage.includes('API key')) {
                setApiKeyError(errorMessage);
                setUserApiKey(''); // Clear the invalid key
             }
             pageTexts.push(`--- Page ${i} ---\n[OCR Failed: ${errorMessage}]`);
             break; // Stop processing further pages
          }
        }
        setDocumentFile(prev => ({ ...prev, content: pageTexts.join('\n\n') }));
      };
      fileReader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Failed to process PDF", error);
      const errorMessage = error instanceof Error ? error.message : 'Error processing PDF.';
      setDocumentFile(prev => ({ ...prev, content: errorMessage }));
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const addAgent = (template: Omit<Agent, 'id' | 'status' | 'output' | 'error' | 'outputJson'>) => {
    const newAgent: Agent = { ...template, id: `agent-${Date.now()}`, status: AgentStatus.Pending, output: null, error: null, outputJson: null };
    setAgents(prev => [...prev, newAgent]);
  };

  const handlePromptChange = (id: string, prompt: string) => {
    setAgents(prev => prev.map(agent => (agent.id === id ? { ...agent, prompt } : agent)));
  };

  const handleDeleteAgent = (id: string) => {
    setAgents(prev => prev.filter(agent => agent.id !== id));
  };
  
  const parseJsonOutput = (text: string): any | null => {
      try {
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})|(\[[\s\S]*\])/);
        if (jsonMatch) {
            const jsonString = jsonMatch[1] || jsonMatch[2] || jsonMatch[3];
            return JSON.parse(jsonString);
        }
        return JSON.parse(text);
      } catch (e) { return null; }
  };
  
  const analyzeResults = (currentAgents: Agent[]) => {
      const sentimentAgent = currentAgents.find(a => a.name === 'Sentiment Analyzer' && a.status === AgentStatus.Success);
      const entityAgent = currentAgents.find(a => a.name === 'Entity Extractor' && a.status === AgentStatus.Success);
      let newAnalysis: AnalysisResult = { sentiment: null, entities: null };

      if(sentimentAgent?.outputJson?.sentiment) {
          const s = sentimentAgent.outputJson.sentiment.toLowerCase();
          if (s === 'positive') newAnalysis.sentiment = { positive: 1, negative: 0, neutral: 0 };
          else if (s === 'negative') newAnalysis.sentiment = { positive: 0, negative: 1, neutral: 0 };
          else newAnalysis.sentiment = { positive: 0, negative: 0, neutral: 1 };
      }
      if(entityAgent?.outputJson && Array.isArray(entityAgent.outputJson)) {
        newAnalysis.entities = entityAgent.outputJson.filter(e => e.name && e.type);
      }
      if(newAnalysis.sentiment || (newAnalysis.entities && newAnalysis.entities.length > 0)) {
          setAnalysisResult(newAnalysis);
          setActiveTab('dashboard');
      }
  };

  const runWorkflow = useCallback(async () => {
    if (!isApiKeySet) {
        setApiKeyError("Please set your API key before running the workflow.");
        return;
    }
    if (!documentFile.content || documentFile.type === DocumentType.EMPTY) {
      alert("Please load a document first.");
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
        const output = await processAgentPrompt(agent.prompt, documentFile.content);
        const outputJson = parseJsonOutput(output);
        currentAgents = currentAgents.map(a => (a.id === agent.id ? { ...a, status: AgentStatus.Success, output, outputJson } : a));
        setAgents(currentAgents);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        if (errorMessage.includes('API key')) {
            setApiKeyError(errorMessage);
            setUserApiKey(''); // Clear the invalid key
        }
        currentAgents = currentAgents.map(a => (a.id === agent.id ? { ...a, status: AgentStatus.Error, error: errorMessage } : a));
        setAgents(currentAgents);
        break;
      }
    }
    analyzeResults(currentAgents);
    setIsProcessing(false);
  }, [agents, documentFile.content, documentFile.type, setUserApiKey, isApiKeySet]);
  
  const ApiKeyModal = () => (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md m-4">
            <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">Setup API Key</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your Gemini API key is not configured. Please enter it below to continue.
            </p>
            <div className="space-y-4">
                <input 
                    type="password" 
                    value={tempApiKey}
                    onChange={(e) => {
                        setTempApiKey(e.target.value);
                        if (apiKeyError) setApiKeyError(''); // Clear error on new input
                    }}
                    placeholder="Enter your Gemini API key"
                    className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary transition"
                />
                {apiKeyError && <p className="text-sm text-red-500">{apiKeyError}</p>}
                <button 
                    onClick={() => { if (tempApiKey.trim()) setUserApiKey(tempApiKey.trim()); }}
                    className="w-full px-4 py-3 bg-primary text-white font-semibold rounded-lg shadow hover:opacity-90 transition-opacity disabled:bg-gray-400"
                    disabled={!tempApiKey.trim()}
                >
                    Save and Continue
                </button>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
                Your API key is stored only in your browser's local storage.
            </p>
        </div>
    </div>
  );

  const NotesEditor = () => {
    const [notes, setNotes] = useLocalStorage('reviewNotes', `# ${T.yourNotes}\n\n`);
    const [textToColor, setTextToColor] = useState('');
    const [color, setColor] = useState('#E91E63');

    const applyColor = () => {
        if (!textToColor.trim()) return;
        const coloredText = `<span style="color: ${color}; font-weight: 600;">${textToColor}</span>`;
        setNotes(notes.replace(textToColor, coloredText));
        setTextToColor('');
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">{T.yourNotes}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full h-80 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary transition" />
                    <div>
                        <h4 className="font-semibold mb-2">{T.notesPreview}</h4>
                        <div className="prose prose-sm dark:prose-invert max-w-none h-80 p-3 overflow-y-auto bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md" dangerouslySetInnerHTML={{ __html: notes.replace(/\n/g, '<br/>') }} />
                    </div>
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-2">{T.textToColor}</h3>
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <input type="text" value={textToColor} onChange={e => setTextToColor(e.target.value)} placeholder={T.textToColorPlaceholder} className="flex-grow p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md focus:ring-2 focus:ring-primary transition" />
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-10 p-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md cursor-pointer" />
                    <button onClick={applyColor} className="px-4 py-2 bg-primary text-white rounded-lg shadow hover:opacity-90 transition-opacity">{T.applyColor}</button>
                </div>
            </div>
        </div>
    );
  };
  
  const TabButton = ({ tabName, label }: { tabName: string, label: string }) => (
    <button onClick={() => setActiveTab(tabName)} className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${activeTab === tabName ? 'bg-primary text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-primary/10'}`}>
        {label}
    </button>
  );

  return (
    <div style={{'--primary': activeTheme.colors.primary} as React.CSSProperties} className="font-sans text-gray-800 dark:text-gray-200 min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
        {!isApiKeySet && <ApiKeyModal />}
        
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm sticky top-0 z-10">
            <div className="max-w-screen-xl mx-auto flex justify-between items-center">
                <div className='flex items-center gap-3'>
                    <DocumentIcon className="w-8 h-8 text-primary" />
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 hidden sm:block" style={{fontFamily: "'Poppins', sans-serif"}}>{T.title}</h1>
                </div>
                <div className='flex items-center gap-2 md:gap-4'>
                    <div className="relative group">
                        <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
                        </button>
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 border border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 transform scale-95 group-hover:scale-100">
                           <h3 className="font-semibold mb-3 text-sm">{T.settings}</h3>
                           <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm">
                                    <PaletteIcon className="w-5 h-5 text-primary"/>
                                    <span className="flex-grow">{T.style}</span>
                                    <select value={themeIndex} onChange={e => setThemeIndex(Number(e.target.value))} className="text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-1">
                                        {FLOWER_THEMES.map((theme, i) => <option key={i} value={i}>{theme.name}</option>)}
                                    </select>
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <LanguageIcon className="w-5 h-5 text-primary"/>
                                    <span className="flex-grow">{T.language}</span>
                                    <select value={lang} onChange={e => setLang(e.target.value as 'en' | 'zh-TW')} className="text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-1">
                                        <option value="en">English</option>
                                        <option value="zh-TW">繁體中文</option>
                                    </select>
                                </label>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2"><SunIcon className="w-5 h-5 text-primary"/>{T.mode}</span>
                                    <div className="flex items-center p-0.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                                        <button onClick={() => setIsDarkMode(false)} className={`p-1 rounded-full ${!isDarkMode ? 'bg-white shadow' : ''}`}><SunIcon className={`w-4 h-4 ${!isDarkMode ? 'text-yellow-500' : 'text-gray-400'}`}/></button>
                                        <button onClick={() => setIsDarkMode(true)} className={`p-1 rounded-full ${isDarkMode ? 'bg-gray-800 shadow' : ''}`}><MoonIcon className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-gray-400'}`}/></button>
                                    </div>
                                </div>
                           </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        {/* Main Content */}
        <main className="max-w-screen-xl mx-auto p-4 md:p-6">
            <div className="flex justify-center mb-6 bg-white/50 dark:bg-gray-800/50 p-1.5 rounded-lg shadow-sm w-fit mx-auto">
                <TabButton tabName="workflow" label={T.workflow} />
                <TabButton tabName="dashboard" label={T.dashboard} />
                <TabButton tabName="notes" label={T.notes} />
            </div>

            {activeTab === 'workflow' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileTextIcon /> {T.documentControl}</h2>
                            <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary transition-colors">
                                <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{T.uploadDocument}</h3>
                                <p className="mt-1 text-xs text-gray-500">{T.uploadHint}</p>
                                <input type="file" onChange={handleFileChange} accept=".pdf,.txt" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            </div>
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{documentFile.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {isOcrProcessing ? "Processing OCR..." : `${documentFile.content.substring(0, 100)}...`}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                            <h2 className="text-lg font-semibold mb-4">{T.addAgent}</h2>
                            <div className="grid grid-cols-2 gap-2">
                                {DEFAULT_AGENTS.map(template => (
                                    <button key={template.name} onClick={() => addAgent(template)} className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 hover:bg-primary/10 rounded-md text-sm transition-colors text-left">
                                    <PlusIcon className="w-4 h-4 text-primary flex-shrink-0"/>
                                    {template.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">{T.agentWorkflow}</h2>
                            <button onClick={runWorkflow} disabled={isProcessing || agents.length === 0 || documentFile.type === DocumentType.EMPTY} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                                <PlayIcon/>
                                {isProcessing ? T.running : T.runWorkflow}
                            </button>
                        </div>
                        <div className="space-y-4">
                            {agents.length > 0 ? (
                                agents.map((agent, index) => <AgentStep key={agent.id} agent={agent} index={index} onPromptChange={handlePromptChange} onDelete={handleDeleteAgent}/>)
                            ) : (
                                <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                    <p className="text-gray-500">{T.addAgentToStart}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'dashboard' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h2 className="text-lg font-semibold mb-4">{T.resultsDashboard}</h2>
                    {analysisResult ? (
                        <div className="grid md:grid-cols-2 gap-6">
                            {analysisResult.entities && analysisResult.entities.length > 0 && (
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <h3 className="font-semibold mb-2">{T.extractedEntities}</h3>
                                    <div className="h-80 overflow-y-auto">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={Object.entries(analysisResult.entities.reduce((acc, curr) => { acc[curr.type] = (acc[curr.type] || 0) + 1; return acc; }, {} as Record<string, number>)).map(([name, value]) => ({ name, count: value }))} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                                                <XAxis type="number" hide />
                                                <YAxis type="category" dataKey="name" width={80} tick={{fontSize: 12, fill: isDarkMode ? '#A0AEC0' : '#4A5568'}}/>
                                                <Tooltip cursor={{fill: 'rgba(128, 128, 128, 0.1)'}}/>
                                                <Bar dataKey="count" fill="var(--primary)" barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                            {analysisResult.sentiment && (
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg flex flex-col items-center">
                                    <h3 className="font-semibold mb-2">{T.sentimentAnalysis}</h3>
                                    <div className="w-full h-80">
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie data={[{ name: 'Positive', value: analysisResult.sentiment.positive }, { name: 'Negative', value: analysisResult.sentiment.negative }, { name: 'Neutral', value: analysisResult.sentiment.neutral }]} cx="50%" cy="50%" outerRadius={100} dataKey="value" labelLine={false} label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                                    <Cell key="positive" fill="#22c55e" />
                                                    <Cell key="negative" fill="#ef4444" />
                                                    <Cell key="neutral" fill="#6b7280" />
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                            <p className="text-gray-500">Run a workflow with 'Sentiment' or 'Entity' agents to see results here.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'notes' && <NotesEditor />}

        </main>
    </div>
  );
};

export default App;
