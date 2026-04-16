import { Children, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
type User = { id: string; name: string; email?: string };
import {
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  FolderKanban,
  HeartPulse,
  Landmark,
  Lightbulb,
  LogOut,
  PieChart,
  PiggyBank,
  Plus,
  Receipt,
  Sparkles,
  Target,
  Trash2,
  Wallet,
} from "lucide-react";

type TabId = "financeiro" | "saude" | "ideias" | "todo" | "projeto";
type Relation = "você" | "cônjuge" | "dependente";
type Urgency = 0 | 1 | 2 | 3;
type CalendarView = "diario" | "semanal" | "mensal";

const strengthMuscleGroups = ["Bíceps", "Tríceps", "Peito", "Costas", "Pernas", "Ombros"] as const;
type StrengthMuscleGroup = (typeof strengthMuscleGroups)[number];
const strengthEffortLevels = ["Leve", "Moderado", "Pesado", "Muito pesado"] as const;
type StrengthEffortLevel = (typeof strengthEffortLevels)[number];

type Person = {
  id: string;
  name: string;
  relation: Relation;
};

type Expense = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  paymentMethod: string;
  personId: string;
};

type IncomeSource = {
  id: string;
  name: string;
};

type IncomeEntry = {
  id: string;
  date: string;
  amount: number;
  sourceId: string;
};

type WeightEntry = {
  id: string;
  date: string;
  weight: number;
};

type StrengthEntry = {
  id: string;
  date: string;
  exercise: string;
  muscleGroup: StrengthMuscleGroup;
  effortLevel: StrengthEffortLevel;
  weight: number;
  reps: number;
};

type WorkoutEntry = {
  id: string;
  date: string;
  title: string;
  emoji: string;
  rating: 1 | 2 | 3 | 4 | 5;
  notes: string;
};

type Nutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type MealEntry = Nutrition & {
  id: string;
  date: string;
  description: string;
};

type AiPlan = {
  createdAt: string;
  goal: "emagrecer" | "manter" | "ganhar massa";
  targetCalories: number;
  macros: Nutrition;
  trainingPlan: string[];
  dietPlan: string[];
};

type IdeaFolder = {
  id: string;
  name: string;
  purpose: string;
};

type IdeaNote = {
  id: string;
  folderId: string;
  emoji: string;
  title: string;
  coverUrl: string;
  content: string;
  updatedAt: string;
};

type StrengthExerciseGroup = {
  key: string;
  name: string;
  muscleGroup: StrengthMuscleGroup;
  latestDate: string;
  latestWeight: number;
  entries: StrengthEntry[];
};

type PersistedState = {
  people: Person[];
  expenses: Expense[];
  incomes: IncomeEntry[];
  incomeSources: IncomeSource[];
  weights: WeightEntry[];
  strengths: StrengthEntry[];
  workouts: WorkoutEntry[];
  aiPlan: AiPlan | null;
  meals: MealEntry[];
  folders: IdeaFolder[];
  notes: IdeaNote[];
  todos: TodoItem[];
  fixedExpenses: FixedExpense[];
  billsToPay: BillToPay[];
  habits: ProjectHabit[];
  habitChecks: ProjectChecks;
};

type TodoItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  urgency: Urgency;
  repeat: "nenhuma" | "diaria" | "semanal" | "mensal";
  notes: string;
  done: boolean;
};

type FixedExpense = {
  id: string;
  name: string;
  amount: number;
  category: string;
  paymentMethod: string;
};

type BillToPay = {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  noDate?: boolean;
};

type ProjectHabit = {
  id: string;
  name: string;
};

type ProjectChecks = Record<string, Record<string, boolean>>;

const defaultPeople: Person[] = [{ id: "self", name: "Você", relation: "você" }];
const defaultIncomeSources: IncomeSource[] = [{ id: "salario", name: "Salário" }];
const defaultFolders: IdeaFolder[] = [];
const defaultHabits: ProjectHabit[] = [
  { id: "dieta", name: "Dieta" },
  { id: "treino", name: "Treino" },
  { id: "oracao", name: "Oração" },
  { id: "sono", name: "Sono correto" },
];

const TOKEN_KEY = "_outstand_token";
const getToken = () => localStorage.getItem(TOKEN_KEY);
const authFetch = (url: string, init?: RequestInit) =>
  fetch(url, {
    ...init,
    headers: { ...(init?.headers as Record<string, string>), Authorization: `Bearer ${getToken() ?? ""}` },
  });

const uid = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const isoDate = (date: Date) => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const todayISO = () => isoDate(new Date());

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const toStrengthMuscleGroup = (value?: string): StrengthMuscleGroup => {
  if (!value) return "Peito";
  return strengthMuscleGroups.includes(value as StrengthMuscleGroup) ? (value as StrengthMuscleGroup) : "Peito";
};

const toStrengthEffortLevel = (value?: string): StrengthEffortLevel => {
  if (!value) return "Moderado";
  return strengthEffortLevels.includes(value as StrengthEffortLevel)
    ? (value as StrengthEffortLevel)
    : "Moderado";
};

const normalizeStrengthEntry = (entry: Partial<StrengthEntry>): StrengthEntry => {
  const weight = typeof entry.weight === "number" ? entry.weight : Number(entry.weight ?? 0);
  const reps = typeof entry.reps === "number" ? entry.reps : Number(entry.reps ?? 8);

  return {
    id: entry.id ?? uid(),
    date: typeof entry.date === "string" && entry.date ? entry.date : todayISO(),
    exercise: typeof entry.exercise === "string" ? entry.exercise.trim() : "",
    muscleGroup: toStrengthMuscleGroup(entry.muscleGroup),
    effortLevel: toStrengthEffortLevel(entry.effortLevel),
    weight: Number.isFinite(weight) ? weight : 0,
    reps: Number.isFinite(reps) ? Math.max(1, Math.round(reps)) : 8,
  };
};

const formatMoney = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const parseDate = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const shortDate = (value: string) =>
  parseDate(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

const longDate = (value: string) =>
  parseDate(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const startWeek = (source: Date) => {
  const date = new Date(source);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (source: Date, amount: number) => {
  const date = new Date(source);
  date.setDate(date.getDate() + amount);
  return date;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function useLocalState<T>(key: string, initialValue: T, scopeKey = "") {
  const storageKey = scopeKey ? `${scopeKey}:${key}` : key;

  const readState = () => {
    if (typeof window === "undefined") return initialValue;
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  };

  const [state, setState] = useState<T>(readState);

  useEffect(() => {
    setState(readState());
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [storageKey, state]);

  return [state, setState] as const;
}

type FoodEntry = {
  aliases: string[];
  per100: Nutrition;
  unit?: Nutrition;
  defaultGrams?: number;
  measures?: Record<string, number>;
};

const foodDatabase: Record<string, FoodEntry> = {
  arroz: {
    aliases: ["arroz"],
    per100: { calories: 130, protein: 2.5, carbs: 28, fat: 0.3 },
    defaultGrams: 130,
    measures: { colher: 25, colheres: 25, concha: 100, prato: 220 },
  },
  feijao: {
    aliases: ["feijao", "feijão"],
    per100: { calories: 77, protein: 4.8, carbs: 13.6, fat: 0.5 },
    defaultGrams: 120,
    measures: { colher: 20, colheres: 20, concha: 100 },
  },
  frango: {
    aliases: ["frango", "peito"],
    per100: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    defaultGrams: 140,
  },
  carne: {
    aliases: ["carne", "patinho", "alcatra", "bife"],
    per100: { calories: 250, protein: 26, carbs: 0, fat: 17 },
    defaultGrams: 130,
  },
  peixe: {
    aliases: ["peixe", "tilapia", "salmao", "salmão"],
    per100: { calories: 180, protein: 24, carbs: 0, fat: 9 },
    defaultGrams: 130,
  },
  ovo: {
    aliases: ["ovo", "ovos"],
    per100: { calories: 143, protein: 13, carbs: 0.7, fat: 9.5 },
    unit: { calories: 70, protein: 6, carbs: 0.4, fat: 5 },
    defaultGrams: 50,
  },
  banana: {
    aliases: ["banana"],
    per100: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
    unit: { calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
    defaultGrams: 120,
  },
  maca: {
    aliases: ["maca", "maçã"],
    per100: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
    unit: { calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
    defaultGrams: 130,
  },
  pao: {
    aliases: ["pao", "pão", "pao frances", "pão francês"],
    per100: { calories: 265, protein: 9, carbs: 49, fat: 3.2 },
    unit: { calories: 140, protein: 4.5, carbs: 26, fat: 1.8 },
    defaultGrams: 50,
    measures: { fatia: 30, fatias: 30 },
  },
  aveia: {
    aliases: ["aveia"],
    per100: { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
    defaultGrams: 40,
    measures: { colher: 15, colheres: 15 },
  },
  macarrao: {
    aliases: ["macarrao", "macarrão", "massa"],
    per100: { calories: 158, protein: 5.8, carbs: 30.9, fat: 0.9 },
    defaultGrams: 150,
    measures: { prato: 220 },
  },
  iogurte: {
    aliases: ["iogurte"],
    per100: { calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
    defaultGrams: 170,
  },
  leite: {
    aliases: ["leite"],
    per100: { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
    defaultGrams: 200,
    measures: { xicara: 240, xicaras: 240 },
  },
  queijo: {
    aliases: ["queijo"],
    per100: { calories: 321, protein: 24, carbs: 3, fat: 25 },
    defaultGrams: 40,
    measures: { fatia: 25, fatias: 25 },
  },
  batata: {
    aliases: ["batata", "batata doce", "batata-doce"],
    per100: { calories: 86, protein: 2, carbs: 20, fat: 0.1 },
    defaultGrams: 140,
  },
  azeite: {
    aliases: ["azeite"],
    per100: { calories: 884, protein: 0, carbs: 0, fat: 100 },
    defaultGrams: 10,
    measures: { colher: 8, colheres: 8 },
  },
  salada: {
    aliases: ["salada", "alface", "tomate", "legumes", "verduras"],
    per100: { calories: 28, protein: 1.6, carbs: 5, fat: 0.4 },
    defaultGrams: 120,
    measures: { prato: 150 },
  },
};

const standardMeasures: Record<string, number> = {
  colher: 15,
  colheres: 15,
  xicara: 240,
  xicaras: 240,
  fatia: 30,
  fatias: 30,
  concha: 100,
  prato: 320,
};

const applyNutritionFactor = (total: Nutrition, source: Nutrition, factor: number) => {
  total.calories += source.calories * factor;
  total.protein += source.protein * factor;
  total.carbs += source.carbs * factor;
  total.fat += source.fat * factor;
};

const resolveFood = (token: string): FoodEntry | null => {
  const cleanToken = normalize(token).replace(/[^a-z]/g, "");
  if (!cleanToken) return null;

  return (
    Object.values(foodDatabase).find((item) =>
      item.aliases.some((alias) => {
        const cleanAlias = normalize(alias).replace(/[^a-z]/g, "");
        return cleanToken === cleanAlias || cleanToken.startsWith(cleanAlias) || cleanAlias.startsWith(cleanToken);
      })
    ) ?? null
  );
};

const estimateNutrition = (text: string): Nutrition => {
  const normalized = normalize(text);
  const regex =
    /(\d+(?:[.,]\d+)?)\s*(kg|g|gramas|grama|ml|l|un|unidade|unidades|x|colher(?:es)?|xicara|xicaras|fatia|fatias|prato|concha)?\s*(?:de\s+)?([a-zA-ZÀ-ÿ-]+)/g;

  let match: RegExpExecArray | null;
  let hits = 0;
  const total: Nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const quantifiedFoods = new Set<string>();

  while ((match = regex.exec(normalized))) {
    const amount = Number(match[1].replace(",", "."));
    const unit = normalize(match[2] ?? "");
    const food = resolveFood(match[3]);

    if (!food || Number.isNaN(amount) || amount <= 0) continue;

    hits += 1;
    quantifiedFoods.add(food.aliases[0]);

    const shouldUseUnits =
      (["un", "unidade", "unidades", "x"].includes(unit) || (!unit && Number.isInteger(amount) && amount <= 12)) &&
      Boolean(food.unit);

    if (shouldUseUnits && food.unit) {
      applyNutritionFactor(total, food.unit, amount);
      continue;
    }

    let grams = amount;
    if (unit === "kg" || unit === "l") {
      grams = amount * 1000;
    } else if (["g", "grama", "gramas", "ml", ""].includes(unit)) {
      grams = !unit && amount <= 10 && food.defaultGrams ? amount * food.defaultGrams : amount;
    } else {
      const foodMeasure = food.measures?.[unit];
      const genericMeasure = standardMeasures[unit];
      grams = amount * (foodMeasure ?? genericMeasure ?? food.defaultGrams ?? 100);
    }

    applyNutritionFactor(total, food.per100, grams / 100);
  }

  Object.values(foodDatabase).forEach((food) => {
    if (quantifiedFoods.has(food.aliases[0])) return;
    const mentioned = food.aliases.some((alias) => normalized.includes(normalize(alias)));
    if (!mentioned) return;

    hits += 1;
    if (food.unit) {
      applyNutritionFactor(total, food.unit, 1);
      return;
    }

    const grams = food.defaultGrams ?? 120;
    applyNutritionFactor(total, food.per100, grams / 100);
  });

  if (!hits) {
    const words = normalized.split(/\s+/).filter(Boolean).length;
    let calories = 140 + words * 22;

    if (normalized.includes("cafe") || normalized.includes("café")) calories += 120;
    if (normalized.includes("almoco") || normalized.includes("almoço")) calories += 260;
    if (normalized.includes("jantar")) calories += 220;
    if (normalized.includes("lanche")) calories += 100;
    if (/pizza|hamburg|frita|bolo|sorvete/.test(normalized)) calories += 220;
    if (/salada|verdura|legume/.test(normalized)) calories -= 80;

    calories = clamp(Math.round(calories), 120, 1700);

    return {
      calories,
      protein: Math.round((calories * 0.2) / 4),
      carbs: Math.round((calories * 0.48) / 4),
      fat: Math.round((calories * 0.32) / 9),
    };
  }

  return {
    calories: Math.max(60, Math.round(total.calories)),
    protein: Math.max(1, Math.round(total.protein)),
    carbs: Math.max(1, Math.round(total.carbs)),
    fat: Math.max(1, Math.round(total.fat)),
  };
};

const buildPersonalPlan = (weight: number, height: number, age: number, goal: AiPlan["goal"]): AiPlan => {
  const bmi = weight / ((height / 100) * (height / 100));
  const bmiLabel = bmi < 18.5 ? "baixo" : bmi < 25 ? "normal" : "acima";

  const basalBase = Math.round(weight * 33);
  const ageAdjustment = Math.round((30 - age) * 4);
  const maintenance = Math.max(1200, basalBase + ageAdjustment);

  const goalFactor = goal === "emagrecer" ? 0.8 : goal === "ganhar massa" ? 1.14 : 1;
  const targetCalories = Math.round(maintenance * goalFactor);

  const bmiProteinAdjustment = bmi < 20 ? 0.1 : bmi > 28 ? -0.05 : 0;
  const proteinFactor =
    (goal === "ganhar massa" ? (age >= 40 ? 2.3 : 2.2) : goal === "emagrecer" ? 2.1 : 1.9) +
    bmiProteinAdjustment;
  const protein = Math.round(weight * proteinFactor);
  const fat = Math.round(weight * (age >= 45 ? 1 : age <= 25 ? 0.85 : 0.9));
  const heightCarbAdjustment = Math.round((height - 170) * 0.7);
  const carbs = Math.max(90, Math.round((targetCalories - protein * 4 - fat * 9) / 4) + heightCarbAdjustment);

  const sessions = goal === "ganhar massa" ? 5 : goal === "manter" ? 4 : 5;
  const strengthSets = goal === "ganhar massa" ? 16 : goal === "manter" ? 14 : 12;
  const cardioMinutes =
    goal === "emagrecer"
      ? clamp(Math.round(24 + age * 0.4 + (weight - 70) * 0.3 + (170 - height) * 0.08), 20, 60)
      : goal === "manter"
      ? clamp(Math.round(16 + age * 0.25 + (170 - height) * 0.05), 15, 40)
      : clamp(Math.round(12 + age * 0.2 + (170 - height) * 0.04), 10, 30);
  const waterLiters = (weight * 0.04).toFixed(1);
  const mealsPerDay = goal === "ganhar massa" ? 5 : 4;
  const profileVariant = (Math.round(weight) + height + age) % 3;

  const trainingVariants = [
    `Divida em ${sessions} treinos/semana com foco em progressão de carga de 2% a cada 7 dias.`,
    `Alterne blocos pesado/moderado para bater ${strengthSets} séries efetivas por grupo muscular na semana.`,
    `Use ${sessions} sessões semanais com descanso ativo para manter recuperação proporcional à idade (${age} anos).`,
  ];

  const dietVariants = [
    `Mantenha cerca de ${Math.round(protein / mealsPerDay)}g de proteína por refeição nas ${mealsPerDay} refeições do dia.`,
    `Concentre ${Math.round(carbs * 0.55)}g de carboidrato entre pré e pós-treino para melhor rendimento.`,
    `Ajuste porções em ±120 kcal se a média de peso semanal variar fora do objetivo por 2 semanas seguidas.`,
  ];

  const objectiveLine =
    goal === "emagrecer"
      ? `Priorize déficit controlado com cardio de ${cardioMinutes} min após treino de força.`
      : goal === "ganhar massa"
      ? `Mantenha superávit limpo e cardio curto de ${cardioMinutes} min para preservar ganho muscular.`
      : `Mantenha equilíbrio calórico com cardio de ${cardioMinutes} min para sustentar condicionamento.`;

  return {
    createdAt: new Date().toISOString(),
    goal,
    targetCalories,
    macros: { calories: targetCalories, protein, carbs, fat },
    trainingPlan: [
      `Perfil usado: ${weight.toFixed(1)} kg · ${height} cm · ${age} anos`,
      `IMC estimado: ${bmi.toFixed(1)} (${bmiLabel})`,
      `Base metabólica: ${basalBase} kcal | ajuste de idade aplicado`,
      objectiveLine,
      trainingVariants[profileVariant],
    ],
    dietPlan: [
      `Meta diária: ${targetCalories} kcal (${goal}).`,
      `Macros alvo: proteína ${protein}g, carboidrato ${carbs}g, gordura ${fat}g.`,
      `Hidratação mínima: ${waterLiters} L/dia.`,
      dietVariants[profileVariant],
    ],
  };
};

const cardClass =
  "glass-card max-w-full overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-5 md:p-6 shadow-[0_24px_60px_rgba(0,0,0,0.38)]";
const inputClass =
  "w-full min-w-0 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.14)]";
const softBtn =
  "glow-button inline-flex items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100 transition";

function CollapsibleCard({
  title,
  icon,
  defaultOpen = false,
  alwaysOpenLg = false,
  children,
}: {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  alwaysOpenLg?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentBlocks = Children.toArray(children);

  const contentClass = alwaysOpenLg
    ? open
      ? ""
      : "hidden lg:block"
    : "";

  return (
    <section className={`${cardClass} space-y-4`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {icon}
        </div>
        <button
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-200 ${alwaysOpenLg ? "lg:hidden" : ""}`}
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? "Contrair caixa" : "Expandir caixa"}
        >
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      <div className={`space-y-4 ${contentClass}`}>
        {open || alwaysOpenLg ? contentBlocks : null}
      </div>
    </section>
  );
}

function App() {
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSyncingState, setIsSyncingState] = useState(false);
  const [loginError, setLoginError] = useState("");
  const importFileRef = useRef<HTMLInputElement | null>(null);
  const remoteLoadedRef = useRef(false);
  const hydrateRef = useRef(false);
  const syncTimeoutRef = useRef<number | null>(null);

  const storageScope = sessionUser ? `outstand_user_${sessionUser.id}` : "outstand_sessionless";

  const [activeTab, setActiveTab] = useState<TabId>("financeiro");

  const [people, setPeople] = useLocalState<Person[]>("outstand_people", defaultPeople, storageScope);
  const [expenses, setExpenses] = useLocalState<Expense[]>("outstand_expenses", [], storageScope);
  const [incomes, setIncomes] = useLocalState<IncomeEntry[]>("outstand_incomes", [], storageScope);
  const [incomeSources, setIncomeSources] = useLocalState<IncomeSource[]>(
    "outstand_income_sources",
    defaultIncomeSources,
    storageScope
  );

  const [weights, setWeights] = useLocalState<WeightEntry[]>("outstand_weights", [], storageScope);
  const [strengths, setStrengths] = useLocalState<StrengthEntry[]>("outstand_strengths", [], storageScope);
  const [workouts, setWorkouts] = useLocalState<WorkoutEntry[]>("outstand_workouts", [], storageScope);
  const [aiPlan, setAiPlan] = useLocalState<AiPlan | null>("outstand_ai_plan", null, storageScope);
  const [meals, setMeals] = useLocalState<MealEntry[]>("outstand_meals", [], storageScope);

  const [folders, setFolders] = useLocalState<IdeaFolder[]>("outstand_folders", defaultFolders, storageScope);
  const [notes, setNotes] = useLocalState<IdeaNote[]>("outstand_notes", [], storageScope);

  const [todos, setTodos] = useLocalState<TodoItem[]>("outstand_todos", [], storageScope);

  const [fixedExpenses, setFixedExpenses] = useLocalState<FixedExpense[]>("outstand_fixed_expenses", [], storageScope);
  const [billsToPay, setBillsToPay] = useLocalState<BillToPay[]>("outstand_bills_to_pay", [], storageScope);

  const [habits, setHabits] = useLocalState<ProjectHabit[]>("outstand_habits", defaultHabits, storageScope);
  const [habitChecks, setHabitChecks] = useLocalState<ProjectChecks>("outstand_checks", {}, storageScope);

  const [personFilter, setPersonFilter] = useState("all");
  const [expenseDraft, setExpenseDraft] = useState({
    date: todayISO(),
    description: "",
    amount: "",
    category: "Alimentação",
    paymentMethod: "PIX",
    personId: "self",
  });
  const [incomeDraft, setIncomeDraft] = useState({ date: todayISO(), amount: "", sourceId: "salario" });
  const [incomeSourceDraft, setIncomeSourceDraft] = useState({ name: "", editingId: "" });
  const [showIncomeSources, setShowIncomeSources] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [showFixedExpenseForm, setShowFixedExpenseForm] = useState(false);
  const [showBillToPayForm, setShowBillToPayForm] = useState(false);
  const [allExpensesCategoryFilter, setAllExpensesCategoryFilter] = useState("all");
  const [allExpensesDateFrom, setAllExpensesDateFrom] = useState("");
  const [allExpensesDateTo, setAllExpensesDateTo] = useState("");
  const [personDraft, setPersonDraft] = useState({ name: "", relation: "dependente" as Relation });

  const [fixedExpenseDraft, setFixedExpenseDraft] = useState({
    name: "",
    amount: "",
    category: "Moradia",
    paymentMethod: "PIX",
  });
  const [billToPayDraft, setBillToPayDraft] = useState({
    name: "",
    amount: "",
    dueDate: todayISO(),
    noDate: false,
  });

  const [weightDraft, setWeightDraft] = useState({ date: todayISO(), weight: "" });
  const [strengthDraft, setStrengthDraft] = useState({
    date: todayISO(),
    exercise: "",
    muscleGroup: "Peito" as StrengthMuscleGroup,
    effortLevel: "Moderado" as StrengthEffortLevel,
    weight: "",
    reps: "8",
  });
  const [workoutDraft, setWorkoutDraft] = useState({
    date: todayISO(),
    emoji: "🏋️",
    title: "",
    rating: "3",
    notes: "",
  });
  const [showWorkoutList, setShowWorkoutList] = useState(false);
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [showAiForm, setShowAiForm] = useState(false);
  const [showMealForm, setShowMealForm] = useState(false);

  const [aiDraft, setAiDraft] = useState({
    weight: "",
    height: "",
    age: "",
    goal: "manter" as AiPlan["goal"],
  });

  const [mealDraft, setMealDraft] = useState({ date: todayISO(), description: "" });
  const [strengthGroupFilter, setStrengthGroupFilter] = useState<StrengthMuscleGroup | "todos">("todos");
  const [selectedStrengthExerciseKey, setSelectedStrengthExerciseKey] = useState("");
  const [showMuscleGroups, setShowMuscleGroups] = useState(false);
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [showStrengthForm, setShowStrengthForm] = useState(false);
  const [mealEstimate, setMealEstimate] = useState<Nutrition | null>(null);
  const [mealFocusDate, setMealFocusDate] = useState(todayISO());

  const [folderDraft, setFolderDraft] = useState({ name: "" });
  const [selectedFolder, setSelectedFolder] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const [calendarView, setCalendarView] = useState<CalendarView>("semanal");
  const [calendarAnchor, setCalendarAnchor] = useState(todayISO());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(todayISO());
  const [todoDraft, setTodoDraft] = useState({
    title: "",
    date: todayISO(),
    time: "",
    urgency: "1",
    repeat: "nenhuma" as TodoItem["repeat"],
    notes: "",
  });

  const [projectAnchor, setProjectAnchor] = useState(todayISO());
  const [habitDraft, setHabitDraft] = useState("");
  const [showTodoForm, setShowTodoForm] = useState(false);
  const [showHabitForm, setShowHabitForm] = useState(false);

  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission;
  });

  const notificationTimers = useRef<Record<string, number>>({});

  useEffect(() => {
    if (selectedFolder && folders.some((f) => f.id === selectedFolder)) return;
    setSelectedFolder(folders[0]?.id ?? "");
  }, [folders, selectedFolder]);

  useEffect(() => {
    if (incomeDraft.sourceId && incomeSources.some((source) => source.id === incomeDraft.sourceId)) return;
    setIncomeDraft((prev) => ({ ...prev, sourceId: incomeSources[0]?.id ?? "" }));
  }, [incomeDraft.sourceId, incomeSources]);

  useEffect(() => {
    let mounted = true;
    const checkSession = async () => {
      const token = getToken();
      if (!token) {
        if (mounted) setIsCheckingSession(false);
        return;
      }
      try {
        const res = await authFetch("/api/auth/session");
        const data = (await res.json()) as { user: User | null };
        if (mounted) setSessionUser(data.user);
      } finally {
        if (mounted) setIsCheckingSession(false);
      }
    };
    checkSession();
    return () => { mounted = false; };
  }, []);


  const persistedState = useMemo<PersistedState>(
    () => ({
      people,
      expenses,
      incomes,
      incomeSources,
      weights,
      strengths,
      workouts,
      aiPlan,
      meals,
      folders,
      notes,
      todos,
      fixedExpenses,
      billsToPay,
      habits,
      habitChecks,
    }),
    [
      people,
      expenses,
      incomes,
      incomeSources,
      weights,
      strengths,
      workouts,
      aiPlan,
      meals,
      folders,
      notes,
      todos,
      fixedExpenses,
      billsToPay,
      habits,
      habitChecks,
    ]
  );

  useEffect(() => {
    if (!sessionUser) {
      remoteLoadedRef.current = false;
      return;
    }

    let cancelled = false;

    const loadRemoteState = async () => {
      setIsSyncingState(true);
      remoteLoadedRef.current = false;

      try {
        const response = await authFetch("/api/state");
        const data = (await response.json()) as { payload?: Partial<PersistedState> };
        const payload = data?.payload && typeof data.payload === "object" ? data.payload : {};

        if (cancelled) return;

        hydrateRef.current = true;
        setPeople(Array.isArray(payload.people) ? payload.people : defaultPeople);
        setExpenses(Array.isArray(payload.expenses) ? payload.expenses : []);
        setIncomes(Array.isArray(payload.incomes) ? payload.incomes : []);
        setIncomeSources(Array.isArray(payload.incomeSources) ? payload.incomeSources : defaultIncomeSources);
        setWeights(Array.isArray(payload.weights) ? payload.weights : []);
        setStrengths(
          Array.isArray(payload.strengths)
            ? payload.strengths
                .map((entry) => normalizeStrengthEntry(entry as Partial<StrengthEntry>))
                .filter((entry) => entry.exercise && entry.weight > 0)
            : []
        );
        setWorkouts(Array.isArray(payload.workouts) ? payload.workouts : []);
        setAiPlan(payload.aiPlan && typeof payload.aiPlan === "object" ? (payload.aiPlan as AiPlan) : null);
        setMeals(Array.isArray(payload.meals) ? payload.meals : []);
        setFolders(Array.isArray(payload.folders) ? payload.folders : defaultFolders);
        setNotes(Array.isArray(payload.notes) ? payload.notes : []);
        setTodos(Array.isArray(payload.todos) ? payload.todos : []);
        setFixedExpenses(Array.isArray(payload.fixedExpenses) ? payload.fixedExpenses : []);
        setBillsToPay(Array.isArray(payload.billsToPay) ? payload.billsToPay : []);
        setHabits(Array.isArray(payload.habits) ? payload.habits : defaultHabits);
        setHabitChecks(
          payload.habitChecks && typeof payload.habitChecks === "object"
            ? (payload.habitChecks as ProjectChecks)
            : {}
        );
      } catch {
        if (!cancelled) {
          remoteLoadedRef.current = true;
        }
      } finally {
        if (!cancelled) {
          remoteLoadedRef.current = true;
          setIsSyncingState(false);
          window.setTimeout(() => {
            hydrateRef.current = false;
          }, 0);
        }
      }
    };

    loadRemoteState();

    return () => {
      cancelled = true;
    };
  }, [
    sessionUser,
    setAiPlan,
    setExpenses,
    setIncomes,
    setIncomeSources,
    setFolders,
    setHabitChecks,
    setHabits,
    setMeals,
    setNotes,
    setPeople,
    setStrengths,
    setTodos,
    setWeights,
    setWorkouts,
  ]);

  useEffect(() => {
    if (!sessionUser || !remoteLoadedRef.current || hydrateRef.current) return;

    if (syncTimeoutRef.current) {
      window.clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = window.setTimeout(async () => {
      try {
        await authFetch("/api/state", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: persistedState }),
        });
      } catch {
        // Silent fail to keep app usable offline
      }
    }, 700);

    return () => {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [persistedState, sessionUser]);

  useEffect(() => {
    Object.values(notificationTimers.current).forEach((id) => window.clearTimeout(id));
    notificationTimers.current = {};

    if (notificationPermission !== "granted") return;

    const now = Date.now();
    todos.forEach((todo) => {
      if (!todo.time || todo.done) return;
      const trigger = new Date(`${todo.date}T${todo.time}:00`).getTime();
      const delay = trigger - now;
      if (delay <= 0 || delay > 7 * 24 * 60 * 60 * 1000) return;

      const timer = window.setTimeout(() => {
        new Notification(`OUTSTAND · ${todo.title}`, {
          body: `Compromisso em ${longDate(todo.date)} às ${todo.time}`,
        });
      }, delay);

      notificationTimers.current[todo.id] = timer;
    });

    return () => {
      Object.values(notificationTimers.current).forEach((id) => window.clearTimeout(id));
      notificationTimers.current = {};
    };
  }, [notificationPermission, todos]);

  const tabs = [
    { id: "financeiro" as const, label: "Financeiro", icon: Wallet },
    { id: "saude" as const, label: "Saúde", icon: HeartPulse },
    { id: "ideias" as const, label: "Ideias", icon: Lightbulb },
    { id: "todo" as const, label: "To-Do", icon: CalendarClock },
    { id: "projeto" as const, label: "Projeto", icon: Target },
  ];

  const filteredExpenses = useMemo(() => {
    if (personFilter === "all") return expenses;
    return expenses.filter((item) => item.personId === personFilter);
  }, [expenses, personFilter]);

  const allExpensesFiltered = useMemo(() => {
    const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
    return sorted.filter((item) => {
      if (allExpensesCategoryFilter !== "all" && item.category !== allExpensesCategoryFilter) return false;
      if (allExpensesDateFrom && item.date < allExpensesDateFrom) return false;
      if (allExpensesDateTo && item.date > allExpensesDateTo) return false;
      return true;
    });
  }, [expenses, allExpensesCategoryFilter, allExpensesDateFrom, allExpensesDateTo]);

  const allExpensesTotal = useMemo(
    () => allExpensesFiltered.reduce((sum, item) => sum + item.amount, 0),
    [allExpensesFiltered]
  );

  const totalFixedExpenses = useMemo(
    () => fixedExpenses.reduce((sum, item) => sum + item.amount, 0),
    [fixedExpenses]
  );

  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((sum, item) => sum + item.amount, 0) + totalFixedExpenses,
    [filteredExpenses, totalFixedExpenses]
  );

  const totalIncome = useMemo(() => incomes.reduce((sum, item) => sum + item.amount, 0), [incomes]);
  const netBalance = totalIncome - totalExpenses;

  const sortedIncomes = useMemo(
    () => [...incomes].sort((a, b) => b.date.localeCompare(a.date)),
    [incomes]
  );

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach((item) => {
      map.set(item.category, (map.get(item.category) ?? 0) + item.amount);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  const expensesByPayment = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach((item) => {
      map.set(item.paymentMethod, (map.get(item.paymentMethod) ?? 0) + item.amount);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  const combinedExpensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach((item) => {
      map.set(item.category, (map.get(item.category) ?? 0) + item.amount);
    });
    fixedExpenses.forEach((item) => {
      map.set(item.category, (map.get(item.category) ?? 0) + item.amount);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses, fixedExpenses]);

  const combinedExpensesByPayment = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach((item) => {
      map.set(item.paymentMethod, (map.get(item.paymentMethod) ?? 0) + item.amount);
    });
    fixedExpenses.forEach((item) => {
      map.set(item.paymentMethod, (map.get(item.paymentMethod) ?? 0) + item.amount);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses, fixedExpenses]);

  const monthlyFinance = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; income: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      months.push({ key, label, income: 0, expenses: 0 });
    }
    incomes.forEach((item) => {
      const m = item.date.slice(0, 7);
      const entry = months.find((e) => e.key === m);
      if (entry) entry.income += item.amount;
    });
    expenses.forEach((item) => {
      const m = item.date.slice(0, 7);
      const entry = months.find((e) => e.key === m);
      if (entry) entry.expenses += item.amount;
    });
    if (months[months.length - 1]) {
      months[months.length - 1].expenses += totalFixedExpenses;
    }
    return months;
  }, [incomes, expenses, totalFixedExpenses]);

  const sortedWeights = useMemo(() => [...weights].sort((a, b) => a.date.localeCompare(b.date)), [weights]);
  const normalizedStrengths = useMemo(
    () => strengths.map((entry) => normalizeStrengthEntry(entry)).filter((entry) => entry.exercise && entry.weight > 0),
    [strengths]
  );
  const sortedStrengths = useMemo(
    () => [...normalizedStrengths].sort((a, b) => b.date.localeCompare(a.date)),
    [normalizedStrengths]
  );
  const strengthExercises = useMemo<StrengthExerciseGroup[]>(() => {
    const grouped = new Map<string, StrengthExerciseGroup>();

    sortedStrengths.forEach((entry) => {
      const key = normalize(entry.exercise);
      if (!key) return;

      const current = grouped.get(key);
      if (!current) {
        grouped.set(key, {
          key,
          name: entry.exercise,
          muscleGroup: entry.muscleGroup,
          latestDate: entry.date,
          latestWeight: entry.weight,
          entries: [entry],
        });
        return;
      }

      current.entries.push(entry);
      if (entry.date > current.latestDate) {
        current.latestDate = entry.date;
        current.latestWeight = entry.weight;
      }
    });

    return [...grouped.values()]
      .map((group) => ({
        ...group,
        entries: [...group.entries].sort((a, b) => a.date.localeCompare(b.date)),
      }))
      .sort((a, b) => b.latestDate.localeCompare(a.latestDate));
  }, [sortedStrengths]);
  const visibleStrengthExercises = useMemo(
    () =>
      strengthExercises.filter(
        (exercise) => strengthGroupFilter === "todos" || exercise.muscleGroup === strengthGroupFilter
      ),
    [strengthExercises, strengthGroupFilter]
  );
  const sortedWorkouts = useMemo(
    () => [...workouts].sort((a, b) => b.date.localeCompare(a.date)),
    [workouts]
  );

  const weightDelta = useMemo(() => {
    if (sortedWeights.length < 2) return 0;
    return sortedWeights[sortedWeights.length - 1].weight - sortedWeights[0].weight;
  }, [sortedWeights]);

  const targetCalories = aiPlan?.targetCalories ?? 2000;
  const caloriesEaten = useMemo(
    () => meals.filter((m) => m.date === mealFocusDate).reduce((sum, m) => sum + m.calories, 0),
    [mealFocusDate, meals]
  );
  const caloriePct = clamp(Math.round((caloriesEaten / targetCalories) * 100), 0, 130);

  const visibleNotes = useMemo(
    () => notes.filter((note) => note.folderId === selectedFolder).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [notes, selectedFolder]
  );

  const todosByDate = useMemo(() => {
    const map = new Map<string, TodoItem[]>();
    todos.forEach((todo) => {
      const list = map.get(todo.date) ?? [];
      list.push(todo);
      map.set(todo.date, list);
    });
    return map;
  }, [todos]);

  const visibleCalendarDates = useMemo(() => {
    const base = parseDate(calendarAnchor);
    if (calendarView === "diario") return [calendarAnchor];

    if (calendarView === "semanal") {
      const start = startWeek(base);
      return Array.from({ length: 7 }, (_, i) => isoDate(addDays(start, i)));
    }

    const monthStart = new Date(base.getFullYear(), base.getMonth(), 1);
    const monthEnd = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    const days = monthEnd.getDate();
    return Array.from({ length: days }, (_, i) => isoDate(new Date(monthStart.getFullYear(), monthStart.getMonth(), i + 1)));
  }, [calendarAnchor, calendarView]);

  const weekStart = startWeek(parseDate(projectAnchor));
  const projectDates = Array.from({ length: 7 }, (_, i) => isoDate(addDays(weekStart, i)));

  const projectCompletion = useMemo(() => {
    const slots = projectDates.length * habits.length;
    if (!slots) return 0;

    let checked = 0;
    projectDates.forEach((date) => {
      habits.forEach((habit) => {
        if (habitChecks[date]?.[habit.id]) checked += 1;
      });
    });

    return Math.round((checked / slots) * 100);
  }, [habitChecks, habits, projectDates]);

  const addExpense = () => {
    const amount = Number(expenseDraft.amount.replace(",", "."));
    if (!expenseDraft.description.trim() || Number.isNaN(amount) || amount <= 0) return;

    setExpenses((prev) => [
      {
        id: uid(),
        date: expenseDraft.date,
        description: expenseDraft.description.trim(),
        category: expenseDraft.category,
        amount,
        paymentMethod: expenseDraft.paymentMethod,
        personId: expenseDraft.personId,
      },
      ...prev,
    ]);

    setExpenseDraft((prev) => ({ ...prev, description: "", amount: "" }));
  };

  const addFixedExpense = () => {
    const amount = Number(fixedExpenseDraft.amount.replace(",", "."));
    if (!fixedExpenseDraft.name.trim() || Number.isNaN(amount) || amount <= 0) return;

    setFixedExpenses((prev) => [
      ...prev,
      {
        id: uid(),
        name: fixedExpenseDraft.name.trim(),
        amount,
        category: fixedExpenseDraft.category,
        paymentMethod: fixedExpenseDraft.paymentMethod,
      },
    ]);

    setFixedExpenseDraft((prev) => ({ ...prev, name: "", amount: "" }));
  };

  const removeFixedExpense = (id: string) => {
    setFixedExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  const addBillToPay = () => {
    const amount = Number(billToPayDraft.amount.replace(",", "."));
    if (!billToPayDraft.name.trim() || Number.isNaN(amount) || amount <= 0) return;

    setBillsToPay((prev) => [
      ...prev,
      {
        id: uid(),
        name: billToPayDraft.name.trim(),
        amount,
        dueDate: billToPayDraft.noDate ? "" : billToPayDraft.dueDate,
        paid: false,
        noDate: billToPayDraft.noDate,
      },
    ]);

    setBillToPayDraft((prev) => ({ ...prev, name: "", amount: "", noDate: false }));
  };

  const toggleBillPaid = (id: string) => {
    setBillsToPay((prev) =>
      prev.map((bill) => (bill.id === id ? { ...bill, paid: !bill.paid } : bill))
    );
  };

  const removeBillToPay = (id: string) => {
    setBillsToPay((prev) => prev.filter((item) => item.id !== id));
  };

  const addIncomeSource = () => {
    if (!incomeSourceDraft.name.trim()) return;

    if (incomeSourceDraft.editingId) {
      setIncomeSources((prev) =>
        prev.map((source) =>
          source.id === incomeSourceDraft.editingId ? { ...source, name: incomeSourceDraft.name.trim() } : source
        )
      );
      setIncomeSourceDraft({ name: "", editingId: "" });
      return;
    }

    const newSource = { id: uid(), name: incomeSourceDraft.name.trim() };
    setIncomeSources((prev) => [...prev, newSource]);
    setIncomeDraft((prev) => ({ ...prev, sourceId: newSource.id }));
    setIncomeSourceDraft({ name: "", editingId: "" });
  };

  const startEditIncomeSource = (source: IncomeSource) => {
    setIncomeSourceDraft({ name: source.name, editingId: source.id });
  };

  const addIncome = () => {
    const amount = Number(incomeDraft.amount.replace(",", "."));
    if (Number.isNaN(amount) || amount <= 0 || !incomeDraft.sourceId) return;

    setIncomes((prev) => [
      { id: uid(), date: incomeDraft.date, amount, sourceId: incomeDraft.sourceId },
      ...prev,
    ]);

    setIncomeDraft((prev) => ({ ...prev, amount: "" }));
  };

  const addPerson = () => {
    if (!personDraft.name.trim()) return;
    const person: Person = { id: uid(), name: personDraft.name.trim(), relation: personDraft.relation };
    setPeople((prev) => [...prev, person]);
    setPersonDraft({ name: "", relation: "dependente" });
  };

  const addWeight = () => {
    const value = Number(weightDraft.weight.replace(",", "."));
    if (Number.isNaN(value) || value <= 0) return;
    setWeights((prev) => [...prev, { id: uid(), date: weightDraft.date, weight: value }]);
    setWeightDraft((prev) => ({ ...prev, weight: "" }));
  };

  const addStrength = () => {
    const value = Number(strengthDraft.weight.replace(",", "."));
    const reps = Number(strengthDraft.reps);
    const draftExercise = strengthDraft.exercise.trim();
    if (!draftExercise || Number.isNaN(value) || value <= 0) return;

    const normalizedExercise = normalize(draftExercise);

    setStrengths((prev) => {
      const existingExercise = prev
        .map((entry) => normalizeStrengthEntry(entry))
        .find((entry) => normalize(entry.exercise) === normalizedExercise);

      return [
        {
          id: uid(),
          date: strengthDraft.date,
          exercise: existingExercise?.exercise ?? draftExercise,
          muscleGroup: existingExercise?.muscleGroup ?? strengthDraft.muscleGroup,
          effortLevel: strengthDraft.effortLevel,
          weight: value,
          reps: Number.isNaN(reps) || reps <= 0 ? 8 : Math.round(reps),
        },
        ...prev,
      ];
    });

    setStrengthDraft((prev) => ({ ...prev, exercise: "", weight: "", reps: "8", effortLevel: "Moderado" }));
  };

  const removeStrength = (id: string) => {
    setStrengths((prev) => prev.filter((entry) => entry.id !== id));
  };

  const addWorkout = () => {
    if (!workoutDraft.title.trim()) return;
    setWorkouts((prev) => [
      {
        id: uid(),
        date: workoutDraft.date,
        title: workoutDraft.title.trim(),
        emoji: workoutDraft.emoji,
        rating: Number(workoutDraft.rating) as WorkoutEntry["rating"],
        notes: workoutDraft.notes.trim(),
      },
      ...prev,
    ]);

    setWorkoutDraft((prev) => ({ ...prev, title: "", notes: "", rating: "3" }));
  };

  const createAiPlan = () => {
    const weight = Number(aiDraft.weight.replace(",", "."));
    const height = Number(aiDraft.height.replace(",", "."));
    const age = Number(aiDraft.age.replace(",", "."));
    if (Number.isNaN(weight) || Number.isNaN(height) || Number.isNaN(age)) return;
    if (weight < 30 || height < 120 || age < 12 || age > 100) return;
    setAiPlan(buildPersonalPlan(weight, height, age, aiDraft.goal));
  };

  const calculateMeal = () => {
    if (!mealDraft.description.trim()) return;
    setMealEstimate(estimateNutrition(mealDraft.description));
  };

  const saveMeal = () => {
    if (!mealEstimate || !mealDraft.description.trim()) return;
    setMeals((prev) => [
      {
        id: uid(),
        date: mealDraft.date,
        description: mealDraft.description.trim(),
        ...mealEstimate,
      },
      ...prev,
    ]);
    setMealDraft((prev) => ({ ...prev, description: "" }));
    setMealEstimate(null);
  };

  const removeMeal = (id: string) => {
    setMeals((prev) => prev.filter((meal) => meal.id !== id));
  };

  const addFolder = () => {
    if (!folderDraft.name.trim()) return;

    const folder: IdeaFolder = {
      id: uid(),
      name: folderDraft.name.trim(),
      purpose: "",
    };

    setFolders((prev) => [...prev, folder]);
    setSelectedFolder(folder.id);
    setFolderDraft({ name: "" });
    setIsCreatingFolder(false);
  };

  const createNoteBlock = () => {
    const folderId = selectedFolder || folders[0]?.id;
    if (!folderId) return;

    const note: IdeaNote = {
      id: uid(),
      folderId,
      emoji: "💡",
      title: "",
      coverUrl: "",
      content: "",
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => [note, ...prev]);
  };

  const updateNote = (id: string, patch: Partial<IdeaNote>) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note
      )
    );
  };

  const removeNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const addTodo = () => {
    if (!todoDraft.title.trim()) return;
    const todo: TodoItem = {
      id: uid(),
      title: todoDraft.title.trim(),
      date: todoDraft.date,
      time: todoDraft.time,
      urgency: Number(todoDraft.urgency) as Urgency,
      repeat: todoDraft.repeat,
      notes: todoDraft.notes.trim(),
      done: false,
    };
    setTodos((prev) => [...prev, todo]);
    setTodoDraft((prev) => ({ ...prev, title: "", time: "", notes: "", urgency: "1", repeat: "nenhuma" }));
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)));
  };

  const askNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const addHabit = () => {
    if (!habitDraft.trim()) return;
    setHabits((prev) => [...prev, { id: uid(), name: habitDraft.trim() }]);
    setHabitDraft("");
  };

  const toggleHabit = (date: string, habitId: string) => {
    setHabitChecks((prev) => {
      const daily = prev[date] ?? {};
      return {
        ...prev,
        [date]: {
          ...daily,
          [habitId]: !daily[habitId],
        },
      };
    });
  };

  const renderFinance = () => {
    const financeTotal = totalIncome + totalExpenses;
    const incomePercent = financeTotal > 0 ? (totalIncome / financeTotal) * 100 : 0;
    const expensePercent = financeTotal > 0 ? (totalExpenses / financeTotal) * 100 : 0;

    return (
      <>
        <div className="sticky top-0 z-20 mb-5 rounded-2xl border border-white/10 bg-[#070d18]/95 p-4 backdrop-blur-lg">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                {financeTotal > 0 && (
                  <>
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#6ee7b7" strokeWidth="3"
                      strokeDasharray={`${incomePercent} ${100 - incomePercent}`}
                      strokeDashoffset="0"
                      className="transition-all duration-500"
                    />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f87171" strokeWidth="3"
                      strokeDasharray={`${expensePercent} ${100 - expensePercent}`}
                      strokeDashoffset={`${-incomePercent}`}
                      className="transition-all duration-500"
                    />
                  </>
                )}
              </svg>
              {financeTotal > 0 && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-slate-300">
                  {Math.round(incomePercent)}%
                </span>
              )}
            </div>
            <div className="grid flex-1 grid-cols-3 gap-3">
              <div>
                <p
                  className="text-[11px] uppercase tracking-[0.12em] text-slate-400"
                  style={{
                    fontSize: "10px"
                  }}>Entradas</p>
                <p
                  className="text-lg font-semibold text-emerald-200"
                  style={{
                    fontSize: "10px"
                  }}>{formatMoney.format(totalIncome)}</p>
              </div>
              <div>
                <p
                  className="text-[11px] uppercase tracking-[0.12em] text-slate-400"
                  style={{
                    fontSize: "10px"
                  }}>Gastos</p>
                <p
                  className="text-lg font-semibold text-rose-300"
                  style={{
                    fontSize: "10px"
                  }}>{formatMoney.format(totalExpenses)}</p>
              </div>
              <div>
                <p
                  className="text-[11px] uppercase tracking-[0.12em] text-slate-400"
                  style={{
                    fontSize: "10px"
                  }}>Saldo</p>
                <p
                  className={`text-lg font-semibold ${netBalance >= 0 ? "text-emerald-200" : "text-rose-200"}`}
                  style={{
                    fontSize: "10px"
                  }}>
                  {formatMoney.format(netBalance)}
                </p>
              </div>
            </div>
            <div className="hidden flex-shrink-0 items-center gap-3 text-[10px] text-slate-500 lg:flex">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-300" /> Entradas</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-rose-400" /> Gastos</span>
            </div>
          </div>
        </div>

        <CollapsibleCard title="Gráficos de resumo" icon={<PieChart className="h-5 w-5 text-cyan-200" />} alwaysOpenLg>
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Category bar chart */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="mb-3 text-xs uppercase tracking-[0.12em] text-slate-400">Gastos por categoria</p>
              {combinedExpensesByCategory.length > 0 ? (
                <div className="space-y-2.5">
                  {combinedExpensesByCategory.map(([category, value]) => {
                    const maxVal = combinedExpensesByCategory[0]?.[1] ?? 1;
                    const pct = Math.max((value / maxVal) * 100, 2);
                    return (
                      <div key={category}>
                        <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                          <span>{category}</span>
                          <span className="text-cyan-200">{formatMoney.format(value)}</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-200 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Sem dados ainda.</p>
              )}
            </div>

            {/* Payment method bar chart */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="mb-3 text-xs uppercase tracking-[0.12em] text-slate-400">Forma de pagamento</p>
              {combinedExpensesByPayment.length > 0 ? (
                <div className="space-y-2.5">
                  {combinedExpensesByPayment.map(([method, value]) => {
                    const maxVal = combinedExpensesByPayment[0]?.[1] ?? 1;
                    const pct = Math.max((value / maxVal) * 100, 2);
                    return (
                      <div key={method}>
                        <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                          <span>{method}</span>
                          <span className="text-emerald-200">{formatMoney.format(value)}</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-200 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Sem dados ainda.</p>
              )}
            </div>

            {/* Monthly evolution line chart */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="mb-3 text-xs uppercase tracking-[0.12em] text-slate-400">Evolução mensal</p>
              {monthlyFinance.some((m) => m.income > 0 || m.expenses > 0) ? (
                <>
                  <div className="h-32">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                      {(() => {
                        const maxVal = Math.max(
                          ...monthlyFinance.map((m) => Math.max(m.income, m.expenses)),
                          1
                        );
                        const incomePoints = monthlyFinance
                          .map((m, i) => {
                            const x = monthlyFinance.length === 1 ? 50 : (i / (monthlyFinance.length - 1)) * 90 + 5;
                            const y = 95 - (m.income / maxVal) * 85;
                            return `${x},${y}`;
                          })
                          .join(" ");
                        const expensePoints = monthlyFinance
                          .map((m, i) => {
                            const x = monthlyFinance.length === 1 ? 50 : (i / (monthlyFinance.length - 1)) * 90 + 5;
                            const y = 95 - (m.expenses / maxVal) * 85;
                            return `${x},${y}`;
                          })
                          .join(" ");
                        return (
                          <>
                            {/* Grid lines */}
                            {[25, 50, 75].map((y) => (
                              <line key={y} x1="5" y1={y} x2="95" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                            ))}
                            {/* Income line */}
                            <polyline
                              fill="none"
                              stroke="#6ee7b7"
                              strokeWidth="2"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                              points={incomePoints}
                            />
                            {/* Expense line */}
                            <polyline
                              fill="none"
                              stroke="#f87171"
                              strokeWidth="2"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                              points={expensePoints}
                            />
                            {/* Income dots */}
                            {monthlyFinance.map((m, i) => {
                              const x = monthlyFinance.length === 1 ? 50 : (i / (monthlyFinance.length - 1)) * 90 + 5;
                              const y = 95 - (m.income / maxVal) * 85;
                              return m.income > 0 ? (
                                <circle key={`i-${m.key}`} cx={x} cy={y} r="2" fill="#6ee7b7" />
                              ) : null;
                            })}
                            {/* Expense dots */}
                            {monthlyFinance.map((m, i) => {
                              const x = monthlyFinance.length === 1 ? 50 : (i / (monthlyFinance.length - 1)) * 90 + 5;
                              const y = 95 - (m.expenses / maxVal) * 85;
                              return m.expenses > 0 ? (
                                <circle key={`e-${m.key}`} cx={x} cy={y} r="2" fill="#f87171" />
                              ) : null;
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex gap-3 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-300" /> Entradas</span>
                      <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-rose-400" /> Gastos</span>
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {monthlyFinance.map((m) => (
                      <span key={m.key} className="min-w-0 flex-1 truncate text-center text-[9px] text-slate-500">
                        {m.label}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">Sem dados ainda.</p>
              )}
            </div>
          </div>
        </CollapsibleCard>

        <div className="grid items-start gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <CollapsibleCard title="Acompanhamento de gastos" icon={<PiggyBank className="h-5 w-5 text-cyan-200" />}>
          {showExpenseForm ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Novo gasto</p>
                <button className="text-xs text-slate-500 hover:text-slate-300 transition" onClick={() => setShowExpenseForm(false)}>Cancelar</button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-sm text-slate-300">
                  O que foi?
                  <input
                    className={inputClass}
                    value={expenseDraft.description}
                    onChange={(e) => setExpenseDraft((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Ex: Mercado da semana"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-300">
                  Valor (R$)
                  <input
                    className={inputClass}
                    value={expenseDraft.amount}
                    onChange={(e) => setExpenseDraft((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="0,00"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-300">
                  Data
                  <input
                    type="date"
                    className={inputClass}
                    value={expenseDraft.date}
                    onChange={(e) => setExpenseDraft((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-300">
                  Categoria
                  <select
                    className={inputClass}
                    value={expenseDraft.category}
                    onChange={(e) => setExpenseDraft((prev) => ({ ...prev, category: e.target.value }))}
                  >
                    {["Alimentação", "Moradia", "Transporte", "Lazer", "Saúde", "Educação", "Outros"].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm text-slate-300">
                  Forma de pagamento
                  <select
                    className={inputClass}
                    value={expenseDraft.paymentMethod}
                    onChange={(e) => setExpenseDraft((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                  >
                    {["PIX", "Cartão de crédito", "Cartão de débito", "Dinheiro", "Boleto"].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm text-slate-300">
                  De quem foi?
                  <select
                    className={inputClass}
                    value={expenseDraft.personId}
                    onChange={(e) => setExpenseDraft((prev) => ({ ...prev, personId: e.target.value }))}
                  >
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name} · {person.relation}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button className={softBtn} onClick={() => { addExpense(); setShowExpenseForm(false); }}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar gasto
              </button>
            </div>
          ) : (
            <button className={softBtn} onClick={() => setShowExpenseForm(true)}>
              <Plus className="mr-2 h-4 w-4" /> Novo gasto
            </button>
          )}

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-slate-300">Resumo filtrado</span>
              <select
                className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-xs text-slate-100"
                value={personFilter}
                onChange={(e) => setPersonFilter(e.target.value)}
              >
                <option value="all">Todos</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Por categoria</p>
                <div className="space-y-2">
                  {expensesByCategory.slice(0, 5).map(([category, value]) => (
                    <div key={category} className="flex items-center justify-between text-sm text-slate-200">
                      <span>{category}</span>
                      <span>{formatMoney.format(value)}</span>
                    </div>
                  ))}
                  {expensesByCategory.length === 0 && <p className="text-sm text-slate-500">Sem dados ainda.</p>}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Pagamento</p>
                <div className="space-y-2">
                  {expensesByPayment.slice(0, 5).map(([method, value]) => (
                    <div key={method} className="flex items-center justify-between text-sm text-slate-200">
                      <span>{method}</span>
                      <span>{formatMoney.format(value)}</span>
                    </div>
                  ))}
                  {expensesByPayment.length === 0 && <p className="text-sm text-slate-500">Sem dados ainda.</p>}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleCard>

        <div className="space-y-5">
          <CollapsibleCard title="Entrada de dinheiro">
            {showIncomeForm ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Nova entrada</p>
                  <button className="text-xs text-slate-500 hover:text-slate-300 transition" onClick={() => setShowIncomeForm(false)}>Cancelar</button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-300">
                    Valor recebido
                    <input
                      className={inputClass}
                      value={incomeDraft.amount}
                      onChange={(e) => setIncomeDraft((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder="0,00"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-300">
                    Data
                    <input
                      type="date"
                      className={inputClass}
                      value={incomeDraft.date}
                      onChange={(e) => setIncomeDraft((prev) => ({ ...prev, date: e.target.value }))}
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-300 md:col-span-2">
                    Origem
                    <select
                      className={inputClass}
                      value={incomeDraft.sourceId}
                      onChange={(e) => setIncomeDraft((prev) => ({ ...prev, sourceId: e.target.value }))}
                    >
                      {incomeSources.map((source) => (
                        <option key={source.id} value={source.id}>
                          {source.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button className={softBtn} onClick={() => { addIncome(); setShowIncomeForm(false); }}>
                  <Plus className="mr-2 h-4 w-4" /> Registrar entrada
                </button>
              </div>
            ) : (
              <button className={softBtn} onClick={() => setShowIncomeForm(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nova entrada
              </button>
            )}

            {showIncomeSources ? (
              <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Fontes de renda</p>
                  <button className="text-xs text-slate-500 hover:text-slate-300 transition" onClick={() => setShowIncomeSources(false)}>Fechar</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {incomeSources.map((source) => (
                    <button
                      key={source.id}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200"
                      onClick={() => startEditIncomeSource(source)}
                    >
                      {source.name}
                    </button>
                  ))}
                </div>
                <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                  <input
                    className={inputClass}
                    value={incomeSourceDraft.name}
                    onChange={(e) => setIncomeSourceDraft((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Nova fonte de renda"
                  />
                  <button className={softBtn} onClick={addIncomeSource}>
                    {incomeSourceDraft.editingId ? "Salvar edição" : "Adicionar fonte"}
                  </button>
                </div>
              </div>
            ) : (
              <button className={softBtn} onClick={() => setShowIncomeSources(true)}>
                <Plus className="mr-2 h-4 w-4" /> Fontes de renda
              </button>
            )}

            <div className="space-y-2">
              {sortedIncomes.slice(0, 8).map((income) => {
                const sourceName = incomeSources.find((source) => source.id === income.sourceId)?.name ?? "Origem";
                return (
                  <article key={income.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between text-slate-100">
                      <span>{sourceName}</span>
                      <strong className="text-emerald-200">{formatMoney.format(income.amount)}</strong>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">{shortDate(income.date)}</div>
                  </article>
                );
              })}
              {!sortedIncomes.length && (
                <p className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
                  Registre sua primeira entrada para acompanhar receitas separadas dos gastos.
                </p>
              )}
            </div>
          </CollapsibleCard>

          <CollapsibleCard title="Cônjuge e dependentes">
            {showPersonForm ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Nova pessoa</p>
                  <button className="text-xs text-slate-500 hover:text-slate-300 transition" onClick={() => setShowPersonForm(false)}>Cancelar</button>
                </div>
                <div className="grid gap-3">
                  <input
                    className={inputClass}
                    value={personDraft.name}
                    onChange={(e) => setPersonDraft((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome"
                  />
                  <select
                    className={inputClass}
                    value={personDraft.relation}
                    onChange={(e) => setPersonDraft((prev) => ({ ...prev, relation: e.target.value as Relation }))}
                  >
                    <option value="cônjuge">Cônjuge</option>
                    <option value="dependente">Dependente</option>
                    <option value="você">Você</option>
                  </select>
                  <button className={softBtn} onClick={() => { addPerson(); setShowPersonForm(false); }}>
                    <Plus className="mr-2 h-4 w-4" /> Adicionar pessoa
                  </button>
                </div>
              </div>
            ) : (
              <button className={softBtn} onClick={() => setShowPersonForm(true)}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar pessoa
              </button>
            )}

            <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-4">
              {people.map((person) => (
                <div key={person.id} className="flex items-center justify-between text-sm text-slate-200">
                  <span>{person.name}</span>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-slate-300">{person.relation}</span>
                </div>
              ))}
            </div>
          </CollapsibleCard>

          <CollapsibleCard title="Últimos gastos">
            <div className="space-y-2">
              {filteredExpenses.slice(0, 8).map((expense) => {
                const person = people.find((item) => item.id === expense.personId);
                return (
                  <article key={expense.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between text-slate-100">
                      <span>{expense.description}</span>
                      <strong className="text-cyan-200">{formatMoney.format(expense.amount)}</strong>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                      <span>
                        {expense.category} · {expense.paymentMethod}
                      </span>
                      <span>
                        {shortDate(expense.date)} · {person?.name ?? "Pessoa"}
                      </span>
                    </div>
                  </article>
                );
              })}
              {!filteredExpenses.length && (
                <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
                  Adicione seu primeiro gasto para começar o resumo.
                </p>
              )}
            </div>
          </CollapsibleCard>

          <CollapsibleCard title="Todos os gastos" icon={<Receipt className="h-5 w-5 text-cyan-200" />} alwaysOpenLg>
            <div className="space-y-4">
              {/* Filters */}
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="space-y-1 text-sm text-slate-300">
                    Categoria
                    <select
                      className={inputClass}
                      value={allExpensesCategoryFilter}
                      onChange={(e) => setAllExpensesCategoryFilter(e.target.value)}
                    >
                      <option value="all">Todas as categorias</option>
                      {["Alimentação", "Moradia", "Transporte", "Lazer", "Saúde", "Educação", "Outros"].map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-slate-300">
                    Data inicial
                    <input
                      type="date"
                      className={inputClass}
                      value={allExpensesDateFrom}
                      onChange={(e) => setAllExpensesDateFrom(e.target.value)}
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-300">
                    Data final
                    <input
                      type="date"
                      className={inputClass}
                      value={allExpensesDateTo}
                      onChange={(e) => setAllExpensesDateTo(e.target.value)}
                    />
                  </label>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {allExpensesFiltered.length} gasto{allExpensesFiltered.length !== 1 ? "s" : ""} encontrado{allExpensesFiltered.length !== 1 ? "s" : ""}
                  </span>
                  {(allExpensesCategoryFilter !== "all" || allExpensesDateFrom || allExpensesDateTo) && (
                    <button
                      className="text-xs text-cyan-300 hover:text-cyan-200 transition"
                      onClick={() => {
                        setAllExpensesCategoryFilter("all");
                        setAllExpensesDateFrom("");
                        setAllExpensesDateTo("");
                      }}
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              </div>

              {/* Total */}
              {allExpensesFiltered.length > 0 && (
                <div className="flex items-center justify-between rounded-2xl border border-cyan-300/20 bg-cyan-300/5 px-4 py-3">
                  <span className="text-sm text-slate-300">Total filtrado</span>
                  <strong className="text-cyan-200">{formatMoney.format(allExpensesTotal)}</strong>
                </div>
              )}

              {/* Expense list */}
              <div className="space-y-2">
                {allExpensesFiltered.map((expense) => {
                  const person = people.find((item) => item.id === expense.personId);
                  return (
                    <article key={expense.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                      <div className="flex items-center justify-between text-slate-100">
                        <span>{expense.description}</span>
                        <strong className="text-cyan-200">{formatMoney.format(expense.amount)}</strong>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                        <span>
                          {expense.category} · {expense.paymentMethod}
                        </span>
                        <span>
                          {shortDate(expense.date)} · {person?.name ?? "Pessoa"}
                        </span>
                      </div>
                    </article>
                  );
                })}
                {allExpensesFiltered.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
                    Nenhum gasto encontrado com os filtros selecionados.
                  </p>
                )}
              </div>
            </div>
          </CollapsibleCard>

          <CollapsibleCard title="Fixos mensais" icon={<Landmark className="h-5 w-5 text-cyan-200" />}>
            {showFixedExpenseForm ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Novo gasto fixo</p>
                  <button className="text-xs text-slate-500 hover:text-slate-300 transition" onClick={() => setShowFixedExpenseForm(false)}>Cancelar</button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-300">
                    Nome do gasto
                    <input
                      className={inputClass}
                      value={fixedExpenseDraft.name}
                      onChange={(e) => setFixedExpenseDraft((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Aluguel"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-300">
                    Valor (R$)
                    <input
                      className={inputClass}
                      value={fixedExpenseDraft.amount}
                      onChange={(e) => setFixedExpenseDraft((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder="0,00"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-300">
                    Categoria
                    <select
                      className={inputClass}
                      value={fixedExpenseDraft.category}
                      onChange={(e) => setFixedExpenseDraft((prev) => ({ ...prev, category: e.target.value }))}
                    >
                      {["Alimentação", "Moradia", "Transporte", "Lazer", "Saúde", "Educação", "Outros"].map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-slate-300">
                    Forma de pagamento
                    <select
                      className={inputClass}
                      value={fixedExpenseDraft.paymentMethod}
                      onChange={(e) => setFixedExpenseDraft((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                    >
                      {["PIX", "Cartão de crédito", "Cartão de débito", "Dinheiro", "Boleto"].map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <button className={softBtn} onClick={() => { addFixedExpense(); setShowFixedExpenseForm(false); }}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar gasto fixo
                </button>
              </div>
            ) : (
              <button className={softBtn} onClick={() => setShowFixedExpenseForm(true)}>
                <Plus className="mr-2 h-4 w-4" /> Novo gasto fixo
              </button>
            )}

            {fixedExpenses.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Total fixos mensais</span>
                  <strong className="text-cyan-200">{formatMoney.format(totalFixedExpenses)}</strong>
                </div>
                {fixedExpenses.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between text-slate-100">
                      <span>{item.name}</span>
                      <div className="flex items-center gap-2">
                        <strong className="text-cyan-200">{formatMoney.format(item.amount)}</strong>
                        <button
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-rose-300 transition"
                          onClick={() => removeFixedExpense(item.id)}
                          aria-label="Remover gasto fixo"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {item.category} · {item.paymentMethod}
                    </div>
                  </article>
                ))}
              </div>
            )}
            {fixedExpenses.length === 0 && (
              <p className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
                Adicione gastos fixos recorrentes como aluguel, internet, academia etc.
              </p>
            )}
          </CollapsibleCard>

          <CollapsibleCard title="Contas a pagar" icon={<Receipt className="h-5 w-5 text-cyan-200" />}>
            {showBillToPayForm ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Nova conta</p>
                  <button className="text-xs text-slate-500 hover:text-slate-300 transition" onClick={() => setShowBillToPayForm(false)}>Cancelar</button>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="space-y-1 text-sm text-slate-300">
                    Nome da conta
                    <input
                      className={inputClass}
                      value={billToPayDraft.name}
                      onChange={(e) => setBillToPayDraft((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Conta de luz"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-300">
                    Valor (R$)
                    <input
                      className={inputClass}
                      value={billToPayDraft.amount}
                      onChange={(e) => setBillToPayDraft((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder="0,00"
                    />
                  </label>
                  {!billToPayDraft.noDate && (
                    <label className="space-y-1 text-sm text-slate-300">
                      Data de vencimento
                      <input
                        type="date"
                        className={inputClass}
                        value={billToPayDraft.dueDate}
                        onChange={(e) => setBillToPayDraft((prev) => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </label>
                  )}
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/20 bg-white/5 accent-cyan-400"
                    checked={billToPayDraft.noDate}
                    onChange={(e) => setBillToPayDraft((prev) => ({ ...prev, noDate: e.target.checked }))}
                  />
                  Sem data
                </label>
                <button className={softBtn} onClick={() => { addBillToPay(); setShowBillToPayForm(false); }}>
                  <Plus className="mr-2 h-4 w-4" /> Registrar conta
                </button>
              </div>
            ) : (
              <button className={softBtn} onClick={() => setShowBillToPayForm(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nova conta
              </button>
            )}

            {billsToPay.length > 0 && (
              <div className="space-y-2">
                {[...billsToPay].sort((a, b) => {
                  if (a.noDate && b.noDate) return 0;
                  if (a.noDate) return 1;
                  if (b.noDate) return -1;
                  return a.dueDate.localeCompare(b.dueDate);
                }).map((bill) => (
                  <article
                    key={bill.id}
                    className={`rounded-2xl border bg-black/20 px-4 py-3 text-sm transition ${
                      bill.paid ? "border-emerald-400/20 opacity-60" : "border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between text-slate-100">
                      <span className={bill.paid ? "line-through text-slate-400" : ""}>{bill.name}</span>
                      <div className="flex items-center gap-2">
                        <strong className={bill.paid ? "text-emerald-300/60" : "text-cyan-200"}>
                          {formatMoney.format(bill.amount)}
                        </strong>
                        <button
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full border transition ${
                            bill.paid
                              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                              : "border-white/10 bg-white/5 text-slate-400 hover:text-emerald-300"
                          }`}
                          onClick={() => toggleBillPaid(bill.id)}
                          aria-label={bill.paid ? "Desmarcar como paga" : "Marcar como paga"}
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-rose-300 transition"
                          onClick={() => removeBillToPay(bill.id)}
                          aria-label="Remover conta"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                      <span>{bill.noDate ? "Sem data" : `Vence: ${shortDate(bill.dueDate)}`}</span>
                      {bill.paid && <span className="text-emerald-300 text-[11px]">Pago</span>}
                    </div>
                  </article>
                ))}
              </div>
            )}
            {billsToPay.length === 0 && (
              <p className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
                Registre contas pontuais a pagar e acompanhe os vencimentos.
              </p>
            )}
          </CollapsibleCard>
        </div>
      </div>
      </>
    );
  };

  const renderHealth = () => {
    const chartData = sortedWeights;
    const min = chartData.length ? Math.min(...chartData.map((item) => item.weight)) : 0;
    const max = chartData.length ? Math.max(...chartData.map((item) => item.weight)) : 1;

    const ratingMap: Record<WorkoutEntry["rating"], string> = {
      1: "Preguiçoso",
      2: "Leve",
      3: "Moderado",
      4: "Bom",
      5: "Forte",
    };

    return (
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <CollapsibleCard title="Peso e evolução" icon={<Dumbbell className="h-5 w-5 text-cyan-200" />}>
          {showWeightForm ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Novo peso</p>
                <button className="text-xs text-slate-500 hover:text-slate-300 transition" onClick={() => setShowWeightForm(false)}>Cancelar</button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm text-slate-300">
                  Data
                  <input
                    type="date"
                    className={inputClass}
                    value={weightDraft.date}
                    onChange={(e) => setWeightDraft((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </label>
                <label className="text-sm text-slate-300">
                  Peso (kg)
                  <input
                    className={inputClass}
                    value={weightDraft.weight}
                    onChange={(e) => setWeightDraft((prev) => ({ ...prev, weight: e.target.value }))}
                    placeholder="Ex: 82,4"
                  />
                </label>
              </div>
              <button className={softBtn} onClick={() => { addWeight(); setShowWeightForm(false); }}>
                <Plus className="mr-2 h-4 w-4" /> Registrar peso
              </button>
            </div>
          ) : (
            <button className={softBtn} onClick={() => setShowWeightForm(true)}>
              <Plus className="mr-2 h-4 w-4" /> Novo peso
            </button>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Atual</p>
              <p className="text-xl font-semibold text-cyan-200">{sortedWeights.at(-1)?.weight?.toFixed(1) ?? "--"} kg</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Variação</p>
              <p className="text-xl font-semibold text-cyan-200">
                {weightDelta >= 0 ? "+" : ""}
                {weightDelta.toFixed(1)} kg
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Registros</p>
              <p className="text-xl font-semibold text-cyan-200">{sortedWeights.length}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="mb-3 text-sm text-slate-300">Evolução recente</p>
            <div className="h-28">
              {chartData.length > 0 ? (
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                  <polyline
                    fill="none"
                    stroke="rgba(103,232,249,0.95)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={chartData
                      .map((entry, index) => {
                        const x = chartData.length === 1 ? 50 : (index / (chartData.length - 1)) * 100;
                        const ratio = max === min ? 0.5 : (entry.weight - min) / (max - min);
                        const y = 94 - ratio * 86;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />
                  {chartData.map((entry, index) => {
                    const x = chartData.length === 1 ? 50 : (index / (chartData.length - 1)) * 100;
                    const ratio = max === min ? 0.5 : (entry.weight - min) / (max - min);
                    const y = 94 - ratio * 86;
                    return <circle key={entry.id} cx={x} cy={y} r="2.2" fill="rgba(207,250,254,1)" />;
                  })}
                </svg>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {chartData.map((entry) => (
                <span key={`label-${entry.id}`} className="min-w-0 flex-1 truncate text-center text-[10px] text-slate-400">
                  {shortDate(entry.date)}
                </span>
              ))}
            </div>
          </div>
        </CollapsibleCard>

        <CollapsibleCard title="Força na academia">
          {/* Add exercise button - always visible */}
          {showStrengthForm ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Novo exercício</p>
                <button className="text-xs text-slate-500 hover:text-slate-300 transition" onClick={() => setShowStrengthForm(false)}>Fechar</button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className={inputClass}
                  value={strengthDraft.exercise}
                  onChange={(e) => setStrengthDraft((prev) => ({ ...prev, exercise: e.target.value }))}
                  placeholder="Ex: Supino reto"
                />
                <input
                  className={inputClass}
                  value={strengthDraft.weight}
                  onChange={(e) => setStrengthDraft((prev) => ({ ...prev, weight: e.target.value }))}
                  placeholder="Carga (kg)"
                />
                <select
                  className={inputClass}
                  value={strengthDraft.muscleGroup}
                  onChange={(e) =>
                    setStrengthDraft((prev) => ({ ...prev, muscleGroup: e.target.value as StrengthMuscleGroup }))
                  }
                >
                  {strengthMuscleGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
                <select
                  className={inputClass}
                  value={strengthDraft.effortLevel}
                  onChange={(e) =>
                    setStrengthDraft((prev) => ({ ...prev, effortLevel: e.target.value as StrengthEffortLevel }))
                  }
                >
                  {strengthEffortLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  className={inputClass}
                  value={strengthDraft.reps}
                  onChange={(e) => setStrengthDraft((prev) => ({ ...prev, reps: e.target.value }))}
                  placeholder="Repetições"
                />
                <input
                  type="date"
                  className={inputClass}
                  value={strengthDraft.date}
                  onChange={(e) => setStrengthDraft((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <button className={softBtn} onClick={addStrength}>
                <Plus className="mr-2 h-4 w-4" /> Salvar exercício
              </button>
            </div>
          ) : (
            <button className={softBtn} onClick={() => setShowStrengthForm(true)}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar exercício
            </button>
          )}

          {/* Muscle group filter - hidden by default */}
          {showMuscleGroups ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Grupo muscular</p>
                <button className="text-xs text-slate-500 hover:text-slate-300 transition" onClick={() => setShowMuscleGroups(false)}>Fechar</button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    strengthGroupFilter === "todos"
                      ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                      : "border-white/10 text-slate-300"
                  }`}
                  onClick={() => setStrengthGroupFilter("todos")}
                >
                  Todos
                </button>
                {strengthMuscleGroups.map((group) => (
                  <button
                    key={group}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      strengthGroupFilter === group
                        ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                        : "border-white/10 text-slate-300"
                    }`}
                    onClick={() => setStrengthGroupFilter(group)}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button className={softBtn} onClick={() => setShowMuscleGroups(true)}>
              <Dumbbell className="mr-2 h-4 w-4" /> Gerenciar grupos
            </button>
          )}

          {/* Registered exercises - single collapsible list */}
          {visibleStrengthExercises.length > 0 && (
            <div>
              <button
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left text-sm text-slate-300 transition hover:border-white/20"
                onClick={() => {
                  setShowExerciseList((prev) => !prev);
                  if (showExerciseList) setSelectedStrengthExerciseKey("");
                }}
              >
                <span>Exercícios registrados ({visibleStrengthExercises.length})</span>
                {showExerciseList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showExerciseList && (
                <div className="mt-2 space-y-2">
                  {visibleStrengthExercises.map((exercise) => (
                    <div key={exercise.key}>
                      <button
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          selectedStrengthExerciseKey === exercise.key
                            ? "border-cyan-300/40 bg-cyan-300/10"
                            : "border-white/10 bg-black/20"
                        }`}
                        onClick={() =>
                          setSelectedStrengthExerciseKey((current) =>
                            current === exercise.key ? "" : exercise.key
                          )
                        }
                      >
                        <div className="flex items-center justify-between text-slate-100">
                          <span>{exercise.name}</span>
                          <strong className="text-cyan-200">{exercise.latestWeight} kg</strong>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {exercise.muscleGroup} · {exercise.entries.length} registro(s) · {longDate(exercise.latestDate)}
                        </p>
                      </button>

                      {/* Evolution chart - only when exercise is selected AND has multiple entries */}
                      {selectedStrengthExerciseKey === exercise.key && exercise.entries.length > 1 && (
                        <div className="mt-2 rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="mb-3 text-sm text-slate-300">Evolução de carga · {exercise.name}</p>
                          <div className="h-32">
                            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                              <polyline
                                fill="none"
                                stroke="rgba(103,232,249,0.95)"
                                strokeWidth="2"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                points={exercise.entries
                                  .map((entry, index, list) => {
                                    const x = list.length === 1 ? 50 : (index / (list.length - 1)) * 100;
                                    const min = Math.min(...list.map((item) => item.weight));
                                    const max = Math.max(...list.map((item) => item.weight));
                                    const ratio = max === min ? 0.5 : (entry.weight - min) / (max - min);
                                    const y = 94 - ratio * 86;
                                    return `${x},${y}`;
                                  })
                                  .join(" ")}
                              />
                              {exercise.entries.map((entry, index, list) => {
                                const x = list.length === 1 ? 50 : (index / (list.length - 1)) * 100;
                                const min = Math.min(...list.map((item) => item.weight));
                                const max = Math.max(...list.map((item) => item.weight));
                                const ratio = max === min ? 0.5 : (entry.weight - min) / (max - min);
                                const y = 94 - ratio * 86;
                                return <circle key={entry.id} cx={x} cy={y} r="2.2" fill="rgba(207,250,254,1)" />;
                              })}
                            </svg>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {exercise.entries.map((entry) => (
                              <span key={`strength-label-${entry.id}`} className="min-w-0 flex-1 truncate text-center text-[10px] text-slate-400">
                                {shortDate(entry.date)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!visibleStrengthExercises.length && (
            <p className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
              Registre seus exercícios para acompanhar evolução de força.
            </p>
          )}
        </CollapsibleCard>

        <CollapsibleCard title="Diário de treino">
          {showWorkoutForm ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Novo treino</p>
                <button className="text-xs text-slate-500 hover:text-slate-300 transition" onClick={() => setShowWorkoutForm(false)}>Cancelar</button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="date"
                  className={inputClass}
                  value={workoutDraft.date}
                  onChange={(e) => setWorkoutDraft((prev) => ({ ...prev, date: e.target.value }))}
                />
                <select
                  className={inputClass}
                  value={workoutDraft.emoji}
                  onChange={(e) => setWorkoutDraft((prev) => ({ ...prev, emoji: e.target.value }))}
                >
                  {["🏋️", "🥋", "🏃", "🧘", "🚴"].map((emoji) => (
                    <option key={emoji}>{emoji}</option>
                  ))}
                </select>
                <input
                  className={inputClass}
                  value={workoutDraft.title}
                  onChange={(e) => setWorkoutDraft((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Título do treino"
                />
                <select
                  className={inputClass}
                  value={workoutDraft.rating}
                  onChange={(e) => setWorkoutDraft((prev) => ({ ...prev, rating: e.target.value }))}
                >
                  <option value="1">1 · Preguiçoso</option>
                  <option value="2">2 · Leve</option>
                  <option value="3">3 · Moderado</option>
                  <option value="4">4 · Bom</option>
                  <option value="5">5 · Forte</option>
                </select>
              </div>
              <textarea
                className={`${inputClass} min-h-[82px]`}
                value={workoutDraft.notes}
                onChange={(e) => setWorkoutDraft((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Como foi seu treino hoje?"
              />
              <button className={softBtn} onClick={() => { addWorkout(); setShowWorkoutForm(false); }}>
                <Plus className="mr-2 h-4 w-4" /> Salvar diário
              </button>
            </div>
          ) : (
            <button className={softBtn} onClick={() => setShowWorkoutForm(true)}>
              <Plus className="mr-2 h-4 w-4" /> Novo treino
            </button>
          )}

          {sortedWorkouts.length > 0 && (
            <div>
              <button
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left text-sm text-slate-300 transition hover:border-white/20"
                onClick={() => setShowWorkoutList((prev) => !prev)}
              >
                <span>Diários registrados ({sortedWorkouts.length})</span>
                {showWorkoutList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showWorkoutList && (
                <div className="mt-2 space-y-2">
                  {sortedWorkouts.slice(0, 6).map((entry) => (
                    <article key={entry.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                      <div className="flex items-center justify-between text-slate-100">
                        <span>
                          {entry.emoji} {entry.title}
                        </span>
                        <strong className="text-cyan-200">{ratingMap[entry.rating]}</strong>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">{longDate(entry.date)}</div>
                      {entry.notes && <p className="mt-2 text-slate-300">{entry.notes}</p>}
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </CollapsibleCard>

        <CollapsibleCard title="IA de treino e dieta" icon={<Sparkles className="h-5 w-5 text-cyan-200" />}>
          {showAiForm ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Plano personalizado</p>
                <button className="text-xs text-slate-500 hover:text-slate-300 transition" onClick={() => setShowAiForm(false)}>Fechar</button>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <input
                  className={inputClass}
                  value={aiDraft.weight}
                  onChange={(e) => setAiDraft((prev) => ({ ...prev, weight: e.target.value }))}
                  placeholder="Peso (kg)"
                />
                <input
                  className={inputClass}
                  value={aiDraft.height}
                  onChange={(e) => setAiDraft((prev) => ({ ...prev, height: e.target.value }))}
                  placeholder="Altura (cm)"
                />
                <input
                  className={inputClass}
                  value={aiDraft.age}
                  onChange={(e) => setAiDraft((prev) => ({ ...prev, age: e.target.value }))}
                  placeholder="Idade"
                />
                <select
                  className={inputClass}
                  value={aiDraft.goal}
                  onChange={(e) => setAiDraft((prev) => ({ ...prev, goal: e.target.value as AiPlan["goal"] }))}
                >
                  <option value="emagrecer">Emagrecer</option>
                  <option value="manter">Manter</option>
                  <option value="ganhar massa">Ganhar massa</option>
                </select>
              </div>
              <button className={softBtn} onClick={createAiPlan}>
                <Sparkles className="mr-2 h-4 w-4" /> Gerar plano personalizado
              </button>
            </div>
          ) : (
            <button className={softBtn} onClick={() => setShowAiForm(true)}>
              <Sparkles className="mr-2 h-4 w-4" /> Gerar plano
            </button>
          )}

          {aiPlan && (
            <div className="space-y-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-4">
              <p className="text-sm text-slate-200">
                Meta diária: <strong className="text-cyan-200">{aiPlan.targetCalories} kcal</strong> · P
                {aiPlan.macros.protein}g / C{aiPlan.macros.carbs}g / G{aiPlan.macros.fat}g
              </p>
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Treino</p>
                <ul className="space-y-1 text-sm text-slate-200">
                  {aiPlan.trainingPlan.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Dieta</p>
                <ul className="space-y-1 text-sm text-slate-200">
                  {aiPlan.dietPlan.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <h4 className="mb-3 text-sm font-semibold text-white">IA de refeição</h4>
            {showMealForm ? (
              <div className="space-y-3">
                <div className="grid gap-3">
                  <input
                    type="date"
                    className={inputClass}
                    value={mealDraft.date}
                    onChange={(e) => setMealDraft((prev) => ({ ...prev, date: e.target.value }))}
                  />
                  <textarea
                    className={`${inputClass} min-h-[82px]`}
                    value={mealDraft.description}
                    onChange={(e) => setMealDraft((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Ex: 150g arroz, 120g frango, 1 banana"
                  />
                  <div className="flex flex-wrap gap-3">
                    <button className={softBtn} onClick={calculateMeal}>
                      <Sparkles className="mr-2 h-4 w-4" /> Calcular ingestão
                    </button>
                    <button className={softBtn} onClick={() => { saveMeal(); setShowMealForm(false); }}>
                      <Plus className="mr-2 h-4 w-4" /> Salvar refeição
                    </button>
                    <button className="text-xs text-slate-500 hover:text-slate-300 transition" onClick={() => setShowMealForm(false)}>Cancelar</button>
                  </div>
                </div>
                {mealEstimate && (
                  <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-3 text-sm text-slate-200">
                    Estimativa: <strong>{mealEstimate.calories} kcal</strong> · P{mealEstimate.protein}g · C
                    {mealEstimate.carbs}g · G{mealEstimate.fat}g
                  </div>
                )}
              </div>
            ) : (
              <button className={softBtn} onClick={() => setShowMealForm(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nova refeição
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-slate-300">Consumo diário</p>
              <input
                type="date"
                className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-xs text-slate-200"
                value={mealFocusDate}
                onChange={(e) => setMealFocusDate(e.target.value)}
              />
            </div>

            <div
              className="relative mx-auto aspect-square h-auto w-full max-w-[176px] rounded-full"
              style={{
                background: `conic-gradient(rgba(34,211,238,0.95) ${Math.min(caloriePct, 100)}%, rgba(148,163,184,0.2) 0)`,
              }}
            >
              <div className="absolute inset-[14px] flex flex-col items-center justify-center rounded-full bg-[#060b16]">
                <span className="text-xs uppercase tracking-[0.12em] text-slate-400">kcal</span>
                <strong className="text-xl text-cyan-200">{caloriesEaten}</strong>
                <span className="text-xs text-slate-400">/ {targetCalories}</span>
              </div>
            </div>

            <p className="mt-4 text-center text-sm text-slate-300">{caloriePct}% da meta diária preenchida.</p>

            <div className="mt-4 space-y-2">
              {meals
                .filter((meal) => meal.date === mealFocusDate)
                .map((meal) => (
                  <article key={meal.id} className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-200">{meal.description}</p>
                        <p className="text-xs text-slate-400">{meal.calories} kcal</p>
                      </div>
                      <button
                        className="inline-flex items-center justify-center rounded-full border border-rose-300/30 bg-rose-400/10 p-2 text-rose-200"
                        onClick={() => removeMeal(meal.id)}
                        aria-label="Remover refeição"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                ))}

              {!meals.some((meal) => meal.date === mealFocusDate) && (
                <p className="text-center text-xs text-slate-500">Nenhuma refeição salva nesta data.</p>
              )}
            </div>
          </div>
        </CollapsibleCard>
      </div>
    );
  };

  const renderIdeas = () => (
    <div className="grid gap-5">
      <CollapsibleCard title="Ideias" icon={<Lightbulb className="h-5 w-5 text-cyan-200" />}>
        <div className="flex flex-wrap gap-2">
          <button className={softBtn} onClick={() => setIsCreatingFolder((prev) => !prev)}>
            <Plus className="mr-2 h-4 w-4" /> Criar pasta
          </button>
          <button className={softBtn} onClick={createNoteBlock} disabled={!folders.length}>
            <Plus className="mr-2 h-4 w-4" /> Criar nova nota
          </button>
        </div>

        {isCreatingFolder && (
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-[1fr_auto_auto]">
            <input
              className={inputClass}
              value={folderDraft.name}
              onChange={(e) => setFolderDraft({ name: e.target.value })}
              placeholder="Nome da pasta"
            />
            <button className={softBtn} onClick={addFolder}>
              Salvar pasta
            </button>
            <button
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-100"
              onClick={() => {
                setIsCreatingFolder(false);
                setFolderDraft({ name: "" });
              }}
            >
              Cancelar
            </button>
          </div>
        )}

        {folders.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
            A aba começa vazia. Use os botões acima para criar pasta e criar nova nota.
          </p>
        )}
      </CollapsibleCard>

      {folders.length > 0 && (
        <CollapsibleCard title="Pastas e blocos" icon={<FolderKanban className="h-5 w-5 text-cyan-200" />}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-300">Pasta ativa</p>
            <select
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
            >
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {visibleNotes.map((note) => (
              <article key={note.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                {note.coverUrl && (
                  <img src={note.coverUrl} alt="Capa da nota" className="mb-3 h-36 max-w-full rounded-xl object-cover" />
                )}

                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <input
                    className="w-16 min-w-0 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-center text-lg text-slate-100 outline-none"
                    value={note.emoji}
                    maxLength={2}
                    onChange={(e) => updateNote(note.id, { emoji: e.target.value || "💡" })}
                  />
                  <input
                    className={`${inputClass} min-w-0 flex-1`}
                    value={note.title}
                    onChange={(e) => updateNote(note.id, { title: e.target.value })}
                    placeholder="Título"
                  />
                  <button
                    className="inline-flex items-center justify-center rounded-full border border-rose-300/30 bg-rose-400/10 p-2 text-rose-200"
                    onClick={() => removeNote(note.id)}
                    aria-label="Remover nota"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <input
                    className={inputClass}
                    value={note.coverUrl}
                    onChange={(e) => updateNote(note.id, { coverUrl: e.target.value })}
                    placeholder="URL da capa"
                  />
                  <select
                    className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
                    value={note.folderId}
                    onChange={(e) => updateNote(note.id, { folderId: e.target.value })}
                  >
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  className={`${inputClass} mt-3 min-h-[130px]`}
                  value={note.content}
                  onChange={(e) => updateNote(note.id, { content: e.target.value })}
                  placeholder="Conteúdo livre..."
                />
              </article>
            ))}

            {visibleNotes.length === 0 && (
              <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
                Nenhuma nota nesta pasta.
              </p>
            )}
          </div>
        </CollapsibleCard>
      )}
    </div>
  );

  const renderTodo = () => {
    const urgencyLabel: Record<Urgency, string> = {
      0: "Sem urgência",
      1: "Baixa",
      2: "Média",
      3: "Alta",
    };

    const urgencyColor: Record<Urgency, string> = {
      0: "border-slate-500/30 text-slate-300",
      1: "border-blue-300/30 text-blue-200",
      2: "border-amber-300/30 text-amber-200",
      3: "border-rose-300/30 text-rose-200",
    };

    const dayTodos = (todosByDate.get(selectedCalendarDate) ?? []).sort((a, b) => a.time.localeCompare(b.time));

    return (
      <div className="grid items-start gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <CollapsibleCard title="Compromissos" icon={<CalendarClock className="h-5 w-5 text-cyan-200" />}>
          {showTodoForm ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Novo compromisso</p>
                <button className="text-xs text-slate-500 hover:text-slate-300 transition" onClick={() => setShowTodoForm(false)}>Cancelar</button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className={inputClass}
                  value={todoDraft.title}
                  onChange={(e) => setTodoDraft((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Título"
                />
                <input
                  type="date"
                  className={inputClass}
                  value={todoDraft.date}
                  onChange={(e) => setTodoDraft((prev) => ({ ...prev, date: e.target.value }))}
                />
                <input
                  type="time"
                  className={inputClass}
                  value={todoDraft.time}
                  onChange={(e) => setTodoDraft((prev) => ({ ...prev, time: e.target.value }))}
                />
                <select
                  className={inputClass}
                  value={todoDraft.urgency}
                  onChange={(e) => setTodoDraft((prev) => ({ ...prev, urgency: e.target.value }))}
                >
                  <option value="0">Urgência 0</option>
                  <option value="1">Urgência 1</option>
                  <option value="2">Urgência 2</option>
                  <option value="3">Urgência 3</option>
                </select>
                <select
                  className={inputClass}
                  value={todoDraft.repeat}
                  onChange={(e) => setTodoDraft((prev) => ({ ...prev, repeat: e.target.value as TodoItem["repeat"] }))}
                >
                  <option value="nenhuma">Sem repetição</option>
                  <option value="diaria">Diária</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensal">Mensal</option>
                </select>
              </div>
              <textarea
                className={`${inputClass} min-h-[80px]`}
                value={todoDraft.notes}
                onChange={(e) => setTodoDraft((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Observação rápida"
              />
              <div className="flex flex-wrap gap-3">
                <button className={softBtn} onClick={() => { addTodo(); setShowTodoForm(false); }}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar
                </button>
                <button className={softBtn} onClick={askNotifications}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {notificationPermission === "granted"
                    ? "Notificações ativadas"
                    : notificationPermission === "unsupported"
                    ? "Navegador sem suporte"
                    : "Ativar notificações"}
                </button>
              </div>
            </div>
          ) : (
            <button className={softBtn} onClick={() => setShowTodoForm(true)}>
              <Plus className="mr-2 h-4 w-4" /> Novo compromisso
            </button>
          )}

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Visualização</p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "diario" as const, label: "Diário" },
                { id: "semanal" as const, label: "Semanal" },
                { id: "mensal" as const, label: "Mensal" },
              ].map((view) => (
                <button
                  key={view.id}
                  className={`rounded-full border px-4 py-2 text-xs transition ${
                    calendarView === view.id
                      ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                      : "border-white/10 text-slate-300 hover:border-cyan-300/30"
                  }`}
                  onClick={() => setCalendarView(view.id)}
                >
                  {view.label}
                </button>
              ))}
            </div>
            <input
              type="date"
              className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-xs text-slate-200"
              value={calendarAnchor}
              onChange={(e) => {
                setCalendarAnchor(e.target.value);
                setSelectedCalendarDate(e.target.value);
              }}
            />
          </div>
        </CollapsibleCard>

        <CollapsibleCard title="Calendário estilo agenda">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCalendarDates.map((date) => {
              const count = todosByDate.get(date)?.length ?? 0;
              const selected = selectedCalendarDate === date;
              return (
                <button
                  key={date}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${
                    selected
                      ? "border-cyan-300/50 bg-cyan-300/10"
                      : "border-white/10 bg-black/20 hover:border-cyan-300/30"
                  }`}
                  onClick={() => setSelectedCalendarDate(date)}
                >
                  <p className="text-sm font-medium text-slate-100">{shortDate(date)}</p>
                  <p className="mt-1 text-xs text-slate-400">{count} compromisso(s)</p>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="mb-3 text-sm text-slate-300">Agenda de {longDate(selectedCalendarDate)}</p>
            <div className="space-y-2">
              {dayTodos.map((todo) => (
                <article key={todo.id} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-sm ${todo.done ? "line-through text-slate-500" : "text-slate-100"}`}>{todo.title}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {todo.time || "Sem horário"} · {todo.repeat === "nenhuma" ? "Sem repetição" : todo.repeat}
                      </p>
                    </div>
                    <button className={`rounded-full border px-2 py-1 text-[11px] ${urgencyColor[todo.urgency]}`}>
                      {urgencyLabel[todo.urgency]}
                    </button>
                  </div>
                  {todo.notes && <p className="mt-2 text-xs text-slate-300">{todo.notes}</p>}
                  <button
                    className="mt-3 inline-flex items-center rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200 hover:border-cyan-300/40"
                    onClick={() => toggleTodo(todo.id)}
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    {todo.done ? "Marcar pendente" : "Concluir"}
                  </button>
                </article>
              ))}
              {!dayTodos.length && <p className="text-sm text-slate-500">Nenhum compromisso neste dia.</p>}
            </div>
          </div>
        </CollapsibleCard>
      </div>
    );
  };

  const renderProject = () => (
    <div className="grid items-start gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <CollapsibleCard title="Projeto de hábitos" icon={<Target className="h-5 w-5 text-cyan-200" />}>
        <p className="text-sm text-slate-300">
          Exemplo: 28 dias de dieta, treino, oração e sono correto. Marque check diário para manter consistência.
        </p>

        <input
          type="date"
          className={inputClass}
          value={projectAnchor}
          onChange={(e) => setProjectAnchor(e.target.value)}
        />

        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Conclusão semanal</p>
          <p className="mt-2 text-3xl font-semibold text-cyan-200">{projectCompletion}%</p>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
          {showHabitForm ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Novo hábito</p>
                <button className="text-xs text-slate-500 hover:text-slate-300 transition" onClick={() => setShowHabitForm(false)}>Cancelar</button>
              </div>
              <input
                className={inputClass}
                value={habitDraft}
                onChange={(e) => setHabitDraft(e.target.value)}
                placeholder="Novo hábito"
              />
              <button className={softBtn} onClick={() => { addHabit(); setShowHabitForm(false); }}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar hábito
              </button>
            </div>
          ) : (
            <button className={softBtn} onClick={() => setShowHabitForm(true)}>
              <Plus className="mr-2 h-4 w-4" /> Novo hábito
            </button>
          )}
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Checklist por dia da semana">
        <div className="overflow-x-hidden">
          <table className="w-full border-separate border-spacing-2 text-sm">
            <thead>
              <tr>
                <th className="rounded-xl bg-black/20 px-3 py-2 text-left font-medium text-slate-300">Dia</th>
                {habits.map((habit) => (
                  <th key={habit.id} className="rounded-xl bg-black/20 px-3 py-2 text-left font-medium text-slate-300">
                    {habit.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projectDates.map((date) => (
                <tr key={date}>
                  <td className="rounded-xl bg-black/20 px-3 py-2 text-slate-300">{shortDate(date)}</td>
                  {habits.map((habit) => {
                    const checked = habitChecks[date]?.[habit.id] ?? false;
                    return (
                      <td key={habit.id} className="rounded-xl bg-black/20 px-3 py-2">
                        <button
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
                            checked
                              ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-200"
                              : "border-white/20 text-slate-500 hover:border-cyan-300/40"
                          }`}
                          onClick={() => toggleHabit(date, habit.id)}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleCard>
    </div>
  );

  if (isCheckingSession) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-[#04070f] text-slate-100">
        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4">
          <p className="text-sm text-slate-300">Carregando sessão...</p>
        </div>
      </main>
    );
  }

  if (!sessionUser) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-[#04070f] text-slate-100">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -top-24 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-cyan-500/12 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[22rem] w-[22rem] rounded-full bg-indigo-500/12 blur-3xl" />
        </div>
        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4">
          <div className="w-full max-w-[420px]">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoginError("");
                const fd = new FormData(e.currentTarget);
                try {
                  const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password: fd.get("password") }),
                  });
                  if (res.ok) {
                    const { token } = (await res.json()) as { token: string };
                    localStorage.setItem(TOKEN_KEY, token);
                    const session = await authFetch("/api/auth/session");
                    const data = (await session.json()) as { user: User | null };
                    setSessionUser(data.user);
                  } else {
                    setLoginError("Senha incorreta");
                  }
                } catch {
                  setLoginError("Erro de conexão");
                }
              }}
              className="flex flex-col gap-4"
            >
              <div className="mb-4 text-center">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">OUTSTAND</p>
                <p className="text-sm text-slate-400">Insira sua senha para acessar</p>
              </div>
              <input
                name="password"
                type="password"
                placeholder="Senha"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none focus:border-cyan-300/50"
                autoFocus
              />
              {loginError && <p className="text-center text-xs text-red-400">{loginError}</p>}
              <button
                type="submit"
                className="w-full rounded-xl border border-cyan-300/30 bg-cyan-500/20 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/30"
              >
                Entrar
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#04070f] text-slate-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-24 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-cyan-500/12 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[22rem] w-[22rem] rounded-full bg-indigo-500/12 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
        <header className="mb-4 flex items-center justify-between py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">OUTSTAND</p>
          <div className="flex items-center gap-3">
            {isSyncingState && <span className="text-[11px] text-slate-500">Sincronizando...</span>}
            <span className="hidden text-xs text-slate-500 sm:inline">{sessionUser.name}</span>
            <input
              ref={importFileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const payload = JSON.parse(await file.text());
                  await authFetch("/api/state", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ payload }),
                  });
                  window.location.reload();
                } catch {
                  alert("Erro ao importar backup");
                }
                e.target.value = "";
              }}
            />
            <button
              className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-slate-400 transition hover:text-slate-200"
              onClick={() => importFileRef.current?.click()}
            >
              Importar
            </button>
            <button
              className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-slate-400 transition hover:text-slate-200"
              onClick={async () => {
                const res = await authFetch("/api/state");
                const { payload } = (await res.json()) as { payload: unknown };
                const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
                const a = Object.assign(document.createElement("a"), {
                  href: URL.createObjectURL(blob),
                  download: "outstand-backup.json",
                });
                a.click();
              }}
            >
              Exportar
            </button>
            <button
              className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-slate-400 transition hover:text-slate-200"
              onClick={() => {
                localStorage.removeItem(TOKEN_KEY);
                setSessionUser(null);
              }}
            >
              <LogOut className="mr-1 h-3 w-3" /> Sair
            </button>
          </div>
        </header>

        <nav className="mb-6 hidden gap-3 md:grid md:grid-cols-2 lg:grid-cols-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`group rounded-2xl border px-4 py-3 text-left transition ${
                  active
                    ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.2)]"
                    : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-cyan-300/35 hover:bg-cyan-300/8"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${active ? "text-cyan-200" : "text-slate-400 group-hover:text-cyan-200"}`} />
                  <span className="font-medium">{tab.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {activeTab === "financeiro" && renderFinance()}
        {activeTab === "saude" && renderHealth()}
        {activeTab === "ideias" && renderIdeas()}
        {activeTab === "todo" && renderTodo()}
        {activeTab === "projeto" && renderProject()}

        <nav
          className="fixed bottom-3 left-4 right-4 z-30 mx-auto max-w-md border border-white/10 bg-[#070d18]/95 px-2 py-1.5 backdrop-blur rounded-2xl md:hidden"
          style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="grid grid-cols-5 gap-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={`mobile-${tab.id}`}
                  className={`inline-flex h-9 items-center justify-center rounded-lg border transition ${
                    active
                      ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100"
                      : "border-white/10 bg-white/[0.02] text-slate-300"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                  aria-label={tab.label}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </main>
  );
}

export default App;
