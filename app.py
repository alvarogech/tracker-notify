import os
import json
import hmac
import hashlib
import base64
import requests
from flask import Flask, request, jsonify
from urllib.parse import quote

app = Flask(__name__)

# ─── Configurações (via variáveis de ambiente) ───────────────────────────────
WHATSAPP_PHONE   = os.environ.get("WHATSAPP_PHONE", "")    # ex: +5562999999999
CALLMEBOT_APIKEY = os.environ.get("CALLMEBOT_APIKEY", "")  # gerada pelo bot
AFTERSHIP_SECRET = os.environ.get("AFTERSHIP_SECRET", "")  # do painel AfterShip
# ─────────────────────────────────────────────────────────────────────────────

# Tradução dos status AfterShip → português
STATUS_PT = {
    "InfoReceived":    "📋 Informação recebida pelo remetente",
    "InTransit":       "✈️ Em trânsito",
    "OutForDelivery":  "🛵 Saiu para entrega",
    "AttemptFail":     "⚠️ Tentativa de entrega falhou",
    "Delivered":       "✅ ENTREGUE!",
    "AvailableForPickup": "📦 Disponível para retirada",
    "Exception":       "🚨 Exceção / Problema na entrega",
    "Expired":         "⌛ Rastreio expirado",
    "Pending":         "🕐 Aguardando movimentação",
}


def verificar_assinatura(payload_bytes: bytes, assinatura_recebida: str) -> bool:
    """Verifica se o webhook veio mesmo do AfterShip."""
    if not AFTERSHIP_SECRET:
        return True  # sem secret configurado, aceita tudo (só para testes)
    mac = hmac.new(AFTERSHIP_SECRET.encode(), payload_bytes, hashlib.sha256)
    esperada = base64.b64encode(mac.digest()).decode()
    return hmac.compare_digest(esperada, assinatura_recebida)


def enviar_whatsapp(mensagem: str) -> bool:
    """Envia mensagem via CallMeBot."""
    if not WHATSAPP_PHONE or not CALLMEBOT_APIKEY:
        print("⚠️  WHATSAPP_PHONE ou CALLMEBOT_APIKEY não configurados.")
        return False

    url = (
        f"https://api.callmebot.com/whatsapp.php"
        f"?phone={quote(WHATSAPP_PHONE)}"
        f"&text={quote(mensagem)}"
        f"&apikey={CALLMEBOT_APIKEY}"
    )
    try:
        r = requests.get(url, timeout=10)
        ok = r.status_code == 200
        print(f"WhatsApp {'✅ enviado' if ok else '❌ falhou'}: {r.status_code}")
        return ok
    except Exception as e:
        print(f"Erro ao enviar WhatsApp: {e}")
        return False


def formatar_mensagem(dados: dict) -> str:
    """Formata a notificação a partir do payload do AfterShip."""
    tracking = dados.get("tracking", {})

    codigo      = tracking.get("tracking_number", "—")
    descricao   = tracking.get("title") or tracking.get("order_id") or "Encomenda"
    transportadora = tracking.get("slug", "").upper() or "—"
    status_raw  = tracking.get("tag", "InTransit")
    status_pt   = STATUS_PT.get(status_raw, f"🔄 {status_raw}")

    # Último checkpoint
    checkpoints = tracking.get("checkpoints", [])
    ultimo = checkpoints[-1] if checkpoints else {}
    local   = ultimo.get("city") or ultimo.get("location") or ultimo.get("country_name") or "—"
    detalhe = ultimo.get("message") or ultimo.get("subtag_message") or ""
    data_cp = ultimo.get("checkpoint_time", "")[:10] if ultimo.get("checkpoint_time") else ""

    linhas = [
        "📦 *ATUALIZAÇÃO DE RASTREIO*",
        "",
        f"*Encomenda:* {descricao}",
        f"*Código:* `{codigo}`",
        f"*Transportadora:* {transportadora}",
        "",
        f"*Status:* {status_pt}",
    ]
    if local != "—":
        linhas.append(f"*Local:* {local}")
    if detalhe:
        linhas.append(f"*Detalhe:* {detalhe}")
    if data_cp:
        linhas.append(f"*Data:* {data_cp}")

    return "\n".join(linhas)


@app.route("/webhook", methods=["POST"])
def webhook():
    payload_bytes = request.get_data()

    # 1. Verificar assinatura (segurança)
    assinatura = request.headers.get("aftership-hmac-sha256", "")
    if AFTERSHIP_SECRET and not verificar_assinatura(payload_bytes, assinatura):
        print("❌ Assinatura inválida — requisição rejeitada.")
        return jsonify({"error": "Invalid signature"}), 401

    # 2. Parsear payload
    try:
        dados = json.loads(payload_bytes)
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON"}), 400

    evento = dados.get("event", "")
    print(f"📨 Evento recebido: {evento}")

    # 3. Só processar eventos de atualização de rastreio
    if evento not in ("tracking_update", "tracking_delivered"):
        return jsonify({"status": "ignored", "event": evento}), 200

    # 4. Formatar e enviar
    mensagem = formatar_mensagem(dados)
    print(f"\n{mensagem}\n")
    enviar_whatsapp(mensagem)

    return jsonify({"status": "ok"}), 200


@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "online", "service": "rastreio-whatsapp"}), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
