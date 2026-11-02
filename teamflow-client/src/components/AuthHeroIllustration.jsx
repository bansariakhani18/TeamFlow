import React from 'react';

export const AuthHeroIllustration = () => {
  return (
    <div className="relative flex flex-col justify-end p-8 lg:p-12 overflow-hidden h-full min-h-[320px] lg:min-h-full select-none">
      {/* Background Photo Element */}
      <img
        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
        alt="Team collaboration workspace"
        className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.92]"
        loading="eager"
      />

      {/* Subtle Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-900/30 to-transparent pointer-events-none" />

      {/* Headline Text Overlay (bottom-aligned over gradient) */}
      <div className="relative z-10 text-white space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-medium text-white/90">
          TeamFlow Platform
        </div>
        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white leading-snug">
          Manage projects and empower team velocity.
        </h2>
        <p className="text-sm text-stone-200/90 font-normal">
          Real-time collaboration, structured workflows, and clean execution.
        </p>
      </div>
    </div>
  );
};

export default AuthHeroIllustration;
