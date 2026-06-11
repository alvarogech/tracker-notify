import { getStore } from "@netlify/blobs";

const ENCOMENDAS = [
  { numero: "LZ425019247CN", nome: "Encomenda 1" },
  { numero: "LZ415326720CN", nome: "Encomenda 2" },
  { numero: "LZ415324508CN", nome: "Encomenda 3" },
];

const STATUS_PT = {
  "NotFound":"Nao encontrado ainda","InTransit":"Em transito",
  "Expired":"Rastreio expirado","Undelivered":"Nao entregue",
  "Delivered":"ENTREGUE!","InfoReceived":"Informacao recebida",
  "AvailablePickup":"Disponivel para retirada","OutForDelivery":"Saiu para entrega",
  "AttemptFail":"Tentativa falhou","Exception":"Problema / Retencao",
};

async function api17(endpoint, body) {
  const apiKey = process.env.TRACK17_APIKEY;
  const res = await fetch("https://api.17track.net/track/v2.2/" + endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "17token": apiKey },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(endpoint + " HTTP " + res.status);
  return await res.json();
}

async function enviarWhatsApp(msg) {
  const phone  = process.env.WHATSAPP_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) return false;
  const url = "https://api.callmebot.com/whatsapp.php" +
    "?phone=" + encodeURIComponent(phone) +
    "&text="  + encodeURIComponent(msg) +
    "&apikey=" + encodeURIComponent(apikey);
  const r = await fetch(url);
  return r.ok;
}

function formatarMsg(nome, numero, item) {
  const tag      = item?.track_info?.latest_status?.status || "NotFound";
  const statusPt = STATUS_PT[tag] || tag;
  const eventos  = item?.track_info?.tracking?.providers?.[0]?.events || [];
  const ultimo   = eventos[0] || {};
  const detalhe  = ultimo.description || "";
  const local    = ultimo.location    || "";
  const data     = (ultimo.time_iso   || "").slice(0, 10);
  const linhas = [
    "ATUALIZACAO DE RASTREIO",
    "Encomenda: " + nome,
    "Codigo: "   + numero,
    "Status: "   + statusPt,
  ];
  if (local)   linhas.push("Local: "   + local);
  if (detalhe) linhas.push("Detalhe: " + detalhe);
  if (data)    linhas.push("Data: "    + data);
  return linhas.join("\n");
}

export default async function handler() {
  console.log("Verificando rastreios...");
  const store  = getStore("tracking-status");
  const numeros = ENCOMENDAS.map(e => e.numero);

  // Registrar codigos (necessario na primeira vez)
  try {
    await api17("register", numeros.map(n => ({ number: n })));
  } catch(e) {
    console.log("Register (pode ja estar registrado):", e.message);
  }

  // Consultar status atual
  let aceitos = [];
  try {
    const json = await api17("gettrackinfo", numeros.map(n => ({ number: n })));
    aceitos = json.data?.accepted || [];
  } catch(e) {
    console.error("Erro ao consultar 17track:", e.message);
    return;
  }

  for (const enc of ENCOMENDAS) {
    const item = aceitos.find(a => a.number === enc.numero);
    if (!item) { console.log(enc.numero + ": ainda sem dados"); continue; }

    const tag         = item?.track_info?.latest_status?.status || "NotFound";
    const ultimoEvento = item?.track_info?.tracking?.providers?.[0]?.events?.[0]?.description || "";
    const chave       = "status_" + enc.numero;

    let salvo = null;
    try { salvo = await store.get(chave, { type: "json" }); } catch {}

    const mudou = tag !== salvo?.status || ultimoEvento !== salvo?.evento;
    console.log(enc.numero + ": " + salvo?.status + " -> " + tag + " | mudou: " + mudou);

    if (mudou && tag !== "NotFound") {
      const msg = formatarMsg(enc.nome, enc.numero, item);
      await enviarWhatsApp(msg);
      await store.setJSON(chave, { status: tag, evento: ultimoEvento });
      console.log(enc.numero + ": notificado");
    }
  }

  console.log("Concluido.");
}

export const config = {
  schedule: "0 * * * *",
};
