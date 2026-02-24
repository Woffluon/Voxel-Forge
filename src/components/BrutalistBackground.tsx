import React, { useEffect } from 'react';

export const BrutalistBackground: React.FC = () => {
  // Parallax logic removed at user request.
  useEffect(() => {}, []);

  const marqueeText =
    '[EXPERIMENTAL MODULE] /// RAW RENDERING ENGINE /// NO SAFETY RAILS /// [EXPERIMENTAL MODULE] /// RAW RENDERING ENGINE /// NO SAFETY RAILS /// [EXPERIMENTAL MODULE] /// RAW RENDERING ENGINE /// NO SAFETY RAILS /// ';

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-[0]"
      aria-hidden="true"
    >
      {/* Background Static Elements to anchor the space */}
      <div className="absolute top-0 left-0 w-full h-10 border-b-[3px] border-pitch-black bg-stark-white/80 backdrop-blur-sm shadow-brutal-sm z-10 flex items-center overflow-hidden">
        <div
          className="w-[200%] h-full opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(135deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent 100%)',
            backgroundSize: '40px 40px',
          }}
        ></div>
      </div>

      {/* Brutalist Marquee at Bottom */}
      <div className="absolute bottom-0 left-0 w-full h-10 border-t-[3px] border-pitch-black bg-pitch-black text-stark-white flex items-center overflow-hidden z-20">
        <div className="flex animate-marquee whitespace-nowrap font-mono text-sm font-bold tracking-widest pl-4">
          <span className="shrink-0 pr-8">{marqueeText}</span>
          <span className="shrink-0 pr-8">{marqueeText}</span>
        </div>
      </div>

      <div className="absolute inset-0 z-0 select-none">
        {/* Layer 1 (Far Background, slow) */}
        <div className="absolute inset-0 transition-transform duration-75 ease-out">
          {/* Giant Graphic Circle */}
          <div className="absolute top-[5%] right-[2%] w-[30vw] h-[30vw] min-w-[200px] min-h-[200px] max-w-[500px] max-h-[500px] border-[12px] border-pitch-black rounded-full opacity-[0.04]"></div>

          {/* Giant Graphic Triangle */}
          <svg
            className="absolute bottom-[-10%] left-[-5%] w-[40vw] h-[40vw] min-w-[250px] min-h-[250px] max-w-[600px] max-h-[600px] opacity-[0.03] text-pitch-black animate-brutal-spin origin-center"
            viewBox="0 0 100 100"
            fill="currentColor"
          >
            <polygon points="50,0 100,86 0,86" />
          </svg>
        </div>

        {/* Layer 2 (Mid-ground) */}
        <div className="absolute inset-0 transition-transform duration-75 ease-out">
          {/* Checkered pattern block */}
          <div
            className="absolute top-[25%] left-[5%] lg:left-[8%] w-24 h-24 lg:w-32 lg:h-32 opacity-20 border-[3px] border-pitch-black"
            style={{
              backgroundImage:
                'repeating-conic-gradient(#000 0% 25%, transparent 0% 50%)',
              backgroundSize: '32px 32px',
            }}
          ></div>

          {/* 3D Wireframe Cube SVG */}
          <svg
            className="absolute bottom-[25%] right-[5%] lg:right-[8%] w-[20vw] h-[20vw] max-w-[200px] max-h-[200px] min-w-[120px] min-h-[120px] opacity-15 text-pitch-black"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="30,30 70,30 70,70 30,70" />
            <polygon points="50,10 90,10 90,50 50,50" />
            <line x1="30" y1="30" x2="50" y2="10" />
            <line x1="70" y1="30" x2="90" y2="10" />
            <line x1="70" y1="70" x2="90" y2="50" />
            <line x1="30" y1="70" x2="50" y2="50" />
          </svg>

          {/* Sticker 1 */}
          <div className="absolute top-[60%] left-[5%] lg:left-[10%] bg-acid-green border-[3px] border-pitch-black px-4 py-1 rotate-[-12deg] shadow-brutal-md mix-blend-multiply opacity-90 hidden sm:block">
            <span className="font-sans font-black uppercase tracking-tighter text-lg lg:text-xl text-pitch-black">
              RAW /// DATA
            </span>
          </div>

          {/* Sticker 2 */}
          <div className="absolute top-[20%] right-[3%] lg:right-[15%] bg-neon-pink border-[3px] border-pitch-black px-3 py-1 rotate-[8deg] shadow-brutal-md mix-blend-multiply flex items-center justify-center opacity-90 hidden sm:block">
            <span className="font-mono font-bold tracking-widest text-xs lg:text-sm text-stark-white">
              SYS_OP_1
            </span>
          </div>
        </div>

        {/* Layer 3 (Foreground floating accents) */}
        <div className="absolute inset-0 transition-transform duration-75 ease-out">
          <div className="absolute top-[35%] right-[5%] lg:right-[15%] text-neon-pink font-black text-4xl lg:text-5xl rotate-12 drop-shadow-[3px_3px_0px_#000]">
            +
          </div>
          <div className="absolute bottom-[45%] left-[2%] lg:left-[10%] text-electric-blue font-black text-5xl lg:text-6xl -rotate-[24deg] drop-shadow-[4px_4px_0px_#000]">
            +
          </div>

          <svg
            className="absolute top-[45%] right-[2%] lg:right-[10%] w-16 h-16 lg:w-20 lg:h-20 text-stark-white drop-shadow-[3px_3px_0px_#000] opacity-90 hidden sm:block"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M12 0L15 9h9l-7 6 3 9-8-6-8 6 3-9-7-6h9z"
              stroke="black"
              strokeWidth="1.5"
            />
          </svg>

          {/* Brutalist Arrow */}
          <svg
            className="absolute bottom-[20%] right-[25%] w-32 h-32 text-pitch-black opacity-20 rotate-[-15deg]"
            viewBox="0 0 100 100"
            fill="currentColor"
          >
            <path d="M50 0 L100 50 L75 50 L75 100 L25 100 L25 50 L0 50 Z" />
          </svg>

          <div className="absolute top-[50%] left-[5%] w-16 h-16 border-[6px] border-electric-blue rounded-full shadow-brutal-sm rotate-45 hidden lg:block"></div>
        </div>
      </div>
    </div>
  );
};
