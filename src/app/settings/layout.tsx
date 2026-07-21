import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
};

export default function SettingsLayoutGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
