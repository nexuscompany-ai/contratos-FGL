/**
 * Central de notificações do topbar (sino + badge) e atualização leve do
 * badge de "Contratos Pendentes" no dashboard. Nada de polling agressivo:
 * a fonte real de aviso é o Web Push (evento do backend); isto aqui só
 * mantém a tela sincronizada enquanto o gestor está com o CRM aberto, a
 * cada 25s e só quando a aba está visível — arquitetura serverless na
 * Vercel não sustenta WebSocket/SSE de longa duração.
 */
(function () {
  const POLL_MS = 25000;

  const bellBtn = document.getElementById("notifBellBtn");
  const panel = document.getElementById("notifPanel");
  const badge = document.getElementById("notifBadge");
  const list = document.getElementById("notifList");
  const markAllBtn = document.getElementById("notifMarkAll");

  if (!bellBtn) return;

  function tempoRelativo(iso) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return "agora";
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h} h`;
    return `${Math.floor(h / 24)} d`;
  }

  function setBadge(count) {
    if (count > 0) {
      badge.hidden = false;
      badge.textContent = count > 99 ? "99+" : String(count);
    } else {
      badge.hidden = true;
    }
  }

  async function updateUnreadCount() {
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (!res.ok) return;
      const data = await res.json();
      setBadge(data.unreadCount || 0);
    } catch (e) {
      // silencioso — a próxima rodada tenta de novo
    }
  }

  async function loadList() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      renderList(data.notifications || []);
      setBadge(data.unreadCount || 0);
    } catch (e) {
      // silencioso
    }
  }

  function renderList(items) {
    if (items.length === 0) {
      list.innerHTML = '<div class="empty-state" style="padding:24px 12px;">Nenhuma notificação ainda.</div>';
      return;
    }

    list.innerHTML = items
      .map((n) => {
        const unread = !n.readAt;
        const href = n.contractId ? `/contratos/${n.contractId}` : "#";
        return `<a class="notif-item ${unread ? "unread" : ""}" href="${href}" data-id="${n.id}">
          <div class="notif-title">${escapeHtml(n.title)}</div>
          <div class="notif-body">${escapeHtml(n.body)}</div>
          <div class="notif-time">${tempoRelativo(n.createdAt)}</div>
        </a>`;
      })
      .join("");

    list.querySelectorAll(".notif-item").forEach((el) => {
      el.addEventListener("click", async () => {
        const id = el.getAttribute("data-id");
        try {
          await fetch(`/api/notifications/${id}/ler`, { method: "POST" });
        } catch (e) {
          // segue o clique mesmo se marcar como lida falhar
        }
      });
    });
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  bellBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const abrir = panel.hidden;
    panel.hidden = !abrir;
    if (abrir) loadList();
  });

  document.addEventListener("click", (e) => {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== bellBtn) {
      panel.hidden = true;
    }
  });

  markAllBtn.addEventListener("click", async () => {
    try {
      await fetch("/api/notifications/ler-todas", { method: "POST" });
      loadList();
    } catch (e) {
      // silencioso
    }
  });

  async function updatePendentesBadge() {
    const els = document.querySelectorAll("[data-pendentes-badge]");
    if (els.length === 0) return;
    try {
      const res = await fetch("/api/contratos/pendentes/count");
      if (!res.ok) return;
      const data = await res.json();
      els.forEach((el) => {
        el.textContent = data.count;
        el.hidden = data.count === 0;
      });
    } catch (e) {
      // silencioso
    }
  }

  updateUnreadCount();
  updatePendentesBadge();

  let timer = null;
  function startPolling() {
    if (timer) return;
    timer = setInterval(() => {
      updateUnreadCount();
      updatePendentesBadge();
    }, POLL_MS);
  }
  function stopPolling() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopPolling();
    else {
      updateUnreadCount();
      updatePendentesBadge();
      startPolling();
    }
  });
  startPolling();

  // Registra o Service Worker cedo em toda página interna, sem forçar
  // ativação de permissão — isso só acontece quando o usuário toca em
  // "Ativar notificações" nas Configurações.
  if (window.FGLPush) window.FGLPush.registerServiceWorker();
})();
