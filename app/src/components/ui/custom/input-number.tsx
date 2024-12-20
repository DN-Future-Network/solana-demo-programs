export function InputNumber(props: Readonly<InputNumberProps>) {
  return (
    <input
      type="number"
      value={props.value}
      onChange={props.onChange}
      placeholder={props.placeholder}
      disabled={props.disable}
      className="input input-bordered border-gray-400 text-sm w-full mb-1 bg-transparent focus:outline-none focus:text-xs"
    />
  )
}

interface InputNumberProps {
  value: number | string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  disable?: boolean
}
