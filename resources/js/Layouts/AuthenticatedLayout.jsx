import AppShell from '@/Layouts/AppShell';

export default function AuthenticatedLayout({ children, header, title, sidebar }) {
    return (
        <AppShell title={title} sidebar={sidebar}>
            {header}
            {children}
        </AppShell>
    );
}
