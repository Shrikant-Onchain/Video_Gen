export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  ANALYZED = 'ANALYZED',
  GENERATING_FRAME = 'GENERATING_FRAME',
  FRAME_READY = 'FRAME_READY',
  EDITING_FRAME = 'EDITING_FRAME',
  RENDERING_VIDEO = 'RENDERING_VIDEO',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

export interface UploadedFile {
  name: string;
  type: string;
  size: number;
  data: string; // Base64
}

export interface AnalysisResult {
  characterDescription: string;
  style: string;
  scene: string;
  action: string;
  text: string;
}
