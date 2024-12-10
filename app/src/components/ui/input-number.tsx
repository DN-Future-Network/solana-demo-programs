export function InputNumber(props: Readonly<InputNumberProps>) {
  return (
    <input
      type="number"
      placeholder={props.placeholder}
      disabled={props.disable}
      className="input input-bordered border-gray-400 text-sm  w-full mb-4 bg-transparent focus:outline-none focus:text-xs"
    />
  )
}

interface InputNumberProps {
  placeholder: string
  disable?: boolean
}
