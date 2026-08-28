export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex-grow-1 d-flex align-items-center justify-content-center bg-highlight py-5">
      {children}
    </main>
  );
}
