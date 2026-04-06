import { useState, useCallback } from "react";

const LANGUAGES = ["JavaScript", "Python", "Java", "C++", "TypeScript", "Go", "Rust", "PHP"];

const SEVERITY_CONFIG = {
  critical: { color: "#ff4444", bg: "rgba(255,68,68,0.1)", border: "rgba(255,68,68,0.3)", icon: "⛔" },
  warning:  { color: "#ffaa00", bg: "rgba(255,170,0,0.1)",  border: "rgba(255,170,0,0.3)",  icon: "⚠️" },
  info:     { color: "#00ccff", bg: "rgba(0,204,255,0.1)",  border: "rgba(0,204,255,0.3)",  icon: "💡" },
  good:     { color: "#00dd88", bg: "rgba(0,221,136,0.1)",  border: "rgba(0,221,136,0.3)",  icon: "✅" },
};

const SAMPLE_CODE = `function getUserData(userId) {
  const query = "SELECT * FROM users WHERE id = " + userId;
  const result = db.execute(query);
  
  var userData = result[0];
  
  if (userData != null) {
    console.log("User password: " + userData.password);
    return userData;
  }
}`;

export default function AICodeReviewer() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [language, setLanguage] = useState("JavaScript");
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState(null);
  const [activeTab, setActiveTab] = useState("issues");

  const reviewCode = useCallback(async () => {
    if (!code.trim()) return;
    setLoading(true);
    setReview(null);

    const prompt = `You are an expert code reviewer. Review the following ${language} code and respond ONLY with a valid JSON object (no markdown, no backticks, no explanation outside JSON).

Return this exact structure:
{
  "summary": "2-3 sentence overall assessment",
  "score": <number 0-100>,
  "complexity": "<O(n) or similar>",
  "issues": [
    {
      "severity": "<critical|warning|info|good>",
      "title": "<short title>",
      "description": "<detailed explanation>",
      "line": "<line number or range, e.g. Line 2 or Lines 3-5>"
    }
  ],
  "refactored": "<complete refactored version of the code>",
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}

Code to review:
\`\`\`${language}
${code}
\`\`\``;

    try {
      const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1000,
          messages: [
            {
              role: "system",
              content: "You are an expert code reviewer. Always respond ONLY with valid JSON. No markdown, no backticks, no explanation outside the JSON object."
            },
            { role: "user", content: prompt }
          ],
        }),
      });

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setReview(parsed);
      setActiveTab("issues");
    } catch {
      setReview({ error: "Failed to parse review. Please try again." });
    } finally {
      setLoading(false);
    }
  }, [code, language]);

  const scoreColor = review?.score >= 80 ? "#00dd88" : review?.score >= 50 ? "#ffaa00" : "#ff4444";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      color: "#e0e0e0",
      padding: "0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Syne:wght@400;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        textarea { resize: none; }
        textarea:focus { outline: none; }
        .tab-btn { cursor: pointer; transition: all 0.2s; }
        .tab-btn:hover { opacity: 0.8; }
        .review-btn { cursor: pointer; transition: all 0.2s; }
        .review-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(0,255,136,0.4); }
        .review-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .lang-btn { cursor: pointer; transition: all 0.15s; }
        .lang-btn:hover { border-color: #00ff88 !important; color: #00ff88 !important; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .issue-card { animation: slideIn 0.3s ease forwards; }
        .spinner { animation: spin 0.8s linear infinite; }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #1a1a2e",
        padding: "20px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(255,255,255,0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: "linear-gradient(135deg, #00ff88, #00ccff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>🔍</div>
          <div>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 18, color: "#fff", letterSpacing: "-0.5px" }}>
              CodeLens AI
            </div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>Intelligent Code Review</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["#ff5f57","#ffbd2e","#28c840"].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "calc(100vh - 73px)" }}>

        {/* LEFT: Code Input */}
        <div style={{ borderRight: "1px solid #1a1a2e", display: "flex", flexDirection: "column" }}>
          
          {/* Language selector */}
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid #1a1a2e",
            display: "flex", gap: 6, flexWrap: "wrap",
            background: "rgba(255,255,255,0.01)",
          }}>
            {LANGUAGES.map(lang => (
              <button
                key={lang}
                className="lang-btn"
                onClick={() => setLanguage(lang)}
                style={{
                  padding: "3px 10px",
                  borderRadius: 4,
                  border: `1px solid ${language === lang ? "#00ff88" : "#2a2a3a"}`,
                  background: language === lang ? "rgba(0,255,136,0.1)" : "transparent",
                  color: language === lang ? "#00ff88" : "#666",
                  fontSize: 11,
                  fontFamily: "inherit",
                  fontWeight: language === lang ? 600 : 400,
                }}
              >{lang}</button>
            ))}
          </div>

          {/* Line numbers + textarea */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
            <div style={{
              padding: "16px 0",
              width: 44,
              background: "#0d0d15",
              textAlign: "right",
              paddingRight: 10,
              fontSize: 12,
              lineHeight: "21px",
              color: "#333",
              userSelect: "none",
              overflow: "hidden",
              borderRight: "1px solid #1a1a2e",
            }}>
              {code.split("\n").map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1,
                background: "#0d0d15",
                color: "#c9d1d9",
                border: "none",
                padding: "16px",
                fontSize: 13,
                lineHeight: "21px",
                fontFamily: "inherit",
                tabSize: 2,
                overflowY: "auto",
              }}
              placeholder="// Paste your code here..."
            />
          </div>

          {/* Review button */}
          <div style={{ padding: "16px", borderTop: "1px solid #1a1a2e", background: "rgba(0,0,0,0.3)" }}>
            <button
              className="review-btn"
              onClick={reviewCode}
              disabled={loading || !code.trim()}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: "none",
                background: loading ? "#1a2a1a" : "linear-gradient(135deg, #00ff88, #00ccaa)",
                color: loading ? "#00ff88" : "#000",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                letterSpacing: "0.5px",
              }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{
                    width: 14, height: 14,
                    border: "2px solid #00ff88",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                  }} />
                  ANALYZING...
                </>
              ) : "▶  RUN CODE REVIEW"}
            </button>
          </div>
        </div>

        {/* RIGHT: Results */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {!review && !loading && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12,
              color: "#333",
            }}>
              <div style={{ fontSize: 48 }}>🔬</div>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 16, color: "#444" }}>
                Paste code and hit Review
              </div>
              <div style={{ fontSize: 12, color: "#2a2a2a" }}>
                Bugs · Security · Complexity · Refactoring
              </div>
            </div>
          )}

          {loading && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 16,
            }}>
              <div style={{
                width: 48, height: 48,
                border: "3px solid #1a3a2a",
                borderTopColor: "#00ff88",
                borderRadius: "50%",
              }} className="spinner" />
              <div style={{ color: "#00ff88", fontSize: 13, animation: "pulse 1.5s infinite" }}>
                Reviewing your code...
              </div>
            </div>
          )}

          {review?.error && (
            <div style={{ padding: 24, color: "#ff4444" }}>{review.error}</div>
          )}

          {review && !review.error && (
            <>
              {/* Score bar */}
              <div style={{
                padding: "16px 20px",
                borderBottom: "1px solid #1a1a2e",
                display: "flex", alignItems: "center", gap: 16,
                background: "rgba(255,255,255,0.01)",
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: 28, fontWeight: 800,
                    fontFamily: "Syne, sans-serif",
                    color: scoreColor,
                    lineHeight: 1,
                  }}>{review.score}</div>
                  <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>SCORE</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    height: 6, borderRadius: 3,
                    background: "#1a1a2e",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${review.score}%`,
                      background: `linear-gradient(90deg, #ff4444, ${scoreColor})`,
                      borderRadius: 3,
                      transition: "width 1s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 6, lineHeight: 1.5 }}>
                    {review.summary}
                  </div>
                </div>
                <div style={{
                  padding: "4px 10px",
                  borderRadius: 4,
                  background: "rgba(0,204,255,0.1)",
                  border: "1px solid rgba(0,204,255,0.2)",
                  color: "#00ccff",
                  fontSize: 11,
                }}>{review.complexity}</div>
              </div>

              {/* Tabs */}
              <div style={{
                display: "flex",
                borderBottom: "1px solid #1a1a2e",
              }}>
                {[
                  { id: "issues", label: `Issues (${review.issues?.length || 0})` },
                  { id: "refactored", label: "Refactored" },
                  { id: "tips", label: "Tips" },
                ].map(tab => (
                  <button
                    key={tab.id}
                    className="tab-btn"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: "10px 16px",
                      border: "none",
                      borderBottom: activeTab === tab.id ? "2px solid #00ff88" : "2px solid transparent",
                      background: "transparent",
                      color: activeTab === tab.id ? "#00ff88" : "#555",
                      fontSize: 12,
                      fontFamily: "inherit",
                      fontWeight: activeTab === tab.id ? 600 : 400,
                    }}
                  >{tab.label}</button>
                ))}
              </div>

              {/* Tab content */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>

                {activeTab === "issues" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {review.issues?.map((issue, i) => {
                      const cfg = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.info;
                      return (
                        <div key={i} className="issue-card" style={{
                          padding: "12px 14px",
                          borderRadius: 8,
                          background: cfg.bg,
                          border: `1px solid ${cfg.border}`,
                          animationDelay: `${i * 0.05}s`,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span>{cfg.icon}</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>{issue.title}</span>
                            </div>
                            <span style={{ fontSize: 10, color: "#444" }}>{issue.line}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "#888", lineHeight: 1.6 }}>{issue.description}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeTab === "refactored" && (
                  <div style={{
                    background: "#0d0d15",
                    borderRadius: 8,
                    border: "1px solid #1a1a2e",
                    padding: 16,
                    fontSize: 12,
                    lineHeight: "20px",
                    color: "#c9d1d9",
                    whiteSpace: "pre-wrap",
                    fontFamily: "inherit",
                  }}>{review.refactored}</div>
                )}

                {activeTab === "tips" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {review.improvements?.map((tip, i) => (
                      <div key={i} className="issue-card" style={{
                        padding: "12px 14px",
                        borderRadius: 8,
                        background: "rgba(0,221,136,0.05)",
                        border: "1px solid rgba(0,221,136,0.15)",
                        fontSize: 12,
                        color: "#aaa",
                        lineHeight: 1.6,
                        display: "flex",
                        gap: 10,
                        animationDelay: `${i * 0.05}s`,
                      }}>
                        <span style={{ color: "#00dd88", fontWeight: 700, minWidth: 20 }}>{i + 1}.</span>
                        {tip}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
