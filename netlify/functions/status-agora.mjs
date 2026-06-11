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
    "STATUS ATUAL",
    "Encomenda: " + nome,
    "Codigo: "   + numero,
    "Status: "   + statusPt,
  ];
  if (local)   linhas.push("Local: "   + local);
  if (detalhe) linhas.push("Detalhe: " + detalhe);
  if (data)    linhas.push("Data: "    + data);
  return linhas.join("\n");
}

export const handler = async () => {
  const numeros = ENCOMENDAS.map(e => e.numero);

  // Passo 1: Registrar os codigos (necessario antes de consultar)
  try {
    await api17("register", numeros.map(n => ({ number: n })));
  } catch(e) {
    // Ignorar erros de registro — podem ja estar registrados
    console.log("Register:", e.message);
  }

  // Passo 2: Consultar status
  let aceitos = [];
  try {
    const json = await api17("gettrackinfo", numeros.map(n => ({ number: n })));
    aceitos = json.data?.accepted || [];
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ erro: e.message }) };
  }

  const resultados = [];
  for (const enc of ENCOMENDAS) {
    const item = aceitos.find(a => a.number === enc.numero);
    if (!item) {
      resultados.push({ numero: enc.numero, info: "registrado, aguardando primeiro sync (pode levar alguns minutos)" });
      continue;
    }
    const tag = item?.track_info?.latest_status?.status || "NotFound";
    const msg = formatarMsg(enc.nome, enc.numero, item);
    const sent = await enviarWhatsApp(msg);
    resultados.push({ numero: enc.numero, status: tag, whatsapp: sent });
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resultados }, null, 2),
  };
};
