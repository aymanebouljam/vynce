export default function InputError({ message, className = '', ...props }) {
    return message ? (
        <p {...props} className={'text-sm leading-5 break-words text-rose-300 ' + className}>
            {message}
        </p>
    ) : null;
}
