const collaborativeProjectService = require('../services/collaborativeProjectService');
const AppError = require('../utils/errors/AppError');
const { validateCollaborativeProject, validateProjectTeam, validateTeamMember } = require('../utils/validators/collaborativeProjectValidator');

const collaborativeProjectController = {
  /**
   * Create a new collaborative project
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createProject(req, res, next) {
    try {
      // Validate request body
      const { error } = validateCollaborativeProject(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      // Set the current user as the creator
      const projectData = {
        ...req.body,
        createdBy: req.user.userId
      };
      
      const project = await collaborativeProjectService.createProject(projectData);
      
      res.status(201).json({
        status: 'success',
        data: {
          project
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a project by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getProjectById(req, res, next) {
    try {
      const { id } = req.params;
      
      const project = await collaborativeProjectService.getProjectById(id);
      
      res.status(200).json({
        status: 'success',
        data: {
          project
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all projects with optional filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllProjects(req, res, next) {
    try {
      const { courseId, classId, status, createdBy } = req.query;
      
      const filters = {
        courseId: courseId ? parseInt(courseId) : undefined,
        classId: classId ? parseInt(classId) : undefined,
        status,
        createdBy: createdBy ? parseInt(createdBy) : undefined
      };
      
      const projects = await collaborativeProjectService.getAllProjects(filters);
      
      res.status(200).json({
        status: 'success',
        results: projects.length,
        data: {
          projects
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a project
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateProject(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateCollaborativeProject(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Get the project to check ownership
      const project = await collaborativeProjectService.getProjectById(id);
      
      // Check if user is authorized to update this project
      if (req.user.role !== 'admin' && req.user.role !== 'teacher' && project.createdBy !== req.user.userId) {
        return next(new AppError('You are not authorized to update this project', 403));
      }
      
      const updatedProject = await collaborativeProjectService.updateProject(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          project: updatedProject
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a project
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteProject(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get the project to check ownership
      const project = await collaborativeProjectService.getProjectById(id);
      
      // Check if user is authorized to delete this project
      if (req.user.role !== 'admin' && req.user.role !== 'teacher' && project.createdBy !== req.user.userId) {
        return next(new AppError('You are not authorized to delete this project', 403));
      }
      
      await collaborativeProjectService.deleteProject(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new team for a project
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createTeam(req, res, next) {
    try {
      // Validate request body
      const { error } = validateProjectTeam(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      // Set the current user as the creator
      const teamData = {
        ...req.body,
        createdBy: req.user.userId
      };
      
      const team = await collaborativeProjectService.createTeam(teamData);
      
      res.status(201).json({
        status: 'success',
        data: {
          team
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a team by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getTeamById(req, res, next) {
    try {
      const { id } = req.params;
      
      const team = await collaborativeProjectService.getTeamById(id);
      
      res.status(200).json({
        status: 'success',
        data: {
          team
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all teams for a project
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getProjectTeams(req, res, next) {
    try {
      const { projectId } = req.params;
      
      const teams = await collaborativeProjectService.getProjectTeams(projectId);
      
      res.status(200).json({
        status: 'success',
        results: teams.length,
        data: {
          teams
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a team
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateTeam(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateProjectTeam(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Get the team to check ownership
      const team = await collaborativeProjectService.getTeamById(id);
      
      // Check if user is authorized to update this team
      const isTeamLeader = req.user.student && team.teamLeaderId === req.user.student.studentId;
      
      if (req.user.role !== 'admin' && req.user.role !== 'teacher' && team.createdBy !== req.user.userId && !isTeamLeader) {
        return next(new AppError('You are not authorized to update this team', 403));
      }
      
      // If user is team leader, restrict fields they can update
      if (isTeamLeader) {
        const allowedFields = ['name', 'description'];
        const requestedFields = Object.keys(req.body);
        
        const hasDisallowedFields = requestedFields.some(field => !allowedFields.includes(field));
        if (hasDisallowedFields) {
          return next(new AppError('Team leaders can only update name and description', 403));
        }
      }
      
      const updatedTeam = await collaborativeProjectService.updateTeam(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          team: updatedTeam
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a team
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteTeam(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get the team to check ownership
      const team = await collaborativeProjectService.getTeamById(id);
      
      // Check if user is authorized to delete this team
      if (req.user.role !== 'admin' && req.user.role !== 'teacher' && team.createdBy !== req.user.userId) {
        return next(new AppError('You are not authorized to delete this team', 403));
      }
      
      await collaborativeProjectService.deleteTeam(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Add a member to a team
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async addTeamMember(req, res, next) {
    try {
      // Validate request body
      const { error } = validateTeamMember(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      // Set the current user as the inviter
      const memberData = {
        ...req.body,
        invitedBy: req.user.userId
      };
      
      // Get the team to check ownership
      const team = await collaborativeProjectService.getTeamById(memberData.teamId);
      
      // Check if user is authorized to add members to this team
      const isTeamLeader = req.user.student && team.teamLeaderId === req.user.student.studentId;
      
      if (req.user.role !== 'admin' && req.user.role !== 'teacher' && team.createdBy !== req.user.userId && !isTeamLeader) {
        return next(new AppError('You are not authorized to add members to this team', 403));
      }
      
      const member = await collaborativeProjectService.addTeamMember(memberData);
      
      res.status(201).json({
        status: 'success',
        data: {
          member
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a team member
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateTeamMember(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateTeamMember(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Get the membership to check ownership
      const membership = await collaborativeProjectService.getTeamMemberById(id);
      
      // Check if user is authorized to update this membership
      const isTeamLeader = req.user.student && membership.team.teamLeaderId === req.user.student.studentId;
      const isMember = req.user.student && membership.studentId === req.user.student.studentId;
      
      if (req.user.role !== 'admin' && req.user.role !== 'teacher' && !isTeamLeader && !isMember) {
        return next(new AppError('You are not authorized to update this team membership', 403));
      }
      
      // If user is the member, restrict fields they can update
      if (isMember && !isTeamLeader) {
        const allowedFields = ['status'];
        const requestedFields = Object.keys(req.body);
        
        const hasDisallowedFields = requestedFields.some(field => !allowedFields.includes(field));
        if (hasDisallowedFields) {
          return next(new AppError('Members can only update their status', 403));
        }
      }
      
      const updatedMember = await collaborativeProjectService.updateTeamMember(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          member: updatedMember
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove a member from a team
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async removeTeamMember(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get the membership to check ownership
      const membership = await collaborativeProjectService.getTeamMemberById(id);
      
      // Check if user is authorized to remove this member
      const isTeamLeader = req.user.student && membership.team.teamLeaderId === req.user.student.studentId;
      const isMember = req.user.student && membership.studentId === req.user.student.studentId;
      
      if (req.user.role !== 'admin' && req.user.role !== 'teacher' && !isTeamLeader && !isMember) {
        return next(new AppError('You are not authorized to remove this team member', 403));
      }
      
      await collaborativeProjectService.removeTeamMember(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Submit a team project
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async submitTeamProject(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get the team to check ownership
      const team = await collaborativeProjectService.getTeamById(id);
      
      // Check if user is authorized to submit for this team
      const isTeamLeader = req.user.student && team.teamLeaderId === req.user.student.studentId;
      
      if (req.user.role !== 'admin' && req.user.role !== 'teacher' && !isTeamLeader) {
        return next(new AppError('Only team leaders can submit projects', 403));
      }
      
      const updatedTeam = await collaborativeProjectService.submitTeamProject(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          team: updatedTeam
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Grade a team submission
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async gradeTeamSubmission(req, res, next) {
    try {
      const { id } = req.params;
      const { grade, feedback } = req.body;
      
      if (grade === undefined || grade === null) {
        return next(new AppError('Grade is required', 400));
      }
      
      // Only teachers and admins can grade submissions
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return next(new AppError('Only teachers and administrators can grade submissions', 403));
      }
      
      const gradeData = {
        grade,
        feedback,
        gradedBy: req.user.userId
      };
      
      const team = await collaborativeProjectService.gradeTeamSubmission(id, gradeData);
      
      res.status(200).json({
        status: 'success',
        data: {
          team
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = collaborativeProjectController;
