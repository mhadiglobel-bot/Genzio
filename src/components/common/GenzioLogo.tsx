import React, { useRef, useEffect, useState } from 'react';
import spherePoster from '../../assets/images/genzio_sphere_g_phase1_1788814290616.jpg';
import { AnimatedGLogo } from './AnimatedGLogo';

export { AnimatedGLogo };
export type { AnimatedGLogoProps, AnimatedGLogoSize } from './AnimatedGLogo';

/**
 * GENZIO OFFICIAL 4K VIDEO LOGO & ANIMATED G LOGO
 *
 * Renders the exact original 4K liquid glass sphere with centered embossed letter G.
 * - Authentic uploaded logo asset as the base
 * - Fluid-light aurora animation (6-8s loop)
 * - GPU-friendly 60 FPS CSS transforms & radial gradients
 * - Responsive sizes (small, medium, large, hero)
 * - Thinking/loading states during AI generation
 * - Respects prefers-reduced-motion
 */

export interface GenzioLogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'hero' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'display' | number;
  interactive?: boolean;
  showText?: boolean;
  pulse?: boolean;
  glow?: boolean;
  isThinking?: boolean;
  onClick?: () => void;
}

export const GenzioLiquidGlassSphere: React.FC<{
  size?: number;
  interactive?: boolean;
}> = ({ size = 100, interactive = false }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('/logo.mp4');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Check if user previously saved a custom video in localStorage
    const savedVideo = localStorage.getItem('genzio_custom_logo_video');
    if (savedVideo) {
      setVideoSrc(savedVideo);
    }
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay policy or user interaction pending
        });
      }
    }
  }, [videoSrc]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Create immediate local object URL for instant 4K playback
    const localUrl = URL.createObjectURL(file);
    setVideoSrc(localUrl);

    // 2. Upload to server to persist as /public/logo.mp4
    try {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          await fetch('/api/upload-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoBase64: base64 }),
          });
        } catch {
          // Keep local fallback
        }
      };
      reader.readAsDataURL(file);
    } catch {
      // Ignore upload error, local url already active
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.includes('video')) {
      const localUrl = URL.createObjectURL(file);
      setVideoSrc(localUrl);

      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          await fetch('/api/upload-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoBase64: base64 }),
          });
        } catch {
          // ignore
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className={`relative shrink-0 select-none group ${
        interactive ? 'transition-transform duration-300 hover:scale-105 cursor-pointer' : ''
      }`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="GENZIO Official 4K Video Logo"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Hidden file input for direct video replacement */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Outer ambient diffuse aura blending into dark UI */}
      <div
        className="absolute -inset-[4%] rounded-full pointer-events-none opacity-40"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(244,63,94,0.30) 0%, rgba(139,92,246,0.25) 45%, rgba(196,181,253,0.15) 75%, transparent 100%)',
          filter: `blur(${Math.max(3, size * 0.08)}px)`,
        }}
        aria-hidden="true"
      />

      {/* ========================================================== */}
      {/* 4K ULTRA-HD SPHERICAL VIDEO CONTAINER                       */}
      {/* ========================================================== */}
      <div
        className="relative w-full h-full rounded-full overflow-hidden"
        style={{
          maskImage:
            'radial-gradient(circle at 50% 50%, #000 0%, #000 96%, rgba(0,0,0,0.6) 99%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(circle at 50% 50%, #000 0%, #000 96%, rgba(0,0,0,0.6) 99%, transparent 100%)',
          background: 'transparent',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      >
        {/* DIRECT 4K HTML5 VIDEO PLAYER (Exact Video Playback, Zero Changes, Zero Borders) */}
        <video
          ref={videoRef}
          key={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          poster={spherePoster}
          className="absolute inset-0 w-full h-full object-cover scale-[1.08] pointer-events-none z-10"
          style={{
            transform: 'scale(1.08) translateZ(0)',
          }}
        >
          <source src={videoSrc} type="video/mp4" />
          <source src="/assets/logo.mp4" type="video/mp4" />
          <source src="/logo.mp4" type="video/mp4" />
        </video>

        {/* Photorealistic 3D Liquid Glass Sphere Poster (Guaranteed high-quality base, Zero Borders) */}
        <img
          src={spherePoster}
          alt="GENZIO 3D Liquid Glass Sphere"
          className="absolute inset-0 w-full h-full object-cover scale-[1.08] pointer-events-none z-0"
          style={{
            transform: 'scale(1.08) translateZ(0)',
          }}
        />
      </div>

      {/* Optional subtle replace button on hover for convenience */}
      {size >= 80 && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Click to select or change 4K video file"
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-90 transition-opacity duration-200 text-[10px] bg-slate-900/90 hover:bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700/60 shadow-lg whitespace-nowrap cursor-pointer z-30 pointer-events-auto"
        >
          {isUploading ? 'Loading...' : 'Upload 4K Video'}
        </button>
      )}
    </div>
  );
};

// Aliases
export const GenzioAnimatedLogo = GenzioLiquidGlassSphere;
export const GenzioLiquidOrbSymbol = GenzioLiquidGlassSphere;

/**
 * GenzioLogo
 *
 * Official GENZIO AI brand mark lockup: [ 4K DIRECT VIDEO LOGO ] GENZIO
 */
export const GenzioLogo: React.FC<GenzioLogoProps> = ({
  className = '',
  size = 'md',
  interactive = false,
  showText = false,
  pulse = false,
  glow = false,
  isThinking = false,
  onClick,
}) => {
  const sizeConfig: Record<string, { px: number; text: string; wrap: string }> = {
    xs: { px: 20, text: 'text-xs', wrap: 'gap-1.5' },
    small: { px: 32, text: 'text-sm font-semibold', wrap: 'gap-2' },
    sm: { px: 32, text: 'text-sm font-semibold', wrap: 'gap-2' },
    medium: { px: 48, text: 'text-base font-semibold', wrap: 'gap-2.5' },
    md: { px: 48, text: 'text-base font-semibold', wrap: 'gap-2.5' },
    large: { px: 96, text: 'text-2xl font-bold', wrap: 'gap-3.5' },
    lg: { px: 96, text: 'text-2xl font-bold', wrap: 'gap-3.5' },
    hero: { px: 140, text: 'text-5xl font-black', wrap: 'gap-5' },
    display: { px: 140, text: 'text-5xl font-black', wrap: 'gap-5' },
    xl: { px: 60, text: 'text-xl font-bold', wrap: 'gap-3' },
  };

  const current =
    typeof size === 'number'
      ? { px: size, text: 'text-base font-semibold', wrap: 'gap-2.5' }
      : sizeConfig[size] || sizeConfig.md;

  return (
    <div
      className={`inline-flex items-center ${current.wrap} select-none ${
        pulse ? 'animate-pulse' : ''
      } ${className}`}
      onClick={onClick}
    >
      <AnimatedGLogo
        size={current.px}
        isThinking={isThinking}
        interactive={interactive}
        showGlow={glow}
      />

      {showText && (
        <span className={`tracking-tight ${current.text} font-bold text-white`}>
          GENZIO
        </span>
      )}
    </div>
  );
};

export default GenzioLogo;
