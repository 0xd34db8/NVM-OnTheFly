export default function Preloader() {
  return (
    <div className="flex items-center gap-[3px] h-4">
      <div className="w-[3px] bg-current rounded-sm animate-[eq_0.8s_ease-in-out_infinite_alternate] h-2"></div>
      <div className="w-[3px] bg-current rounded-sm animate-[eq_0.8s_ease-in-out_infinite_alternate_0.2s] h-4"></div>
      <div className="w-[3px] bg-current rounded-sm animate-[eq_0.8s_ease-in-out_infinite_alternate_0.4s] h-2.5"></div>
      <div className="w-[3px] bg-current rounded-sm animate-[eq_0.8s_ease-in-out_infinite_alternate_0.6s] h-3"></div>
    </div>
  )
}
