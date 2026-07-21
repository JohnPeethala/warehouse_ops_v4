import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Tracking',
};

export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
