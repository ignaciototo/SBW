import { NextResponse } from 'next/server';
import { calculateDeadline } from '@/lib/calculateDeadline';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fechaInicio, dias, modo, hora_gracia } = body;

    if (!fechaInicio || dias === undefined || !modo) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const result = await calculateDeadline(fechaInicio, dias, modo, hora_gracia);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error calculando plazos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
