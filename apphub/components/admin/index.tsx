export function AdminPanel({ children }: { children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-6">
      <h2 className="text-xl font-semibold mb-4">Admin Panel</h2>
      {children}
    </div>
  );
}
