const ENCOMENDAS = [
  { numero: "LZ425019247CN", nome: "Encomenda 1" },
  { numero: "LZ415326720CN", nome: "Encomenda 2" },
  { numero: "LZ415324508CN", nome: "Encomenda 3" },
];

async function consultarCorreios(numero) {
  const res = await fetch(
    "https://api.linketrack.com/track/json?user=teste&token=1abcd00b2731640591ed3426a36540c8&codigo=" + numero,
    { headers: { "Accept": "application/json" } }
  );
  if (!res.ok) throw new Error("Correios HTTP " + res.status);
  return await res.json();
}

async function enviarWhatsApp(msg) {
  const phone = process.env.WHATSAPP_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) return false;
  const url = "https://api.callmebot.com/whatsapp.php?phone=" + encodeURIComponent(phone) + "&text=" + encodeURIComponent(msg) + "&apikey=" + encodeURIComponent(apikey);
  const r = await fetch(url);
  return r.ok;
}

function formatarMsg(nome, numero, dados) {
  const eventos = dados.eventos || [];
  const ultimo = eventos[0] || {};
  const status = dados.status || "Em processamento";
  const linhas = [
    "STATUS ATUAL",
    "Encomenda: " + nome,
    "Codigo: " + numero,
    "Status: " + status,
  ];
  if (ultimo.descricao) linhas.push("Detalhe: " + ultimo.descricao);
  if (ultimo.local) linhas.push("Local: " + ultimo.local);
  if (ultimo.data) linhas.push("Data: " + ultimo.data + " " + (ultimo.hora || ""));
  return linhas.join("\n");
}

export const handler = async () => {
  const resultados = [];
  for (const enc of ENCOMENDAS) {
    try {
      const dados = await consultarCorreios(enc.numero);
      const msg = formatarMsg(enc.nome, enc.numero, dados);
      const sent = await enviarWhatsApp(msg);
      resultados.push({ numero: enc.numero, status: dados.status, qtd_eventos: (dados.eventos||[]).length, whatsapp: sent });
    } catch(e) {
      resultados.push({ numero: enc.numero, erro: e.message });
    }
  }
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resultados }, null, 2),
  };
};
