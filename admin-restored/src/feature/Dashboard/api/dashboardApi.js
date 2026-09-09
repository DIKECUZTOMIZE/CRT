const fallbackDashboardData = {
  summary: [
    { label: "Total Users", value: "1,284", change: "+12.4%" },
    { label: "Total Organizers", value: "248", change: "+8.7%" },
    { label: "Total Events", value: "392", change: "+15.9%" },
    { label: "Live Events", value: "24", change: "+3.6%" },
    { label: "Upcoming", value: "58", change: "+9.1%" },
    { label: "Completed", value: "185", change: "+11.2%" },
    { label: "Ended", value: "41", change: "+2.1%" },
    { label: "Cancelled", value: "17", change: "-1.4%" },
    { label: "Postponed", value: "9", change: "+0.8%" },
  ],
  recentActivity: [
    { title: "New user joined", detail: "Riya Sharma created a student account and completed profile setup", time: "8 min ago", section: "users" },
    { title: "Organizer verified", detail: "Astra Events passed KYC and became an approved organizer", time: "22 min ago", section: "organizers" },
    { title: "Event published", detail: "City Run 2026 was successfully published by Astra Events", time: "45 min ago", section: "events" },
    { title: "Event postponed", detail: "Startup Expo was rescheduled to next weekend by Pixel Stage", time: "1 hour ago", section: "events" },
    { title: "User report reviewed", detail: "A complaint from a participant was resolved by the support team", time: "2 hours ago", section: "users" },
    { title: "Event cancelled", detail: "Night Music Fest was cancelled by organizer due to venue issues", time: "3 hours ago", section: "events" },
  ],
  quickActions: [
    { label: "Review pending organizer approvals", section: "organizers" },
    { label: "Moderate cancelled and postponed events", section: "events" },
    { label: "Audit new user registrations", section: "users" },
    { label: "Download weekly platform reports", section: "dashboard" },
  ],
  users: [
    { name: "Aarav Verma", email: "aarav@example.com", role: "User", status: "Active", lastSeen: "2m ago" },
    { name: "Sana Ali", email: "sana@example.com", role: "User", status: "Suspended", lastSeen: "1h ago" },
    { name: "Riya Sharma", email: "riya@example.com", role: "User", status: "Active", lastSeen: "8m ago" },
    { name: "Naina Shah", email: "naina@example.com", role: "User", status: "Pending", lastSeen: "1d ago" },
  ],
  organizers: [
    { name: "Astra Events", email: "astra@crt.com", status: "Verified", spend: "$3.4K", rating: "4.9" },
    { name: "BlueMoon Co", email: "bluemoon@crt.com", status: "Review", spend: "$1.2K", rating: "4.6" },
    { name: "Pixel Stage", email: "pixelstage@crt.com", status: "Verified", spend: "$6.1K", rating: "4.8" },
    { name: "NightLoop", email: "nightloop@crt.com", status: "Blocked", spend: "$780", rating: "2.5" },
  ],
  events: [
    { title: "City Run 2026", organizer: "Astra Events", status: "Live", attendees: "780" },
    { title: "Startup Expo", organizer: "Pixel Stage", status: "Upcoming", attendees: "340" },
    { title: "Design Summit", organizer: "BlueMoon Co", status: "Cancelled", attendees: "120" },
    { title: "Music Carnival", organizer: "NightLoop", status: "Completed", attendees: "1,240" },
    { title: "Photography Clash", organizer: "Pixel Stage", status: "Ended", attendees: "510" },
    { title: "Hackathon 2026", organizer: "Astra Events", status: "Postponed", attendees: "260" },
  ],
};

export const getAdminDashboardData = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/admin/dashboard", {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return fallbackDashboardData;
    }

    const data = await response.json();

    if (data?.success && data?.data) {
      return data.data;
    }

    if (data?.summary || data?.users || data?.events) {
      return data;
    }

    return fallbackDashboardData;
  } catch (error) {
    return fallbackDashboardData;
  }
};

export default fallbackDashboardData;
