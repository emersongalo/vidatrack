type Pessoa = { nome: string; urlFoto: string | null };

export function AvataresEmpilhados({ pessoas, tamanho = 26 }: { pessoas: Pessoa[]; tamanho?: number }) {
  if (pessoas.length === 0) return null;

  return (
    <div className="flex items-center">
      {pessoas.map((p, i) => (
        <span
          key={i}
          title={p.nome}
          className="rounded-full border-2 border-base-800 overflow-hidden shrink-0 bg-base-600 flex items-center justify-center text-[10px] font-semibold text-ink-100"
          style={{ width: tamanho, height: tamanho, marginLeft: i === 0 ? 0 : -tamanho * 0.35 }}
        >
          {p.urlFoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.urlFoto} alt="" className="w-full h-full object-cover" />
          ) : (
            p.nome.charAt(0).toUpperCase()
          )}
        </span>
      ))}
    </div>
  );
}
