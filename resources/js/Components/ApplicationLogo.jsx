export default function ApplicationLogo(props) {
    return (
        <svg
            {...props}
            viewBox="0 0 128 128"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path
                fill="currentColor"
                d="M25 27c3.4 0 6.5 2.1 7.7 5.3L50 81.1c1.1 3.1 5.5 3.1 6.6 0L73.1 35c1.2-3.3 4.3-5.5 7.8-5.5h0.2c5.7 0 9.7 5.7 7.7 11L66.7 99.4c-1.3 3.4-4.5 5.6-8.2 5.6h-9.3c-3.6 0-6.9-2.3-8.1-5.7L17.3 37.9C15.4 32.5 19.4 27 25 27Z"
            />
            <path
                fill="currentColor"
                opacity="0.28"
                d="M79.8 20c10.3 0 18.2 10.1 14.7 19.8l-3.8 10.7-15.5-15.4 2.5-7C78 25.4 78.8 22.6 79.8 20Z"
            />
            <path
                fill="currentColor"
                opacity="0.16"
                d="M37.8 20.2c0.9 2.4 1.7 4.8 2.6 7.2l3.1 8.8L28 51.5l-4.2-12C20.5 29.9 28.1 20.2 37.8 20.2Z"
            />
            <circle fill="currentColor" cx="95" cy="31" r="8" />
        </svg>
    );
}
