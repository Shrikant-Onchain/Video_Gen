import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Play, 
  Download, 
  Zap, 
  Terminal as TerminalIcon, 
  Video, 
  Image as ImageIcon,
  Loader2,
  Maximize2
} from 'lucide-react';
import { AppStatus } from '../types';
import { cn } from '../lib/utils';

interface ProductionMonitorProps {
  status: AppStatus;
  generatedImage: string | null;
  generatedVideo: string | null;
  onGenerateFrame: () => void;
  onEditFrame: (prompt: string) => void;
  onDownloadImage: () => void;
  onRenderVideo: () => void;
  onDownloadVideo: () => void;
}

const ProductionMonitor: React.FC<ProductionMonitorProps> = ({
  status,
  generatedImage,
  generatedVideo,
  onGenerateFrame,
  onEditFrame,
  onDownloadImage,
  onRenderVideo,
  onDownloadVideo,
}) => {
  const [editPrompt, setEditPrompt] = useState('');

  const isGeneratingFrame = status === AppStatus.GENERATING_FRAME;
  const isEditingFrame = status === AppStatus.EDITING_FRAME;
  const isRenderingVideo = status === AppStatus.RENDERING_VIDEO;
  const isFrameReady = status === AppStatus.FRAME_READY || status === AppStatus.COMPLETE;

  return (
    <div className="space-y-6">
      {/* Preview Viewport */}
      <div className="w-full aspect-video bg-black border border-border flex items-center justify-center relative group overflow-hidden">
        {generatedVideo ? (
          <video 
            src={generatedVideo} 
            controls 
            autoPlay 
            loop 
            className="w-full h-full object-contain"
          />
        ) : generatedImage ? (
          <img 
            src={generatedImage} 
            alt="Generated Frame" 
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center text-text-dim">
            <Video size={48} className="mb-4 opacity-20" />
            <div className="font-mono text-[10px] uppercase tracking-widest">Monitor Offline</div>
          </div>
        )}

        {(isGeneratingFrame || isEditingFrame || isRenderingVideo) && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
            <div className="font-mono text-[10px] text-accent uppercase tracking-[0.3em] animate-pulse">
              {isGeneratingFrame ? 'Synthesizing Base Frame...' : 
               isEditingFrame ? 'Refining Neural Weights...' : 
               'Rendering Temporal Sequence...'}
            </div>
          </div>
        )}

        {generatedImage && !generatedVideo && (
          <div className="absolute bottom-0 left-0 h-0.5 bg-accent w-[65%] shadow-[0_0_10px_rgba(255,92,0,0.5)]" />
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3">
        {!generatedImage ? (
          <button 
            onClick={onGenerateFrame}
            disabled={status !== AppStatus.ANALYZED || isGeneratingFrame}
            className="btn col-span-2 flex items-center justify-center gap-2"
          >
            {isGeneratingFrame ? <Loader2 className="animate-spin" size={16} /> : <ImageIcon size={16} />}
            Generate Base Frame
          </button>
        ) : (
          <>
            <button 
              onClick={onDownloadImage}
              className="btn btn-outline flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Save Frame
            </button>
            <button 
              onClick={onRenderVideo}
              disabled={isRenderingVideo || !!generatedVideo}
              className="btn flex items-center justify-center gap-2"
            >
              {isRenderingVideo ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
              Render Video
            </button>
          </>
        )}
      </div>

      {/* Refinement Terminal */}
      {generatedImage && !generatedVideo && (
        <div className="analysis-card border-dashed">
          <div className="text-[10px] text-accent uppercase mb-2 font-bold flex items-center gap-2">
            <TerminalIcon size={12} />
            Iterative Refinement
          </div>
          <div className="flex gap-2">
            <input 
              type="text"
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onEditFrame(editPrompt)}
              placeholder="Enter refinement prompt..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-[11px] font-mono text-text-main p-0"
            />
            <button 
              onClick={() => onEditFrame(editPrompt)}
              disabled={!editPrompt || isEditingFrame}
              className="text-accent hover:text-white transition-colors"
            >
              <Zap size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Download Video */}
      {generatedVideo && (
        <button 
          onClick={onDownloadVideo}
          className="btn w-full bg-green-600 hover:bg-green-500 flex items-center justify-center gap-2"
        >
          <Download size={16} />
          Download Final Production
        </button>
      )}

      {/* Meta Data */}
      <div className="mt-6">
        <div className="section-label">Meta Data</div>
        <div className="font-mono text-[11px] text-text-dim space-y-2">
          <div className="flex justify-between">
            <span>RESOLUTION:</span>
            <span className="text-text-main">1920x1080</span>
          </div>
          <div className="flex justify-between">
            <span>FPS:</span>
            <span className="text-text-main">24.00</span>
          </div>
          <div className="flex justify-between">
            <span>MODEL:</span>
            <span className="text-text-main">GEMINI-2.0-FLASH</span>
          </div>
          <div className="flex justify-between">
            <span>STATUS:</span>
            <span className={cn(
              "text-text-main",
              status === AppStatus.COMPLETE && "text-green-500"
            )}>{status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionMonitor;
