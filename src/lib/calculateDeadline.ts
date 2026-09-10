import db from '@/lib/db';

let publicHolidaysPromiseCache: Record<number, Promise<any[]> | undefined> = {};

async function getPublicHolidays(year: number): Promise<any[]> {
  if (year in publicHolidaysPromiseCache && publicHolidaysPromiseCache[year]) {
    return publicHolidaysPromiseCache[year]!;
  }
  
  const fetchHolidays = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`https://nolaborables.com.ar/api/v2/feriados/${year}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('Error fetching nolaborables:', err);
    }
    return [];
  };

  publicHolidaysPromiseCache[year] = fetchHolidays();
  return publicHolidaysPromiseCache[year];
}

export async function calculateDeadline(fechaInicio: string, dias: number, modo: string, hora_gracia?: string) {
  if (dias === 0) {
    return { normal: null, fecha_gracia: null, hora_gracia: null };
  }

  // Cargar ferias judiciales de la DB
  const dbHolidays = db.prepare('SELECT * FROM holidays').all();

  // Helper para verificar si un día es hábil
  const isWorkingDay = async (dateObj: Date) => {
    const day = dateObj.getDay();
    if (day === 0 || day === 6) return false; // Fin de semana

    const yyyy = dateObj.getFullYear();
    const mm = dateObj.getMonth() + 1; // 1-12
    const dd = dateObj.getDate();
    const dateStr = dateObj.toISOString().split('T')[0];

    // Chequear ferias locales
    for (const h of dbHolidays as any[]) {
      if (dateStr >= h.desde && dateStr <= h.hasta) {
        return false;
      }
    }

    // Chequear feriados nacionales
    const feriados = await getPublicHolidays(yyyy);
    for (const f of feriados) {
      if (f.mes === mm && f.dia === dd) {
        return false;
      }
    }

    return true;
  };

  let current = new Date(fechaInicio + 'T12:00:00');
  let added = 0;

  if (modo === 'corridos') {
    current.setDate(current.getDate() + dias);
    // Si el vencimiento en días corridos cae inhábil, se prorroga al primer hábil siguiente
    while (!(await isWorkingDay(current))) {
      current.setDate(current.getDate() + 1);
    }
  } else {
    // Hábiles
    while (added < dias) {
      current.setDate(current.getDate() + 1);
      if (await isWorkingDay(current)) {
        added++;
      }
    }
  }

  const vtoNormal = new Date(current);

  // Fecha de gracia: el próximo día hábil posterior al vencimiento normal
  let gracia = new Date(vtoNormal);
  let graciaFound = false;
  while (!graciaFound) {
    gracia.setDate(gracia.getDate() + 1);
    if (await isWorkingDay(gracia)) {
      graciaFound = true;
    }
  }

  return {
    normal: vtoNormal.toISOString().split('T')[0],
    fecha_gracia: gracia.toISOString().split('T')[0],
    hora_gracia: hora_gracia || null
  };
}
