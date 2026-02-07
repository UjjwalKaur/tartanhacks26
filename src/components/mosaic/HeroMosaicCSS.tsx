'use client';

export const HeroMosaicCSS = () => {
  return (
    <div className="w-full h-64 -mt-8 -mb-8 overflow-hidden relative">
      <div className="absolute inset-0 grid grid-cols-5 grid-rows-3 gap-4 p-8 opacity-30">
        {[...Array(15)].map((_, i) => {
          const colors = [
            'bg-gradient-to-br from-[#D2A046]/30 to-transparent',
            'bg-gradient-to-br from-[#8C78C8]/30 to-transparent',
            'bg-gradient-to-br from-[#50A06E]/30 to-transparent',
          ];
          return (
            <div
              key={i}
              className={`glass-card ${colors[i % 3]} animate-float`}
              style={{
                animationDelay: `${i * 0.2}s`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};