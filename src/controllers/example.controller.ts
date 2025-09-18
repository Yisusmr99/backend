// Controlador de ejemplo
import { Request, Response } from 'express';

export class ExampleController {
    static async getExample(req: Request, res: Response) {
        res.json({ message: 'Ejemplo funcionando' });
    }
}
