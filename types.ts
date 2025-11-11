
export enum AgentStatus {
  Pending = 'pending',
  Running = 'running',
  Success = 'success',
  Error = 'error',
}

export interface Agent {
  id: string;
  name: string;
  prompt: string;
  status: AgentStatus;
  output: string | null;
  error: string | null;
  outputJson: any | null;
}

export enum DocumentType {
  PDF = 'pdf',
  TXT = 'txt',
  EMPTY = 'empty'
}

export interface DocumentFile {
  id: string;
  name: string;
  type: DocumentType;
  content: string;
  file?: File;
}

export interface AnalysisResult {
  sentiment: { positive: number; negative: number; neutral: number; } | null;
  entities: { name: string; type: string; }[] | null;
}
