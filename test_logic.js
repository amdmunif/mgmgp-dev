const item = {
  is_registration_open: 1,
  registration_deadline: "2026-09-02 09:00:00",
  date: "2026-09-02 08:00:00",
  quota: 100,
  participants_count: 2
};
const deadline = item.registration_deadline || item.date;
const isDeadlinePassed = deadline ? new Date(deadline) < new Date() : false;
const isQuotaFull = item.quota ? (item.participants_count || 0) >= item.quota : false;
const isOpen = item.is_registration_open && !isDeadlinePassed && !isQuotaFull;

console.log("Deadline:", deadline);
console.log("Parsed Deadline:", new Date(deadline));
console.log("Current Date:", new Date());
console.log("isDeadlinePassed:", isDeadlinePassed);
console.log("isQuotaFull:", isQuotaFull);
console.log("isOpen:", isOpen);
