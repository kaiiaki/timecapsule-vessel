import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

const RECORD_DURATION = 180;
const PREVIEW_DURATION = 15;

const fonts = `@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap');`;

const styles = `
  ${fonts}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0d1117; }
  .app {
    min-height: 100vh;
    background: #0e1520;
    font-family: 'DM Sans', sans-serif;
    color: #e8e0d4;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    position: relative;
    overflow: hidden;
  }
  .app::before {
    content: '';
    position: fixed;
    inset: 0;
    background: radial-gradient(ellipse 80% 60% at 20% 10%, rgba(99,130,110,0.12) 0%, transparent 60%),
                radial-gradient(ellipse 60% 50% at 80% 80%, rgba(120,90,70,0.1) 0%, transparent 60%),
                radial-gradient(ellipse 40% 40% at 50% 50%, rgba(60,80,110,0.08) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }
  .screen {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    animation: fadeUp 0.6s ease both;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .wordmark {
    font-family: 'Lora', serif;
    font-size: 0.85rem;
    letter-spacing: 0.14em;
    color: #7a9e8a;
    text-transform: uppercase;
    font-weight: 400;
  }
  h1 {
    font-family: 'Lora', serif;
    font-size: clamp(1.8rem, 5vw, 2.6rem);
    font-weight: 400;
    line-height: 1.25;
    text-align: center;
    color: #f0e8dc;
  }
  h1 em {
    font-style: italic;
    color: #a8c4b0;
  }
  .subtitle {
    font-size: 0.9rem;
    color: #8a9090;
    text-align: center;
    line-height: 1.7;
    max-width: 360px;
  }
  .card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 2rem;
    width: 100%;
  }
  .video-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 4/3;
    border-radius: 14px;
    overflow: hidden;
    background: #070c12;
    border: 1px solid rgba(255,255,255,0.06);
  }
  .video-wrap video {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
  }
  .video-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 1rem;
    pointer-events: none;
  }
  .rec-dot {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(0,0,0,0.45);
    border-radius: 20px;
    padding: 4px 10px;
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    font-weight: 500;
    width: fit-content;
    color: #f0e8dc;
  }
  .rec-dot .dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #e25555;
    animation: pulse 1.2s ease infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  .timer {
    font-family: 'Lora', serif;
    font-size: 1.6rem;
    font-weight: 400;
    text-align: center;
    color: #f0e8dc;
    background: rgba(0,0,0,0.4);
    border-radius: 10px;
    padding: 2px 12px;
    width: fit-content;
    margin: 0 auto;
    pointer-events: none;
  }
  .timer.warning { color: #e2955a; }
  .progress-bar {
    width: 100%;
    height: 3px;
    background: rgba(255,255,255,0.08);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 0.75rem;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #7a9e8a, #a8c4b0);
    border-radius: 2px;
    transition: width 0.5s linear;
  }
  .btn {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.92rem;
    font-weight: 500;
    padding: 0.8rem 2rem;
    border-radius: 50px;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.02em;
  }
  .btn:active { transform: scale(0.97); }
  .btn-primary {
    background: #7a9e8a;
    color: #0e1520;
  }
  .btn-primary:hover { background: #8db89e; }
  .btn-secondary {
    background: transparent;
    color: #8a9090;
    border: 1px solid rgba(255,255,255,0.1);
  }
  .btn-secondary:hover { color: #f0e8dc; border-color: rgba(255,255,255,0.2); }
  .btn-danger {
    background: rgba(226,85,85,0.12);
    color: #e28888;
    border: 1px solid rgba(226,85,85,0.2);
  }
  .btn-danger:hover { background: rgba(226,85,85,0.2); }
  .btn-ghost {
    background: rgba(255,255,255,0.05);
    color: #c0b8b0;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .btn-ghost:hover { background: rgba(255,255,255,0.09); }
  .btn-lg {
    font-size: 1rem;
    padding: 1rem 2.5rem;
  }
  .btn-icon {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .row {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(168,196,176,0.1);
    border: 1px solid rgba(168,196,176,0.2);
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 0.78rem;
    color: #a8c4b0;
    letter-spacing: 0.04em;
  }
  .divider {
    width: 100%;
    height: 1px;
    background: rgba(255,255,255,0.06);
  }
  .sent-icon {
    width: 72px; height: 72px;
    border-radius: 50%;
    background: rgba(122,158,138,0.12);
    border: 1px solid rgba(122,158,138,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
  }
  .preview-badge {
    background: rgba(168,196,176,0.08);
    border: 1px solid rgba(168,196,176,0.15);
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.85rem;
    color: #a8c4b0;
  }
  .date-display {
    font-family: 'Lora', serif;
    font-size: 1.1rem;
    font-style: italic;
    color: #a8c4b0;
    text-align: center;
  }
  .capsule-visual {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 0;
  }
  .capsule-circle {
    width: 120px; height: 120px;
    border-radius: 50%;
    border: 1px solid rgba(122,158,138,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .capsule-circle::before {
    content: '';
    position: absolute;
    inset: -10px;
    border-radius: 50%;
    border: 1px solid rgba(122,158,138,0.08);
  }
  .capsule-circle::after {
    content: '';
    position: absolute;
    inset: -22px;
    border-radius: 50%;
    border: 1px solid rgba(122,158,138,0.04);
  }
  .capsule-year {
    font-family: 'Lora', serif;
    font-size: 1.8rem;
    font-weight: 400;
    color: #f0e8dc;
    text-align: center;
  }
  .capsule-label {
    font-size: 0.7rem;
    color: #7a9e8a;
    text-align: center;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-top: 2px;
  }
  .step-hint {
    font-size: 0.8rem;
    color: #5a6060;
    text-align: center;
  }
  .no-cam {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    height: 100%;
    padding: 2rem;
    color: #5a6060;
    font-size: 0.85rem;
    text-align: center;
  }
  .alert {
    background: rgba(226,149,90,0.08);
    border: 1px solid rgba(226,149,90,0.18);
    border-radius: 10px;
    padding: 0.75rem 1rem;
    font-size: 0.82rem;
    color: #c89a70;
    text-align: center;
    line-height: 1.5;
  }
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    width: 100%;
  }
  .action-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 1.25rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .action-card:hover {
    background: rgba(255,255,255,0.06);
    border-color: rgba(168,196,176,0.2);
  }
  .action-card .ac-icon {
    font-size: 1.3rem;
    margin-bottom: 2px;
  }
  .action-card .ac-title {
    font-family: 'Lora', serif;
    font-size: 0.95rem;
    color: #f0e8dc;
  }
  .action-card .ac-desc {
    font-size: 0.78rem;
    color: #5a6868;
    line-height: 1.5;
  }
  .back-btn {
    position: fixed;
    top: 1.5rem;
    left: 1.5rem;
    z-index: 100;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 50px;
    padding: 6px 14px 6px 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    color: #8a9090;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
  }
  .back-btn:hover { color: #f0e8dc; border-color: rgba(255,255,255,0.15); }
  .emotion-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    width: 100%;
  }
  .emotion-btn {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 0.65rem 0.5rem;
    cursor: pointer;
    transition: all 0.18s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-family: 'DM Sans', sans-serif;
  }
  .emotion-btn:hover {
    background: rgba(255,255,255,0.07);
    border-color: rgba(168,196,176,0.2);
  }
  .emotion-btn.selected {
    background: rgba(122,158,138,0.12);
    border-color: rgba(122,158,138,0.4);
  }
  .emotion-btn .e-icon { font-size: 1.3rem; }
  .emotion-btn .e-label { font-size: 0.72rem; color: #8a9090; letter-spacing: 0.02em; }
  .emotion-btn.selected .e-label { color: #a8c4b0; }
  .prompt-card {
    background: rgba(122,158,138,0.06);
    border: 1px solid rgba(122,158,138,0.15);
    border-radius: 14px;
    padding: 1.1rem 1.25rem;
    width: 100%;
  }
  .prompt-label {
    font-size: 0.72rem;
    color: #5a6868;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
  }
  .prompt-text {
    font-family: 'Lora', serif;
    font-size: 1rem;
    color: #d0c8bc;
    line-height: 1.6;
    font-style: italic;
  }
  .prompt-text .fill {
    color: #a8c4b0;
    font-style: normal;
    font-weight: 500;
  }
  .prompt-hint {
    font-size: 0.75rem;
    color: #4a5858;
    margin-top: 0.6rem;
    line-height: 1.5;
  }
  .preview-marker {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: #7a9e8a;
  }
  .preview-marker-line {
    flex: 1;
    height: 1px;
    background: rgba(122,158,138,0.25);
  }
  .recipient-toggle {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    width: 100%;
  }
  .recipient-option {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 1.1rem 1rem;
    cursor: pointer;
    transition: all 0.18s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    font-family: 'DM Sans', sans-serif;
  }
  .recipient-option:hover {
    background: rgba(255,255,255,0.06);
    border-color: rgba(168,196,176,0.2);
  }
  .recipient-option.selected {
    background: rgba(122,158,138,0.1);
    border-color: rgba(122,158,138,0.4);
  }
  .recipient-option .ro-icon { font-size: 1.5rem; }
  .recipient-option .ro-title { font-size: 0.88rem; color: #d0c8bc; font-weight: 500; }
  .recipient-option .ro-desc { font-size: 0.74rem; color: #5a6868; text-align: center; line-height: 1.4; }
  .recipient-option.selected .ro-title { color: #a8c4b0; }
  .input-field {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 0.75rem 1rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    color: #f0e8dc;
    outline: none;
    transition: border-color 0.18s;
  }
  .input-field::placeholder { color: #4a5858; }
  .input-field:focus { border-color: rgba(122,158,138,0.5); }
  .input-label {
    font-size: 0.75rem;
    color: #5a6868;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .grain {
    position: fixed;
    inset: 0;
    opacity: 0.025;
    pointer-events: none;
    z-index: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 180px;
  }
  .auth-tabs {
    display: flex;
    width: 100%;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 4px;
    gap: 4px;
  }
  .auth-tab {
    flex: 1;
    padding: 0.55rem;
    border-radius: 9px;
    border: none;
    background: transparent;
    color: #5a6868;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.18s;
  }
  .auth-tab.active {
    background: rgba(122,158,138,0.15);
    color: #a8c4b0;
  }
  .auth-divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
  }
  .auth-divider span { font-size: 0.75rem; color: #3a4848; white-space: nowrap; }
  .auth-divider::before, .auth-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.05);
  }
  .nav-bar {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1.5rem;
    background: rgba(14,21,32,0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .nav-wordmark {
    font-family: 'Lora', serif;
    font-size: 0.8rem;
    letter-spacing: 0.14em;
    color: #7a9e8a;
    text-transform: uppercase;
  }
  .nav-actions { display: flex; align-items: center; gap: 0.75rem; }
  .avatar {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: rgba(122,158,138,0.15);
    border: 1px solid rgba(122,158,138,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.78rem;
    color: #a8c4b0;
    font-weight: 500;
    cursor: pointer;
  }
  .dashboard {
    padding-top: 5rem;
    width: 100%;
    max-width: 560px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    animation: fadeUp 0.5s ease both;
    position: relative;
    z-index: 1;
  }
  .dash-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .dash-tab {
    padding: 0.6rem 1.1rem;
    border: none;
    background: transparent;
    color: #5a6868;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.18s;
  }
  .dash-tab.active { color: #a8c4b0; border-bottom-color: #7a9e8a; }
  .dash-tab:hover:not(.active) { color: #c0b8b0; }
  .capsule-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.9rem 1rem;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    transition: all 0.18s;
    cursor: pointer;
  }
  .capsule-row:hover { background: rgba(255,255,255,0.05); border-color: rgba(168,196,176,0.15); }
  .capsule-thumb {
    width: 56px; height: 42px;
    border-radius: 8px;
    background: rgba(122,158,138,0.08);
    border: 1px solid rgba(122,158,138,0.12);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    font-size: 1.1rem;
  }
  .capsule-meta { flex: 1; display: flex; flex-direction: column; gap: 3px; }
  .capsule-title { font-size: 0.88rem; color: #d0c8bc; font-family: 'Lora', serif; }
  .capsule-detail { font-size: 0.75rem; color: #5a6868; }
  .status-badge {
    font-size: 0.68rem;
    padding: 3px 9px;
    border-radius: 20px;
    font-weight: 500;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }
  .status-sealed { background: rgba(122,158,138,0.1); color: #7a9e8a; border: 1px solid rgba(122,158,138,0.2); }
  .status-received { background: rgba(168,196,176,0.12); color: #a8c4b0; border: 1px solid rgba(168,196,176,0.25); }
  .status-sent { background: rgba(180,150,100,0.1); color: #c8a87a; border: 1px solid rgba(180,150,100,0.2); }
  .empty-state {
    display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
    padding: 3rem 1rem; text-align: center;
  }
  .empty-state .es-icon { font-size: 2rem; opacity: 0.3; }
  .empty-state p { font-size: 0.85rem; color: #3a4848; line-height: 1.6; }
  .capsule-detail-modal {
    display: flex; flex-direction: column; gap: 1.25rem;
    width: 100%; animation: fadeUp 0.4s ease both;
  }
`;

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setReady(true);
    } catch (e) {
      setError(e.message || "Camera access denied");
    }
  }, []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setReady(false);
  }, []);

  return { videoRef, streamRef, ready, error, start, stop };
}

function useRecorder(streamRef) {
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [blob, setBlob] = useState(null);
  const [mimeType, setMimeType] = useState("video/webm");
  const [recording, setRecording] = useState(false);

  const startRec = useCallback(() => {
    chunksRef.current = [];
    setBlob(null);
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : MediaRecorder.isTypeSupported("video/mp4")
      ? "video/mp4"
      : "";
    const opts = mime ? { mimeType: mime } : {};
    const mr = new MediaRecorder(streamRef.current, opts);
    const actualMime = mr.mimeType || mime || "video/webm";
    setMimeType(actualMime);
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const b = new Blob(chunksRef.current, { type: actualMime });
      setBlob(b);
    };
    mr.start(500);
    recorderRef.current = mr;
    setRecording(true);
  }, [streamRef]);

  const stopRec = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
  }, []);

  return { blob, mimeType, recording, startRec, stopRec };
}

// SCREEN: Landing
function LandingScreen({ onStart, onOpenCapsule }) {
  const nextYear = new Date().getFullYear() + 1;
  return (
    <div className="screen">
      <span className="wordmark">Time Capsule Vessel</span>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
        <h1>A message to<br /><em>future you.</em></h1>
        <p className="subtitle">Record up to 3 minutes — for yourself or someone you love. We'll seal it and deliver it exactly one year from now.</p>
      </div>
      <div className="capsule-visual">
        <div className="capsule-circle">
          <div>
            <div className="capsule-year">{nextYear}</div>
            <div className="capsule-label">opens then</div>
          </div>
        </div>
      </div>
      <div className="row">
        <button className="btn btn-primary btn-lg btn-icon" onClick={onStart}>
          <span>✦</span> Record your message
        </button>
      </div>
      <div className="divider" style={{ maxWidth: 280 }} />
      <button className="btn btn-secondary btn-icon" onClick={onOpenCapsule} style={{ fontSize: "0.85rem" }}>
        Open a capsule I received
      </button>
      <p className="step-hint">Your video is private and encrypted at rest.</p>
    </div>
  );
}

// SCREEN: Recipient
function RecipientScreen({ onReady, onBack }) {
  const [mode, setMode] = useState(null);
  const [senderEmail, setSenderEmail] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");

  const isValid = mode === "self"
    ? senderEmail.includes("@")
    : senderEmail.includes("@") && recipientEmail.includes("@") && recipientName.trim().length > 0;

  return (
    <div className="screen">
      <button className="back-btn" onClick={onBack}>← back</button>
      <span className="wordmark">Time Capsule Vessel</span>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <h1 style={{ fontSize: "1.5rem" }}>Who is this <em>for?</em></h1>
        <p className="subtitle">Your capsule will be delivered by email in one year.</p>
      </div>

      <div className="recipient-toggle">
        <div className={`recipient-option${mode === "self" ? " selected" : ""}`} onClick={() => setMode("self")}>
          <span className="ro-icon">🪞</span>
          <span className="ro-title">Future me</span>
          <span className="ro-desc">A message to yourself, opened a year from now</span>
        </div>
        <div className={`recipient-option${mode === "other" ? " selected" : ""}`} onClick={() => setMode("other")}>
          <span className="ro-icon">✉️</span>
          <span className="ro-title">Someone else</span>
          <span className="ro-desc">Send a video to a friend, partner, or loved one</span>
        </div>
      </div>

      {mode && (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.85rem", animation: "fadeUp 0.3s ease both" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="input-label">your email</div>
            <input
              className="input-field"
              type="email"
              placeholder="you@example.com"
              value={senderEmail}
              onChange={e => setSenderEmail(e.target.value)}
            />
            <span style={{ fontSize: "0.73rem", color: "#4a5858", marginTop: 2 }}>
              {mode === "self" ? "We'll send your capsule here in one year." : "We'll notify you when it's delivered."}
            </span>
          </div>

          {mode === "other" && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div className="input-label">recipient's name</div>
                <input
                  className="input-field"
                  type="text"
                  placeholder="Their first name"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div className="input-label">recipient's email</div>
                <input
                  className="input-field"
                  type="email"
                  placeholder="them@example.com"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                />
                <span style={{ fontSize: "0.73rem", color: "#4a5858", marginTop: 2 }}>
                  They'll receive the capsule in one year — no spoilers.
                </span>
              </div>
            </>
          )}

          <button
            className="btn btn-primary btn-lg btn-icon"
            style={{ width: "100%", opacity: isValid ? 1 : 0.45 }}
            disabled={!isValid}
            onClick={() => onReady({ mode, senderEmail, recipientEmail, recipientName })}
          >
            <span>→</span> Continue
          </button>
        </div>
      )}
    </div>
  );
}

// SCREEN: Prompt
function PromptScreen({ onReady, onBack }) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const cues = [
    { n: "1", text: "The date", example: `"Today is ${today}."` },
    { n: "2", text: "Where you are", example: `"I'm in my bedroom / at the office / sitting in my car…"` },
    { n: "3", text: "How you're feeling", example: `"Right now I feel nervous, excited, a little tired…"` },
  ];

  return (
    <div className="screen">
      <button className="back-btn" onClick={onBack}>← back</button>
      <span className="wordmark">Time Capsule Vessel</span>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <h1 style={{ fontSize: "1.5rem" }}>Before you <em>begin.</em></h1>
        <p className="subtitle">Your first 15 seconds become the preview — the only part of this message you'll see right away. Use them to set the scene.</p>
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {cues.map(c => (
          <div key={c.n} style={{ display: "flex", gap: "0.9rem", alignItems: "flex-start" }}>
            <div style={{
              minWidth: 28, height: 28, borderRadius: "50%",
              background: "rgba(122,158,138,0.1)",
              border: "1px solid rgba(122,158,138,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.75rem", color: "#7a9e8a", fontWeight: 500, marginTop: 2,
            }}>{c.n}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontSize: "0.88rem", color: "#d0c8bc", fontWeight: 500 }}>{c.text}</span>
              <span style={{ fontSize: "0.8rem", color: "#5a6868", fontFamily: "Lora, serif", fontStyle: "italic", lineHeight: 1.5 }}>{c.example}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="prompt-card">
        <div className="prompt-label">how it might sound</div>
        <div className="prompt-text">
          "Hi future me. Today is <span className="fill">{today}</span>. I'm sitting in my living room and right now I'm feeling a little anxious but hopeful."
        </div>
        <div className="prompt-hint">After those 15 seconds, just keep going — say whatever you need to say.</div>
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        <div className="preview-marker">
          <span>0:00</span>
          <div className="preview-marker-line" />
          <span>0:15 preview ends</span>
          <div className="preview-marker-line" style={{ background: "rgba(255,255,255,0.06)" }} />
          <span>3:00</span>
        </div>
        <button className="btn btn-primary btn-lg btn-icon" onClick={() => onReady(null)} style={{ width: "100%" }}>
          <span>⏺</span> I'm ready to record
        </button>
      </div>
    </div>
  );
}

// SCREEN: Record
function RecordScreen({ onDone, onBack, emotion }) {
  const { videoRef, streamRef, ready, error, start, stop } = useCamera();
  const { blob, mimeType, recording, startRec, stopRec } = useRecorder(streamRef);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => { start(); return () => stop(); }, []);

  useEffect(() => {
    if (!ready || started) return;
  }, [ready]);

  useEffect(() => {
    if (recording) {
      intervalRef.current = setInterval(() => {
        setElapsed(e => {
          if (e >= RECORD_DURATION - 1) {
            stopRec();
            clearInterval(intervalRef.current);
            return RECORD_DURATION;
          }
          return e + 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [recording]);

  useEffect(() => {
    if (blob) {
      stop();
      onDone(blob, mimeType);
    }
  }, [blob]);

  const handleStart = () => {
    setElapsed(0);
    setStarted(true);
    startRec();
  };

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const openingLine = `"Hi future me, today is ${today} and right now I am feeling ${emotion?.label || ""}."`;
  const showTeleprompter = recording && elapsed < 15;
  const pct = (elapsed / RECORD_DURATION) * 100;
  const remaining = RECORD_DURATION - elapsed;
  const isWarning = remaining <= 30;

  return (
    <div className="screen">
      <button className="back-btn" onClick={onBack}>← back</button>
      <span className="wordmark">Time Capsule Vessel</span>
      <h1 style={{ fontSize: "1.4rem" }}>Speak <em>freely.</em></h1>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="video-wrap" style={{ borderRadius: 0, aspectRatio: "4/3" }}>
          <video ref={videoRef} muted playsInline style={{ transform: "scaleX(-1)" }} />
          {!ready && !error && (
            <div className="no-cam">
              <span style={{ fontSize: "1.5rem" }}>◎</span>
              <span>Waiting for camera...</span>
            </div>
          )}
          {error && (
            <div className="no-cam">
              <span style={{ fontSize: "1.5rem" }}>⚠</span>
              <span>{error}</span>
              <span style={{ fontSize: "0.75rem", marginTop: 4 }}>Please allow camera and microphone access</span>
            </div>
          )}
          {recording && (
            <div className="video-overlay">
              <div className="rec-dot"><span className="dot" /> REC</div>
              {showTeleprompter && (
                <div style={{
                  background: "rgba(0,0,0,0.6)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  margin: "0 0.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}>
                  <div style={{ fontSize: "0.65rem", color: "#7a9e8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    say this · {15 - elapsed}s left
                  </div>
                  {[
                    "📅 the date",
                    "📍 where you are",
                    "💬 how you're feeling",
                  ].map((cue, i) => (
                    <div key={i} style={{ fontSize: "0.82rem", color: "#d0c8bc", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: "0.75rem" }}>{cue}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className={`timer ${isWarning ? "warning" : ""}`}>{formatTime(remaining)}</div>
            </div>
          )}
        </div>
        <div style={{ padding: "1rem 1.25rem 1.25rem" }}>
          {recording && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem" }}>
                <div style={{ width: `${Math.min((elapsed / 15) * 100, 100)}%`, maxWidth: "100%", height: 3, background: elapsed < 15 ? "#7a9e8a" : "#3a5040", borderRadius: 2, transition: "width 0.5s linear, background 0.3s" }} />
                <span style={{ color: elapsed < 15 ? "#7a9e8a" : "#3a5040", whiteSpace: "nowrap", minWidth: 60 }}>{elapsed < 15 ? `preview` : "preview done ✓"}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
          {!recording && elapsed === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div className="prompt-card" style={{ padding: "0.75rem 1rem" }}>
                <div className="prompt-label">first 15 seconds — say</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: 4 }}>
                  {["the date", "where you are", "how you're feeling"].map((c, i) => (
                    <div key={i} style={{ fontSize: "0.85rem", color: "#a8c4b0", display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ color: "#5a6868", minWidth: 14, textAlign: "right" }}>{i + 1}.</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary btn-lg btn-icon" onClick={handleStart} disabled={!ready}>
                <span>⏺</span> Start recording
              </button>
            </div>
          )}
          {recording && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.75rem" }}>
              <button className="btn btn-danger btn-icon" onClick={stopRec} style={{ width: "100%" }}>
                ■ Stop and save
              </button>
              <p className="step-hint">Recording stops automatically at 3:00</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// SCREEN: Preview
function PreviewScreen({ blob, mimeType, onConfirm, onRedo, onBack }) {
  const videoRef = useRef(null);
  const [dataUrl, setDataUrl] = useState(null);
  const [previewEnded, setPreviewEnded] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onloadend = () => setDataUrl(reader.result);
    reader.readAsDataURL(blob);
    return () => clearTimeout(timerRef.current);
  }, [blob]);

  useEffect(() => {
    if (dataUrl && videoRef.current) {
      videoRef.current.src = dataUrl;
      videoRef.current.load();
    }
  }, [dataUrl]);

  const handlePlay = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      setPreviewEnded(true);
    }, PREVIEW_DURATION * 1000);
  };

  return (
    <div className="screen">
      <button className="back-btn" onClick={onBack}>← back</button>
      <span className="wordmark">Time Capsule Vessel</span>
      <h1 style={{ fontSize: "1.5rem" }}>Your <em>preview.</em></h1>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="video-wrap" style={{ borderRadius: 0 }}>
          {!dataUrl && (
            <div className="no-cam">
              <span style={{ fontSize: "1.5rem" }}>⧗</span>
              <span>Preparing preview...</span>
            </div>
          )}
          <video
            ref={videoRef}
            playsInline
            controls
            onPlay={handlePlay}
            onEnded={() => setPreviewEnded(true)}
            style={{ transform: "scaleX(-1)", width: "100%", height: "100%", objectFit: "cover", display: dataUrl ? "block" : "none" }}
          />
        </div>
        <div style={{ padding: "1rem 1.25rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {previewEnded && (
            <div className="preview-badge" style={{ background: "rgba(122,158,138,0.1)", borderColor: "rgba(122,158,138,0.25)" }}>
              <span>✓</span>
              <span>Preview done. Ready to seal?</span>
            </div>
          )}
          <div className="preview-badge">
            <span>⧗</span>
            <span>This is your 15-second preview. The full message will only play when it's delivered to you next year.</span>
          </div>
          <div className="alert">
            You won't be able to watch the full recording until it's time. That's the point.
          </div>
        </div>
      </div>
      <div className="row">
        <button className="btn btn-secondary btn-icon" onClick={onRedo}>↺ Re-record</button>
        <button className="btn btn-primary btn-icon" onClick={() => onConfirm(blob)}>Seal it ✦</button>
      </div>
    </div>
  );
}

// SCREEN: Seal
function SealScreen({ onDone, recipient, blob, user }) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState(null);
  const deliveryDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  })();

  useEffect(() => {
    const upload = async () => {
      try {
        setStep(0);
        const id = crypto.randomUUID();
        const ext = blob.type.includes("mp4") ? "mp4" : "webm";
        const path = `${id}/video.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("videos")
          .upload(path, blob, { contentType: blob.type, upsert: false });
        if (uploadError) throw uploadError;

        setStep(1);

        const deliverAt = new Date();
        deliverAt.setFullYear(deliverAt.getFullYear() + 1);

        const { error: dbError } = await supabase.from("capsules").insert({
          sender_email: recipient.senderEmail,
          recipient_email: recipient.mode === "other" ? recipient.recipientEmail : recipient.senderEmail,
          recipient_name: recipient.mode === "other" ? recipient.recipientName : null,
          mode: recipient.mode,
          video_path: path,
          status: "sealed",
          deliver_at: deliverAt.toISOString(),
          user_id: user?.id || null,
        });
        if (dbError) throw dbError;

        setStep(2);
      } catch (e) {
        setError(e.message);
        setStep(2);
      }
    };
    upload();
  }, []);

  return (
    <div className="screen">
      <span className="wordmark">Time Capsule Vessel</span>
      {step < 2 ? (
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "1.5rem", alignItems: "center" }}>
          <div className="capsule-circle">
            <div>
              <div className="capsule-year" style={{ fontSize: step === 0 ? "1.2rem" : "1.8rem", transition: "font-size 0.5s ease", color: "#7a9e8a" }}>
                {step === 0 ? "uploading..." : "✦"}
              </div>
            </div>
          </div>
          <p className="subtitle">{step === 0 ? "Uploading your message..." : "Saving capsule..."}</p>
        </div>
      ) : error ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", alignItems: "center", width: "100%" }}>
          <div className="sent-icon" style={{ background: "rgba(226,85,85,0.1)" }}>✕</div>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "1.5rem" }}>Something <em>went wrong.</em></h1>
            <p className="subtitle" style={{ marginTop: "0.5rem" }}>{error}</p>
          </div>
          <button className="btn btn-ghost" onClick={onDone}>Try again</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", alignItems: "center", width: "100%", animation: "fadeUp 0.5s ease both" }}>
          <div className="sent-icon">✦</div>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <h1 style={{ fontSize: "1.8rem" }}>Sealed <em>& waiting.</em></h1>
            <p className="subtitle">
              {recipient?.mode === "other"
                ? `Your message to ${recipient.recipientName} is safe. We'll deliver it to them on the date below.`
                : `Your message is safe. We'll deliver it to you on the date below.`}
            </p>
          </div>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "#5a6868", letterSpacing: "0.06em", textTransform: "uppercase" }}>Delivery date</span>
              <span className="pill">estimated</span>
            </div>
            <div className="date-display">{deliveryDate}</div>
            <div className="divider" />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
              <span style={{ color: "#5a6868" }}>Delivering to</span>
              <span style={{ color: "#a8c4b0" }}>
                {recipient?.mode === "other"
                  ? `${recipient.recipientName} (${recipient.recipientEmail})`
                  : recipient?.senderEmail || "you"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
              <span style={{ color: "#5a6868" }}>Duration</span>
              <span style={{ color: "#a8c4b0" }}>Up to 3:00</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
              <span style={{ color: "#5a6868" }}>Preview sent</span>
              <span style={{ color: "#a8c4b0" }}>15 seconds</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
              <span style={{ color: "#5a6868" }}>Status</span>
              <span style={{ color: "#7a9e8a" }}>● Sealed</span>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onDone}>Record another capsule</button>
        </div>
      )}
    </div>
  );
}

// SCREEN: Delivery (the "year later" screen)
function DeliveryScreen({ onBack }) {
  const [phase, setPhase] = useState("unlock");
  const [originalBlob, setOriginalBlob] = useState(null);
  const [replyBlob, setReplyBlob] = useState(null);
  const demoUrl = useRef(null);
  const { videoRef, streamRef, ready, error, start, stop } = useCamera();
  const { blob: newBlob, recording, startRec, stopRec } = useRecorder(streamRef);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);
  const playRef = useRef(null);

  useEffect(() => {
    if (newBlob) {
      setReplyBlob(newBlob);
      stop();
      setPhase("after-reply");
    }
  }, [newBlob]);

  useEffect(() => {
    if (recording) {
      intervalRef.current = setInterval(() => {
        setElapsed(e => {
          if (e >= RECORD_DURATION - 1) { stopRec(); clearInterval(intervalRef.current); return RECORD_DURATION; }
          return e + 1;
        });
      }, 1000);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [recording]);

  const handleUnlock = () => setPhase("watch");
  const handleStartReply = () => { setElapsed(0); start(); setPhase("reply"); };
  const handleStartNew = () => { setElapsed(0); start(); setPhase("new-capsule"); };
  const handleDownload = (b, name) => {
    const url = URL.createObjectURL(b);
    const a = document.createElement("a"); a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const nextYear = new Date().getFullYear() + 1;

  if (phase === "unlock") return (
    <div className="screen">
      <button className="back-btn" onClick={onBack}>← back</button>
      <span className="wordmark">Time Capsule Vessel</span>
      <div className="capsule-circle">
        <div>
          <div className="capsule-year">✉</div>
        </div>
      </div>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <h1 style={{ fontSize: "1.8rem" }}>A message<br /><em>from you.</em></h1>
        <p className="subtitle">A year ago, you recorded something just for this moment. Are you ready?</p>
      </div>
      <button className="btn btn-primary btn-lg btn-icon" onClick={handleUnlock}>
        <span>↓</span> Open your capsule
      </button>
    </div>
  );

  if (phase === "watch") return (
    <div className="screen">
      <span className="wordmark">Time Capsule Vessel</span>
      <h1 style={{ fontSize: "1.4rem" }}>Past <em>you</em> says...</h1>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="video-wrap" style={{ borderRadius: 0 }}>
          <video ref={playRef} src="https://www.w3schools.com/html/mov_bbb.mp4" playsInline controls style={{ transform: "scaleX(-1)" }} autoPlay />
        </div>
        <div style={{ padding: "1rem 1.25rem 1.25rem" }}>
          <p style={{ fontSize: "0.82rem", color: "#5a6868", lineHeight: 1.6 }}>Recorded one year ago · Full message</p>
        </div>
      </div>
      <div className="two-col">
        <div className="action-card" onClick={handleStartReply}>
          <span className="ac-icon">↩</span>
          <span className="ac-title">Reply to past you</span>
          <span className="ac-desc">Record a message back to reflect on where you were.</span>
        </div>
        <div className="action-card" onClick={handleStartNew}>
          <span className="ac-icon">✦</span>
          <span className="ac-title">Record for {nextYear}</span>
          <span className="ac-desc">Start a new capsule for another year ahead.</span>
        </div>
      </div>
      <button className="btn btn-ghost btn-icon" onClick={() => handleDownload(new Blob(["demo"], {type:"video/webm"}), "vessel-original.webm")}>
        ↓ Download original message
      </button>
    </div>
  );

  if (phase === "reply" || phase === "new-capsule") {
    const isReply = phase === "reply";
    const remaining = RECORD_DURATION - elapsed;
    const isWarning = remaining <= 30;
    const pct = (elapsed / RECORD_DURATION) * 100;
    return (
      <div className="screen">
        <button className="back-btn" onClick={() => { stop(); setPhase("watch"); }}>← back</button>
        <span className="wordmark">Time Capsule Vessel</span>
        <h1 style={{ fontSize: "1.4rem" }}>{isReply ? <><em>Reply</em> to past you.</> : <>Message for <em>{nextYear}.</em></>}</h1>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="video-wrap" style={{ borderRadius: 0 }}>
            <video ref={videoRef} muted playsInline style={{ transform: "scaleX(-1)" }} />
            {!ready && !error && <div className="no-cam"><span style={{ fontSize: "1.5rem" }}>◎</span><span>Loading camera...</span></div>}
            {error && <div className="no-cam"><span>⚠ {error}</span></div>}
            {recording && (
              <div className="video-overlay">
                <div className="rec-dot"><span className="dot" /> REC</div>
                <div className={`timer ${isWarning ? "warning" : ""}`}>{formatTime(remaining)}</div>
              </div>
            )}
          </div>
          <div style={{ padding: "1rem 1.25rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {recording && <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>}
            {!recording ? (
              <button className="btn btn-primary btn-lg btn-icon" onClick={() => { setElapsed(0); startRec(); }} disabled={!ready}>
                <span>⏺</span> Start recording
              </button>
            ) : (
              <button className="btn btn-danger btn-icon" onClick={stopRec} style={{ width: "100%" }}>■ Stop and save</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "after-reply") return (
    <div className="screen">
      <span className="wordmark">Time Capsule Vessel</span>
      <div className="sent-icon" style={{ background: "rgba(108,148,130,0.1)" }}>✦</div>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <h1 style={{ fontSize: "1.8rem" }}>Both <em>saved.</em></h1>
        <p className="subtitle">You can download either video anytime.</p>
      </div>
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.88rem", color: "#f0e8dc", fontFamily: "Lora, serif" }}>Original message</div>
            <div style={{ fontSize: "0.75rem", color: "#5a6868", marginTop: 2 }}>Recorded one year ago</div>
          </div>
          <button className="btn btn-ghost btn-icon" style={{ fontSize: "0.8rem", padding: "6px 14px" }} onClick={() => handleDownload(replyBlob, "vessel-original.webm")}>↓ Download</button>
        </div>
        <div className="divider" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.88rem", color: "#f0e8dc", fontFamily: "Lora, serif" }}>Your reply</div>
            <div style={{ fontSize: "0.75rem", color: "#5a6868", marginTop: 2 }}>Just now</div>
          </div>
          <button className="btn btn-ghost btn-icon" style={{ fontSize: "0.8rem", padding: "6px 14px" }} onClick={() => handleDownload(replyBlob, "vessel-reply.webm")}>↓ Download</button>
        </div>
        <div className="divider" />
        <button className="btn btn-primary" onClick={() => { setReplyBlob(null); setPhase("unlock"); }}>
          Send a new capsule ✦
        </button>
      </div>
    </div>
  );

  return null;
}

// ── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth, onBack }) {
  const [tab, setTab] = useState("signin");
  const [method, setMethod] = useState("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (method === "magic") {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        setMagicSent(true);
      } else if (tab === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name: name || email.split("@")[0] } }
        });
        if (error) throw error;
        if (data.user) onAuth({ email, name: name || email.split("@")[0] });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) onAuth({ email: data.user.email, name: data.user.user_metadata?.name || email.split("@")[0] });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (magicSent) return (
    <div className="screen">
      <button className="back-btn" onClick={() => setMagicSent(false)}>← back</button>
      <span className="wordmark">Time Capsule Vessel</span>
      <div className="sent-icon">✉</div>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <h1 style={{ fontSize: "1.6rem" }}>Check your <em>inbox.</em></h1>
        <p className="subtitle">We sent a magic link to <strong style={{ color: "#a8c4b0", fontWeight: 500 }}>{email}</strong>. Click it to sign in — no password needed.</p>
      </div>
      <p className="step-hint">Didn't get it? Check your spam folder.</p>
    </div>
  );

  return (
    <div className="screen">
      <button className="back-btn" onClick={onBack}>← back</button>
      <span className="wordmark">Time Capsule Vessel</span>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <h1 style={{ fontSize: "1.6rem" }}>{tab === "signin" ? <>Welcome <em>back.</em></> : <>Create your <em>account.</em></>}</h1>
        <p className="subtitle">Your capsule history lives here.</p>
      </div>

      <div className="auth-tabs">
        <button className={`auth-tab${tab === "signin" ? " active" : ""}`} onClick={() => { setTab("signin"); setError(null); }}>Sign in</button>
        <button className={`auth-tab${tab === "signup" ? " active" : ""}`} onClick={() => { setTab("signup"); setError(null); }}>Create account</button>
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {tab === "signup" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="input-label">your name</div>
            <input className="input-field" type="text" placeholder="First name" value={name} onChange={e => setName(e.target.value)} />
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div className="input-label">email</div>
          <input className="input-field" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        {method === "password" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="input-label">password</div>
            <input className="input-field" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
        )}
        {error && <div className="alert" style={{ color: "#e28888", background: "rgba(226,85,85,0.08)", borderColor: "rgba(226,85,85,0.2)" }}>{error}</div>}
        <button
          className="btn btn-primary btn-lg"
          style={{ width: "100%", opacity: email.includes("@") && !loading ? 1 : 0.45 }}
          disabled={!email.includes("@") || loading}
          onClick={handleSubmit}
        >
          {loading ? "Please wait..." : method === "magic" ? "Send magic link" : tab === "signin" ? "Sign in" : "Create account"}
        </button>

        <div className="auth-divider"><span>or</span></div>

        <button
          className="btn btn-ghost btn-icon"
          style={{ width: "100%" }}
          onClick={() => { setMethod(m => m === "password" ? "magic" : "password"); setError(null); }}
        >
          {method === "password" ? "✦ Sign in with magic link instead" : "🔑 Sign in with password instead"}
        </button>
      </div>
    </div>
  );
}

// ── NAV BAR ──────────────────────────────────────────────────────────────────
function NavBar({ user, onDashboard, onSignOut, onHome }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : "??";
  return (
    <div className="nav-bar">
      <span className="nav-wordmark" style={{ cursor: "pointer" }} onClick={onHome}>Time Capsule Vessel</span>
      <div className="nav-actions">
        {user ? (
          <div style={{ position: "relative" }}>
            <div className="avatar" onClick={() => setMenuOpen(o => !o)}>{initials}</div>
            {menuOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: "#0e1a28", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, padding: "0.5rem", minWidth: 160,
                display: "flex", flexDirection: "column", gap: 2, zIndex: 200,
              }}>
                <div style={{ padding: "6px 10px", fontSize: "0.78rem", color: "#5a6868", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 4 }}>{user.email}</div>
                <button className="btn btn-secondary" style={{ fontSize: "0.82rem", padding: "6px 10px", textAlign: "left", borderRadius: 8, border: "none" }} onClick={() => { setMenuOpen(false); onDashboard(); }}>My capsules</button>
                <button className="btn btn-secondary" style={{ fontSize: "0.82rem", padding: "6px 10px", textAlign: "left", borderRadius: 8, border: "none", color: "#8a7070" }} onClick={() => { setMenuOpen(false); onSignOut(); }}>Sign out</button>
              </div>
            )}
          </div>
        ) : (
          <button className="btn btn-secondary" style={{ fontSize: "0.82rem", padding: "6px 16px" }} onClick={onDashboard}>Sign in</button>
        )}
      </div>
    </div>
  );
}

// ── MOCK DATA ─────────────────────────────────────────────────────────────────
const MOCK_CAPSULES = [
  { id: 1, type: "preview",   title: "To future me",          date: "May 30, 2026", deliveryDate: "May 30, 2027", to: "self",               status: "sealed" },
  { id: 2, type: "received",  title: "From past me",          date: "Jan 12, 2025", deliveryDate: "Jan 12, 2026", to: "self",               status: "received" },
  { id: 3, type: "sent",      title: "To Maya",               date: "Mar 3, 2026",  deliveryDate: "Mar 3, 2027",  to: "maya@example.com",   status: "sealed" },
  { id: 4, type: "received",  title: "From past me",          date: "Aug 8, 2024",  deliveryDate: "Aug 8, 2025",  to: "self",               status: "received" },
  { id: 5, type: "sent",      title: "To Daniel",             date: "Feb 14, 2026", deliveryDate: "Feb 14, 2027", to: "daniel@example.com", status: "sealed" },
];

// ── DASHBOARD SCREEN ──────────────────────────────────────────────────────────
function DashboardScreen({ user, onRecord, onSignOut }) {
  const [tab, setTab] = useState("previews");
  const [selected, setSelected] = useState(null);
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCapsules = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("capsules")
        .select("*")
        .or(`sender_email.eq.${user.email},recipient_email.eq.${user.email}`)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setCapsules(data.map(c => ({
          id: c.id,
          type: c.status === "delivered"
            ? "received"
            : c.recipient_email !== user.email ? "sent" : "preview",
          title: c.recipient_name ? `To ${c.recipient_name}` : c.recipient_email === user.email ? "To future me" : `To ${c.recipient_email}`,
          date: new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          deliveryDate: new Date(c.deliver_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          to: c.recipient_email,
          status: c.status,
          video_path: c.video_path,
        })));
      }
      setLoading(false);
    };
    fetchCapsules();
  }, [user.email]);

  const tabs = [
    { key: "previews", label: "Previews",  types: ["preview"] },
    { key: "received", label: "Received",  types: ["received"] },
    { key: "sent",     label: "Sent",      types: ["sent"] },
  ];

  const filtered = capsules.filter(c => tabs.find(t => t.key === tab)?.types.includes(c.type));

  const iconFor = c => c.type === "received" ? "🎁" : c.type === "sent" ? "✉️" : "⧗";
  const badgeFor = c => {
    if (c.status === "delivered") return <span className="status-badge status-received">Delivered</span>;
    if (c.type === "sent") return <span className="status-badge status-sent">Delivering {c.deliveryDate}</span>;
    return <span className="status-badge status-sealed">Sealed · {c.deliveryDate}</span>;
  };

  if (selected) return (
    <div style={{ paddingTop: "5rem", width: "100%", maxWidth: 560, margin: "0 auto", position: "relative", zIndex: 1, padding: "5rem 1rem 2rem" }}>
      <button className="back-btn" onClick={() => setSelected(null)} style={{ position: "static", marginBottom: "1rem" }}>← back</button>
      <div className="capsule-detail-modal">
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <h1 style={{ fontSize: "1.5rem" }}>{selected.type === "received" ? <>Past <em>you</em> says...</> : selected.title}</h1>
          <p className="subtitle">Recorded {selected.date}</p>
        </div>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="video-wrap" style={{ borderRadius: 0 }}>
            {selected.type === "received" ? (
              <video src="https://www.w3schools.com/html/mov_bbb.mp4" playsInline controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "0.5rem", color: "#3a4848" }}>
                <span style={{ fontSize: "2rem" }}>🔒</span>
                <span style={{ fontSize: "0.82rem" }}>Sealed until {selected.deliveryDate}</span>
              </div>
            )}
          </div>
          <div style={{ padding: "0.85rem 1.1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "#5a6868" }}>{selected.type === "preview" ? "15-sec preview only" : selected.type === "sent" ? `Delivering to ${selected.to}` : "Full message · unlocked"}</span>
            {badgeFor(selected)}
          </div>
        </div>
        {selected.type === "received" && (
          <div className="two-col">
            <button className="btn btn-ghost btn-icon" style={{ justifyContent: "center" }}
              onClick={() => { const a = document.createElement("a"); a.href = "https://www.w3schools.com/html/mov_bbb.mp4"; a.download = "capsule.mp4"; a.click(); }}>
              ↓ Download
            </button>
            <button className="btn btn-primary btn-icon" style={{ justifyContent: "center" }} onClick={onRecord}>
              ↩ Record reply
            </button>
          </div>
        )}
        {selected.type === "preview" && (
          <div className="alert">The full video is sealed. You'll be able to watch and download it on {selected.deliveryDate}.</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="dashboard" style={{ padding: "5rem 1rem 2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", textAlign: "left" }}>Your <em>capsules.</em></h1>
          <p style={{ fontSize: "0.82rem", color: "#5a6868", marginTop: 4 }}>{user?.name} · {loading ? "loading..." : `${capsules.length} total`}</p>
        </div>
        <button className="btn btn-primary btn-icon" style={{ fontSize: "0.85rem", padding: "0.6rem 1.1rem" }} onClick={onRecord}>
          <span>✦</span> New capsule
        </button>
      </div>

      <div className="dash-tabs">
        {tabs.map(t => (
          <button key={t.key} className={`dash-tab${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label} <span style={{ fontSize: "0.72rem", opacity: 0.6, marginLeft: 4 }}>{capsules.filter(c => t.types.includes(c.type)).length}</span>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {loading ? (
          <div className="empty-state"><span className="es-icon">⧗</span><p>Loading your capsules...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="es-icon">◎</span>
            <p>Nothing here yet.<br />Record your first capsule to get started.</p>
          </div>
        ) : filtered.map(c => (
          <div key={c.id} className="capsule-row" onClick={() => setSelected(c)}>
            <div className="capsule-thumb">{iconFor(c)}</div>
            <div className="capsule-meta">
              <span className="capsule-title">{c.title}</span>
              <span className="capsule-detail">
                {c.type === "sent" ? `To ${c.to} · ` : ""}{c.type === "received" ? `Opened · ${c.deliveryDate}` : `Recorded ${c.date}`}
              </span>
            </div>
            {badgeFor(c)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedMime, setRecordedMime] = useState("video/webm");
  const [emotion, setEmotion] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser({ email: session.user.email, name: session.user.user_metadata?.name || session.user.email.split("@")[0], id: session.user.id });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ email: session.user.email, name: session.user.user_metadata?.name || session.user.email.split("@")[0], id: session.user.id });
        setScreen("dashboard");
      } else {
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = (u) => { setUser(u); setScreen("dashboard"); };
  const handleSignOut = async () => { await supabase.auth.signOut(); setUser(null); setScreen("landing"); };

  const showNav = !["record", "preview"].includes(screen);

  return (
    <>
      <style>{styles}</style>
      <div className="app" style={{ justifyContent: ["dashboard"].includes(screen) ? "flex-start" : "center" }}>
        <div className="grain" aria-hidden="true" />
        {showNav && (
          <NavBar
            user={user}
            onHome={() => setScreen("landing")}
            onDashboard={() => setScreen(user ? "dashboard" : "auth")}
            onSignOut={handleSignOut}
          />
        )}
        {screen === "landing" && (
          <LandingScreen
            onStart={() => setScreen("recipient")}
            onOpenCapsule={() => setScreen("delivery")}
          />
        )}
        {screen === "auth" && (
          <AuthScreen
            onAuth={handleAuth}
            onBack={() => setScreen("landing")}
          />
        )}
        {screen === "dashboard" && user && (
          <DashboardScreen
            user={user}
            onRecord={() => setScreen("recipient")}
            onSignOut={handleSignOut}
          />
        )}
        {screen === "recipient" && (
          <RecipientScreen
            onReady={info => { setRecipient(info); setScreen("prompt"); }}
            onBack={() => setScreen(user ? "dashboard" : "landing")}
          />
        )}
        {screen === "prompt" && (
          <PromptScreen
            onReady={sel => { setEmotion(sel); setScreen("record"); }}
            onBack={() => setScreen("recipient")}
          />
        )}
        {screen === "record" && (
          <RecordScreen
            emotion={emotion}
            onDone={(blob, mime) => { setRecordedBlob(blob); setRecordedMime(mime); setScreen("preview"); }}
            onBack={() => setScreen("prompt")}
          />
        )}
        {screen === "preview" && recordedBlob && (
          <PreviewScreen
            blob={recordedBlob}
            mimeType={recordedMime}
            onConfirm={() => setScreen("seal")}
            onRedo={() => setScreen("prompt")}
            onBack={() => setScreen("record")}
          />
        )}
        {screen === "seal" && (
          <SealScreen
            recipient={recipient}
            blob={recordedBlob}
            user={user}
            onDone={() => { setScreen(user ? "dashboard" : "landing"); setRecipient(null); setRecordedBlob(null); }}
          />
        )}
        {screen === "delivery" && (
          <DeliveryScreen onBack={() => setScreen("landing")} />
        )}
      </div>
    </>
  );
}
