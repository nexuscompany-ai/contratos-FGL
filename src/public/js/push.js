/**
 * Utilitários de Web Push do FGL Contratos, compartilhados entre o topbar
 * (sino + badge) e a tela de Configurações → Notificações. Tudo isolado
 * aqui pra não misturar com a lógica de negócio das outras páginas.
 */
(function () {
  function isIos() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function pushSuportado() {
    return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  }

  /**
   * No iPhone, Web Push só funciona depois de "Adicionar à Tela de Início"
   * (o Safari normal, em aba, não recebe push). Esse é o único caso em que
   * pedimos pro usuário instalar antes de tentar ativar.
   */
  function precisaInstalarNoIphone() {
    return isIos() && !isStandalone();
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return null;
    return navigator.serviceWorker.register("/sw.js");
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  /**
   * Estado atual da notificação neste dispositivo, pra tela de
   * Configurações desenhar exatamente um dos 5 estados pedidos.
   */
  async function getEstado() {
    if (!pushSuportado()) return "incompativel";
    if (precisaInstalarNoIphone()) return "precisa-instalar-ios";
    if (Notification.permission === "denied") return "bloqueado";
    if (Notification.permission !== "granted") return "nao-configurado";

    const reg = await navigator.serviceWorker.ready.catch(() => null);
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    return sub ? "ativo" : "nao-configurado";
  }

  async function ativar() {
    if (!pushSuportado()) throw new Error("incompativel");
    if (precisaInstalarNoIphone()) throw new Error("precisa-instalar-ios");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("permissao-negada");

    const reg = await registerServiceWorker();
    await navigator.serviceWorker.ready;

    const keyRes = await fetch("/api/push/public-key");
    const { publicKey, configurado } = await keyRes.json();
    if (!configurado) throw new Error("servidor-nao-configurado");

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
    });

    return sub;
  }

  async function desativarNesteDispositivo() {
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (sub) {
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
  }

  async function enviarTeste() {
    const res = await fetch("/api/push/test", { method: "POST" });
    return res.json();
  }

  window.FGLPush = {
    isIos,
    isStandalone,
    pushSuportado,
    precisaInstalarNoIphone,
    registerServiceWorker,
    getEstado,
    ativar,
    desativarNesteDispositivo,
    enviarTeste,
  };
})();
