import { Card, CardContent } from "@/components/ui/card";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-4">
      <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="border-b bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-300">
              Módulo em construção
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-300">
              {description}
            </p>
          </div>

          <div className="p-6">
            <p className="text-sm text-slate-600">
              Esta tela já está reservada na estrutura do sistema para evoluir o módulo sem precisar reorganizar o menu novamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
