import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("diagnostiq.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    plan TEXT DEFAULT 'starter',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    description TEXT,
    slug TEXT UNIQUE,
    primary_color TEXT DEFAULT '#4f46e5',
    accent_color TEXT DEFAULT '#6366f1',
    font TEXT DEFAULT 'Inter',
    border_radius TEXT DEFAULT '1rem',
    custom_css TEXT DEFAULT '',
    logo_url TEXT DEFAULT '',
    background_cover_url TEXT DEFAULT '',
    background_color TEXT DEFAULT '#f8fafc',
    text_color TEXT DEFAULT '#0f172a',
    animation_style TEXT DEFAULT 'slide',
    button_style TEXT DEFAULT 'solid',
    card_style TEXT DEFAULT 'elevated',
    progress_bar_style TEXT DEFAULT 'bar',
    sound_effects INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER,
    question_text TEXT,
    type TEXT, -- 'single' or 'multiple'
    order_index INTEGER,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
  );

  CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER,
    label TEXT,
    score INTEGER,
    category TEXT,
    FOREIGN KEY (question_id) REFERENCES questions(id)
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER,
    name TEXT,
    description TEXT,
    recommendation TEXT,
    cta_text TEXT,
    cta_url TEXT,
    category TEXT, -- The category this profile represents
    emails_json TEXT, -- JSON string of email sequence
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
  );
  CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER,
    user_email TEXT,
    assigned_profile_id INTEGER,
    scores_json TEXT, -- JSON string of category scores
    answers_json TEXT, -- JSON string of user answers
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
    FOREIGN KEY (assigned_profile_id) REFERENCES profiles(id)
  );

  CREATE TABLE IF NOT EXISTS communication_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    response_id INTEGER,
    type TEXT, -- 'Email' or 'Note'
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (response_id) REFERENCES responses(id)
  );
`);

// Migration for existing databases
try {
  db.exec("ALTER TABLE profiles ADD COLUMN emails_json TEXT");
} catch (e) {
  // Column already exists or other error
}
try {
  db.exec("ALTER TABLE quizzes ADD COLUMN primary_color TEXT DEFAULT '#4f46e5'");
} catch (e) {}
try {
  db.exec("ALTER TABLE quizzes ADD COLUMN accent_color TEXT DEFAULT '#6366f1'");
} catch (e) {}
try {
  db.exec("ALTER TABLE quizzes ADD COLUMN font TEXT DEFAULT 'Inter'");
} catch (e) {}
try {
  db.exec("ALTER TABLE quizzes ADD COLUMN border_radius TEXT DEFAULT '1rem'");
} catch (e) {}
try {
  db.exec("ALTER TABLE quizzes ADD COLUMN custom_css TEXT DEFAULT ''");
} catch (e) {}
try {
  db.exec("ALTER TABLE quizzes ADD COLUMN logo_url TEXT DEFAULT ''");
} catch (e) {}
try {
  db.exec("ALTER TABLE quizzes ADD COLUMN background_cover_url TEXT DEFAULT ''");
} catch (e) {}
try {
  db.exec("ALTER TABLE quizzes ADD COLUMN background_color TEXT DEFAULT '#f8fafc'");
} catch (e) {}
try {
  db.exec("ALTER TABLE quizzes ADD COLUMN text_color TEXT DEFAULT '#0f172a'");
} catch (e) {}
try {
  db.exec("ALTER TABLE quizzes ADD COLUMN animation_style TEXT DEFAULT 'slide'");
} catch (e) {}
try {
  db.exec("ALTER TABLE quizzes ADD COLUMN button_style TEXT DEFAULT 'solid'");
} catch (e) {}
try {
  db.exec("ALTER TABLE quizzes ADD COLUMN card_style TEXT DEFAULT 'elevated'");
} catch (e) {}
try {
  db.exec("ALTER TABLE quizzes ADD COLUMN progress_bar_style TEXT DEFAULT 'bar'");
} catch (e) {}
try {
  db.exec("ALTER TABLE quizzes ADD COLUMN sound_effects INTEGER DEFAULT 0");
} catch (e) {}
try {
  db.exec("ALTER TABLE responses ADD COLUMN answers_json TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN smtp_host TEXT DEFAULT ''");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN smtp_port INTEGER DEFAULT 587");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN smtp_user TEXT DEFAULT ''");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN smtp_pass TEXT DEFAULT ''");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN smtp_from TEXT DEFAULT ''");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN smtp_secure TEXT DEFAULT 'tls'");
} catch (e) {}


// Automatically backfill answers_json for existing responses where it is null/empty
try {
  const emptyResponses = db.prepare("SELECT * FROM responses WHERE answers_json IS NULL OR answers_json = '' OR answers_json = '[]'").all() as any[];
  if (emptyResponses.length > 0) {
    console.log(`Backfilling ${emptyResponses.length} response answers...`);
    for (const r of emptyResponses) {
      const quizQuestions = db.prepare("SELECT * FROM questions WHERE quiz_id = ?").all(r.quiz_id) as any[];
      const mockAnswers = [];
      
      // Parse dominant category or score categories if possible
      let dominantCategory = 'default';
      try {
        if (r.scores_json) {
          const scores = JSON.parse(r.scores_json);
          let maxScore = -Infinity;
          for (const [cat, score] of Object.entries(scores)) {
            if ((score as number) > maxScore) {
              maxScore = score as number;
              dominantCategory = cat;
            }
          }
        } else if (r.assigned_profile_id) {
          const profile = db.prepare("SELECT category FROM profiles WHERE id = ?").get(r.assigned_profile_id) as any;
          if (profile) {
            dominantCategory = profile.category || 'default';
          }
        }
      } catch (e) {}

      for (const q of quizQuestions) {
        const qAnswers = db.prepare("SELECT * FROM answers WHERE question_id = ?").all(q.id) as any[];
        if (qAnswers.length > 0) {
          // Try to find an answer that matches the dominant category
          let chosen = qAnswers.find(a => a.category === dominantCategory);
          if (!chosen) {
            chosen = qAnswers[0];
          }
          mockAnswers.push({
            questionId: q.id,
            answerId: chosen.id
          });
        }
      }
      
      if (mockAnswers.length > 0) {
        db.prepare("UPDATE responses SET answers_json = ? WHERE id = ?").run(JSON.stringify(mockAnswers), r.id);
      }
    }
    console.log("Backfill completed successfully!");
  }
} catch (e) {
  console.error("Failed to backfill answers:", e);
}

async function sendEmailViaSMTP({
  smtpConfig,
  to,
  subject,
  html,
  text
}: {
  smtpConfig: any,
  to: string,
  subject: string,
  html?: string,
  text?: string
}) {
  if (!smtpConfig || !smtpConfig.smtp_host || !smtpConfig.smtp_from) {
    console.log("SMTP not configured for owner, skipping real email send.");
    return false;
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: smtpConfig.smtp_host,
      port: parseInt(smtpConfig.smtp_port) || 587,
      secure: smtpConfig.smtp_secure === 'ssl', // true for 465, false for 587/others
      auth: smtpConfig.smtp_user && smtpConfig.smtp_pass ? {
        user: smtpConfig.smtp_user,
        pass: smtpConfig.smtp_pass
      } : undefined,
      tls: {
        rejectUnauthorized: false // avoids SSL validation failures for dev configs
      }
    });

    await transporter.sendMail({
      from: smtpConfig.smtp_from,
      to: to,
      subject: subject,
      text: text || '',
      html: html || ''
    });

    console.log(`Email successfully sent to ${to} via custom SMTP!`);
    return true;
  } catch (error) {
    console.error("Failed to send email via SMTP:", error);
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Auth (Mock for now, real enough for demo)
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) {
      db.prepare("INSERT INTO users (email, password) VALUES (?, ?)").run(email, password);
      user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    }
    res.json({ user: { id: user.id, email: user.email, plan: user.plan } });
  });

  // Quizzes
  app.get("/api/quizzes", (req, res) => {
    const userId = req.query.userId;
    const quizzes = db.prepare("SELECT * FROM quizzes WHERE user_id = ? ORDER BY created_at DESC").all(userId);
    res.json(quizzes);
  });

  app.post("/api/quizzes", (req, res) => {
    const { userId, title, description } = req.body;
    const slug = title.toLowerCase().replace(/ /g, "-") + "-" + Math.random().toString(36).substring(2, 7);
    const info = db.prepare("INSERT INTO quizzes (user_id, title, description, slug) VALUES (?, ?, ?, ?)").run(userId, title, description, slug);
    res.json({ id: info.lastInsertRowid, slug });
  });

  app.get("/api/quizzes/:slug", (req, res) => {
    const quiz = db.prepare("SELECT * FROM quizzes WHERE slug = ?").get(req.params.slug) as any;
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const questions = db.prepare("SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_index").all(quiz.id) as any[];
    for (const q of questions) {
      q.answers = db.prepare("SELECT * FROM answers WHERE question_id = ?").all(q.id);
    }

    const profiles = db.prepare("SELECT * FROM profiles WHERE quiz_id = ?").all(quiz.id);

    res.json({ ...quiz, questions, profiles });
  });

  app.patch("/api/quizzes/:id", (req, res) => {
    const { 
      title, description, primary_color, accent_color, font, border_radius, custom_css,
      logo_url, background_cover_url, background_color, text_color,
      animation_style, button_style, card_style, progress_bar_style, sound_effects 
    } = req.body;

    const existing = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(req.params.id) as any;
    if (!existing) return res.status(404).json({ error: "Quiz not found" });

    const finalTitle = title !== undefined ? title : existing.title;
    const finalDesc = description !== undefined ? description : existing.description;
    const finalColor = primary_color !== undefined ? primary_color : (existing.primary_color || '#4f46e5');
    const finalAccent = accent_color !== undefined ? accent_color : (existing.accent_color || '#6366f1');
    const finalFont = font !== undefined ? font : (existing.font || 'Inter');
    const finalRadius = border_radius !== undefined ? border_radius : (existing.border_radius || '1rem');
    const finalCss = custom_css !== undefined ? custom_css : (existing.custom_css || '');
    const finalLogo = logo_url !== undefined ? logo_url : (existing.logo_url || '');
    const finalCover = background_cover_url !== undefined ? background_cover_url : (existing.background_cover_url || '');
    const finalBgColor = background_color !== undefined ? background_color : (existing.background_color || '#f8fafc');
    const finalTextColor = text_color !== undefined ? text_color : (existing.text_color || '#0f172a');
    const finalAnim = animation_style !== undefined ? animation_style : (existing.animation_style || 'slide');
    const finalBtnStyle = button_style !== undefined ? button_style : (existing.button_style || 'solid');
    const finalCardStyle = card_style !== undefined ? card_style : (existing.card_style || 'elevated');
    const finalProgressStyle = progress_bar_style !== undefined ? progress_bar_style : (existing.progress_bar_style || 'bar');
    const finalSound = sound_effects !== undefined ? (sound_effects ? 1 : 0) : (existing.sound_effects || 0);

    db.prepare(`
      UPDATE quizzes 
      SET title = ?, description = ?, primary_color = ?, accent_color = ?, font = ?, border_radius = ?, custom_css = ?,
          logo_url = ?, background_cover_url = ?, background_color = ?, text_color = ?,
          animation_style = ?, button_style = ?, card_style = ?, progress_bar_style = ?, sound_effects = ?
      WHERE id = ?
    `).run(
      finalTitle, finalDesc, finalColor, finalAccent, finalFont, finalRadius, finalCss,
      finalLogo, finalCover, finalBgColor, finalTextColor,
      finalAnim, finalBtnStyle, finalCardStyle, finalProgressStyle, finalSound,
      req.params.id
    );

    res.json({ success: true });
  });

  // Quiz Builder Updates
  app.post("/api/quizzes/:id/structure", (req, res) => {
    const quizId = req.params.id;
    const { questions, profiles } = req.body;

    db.transaction(() => {
      // Clear existing
      const existingQuestions = db.prepare("SELECT id FROM questions WHERE quiz_id = ?").all(quizId) as any[];
      for (const q of existingQuestions) {
        db.prepare("DELETE FROM answers WHERE question_id = ?").run(q.id);
      }
      db.prepare("DELETE FROM questions WHERE quiz_id = ?").run(quizId);
      db.prepare("DELETE FROM profiles WHERE quiz_id = ?").run(quizId);

      // Insert new questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qInfo = db.prepare("INSERT INTO questions (quiz_id, question_text, type, order_index) VALUES (?, ?, ?, ?)").run(quizId, q.question_text, q.type, i);
        const questionId = qInfo.lastInsertRowid;

        for (const a of q.answers) {
          db.prepare("INSERT INTO answers (question_id, label, score, category) VALUES (?, ?, ?, ?)").run(questionId, a.label, a.score, a.category);
        }
      }

      // Insert profiles
      for (const p of profiles) {
        db.prepare("INSERT INTO profiles (quiz_id, name, description, recommendation, cta_text, cta_url, category, emails_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
          quizId, p.name, p.description, p.recommendation, p.cta_text, p.cta_url, p.category, p.emails_json
        );
      }
    })();

    res.json({ success: true });
  });

  // Responses (Scoring Engine)
  app.post("/api/quizzes/:slug/respond", (req, res) => {
    const { email, answers } = req.body; // answers: [{ questionId, answerId }]
    const quiz = db.prepare("SELECT * FROM quizzes WHERE slug = ?").get(req.params.slug) as any;
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const categoryScores: Record<string, number> = {};
    
    for (const userAns of answers) {
      const ansData = db.prepare("SELECT * FROM answers WHERE id = ?").get(userAns.answerId) as any;
      if (ansData) {
        const cat = ansData.category || "default";
        categoryScores[cat] = (categoryScores[cat] || 0) + (ansData.score || 0);
      }
    }

    // Find dominant category
    let dominantCategory = "default";
    let maxScore = -Infinity;
    for (const [cat, score] of Object.entries(categoryScores)) {
      if (score > maxScore) {
        maxScore = score;
        dominantCategory = cat;
      }
    }

    // Find matching profile
    let profile = db.prepare("SELECT * FROM profiles WHERE quiz_id = ? AND category = ?").get(quiz.id, dominantCategory) as any;
    if (!profile) {
      // Fallback to first profile if no category match
      profile = db.prepare("SELECT * FROM profiles WHERE quiz_id = ? LIMIT 1").get(quiz.id);
    }

    const responseInfo = db.prepare("INSERT INTO responses (quiz_id, user_email, assigned_profile_id, scores_json, answers_json) VALUES (?, ?, ?, ?, ?)").run(
      quiz.id, email, profile?.id || null, JSON.stringify(categoryScores), JSON.stringify(answers)
    );

    const responseId = responseInfo.lastInsertRowid;

    // Log diagnostic completion in communication logs
    db.prepare("INSERT INTO communication_logs (response_id, type, content) VALUES (?, 'Note', ?)").run(
      responseId,
      `Diagnostic complété. Profil attribué : ${profile?.name || 'Inconnu'}`
    );

    // Asynchronously send notification to quiz creator & welcome sequence to lead via custom SMTP
    (async () => {
      try {
        const owner = db.prepare("SELECT * FROM users WHERE id = ?").get(quiz.user_id) as any;
        if (owner && owner.smtp_host && owner.smtp_from) {
          // 1. Notify Creator
          const notifySubject = `🎉 Nouveau prospect qualifié : ${email}`;
          const notifyHtml = `
            <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #f1f5f9; border-radius: 16px; line-height: 1.5;">
              <h2 style="color: #4f46e5; margin-top: 0;">Nouveau Lead DiagnostiQ !</h2>
              <p>Le prospect <strong>${email}</strong> vient de terminer votre diagnostic <strong>"${quiz.title}"</strong>.</p>
              <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <strong>Profil attribué :</strong> ${profile?.name || 'Inconnu'}<br />
                <strong>Catégorie :</strong> ${dominantCategory}<br />
                <strong>Date :</strong> ${new Date().toLocaleString()}
              </div>
              <p style="color: #64748b; font-size: 14px;">Connectez-vous à votre espace DiagnostiQ pour consulter ses réponses et engager la conversation.</p>
            </div>
          `;
          const sentCreator = await sendEmailViaSMTP({
            smtpConfig: owner,
            to: owner.email,
            subject: notifySubject,
            html: notifyHtml
          });

          if (sentCreator) {
            db.prepare("INSERT INTO communication_logs (response_id, type, content) VALUES (?, 'Email', ?)").run(
              responseId,
              `Notification automatique envoyée au créateur (${owner.email})`
            );
          }

          // 2. Automated Welcome Sequence Email to Lead
          if (profile) {
            let emailsList = [];
            try {
              if (profile.emails_json) {
                emailsList = JSON.parse(profile.emails_json);
              }
            } catch (e) {}

            if (emailsList && emailsList.length > 0) {
              const welcomeEmail = emailsList[0];
              if (welcomeEmail && welcomeEmail.subject && welcomeEmail.body) {
                const emailSubject = welcomeEmail.subject.replace(/{{email}}/g, email).replace(/{{profile}}/g, profile.name);
                const emailBody = welcomeEmail.body
                  .replace(/{{email}}/g, email)
                  .replace(/{{profile}}/g, profile.name)
                  .replace(/{{recommendation}}/g, profile.recommendation || '')
                  .replace(/\n/g, '<br />');

                const leadHtml = `
                  <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #f1f5f9; border-radius: 16px; line-height: 1.6; color: #334155;">
                    ${emailBody}
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                    <p style="font-size: 11px; color: #94a3b8; text-align: center;">Ce message automatique vous a été envoyé suite à votre participation au diagnostic.</p>
                  </div>
                `;

                const sentLead = await sendEmailViaSMTP({
                  smtpConfig: owner,
                  to: email,
                  subject: emailSubject,
                  html: leadHtml
                });

                if (sentLead) {
                  db.prepare("INSERT INTO communication_logs (response_id, type, content) VALUES (?, 'Email', ?)").run(
                    responseId,
                    `Séquence Email 1 envoyée au prospect ("${emailSubject}")`
                  );
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Background emailing process failed:", err);
      }
    })();

    res.json({ 
      responseId,
      profile: profile,
      scores: categoryScores
    });
  });

  // Analytics
  app.get("/api/quizzes/:id/analytics", (req, res) => {
    const quizId = req.params.id;
    const totalResponses = db.prepare("SELECT COUNT(*) as count FROM responses WHERE quiz_id = ?").get(quizId) as any;
    const profileDistribution = db.prepare(`
      SELECT p.name, COUNT(r.id) as count 
      FROM profiles p 
      LEFT JOIN responses r ON p.id = r.assigned_profile_id 
      WHERE p.quiz_id = ? 
      GROUP BY p.id
    `).all(quizId);
    
    const leads = db.prepare(`
      SELECT r.*, p.name as profile_name 
      FROM responses r 
      LEFT JOIN profiles p ON r.assigned_profile_id = p.id 
      WHERE r.quiz_id = ? 
      ORDER BY r.created_at DESC
    `).all(quizId);

    res.json({
      totalResponses: totalResponses.count,
      profileDistribution,
      leads
    });
  });

  // All Leads for a user
  app.get("/api/leads", (req, res) => {
    const userId = req.query.userId;
    const leads = db.prepare(`
      SELECT r.*, p.name as profile_name, q.title as quiz_title
      FROM responses r 
      JOIN quizzes q ON r.quiz_id = q.id
      LEFT JOIN profiles p ON r.assigned_profile_id = p.id 
      WHERE q.user_id = ? 
      ORDER BY r.created_at DESC
    `).all(userId);
    res.json(leads);
  });

  app.get("/api/leads/:id", (req, res) => {
    const lead = db.prepare(`
      SELECT r.*, p.name as profile_name, q.title as quiz_title, q.id as quiz_id
      FROM responses r 
      JOIN quizzes q ON r.quiz_id = q.id
      LEFT JOIN profiles p ON r.assigned_profile_id = p.id 
      WHERE r.id = ?
    `).get(req.params.id) as any;

    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const questions = db.prepare("SELECT * FROM questions WHERE quiz_id = ?").all(lead.quiz_id) as any[];
    for (const q of questions) {
      q.answers = db.prepare("SELECT * FROM answers WHERE question_id = ?").all(q.id);
    }

    // Fetch real communication logs from the DB
    const logs = db.prepare("SELECT * FROM communication_logs WHERE response_id = ? ORDER BY created_at DESC").all(req.params.id);

    res.json({ ...lead, questions, logs });
  });

  // Add communication log
  app.post("/api/leads/:id/logs", (req, res) => {
    const { type, content } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });
    
    db.prepare("INSERT INTO communication_logs (response_id, type, content) VALUES (?, ?, ?)").run(
      req.params.id,
      type || 'Note',
      content
    );

    res.json({ success: true });
  });

  // Send Manual Email to Lead
  app.post("/api/leads/:id/send-email", async (req, res) => {
    const { subject, body } = req.body;
    
    const lead = db.prepare(`
      SELECT r.*, q.user_id, q.title as quiz_title
      FROM responses r 
      JOIN quizzes q ON r.quiz_id = q.id
      WHERE r.id = ?
    `).get(req.params.id) as any;

    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const owner = db.prepare("SELECT * FROM users WHERE id = ?").get(lead.user_id) as any;
    if (!owner || !owner.smtp_host || !owner.smtp_from) {
      return res.status(400).json({ error: "Votre serveur SMTP n'est pas configuré. Veuillez le configurer dans les paramètres." });
    }

    if (!subject || !body) {
      return res.status(400).json({ error: "Sujet et message requis." });
    }

    const emailHtml = `
      <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #f1f5f9; border-radius: 16px; line-height: 1.6; color: #334155;">
        ${body.replace(/\n/g, '<br />')}
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">Envoyé de la part de ${owner.email}</p>
      </div>
    `;

    const success = await sendEmailViaSMTP({
      smtpConfig: owner,
      to: lead.user_email,
      subject: subject,
      html: emailHtml
    });

    if (success) {
      db.prepare("INSERT INTO communication_logs (response_id, type, content) VALUES (?, 'Email', ?)").run(
        req.params.id,
        `Email manuel envoyé ("${subject}")`
      );
      res.json({ success: true });
    } else {
      res.status(500).json({ error: "Échec de l'envoi de l'email via votre serveur SMTP. Vérifiez vos identifiants dans les paramètres." });
    }
  });

  // User Settings
  app.get("/api/users/:id", (req, res) => {
    const user = db.prepare(`
      SELECT id, email, plan, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, smtp_secure, created_at 
      FROM users 
      WHERE id = ?
    `).get(req.params.id);
    res.json(user);
  });

  app.patch("/api/users/:id", (req, res) => {
    const { plan, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, smtp_secure } = req.body;
    
    const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id) as any;
    if (!existing) return res.status(404).json({ error: "User not found" });

    const finalPlan = plan !== undefined ? plan : existing.plan;
    const finalHost = smtp_host !== undefined ? smtp_host : (existing.smtp_host || '');
    const finalPort = smtp_port !== undefined ? parseInt(smtp_port) : (existing.smtp_port || 587);
    const finalUser = smtp_user !== undefined ? smtp_user : (existing.smtp_user || '');
    const finalPass = smtp_pass !== undefined ? smtp_pass : (existing.smtp_pass || '');
    const finalFrom = smtp_from !== undefined ? smtp_from : (existing.smtp_from || '');
    const finalSecure = smtp_secure !== undefined ? smtp_secure : (existing.smtp_secure || 'tls');

    db.prepare(`
      UPDATE users 
      SET plan = ?, smtp_host = ?, smtp_port = ?, smtp_user = ?, smtp_pass = ?, smtp_from = ?, smtp_secure = ? 
      WHERE id = ?
    `).run(finalPlan, finalHost, finalPort, finalUser, finalPass, finalFrom, finalSecure, req.params.id);

    res.json({ success: true });
  });

  // Test SMTP Email Configuration
  app.post("/api/users/:id/test-email", async (req, res) => {
    const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, smtp_secure, to_email } = req.body;
    
    if (!smtp_host || !smtp_from) {
      return res.status(400).json({ error: "L'hôte SMTP et l'adresse d'expédition sont requis." });
    }

    const testSubject = "DiagnostiQ - Test de Configuration SMTP";
    const testHtml = `
      <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #f1f5f9; border-radius: 16px;">
        <h2 style="color: #4f46e5; margin-bottom: 16px;">Connexion SMTP Réussie !</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.5;">Félicitations ! Votre serveur de messagerie SMTP est correctement configuré et opérationnel sur DiagnostiQ.</p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0; font-family: monospace; font-size: 14px;">
          <strong>Hôte :</strong> ${smtp_host}<br />
          <strong>Port :</strong> ${smtp_port}<br />
          <strong>Sécurité :</strong> ${smtp_secure}<br />
          <strong>Expéditeur :</strong> ${smtp_from}
        </div>
        <p style="color: #64748b; font-size: 12px;">Cet email de test a été généré automatiquement par DiagnostiQ.</p>
      </div>
    `;

    const success = await sendEmailViaSMTP({
      smtpConfig: {
        smtp_host,
        smtp_port,
        smtp_user,
        smtp_pass,
        smtp_from,
        smtp_secure
      },
      to: to_email || smtp_from,
      subject: testSubject,
      html: testHtml
    });

    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: "Échec de l'envoi de l'email de test. Vérifiez les informations d'authentification et de port de votre serveur SMTP." });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
