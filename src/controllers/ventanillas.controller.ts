import { Request, Response } from 'express';
import { Ventanilla } from '../models/ventanilla.entity';
import { AppDataSource } from '../config/database';
import { success, error as errorResponse } from '../utils/response.util';

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
    return success(res, ventanillas, 'Lista de ventanillas');
  } catch (err) {
    return errorResponse(res, 'Error al obtener ventanillas', 500, err);
  }
};

export const getVentanillaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Ventanilla);
    const ventanilla = await repo.findOneBy({ id: Number(id) });
    if (!ventanilla) {
      return errorResponse(res, 'Ventanilla no encontrada', 404);
    }
    return success(res, ventanilla, 'Ventanilla encontrada');
  } catch (err) {
    return errorResponse(res, 'Error al obtener ventanilla', 500, err);
  }
};

export const createVentanilla = async (req: Request, res: Response) => {
  // Solo permitir los campos válidos
  const allowedFields = ['numero', 'etiqueta', 'activo'];
  const extraFields = Object.keys(req.body).filter(key => !allowedFields.includes(key));
  if (extraFields.length > 0) {
    return errorResponse(res, `Campos no permitidos: ${extraFields.join(', ')}`, 400);
  }
  const errorMsg = validateVentanilla(req.body);
  if (errorMsg) return errorResponse(res, errorMsg, 400);
  try {
    const repo = AppDataSource.getRepository(Ventanilla);
    const { numero, etiqueta, activo = true } = req.body;
    const nueva = repo.create({ numero, etiqueta, activo });
    const ventanilla = await repo.save(nueva);
    return success(res, ventanilla, 'Ventanilla creada', 201);
  } catch (err) {
    return errorResponse(res, 'Error al crear ventanilla', 500, err);
  }
};

export const updateVentanilla = async (req: Request, res: Response) => {
  const { id } = req.params;
  // Solo permitir los campos válidos
  const allowedFields = ['numero', 'etiqueta', 'activo'];
  const extraFields = Object.keys(req.body).filter(key => !allowedFields.includes(key));
  if (extraFields.length > 0) {
    return errorResponse(res, `Campos no permitidos: ${extraFields.join(', ')}`, 400);
  }
  const errorMsg = validateVentanilla(req.body);
  if (errorMsg) return errorResponse(res, errorMsg, 400);
  try {
    const repo = AppDataSource.getRepository(Ventanilla);
    const ventanilla = await repo.findOneBy({ id: Number(id) });
    if (!ventanilla) {
      return errorResponse(res, 'Ventanilla no encontrada', 404);
    }
    repo.merge(ventanilla, req.body);
    const updated = await repo.save(ventanilla);
    return success(res, updated, 'Ventanilla actualizada');
  } catch (err) {
    return errorResponse(res, 'Error al actualizar ventanilla', 500, err);
  }
};

export const deleteVentanilla = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Ventanilla);
    const ventanilla = await repo.findOneBy({ id: Number(id) });
    if (!ventanilla) {
      return errorResponse(res, 'Ventanilla no encontrada', 404);
    }
    await repo.remove(ventanilla);
    return success(res, null, 'Ventanilla eliminada correctamente');
  } catch (err) {
    return errorResponse(res, 'Error al eliminar ventanilla', 500, err);
  }
};


export const toggleVentanillaActivo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Ventanilla);
    const ventanilla = await repo.findOneBy({ id: Number(id) });
    if (!ventanilla) {
      return errorResponse(res, 'Ventanilla no encontrada', 404);
    }
    ventanilla.activo = !ventanilla.activo;
    const updated = await repo.save(ventanilla);
    return success(res, updated, `Ventanilla ${ventanilla.activo ? 'activada' : 'desactivada'}`);
  } catch (err) {
    return errorResponse(res, 'Error al cambiar estado de ventanilla', 500, err);
  }
};