const $ = id => document.getElementById(id);
const state = { lastReport: null };

function setOnlineBadge() {
  const online = navigator.onLine;
  const badge = $("onlineBadge");
  badge.textContent = online ? "В сети" : "Нет сети";
  badge.classList.toggle("offline", !online);
}

function normalizeUrl(value) {
  let url = value.trim();
  if (!url) throw new Error("Введите URL.");
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Поддерживаются только HTTP- и HTTPS-адреса.");
  }
  return parsed.href;
}

function explain(r) {
  if (!r.online) return "Устройство сообщает об отсутствии подключения к интернету. Сначала проверьте Wi-Fi или мобильный интернет.";
  if (r.ok) return "Браузер получил успешный HTTP-ответ. Это подтверждает доступность адреса из браузера на этом устройстве, но не гарантирует доступность для каждого приложения или протокола.";
  if (r.type === "timeout") return "Время ожидания истекло. Возможные причины: сервер недоступен, сервер отвечает слишком медленно, сетевой фильтр или ограничения браузера/сети.";
  if (r.type === "cors") return "Сервер может быть доступен, но браузер не разрешил показать ответ из-за CORS или другой политики безопасности. Это не доказывает, что домен заблокирован.";
  return "Браузер не смог выполнить запрос. Проверьте URL, доступность сервера, DNS, перенаправления и сетевые политики устройства.";
}

async function testUrl() {
  const btn = $("testBtn");
  btn.disabled = true;
  btn.textContent = "Проверка…";
  $("resultCard").classList.remove("hidden");

  let url;
  try {
    url = normalizeUrl($("url").value);
  } catch (e) {
    showResult({ok:false,type:"invalid",online:navigator.onLine,message:e.message,url:""});
    btn.disabled = false;
    btn.textContent = "Проверить";
    return;
  }

  const started = performance.now();
  const result = {
    url,
    online: navigator.onLine,
    ok: false,
    type: "unknown",
    status: null,
    responseType: null,
    duration: null,
    message: ""
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal
    });
    clearTimeout(timer);

    result.duration = Math.round(performance.now() - started);
    result.status = response.status;
    result.responseType = response.type;
    result.ok = response.ok;
    result.type = response.ok ? "success" : "http";
    result.message = response.ok
      ? "HTTP-ответ получен."
      : "Сервер ответил HTTP-статусом ошибки.";
  } catch (e) {
    result.duration = Math.round(performance.now() - started);

    if (e.name === "AbortError") {
      result.type = "timeout";
      result.message = "Время ожидания истекло (10 секунд).";
    } else if (e instanceof TypeError) {
      result.type = "cors";
      result.message = "Браузер заблокировал запрос или не разрешил получить междоменный ответ.";
    } else {
      result.type = "network";
      result.message = e.message || "Сетевой запрос не выполнен.";
    }
  }

  showResult(result);
  state.lastReport = result;
  btn.disabled = false;
  btn.textContent = "Проверить";
}

function showResult(r) {
  $("resultTitle").textContent =
    r.ok ? "Доступен" :
    r.type === "timeout" ? "Время ожидания истекло" :
    r.type === "invalid" ? "Некорректный URL" :
    "Запрос не выполнен";

  $("resultIcon").textContent = r.ok ? "✓" : "!";
  $("duration").textContent = r.duration == null ? "—" : r.duration + " мс";
  $("httpStatus").textContent = r.status ?? "—";
  $("responseType").textContent = r.responseType || r.type;
  $("onlineState").textContent = r.online ? "Да" : "Нет";
  $("timeValue").textContent = r.duration == null ? "—" : r.duration + " мс";
  $("resultMessage").textContent = r.message || "";
  $("explanation").textContent = explain(r);
}

function reportText() {
  if (!state.lastReport) return "WhitelistLab\nПроверка ещё не выполнялась.";

  const r = state.lastReport;
  return [
    "Диагностический отчёт WhitelistLab",
    "URL: " + r.url,
    "Интернет на устройстве: " + (r.online ? "да" : "нет"),
    "Результат: " + (r.ok ? "доступен" : r.type),
    "HTTP-статус: " + (r.status ?? "недоступен"),
    "Тип ответа: " + (r.responseType || "недоступен"),
    "Время: " + (r.duration != null ? r.duration + " мс" : "недоступно"),
    "Сообщение: " + r.message,
    "",
    "Примечание: политики безопасности браузера могут скрывать подробности междоменных запросов."
  ].join("\n");
}

$("testBtn").addEventListener("click", testUrl);
$("url").addEventListener("keydown", e => {
  if (e.key === "Enter") testUrl();
});

$("copyBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(reportText());
    $("copyBtn").textContent = "Скопировано ✓";
    setTimeout(() => $("copyBtn").textContent = "Скопировать отчёт", 1400);
  } catch {
    alert("Браузер не разрешил доступ к буферу обмена.");
  }
});

$("shareBtn").addEventListener("click", async () => {
  const text = reportText();

  if (navigator.share) {
    try {
      await navigator.share({title: "Отчёт WhitelistLab", text});
      return;
    } catch {}
  }

  try {
    await navigator.clipboard.writeText(text);
    alert("Поделиться не удалось, поэтому отчёт скопирован в буфер обмена.");
  } catch {
    alert(text);
  }
});

window.addEventListener("online", setOnlineBadge);
window.addEventListener("offline", setOnlineBadge);
setOnlineBadge();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("sw.js").catch(() => {})
  );
}
