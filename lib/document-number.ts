function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export function generateDocumentNumber(prefix: "QUO" | "INV") {
  const now = new Date();
  const date = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join("");
  const time = [pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join("");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");

  return `${prefix}-${date}-${time}-${random}`;
}
