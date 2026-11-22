// /watch/: my YouTube subscriptions, in the browser only.
// Google sign-in -> subscriptions -> each Learn/Unwind/Snacks/Later channel's last 90 days of uploads -> a quiet list.
// Sign-in is read-only. The broader "manage your YouTube account" permission is asked for only once a playlist is
// set up (Save / Unsave). Categories, tags, removed videos and caches live in this browser's storage. Nothing is
// sent anywhere except to Google/YouTube. ?demo=1 shows fake data and never calls Google.
(() => {
  "use strict";

  const root = document.getElementById("watch");
  if (!root) return;

  const DEMO = new URLSearchParams(location.search).has("demo");
  const CLIENT_ID = root.dataset.clientId || "";
  const SCOPE = "https://www.googleapis.com/auth/youtube.readonly";
  const SCOPE_WRITE = "https://www.googleapis.com/auth/youtube"; // only asked for once a playlist is set up
  const API = "https://www.googleapis.com/youtube/v3";
  const TTL_SUBS = 24 * 60 * 60 * 1000;
  const TTL_VIDEOS = 15 * 60 * 1000;
  const SHORTS_MAX = 180; // seconds; YouTube has no "is a Short" flag
  const WINDOW_DAYS = 90; // each channel's videos from the last 3 months
  const WINDOW_MS = WINDOW_DAYS * 24 * 3600 * 1000;
  const PAGE_SIZE = 50; // playlistItems page size (the API maximum)
  const MAX_PAGES = 5; // safety cap: at most 250 videos per channel
  const CONCURRENCY = 6;
  const PAGE = 40;
  const STATUSES = [
    { id: "learn", label: "Learn" },
    { id: "unwind", label: "Unwind" }, // lean-back: podcasts, interviews
    { id: "snacks", label: "Snacks" }, // pure entertainment: chess, games, comedy. Not muted, not for learning
    { id: "later", label: "Later" },
    { id: "mute", label: "Mute" },
  ];
  // Two main views; everything else lives under Settings (a gear-style icon).
  const TABS = [
    { id: "learn", label: "Learn" },
    { id: "unwind", label: "Unwind" },
    { id: "snacks", label: "Snacks" },
    { id: "saved", label: "Saved" },
  ];
  const SUBS = [
    { id: "channels", label: "Channels" },
    { id: "later", label: "Later" },
    { id: "mute", label: "Mute" },
  ];
  // Built-in tags: always present, cannot be renamed or deleted. Others are added under Settings -> Channels -> Tags.
  const DEFAULT_TOPICS = [
    { id: "ai", label: "AI" },
    { id: "systems", label: "Systems" },
    { id: "leadership", label: "Leadership" },
    { id: "books", label: "Books" },
    { id: "finance", label: "Finance" },
    { id: "others", label: "Others" },
  ];
  const BUILTIN = new Set(DEFAULT_TOPICS.map((t) => t.id));
  const mergeTopics = (saved) => [...DEFAULT_TOPICS, ...(Array.isArray(saved) ? saved : []).filter((t) => t && typeof t.id === "string" && !BUILTIN.has(t.id))];

  // Emoji for the built-in tags and the status/action buttons (custom tags stay text).
  const TAG_ICONS = { ai: "🤖", systems: "🧩", leadership: "👑", books: "📚", finance: "💰", others: "📦" };
  const UI_ICONS = { learn: "🎓", unwind: "🍿", snacks: "🍫", later: "⏳", mute: "🔇", save: "📌", saved: "📌", remove: "✕" };

  // ---------- storage (every access guarded; falls back to memory) ----------
  const P = DEMO ? "yt.demo." : "yt.";
  const K = {
    token: P + "token",
    subs: P + "subs",
    videos: P + "videos",
    dur: P + "durations",
    tags: P + "tags",
    topics: P + "topics",
    tab: P + "tab",
    sub: P + "sub",
    shorts: P + "hideShorts",
    playlist: P + "playlist",
    dismissed: P + "dismissed",
    plitems: P + "plitems",
    setup: P + "setupDone",
  };
  const memory = new Map();
  const pick = (name) => {
    try {
      const s = window[name];
      s.setItem("__t", "1");
      s.removeItem("__t");
      return s;
    } catch (e) {
      return null;
    }
  };
  const local = pick("localStorage");
  const session = pick("sessionStorage");
  const read = (s, k, fb) => {
    if (memory.has(k)) return memory.get(k);
    if (!s) return fb;
    try {
      const v = s.getItem(k);
      return v == null ? fb : JSON.parse(v);
    } catch (e) {
      return fb;
    }
  };
  const write = (s, k, v) => {
    try {
      if (!s) throw new Error("no storage");
      s.setItem(k, JSON.stringify(v));
      memory.delete(k);
    } catch (e) {
      memory.set(k, v);
    }
  };
  const drop = (s, k) => {
    memory.delete(k);
    try {
      if (s) s.removeItem(k);
    } catch (e) {}
  };

  // ---------- state ----------
  const state = {
    tab: "learn", // "learn" | "unwind" | "snacks" | "saved" | "settings"
    sub: "channels", // inside Settings: "channels" | "later" | "mute"
    topic: null, // topic filter in the feed
    hideShorts: read(local, K.shorts, true) !== false,
    subs: read(local, K.subs, null), // {at, items:[{id,title}]}
    vids: read(local, K.videos, null), // {at, fetched:[channelId], items:[video]}
    dur: read(local, K.dur, {}), // videoId -> seconds
    tags: read(local, K.tags, {}), // channelId -> {status, topics:[id]}
    topics: mergeTopics(read(local, K.topics, null)),
    playlist: read(local, K.playlist, null), // {id, title}: the one playlist this page edits
    pl: read(local, K.plitems, null), // {at, items:[{itemId, videoId, title, channel, published}]}
    plBusy: false,
    plChoices: null, // playlists I already have, listed so one can be picked
    plName: "Watch later (page)",
    dismissed: read(local, K.dismissed, {}), // videoId -> time removed from the feed (local only)
    undo: null, // {id, title} of the last removed video
    limit: PAGE,
    playing: null,
    busy: false,
    error: "",
    note: "",
    fStatus: "all", // "all" or "none" (the Untagged-only checkbox)
    editTopic: null,
    confirmTopic: null,
    newTopic: "",
  };
  const savedTab = read(local, K.tab, "learn");
  const savedSub = read(local, K.sub, "channels");
  if (SUBS.some((t) => t.id === savedSub)) state.sub = savedSub;
  if (TABS.some((t) => t.id === savedTab) || savedTab === "settings") state.tab = savedTab;
  else if (SUBS.some((t) => t.id === savedTab)) {
    state.tab = "settings"; // older versions had these as top-level tabs
    state.sub = savedTab;
  }

  if (DEMO) seedDemo();

  // ---------- small helpers ----------
  const h = (tag, props, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) e.append(kid);
    return e;
  };

  const glyph = (ch) => h("span", { class: "w-ic", "aria-hidden": "true", text: ch });
  const UI = (k) => glyph(UI_ICONS[k]);
  const TAG = (id) => (TAG_ICONS[id] ? glyph(TAG_ICONS[id]) : null);
  // A button with an icon and text, or icon only (with a tooltip and a screen-reader label) to save space.
  const btn = (props, icon, label, iconOnly) =>
    h("button", { type: "button", title: icon ? label : null, "aria-label": icon && iconOnly ? label : null, ...props }, icon ? (iconOnly ? [icon] : [icon, " ", label]) : [label]);

  class ApiError extends Error {
    constructor(kind, detail) {
      super(kind);
      this.kind = kind;
      this.detail = detail || "";
    }
  }

  const getToken = () => {
    const t = read(session, K.token, null);
    return t && t.expiresAt > Date.now() ? t.token : null;
  };
  const hasSession = () => DEMO || !!getToken();
  const canWrite = () => {
    const t = read(session, K.token, null);
    return !!(t && t.expiresAt > Date.now() && t.write);
  };
  const statusOf = (id) => (state.tags[id] && state.tags[id].status) || "none";
  const topicsOf = (id) => (state.tags[id] && state.tags[id].topics) || [];
  const saveTags = () => write(local, K.tags, state.tags);
  const saveTopics = () => write(local, K.topics, state.topics);
  const channels = () => (state.subs ? state.subs.items : []);
  const channelById = (id) => channels().find((c) => c.id === id);
  const isShort = (id) => state.dur[id] > 0 && state.dur[id] <= SHORTS_MAX;
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

  const fmtDur = (s) => {
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = String(s % 60).padStart(2, "0");
    return hh ? `${hh}:${String(mm).padStart(2, "0")}:${ss}` : `${mm}:${ss}`;
  };
  const parseDur = (iso) => {
    const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(iso || "");
    if (!m) return 0;
    return (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0);
  };
  const ago = (iso) => {
    const t = Date.parse(iso);
    if (!t) return "";
    const s = (Date.now() - t) / 1000;
    if (s < 0) return "Upcoming";
    if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
    if (s < 86400) return `${Math.round(s / 3600)} h ago`;
    const d = Math.round(s / 86400);
    if (d === 1) return "Yesterday";
    if (d < 14) return `${d} d ago`;
    if (d < 60) return `${Math.round(d / 7)} w ago`;
    return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  // ---------- Google sign-in (token flow, no refresh token) ----------
  let tokenClient = null;
  let signInUnavailable = false;
  let pending = null;
  const inAppBrowser = /FBAN|FBAV|Instagram|Snapchat|Twitter|LinkedInApp|Line\/|MicroMessenger|; wv\)/i.test(navigator.userAgent);

  const initGoogle = () => {
    if (DEMO || !CLIENT_ID || inAppBrowser) return;
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    const unavailable = () => {
      signInUnavailable = true;
      state.error = "Google sign-in could not load. An ad blocker may be blocking it.";
      render();
    };
    s.onload = () => {
      // Some blockers answer with an empty script: it "loads" but Google's code is not there.
      if (!(window.google && window.google.accounts && window.google.accounts.oauth2)) return unavailable();
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (r) => {
          if (!pending) return;
          const p = pending;
          pending = null;
          if (r.error || !r.access_token) return p.rej(new ApiError("auth", r.error));
          // Which permissions did Google grant? Compare each granted scope for an exact match, never as a substring,
          // so ".../auth/youtube.readonly" can never be mistaken for ".../auth/youtube".
          const granted = String(r.scope || "").split(/\s+/);
          write(session, K.token, {
            token: r.access_token,
            expiresAt: Date.now() + (Number(r.expires_in) || 3600) * 1000 - 60000,
            write: granted.some((scope) => scope === SCOPE_WRITE),
          });
          p.res();
        },
        error_callback: (e) => {
          if (!pending) return;
          const p = pending;
          pending = null;
          p.rej(new ApiError(e && e.type === "popup_failed_to_open" ? "popup" : "closed"));
        },
      });
      render();
    };
    s.onerror = unavailable;
    document.head.append(s);
  };

  // Must run straight from a click, so the sign-in window is not blocked.
  // With a playlist set up the write permission is asked for up front, so there is no second prompt.
  const signIn = (needWrite) =>
    new Promise((res, rej) => {
      if (!tokenClient) return rej(new ApiError("gsi"));
      pending = { res, rej };
      tokenClient.requestAccessToken(needWrite || state.playlist ? { scope: SCOPE + " " + SCOPE_WRITE } : {});
    });

  const signOut = () => {
    const t = getToken();
    if (t && window.google && window.google.accounts) window.google.accounts.oauth2.revoke(t, () => {});
    drop(session, K.token);
    for (const k of [K.subs, K.videos, K.dur, K.plitems]) drop(local, k);
    state.pl = null;
    state.subs = null;
    state.vids = null;
    state.dur = {};
    state.error = "";
    state.note = "Signed out. Saved lists are cleared; your tags are kept.";
    closePlayer();
    render();
  };

  // ---------- YouTube API ----------
  const api = async (path, params, opt = {}) => {
    const token = getToken();
    if (!token) throw new ApiError("auth");
    const url = new URL(API + path);
    for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v);
    const r = await fetch(url, {
      method: opt.method || "GET",
      headers: { Authorization: "Bearer " + token, ...(opt.body ? { "Content-Type": "application/json" } : {}) },
      body: opt.body ? JSON.stringify(opt.body) : undefined,
    });
    if (r.status === 401) {
      drop(session, K.token);
      throw new ApiError("auth");
    }
    if (!r.ok) {
      let reason = "";
      try {
        const j = await r.json();
        reason = (j.error && j.error.errors && j.error.errors[0] && j.error.errors[0].reason) || (j.error && j.error.message) || "";
      } catch (e) {}
      if (r.status === 403 && /quota/i.test(reason)) throw new ApiError("quota", reason);
      if (r.status === 403 && /insufficient|scope/i.test(reason)) throw new ApiError("scope", reason);
      if (r.status === 404) throw new ApiError("notfound", reason);
      throw new ApiError("http", `${r.status} ${reason}`);
    }
    return r.status === 204 ? {} : r.json();
  };

  const fetchSubs = async () => {
    const out = [];
    let pageToken;
    do {
      const j = await api("/subscriptions", { part: "snippet", mine: "true", maxResults: 50, pageToken });
      for (const it of j.items || []) {
        const id = it.snippet && it.snippet.resourceId && it.snippet.resourceId.channelId;
        if (id) out.push({ id, title: it.snippet.title || id });
      }
      pageToken = j.nextPageToken;
    } while (pageToken);
    out.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
    return out;
  };

  // A channel's uploads playlist id is its channel id with "UC" swapped for "UU".
  // The uploads playlist lists newest first, so keep reading pages until a video older than the window shows up.
  const fetchChannelVideos = async (ch) => {
    const cutoff = Date.now() - WINDOW_MS;
    const out = [];
    let pageToken;
    try {
      for (let page = 0; page < MAX_PAGES; page++) {
        const j = await api("/playlistItems", {
          part: "snippet,contentDetails",
          playlistId: "UU" + ch.id.slice(2),
          maxResults: PAGE_SIZE,
          pageToken,
        });
        let reachedOld = false;
        for (const it of j.items || []) {
          if (!it.contentDetails || !it.contentDetails.videoId || it.snippet.title === "Private video" || it.snippet.title === "Deleted video") continue;
          const published = it.contentDetails.videoPublishedAt || it.snippet.publishedAt;
          if (Date.parse(published) < cutoff) {
            reachedOld = true;
            continue;
          }
          out.push({ id: it.contentDetails.videoId, title: it.snippet.title, channelId: ch.id, channel: ch.title, published });
        }
        pageToken = j.nextPageToken;
        if (reachedOld || !pageToken) break;
      }
      return out;
    } catch (e) {
      if (e.kind === "notfound") return [];
      throw e;
    }
  };

  const pool = async (items, n, fn) => {
    const out = new Array(items.length);
    let i = 0;
    await Promise.all(
      Array.from({ length: Math.min(n, items.length) }, async () => {
        while (i < items.length) {
          const idx = i++;
          out[idx] = await fn(items[idx]);
        }
      })
    );
    return out;
  };

  const fillDurations = async (items) => {
    const need = [...new Set(items.map((v) => v.id).filter((id) => !(id in state.dur)))];
    for (let i = 0; i < need.length; i += 50) {
      const chunk = need.slice(i, i + 50);
      const j = await api("/videos", { part: "contentDetails", id: chunk.join(","), maxResults: 50 });
      for (const it of j.items || []) state.dur[it.id] = parseDur(it.contentDetails && it.contentDetails.duration);
    }
    // keep only what the list still uses; durations of 0 (live, premieres) are re-checked next time
    const keep = {};
    for (const v of items) if (state.dur[v.id] > 0) keep[v.id] = state.dur[v.id];
    write(local, K.dur, keep);
  };

  // ---------- one playlist: save and remove ----------
  const savedMap = () => new Map((state.pl ? state.pl.items : []).map((i) => [i.videoId, i.itemId]));
  const savePl = () => write(local, K.plitems, state.pl);

  const loadPlaylist = async () => {
    if (!state.playlist || DEMO) return;
    const items = [];
    let pageToken;
    try {
      do {
        const j = await api("/playlistItems", { part: "snippet,contentDetails", playlistId: state.playlist.id, maxResults: 50, pageToken });
        for (const it of j.items || []) {
          if (!it.contentDetails || !it.contentDetails.videoId) continue;
          items.push({
            itemId: it.id,
            videoId: it.contentDetails.videoId,
            title: it.snippet.title,
            channel: it.snippet.videoOwnerChannelTitle || "",
            published: it.contentDetails.videoPublishedAt || it.snippet.publishedAt,
          });
        }
        pageToken = j.nextPageToken;
      } while (pageToken && items.length < 500);
    } catch (e) {
      if (e.kind !== "notfound") throw e;
      state.note = "Your playlist could not be found on YouTube. Forget it under Channels and create a new one.";
      return;
    }
    state.pl = { at: Date.now(), items };
    savePl();
  };

  // Runs a playlist change. The write-permission window must open straight from the click, so the
  // sign-in call comes first and nothing is awaited before it.
  const plAction = async (fn) => {
    if (state.plBusy) return;
    const ask = DEMO || canWrite() ? Promise.resolve() : signIn(true);
    state.plBusy = true;
    state.error = "";
    state.note = "";
    render();
    try {
      await ask;
      if (!DEMO && !canWrite()) throw new ApiError("scope");
      await fn();
    } catch (e) {
      state.error = explain(e);
    } finally {
      state.plBusy = false;
      render();
    }
  };

  const createPlaylist = (name) =>
    plAction(async () => {
      name = name.trim().slice(0, 100) || "Watch later (page)";
      if (DEMO) state.playlist = { id: "PLdemo0000000000", title: name };
      else {
        const j = await api("/playlists", { part: "snippet,status" }, { method: "POST", body: { snippet: { title: name }, status: { privacyStatus: "private" } } });
        state.playlist = { id: j.id, title: (j.snippet && j.snippet.title) || name };
      }
      write(local, K.playlist, state.playlist);
      state.pl = { at: Date.now(), items: [] };
      savePl();
      state.note = `Created the private playlist “${state.playlist.title}”.`;
    });

  const addToPlaylist = (v) =>
    plAction(async () => {
      if (!state.pl) await loadPlaylist();
      if (savedMap().has(v.id)) return;
      let itemId = "demo" + Date.now();
      if (!DEMO) {
        const j = await api("/playlistItems", { part: "snippet" }, { method: "POST", body: { snippet: { playlistId: state.playlist.id, resourceId: { kind: "youtube#video", videoId: v.id } } } });
        itemId = j.id;
      }
      const items = state.pl ? state.pl.items : [];
      state.pl = { at: state.pl ? state.pl.at : Date.now(), items: [...items, { itemId, videoId: v.id, title: v.title, channel: v.channel, published: v.published }] };
      savePl();
    });

  const removeFromPlaylist = (itemId) =>
    plAction(async () => {
      if (!DEMO) {
        try {
          await api("/playlistItems", { id: itemId }, { method: "DELETE" });
        } catch (e) {
          if (e.kind !== "notfound") throw e; // already gone on YouTube
        }
      }
      state.pl = { ...state.pl, items: state.pl.items.filter((i) => i.itemId !== itemId) };
      savePl();
    });

  // List my playlists (read-only, 1 unit) so a second device can pick the one that already exists.
  const choosePlaylist = async () => {
    if (state.plBusy) return;
    const ask = DEMO || hasSession() ? Promise.resolve() : signIn(); // read-only sign-in; must start from the click
    state.plBusy = true;
    state.error = "";
    render();
    try {
      await ask;
      if (DEMO) state.plChoices = [{ id: "PLdemo0000000000", title: "Watch later (page)" }, { id: "PLdemo0000000001", title: "Another playlist" }];
      else {
        const out = [];
        let pageToken;
        do {
          const j = await api("/playlists", { part: "snippet", mine: "true", maxResults: 50, pageToken });
          for (const it of j.items || []) out.push({ id: it.id, title: it.snippet.title });
          pageToken = j.nextPageToken;
        } while (pageToken && out.length < 200);
        state.plChoices = out;
      }
    } catch (e) {
      state.error = explain(e);
    } finally {
      state.plBusy = false;
      render();
    }
  };
  const usePlaylist = (p) => {
    state.playlist = { id: p.id, title: p.title };
    write(local, K.playlist, state.playlist);
    state.pl = null;
    state.plChoices = null;
    state.note = `Now saving to “${p.title}”.`;
    render();
    if (getToken()) refresh();
  };

  const forgetPlaylist = () => {
    state.playlist = null;
    state.pl = null;
    drop(local, K.playlist);
    drop(local, K.plitems);
    state.error = "";
    state.note = "Playlist forgotten. It still exists on YouTube.";
    render();
  };

  // ---------- remove a video from the feed (hidden for good, on this browser) ----------
  const dismissVideo = (v) => {
    const now = Date.now();
    state.dismissed[v.id] = now;
    for (const [id, at] of Object.entries(state.dismissed)) if (now - at > 120 * 24 * 3600 * 1000) delete state.dismissed[id]; // old ones fall out of every feed anyway
    write(local, K.dismissed, state.dismissed);
    state.undo = { id: v.id };
    state.error = "";
    state.note = `Removed “${v.title.length > 50 ? v.title.slice(0, 50) + "…" : v.title}”.`;
    render();
  };
  const undoDismiss = () => {
    if (!state.undo) return;
    delete state.dismissed[state.undo.id];
    write(local, K.dismissed, state.dismissed);
    state.undo = null;
    state.note = "";
    render();
  };
  const restoreDismissed = () => {
    state.dismissed = {};
    drop(local, K.dismissed);
    state.undo = null;
    state.note = "Removed videos are back in your feed.";
    render();
  };
  const dismissControl = (v) => btn({ class: "w-act", "data-fk": "dm-" + v.id, onclick: () => dismissVideo(v) }, UI("remove"), "Remove", true);

  // Only Learn, Unwind, Snacks and Later channels have a feed, so only they are fetched (untagged and muted cost no quota).
  const inFeed = (c) => ["learn", "unwind", "snacks", "later"].includes(statusOf(c.id));
  const needsFetch = () => {
    if (!state.subs || !state.vids) return false;
    return channels().some((c) => inFeed(c) && !state.vids.fetched.includes(c.id));
  };

  // First sign-in: nothing is tagged yet, so every feed is empty. Open Settings -> Channels once, showing the untagged
  // channels, so tagging starts straight away. It happens at most once, and only while no channel is in a feed.
  const maybeFirstRun = () => {
    if (DEMO || state.tab === "settings" || read(local, K.setup, false)) return;
    if (!state.subs || !channels().length || channels().some(inFeed)) return;
    write(local, K.setup, true);
    state.fStatus = "none";
    state.note = "Choose a category for each channel to build your feed.";
    openSettings("channels");
  };

  // Subscriptions are cached 24 h, videos 15 min. A normal call only fetches what is stale or missing.
  async function refresh({ force = false, reloadSubs = false } = {}) {
    if (state.busy) return;
    state.busy = true;
    state.error = "";
    state.note = "";
    state.undo = null;
    render();
    try {
      const now = Date.now();
      if (!state.subs || reloadSubs || now - state.subs.at > TTL_SUBS) {
        state.subs = { at: now, items: await fetchSubs() };
        write(local, K.subs, state.subs);
      }
      const live = new Set(channels().map((c) => c.id));
      let vc = state.vids;
      if (force || !vc || vc.win !== WINDOW_DAYS || now - vc.at > TTL_VIDEOS) vc = { at: now, win: WINDOW_DAYS, fetched: [], items: [] };
      const wanted = channels().filter((c) => inFeed(c) && !vc.fetched.includes(c.id));
      const failed = [];
      let quotaHit = false;
      const results = await pool(wanted, CONCURRENCY, async (c) => {
        if (quotaHit) return null; // the daily quota is gone: stop spending requests, keep what already loaded
        try {
          return { c, items: await fetchChannelVideos(c) };
        } catch (e) {
          if (e.kind === "auth") throw e;
          if (e.kind === "quota") {
            quotaHit = true;
            return null;
          }
          failed.push(c.title);
          return null;
        }
      });
      let loaded = 0;
      for (const r of results) {
        if (!r) continue;
        loaded++;
        vc.items = vc.items.filter((v) => v.channelId !== r.c.id); // replace, never duplicate
        vc.fetched.push(r.c.id);
        vc.items.push(...r.items);
      }
      // A channel that could not be refreshed keeps the videos it had before, so a refresh never leaves less than it found.
      if (vc !== state.vids && state.vids) {
        for (const c of wanted) {
          if (!vc.fetched.includes(c.id)) vc.items.push(...state.vids.items.filter((v) => v.channelId === c.id));
        }
      }
      if (quotaHit && !loaded && !(state.vids && state.vids.items.length)) throw new ApiError("quota"); // nothing to show at all
      vc.items = vc.items.filter((v) => live.has(v.channelId));
      let lengthsFailed = quotaHit; // no requests left to look up lengths
      if (!quotaHit) {
        try {
          await fillDurations(vc.items);
        } catch (e) {
          if (e.kind === "auth") throw e;
          lengthsFailed = true; // keep the videos; Shorts just cannot be told apart this time
        }
      }
      state.vids = vc;
      write(local, K.videos, vc);
      if (state.playlist && !quotaHit && (force || !state.pl || now - state.pl.at > TTL_VIDEOS)) {
        try {
          await loadPlaylist();
        } catch (e) {
          if (e.kind === "auth") throw e;
        }
      }
      const notes = [];
      if (quotaHit) notes.push(`YouTube's daily quota ran out after ${loaded} of ${wanted.length} channel${wanted.length === 1 ? "" : "s"}. The rest load on a later refresh; the quota resets at midnight Pacific time.`);
      if (failed.length) notes.push(`${failed.length} channel${failed.length > 1 ? "s" : ""} could not be loaded. Refresh to try again.`);
      if (lengthsFailed && !quotaHit) notes.push("Video lengths could not be checked, so Shorts may show.");
      if (notes.length) state.note = notes.join(" ");
      maybeFirstRun();
    } catch (e) {
      state.error = explain(e);
    } finally {
      state.busy = false;
      render();
    }
  }

  const explain = (e) => {
    switch (e.kind) {
      case "auth":
        return "Your sign-in has expired or was refused. Sign in again.";
      case "quota":
        return "YouTube's daily quota is used up. It resets at midnight Pacific time." + (state.vids ? " Saved videos are still shown." : "");
      case "popup":
        return "The sign-in window was blocked. Allow pop-ups for this site and try again.";
      case "closed":
        return "The sign-in window was closed before finishing.";
      case "scope":
        return "Playlist changes need the extra YouTube permission. Try again and allow it.";
      case "notfound":
        return "YouTube could not find that playlist or item. If the playlist was deleted, forget it under Channels and create a new one.";
      case "gsi":
        return "Google sign-in is not ready. Wait a moment and try again, or turn off your ad blocker.";
      default:
        return e instanceof TypeError ? "No connection to YouTube. Check your network and try again." : `Something went wrong (${e.detail || e.message}).`;
    }
  };

  // Button handlers: sign-in first (synchronously, inside the click), then load.
  const onRefresh = async () => {
    try {
      if (!hasSession()) await signIn();
    } catch (e) {
      state.error = explain(e);
      return render();
    }
    if (DEMO) return render();
    refresh({ force: true });
  };
  const onSignIn = async () => {
    try {
      await signIn();
    } catch (e) {
      state.error = explain(e);
      return render();
    }
    refresh();
  };

  // ---------- tag operations ----------
  const touch = (id, fn) => {
    const t = { status: null, topics: [], ...(state.tags[id] || {}) };
    t.topics = t.topics.slice();
    fn(t);
    if (!t.status && !t.topics.length) delete state.tags[id];
    else state.tags[id] = { ...(t.status ? { status: t.status } : {}), topics: t.topics };
  };
  const afterTagChange = () => {
    saveTags();
    render();
    if (needsFetch() && getToken()) refresh();
  };
  const setStatus = (id, status) => {
    touch(id, (t) => (t.status = status));
    afterTagChange();
  };
  const toggleTopic = (id, topicId) => {
    touch(id, (t) => {
      t.topics = t.topics.includes(topicId) ? t.topics.filter((x) => x !== topicId) : [...t.topics, topicId];
    });
    afterTagChange();
  };
  const addTopic = (label) => {
    label = label.trim().slice(0, 30);
    if (!label) return null;
    const existing = state.topics.find((t) => t.label.toLowerCase() === label.toLowerCase());
    if (existing) return existing.id;
    let id = slug(label) || "t" + Date.now();
    const base = id;
    for (let n = 2; state.topics.some((t) => t.id === id); n++) id = `${base}-${n}`;
    state.topics.push({ id, label });
    saveTopics();
    return id;
  };
  const deleteTopic = (topicId) => {
    if (BUILTIN.has(topicId)) return;
    state.topics = state.topics.filter((t) => t.id !== topicId);
    for (const id of Object.keys(state.tags)) touch(id, (t) => (t.topics = t.topics.filter((x) => x !== topicId)));
    if (state.topic === topicId) state.topic = null;
    saveTopics();
    saveTags();
  };

  const exportTags = () => {
    const blob = new Blob([JSON.stringify({ version: 1, tags: state.tags, topics: state.topics, playlist: state.playlist, dismissed: state.dismissed }, null, 2)], { type: "application/json" });
    const a = h("a", { href: URL.createObjectURL(blob), download: "watch-tags.json" });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const importTags = async (file) => {
    try {
      const d = JSON.parse(await file.text());
      if (!d || typeof d.tags !== "object" || !Array.isArray(d.topics)) throw new Error("shape");
      const okTopics = d.topics.filter((t) => t && /^[a-z0-9-]{1,40}$/.test(t.id) && typeof t.label === "string" && t.label.trim() && t.label.length <= 30);
      for (const t of okTopics) if (!state.topics.some((x) => x.id === t.id)) state.topics.push({ id: t.id, label: t.label.trim() });
      const known = new Set(state.topics.map((t) => t.id));
      let n = 0;
      for (const [id, t] of Object.entries(d.tags)) {
        if (!/^UC[\w-]{22}$/.test(id) || !t || typeof t !== "object") continue;
        const status = STATUSES.some((s) => s.id === t.status) ? t.status : null;
        const topics = (Array.isArray(t.topics) ? t.topics : []).filter((x) => known.has(x));
        if (!status && !topics.length) continue;
        state.tags[id] = { ...(status ? { status } : {}), topics };
        n++;
      }
      const pl = d.playlist;
      if (!state.playlist && pl && /^PL[\w-]{10,}$/.test(String(pl.id)) && typeof pl.title === "string") {
        state.playlist = { id: pl.id, title: pl.title.slice(0, 100) };
        write(local, K.playlist, state.playlist);
      }
      // removed videos: merge, keeping the later time for any video that is in both
      let removed = 0;
      if (d.dismissed && typeof d.dismissed === "object" && !Array.isArray(d.dismissed)) {
        for (const [vid, at] of Object.entries(d.dismissed).slice(0, 5000)) {
          if (!/^[\w-]{6,20}$/.test(vid) || !Number.isFinite(Number(at))) continue;
          state.dismissed[vid] = Math.max(Number(at), state.dismissed[vid] || 0);
          removed++;
        }
        write(local, K.dismissed, state.dismissed);
      }
      saveTopics();
      saveTags();
      state.error = "";
      state.note = `Imported ${n} channel${n === 1 ? "" : "s"}${removed ? ` and ${removed} removed video${removed === 1 ? "" : "s"}` : ""}.`;
      if ((needsFetch() || (state.playlist && !state.pl)) && getToken()) refresh();
    } catch (e) {
      state.error = "That file is not an export from this page.";
    }
    render();
  };

  // ---------- player ----------
  let savedScroll = 0;
  const playerBox = h("section", { class: "w-player", hidden: true, "aria-label": "Video player" });
  const play = (v) => {
    if (!state.playing) savedScroll = window.scrollY;
    state.playing = v;
    renderPlayer();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: Math.max(0, playerBox.getBoundingClientRect().top + window.scrollY - 16), behavior: reduce ? "auto" : "smooth" });
  };
  function closePlayer() {
    if (!state.playing) return;
    state.playing = null;
    renderPlayer();
    window.scrollTo({ top: savedScroll, behavior: "auto" });
  }
  // Share: always the video's own YouTube link (never this page's address). Phone share sheet on touch devices, otherwise copy it.
  let shareNote = "";
  let shareTimer = null;
  const shareVideo = async (v) => {
    const url = `https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}`;
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title: v.title, url });
        return;
      } catch (e) {
        if (e && e.name === "AbortError") return; // closed the share sheet
      }
    }
    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch (e) {
      try {
        const box = document.createElement("textarea");
        box.value = url;
        box.setAttribute("readonly", "");
        box.style.cssText = "position:fixed;opacity:0";
        document.body.append(box);
        box.select();
        ok = document.execCommand("copy");
        box.remove();
      } catch (e2) {}
    }
    shareNote = ok ? `Copied ${url.replace("https://www.", "")}` : "Could not copy";
    fillNowActions();
    clearTimeout(shareTimer);
    shareTimer = setTimeout(() => { shareNote = ""; fillNowActions(); }, 2000);
  };

  let nowActions = null;
  const fillNowActions = () => {
    const v = state.playing;
    if (!v || !nowActions) return;
    nowActions.replaceChildren(...[
      saveControl(v, true),
      btn({ class: "w-act", "data-fk": "p-share", onclick: () => shareVideo(v) }, glyph("🔗"), shareNote || "Share", false),
      DEMO ? null : h("a", { href: `https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}`, rel: "noopener", target: "_blank", text: "Open on YouTube" }),
      h("button", { type: "button", "data-fk": "p-close", onclick: closePlayer, text: "Close" }),
    ].filter(Boolean));
  };
  function renderPlayer() {
    const v = state.playing;
    playerBox.replaceChildren();
    playerBox.hidden = !v;
    nowActions = null;
    if (!v) return;
    nowActions = h("div", { class: "w-now-actions" });
    const frame = DEMO
      ? h("div", { class: "w-frame w-frame-demo" }, h("p", { text: "Demo mode: no video is loaded." }))
      : h("div", { class: "w-frame" }, h("iframe", {
          src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?rel=0&autoplay=1&playsinline=1`,
          title: v.title,
          allow: "autoplay; encrypted-media; picture-in-picture; fullscreen",
          allowfullscreen: true,
          referrerpolicy: "strict-origin-when-cross-origin",
        }));
    playerBox.append(
      frame,
      h("div", { class: "w-now" },
        h("div", {}, h("p", { class: "w-now-title", text: v.title }), h("p", { class: "w-now-meta", text: v.channel })),
        nowActions)
    );
    fillNowActions();
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.playing) closePlayer();
  });

  // ---------- views ----------
  // Category buttons (Learn / Unwind / Snacks / Later / Mute) and tag buttons for one channel, on one line.
  // compact: everything icon-only (under a video). Otherwise categories show icon + word, tags stay icon-only.
  // New tags are added in Settings -> Channels -> Tags, not here.
  const tagEditor = (ch, p, compact) => {
    const st = statusOf(ch.id);
    const ts = topicsOf(ch.id);
    return h("div", { class: "w-te is-compact" },
      h("div", { class: "w-te-row" },
        h("div", { class: "w-seg", role: "group", "aria-label": "Channel category for " + ch.title },
          STATUSES.map((s) => btn({ "aria-pressed": String(st === s.id), "data-fk": p + "s-" + s.id, onclick: () => setStatus(ch.id, st === s.id ? null : s.id) }, UI(s.id), s.label, compact)))),
      h("div", { class: "w-te-row" },
        h("div", { class: "w-topics", role: "group", "aria-label": "Channel tags for " + ch.title },
          state.topics.map((t) => btn({ class: "w-chip", "aria-pressed": String(ts.includes(t.id)), "data-fk": p + "t-" + t.id, onclick: () => toggleTopic(ch.id, t.id) }, TAG(t.id), t.label, true)))));
  };

  // "Save" / "Saved · Unsave" for the one playlist. Shown once the playlist is set up and loaded.
  function saveControl(v, withText) {
    if (!state.playlist) return null;
    const itemId = savedMap().get(v.id); // not known until the playlist has loaded; Save then checks first
    return itemId
      ? btn({ class: "w-act is-on", "aria-pressed": "true", "data-fk": "rm-" + v.id, disabled: state.plBusy, onclick: () => removeFromPlaylist(itemId) }, UI("saved"), "Unsave", !withText)
      : btn({ class: "w-act", "data-fk": "sv-" + v.id, disabled: state.plBusy, onclick: () => addToPlaylist(v) }, UI("save"), "Save", !withText);
  }

  const videoRow = (v, noTags) => {
    const d = state.dur[v.id];
    const ch = channelById(v.channelId) || { id: v.channelId, title: v.channel };
    // Save / Unsave for the playlist; Remove hides it from the feed (not offered once saved, or in the Saved tab).
    // They sit at the right end of the tag line, or beside the channel name in the Saved tab (which has no tag line).
    const acts = h("span", { class: "w-acts" }, [saveControl(v), noTags || savedMap().has(v.id) ? null : dismissControl(v)].filter(Boolean));
    return h("article", { class: "w-v" },
      h("button", { type: "button", class: "w-thumb", tabindex: "-1", "aria-hidden": "true", onclick: () => play(v) },
        v.demo ? null : h("img", { src: `https://i.ytimg.com/vi/${encodeURIComponent(v.id)}/mqdefault.jpg`, alt: "", width: "320", height: "180", loading: "lazy" }),
        d > 0 ? h("span", { class: "w-dur", text: fmtDur(d) }) : null),
      h("div", { class: "w-body" },
        h("h3", { class: "w-title" }, h("button", { type: "button", "data-fk": "play-" + v.id, onclick: () => play(v), text: v.title })),
        h("p", { class: "w-meta" }, [v.channel, ago(v.published)].filter(Boolean).join(" · "), noTags ? acts : null)),
      noTags ? null : h("div", { class: "w-tags" }, tagEditor(ch, "v" + v.id + "-", true), acts));
  };

  const feedView = () => {
    const out = [];
    const tab = state.tab === "settings" ? state.sub : state.tab; // a main tab, or "later" inside Settings
    const used = state.topics.filter((t) => channels().some((c) => statusOf(c.id) === tab && topicsOf(c.id).includes(t.id)));
    if (used.length) {
      out.push(h("div", { class: "w-chips", role: "group", "aria-label": "Filter by tag" },
        h("button", { type: "button", class: "w-chip", "aria-pressed": String(!state.topic), "data-fk": "f-all", onclick: () => { state.topic = null; state.limit = PAGE; render(); }, text: "All" }),
        used.map((t) => btn({ class: "w-chip", "aria-pressed": String(state.topic === t.id), "data-fk": "f-" + t.id, onclick: () => { state.topic = state.topic === t.id ? null : t.id; state.limit = PAGE; render(); } }, TAG(t.id), t.label, true))));
    }
    const live = new Set(channels().map((c) => c.id));
    const saved = savedMap();
    const all = (state.vids ? state.vids.items : [])
      .filter((v) => live.has(v.channelId) && statusOf(v.channelId) === tab)
      .filter((v) => !state.topic || topicsOf(v.channelId).includes(state.topic))
      .filter((v) => !(state.hideShorts && isShort(v.id)))
      .filter((v) => !(tab !== "later" && saved.has(v.id))) // already saved: it lives in the Saved tab
      .filter((v) => !state.dismissed[v.id])
      .filter((v) => Date.parse(v.published) >= Date.now() - WINDOW_MS)
      .sort((a, b) => Date.parse(b.published) - Date.parse(a.published));
    if (!all.length) {
      const inTab = channels().filter((c) => statusOf(c.id) === tab).length;
      let msg;
      if (state.busy) msg = "Loading…";
      else if (!state.vids) msg = "Nothing loaded yet. Use Refresh (↻) to try again.";
      else if (!inTab) {
        const open = channels().filter((c) => statusOf(c.id) === "none").length;
        msg = `No channels are tagged ${{ learn: "Learn", unwind: "Unwind", snacks: "Snacks", later: "Later" }[tab]} yet. Open Settings (the gear icon) to choose some${open ? ` (${open} untagged)` : ""}.`;
      }
      else msg = "No videos to show here. Try Refresh (↻), or turn on Show Shorts in Settings.";
      out.push(h("p", { class: "w-empty", text: msg }));
      return out;
    }
    const list = h("div", { class: "w-list" }, all.slice(0, state.limit).map((v) => videoRow(v)));
    out.push(list);
    if (all.length > state.limit) out.push(h("p", { class: "w-more-row" }, h("button", { type: "button", "data-fk": "show-more", onclick: () => { state.limit += PAGE; render(); }, text: `Show more (${all.length - state.limit} left)` })));
    return out;
  };

  const channelsView = () => {
    const rows = channels().filter((c) => state.fStatus !== "none" || statusOf(c.id) === "none");
    const list = h("div", { class: "w-channels" }, rows.map((c) =>
      h("div", { class: "w-ch" },
        h("div", { class: "w-ch-name" }, h("span", { text: c.title })),
        tagEditor(c, "c" + c.id + "-"))));

    // topics
    const topicRows = state.topics.map((t) => {
      const n = channels().filter((c) => topicsOf(c.id).includes(t.id)).length;
      if (state.editTopic === t.id) {
        return h("li", {}, h("form", { class: "w-add", onsubmit: (e) => { e.preventDefault(); const val = e.target.elements.l.value.trim().slice(0, 30); if (val) { t.label = val; saveTopics(); } state.editTopic = null; render(); } },
          h("input", { name: "l", type: "text", value: t.label, maxlength: "30", "aria-label": "Tag name", "data-fk": "te-" + t.id }),
          h("button", { type: "submit", text: "Save" }),
          h("button", { type: "button", onclick: () => { state.editTopic = null; render(); }, text: "Cancel" })));
      }
      const confirming = state.confirmTopic === t.id;
      return h("li", {}, h("span", { class: "w-tname" }, TAG(t.id), TAG(t.id) ? " " : null, t.label), h("span", { class: "w-n", text: `${n} channel${n === 1 ? "" : "s"}` }),
        BUILTIN.has(t.id) ? h("span", { class: "w-n", text: "built in" }) : null,
        BUILTIN.has(t.id) ? null : h("button", { type: "button", class: "w-link", "data-fk": "tr-" + t.id, onclick: () => { state.editTopic = t.id; render(); }, text: "Rename" }),
        BUILTIN.has(t.id) ? null : h("button", { type: "button", class: "w-link", "data-fk": "td-" + t.id, onclick: () => { if (confirming) { state.confirmTopic = null; deleteTopic(t.id); } else state.confirmTopic = t.id; render(); }, text: confirming ? "Really delete?" : "Delete" }));
    });
    const topicBox = h("section", { class: "w-section" }, h("h2", { text: "Tags" }),
      h("ul", { class: "w-topic-list" }, topicRows),
      h("form", { class: "w-add", onsubmit: (e) => { e.preventDefault(); addTopic(state.newTopic); state.newTopic = ""; render(); } },
        h("input", { type: "text", maxlength: "30", value: state.newTopic, placeholder: "New tag", "aria-label": "New tag", autocomplete: "off", "data-fk": "nt", oninput: (e) => (state.newTopic = e.target.value) }),
        h("button", { type: "submit", text: "Add tag" })));

    const plLink = !state.playlist || DEMO ? null : h("a", { href: `https://www.youtube.com/playlist?list=${encodeURIComponent(state.playlist.id)}`, rel: "noopener", target: "_blank", text: "Open on YouTube" });
    const plBox = h("section", { class: "w-section" }, h("h2", { text: "Playlist" }),
      state.playlist
        ? [
            h("p", { class: "w-note" }, `Saving to “${state.playlist.title}”. `, plLink),
            h("div", { class: "w-row" }, h("button", { type: "button", "data-fk": "pl-forget", onclick: forgetPlaylist, text: "Forget playlist" })),
            h("p", { class: "w-note", text: "Forgetting only stops this page using it. The playlist stays on YouTube." }),
          ]
        : [
            h("p", { class: "w-note", text: "One private YouTube playlist that this page can add videos to and remove them from. Creating it asks for permission to manage your YouTube account." }),
            h("form", { class: "w-add", onsubmit: (e) => { e.preventDefault(); createPlaylist(state.plName); } },
              h("input", { name: "n", type: "text", maxlength: "100", value: state.plName, "aria-label": "Playlist name", autocomplete: "off", "data-fk": "pl-name", oninput: (e) => (state.plName = e.target.value) }),
              h("button", { type: "submit", disabled: state.plBusy, text: "Create private playlist" })),
            h("p", { class: "w-note", text: "Already made one, on another device? Use it instead of creating a second." }),
            state.plChoices
              ? (state.plChoices.length
                  ? h("div", { class: "w-row" }, state.plChoices.map((p) => h("button", { type: "button", "data-fk": "use-" + p.id, onclick: () => usePlaylist(p), text: p.title })))
                  : h("p", { class: "w-note", text: "No playlists found on this account." }))
              : h("div", { class: "w-row" }, h("button", { type: "button", "data-fk": "pl-choose", disabled: state.plBusy, onclick: choosePlaylist, text: "Use a playlist I already have" })),
          ]);

    const fileInput = h("input", { type: "file", accept: "application/json,.json", hidden: true, onchange: (e) => { if (e.target.files[0]) importTags(e.target.files[0]); e.target.value = ""; } });
    const dataBox = h("section", { class: "w-section" }, h("h2", { text: "Your data" }),
      h("p", { class: "w-note", text: "Categories, tags, the playlist and removed videos are saved in this browser only. Export them to back up or move to another device." }),
      h("div", { class: "w-row" },
        h("button", { type: "button", "data-fk": "export", onclick: exportTags, text: "Export" }),
        h("button", { type: "button", "data-fk": "import", onclick: () => fileInput.click(), text: "Import" }),
        fileInput,
        Object.keys(state.dismissed).length ? h("button", { type: "button", "data-fk": "restore", onclick: restoreDismissed, text: `Restore removed videos (${Object.keys(state.dismissed).length})` }) : null,
        DEMO ? null : h("button", { type: "button", "data-fk": "resubs", onclick: async () => { if (!hasSession()) { try { await signIn(); } catch (e) { state.error = explain(e); return render(); } } refresh({ force: true, reloadSubs: true }); }, text: "Reload subscriptions" }),
        DEMO ? null : h("button", { type: "button", "data-fk": "signout", onclick: signOut, text: "Sign out" })));

    return [rows.length ? list : h("p", { class: "w-empty", text: !state.subs ? "Sign in to load your subscriptions." : state.fStatus === "none" ? "Every channel is tagged." : "No channels yet." }), topicBox, plBox, dataBox];
  };

  const openSettings = (sub) => {
    state.tab = "settings";
    if (sub) state.sub = sub;
    state.limit = PAGE;
    state.topic = null;
    state.undo = null;
    write(local, K.tab, "settings");
    write(local, K.sub, state.sub);
    render();
  };

  const savedView = () => {
    if (!state.playlist) {
      return [
        h("p", { class: "w-empty", text: "No playlist yet. Create one under Settings → Channels to save videos here." }),
        h("p", {}, h("button", { type: "button", class: "w-link", "data-fk": "to-settings", onclick: () => openSettings("channels"), text: "Open settings" })),
      ];
    }
    const link = DEMO ? null : h("a", { href: `https://www.youtube.com/playlist?list=${encodeURIComponent(state.playlist.id)}`, rel: "noopener", target: "_blank", text: "Open on YouTube" });
    const head = h("p", { class: "w-hint" }, `“${state.playlist.title}” (private)`, link ? " · " : null, link);
    if (!state.pl) return [head, h("p", { class: "w-empty", text: hasSession() ? "Loading…" : "Sign in to load the playlist." })];
    if (!state.pl.items.length) return [head, h("p", { class: "w-empty", text: "Nothing saved yet. Use Save under any video." })];
    const rows = state.pl.items.slice().reverse().map((i) => videoRow({ id: i.videoId, title: i.title, channel: i.channel, published: i.published }, true));
    return [head, h("div", { class: "w-list" }, rows)];
  };

  // Settings: Channels, Later, Mute and the Shorts switch.
  const settingsView = () => {
    const untagged = channels().filter((c) => statusOf(c.id) === "none").length;
    const nav = h("nav", { class: "w-sub", "aria-label": "Settings sections" }, SUBS.map((t) =>
      h("button", { type: "button", "aria-current": state.sub === t.id ? "page" : null, "data-fk": "sub-" + t.id, onclick: () => { state.sub = t.id; state.limit = PAGE; state.topic = null; state.undo = null; write(local, K.sub, t.id); render(); } },
        t.label, t.id === "channels" && untagged ? h("span", { class: "w-count", text: String(untagged) }) : null)));
    const shorts = h("label", { class: "w-only" },
      h("input", { type: "checkbox", checked: !state.hideShorts, "data-fk": "shorts", onchange: (e) => { state.hideShorts = !e.target.checked; write(local, K.shorts, state.hideShorts); state.limit = PAGE; render(); } }),
      " Show Shorts");
    const untaggedOnly = state.sub === "channels"
      ? h("label", { class: "w-only" },
          h("input", { type: "checkbox", checked: state.fStatus === "none", "data-fk": "only-untagged", onchange: (e) => { state.fStatus = e.target.checked ? "none" : "all"; render(); } }),
          ` Untagged only (${untagged})`)
      : null;
    const toggles = h("div", { class: "w-toggles" }, shorts, untaggedOnly);
    const body = state.sub === "channels" ? channelsView() : state.sub === "mute" ? muteView() : feedView();
    return [nav, toggles, ...body];
  };

  // Muted channels are never fetched; this tab only lists them so one can be brought back.
  const muteView = () => {
    const rows = channels().filter((c) => statusOf(c.id) === "mute");
    return [
      h("p", { class: "w-hint", text: "Muted channels are never loaded. Choose Learn, Unwind, Snacks or Later to bring one back." }),
      rows.length
        ? h("div", { class: "w-channels" }, rows.map((c) => h("div", { class: "w-ch" }, h("div", { class: "w-ch-name" }, h("span", { text: c.title })), tagEditor(c, "x" + c.id + "-", true))))
        : h("p", { class: "w-empty", text: "No channels are muted." }),
    ];
  };

  const introView = () =>
    h("section", { class: "w-intro" },
      h("p", { class: "w-lede", text: "Your own YouTube subscriptions, in one quiet list." }),
      h("p", { text: "Sign in with Google to load them. It asks to read your YouTube data, and to manage one playlist only if you create one. Tags and saved lists stay in this browser." }),
      inAppBrowser
        ? h("p", { class: "w-warn", text: "Google blocks sign-in inside in-app browsers. Open this page in Safari or Chrome." })
        : h("button", { type: "button", class: "w-primary", "data-fk": "signin", onclick: onSignIn, disabled: !tokenClient, text: tokenClient ? "Sign in with Google" : signInUnavailable ? "Sign-in unavailable" : "Loading sign-in…" }));

  const statusLine = () => {
    if (state.error) return { text: state.error, err: true };
    if (state.busy) return { text: "Loading…" };
    const parts = [];
    if (state.note) parts.push(state.note);
    if (state.vids) parts.push(`Updated ${ago(new Date(state.vids.at).toISOString()) || "just now"}`);
    if (!hasSession() && state.vids) parts.push("Sign in to refresh");
    else if (needsFetch()) parts.push("Some channels are not loaded yet. Refresh.");
    return { text: parts.join(" · ") };
  };

  // Light / dark switch. This page defaults to dark and keeps its own saved choice ("watch-theme"), separate from the
  // blog's "theme", so a light blog never turns this page light. Set in watch.html and read by _includes/header.html.
  const themeNow = () => (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
  const toggleTheme = () => {
    const next = themeNow() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("watch-theme", next);
    } catch (e) {}
    render();
  };

  const bar = h("div", { class: "w-bar" });
  const statusEl = h("p", { class: "w-status", role: "status", "aria-live": "polite" });
  const main = h("div", { class: "w-main" });
  root.replaceChildren(bar, statusEl, playerBox, main);

  function render() {
    const active = document.activeElement;
    const fk = active && active.dataset && active.dataset.fk;
    const caret = active && typeof active.selectionStart === "number" && active.type !== "checkbox" ? active.selectionStart : null;

    const untagged = channels().filter((c) => statusOf(c.id) === "none").length;
    const settingsBtn = btn({ class: "w-icon-btn", "aria-pressed": String(state.tab === "settings"), "data-fk": "settings", onclick: () => {
      if (state.tab === "settings") { state.tab = "learn"; state.limit = PAGE; write(local, K.tab, "learn"); render(); } else openSettings();
    } }, glyph("⚙️"), "Settings", true);
    if (untagged && state.tab !== "settings") settingsBtn.append(h("span", { class: "w-count", text: String(untagged) }));
    const dark = themeNow() === "dark";
    const themeBtn = btn({ class: "w-icon-btn", "data-fk": "theme", onclick: toggleTheme }, glyph(dark ? "☀️" : "🌙"), dark ? "Light mode" : "Dark mode", true);
    bar.replaceChildren(
      h("nav", { class: "w-tabs", "aria-label": "Views" }, TABS.map((t) =>
        btn({ "aria-current": state.tab === t.id ? "page" : null, "data-fk": "tab-" + t.id, onclick: () => { state.tab = t.id; state.limit = PAGE; state.topic = null; state.undo = null; write(local, K.tab, t.id); render(); } }, UI(t.id), t.label, true))),
      h("div", { class: "w-actions" },
        !hasSession() && (state.subs || state.vids) ? h("button", { type: "button", "data-fk": "signin-bar", onclick: onSignIn, disabled: !tokenClient, text: "Sign in" }) : null,
        hasSession() || state.subs || state.vids
          ? btn({ class: "w-icon-btn", "data-fk": "refresh", disabled: state.busy, onclick: onRefresh }, glyph("↻"), "Refresh", true)
          : null,
        settingsBtn, themeBtn));

    const s = statusLine();
    statusEl.replaceChildren(...[s.text, state.undo ? " " : null, state.undo ? h("button", { type: "button", "data-fk": "undo", onclick: undoDismiss, text: "Undo" }) : null].filter((x) => x != null));
    statusEl.classList.toggle("is-error", !!s.err);

    const needsIntro = !DEMO && !hasSession() && !state.subs && !state.vids && state.tab !== "settings";
    main.replaceChildren(...(needsIntro ? [introView()] : state.tab === "settings" ? settingsView() : state.tab === "saved" ? savedView() : feedView()).filter(Boolean));
    fillNowActions();

    if (fk) {
      const next = root.querySelector(`[data-fk="${CSS.escape(fk)}"]`);
      if (next && next !== document.activeElement) {
        next.focus({ preventScroll: true });
        if (caret != null && typeof next.setSelectionRange === "function") {
          try { next.setSelectionRange(caret, caret); } catch (e) {}
        }
      }
    }
  }

  // ---------- demo data (fake, never calls Google) ----------
  function seedDemo() {
    const cid = (n) => "UC" + "demo".padEnd(21, "0") + n;
    const chans = [
      { id: cid(1), title: "Example Systems Lab" },
      { id: cid(2), title: "Example AI Notes" },
      { id: cid(3), title: "Example Leadership Talks" },
      { id: cid(4), title: "Example Quick Clips" },
      { id: cid(5), title: "Example Weekly Digest" },
      { id: cid(6), title: "Example Noise" },
      { id: cid(7), title: "Example Chess Club" },
    ];
    const H = 3600 * 1000;
    const spec = [
      [1, "Designing a queue that survives failure", 2, 2520],
      [2, "A tour of attention in transformers", 5, 1842],
      [3, "How to run a calm incident review", 9, 3105],
      [2, "Why small models can beat large ones", 20, 2410],
      [1, "Consistency without consensus, explained", 30, 1675],
      [4, "One idea in a minute", 3, 45],
      [4, "Another quick clip", 40, 150],
      [5, "This week in engineering", 50, 912],
      [6, "Reacting to things, part 12", 6, 733],
      [3, "Writing a decision record that gets read", 70, 1290],
      [2, "Embeddings from first principles", 100, 2886],
      [1, "Backpressure and load shedding", 150, 2240],
      [7, "Endgame ideas every player should know", 8, 1520],
      [7, "A brilliant sacrifice, move by move", 60, 980],
    ];
    const now = Date.now();
    const items = spec.map(([c, title, hrs, d], i) => ({ id: "demovideo" + i, title, channelId: cid(c), channel: chans[c - 1].title, published: new Date(now - hrs * H).toISOString(), demo: true, _d: d }));
    state.subs = { at: now, items: chans };
    state.vids = { at: now, fetched: chans.map((c) => c.id), items: items.map(({ _d, ...v }) => v) };
    state.dur = Object.fromEntries(items.map((v) => [v.id, v._d]));
    if (!Object.keys(state.tags).length) {
      state.tags = {
        [cid(1)]: { status: "learn", topics: ["systems"] },
        [cid(2)]: { status: "learn", topics: ["ai"] },
        [cid(3)]: { status: "later", topics: ["leadership"] },
        [cid(5)]: { status: "unwind", topics: [] },
        [cid(7)]: { status: "snacks", topics: [] },
        [cid(6)]: { status: "mute", topics: [] },
      };
    }
  }

  // ---------- start ----------
  render();
  initGoogle();
  if (!DEMO && getToken()) refresh();
})();
