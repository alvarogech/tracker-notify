import { getStore } from "@netlify/blobs";

const WHATSAPP_PHONE   = process.env.WHATSAPP_PHONE;
const CALLMEBOT_APIKEY = process.env.CALLMEBOT_APIKEY;

const ENCOMENDAS = [
  { numero: "LZ425019247CN", nome: "Encomenda 1" },
  { numero: "LZ415326720CN", nome: "Encomenda 2" },
  { numero: "LZ415324508CN", nome: "Encomenda 3" },
];

const STATUS_PT = {
  "NotFound":        "Nao encontrado ainda",
  "InTransit":       "Em transito",
  "Expired":         "Rastreio expirado",
  "Undelivered":     "Nao entregue",
  "Delivered":       "ENTREGUE!",
  "InfoReceived":    "Informacao recebida",
  "AvailablePickup": "Disponivel para retirada",
  "OutForDelivery":  "Saiu para entrega",
  "AttemptFail":     "Tentativa falhou",
  "Exception":       "Problema / Retencao",
};

async function consultarTracking(numero) {
  const res = await fetch("https://t.17track.net/restapi/track", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; tracker-notify/2.0)",
    },
    body: JSON.stringify({ data: [{ num: numero }], auto_detection: true }),
  });
  if (!res.ok) throw new Error("17track erro: " + res.status);
  const json = await res.json();
  const item = json?.dat?.[0];
  if (!item) return null;
  const track = item.track || {};
  const z0 = track.z0 || {};
  const z1 = track.z1 || [];
  return { status: z0.s || "NotFound", sub: z0.d || "", eventos: z1 };
}

async function enviarWhatsApp(mensagem) {
  const url = "https://api.callmebot.com/whatsapp.php" +
    "?phone=" + encodeURIComponent(WHATSAPP_PHONE) +
    "&text=" + encodeURIComponent(mensagem) +
    "&apikey=" + encodeURIComponent(CALLMEBOT_APIKEY);
  const res = await fetch(url);
  console.log("WhatsApp " + (res.ok ? "enviado" : "falhou") + ": " + res.status);
  return res.ok;
}

function formatarMensagem(nome, numero, info) {
  const statusPt = STATUS_PT[info.status] || info.status;
  const ultimo = info.eventos?.[0] || {};
  const detalhe = ultimo.z || info.sub || "";
  const local = ultimo.c || "";
  const data = (ultimo.a || "").slice(0, 10);
  const linhas = [
    "ATUALIZACAO DE RASTREIO",
    "",
    "Encomenda: " + nome,
    "Codigo: " + numero,
    "",
    "Status: " + statusPt,
  ];
  if (local) linhas.push("Local: " + local);
  if (detalhe) linhas.push("Detalhe: " + detalhe);
  if (data) linhas.push("Data: " + data);
  return linhas.join("\n");
}

export default async function handler() {
  console.log("Verificando rastreios...");
  const store = getStore("tracking-status");

  for (const encomenda of ENCOMENDAS) {
    const { numero, nome } = encomenda;
    let info;
    try {
      info = await consultarTracking(numero);
    } catch (err) {
      console.error("Erro ao consultar " + numero + ":", err.message);
      continue;
    }
    if (!info) { console.log(numero + ": sem dados"); continue; }

    const ultimoEvento = info.eventos?.[0]?.z || "";
    const chave = "status_" + numero;
    let salvo = null;
    try { salvo = await store.get(chave, { type: "json" }); } catch {}

    const mudou = info.status !== salvo?.status || ultimoEvento !== salvo?.evento;
    console.log(numero + ": " + salvo?.status + " -> " + info.status + " | evento: " + ultimoEvento);

    if (mudou && info.status !== "NotFound") {
      console.log("Mudanca em " + numero + " — notificando");
      await enviarWhatsApp(formatarMensagem(nome, numero, info));
      await store.setJSON(chave, { status: info.status, evento: ultimoEvento });
    }
  }
  console.log("Concluido.");
}

export const config = {
  schedule: "0 * * * *",
};
