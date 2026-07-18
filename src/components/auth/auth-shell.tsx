import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="container grid min-h-[calc(100dvh-8rem)] place-items-center py-12">
      <Card className="w-full max-w-md overflow-hidden border-primary/15 shadow-card">
        <div className="h-1 bg-primary" />
        <CardHeader className="pb-5 text-center">
          <p className="eyebrow">Secure workspace</p>
          <CardTitle className="mt-2 font-display text-3xl">{title}</CardTitle>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}
