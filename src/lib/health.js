function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function today() {
  return toDateInputValue(new Date());
}

export function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);

  return toDateInputValue(date);
}

export function formatDate(value) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}
