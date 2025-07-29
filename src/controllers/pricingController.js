const { db } = require("../config/db");
const { Op } = require("sequelize");

/**
 * Get pricing data and FAQs for a specific entity type
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getPricingData = async (req, res, next) => {
  try {
    const { entityType } = req.params;

    // Validate entity type
    if (!["institution", "student", "teacher"].includes(entityType)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid entity type. Must be one of: institution, student, teacher",
      });
    }

    // Get pricing plans with their features
    const pricingPlans = await PricingPlan.scope("withInactive").findAll({
      where: { entityType },
      order: [["priceMonthly", "ASC"]],
      include: [
        {
          association: "features",
          attributes: ["id", "feature", "order"],
          order: [["order", "ASC"]],
        },
      ],
    });

    // Get FAQs for the entity type
    const faqs = await FAQ.scope([
      { method: ["byEntityType", entityType] },
    ]).findAll();

    // Format the response to match the frontend structure
    const response = {
      entityType,
      pricingPlans: pricingPlans.map((plan) => ({
        // id: plan.id,
        name: plan.name,
        price: {
          monthly: parseFloat(plan.priceMonthly),
          annual: parseFloat(plan.priceAnnual),
        },
        description: plan.description,
        features: plan.features.map((f) => f.feature),
        recommended: plan.isRecommended,
        // isActive: plan.isActive,
      })),
      faqs: faqs.map((faq) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        order: faq.order,
        isActive: faq.isActive,
      })),
    };

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error fetching pricing data:", error);
    next(error);
  }
};

/**
 * Get all pricing data and FAQs for all entity types (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getAllPricingData = async (req, res, next) => {
  try {
    // Get all pricing plans with their features
    const pricingPlans = await PricingPlan.scope("withInactive").findAll({
      order: [
        ["entityType", "ASC"],
        ["priceMonthly", "ASC"],
      ],
      include: [
        {
          association: "features",
          attributes: ["id", "feature", "order"],
          order: [["order", "ASC"]],
        },
      ],
    });

    // Get all FAQs
    const faqs = await FAQ.scope("withInactive").findAll({
      order: [
        ["entityType", "ASC"],
        ["order", "ASC"],
      ],
    });

    // Group by entity type
    const result = {
      institution: { pricingPlans: [], faqs: [] },
      student: { pricingPlans: [], faqs: [] },
      teacher: { pricingPlans: [], faqs: [] },
    };

    // Format pricing plans
    pricingPlans.forEach((plan) => {
      result[plan.entityType].pricingPlans.push({
        // id: plan.id,
        name: plan.name,
        price: {
          monthly: parseFloat(plan.priceMonthly),
          annual: parseFloat(plan.priceAnnual),
        },
        description: plan.description,
        features: plan.features.map((f) => f.feature),
        recommended: plan.isRecommended,
        // isActive: plan.isActive,
      });
    });

    // Format FAQs
    faqs.forEach((faq) => {
      result[faq.entityType].faqs.push({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        order: faq.order,
        isActive: faq.isActive,
      });
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching all pricing data:", error);
    next(error);
  }
};

// Export as an object to match the import in routes
const pricingController = {
  getPricingData,
  getAllPricingData,
};

module.exports = { pricingController };
