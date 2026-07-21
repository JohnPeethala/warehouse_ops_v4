import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Active Tickets',
};

export default function ActiveTicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
