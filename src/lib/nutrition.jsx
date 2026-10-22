export function ageFromBirth(birthDate) {
  if (typeof birthDate !== "string" || !birthDate) return null;

  const [year, month, day] = birthDate.split("-").map(Number);
  if (!year || !month || !day) return null;

  const birth = new Date(year, month - 1, day);
  if (
    birth.getFullYear() !== year ||
    birth.getMonth() !== month - 1 ||
    birth.getDate() !== day
  ) {
    return null;
  }

  const now = new Date();
  let age = now.getFullYear() - year;

  if (
    now.getMonth() < month - 1 ||
    (now.getMonth() === month - 1 && now.getDate() < day)
  ) {
    age -= 1;
  }

  return age;
}

export function estimateTdee(profile) {
  if (!profile) return null;

  const age = ageFromBirth(profile.birth_date);
  const weight = Number(profile.weight_kg);
  const height = Number(profile.height_cm);
  const sex = profile.sex;

  if (
    age == null ||
    !Number.isFinite(age) ||
    age < 18 ||
    !Number.isFinite(weight) ||
    weight <= 0 ||
    !Number.isFinite(height) ||
    height <= 0 ||
    !["M", "F"].includes(sex)
  ) {
    return null;
  }

  const bmr =
    10 * weight +
    6.25 * height -
    5 * age +
    (sex === "M" ? 5 : -161);

  return Math.round(bmr * 1.4);
}

// IMC: indicador aproximado, com classificação para adultos.
export function bmiInfo(weight, height, age = null) {
  const w = Number(weight);
  const h = Number(height);

  if (
    !Number.isFinite(w) ||
    !Number.isFinite(h) ||
    w <= 0 ||
    h <= 0
  ) {
    return null;
  }

  // Se a idade for informada, não classificar menores de 18 anos.
  if (age != null && (!Number.isFinite(Number(age)) || Number(age) < 18)) {
    return null;
  }

  const value = w / (h / 100) ** 2;

  let label;
  let color;

  if (value < 18.5) {
    label = "Abaixo do peso";
    color = "text-amber-400";
  } else if (value < 25) {
    label = "Peso normal";
    color = "text-green-400";
  } else if (value < 30) {
    label = "Sobrepeso";
    color = "text-amber-400";
  } else {
    label = "Obesidade";
    color = "text-red-400";
  }

  return {
    value: Number(value.toFixed(1)),
    label,
    color,
  };
}