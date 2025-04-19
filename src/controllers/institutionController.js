const institutionService = require('../services/institutionService');

const institutionController = {
  async getInstitutionDetails(req, res) {
    try {
      const institution = await institutionService.getInstitutionWithAssociations(req.params.id);

      if (!institution) {
        return res.status(404).json({ message: 'Institution not found' });
      }

      const statistics = institutionService.calculateStatistics(institution);

      return res.json({
        ...institution.toJSON(),
        statistics
      });
    } catch (error) {
      console.error('Error:', error);
      return res.status(error.status || 500).json({ 
        message: error.message || 'Internal server error',
        status: error.status || 500
      });
    }
  },

  async addTeacherToInstitution(req, res) {
    try {
      const result = await institutionService.addTeacherToInstitution(
        req.params.institutionId,
        req.params.teacherId
      );
      return res.json(result);
    } catch (error) {
      console.error('Error:', error);
      return res.status(error.status || 500).json({ 
        message: error.message || 'Internal server error',
        status: error.status || 500
      });
    }
  }
};

module.exports = institutionController;