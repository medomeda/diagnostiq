import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Settings, 
  LogOut, 
  ChevronRight, 
  BarChart3, 
  Users, 
  FileText,
  BrainCircuit,
  Zap,
  CheckCircle2,
  ArrowRight,
  ClipboardList,
  Target,
  MessageSquare,
  TrendingUp,
  Clock,
  Mail,
  Palette,
  Eye,
  Sparkles
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { User, Quiz, Question, Profile, Lead } from './types';

// --- Mock API Client ---
const api = {
  login: async (email: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password' })
    });
    return res.json();
  },
  getQuizzes: async (userId: number) => {
    const res = await fetch(`/api/quizzes?userId=${userId}`);
    return res.json();
  },
  createQuiz: async (userId: number, title: string, description: string) => {
    const res = await fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, description })
    });
    return res.json();
  },
  getQuiz: async (slug: string) => {
    const res = await fetch(`/api/quizzes/${slug}`);
    return res.json();
  },
  saveQuizStructure: async (quizId: number, questions: Question[], profiles: Profile[]) => {
    const res = await fetch(`/api/quizzes/${quizId}/structure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions, profiles })
    });
    return res.json();
  },
  updateQuizMetadata: async (quizId: number, settings: Partial<Quiz>) => {
    const res = await fetch(`/api/quizzes/${quizId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.json();
  },
  submitResponse: async (slug: string, email: string, answers: any[]) => {
    const res = await fetch(`/api/quizzes/${slug}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, answers })
    });
    return res.json();
  },
  getAnalytics: async (quizId: number) => {
    const res = await fetch(`/api/quizzes/${quizId}/analytics`);
    return res.json();
  },
  getAllLeads: async (userId: number) => {
    const res = await fetch(`/api/leads?userId=${userId}`);
    return res.json();
  },
  getLeadDetails: async (leadId: number) => {
    const res = await fetch(`/api/leads/${leadId}`);
    return res.json();
  },
  updateUserSettings: async (userId: number, plan: string, smtpSettings?: { smtp_host?: string; smtp_port?: number; smtp_user?: string; smtp_pass?: string; smtp_from?: string; smtp_secure?: string }) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, ...smtpSettings })
    });
    return res.json();
  },
  testSMTPSettings: async (userId: number, smtpSettings: { smtp_host: string; smtp_port: number; smtp_user: string; smtp_pass: string; smtp_from: string; smtp_secure: string; to_email?: string }) => {
    const res = await fetch(`/api/users/${userId}/test-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(smtpSettings)
    });
    return res.json();
  },
  sendLeadEmail: async (leadId: number, subject: string, body: string) => {
    const res = await fetch(`/api/leads/${leadId}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body })
    });
    return res.json();
  },
  addLeadLog: async (leadId: number, type: string, content: string) => {
    const res = await fetch(`/api/leads/${leadId}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content })
    });
    return res.json();
  },
  generateQuizAI: async (opts: {
    description: string;
    numQuestions?: number;
    numAnswers?: number;
    numProfiles?: number;
    questionType?: 'single' | 'multiple' | 'mixed';
    tone?: string;
    themePreset?: string;
  }) => {
    const { GoogleGenAI, Type } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    
    const numQ = opts.numQuestions || 5;
    const numA = opts.numAnswers || 4;
    const numP = opts.numProfiles || 3;
    const tone = opts.tone || "Professionnel & Particulier";
    const qType = opts.questionType || "single";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Génère un quiz de diagnostic hautement qualifiant pour l'activité suivante : "${opts.description}". 
      CONRAINTES STRICTES DE STRUCTURE :
      1. Génère exactement ${numQ} questions pertinentes.
      2. Chaque question DOIT comporter EXACTEMENT ${numA} options de réponses choisissables.
      3. Crée exactement ${numP} profils de résultats distincts (ex: "debutant", "intermediaire", "expert" ou des profils thématiques).
      4. Le ton général du texte doit être : "${tone}".
      5. Chaque option de réponse doit comporter un label clair, un score (entre 1 et 10) et être rattachée à la catégorie d'un des ${numP} profils.
      6. Propose également une recommandation de thème visuel adaptée (couleur principale HEX, style de bouton, etc.).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedTitle: { type: Type.STRING },
            suggestedDescription: { type: Type.STRING },
            recommendedTheme: {
              type: Type.OBJECT,
              properties: {
                primary_color: { type: Type.STRING },
                accent_color: { type: Type.STRING },
                font: { type: Type.STRING },
                border_radius: { type: Type.STRING },
                animation_style: { type: Type.STRING },
                button_style: { type: Type.STRING },
                card_style: { type: Type.STRING }
              }
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question_text: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["single", "multiple"] },
                  answers: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        score: { type: Type.NUMBER },
                        category: { type: Type.STRING }
                      },
                      required: ["label", "score", "category"]
                    }
                  }
                },
                required: ["question_text", "type", "answers"]
              }
            },
            profiles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                  cta_text: { type: Type.STRING },
                  cta_url: { type: Type.STRING },
                  category: { type: Type.STRING }
                },
                required: ["name", "description", "recommendation", "cta_text", "category"]
              }
            }
          },
          required: ["questions", "profiles"]
        }
      }
    });
    
    return JSON.parse(response.text!);
  },
  generateEmailsAI: async (profileName: string, profileDesc: string, instructions: string) => {
    const { GoogleGenAI, Type } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Génère une séquence de 5 emails de vente hautement personnalisés pour le profil suivant :
      Nom du profil : ${profileName}
      Description du profil : ${profileDesc}
      
      Structure de la séquence :
      1. Email 1 : Bienvenue & Empathie (reconnaître leur situation spécifique).
      2. Email 2 : Valeur & Éducation (apporter une solution immédiate ou un conseil).
      3. Email 3 : Preuve sociale ou Étude de cas (montrer que d'autres ont réussi).
      4. Email 4 : L'Offre & Urgence (présenter la solution premium et pourquoi c'est le moment).
      5. Email 5 : Dernier rappel (répondre aux objections courantes).
      
      Instructions spécifiques / Ton : ${instructions || "Les emails doivent être engageants, empathiques et mener vers une offre premium."}
      
      Utilise des placeholders comme [Prénom] pour la personnalisation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              body: { type: Type.STRING }
            },
            required: ["subject", "body"]
          }
        }
      }
    });
    
    return JSON.parse(response.text!);
  }
};

// --- Mock Data ---

const MOCK_STATS = {
  totalLeads: 1284,
  completionRate: 68,
  conversionRate: 24,
  activeQuizzes: 5,
  leadsTrend: [
    { name: 'Lun', value: 45 },
    { name: 'Mar', value: 52 },
    { name: 'Mer', value: 48 },
    { name: 'Jeu', value: 61 },
    { name: 'Ven', value: 55 },
    { name: 'Sam', value: 42 },
    { name: 'Dim', value: 38 },
  ],
  conversionTrend: [
    { name: 'Sem 1', value: 18 },
    { name: 'Sem 2', value: 22 },
    { name: 'Sem 3', value: 20 },
    { name: 'Sem 4', value: 24 },
  ],
  profileDistribution: {
    'all': [
      { name: 'Débutant', value: 450, color: '#6366f1' },
      { name: 'Intermédiaire', value: 620, color: '#8b5cf6' },
      { name: 'Expert', value: 214, color: '#ec4899' },
    ],
    '1': [
      { name: 'Débutant', value: 120, color: '#6366f1' },
      { name: 'Intermédiaire', value: 250, color: '#8b5cf6' },
      { name: 'Expert', value: 180, color: '#ec4899' },
    ],
    '2': [
      { name: 'Débutant', value: 330, color: '#6366f1' },
      { name: 'Intermédiaire', value: 370, color: '#8b5cf6' },
      { name: 'Expert', value: 34, color: '#ec4899' },
    ]
  }
};

const MOCK_RECENT_LEADS = [
  { id: 1, email: 'thomas.durand@gmail.com', quiz: 'Diagnostic Business', quizId: 1, profile: 'Expert', date: '2024-03-07', status: 'Nouveau' },
  { id: 2, email: 'sophie.martin@outlook.fr', quiz: 'Audit Productivité', quizId: 2, profile: 'Débutant', date: '2024-03-07', status: 'Contacté' },
  { id: 3, email: 'marc.lefevre@startup.io', quiz: 'Diagnostic Business', quizId: 1, profile: 'Intermédiaire', date: '2024-03-06', status: 'En cours' },
  { id: 4, email: 'julie.bernard@freelance.com', quiz: 'Audit Productivité', quizId: 2, profile: 'Expert', date: '2024-03-05', status: 'Converti' },
  { id: 5, email: 'nicolas.petit@corp.com', quiz: 'Diagnostic Business', quizId: 1, profile: 'Débutant', date: '2024-03-04', status: 'Perdu' },
  { id: 6, email: 'lea.dubois@web.fr', quiz: 'Audit Productivité', quizId: 2, profile: 'Intermédiaire', date: '2024-03-03', status: 'Nouveau' },
];

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }: any) => {
  const variants: any = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
    ghost: 'bg-transparent text-slate-500 hover:bg-slate-100',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, placeholder, type = 'text', className = '' }: any) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
    />
  </div>
);

const Modal = ({ isOpen, onClose, title, children }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-900">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">×</button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- Pages ---

const LandingPage = ({ onStart }: { onStart: () => void }) => (
  <div className="min-h-screen bg-slate-50">
    <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
      <div className="flex items-center gap-2 font-display font-bold text-2xl text-indigo-600">
        <BrainCircuit className="w-8 h-8" />
        <span>DiagnostiQ</span>
      </div>
      <Button variant="secondary" onClick={onStart}>Log In</Button>
    </nav>

    <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
      <div className="text-center max-w-3xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium"
        >
          <Zap className="w-4 h-4" />
          <span>The Future of Lead Segmentation</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl font-display font-bold tracking-tight text-slate-900 leading-[1.1]"
        >
          Transformez vos quiz en moteur de <span className="text-indigo-600">conversion intelligent.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-slate-600 leading-relaxed"
        >
          Diagnostiquez les besoins de vos prospects, attribuez automatiquement un profil et déclenchez un parcours de vente personnalisé.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-4 pt-4"
        >
          <Button onClick={onStart} className="px-8 py-4 text-lg">
            Créer mon diagnostic <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="secondary" className="px-8 py-4 text-lg">Voir la démo</Button>
        </motion.div>
      </div>

      <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Target, title: "Segmentation Précise", desc: "Attribuez automatiquement des profils basés sur des scores stratégiques." },
          { icon: MessageSquare, title: "Parcours Personnalisé", desc: "Offrez des recommandations uniques à chaque prospect selon ses besoins." },
          { icon: BarChart3, title: "Analytics Avancés", desc: "Comprenez votre audience et identifiez les segments les plus rentables." }
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6">
              <feature.icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
            <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </main>
  </div>
);

const AuthPage = ({ onAuth }: { onAuth: (user: User) => void }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const data = await api.login(email);
      onAuth(data.user);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl border border-slate-100"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-200">
            <BrainCircuit className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-display font-bold text-slate-900">Bienvenue sur DiagnostiQ</h2>
          <p className="text-slate-500 mt-2">Connectez-vous pour gérer vos diagnostics</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <Input 
            label="Adresse Email" 
            placeholder="sarah@coach.com" 
            value={email} 
            onChange={setEmail} 
          />
          <Button type="submit" disabled={loading} className="w-full py-3 text-lg">
            {loading ? 'Connexion...' : 'Continuer'}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-8">
          En continuant, vous acceptez nos conditions d'utilisation.
        </p>
      </motion.div>
    </div>
  );
};

const DashboardView = ({ user, setView, onSelectQuiz }: { user: User, setView: (v: any) => void, onSelectQuiz: (q: Quiz) => void }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadsFilterQuiz, setLeadsFilterQuiz] = useState('all');
  const [leadsFilterStatus, setLeadsFilterStatus] = useState('all');
  const [profileDistQuiz, setProfileDistQuiz] = useState('all');

  useEffect(() => {
    api.getQuizzes(user.id).then(data => {
      setQuizzes(data);
      setLoading(false);
    });
  }, [user.id]);

  // Transform quizzes for the chart
  const quizPerformanceData = quizzes.map(q => ({
    name: q.title.length > 15 ? q.title.substring(0, 12) + '...' : q.title,
    leads: Math.floor(Math.random() * 500) + 100, // Mock data for performance
    fullTitle: q.title
  })).sort((a, b) => b.leads - a.leads).slice(0, 5);

  const filteredLeads = MOCK_RECENT_LEADS.filter(lead => {
    const quizMatch = leadsFilterQuiz === 'all' || lead.quizId.toString() === leadsFilterQuiz;
    const statusMatch = leadsFilterStatus === 'all' || lead.status === leadsFilterStatus;
    return quizMatch && statusMatch;
  });

  const currentProfileDist = MOCK_STATS.profileDistribution[profileDistQuiz as keyof typeof MOCK_STATS.profileDistribution] || MOCK_STATS.profileDistribution.all;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Vue d'ensemble</h1>
          <p className="text-slate-500">Bienvenue, {user.email}. Voici vos performances actuelles.</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 flex items-center gap-2">
            <Clock className="w-4 h-4" /> 7 derniers jours
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Leads', value: MOCK_STATS.totalLeads, trend: '+12%', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', target: 'leads' },
          { label: 'Diagnostics Actifs', value: quizzes.length || MOCK_STATS.activeQuizzes, trend: 'Stable', icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-50', target: 'quizzes' },
          { label: 'Taux de Complétion', value: `${MOCK_STATS.completionRate}%`, trend: '+3%', icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50', target: 'dashboard' },
          { label: 'Taux de Conversion', value: `${MOCK_STATS.conversionRate}%`, trend: '+5%', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50', target: 'dashboard' },
        ].map((stat, i) => (
          <div 
            key={i} 
            onClick={() => setView(stat.target)}
            className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                {stat.trend}
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-sm font-medium text-slate-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-8 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900">Acquisition de Leads</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> Cette semaine
              </span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_STATS.leadsTrend}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900">Distribution Profils</h3>
            <select 
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none"
              value={profileDistQuiz}
              onChange={(e) => setProfileDistQuiz(e.target.value)}
            >
              <option value="all">Tous les quiz</option>
              {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
            </select>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentProfileDist}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {currentProfileDist.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 pt-2">
            {currentProfileDist.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-bold text-slate-600">{item.name}</span>
                </div>
                <span className="text-xs font-black text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Row */}
      <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Performance des Diagnostics</h3>
            <p className="text-sm text-slate-400">Leads générés par quiz (Top 5)</p>
          </div>
          <Button variant="secondary" onClick={() => setView('quizzes')}>Voir tous les diagnostics</Button>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quizPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="leads" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold text-slate-900">Derniers Leads</h3>
              <div className="flex gap-2">
                <select 
                  className="text-[10px] bg-slate-50 border border-slate-100 rounded-md px-2 py-1 outline-none font-bold text-slate-500 uppercase"
                  value={leadsFilterQuiz}
                  onChange={(e) => setLeadsFilterQuiz(e.target.value)}
                >
                  <option value="all">Tous Quiz</option>
                  {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                </select>
                <select 
                  className="text-[10px] bg-slate-50 border border-slate-100 rounded-md px-2 py-1 outline-none font-bold text-slate-500 uppercase"
                  value={leadsFilterStatus}
                  onChange={(e) => setLeadsFilterStatus(e.target.value)}
                >
                  <option value="all">Tous Statuts</option>
                  <option value="Nouveau">Nouveau</option>
                  <option value="Contacté">Contacté</option>
                  <option value="En cours">En cours</option>
                  <option value="Converti">Converti</option>
                  <option value="Perdu">Perdu</option>
                </select>
              </div>
            </div>
            <Button variant="ghost" className="text-indigo-600 text-sm" onClick={() => setView('leads')}>Voir tout</Button>
          </div>
          <div className="divide-y divide-slate-50">
            {filteredLeads.length === 0 ? (
              <div className="px-8 py-12 text-center text-slate-400 text-sm">Aucun lead ne correspond aux filtres.</div>
            ) : (
              filteredLeads.map((lead) => (
                <div 
                  key={lead.id} 
                  onClick={() => setView('leads')}
                  className="px-8 py-4 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{lead.email}</div>
                      <div className="text-xs text-slate-400">{lead.quiz} • {new Date(lead.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${
                      lead.status === 'Converti' ? 'bg-emerald-100 text-emerald-700' : 
                      lead.status === 'Perdu' ? 'bg-slate-100 text-slate-500' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {lead.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      lead.profile === 'Expert' ? 'bg-rose-50 text-rose-600' : 
                      lead.profile === 'Débutant' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {lead.profile}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-900">Conseils IA</h3>
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-indigo-900 text-sm">Optimisez votre conversion</h4>
                <p className="text-xs text-indigo-700 leading-relaxed">Le profil "Expert" a un taux de clic sur CTA 40% supérieur. Envisagez de personnaliser davantage l'offre pour les "Débutants".</p>
              </div>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-emerald-900 text-sm">Tendance à la hausse</h4>
                <p className="text-xs text-emerald-700 leading-relaxed">Votre volume de leads a augmenté de 15% depuis que vous avez ajouté le diagnostic "Audit Productivité".</p>
              </div>
            </div>
          </div>
          <Button variant="secondary" className="w-full py-4 bg-slate-50 border-none text-slate-600 hover:bg-slate-100" onClick={() => setView('quizzes')}>
            Gérer mes diagnostics
          </Button>
        </div>
      </div>
    </div>
  );
};

const DiagnosticsView = ({ user, onSelectQuiz }: { user: User, onSelectQuiz: (q: Quiz) => void }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDesc, setNewQuizDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [quizzesData, leadsData] = await Promise.all([
        api.getQuizzes(user.id),
        api.getAllLeads(user.id)
      ]);
      setQuizzes(quizzesData);
      setLeads(leadsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const handleCreate = async () => {
    if (!newQuizTitle) return;
    setCreating(true);
    try {
      const data = await api.createQuiz(user.id, newQuizTitle, newQuizDesc || "Un nouveau diagnostic intelligent.");
      const fullQuiz = await api.getQuiz(data.slug);
      onSelectQuiz(fullQuiz);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Vos Diagnostics</h1>
          <p className="text-slate-500">Créez et gérez vos questionnaires de qualification.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="w-5 h-5" /> Nouveau Diagnostic
        </Button>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Créer un nouveau diagnostic"
      >
        <div className="space-y-6">
          <Input 
            label="Titre du diagnostic" 
            placeholder="Ex: Quel type d'entrepreneur êtes-vous ?" 
            value={newQuizTitle} 
            onChange={setNewQuizTitle} 
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea 
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all min-h-[100px]"
              placeholder="Décrivez brièvement l'objectif de ce diagnostic..."
              value={newQuizDesc}
              onChange={(e) => setNewQuizDesc(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">Annuler</Button>
            <Button onClick={handleCreate} disabled={creating || !newQuizTitle} className="flex-1">
              {creating ? 'Création...' : 'Créer le diagnostic'}
            </Button>
          </div>
        </div>
      </Modal>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-bottom border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800">Liste des Diagnostics</h3>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">{quizzes.length} Quiz</span>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Chargement...</div>
          ) : quizzes.length === 0 ? (
            <div className="p-12 text-center text-slate-400">Vous n'avez pas encore de diagnostic.</div>
          ) : (
            quizzes.map(quiz => (
              <div 
                key={quiz.id} 
                className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                onClick={() => onSelectQuiz(quiz)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{quiz.title}</h4>
                    <p className="text-sm text-slate-500">{quiz.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-slate-900">
                      {leads.filter(l => l.quiz_id === quiz.id).length} leads
                    </div>
                    <div className="text-xs text-slate-400">Créé le {new Date(quiz.created_at).toLocaleDateString()}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const LeadsView = ({ user }: { user: User }) => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [leadStatus, setLeadStatus] = useState<Record<number, string>>({});
  const [leadNotes, setLeadNotes] = useState<Record<number, string>>({});

  // Real-time Notes & Emails Composer state
  const [newLogText, setNewLogText] = useState('');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    api.getAllLeads(user.id).then(data => {
      setLeads(data);
      setLoading(false);
    });
  }, [user.id]);

  const handleShowDetails = async (leadId: number) => {
    setLoadingDetail(true);
    try {
      const details = await api.getLeadDetails(leadId);
      setSelectedLead(details);
      if (details.status) {
        setLeadStatus(prev => ({ ...prev, [leadId]: details.status }));
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors du chargement des détails.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const refreshLeadDetails = async () => {
    if (!selectedLead) return;
    try {
      const details = await api.getLeadDetails(selectedLead.id);
      setSelectedLead(details);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddLog = async () => {
    if (!newLogText.trim()) return;
    try {
      await api.addLeadLog(selectedLead.id, 'Note', newLogText);
      setNewLogText('');
      await refreshLeadDetails();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ajout de la note.");
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      alert("Veuillez remplir le sujet et le message.");
      return;
    }
    setSendingEmail(true);
    try {
      const res = await api.sendLeadEmail(selectedLead.id, emailSubject, emailBody);
      if (res.success) {
        alert("E-mail envoyé avec succès !");
        setEmailModalOpen(false);
        await refreshLeadDetails();
      } else {
        alert(res.error || "Erreur d'envoi SMTP.");
      }
    } catch (err: any) {
      alert(err.error || err.message || "Erreur lors de l'envoi de l'e-mail.");
    } finally {
      setSendingEmail(false);
    }
  };

  if (selectedLead) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-8 pb-12"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedLead(null)} className="p-2">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900">{selectedLead.user_email}</h1>
            <p className="text-slate-500">Détails complets du prospect qualifié</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Diagnostic</div>
                <div className="font-bold text-slate-900">{selectedLead.quiz_title}</div>
              </div>
              <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Profil Attribué</div>
                <div className="font-bold text-indigo-600">{selectedLead.profile_name || 'N/A'}</div>
              </div>
              <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Date de Capture</div>
                <div className="font-bold text-slate-900">{new Date(selectedLead.created_at).toLocaleDateString()}</div>
              </div>
              <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Statut Actuel</div>
                <select 
                  className="w-full bg-transparent font-bold text-emerald-600 outline-none"
                  value={leadStatus[selectedLead.id] || 'Nouveau'}
                  onChange={(e) => setLeadStatus({...leadStatus, [selectedLead.id]: e.target.value})}
                >
                  <option>Nouveau</option>
                  <option>Contacté</option>
                  <option>En cours</option>
                  <option>Converti</option>
                  <option>Perdu</option>
                </select>
              </div>
            </div>

            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" /> Analyse des Réponses
              </h3>
              <div className="space-y-6">
                {selectedLead.questions.map((q: any, i: number) => {
                  let answers: any[] = [];
                  try {
                    answers = typeof selectedLead.answers_json === 'string' ? JSON.parse(selectedLead.answers_json || '[]') : (selectedLead.answers_json || []);
                  } catch (e) {
                    answers = [];
                  }

                  // Match answer by question ID, or fallback to question array index
                  const userAnswer = Array.isArray(answers) 
                    ? (answers.find((a: any) => String(a.questionId) === String(q.id)) || answers[i])
                    : (answers[q.id] || answers[i]);

                  let answerText = 'Non répondu';

                  if (userAnswer) {
                    const ansId = userAnswer.answerId !== undefined ? userAnswer.answerId : userAnswer;
                    // Find matched answer in question's answers list
                    const matched = q.answers?.find((a: any) => 
                      String(a.id) === String(ansId) || 
                      a.label === userAnswer.label || 
                      a.label === userAnswer
                    );

                    if (matched) {
                      answerText = matched.label;
                    } else if (typeof userAnswer === 'object' && userAnswer.label) {
                      answerText = userAnswer.label;
                    } else if (typeof userAnswer === 'string') {
                      answerText = userAnswer;
                    } else if (q.answers && q.answers[ansId]) {
                      answerText = q.answers[ansId].label;
                    }
                  }
                  
                  return (
                    <div key={i} className="p-6 bg-slate-50 rounded-2xl space-y-3 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-white border border-slate-200 text-[10px] font-bold flex items-center justify-center text-slate-400">
                          {i + 1}
                        </span>
                        <div className="text-sm font-bold text-slate-900">{q.question_text}</div>
                      </div>
                      <div className="ml-9 text-sm font-medium text-indigo-600 bg-white px-4 py-3 rounded-xl border border-indigo-50 shadow-sm inline-block">
                        {answerText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" /> Journal de Communication
              </h3>
              <div className="space-y-4">
                {(!selectedLead.logs || selectedLead.logs.length === 0) ? (
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center text-sm text-slate-500">
                    Aucun log enregistré pour le moment. Diagnostic complété.
                  </div>
                ) : (
                  selectedLead.logs.map((log: any, i: number) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 items-start">
                      <div className="text-xs font-bold text-slate-400 w-36 shrink-0 pt-0.5">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                      <div className="space-y-1 flex-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${log.type === 'Email' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {log.type}
                        </span>
                        <div className="text-sm text-slate-700 pt-1">{log.content}</div>
                      </div>
                    </div>
                  ))
                )}
                
                <div className="flex gap-2 pt-2">
                  <Input 
                    placeholder="Ajouter une entrée au journal..." 
                    className="flex-1" 
                    value={newLogText}
                    onChange={setNewLogText}
                  />
                  <Button variant="secondary" onClick={handleAddLog} disabled={!newLogText.trim()}>
                    Ajouter Note
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-8">
            <div className="p-8 bg-indigo-900 rounded-3xl text-white space-y-6 shadow-xl shadow-indigo-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-bold">Insights IA</h3>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-white/50 uppercase">Probabilité</div>
                  <div className="text-xl font-black text-emerald-400">85%</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-sm leading-relaxed text-indigo-100">
                  Ce prospect a répondu avec enthousiasme à votre diagnostic. Il est prêt pour une offre **Premium**.
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-sm leading-relaxed text-indigo-100">
                  Utilisez ses résultats du profil <strong>{selectedLead.profile_name}</strong> pour proposer votre accompagnement sur-mesure.
                </div>
              </div>
              <Button 
                onClick={() => {
                  setEmailSubject(`Sujet : Vos résultats de diagnostic - ${selectedLead.quiz_title}`);
                  setEmailBody(`Bonjour,\n\nJe reviens vers vous suite à votre participation au diagnostic "${selectedLead.quiz_title}". Votre profil qualifié est : ${selectedLead.profile_name}.\n\nNotre recommandation sur-mesure :\n"${selectedLead.recommendation || ''}"\n\nSouhaitez-vous programmer un créneau de 15 minutes cette semaine pour échanger de vive voix sur votre plan d'action ?\n\nCordialement,\n`);
                  setEmailModalOpen(true);
                }}
                className="w-full py-4 bg-white text-indigo-900 hover:bg-slate-100 font-bold shadow-md"
              >
                <Mail className="w-5 h-5" /> Envoyer un Email
              </Button>
            </div>

            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" /> Prochaines Étapes
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Relance téléphonique', done: false },
                  { label: 'Envoi de la brochure tarifaire', done: true },
                  { label: 'Planifier démo produit', done: false },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group cursor-pointer hover:bg-white hover:border-indigo-100 transition-all">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${step.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 group-hover:border-indigo-300'}`}>
                      {step.done && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                    <span className={`text-sm font-medium ${step.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900">Notes Internes</h3>
              <textarea 
                className="w-full p-4 bg-slate-50 border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:bg-white outline-none transition-all min-h-[150px] text-sm"
                placeholder="Ajoutez des notes sur ce prospect..."
                value={leadNotes[selectedLead.id] || ''}
                onChange={(e) => setLeadNotes({...leadNotes, [selectedLead.id]: e.target.value})}
              />
              <Button variant="secondary" className="w-full">Enregistrer les notes</Button>
            </div>

            <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-100 space-y-4">
              <h3 className="font-bold text-emerald-900">Action Finale</h3>
              <Button 
                onClick={() => {
                  setLeadStatus({...leadStatus, [selectedLead.id]: 'Converti'});
                  alert('Félicitations ! Le statut de ce prospect a été mis à jour sur : Converti.');
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-none font-bold"
              >
                Marquer comme Converti
              </Button>
            </div>
          </div>
        </div>

        {/* Email Composer Modal */}
        <Modal 
          isOpen={emailModalOpen} 
          onClose={() => setEmailModalOpen(false)} 
          title={`Rédiger un e-mail pour ${selectedLead.user_email}`}
        >
          <div className="space-y-4">
            <Input 
              label="Sujet" 
              value={emailSubject} 
              onChange={setEmailSubject} 
              placeholder="Sujet du mail" 
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Message (Sera envoyé via votre SMTP)</label>
              <textarea 
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Message de l'e-mail..."
                className="w-full h-48 px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-sans"
              />
            </div>
            
            <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg">
              ⚠️ Cet e-mail est envoyé en utilisant votre configuration SMTP active ({user.smtp_host || "non configuré"}).
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setEmailModalOpen(false)}>Annuler</Button>
              <Button onClick={handleSendEmail} disabled={sendingEmail || !user.smtp_host}>
                {sendingEmail ? "Envoi en cours..." : "Envoyer via SMTP"}
              </Button>
            </div>
          </div>
        </Modal>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Leads & Contacts</h1>
          <p className="text-slate-500">Gérez tous les contacts générés par vos diagnostics.</p>
        </div>
        <Button variant="secondary">
          <FileText className="w-4 h-4" /> Exporter CSV
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Diagnostic</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Profil Attribué</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Chargement...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Aucun lead pour le moment.</td></tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{lead.user_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{lead.quiz_title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">
                        {lead.profile_name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" className="p-2 text-indigo-600" onClick={() => handleShowDetails(lead.id)}>Voir détails</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SettingsView = ({ user, onUpdateUser }: { user: User, onUpdateUser: (u: User) => void }) => {
  const [plan, setPlan] = useState(user.plan);
  const [saving, setSaving] = useState(false);

  // SMTP Settings State
  const [smtpHost, setSmtpHost] = useState(user.smtp_host || '');
  const [smtpPort, setSmtpPort] = useState(user.smtp_port || 587);
  const [smtpUser, setSmtpUser] = useState(user.smtp_user || '');
  const [smtpPass, setSmtpPass] = useState(user.smtp_pass || '');
  const [smtpFrom, setSmtpFrom] = useState(user.smtp_from || '');
  const [smtpSecure, setSmtpSecure] = useState(user.smtp_secure || 'tls');

  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const [testError, setTestError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateUserSettings(user.id, plan, {
        smtp_host: smtpHost,
        smtp_port: Number(smtpPort),
        smtp_user: smtpUser,
        smtp_pass: smtpPass,
        smtp_from: smtpFrom,
        smtp_secure: smtpSecure
      });
      onUpdateUser({ 
        ...user, 
        plan,
        smtp_host: smtpHost,
        smtp_port: Number(smtpPort),
        smtp_user: smtpUser,
        smtp_pass: smtpPass,
        smtp_from: smtpFrom,
        smtp_secure: smtpSecure
      });
      alert("Paramètres enregistrés !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestSMTP = async () => {
    setTesting(true);
    setTestSuccess(null);
    setTestError('');
    try {
      const res = await api.testSMTPSettings(user.id, {
        smtp_host: smtpHost,
        smtp_port: Number(smtpPort),
        smtp_user: smtpUser,
        smtp_pass: smtpPass,
        smtp_from: smtpFrom,
        smtp_secure: smtpSecure,
        to_email: user.email
      });
      if (res.success) {
        setTestSuccess(true);
      } else {
        setTestSuccess(false);
        setTestError(res.error || "Erreur d'envoi");
      }
    } catch (err: any) {
      setTestSuccess(false);
      setTestError(err.message || "Erreur de connexion");
    } finally {
      setTesting(false);
    }
  };

  const fillAmazonSES = () => {
    setSmtpHost('feedback-smtp.eu-west-1.amazonses.com');
    setSmtpPort(587);
    setSmtpSecure('tls');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900">Paramètres du compte</h1>
        <p className="text-slate-500">Gérez vos informations personnelles, abonnements et serveurs d'envoi SMTP.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* General profile */}
          <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Profil & Abonnement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Email" value={user.email} disabled />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Plan actuel</label>
                <select 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none transition-all text-sm"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                >
                  <option value="starter">Starter (Gratuit)</option>
                  <option value="pro">Pro (Payant)</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
          </div>

          {/* SMTP Configuration Module */}
          <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" /> Configuration Serveur SMTP (Module)
              </h3>
              <button 
                type="button"
                onClick={fillAmazonSES}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all"
              >
                Remplir Amazon SES (eu-west-1)
              </button>
            </div>
            <p className="text-sm text-slate-500">
              Configurez votre propre serveur SMTP (comme <strong>feedback-smtp.eu-west-1.amazonses.com</strong>) afin d'envoyer de vrais emails automatiques à vos prospects et recevoir des notifications d'inscription en temps réel.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Hôte SMTP" 
                value={smtpHost} 
                onChange={setSmtpHost} 
                placeholder="ex: feedback-smtp.eu-west-1.amazonses.com" 
              />
              <Input 
                label="Port SMTP" 
                value={smtpPort} 
                onChange={(val: any) => setSmtpPort(val)} 
                placeholder="ex: 587, 465, 25" 
                type="number"
              />
              <Input 
                label="Nom d'utilisateur SMTP" 
                value={smtpUser} 
                onChange={setSmtpUser} 
                placeholder="Identifiant de connexion" 
              />
              <Input 
                label="Mot de passe SMTP" 
                value={smtpPass} 
                onChange={setSmtpPass} 
                placeholder="Mot de passe ou clé secrète" 
                type="password"
              />
              <Input 
                label="Email d'expédition (From)" 
                value={smtpFrom} 
                onChange={setSmtpFrom} 
                placeholder="ex: contact@votredomaine.com" 
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Sécurité de connexion</label>
                <select 
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none transition-all text-sm"
                  value={smtpSecure}
                  onChange={(e) => setSmtpSecure(e.target.value)}
                >
                  <option value="tls">STARTTLS (Recommandé - Port 587)</option>
                  <option value="ssl">SSL/TLS (Port 465)</option>
                  <option value="none">Aucune (Non sécurisé - Port 25)</option>
                </select>
              </div>
            </div>

            {/* Test Connection Zone */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                Vous pouvez envoyer un e-mail de test à l'adresse du compte (<strong>{user.email}</strong>) pour vérifier les paramètres.
              </div>
              <Button 
                variant="secondary" 
                onClick={handleTestSMTP} 
                disabled={testing || !smtpHost || !smtpFrom}
                className="w-full md:w-auto text-xs"
              >
                {testing ? "Test en cours..." : "Tester la configuration SMTP"}
              </Button>
            </div>

            {testSuccess !== null && (
              <div className={`p-4 rounded-xl text-sm font-medium border ${testSuccess ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'}`}>
                {testSuccess ? (
                  "✓ Connexion SMTP réussie ! Un e-mail de test a été envoyé à " + user.email
                ) : (
                  <span>❌ Échec du test SMTP : <span className="font-mono text-xs block mt-1">{testError}</span></span>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer la configuration SMTP'}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-indigo-600 rounded-2xl text-white space-y-4">
            <Zap className="w-8 h-8 text-amber-300" />
            <h3 className="text-xl font-bold">Module d'Envoi d'Email Actif</h3>
            <p className="text-indigo-100 text-sm">
              Une fois configuré, DiagnostiQ enverra de vrais emails à vos leads lors de la complétion du quiz, et ajoutera automatiquement des logs détaillés à votre Journal de Communication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuizBuilder = ({ quiz, onBack }: { quiz: Quiz, onBack: () => void }) => {
  const [title, setTitle] = useState(quiz.title);
  const [description, setDescription] = useState(quiz.description);
  const [questions, setQuestions] = useState<Question[]>(quiz.questions || []);
  const [profiles, setProfiles] = useState<Profile[]>(quiz.profiles || []);
  const [primaryColor, setPrimaryColor] = useState(quiz.primary_color || '#4f46e5');
  const [accentColor, setAccentColor] = useState(quiz.accent_color || '#6366f1');
  const [font, setFont] = useState(quiz.font || 'Inter');
  const [borderRadius, setBorderRadius] = useState(quiz.border_radius || '1rem');
  const [customCss, setCustomCss] = useState(quiz.custom_css || '');
  
  // Theme & Branding states
  const [logoUrl, setLogoUrl] = useState(quiz.logo_url || '');
  const [backgroundCoverUrl, setBackgroundCoverUrl] = useState(quiz.background_cover_url || '');
  const [backgroundColor, setBackgroundColor] = useState(quiz.background_color || '#f8fafc');
  const [textColor, setTextColor] = useState(quiz.text_color || '#0f172a');
  const [animationStyle, setAnimationStyle] = useState<'slide' | 'fade' | 'pop' | 'bounce'>(quiz.animation_style || 'slide');
  const [buttonStyle, setButtonStyle] = useState<'solid' | 'gradient' | 'outline' | 'pill' | 'shadow3d'>(quiz.button_style || 'solid');
  const [cardStyle, setCardStyle] = useState<'elevated' | 'glassmorphism' | 'flat' | 'bordered'>(quiz.card_style || 'elevated');
  const [progressBarStyle, setProgressBarStyle] = useState<'bar' | 'dots' | 'percentage' | 'none'>(quiz.progress_bar_style || 'bar');
  const [soundEffects, setSoundEffects] = useState<boolean>(Boolean(quiz.sound_effects));

  const [activeTab, setActiveTab] = useState<'settings' | 'questions' | 'profiles' | 'analytics'>('profiles');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  
  // AI Generator Parameters
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiNumQuestions, setAiNumQuestions] = useState<number>(5);
  const [aiNumAnswers, setAiNumAnswers] = useState<number>(4);
  const [aiNumProfiles, setAiNumProfiles] = useState<number>(3);
  const [aiTone, setAiTone] = useState<string>('Professionnel & Particulier');
  const [aiQuestionType, setAiQuestionType] = useState<'single' | 'multiple' | 'mixed'>('single');

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailInstructions, setEmailInstructions] = useState('');
  const [selectedProfileIdx, setSelectedProfileIdx] = useState<number | null>(null);
  const [isEmailInstructionsModalOpen, setIsEmailInstructionsModalOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'analytics') {
      api.getAnalytics(quiz.id).then(setAnalytics);
    }
  }, [activeTab, quiz.id]);

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setGenerating(true);
    try {
      const data = await api.generateQuizAI({
        description: aiPrompt,
        numQuestions: aiNumQuestions,
        numAnswers: aiNumAnswers,
        numProfiles: aiNumProfiles,
        questionType: aiQuestionType,
        tone: aiTone
      });
      if (data.questions) setQuestions(data.questions);
      if (data.profiles) setProfiles(data.profiles);
      if (data.suggestedTitle && !title) setTitle(data.suggestedTitle);
      if (data.suggestedDescription && !description) setDescription(data.suggestedDescription);
      if (data.recommendedTheme) {
        if (data.recommendedTheme.primary_color) setPrimaryColor(data.recommendedTheme.primary_color);
        if (data.recommendedTheme.accent_color) setAccentColor(data.recommendedTheme.accent_color);
        if (data.recommendedTheme.font) setFont(data.recommendedTheme.font);
        if (data.recommendedTheme.border_radius) setBorderRadius(data.recommendedTheme.border_radius);
        if (data.recommendedTheme.button_style) setButtonStyle(data.recommendedTheme.button_style as any);
        if (data.recommendedTheme.card_style) setCardStyle(data.recommendedTheme.card_style as any);
      }
      setIsAiModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération IA. Veuillez réessayer.");
    } finally {
      setGenerating(false);
    }
  };

  const handleEmailGenerate = async () => {
    if (selectedProfileIdx === null) return;
    const profile = profiles[selectedProfileIdx];
    setGenerating(true);
    try {
      const data = await api.generateEmailsAI(profile.name, profile.description, emailInstructions);
      const newPs = [...profiles];
      newPs[selectedProfileIdx].emails_json = JSON.stringify(data);
      setProfiles(newPs);
      setIsEmailInstructionsModalOpen(false);
      setIsEmailModalOpen(true);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération des emails.");
    } finally {
      setGenerating(false);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { question_text: '', type: 'single', answers: [{ label: '', score: 1, category: '' }] }]);
  };

  const addAnswer = (qIdx: number) => {
    const newQs = [...questions];
    newQs[qIdx].answers.push({ label: '', score: 1, category: '' });
    setQuestions(newQs);
  };

  const addProfile = () => {
    setProfiles([...profiles, { name: '', description: '', recommendation: '', cta_text: '', cta_url: '', category: '' }]);
  };

  const save = async () => {
    setSaving(true);
    await api.updateQuizMetadata(quiz.id, {
      title,
      description,
      primary_color: primaryColor,
      accent_color: accentColor,
      font,
      border_radius: borderRadius,
      custom_css: customCss,
      logo_url: logoUrl,
      background_cover_url: backgroundCoverUrl,
      background_color: backgroundColor,
      text_color: textColor,
      animation_style: animationStyle,
      button_style: buttonStyle,
      card_style: cardStyle,
      progress_bar_style: progressBarStyle,
      sound_effects: soundEffects ? 1 : 0
    });
    await api.saveQuizStructure(quiz.id, questions, profiles);
    setSaving(false);
  };

  const copyLink = () => {
    const url = `${window.location.origin}/quiz/${quiz.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="p-2"><ChevronRight className="w-5 h-5 rotate-180" /></Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">{title}</h1>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Lien public:</span>
              <button onClick={copyLink} className="text-indigo-600 hover:underline flex items-center gap-1">
                {copied ? 'Copié !' : `/quiz/${quiz.slug}`}
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => window.open(`/quiz/${quiz.slug}`, '_blank')}>Prévisualiser</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer tout'}</Button>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'settings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Paramètres
        </button>
        <button 
          onClick={() => setActiveTab('profiles')}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'profiles' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Profils & Scoring
        </button>
        <button 
          onClick={() => setActiveTab('questions')}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'questions' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Questions
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'analytics' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Analytics & Leads
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'settings' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Form Column */}
            <div className="space-y-6">
              {/* General Settings */}
              <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Settings className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Paramètres Généraux</h3>
                </div>
                <Input 
                  label="Titre du diagnostic" 
                  value={title} 
                  onChange={setTitle} 
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Description</label>
                  <textarea 
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all min-h-[100px]"
                    placeholder="Décrivez brièvement l'objectif de ce diagnostic..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Branding & Logo */}
              <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Branding & Logo Header</h3>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700 block">URL du Logo (Optionnel)</label>
                  <Input 
                    placeholder="https://votre-site.com/logo.png" 
                    value={logoUrl} 
                    onChange={setLogoUrl} 
                  />
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs text-slate-400 font-medium">Logos / Icônes de démonstration :</span>
                    {[
                      { name: 'IA / Brain', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop' },
                      { name: 'Growth Rocket', url: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=100&h=100&fit=crop' },
                      { name: 'Zen Nature', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=100&h=100&fit=crop' },
                      { name: 'Crown VIP', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=100&h=100&fit=crop' },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLogoUrl(preset.url)}
                        className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${logoUrl === preset.url ? 'bg-indigo-50 border-indigo-500 text-indigo-600 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                      >
                        {preset.name}
                      </button>
                    ))}
                    {logoUrl && (
                      <button 
                        type="button" 
                        onClick={() => setLogoUrl('')} 
                        className="text-xs text-red-500 hover:underline ml-2"
                      >
                        Retirer le logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Background Cover & Colors */}
              <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Palette className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Arrière-plan & Image de Couverture</h3>
                </div>

                {/* Background Cover URL */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700 block">Image de Couverture d'Arrière-plan (Cover URL)</label>
                  <Input 
                    placeholder="https://images.unsplash.com/photo-..." 
                    value={backgroundCoverUrl} 
                    onChange={setBackgroundCoverUrl} 
                  />
                  <div className="space-y-2 pt-1">
                    <span className="text-xs text-slate-400 font-medium block">Exemples d'images HD Unsplash :</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { name: 'Cyber Wave', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80' },
                        { name: 'Dark Mesh', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80' },
                        { name: 'Warm Gradient', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80' },
                        { name: 'Minimal Light', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80' },
                        { name: 'Nature Zen', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80' },
                      ].map((bg, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setBackgroundCoverUrl(bg.url)}
                          className={`p-2 rounded-xl border text-xs text-left truncate transition-all flex items-center gap-2 ${backgroundCoverUrl === bg.url ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                        >
                          <div className="w-5 h-5 rounded-md bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${bg.url})` }} />
                          <span className="truncate">{bg.name}</span>
                        </button>
                      ))}
                      {backgroundCoverUrl && (
                        <button 
                          type="button" 
                          onClick={() => setBackgroundCoverUrl('')} 
                          className="p-2 rounded-xl border border-dashed border-red-200 text-xs text-red-600 hover:bg-red-50 transition-all font-semibold text-center"
                        >
                          Sans fond
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Colors Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 block">Couleur Principale</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={primaryColor} 
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
                      />
                      <Input value={primaryColor} onChange={setPrimaryColor} className="w-full text-xs font-mono" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 block">Couleur d'Arrière-plan</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={backgroundColor} 
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
                      />
                      <Input value={backgroundColor} onChange={setBackgroundColor} className="w-full text-xs font-mono" />
                    </div>
                  </div>
                </div>

                {/* Color Theme Presets */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-medium text-slate-500">Palettes de Couleurs Prédéfinies :</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Indigo Modern', primary: '#4f46e5', accent: '#6366f1', bg: '#f8fafc', text: '#0f172a' },
                      { name: 'Emerald Trust', primary: '#059669', accent: '#10b981', bg: '#f0fdf4', text: '#064e3b' },
                      { name: 'Dark Cyber', primary: '#8b5cf6', accent: '#a855f7', bg: '#0f172a', text: '#f8fafc' },
                      { name: 'Gold Luxury', primary: '#d97706', accent: '#f59e0b', bg: '#fafaf9', text: '#292524' },
                      { name: 'Rose Coral', primary: '#e11d48', accent: '#f43f5e', bg: '#fff1f2', text: '#881337' },
                      { name: 'Ocean Tech', primary: '#0284c7', accent: '#38bdf8', bg: '#f0f9ff', text: '#0c4a6e' }
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPrimaryColor(p.primary);
                          setAccentColor(p.accent);
                          setBackgroundColor(p.bg);
                          setTextColor(p.text);
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-slate-50 border-slate-200 hover:bg-slate-100 transition-all flex items-center gap-2"
                      >
                        <span className="w-3 h-3 rounded-full border border-black/10 flex overflow-hidden">
                          <span className="w-1/2 h-full" style={{ backgroundColor: p.primary }} />
                          <span className="w-1/2 h-full" style={{ backgroundColor: p.bg }} />
                        </span>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Component & Animation Customization */}
              <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Composants & Animations</h3>
                </div>

                {/* Button Style */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Style des Boutons</label>
                  <select
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-700"
                    value={buttonStyle}
                    onChange={(e) => setButtonStyle(e.target.value as any)}
                  >
                    <option value="solid">Plein Standard (Solid)</option>
                    <option value="gradient">Dégradé Lumineux (Gradient)</option>
                    <option value="outline">Contour Épuré (Outline)</option>
                    <option value="pill">Pilule Arrondie (Pill)</option>
                    <option value="shadow3d">Effet Relief 3D (Shadow 3D)</option>
                  </select>
                </div>

                {/* Card Style */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Style des Cartes de Réponses</label>
                  <select
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-700"
                    value={cardStyle}
                    onChange={(e) => setCardStyle(e.target.value as any)}
                  >
                    <option value="elevated">Ombre Douce & Élégante (Elevated)</option>
                    <option value="glassmorphic">Effet Verre Dépoli (Glassmorphism)</option>
                    <option value="flat">Épuré Plat (Flat Minimalist)</option>
                    <option value="bordered">Contour Accentué (Bordered)</option>
                  </select>
                </div>

                {/* Progress Bar Style */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Style de la Barre de Progression</label>
                  <select
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-700"
                    value={progressBarStyle}
                    onChange={(e) => setProgressBarStyle(e.target.value as any)}
                  >
                    <option value="bar">Barre Continue Standard</option>
                    <option value="dots">Points d'Étapes (Dots)</option>
                    <option value="percentage">Pourcentage Numérique</option>
                    <option value="none">Masquée</option>
                  </select>
                </div>

                {/* Animation Style */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Style des Animations de Transition</label>
                  <select
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-700"
                    value={animationStyle}
                    onChange={(e) => setAnimationStyle(e.target.value as any)}
                  >
                    <option value="slide">Glissement Horizontale (Slide)</option>
                    <option value="fade">Fondu Élégant (Fade Smooth)</option>
                    <option value="pop">Zoom Dynamique (Pop Spring)</option>
                    <option value="bounce">Rebond Ludique (Bounce)</option>
                  </select>
                </div>

                {/* Font Selector */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Police d'écriture</label>
                  <select
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-700"
                    value={font}
                    onChange={(e) => setFont(e.target.value)}
                  >
                    <option value="Inter">Inter (Moderne & Neutre)</option>
                    <option value="Space Grotesk">Space Grotesk (Technologique & Design)</option>
                    <option value="Playfair Display">Playfair Display (Élégant & Littéraire)</option>
                    <option value="Montserrat">Montserrat (Épuré & Géométrique)</option>
                    <option value="Roboto">Roboto (Simple & Lisible)</option>
                    <option value="JetBrains Mono">JetBrains Mono (Console & Brutaliste)</option>
                  </select>
                </div>

                {/* Border Radius */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Arrondi des boutons & cartes</label>
                  <select
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-700"
                    value={borderRadius}
                    onChange={(e) => setBorderRadius(e.target.value)}
                  >
                    <option value="0px">Aucun (Carré, style brutaliste)</option>
                    <option value="0.25rem">Léger (sm)</option>
                    <option value="0.375rem">Moyen (md)</option>
                    <option value="0.5rem">Arrondi standard (lg)</option>
                    <option value="1rem">Généreux (2xl)</option>
                    <option value="1.5rem">Très arrondi (3xl)</option>
                    <option value="9999px">Pilule (Complet)</option>
                  </select>
                </div>

                {/* Sound Effects Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-sm font-medium text-slate-900 block">Effets Sonores d'Interaction</label>
                    <p className="text-xs text-slate-400">Joue une mélodie ou un clic audio discret lors des clics sur les réponses</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={soundEffects} 
                    onChange={(e) => setSoundEffects(e.target.checked)}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                {/* Custom CSS */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-700">Code CSS Personnalisé</label>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">Optionnel</span>
                  </div>
                  <textarea
                    className="w-full px-4 py-2 bg-slate-900 text-slate-100 font-mono text-xs rounded-lg outline-none transition-all min-h-[120px] focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="/* Exemple: .quiz-card { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); } */"
                    value={customCss}
                    onChange={(e) => setCustomCss(e.target.value)}
                  />
                  <p className="text-xs text-slate-400">Permet d'appliquer des styles avancés à votre widget public (.quiz-card, .quiz-button, etc.)</p>
                </div>
              </div>
            </div>

            {/* Preview Column */}
            <div className="lg:sticky lg:top-8 h-fit space-y-6">
              <div className="p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 overflow-hidden relative" style={{ backgroundColor: backgroundColor, color: textColor }}>
                {backgroundCoverUrl && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none" 
                    style={{ backgroundImage: `url(${backgroundCoverUrl})` }} 
                  />
                )}
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5" style={{ color: primaryColor }} />
                      <h3 className="text-xl font-bold">Prévisualisation en Temps Réel</h3>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-white/80 border text-slate-600">
                      Animation: {animationStyle}
                    </span>
                  </div>
                  
                  <p className="text-sm opacity-80">Voici comment vos paramètres de design et thèmes s'appliquent en direct au diagnostic public.</p>
                  
                  {/* Simulated Quiz Container */}
                  <div 
                    className={`p-8 border shadow-md flex flex-col gap-6 relative overflow-hidden ${
                      cardStyle === 'glassmorphic' ? 'bg-white/70 backdrop-blur-md border-white/40' :
                      cardStyle === 'flat' ? 'bg-white border-none shadow-none' :
                      cardStyle === 'bordered' ? 'bg-white border-2 border-slate-900' :
                      'bg-white border-slate-200'
                    }`} 
                    style={{ borderRadius: borderRadius, fontFamily: font }}
                  >
                    {logoUrl && (
                      <div className="flex justify-center mb-2">
                        <img src={logoUrl} alt="Logo Preview" className="h-10 object-contain max-w-[160px]" />
                      </div>
                    )}

                    {/* Custom CSS injector for preview */}
                    {customCss && (
                      <style dangerouslySetInnerHTML={{ __html: customCss.replace(/\.quiz-/g, '#preview-container .quiz-') }} />
                    )}
                    <div id="preview-container" className="space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: primaryColor }}>Question 1 / 5</span>
                        {progressBarStyle === 'bar' && (
                          <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full transition-all" style={{ width: '20%', backgroundColor: primaryColor }} />
                          </div>
                        )}
                        {progressBarStyle === 'dots' && (
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((d) => (
                              <div key={d} className={`w-2 h-2 rounded-full ${d === 1 ? 'w-4' : 'opacity-30'}`} style={{ backgroundColor: primaryColor }} />
                            ))}
                          </div>
                        )}
                        {progressBarStyle === 'percentage' && (
                          <span className="text-xs font-bold" style={{ color: primaryColor }}>20%</span>
                        )}
                      </div>
                      
                      <h4 className="text-xl font-bold text-slate-900">Quelle est votre principale problématique aujourd'hui ?</h4>
                      
                      <div className="space-y-3">
                        <button
                          className="quiz-button w-full p-4 text-left border-2 transition-all group flex items-center justify-between"
                          style={{ borderRadius: borderRadius, borderColor: primaryColor, backgroundColor: `${primaryColor}08` }}
                        >
                          <span className="font-semibold" style={{ color: primaryColor }}>Manque de temps & organisation</span>
                          <ChevronRight className="w-4 h-4" style={{ color: primaryColor }} />
                        </button>
                        <button
                          className="quiz-button w-full p-4 text-left border border-slate-200 bg-white hover:bg-slate-50 transition-all group flex items-center justify-between"
                          style={{ borderRadius: borderRadius }}
                        >
                          <span className="font-medium text-slate-700">Problème de prospection de clients</span>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </button>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-xs text-slate-400">Sécurisé par DiagnostiQ</span>
                        <button 
                          className={`quiz-button px-5 py-2.5 text-xs text-white font-bold transition-all shadow-sm flex items-center gap-1 ${
                            buttonStyle === 'pill' ? 'rounded-full' :
                            buttonStyle === 'gradient' ? 'bg-gradient-to-r from-indigo-500 to-purple-600' :
                            buttonStyle === 'shadow3d' ? 'border-b-4 border-black/20' : ''
                          }`}
                          style={{ 
                            borderRadius: buttonStyle === 'pill' ? '9999px' : borderRadius, 
                            backgroundColor: buttonStyle === 'gradient' ? undefined : primaryColor 
                          }}
                        >
                          Suivant <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'questions' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">Structure des Questions</h3>
              </div>
              <Button variant="secondary" onClick={() => setIsAiModalOpen(true)} className="bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100">
                <BrainCircuit className="w-4 h-4" /> Générer avec l'IA
              </Button>
            </div>

            {profiles.length === 0 && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-sm flex gap-3 items-center">
                <Target className="w-5 h-5 shrink-0" />
                <p><strong>Conseil :</strong> Définissez vos <strong>Profils & Scoring</strong> en premier pour pouvoir les sélectionner facilement dans vos réponses.</p>
                <Button variant="ghost" onClick={() => setActiveTab('profiles')} className="text-amber-900 hover:bg-amber-100 ml-auto text-xs py-1 h-auto">Y aller</Button>
              </div>
            )}

            <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} title="Générer & Paramétrer votre Quiz par IA">
              <div className="space-y-6">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-800 text-sm flex gap-3 items-start">
                  <BrainCircuit className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-indigo-950">Génération sur-mesure par l'IA</p>
                    <p className="text-xs text-indigo-700">Ajustez le nombre de questions, de choix de réponses et le style éditorial pour votre audience cible.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 block">Votre activité / Sujet du diagnostic</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all min-h-[100px] text-sm"
                    placeholder="Ex: Je suis coach en productivité pour solopreneurs. Je veux les aider à identifier s'ils souffrent de procrastinating, surcharge de travail ou manque de clarté..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                </div>

                {/* Advanced Parameters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Nombre de questions</label>
                    <select
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:bg-white outline-none"
                      value={aiNumQuestions}
                      onChange={(e) => setAiNumQuestions(Number(e.target.value))}
                    >
                      <option value={3}>3 questions (Express - 1 min)</option>
                      <option value={5}>5 questions (Recommandé - 2 min)</option>
                      <option value={8}>8 questions (Complet - 4 min)</option>
                      <option value={10}>10 questions (Approfondi - 5 min)</option>
                      <option value={12}>12 questions (Audit complet)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">Réponses par question</label>
                    <select
                      className="w-full px-3 py-2 bg-indigo-50/60 border border-indigo-200 rounded-lg text-sm font-bold text-indigo-900 focus:bg-white outline-none"
                      value={aiNumAnswers}
                      onChange={(e) => setAiNumAnswers(Number(e.target.value))}
                    >
                      <option value={2}>2 choix de réponses (Binaire / Choix rapide)</option>
                      <option value={3}>3 choix de réponses (Équilibré)</option>
                      <option value={4}>4 choix de réponses (Standard Recommandé)</option>
                      <option value={5}>5 choix de réponses (Matrice détaillée)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Profils de résultat</label>
                    <select
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:bg-white outline-none"
                      value={aiNumProfiles}
                      onChange={(e) => setAiNumProfiles(Number(e.target.value))}
                    >
                      <option value={2}>2 Profils de résultats</option>
                      <option value={3}>3 Profils (Recommandé)</option>
                      <option value={4}>4 Profils de résultats</option>
                      <option value={5}>5 Profils de résultats</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Ton & Style éditorial</label>
                    <select
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:bg-white outline-none"
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                    >
                      <option value="Professionnel & Particulier">Professionnel & Expert</option>
                      <option value="Direct & B2B Premium">Direct B2B Premium</option>
                      <option value="Inspirant & Motivationnel">Inspirant & Motivationnel</option>
                      <option value="Pédagogique & Bienveillant">Pédagogique & Bienveillant</option>
                      <option value="Ludique & Captivant">Ludique & Captivant</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <Button variant="secondary" onClick={() => setIsAiModalOpen(false)} className="flex-1">Annuler</Button>
                  <Button onClick={handleAiGenerate} disabled={generating || !aiPrompt} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                    {generating ? 'Génération par IA...' : 'Générer le diagnostic'}
                  </Button>
                </div>
              </div>
            </Modal>

            {questions.length === 0 && (
              <div className="p-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mx-auto mb-4">
                  <ClipboardList className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Aucune question</h4>
                <p className="text-slate-500 mb-6">Commencez par ajouter une question manuellement ou utilisez l'IA.</p>
                <div className="flex justify-center gap-4">
                  <Button onClick={addQuestion}>+ Ajouter manuellement</Button>
                  <Button variant="secondary" onClick={() => setIsAiModalOpen(true)}>Utiliser l'IA</Button>
                </div>
              </div>
            )}

            {questions.map((q, qIdx) => (
              <div key={qIdx} className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-8 relative group">
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                        {qIdx + 1}
                      </div>
                      <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Question</h4>
                    </div>
                    <Input 
                      placeholder="Ex: Quelle est votre plus grande difficulté ?" 
                      value={q.question_text} 
                      onChange={(val: string) => {
                        const newQs = [...questions];
                        newQs[qIdx].question_text = val;
                        setQuestions(newQs);
                      }}
                      className="text-lg font-medium border-none bg-slate-50 focus:bg-white transition-all px-6 py-4 rounded-xl"
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => setQuestions(questions.filter((_, i) => i !== qIdx))} 
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Supprimer la question"
                  >
                    <LogOut className="w-5 h-5 rotate-90" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Réponses & Scoring</label>
                    <div className="h-px flex-1 bg-slate-100 mx-4" />
                  </div>
                  
                  <div className="space-y-3">
                    {q.answers.map((a, aIdx) => (
                      <div key={aIdx} className="grid grid-cols-12 gap-3 items-center p-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                        <div className="col-span-6">
                          <Input 
                            placeholder="Label de la réponse" 
                            value={a.label} 
                            onChange={(val: string) => {
                              const newQs = [...questions];
                              newQs[qIdx].answers[aIdx].label = val;
                              setQuestions(newQs);
                            }}
                            className="bg-transparent border-none focus:ring-0 px-0 font-medium"
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2">
                            <Zap className="w-3 h-3 text-amber-500" />
                            <input 
                              type="number" 
                              value={a.score} 
                              onChange={(e) => {
                                const newQs = [...questions];
                                newQs[qIdx].answers[aIdx].score = parseInt(e.target.value);
                                setQuestions(newQs);
                              }}
                              className="w-full py-1.5 text-sm font-bold outline-none bg-transparent"
                            />
                          </div>
                        </div>
                        <div className="col-span-3">
                          {profiles.length > 0 ? (
                            <select 
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-bold text-indigo-600"
                              value={a.category}
                              onChange={(e) => {
                                const newQs = [...questions];
                                newQs[qIdx].answers[aIdx].category = e.target.value;
                                setQuestions(newQs);
                              }}
                            >
                              <option value="">Profil...</option>
                              {profiles.map((p, i) => (
                                <option key={i} value={p.category}>{p.name || p.category || `Profil ${i+1}`}</option>
                              ))}
                            </select>
                          ) : (
                            <Input 
                              placeholder="Catégorie" 
                              value={a.category} 
                              onChange={(val: string) => {
                                const newQs = [...questions];
                                newQs[qIdx].answers[aIdx].category = val;
                                setQuestions(newQs);
                              }}
                              className="py-1.5 text-xs"
                            />
                          )}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button 
                            onClick={() => {
                              const newQs = [...questions];
                              newQs[qIdx].answers = q.answers.filter((_, i) => i !== aIdx);
                              setQuestions(newQs);
                            }} 
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <LogOut className="w-4 h-4 rotate-90" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => addAnswer(qIdx)} 
                    className="w-full py-3 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" /> Ajouter une option de réponse
                  </button>
                </div>
              </div>
            ))}
            <Button onClick={addQuestion} className="w-full py-4 border-2 border-dashed border-indigo-200 bg-indigo-50/30 text-indigo-600 hover:bg-indigo-50">
              + Ajouter une question
            </Button>
          </motion.div>
        )}

        {activeTab === 'profiles' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold">Profils de Segmentation</h3>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-800 text-sm flex gap-3">
              <Zap className="w-5 h-5 shrink-0" />
              <p>Chaque profil est lié à une <strong>Catégorie</strong>. Le système attribuera le profil dont la catégorie a reçu le plus de points lors du quiz.</p>
            </div>

            <Modal isOpen={isEmailInstructionsModalOpen} onClose={() => setIsEmailInstructionsModalOpen(false)} title="Générer avec l'IA">
              <div className="space-y-6">
                <div className="p-4 bg-indigo-50 rounded-xl text-indigo-700 text-sm">
                  Précisez le ton (ex: formel, amical, provocateur) ou des points spécifiques à aborder dans cette séquence de 5 emails.
                </div>
                <Input 
                  label="Instructions ou Ton" 
                  placeholder="Ex: Ton amical et tutoiement, insiste sur l'urgence de passer à l'action..." 
                  value={emailInstructions} 
                  onChange={setEmailInstructions} 
                />
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setIsEmailInstructionsModalOpen(false)} className="flex-1">Annuler</Button>
                  <Button onClick={handleEmailGenerate} disabled={generating} className="flex-1">
                    {generating ? 'Génération...' : 'Lancer la génération'}
                  </Button>
                </div>
              </div>
            </Modal>

            <Modal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} title={`Séquence d'emails : ${selectedProfileIdx !== null ? profiles[selectedProfileIdx].name : ''}`}>
              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                {selectedProfileIdx !== null && JSON.parse(profiles[selectedProfileIdx].emails_json || '[]').map((email: any, i: number) => (
                  <div key={i} className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4 hover:border-indigo-200 transition-colors">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center justify-center">
                          {i + 1}
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email {i + 1}</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`Sujet: ${email.subject}\n\n${email.body}`);
                            alert("Email copié !");
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Copier l'email"
                        >
                          <ClipboardList className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            const newPs = [...profiles];
                            const emails = JSON.parse(newPs[selectedProfileIdx!].emails_json || '[]');
                            emails.splice(i, 1);
                            newPs[selectedProfileIdx!].emails_json = JSON.stringify(emails);
                            setProfiles(newPs);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Supprimer l'email"
                        >
                          <LogOut className="w-4 h-4 rotate-90" />
                        </button>
                      </div>
                    </div>
                    <Input 
                      label="Sujet de l'email" 
                      value={email.subject} 
                      onChange={(val: string) => {
                        const newPs = [...profiles];
                        const emails = JSON.parse(newPs[selectedProfileIdx!].emails_json || '[]');
                        emails[i].subject = val;
                        newPs[selectedProfileIdx!].emails_json = JSON.stringify(emails);
                        setProfiles(newPs);
                      }} 
                    />
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Contenu du message</label>
                      <textarea 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all min-h-[180px] text-sm leading-relaxed"
                        value={email.body}
                        onChange={(e) => {
                          const newPs = [...profiles];
                          const emails = JSON.parse(newPs[selectedProfileIdx!].emails_json || '[]');
                          emails[i].body = e.target.value;
                          newPs[selectedProfileIdx!].emails_json = JSON.stringify(emails);
                          setProfiles(newPs);
                        }}
                        placeholder="Écrivez votre message ici..."
                      />
                    </div>
                  </div>
                ))}
                {selectedProfileIdx !== null && JSON.parse(profiles[selectedProfileIdx].emails_json || '[]').length === 0 && (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-slate-900 font-bold mb-1">Aucun email configuré</h3>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto">Utilisez l'IA pour générer une séquence ou commencez à écrire manuellement.</p>
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <Button variant="secondary" onClick={() => {
                    const newPs = [...profiles];
                    const emails = JSON.parse(newPs[selectedProfileIdx!].emails_json || '[]');
                    emails.push({ subject: 'Nouveau sujet', body: 'Contenu de l\'email...' });
                    newPs[selectedProfileIdx!].emails_json = JSON.stringify(emails);
                    setProfiles(newPs);
                  }} className="flex-1">+ Ajouter un email</Button>
                  <Button onClick={() => setIsEmailModalOpen(false)} className="flex-1">Fermer & Enregistrer</Button>
                </div>
              </div>
            </Modal>

            {profiles.map((p, pIdx) => (
              <div key={pIdx} className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-8 relative group">
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1 grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                          {pIdx + 1}
                        </div>
                        <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Nom du profil</h4>
                      </div>
                      <Input 
                        placeholder="Ex: Entrepreneur Débordé" 
                        value={p.name} 
                        onChange={(val: string) => {
                          const newPs = [...profiles];
                          newPs[pIdx].name = val;
                          setProfiles(newPs);
                        }}
                        className="text-lg font-bold border-none bg-slate-50 focus:bg-white transition-all px-6 py-4 rounded-xl"
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm">
                          <Zap className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Catégorie de Scoring</h4>
                      </div>
                      <Input 
                        placeholder="Ex: deborde" 
                        value={p.category} 
                        onChange={(val: string) => {
                          const newPs = [...profiles];
                          newPs[pIdx].category = val;
                          setProfiles(newPs);
                        }}
                        className="font-mono text-sm border-none bg-slate-50 focus:bg-white transition-all px-6 py-4 rounded-xl text-indigo-600 font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      onClick={() => setProfiles(profiles.filter((_, i) => i !== pIdx))} 
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Supprimer le profil"
                    >
                      <LogOut className="w-5 h-5 rotate-90" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description & Analyse</label>
                    </div>
                    <textarea 
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:bg-white outline-none transition-all min-h-[140px] text-sm leading-relaxed"
                      placeholder="Décrivez ce profil et ses problématiques..."
                      value={p.description}
                      onChange={(e) => {
                        const newPs = [...profiles];
                        newPs[pIdx].description = e.target.value;
                        setProfiles(newPs);
                      }}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-slate-400" />
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recommandation Stratégique</label>
                    </div>
                    <textarea 
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:bg-white outline-none transition-all min-h-[140px] text-sm leading-relaxed italic"
                      placeholder="Quel conseil ou offre proposez-vous à ce profil ?"
                      value={p.recommendation}
                      onChange={(e) => {
                        const newPs = [...profiles];
                        newPs[pIdx].recommendation = e.target.value;
                        setProfiles(newPs);
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 items-end border-t border-slate-50 pt-8">
                  <div className="col-span-2 grid grid-cols-2 gap-4">
                    <Input 
                      label="Texte du bouton CTA" 
                      placeholder="Réserver mon appel" 
                      value={p.cta_text} 
                      onChange={(val: string) => {
                        const newPs = [...profiles];
                        newPs[pIdx].cta_text = val;
                        setProfiles(newPs);
                      }}
                    />
                    <Input 
                      label="URL de destination" 
                      placeholder="https://calendly.com/..." 
                      value={p.cta_url} 
                      onChange={(val: string) => {
                        const newPs = [...profiles];
                        newPs[pIdx].cta_url = val;
                        setProfiles(newPs);
                      }}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="secondary" onClick={() => {
                      setSelectedProfileIdx(pIdx);
                      setIsEmailInstructionsModalOpen(true);
                    }} disabled={generating || !p.name} className="flex-1 bg-indigo-50 text-indigo-600 border-none hover:bg-indigo-100">
                      <Zap className="w-4 h-4" /> Email IA
                    </Button>
                    <Button variant="secondary" onClick={() => {
                      setSelectedProfileIdx(pIdx);
                      setIsEmailModalOpen(true);
                    }} className="flex-1 relative bg-slate-50 text-slate-600 border-none hover:bg-slate-100">
                      <MessageSquare className="w-4 h-4" /> Emails
                      {JSON.parse(p.emails_json || '[]').length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                          {JSON.parse(p.emails_json || '[]').length}
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            <Button onClick={addProfile} className="w-full py-4 border-2 border-dashed border-indigo-200 bg-indigo-50/30 text-indigo-600 hover:bg-indigo-50">
              + Ajouter un profil
            </Button>
          </motion.div>
        )}

        {activeTab === 'analytics' && analytics && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" /> Distribution des Profils
                </h3>
                <div className="space-y-4">
                  {analytics.profileDistribution.map((dist: any, i: number) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{dist.name || 'Inconnu'}</span>
                        <span className="text-slate-500">{dist.count} ({Math.round((dist.count / analytics.totalResponses) * 100) || 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full transition-all duration-1000" 
                          style={{ width: `${(dist.count / analytics.totalResponses) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold mb-4">Statistiques Clés</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Total Réponses</div>
                    <div className="text-2xl font-bold">{analytics.totalResponses}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Taux de CTA</div>
                    <div className="text-2xl font-bold">18%</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                <h3 className="font-bold">Derniers Leads</h3>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Profil Assigné</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics.leads.map((lead: Lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium">{lead.user_email}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 text-xs font-bold">
                          {lead.profile_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const QuizView = ({ slug }: { slug: string }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [step, setStep] = useState<'intro' | 'questions' | 'email' | 'result'>('intro');
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getQuiz(slug).then(data => {
      setQuiz(data);
      setLoading(false);
    });
  }, [slug]);

  // Audio synthesizer for sound effects
  const playSound = (type: 'click' | 'finish') => {
    if (!quiz?.sound_effects) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      // Audio context fallback
    }
  };

  const handleAnswer = (answerId: number) => {
    playSound('click');
    const newAnswers = [...userAnswers, { questionId: quiz!.questions![currentQIdx].id, answerId }];
    setUserAnswers(newAnswers);
    if (currentQIdx < quiz!.questions!.length - 1) {
      setCurrentQIdx(currentQIdx + 1);
    } else {
      setStep('email');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    playSound('finish');
    const data = await api.submitResponse(slug, email, userAnswers);
    setResult(data);
    setStep('result');
    setLoading(false);
  };

  if (loading && !quiz) return <div className="min-h-screen flex items-center justify-center">Chargement du diagnostic...</div>;
  if (!quiz) return <div className="min-h-screen flex items-center justify-center">Diagnostic introuvable.</div>;
  if (!quiz.questions || quiz.questions.length === 0) return <div className="min-h-screen flex items-center justify-center">Ce diagnostic n'a pas encore de questions.</div>;

  const primaryColor = quiz.primary_color || '#4f46e5';
  const accentColor = quiz.accent_color || primaryColor;
  const font = quiz.font || 'Inter';
  const borderRadius = quiz.border_radius || '1rem';
  const bgColor = quiz.background_color || '#f8fafc';
  const txtColor = quiz.text_color || '#0f172a';
  const cardStyle = quiz.card_style || 'elevated';
  const buttonStyle = quiz.button_style || 'solid';
  const progressBarStyle = quiz.progress_bar_style || 'bar';
  const animationStyle = quiz.animation_style || 'slide';

  // Animation variants
  const getAnimationProps = () => {
    switch (animationStyle) {
      case 'fade':
        return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 } };
      case 'pop':
        return { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, transition: { type: 'spring', stiffness: 300, damping: 25 } };
      case 'bounce':
        return { initial: { opacity: 0, y: -40 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 40 }, transition: { type: 'spring', bounce: 0.4 } };
      case 'slide':
      default:
        return { initial: { opacity: 0, x: 25 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -25 }, transition: { duration: 0.25 } };
    }
  };

  const animProps = getAnimationProps();

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden custom-quiz-container"
      style={{ backgroundColor: bgColor, color: txtColor }}
    >
      {/* Background Cover Overlay */}
      {quiz.background_cover_url && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none" 
          style={{ backgroundImage: `url(${quiz.background_cover_url})` }} 
        />
      )}

      {/* Styles Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@300;400;500;600;700;800;900&display=swap');
        
        .custom-quiz-container {
          font-family: '${font}', sans-serif !important;
        }
        
        .primary-btn {
          background-color: ${primaryColor} !important;
          border-radius: ${buttonStyle === 'pill' ? '9999px' : borderRadius} !important;
        }
        .primary-btn:hover {
          opacity: 0.92 !important;
          transform: translateY(-1px);
        }
        
        .primary-text {
          color: ${primaryColor} !important;
        }
        
        .primary-border {
          border-color: ${primaryColor} !important;
        }
        
        .primary-bg-light {
          background-color: ${primaryColor}12 !important;
        }
        
        .answer-card {
          border-radius: ${borderRadius} !important;
        }
        .answer-card:hover {
          border-color: ${primaryColor} !important;
          background-color: ${primaryColor}08 !important;
        }
        
        .progress-bar-fill {
          background-color: ${primaryColor} !important;
        }
        
        .quiz-icon-bg {
          background-color: ${primaryColor} !important;
        }
        
        .result-tag {
          background-color: ${primaryColor}12 !important;
          color: ${primaryColor} !important;
        }
        
        ${quiz.custom_css || ''}
      ` }} />

      <motion.div 
        layout
        className={`w-full max-w-2xl relative z-10 transition-all ${
          cardStyle === 'glassmorphism' ? 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl' :
          cardStyle === 'flat' ? 'bg-white border-none shadow-md' :
          cardStyle === 'bordered' ? 'bg-white border-4 border-slate-900 shadow-xl' :
          'bg-white shadow-2xl border border-slate-100'
        }`}
        style={{ borderRadius: borderRadius }}
      >
        {/* Quiz Header Logo */}
        {quiz.logo_url && (
          <div className="pt-8 px-8 flex justify-center">
            <img src={quiz.logo_url} alt="Logo" className="h-12 object-contain max-w-[200px]" />
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <motion.div 
              key="intro"
              {...animProps}
              className="p-12 text-center space-y-8"
            >
              {!quiz.logo_url && (
                <div 
                  className="w-20 h-20 flex items-center justify-center text-white mx-auto shadow-xl quiz-icon-bg"
                  style={{ borderRadius: borderRadius }}
                >
                  <BrainCircuit className="w-12 h-12" />
                </div>
              )}
              <div className="space-y-4">
                <h1 className="text-4xl font-display font-bold text-slate-900">{quiz.title}</h1>
                <p className="text-lg text-slate-600 leading-relaxed">{quiz.description}</p>
              </div>
              <Button 
                onClick={() => { playSound('click'); setStep('questions'); }} 
                className={`w-full py-4 text-lg primary-btn ${
                  buttonStyle === 'gradient' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' :
                  buttonStyle === 'shadow3d' ? 'border-b-4 border-black/20 text-white' :
                  buttonStyle === 'outline' ? 'bg-transparent border-2 text-indigo-600 border-indigo-600 hover:bg-indigo-50' : ''
                }`}
              >
                Démarrer le diagnostic <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {step === 'questions' && (
            <motion.div 
              key={`q-${currentQIdx}`}
              {...animProps}
              className="p-12 space-y-8"
            >
              {/* Progress Bar Rendering */}
              {progressBarStyle !== 'none' && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-widest primary-text">Question {currentQIdx + 1} / {quiz.questions?.length}</span>
                  
                  {progressBarStyle === 'bar' && (
                    <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-300 progress-bar-fill" style={{ width: `${((currentQIdx + 1) / quiz.questions!.length) * 100}%` }} />
                    </div>
                  )}

                  {progressBarStyle === 'dots' && (
                    <div className="flex items-center gap-1.5">
                      {quiz.questions?.map((_, idx) => (
                        <div 
                          key={idx} 
                          className={`h-2 rounded-full transition-all ${idx === currentQIdx ? 'w-5' : 'w-2 opacity-30'}`}
                          style={{ backgroundColor: primaryColor }}
                        />
                      ))}
                    </div>
                  )}

                  {progressBarStyle === 'percentage' && (
                    <span className="text-xs font-bold primary-text">
                      {Math.round(((currentQIdx + 1) / quiz.questions!.length) * 100)}%
                    </span>
                  )}
                </div>
              )}

              <h2 className="text-2xl font-bold text-slate-900">{quiz.questions![currentQIdx].question_text}</h2>
              <div className="space-y-3">
                {quiz.questions![currentQIdx].answers.map((ans: any) => (
                  <button
                    key={ans.id}
                    onClick={() => handleAnswer(ans.id)}
                    className="w-full p-5 text-left bg-white border-2 border-slate-100 transition-all group flex items-center justify-between answer-card shadow-sm hover:shadow-md"
                  >
                    <span className="font-semibold text-slate-800 group-hover:primary-text">{ans.label}</span>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:primary-text shrink-0" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'email' && (
            <motion.div 
              key="email"
              {...animProps}
              className="p-12 text-center space-y-8"
            >
              <div 
                className="w-16 h-16 flex items-center justify-center mx-auto primary-bg-light"
                style={{ borderRadius: borderRadius }}
              >
                <Users className="w-8 h-8 primary-text" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">Une dernière étape...</h2>
                <p className="text-slate-500">Où devons-nous envoyer vos résultats personnalisés ?</p>
              </div>
              <div className="space-y-4">
                <Input 
                  placeholder="votre@email.com" 
                  value={email} 
                  onChange={setEmail} 
                  className="text-center text-lg py-3"
                />
                <Button onClick={handleSubmit} disabled={!email || loading} className="w-full py-4 text-lg primary-btn">
                  {loading ? 'Analyse en cours...' : 'Voir mes résultats'}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'result' && result && (
            <motion.div 
              key="result"
              {...animProps}
              className="p-12 space-y-8"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider result-tag">
                  <CheckCircle2 className="w-4 h-4" /> Diagnostic Terminé
                </div>
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-widest">Votre Profil est :</h2>
                <h1 className="text-4xl font-display font-bold primary-text">{result.profile?.name || 'Profil Identifié'}</h1>
              </div>

              <div className="p-8 bg-slate-50 border border-slate-100 space-y-4" style={{ borderRadius: borderRadius }}>
                <h3 className="font-bold text-lg">Analyse de votre situation</h3>
                <p className="text-slate-600 leading-relaxed">{result.profile?.description}</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white quiz-icon-bg">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-xl">Notre recommandation</h3>
                </div>
                <p className="text-lg text-slate-700 leading-relaxed italic border-l-4 pl-6 primary-border">
                  "{result.profile?.recommendation}"
                </p>
              </div>

              {result.profile?.cta_text && (
                <Button 
                  onClick={() => window.open(result.profile.cta_url, '_blank')} 
                  className="w-full py-5 text-xl shadow-xl primary-btn shadow-indigo-100/50"
                >
                  {result.profile.cta_text} <ArrowRight className="w-6 h-6" />
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'landing' | 'auth' | 'dashboard' | 'quizzes' | 'builder' | 'quiz' | 'leads' | 'settings'>('landing');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [quizSlug, setQuizSlug] = useState<string | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/quiz/')) {
      setQuizSlug(path.split('/quiz/')[1]);
      setView('quiz');
    }
  }, []);

  if (view === 'quiz' && quizSlug) {
    return <QuizView slug={quizSlug} />;
  }

  if (view === 'landing') {
    return <LandingPage onStart={() => setView('auth')} />;
  }

  if (view === 'auth' && !user) {
    return <AuthPage onAuth={(u) => { setUser(u); setView('dashboard'); }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
        <div className="p-8 flex items-center gap-3 font-display font-bold text-2xl text-indigo-600">
          <BrainCircuit className="w-8 h-8" />
          <span>DiagnostiQ</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${view === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" /> Vue d'ensemble
          </button>
          <button 
            onClick={() => setView('quizzes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${view === 'quizzes' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ClipboardList className="w-5 h-5" /> Diagnostics
          </button>
          <button 
            onClick={() => setView('leads')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${view === 'leads' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Users className="w-5 h-5" /> Leads & Contacts
          </button>
          <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compte</div>
          <button 
            onClick={() => setView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${view === 'settings' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Settings className="w-5 h-5" /> Paramètres
          </button>
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              {user?.email[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-bold truncate">{user?.email}</div>
              <div className="text-xs text-slate-400 capitalize">{user?.plan} Plan</div>
            </div>
          </div>
          <button 
            onClick={() => { setUser(null); setView('landing'); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {view === 'dashboard' && (
            <DashboardView 
              user={user!} 
              setView={setView}
              onSelectQuiz={async (q) => {
                const fullQuiz = await api.getQuiz(q.slug);
                setSelectedQuiz(fullQuiz);
                setView('builder');
              }}
            />
          )}
          {view === 'quizzes' && (
            <DiagnosticsView 
              user={user!} 
              onSelectQuiz={async (q) => {
                const fullQuiz = await api.getQuiz(q.slug);
                setSelectedQuiz(fullQuiz);
                setView('builder');
              }}
            />
          )}
          {view === 'builder' && selectedQuiz && (
            <QuizBuilder 
              quiz={selectedQuiz} 
              onBack={() => setView('quizzes')} 
            />
          )}
          {view === 'leads' && (
            <LeadsView user={user!} />
          )}
          {view === 'settings' && (
            <SettingsView user={user!} onUpdateUser={setUser} />
          )}
        </div>
      </main>
    </div>
  );
}
