export function Button(props: Readonly<ButtonProps>) {
  return (
    <button className="btn bg-black text-white w-full mb-6" onClick={props.onClick} disabled={props.disable}>
      {props.title} {props.disable && '...'}
    </button>
  )
}

interface ButtonProps {
  title: string
  disable: boolean
  onClick: () => void
}
