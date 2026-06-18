import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div style={styles.layout}>
      <Navbar />
      <Sidebar />
      <main style={styles.main}>
        <div style={styles.content}>{children}</div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    minHeight: '100vh',
  },
  main: {
    marginLeft: 'var(--sidebar-width)',
    marginTop: 'var(--navbar-height)',
    minHeight: 'calc(100vh - var(--navbar-height))',
    padding: '32px',
    transition: 'margin-left 0.3s ease',
  },
  content: {
    maxWidth: 'var(--content-max-width)',
    margin: '0 auto',
    animation: 'fadeIn 0.3s ease-out',
  },
};
