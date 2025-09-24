import { Request, Response } from 'express';
import { Ventanilla } from '../models/ventanilla.entity';
import { AppDataSource } from '../config/database';

// Validación básica
function validateVentanilla(data: any): string | null {
  if (!data.numero || typeof data.numero !== 'number' || data.numero <= 0) {
    return 'El número debe ser un entero positivo.';
  }
  if (!data.etiqueta || typeof data.etiqueta !== 'string' || data.etiqueta.length > 100) {
    return 'La etiqueta es requerida y debe tener máximo 100 caracteres.';
  }
  return null;
}

export const getVentanillas = async (_req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Ventanilla);
    const ventanillas = await repo.find();
    res.json(ventanillas);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener ventanillas', details: err });
  }
};

export const getVentanillaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Ventanilla);
    const ventanilla = await repo.findOneBy({ id: Number(id) });
    if (!ventanilla) {
      return res.status(404).json({ error: 'Ventanilla no encontrada' });
    }
    res.json(ventanilla);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener ventanilla', details: err });
  }
};

export const createVentanilla = async (req: Request, res: Response) => {
  const error = validateVentanilla(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const repo = AppDataSource.getRepository(Ventanilla);
    const { numero, etiqueta, activo = true } = req.body;
    const nueva = repo.create({ numero, etiqueta, activo });
    const ventanilla = await repo.save(nueva);
    res.status(201).json(ventanilla);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear ventanilla', details: err });
  }
};

export const updateVentanilla = async (req: Request, res: Response) => {
  const { id } = req.params;
  const error = validateVentanilla(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const repo = AppDataSource.getRepository(Ventanilla);
    const ventanilla = await repo.findOneBy({ id: Number(id) });
    if (!ventanilla) {
      return res.status(404).json({ error: 'Ventanilla no encontrada' });
    }
    repo.merge(ventanilla, req.body);
    const updated = await repo.save(ventanilla);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar ventanilla', details: err });
  }
};

export const deleteVentanilla = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Ventanilla);
    const ventanilla = await repo.findOneBy({ id: Number(id) });
    if (!ventanilla) {
      return res.status(404).json({ error: 'Ventanilla no encontrada' });
    }
    await repo.remove(ventanilla);
    res.json({ message: 'Ventanilla eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar ventanilla', details: err });
  }
};
