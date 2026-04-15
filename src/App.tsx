/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertCircle, Film, Upload, User, Zap, Loader2 } from 'lucide-react';
import Header from './components/Header';
import DropZone from './components/DropZone';
import Terminal from './components/Terminal';
import ProductionMonitor from './components/ProductionMonitor';
import { analyzeAssets, generateBaseFrame, generateVideo, optimizePrompt, editFrame } from './services/geminiService';
import { AnalysisResult, AppStatus, UploadedFile } from './types';

const App: React.FC = () => {
  const [referenceFile, setReferenceFile] = useState<UploadedFile | null>(null);
  const [characterFile, setCharacterFile] = useState<UploadedFile | null>(null);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!referenceFile || !characterFile) {
      setError('Both Reference and Character assets are required.');
      return;
    }

    setError(null);
    setStatus(AppStatus.ANALYZING);
    try {
      const result = await analyzeAssets(referenceFile, characterFile);
      setAnalysisResult(result);
      setStatus(AppStatus.ANALYZED);
    } catch (err: any) {
      setError(err.message || 'Analysis Failed');
      setStatus(AppStatus.ERROR);
    }
  };

  const handleUpdateAction = (newAction: string) => {
    if (analysisResult) {
      setAnalysisResult({
        ...analysisResult,
        action: newAction
      });
    }
  };

  const handleGenerateFrame = async () => {
    if (!characterFile || !analysisResult) return;

    setStatus(AppStatus.GENERATING_FRAME);
    setError(null);

    try {
      const instructionPrompt = `
        GOAL: Generate a high-quality production frame for an AI Video.
        
        IDENTITY: ${analysisResult.characterDescription}
        STYLE: The artwork MUST be in the style of: ${analysisResult.style}.
        SCENE: ${analysisResult.scene}
        ACTION: Capture the starting pose of this movement: ${analysisResult.action}
        OVERLAY TEXT: ${analysisResult.text !== 'None' ? analysisResult.text : 'No text'}

        CRITICAL: Maintain 100% anatomical consistency. The character must be performing the motion exactly as described in the ACTION block.
        
        Output: A single descriptive paragraph for an image generator.
      `.trim();

      const refinedPrompt = await optimizePrompt(characterFile, instructionPrompt);
      const base64Image = await generateBaseFrame(characterFile, refinedPrompt);
      setGeneratedImage(base64Image);
      setStatus(AppStatus.FRAME_READY);
    } catch (err: any) {
      setError(err.message || 'Image Generation Failed');
      setStatus(AppStatus.ANALYZED);
    }
  };

  const handleEditFrame = async (editPrompt: string) => {
    if (!generatedImage) return;
    setStatus(AppStatus.EDITING_FRAME);
    setError(null);

    try {
      const editedImage = await editFrame(generatedImage, editPrompt);
      setGeneratedImage(editedImage);
      setStatus(AppStatus.FRAME_READY);
    } catch (err: any) {
      setError(err.message || 'Refinement Failed');
      setStatus(AppStatus.FRAME_READY);
    }
  };

  const handleRenderVideo = async () => {
    if (!generatedImage || !analysisResult) return;

    if (window.aistudio) {
      if (!(await window.aistudio.hasSelectedApiKey())) {
        await window.aistudio.openSelectKey();
      }
    }

    setStatus(AppStatus.RENDERING_VIDEO);
    setError(null);

    try {
      const [header, base64Data] = generatedImage.split(',');
      const mimeType = header.split(':')[1].split(';')[0];

      const videoPrompt = `
        TEMPORAL PRODUCTION TASK:
        Animate the character starting from the provided image.
        
        KINETIC INSTRUCTION: ${analysisResult.action}.
        STYLE CONTINUITY: ${analysisResult.style}.
        IDENTITY LOCK: ${analysisResult.characterDescription}.
        
        ANIMATION QUALITY: Smooth temporal flow, consistent physics, and precise anatomical locking. No style-drift. The motion must perfectly replicate the physics and pacing described in the kinetic instruction.
      `.trim();

      const videoUrl = await generateVideo(base64Data, mimeType, videoPrompt);
      setGeneratedVideo(videoUrl);
      setStatus(AppStatus.COMPLETE);

    } catch (err: any) {
      const errorMessage = err.message || '';
      if ((errorMessage.includes("Requested entity was not found") || 
           errorMessage.includes("API key expired")) && window.aistudio) {
        await window.aistudio.openSelectKey();
        setError("Session expired or API key invalid. Please re-select your project/key.");
      } else {
        setError(err.message || 'Video Rendering Failed');
      }
      setStatus(AppStatus.FRAME_READY);
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `starlabs-frame-${Date.now()}.png`;
    link.click();
  };

  const handleDownloadVideo = () => {
    if (!generatedVideo) return;
    const link = document.createElement('a');
    link.href = generatedVideo;
    link.download = `starlabs-video-${Date.now()}.mp4`;
    link.click();
  };

  const getStepStatus = (stepIndex: number) => {
    let activeStep = 0;
    if (status === AppStatus.ANALYZING || status === AppStatus.ANALYZED) activeStep = 1;
    if (status === AppStatus.GENERATING_FRAME || status === AppStatus.FRAME_READY || status === AppStatus.EDITING_FRAME) activeStep = 2;
    if (status === AppStatus.RENDERING_VIDEO || status === AppStatus.COMPLETE) activeStep = 3;

    if (activeStep > stepIndex) return 'complete';
    if (activeStep === stepIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-bg selection:bg-accent selection:text-white">
      <Header />

      {/* Progress Stepper */}
      <div className="px-10 py-4 border-b border-border flex justify-between items-center bg-card-bg/50">
        {['Ingest', 'Analyze', 'Synthesis', 'Production'].map((label, idx) => {
          const stepState = getStepStatus(idx);
          return (
            <div key={idx} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-[10px] font-mono transition-all duration-500
                ${stepState === 'complete' ? 'bg-accent border-accent text-white' :
                  stepState === 'active' ? 'bg-bg border-accent text-accent shadow-[0_0_10px_rgba(255,92,0,0.3)]' :
                    'bg-bg border-border text-text-dim'}
              `}>{idx + 1}</div>
              <span className={`text-[10px] font-mono tracking-widest uppercase ${stepState === 'active' ? 'text-accent' : 'text-text-dim'}`}>{label}</span>
              {idx < 3 && <div className="w-12 h-px bg-border mx-2" />}
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-[320px_1fr_360px] gap-px bg-border overflow-hidden">
        {/* Sidebar: Ingest */}
        <section className="bg-bg p-6 flex flex-col overflow-y-auto space-y-6">
          <div>
            <div className="section-label">Source Ingest</div>
            <div className="grid grid-cols-1 gap-4">
              <DropZone 
                label="Motion Ref (Video/GIF)" 
                acceptTypes="image/*,video/*" 
                file={referenceFile} 
                onFileSelect={setReferenceFile} 
                icon={Film} 
              />
              <DropZone 
                label="Character Key Asset" 
                acceptTypes="image/*" 
                file={characterFile} 
                onFileSelect={setCharacterFile} 
                icon={User} 
              />
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!referenceFile || !characterFile || status === AppStatus.ANALYZING}
            className={`btn w-full flex items-center justify-center gap-2 ${
              !referenceFile || !characterFile || status === AppStatus.ANALYZING ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {status === AppStatus.ANALYZING ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
            {status === AppStatus.ANALYZING ? 'DECODING DNA...' : 'INITIATE PRODUCTION'}
          </button>

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 text-red-400 p-3 rounded-sm flex items-start gap-2 animate-pulse">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span className="text-[10px] font-mono uppercase leading-tight">{error}</span>
            </div>
          )}
        </section>

        {/* Center: Action Log */}
        <section className="bg-bg p-6 flex flex-col overflow-y-auto">
          <div className="section-label">Multimodal Action Log</div>
          <Terminal
            data={analysisResult}
            isLoading={status === AppStatus.ANALYZING}
            onActionChange={handleUpdateAction}
          />
        </section>

        {/* Right: Production Monitor */}
        <section className="bg-bg p-6 flex flex-col overflow-y-auto">
          <div className="section-label">Production Monitor</div>
          <ProductionMonitor
            status={status}
            generatedImage={generatedImage}
            generatedVideo={generatedVideo}
            onGenerateFrame={handleGenerateFrame}
            onEditFrame={handleEditFrame}
            onDownloadImage={handleDownloadImage}
            onRenderVideo={handleRenderVideo}
            onDownloadVideo={handleDownloadVideo}
          />
        </section>
      </main>
    </div>
  );
};

export default App;

