const $ = id => document.getElementById(id);
const state = { lastReport: null };

function setOnlineBadge() {
  const online = navigator.onLine;
  const badge = $("onlineBadge");
  badge.textContent = online ? "Online" : "Offline";
  badge.classList.toggle("offline", !online);
}

function normalizeUrl(value) {
  let url = value.trim();
  if (!url) throw new Error("Enter a URL.");
  if (!/^https?:\\/\\//i.test(url)) url = "https://" + url;
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Only HTTP and HTTPS URLs are supported.");
  return parsed.href;
}

function explain(r) {
  if (!r.online) return "Your device reports no internet connection. Check Wi-Fi/mobile data first.";
  if (r.ok) return "The browser received a successful HTTP response. This confirms browser-level reachability from this device, but it does not prove every app or protocol can reach the same host.";
  if (r.type === "timeout") return "The request timed out. Possible causes include server downtime, slow response, network filtering, or browser/network restrictions.";
  if (r.type === "cors") return "The server may be reachable, but the browser refused to expose the response because of CORS or another browser security policy. This is not proof that the domain is blocked.";
  return "The browser could not complete the request. Check the URL, server availability, DNS, redirects, and any network policy affecting this device.";
}

async function testUrl() {
  const btn = $("testBtn");
  btn.disabled = true; btn.textContent = "Testing…"; $("resultCard").classList.remove("hidden");

  let url;
  try { url = normalizeUrl($("url").value); }
  catch (e) {
    showResult({ok:false,type:"invalid",online:navigator.onLine,message:e.message,url:""});
    btn.disabled=false; btn.textContent="Test"; return;
  }

  const started = performance.now();
  const result = {url,online:navigator.onLine,ok:false,type:"unknown",status:null,responseType:null,duration:null,message:""};

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url,{method:"GET",mode:"cors",cache:"no-store",redirect:"follow",signal:controller.signal});
    clearTimeout(timer);
    result.duration=Math.round(performance.now()-started);
    result.status=response.status; result.responseType=response.type; result.ok=response.ok;
    result.type=response.ok?"success":"http";
    result.message=response.ok?"HTTP response received.":"The server responded with an HTTP error status.";
  } catch(e) {
    result.duration=Math.round(performance.now()-started);
    if(e.name==="AbortError"){result.type="timeout";result.message="Request timed out after 10 seconds."}
    else if(e instanceof TypeError){result.type="cors";result.message="The browser blocked or could not expose the cross-origin response."}
    else{result.type="network";result.message=e.message||"Network request failed."}
  }
  showResult(result); state.lastReport=result; btn.disabled=false; btn.textContent="Test";
}

function showResult(r) {
  $("resultTitle").textContent=r.ok?"Reachable":r.type==="timeout"?"Timed out":r.type==="invalid"?"Invalid URL":"Request failed";
  $("resultIcon").textContent=r.ok?"✓":"!";
  $("duration").textContent=r.duration==null?"—":r.duration+" ms";
  $("httpStatus").textContent=r.status??"—";
  $("responseType").textContent=r.responseType||r.type;
  $("onlineState").textContent=r.online?"Yes":"No";
  $("timeValue").textContent=r.duration==null?"—":r.duration+" ms";
  $("resultMessage").textContent=r.message||"";
  $("explanation").textContent=explain(r);
}

function reportText() {
  if(!state.lastReport) return "WhitelistLab\nNo test has been run yet.";
  const r=state.lastReport;
  return ["WhitelistLab network diagnostic","URL: "+r.url,"Device online: "+(r.online?"yes":"no"),
    "Result: "+(r.ok?"reachable":r.type),"HTTP status: "+(r.status??"not available"),
    "Response type: "+(r.responseType||"not available"),
    "Duration: "+(r.duration!=null?r.duration+" ms":"not available"),
    "Message: "+r.message,"","Note: browser security policies can prevent cross-origin details from being exposed."
  ].join("\n");
}

$("testBtn").addEventListener("click",testUrl);
$("url").addEventListener("keydown",e=>{if(e.key==="Enter")testUrl()});
$("copyBtn").addEventListener("click",async()=>{
  try{await navigator.clipboard.writeText(reportText());$("copyBtn").textContent="Copied ✓";setTimeout(()=>$("copyBtn").textContent="Copy report",1400)}
  catch{alert("Clipboard access is unavailable in this browser.")}
});
$("shareBtn").addEventListener("click",async()=>{
  const text=reportText();
  if(navigator.share){try{await navigator.share({title:"WhitelistLab report",text});return}catch{}}
  try{await navigator.clipboard.writeText(text);alert("Share is unavailable, so the report was copied to the clipboard.")}
  catch{alert(text)}
});
window.addEventListener("online",setOnlineBadge);
window.addEventListener("offline",setOnlineBadge);
setOnlineBadge();
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
