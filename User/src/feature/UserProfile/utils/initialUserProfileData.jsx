export const initialUserProfileData = {
  personal: {
    fullName: "Rohan Sharma",
    email: "rohan.sharma@example.com",
    phone: "+91 98765 12345",
    city: "Mumbai, India",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300",
    memberSince: "Jan 2025",
    isVerified: true,
  },
  stats: {
    registeredEvents: 8,
    attendedEvents: 14,
    savedEvents: 5,
    rewardPoints: 1250,
  },
  registeredEventsList: [
    {
      id: "ev-101",
      title: "Asia Esports Championship 2026",
      date: "28 Aug 2026",
      time: "06:00 PM",
      location: "Arena 1, Mumbai",
      ticketType: "VIP Pass",
      status: "Upcoming",
    },
    {
      id: "ev-102",
      title: "React & Web3 Developer Summit",
      date: "10 Sep 2026",
      time: "10:00 AM",
      location: "Online / Zoom",
      ticketType: "General Access",
      status: "Upcoming",
    },
  ],
  savedEventsList: [
    {
      id: "ev-201",
      title: "National Hackathon 2026",
      date: "15 Oct 2026",
      price: "Free",
      category: "Tech & Gaming",
    },
    {
      id: "ev-202",
      title: "Indie Music Fest Weekend",
      date: "05 Nov 2026",
      price: "₹999",
      category: "Music & Concert",
    },
  ],
  settings: {
    emailAlerts: true,
    whatsappTickets: true,
    publicActivity: false,
  },
};