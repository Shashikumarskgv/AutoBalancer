import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { RealtimeDifficultyModal } from '../components/RealtimeDifficultyModal';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Game Difficulty Auto-Balancing System',
  description: 'AI-driven dynamic difficulty adjustment platform powered by machine learning',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground min-h-screen flex flex-col selection:bg-indigo-600 selection:text-white">
        <AuthProvider>
          <Navbar />
          <div className="flex-1 flex flex-col">{children}</div>
          <RealtimeDifficultyModal />
        </AuthProvider>
      </body>
    </html>
  );
}
