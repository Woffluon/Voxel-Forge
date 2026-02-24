export const buttonStyles = {
  base: 'border-[3px] border-pitch-black font-bold uppercase transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-0 rounded-none button-hover',
  primary:
    'bg-acid-green text-pitch-black shadow-brutal-md hover:-translate-y-1 hover:-translate-x-1 hover:shadow-brutal-xl active:translate-y-1 active:translate-x-1 active:shadow-brutal-active',
  secondary:
    'bg-stark-white text-pitch-black shadow-brutal-sm hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-brutal-md active:translate-y-[2px] active:translate-x-[2px] active:shadow-brutal-active',
  tile: 'bg-stark-white shadow-brutal-sm hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-brutal-md active:translate-y-[2px] active:translate-x-[2px] active:shadow-brutal-active',
} as const;
