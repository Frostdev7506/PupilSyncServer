const institutionService = require('../services/institutionService');
const AppError = require('../utils/errors/AppError');

const institutionController = {
  async createInstitution(req, res, next) {
    try {
      const institution = await institutionService.createInstitution(req.body);
      res.status(201).json({
        status: 'success',
        data: { institution },
      });
    } catch (error) {
      next(error);
    }
  },

  async getInstitutionDetails(req, res, next) {
    try {
      const institution = await institutionService.getInstitutionWithAssociations(req.params.id);

      if (!institution) {
        return next(new AppError('Institution not found', 404));
      }

      const statistics = institutionService.calculateStatistics(institution);

      return res.json({
        ...institution.toJSON(),
        statistics,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateInstitution(req, res, next) {
    try {
      const institution = await institutionService.updateInstitution(req.params.id, req.body);
      res.status(200).json({
        status: 'success',
        data: { institution },
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteInstitution(req, res, next) {
    try {
      await institutionService.deleteInstitution(req.params.id);
      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async addTeacherToInstitution(req, res, next) {
    try {
      const result = await institutionService.addTeacherToInstitution(
        req.params.institutionId,
        req.params.teacherId
      );
      return res.json(result);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = institutionController;
