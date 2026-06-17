interface AppCardProps {
  name: string;
  description?: string;
  url: string;
}

export function AppCard({ name, description, url }: AppCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border p-4 hover:bg-accent transition-colors"
    >
      <h3 className="font-semibold">{name}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </a>
  );
}
