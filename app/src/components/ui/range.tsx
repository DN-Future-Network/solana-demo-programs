export function Range(props: Readonly<RangeProps>) {
  const step = props.max / 100

  return (
    <>
      <input type="range" min={0} max={props.max} value={props.value} onChange={props.onChange} className="range range-xs" step={step} />
      <div className="flex w-full justify-between px-2 text-xs">
        <span>0</span>
        <span>|</span>
        <span>50%</span>
        <span>|</span>
        <span>Max</span>
      </div>
    </>
  )
}

interface RangeProps {
  value: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  max: number
}
