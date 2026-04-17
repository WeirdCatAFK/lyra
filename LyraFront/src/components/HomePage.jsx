export default function HomePage({ onStart }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-[#f5ede0]">
      <h1 className="text-5xl font-serif text-[#2c1a0e] mb-3 tracking-wide">Lyra</h1>
      <p className="text-[#7a5c3a] text-lg mb-10">Piano practice, step by step.</p>
      <button
        onClick={onStart}
        className="px-8 py-3 bg-[#d94a2c] text-white text-base font-medium rounded-sm
                   hover:bg-[#b83a20] active:bg-[#a03318] transition-colors cursor-pointer"
      >
        Start practising
      </button>
    </div>
  )
}
