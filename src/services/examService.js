const { Op, Sequelize } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');

const models = initModels(sequelize);
const {
  Exams,
  ExamQuestions,
  ExamAnswers,
  ExamStudentAssignments,
  ExamQuestionAssignments,
  StudentExamAttempts,
  StudentExamResponses,
  Students,
  Teachers,
  Users,
  Courses,
  Classes
} = models;

const examService = {
  /**
   * Create a new exam
   * @param {Object} examData - The exam data
   * @returns {Promise<Object>} - The created exam
   */
  async createExam(examData) {
    const transaction = await sequelize.transaction();

    try {
      // Create the exam
      const exam = await Exams.create(examData, { transaction });

      await transaction.commit();
      return exam;
    } catch (error) {
      await transaction.rollback();
      throw new AppError(error.message, 400);
    }
  },

  /**
   * Get exam by ID with all related data
   * @param {number} examId - The exam ID
   * @returns {Promise<Object>} - The exam with related data
   */
  async getExamById(examId) {
    const exam = await Exams.findByPk(examId, {
      include: [
        { model: Courses, as: 'course' },
        { model: Classes, as: 'class' },
        { model: Teachers, as: 'teacher', include: [{ model: Users, as: 'user' }] },
        {
          model: ExamQuestions,
          as: 'examQuestions',
          include: [
            { model: ExamAnswers, as: 'examAnswers' }
          ]
        },
        {
          model: ExamStudentAssignments,
          as: 'examStudentAssignments',
          include: [
            { model: Students, as: 'student', include: [{ model: Users, as: 'user' }] },
            { model: Users, as: 'assignedBy' },
            {
              model: ExamQuestionAssignments,
              as: 'examQuestionAssignments',
              include: [
                { model: ExamQuestions, as: 'question' }
              ]
            }
          ]
        }
      ]
    });

    if (!exam) {
      throw new AppError('Exam not found', 404);
    }

    return exam;
  },

  /**
   * Get all exams with basic information
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of exams
   */
  async getAllExams(options = {}) {
    const { teacherId, courseId, classId, isPublished } = options;

    const whereClause = {};

    if (teacherId) {
      whereClause.teacherId = teacherId;
    }

    if (courseId) {
      whereClause.courseId = courseId;
    }

    if (classId) {
      whereClause.classId = classId;
    }

    if (isPublished !== undefined) {
      whereClause.isPublished = isPublished;
    }

    const exams = await Exams.findAll({
      where: whereClause,
      include: [
        { model: Courses, as: 'course' },
        { model: Classes, as: 'class' },
        { model: Teachers, as: 'teacher', include: [{ model: Users, as: 'user' }] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return exams;
  },

  /**
   * Update an exam
   * @param {number} examId - The exam ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated exam
   */
  async updateExam(examId, updateData) {
    const exam = await Exams.findByPk(examId);

    if (!exam) {
      throw new AppError('Exam not found', 404);
    }

    // Check if the exam is already published and trying to modify critical fields
    if (exam.isPublished && updateData.isPublished === false) {
      throw new AppError('Cannot unpublish an already published exam', 400);
    }

    await exam.update(updateData);

    return exam;
  },

  /**
   * Delete an exam
   * @param {number} examId - The exam ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteExam(examId) {
    const transaction = await sequelize.transaction();

    try {
      const exam = await Exams.findByPk(examId, { transaction });

      if (!exam) {
        throw new AppError('Exam not found', 404);
      }

      // Check if the exam has any attempts
      const attempts = await StudentExamAttempts.count({
        where: { examId },
        transaction
      });

      if (attempts > 0) {
        throw new AppError('Cannot delete an exam that has student attempts', 400);
      }

      // Delete all related data
      await ExamStudentAssignments.destroy({
        where: { examId },
        transaction
      });

      // Get all question IDs for this exam
      const questions = await ExamQuestions.findAll({
        where: { examId },
        attributes: ['questionId'],
        transaction
      });

      const questionIds = questions.map(q => q.questionId);

      // Delete all answers for these questions
      if (questionIds.length > 0) {
        await ExamAnswers.destroy({
          where: {
            questionId: {
              [Op.in]: questionIds
            }
          },
          transaction
        });
      }

      // Delete all questions
      await ExamQuestions.destroy({
        where: { examId },
        transaction
      });

      // Finally delete the exam
      await exam.destroy({ transaction });

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * Add a question to an exam
   * @param {number} examId - The exam ID
   * @param {Object} questionData - The question data
   * @returns {Promise<Object>} - The created question
   */
  async addQuestionToExam(examId, questionData) {
    const transaction = await sequelize.transaction();

    try {
      const exam = await Exams.findByPk(examId, { transaction });

      if (!exam) {
        throw new AppError('Exam not found', 404);
      }

      // Create the question
      const question = await ExamQuestions.create({
        ...questionData,
        examId
      }, { transaction });

      // If it's a multiple-choice question, create the answers
      if (questionData.questionType === 'multiple_choice' && questionData.answers && Array.isArray(questionData.answers)) {
        const answerPromises = questionData.answers.map((answer, index) => {
          return ExamAnswers.create({
            questionId: question.questionId,
            answerText: answer.answerText,
            isCorrect: answer.isCorrect || false,
            orderNumber: index
          }, { transaction });
        });

        await Promise.all(answerPromises);
      }

      await transaction.commit();

      // Return the question with its answers
      return this.getQuestionById(question.questionId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * Get a question by ID with its answers
   * @param {number} questionId - The question ID
   * @returns {Promise<Object>} - The question with its answers
   */
  async getQuestionById(questionId) {
    const question = await ExamQuestions.findByPk(questionId, {
      include: [
        { model: ExamAnswers, as: 'examAnswers' }
      ]
    });

    if (!question) {
      throw new AppError('Question not found', 404);
    }

    return question;
  },

  /**
   * Update a question
   * @param {number} questionId - The question ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated question
   */
  async updateQuestion(questionId, updateData) {
    const transaction = await sequelize.transaction();

    try {
      const question = await ExamQuestions.findByPk(questionId, { transaction });

      if (!question) {
        throw new AppError('Question not found', 404);
      }

      // Update the question
      await question.update(updateData, { transaction });

      // If answers are provided and it's a multiple-choice question, update the answers
      if (updateData.answers && Array.isArray(updateData.answers) && question.questionType === 'multiple_choice') {
        // Delete existing answers
        await ExamAnswers.destroy({
          where: { questionId },
          transaction
        });

        // Create new answers
        const answerPromises = updateData.answers.map((answer, index) => {
          return ExamAnswers.create({
            questionId,
            answerText: answer.answerText,
            isCorrect: answer.isCorrect || false,
            orderNumber: index
          }, { transaction });
        });

        await Promise.all(answerPromises);
      }

      await transaction.commit();

      // Return the updated question with its answers
      return this.getQuestionById(questionId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * Delete a question
   * @param {number} questionId - The question ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteQuestion(questionId) {
    const transaction = await sequelize.transaction();

    try {
      const question = await ExamQuestions.findByPk(questionId, { transaction });

      if (!question) {
        throw new AppError('Question not found', 404);
      }

      // Check if the question is used in any student responses
      const responses = await StudentExamResponses.count({
        where: { questionId },
        transaction
      });

      if (responses > 0) {
        throw new AppError('Cannot delete a question that has student responses', 400);
      }

      // Delete all answers for this question
      await ExamAnswers.destroy({
        where: { questionId },
        transaction
      });

      // Delete the question
      await question.destroy({ transaction });

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * Assign an exam to students
   * @param {number} examId - The exam ID
   * @param {Array} studentIds - Array of student IDs
   * @param {number} assignedById - The ID of the user assigning the exam
   * @param {Object} options - Additional options (custom dates, durations, etc.)
   * @returns {Promise<Array>} - The created assignments
   */
  async assignExamToStudents(examId, studentIds, assignedById, options = {}) {
    const transaction = await sequelize.transaction();

    try {
      const exam = await Exams.findByPk(examId, { transaction });

      if (!exam) {
        throw new AppError('Exam not found', 404);
      }

      if (!exam.isPublished) {
        throw new AppError('Cannot assign an unpublished exam', 400);
      }

      // Get all questions for this exam
      const questions = await ExamQuestions.findAll({
        where: { examId },
        transaction
      });

      if (questions.length === 0) {
        throw new AppError('Cannot assign an exam with no questions', 400);
      }

      // Create assignments for each student
      const assignmentPromises = studentIds.map(async (studentId) => {
        // Check if student exists
        const student = await Students.findByPk(studentId, { transaction });

        if (!student) {
          throw new AppError(`Student with ID ${studentId} not found`, 404);
        }

        // Check if assignment already exists
        const existingAssignment = await ExamStudentAssignments.findOne({
          where: {
            examId,
            studentId
          },
          transaction
        });

        if (existingAssignment) {
          throw new AppError(`Student with ID ${studentId} is already assigned to this exam`, 400);
        }

        // Create the assignment
        const assignment = await ExamStudentAssignments.create({
          examId,
          studentId,
          assignedById,
          customStartDate: options.customStartDate,
          customEndDate: options.customEndDate,
          customDuration: options.customDuration
        }, { transaction });

        // If specific questions are provided for this student
        if (options.studentQuestions && options.studentQuestions[studentId]) {
          const studentQuestionIds = options.studentQuestions[studentId];

          // Validate that all question IDs belong to this exam
          const validQuestionIds = questions.map(q => q.questionId);
          const invalidQuestionIds = studentQuestionIds.filter(id => !validQuestionIds.includes(id));

          if (invalidQuestionIds.length > 0) {
            throw new AppError(`Invalid question IDs for student ${studentId}: ${invalidQuestionIds.join(', ')}`, 400);
          }

          // Create question assignments
          const questionAssignmentPromises = studentQuestionIds.map((questionId, index) => {
            return ExamQuestionAssignments.create({
              examStudentAssignmentId: assignment.assignmentId,
              questionId,
              orderNumber: index,
              customPoints: options.customPoints && options.customPoints[studentId] && options.customPoints[studentId][questionId]
                ? options.customPoints[studentId][questionId]
                : null
            }, { transaction });
          });

          await Promise.all(questionAssignmentPromises);
        } else {
          // Assign all questions to the student
          const questionAssignmentPromises = questions.map((question, index) => {
            return ExamQuestionAssignments.create({
              examStudentAssignmentId: assignment.assignmentId,
              questionId: question.questionId,
              orderNumber: index
            }, { transaction });
          });

          await Promise.all(questionAssignmentPromises);
        }

        return assignment;
      });

      const assignments = await Promise.all(assignmentPromises);

      await transaction.commit();
      return assignments;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * Get exams assigned to a student
   * @param {number} studentId - The student ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of assigned exams
   */
  async getStudentAssignedExams(studentId, options = {}) {
    const { status, upcoming, past, current } = options;

    const whereClause = { studentId };

    if (status) {
      whereClause.status = status;
    }

    const now = new Date();

    // Include exams with their details
    const include = [
      {
        model: Exams,
        as: 'exam',
        include: [
          { model: Courses, as: 'course' },
          { model: Classes, as: 'class' },
          { model: Teachers, as: 'teacher', include: [{ model: Users, as: 'user' }] }
        ]
      },
      { model: Users, as: 'assignedBy' }
    ];

    // Get all assignments
    const assignments = await ExamStudentAssignments.findAll({
      where: whereClause,
      include,
      order: [
        [{ model: Exams, as: 'exam' }, 'startDate', 'ASC']
      ]
    });

    // Filter based on time options
    return assignments.filter(assignment => {
      const startDate = assignment.customStartDate || assignment.exam.startDate;
      const endDate = assignment.customEndDate || assignment.exam.endDate;

      if (upcoming && startDate > now) {
        return true;
      }

      if (past && endDate < now) {
        return true;
      }

      if (current && startDate <= now && endDate >= now) {
        return true;
      }

      // If no time filter is specified, return all
      return !upcoming && !past && !current;
    });
  },

  /**
   * Start an exam attempt for a student
   * @param {number} assignmentId - The assignment ID
   * @param {number} studentId - The student ID
   * @param {Object} metadata - Additional metadata (IP, user agent, etc.)
   * @returns {Promise<Object>} - The created attempt
   */
  async startExamAttempt(assignmentId, studentId, metadata = {}) {
    const transaction = await sequelize.transaction();

    try {
      // Get the assignment
      const assignment = await ExamStudentAssignments.findOne({
        where: {
          assignmentId,
          studentId
        },
        include: [
          { model: Exams, as: 'exam' },
          {
            model: ExamQuestionAssignments,
            as: 'examQuestionAssignments',
            include: [
              {
                model: ExamQuestions,
                as: 'question',
                include: [
                  { model: ExamAnswers, as: 'examAnswers' }
                ]
              }
            ]
          }
        ],
        transaction
      });

      if (!assignment) {
        throw new AppError('Exam assignment not found', 404);
      }

      // Check if the exam is currently available
      const now = new Date();
      const startDate = assignment.customStartDate || assignment.exam.startDate;
      const endDate = assignment.customEndDate || assignment.exam.endDate;

      if (now < startDate) {
        throw new AppError('Exam has not started yet', 400);
      }

      if (now > endDate) {
        throw new AppError('Exam has already ended', 400);
      }

      // Check if there's an existing incomplete attempt
      const existingAttempt = await StudentExamAttempts.findOne({
        where: {
          assignmentId,
          studentId,
          status: 'in_progress'
        },
        transaction
      });

      if (existingAttempt) {
        // Return the existing attempt
        await transaction.commit();
        return existingAttempt;
      }

      // Calculate max score
      const maxScore = assignment.examQuestionAssignments.reduce((total, qa) => {
        return total + (qa.customPoints || qa.question.points);
      }, 0);

      // Create a new attempt
      const attempt = await StudentExamAttempts.create({
        assignmentId,
        studentId,
        examId: assignment.examId,
        maxScore,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent
      }, { transaction });

      // Update assignment status
      await assignment.update({
        status: 'started'
      }, { transaction });

      await transaction.commit();
      return attempt;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * Submit a response for an exam question
   * @param {number} attemptId - The attempt ID
   * @param {number} questionId - The question ID
   * @param {Object} responseData - The response data
   * @returns {Promise<Object>} - The created response
   */
  async submitExamResponse(attemptId, questionId, responseData) {
    const transaction = await sequelize.transaction();

    try {
      // Get the attempt
      const attempt = await StudentExamAttempts.findOne({
        where: {
          attemptId,
          status: 'in_progress'
        },
        include: [
          {
            model: ExamStudentAssignments,
            as: 'assignment',
            include: [
              { model: Exams, as: 'exam' },
              {
                model: ExamQuestionAssignments,
                as: 'examQuestionAssignments',
                where: { questionId },
                required: false
              }
            ]
          }
        ],
        transaction
      });

      if (!attempt) {
        throw new AppError('Active exam attempt not found', 404);
      }

      // Check if the question belongs to this exam
      const question = await ExamQuestions.findOne({
        where: {
          questionId,
          examId: attempt.examId
        },
        include: [
          { model: ExamAnswers, as: 'examAnswers' }
        ],
        transaction
      });

      if (!question) {
        throw new AppError('Question not found in this exam', 404);
      }

      // Check if there's an existing response for this question
      const existingResponse = await StudentExamResponses.findOne({
        where: {
          attemptId,
          questionId
        },
        transaction
      });

      // Get the question assignment to check for custom points
      const questionAssignment = attempt.assignment.examQuestionAssignments.find(
        qa => qa.questionId === questionId
      );

      const maxScore = questionAssignment ?
        (questionAssignment.customPoints || question.points) :
        question.points;

      // Determine if the response is correct and calculate score
      let isCorrect = false;
      let scoreAwarded = 0;

      if (question.questionType === 'multiple_choice') {
        // For multiple choice, check if the chosen answer is correct
        if (responseData.chosenAnswerId) {
          const chosenAnswer = question.examAnswers.find(
            a => a.answerId === responseData.chosenAnswerId
          );

          if (chosenAnswer) {
            isCorrect = chosenAnswer.isCorrect;
            scoreAwarded = isCorrect ? maxScore : 0;
          }
        }
      } else if (question.questionType === 'short_answer' || question.questionType === 'fill_in_blank') {
        // For text responses, we'll need manual grading or exact match
        if (responseData.textResponse && question.correctAnswer) {
          let studentAnswer = responseData.textResponse;
          let correctAnswer = question.correctAnswer;

          // Apply case sensitivity setting
          if (!question.caseSensitive) {
            studentAnswer = studentAnswer.toLowerCase();
            correctAnswer = correctAnswer.toLowerCase();
          }

          // Check for exact or partial match
          if (question.allowPartialMatch) {
            isCorrect = studentAnswer.includes(correctAnswer) || correctAnswer.includes(studentAnswer);
            // Partial credit for partial match
            scoreAwarded = isCorrect ? maxScore : 0;
          } else {
            isCorrect = studentAnswer === correctAnswer;
            scoreAwarded = isCorrect ? maxScore : 0;
          }
        }
      }

      // Create or update the response
      let response;

      if (existingResponse) {
        response = await existingResponse.update({
          chosenAnswerId: responseData.chosenAnswerId,
          textResponse: responseData.textResponse,
          isCorrect,
          scoreAwarded,
          maxScore,
          respondedAt: new Date()
        }, { transaction });
      } else {
        response = await StudentExamResponses.create({
          attemptId,
          questionId,
          chosenAnswerId: responseData.chosenAnswerId,
          textResponse: responseData.textResponse,
          isCorrect,
          scoreAwarded,
          maxScore,
          respondedAt: new Date()
        }, { transaction });
      }

      await transaction.commit();
      return response;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * Complete an exam attempt
   * @param {number} attemptId - The attempt ID
   * @returns {Promise<Object>} - The completed attempt with results
   */
  async completeExamAttempt(attemptId) {
    const transaction = await sequelize.transaction();

    try {
      // Get the attempt with all responses
      const attempt = await StudentExamAttempts.findOne({
        where: {
          attemptId,
          status: 'in_progress'
        },
        include: [
          {
            model: StudentExamResponses,
            as: 'studentExamResponses'
          },
          {
            model: ExamStudentAssignments,
            as: 'assignment',
            include: [
              { model: Exams, as: 'exam' }
            ]
          }
        ],
        transaction
      });

      if (!attempt) {
        throw new AppError('Active exam attempt not found', 404);
      }

      // Calculate the score
      const totalScore = attempt.studentExamResponses.reduce(
        (sum, response) => sum + (response.scoreAwarded || 0),
        0
      );

      const percentage = (totalScore / attempt.maxScore) * 100;
      const passed = percentage >= attempt.assignment.exam.passingPercentage;

      // Update the attempt
      await attempt.update({
        status: 'completed',
        completedAt: new Date(),
        score: totalScore,
        percentage,
        passed
      }, { transaction });

      // Update the assignment status
      await attempt.assignment.update({
        status: 'completed'
      }, { transaction });

      await transaction.commit();

      // Return the completed attempt with all details
      return StudentExamAttempts.findByPk(attemptId, {
        include: [
          {
            model: StudentExamResponses,
            as: 'studentExamResponses',
            include: [
              {
                model: ExamQuestions,
                as: 'question',
                include: [
                  { model: ExamAnswers, as: 'examAnswers' }
                ]
              }
            ]
          },
          {
            model: ExamStudentAssignments,
            as: 'assignment',
            include: [
              { model: Exams, as: 'exam' }
            ]
          }
        ]
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};

module.exports = examService;
