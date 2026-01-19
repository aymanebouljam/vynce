import AppShell from '@/Layouts/AppShell';

export default function AuthenticatedLayout({ children, header, title, sidebar, navSearch }) {
    return (
        <AppShell title={title} sidebar={sidebar} navSearch={navSearch}>
            {header}
            {children}
        </AppShell>
    );
}
