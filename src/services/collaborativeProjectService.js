const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');
const modelAssociationUtil = require('../utils/modelAssociationUtil');

const models = initModels(sequelize);
const {
  CollaborativeProjects,
  ProjectTeams,
  ProjectTeamMembers,
  Courses,
  Classes,
  Students,
  Users
} = models;

// Verify required associations
const projectAssociations = ['course', 'class', 'creator', 'teams'];
const teamAssociations = ['project', 'teamLeader', 'creator', 'members'];

const projectVerification = modelAssociationUtil.verifyRequiredAssociations('CollaborativeProjects', projectAssociations);
const teamVerification = modelAssociationUtil.verifyRequiredAssociations('ProjectTeams', teamAssociations);

if (!projectVerification.valid) {
  console.error(`Missing required associations for CollaborativeProjects: ${projectVerification.missing.join(', ')}`);
}

if (!teamVerification.valid) {
  console.error(`Missing required associations for ProjectTeams: ${teamVerification.missing.join(', ')}`);
}

const collaborativeProjectService = {
  /**
   * Create a new collaborative project
   * @param {Object} projectData - The project data
   * @returns {Promise<Object>} - The created project
   */
  async createProject(projectData) {
    try {
      const project = await CollaborativeProjects.create(projectData);
      return this.getProjectById(project.projectId);
    } catch (error) {
      throw new AppError(error.message, 400);
    }
  },

  /**
   * Get a project by ID
   * @param {number} projectId - The project ID
   * @returns {Promise<Object>} - The project
   */
  async getProjectById(projectId) {
    const project = await CollaborativeProjects.findByPk(projectId, {
      include: [
        {
          model: Courses,
          as: 'course'
        },
        {
          model: Classes,
          as: 'class'
        },
        {
          model: Users,
          as: 'creator'
        },
        {
          model: ProjectTeams,
          as: 'teams',
          include: [
            {
              model: Students,
              as: 'teamLeader',
              include: [{ model: Users, as: 'user' }]
            },
            {
              model: ProjectTeamMembers,
              as: 'members',
              include: [
                {
                  model: Students,
                  as: 'student',
                  include: [{ model: Users, as: 'user' }]
                }
              ]
            }
          ]
        }
      ]
    });

    if (!project) {
      throw new AppError('Collaborative project not found', 404);
    }

    return project;
  },

  /**
   * Get all projects with optional filtering
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of projects
   */
  async getAllProjects(filters = {}) {
    const { courseId, classId, status, createdBy } = filters;

    const whereClause = {};

    if (courseId) {
      whereClause.courseId = courseId;
    }

    if (classId) {
      whereClause.classId = classId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (createdBy) {
      whereClause.createdBy = createdBy;
    }

    const projects = await CollaborativeProjects.findAll({
      where: whereClause,
      include: [
        {
          model: Courses,
          as: 'course'
        },
        {
          model: Classes,
          as: 'class'
        },
        {
          model: Users,
          as: 'creator'
        }
      ],
      order: [
        ['dueDate', 'ASC'],
        ['createdAt', 'DESC']
      ]
    });

    return projects;
  },

  /**
   * Update a project
   * @param {number} projectId - The project ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated project
   */
  async updateProject(projectId, updateData) {
    const project = await CollaborativeProjects.findByPk(projectId);

    if (!project) {
      throw new AppError('Collaborative project not found', 404);
    }

    // Check if project status allows updates
    if (project.status === 'completed' || project.status === 'archived') {
      throw new AppError('Cannot update a completed or archived project', 400);
    }

    await project.update(updateData);

    return this.getProjectById(projectId);
  },

  /**
   * Delete a project
   * @param {number} projectId - The project ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteProject(projectId) {
    const transaction = await sequelize.transaction();

    try {
      const project = await CollaborativeProjects.findByPk(projectId, { transaction });

      if (!project) {
        await transaction.rollback();
        throw new AppError('Collaborative project not found', 404);
      }

      // Check if project has teams
      const teams = await ProjectTeams.findAll({
        where: { projectId },
        transaction
      });

      // Delete team members first
      for (const team of teams) {
        await ProjectTeamMembers.destroy({
          where: { teamId: team.teamId },
          transaction
        });
      }

      // Delete teams
      await ProjectTeams.destroy({
        where: { projectId },
        transaction
      });

      // Delete the project
      await project.destroy({ transaction });

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * Create a new team for a project
   * @param {Object} teamData - The team data
   * @returns {Promise<Object>} - The created team
   */
  async createTeam(teamData) {
    const transaction = await sequelize.transaction();

    try {
      // Check if project exists
      const project = await CollaborativeProjects.findByPk(teamData.projectId, { transaction });

      if (!project) {
        await transaction.rollback();
        throw new AppError('Collaborative project not found', 404);
      }

      // Check if project allows team formation
      if (!project.allowTeamFormation && teamData.createdBy !== project.createdBy) {
        await transaction.rollback();
        throw new AppError('This project does not allow student team formation', 400);
      }

      // Check if project status allows team creation
      if (project.status !== 'draft' && project.status !== 'active') {
        await transaction.rollback();
        throw new AppError('Cannot create teams for a completed or archived project', 400);
      }

      // Create the team
      const team = await ProjectTeams.create(teamData, { transaction });

      // If team leader is specified, add them as a member
      if (teamData.teamLeaderId) {
        await ProjectTeamMembers.create({
          teamId: team.teamId,
          studentId: teamData.teamLeaderId,
          invitedBy: teamData.createdBy,
          status: 'active',
          role: 'Team Leader'
        }, { transaction });
      }

      await transaction.commit();

      return this.getTeamById(team.teamId);
    } catch (error) {
      await transaction.rollback();
      throw new AppError(error.message, 400);
    }
  },

  /**
   * Get a team by ID
   * @param {number} teamId - The team ID
   * @returns {Promise<Object>} - The team
   */
  async getTeamById(teamId) {
    const team = await ProjectTeams.findByPk(teamId, {
      include: [
        {
          model: CollaborativeProjects,
          as: 'project'
        },
        {
          model: Students,
          as: 'teamLeader',
          include: [{ model: Users, as: 'user' }]
        },
        {
          model: Users,
          as: 'creator'
        },
        {
          model: Users,
          as: 'grader'
        },
        {
          model: ProjectTeamMembers,
          as: 'members',
          include: [
            {
              model: Students,
              as: 'student',
              include: [{ model: Users, as: 'user' }]
            },
            {
              model: Users,
              as: 'inviter'
            }
          ]
        }
      ]
    });

    if (!team) {
      throw new AppError('Project team not found', 404);
    }

    return team;
  },

  /**
   * Get all teams for a project
   * @param {number} projectId - The project ID
   * @returns {Promise<Array>} - Array of teams
   */
  async getProjectTeams(projectId) {
    // Verify project exists
    const project = await CollaborativeProjects.findByPk(projectId);

    if (!project) {
      throw new AppError('Collaborative project not found', 404);
    }

    const teams = await ProjectTeams.findAll({
      where: { projectId },
      include: [
        {
          model: Students,
          as: 'teamLeader',
          include: [{ model: Users, as: 'user' }]
        },
        {
          model: ProjectTeamMembers,
          as: 'members',
          include: [
            {
              model: Students,
              as: 'student',
              include: [{ model: Users, as: 'user' }]
            }
          ]
        }
      ],
      order: [
        ['createdAt', 'ASC']
      ]
    });

    return teams;
  },

  /**
   * Update a team
   * @param {number} teamId - The team ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated team
   */
  async updateTeam(teamId, updateData) {
    const team = await ProjectTeams.findByPk(teamId, {
      include: [{ model: CollaborativeProjects, as: 'project' }]
    });

    if (!team) {
      throw new AppError('Project team not found', 404);
    }

    // Check if project status allows team updates
    if (team.project.status === 'completed' || team.project.status === 'archived') {
      throw new AppError('Cannot update teams for a completed or archived project', 400);
    }

    await team.update(updateData);

    return this.getTeamById(teamId);
  },

  /**
   * Delete a team
   * @param {number} teamId - The team ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteTeam(teamId) {
    const transaction = await sequelize.transaction();

    try {
      const team = await ProjectTeams.findByPk(teamId, {
        include: [{ model: CollaborativeProjects, as: 'project' }],
        transaction
      });

      if (!team) {
        await transaction.rollback();
        throw new AppError('Project team not found', 404);
      }

      // Check if project status allows team deletion
      if (team.project.status === 'completed' || team.project.status === 'archived') {
        await transaction.rollback();
        throw new AppError('Cannot delete teams from a completed or archived project', 400);
      }

      // Delete team members first
      await ProjectTeamMembers.destroy({
        where: { teamId },
        transaction
      });

      // Delete the team
      await team.destroy({ transaction });

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * Add a member to a team
   * @param {Object} memberData - The member data
   * @returns {Promise<Object>} - The created team membership
   */
  async addTeamMember(memberData) {
    const transaction = await sequelize.transaction();

    try {
      // Check if team exists
      const team = await ProjectTeams.findByPk(memberData.teamId, {
        include: [{ model: CollaborativeProjects, as: 'project' }],
        transaction
      });

      if (!team) {
        await transaction.rollback();
        throw new AppError('Project team not found', 404);
      }

      // Check if project status allows member addition
      if (team.project.status !== 'draft' && team.project.status !== 'active') {
        await transaction.rollback();
        throw new AppError('Cannot add members to a team in a completed or archived project', 400);
      }

      // Check if team is still forming or active
      if (team.status !== 'forming' && team.status !== 'active') {
        await transaction.rollback();
        throw new AppError('Cannot add members to a completed team', 400);
      }

      // Check if student exists
      const student = await Students.findByPk(memberData.studentId, { transaction });

      if (!student) {
        await transaction.rollback();
        throw new AppError('Student not found', 404);
      }

      // Check if student is already a member of this team
      const existingMembership = await ProjectTeamMembers.findOne({
        where: {
          teamId: memberData.teamId,
          studentId: memberData.studentId
        },
        transaction
      });

      if (existingMembership) {
        await transaction.rollback();
        throw new AppError('Student is already a member of this team', 400);
      }

      // Check if student is a member of another team for this project
      const otherTeamMembership = await ProjectTeamMembers.findOne({
        include: [
          {
            model: ProjectTeams,
            as: 'team',
            where: {
              projectId: team.projectId,
              teamId: {
                [Op.ne]: team.teamId
              }
            }
          }
        ],
        where: {
          studentId: memberData.studentId
        },
        transaction
      });

      if (otherTeamMembership) {
        await transaction.rollback();
        throw new AppError('Student is already a member of another team for this project', 400);
      }

      // Check team size limits
      const currentMemberCount = await ProjectTeamMembers.count({
        where: { teamId: memberData.teamId },
        transaction
      });

      if (team.project.maxTeamSize && currentMemberCount >= team.project.maxTeamSize) {
        await transaction.rollback();
        throw new AppError(`Team has reached the maximum size of ${team.project.maxTeamSize} members`, 400);
      }

      // Create the membership
      const membership = await ProjectTeamMembers.create(memberData, { transaction });

      await transaction.commit();

      return this.getTeamMemberById(membership.membershipId);
    } catch (error) {
      await transaction.rollback();
      throw new AppError(error.message, 400);
    }
  },

  /**
   * Get a team membership by ID
   * @param {number} membershipId - The membership ID
   * @returns {Promise<Object>} - The team membership
   */
  async getTeamMemberById(membershipId) {
    const membership = await ProjectTeamMembers.findByPk(membershipId, {
      include: [
        {
          model: ProjectTeams,
          as: 'team',
          include: [{ model: CollaborativeProjects, as: 'project' }]
        },
        {
          model: Students,
          as: 'student',
          include: [{ model: Users, as: 'user' }]
        },
        {
          model: Users,
          as: 'inviter'
        }
      ]
    });

    if (!membership) {
      throw new AppError('Team membership not found', 404);
    }

    return membership;
  },

  /**
   * Update a team membership
   * @param {number} membershipId - The membership ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated team membership
   */
  async updateTeamMember(membershipId, updateData) {
    const membership = await ProjectTeamMembers.findByPk(membershipId, {
      include: [
        {
          model: ProjectTeams,
          as: 'team',
          include: [{ model: CollaborativeProjects, as: 'project' }]
        }
      ]
    });

    if (!membership) {
      throw new AppError('Team membership not found', 404);
    }

    // Check if project status allows membership updates
    if (membership.team.project.status === 'completed' || membership.team.project.status === 'archived') {
      throw new AppError('Cannot update team memberships for a completed or archived project', 400);
    }

    await membership.update(updateData);

    return this.getTeamMemberById(membershipId);
  },

  /**
   * Remove a member from a team
   * @param {number} membershipId - The membership ID
   * @returns {Promise<boolean>} - True if removed successfully
   */
  async removeTeamMember(membershipId) {
    const membership = await ProjectTeamMembers.findByPk(membershipId, {
      include: [
        {
          model: ProjectTeams,
          as: 'team',
          include: [{ model: CollaborativeProjects, as: 'project' }]
        }
      ]
    });

    if (!membership) {
      throw new AppError('Team membership not found', 404);
    }

    // Check if project status allows member removal
    if (membership.team.project.status === 'completed' || membership.team.project.status === 'archived') {
      throw new AppError('Cannot remove members from a team in a completed or archived project', 400);
    }

    // Check if team is still forming or active
    if (membership.team.status !== 'forming' && membership.team.status !== 'active') {
      throw new AppError('Cannot remove members from a completed team', 400);
    }

    // Check if this is the team leader
    if (membership.team.teamLeaderId === membership.studentId) {
      throw new AppError('Cannot remove the team leader. Assign a new leader first or delete the team.', 400);
    }

    await membership.destroy();

    return true;
  },

  /**
   * Submit a team project
   * @param {number} teamId - The team ID
   * @param {Object} submissionData - The submission data
   * @returns {Promise<Object>} - The updated team
   */
  async submitTeamProject(teamId, submissionData) {
    const team = await ProjectTeams.findByPk(teamId, {
      include: [{ model: CollaborativeProjects, as: 'project' }]
    });

    if (!team) {
      throw new AppError('Project team not found', 404);
    }

    // Check if project is active
    if (team.project.status !== 'active') {
      throw new AppError('Cannot submit to a project that is not active', 400);
    }

    // Check if team is active
    if (team.status !== 'active') {
      throw new AppError('Only active teams can submit projects', 400);
    }

    // Check if submission is past due date
    const now = new Date();
    if (team.project.dueDate && now > new Date(team.project.dueDate)) {
      throw new AppError('Project submission deadline has passed', 400);
    }

    // Update team with submission data
    const updateData = {
      submissionStatus: 'submitted',
      submissionDate: now,
      ...submissionData
    };

    await team.update(updateData);

    return this.getTeamById(teamId);
  },

  /**
   * Grade a team submission
   * @param {number} teamId - The team ID
   * @param {Object} gradeData - The grade data
   * @returns {Promise<Object>} - The updated team
   */
  async gradeTeamSubmission(teamId, gradeData) {
    const { grade, feedback, gradedBy } = gradeData;

    const team = await ProjectTeams.findByPk(teamId, {
      include: [{ model: CollaborativeProjects, as: 'project' }]
    });

    if (!team) {
      throw new AppError('Project team not found', 404);
    }

    // Check if team has submitted
    if (team.submissionStatus !== 'submitted') {
      throw new AppError('Cannot grade a team that has not submitted their project', 400);
    }

    // Update team with grade data
    const updateData = {
      submissionStatus: 'graded',
      grade,
      feedback,
      gradedBy,
      gradedAt: new Date()
    };

    await team.update(updateData);

    return this.getTeamById(teamId);
  }
};

module.exports = collaborativeProjectService;
