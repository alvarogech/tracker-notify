const ENCOMENDAS = [
  { numero: "LZ425019247CN", nome: "Encomenda 1" },
  { numero: "LZ415326720CN", nome: "Encomenda 2" },
  { numero: "LZ415324508CN", nome: "Encomenda 3" },
];
const STATUS_PT = {"NotFound":"Nao encontrado ainda","InTransit":"Em transito","Expired":"Rastreio expirado","Undelivered":"Nao entregue","Delivered":"ENTREGUE!","InfoReceived":"Informacao recebida","AvailablePickup":"Disponivel para retirada","OutForDelivery":"Saiu para entrega","AttemptFail":"Tentativa falhou","Exception":"Problema"};

async function consultarTracking(numero) {
  const res = await fetch("https://t.17track.net/restapi/track", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
    body: JSON.stringify({ data: [{ num: numero }], auto_detection: true }),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const json = await res.json();
  const item = json?.dat?.[0];
  if (!item) return { status: "NotFound", debug: JSON.stringify(json).slice(0,200), eventos: [] };
  const z0 = item.track?.z0 || {};
  const z1 = item.track?.z1 || [];
  return { status: z0.s || "NotFound", sub: z0.d || "", eventos: z1 };
}

async function enviarWhatsApp(msg) {
  const phone = process.env.WHATSAPP_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) return false;
  const url = "https://api.callmebot.com/whatsapp.php?phone=" + encodeURIComponent(phone) + "&text=" + encodeURIComponent(msg) + "&apikey=" + encodeURIComponent(apikey);
  const r = await fetch(url);
  return r.ok;
}

function formatarMsg(nome, numero, info) {
  const sp = STATUS_PT[info.status] || info.status;
  const ev = info.eventos?.[0] || {};
  const linhas = ["STATUS ATUAL", "Encomenda: " + nome, "Codigo: " + numero, "Status: " + sp];
  if (ev.c) linhas.push("Local: " + ev.c);
  if (ev.z) linhas.push("Detalhe: " + ev.z);
  if (ev.a) linhas.push("Data: " + ev.a.slice(0,10));
  return linhas.join("\n");
}

export const handler = async () => {
  const resultados = [];
  for (const enc of ENCOMENDAS) {
    try {
      const info = await consultarTracking(enc.numero);
      const msg = formatarMsg(enc.nome, enc.numero, info);
      const sent = await enviarWhatsApp(msg);
      resultados.push({ numero: enc.numero, status: info.status, whatsapp: sent, debug: info.debug });
    } catch(e) {
      resultados.push({ numero: enc.numero, erro: e.message });
    }
  }
  return { statusCode: 200, headers: {"Content-Type":"application/json"}, body: JSON.stringify({resultados}, null, 2) };
};
