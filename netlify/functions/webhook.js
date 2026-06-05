const crypto = require("crypto");

const STATUS_PT = {
  InfoReceived:        "Informacao recebida pelo remetente",
  InTransit:           "Em transito",
  OutForDelivery:      "Saiu para entrega",
  AttemptFail:         "Tentativa de entrega falhou",
  Delivered:           "ENTREGUE!",
  AvailableForPickup:  "Disponivel para retirada",
  Exception:           "Problema na entrega / Retencao",
  Expired:             "Rastreio expirado",
  Pending:             "Aguardando movimentacao",
};

function verificarAssinatura(body, assinaturaRecebida, secret) {
  if (!secret) return true;
  const esperada = crypto.createHmac("sha256", secret).updhhate(body).digest("base64");
  return crypto.timingSafeEqual(Buffer.from(esperada), Buffer.from(assinaturaRecebida));
}

async function enviarWhatsApp(mensagem) {
  const phone  = process.env.WHATSAPP_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) { console.error("Vars nao configuradas."); return false; }
  const url = "https://api.callmebot.com/whatsapp.php?phone=" + encodeURIComponent(phone) + "&text=" + encodeURIComponent(mensagem) + "&apikey=" + encodeURIComponent(apikey);
  const res = await fetch(url);
  const ok  = res.status === 200;
  console.log("WhatsApp " + (ok ? "enviado" : "falhou") + ": " + res.status);
  return ok;
}

function formatarMensagem(dados) {
  const t = dados.msg?.tracking || dados.tracking || {};
  const statusMap = {InTransit:"Em transito",OutForDelivery:"Saiu para entrega",Delivered:"ENTREGUE!",Exception:"Problema/Retencao",Expired:"Expirado",Pending:"Aguardando"};
  const statusPt = statusMap[t.tag] || t.tag || "Atualizacao";
  const ultimo = (t.checkpoints || []).slice(-1)[0] || {};
  const linhas = [
    "ATUALIZACAO DE RASTREIO",
    "Encomenda: " + (t.title || t.order_id || "Encomenda"),
    "Codigo: " + (t.tracking_number || "-"),
    "Transportadora: " + ((t.slug || "").toUpperCase() || "-"),
    "Status: " + statusPt,
  ];
  if (ultimo.city || ultimo.location) linhas.push("Local: " + (ultimo.city || ultimo.location));
  if (ultimo.message) linhas.push("Detalhe: " + ultimo.message);
  if (ultimo.checkpoint_time) linhas.push("Data: " + ultimo.checkpoint_time.slice(0,10));
  return linhas.join("\n");
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  const body = event.body || "";
  const secret = process.env.AFTERSHIP_SECRET || "";
  const assinatura = event.headers["aftership-hmac-sha256"] || "";
  if (secret && !verificarAssinatura(body, assinatura, secret)) {
    return { statusCode: 401, body: JSON.stringify({ error: "Invalid signature" }) };
  }
  let dados;
  try { dados = JSON.parse(body); } catch { return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) }; }
  const evento = dados.event || "";
  if (!["tracking_update","tracking_delivered"].includes(evento)) {
    return { statusCode: 200, body: JSON.stringify({ status: "ignored" }) };
  }
  const mensagem = formatarMensagem(dados);
  await enviarWhatsApp(mensagem);
  return { statusCode: 200, body: JSON.stringify({ status: "ok" }) };
};
