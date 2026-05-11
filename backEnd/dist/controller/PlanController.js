"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PlanService_1 = require("../services/PlanService");
const service = new PlanService_1.PlanService();
class PlanController {
    static async create(req, res) {
        try {
            const plan = await service.create(req.body);
            return res.json(plan);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    static async getAll(req, res) {
        try {
            const plans = await service.findAll();
            return res.json(plans);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            if (!id)
                return res.status(400).json('O Id não foi encontrado');
            const plan = await service.update(id, req.body);
            return res.json(plan);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    static async delete(req, res) {
        try {
            const { id } = req.params;
            if (!id)
                return res.status(400).json('O Id não foi encontrado');
            await service.delete(id);
            return res.json({ message: "Plano desativado" });
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
}
exports.default = PlanController;
