export default function InputLabel({ value, className = '', children, ...props }) {
    return (
        <label {...props} className={`app-text-high block text-sm font-medium ` + className}>
            {value ? value : children}
        </label>
    );
}
