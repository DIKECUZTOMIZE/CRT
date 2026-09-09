/**
 * Currency Formatter for INR/USD
 */
export const formatCurrency = (amount, currency = "INR") => {
  if (amount === 0 || amount === "0") {
    return "Free";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Date Formatter
 * Example: 15 Aug 2026, 05:00 PM
 */
export const formatEventDate = (dateString) => {
  if (!dateString) return "TBA";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "TBA";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

export const formatRegistrationWindow = (startDate, endDate) => {
  const formatSingleDate = (value) => {
    if (!value) return "Open";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "TBA";
    }

    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const meridiem = hours >= 12 ? "AM" : "PM";
    const hour12 = hours % 12 || 12;

    return `${day} ${month} ${year}, ${String(hour12).padStart(2, "0")}:${minutes} ${meridiem}`;
  };

  const startLabel = formatSingleDate(startDate);
  const endLabel = formatSingleDate(endDate);

  return `${startLabel} - ${endLabel}`;
};

/**
 * Days Remaining Counter
 */
export const getDaysRemaining = (targetDate) => {
  if (!targetDate) return null;

  const diff = new Date(targetDate).getTime() - Date.now();

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return days > 0 ? `${days} Days Left` : "Registration Closed";
};

/**
 * Status Badge Styling Resolver
 */
export const getStatusBadgeStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "live":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

    case "upcoming":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";

    case "completed":
    case "ended":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";

    case "cancelled":
    case "canceled":
    case "cancel":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";

    case "postponed":
    case "popond":
      return "bg-violet-500/10 text-violet-400 border-violet-500/20";

    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
};

export const FALLBACK_EVENT_DATA = {
  id: "evt-001",

  status: "Upcoming",

  title: "National Level AI & Web Hackathon 2026",

  organizer: {
    name: "TechPulse India",
    image: "/assets/images/organizer-logo.png",
    info: "TechPulse India is a developer community and event organizer focused on technology events across North East India.",
    whatsappNumber: "+919876543210",
    email: "hello@techpulseindia.com",

    members: [
      {
        name: "Sanjit Keleng",
        role: "Lead Organizer",
        image: "/assets/images/member-1.png",
      },
      {
        name: "Rahul Sharma",
        role: "Tech Co-ordinator",
        image: "/assets/images/member-2.png",
      },
      {
        name: "Priya Das",
        role: "Event Host",
        image: "/assets/images/member-3.png",
      },
    ],
  },

  bannerUrl: "/assets/images/banner-placeholder.png",

  isBookmarked: false,

  meta: {
    status: "Upcoming",

    seatsAvailable: 120,

    location: "Tezpur University, Assam",

    startDate: "2026-09-01",
    startTime: "10:00 AM IST",

    endDate: "2026-09-03",
    endTime: "06:00 PM IST",

    registrationStarts: "2026-08-15",

    registrationDeadline: "2026-08-31",
  },

  // OPTIONAL
  competitionDetails: {
    participationType: "Solo & Team",

    // teamSize: "1 - 4 Members",

    ageGroups: ["18+"],

    eligibility: "ADULT AND KID",

    category: "Coding",

    skillLevel: "Intermediate",

    competitionType: "Hackathon",

    mode: "Offline",
  },

  description: {
    whatIsThis:
      "A 48-hour national-ASSSSSSSSSSSSAASSSSSAAAAAAAAAAAAAAAAAAlevel hackathon focused on Artificial Intelligence and modern web development.",

    about:
      "Participants will work on real-world problems, build innovative solutions and present their projects to a panel of judges.",

    whatToPrepare:
      "Bring your laptop, charger, basic development setup and valid ID proof.",

    additionalInfo:
      "Mentors will be available during the event for technical and product guidance.",
  },

  prizes: [
    {
      category: "Kids",
      description: "For participants below 18 years",
      prizes: [
        {
          rank: "1st Prize",
          amount: 10000,
          currency: "INR",
          perks: "Trophy + Certificate",
        },
        {
          rank: "2nd Prize",
          amount: 5000,
          currency: "INR",
          perks: "Certificate",
        },
      ],
    },

    {
      category: "Solo",
      description: "Individual participants",
      prizes: [
        {
          rank: "1st Prize",
          amount: 20000,
          currency: "INR",
          perks: "Trophy + Certificate",
        },
        {
          rank: "2nd Prize",
          amount: 10000,
          currency: "INR",
          perks: "Certificate",
        },
      ],
    },

    {
      category: "Team",
      description: "Team participation",
      prizes: [
        {
          rank: "1st Prize",
          amount: 50000,
          currency: "INR",
          perks: "Gold Trophy + Certificate",
          note: "Per Team",
        },
        {
          rank: "2nd Prize",
          amount: 25000,
          currency: "INR",
          perks: "Silver Trophy + Certificate",
          note: "Per Team",
        },
        {
          rank: "3rd Prize",
          amount: 10000,
          currency: "INR",
          perks: "Bronze Trophy + Certificate",
          note: "Per Team",
        },
      ],
    },
  ],

  entryFee: {
    isFree: false,

    categories: [
      {
        label: "Kids",
        amount: 0,
        currency: "INR",
      },
      {
        label: "Kids",
        amount: 0,
        currency: "INR",
      },
      {
        label: "Adults",
        amount: 299,
        currency: "INR",
      },
      {
        label: "General",
        amount: 199,
        currency: "INR",
      },
    ],

    note: "Payment is currently handled offline. Contact the organizer before making any payment.",
  },

  howToJoin: [
    {
      step: "Step 1",
      text: "For participation or to get more details about the event, contact the organizer through WhatsApp.",
    },
    {
      step: "Step 2",
      text: "Discuss the event details, eligibility and participation process with the organizer.",
    },
    {
      step: "Step 3",
      text: "The organizer will review your request and accept your participation.",
    },
    {
      step: "Step 4",
      text: "After acceptance, complete the registration process and pay the applicable fee offline as instructed by the organizer.",
    },
  ],

  terms: [
    "Participants must present valid ID proof at the venue.",
    "Plagiarism or unauthorized pre-built projects may result in disqualification.",
    "Registration fees are non-refundable unless otherwise stated.",
    "Participants must follow the organizer's event rules.",
  ],
};
