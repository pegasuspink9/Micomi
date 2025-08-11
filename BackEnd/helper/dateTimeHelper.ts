export const formatDateTime = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    month: "long",
    day: "2-digit",
    year: "numeric",
  };
  return date.toLocaleString("en-US", options).replace(",", ", ");
};
