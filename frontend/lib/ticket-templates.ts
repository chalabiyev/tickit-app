import type { TicketDesign } from "@/components/views/create-event/TicketDesignEditor"

const W = 360 // canvas width

export const TICKET_TEMPLATES: Record<string, TicketDesign> = {

  // ── 1. CLASSIC DARK — Cinematic / Concert Poster ───────────────────────
  classicDark: {
    bgColor: "#0a0a0a", bgImage: null, bgOverlay: 0, bgScale: 100, bgOffsetX: 0, bgOffsetY: 0,
    elements: [
      { id: "t-rule1",  type: "text", x: 24, y: 88,  content: "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬", color: "#f59e0b", fontSize: 5,  fontWeight: "normal", fontFamily: "Arial, sans-serif",                                          textAlign: "left",   width: 312 },
      { id: "t-1",      type: "text", x: 0,  y: 102, content: "{{Event_Name}}",                color: "#ffffff", fontSize: 48, fontWeight: "bold",   fontFamily: "Impact, Charcoal, sans-serif",                               textAlign: "center", width: W   },
      { id: "t-2",      type: "text", x: 0,  y: 163, content: "{{Event_Date}}",                color: "#f59e0b", fontSize: 16, fontWeight: "bold",   fontFamily: '"Trebuchet MS", sans-serif',                                 textAlign: "center", width: W   },
      { id: "t-3",      type: "text", x: 0,  y: 185, content: "{{Location}}",                  color: "#737373", fontSize: 12, fontWeight: "normal", fontFamily: '"Trebuchet MS", sans-serif',                                 textAlign: "center", width: W   },
      { id: "t-dots",   type: "text", x: 0,  y: 210, content: "· · · · · · · · · · · · · · · · · · · · · · · · ·", color: "#2a2a2a", fontSize: 12, fontWeight: "normal", fontFamily: "Arial, sans-serif",                    textAlign: "center", width: W   },
      { id: "t-4",      type: "text", x: 0,  y: 230, content: "— {{Ticket_Type}} —",           color: "#f59e0b", fontSize: 13, fontWeight: "bold",   fontFamily: '"Trebuchet MS", sans-serif',                                 textAlign: "center", width: W   },
      { id: "t-glabel", type: "text", x: 24, y: 268, content: "GUEST",                         color: "#525252", fontSize: 9,  fontWeight: "bold",   fontFamily: '"Trebuchet MS", sans-serif',                                 textAlign: "left",   width: 150 },
      { id: "t-slabel", type: "text", x: 198,y: 268, content: "SEAT",                          color: "#525252", fontSize: 9,  fontWeight: "bold",   fontFamily: '"Trebuchet MS", sans-serif',                                 textAlign: "left",   width: 138 },
      { id: "t-5",      type: "text", x: 24, y: 283, content: "{{Guest_Name}}",                color: "#ffffff", fontSize: 18, fontWeight: "bold",   fontFamily: '"Trebuchet MS", sans-serif',                                 textAlign: "left",   width: 168 },
      { id: "t-6",      type: "text", x: 198,y: 283, content: "{{Seat_Info}}",                 color: "#ffffff", fontSize: 18, fontWeight: "bold",   fontFamily: "Impact, Charcoal, sans-serif",                               textAlign: "left",   width: 138 },
      { id: "t-rule2",  type: "text", x: 24, y: 318, content: "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬", color: "#f59e0b", fontSize: 5,  fontWeight: "normal", fontFamily: "Arial, sans-serif",                                          textAlign: "left",   width: 312 },
      { id: "qr-1",     type: "qr",   x: 110,y: 336, content: "QR_CODE",                       color: "#ffffff", fontSize: 140,fontWeight: "normal",                                                                            width: 140, height: 140 },
      { id: "t-scan",   type: "text", x: 0,  y: 484, content: "SCAN TO ENTER",                 color: "#525252", fontSize: 10, fontWeight: "bold",   fontFamily: '"Trebuchet MS", sans-serif',                                 textAlign: "center", width: W   },
      { id: "t-8",      type: "text", x: 0,  y: 530, content: "Təşkilatçı: {{Company_Name}}",  color: "#404040", fontSize: 11, fontWeight: "bold",   fontFamily: '"Trebuchet MS", sans-serif',                                 textAlign: "center", width: W   },
      { id: "t-9",      type: "text", x: 0,  y: 548, content: "Əlaqə: {{Company_Phone}}",      color: "#404040", fontSize: 11, fontWeight: "normal", fontFamily: '"Trebuchet MS", sans-serif',                                 textAlign: "center", width: W   },
    ],
  },

  // ── 2. ELEGANT LIGHT — Luxury Editorial / Gallery Opening ─────────────
  elegantLight: {
    bgColor: "#f8f5f0", bgImage: null, bgOverlay: 0, bgScale: 100, bgOffsetX: 0, bgOffsetY: 0,
    elements: [
      { id: "t-bar",    type: "text", x: 24,  y: 88,  content: "████",                          color: "#c9a84c", fontSize: 7,  fontWeight: "bold",   fontFamily: "Arial, sans-serif",                                          textAlign: "left",   width: 40  },
      { id: "t-cat",    type: "text", x: 72,  y: 88,  content: "ADMISSION TICKET",               color: "#c9a84c", fontSize: 9,  fontWeight: "bold",   fontFamily: '"Trebuchet MS", sans-serif',                                 textAlign: "left",   width: 264 },
      { id: "t-1",      type: "text", x: 24,  y: 108, content: "{{Event_Name}}",                 color: "#0d0d0d", fontSize: 38, fontWeight: "bold",   fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif',        textAlign: "left",   width: 312 },
      { id: "t-rule",   type: "text", x: 24,  y: 170, content: "────────────────────────────────────", color: "#d4c9b0", fontSize: 9,  fontWeight: "normal", fontFamily: "Arial, sans-serif",                                  textAlign: "left",   width: 312 },
      { id: "t-2",      type: "text", x: 24,  y: 188, content: "{{Event_Date}}",                 color: "#0d0d0d", fontSize: 15, fontWeight: "bold",   fontFamily: '"Trebuchet MS", sans-serif',                                 textAlign: "left",   width: 312 },
      { id: "t-3",      type: "text", x: 24,  y: 210, content: "{{Location}}",                   color: "#7a7060", fontSize: 13, fontWeight: "normal", fontFamily: '"Palatino Linotype", Palatino, serif',                       textAlign: "left",   width: 312 },
      { id: "t-glabel", type: "text", x: 24,  y: 258, content: "PRESENTED TO",                   color: "#b0a898", fontSize: 9,  fontWeight: "bold",   fontFamily: '"Trebuchet MS", sans-serif',                                 textAlign: "left",   width: 312 },
      { id: "t-5",      type: "text", x: 24,  y: 274, content: "{{Guest_Name}}",                 color: "#0d0d0d", fontSize: 22, fontWeight: "bold",   fontFamily: '"Palatino Linotype", Palatino, serif',                       textAlign: "left",   width: 312 },
      { id: "t-slabel", type: "text", x: 24,  y: 316, content: "CATEGORY",                       color: "#b0a898", fontSize: 9,  fontWeight: "bold",   fontFamily: '"Trebuchet MS", sans-serif',                                 textAlign: "left",   width: 155 },
      { id: "t-sslabel",type: "text", x: 192, y: 316, content: "SEAT",                           color: "#b0a898", fontSize: 9,  fontWeight: "bold",   fontFamily: '"Trebuchet MS", sans-serif',                                 textAlign: "left",   width: 144 },
      { id: "t-6",      type: "text", x: 24,  y: 332, content: "{{Ticket_Type}}",                color: "#0d0d0d", fontSize: 16, fontWeight: "bold",   fontFamily: '"Trebuchet MS", sans-serif',                                 textAlign: "left",   width: 155 },
      { id: "t-7",      type: "text", x: 192, y: 332, content: "{{Seat_Info}}",                  color: "#0d0d0d", fontSize: 16, fontWeight: "bold",   fontFamily: '"Trebuchet MS", sans-serif',                                 textAlign: "left",   width: 144 },
      { id: "t-rule2",  type: "text", x: 24,  y: 362, content: "────────────────────────────────────", color: "#d4c9b0", fontSize: 9,  fontWeight: "normal", fontFamily: "Arial, sans-serif",                                  textAlign: "left",   width: 312 },
      { id: "qr-1",     type: "qr",   x: 24,  y: 376, content: "QR_CODE",                        color: "#0d0d0d", fontSize: 120,fontWeight: "normal",                                                                           width: 120, height: 120 },
      { id: "t-qrlabel",type: "text", x: 164, y: 390, content: "Scan for\ndigital entry",         color: "#7a7060", fontSize: 12, fontWeight: "normal", fontFamily: '"Palatino Linotype", Palatino, serif',                      textAlign: "left",   width: 172 },
      { id: "t-qrsub",  type: "text", x: 164, y: 430, content: "Valid for one\nadmission only",   color: "#b0a898", fontSize: 11, fontWeight: "normal", fontFamily: '"Palatino Linotype", Palatino, serif',                      textAlign: "left",   width: 172 },
      { id: "t-8",      type: "text", x: 24,  y: 530, content: "Təşkilatçı: {{Company_Name}}",   color: "#b0a898", fontSize: 11, fontWeight: "bold",   fontFamily: '"Trebuchet MS", sans-serif',                                 textAlign: "left",   width: 312 },
      { id: "t-9",      type: "text", x: 24,  y: 548, content: "Əlaqə: {{Company_Phone}}",       color: "#b0a898", fontSize: 11, fontWeight: "normal", fontFamily: '"Trebuchet MS", sans-serif',                                 textAlign: "left",   width: 312 },
    ],
  },

  // ── 3. NEON CYBER — Rave / Festival / Electronic ───────────────────────
  neonCyber: {
    bgColor: "#000000", bgImage: null, bgOverlay: 0, bgScale: 100, bgOffsetX: 0, bgOffsetY: 0,
    elements: [
      { id: "t-scan1",  type: "text", x: 0,  y: 90,  content: "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -", color: "#0a0a0a", fontSize: 10, fontWeight: "normal", fontFamily: '"Courier New", monospace', textAlign: "center", width: W   },
      { id: "t-scan2",  type: "text", x: 0,  y: 106, content: "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -", color: "#0a0a0a", fontSize: 10, fontWeight: "normal", fontFamily: '"Courier New", monospace', textAlign: "center", width: W   },
      { id: "t-type",   type: "text", x: 0,  y: 100, content: "[ {{Ticket_Type}} ]",             color: "#ff2d78", fontSize: 13, fontWeight: "bold",   fontFamily: '"Courier New", Courier, monospace',                          textAlign: "center", width: W   },
      { id: "t-1",      type: "text", x: 0,  y: 124, content: "{{Event_Name}}",                  color: "#00f5ff", fontSize: 44, fontWeight: "bold",   fontFamily: "Impact, Charcoal, sans-serif",                               textAlign: "center", width: W   },
      { id: "t-gline",  type: "text", x: 0,  y: 182, content: "▓▓░░▓▓▓░░▓▓░░░▓▓▓░░▓░░▓▓▓▓░░▓▓░░▓▓▓▓", color: "#ff2d78", fontSize: 6, fontWeight: "normal", fontFamily: '"Courier New", monospace',                             textAlign: "center", width: W   },
      { id: "t-2",      type: "text", x: 0,  y: 198, content: "{{Event_Date}}",                  color: "#e2e8f0", fontSize: 15, fontWeight: "bold",   fontFamily: '"Courier New", Courier, monospace',                          textAlign: "center", width: W   },
      { id: "t-3",      type: "text", x: 0,  y: 220, content: "{{Location}}",                    color: "#4a5568", fontSize: 12, fontWeight: "normal", fontFamily: '"Courier New", Courier, monospace',                          textAlign: "center", width: W   },
      { id: "t-sep",    type: "text", x: 0,  y: 248, content: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", color: "#1a1a2e", fontSize: 8,  fontWeight: "normal", fontFamily: '"Courier New", monospace',                             textAlign: "center", width: W   },
      { id: "t-glabel", type: "text", x: 24, y: 262, content: "ATTENDEE_ID",                     color: "#4a5568", fontSize: 9,  fontWeight: "bold",   fontFamily: '"Courier New", monospace',                                   textAlign: "left",   width: 312 },
      { id: "t-5",      type: "text", x: 24, y: 276, content: "{{Guest_Name}}",                  color: "#00f5ff", fontSize: 18, fontWeight: "bold",   fontFamily: '"Courier New", Courier, monospace',                          textAlign: "left",   width: 312 },
      { id: "t-slabel", type: "text", x: 24, y: 308, content: "SECTOR / ROW / SEAT",             color: "#4a5568", fontSize: 9,  fontWeight: "bold",   fontFamily: '"Courier New", monospace',                                   textAlign: "left",   width: 312 },
      { id: "t-6",      type: "text", x: 24, y: 322, content: "{{Seat_Info}}",                   color: "#ff2d78", fontSize: 18, fontWeight: "bold",   fontFamily: '"Courier New", Courier, monospace',                          textAlign: "left",   width: 312 },
      { id: "qr-1",     type: "qr",   x: 110,y: 358, content: "QR_CODE",                         color: "#00f5ff", fontSize: 140,fontWeight: "normal",                                                                           width: 140, height: 140 },
      { id: "t-qrl",    type: "text", x: 0,  y: 506, content: "// SCAN_TO_ENTER //",             color: "#4a5568", fontSize: 10, fontWeight: "bold",   fontFamily: '"Courier New", monospace',                                   textAlign: "center", width: W   },
      { id: "t-8",      type: "text", x: 0,  y: 532, content: "ORG: {{Company_Name}}",           color: "#ff2d78", fontSize: 11, fontWeight: "bold",   fontFamily: '"Courier New", monospace',                                   textAlign: "center", width: W   },
      { id: "t-9",      type: "text", x: 0,  y: 550, content: "TEL: {{Company_Phone}}",          color: "#2a2a3e", fontSize: 11, fontWeight: "normal", fontFamily: '"Courier New", monospace',                                   textAlign: "center", width: W   },
    ],
  },

  // ── 4. GOLD VIP — Old Money / Black Tie Gala ───────────────────────────
  goldVip: {
    bgColor: "#0e1420", bgImage: null, bgOverlay: 0, bgScale: 100, bgOffsetX: 0, bgOffsetY: 0,
    elements: [
      { id: "t-orn1",   type: "text", x: 0,  y: 86,  content: "✦  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ✦",  color: "#c9a84c", fontSize: 9,  fontWeight: "normal", fontFamily: "Georgia, serif",                                        textAlign: "center", width: W   },
      { id: "t-vip",    type: "text", x: 0,  y: 106, content: "V  I  P   A  C  C  E  S  S",          color: "#c9a84c", fontSize: 10, fontWeight: "bold",   fontFamily: '"Trebuchet MS", sans-serif',                             textAlign: "center", width: W   },
      { id: "t-orn2",   type: "text", x: 0,  y: 122, content: "✦  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ✦",  color: "#c9a84c", fontSize: 9,  fontWeight: "normal", fontFamily: "Georgia, serif",                                        textAlign: "center", width: W   },
      { id: "t-1",      type: "text", x: 0,  y: 146, content: "{{Event_Name}}",                       color: "#f5f0e8", fontSize: 38, fontWeight: "bold",   fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif',    textAlign: "center", width: W   },
      { id: "t-2",      type: "text", x: 0,  y: 200, content: "{{Event_Date}}",                       color: "#c9a84c", fontSize: 14, fontWeight: "normal", fontFamily: '"Palatino Linotype", Palatino, serif',                    textAlign: "center", width: W   },
      { id: "t-3",      type: "text", x: 0,  y: 222, content: "{{Location}}",                         color: "#8a9bb5", fontSize: 12, fontWeight: "normal", fontFamily: '"Palatino Linotype", Palatino, serif',                    textAlign: "center", width: W   },
      { id: "t-rule",   type: "text", x: 60, y: 252, content: "━━━━━━━━━━━━━━━━━━━━━━━━",             color: "#2e3a50", fontSize: 9,  fontWeight: "normal", fontFamily: "Arial, sans-serif",                                      textAlign: "center", width: 240 },
      { id: "t-hlabel", type: "text", x: 0,  y: 268, content: "HONOURED GUEST",                       color: "#4d6080", fontSize: 9,  fontWeight: "bold",   fontFamily: '"Trebuchet MS", sans-serif',                             textAlign: "center", width: W   },
      { id: "t-4",      type: "text", x: 0,  y: 284, content: "{{Guest_Name}}",                       color: "#c9a84c", fontSize: 26, fontWeight: "bold",   fontFamily: '"Palatino Linotype", Palatino, serif',                    textAlign: "center", width: W   },
      { id: "t-slabel", type: "text", x: 24, y: 326, content: "CATEGORY",                             color: "#4d6080", fontSize: 9,  fontWeight: "bold",   fontFamily: '"Trebuchet MS", sans-serif',                             textAlign: "left",   width: 155 },
      { id: "t-sslabel",type: "text", x: 196,y: 326, content: "SEAT",                                 color: "#4d6080", fontSize: 9,  fontWeight: "bold",   fontFamily: '"Trebuchet MS", sans-serif',                             textAlign: "left",   width: 140 },
      { id: "t-5",      type: "text", x: 24, y: 342, content: "{{Ticket_Type}}",                      color: "#f5f0e8", fontSize: 15, fontWeight: "bold",   fontFamily: '"Palatino Linotype", Palatino, serif',                    textAlign: "left",   width: 155 },
      { id: "t-6",      type: "text", x: 196,y: 342, content: "{{Seat_Info}}",                        color: "#f5f0e8", fontSize: 15, fontWeight: "bold",   fontFamily: '"Palatino Linotype", Palatino, serif',                    textAlign: "left",   width: 140 },
      { id: "t-orn3",   type: "text", x: 0,  y: 370, content: "✦  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ✦",  color: "#2e3a50", fontSize: 9,  fontWeight: "normal", fontFamily: "Georgia, serif",                                        textAlign: "center", width: W   },
      { id: "qr-1",     type: "qr",   x: 110,y: 386, content: "QR_CODE",                              color: "#f5f0e8", fontSize: 140,fontWeight: "normal",                                                                       width: 140, height: 140 },
      { id: "t-ent",    type: "text", x: 0,  y: 534, content: "PRESENT THIS TICKET AT THE ENTRANCE",  color: "#4d6080", fontSize: 9,  fontWeight: "bold",   fontFamily: '"Trebuchet MS", sans-serif',                             textAlign: "center", width: W   },
      { id: "t-8",      type: "text", x: 0,  y: 552, content: "Təşkilatçı: {{Company_Name}}",         color: "#3a4d66", fontSize: 11, fontWeight: "bold",   fontFamily: '"Palatino Linotype", Palatino, serif',                    textAlign: "center", width: W   },
      { id: "t-9",      type: "text", x: 0,  y: 570, content: "Əlaqə: {{Company_Phone}}",             color: "#3a4d66", fontSize: 11, fontWeight: "normal", fontFamily: '"Palatino Linotype", Palatino, serif',                    textAlign: "center", width: W   },
    ],
  },
}