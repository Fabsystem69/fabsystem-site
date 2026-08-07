// La page /visio redirige desormais vers /contact (systeme de reservation
// Cal.com abandonne) : ce layout n'a plus besoin de metadata dediee.
export default function VisioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
